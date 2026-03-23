import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  checkArtifactExists,
  checkGitLog,
  checkCodeGrep,
  checkTestCount,
  checkTestsPass,
  checkFormatResultPattern,
  checkJsonFlagSupport,
  checkFileStructure,
  checkEdgeCaseCoverage,
  checkImportStyle,
  checkUsesSharedUtils,
  checkPatternConformance,
  checkTestFileExists,
  CHECK_RUNNERS,
  scoreDimension,
  scoreAll,
  formatReport,
} from './evaluator.js';

// ── Helpers ──────────────────────────────────────────────────

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-bench-test-'));
}

function initGitRepo(dir) {
  execFileSync('git', ['init'], { cwd: dir });
  execFileSync('git', ['checkout', '-b', 'main'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), '# test');
  execFileSync('git', ['add', '.'], { cwd: dir });
  execFileSync('git', ['commit', '-m', 'init'], { cwd: dir });
  execFileSync('git', ['checkout', '-b', 'feature'], { cwd: dir });
}

function commitFile(dir, filePath, content, message) {
  const fullPath = path.join(dir, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  execFileSync('git', ['add', filePath], { cwd: dir });
  execFileSync('git', ['commit', '-m', message], { cwd: dir });
}

// ── Tests ────────────────────────────────────────────────────

describe('CHECK_RUNNERS map', () => {
  test('has entry for every check type used in rubric', () => {
    const rubric = JSON.parse(fs.readFileSync(
      path.join(import.meta.dirname, 'rubric.json'), 'utf8'
    ));
    const usedTypes = new Set();
    for (const dim of Object.values(rubric.dimensions)) {
      for (const check of dim.checks) {
        usedTypes.add(check.type);
      }
    }
    for (const type of usedTypes) {
      assert.ok(CHECK_RUNNERS[type], `Missing runner for check type: ${type}`);
    }
  });
});

describe('checkArtifactExists', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTempDir(); initGitRepo(tmpDir); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  test('passes when matching file exists in new commits', () => {
    commitFile(tmpDir, 'docs/spec.md', '# Spec', 'add spec');
    const result = checkArtifactExists(tmpDir, {
      patterns: ['**/spec.md'],
    });
    assert.strictEqual(result.passed, true);
  });

  test('fails when no matching file exists', () => {
    const result = checkArtifactExists(tmpDir, {
      patterns: ['**/spec.md'],
    });
    assert.strictEqual(result.passed, false);
  });
});

describe('checkCodeGrep', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTempDir(); initGitRepo(tmpDir); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  test('passes when pattern found in impl files', () => {
    commitFile(tmpDir, 'tooling/src/prune.js', 'if (dryRun) { console.log("preview"); }', 'feat: add prune');
    const result = checkCodeGrep(tmpDir, { pattern: 'dry.?[Rr]un|dryRun|preview' });
    assert.strictEqual(result.passed, true);
  });

  test('fails when pattern not found', () => {
    commitFile(tmpDir, 'tooling/src/prune.js', 'function prune() {}', 'feat: add prune');
    const result = checkCodeGrep(tmpDir, { pattern: 'dry.?[Rr]un|dryRun|preview' });
    assert.strictEqual(result.passed, false);
  });
});

describe('checkTestCount', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTempDir(); initGitRepo(tmpDir); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  test('counts test() occurrences in test files', () => {
    const testContent = `
      import { test } from 'node:test';
      test('one', () => {});
      test('two', () => {});
      test('three', () => {});
    `;
    commitFile(tmpDir, 'tooling/test/prune.test.js', testContent, 'test: add prune tests');
    const result = checkTestCount(tmpDir, { minimum: 3 });
    assert.strictEqual(result.passed, true);
    assert.ok(result.detail.includes('3'));
  });

  test('fails when below minimum', () => {
    commitFile(tmpDir, 'tooling/test/prune.test.js', "test('one', () => {});", 'test: one test');
    const result = checkTestCount(tmpDir, { minimum: 5 });
    assert.strictEqual(result.passed, false);
  });
});

