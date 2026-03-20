import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { evaluateDispatch } from '../../src/hooks/pretooluse-dispatcher.js';
import { createPipelineState, transitionPhase } from '../../src/state/pipeline-state.js';

describe('pretooluse-dispatcher', () => {
  let stateRoot;
  let projectRoot;

  beforeEach(() => {
    stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatcher-test-'));
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatcher-project-'));
    // Write a minimal manifest for protected path checks
    fs.writeFileSync(
      path.join(projectRoot, 'wazir.manifest.yaml'),
      'project:\n  name: test-project\nprotected_paths:\n  - input\n  - roles\n  - workflows\n  - schemas\n  - exports/hosts\n',
    );
  });

  afterEach(() => {
    fs.rmSync(stateRoot, { recursive: true, force: true });
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  // -- Always-allowed tools --

  it('allows Read tool regardless of phase', () => {
    createPipelineState('run-d01', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluateDispatch(stateRoot, projectRoot, { tool: 'Read', input: { file_path: '/foo.js' } });
    assert.equal(result.decision, 'allow');
  });

  it('allows Grep tool regardless of phase', () => {
    createPipelineState('run-d02', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluateDispatch(stateRoot, projectRoot, { tool: 'Grep', input: {} });
    assert.equal(result.decision, 'allow');
  });

  // -- .wazir/ path always allowed --

  it('allows Write to .wazir/ paths during clarify', () => {
    createPipelineState('run-d03', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Write',
      input: { file_path: '/project/.wazir/runs/latest/clarified/spec.md' },
    });
    assert.equal(result.decision, 'allow');
  });

  // -- Protected path denials --

  it('denies Write to protected path (input/)', () => {
    createPipelineState('run-d04', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Write',
      input: { file_path: path.join(projectRoot, 'input', 'briefing.md') },
    });
    assert.equal(result.decision, 'deny');
    assert.ok(result.reason.includes('Protected'));
  });

  it('denies Edit to protected path (roles/)', () => {
    createPipelineState('run-d05', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Edit',
      input: { file_path: path.join(projectRoot, 'roles', 'clarifier.md') },
    });
    assert.equal(result.decision, 'deny');
    assert.ok(result.reason.includes('Protected'));
  });

  it('allows Write to non-protected path during execute', () => {
    createPipelineState('run-d06', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Write',
      input: { file_path: path.join(projectRoot, 'tooling', 'src', 'new-file.js') },
    });
    assert.equal(result.decision, 'allow');
  });

  // -- Phase-based denials --

  it('denies Write during clarify phase', () => {
    createPipelineState('run-d07', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Write',
      input: { file_path: path.join(projectRoot, 'src', 'app.js') },
    });
    assert.equal(result.decision, 'deny');
    assert.ok(result.reason.includes('clarify'));
  });

  it('denies git commit during clarify', () => {
    createPipelineState('run-d08', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Bash',
      input: { command: 'git commit -m "test"' },
    });
    assert.equal(result.decision, 'deny');
    assert.ok(result.reason.includes('Git'));
  });

  it('denies Write during verify phase', () => {
    createPipelineState('run-d09', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    transitionPhase(stateRoot, 'verify');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Write',
      input: { file_path: path.join(projectRoot, 'src', 'app.js') },
    });
    assert.equal(result.decision, 'deny');
  });

  it('denies Write during review phase', () => {
    createPipelineState('run-d10', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    transitionPhase(stateRoot, 'verify');
    transitionPhase(stateRoot, 'review');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Write',
      input: { file_path: path.join(projectRoot, 'src', 'app.js') },
    });
    assert.equal(result.decision, 'deny');
  });

  // -- Context-mode routing --

  it('classifies npm test as large command', () => {
    createPipelineState('run-d11', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Bash',
      input: { command: 'npm test' },
    });
    assert.equal(result.decision, 'allow');
    assert.ok(result.routing_decision);
    assert.equal(result.routing_decision.category, 'large');
  });

  it('classifies git status as small command', () => {
    createPipelineState('run-d12', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Bash',
      input: { command: 'git status' },
    });
    assert.equal(result.decision, 'allow');
    assert.ok(result.routing_decision);
    assert.equal(result.routing_decision.category, 'small');
  });

  it('classifies piped command as ambiguous', () => {
    createPipelineState('run-d13', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Bash',
      input: { command: 'cat foo.txt | wc -l' },
    });
    assert.equal(result.decision, 'allow');
    assert.ok(result.routing_decision);
    assert.equal(result.routing_decision.category, 'ambiguous');
  });

  // -- wazir CLI always allowed --

  it('allows wazir CLI commands in clarify phase', () => {
    createPipelineState('run-d14', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Bash',
      input: { command: 'wazir capture event --run run-d14' },
    });
    assert.equal(result.decision, 'allow');
  });

  // -- No state = allow all --

  it('allows everything when no state exists', () => {
    const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-'));
    const result = evaluateDispatch(emptyRoot, projectRoot, {
      tool: 'Write',
      input: { file_path: '/foo.js' },
    });
    assert.equal(result.decision, 'allow');
    fs.rmSync(emptyRoot, { recursive: true, force: true });
  });

  // -- Logging --

  it('produces a routing_decision for Bash commands', () => {
    createPipelineState('run-d15', stateRoot);
    transitionPhase(stateRoot, 'clarify');
    transitionPhase(stateRoot, 'execute');
    const result = evaluateDispatch(stateRoot, projectRoot, {
      tool: 'Bash',
      input: { command: 'echo hello' },
    });
    assert.equal(result.decision, 'allow');
    assert.ok(result.routing_decision, 'should have routing_decision for Bash');
  });
});
