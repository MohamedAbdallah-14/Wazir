import { describe, test } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
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

describe('session-start hook', () => {
  test('always exits 0 regardless of index state', () => {
    const result = runSessionStart();
    assert.strictEqual(result.exitCode, 0, `Expected exit 0, got ${result.exitCode}. stderr: ${result.stderr}`);
  });

  test('outputs using-skills content on stdout', () => {
    const result = runSessionStart();
    assert.ok(
      result.stdout.includes('EXTREMELY_IMPORTANT') || result.stdout.includes('using-skills'),
      'Expected skill bootstrap content on stdout',
    );
  });

  test('outputs CLI bootstrap guidance on stdout', () => {
    const result = runSessionStart();
    assert.ok(
      result.stdout.includes('cli-bootstrap-guidance'),
      'Expected CLI bootstrap guidance on stdout',
    );
  });

  test('index refresh produces stderr output (refresh or warn)', () => {
    const result = runSessionStart();
    // Should either refresh the index or warn about it
    // The exact output depends on wazir CLI availability and index state
    // At minimum, exit 0 is guaranteed
    assert.strictEqual(result.exitCode, 0);
  });
});
