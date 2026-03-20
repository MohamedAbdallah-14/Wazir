import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  validateClarifyComplete,
  validateExecuteComplete,
  validateVerifyComplete,
  validateReviewComplete,
  runGuardrail,
} from '../../src/guards/guardrail-functions.js';

describe('guardrail-functions', () => {
  let runDir;

  beforeEach(() => {
    runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guardrail-test-'));
    fs.mkdirSync(path.join(runDir, 'clarified'), { recursive: true });
    fs.mkdirSync(path.join(runDir, 'artifacts'), { recursive: true });
    fs.mkdirSync(path.join(runDir, 'reviews'), { recursive: true });
    fs.mkdirSync(path.join(runDir, 'tasks'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  describe('validateClarifyComplete', () => {
    it('fails when no artifacts exist', () => {
      const result = validateClarifyComplete({}, runDir);
      assert.equal(result.passed, false);
      assert.ok(result.missing.length > 0);
    });

    it('passes when all 4 artifacts exist', () => {
      for (const name of ['clarification.md', 'spec-hardened.md', 'design.md', 'execution-plan.md']) {
        fs.writeFileSync(path.join(runDir, 'clarified', name), '# Content');
      }
      const result = validateClarifyComplete({}, runDir);
      assert.equal(result.passed, true);
    });

    it('fails when one artifact is missing', () => {
      for (const name of ['clarification.md', 'spec-hardened.md', 'design.md']) {
        fs.writeFileSync(path.join(runDir, 'clarified', name), '# Content');
      }
      const result = validateClarifyComplete({}, runDir);
      assert.equal(result.passed, false);
      assert.ok(result.missing.includes('clarified/execution-plan.md'));
    });

    it('fails when artifact is empty', () => {
      for (const name of ['clarification.md', 'spec-hardened.md', 'design.md', 'execution-plan.md']) {
        fs.writeFileSync(path.join(runDir, 'clarified', name), name === 'design.md' ? '' : '# Content');
      }
      const result = validateClarifyComplete({}, runDir);
      assert.equal(result.passed, false);
      assert.ok(result.missing.includes('clarified/design.md'));
    });
  });

  describe('validateExecuteComplete', () => {
    it('fails when no task artifacts exist', () => {
      // Write a plan with 2 tasks
      fs.writeFileSync(
        path.join(runDir, 'clarified', 'execution-plan.md'),
        '| 1 | Task A |\n| 2 | Task B |',
      );
      const result = validateExecuteComplete({}, runDir);
      assert.equal(result.passed, false);
    });

    it('passes when task dirs and verification proof exist', () => {
      fs.mkdirSync(path.join(runDir, 'artifacts', 'task-001'), { recursive: true });
      fs.writeFileSync(path.join(runDir, 'artifacts', 'task-001', 'result.md'), '# Done');
      fs.writeFileSync(path.join(runDir, 'artifacts', 'verification-proof.md'), '# Proof');
      const result = validateExecuteComplete({}, runDir);
      assert.equal(result.passed, true);
    });

    it('fails when verification proof missing', () => {
      fs.mkdirSync(path.join(runDir, 'artifacts', 'task-001'), { recursive: true });
      fs.writeFileSync(path.join(runDir, 'artifacts', 'task-001', 'result.md'), '# Done');
      const result = validateExecuteComplete({}, runDir);
      assert.equal(result.passed, false);
      assert.ok(result.missing.includes('artifacts/verification-proof.md'));
    });
  });

  describe('validateVerifyComplete', () => {
    it('fails when no proof exists', () => {
      const result = validateVerifyComplete({}, runDir);
      assert.equal(result.passed, false);
    });

    it('passes when proof with evidence exists', () => {
      fs.writeFileSync(
        path.join(runDir, 'artifacts', 'verification-proof.md'),
        '# Proof\n\n## Evidence\n- test passed\n- lint clean',
      );
      const result = validateVerifyComplete({}, runDir);
      assert.equal(result.passed, true);
    });

    it('fails when proof is empty', () => {
      fs.writeFileSync(path.join(runDir, 'artifacts', 'verification-proof.md'), '');
      const result = validateVerifyComplete({}, runDir);
      assert.equal(result.passed, false);
    });
  });

  describe('validateReviewComplete', () => {
    it('fails when no review exists', () => {
      const result = validateReviewComplete({}, runDir);
      assert.equal(result.passed, false);
    });

    it('passes when verdict.json exists with score', () => {
      fs.writeFileSync(
        path.join(runDir, 'reviews', 'verdict.json'),
        JSON.stringify({ score: 58, verdict: 'PASS' }),
      );
      const result = validateReviewComplete({}, runDir);
      assert.equal(result.passed, true);
    });

    it('fails when verdict has no score', () => {
      fs.writeFileSync(
        path.join(runDir, 'reviews', 'verdict.json'),
        JSON.stringify({ verdict: 'PASS' }),
      );
      const result = validateReviewComplete({}, runDir);
      assert.equal(result.passed, false);
    });
  });

  describe('runGuardrail', () => {
    it('dispatches to correct validator', () => {
      const result = runGuardrail('clarify', {}, runDir);
      assert.equal(result.passed, false); // no artifacts
    });

    it('throws for unknown phase', () => {
      assert.throws(() => runGuardrail('unknown', {}, runDir), /Unknown phase/);
    });
  });
});
