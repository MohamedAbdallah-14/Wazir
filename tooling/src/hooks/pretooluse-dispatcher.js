import fs from 'node:fs';
import path from 'node:path';

import { readPipelineState } from '../state/pipeline-state.js';
import { readYamlFile } from '../loaders.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALWAYS_ALLOWED_TOOLS = new Set([
  'Read', 'Grep', 'Glob', 'Agent', 'Skill',
  'TaskCreate', 'TaskUpdate', 'TaskList', 'TaskGet',
]);

const WRITE_BLOCKED_PHASES = new Set(['clarify', 'verify', 'review']);
const GIT_BLOCKED_PHASES = new Set(['init', 'clarify', 'verify', 'review']);
const UNRESTRICTED_PHASES = new Set(['init', 'execute', 'complete']);

const GIT_MUTATING_PATTERNS = [
  /^git\s+commit/,
  /^git\s+push/,
  /^git\s+merge/,
  /^git\s+rebase/,
  /^git\s+reset/,
  /^git\s+checkout\s+--/,
];

const DEFAULT_ROUTING_MATRIX = {
  large: ['npm test', 'vitest', 'jest', 'pytest', 'npm run build', 'tsc --noEmit', 'npm ls', 'pip list', 'eslint .', 'prettier --check .', 'tail -f'],
  small: ['git status', 'git log', 'git branch', 'git rev-parse', 'ls', 'pwd', 'mkdir', 'cp', 'mv', 'rm', 'wazir doctor', 'wazir index', 'wazir capture', 'wazir validate', 'which', 'echo'],
  ambiguous_heuristic: { pipe_detected: true, redirect_detected: true, verbose_binaries: ['find', 'rg', 'grep', 'awk', 'sed', 'curl'] },
};

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
// Protected path check
// ---------------------------------------------------------------------------

const APPROVED_FLOWS = new Set([
  'host_export_regeneration',
  'pipeline_integration',
]);

