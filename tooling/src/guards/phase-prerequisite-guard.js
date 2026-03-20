import fs from 'node:fs';
import path from 'node:path';

import { readYamlFile } from '../loaders.js';
import { getRunPaths, readPhaseExitEvents } from '../capture/store.js';

/**
 * Validates that every enabled workflow has a phase_exit event
 * in the run's events.ndjson before the run can be marked complete.
 *
 * If a run-config with workflow_policy exists, only workflows with
 * enabled: true are checked. Otherwise falls back to the manifest list.
 */
export function validateRunCompletion(runDir, manifestPath) {
  const manifest = readYamlFile(manifestPath);
  const declaredWorkflows = manifest.workflows ?? [];

  if (declaredWorkflows.length === 0) {
    return { complete: true, missing: [] };
  }

  // Filter to enabled workflows if run-config exists
  const runConfigPath = path.join(runDir, 'run-config.yaml');
  let enabledWorkflows = declaredWorkflows;
  if (fs.existsSync(runConfigPath)) {
    try {
      const runConfig = readYamlFile(runConfigPath);
      const policy = runConfig.workflow_policy;
      if (policy && typeof policy === 'object') {
        enabledWorkflows = declaredWorkflows.filter(w => {
          const wPolicy = policy[w] ?? policy[w.replace(/_/g, '-')];
          // If no policy entry, assume enabled; if entry exists, check enabled field
          return wPolicy ? (wPolicy.enabled !== false) : true;
        });
      }
    } catch {
      // If run-config can't be read, fall back to full manifest list
    }
  }

  const eventsPath = path.join(runDir, 'events.ndjson');
  const completedWorkflows = new Set();

  if (fs.existsSync(eventsPath)) {
    const content = fs.readFileSync(eventsPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const event = JSON.parse(trimmed);
        if (event.event === 'phase_exit' && event.status === 'completed' && event.phase) {
          completedWorkflows.add(event.phase);
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  const missing = enabledWorkflows.filter(w => !completedWorkflows.has(w));

  return { complete: missing.length === 0, missing };
}

export function evaluateScopeCoverageGuard(payload) {
  const { input_item_count: inputCount, plan_task_count: planCount, user_approved_reduction: userApproved } = payload;

  const safeInputCount = inputCount ?? 0;
  const safePlanCount = planCount ?? 0;

  if (safeInputCount === 0) {
    return {
      allowed: true,
      reason: 'No input items to check against.',
      input_count: safeInputCount,
      plan_count: safePlanCount,
    };
  }

  if (safePlanCount >= safeInputCount) {
    return {
      allowed: true,
      reason: `Plan covers all input items (${safePlanCount} tasks >= ${safeInputCount} items).`,
      input_count: safeInputCount,
      plan_count: safePlanCount,
    };
  }

  if (userApproved === true) {
    return {
      allowed: true,
      reason: `User explicitly approved scope reduction (${safePlanCount} tasks < ${safeInputCount} items).`,
      input_count: safeInputCount,
      plan_count: safePlanCount,
    };
  }

  return {
    allowed: false,
    reason: `Scope reduction detected: plan has ${safePlanCount} tasks but input has ${safeInputCount} items. User approval required.`,
    input_count: safeInputCount,
    plan_count: safePlanCount,
  };
}

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
  const failedProofs = [];
  for (const artifact of requiredArtifacts) {
    const artifactPath = path.join(runPaths.runRoot, artifact);
    if (!fs.existsSync(artifactPath)) {
      missingArtifacts.push(artifact);
      continue;
    }

    const basename = path.basename(artifact);

    // Content validation for proof JSON files (e.g. proof-task-001.json, verification-proof.json)
    if (basename.includes('proof') && basename.endsWith('.json')) {
      try {
        const content = fs.readFileSync(artifactPath, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed.all_passed !== true) {
          failedProofs.push(`${artifact}: all_passed is not true (got ${JSON.stringify(parsed.all_passed)})`);
        }
      } catch {
        // Fail closed: malformed JSON blocks the phase
        failedProofs.push(`${artifact}: malformed or unreadable JSON`);
      }
      continue;
    }

    // Content validation for verification-proof.md
    if (basename === 'verification-proof.md') {
      try {
        const content = fs.readFileSync(artifactPath, 'utf8');
        const lower = content.toLowerCase();
        if (!lower.includes('status: pass') && !content.includes('PASS')) {
          failedProofs.push(`${artifact}: does not contain "status: pass" or "PASS"`);
        }
      } catch {
        failedProofs.push(`${artifact}: unreadable`);
      }
    }
  }

  const completedPhases = readPhaseExitEvents(runPaths);
  const missingPhaseExits = [];
  for (const requiredPhase of requiredPhaseExits) {
    if (!completedPhases.includes(requiredPhase)) {
      missingPhaseExits.push(requiredPhase);
    }
  }

  // OR-logic for resumed runs: if all artifacts exist and proofs pass, allow even without phase_exit events.
  // Artifacts are the hard evidence; phase_exits are supplementary.
  // But if artifacts are missing or proofs fail, phase_exits alone are not sufficient.
  if (missingArtifacts.length === 0 && failedProofs.length === 0) {
    return {
      allowed: true,
      reason: `All prerequisite artifacts present for phase ${phase}.`,
    };
  }

  const reasons = [];
  if (missingArtifacts.length > 0) {
    reasons.push(`Missing artifacts: ${missingArtifacts.join(', ')}`);
  }
  if (failedProofs.length > 0) {
    reasons.push(`Failed proof validation: ${failedProofs.join('; ')}`);
  }
  if (missingPhaseExits.length > 0) {
    reasons.push(`Missing phase exits: ${missingPhaseExits.join(', ')}`);
  }

  return {
    allowed: false,
    reason: reasons.join('. '),
    missing_artifacts: missingArtifacts.length > 0 ? missingArtifacts : undefined,
    failed_proofs: failedProofs.length > 0 ? failedProofs : undefined,
    missing_phase_exits: missingPhaseExits.length > 0 ? missingPhaseExits : undefined,
  };
}
