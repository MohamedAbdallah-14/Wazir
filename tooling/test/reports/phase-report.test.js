import { describe, test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  collectPhaseMetrics,
  buildPhaseReport,
  parseTestOutput,
  parseDiffStat,
  parseNameStatus,
} from '../../src/reports/phase-report.js';

function createTempGitRepo() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-report-'));

  execFileSync('git', ['init'], { cwd: tmpDir });
  execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmpDir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmpDir });

  // Create an initial commit on main
  fs.writeFileSync(path.join(tmpDir, 'README.md'), '# test\n');
  execFileSync('git', ['add', '.'], { cwd: tmpDir });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: tmpDir });

  // Rename the default branch to main for consistency
  execFileSync('git', ['branch', '-M', 'main'], { cwd: tmpDir });

  return tmpDir;
}

function createStateRoot(tmpDir, runId) {
  const stateRoot = path.join(tmpDir, '.state');
  const runRoot = path.join(stateRoot, 'runs', runId);
  fs.mkdirSync(runRoot, { recursive: true });

  return stateRoot;
}

describe('parseTestOutput', () => {
  test('parses Node built-in test runner summary', () => {
    const output = [
      'TAP version 13',
      '# Subtest: example',
      'ok 1 - example',
      '# tests 12',
      '# pass 10',
      '# fail 1',
      '# skipped 1',
    ].join('\n');

    const result = parseTestOutput(output);

    assert.deepStrictEqual(result, {
      total: 12,
      passed: 10,
      failed: 1,
      skipped: 1,
    });
  });

  test('parses partial summary (pass only, no fail line)', () => {
    const output = '# tests 5\n# pass 5\n';
    const result = parseTestOutput(output);

    assert.strictEqual(result.total, 5);
    assert.strictEqual(result.passed, 5);
    assert.strictEqual(result.failed, 0);
    assert.strictEqual(result.skipped, 0);
  });

  test('falls back to TAP-style counting when no summary lines', () => {
    const output = [
      'ok 1 - first test',
      'ok 2 - second test',
      'not ok 3 - third test',
      'ok 4 - skipped test # skip reason',
    ].join('\n');

    const result = parseTestOutput(output);

    assert.strictEqual(result.total, 4);
    assert.strictEqual(result.passed, 2);
    assert.strictEqual(result.failed, 1);
    assert.strictEqual(result.skipped, 1);
  });

  test('returns zeros for empty output', () => {
    const result = parseTestOutput('');

    assert.deepStrictEqual(result, {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    });
  });

  test('returns zeros for null input', () => {
    const result = parseTestOutput(null);

    assert.deepStrictEqual(result, {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    });
  });
});

describe('parseDiffStat', () => {
  test('parses full stat summary', () => {
    const output = ' 5 files changed, 120 insertions(+), 30 deletions(-)';
    const result = parseDiffStat(output);

    assert.deepStrictEqual(result, {
      files_changed: 5,
      insertions: 120,
      deletions: 30,
    });
  });

  test('parses insertions only', () => {
    const output = ' 1 file changed, 10 insertions(+)';
    const result = parseDiffStat(output);

    assert.deepStrictEqual(result, {
      files_changed: 1,
      insertions: 10,
      deletions: 0,
    });
  });

  test('parses deletions only', () => {
    const output = ' 2 files changed, 5 deletions(-)';
    const result = parseDiffStat(output);

    assert.deepStrictEqual(result, {
      files_changed: 2,
      insertions: 0,
      deletions: 5,
    });
  });

  test('returns zeros for empty input', () => {
    const result = parseDiffStat('');

    assert.deepStrictEqual(result, {
      files_changed: 0,
      insertions: 0,
      deletions: 0,
    });
  });
});

