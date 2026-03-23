/**
 * Stop hook gate — narrow completion-signal detection.
 *
 * Only blocks when ALL of:
 *   1. A pipeline run is active (phases dir exists)
 *   2. Active phase has unchecked items
 *   3. Agent's message contains a completion-signal pattern
 *
 * Does NOT block normal mid-phase turns (questions, progress, results).
 * Deliberately permissive — false negatives < false positives (deadlocking).
 */

import { findActivePhase, extractCurrentStep } from './phase-injector.js';

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

/**
 * Evaluate whether to block the agent from stopping.
 *
 * @param {string} runDir - Path to the run directory (containing phases/)
 * @param {string} agentMessage - The agent's last message text
 * @returns {{ decision: 'approve'|'block', reason?: string }}
 */
export function evaluateStopGate(runDir, agentMessage = '') {
  const phasesDir = `${runDir}/phases`;

  // 1. Check if run is active
  const active = findActivePhase(phasesDir);
  if (!active) {
    return { decision: 'approve', reason: 'No active phase — allowing stop.' };
  }

  // 2. Check for unchecked items
  const step = extractCurrentStep(active.content);
  if (!step) {
    return { decision: 'approve', reason: 'All items checked — phase complete.' };
  }

  // 3. Check for completion signal
  const msgLower = (agentMessage || '').toLowerCase();
  const hasCompletionSignal = COMPLETION_SIGNALS.some(sig => msgLower.includes(sig));

  if (!hasCompletionSignal) {
    return { decision: 'approve', reason: 'No completion signal — normal turn.' };
  }

  // All three conditions met — block
  const uncheckedCount = step.totalSteps - step.stepNum + 1;
  return {
    decision: 'block',
    reason: `Cannot stop. Phase ${active.phase} has ${uncheckedCount} unchecked items. Current: ${step.current}`,
    systemMessage: `You have unchecked pipeline items in phase ${active.phase}. Complete them before finishing.`,
  };
}
