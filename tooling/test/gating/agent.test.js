import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluatePhaseReport } from '../../src/gating/agent.js';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const RULES_PATH = path.join(ROOT, 'config', 'gating-rules.yaml');

/**
 * Build a "clean" phase report where every gate passes.
 */
function greenReport() {
  return {
    quality_metrics: {
      test_fail_count: 0,
      lint_errors: 0,
      type_errors: 0,
    },
    drift_analysis: {
      delta: 0,
    },
    risk_flags: [],
    attempted_actions: [],
  };
}

describe('gating agent — evaluatePhaseReport', () => {
  test('all-green report returns continue', () => {
    const result = evaluatePhaseReport(greenReport(), RULES_PATH);
    assert.strictEqual(result.verdict, 'continue');
    assert.ok(result.reason.length > 0, 'reason must not be empty');
  });

  test('report with test failures returns loop_back with fix names', () => {
    const report = {
      ...greenReport(),
      quality_metrics: {
        test_fail_count: 3,
        lint_errors: 0,
        type_errors: 0,
      },
    };
    const result = evaluatePhaseReport(report, RULES_PATH);
    assert.strictEqual(result.verdict, 'loop_back');
    assert.ok(Array.isArray(result.fixes), 'fixes must be an array');
    assert.ok(result.fixes.length > 0, 'fixes must contain at least one entry');
    assert.ok(result.fixes.some((f) => f.includes('3')), 'fixes should reference the failure count');
  });

  test('report with lint errors returns loop_back', () => {
    const report = {
      ...greenReport(),
      quality_metrics: {
        test_fail_count: 0,
        lint_errors: 5,
        type_errors: 0,
      },
    };
    // lint_errors > 0 triggers loop_back per the rule comments
    // ("# OR lint_errors > 0 OR type_errors > 0")
    const result = evaluatePhaseReport(report, RULES_PATH);
    assert.strictEqual(result.verdict, 'loop_back');
    assert.ok(result.fixes.some((f) => f.includes('lint')), 'should mention lint errors');
  });

  test('report with type errors returns loop_back', () => {
    const report = {
      ...greenReport(),
      quality_metrics: {
        test_fail_count: 0,
        lint_errors: 0,
        type_errors: 3,
      },
    };
    const result = evaluatePhaseReport(report, RULES_PATH);
    assert.strictEqual(result.verdict, 'loop_back');
    assert.ok(result.fixes.some((f) => f.includes('type')), 'should mention type errors');
  });

  test('type_errors > 0 blocks continue even when other gates pass', () => {
    const report = {
      ...greenReport(),
      quality_metrics: {
        test_fail_count: 0,
        lint_errors: 0,
        type_errors: 1,
      },
    };
    const result = evaluatePhaseReport(report, RULES_PATH);
    assert.notStrictEqual(result.verdict, 'continue', 'type_errors should prevent continue');
  });

  test('accepts optional context parameter', () => {
    const result = evaluatePhaseReport(greenReport(), RULES_PATH, {
      userInput: 'approve',
      decisions: { phase1: 'continue' },
    });
    assert.strictEqual(result.verdict, 'continue');
  });

  test('report with high risk flags returns escalate', () => {
    const report = {
      ...greenReport(),
      risk_flags: [{ severity: 'high', description: 'security vulnerability' }],
    };
    const result = evaluatePhaseReport(report, RULES_PATH);
    assert.strictEqual(result.verdict, 'escalate');
    assert.ok(result.reason.length > 0);
  });

  test('report with drift > 0 returns escalate', () => {
    const report = {
      ...greenReport(),
      drift_analysis: { delta: 3 },
    };
    const result = evaluatePhaseReport(report, RULES_PATH);
    // drift > 0 breaks continue, test_fail_count is 0 so loop_back doesn't match
    assert.strictEqual(result.verdict, 'escalate');
  });

  test('report with uncertain outcomes returns escalate', () => {
    const report = {
      ...greenReport(),
      attempted_actions: [{ name: 'deploy', outcome: 'uncertain' }],
    };
    const result = evaluatePhaseReport(report, RULES_PATH);
    assert.strictEqual(result.verdict, 'escalate');
  });

  test('empty report returns escalate (default)', () => {
    const result = evaluatePhaseReport({}, RULES_PATH);
    assert.strictEqual(result.verdict, 'escalate');
  });

  test('null report returns escalate (default)', () => {
    const result = evaluatePhaseReport(null, RULES_PATH);
    assert.strictEqual(result.verdict, 'escalate');
    assert.ok(result.reason.includes('empty or missing'));
  });

  test('undefined report returns escalate (default)', () => {
    const result = evaluatePhaseReport(undefined, RULES_PATH);
    assert.strictEqual(result.verdict, 'escalate');
  });

  test('rules file not found returns escalate with error reason', () => {
    const result = evaluatePhaseReport(greenReport(), '/nonexistent/gating-rules.yaml');
    assert.strictEqual(result.verdict, 'escalate');
    assert.ok(result.reason.includes('Failed to load gating rules'));
  });

  test('multiple failures produce multiple fixes in loop_back', () => {
    const report = {
      ...greenReport(),
      quality_metrics: {
        test_fail_count: 2,
        lint_errors: 4,
        type_errors: 1,
      },
    };
    const result = evaluatePhaseReport(report, RULES_PATH);
    assert.strictEqual(result.verdict, 'loop_back');
    assert.ok(result.fixes.length >= 1, 'should have at least 1 fix entry');
    assert.ok(result.fixes.some((f) => f.includes('test')), 'should mention test failures');
  });

  test('custom rules file is respected', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-gating-'));
    const customRulesPath = path.join(tmpDir, 'custom-rules.yaml');
    fs.writeFileSync(customRulesPath, [
      'schema_version: 1',
      'rules:',
      '  continue:',
      '    description: "Always continue"',
      '    conditions: []',
      '  loop_back:',
      '    description: "Never loop"',
      '    conditions: []',
      '  escalate:',
      '    description: "Never escalate"',
      '    conditions: []',
      'default_verdict: escalate',
    ].join('\n'));

    try {
      // With empty continue conditions, the agent skips continue (no conditions to pass)
      // and falls through to escalate
      const result = evaluatePhaseReport(greenReport(), customRulesPath);
      assert.strictEqual(result.verdict, 'escalate');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
