import fs from 'node:fs';
import path from 'node:path';

/**
 * Append a user input entry to the run's NDJSON log.
 *
 * @param {string} runDir - Absolute path to the run directory
 * @param {object} entry - { phase, type, content, context }
 *   type: 'instruction' | 'approval' | 'correction' | 'rejection' | 'redirect'
 */
export function captureUserInput(runDir, { phase, type, content, context }) {
  const logPath = path.join(runDir, 'user-input-log.ndjson');
  const record = {
    timestamp: new Date().toISOString(),
    phase: phase ?? 'unknown',
    type: type ?? 'instruction',
    content: content ?? '',
    context: context ?? '',
  };
  fs.appendFileSync(logPath, JSON.stringify(record) + '\n');
  return logPath;
}

/**
 * Read all entries from a run's user input log.
 */
export function readUserInputLog(runDir) {
  const logPath = path.join(runDir, 'user-input-log.ndjson');
  if (!fs.existsSync(logPath)) return [];

  return fs.readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try { return JSON.parse(line); }
      catch { return null; }
    })
    .filter(Boolean);
}

/**
 * Prune old user-input-log.ndjson files, keeping the most recent `keep` runs.
 *
 * @param {string} stateRoot - Absolute path to the state root (e.g. ~/.wazir/projects/foo)
 * @param {number} keep - Number of recent runs to keep (default 10)
 */
export function pruneOldInputLogs(stateRoot, keep = 10) {
  const runsDir = path.join(stateRoot, 'runs');
  if (!fs.existsSync(runsDir)) return { pruned: 0 };

  const entries = fs.readdirSync(runsDir)
    .filter(name => name.startsWith('run-') && fs.statSync(path.join(runsDir, name)).isDirectory())
    .sort()
    .reverse();

  let pruned = 0;
  for (let i = keep; i < entries.length; i++) {
    const logPath = path.join(runsDir, entries[i], 'user-input-log.ndjson');
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
      pruned++;
    }
  }

  return { pruned };
}
