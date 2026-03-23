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
import { createPhaseFiles, createRepoLocalSymlink } from './phase-files.js';

/**
 * Ensure a pipeline run exists. Idempotent.
 *
 * @param {string} projectRoot - Project root directory
 * @param {string} stateRoot - State root directory (~/.wazir/projects/<slug>)
 * @returns {{ runId: string, created: boolean, resumed: boolean }}
 */
export function ensureRun(projectRoot, stateRoot) {
  const repoRunsDir = path.join(projectRoot, '.wazir', 'runs');
  const markerPath = path.join(projectRoot, '.wazir', 'state', 'pipeline-active');

  // Check for existing incomplete run
  const latestRunId = readLatestRunId(repoRunsDir);

  if (latestRunId) {
    const phasesDir = path.join(repoRunsDir, latestRunId, 'phases');
    const active = findActivePhase(phasesDir);
    if (active && !active.malformed) {
      // Incomplete run — resume it
      createRepoLocalSymlink(projectRoot, latestRunId);
      writeStateLatestPointer(stateRoot, latestRunId);
      setMarker(markerPath);
      return { runId: latestRunId, created: false, resumed: true };
    }
  }

  // Create new run
  const runId = `run-${formatTimestamp()}`;
  const runDir = path.join(repoRunsDir, runId);
  createPhaseFiles(runDir, projectRoot);
  createRepoLocalSymlink(projectRoot, runId);
  writeStateLatestPointer(stateRoot, runId);

  // Set pipeline-active marker
  setMarker(markerPath);

  return { runId, created: true, resumed: false };
}

function readLatestRunId(repoRunsDir) {
  const latestPath = path.join(repoRunsDir, 'latest');

  try {
    const stat = fs.lstatSync(latestPath);
    if (stat.isSymbolicLink()) {
      return path.basename(fs.readlinkSync(latestPath));
    }
    if (stat.isFile()) {
      return fs.readFileSync(latestPath, 'utf8').trim() || null;
    }
  } catch {
    return null;
  }

  return null;
}

function writeStateLatestPointer(stateRoot, runId) {
  try {
    const stateRunsDir = path.join(stateRoot, 'runs');
    fs.mkdirSync(stateRunsDir, { recursive: true });
    fs.writeFileSync(path.join(stateRunsDir, 'latest'), runId, 'utf8');
  } catch {
    // state root may not exist yet
  }
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
