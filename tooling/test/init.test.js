import { describe, test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runInitCommand } from '../src/init/command.js';

const CLI_PATH = fileURLToPath(new URL('../src/cli.js', import.meta.url));

function runCli(args, options = {}) {
  try {
    const stdout = execFileSync('node', [CLI_PATH, ...args], {
      encoding: 'utf8',
      cwd: options.cwd,
      input: options.input,
      timeout: options.timeout ?? 5000,
    });

    return {
      exitCode: 0,
      stdout,
      stderr: '',
    };
  } catch (error) {
    return {
      exitCode: error.status ?? 1,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
    };
  }
}

function createInitFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-init-'));

  // The init command needs a wazir.manifest.yaml to exist (findProjectRoot
  // walks up looking for it), but init itself doesn't require it — however
  // the CLI does not gate on it for init. We create a minimal one just in
  // case future versions need it.

  return {
    fixtureRoot,
    cleanup() {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    },
  };
}

describe('wazir init command', () => {
  test('init rejects when config exists without --force', async () => {
    const fixture = createInitFixture();
    try {
      const wazirDir = path.join(fixture.fixtureRoot, '.wazir');
      const stateDir = path.join(wazirDir, 'state');
      fs.mkdirSync(stateDir, { recursive: true });
      fs.writeFileSync(path.join(stateDir, 'config.json'), '{}');

      const result = await runInitCommand(
        { command: 'init', subcommand: null, args: [], help: false },
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('already initialized'), `stderr should mention already initialized: ${result.stderr}`);
    } finally {
      fixture.cleanup();
    }
  });

  test('init creates directories', () => {
    const fixture = createInitFixture();
    try {
      // Run via CLI with a short timeout — the command will create
      // directories before hitting the interactive prompt, then the
      // process will be killed by the timeout or exit due to non-TTY.
      // We don't care about the exit code, only that the dirs exist.
      runCli(['init'], { cwd: fixture.fixtureRoot, timeout: 3000 });

      const wazirDir = path.join(fixture.fixtureRoot, '.wazir');
      assert.ok(fs.existsSync(path.join(wazirDir, 'input')), '.wazir/input should exist');
      assert.ok(fs.existsSync(path.join(wazirDir, 'state')), '.wazir/state should exist');
      assert.ok(fs.existsSync(path.join(wazirDir, 'runs')), '.wazir/runs should exist');
    } finally {
      fixture.cleanup();
    }
  });

  test('init shows in CLI help', () => {
    const result = runCli(['--help']);
    assert.ok(result.stdout.includes('init'), 'help output should list init command');
  });

  test('init --force overwrites existing config', () => {
    const fixture = createInitFixture();
    try {
      const wazirDir = path.join(fixture.fixtureRoot, '.wazir');
      const stateDir = path.join(wazirDir, 'state');
      fs.mkdirSync(stateDir, { recursive: true });
      fs.writeFileSync(path.join(stateDir, 'config.json'), '{"old": true}');

      // With --force, the early-exit check is skipped.
      // The command will reach the interactive prompt and either timeout
      // or exit non-zero from prompt cancellation — but it should NOT
      // exit 1 with "already initialized".
      const result = runCli(['init', '--force'], { cwd: fixture.fixtureRoot, timeout: 3000 });

      // Exit 1 with "already initialized" is the failure case we're guarding against.
      if (result.exitCode === 1) {
        assert.ok(!result.stderr.includes('already initialized'), 'should not say already initialized with --force');
      }
    } finally {
      fixture.cleanup();
    }
  });
});
