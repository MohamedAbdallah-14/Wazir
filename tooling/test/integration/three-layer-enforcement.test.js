import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  createPipelineState,
  readPipelineState,
  transitionPhase,
  completePhase,
  PHASE_ORDER,
} from '../../src/state/pipeline-state.js';

import { evaluateStopGate } from '../../src/hooks/stop-pipeline-gate.js';
import { evaluatePreToolUse } from '../../src/hooks/pretooluse-pipeline-guard.js';
import { runGuardrail } from '../../src/guards/guardrail-functions.js';

describe('three-layer-enforcement integration', () => {
  let stateRoot;
  let runDir;

  beforeEach(() => {
    stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'enforce-int-'));
    runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enforce-run-'));
    fs.mkdirSync(path.join(runDir, 'clarified'), { recursive: true });
    fs.mkdirSync(path.join(runDir, 'artifacts'), { recursive: true });
    fs.mkdirSync(path.join(runDir, 'reviews'), { recursive: true });
    fs.mkdirSync(path.join(runDir, 'tasks'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(stateRoot, { recursive: true, force: true });
    fs.rmSync(runDir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // Layer 1: Stop hook
  // -----------------------------------------------------------------------

  it('Stop hook blocks when phase is incomplete', () => {
    createPipelineState('run-int-001', stateRoot);
    transitionPhase(stateRoot, 'clarify');

    const result = evaluateStopGate(stateRoot, {});
    assert.equal(result.decision, 'block');
    assert.ok(result.reason.includes('clarify'));
  });

  it('Stop hook allows when pipeline is complete', () => {
    createPipelineState('run-int-002', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    transitionPhase(stateRoot, 'verify');
    transitionPhase(stateRoot, 'review');
    transitionPhase(stateRoot, 'complete');

    const result = evaluateStopGate(stateRoot, {});
    assert.equal(result.decision, 'allow');
  });

  it('Stop hook allows on context-limit', () => {
    createPipelineState('run-int-003', stateRoot);
    transitionPhase(stateRoot, 'clarify');

    const result = evaluateStopGate(stateRoot, { stop_reason: 'context-limit' });
    assert.equal(result.decision, 'allow');
  });

  // -----------------------------------------------------------------------
  // Layer 2: PreToolUse hook
  // -----------------------------------------------------------------------

  it('PreToolUse denies Write during clarify phase', () => {
    createPipelineState('run-int-004', stateRoot);
    transitionPhase(stateRoot, 'clarify');

    const result = evaluatePreToolUse(stateRoot, {
      tool: 'Write',
      input: { file_path: '/project/src/main.js' },
    });
    assert.equal(result.decision, 'deny');
  });

  it('PreToolUse allows Write during execute phase', () => {
    createPipelineState('run-int-005', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');

    const result = evaluatePreToolUse(stateRoot, {
      tool: 'Write',
      input: { file_path: '/project/src/main.js' },
    });
    assert.equal(result.decision, 'allow');
  });

  it('PreToolUse allows .wazir/ writes in any phase', () => {
    createPipelineState('run-int-006', stateRoot);
    transitionPhase(stateRoot, 'clarify');

    const result = evaluatePreToolUse(stateRoot, {
      tool: 'Write',
      input: { file_path: '/home/user/.wazir/runs/latest/clarified/spec.md' },
    });
    assert.equal(result.decision, 'allow');
  });

  // -----------------------------------------------------------------------
  // Layer 3: State machine + guardrails
  // -----------------------------------------------------------------------

  it('Pipeline state transitions are forward-only', () => {
    createPipelineState('run-int-007', stateRoot);
    transitionPhase(stateRoot, 'clarify');

    // Can go forward
    transitionPhase(stateRoot, 'execute');
    const state = readPipelineState(stateRoot);
    assert.equal(state.current_phase, 'execute');

    // Cannot go backward
    assert.throws(
      () => transitionPhase(stateRoot, 'clarify'),
      /Invalid transition/,
    );
  });

  it('Guardrail rejects when artifacts missing', () => {
    const result = runGuardrail('clarify', {}, runDir);
    assert.equal(result.passed, false);
    assert.ok(result.missing.length > 0);
  });

  it('Guardrail passes when all artifacts present', () => {
    // Create all 4 clarify artifacts
    for (const name of ['clarification.md', 'spec-hardened.md', 'design.md', 'execution-plan.md']) {
      fs.writeFileSync(path.join(runDir, 'clarified', name), `# ${name}\n\nContent for ${name}`);
    }

    const result = runGuardrail('clarify', {}, runDir);
    assert.equal(result.passed, true);
  });

  // -----------------------------------------------------------------------
  // Cross-layer: full pipeline simulation
  // -----------------------------------------------------------------------

  it('Full pipeline: state + guardrails + hooks work together', () => {
    // 1. Create pipeline state
    createPipelineState('run-int-full', stateRoot);

    // 2. Stop hook blocks during init→clarify transition
    transitionPhase(stateRoot, 'clarify');
    assert.equal(evaluateStopGate(stateRoot, {}).decision, 'block');

    // 3. PreToolUse blocks writes during clarify
    assert.equal(
      evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/src/app.js' } }).decision,
      'deny',
    );

    // 4. Simulate clarifier output
    for (const name of ['clarification.md', 'spec-hardened.md', 'design.md', 'execution-plan.md']) {
      fs.writeFileSync(path.join(runDir, 'clarified', name), `# ${name}\nContent`);
    }
    assert.equal(runGuardrail('clarify', {}, runDir).passed, true);

    // 5. Transition to execute
    transitionPhase(stateRoot, 'execute');
    assert.equal(
      evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/src/app.js' } }).decision,
      'allow',
    );

    // 6. Simulate executor output
    fs.mkdirSync(path.join(runDir, 'artifacts', 'task-001'), { recursive: true });
    fs.writeFileSync(path.join(runDir, 'artifacts', 'task-001', 'result.md'), '# Done');
    fs.writeFileSync(path.join(runDir, 'artifacts', 'verification-proof.md'), '# Proof\n\n## Evidence\n- tests pass');
    assert.equal(runGuardrail('execute', {}, runDir).passed, true);

    // 7. Transition through verify → review
    transitionPhase(stateRoot, 'verify');
    assert.equal(runGuardrail('verify', {}, runDir).passed, true);

    transitionPhase(stateRoot, 'review');
    assert.equal(
      evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/src/app.js' } }).decision,
      'deny',
    );

    // 8. Simulate review output
    fs.writeFileSync(
      path.join(runDir, 'reviews', 'verdict.json'),
      JSON.stringify({ score: 62, verdict: 'PASS' }),
    );
    assert.equal(runGuardrail('review', {}, runDir).passed, true);

    // 9. Complete pipeline
    transitionPhase(stateRoot, 'complete');
    assert.equal(evaluateStopGate(stateRoot, {}).decision, 'allow');

    // 10. Verify full phase history
    const finalState = readPipelineState(stateRoot);
    assert.equal(finalState.current_phase, 'complete');
    assert.equal(finalState.phase_history.length, 5); // init, clarify, execute, verify, review
    assert.deepEqual(
      finalState.phase_history.map(h => h.phase),
      ['init', 'clarify', 'execute', 'verify', 'review'],
    );
  });
});
