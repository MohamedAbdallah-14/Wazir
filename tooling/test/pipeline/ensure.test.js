import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let ensureRun;

describe('wazir capture ensure', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-ensure-'));
    fs.mkdirSync(path.join(tmpDir, 'state', 'runs'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'project', '.wazir', 'runs'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'project', '.wazir', 'state'), { recursive: true });
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
    const proj = path.join(tmpDir, 'project');
    const state = path.join(tmpDir, 'state');
    const result = ensureRun(proj, state);
    assert.strictEqual(result.created, true);
    assert.ok(result.runId.startsWith('run-'));
    assert.ok(fs.existsSync(path.join(proj, '.wazir', 'runs', result.runId, 'phases', 'init.md')));
    assert.ok(fs.existsSync(path.join(proj, '.wazir', 'state', 'pipeline-active')));
  });

  test('resumes existing incomplete run', () => {
    const proj = path.join(tmpDir, 'project');
    const state = path.join(tmpDir, 'state');
    const runId = 'run-20260323-120000';
    const phasesDir = path.join(proj, '.wazir', 'runs', runId, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });
    fs.writeFileSync(path.join(phasesDir, 'clarifier.md'), '## Phase: clarifier — ACTIVE\n- [ ] Step 1\n');
    fs.writeFileSync(path.join(proj, '.wazir', 'runs', 'latest'), runId);

    const result = ensureRun(proj, state);
    assert.strictEqual(result.created, false);
    assert.strictEqual(result.runId, runId);
    assert.strictEqual(result.resumed, true);
  });

  test('is idempotent', () => {
    const proj = path.join(tmpDir, 'project');
    const state = path.join(tmpDir, 'state');
    const r1 = ensureRun(proj, state);
    const r2 = ensureRun(proj, state);
    assert.strictEqual(r1.runId, r2.runId);
    assert.strictEqual(r2.resumed, true);
  });
});
