import { describe, test } from 'node:test';
import assert from 'node:assert';

describe('reports command module', () => {
  test('module exports runReportCommand', async () => {
    const mod = await import('../../src/reports/command.js');
    assert.ok(typeof mod.runReportCommand === 'function', 'should export runReportCommand');
  });

  test('runReportCommand returns usage on empty args', async () => {
    const mod = await import('../../src/reports/command.js');
    const result = mod.runReportCommand({ args: [], options: {} }, {});
    assert.ok(result, 'should return a result');
    assert.ok(result.exitCode !== undefined, 'should have exitCode');
  });
});
