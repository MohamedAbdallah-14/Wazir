import { describe, test } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

function runHook(scriptName, payload, env) {
  const scriptPath = path.join(ROOT, 'hooks', scriptName);
  const opts = {
    encoding: 'utf8',
    input: JSON.stringify(payload),
    cwd: ROOT,
  };

  if (env) {
    opts.env = { ...process.env, ...env };
  }

  const result = spawnSync(scriptPath, [], opts);

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function createGuardFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-guards-'));
  const stateRoot = path.join(fixtureRoot, '.state-root');

  fs.mkdirSync(path.join(fixtureRoot, 'input'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, 'exports', 'hosts', 'claude'), { recursive: true });
  fs.mkdirSync(path.join(stateRoot, 'runs', 'run-1'), { recursive: true });

  const manifest = {
    manifest_version: 2,
    project: {
      name: 'fixture-guards',
      display_name: 'Fixture Guards',
      version: '0.1.0',
      description: 'Fixture manifest for guard hook tests.',
      license: 'MIT',
    },
    versioning_policy: {
      strategy: 'semver',
      stability: 'pre-1.0-alpha',
      compatibility: 'additive_changes_only_until_manifest_bump',
    },
    paths: {
      input: 'input',
      artifacts_repo: 'artifacts',
      roles: 'roles',
      workflows: 'workflows',
      skills: 'skills',
      hooks: 'hooks',
      templates: 'templates',
      schemas: 'schemas',
      expertise: 'expertise',
      docs: 'docs',
      exports: 'exports',
      tooling: 'tooling',
      memory: 'memory',
      examples: 'examples',
      archive: 'archive',
      state_root_default: '~/.wazir/projects/{project_slug}',
    },
    hosts: ['claude'],
    workflows: ['clarify'],
    phases: ['clarify'],
    roles: ['clarifier'],
    export_targets: ['claude'],
    required_hooks: ['protected_path_write_guard', 'loop_cap_guard'],
    protected_paths: ['input', 'exports/hosts'],
    prohibited_terms: ['banned-term'],
    adapters: {
      context_mode: {
        enabled_by_default: false,
        required: false,
        install_mode: 'external',
        package_presence: 'optional',
      },
    },
    index: {
      core_parsers: [],
      optional_language_plugins: [],
    },
    validation_checks: [],
  };

  fs.writeFileSync(
    path.join(fixtureRoot, 'wazir.manifest.yaml'),
    JSON.stringify(manifest, null, 2),
  );

  fs.writeFileSync(
    path.join(stateRoot, 'runs', 'run-1', 'status.json'),
    JSON.stringify({
      run_id: 'run-1',
      phase_loop_counts: {
        review: 2,
        verify: 1,
      },
    }, null, 2),
  );

  return {
    fixtureRoot,
    stateRoot,
    cleanup() {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    },
  };
}

