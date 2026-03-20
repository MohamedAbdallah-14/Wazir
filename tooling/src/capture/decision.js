import fs from 'node:fs';

/**
 * Append a decision entry to the run's NDJSON log.
 *
 * @param {object} runPaths - Run paths object (must include decisionsPath)
 * @param {object} entry - { phase, decision, reason, task_id? }
 */
export function appendDecision(runPaths, { phase, decision, reason, task_id }) {
  const record = {
    timestamp: new Date().toISOString(),
    phase: phase ?? 'unknown',
    decision: decision ?? '',
    reason: reason ?? '',
  };
  if (task_id) {
    record.task_id = task_id;
  }
  fs.appendFileSync(runPaths.decisionsPath, JSON.stringify(record) + '\n');
  return runPaths.decisionsPath;
}

/**
 * Read all entries from a run's decisions log.
 *
 * @param {object} runPaths - Run paths object (must include decisionsPath)
 * @returns {Array<object>}
 */
export function readDecisions(runPaths) {
  if (!fs.existsSync(runPaths.decisionsPath)) return [];

  return fs.readFileSync(runPaths.decisionsPath, 'utf8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try { return JSON.parse(line); }
      catch { return null; }
    })
    .filter(Boolean);
}