function checkProtectedPath(projectRoot, filePath, approvedFlow) {
  if (!filePath || !projectRoot) return null;

  let manifest;
  try {
    manifest = readYamlFile(path.join(projectRoot, 'wazir.manifest.yaml'));
  } catch {
    // If manifest can't be read, block writes defensively
    return { decision: 'deny', reason: 'Cannot read manifest to check protected paths.' };
  }

  if (!manifest?.protected_paths) return null;

  const absoluteTarget = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(projectRoot, filePath);
  const relTarget = path.relative(projectRoot, absoluteTarget);

  // Outside project = not protected
  if (relTarget === '..' || relTarget.startsWith(`..${path.sep}`) || path.isAbsolute(relTarget)) {
    return null;
  }

  const blocked = manifest.protected_paths.find(
    (pp) => relTarget === pp || relTarget.startsWith(`${pp}${path.sep}`),
  );

  if (blocked) {
    // Check approved flow override
    if (APPROVED_FLOWS.has(approvedFlow)) {
      return null; // approved flow may write protected paths
    }
    return { decision: 'deny', reason: `Protected path blocked: ${relTarget}` };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Context-mode classification
// ---------------------------------------------------------------------------

function classifyCommand(cmd, matrix) {
  if (!cmd) return { category: 'small', reason: 'empty command' };

  if (cmd.includes('# wazir:context-mode')) return { category: 'large', reason: 'explicit marker' };

  for (const pattern of matrix.large) {
    if (cmd === pattern || cmd.startsWith(pattern + ' ') || cmd.startsWith(pattern + '\t')) {
      return { category: 'large', reason: `matched pattern: ${pattern}` };
    }
  }

  if (cmd.includes('# wazir:passthrough')) return { category: 'small', reason: 'passthrough marker' };

  for (const pattern of matrix.small) {
    if (cmd === pattern || cmd.startsWith(pattern + ' ') || cmd.startsWith(pattern + '\t')) {
      return { category: 'small', reason: `matched pattern: ${pattern}` };
    }
  }

  const heuristic = matrix.ambiguous_heuristic || {};
  if (heuristic.pipe_detected && /(?<![\\])\|/.test(cmd)) {
    return { category: 'ambiguous', reason: 'pipe detected' };
  }
  if (heuristic.redirect_detected && /(?<![\\])>/.test(cmd)) {
    return { category: 'ambiguous', reason: 'redirect detected' };
  }

  const bin = cmd.split(/\s+/)[0] || '';
  if (Array.isArray(heuristic.verbose_binaries) && heuristic.verbose_binaries.includes(bin)) {
    return { category: 'ambiguous', reason: `verbose binary: ${bin}` };
  }

  return { category: 'small', reason: 'no pattern matched' };
}

// ---------------------------------------------------------------------------
// Load routing matrix
// ---------------------------------------------------------------------------

function loadRoutingMatrix(projectRoot) {
  try {
    const matrixPath = path.join(projectRoot, 'hooks', 'routing-matrix.json');
    return JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  } catch {
    return DEFAULT_ROUTING_MATRIX;
  }
}

// ---------------------------------------------------------------------------
// Main evaluation — consolidates all three PreToolUse concerns
// ---------------------------------------------------------------------------

/**
 * Consolidated PreToolUse dispatcher.
 *
 * Evaluation order:
 * 1. Always-allowed tools (reads, task tools)
 * 2. .wazir/ path writes (pipeline state)
 * 3. wazir CLI commands
 * 4. No state = allow all
 * 5. Protected path check (manifest protected_paths)
 * 6. Phase restriction check (write/git blocks)
 * 7. Context-mode routing (Bash classification)
 *
 * @param {string} stateRoot   — pipeline state directory
 * @param {string} projectRoot — project root directory
 * @param {object} hookInput   — { tool, input }
 * @returns {{ decision: 'allow'|'deny', reason?: string, routing_decision?: object }}
 */
export function evaluateDispatch(stateRoot, projectRoot, hookInput) {
  const { tool, input = {} } = hookInput;

  // 1. Always-allowed tools
  if (ALWAYS_ALLOWED_TOOLS.has(tool)) {
    return { decision: 'allow' };
  }

  // 2. .wazir/ path writes always allowed
  if ((tool === 'Write' || tool === 'Edit') && isWazirPath(input.file_path)) {
    return { decision: 'allow' };
  }

  // 3. wazir CLI commands always allowed
  if (tool === 'Bash' && isWazirCommand(input.command)) {
    return { decision: 'allow' };
  }

  // 4. Protected path check (Write/Edit only — always enforced regardless of phase)
  if (tool === 'Write' || tool === 'Edit') {
    const protectedResult = checkProtectedPath(projectRoot, input.file_path, input.approved_flow);
    if (protectedResult) return protectedResult;
  }

  // 5. No state file = not a pipeline session = allow
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

  // 6. Unrestricted phases
  if (UNRESTRICTED_PHASES.has(phase)) {
    return addRoutingIfBash(tool, input, projectRoot);
  }

  // 7. Phase-based Write/Edit restriction
  if ((tool === 'Write' || tool === 'Edit') && WRITE_BLOCKED_PHASES.has(phase)) {
    return {
      decision: 'deny',
      reason: `Write/Edit blocked during "${phase}" phase. This phase is read-only for project files. Only .wazir/ writes are allowed.`,
    };
  }

  // 8. Phase-based git mutation restriction
  if (tool === 'Bash' && GIT_BLOCKED_PHASES.has(phase) && isGitMutating(input.command)) {
    return {
      decision: 'deny',
      reason: `Git mutations (commit/push) blocked during "${phase}" phase. Git commits are only allowed during the execute phase.`,
    };
  }

  // 9. Context-mode routing for Bash
  return addRoutingIfBash(tool, input, projectRoot);
}

function isContextModeEnabled(projectRoot) {
  const envVal = process.env.WAZIR_CONTEXT_MODE;
  if (envVal !== undefined) return envVal === '1' || envVal === 'true';

  try {
    const manifestPath = path.join(projectRoot, 'wazir.manifest.yaml');
    const manifestText = fs.readFileSync(manifestPath, 'utf8');
    const match = manifestText.match(/context_mode:[\s\S]*?enabled_by_default:\s*(true|false)/);
    if (match) return match[1] === 'true';
  } catch { /* ignore */ }

  return false;
}

function addRoutingIfBash(tool, input, projectRoot) {
  if (tool === 'Bash') {
    const matrix = loadRoutingMatrix(projectRoot);
    const cmd = (input.command || '').trim();
    const classification = classifyCommand(cmd, matrix);
    const contextModeEnabled = isContextModeEnabled(projectRoot);

    let route = 'passthrough';
    if (contextModeEnabled && (classification.category === 'large' || classification.category === 'ambiguous')) {
      route = 'context-mode';
    }

    const routing_decision = {
      command: cmd,
      category: classification.category,
      reason: classification.reason,
      route,
      context_mode_enabled: contextModeEnabled,
    };
    return { decision: 'allow', routing_decision };
  }
  return { decision: 'allow' };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isDirectRun) {
  const stateRoot = process.argv[2] || process.env.WAZIR_STATE_ROOT;
  const projectRoot = process.argv[3] || process.env.WAZIR_PROJECT_ROOT || process.cwd();

  let hookInput = {};
  try {
    const stdin = fs.readFileSync(0, 'utf8').trim();
    if (stdin) hookInput = JSON.parse(stdin);
  } catch { /* no stdin */ }

  if (!stateRoot) {
    console.log(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }

  const result = evaluateDispatch(stateRoot, projectRoot, hookInput);
  console.log(JSON.stringify(result));
  process.exit(0);
}
