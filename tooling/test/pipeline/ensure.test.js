import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let ensureRun;

describe('wazir capture ensure', () => {
  let tmpDir;
  let stateRoot;
  let projectRoot;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-ensure-'));
    stateRoot = path.join(tmpDir, 'state');
    projectRoot = path.join(tmpDir, 'project');
    fs.mkdirSync(path.join(stateRoot, 'runs'), { recursive: true });
    fs.mkdirSync(path.join(projectRoot, '.wazir', 'runs'), { recursive: true });
    fs.mkdirSync(path.join(projectRoot, '.wazir', 'state'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('setup: import', async () => {
    const mod = await import('../../src/pipeline/ensure.js');
    ensureRun = mod.ensureRun;
    assert.ok(typeof ensureRun === 'function');
  });

  test('creates new run when no latest exists', () => {
    const result = ensureRun(projectRoot, stateRoot);
    assert.strictEqual(result.created, true);
    assert.ok(result.runId.startsWith('run-'));
    // Phase files created in project root
    const phasesDir = path.join(projectRoot, '.wazir', 'runs', result.runId, 'phases');
    assert.ok(fs.existsSync(phasesDir));
    assert.ok(fs.existsSync(path.join(phasesDir, 'init.md')));
    // Pipeline-active marker created
    assert.ok(fs.existsSync(path.join(projectRoot, '.wazir', 'state', 'pipeline-active')));
    // Latest pointer created in project root
    const latest = fs.readFileSync(path.join(projectRoot, '.wazir', 'runs', 'latest'), 'utf8').trim();
    assert.strictEqual(latest, result.runId);
  });

  test('resumes existing incomplete run', () => {
    // Create an existing run with an ACTIVE phase
    const runId = 'run-20260323-120000';
    const phasesDir = path.join(projectRoot, '.wazir', 'runs', runId, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });
    fs.writeFileSync(path.join(phasesDir, 'init.md'), '## Phase: init — COMPLETED\n- [x] Done\n');
    fs.writeFileSync(path.join(phasesDir, 'clarifier.md'), '## Phase: clarifier — ACTIVE\n- [ ] Step 1\n');
    fs.writeFileSync(path.join(projectRoot, '.wazir', 'runs', 'latest'), runId);

    const result = ensureRun(projectRoot, stateRoot);
    assert.strictEqual(result.created, false);
    assert.strictEqual(result.runId, runId);
    assert.strictEqual(result.resumed, true);
    // Pipeline-active marker set
    assert.ok(fs.existsSync(path.join(projectRoot, '.wazir', 'state', 'pipeline-active')));
  });

  test('creates new run when latest points to completed run', () => {
    // Create a completed run (no ACTIVE phases)
    const oldId = 'run-20260323-100000';
    const phasesDir = path.join(projectRoot, '.wazir', 'runs', oldId, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });
    fs.writeFileSync(path.join(phasesDir, 'init.md'), '## Phase: init — COMPLETED\n- [x] Done\n');
    fs.writeFileSync(path.join(phasesDir, 'final_review.md'), '## Phase: final_review — COMPLETED\n- [x] Done\n');
    fs.writeFileSync(path.join(projectRoot, '.wazir', 'runs', 'latest'), oldId);

    const result = ensureRun(projectRoot, stateRoot);
    assert.strictEqual(result.created, true);
    assert.notStrictEqual(result.runId, oldId);
  });

  test('is idempotent — calling twice returns same run', () => {
    const result1 = ensureRun(projectRoot, stateRoot);
    const result2 = ensureRun(projectRoot, stateRoot);
    assert.strictEqual(result1.runId, result2.runId);
    assert.strictEqual(result2.created, false);
    assert.strictEqual(result2.resumed, true);
  });
});
