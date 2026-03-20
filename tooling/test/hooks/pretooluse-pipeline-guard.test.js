import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { evaluatePreToolUse } from '../../src/hooks/pretooluse-pipeline-guard.js';
import { createPipelineState, transitionPhase } from '../../src/state/pipeline-state.js';

describe('pretooluse-pipeline-guard', () => {
  let stateRoot;

  beforeEach(() => {
    stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pretooluse-test-'));
  });

  afterEach(() => {
    fs.rmSync(stateRoot, { recursive: true, force: true });
  });

  it('allows all tools when no state file exists', () => {
    const result = evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/foo/bar.js' } });
    assert.equal(result.decision, 'allow');
  });

  // -- clarify phase restrictions --

  it('denies Write to project files during clarify', () => {
    createPipelineState('run-001', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/project/src/app.js' } });
    assert.equal(result.decision, 'deny');
    assert.ok(result.reason.includes('clarify'));
  });

  it('denies Edit to project files during clarify', () => {
    createPipelineState('run-002', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Edit', input: { file_path: '/project/src/app.js' } });
    assert.equal(result.decision, 'deny');
  });

  it('allows Write to .wazir/ paths during clarify', () => {
    createPipelineState('run-003', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/project/.wazir/runs/latest/clarified/spec.md' } });
    assert.equal(result.decision, 'allow');
  });

  it('allows Read during clarify', () => {
    createPipelineState('run-004', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Read', input: { file_path: '/project/src/app.js' } });
    assert.equal(result.decision, 'allow');
  });

  // -- execute phase --

  it('allows Write during execute', () => {
    createPipelineState('run-005', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/project/src/app.js' } });
    assert.equal(result.decision, 'allow');
  });

  // -- verify phase restrictions --

  it('denies Write during verify', () => {
    createPipelineState('run-006', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    transitionPhase(stateRoot, 'verify');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/project/src/app.js' } });
    assert.equal(result.decision, 'deny');
  });

  it('allows Write to .wazir/ during verify', () => {
    createPipelineState('run-007', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    transitionPhase(stateRoot, 'verify');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/home/.wazir/runs/latest/artifacts/proof.md' } });
    assert.equal(result.decision, 'allow');
  });

  // -- review phase restrictions --

  it('denies Write during review', () => {
    createPipelineState('run-008', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    transitionPhase(stateRoot, 'verify');
    transitionPhase(stateRoot, 'review');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/project/src/app.js' } });
    assert.equal(result.decision, 'deny');
  });

  // -- git restrictions --

  it('denies git commit during clarify via Bash', () => {
    createPipelineState('run-009', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Bash', input: { command: 'git commit -m "test"' } });
    assert.equal(result.decision, 'deny');
    assert.ok(result.reason.includes('Git'));
  });

  it('allows git commit during execute via Bash', () => {
    createPipelineState('run-010', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Bash', input: { command: 'git commit -m "test"' } });
    assert.equal(result.decision, 'allow');
  });

  // -- always-allow rules --

  it('allows wazir CLI commands in any phase', () => {
    createPipelineState('run-011', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Bash', input: { command: 'wazir capture event --run run-011' } });
    assert.equal(result.decision, 'allow');
  });

  it('allows all tools during complete phase', () => {
    createPipelineState('run-012', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    transitionPhase(stateRoot, 'verify');
    transitionPhase(stateRoot, 'review');
    transitionPhase(stateRoot, 'complete');
    const result = evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/project/README.md' } });
    assert.equal(result.decision, 'allow');
  });

  it('allows all tools during init phase', () => {
    createPipelineState('run-013', stateRoot);
    const result = evaluatePreToolUse(stateRoot, { tool: 'Write', input: { file_path: '/project/src/app.js' } });
    assert.equal(result.decision, 'allow');
  });
});
