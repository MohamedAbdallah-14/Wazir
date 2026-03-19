import { describe, test } from 'node:test';
import assert from 'node:assert';

import { evaluateScopeCoverageGuard } from '../../src/guards/phase-prerequisite-guard.js';

describe('evaluateScopeCoverageGuard', () => {
  test('allows when plan_count >= input_count', () => {
    const result = evaluateScopeCoverageGuard({
      input_item_count: 5,
      plan_task_count: 7,
    });
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.input_count, 5);
    assert.strictEqual(result.plan_count, 7);
  });

  test('allows when plan_count equals input_count', () => {
    const result = evaluateScopeCoverageGuard({
      input_item_count: 10,
      plan_task_count: 10,
    });
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.input_count, 10);
    assert.strictEqual(result.plan_count, 10);
  });

  test('blocks when plan_count < input_count without user approval', () => {
    const result = evaluateScopeCoverageGuard({
      input_item_count: 10,
      plan_task_count: 5,
    });
    assert.strictEqual(result.allowed, false);
    assert.match(result.reason, /scope reduction detected/i);
    assert.strictEqual(result.input_count, 10);
    assert.strictEqual(result.plan_count, 5);
  });

  test('allows when plan_count < input_count with user approval', () => {
    const result = evaluateScopeCoverageGuard({
      input_item_count: 10,
      plan_task_count: 5,
      user_approved_reduction: true,
    });
    assert.strictEqual(result.allowed, true);
    assert.match(result.reason, /user explicitly approved/i);
    assert.strictEqual(result.input_count, 10);
    assert.strictEqual(result.plan_count, 5);
  });

  test('blocks when user_approved_reduction is false', () => {
    const result = evaluateScopeCoverageGuard({
      input_item_count: 8,
      plan_task_count: 3,
      user_approved_reduction: false,
    });
    assert.strictEqual(result.allowed, false);
    assert.match(result.reason, /scope reduction detected/i);
  });

  test('allows when both counts are zero (edge case)', () => {
    const result = evaluateScopeCoverageGuard({
      input_item_count: 0,
      plan_task_count: 0,
    });
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.input_count, 0);
    assert.strictEqual(result.plan_count, 0);
  });

  test('allows when input_count is zero and plan has tasks', () => {
    const result = evaluateScopeCoverageGuard({
      input_item_count: 0,
      plan_task_count: 3,
    });
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.input_count, 0);
    assert.strictEqual(result.plan_count, 3);
  });

  test('defaults undefined counts to zero', () => {
    const result = evaluateScopeCoverageGuard({});
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.input_count, 0);
    assert.strictEqual(result.plan_count, 0);
  });
});
