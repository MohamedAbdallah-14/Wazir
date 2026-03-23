import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runPruneCommand } from '../../src/commands/prune.js';

describe('wazir prune command', () => {
  let tmpDir, projectRoot;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-prune-test-'));
    projectRoot = tmpDir;
    fs.mkdirSync(path.join(projectRoot, '.wazir', 'runs'), { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
  });

  it('lists runs without deletion', () => {
    const runsDir = path.join(projectRoot, '.wazir', 'runs');
    fs.mkdirSync(path.join(runsDir, 'run-20260320-120000'), { recursive: true });
    const result = runPruneCommand({ args: [] }, { cwd: projectRoot });
    assert.strictEqual(result.exitCode, 0);
    assert(result.stdout.includes('run-20260320'));
  });

  it('shows help with --help', () => {
    const result = runPruneCommand({ args: ['--help'] }, { cwd: projectRoot });
    assert.strictEqual(result.exitCode, 0);
    assert(result.stdout.toLowerCase().includes('usage'));
  });

  it('deletes runs with --keep and --force', () => {
    const runsDir = path.join(projectRoot, '.wazir', 'runs');
    fs.mkdirSync(path.join(runsDir, 'run-20260320-120000'), { recursive: true });
    fs.mkdirSync(path.join(runsDir, 'run-20260324-010000'), { recursive: true });

    const result = runPruneCommand({ args: ['--keep', '1', '--force'] }, { cwd: projectRoot });
    assert.strictEqual(result.exitCode, 0);
    assert(result.stdout.includes('Deleted'));

    const remaining = fs.readdirSync(runsDir).filter(f => f.startsWith('run-'));
    assert.strictEqual(remaining.length, 1);
  });

  it('outputs JSON with --json', () => {
    const result = runPruneCommand({ args: ['--json'] }, { cwd: projectRoot });
    assert.strictEqual(result.exitCode, 0);
    const json = JSON.parse(result.stdout);
    assert(json.runs_total !== undefined);
    assert(json.deleted_runs !== undefined);
  });

  it('skips deletion without --force', () => {
    const runsDir = path.join(projectRoot, '.wazir', 'runs');
    fs.mkdirSync(path.join(runsDir, 'run-20260320-120000'), { recursive: true });
    fs.mkdirSync(path.join(runsDir, 'run-20260324-010000'), { recursive: true });

    const result = runPruneCommand({ args: ['--keep', '0'] }, { cwd: projectRoot });
    assert.strictEqual(result.exitCode, 0);

    const remaining = fs.readdirSync(runsDir).filter(f => f.startsWith('run-'));
    assert.strictEqual(remaining.length, 2);
  });

  it('protects latest symlink target', () => {
    const runsDir = path.join(projectRoot, '.wazir', 'runs');
    fs.mkdirSync(path.join(runsDir, 'run-20260320-120000'), { recursive: true });
    fs.mkdirSync(path.join(runsDir, 'run-20260324-010000'), { recursive: true });
    fs.symlinkSync('run-20260320-120000', path.join(runsDir, 'latest'));

    const result = runPruneCommand({ args: ['--keep', '1', '--force'] }, { cwd: projectRoot });
    assert.strictEqual(result.exitCode, 0);

    // Both should remain: the new one and the protected old one
    const remaining = fs.readdirSync(runsDir).filter(f => f.startsWith('run-'));
    assert.strictEqual(remaining.length, 2);
  });
});
