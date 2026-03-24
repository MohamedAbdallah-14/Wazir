import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let runCaptureCommand, readScopeStack;

describe('capture: skill scope commands', () => {
  let tmpDir, projectRoot;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-skill-scope-'));
    projectRoot = path.join(tmpDir, 'project');

    // Set up minimal project structure
    fs.mkdirSync(path.join(projectRoot, '.wazir', 'runs', 'run-001', 'phases'), { recursive: true });
    fs.mkdirSync(path.join(projectRoot, '.wazir', 'state'), { recursive: true });

    // Pipeline-active marker
    fs.writeFileSync(path.join(projectRoot, '.wazir', 'state', 'pipeline-active'), 'true');

    // Latest pointer
    fs.symlinkSync('run-001', path.join(projectRoot, '.wazir', 'runs', 'latest'));

    // Executor phase active (skill scopes are entered during execution)
    fs.writeFileSync(
      path.join(projectRoot, '.wazir', 'runs', 'run-001', 'phases', 'executor.md'),
      '## Phase: executor — ACTIVE\n- [ ] implement\n',
    );

    // Manifest
    fs.writeFileSync(
      path.join(projectRoot, 'wazir.manifest.yaml'),
      'name: test-project\nversion: 0.1.0\nstate_root: .wazir-state\n',
    );

    // Skill phase templates for self-audit
    const tplDir = path.join(projectRoot, 'templates', 'phases', 'skills', 'self-audit');
    fs.mkdirSync(tplDir, { recursive: true });
    fs.writeFileSync(path.join(tplDir, '01-validate.md'), '## Phase: validate\nsource_write_policy: deny\n- [ ] Run validators\n- [ ] Capture results\n');
    fs.writeFileSync(path.join(tplDir, '02-deep-audit.md'), '## Phase: deep_audit\nsource_write_policy: deny\n- [ ] Deep audit\n');
    fs.writeFileSync(path.join(tplDir, '03-fix.md'), '## Phase: fix\nsource_write_policy: allow\n- [ ] Apply fixes\n');
    fs.writeFileSync(path.join(tplDir, '04-verify.md'), '## Phase: verify\nsource_write_policy: deny\n- [ ] Verify fixes\n');
    fs.writeFileSync(path.join(tplDir, '05-report.md'), '## Phase: report\nsource_write_policy: deny\n- [ ] Write report\n');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('setup: import', async () => {
    const cmdMod = await import('../../src/capture/command.js');
    const storeMod = await import('../../src/capture/store.js');
    runCaptureCommand = cmdMod.runCaptureCommand;
    readScopeStack = storeMod.readScopeStack;
    assert.ok(runCaptureCommand);
    assert.ok(readScopeStack);
  });

  test('ensure --scope skill creates skill invocation and pushes scope', () => {
    if (!runCaptureCommand) return;
    const result = runCaptureCommand(
      { subcommand: 'ensure', args: ['--scope', 'skill', '--skill', 'self-audit', '--run', 'run-001'] },
      { cwd: projectRoot },
    );
    assert.strictEqual(result.exitCode, 0, `Expected exit 0, got: ${result.stderr || result.stdout}`);

    // Scope stack should have skill entry
    const runDir = path.join(projectRoot, '.wazir', 'runs', 'run-001');
    const stack = readScopeStack(runDir);
    assert.ok(stack.length >= 1, 'Stack should have at least one entry');
    const top = stack[stack.length - 1];
    assert.strictEqual(top.type, 'skill');
    assert.strictEqual(top.skill, 'self-audit');
    assert.ok(top.invocation_id, 'Must have invocation_id');

    // Skill phases directory should exist with rendered files
    const skillPhasesDir = path.join(runDir, 'skills', top.invocation_id, 'phases');
    assert.ok(fs.existsSync(skillPhasesDir), 'Skill phases dir must exist');
    const phaseFiles = fs.readdirSync(skillPhasesDir).filter(f => f.endsWith('.md'));
    assert.ok(phaseFiles.length >= 5, `Expected 5+ phase files, got ${phaseFiles.length}`);

    // First phase should be ACTIVE
    const firstPhase = fs.readFileSync(path.join(skillPhasesDir, '01-validate.md'), 'utf8');
    assert.ok(firstPhase.includes('— ACTIVE'), 'First skill phase should be ACTIVE');
  });

  test('skill-phase transitions between skill phases', () => {
    if (!runCaptureCommand) return;
    // First enter skill scope
    runCaptureCommand(
      { subcommand: 'ensure', args: ['--scope', 'skill', '--skill', 'self-audit', '--run', 'run-001'] },
      { cwd: projectRoot },
    );

    const runDir = path.join(projectRoot, '.wazir', 'runs', 'run-001');
    const stack = readScopeStack(runDir);
    const invId = stack[stack.length - 1].invocation_id;

    // Check all items in validate phase to allow transition
    const validatePath = path.join(runDir, 'skills', invId, 'phases', '01-validate.md');
    let content = fs.readFileSync(validatePath, 'utf8');
    content = content.replace(/- \[ \]/g, '- [x]');
    fs.writeFileSync(validatePath, content);

    // Transition to deep_audit
    const result = runCaptureCommand(
      { subcommand: 'skill-phase', args: ['--phase', 'deep_audit', '--run', 'run-001'] },
      { cwd: projectRoot },
    );
    assert.strictEqual(result.exitCode, 0, `Expected exit 0, got: ${result.stderr || ''}`);

    // Verify validate is COMPLETED, deep_audit is ACTIVE
    const validateAfter = fs.readFileSync(validatePath, 'utf8');
    assert.ok(validateAfter.includes('— COMPLETED'), 'validate should be COMPLETED');

    const deepAuditPath = path.join(runDir, 'skills', invId, 'phases', '02-deep-audit.md');
    const deepAudit = fs.readFileSync(deepAuditPath, 'utf8');
    assert.ok(deepAudit.includes('— ACTIVE'), 'deep_audit should be ACTIVE');
  });

  test('skill-phase rejects transition with unchecked items', () => {
    if (!runCaptureCommand) return;
    runCaptureCommand(
      { subcommand: 'ensure', args: ['--scope', 'skill', '--skill', 'self-audit', '--run', 'run-001'] },
      { cwd: projectRoot },
    );

    // Try to transition without checking items
    const result = runCaptureCommand(
      { subcommand: 'skill-phase', args: ['--phase', 'deep_audit', '--run', 'run-001'] },
      { cwd: projectRoot },
    );
    assert.notStrictEqual(result.exitCode, 0, 'Should reject transition with unchecked items');
  });

  test('skill-exit pops scope stack', () => {
    if (!runCaptureCommand) return;
    runCaptureCommand(
      { subcommand: 'ensure', args: ['--scope', 'skill', '--skill', 'self-audit', '--run', 'run-001'] },
      { cwd: projectRoot },
    );

    const runDir = path.join(projectRoot, '.wazir', 'runs', 'run-001');
    const stack = readScopeStack(runDir);
    const invId = stack[stack.length - 1].invocation_id;

    // Check all items in all phases
    const skillPhasesDir = path.join(runDir, 'skills', invId, 'phases');
    for (const f of fs.readdirSync(skillPhasesDir).filter(f => f.endsWith('.md'))) {
      const fp = path.join(skillPhasesDir, f);
      let c = fs.readFileSync(fp, 'utf8');
      c = c.replace(/- \[ \]/g, '- [x]').replace(/— (ACTIVE|NOT ACTIVE)/, '— COMPLETED');
      fs.writeFileSync(fp, c);
    }

    const result = runCaptureCommand(
      { subcommand: 'skill-exit', args: ['--run', 'run-001'] },
      { cwd: projectRoot },
    );
    assert.strictEqual(result.exitCode, 0, `Expected exit 0, got: ${result.stderr || ''}`);

    // Stack should no longer have skill entry
    const afterStack = readScopeStack(runDir);
    const hasSkill = afterStack.some(e => e.type === 'skill');
    assert.ok(!hasSkill, 'Skill scope should be popped from stack');
  });

  test('ensure --scope skill without --skill exits 1 with usage (I-3)', () => {
    if (!runCaptureCommand) return;
    const result = runCaptureCommand(
      { subcommand: 'ensure', args: ['--scope', 'skill', '--run', 'run-001'] },
      { cwd: projectRoot },
    );
    assert.strictEqual(result.exitCode, 1, 'Should exit 1 without --skill');
    assert.ok(result.stderr.includes('Usage'), `Should show usage message, got: ${result.stderr}`);
  });

  test('ensure --scope skill rejects invalid skill name (I-1)', () => {
    if (!runCaptureCommand) return;
    const result = runCaptureCommand(
      { subcommand: 'ensure', args: ['--scope', 'skill', '--skill', '../../etc', '--run', 'run-001'] },
      { cwd: projectRoot },
    );
    assert.strictEqual(result.exitCode, 1, 'Should reject path traversal in skill name');
    assert.ok(result.stderr.includes('Invalid skill name'), `Should mention invalid name, got: ${result.stderr}`);
  });

  test('skill-exit rejects when phases are incomplete', () => {
    if (!runCaptureCommand) return;
    runCaptureCommand(
      { subcommand: 'ensure', args: ['--scope', 'skill', '--skill', 'self-audit', '--run', 'run-001'] },
      { cwd: projectRoot },
    );

    // Try to exit without completing phases
    const result = runCaptureCommand(
      { subcommand: 'skill-exit', args: ['--run', 'run-001'] },
      { cwd: projectRoot },
    );
    assert.notStrictEqual(result.exitCode, 0, 'Should reject exit with incomplete phases');
  });
});
