import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { evaluateStopGate } from '../../src/hooks/stop-pipeline-gate.js';
import { createPipelineState, transitionPhase, setStopHookActive } from '../../src/state/pipeline-state.js';

describe('stop-pipeline-gate', () => {
  let stateRoot;

  beforeEach(() => {
    stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stop-gate-test-'));
  });

  afterEach(() => {
    fs.rmSync(stateRoot, { recursive: true, force: true });
  });

  it('allows when no state file exists (non-pipeline session)', () => {
    const result = evaluateStopGate(stateRoot, {});
    assert.equal(result.decision, 'approve');
    assert.ok(result.reason.includes('no pipeline'));
  });

  it('blocks when phase is not complete', () => {
    createPipelineState('run-001', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluateStopGate(stateRoot, {});
    assert.equal(result.decision, 'block');
    assert.ok(result.reason.includes('clarify'));
  });

  it('allows when phase is complete', () => {
    createPipelineState('run-002', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    transitionPhase(stateRoot, 'verify');
    transitionPhase(stateRoot, 'review');
    transitionPhase(stateRoot, 'complete');
    const result = evaluateStopGate(stateRoot, {});
    assert.equal(result.decision, 'approve');
  });

  it('allows on context-limit stop reason', () => {
    createPipelineState('run-003', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluateStopGate(stateRoot, { stop_reason: 'context-limit' });
    assert.equal(result.decision, 'approve');
    assert.ok(result.reason.includes('context-limit'));
  });

  it('allows on user-abort stop reason', () => {
    createPipelineState('run-004', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluateStopGate(stateRoot, { stop_reason: 'user-abort' });
    assert.equal(result.decision, 'approve');
  });

  it('allows when stop_hook_active is true (infinite loop guard)', () => {
    createPipelineState('run-005', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    setStopHookActive(stateRoot, true);
    const result = evaluateStopGate(stateRoot, {});
    assert.equal(result.decision, 'approve');
    assert.ok(result.reason.includes('loop'));
  });

  it('sets stop_hook_active when blocking', () => {
    createPipelineState('run-006', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    evaluateStopGate(stateRoot, {});
    // Read state to verify flag was set
    const stateFile = path.join(stateRoot, 'pipeline-state.json');
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    assert.equal(state.stop_hook_active, true);
  });

  it('clears stop_hook_active when allowing after loop guard', () => {
    createPipelineState('run-007', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    setStopHookActive(stateRoot, true);
    evaluateStopGate(stateRoot, {});
    // Should have cleared it
    const stateFile = path.join(stateRoot, 'pipeline-state.json');
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    assert.equal(state.stop_hook_active, false);
  });

  it('allows on malformed state file', () => {
    fs.writeFileSync(path.join(stateRoot, 'pipeline-state.json'), 'NOT JSON');
    const result = evaluateStopGate(stateRoot, {});
    assert.equal(result.decision, 'approve');
    // readPipelineState returns null for malformed JSON → treated as no pipeline
    assert.ok(result.reason.includes('no pipeline') || result.reason.includes('No pipeline'));
  });

  it('allows when phase is init (no pipeline work started)', () => {
    createPipelineState('run-008', stateRoot);
    // Still on init — allow, don't trap
    const result = evaluateStopGate(stateRoot, {});
    assert.equal(result.decision, 'approve');
  });
});
