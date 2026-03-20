import { describe, test } from 'node:test';
import assert from 'node:assert';

describe('state command module', () => {
  test('module exports runStateCommand', async () => {
    const mod = await import('../../src/state/command.js');
    assert.ok(typeof mod.runStateCommand === 'function', 'should export runStateCommand');
  });

  test('runStateCommand returns usage on empty args', async () => {
    const mod = await import('../../src/state/command.js');
    const result = mod.runStateCommand({ args: [], options: {} }, {});
    assert.ok(result, 'should return a result');
    assert.ok(result.exitCode !== undefined, 'should have exitCode');
  });
});
