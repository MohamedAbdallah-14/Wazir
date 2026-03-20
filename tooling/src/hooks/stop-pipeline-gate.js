import { readPipelineState, setStopHookActive } from '../state/pipeline-state.js';

const SAFETY_VALVE_REASONS = new Set(['context-limit', 'user-abort']);

/**
 * Evaluate whether the Stop hook should block or allow conversation end.
 *
 * @param {string} stateRoot  — path to the pipeline state directory
 * @param {object} context    — stop context (may include stop_reason)
 * @returns {{ decision: 'allow'|'block', reason: string }}
 */
export function evaluateStopGate(stateRoot, context = {}) {
  // 1. No state file → not a pipeline session → allow
  let state;
  try {
    state = readPipelineState(stateRoot);
  } catch {
    return { decision: 'allow', reason: 'State read error — allowing stop.' };
  }

  if (!state) {
    return { decision: 'allow', reason: 'No pipeline state — no pipeline active, allowing stop.' };
  }

  // 2. Malformed state (no current_phase)
  if (!state.current_phase) {
    return { decision: 'allow', reason: 'Pipeline state malformed — allowing stop.' };
  }

  // 3. Safety valve: stop_hook_active flag (infinite loop guard)
  if (state.stop_hook_active) {
    try { setStopHookActive(stateRoot, false); } catch { /* best effort */ }
    return { decision: 'allow', reason: 'Stop hook loop guard active — allowing stop to break loop.' };
  }

  // 4. Safety valve: context-limit or user-abort
  if (context.stop_reason && SAFETY_VALVE_REASONS.has(context.stop_reason)) {
    return { decision: 'allow', reason: `Safety valve: ${context.stop_reason} — allowing stop.` };
  }

  // 5. Init phase — pipeline hasn't started real work yet
  if (state.current_phase === 'init') {
    return { decision: 'allow', reason: 'Pipeline at init — no work in progress, allowing stop.' };
  }

  // 6. Complete phase — all done
  if (state.current_phase === 'complete') {
    return { decision: 'allow', reason: 'Pipeline complete — all phases done.' };
  }

  // 7. Pipeline is in progress — block
  try { setStopHookActive(stateRoot, true); } catch { /* best effort */ }

  const remaining = getRemainingPhases(state.current_phase);
  return {
    decision: 'block',
    reason: `Pipeline incomplete: currently in "${state.current_phase}" phase. Remaining: ${remaining.join(', ')}. Complete all phases before stopping.`,
  };
}

function getRemainingPhases(currentPhase) {
  const phases = ['clarify', 'execute', 'verify', 'review', 'complete'];
  const idx = phases.indexOf(currentPhase);
  if (idx === -1) return phases;
  return phases.slice(idx);
}

// ---------------------------------------------------------------------------
// CLI entry point — reads stateRoot from argv, prints JSON to stdout
// ---------------------------------------------------------------------------

const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isDirectRun) {
  const stateRoot = process.argv[2] || process.env.WAZIR_STATE_ROOT;
  if (!stateRoot) {
    console.log(JSON.stringify({ decision: 'allow', reason: 'No state root provided.' }));
    process.exit(0);
  }

  // Read context from stdin if available
  let context = {};
  try {
    const input = require('node:fs').readFileSync(0, 'utf8').trim();
    if (input) context = JSON.parse(input);
  } catch { /* no stdin or invalid JSON */ }

  const result = evaluateStopGate(stateRoot, context);
  console.log(JSON.stringify(result));
  process.exit(0);
}
