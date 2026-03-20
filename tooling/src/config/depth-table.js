/**
 * Canonical depth parameter table.
 *
 * Single source of truth for all depth-dependent behavior across the pipeline.
 * Skills reference these values conceptually; hooks and tooling import directly.
 */

export const DEPTH_LEVELS = new Set(['quick', 'standard', 'deep']);

export const DEPTH_TABLE = {
  quick: {
    review_passes: 3,
    loop_cap: 5,
    heartbeat_max_silence_s: 180,
    research_intensity: 'minimal',
    challenge_intensity: 'surface',
    spec_hardening_passes: 1,
    design_review_passes: 1,
    time_estimate_label: '~15-30 min',
  },
  standard: {
    review_passes: 5,
    loop_cap: 10,
    heartbeat_max_silence_s: 120,
    research_intensity: 'balanced',
    challenge_intensity: 'balanced',
    spec_hardening_passes: 3,
    design_review_passes: 3,
    time_estimate_label: '~45-90 min',
  },
  deep: {
    review_passes: 7,
    loop_cap: 15,
    heartbeat_max_silence_s: 90,
    research_intensity: 'thorough',
    challenge_intensity: 'adversarial',
    spec_hardening_passes: 5,
    design_review_passes: 5,
    time_estimate_label: '~2-3 hrs',
  },
};

/**
 * Get a specific depth parameter value.
 *
 * @param {string} depth  — 'quick' | 'standard' | 'deep' (defaults to 'standard')
 * @param {string} param  — parameter name from the depth table
 * @returns {*} the parameter value
 */
export function getDepthParam(depth, param) {
  const level = depth ?? 'standard';
  if (!DEPTH_LEVELS.has(level)) {
    throw new Error(`Unknown depth level: "${level}". Valid levels: ${[...DEPTH_LEVELS].join(', ')}`);
  }
  const entry = DEPTH_TABLE[level];
  if (!(param in entry)) {
    throw new Error(`Unknown depth parameter: "${param}". Valid params: ${Object.keys(entry).join(', ')}`);
  }
  return entry[param];
}
