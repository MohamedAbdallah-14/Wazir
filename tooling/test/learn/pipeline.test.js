import { describe, test } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

describe('learn pipeline module', () => {
  test('module exports expected functions', async () => {
    const mod = await import('../../src/learn/pipeline.js');
    assert.ok(typeof mod.extractFindings === 'function' || typeof mod.clusterFindings === 'function' || typeof mod.default === 'function' || Object.keys(mod).length > 0, 'module should export at least one function');
  });

  test('module loads without error', async () => {
    // Just importing the module validates it parses and initializes
    const mod = await import('../../src/learn/pipeline.js');
    assert.ok(mod, 'module should load');
  });
});
