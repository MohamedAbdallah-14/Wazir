import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

// Dynamic import so the module can be tested as a pure function
const { classifyCommand, loadRoutingMatrix } = await import(
  '../../src/hooks/routing-logic.js'
);

const matrix = loadRoutingMatrix(ROOT);

describe('classifyCommand — large commands', () => {
  test('npm test → large', () => {
    assert.strictEqual(classifyCommand('npm test', matrix).route, 'large');
  });

  test('vitest run → large', () => {
    assert.strictEqual(classifyCommand('vitest run', matrix).route, 'large');
  });

  test('jest --coverage → large', () => {
    assert.strictEqual(classifyCommand('jest --coverage', matrix).route, 'large');
  });

  test('npm run build → large', () => {
    assert.strictEqual(classifyCommand('npm run build', matrix).route, 'large');
  });
});

describe('classifyCommand — small commands', () => {
  test('git status → small', () => {
    assert.strictEqual(classifyCommand('git status', matrix).route, 'small');
  });

  test('ls -la → small', () => {
    assert.strictEqual(classifyCommand('ls -la', matrix).route, 'small');
  });

  test('pwd → small', () => {
    assert.strictEqual(classifyCommand('pwd', matrix).route, 'small');
  });

  test('wazir doctor → small', () => {
    assert.strictEqual(classifyCommand('wazir doctor', matrix).route, 'small');
  });
});

describe('classifyCommand — marker overrides', () => {
  test('# wazir:context-mode forces large', () => {
    assert.strictEqual(
      classifyCommand('git status # wazir:context-mode', matrix).route,
      'large',
    );
  });

  test('# wazir:passthrough forces small (non-large command)', () => {
    assert.strictEqual(
      classifyCommand('curl http://example.com # wazir:passthrough', matrix).route,
      'small',
    );
  });

  test('# wazir:passthrough does NOT override large commands', () => {
    // Large patterns take priority over passthrough marker
    assert.strictEqual(
      classifyCommand('npm test # wazir:passthrough', matrix).route,
      'large',
    );
  });
});

describe('classifyCommand — ambiguous heuristics', () => {
  test('command with pipe → ambiguous', () => {
    assert.strictEqual(
      classifyCommand('cat file.txt | grep pattern', matrix).route,
      'ambiguous',
    );
  });

  test('unknown command → small (safe default)', () => {
    assert.strictEqual(
      classifyCommand('some-unknown-tool --flag', matrix).route,
      'small',
    );
  });
});

describe('classifyCommand — edge cases', () => {
  test('missing routing matrix returns small with reason', () => {
    const result = classifyCommand('npm test', null);
    assert.strictEqual(result.route, 'small');
    assert.match(result.reason, /matrix missing/i);
  });

  test('empty command → small', () => {
    assert.strictEqual(classifyCommand('', matrix).route, 'small');
  });
});

describe('loadRoutingMatrix', () => {
  test('loads matrix with large, small, and ambiguous_heuristic keys', () => {
    assert.ok(Array.isArray(matrix.large));
    assert.ok(Array.isArray(matrix.small));
    assert.ok(matrix.ambiguous_heuristic);
  });

  test('matrix has required minimum entries per AC-D1.3', () => {
    const requiredLarge = ['npm test', 'vitest', 'jest', 'npm run build'];
    const requiredSmall = ['git status', 'ls', 'pwd', 'wazir doctor'];

    for (const cmd of requiredLarge) {
      assert.ok(matrix.large.includes(cmd), `Missing large entry: ${cmd}`);
    }
    for (const cmd of requiredSmall) {
      assert.ok(matrix.small.includes(cmd), `Missing small entry: ${cmd}`);
    }
  });
});
