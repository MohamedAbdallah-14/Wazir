import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { scanInputDirectories } from '../src/input/scanner.js';

function createFixture(layout = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-input-'));

  for (const [relPath, content] of Object.entries(layout)) {
    const fullPath = path.join(root, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content || '# test');
  }

  return {
    root,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

describe('scanInputDirectories', () => {
  test('finds files in input/', () => {
    const fix = createFixture({ 'input/brief.md': '# Brief' });
    try {
      const results = scanInputDirectories(fix.root);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].path.endsWith('input/brief.md'));
    } finally {
      fix.cleanup();
    }
  });

  test('finds files in .wazir/input/', () => {
    const fix = createFixture({ '.wazir/input/briefing.md': '# Briefing' });
    try {
      const results = scanInputDirectories(fix.root);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].path.includes('.wazir/input/briefing.md'));
    } finally {
      fix.cleanup();
    }
  });

  test('returns union when both directories have files', () => {
    const fix = createFixture({
      'input/a.md': '# A',
      '.wazir/input/b.md': '# B',
    });
    try {
      const results = scanInputDirectories(fix.root);
      assert.strictEqual(results.length, 2);
    } finally {
      fix.cleanup();
    }
  });

  test('returns empty array when no .md files exist', () => {
    const fix = createFixture({});
    try {
      const results = scanInputDirectories(fix.root);
      assert.strictEqual(results.length, 0);
    } finally {
      fix.cleanup();
    }
  });

  test('excludes README.md', () => {
    const fix = createFixture({
      'input/README.md': '# Readme',
      'input/brief.md': '# Brief',
    });
    try {
      const results = scanInputDirectories(fix.root);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].path.endsWith('brief.md'));
    } finally {
      fix.cleanup();
    }
  });

  test('single file gets auto: true', () => {
    const fix = createFixture({ 'input/only.md': '# Only' });
    try {
      const results = scanInputDirectories(fix.root);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].auto, true);
    } finally {
      fix.cleanup();
    }
  });

  test('multiple files get auto: false', () => {
    const fix = createFixture({
      'input/a.md': '# A',
      'input/b.md': '# B',
    });
    try {
      const results = scanInputDirectories(fix.root);
      assert.strictEqual(results.length, 2);
      assert.ok(results.every((r) => r.auto === false));
    } finally {
      fix.cleanup();
    }
  });

  test('non-.md files are not returned', () => {
    const fix = createFixture({
      'input/data.json': '{}',
      'input/brief.md': '# Brief',
    });
    try {
      const results = scanInputDirectories(fix.root);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].path.endsWith('brief.md'));
    } finally {
      fix.cleanup();
    }
  });
});
