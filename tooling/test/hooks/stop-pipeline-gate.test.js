import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let evaluateStopGate;

function makePhasesDir(content = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-stop-'));
  const phasesDir = path.join(tmpDir, 'phases');
  fs.mkdirSync(phasesDir, { recursive: true });
  for (const [file, text] of Object.entries(content)) {
    fs.writeFileSync(path.join(phasesDir, file), text);
  }
  return tmpDir;
}

describe('stop-pipeline-gate', () => {
  test('setup: import', async () => {
    const mod = await import('../../src/hooks/stop-pipeline-gate.js');
    evaluateStopGate = mod.evaluateStopGate;
    assert.ok(evaluateStopGate);
  });

  test('completion signal + unchecked items → block', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({
      'clarifier.md': '## Phase: clarifier — ACTIVE\n- [ ] step 1\n- [ ] step 2\n',
    });
    const result = evaluateStopGate(runDir, 'all done, task complete');
    assert.strictEqual(result.decision, 'block');
    assert.ok(result.reason.includes('unchecked'));
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  test('non-completion message + unchecked items → approve', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({
      'clarifier.md': '## Phase: clarifier — ACTIVE\n- [ ] step 1\n',
    });
    const result = evaluateStopGate(runDir, 'Here is the research summary so far');
    assert.strictEqual(result.decision, 'approve');
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  test('completion signal + all items checked → approve', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({
      'init.md': '## Phase: init — ACTIVE\n- [x] done\n- [x] all done\n',
    });
    const result = evaluateStopGate(runDir, 'task complete');
    assert.strictEqual(result.decision, 'approve');
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  test('no run directory → approve', async () => {
    if (!evaluateStopGate) return;
    const result = evaluateStopGate('/nonexistent/path', 'task complete');
    assert.strictEqual(result.decision, 'approve');
  });

  test('phases dir exists but no ACTIVE header → approve (prevents deadlock KI-003)', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({ 'garbage.md': 'not a phase file with no active header' });
    const result = evaluateStopGate(runDir, 'task complete');
    assert.strictEqual(result.decision, 'approve', 'Must approve when no ACTIVE phase — blocking causes deadlock (KI-003)');
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  test('multiple ACTIVE phases → auto-repair: pick latest, block on unchecked items', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({
      'init.md': '## Phase: init — ACTIVE\n- [x] done\n',
      'executor.md': '## Phase: executor — ACTIVE\n- [ ] step\n',
    });
    const result = evaluateStopGate(runDir, 'task complete');
    assert.strictEqual(result.decision, 'block');
    assert.ok(!result.reason.includes('malformed'), 'Should not mention malformed after auto-repair');
    assert.ok(result.reason.includes('executor') || result.reason.includes('unchecked'));
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  test('multiple ACTIVE phases all checked → approve', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({
      'init.md': '## Phase: init — ACTIVE\n- [x] done\n',
      'executor.md': '## Phase: executor — ACTIVE\n- [x] done\n',
    });
    const result = evaluateStopGate(runDir, 'task complete');
    assert.strictEqual(result.decision, 'approve', 'All items checked in auto-repaired latest phase → approve');
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  test('completion-signal allowlist matches case-insensitively', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({
      'executor.md': '## Phase: executor — ACTIVE\n- [ ] step\n',
    });

    const signals = ['TASK COMPLETE', 'All Done', 'Ready to Commit', 'Work Is Finished',
      'implementation complete', 'shall I create a PR', 'that covers everything',
      'pipeline complete', 'run complete', 'everything is done'];

    for (const signal of signals) {
      // Reset loop guard counter before each signal test
      const countPath = path.join(runDir, 'phases', '.stop-block-count');
      try { fs.unlinkSync(countPath); } catch { /* ok */ }

      const result = evaluateStopGate(runDir, signal);
      assert.strictEqual(result.decision, 'block', `Signal "${signal}" should trigger block`);
    }
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  test('normal conversation messages do not trigger block', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({
      'executor.md': '## Phase: executor — ACTIVE\n- [ ] step\n',
    });

    const normals = [
      'Here is the updated code',
      'I found 3 issues in the review',
      'Phase transition complete. Run /compact',
      'Let me check the test results',
      'What do you think about this approach?',
    ];

    for (const msg of normals) {
      const result = evaluateStopGate(runDir, msg);
      assert.strictEqual(result.decision, 'approve', `Normal message "${msg}" should NOT block`);
    }
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  test('loop guard: 3 consecutive blocks then 4th approved', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({
      'executor.md': '## Phase: executor — ACTIVE\n- [ ] step\n',
    });

    // First 3 blocks
    for (let i = 0; i < 3; i++) {
      const result = evaluateStopGate(runDir, 'task complete');
      assert.strictEqual(result.decision, 'block', `Block ${i + 1} should block`);
    }

    // 4th should approve (loop guard)
    const result = evaluateStopGate(runDir, 'task complete');
    assert.strictEqual(result.decision, 'approve', '4th consecutive block should be approved (loop guard)');
    assert.ok(result.reason.includes('Loop guard'));

    // After reset, should block again
    const afterReset = evaluateStopGate(runDir, 'task complete');
    assert.strictEqual(afterReset.decision, 'block', 'After loop guard reset, should block again');

    fs.rmSync(runDir, { recursive: true, force: true });
  });

  test('blocks when skill scope has unchecked items even if pipeline phase is complete', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({
      'executor.md': '## Phase: executor — ACTIVE\n- [x] all done\n',
    });

    // Create skill scope with unchecked items
    const skillPhasesDir = path.join(runDir, 'skills', 'sa-001', 'phases');
    fs.mkdirSync(skillPhasesDir, { recursive: true });
    fs.writeFileSync(path.join(skillPhasesDir, '01-validate.md'), '## Phase: validate — ACTIVE\n- [ ] Run validators\n');

    // Write scope-stack.yaml
    const stackYaml = `stack:\n  - type: pipeline\n    phases_dir: ${JSON.stringify(path.join(runDir, 'phases'))}\n  - type: skill\n    skill: self-audit\n    invocation_id: sa-001\n    phases_dir: ${JSON.stringify(skillPhasesDir)}\n`;
    fs.writeFileSync(path.join(runDir, 'scope-stack.yaml'), stackYaml);

    const result = evaluateStopGate(runDir, 'task complete');
    assert.strictEqual(result.decision, 'block', 'Should block: skill scope has unchecked items');
    assert.ok(result.reason.includes('skill') || result.reason.includes('validate'), 'Reason should mention skill');
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  test('loop guard counter resets on approve', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({
      'executor.md': '## Phase: executor — ACTIVE\n- [ ] step\n',
    });

    // 2 blocks
    evaluateStopGate(runDir, 'task complete');
    evaluateStopGate(runDir, 'task complete');

    // 1 approve (normal message — resets counter)
    evaluateStopGate(runDir, 'Here is a progress update');

    // Next block should be counted from 0 again
    const result = evaluateStopGate(runDir, 'task complete');
    assert.strictEqual(result.decision, 'block', 'Counter should have reset after approve');

    fs.rmSync(runDir, { recursive: true, force: true });
  });
});
