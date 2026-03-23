/**
 * Bootstrap gate — blocks Write/Edit/Bash when pipeline is active but no run exists.
 *
 * This is the fix for the chicken-and-egg problem: the agent must create a run
 * before the enforcement hooks can work, but the agent skips run creation.
 * This gate forces the issue by blocking all mutating tools until a run exists.
 *
 * Logic:
 * 1. No pipeline-active marker → allow everything (not a Wazir session)
 * 2. Pipeline-active marker exists + run exists → allow (enforcement hooks take over)
 * 3. Pipeline-active marker exists + no run → deny Write/Edit, allow Read,
 *    allow Bash only for bootstrap commands (wazir, git, which)
 */

import fs from 'node:fs';
import path from 'node:path';

const BOOTSTRAP_ALLOWLIST = [
  'wazir',
  'git checkout',
  'git branch',
  'git status',
  'git log',
  'git diff',
  'which ',
  'ls ',
  'pwd',
  'echo ',
  'cat ',
  'head ',
  'npm test',
  'npm run',
  'node ',
];

/**
 * Evaluate whether a tool call should be allowed during bootstrap.
 *
 * @param {string} projectRoot - Project root directory
 * @param {{ tool: string, command?: string }} payload - Tool call info
 * @returns {{ decision: 'allow'|'deny', reason?: string, systemMessage?: string }}
 */
export function evaluateBootstrapGate(projectRoot, payload) {
  const markerPath = path.join(projectRoot, '.wazir', 'state', 'pipeline-active');

  // 1. No marker → not a pipeline session, allow everything
  if (!fs.existsSync(markerPath)) {
    return { decision: 'allow' };
  }

  // 2. Check if a run exists with phase files
  const latestPath = path.join(projectRoot, '.wazir', 'runs', 'latest');
  let hasRun = false;
  try {
    const runId = fs.readFileSync(latestPath, 'utf8').trim();
    const phasesDir = path.join(projectRoot, '.wazir', 'runs', runId, 'phases');
    const files = fs.readdirSync(phasesDir).filter(f => f.endsWith('.md') && !f.includes('.log.'));
    hasRun = files.length > 0;
  } catch { /* no run */ }

  if (hasRun) {
    return { decision: 'allow' };
  }

  // 3. Pipeline active but no run — gate based on tool type
  const tool = payload.tool || '';
  const command = payload.command || '';

  // Read is always allowed
  if (tool === 'Read' || tool === 'Glob' || tool === 'Grep') {
    return { decision: 'allow' };
  }

  // Bash: check allowlist
  if (tool === 'Bash') {
    const cmdLower = command.toLowerCase().trim();
    const allowed = BOOTSTRAP_ALLOWLIST.some(prefix => cmdLower.startsWith(prefix));
    if (allowed) {
      return { decision: 'allow' };
    }
  }

  // Block everything else
  return {
    decision: 'deny',
    reason: 'Pipeline is active but no run exists. Run `wazir capture ensure` first to create or resume a pipeline run.',
    systemMessage: 'BOOTSTRAP REQUIRED: A Wazir pipeline session is active but no run has been created. Run `wazir capture ensure` before writing any code. This command will create a new run or resume an existing one.',
  };
}
