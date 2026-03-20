import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { captureUserInput, readUserInputLog, pruneOldInputLogs } from '../../src/capture/user-input.js';

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-test-'));
}

describe('captureUserInput', () => {
  it('appends NDJSON entries to the log file', () => {
    const runDir = createTempDir();

    captureUserInput(runDir, { phase: 'clarifier', type: 'instruction', content: 'Build a login page', context: 'initial briefing' });
    captureUserInput(runDir, { phase: 'clarifier', type: 'approval', content: 'Looks good', context: 'checkpoint 1' });

    const logPath = path.join(runDir, 'user-input-log.ndjson');
    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
    assert.equal(lines.length, 2);

    const first = JSON.parse(lines[0]);
    assert.equal(first.phase, 'clarifier');
    assert.equal(first.type, 'instruction');
    assert.equal(first.content, 'Build a login page');
    assert.ok(first.timestamp);

    fs.rmSync(runDir, { recursive: true });
  });

  it('defaults missing fields', () => {
    const runDir = createTempDir();

    captureUserInput(runDir, {});

    const entries = readUserInputLog(runDir);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].phase, 'unknown');
    assert.equal(entries[0].type, 'instruction');
    assert.equal(entries[0].content, '');

    fs.rmSync(runDir, { recursive: true });
  });
});

describe('readUserInputLog', () => {
  it('returns empty array for missing log', () => {
    const runDir = createTempDir();
    const entries = readUserInputLog(runDir);
    assert.deepEqual(entries, []);
    fs.rmSync(runDir, { recursive: true });
  });
});

describe('pruneOldInputLogs', () => {
  it('prunes logs from older runs beyond keep limit', () => {
    const stateRoot = createTempDir();
    const runsDir = path.join(stateRoot, 'runs');

    // Create 5 run dirs with logs
    for (let i = 1; i <= 5; i++) {
      const runDir = path.join(runsDir, `run-2026030${i}-000000`);
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'user-input-log.ndjson'), '{"test": true}\n');
    }

    const result = pruneOldInputLogs(stateRoot, 3);
    assert.equal(result.pruned, 2);

    // Newest 3 should still have logs
    assert.ok(fs.existsSync(path.join(runsDir, 'run-20260305-000000', 'user-input-log.ndjson')));
    assert.ok(fs.existsSync(path.join(runsDir, 'run-20260304-000000', 'user-input-log.ndjson')));
    assert.ok(fs.existsSync(path.join(runsDir, 'run-20260303-000000', 'user-input-log.ndjson')));

    // Oldest 2 should be pruned
    assert.ok(!fs.existsSync(path.join(runsDir, 'run-20260302-000000', 'user-input-log.ndjson')));
    assert.ok(!fs.existsSync(path.join(runsDir, 'run-20260301-000000', 'user-input-log.ndjson')));

    fs.rmSync(stateRoot, { recursive: true });
  });
});
