/**
 * Stop hook gate — narrow completion-signal detection.
 *
 * Only blocks when ALL of:
 *   1. A pipeline run is active (phases dir exists with files)
 *   2. Active phase has unchecked items
 *   3. Agent's message contains a completion-signal pattern
 *
 * Does NOT block normal mid-phase turns (questions, progress, results).
 * Deliberately permissive — false negatives < false positives (deadlocking).
 *
 * Loop guard: after 3 consecutive blocks, the 4th is approved to prevent deadlock.
 * Fail-closed: when phases dir exists but files are malformed, blocks by default.
 */

import fs from 'node:fs';
import { findActivePhase, extractCurrentStep, resolveActiveScope } from './phase-injector.js';

const COMPLETION_SIGNALS = [
  'task complete',
  'all done',
  'ready to commit',
  'shall i create a pr',
  'work is finished',
  'implementation complete',
  'pipeline complete',
  'run complete',
  'everything is done',
  'that covers everything',
];

const MAX_CONSECUTIVE_BLOCKS = 3;

/**
 * Read the consecutive block count from the counter file.
 * @param {string} phasesDir
 * @returns {number}
 */
function readBlockCount(phasesDir, currentPhase) {
  try {
    const countPath = `${phasesDir}/.stop-block-count`;
    const raw = fs.readFileSync(countPath, 'utf8').trim();
    // Format: "phase:count" — reset if phase changed
    const [savedPhase, countStr] = raw.includes(':') ? raw.split(':') : ['', raw];
    if (savedPhase !== currentPhase) return 0;
    return parseInt(countStr, 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Write the consecutive block count to the counter file.
 * @param {string} phasesDir
 * @param {number} count
 */
function writeBlockCount(phasesDir, currentPhase, count) {
  try {
    fs.writeFileSync(`${phasesDir}/.stop-block-count`, `${currentPhase}:${count}`, 'utf8');
  } catch { /* best effort */ }
}

/**
 * Evaluate whether to block the agent from stopping.
 *
 * @param {string} runDir - Path to the run directory (containing phases/)
 * @param {string} agentMessage - The agent's last message text
 * @returns {{ decision: 'approve'|'block', reason?: string, systemMessage?: string }}
 */
export function evaluateStopGate(runDir, agentMessage = '') {
  const phasesDir = `${runDir}/phases`;

  // 1. Check if phases directory exists (run might be active)
  let phaseDirExists = false;
  try {
    const entries = fs.readdirSync(phasesDir).filter(f => f.endsWith('.md') && !f.includes('.log.'));
    phaseDirExists = entries.length > 0;
  } catch {
    // No phases dir — not a pipeline session
  }

  if (!phaseDirExists) {
    return { decision: 'approve', reason: 'No pipeline phases — allowing stop.' };
  }

  // 2. Find active phase
  const active = findActivePhase(phasesDir);
  if (!active) {
    // Phases dir exists but no ACTIVE header — fail-closed (malformed state)
    return {
      decision: 'block',
      reason: 'Phase files exist but no ACTIVE phase found — blocking (fail-closed).',
      systemMessage: 'Pipeline state appears malformed. No ACTIVE phase found but phase files exist.',
    };
  }

  // 2b. Handle malformed state (multiple ACTIVE phases)
  if (active.malformed) {
    return {
      decision: 'block',
      reason: active.reason,
      systemMessage: `Pipeline state malformed: ${active.reason}`,
    };
  }

  // 3. Check for unchecked items in pipeline phase
  const step = extractCurrentStep(active.content);

  // 3b. Check scope stack for skill-level unchecked items
  const scope = resolveActiveScope(runDir);
  let skillStep = null;
  let skillPhase = null;
  if (scope.type === 'skill') {
    const skillActive = findActivePhase(scope.phasesDir);
    if (skillActive) {
      skillStep = extractCurrentStep(skillActive.content);
      skillPhase = skillActive.phase;
    }
  }

  if (!step && !skillStep) {
    writeBlockCount(phasesDir, active.phase, 0); // Reset counter on approve
    return { decision: 'approve', reason: 'All items checked — phase complete.' };
  }

  // 4. Check for completion signal
  const msgLower = (agentMessage || '').toLowerCase();
  const hasCompletionSignal = COMPLETION_SIGNALS.some(sig => msgLower.includes(sig));

  if (!hasCompletionSignal) {
    writeBlockCount(phasesDir, active.phase, 0); // Reset counter on approve
    return { decision: 'approve', reason: 'No completion signal — normal turn.' };
  }

  // 5. Loop guard: prevent infinite blocking (per-phase counter)
  const blockCount = readBlockCount(phasesDir, active.phase);
  if (blockCount >= MAX_CONSECUTIVE_BLOCKS) {
    writeBlockCount(phasesDir, active.phase, 0); // Reset counter
    return {
      decision: 'approve',
      reason: `Loop guard: ${MAX_CONSECUTIVE_BLOCKS} consecutive blocks reached — allowing stop to prevent deadlock.`,
    };
  }

  // All conditions met — block
  writeBlockCount(phasesDir, active.phase, blockCount + 1);

  // Prefer skill scope message if skill has unchecked items
  if (skillStep) {
    const skillUnchecked = skillStep.totalSteps - skillStep.stepNum + 1;
    return {
      decision: 'block',
      reason: `Cannot stop. Skill ${scope.skill} phase ${skillPhase} has ${skillUnchecked} unchecked items. Current: ${skillStep.current}`,
      systemMessage: `You have unchecked skill items in ${scope.skill} phase ${skillPhase}. Complete them before finishing.`,
    };
  }

  const uncheckedCount = step.totalSteps - step.stepNum + 1;
  return {
    decision: 'block',
    reason: `Cannot stop. Phase ${active.phase} has ${uncheckedCount} unchecked items. Current: ${step.current}`,
    systemMessage: `You have unchecked pipeline items in phase ${active.phase}. Complete them before finishing.`,
  };
}
