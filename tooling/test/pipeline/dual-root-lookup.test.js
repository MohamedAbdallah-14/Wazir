import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { getRunPaths } from '../../src/capture/store.js';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

describe('dual-root lookup: getRepoLocalRunPaths', () => {
  let getRepoLocalRunPaths;

  test('setup: import', async () => {
    const mod = await import('../../src/pipeline/phase-files.js');
    getRepoLocalRunPaths = mod.getRepoLocalRunPaths;
    assert.ok(getRepoLocalRunPaths, 'getRepoLocalRunPaths should be exported');
  });

  test('returns paths under projectRoot/.wazir/runs/<id>/', async () => {
    if (!getRepoLocalRunPaths) {
      const mod = await import('../../src/pipeline/phase-files.js');
      getRepoLocalRunPaths = mod.getRepoLocalRunPaths;
    }
    const paths = getRepoLocalRunPaths('/project', 'run-123');
    assert.ok(paths.runRoot.includes('.wazir/runs/run-123'));
    assert.ok(paths.runRoot.startsWith('/project'));
  });
});

describe('dual-root lookup: readRunConfig', () => {
  let tmpProject;
  let tmpState;
  const RUN_ID = 'run-dual-test';

  beforeEach(() => {
    tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-dual-proj-'));
    tmpState = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-dual-state-'));
  });

  afterEach(() => {
    fs.rmSync(tmpProject, { recursive: true, force: true });
    fs.rmSync(tmpState, { recursive: true, force: true });
  });

  test('reads config from repo-local when it exists there only', async () => {
    const { readRunConfig } = await import('../../src/capture/run-config.js');

    // Create config at repo-local only
    const repoLocalDir = path.join(tmpProject, '.wazir', 'runs', RUN_ID);
    fs.mkdirSync(repoLocalDir, { recursive: true });
    fs.writeFileSync(
      path.join(repoLocalDir, 'run-config.yaml'),
      'run_id: dual-test\nparsed_intent: feature\n',
      'utf8',
    );

    // State-root has no config
    const stateRunPaths = getRunPaths(tmpState, RUN_ID);
    fs.mkdirSync(stateRunPaths.runRoot, { recursive: true });

    const config = readRunConfig(stateRunPaths, tmpProject);
    assert.strictEqual(config.run_id, 'dual-test', 'Should find config at repo-local');
  });

  test('falls back to state-root when repo-local has no config', async () => {
    const { readRunConfig } = await import('../../src/capture/run-config.js');

    // State-root has config
    const stateRunPaths = getRunPaths(tmpState, RUN_ID);
    fs.mkdirSync(stateRunPaths.runRoot, { recursive: true });
    fs.writeFileSync(
      path.join(stateRunPaths.runRoot, 'run-config.yaml'),
      'run_id: state-test\nparsed_intent: bugfix\n',
      'utf8',
    );

    const config = readRunConfig(stateRunPaths, tmpProject);
    assert.strictEqual(config.run_id, 'state-test', 'Should fall back to state-root');
  });
});

describe('dual-root lookup: evaluatePhasePrerequisiteGuard', () => {
  let tmpProject;
  let tmpState;
  const RUN_ID = 'run-prereq-test';

  beforeEach(() => {
    tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-prereq-proj-'));
    tmpState = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-prereq-state-'));
  });

  afterEach(() => {
    fs.rmSync(tmpProject, { recursive: true, force: true });
    fs.rmSync(tmpState, { recursive: true, force: true });
  });

  test('finds artifact at repo-local path when state-root has none', async () => {
    const { evaluatePhasePrerequisiteGuard } = await import('../../src/guards/phase-prerequisite-guard.js');

    // Create minimal manifest with prerequisites
    const manifestDir = tmpProject;
    fs.writeFileSync(
      path.join(manifestDir, 'wazir.manifest.yaml'),
      `project:\n  name: test\nphase_prerequisites:\n  executor:\n    required_artifacts:\n      - clarified/clarification.md\n    required_phase_exits: []\nworkflows: []\n`,
      'utf8',
    );

    // Create status.json at state-root (required by guard)
    const stateRunPaths = getRunPaths(tmpState, RUN_ID);
    fs.mkdirSync(stateRunPaths.runRoot, { recursive: true });
    fs.writeFileSync(
      stateRunPaths.statusPath,
      JSON.stringify({ run_id: RUN_ID, phase: 'executor', status: 'starting' }),
      'utf8',
    );

    // Create artifact at REPO-LOCAL only
    const repoLocalArtifact = path.join(tmpProject, '.wazir', 'runs', RUN_ID, 'clarified');
    fs.mkdirSync(repoLocalArtifact, { recursive: true });
    fs.writeFileSync(path.join(repoLocalArtifact, 'clarification.md'), '# Test', 'utf8');

    // State-root has NO artifact
    const result = evaluatePhasePrerequisiteGuard({
      run_id: RUN_ID,
      phase: 'executor',
      state_root: tmpState,
      project_root: tmpProject,
    });

    assert.strictEqual(result.allowed, true, `Guard should find artifact at repo-local. Got: ${JSON.stringify(result)}`);
  });
});