describe('protected-path-write-guard hook', () => {
  test('blocks writes into protected canonical paths', () => {
    const fixture = createGuardFixture();

    try {
      const result = runHook('protected-path-write-guard', {
        project_root: fixture.fixtureRoot,
        target_path: 'input/brief.md',
      });

      assert.strictEqual(result.exitCode, 42);
      const output = JSON.parse(result.stdout);
      assert.strictEqual(output.guard_decision.allowed, false);
    } finally {
      fixture.cleanup();
    }
  });

  test('allows writes outside protected paths', () => {
    const fixture = createGuardFixture();

    try {
      const result = runHook('protected-path-write-guard', {
        project_root: fixture.fixtureRoot,
        target_path: 'notes/scratch.md',
      });

      assert.strictEqual(result.exitCode, 0);
      const output = JSON.parse(result.stdout);
      assert.strictEqual(output.guard_decision.allowed, true);
    } finally {
      fixture.cleanup();
    }
  });

  test('allows approved regeneration flows for protected export targets', () => {
    const fixture = createGuardFixture();

    try {
      const result = runHook('protected-path-write-guard', {
        project_root: fixture.fixtureRoot,
        target_path: 'exports/hosts/claude/AGENTS.md',
        approved_flow: 'host_export_regeneration',
      });

      assert.strictEqual(result.exitCode, 0);
      const output = JSON.parse(result.stdout);
      assert.strictEqual(output.guard_decision.allowed, true);
    } finally {
      fixture.cleanup();
    }
  });

  test('allows pipeline_integration flow to write to roles/', () => {
    const fixture = createGuardFixture();

    // Add roles to protected_paths for the fixture
    const manifestPath = path.join(fixture.fixtureRoot, 'wazir.manifest.yaml');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.protected_paths.push('roles');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    try {
      const result = runHook('protected-path-write-guard', {
        project_root: fixture.fixtureRoot,
        target_path: 'roles/executor.md',
        approved_flow: 'pipeline_integration',
      });

      assert.strictEqual(result.exitCode, 0);
      const output = JSON.parse(result.stdout);
      assert.strictEqual(output.guard_decision.allowed, true);
      assert.match(output.guard_decision.reason, /pipeline_integration/);
    } finally {
      fixture.cleanup();
    }
  });

  test('allows pipeline_integration flow to write to workflows/', () => {
    const fixture = createGuardFixture();

    // Add workflows to protected_paths for the fixture
    const manifestPath = path.join(fixture.fixtureRoot, 'wazir.manifest.yaml');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.protected_paths.push('workflows');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    try {
      const result = runHook('protected-path-write-guard', {
        project_root: fixture.fixtureRoot,
        target_path: 'workflows/execute.md',
        approved_flow: 'pipeline_integration',
      });

      assert.strictEqual(result.exitCode, 0);
      const output = JSON.parse(result.stdout);
      assert.strictEqual(output.guard_decision.allowed, true);
      assert.match(output.guard_decision.reason, /pipeline_integration/);
    } finally {
      fixture.cleanup();
    }
  });
});

describe('protected-path-write-guard — Claude Code payload format (I9)', () => {
  test('blocks writes to protected paths when Claude Code sends file_path', () => {
    const fixture = createGuardFixture();

    try {
      // Claude Code sends file_path, not target_path
      const result = runHook('protected-path-write-guard', {
        project_root: fixture.fixtureRoot,
        file_path: 'input/brief.md',
      });

      assert.strictEqual(result.exitCode, 42);
      const output = JSON.parse(result.stdout);
      assert.strictEqual(output.guard_decision.allowed, false);
    } finally {
      fixture.cleanup();
    }
  });

  test('allows writes to non-protected paths when Claude Code sends file_path', () => {
    const fixture = createGuardFixture();

    try {
      const result = runHook('protected-path-write-guard', {
        project_root: fixture.fixtureRoot,
        file_path: 'tooling/src/test.js',
      });

      assert.strictEqual(result.exitCode, 0);
      const output = JSON.parse(result.stdout);
      assert.strictEqual(output.guard_decision.allowed, true);
    } finally {
      fixture.cleanup();
    }
  });

  test('blocks writes when Claude Code sends nested tool_input.file_path', () => {
    const fixture = createGuardFixture();

    try {
      const result = runHook('protected-path-write-guard', {
        project_root: fixture.fixtureRoot,
        tool_input: { file_path: 'input/brief.md', content: '# test' },
      });

      assert.strictEqual(result.exitCode, 42);
      const output = JSON.parse(result.stdout);
      assert.strictEqual(output.guard_decision.allowed, false);
    } finally {
      fixture.cleanup();
    }
  });

  test('runs 5 consecutive times on allowed paths without errors', () => {
    const fixture = createGuardFixture();

    try {
      for (let i = 0; i < 5; i++) {
        const result = runHook('protected-path-write-guard', {
          project_root: fixture.fixtureRoot,
          file_path: 'tooling/src/test.js',
        });

        assert.strictEqual(result.exitCode, 0, `Run ${i + 1} failed`);
        assert.ok(
          !result.stderr.toLowerCase().includes('error'),
          `Run ${i + 1} had error on stderr: ${result.stderr}`,
        );
      }
    } finally {
      fixture.cleanup();
    }
  });
});

