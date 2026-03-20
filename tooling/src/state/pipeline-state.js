import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const PHASE_ORDER = ['init', 'clarify', 'execute', 'verify', 'review', 'complete'];

const STATE_FILE = 'pipeline-state.json';

// ---------------------------------------------------------------------------
// Atomic file write — temp + rename to prevent corruption
// ---------------------------------------------------------------------------

function atomicWriteJson(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.renameSync(tmpPath, filePath);
}

function statePath(stateRoot) {
  return path.join(stateRoot, STATE_FILE);
}

// ---------------------------------------------------------------------------
// Read / Create
// ---------------------------------------------------------------------------

/**
 * Read the current pipeline state. Returns null if no state file exists.
 */
export function readPipelineState(stateRoot) {
  const fp = statePath(stateRoot);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Create a fresh pipeline state for a new run.
 */
export function createPipelineState(runId, stateRoot) {
  const state = {
    run_id: runId,
    current_phase: 'init',
    phase_history: [],
    allowed_transitions: ['clarify'],
    stop_hook_active: false,
    artifacts: {},
    guardrail_results: {},
    session_id: crypto.randomUUID(),
    updated_at: new Date().toISOString(),
  };
  atomicWriteJson(statePath(stateRoot), state);
  return state;
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

/**
 * Check whether a transition from currentPhase to nextPhase is valid.
 * Only forward, sequential transitions are allowed.
 */
export function isTransitionAllowed(currentPhase, nextPhase) {
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  const nextIdx = PHASE_ORDER.indexOf(nextPhase);
  if (currentIdx === -1 || nextIdx === -1) return false;
  return nextIdx === currentIdx + 1;
}

/**
 * Transition to the next phase. Validates the transition is legal.
 * Throws on invalid transition or missing state.
 */
export function transitionPhase(stateRoot, nextPhase) {
  const state = readPipelineState(stateRoot);
  if (!state) {
    throw new Error('No pipeline state found. Call createPipelineState first.');
  }

  if (!isTransitionAllowed(state.current_phase, nextPhase)) {
    throw new Error(
      `Invalid transition: ${state.current_phase} → ${nextPhase}. ` +
      `Allowed: ${state.current_phase} → ${PHASE_ORDER[PHASE_ORDER.indexOf(state.current_phase) + 1] ?? 'none'}`,
    );
  }

  const now = new Date().toISOString();

  // Record the outgoing phase in history
  state.phase_history.push({
    phase: state.current_phase,
    entered_at: state.phase_entered_at ?? state.updated_at,
    exited_at: now,
    status: 'completed',
  });

  // Move to new phase
  state.current_phase = nextPhase;
  state.phase_entered_at = now;

  // Compute next allowed transition
  const nextIdx = PHASE_ORDER.indexOf(nextPhase);
  state.allowed_transitions = nextIdx < PHASE_ORDER.length - 1
    ? [PHASE_ORDER[nextIdx + 1]]
    : [];

  state.updated_at = now;
  atomicWriteJson(statePath(stateRoot), state);
  return state;
}

// ---------------------------------------------------------------------------
// Phase completion (artifact recording)
// ---------------------------------------------------------------------------

/**
 * Mark the current phase as having produced artifacts.
 * artifacts: { name: { path: string } }
 */
export function completePhase(stateRoot, phase, artifacts = {}) {
  const state = readPipelineState(stateRoot);
  if (!state) {
    throw new Error('No pipeline state found.');
  }

  const now = new Date().toISOString();

  for (const [name, meta] of Object.entries(artifacts)) {
    const digest = meta.path ? computeArtifactDigest(meta.path) : null;
    state.artifacts[name] = {
      path: meta.path,
      digest,
      created_at: now,
    };
  }

  state.guardrail_results[phase] = { passed: true, checked_at: now };
  state.updated_at = now;
  atomicWriteJson(statePath(stateRoot), state);
  return state;
}

// ---------------------------------------------------------------------------
// Stop hook flag
// ---------------------------------------------------------------------------

/**
 * Set or clear the stop_hook_active flag to prevent infinite loops.
 */
export function setStopHookActive(stateRoot, active) {
  const state = readPipelineState(stateRoot);
  if (!state) {
    throw new Error('No pipeline state found.');
  }
  state.stop_hook_active = !!active;
  state.updated_at = new Date().toISOString();
  atomicWriteJson(statePath(stateRoot), state);
  return state;
}

// ---------------------------------------------------------------------------
// Artifact dependency graph
// ---------------------------------------------------------------------------

/**
 * Canonical artifact dependency graph for the pipeline.
 * Each artifact lists the artifacts it requires as inputs.
 */
export const ARTIFACT_DEPENDENCY_GRAPH = {
  'clarification.md': { requires: [] },
  'spec-hardened.md': { requires: ['clarification.md'] },
  'design.md': { requires: ['spec-hardened.md'] },
  'execution-plan.md': { requires: ['design.md'] },
};

/**
 * Store artifact dependencies in pipeline state.
 */
export function setArtifactDependencies(stateRoot, depGraph) {
  const state = readPipelineState(stateRoot);
  if (!state) throw new Error('No pipeline state found.');
  state.artifact_dependencies = depGraph;
  state.updated_at = new Date().toISOString();
  atomicWriteJson(statePath(stateRoot), state);
  return state;
}

/**
 * Compute all artifacts downstream of a changed artifact.
 * Walks the dependency graph to find everything that transitively requires
 * the changed artifact.
 *
 * @param {string} changedArtifact — the artifact that was modified
 * @param {object} depGraph — the dependency graph
 * @returns {string[]} downstream artifact names
 */
export function computeDownstreamArtifacts(changedArtifact, depGraph) {
  const downstream = [];
  const visited = new Set();

  function walk(target) {
    for (const [name, meta] of Object.entries(depGraph)) {
      if (visited.has(name)) continue;
      if (meta.requires.includes(target)) {
        visited.add(name);
        downstream.push(name);
        walk(name);
      }
    }
  }

  walk(changedArtifact);
  return downstream;
}

/**
 * Classify the mutation level of a changed artifact.
 *
 * - L0 (cosmetic): unknown artifact, no graph impact
 * - L1 (local): leaf artifact with no downstream dependents
 * - L2 (structural): mid-graph artifact with some downstream dependents
 * - L3 (fundamental): root artifact — everything downstream is affected
 *
 * @param {string} changedArtifact
 * @param {object} depGraph
 * @returns {'L0'|'L1'|'L2'|'L3'}
 */
export function classifyMutation(changedArtifact, depGraph) {
  if (!(changedArtifact in depGraph)) return 'L0';

  const downstream = computeDownstreamArtifacts(changedArtifact, depGraph);
  const entry = depGraph[changedArtifact];

  // Root artifact (no requirements) with downstream dependents
  if (entry.requires.length === 0 && downstream.length > 0) return 'L3';

  // Mid-graph: has downstream dependents
  if (downstream.length > 0) return 'L2';

  // Leaf: no downstream dependents
  return 'L1';
}

// ---------------------------------------------------------------------------
// Artifact digest
// ---------------------------------------------------------------------------

/**
 * Compute sha256 digest of a file. Returns null if file doesn't exist.
 */
export function computeArtifactDigest(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}
