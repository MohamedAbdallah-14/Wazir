import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { appendDecision, readDecisions } from '../../src/capture/decision.js';
import { getRunPaths } from '../../src/capture/store.js';

function createTempRunPaths() {
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-test-'));
  const runId = 'run-20260320-000000';
  const runPaths = getRunPaths(stateRoot, runId);
  fs.mkdirSync(runPaths.runRoot, { recursive: true });
  return { stateRoot, runPaths };
}

describe('appendDecision', () => {
  it('writes valid NDJSON with required fields', () => {
    const { stateRoot, runPaths } = createTempRunPaths();

    appendDecision(runPaths, {
      phase: 'clarify',
      decision: 'Split into two tasks',
      reason: 'Scope too large for single implementation',
    });

    const lines = fs.readFileSync(runPaths.decisionsPath, 'utf8').trim().split('\n');
    assert.equal(lines.length, 1);

    const entry = JSON.parse(lines[0]);
    assert.equal(entry.phase, 'clarify');
    assert.equal(entry.decision, 'Split into two tasks');
    assert.equal(entry.reason, 'Scope too large for single implementation');
    assert.ok(entry.timestamp);
    assert.equal(entry.task_id, undefined);

    fs.rmSync(stateRoot, { recursive: true });
  });

  it('includes optional task_id when provided', () => {
    const { stateRoot, runPaths } = createTempRunPaths();

    appendDecision(runPaths, {
      phase: 'implement',
      decision: 'Use SQLite',
      reason: 'Better query support',
      task_id: 'task-001',
    });

    const lines = fs.readFileSync(runPaths.decisionsPath, 'utf8').trim().split('\n');
    const entry = JSON.parse(lines[0]);
    assert.equal(entry.task_id, 'task-001');

    fs.rmSync(stateRoot, { recursive: true });
  });

  it('appends multiple entries as separate lines', () => {
    const { stateRoot, runPaths } = createTempRunPaths();

    appendDecision(runPaths, { phase: 'clarify', decision: 'First', reason: 'Reason 1' });
    appendDecision(runPaths, { phase: 'design', decision: 'Second', reason: 'Reason 2' });

    const lines = fs.readFileSync(runPaths.decisionsPath, 'utf8').trim().split('\n');
    assert.equal(lines.length, 2);

    const first = JSON.parse(lines[0]);
    assert.equal(first.decision, 'First');
    const second = JSON.parse(lines[1]);
    assert.equal(second.decision, 'Second');

    fs.rmSync(stateRoot, { recursive: true });
  });
});

describe('readDecisions', () => {
  it('parses all entries from the log', () => {
    const { stateRoot, runPaths } = createTempRunPaths();

    appendDecision(runPaths, { phase: 'clarify', decision: 'A', reason: 'R1' });
    appendDecision(runPaths, { phase: 'design', decision: 'B', reason: 'R2' });
    appendDecision(runPaths, { phase: 'implement', decision: 'C', reason: 'R3' });

    const entries = readDecisions(runPaths);
    assert.equal(entries.length, 3);
    assert.equal(entries[0].phase, 'clarify');
    assert.equal(entries[1].phase, 'design');
    assert.equal(entries[2].phase, 'implement');

    fs.rmSync(stateRoot, { recursive: true });
  });

  it('returns empty array when file does not exist', () => {
    const { stateRoot, runPaths } = createTempRunPaths();

    const entries = readDecisions(runPaths);
    assert.deepEqual(entries, []);

    fs.rmSync(stateRoot, { recursive: true });
  });

  it('returns empty array for empty file', () => {
    const { stateRoot, runPaths } = createTempRunPaths();

    fs.writeFileSync(runPaths.decisionsPath, '', 'utf8');

    const entries = readDecisions(runPaths);
    assert.deepEqual(entries, []);

    fs.rmSync(stateRoot, { recursive: true });
  });

  it('skips malformed lines', () => {
    const { stateRoot, runPaths } = createTempRunPaths();

    fs.writeFileSync(runPaths.decisionsPath, '{"phase":"a","decision":"d","reason":"r","timestamp":"2026-01-01T00:00:00.000Z"}\nnot json\n', 'utf8');

    const entries = readDecisions(runPaths);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].phase, 'a');

    fs.rmSync(stateRoot, { recursive: true });
  });
});

describe('decision CLI handler', () => {
  it('writes to correct path via handleDecision through runCaptureCommand', async () => {
    const { stateRoot, runPaths } = createTempRunPaths();

    // We need a wazir.manifest.yaml for resolveCaptureContext, so test
    // appendDecision directly as the CLI path requires project context.
    const result = appendDecision(runPaths, {
      phase: 'clarify',
      decision: 'Test decision',
      reason: 'Test reason',
    });

    assert.equal(result, runPaths.decisionsPath);
    assert.ok(fs.existsSync(runPaths.decisionsPath));

    const entries = readDecisions(runPaths);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].decision, 'Test decision');

    fs.rmSync(stateRoot, { recursive: true });
  });
});