describe('hook canonicalization (I9)', () => {
  test('hooks/hooks.json contains exactly 6 hooks', () => {
    const hooksPath = path.join(ROOT, 'hooks', 'hooks.json');
    const hooksContent = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));

    // Collect all hook command paths
    const hookCommands = [];
    for (const entries of Object.values(hooksContent.hooks)) {
      for (const entry of entries) {
        for (const hook of entry.hooks) {
          hookCommands.push(hook.command);
        }
      }
    }

    assert.strictEqual(hookCommands.length, 6, `Expected 6 hooks, got ${hookCommands.length}: ${hookCommands.join(', ')}`);
    assert.ok(hookCommands.includes('./hooks/protected-path-write-guard'));
    assert.ok(hookCommands.includes('./hooks/context-mode-router'));
    assert.ok(hookCommands.includes('./hooks/loop-cap-guard'));
    assert.ok(hookCommands.includes('./hooks/session-start'));
    assert.ok(hookCommands.includes('./hooks/stop-pipeline-gate'));
    assert.ok(hookCommands.includes('./hooks/pretooluse-pipeline-guard'));
  });

  test('hooks.json hooks field matches settings.json hooks field (generated from canonical)', () => {
    const hooksPath = path.join(ROOT, 'hooks', 'hooks.json');
    const settingsPath = path.join(ROOT, '.claude', 'settings.json');

    const hooksContent = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
    const settingsContent = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    // settings.json hooks should be identical to hooks.json hooks
    // (settings.json is generated from hooks.json via wazir export claude)
    assert.deepStrictEqual(
      settingsContent.hooks,
      hooksContent.hooks,
      'settings.json hooks must match hooks.json hooks (canonical source)',
    );
  });
});

describe('context-mode-router hook — disabled fallback (Task 10)', () => {
  test('exits 0 (passthrough) when context-mode is disabled via env', () => {
    const result = runHook('context-mode-router', { command: 'npm test' }, {
      WAZIR_CONTEXT_MODE: 'false',
    });

    assert.strictEqual(result.exitCode, 0);
    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.routing_decision.route, 'passthrough');
    assert.strictEqual(output.routing_decision.context_mode_enabled, false);
  });

  test('emits a warning to stderr when context-mode is disabled', () => {
    const result = runHook('context-mode-router', { command: 'npm test' }, {
      WAZIR_CONTEXT_MODE: 'false',
    });

    assert.strictEqual(result.exitCode, 0);
    assert.ok(
      result.stderr.includes('context_mode adapter is disabled'),
      'expected disabled-warning on stderr',
    );
  });

  test('suppresses repeated warnings when session marker is set', () => {
    const result = runHook('context-mode-router', { command: 'git status' }, {
      WAZIR_CONTEXT_MODE: 'false',
      WAZIR_CM_WARNED: '1',
    });

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stderr, '', 'expected no warning when session marker already set');
  });

  test('routes large commands to context-mode when enabled', () => {
    const result = runHook('context-mode-router', { command: 'npm test' }, {
      WAZIR_CONTEXT_MODE: '1',
    });

    assert.strictEqual(result.exitCode, 1);
    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.routing_decision.route, 'context-mode');
    assert.strictEqual(output.routing_decision.context_mode_enabled, true);
    assert.strictEqual(output.routing_decision.category, 'large');
  });

  test('passes small commands through even when enabled', () => {
    const result = runHook('context-mode-router', { command: 'git status' }, {
      WAZIR_CONTEXT_MODE: '1',
    });

    assert.strictEqual(result.exitCode, 0);
    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.routing_decision.route, 'passthrough');
    assert.strictEqual(output.routing_decision.context_mode_enabled, true);
    assert.strictEqual(output.routing_decision.category, 'small');
  });
});

describe('loop-cap-guard hook', () => {
  test('blocks when the current phase loop count reaches the cap', () => {
    const fixture = createGuardFixture();

    try {
      const result = runHook('loop-cap-guard', {
        run_id: 'run-1',
        phase: 'review',
        state_root: fixture.stateRoot,
        loop_cap: 2,
      });

      assert.strictEqual(result.exitCode, 43);
      const output = JSON.parse(result.stdout);
      assert.strictEqual(output.guard_decision.allowed, false);
    } finally {
      fixture.cleanup();
    }
  });

  test('allows execution when the phase loop count is still below the cap', () => {
    const fixture = createGuardFixture();

    try {
      const result = runHook('loop-cap-guard', {
        run_id: 'run-1',
        phase: 'verify',
        state_root: fixture.stateRoot,
        loop_cap: 2,
      });

      assert.strictEqual(result.exitCode, 0);
      const output = JSON.parse(result.stdout);
      assert.strictEqual(output.guard_decision.allowed, true);
    } finally {
      fixture.cleanup();
    }
  });
});
