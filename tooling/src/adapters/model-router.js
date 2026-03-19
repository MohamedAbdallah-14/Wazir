/**
 * Model routing table — maps task types to recommended models.
 * @type {Object<string, {model: string, reason: string}>}
 */
const MODEL_ROUTING_TABLE = {
  // Mechanical tasks — Haiku
  'fetch-url':           { model: 'haiku', reason: 'Mechanical, no reasoning needed' },
  'write-handoff':       { model: 'haiku', reason: 'Structured file operations' },
  'compress-archive':    { model: 'haiku', reason: 'File manipulation' },

  // Comprehension tasks — Sonnet
  'read-summarize':      { model: 'sonnet', reason: 'Comprehension, not deep reasoning' },
  'write-implementation':{ model: 'sonnet', reason: 'Good spec + plan = mechanical coding' },
  'task-review':         { model: 'sonnet', reason: 'Diff review against clear spec' },
  'extract-learnings':   { model: 'sonnet', reason: 'Structured extraction' },
  'internal-review':     { model: 'sonnet', reason: 'Pattern matching against expertise' },
  'run-tests':           { model: 'sonnet', reason: 'Test execution and analysis' },

  // Judgment tasks — Opus
  'orchestrate':         { model: 'opus', reason: 'Needs judgment and coordination' },
  'spec-harden':         { model: 'opus', reason: 'Adversarial thinking required' },
  'design':              { model: 'opus', reason: 'Creativity + architecture decisions' },
  'final-review':        { model: 'opus', reason: 'Holistic judgment against original input' },
  'brainstorm':          { model: 'opus', reason: 'Creative exploration' },
  'plan':                { model: 'opus', reason: 'Strategic task decomposition' },
};

/**
 * Get the recommended model for a task type.
 *
 * If multi-model mode is not enabled, returns `{ model: 'inherit' }`.
 * If config contains `model_overrides`, those take precedence over the
 * default routing table.  Unknown task types fall back to 'opus' (safe
 * default — never under-model a task).
 *
 * @param {string} taskType - one of the keys in MODEL_ROUTING_TABLE
 * @param {object} config - project config (may override routing)
 * @returns {{model: string, reason: string, overridden: boolean}}
 */
export function getModelForTask(taskType, config = {}) {
  if (!isMultiModelEnabled(config)) {
    return { model: 'inherit', reason: 'Multi-model mode not enabled', overridden: false };
  }

  // Check config-level overrides first
  const overrides = config.model_overrides ?? {};
  if (overrides[taskType]) {
    return {
      model: overrides[taskType].model ?? 'opus',
      reason: overrides[taskType].reason ?? 'Config override',
      overridden: true,
    };
  }

  // Look up the default routing table
  const entry = MODEL_ROUTING_TABLE[taskType];
  if (entry) {
    return { model: entry.model, reason: entry.reason, overridden: false };
  }

  // Unknown task type — safe default is opus (never under-model)
  return { model: 'opus', reason: 'Unknown task type — safe default', overridden: false };
}

/**
 * Check if multi-model mode is enabled.
 * @param {object} config
 * @returns {boolean}
 */
export function isMultiModelEnabled(config = {}) {
  return config.model_mode === 'multi-model';
}

/**
 * Get all routing decisions for logging/stats.
 * @returns {Object<string, {model: string, reason: string}>}
 */
export function getRoutingTable() {
  const copy = {};
  for (const [key, value] of Object.entries(MODEL_ROUTING_TABLE)) {
    copy[key] = { ...value };
  }
  return copy;
}
