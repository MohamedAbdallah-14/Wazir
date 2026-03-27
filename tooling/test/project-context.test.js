import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveProjectContext } from '../src/project-context.js';
import { findProjectRoot, findProjectRootStrict } from '../src/project-root.js';

describe('findProjectRoot', () => {
  it('returns project root when manifest exists', () => {
    // The test is run from within the Wazir repo, so this should work
    const root = findProjectRoot(process.cwd());
    assert.ok(root, 'should find project root');
    assert.ok(fs.existsSync(path.join(root, 'wazir.manifest.yaml')));
  });

  it('returns null when no manifest exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-test-no-manifest-'));
    try {
      const result = findProjectRoot(tmp);
      assert.strictEqual(result, null);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('findProjectRootStrict', () => {
  it('throws when no manifest exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-test-strict-'));
    try {
      assert.throws(() => findProjectRootStrict(tmp), /Could not find wazir\.manifest\.yaml/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns project root when manifest exists', () => {
    const root = findProjectRootStrict(process.cwd());
    assert.ok(root);
    assert.ok(fs.existsSync(path.join(root, 'wazir.manifest.yaml')));
  });
});

describe('resolveProjectContext', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-ctx-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns wazir repo context when manifest exists', () => {
    const ctx = resolveProjectContext(process.cwd());
    assert.strictEqual(ctx.isUserProject, false);
    assert.strictEqual(ctx.manifest.project.name, 'wazir');
    assert.ok(ctx.stateRoot.includes('.wazir/projects/wazir'));
    assert.ok(fs.existsSync(path.join(ctx.projectRoot, 'wazir.manifest.yaml')));
  });

  it('returns user project context when no manifest', () => {
    const ctx = resolveProjectContext(tmpDir);
    assert.strictEqual(ctx.isUserProject, true);
    assert.strictEqual(ctx.projectRoot, path.resolve(tmpDir));
    assert.ok(ctx.manifest, 'manifest should be synthetic, not null');
    assert.ok(ctx.manifest.project.name, 'synthetic manifest should have project.name');
    assert.ok(ctx.manifest.paths.state_root_default, 'synthetic manifest should have state_root_default');
    assert.deepStrictEqual(ctx.manifest.hosts, []);
    assert.deepStrictEqual(ctx.manifest.roles, []);
  });

  it('synthetic manifest generates valid state root', () => {
    const projectDir = path.join(tmpDir, 'my-cool-app');
    fs.mkdirSync(projectDir);
    const ctx = resolveProjectContext(projectDir);
    assert.ok(ctx.stateRoot.includes('.wazir/projects/my-cool-app'));
  });

  it('state root override takes precedence in user project mode', () => {
    const override = path.join(tmpDir, 'custom-state');
    const ctx = resolveProjectContext(tmpDir, { stateRootOverride: override });
    assert.strictEqual(ctx.stateRoot, override);
    assert.strictEqual(ctx.isUserProject, true);
  });

  it('state root override takes precedence in wazir repo mode', () => {
    const override = path.join(tmpDir, 'custom-state');
    const ctx = resolveProjectContext(process.cwd(), { stateRootOverride: override });
    assert.strictEqual(ctx.stateRoot, override);
    assert.strictEqual(ctx.isUserProject, false);
  });

  it('resolves initialized project root from nested subdirectory', () => {
    // Simulate: wazir init at tmpDir, then run from tmpDir/src/components/
    const configDir = path.join(tmpDir, '.wazir', 'state');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'config.json'), '{"config_version": 2}');

    const nestedDir = path.join(tmpDir, 'src', 'components');
    fs.mkdirSync(nestedDir, { recursive: true });

    const ctx = resolveProjectContext(nestedDir);
    assert.strictEqual(ctx.isUserProject, true);
    assert.strictEqual(ctx.projectRoot, path.resolve(tmpDir), 'should find initialized root, not nested dir');
  });

  it('slug generation handles special characters in directory names', () => {
    const projectDir = path.join(tmpDir, 'My Project (v2.0)');
    fs.mkdirSync(projectDir);
    const ctx = resolveProjectContext(projectDir);
    // Should be slugified: lowercase, special chars replaced with hyphens
    assert.ok(ctx.manifest.project.name.match(/^[a-z0-9-]+$/), `slug should be alphanumeric: ${ctx.manifest.project.name}`);
    assert.ok(!ctx.manifest.project.name.includes(' '));
    assert.ok(!ctx.manifest.project.name.includes('('));
  });
});

describe('doctor: user project mode', () => {
  let tmpDir, runDoctorCommand;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-doctor-'));
    const mod = await import('../src/doctor/command.js');
    runDoctorCommand = mod.runDoctorCommand;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('runs without crash in user project (no manifest)', () => {
    const result = runDoctorCommand({ subcommand: null, args: ['--json'] }, { cwd: tmpDir });
    assert.strictEqual(result.exitCode === 0 || result.exitCode === 1, true, 'should not throw');
    const output = JSON.parse(result.stdout);
    assert.ok(output.checks, 'should have checks array');
    assert.ok(output.project_root, 'should have project_root');
  });

  it('reports state-dirs as fail when not initialized', () => {
    const result = runDoctorCommand({ subcommand: null, args: ['--json'] }, { cwd: tmpDir });
    const output = JSON.parse(result.stdout);
    const stateCheck = output.checks.find(c => c.name === 'state-dirs');
    assert.ok(stateCheck, 'should have state-dirs check');
    assert.strictEqual(stateCheck.status, 'fail');
  });

  it('reports state-dirs as pass when initialized', () => {
    // Simulate wazir init
    const configDir = path.join(tmpDir, '.wazir', 'state');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'config.json'), '{"config_version": 2}');

    const result = runDoctorCommand({ subcommand: null, args: ['--json'] }, { cwd: tmpDir });
    const output = JSON.parse(result.stdout);
    const stateCheck = output.checks.find(c => c.name === 'state-dirs');
    assert.ok(stateCheck);
    assert.strictEqual(stateCheck.status, 'pass');
  });
});

describe('init: user project mode', () => {
  let tmpDir, runInitCommand;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-init-'));
    const mod = await import('../src/init/command.js');
    runInitCommand = mod.runInitCommand;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('succeeds in user project (no manifest)', async () => {
    const result = await runInitCommand({ subcommand: null, args: [] }, { cwd: tmpDir });
    assert.strictEqual(result.exitCode, 0, `should succeed: ${result.stderr || ''}`);
    assert.ok(result.stdout.includes('Wazir initialized'), result.stdout);
  });

  it('creates state directories', async () => {
    await runInitCommand({ subcommand: null, args: [] }, { cwd: tmpDir });
    assert.ok(fs.existsSync(path.join(tmpDir, '.wazir', 'state', 'config.json')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.wazir', 'input')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.wazir', 'runs')));
  });

  it('does not attempt export build in user project', async () => {
    const result = await runInitCommand({ subcommand: null, args: [] }, { cwd: tmpDir });
    assert.ok(result.stdout.includes('plugin'), 'should mention plugin for exports');
    assert.ok(!result.stdout.includes('skipped'), 'should not show skipped export error');
  });
});
