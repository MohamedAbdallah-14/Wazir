import fs from 'node:fs';
import path from 'node:path';

import { readYamlFile } from '../loaders.js';
import { getRunPaths, readPhaseExitEvents } from '../capture/store.js';

export function evaluatePhasePrerequisiteGuard(payload) {
  const { run_id: runId, phase, state_root: stateRoot, project_root: projectRoot } = payload;

  if (!runId) {
    throw new Error('run_id is required');
  }

  if (!phase) {
    throw new Error('phase is required');
  }

  if (!stateRoot) {
    throw new Error('state_root is required');
  }

  if (!projectRoot) {
    throw new Error('project_root is required');
  }

  const runPaths = getRunPaths(stateRoot, runId);

  if (!fs.existsSync(runPaths.statusPath)) {
    throw new Error(`status.json not found for run ${runId}`);
  }

  const manifestPath = path.join(projectRoot, 'wazir.manifest.yaml');
  const manifest = readYamlFile(manifestPath);
  const prerequisites = manifest.phase_prerequisites?.[phase];

  if (!prerequisites || (Object.keys(prerequisites).length === 0)) {
    return {
      allowed: true,
      reason: `No prerequisites defined for phase ${phase}.`,
    };
  }

  const requiredArtifacts = prerequisites.required_artifacts ?? [];
  const requiredPhaseExits = prerequisites.required_phase_exits ?? [];

  const missingArtifacts = [];
  for (const artifact of requiredArtifacts) {
    const artifactPath = path.join(runPaths.runRoot, artifact);
    if (!fs.existsSync(artifactPath)) {
      missingArtifacts.push(artifact);
    }
  }

  const completedPhases = readPhaseExitEvents(runPaths);
  const missingPhaseExits = [];
  for (const requiredPhase of requiredPhaseExits) {
    if (!completedPhases.includes(requiredPhase)) {
      missingPhaseExits.push(requiredPhase);
    }
  }

  // OR-logic for resumed runs: if all artifacts exist, pass even without phase_exit events.
  // Artifacts are the hard evidence; phase_exits are supplementary.
  // But if artifacts are missing, phase_exits alone are not sufficient.
  if (missingArtifacts.length === 0) {
    return {
      allowed: true,
      reason: `All prerequisite artifacts present for phase ${phase}.`,
    };
  }

  const reasons = [];
  if (missingArtifacts.length > 0) {
    reasons.push(`Missing artifacts: ${missingArtifacts.join(', ')}`);
  }
  if (missingPhaseExits.length > 0) {
    reasons.push(`Missing phase exits: ${missingPhaseExits.join(', ')}`);
  }

  return {
    allowed: false,
    reason: reasons.join('. '),
    missing_artifacts: missingArtifacts.length > 0 ? missingArtifacts : undefined,
    missing_phase_exits: missingPhaseExits.length > 0 ? missingPhaseExits : undefined,
  };
}
