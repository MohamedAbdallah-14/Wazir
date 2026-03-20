import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { detectRunnableType, collectProof } from '../../src/verify/proof-collector.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-proof-'));
}

function writePkg(dir, pkg) {
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));
}

describe('proof-collector', () => {
  describe('detectRunnableType', () => {
    test('returns library when no package.json', () => {
      const dir = makeTmpDir();
      assert.strictEqual(detectRunnableType(dir), 'library');
    });

    test('detects cli when pkg.bin is a string', () => {
      const dir = makeTmpDir();
      writePkg(dir, { name: 'my-cli', bin: './cli.js' });
      assert.strictEqual(detectRunnableType(dir), 'cli');
    });

    test('detects cli when pkg.bin is an object', () => {
      const dir = makeTmpDir();
      writePkg(dir, { name: 'my-cli', bin: { mycli: './cli.js' } });
      assert.strictEqual(detectRunnableType(dir), 'cli');
    });

    test('detects web for next', () => {
      const dir = makeTmpDir();
      writePkg(dir, { dependencies: { next: '^14.0.0' } });
      assert.strictEqual(detectRunnableType(dir), 'web');
    });

    test('detects web for vite', () => {
      const dir = makeTmpDir();
      writePkg(dir, { devDependencies: { vite: '^5.0.0' } });
      assert.strictEqual(detectRunnableType(dir), 'web');
    });

    test('detects web for react-scripts', () => {
      const dir = makeTmpDir();
      writePkg(dir, { dependencies: { 'react-scripts': '5.0.0' } });
      assert.strictEqual(detectRunnableType(dir), 'web');
    });

    test('detects api for express', () => {
      const dir = makeTmpDir();
      writePkg(dir, { dependencies: { express: '^4.0.0' } });
      assert.strictEqual(detectRunnableType(dir), 'api');
    });

    test('detects api for fastify', () => {
      const dir = makeTmpDir();
      writePkg(dir, { dependencies: { fastify: '^4.0.0' } });
      assert.strictEqual(detectRunnableType(dir), 'api');
    });

    test('detects api for hono', () => {
      const dir = makeTmpDir();
      writePkg(dir, { dependencies: { hono: '^3.0.0' } });
      assert.strictEqual(detectRunnableType(dir), 'api');
    });

    test('returns library for plain package.json', () => {
      const dir = makeTmpDir();
      writePkg(dir, { name: 'my-lib', dependencies: { lodash: '4.0.0' } });
      assert.strictEqual(detectRunnableType(dir), 'library');
    });

    test('cli takes priority over web frameworks', () => {
      const dir = makeTmpDir();
      writePkg(dir, { bin: { mycli: './cli.js' }, dependencies: { next: '^14.0.0' } });
      assert.strictEqual(detectRunnableType(dir), 'cli');
    });

    test('web takes priority over api frameworks', () => {
      const dir = makeTmpDir();
      writePkg(dir, { dependencies: { next: '^14.0.0', express: '^4.0.0' } });
      assert.strictEqual(detectRunnableType(dir), 'web');
    });
  });

  describe('collectProof', () => {
    test('returns type and evidence array', async () => {
      const dir = makeTmpDir();
      writePkg(dir, { name: 'test-lib' });
      const result = await collectProof(dir);
      assert.strictEqual(result.type, 'library');
      assert.ok(Array.isArray(result.evidence));
    });

    test('respects type override', async () => {
      const dir = makeTmpDir();
      writePkg(dir, { name: 'test-lib' });
      const result = await collectProof(dir, { type: 'web' });
      assert.strictEqual(result.type, 'web');
    });

    test('evidence entries have check, ok, and output fields', async () => {
      const dir = makeTmpDir();
      writePkg(dir, { name: 'test-lib', scripts: { test: 'echo ok' } });
      const result = await collectProof(dir);
      for (const entry of result.evidence) {
        assert.ok('check' in entry, 'evidence entry must have check');
        assert.ok('ok' in entry, 'evidence entry must have ok');
        assert.ok('output' in entry, 'evidence entry must have output');
      }
    });
  });

  describe('exports', () => {
    test('detectRunnableType is a function', () => {
      assert.strictEqual(typeof detectRunnableType, 'function');
    });

    test('collectProof is a function', () => {
      assert.strictEqual(typeof collectProof, 'function');
    });
  });
});
