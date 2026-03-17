import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';

// We test the core logic by mocking execFileSync
import { checkDocsDrift, DOC_PAIRS } from '../src/checks/docs-drift.js';

describe('docs-drift detection', () => {
  test('DOC_PAIRS is a non-empty array of { source, doc } objects', () => {
    assert.ok(Array.isArray(DOC_PAIRS), 'DOC_PAIRS must be an array');
    assert.ok(DOC_PAIRS.length > 0, 'DOC_PAIRS must not be empty');
    for (const pair of DOC_PAIRS) {
      assert.ok(typeof pair.source === 'string', `source must be a string: ${JSON.stringify(pair)}`);
      assert.ok(typeof pair.doc === 'string', `doc must be a string: ${JSON.stringify(pair)}`);
    }
  });

  test('reports drift when source changed but doc did not', () => {
    const changedFiles = ['roles/executor.md'];
    const result = checkDocsDrift(changedFiles);
    assert.ok(result.drifted.length > 0, 'must report drift');
    const entry = result.drifted.find(d => d.doc === 'docs/reference/roles-reference.md');
    assert.ok(entry, 'must report drift for roles-reference.md');
  });

  test('reports no drift when source and doc both changed', () => {
    const changedFiles = ['roles/executor.md', 'docs/reference/roles-reference.md'];
    const result = checkDocsDrift(changedFiles);
    const entry = result.drifted.find(d => d.doc === 'docs/reference/roles-reference.md');
    assert.ok(!entry, 'must not report drift when doc also changed');
  });

  test('reports no drift when only non-mapped files changed', () => {
    const changedFiles = ['README.md', 'package.json', '.github/workflows/ci.yml'];
    const result = checkDocsDrift(changedFiles);
    assert.strictEqual(result.drifted.length, 0, 'must report no drift for unmapped files');
  });

  test('reports drift for multiple pairs', () => {
    const changedFiles = ['roles/executor.md', 'skills/design/SKILL.md'];
    const result = checkDocsDrift(changedFiles);
    assert.ok(result.drifted.length >= 2, 'must report drift for multiple doc targets');
    const rolesEntry = result.drifted.find(d => d.doc === 'docs/reference/roles-reference.md');
    const skillsEntry = result.drifted.find(d => d.doc === 'docs/reference/skills.md');
    assert.ok(rolesEntry, 'must report drift for roles-reference.md');
    assert.ok(skillsEntry, 'must report drift for skills.md');
  });

  test('ignores unknown source paths silently', () => {
    const changedFiles = ['unknown/path/file.js', 'another/random.md'];
    const result = checkDocsDrift(changedFiles);
    assert.strictEqual(result.drifted.length, 0, 'must ignore unknown paths');
  });

  test('workflows/ changes map to roles-and-workflows.md', () => {
    const changedFiles = ['workflows/execute.md'];
    const result = checkDocsDrift(changedFiles);
    const entry = result.drifted.find(d => d.doc === 'docs/concepts/roles-and-workflows.md');
    assert.ok(entry, 'must report drift for roles-and-workflows.md on workflow changes');
  });

  test('hooks/definitions/ changes map to hooks.md', () => {
    const changedFiles = ['hooks/definitions/session_start.yaml'];
    const result = checkDocsDrift(changedFiles);
    const entry = result.drifted.find(d => d.doc === 'docs/reference/hooks.md');
    assert.ok(entry, 'must report drift for hooks.md on hook definition changes');
  });
});

describe('docs-drift CLI integration', () => {
  test('validate docs-drift subcommand is recognized', async () => {
    const { runValidateCommand } = await import('../src/commands/validate.js');
    const result = runValidateCommand(
      { subcommand: 'docs-drift', args: ['--base', 'HEAD', '--head', 'HEAD'] },
      { cwd: process.cwd() },
    );
    // Should not return "unknown validator" error
    assert.notStrictEqual(result.exitCode, 1);
    assert.ok(
      !result.stderr || !result.stderr.includes('Unknown validator'),
      'docs-drift must be a recognized subcommand',
    );
  });

  test('validate docs-drift is in the command registry', async () => {
    const { SUPPORTED_COMMAND_SUBJECTS } = await import('../src/checks/command-registry.js');
    assert.ok(
      SUPPORTED_COMMAND_SUBJECTS.has('wazir validate docs-drift'),
      'command registry must include wazir validate docs-drift',
    );
  });
});
