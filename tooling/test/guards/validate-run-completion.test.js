import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { validateRunCompletion } from '../../src/guards/phase-prerequisite-guard.js';

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-test-'));
}

function writeManifest(dir, workflows) {
  const content = `manifest_version: 2\nworkflows:\n${workflows.map(w => `  - ${w}`).join('\n')}\n`;
  fs.writeFileSync(path.join(dir, 'manifest.yaml'), content);
  return path.join(dir, 'manifest.yaml');
}

function writeEvents(runDir, events) {
  const lines = events.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.writeFileSync(path.join(runDir, 'events.ndjson'), lines);
}

describe('validateRunCompletion', () => {
  it('returns complete when all workflows have phase_exit events', () => {
    const tmpDir = createTempDir();
    const runDir = path.join(tmpDir, 'run');
    fs.mkdirSync(runDir, { recursive: true });

    const manifestPath = writeManifest(tmpDir, ['clarify', 'execute', 'review']);
    writeEvents(runDir, [
      { event: 'phase_exit', phase: 'clarify', status: 'completed' },
      { event: 'phase_exit', phase: 'execute', status: 'completed' },
      { event: 'phase_exit', phase: 'review', status: 'completed' },
    ]);

    const result = validateRunCompletion(runDir, manifestPath);
    assert.equal(result.complete, true);
    assert.deepEqual(result.missing, []);

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('returns incomplete with missing workflows listed', () => {
    const tmpDir = createTempDir();
    const runDir = path.join(tmpDir, 'run');
    fs.mkdirSync(runDir, { recursive: true });

    const manifestPath = writeManifest(tmpDir, ['clarify', 'execute', 'review', 'learn']);
    writeEvents(runDir, [
      { event: 'phase_exit', phase: 'clarify', status: 'completed' },
      { event: 'phase_exit', phase: 'execute', status: 'completed' },
    ]);

    const result = validateRunCompletion(runDir, manifestPath);
    assert.equal(result.complete, false);
    assert.deepEqual(result.missing, ['review', 'learn']);

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('ignores non-completed phase_exit events', () => {
    const tmpDir = createTempDir();
    const runDir = path.join(tmpDir, 'run');
    fs.mkdirSync(runDir, { recursive: true });

    const manifestPath = writeManifest(tmpDir, ['clarify', 'execute']);
    writeEvents(runDir, [
      { event: 'phase_exit', phase: 'clarify', status: 'completed' },
      { event: 'phase_exit', phase: 'execute', status: 'failed' },
    ]);

    const result = validateRunCompletion(runDir, manifestPath);
    assert.equal(result.complete, false);
    assert.deepEqual(result.missing, ['execute']);

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('returns complete when manifest has no workflows', () => {
    const tmpDir = createTempDir();
    const runDir = path.join(tmpDir, 'run');
    fs.mkdirSync(runDir, { recursive: true });

    const content = 'manifest_version: 2\n';
    const manifestPath = path.join(tmpDir, 'manifest.yaml');
    fs.writeFileSync(manifestPath, content);

    const result = validateRunCompletion(runDir, manifestPath);
    assert.equal(result.complete, true);
    assert.deepEqual(result.missing, []);

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('handles missing events.ndjson gracefully', () => {
    const tmpDir = createTempDir();
    const runDir = path.join(tmpDir, 'run');
    fs.mkdirSync(runDir, { recursive: true });

    const manifestPath = writeManifest(tmpDir, ['clarify']);

    const result = validateRunCompletion(runDir, manifestPath);
    assert.equal(result.complete, false);
    assert.deepEqual(result.missing, ['clarify']);

    fs.rmSync(tmpDir, { recursive: true });
  });
});