describe('checkGitLog', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTempDir(); initGitRepo(tmpDir); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  test('first_commit_matches checks oldest commit', () => {
    commitFile(tmpDir, 'spec.md', '# Spec', 'spec: define requirements');
    commitFile(tmpDir, 'code.js', '// code', 'feat: implement feature');
    const result = checkGitLog(tmpDir, {
      pattern: 'spec|clarif|design',
      mode: 'first_commit_matches',
    });
    assert.strictEqual(result.passed, true);
  });

  test('first_commit_matches fails when first commit is code', () => {
    commitFile(tmpDir, 'code.js', '// code', 'feat: implement feature');
    commitFile(tmpDir, 'spec.md', '# Spec', 'spec: define requirements');
    const result = checkGitLog(tmpDir, {
      pattern: 'spec|clarif|design',
      mode: 'first_commit_matches',
    });
    assert.strictEqual(result.passed, false);
  });

  test('test_before_impl detects TDD ordering', () => {
    commitFile(tmpDir, 'test.js', '// test', 'test: add prune tests');
    commitFile(tmpDir, 'code.js', '// impl', 'feat: implement prune');
    const result = checkGitLog(tmpDir, {
      pattern: 'test|spec',
      mode: 'test_before_impl',
    });
    assert.strictEqual(result.passed, true);
  });
});

describe('checkFormatResultPattern', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTempDir(); initGitRepo(tmpDir); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  test('passes when exitCode and stdout present', () => {
    commitFile(tmpDir, 'tooling/src/prune.js',
      'return { exitCode: 0, stdout: "done" };', 'feat: prune');
    const result = checkFormatResultPattern(tmpDir, {
      required_patterns: ['exitCode', 'stdout'],
    });
    assert.strictEqual(result.passed, true);
  });
});

describe('scoreDimension', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTempDir(); initGitRepo(tmpDir); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  test('calculates weighted score correctly', () => {
    commitFile(tmpDir, 'tooling/src/prune.js',
      'if (dryRun) { console.log("preview"); }', 'feat: prune');
    const dim = {
      weight: 10,
      checks: [
        { type: 'code_grep', description: 'dry-run', pattern: 'dryRun' },
        { type: 'code_grep', description: 'missing', pattern: 'nonexistentxyz' },
      ],
    };
    const result = scoreDimension(tmpDir, dim);
    assert.strictEqual(result.passed, 1);
    assert.strictEqual(result.total, 2);
    assert.strictEqual(result.score, 5); // 1/2 * 10
  });
});

describe('scoreAll', () => {
  test('returns 0 for empty repo with no changes', () => {
    const tmpDir = makeTempDir();
    initGitRepo(tmpDir);
    const rubric = JSON.parse(fs.readFileSync(
      path.join(import.meta.dirname, 'rubric.json'), 'utf8'
    ));
    const result = scoreAll(tmpDir, rubric);
    assert.strictEqual(result.totalScore, 0);
    assert.strictEqual(result.totalMax, 100);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('formatReport', () => {
  test('produces string with mode and total', () => {
    const scores = {
      totalScore: 42,
      totalMax: 100,
      dimensions: {
        test: { label: 'Test', score: 42, maxScore: 100, passed: 1, total: 2, results: [] },
      },
    };
    const report = formatReport('wazir', scores);
    assert.ok(report.includes('wazir'));
    assert.ok(report.includes('42'));
    assert.ok(report.includes('100'));
  });
});

describe('graceful failure', () => {
  test('evaluator handles nonexistent directory gracefully', () => {
    const rubric = JSON.parse(fs.readFileSync(
      path.join(import.meta.dirname, 'rubric.json'), 'utf8'
    ));
    const result = scoreAll('/tmp/nonexistent-benchmark-dir-xyz', rubric);
    assert.strictEqual(result.totalScore, 0);
    assert.ok(result.totalMax > 0);
  });
});
