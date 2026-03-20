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
  setStopHookActive,
  isTransitionAllowed,
  computeArtifactDigest,
  PHASE_ORDER,
} from '../../src/state/pipeline-state.js';

describe('pipeline-state', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-state-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('createPipelineState', () => {
    it('creates a new state file with init phase', () => {
      const state = createPipelineState('run-001', tmpDir);
      assert.equal(state.run_id, 'run-001');
      assert.equal(state.current_phase, 'init');
      assert.equal(state.stop_hook_active, false);
      assert.deepEqual(state.phase_history, []);
      assert.deepEqual(state.artifacts, {});

      // Verify file exists on disk
      const filePath = path.join(tmpDir, 'pipeline-state.json');
      assert.ok(fs.existsSync(filePath));
      const onDisk = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert.equal(onDisk.run_id, 'run-001');
    });
  });

  describe('readPipelineState', () => {
    it('returns null when no state file exists', () => {
      const state = readPipelineState(tmpDir);
      assert.equal(state, null);
    });

    it('reads an existing state file', () => {
      createPipelineState('run-002', tmpDir);
      const state = readPipelineState(tmpDir);
      assert.equal(state.run_id, 'run-002');
      assert.equal(state.current_phase, 'init');
    });
  });

  describe('isTransitionAllowed', () => {
    it('allows forward transitions', () => {
      assert.ok(isTransitionAllowed('init', 'clarify'));
      assert.ok(isTransitionAllowed('clarify', 'execute'));
      assert.ok(isTransitionAllowed('execute', 'verify'));
      assert.ok(isTransitionAllowed('verify', 'review'));
      assert.ok(isTransitionAllowed('review', 'complete'));
    });

    it('denies backward transitions', () => {
      assert.ok(!isTransitionAllowed('clarify', 'init'));
      assert.ok(!isTransitionAllowed('execute', 'clarify'));
      assert.ok(!isTransitionAllowed('review', 'verify'));
      assert.ok(!isTransitionAllowed('complete', 'review'));
    });

    it('denies same-phase transitions', () => {
      assert.ok(!isTransitionAllowed('clarify', 'clarify'));
    });

    it('denies skip transitions', () => {
      assert.ok(!isTransitionAllowed('init', 'execute'));
      assert.ok(!isTransitionAllowed('clarify', 'verify'));
    });
  });

  describe('transitionPhase', () => {
    it('transitions from init to clarify', () => {
      createPipelineState('run-003', tmpDir);
      const state = transitionPhase(tmpDir, 'clarify');
      assert.equal(state.current_phase, 'clarify');
      assert.equal(state.phase_history.length, 1);
      assert.equal(state.phase_history[0].phase, 'init');
      assert.equal(state.phase_history[0].status, 'completed');
    });

    it('throws on invalid transition', () => {
      createPipelineState('run-004', tmpDir);
      assert.throws(
        () => transitionPhase(tmpDir, 'execute'),
        /Invalid transition/,
      );
    });

    it('throws when no state file exists', () => {
      assert.throws(
        () => transitionPhase(tmpDir, 'clarify'),
        /No pipeline state/,
      );
    });
  });

  describe('completePhase', () => {
    it('records artifact digests', () => {
      createPipelineState('run-005', tmpDir);
      transitionPhase(tmpDir, 'clarify');

      // Create a fake artifact to digest
      const artifactPath = path.join(tmpDir, 'test-artifact.md');
      fs.writeFileSync(artifactPath, '# Test artifact content');

      const state = completePhase(tmpDir, 'clarify', {
        clarification: { path: artifactPath },
      });

      assert.ok(state.artifacts.clarification);
      assert.ok(state.artifacts.clarification.digest);
      assert.ok(state.artifacts.clarification.digest.startsWith('sha256:'));
      assert.ok(state.artifacts.clarification.created_at);
    });
  });

  describe('setStopHookActive', () => {
    it('sets flag to true', () => {
      createPipelineState('run-006', tmpDir);
      const state = setStopHookActive(tmpDir, true);
      assert.equal(state.stop_hook_active, true);
    });

    it('clears flag to false', () => {
      createPipelineState('run-007', tmpDir);
      setStopHookActive(tmpDir, true);
      const state = setStopHookActive(tmpDir, false);
      assert.equal(state.stop_hook_active, false);
    });
  });

  describe('computeArtifactDigest', () => {
    it('returns sha256 digest for a file', () => {
      const filePath = path.join(tmpDir, 'digest-test.txt');
      fs.writeFileSync(filePath, 'hello world');
      const digest = computeArtifactDigest(filePath);
      assert.ok(digest.startsWith('sha256:'));
      assert.equal(digest.length, 7 + 64); // 'sha256:' + 64 hex chars
    });

    it('returns null for non-existent file', () => {
      const digest = computeArtifactDigest(path.join(tmpDir, 'nope.txt'));
      assert.equal(digest, null);
    });
  });

  describe('PHASE_ORDER', () => {
    it('has the correct phases in order', () => {
      assert.deepEqual(PHASE_ORDER, ['init', 'clarify', 'execute', 'verify', 'review', 'complete']);
    });
  });
});
