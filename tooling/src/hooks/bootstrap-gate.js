/**
 * Bootstrap gate — blocks Write/Edit/Bash when pipeline is active but no run exists.
 */

import fs from 'node:fs';
import path from 'node:path';

const BOOTSTRAP_ALLOWLIST = [
  'wazir', 'git checkout', 'git branch', 'git status', 'git log', 'git diff',
  'which ', 'ls ', 'pwd', 'echo ', 'cat ', 'head ', 'npm test', 'npm run', 'node ',
];

export function evaluateBootstrapGate(projectRoot, payload) {
  const markerPath = path.join(projectRoot, '.wazir', 'state', 'pipeline-active');

  if (!fs.existsSync(markerPath)) {
    return { decision: 'allow' };
  }

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

  const tool = payload.tool || '';
  const command = payload.command || '';

  if (tool === 'Read' || tool === 'Glob' || tool === 'Grep') {
    return { decision: 'allow' };
  }

  if (tool === 'Bash') {
    const cmdLower = command.toLowerCase().trim();
    if (BOOTSTRAP_ALLOWLIST.some(prefix => cmdLower.startsWith(prefix))) {
      return { decision: 'allow' };
    }
  }

  return {
    decision: 'deny',
    reason: 'Pipeline is active but no run exists. Run `wazir capture ensure` first.',
    systemMessage: 'BOOTSTRAP REQUIRED: Run `wazir capture ensure` before writing any code. Please try 100% compliance with Wazir pipeline.',
  };
}
