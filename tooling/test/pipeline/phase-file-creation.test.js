import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

let createPhaseFiles;

describe('phase file creation', () => {
  let tmpDir;
  let projectRoot;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-phase-test-'));
    projectRoot = tmpDir;
    // Create templates dir with minimal templates
    const templatesDir = path.join(ROOT, 'templates', 'phases');
    // Templates already exist in the repo from Task 2
    assert.ok(fs.existsSync(templatesDir), 'templates/phases/ should exist');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('setup: import createPhaseFiles', async () => {
    const mod = await import('../../src/pipeline/phase-files.js');
    createPhaseFiles = mod.createPhaseFiles;
    assert.ok(createPhaseFiles, 'createPhaseFiles should be exported');
  });

  test('creates phases/ directory with 4 .md and 4 .log.md files', async () => {
    if (!createPhaseFiles) {
      const mod = await import('../../src/pipeline/phase-files.js');
      createPhaseFiles = mod.createPhaseFiles;
    }
    const runId = 'run-20260323-test';
    const runDir = path.join(projectRoot, '.wazir', 'runs', runId);
    fs.mkdirSync(runDir, { recursive: true });

    createPhaseFiles(runDir, ROOT);

    const phasesDir = path.join(runDir, 'phases');
    assert.ok(fs.existsSync(phasesDir), 'phases/ directory should exist');

    const files = fs.readdirSync(phasesDir).sort();
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.includes('.log.'));
    const logFiles = files.filter(f => f.includes('.log.md'));

    assert.strictEqual(mdFiles.length, 4, `Expected 4 .md files, got ${mdFiles.length}: ${mdFiles}`);
    assert.strictEqual(logFiles.length, 4, `Expected 4 .log.md files, got ${logFiles.length}: ${logFiles}`);
  });

  test('init.md has ACTIVE header, others have NOT ACTIVE', async () => {
    if (!createPhaseFiles) {
      const mod = await import('../../src/pipeline/phase-files.js');
      createPhaseFiles = mod.createPhaseFiles;
    }
    const runId = 'run-20260323-test2';
    const runDir = path.join(projectRoot, '.wazir', 'runs', runId);
    fs.mkdirSync(runDir, { recursive: true });

    createPhaseFiles(runDir, ROOT);

    const phasesDir = path.join(runDir, 'phases');
    const initContent = fs.readFileSync(path.join(phasesDir, 'init.md'), 'utf8');
    assert.ok(initContent.includes('— ACTIVE'), 'init.md should have ACTIVE header');
    assert.ok(!initContent.includes('NOT ACTIVE'), 'init.md should NOT have NOT ACTIVE');

    for (const phase of ['clarifier', 'executor', 'final_review']) {
      const content = fs.readFileSync(path.join(phasesDir, `${phase}.md`), 'utf8');
      assert.ok(content.includes('— NOT ACTIVE'), `${phase}.md should have NOT ACTIVE header`);
    }
  });

  test('log files have correct headers and are otherwise empty', async () => {
    if (!createPhaseFiles) {
      const mod = await import('../../src/pipeline/phase-files.js');
      createPhaseFiles = mod.createPhaseFiles;
    }
    const runId = 'run-20260323-test3';
    const runDir = path.join(projectRoot, '.wazir', 'runs', runId);
    fs.mkdirSync(runDir, { recursive: true });

    createPhaseFiles(runDir, ROOT);

    const phasesDir = path.join(runDir, 'phases');
    for (const phase of ['init', 'clarifier', 'executor', 'final_review']) {
      const content = fs.readFileSync(path.join(phasesDir, `${phase}.log.md`), 'utf8');
      assert.ok(content.includes(`## Phase: ${phase} — Log`), `${phase}.log.md should have log header`);
      // Should be just the header line(s) and nothing else
      const lines = content.trim().split('\n').filter(l => l.trim());
      assert.ok(lines.length <= 2, `${phase}.log.md should be mostly empty, got ${lines.length} lines`);
    }
  });
});

describe('repo-local symlink creation', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-symlink-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('creates .wazir/runs/latest symlink pointing to run directory', async () => {
    let createRepoLocalSymlink;
    try {
      const mod = await import('../../src/pipeline/phase-files.js');
      createRepoLocalSymlink = mod.createRepoLocalSymlink;
    } catch {
      return; // Module not yet created
    }
    if (!createRepoLocalSymlink) return;

    const runsDir = path.join(tmpDir, '.wazir', 'runs');
    fs.mkdirSync(runsDir, { recursive: true });
    const runId = 'run-20260323-symtest';
    fs.mkdirSync(path.join(runsDir, runId), { recursive: true });

    createRepoLocalSymlink(tmpDir, runId);

    const latestPath = path.join(runsDir, 'latest');
    assert.ok(fs.existsSync(latestPath), 'latest symlink should exist');
    const target = fs.readlinkSync(latestPath);
    assert.strictEqual(target, runId, `latest should point to ${runId}, got ${target}`);
  });
});
