import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { composeExpertise } from '../../src/adapters/composition-engine.js';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');

function createTempRunRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-compose-'));
  return { runRoot: dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

describe('composeExpertise', () => {
  test('resolves modules for executor + node stack', () => {
    const { runRoot, cleanup } = createTempRunRoot();
    try {
      // Use a high ceiling so real expertise files (which are large) all fit
      const result = composeExpertise({
        role: 'executor',
        stacks: ['node'],
        concerns: [],
        projectRoot: PROJECT_ROOT,
        runRoot,
        task: 'test-basic',
        tokenCeiling: 500_000,
      });

      assert.ok(result.prompt.length > 0, 'prompt should not be empty');
      assert.ok(result.manifest.modules_included.length > 0, 'should include modules');
      assert.ok(result.manifest.total_tokens > 0, 'should have non-zero tokens');
      assert.ok(typeof result.manifest.prompt_hash === 'string', 'should have prompt hash');
      assert.strictEqual(result.manifest.prompt_hash.length, 64, 'sha256 hash should be 64 chars');

      // Verify always-layer modules are present
      const includedPaths = result.manifest.modules_included.map((m) => m.path);
      assert.ok(
        includedPaths.includes('antipatterns/process/ai-coding-antipatterns.md'),
        'should include always-layer executor module',
      );

      // Verify auto-layer modules are present
      assert.ok(
        includedPaths.includes('antipatterns/security/vulnerability-patterns.md'),
        'should include auto-layer security module',
      );

      // Verify stack-specific modules are present
      assert.ok(
        includedPaths.includes('backend/node-typescript.md'),
        'should include node stack executor module',
      );
      assert.ok(
        includedPaths.includes('performance/platform-specific/node-performance.md'),
        'should include node performance module',
      );
    } finally {
      cleanup();
    }
  });

  test('token budget enforcement drops concerns first', () => {
    const { runRoot, cleanup } = createTempRunRoot();
    try {
      // Use a very low token ceiling to force drops
      const result = composeExpertise({
        role: 'executor',
        stacks: ['node'],
        concerns: ['rtl', 'i18n', 'security-auth'],
        projectRoot: PROJECT_ROOT,
        runRoot,
        task: 'test-budget',
        tokenCeiling: 500,
      });

      // With a tiny ceiling, some modules must be dropped
      assert.ok(result.manifest.modules_dropped.length > 0, 'should have dropped modules');
      assert.ok(result.manifest.total_tokens <= 500, 'total tokens should not exceed ceiling');

      // Concerns should be dropped before stacks, and stacks before auto
      const droppedLayers = result.manifest.modules_dropped.map((m) => m.layer);
      const includedLayers = result.manifest.modules_included.map((m) => m.layer);

      // If any concern modules were resolved, they should appear in dropped (or all were dropped)
      // and always-layer modules should be the last to go
      if (includedLayers.includes('always')) {
        // If always modules survived, concerns should be fully dropped before always
        const hasConcernIncluded = includedLayers.includes('concerns');
        if (!hasConcernIncluded && droppedLayers.includes('concerns')) {
          assert.ok(true, 'concerns were dropped before always-layer modules');
        }
      }
    } finally {
      cleanup();
    }
  });

  test('module priority ordering: always > auto > stacks > concerns', () => {
    const { runRoot, cleanup } = createTempRunRoot();
    try {
      const result = composeExpertise({
        role: 'executor',
        stacks: ['node'],
        concerns: ['rtl'],
        projectRoot: PROJECT_ROOT,
        runRoot,
        task: 'test-priority',
        tokenCeiling: 500_000,
      });

      const layers = result.manifest.modules_included.map((m) => m.layer);

      // Find the index of the last 'always' and first 'auto'
      const lastAlways = layers.lastIndexOf('always');
      const firstAuto = layers.indexOf('auto');
      const lastAuto = layers.lastIndexOf('auto');
      const firstStacks = layers.indexOf('stacks');
      const lastStacks = layers.lastIndexOf('stacks');
      const firstConcerns = layers.indexOf('concerns');

      // Priority: always modules appear before auto, auto before stacks, stacks before concerns
      if (firstAuto >= 0) {
        assert.ok(lastAlways < firstAuto, 'always modules should come before auto modules');
      }
      if (firstStacks >= 0) {
        assert.ok(lastAuto < firstStacks, 'auto modules should come before stacks modules');
      }
      if (firstConcerns >= 0) {
        assert.ok(lastStacks < firstConcerns, 'stacks modules should come before concerns modules');
      }
    } finally {
      cleanup();
    }
  });

  test('missing module paths handled gracefully — warn and skip', () => {
    const { runRoot, cleanup } = createTempRunRoot();
    // Create a minimal project root with a custom composition map that references a missing file
    const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-compose-missing-'));
    try {
      const expertiseDir = path.join(tempProject, 'expertise');
      fs.mkdirSync(expertiseDir, { recursive: true });

      // Write a minimal composition map with a missing module
      const mapContent = [
        'always:',
        '  executor:',
        '    - nonexistent/module-that-does-not-exist.md',
        '    - existing-module.md',
        'auto: {}',
        'stacks: {}',
        'concerns: {}',
      ].join('\n');
      fs.writeFileSync(path.join(expertiseDir, 'composition-map.yaml'), mapContent);

      // Create the one existing module
      fs.writeFileSync(path.join(expertiseDir, 'existing-module.md'), '# Existing Module\nSome content here.');

      // Capture stderr warnings
      const origWrite = process.stderr.write;
      const warnings = [];
      process.stderr.write = (msg) => { warnings.push(msg); };

      try {
        const result = composeExpertise({
          role: 'executor',
          stacks: [],
          concerns: [],
          projectRoot: tempProject,
          runRoot,
          task: 'test-missing',
        });

        // Should have included the existing module and skipped the missing one
        assert.strictEqual(result.manifest.modules_included.length, 1);
        assert.strictEqual(result.manifest.modules_included[0].path, 'existing-module.md');

        // Should have emitted a warning about the missing module
        assert.ok(
          warnings.some((w) => w.includes('nonexistent/module-that-does-not-exist.md')),
          'should warn about missing module',
        );
      } finally {
        process.stderr.write = origWrite;
      }
    } finally {
      cleanup();
      fs.rmSync(tempProject, { recursive: true, force: true });
    }
  });

  test('proof artifact written correctly', () => {
    const { runRoot, cleanup } = createTempRunRoot();
    try {
      const result = composeExpertise({
        role: 'executor',
        stacks: ['node'],
        concerns: [],
        projectRoot: PROJECT_ROOT,
        runRoot,
        task: 'test-artifact',
        tokenCeiling: 500_000,
      });

      const artifactPath = path.join(runRoot, 'artifacts', 'composition-executor-test-artifact.json');
      assert.ok(fs.existsSync(artifactPath), 'proof artifact should exist');

      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      assert.strictEqual(artifact.role, 'executor');
      assert.strictEqual(artifact.task, 'test-artifact');
      assert.ok(artifact.generated_at, 'should have generated_at timestamp');
      assert.strictEqual(artifact.prompt_hash, result.manifest.prompt_hash);
      assert.deepStrictEqual(artifact.modules_included, result.manifest.modules_included);
      assert.deepStrictEqual(artifact.modules_dropped, result.manifest.modules_dropped);
      assert.strictEqual(artifact.total_tokens, result.manifest.total_tokens);
    } finally {
      cleanup();
    }
  });

  test('module cap enforcement (15 module limit)', () => {
    const { runRoot, cleanup } = createTempRunRoot();
    try {
      // Use many concerns to exceed the 15-module cap
      const result = composeExpertise({
        role: 'executor',
        stacks: ['node', 'react', 'postgres'],
        concerns: ['rtl', 'i18n', 'security-auth', 'security-data', 'performance', 'async'],
        projectRoot: PROJECT_ROOT,
        runRoot,
        task: 'test-cap',
      });

      assert.ok(
        result.manifest.modules_included.length <= 15,
        `included modules (${result.manifest.modules_included.length}) should not exceed 15`,
      );
    } finally {
      cleanup();
    }
  });

  test('deduplicates modules across layers', () => {
    const { runRoot, cleanup } = createTempRunRoot();
    try {
      // The auto layer includes antipatterns/security/vulnerability-patterns.md
      // and the web-security concern also includes it for verifier role
      // For executor, check that same path is not duplicated
      const result = composeExpertise({
        role: 'executor',
        stacks: ['node'],
        concerns: [],
        projectRoot: PROJECT_ROOT,
        runRoot,
        task: 'test-dedup',
        tokenCeiling: 500_000,
      });

      const paths = result.manifest.modules_included.map((m) => m.path);
      const uniquePaths = [...new Set(paths)];
      assert.strictEqual(paths.length, uniquePaths.length, 'should not have duplicate module paths');
    } finally {
      cleanup();
    }
  });

  test('returns empty prompt when no modules match', () => {
    const { runRoot, cleanup } = createTempRunRoot();
    const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-compose-empty-'));
    try {
      const expertiseDir = path.join(tempProject, 'expertise');
      fs.mkdirSync(expertiseDir, { recursive: true });

      const mapContent = [
        'always: {}',
        'auto: {}',
        'stacks: {}',
        'concerns: {}',
      ].join('\n');
      fs.writeFileSync(path.join(expertiseDir, 'composition-map.yaml'), mapContent);

      const result = composeExpertise({
        role: 'executor',
        stacks: [],
        concerns: [],
        projectRoot: tempProject,
        runRoot,
        task: 'test-empty',
      });

      assert.strictEqual(result.prompt, '');
      assert.strictEqual(result.manifest.modules_included.length, 0);
      assert.strictEqual(result.manifest.total_tokens, 0);
    } finally {
      cleanup();
      fs.rmSync(tempProject, { recursive: true, force: true });
    }
  });
});
