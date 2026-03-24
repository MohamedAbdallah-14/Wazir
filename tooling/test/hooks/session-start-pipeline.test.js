import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const HOOK_PATH = path.join(ROOT, 'hooks', 'session-start');

function runSessionStart(env = {}) {
  const result = spawnSync(HOOK_PATH, [], {
    encoding: 'utf8',
    cwd: ROOT,
    env: { ...process.env, ...env },
    timeout: 60000,
  });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

describe('session-start pipeline injection', () => {
  let tmpRunDir;

  beforeEach(() => {
    // Create a temporary run with phase files in the real project
    const runId = `run-test-${Date.now()}`;
    tmpRunDir = path.join(ROOT, '.wazir', 'runs', runId);
    const phasesDir = path.join(tmpRunDir, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });

    fs.writeFileSync(path.join(phasesDir, 'init.md'), '## Phase: init — COMPLETED\n- [x] done\n');
    fs.writeFileSync(path.join(phasesDir, 'clarifier.md'),
      '## Phase: clarifier — ACTIVE\n- [x] Read briefing\n- [ ] Run clarifier\n- [ ] Get approval\n');
    fs.writeFileSync(path.join(phasesDir, 'executor.md'), '## Phase: executor — NOT ACTIVE\n- [ ] step\n');
    fs.writeFileSync(path.join(phasesDir, 'final_review.md'), '## Phase: final_review — NOT ACTIVE\n- [ ] step\n');

    // Point latest to this run
    const latestPath = path.join(ROOT, '.wazir', 'runs', 'latest');
    try { fs.unlinkSync(latestPath); } catch { /* ok */ }
    fs.symlinkSync(runId, latestPath);
  });

  afterEach(() => {
    fs.rmSync(tmpRunDir, { recursive: true, force: true });
    // Restore latest symlink to avoid polluting other tests
    const latestPath = path.join(ROOT, '.wazir', 'runs', 'latest');
    try { fs.unlinkSync(latestPath); } catch { /* ok */ }
  });

  test('injects PIPELINE STATUS when active run exists', () => {
    const result = runSessionStart();
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.stdout.includes('PIPELINE STATUS'), `Expected PIPELINE STATUS in output. Got:\n${result.stdout.slice(0, 500)}`);
    assert.ok(result.stdout.includes('clarifier — ACTIVE'), 'Should show active phase');
    assert.ok(result.stdout.includes('CURRENT:'), 'Should show current step');
  });

  test('includes COMPLETED count for checked items', () => {
    const result = runSessionStart();
    assert.ok(result.stdout.includes('COMPLETED:'), 'Should include COMPLETED summary');
  });

  test('includes skill scope breadcrumb when skill is active', () => {
    // Add skill scope to the run
    const phasesDir = path.join(tmpRunDir, 'phases');
    // Switch to executor phase (skill scopes are used during execution)
    fs.writeFileSync(path.join(phasesDir, 'clarifier.md'), '## Phase: clarifier — COMPLETED\n- [x] done\n');
    fs.writeFileSync(path.join(phasesDir, 'executor.md'), '## Phase: executor — ACTIVE\n- [ ] implement\n');

    // Create skill scope
    const skillPhasesDir = path.join(tmpRunDir, 'skills', 'sa-001', 'phases');
    fs.mkdirSync(skillPhasesDir, { recursive: true });
    fs.writeFileSync(path.join(skillPhasesDir, '01-validate.md'), '## Phase: validate — ACTIVE\nsource_write_policy: deny\n- [ ] Run validators\n- [ ] Capture results\n');

    const stackYaml = `stack:\n  - type: pipeline\n    phases_dir: "${phasesDir}"\n  - type: skill\n    skill: self-audit\n    invocation_id: sa-001\n    phases_dir: "${skillPhasesDir}"\n`;
    fs.writeFileSync(path.join(tmpRunDir, 'scope-stack.yaml'), stackYaml);

    const result = runSessionStart();
    assert.strictEqual(result.exitCode, 0);
    assert.ok(result.stdout.includes('self-audit'), `Should include skill name. Got:\n${result.stdout.slice(0, 800)}`);
    assert.ok(result.stdout.includes('validate'), 'Should include skill phase name');
  });

  test('still outputs skill bootstrap and CLI guidance', () => {
    const result = runSessionStart();
    assert.ok(result.stdout.includes('EXTREMELY_IMPORTANT') || result.stdout.includes('using-skills'),
      'Should still output skill bootstrap');
    assert.ok(result.stdout.includes('cli-bootstrap-guidance'), 'Should still output CLI bootstrap');
  });
});
