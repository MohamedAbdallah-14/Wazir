import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runPruneCommand } from '../../src/commands/prune.js';

describe('wazir prune command', () => {
  let tmpDir;
  let projectRoot;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-prune-test-'));
    projectRoot = tmpDir;

    // Create basic .wazir/runs structure
    const runsDir = path.join(projectRoot, '.wazir', 'runs');
    fs.mkdirSync(runsDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  describe('basic invocation', () => {
    it('returns success with no args', () => {
      const result = runPruneCommand(
        { args: [] },
        { cwd: projectRoot },
      );

      assert.strictEqual(result.exitCode, 0);
      assert(result.stdout, 'should have stdout');
      assert(!result.stderr, 'should not have stderr');
    });

    it('displays help with --help flag', () => {
      const result = runPruneCommand(
        { args: ['--help'] },
        { cwd: projectRoot },
      );

      assert.strictEqual(result.exitCode, 0);
      assert(result.stdout.toLowerCase().includes('usage') || result.stdout.toLowerCase().includes('keep'), 'help should include usage or keep option');
    });
  });

  describe('json output', () => {
    it('outputs valid JSON with --json flag', () => {
      const result = runPruneCommand(
        { args: ['--json'] },
        { cwd: projectRoot },
      );

      assert.strictEqual(result.exitCode, 0);
      assert.doesNotThrow(() => JSON.parse(result.stdout));
      const json = JSON.parse(result.stdout);
      assert(json.runs_total !== undefined, 'JSON should have runs_total');
    });
  });

  describe('run listing', () => {
    it('lists runs when they exist', () => {
      const runsDir = path.join(projectRoot, '.wazir', 'runs');
      fs.mkdirSync(path.join(runsDir, 'run-20260324-010000'), { recursive: true });
      fs.mkdirSync(path.join(runsDir, 'run-20260324-020000'), { recursive: true });

      const result = runPruneCommand(
        { args: [] },
        { cwd: projectRoot },
      );

      assert.strictEqual(result.exitCode, 0);
      assert(result.stdout.includes('run-20260324'), 'should show run IDs');
    });

    it('shows friendly message when no runs exist', () => {
      const result = runPruneCommand(
        { args: [] },
        { cwd: projectRoot },
      );

      assert.strictEqual(result.exitCode, 0);
      assert(result.stdout.length > 0, 'should have output');
    });
  });
});
