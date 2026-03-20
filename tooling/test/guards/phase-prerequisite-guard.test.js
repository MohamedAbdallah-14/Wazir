import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluatePhasePrerequisiteGuard } from '../../src/guards/phase-prerequisite-guard.js';
import { readPhaseExitEvents, getRunPaths } from '../../src/capture/store.js';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

function createFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-phase-prereq-'));
  const stateRoot = path.join(fixtureRoot, '.state-root');
  const runId = 'run-test';
  const runRoot = path.join(stateRoot, 'runs', runId);

  fs.mkdirSync(path.join(runRoot, 'clarified'), { recursive: true });
  fs.mkdirSync(path.join(runRoot, 'artifacts'), { recursive: true });

  // Write status.json so guard doesn't throw for standalone mode
  fs.writeFileSync(
    path.join(runRoot, 'status.json'),
    JSON.stringify({ run_id: runId, phase: 'init', status: 'starting' }),
  );

  // Write empty events.ndjson
  fs.writeFileSync(path.join(runRoot, 'events.ndjson'), '');

  return { fixtureRoot, stateRoot, runId, runRoot };
}

function writeArtifacts(runRoot, artifacts) {
  for (const artifact of artifacts) {
    const artifactPath = path.join(runRoot, artifact);
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, `# ${artifact}\n`);
  }
}

function writePhaseExitEvent(runRoot, phaseName, status = 'completed') {
  const eventsPath = path.join(runRoot, 'events.ndjson');
  const event = JSON.stringify({
    event: 'phase_exit',
    phase: phaseName,
    status,
    created_at: new Date().toISOString(),
  });
  fs.appendFileSync(eventsPath, `${event}\n`);
}

const EXECUTOR_ARTIFACTS = [
  'clarified/clarification.md',
  'clarified/spec-hardened.md',
  'clarified/design.md',
  'clarified/execution-plan.md',
];

describe('readPhaseExitEvents', () => {
  test('returns empty array for empty file', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    const runPaths = getRunPaths(stateRoot, runId);
    const result = readPhaseExitEvents(runPaths);
    assert.deepStrictEqual(result, []);
  });

  test('returns empty array for missing file', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    fs.unlinkSync(path.join(runRoot, 'events.ndjson'));
    const runPaths = getRunPaths(stateRoot, runId);
    const result = readPhaseExitEvents(runPaths);
    assert.deepStrictEqual(result, []);
  });

  test('extracts completed phase names', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    writePhaseExitEvent(runRoot, 'clarifier');
    writePhaseExitEvent(runRoot, 'executor');
    const runPaths = getRunPaths(stateRoot, runId);
    const result = readPhaseExitEvents(runPaths);
    assert.deepStrictEqual(result, ['clarifier', 'executor']);
  });

  test('ignores non-completed phase_exit events', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    writePhaseExitEvent(runRoot, 'clarifier', 'failed');
    writePhaseExitEvent(runRoot, 'executor', 'completed');
    const runPaths = getRunPaths(stateRoot, runId);
    const result = readPhaseExitEvents(runPaths);
    assert.deepStrictEqual(result, ['executor']);
  });

  test('skips malformed JSON lines', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    const eventsPath = path.join(runRoot, 'events.ndjson');
    fs.appendFileSync(eventsPath, 'not valid json\n');
    fs.appendFileSync(eventsPath, '{ broken\n');
    writePhaseExitEvent(runRoot, 'clarifier');
    const runPaths = getRunPaths(stateRoot, runId);
    const result = readPhaseExitEvents(runPaths);
    assert.deepStrictEqual(result, ['clarifier']);
  });

  test('ignores non-phase_exit events', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    const eventsPath = path.join(runRoot, 'events.ndjson');
    fs.appendFileSync(eventsPath, JSON.stringify({ event: 'phase_enter', phase: 'executor', status: 'in_progress' }) + '\n');
    writePhaseExitEvent(runRoot, 'clarifier');
    const runPaths = getRunPaths(stateRoot, runId);
    const result = readPhaseExitEvents(runPaths);
    assert.deepStrictEqual(result, ['clarifier']);
  });
});

