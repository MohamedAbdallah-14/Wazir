import { readPipelineState } from '../state/pipeline-state.js';

// ---------------------------------------------------------------------------
// Phase → tool restriction rules
// ---------------------------------------------------------------------------

// Phases where Write/Edit to project files are blocked
const WRITE_BLOCKED_PHASES = new Set(['clarify', 'verify', 'review']);

// Phases where git commit/push are blocked
const GIT_BLOCKED_PHASES = new Set(['init', 'clarify', 'verify', 'review']);

// Phases where all tools are unrestricted
const UNRESTRICTED_PHASES = new Set(['init', 'execute', 'complete']);

// Tools that are always allowed (read-only operations)
const ALWAYS_ALLOWED_TOOLS = new Set(['Read', 'Grep', 'Glob', 'Agent', 'Skill', 'TaskCreate', 'TaskUpdate', 'TaskList', 'TaskGet']);

// Git commands that modify state
const GIT_MUTATING_PATTERNS = [
  /^git\s+commit/,
  /^git\s+push/,
  /^git\s+merge/,
  /^git\s+rebase/,
  /^git\s+reset/,
  /^git\s+checkout\s+--/,
];

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a tool call should be allowed in the current pipeline phase.
 *
 * @param {string} stateRoot  — path to the pipeline state directory
 * @param {object} hookInput  — { tool: string, input: object }
 * @returns {{ decision: 'allow'|'deny', reason?: string }}
 */
export function evaluatePreToolUse(stateRoot, hookInput) {
  const { tool, input = {} } = hookInput;

  // 1. Always-allowed tools (reads are never blocked)
  if (ALWAYS_ALLOWED_TOOLS.has(tool)) {
    return { decision: 'allow' };
  }

  // 2. No state file → not a pipeline session → allow everything
  let state;
  try {
    state = readPipelineState(stateRoot);
  } catch {
    return { decision: 'allow' };
  }

  if (!state || !state.current_phase) {
    return { decision: 'allow' };
  }

  const phase = state.current_phase;

  // 3. Unrestricted phases
  if (UNRESTRICTED_PHASES.has(phase)) {
    return { decision: 'allow' };
  }

  // 4. Always-allow: .wazir/ path writes (pipeline state management)
  if ((tool === 'Write' || tool === 'Edit') && isWazirPath(input.file_path)) {
    return { decision: 'allow' };
  }

  // 5. Always-allow: wazir CLI commands
  if (tool === 'Bash' && isWazirCommand(input.command)) {
    return { decision: 'allow' };
  }

  // 6. Check Write/Edit restrictions
  if ((tool === 'Write' || tool === 'Edit') && WRITE_BLOCKED_PHASES.has(phase)) {
    return {
      decision: 'deny',
      reason: `Write/Edit blocked during "${phase}" phase. This phase is read-only for project files. Only .wazir/ writes are allowed.`,
    };
  }

  // 7. Check git mutation restrictions in Bash
  if (tool === 'Bash' && GIT_BLOCKED_PHASES.has(phase) && isGitMutating(input.command)) {
    return {
      decision: 'deny',
      reason: `Git mutations (commit/push) blocked during "${phase}" phase. Git commits are only allowed during the execute phase.`,
    };
  }

  // 8. Default: allow
  return { decision: 'allow' };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isWazirPath(filePath) {
  if (!filePath) return false;
  return filePath.includes('.wazir/') || filePath.includes('/.wazir');
}

function isWazirCommand(command) {
  if (!command) return false;
  const trimmed = command.trim();
  return trimmed.startsWith('wazir ') || trimmed === 'wazir';
}

function isGitMutating(command) {
  if (!command) return false;
  const trimmed = command.trim();
  return GIT_MUTATING_PATTERNS.some(pattern => pattern.test(trimmed));
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isDirectRun) {
  const stateRoot = process.argv[2] || process.env.WAZIR_STATE_ROOT;
  if (!stateRoot) {
    console.log(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }

  let hookInput = {};
  try {
    const input = require('node:fs').readFileSync(0, 'utf8').trim();
    if (input) hookInput = JSON.parse(input);
  } catch { /* no stdin */ }

  const result = evaluatePreToolUse(stateRoot, hookInput);
  console.log(JSON.stringify(result));
  process.exit(0);
}
