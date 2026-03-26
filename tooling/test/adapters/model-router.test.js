import { describe, test } from 'node:test';
import assert from 'node:assert';

import { getModelForTask, isMultiModelEnabled, getRoutingTable } from '../../src/adapters/model-router.js';

describe('model-router', () => {
  const multiModelConfig = { model_mode: 'multi-model' };

  describe('getModelForTask', () => {
    test('returns correct model for haiku tasks', () => {
      const haikuTasks = ['fetch-url', 'write-handoff', 'compress-archive'];
      for (const task of haikuTasks) {
        const result = getModelForTask(task, multiModelConfig);
        assert.strictEqual(result.model, 'haiku', `${task} should route to haiku`);
        assert.strictEqual(result.overridden, false);
        assert.ok(result.reason.length > 0, 'should have a reason');
      }
    });

    test('returns correct model for sonnet tasks', () => {
      const sonnetTasks = [
        'read-summarize', 'write-implementation', 'task-review',
        'extract-learnings', 'internal-review', 'run-tests',
      ];
      for (const task of sonnetTasks) {
        const result = getModelForTask(task, multiModelConfig);
        assert.strictEqual(result.model, 'sonnet', `${task} should route to sonnet`);
        assert.strictEqual(result.overridden, false);
        assert.ok(result.reason.length > 0, 'should have a reason');
      }
    });

    test('returns correct model for opus tasks', () => {
      const opusTasks = [
        'orchestrate', 'spec-harden', 'design',
        'final-review', 'brainstorm', 'plan',
      ];
      for (const task of opusTasks) {
        const result = getModelForTask(task, multiModelConfig);
        assert.strictEqual(result.model, 'opus', `${task} should route to opus`);
        assert.strictEqual(result.overridden, false);
        assert.ok(result.reason.length > 0, 'should have a reason');
      }
    });

    test('unknown task type returns opus as safe default', () => {
      const result = getModelForTask('unknown-task-xyz', multiModelConfig);
      assert.strictEqual(result.model, 'opus');
      assert.strictEqual(result.overridden, false);
      assert.ok(result.reason.includes('Unknown'), 'reason should mention unknown');
    });

    test('multi-model disabled returns inherit', () => {
      const disabledConfigs = [
        { model_mode: 'single' },
        { model_mode: 'multi-tool' },
        { model_mode: 'claude-only' }, // legacy value — degrades to "not multi-model"
        {},
      ];
      for (const config of disabledConfigs) {
        const result = getModelForTask('fetch-url', config);
        assert.strictEqual(result.model, 'inherit', `model_mode=${config.model_mode} should return inherit`);
        assert.strictEqual(result.overridden, false);
        assert.ok(result.reason.includes('not enabled'), 'reason should say not enabled');
      }
    });

    test('config overrides take precedence over default table', () => {
      const config = {
        model_mode: 'multi-model',
        model_overrides: {
          'fetch-url': { model: 'sonnet', reason: 'Project-specific: complex fetch logic' },
        },
      };
      const result = getModelForTask('fetch-url', config);
      assert.strictEqual(result.model, 'sonnet');
      assert.strictEqual(result.reason, 'Project-specific: complex fetch logic');
      assert.strictEqual(result.overridden, true);
    });

    test('config overrides do not affect non-overridden tasks', () => {
      const config = {
        model_mode: 'multi-model',
        model_overrides: {
          'fetch-url': { model: 'sonnet', reason: 'Override' },
        },
      };
      const result = getModelForTask('write-handoff', config);
      assert.strictEqual(result.model, 'haiku');
      assert.strictEqual(result.overridden, false);
    });

    test('config override with missing model falls back to opus', () => {
      const config = {
        model_mode: 'multi-model',
        model_overrides: {
          'fetch-url': { reason: 'No model specified' },
        },
      };
      const result = getModelForTask('fetch-url', config);
      assert.strictEqual(result.model, 'opus');
      assert.strictEqual(result.overridden, true);
    });

    test('config override with missing reason uses default reason', () => {
      const config = {
        model_mode: 'multi-model',
        model_overrides: {
          'fetch-url': { model: 'sonnet' },
        },
      };
      const result = getModelForTask('fetch-url', config);
      assert.strictEqual(result.model, 'sonnet');
      assert.strictEqual(result.reason, 'Config override');
      assert.strictEqual(result.overridden, true);
    });

    test('no config argument defaults to disabled', () => {
      const result = getModelForTask('fetch-url');
      assert.strictEqual(result.model, 'inherit');
    });
  });

  describe('isMultiModelEnabled', () => {
    test('returns true when model_mode is multi-model', () => {
      assert.strictEqual(isMultiModelEnabled({ model_mode: 'multi-model' }), true);
    });

    test('returns false for other modes', () => {
      assert.strictEqual(isMultiModelEnabled({ model_mode: 'single' }), false);
      assert.strictEqual(isMultiModelEnabled({ model_mode: 'multi-tool' }), false);
      assert.strictEqual(isMultiModelEnabled({}), false);
    });

    test('returns false with no argument', () => {
      assert.strictEqual(isMultiModelEnabled(), false);
    });
  });

  describe('getRoutingTable', () => {
    test('returns full table with all expected task types', () => {
      const table = getRoutingTable();
      const expectedTasks = [
        'fetch-url', 'write-handoff', 'compress-archive',
        'read-summarize', 'write-implementation', 'task-review',
        'extract-learnings', 'internal-review', 'run-tests',
        'orchestrate', 'spec-harden', 'design',
        'final-review', 'brainstorm', 'plan',
      ];
      for (const task of expectedTasks) {
        assert.ok(table[task], `routing table should contain ${task}`);
        assert.ok(table[task].model, `${task} should have a model`);
        assert.ok(table[task].reason, `${task} should have a reason`);
      }
    });

    test('returns a copy — mutations do not affect the original', () => {
      const table1 = getRoutingTable();
      table1['fetch-url'].model = 'changed';
      const table2 = getRoutingTable();
      assert.strictEqual(table2['fetch-url'].model, 'haiku', 'original table should not be mutated');
    });
  });
});
