import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  createPipelineState,
  readPipelineState,
  setArtifactDependencies,
  computeDownstreamArtifacts,
  classifyMutation,
  ARTIFACT_DEPENDENCY_GRAPH,
} from '../../src/state/pipeline-state.js';

describe('artifact-dependencies', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-dep-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('ARTIFACT_DEPENDENCY_GRAPH', () => {
    it('defines clarification.md as root with no dependencies', () => {
      assert.deepStrictEqual(ARTIFACT_DEPENDENCY_GRAPH['clarification.md'].requires, []);
    });

    it('defines spec-hardened.md depends on clarification.md', () => {
      assert.ok(ARTIFACT_DEPENDENCY_GRAPH['spec-hardened.md'].requires.includes('clarification.md'));
    });

    it('defines design.md depends on spec-hardened.md', () => {
      assert.ok(ARTIFACT_DEPENDENCY_GRAPH['design.md'].requires.includes('spec-hardened.md'));
    });

    it('defines execution-plan.md depends on design.md', () => {
      assert.ok(ARTIFACT_DEPENDENCY_GRAPH['execution-plan.md'].requires.includes('design.md'));
    });
  });

  describe('setArtifactDependencies()', () => {
    it('stores artifact_dependencies in state', () => {
      createPipelineState('run-ad01', tmpDir);
      setArtifactDependencies(tmpDir, ARTIFACT_DEPENDENCY_GRAPH);
      const state = readPipelineState(tmpDir);
      assert.ok(state.artifact_dependencies);
      assert.deepStrictEqual(
        state.artifact_dependencies['clarification.md'].requires,
        [],
      );
    });
  });

  describe('computeDownstreamArtifacts()', () => {
    it('returns downstream artifacts for clarification.md', () => {
      const downstream = computeDownstreamArtifacts('clarification.md', ARTIFACT_DEPENDENCY_GRAPH);
      assert.ok(downstream.includes('spec-hardened.md'));
      assert.ok(downstream.includes('design.md'));
      assert.ok(downstream.includes('execution-plan.md'));
    });

    it('returns only execution-plan.md for design.md', () => {
      const downstream = computeDownstreamArtifacts('design.md', ARTIFACT_DEPENDENCY_GRAPH);
      assert.ok(downstream.includes('execution-plan.md'));
      assert.ok(!downstream.includes('clarification.md'));
      assert.ok(!downstream.includes('spec-hardened.md'));
    });

    it('returns empty array for execution-plan.md (leaf)', () => {
      const downstream = computeDownstreamArtifacts('execution-plan.md', ARTIFACT_DEPENDENCY_GRAPH);
      assert.equal(downstream.length, 0);
    });

    it('returns empty array for unknown artifact', () => {
      const downstream = computeDownstreamArtifacts('unknown.md', ARTIFACT_DEPENDENCY_GRAPH);
      assert.equal(downstream.length, 0);
    });
  });

  describe('classifyMutation()', () => {
    it('classifies leaf artifact change with no downstream as L1 (local)', () => {
      const level = classifyMutation('execution-plan.md', ARTIFACT_DEPENDENCY_GRAPH);
      assert.equal(level, 'L1');
    });

    it('classifies mid-graph change as L2 (structural)', () => {
      const level = classifyMutation('design.md', ARTIFACT_DEPENDENCY_GRAPH);
      assert.equal(level, 'L2');
    });

    it('classifies root artifact change as L3 (fundamental)', () => {
      const level = classifyMutation('clarification.md', ARTIFACT_DEPENDENCY_GRAPH);
      assert.equal(level, 'L3');
    });

    it('classifies unknown artifact as L0 (cosmetic)', () => {
      const level = classifyMutation('unknown.md', ARTIFACT_DEPENDENCY_GRAPH);
      assert.equal(level, 'L0');
    });
  });
});
