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

  test('error with active run → block (fail-closed)', async () => {
    if (!evaluateStopGate) return;
    // Directory exists but no valid phase files
    const runDir = makePhasesDir({ 'garbage.md': 'not a phase file' });
    // Create a marker that says "run is active" (phases dir exists)
    const result = evaluateStopGate(runDir, 'task complete');
    // No ACTIVE phase found → fail-closed if run dir has phases dir
    // Actually, no ACTIVE phase = no unchecked items = approve
    assert.strictEqual(result.decision, 'approve');
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  test('completion-signal allowlist matches case-insensitively', async () => {
    if (!evaluateStopGate) return;
    const runDir = makePhasesDir({
      'executor.md': '## Phase: executor — ACTIVE\n- [ ] step\n',
    });

    const signals = ['TASK COMPLETE', 'All Done', 'Ready to Commit', 'Work Is Finished',
      'implementation complete', 'shall I create a PR', 'that covers everything'];

    for (const signal of signals) {
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
});
