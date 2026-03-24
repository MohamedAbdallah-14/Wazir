import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let evaluateBootstrapGate;

describe('bootstrap-gate', () => {
  test('setup: import', async () => {
    const mod = await import('../../src/hooks/bootstrap-gate.js');
    evaluateBootstrapGate = mod.evaluateBootstrapGate;
    assert.ok(typeof evaluateBootstrapGate === 'function');
  });

  test('allows when no pipeline-active marker', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Write' }).decision, 'allow');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('allows when marker + run exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      fs.mkdirSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases', 'init.md'), '## Phase: init — ACTIVE\n');
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'latest'), 'test-run');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Write' }).decision, 'allow');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('allows when marker + run exists via repo-local latest symlink', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      fs.mkdirSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases', 'init.md'), '## Phase: init — ACTIVE\n');
      fs.symlinkSync('test-run', path.join(tmp, '.wazir', 'runs', 'latest'));
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Write' }).decision, 'allow');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('blocks Write when marker but no run', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      const r = evaluateBootstrapGate(tmp, { tool: 'Write' });
      assert.strictEqual(r.decision, 'deny');
      assert.ok(r.reason.includes('wazir capture ensure'));
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  // Phase-aware blocking tests
  test('blocks Write to source file during clarifier phase', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      fs.mkdirSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases', 'clarifier.md'), '## Phase: clarifier — ACTIVE\n- [ ] Step 1\n');
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'latest'), 'test-run');
      const r = evaluateBootstrapGate(tmp, { tool: 'Write', filePath: 'src/index.js' });
      assert.strictEqual(r.decision, 'deny');
      assert.ok(r.reason.includes('clarifier'));
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('allows Write to .wazir/ during clarifier phase', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      fs.mkdirSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases', 'clarifier.md'), '## Phase: clarifier — ACTIVE\n- [ ] Step 1\n');
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'latest'), 'test-run');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Write', filePath: '.wazir/runs/test/spec.md' }).decision, 'allow');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Write', filePath: 'docs/plan.md' }).decision, 'allow');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('allows Write to source file during executor phase', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      fs.mkdirSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases', 'executor.md'), '## Phase: executor — ACTIVE\n- [ ] Implement\n');
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'latest'), 'test-run');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Write', filePath: 'src/index.js' }).decision, 'allow');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('blocks Write to source file during final_review phase', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      fs.mkdirSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases', 'final_review.md'), '## Phase: final_review — ACTIVE\n- [ ] Review\n');
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'latest'), 'test-run');
      const r = evaluateBootstrapGate(tmp, { tool: 'Write', filePath: 'tooling/src/foo.js' });
      assert.strictEqual(r.decision, 'deny');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  // Scope-aware tests
  test('blocks Write during executor when skill scope has deny policy', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      const runDir = path.join(tmp, '.wazir', 'runs', 'test-run');
      fs.mkdirSync(path.join(runDir, 'phases'), { recursive: true });
      fs.writeFileSync(path.join(runDir, 'phases', 'executor.md'), '## Phase: executor — ACTIVE\n- [ ] Implement\n');
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'latest'), 'test-run');

      // Create skill scope with deny policy
      const skillPhasesDir = path.join(runDir, 'skills', 'sa-001', 'phases');
      fs.mkdirSync(skillPhasesDir, { recursive: true });
      fs.writeFileSync(path.join(skillPhasesDir, '01-validate.md'), '## Phase: validate — ACTIVE\nsource_write_policy: deny\n- [ ] Run validators\n');

      // Write scope-stack.yaml manually
      const stackYaml = `stack:\n  - type: pipeline\n    phases_dir: ${JSON.stringify(path.join(runDir, 'phases'))}\n  - type: skill\n    skill: self-audit\n    invocation_id: sa-001\n    phases_dir: ${JSON.stringify(skillPhasesDir)}\n`;
      fs.writeFileSync(path.join(runDir, 'scope-stack.yaml'), stackYaml);

      const r = evaluateBootstrapGate(tmp, { tool: 'Write', filePath: 'src/index.js' });
      assert.strictEqual(r.decision, 'deny', 'Should deny: skill validate phase has deny policy');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('allows Write during executor when skill scope has allow policy', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      const runDir = path.join(tmp, '.wazir', 'runs', 'test-run');
      fs.mkdirSync(path.join(runDir, 'phases'), { recursive: true });
      fs.writeFileSync(path.join(runDir, 'phases', 'executor.md'), '## Phase: executor — ACTIVE\n- [ ] Implement\n');
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'latest'), 'test-run');

      // Create skill scope with allow policy (fix phase)
      const skillPhasesDir = path.join(runDir, 'skills', 'sa-001', 'phases');
      fs.mkdirSync(skillPhasesDir, { recursive: true });
      fs.writeFileSync(path.join(skillPhasesDir, '03-fix.md'), '## Phase: fix — ACTIVE\nsource_write_policy: allow\n- [ ] Apply fixes\n');

      const stackYaml = `stack:\n  - type: pipeline\n    phases_dir: ${JSON.stringify(path.join(runDir, 'phases'))}\n  - type: skill\n    skill: self-audit\n    invocation_id: sa-001\n    phases_dir: ${JSON.stringify(skillPhasesDir)}\n`;
      fs.writeFileSync(path.join(runDir, 'scope-stack.yaml'), stackYaml);

      const r = evaluateBootstrapGate(tmp, { tool: 'Write', filePath: 'src/index.js' });
      assert.strictEqual(r.decision, 'allow', 'Should allow: both executor and fix phase allow writes');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('allows Write to .wazir/ path even when no run exists (KI-001)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      // No run exists — normally would deny
      const r1 = evaluateBootstrapGate(tmp, { tool: 'Write', filePath: '.wazir/runs/latest/clarified/spec.md' });
      assert.strictEqual(r1.decision, 'allow', '.wazir/ paths must bypass bootstrap gate (KI-001)');
      const r2 = evaluateBootstrapGate(tmp, { tool: 'Edit', filePath: path.join(tmp, '.wazir', 'runs', 'test', 'spec.md') });
      assert.strictEqual(r2.decision, 'allow', 'Absolute .wazir/ paths must also bypass');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('allows git add and git commit through gate', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Bash', command: 'git add tooling/src/foo.js' }).decision, 'allow');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Bash', command: 'git commit -m "fix"' }).decision, 'allow');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('blocks Write to phase files in any phase (KI-002)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      fs.mkdirSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases', 'executor.md'), '## Phase: executor — ACTIVE\n- [ ] step\n');
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'latest'), 'test-run');

      // Write to phase file should be blocked even during executor
      const r1 = evaluateBootstrapGate(tmp, { tool: 'Write', filePath: '.wazir/runs/test-run/phases/executor.md' });
      assert.strictEqual(r1.decision, 'deny', 'Phase file writes must be blocked (KI-002)');
      assert.ok(r1.reason.includes('phase file'), 'Reason should mention phase files');

      // Edit to phase file should also be blocked
      const r2 = evaluateBootstrapGate(tmp, { tool: 'Edit', filePath: path.join(tmp, '.wazir', 'runs', 'test-run', 'phases', 'init.md') });
      assert.strictEqual(r2.decision, 'deny', 'Phase file edits must be blocked (KI-002)');

      // Write to other .wazir/ paths should still be allowed
      const r3 = evaluateBootstrapGate(tmp, { tool: 'Write', filePath: '.wazir/runs/test-run/clarified/spec.md' });
      assert.strictEqual(r3.decision, 'allow', 'Non-phase .wazir/ paths should be allowed');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('allows wazir commands through gate', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Bash', command: 'wazir capture ensure' }).decision, 'allow');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Bash', command: 'git branch' }).decision, 'allow');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Read' }).decision, 'allow');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });
});