describe('evaluatePhasePrerequisiteGuard', () => {
  test('allows phase with no prerequisites defined (init)', () => {
    const { stateRoot, runId } = createFixture();
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'init',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, true);
    assert.match(result.reason, /no prerequisites/i);
  });

  test('allows phase with empty prerequisites (clarifier)', () => {
    const { stateRoot, runId } = createFixture();
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'clarifier',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, true);
  });

  test('allows unknown phase (no prerequisites entry)', () => {
    const { stateRoot, runId } = createFixture();
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'custom_phase',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, true);
  });

  test('blocks executor when all artifacts are missing', () => {
    const { stateRoot, runId } = createFixture();
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'executor',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.missing_artifacts);
    assert.strictEqual(result.missing_artifacts.length, 4);
  });

  test('blocks executor when one artifact is missing', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    writeArtifacts(runRoot, [
      'clarified/clarification.md',
      'clarified/spec-hardened.md',
      'clarified/execution-plan.md',
      // design.md missing
    ]);
    writePhaseExitEvent(runRoot, 'clarifier');
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'executor',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, false);
    assert.deepStrictEqual(result.missing_artifacts, ['clarified/design.md']);
  });

  test('allows executor when all artifacts exist (even without phase_exit events — resumed run)', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    writeArtifacts(runRoot, EXECUTOR_ARTIFACTS);
    // No phase_exit events — simulates resumed run
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'executor',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, true);
  });

  test('allows executor when all artifacts and phase_exit events exist', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    writeArtifacts(runRoot, EXECUTOR_ARTIFACTS);
    writePhaseExitEvent(runRoot, 'clarifier');
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'executor',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, true);
  });

  test('blocks when artifacts missing — phase_exits alone are not sufficient', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    // Phase exit exists but no artifacts
    writePhaseExitEvent(runRoot, 'clarifier');
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'executor',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.missing_artifacts);
    assert.strictEqual(result.missing_artifacts.length, 4);
  });

  test('reports missing phase_exits when artifacts also missing', () => {
    const { stateRoot, runId } = createFixture();
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'executor',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.missing_artifacts);
    assert.ok(result.missing_phase_exits);
    assert.deepStrictEqual(result.missing_phase_exits, ['clarifier']);
  });

  test('blocks final_review when verification-proof missing', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    writeArtifacts(runRoot, EXECUTOR_ARTIFACTS);
    // verification-proof.md missing
    writePhaseExitEvent(runRoot, 'clarifier');
    writePhaseExitEvent(runRoot, 'executor');
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'final_review',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, false);
    assert.deepStrictEqual(result.missing_artifacts, ['artifacts/verification-proof.md']);
  });

  test('allows final_review when all artifacts exist', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    writeArtifacts(runRoot, EXECUTOR_ARTIFACTS);
    // verification-proof.md must contain "status: pass" or "PASS" to pass content validation
    const proofPath = path.join(runRoot, 'artifacts', 'verification-proof.md');
    fs.writeFileSync(proofPath, '# Verification Proof\n\nstatus: pass\n');
    writePhaseExitEvent(runRoot, 'clarifier');
    writePhaseExitEvent(runRoot, 'executor');
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'final_review',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, true);
  });

  test('throws when status.json is missing (standalone mode)', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    fs.unlinkSync(path.join(runRoot, 'status.json'));
    assert.throws(
      () => evaluatePhasePrerequisiteGuard({
        run_id: runId,
        phase: 'executor',
        state_root: stateRoot,
        project_root: ROOT,
      }),
      /status\.json not found/,
    );
  });

  test('throws when required params missing', () => {
    assert.throws(
      () => evaluatePhasePrerequisiteGuard({ phase: 'executor', state_root: '/tmp', project_root: ROOT }),
      /run_id is required/,
    );
    assert.throws(
      () => evaluatePhasePrerequisiteGuard({ run_id: 'r1', state_root: '/tmp', project_root: ROOT }),
      /phase is required/,
    );
    assert.throws(
      () => evaluatePhasePrerequisiteGuard({ run_id: 'r1', phase: 'executor', project_root: ROOT }),
      /state_root is required/,
    );
    assert.throws(
      () => evaluatePhasePrerequisiteGuard({ run_id: 'r1', phase: 'executor', state_root: '/tmp' }),
      /project_root is required/,
    );
  });

  test('blocks when proof JSON has all_passed: false', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    writeArtifacts(runRoot, EXECUTOR_ARTIFACTS);
    const proofMdPath = path.join(runRoot, 'artifacts', 'verification-proof.md');
    fs.writeFileSync(proofMdPath, '# Verification\n\nstatus: pass\n');
    const proofJsonPath = path.join(runRoot, 'artifacts', 'proof-task-001.json');
    fs.writeFileSync(proofJsonPath, JSON.stringify({ task_id: 'task-001', all_passed: false }));
    // Add proof-task-001.json to required_artifacts via a custom manifest
    // Instead, test with final_review phase which requires verification-proof.md
    // We need a phase that requires a proof JSON. Let's use a custom fixture approach:
    // We'll create a temp manifest that has a proof JSON in required_artifacts.
    // Actually, the simplest approach: create a temp project root with a custom manifest.
    const tempProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-proof-test-'));
    fs.writeFileSync(path.join(tempProjectRoot, 'wazir.manifest.yaml'), [
      'name: test-project',
      'workflows: []',
      'phase_prerequisites:',
      '  verify:',
      '    required_artifacts:',
      '      - artifacts/proof-task-001.json',
      '    required_phase_exits: []',
    ].join('\n'));
    fs.writeFileSync(
      path.join(runRoot, 'status.json'),
      JSON.stringify({ run_id: runId, phase: 'verify', status: 'starting' }),
    );
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'verify',
      state_root: stateRoot,
      project_root: tempProjectRoot,
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.failed_proofs);
    assert.ok(result.failed_proofs[0].includes('all_passed is not true'));
    assert.match(result.reason, /Failed proof validation/);
  });

  test('blocks when proof JSON is empty/malformed', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    const tempProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-proof-test-'));
    fs.writeFileSync(path.join(tempProjectRoot, 'wazir.manifest.yaml'), [
      'name: test-project',
      'workflows: []',
      'phase_prerequisites:',
      '  verify:',
      '    required_artifacts:',
      '      - artifacts/proof-task-001.json',
      '    required_phase_exits: []',
    ].join('\n'));
    // Write malformed JSON
    const proofJsonPath = path.join(runRoot, 'artifacts', 'proof-task-001.json');
    fs.writeFileSync(proofJsonPath, '{ not valid json !!!');
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'verify',
      state_root: stateRoot,
      project_root: tempProjectRoot,
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.failed_proofs);
    assert.ok(result.failed_proofs[0].includes('malformed'));
    assert.match(result.reason, /Failed proof validation/);
  });

  test('blocks when proof JSON is empty file', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    const tempProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-proof-test-'));
    fs.writeFileSync(path.join(tempProjectRoot, 'wazir.manifest.yaml'), [
      'name: test-project',
      'workflows: []',
      'phase_prerequisites:',
      '  verify:',
      '    required_artifacts:',
      '      - artifacts/proof-task-001.json',
      '    required_phase_exits: []',
    ].join('\n'));
    const proofJsonPath = path.join(runRoot, 'artifacts', 'proof-task-001.json');
    fs.writeFileSync(proofJsonPath, '');
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'verify',
      state_root: stateRoot,
      project_root: tempProjectRoot,
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.failed_proofs);
    assert.ok(result.failed_proofs[0].includes('malformed'));
  });

  test('passes when proof JSON has all_passed: true', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    const tempProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-proof-test-'));
    fs.writeFileSync(path.join(tempProjectRoot, 'wazir.manifest.yaml'), [
      'name: test-project',
      'workflows: []',
      'phase_prerequisites:',
      '  verify:',
      '    required_artifacts:',
      '      - artifacts/proof-task-001.json',
      '    required_phase_exits: []',
    ].join('\n'));
    const proofJsonPath = path.join(runRoot, 'artifacts', 'proof-task-001.json');
    fs.writeFileSync(proofJsonPath, JSON.stringify({ task_id: 'task-001', all_passed: true }));
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'verify',
      state_root: stateRoot,
      project_root: tempProjectRoot,
    });
    assert.strictEqual(result.allowed, true);
    assert.match(result.reason, /All prerequisite artifacts present/);
  });

  test('blocks when verification-proof.md lacks status: pass', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    writeArtifacts(runRoot, EXECUTOR_ARTIFACTS);
    // Write verification-proof.md without passing status
    const proofPath = path.join(runRoot, 'artifacts', 'verification-proof.md');
    fs.writeFileSync(proofPath, '# Verification\n\nstatus: fail\nSome tests did not pass.\n');
    writePhaseExitEvent(runRoot, 'clarifier');
    writePhaseExitEvent(runRoot, 'executor');
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'final_review',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, false);
    assert.ok(result.failed_proofs);
    assert.ok(result.failed_proofs[0].includes('does not contain'));
    assert.match(result.reason, /Failed proof validation/);
  });

  test('allows verification-proof.md with PASS keyword', () => {
    const { stateRoot, runId, runRoot } = createFixture();
    writeArtifacts(runRoot, EXECUTOR_ARTIFACTS);
    const proofPath = path.join(runRoot, 'artifacts', 'verification-proof.md');
    fs.writeFileSync(proofPath, '# Verification\n\nResult: PASS\n');
    writePhaseExitEvent(runRoot, 'clarifier');
    writePhaseExitEvent(runRoot, 'executor');
    const result = evaluatePhasePrerequisiteGuard({
      run_id: runId,
      phase: 'final_review',
      state_root: stateRoot,
      project_root: ROOT,
    });
    assert.strictEqual(result.allowed, true);
  });
});