describe('parseNameStatus', () => {
  test('categorizes added, modified, deleted files', () => {
    const output = 'A\tnew-file.js\nM\texisting.js\nD\tremoved.js\n';
    const result = parseNameStatus(output);

    assert.deepStrictEqual(result, {
      added: ['new-file.js'],
      modified: ['existing.js'],
      deleted: ['removed.js'],
    });
  });

  test('treats rename as modified', () => {
    const output = 'R100\told-name.js\tnew-name.js\n';
    const result = parseNameStatus(output);

    assert.strictEqual(result.modified.length, 1);
    assert.strictEqual(result.added.length, 0);
    assert.strictEqual(result.deleted.length, 0);
  });

  test('returns empty arrays for empty input', () => {
    const result = parseNameStatus('');

    assert.deepStrictEqual(result, {
      added: [],
      modified: [],
      deleted: [],
    });
  });
});

describe('collectPhaseMetrics', () => {
  test('returns expected structure with all fields', () => {
    const tmpDir = createTempGitRepo();
    const stateRoot = createStateRoot(tmpDir, 'run-001');

    try {
      const metrics = collectPhaseMetrics({
        projectRoot: tmpDir,
        stateRoot,
        runId: 'run-001',
        phase: 'clarifier',
        baseBranch: 'main',
      });

      assert.strictEqual(metrics.run_id, 'run-001');
      assert.strictEqual(metrics.phase, 'clarifier');
      assert.ok(metrics.generated_at);

      // diff and files should be objects (may be zero since HEAD is on main)
      assert.ok(metrics.diff !== undefined);
      assert.ok(metrics.files !== undefined);

      // artifacts should be an array
      assert.ok(Array.isArray(metrics.artifacts));

      // duration should be null (no events)
      assert.strictEqual(metrics.duration_seconds, null);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('computes duration from events.ndjson', () => {
    const tmpDir = createTempGitRepo();
    const stateRoot = createStateRoot(tmpDir, 'run-002');
    const eventsPath = path.join(stateRoot, 'runs', 'run-002', 'events.ndjson');

    const enterTime = '2026-03-19T10:00:00.000Z';
    const exitTime = '2026-03-19T10:05:30.000Z';

    const events = [
      JSON.stringify({ event: 'phase_enter', phase: 'executor', created_at: enterTime }),
      JSON.stringify({ event: 'phase_exit', phase: 'executor', created_at: exitTime }),
    ].join('\n') + '\n';

    fs.writeFileSync(eventsPath, events);

    try {
      const metrics = collectPhaseMetrics({
        projectRoot: tmpDir,
        stateRoot,
        runId: 'run-002',
        phase: 'executor',
        baseBranch: 'main',
      });

      assert.strictEqual(metrics.duration_seconds, 330);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('collects artifacts from clarified and artifacts dirs', () => {
    const tmpDir = createTempGitRepo();
    const stateRoot = createStateRoot(tmpDir, 'run-003');

    const clarifiedDir = path.join(stateRoot, 'runs', 'run-003', 'clarified');
    const artifactsDir = path.join(stateRoot, 'runs', 'run-003', 'artifacts');
    fs.mkdirSync(clarifiedDir, { recursive: true });
    fs.mkdirSync(artifactsDir, { recursive: true });
    fs.writeFileSync(path.join(clarifiedDir, 'plan.md'), 'plan');
    fs.writeFileSync(path.join(artifactsDir, 'output.json'), '{}');

    try {
      const metrics = collectPhaseMetrics({
        projectRoot: tmpDir,
        stateRoot,
        runId: 'run-003',
        phase: 'clarifier',
        baseBranch: 'main',
      });

      assert.strictEqual(metrics.artifacts.length, 2);
      assert.ok(metrics.artifacts.some((a) => a.endsWith('plan.md')));
      assert.ok(metrics.artifacts.some((a) => a.endsWith('output.json')));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('graceful degradation when git is not available', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-report-nogit-'));
    const stateRoot = path.join(tmpDir, '.state');
    fs.mkdirSync(path.join(stateRoot, 'runs', 'run-bad'), { recursive: true });

    try {
      // tmpDir is not a git repo — git commands should fail gracefully
      const metrics = collectPhaseMetrics({
        projectRoot: tmpDir,
        stateRoot,
        runId: 'run-bad',
        phase: 'init',
        baseBranch: 'main',
      });

      assert.strictEqual(metrics.run_id, 'run-bad');
      assert.strictEqual(metrics.phase, 'init');
      // diff and files should be null (git failed)
      assert.strictEqual(metrics.diff, null);
      assert.strictEqual(metrics.files, null);
      // tests may be null (no test runner in tmpDir)
      // duration should be null (no events)
      assert.strictEqual(metrics.duration_seconds, null);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('buildPhaseReport', () => {
  test('merges metrics with qualitative fields', () => {
    const metrics = {
      run_id: 'run-100',
      phase: 'final_review',
      generated_at: '2026-03-19T12:00:00.000Z',
      tests: { total: 10, passed: 9, failed: 1, skipped: 0 },
      diff: { files_changed: 3, insertions: 50, deletions: 10 },
      files: { added: ['a.js'], modified: ['b.js'], deleted: [] },
      artifacts: ['/tmp/art.json'],
      duration_seconds: 120,
    };

    const qualitative = {
      summary: 'Good phase.',
      drift_analysis: 'No drift detected.',
      decisions: ['Decision A'],
      risks: ['Risk X'],
    };

    const report = buildPhaseReport(metrics, qualitative);

    assert.strictEqual(report.run_id, 'run-100');
    assert.strictEqual(report.phase, 'final_review');
    assert.strictEqual(report.generated_at, '2026-03-19T12:00:00.000Z');

    assert.deepStrictEqual(report.metrics.tests, {
      total: 10,
      passed: 9,
      failed: 1,
      skipped: 0,
    });
    assert.deepStrictEqual(report.metrics.diff, {
      files_changed: 3,
      insertions: 50,
      deletions: 10,
    });
    assert.deepStrictEqual(report.metrics.files, {
      added: ['a.js'],
      modified: ['b.js'],
      deleted: [],
    });
    assert.deepStrictEqual(report.metrics.artifacts, ['/tmp/art.json']);
    assert.strictEqual(report.metrics.duration_seconds, 120);

    assert.strictEqual(report.qualitative.summary, 'Good phase.');
    assert.strictEqual(report.qualitative.drift_analysis, 'No drift detected.');
    assert.deepStrictEqual(report.qualitative.decisions, ['Decision A']);
    assert.deepStrictEqual(report.qualitative.risks, ['Risk X']);
  });

  test('provides defaults when qualitative is omitted', () => {
    const metrics = {
      run_id: 'run-200',
      phase: 'init',
      generated_at: '2026-03-19T12:00:00.000Z',
      tests: null,
      diff: null,
      files: null,
      artifacts: [],
      duration_seconds: null,
    };

    const report = buildPhaseReport(metrics);

    assert.deepStrictEqual(report.metrics.tests, {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    });
    assert.deepStrictEqual(report.metrics.diff, {
      files_changed: 0,
      insertions: 0,
      deletions: 0,
    });
    assert.deepStrictEqual(report.metrics.files, {
      added: [],
      modified: [],
      deleted: [],
    });
    assert.strictEqual(report.qualitative.summary, '');
    assert.strictEqual(report.qualitative.drift_analysis, '');
    assert.deepStrictEqual(report.qualitative.decisions, []);
    assert.deepStrictEqual(report.qualitative.risks, []);
  });

  test('null metrics fields get safe defaults', () => {
    const metrics = {
      run_id: 'run-300',
      phase: 'clarifier',
      generated_at: '2026-03-19T12:00:00.000Z',
    };

    const report = buildPhaseReport(metrics);

    assert.deepStrictEqual(report.metrics.tests, {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    });
    assert.deepStrictEqual(report.metrics.diff, {
      files_changed: 0,
      insertions: 0,
      deletions: 0,
    });
    assert.deepStrictEqual(report.metrics.files, {
      added: [],
      modified: [],
      deleted: [],
    });
    assert.strictEqual(report.metrics.duration_seconds, null);
  });
});
