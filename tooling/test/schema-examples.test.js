import { describe, test } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readJsonFile, readYamlFile } from '../src/loaders.js';
import { validateAgainstSchema } from '../src/schema-validator.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const EXAMPLE_CASES = [
  ['templates/examples/wazir-manifest.example.yaml', 'schemas/wazir-manifest.schema.json', 'yaml'],
  ['templates/examples/run-manifest.example.json', 'schemas/run-manifest.schema.json', 'json'],
  ['templates/examples/clarification.example.json', 'schemas/clarification.schema.json', 'json'],
  ['templates/examples/research.example.json', 'schemas/research.schema.json', 'json'],
  ['templates/examples/spec.example.json', 'schemas/spec.schema.json', 'json'],
  ['templates/examples/spec-challenge.example.json', 'schemas/spec-challenge.schema.json', 'json'],
  ['templates/examples/implementation-plan.example.json', 'schemas/implementation-plan.schema.json', 'json'],
  ['templates/examples/verification-proof.example.json', 'schemas/verification-proof.schema.json', 'json'],
  ['templates/examples/review.example.json', 'schemas/review.schema.json', 'json'],
  ['templates/examples/proposed-learning.example.json', 'schemas/proposed-learning.schema.json', 'json'],
  ['templates/examples/accepted-learning.example.json', 'schemas/accepted-learning.schema.json', 'json'],
  ['templates/examples/host-export-package.example.json', 'schemas/host-export-package.schema.json', 'json'],
  ['templates/examples/export-manifest.example.json', 'schemas/export-manifest.schema.json', 'json'],
  ['templates/examples/docs-claim.example.json', 'schemas/docs-claim.schema.json', 'json'],
  ['templates/examples/author.example.json', 'schemas/author-artifact.schema.json', 'json'],
  ['templates/examples/phase-report.example.json', 'schemas/phase-report.schema.json', 'json'],
];

function loadExample(examplePath, kind) {
  const absolutePath = path.join(ROOT, examplePath);
  return kind === 'yaml' ? readYamlFile(absolutePath) : readJsonFile(absolutePath);
}

// --- Config v2 schema tests ---

const CONFIG_SCHEMA_PATH = path.join(ROOT, 'schemas/config.schema.json');

const VALID_SINGLE = {
  config_version: 2,
  initialized_at: '2026-03-26T15:00:00Z',
  model_mode: 'single',
  interaction_mode: 'guided',
  context_mode: { enabled: true, has_execute_file: true },
  detected: { host: 'claude', stack: { language: 'javascript', framework: null, stack: ['node'] }, git: true },
};

const VALID_MULTI_MODEL = {
  ...VALID_SINGLE,
  model_mode: 'multi-model',
  multi_model: { routing: { mechanical: 'haiku', comprehension: 'sonnet', judgment: 'opus' } },
};

const VALID_MULTI_TOOL = {
  ...VALID_SINGLE,
  model_mode: 'multi-tool',
  multi_tool: { tools: ['codex'], codex: { model: 'gpt-5.4' } },
};

describe('config v2 schema — positive cases', () => {
  const schema = readJsonFile(CONFIG_SCHEMA_PATH);

  test('validates single model config', () => {
    const result = validateAgainstSchema(schema, VALID_SINGLE);
    assert.strictEqual(result.valid, true, result.errors.join('\n'));
  });

  test('validates multi-model config', () => {
    const result = validateAgainstSchema(schema, VALID_MULTI_MODEL);
    assert.strictEqual(result.valid, true, result.errors.join('\n'));
  });

  test('validates multi-tool config', () => {
    const result = validateAgainstSchema(schema, VALID_MULTI_TOOL);
    assert.strictEqual(result.valid, true, result.errors.join('\n'));
  });

  test('validates multi-tool with both codex and gemini', () => {
    const both = {
      ...VALID_SINGLE,
      model_mode: 'multi-tool',
      multi_tool: { tools: ['codex', 'gemini'], codex: { model: 'gpt-5.4' }, gemini: { model: 'gemini-2.5-pro' } },
    };
    const result = validateAgainstSchema(schema, both);
    assert.strictEqual(result.valid, true, result.errors.join('\n'));
  });
});

describe('config v2 schema — negative cases', () => {
  const schema = readJsonFile(CONFIG_SCHEMA_PATH);

  test('rejects v1 config (no config_version, has default_depth)', () => {
    const v1 = { model_mode: 'claude-only', default_depth: 'standard', default_intent: 'feature', auto_initialized: true };
    const result = validateAgainstSchema(schema, v1);
    assert.strictEqual(result.valid, false);
  });

  test('rejects deprecated model_mode claude-only', () => {
    const bad = { ...VALID_SINGLE, model_mode: 'claude-only' };
    const result = validateAgainstSchema(schema, bad);
    assert.strictEqual(result.valid, false);
  });

  test('rejects stale v1 fields via additionalProperties', () => {
    const bad = { ...VALID_SINGLE, default_depth: 'standard' };
    const result = validateAgainstSchema(schema, bad);
    assert.strictEqual(result.valid, false);
  });

  test('rejects multi-model without multi_model block', () => {
    const bad = { ...VALID_SINGLE, model_mode: 'multi-model' };
    const result = validateAgainstSchema(schema, bad);
    assert.strictEqual(result.valid, false);
  });

  test('rejects multi-tool without multi_tool block', () => {
    const bad = { ...VALID_SINGLE, model_mode: 'multi-tool' };
    const result = validateAgainstSchema(schema, bad);
    assert.strictEqual(result.valid, false);
  });

  test('allows single with optional multi_tool block (schema does not forbid extra blocks)', () => {
    // Design doc says "only present when mode matches" as a write-time rule.
    // Schema enforces the required direction (must have block when mode matches)
    // but does not forbid extra defined properties — JSON Schema limitation.
    const extra = { ...VALID_SINGLE, multi_tool: { tools: ['codex'], codex: { model: 'gpt-5.4' } } };
    const result = validateAgainstSchema(schema, extra);
    assert.strictEqual(result.valid, true);
  });
});

// --- Existing example-based schema tests ---

describe('schema-backed examples', () => {
  for (const [examplePath, schemaPath, kind] of EXAMPLE_CASES) {
    test(`${examplePath} validates against ${schemaPath}`, () => {
      const schema = readJsonFile(path.join(ROOT, schemaPath));
      const example = loadExample(examplePath, kind);
      const result = validateAgainstSchema(schema, example);

      assert.strictEqual(result.valid, true, result.errors.join('\n'));
    });
  }
});
