/**
 * Idempotent run bootstrap — ensures a pipeline run exists.
 *
 * - If an incomplete run exists (has ACTIVE phases), resumes it.
 * - If no run exists or the latest is complete, creates a new one.
 * - Always sets the pipeline-active marker.
 * - Always creates/repairs the repo-local latest pointer.
 */

import fs from 'node:fs';
import path from 'node:path';

import { findActivePhase } from '../hooks/phase-injector.js';

const INIT_TEMPLATE = `## Phase: init — ACTIVE
- [ ] Write briefing to \`.wazir/input/briefing.md\`
- [ ] Create feature branch (if on main)
- [ ] Write run-config.yaml
- [ ] Run \`wazir pipeline init --run <id>\` <!-- transition -->
`;

/**
 * Ensure a pipeline run exists. Idempotent.
 *
 * @param {string} projectRoot - Project root directory
 * @param {string} stateRoot - State root directory (~/.wazir/projects/<slug>)
 * @returns {{ runId: string, created: boolean, resumed: boolean }}
 */
export function ensureRun(projectRoot, stateRoot) {
  const repoRunsDir = path.join(projectRoot, '.wazir', 'runs');
  const latestPath = path.join(repoRunsDir, 'latest');
  const markerPath = path.join(projectRoot, '.wazir', 'state', 'pipeline-active');

  // Check for existing incomplete run
  let latestRunId = null;
  try {
    latestRunId = fs.readFileSync(latestPath, 'utf8').trim();
  } catch { /* no latest */ }

  if (latestRunId) {
    const phasesDir = path.join(repoRunsDir, latestRunId, 'phases');
    const active = findActivePhase(phasesDir);
    if (active && !active.malformed) {
      // Incomplete run — resume it
      setMarker(markerPath);
      return { runId: latestRunId, created: false, resumed: true };
    }
  }

  // Create new run
  const runId = `run-${formatTimestamp()}`;
  const runDir = path.join(repoRunsDir, runId);
  const phasesDir = path.join(runDir, 'phases');

  fs.mkdirSync(phasesDir, { recursive: true });

  // Write init phase as ACTIVE, others as NOT ACTIVE headers only
  fs.writeFileSync(path.join(phasesDir, 'init.md'), INIT_TEMPLATE);
  fs.writeFileSync(path.join(phasesDir, 'clarifier.md'), '## Phase: clarifier — NOT ACTIVE\n');
  fs.writeFileSync(path.join(phasesDir, 'executor.md'), '## Phase: executor — NOT ACTIVE\n');
  fs.writeFileSync(path.join(phasesDir, 'final_review.md'), '## Phase: final_review — NOT ACTIVE\n');

  // Create log files
  fs.writeFileSync(path.join(phasesDir, 'init.log.md'), '## Phase: init — Log\n\n');
  fs.writeFileSync(path.join(phasesDir, 'clarifier.log.md'), '## Phase: clarifier — Log\n\n');
  fs.writeFileSync(path.join(phasesDir, 'executor.log.md'), '## Phase: executor — Log\n\n');
  fs.writeFileSync(path.join(phasesDir, 'final_review.log.md'), '## Phase: final_review — Log\n\n');

  // Update latest pointer (repo-local)
  fs.writeFileSync(latestPath, runId, 'utf8');

  // Update latest pointer (state-root) if state root exists
  try {
    const stateRunsDir = path.join(stateRoot, 'runs');
    fs.mkdirSync(stateRunsDir, { recursive: true });
    fs.writeFileSync(path.join(stateRunsDir, 'latest'), runId, 'utf8');
  } catch { /* state root may not exist yet */ }

  // Set pipeline-active marker
  setMarker(markerPath);

  return { runId, created: true, resumed: false };
}

function setMarker(markerPath) {
  fs.mkdirSync(path.dirname(markerPath), { recursive: true });
  fs.writeFileSync(markerPath, 'true', 'utf8');
}

function formatTimestamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}-${h}${min}${s}`;
}
