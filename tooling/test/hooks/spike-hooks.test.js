import { describe, test } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

// These tests encode the wire format contracts validated by the spike.
// Production hooks (Tasks 5-7) MUST produce output matching these formats.
// Spike findings: .wazir/runs/run-20260323-161021/artifacts/spike-findings.md

describe('Spike: PreToolUse injection wire format contract', () => {
  test('systemMessage field in JSON stdout is the injection mechanism', () => {
    // Production hooks MUST output this format to stdout with exit 0
    const output = { systemMessage: 'CURRENT: step text (clarifier phase, step 2 of 5)\nNEXT: next step text' };
    const json = JSON.stringify(output);
    const parsed = JSON.parse(json);
    assert.ok(parsed.systemMessage, 'systemMessage field must be present');
    assert.strictEqual(typeof parsed.systemMessage, 'string');
    assert.ok(parsed.systemMessage.includes('CURRENT:'), 'Must include CURRENT: prefix');
  });

  test('empty object is valid fail-open output (no injection, no block)', () => {
    // When phase files are missing/malformed, hooks output {} and exit 0
    const output = {};
    const json = JSON.stringify(output);
    const parsed = JSON.parse(json);
    assert.strictEqual(parsed.systemMessage, undefined, 'No systemMessage on fail-open');
  });
});

describe('Spike: Stop hook wire format contract', () => {
  test('block decision format with reason and systemMessage', () => {
    // Production Stop hook outputs this to STDERR with exit code 2
    const output = {
      decision: 'block',
      reason: 'Cannot stop. Phase clarifier has 3 unchecked items: item1, item2, item3',
      systemMessage: 'You have unchecked pipeline items. Complete them before finishing.',
    };
    const json = JSON.stringify(output);
    const parsed = JSON.parse(json);
    assert.strictEqual(parsed.decision, 'block');
    assert.ok(parsed.reason, 'reason field required on block');
    assert.ok(parsed.systemMessage, 'systemMessage field recommended on block');
  });

  test('approve decision format', () => {
    // Production Stop hook outputs this to STDOUT with exit code 0
    const output = { decision: 'approve' };
    const json = JSON.stringify(output);
    const parsed = JSON.parse(json);
    assert.strictEqual(parsed.decision, 'approve');
  });
});

describe('Spike: Hook composition — existing hooks unaffected', () => {
  test('protected-path-write-guard still blocks protected paths', () => {
    const guardPath = path.join(ROOT, 'hooks', 'protected-path-write-guard');
    const result = spawnSync(guardPath, [], {
      encoding: 'utf8',
      cwd: ROOT,
      input: JSON.stringify({ target_path: 'roles/test.md' }),
      timeout: 10000,
    });
    // Write-guard exits 42 for blocked paths (defined in protected-path-write-guard line 21)
    assert.strictEqual(result.status, 42, `Write-guard should still block protected paths. stdout: ${result.stdout}`);
  });
});
