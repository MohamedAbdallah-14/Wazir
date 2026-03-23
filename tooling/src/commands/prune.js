import fs from 'node:fs';
import path from 'node:path';
import { parseCommandOptions } from '../command-options.js';

const RUN_ID_PATTERN = /^run-\d{8}-\d{6}$/;

function success(payload, options = {}) {
  if (options.json) {
    return {
      exitCode: 0,
      stdout: `${JSON.stringify(payload, null, 2)}\n`,
    };
  }

  return {
    exitCode: 0,
    stdout: String(payload) + '\n',
  };
}

function failure(message, exitCode = 1) {
  return {
    exitCode,
    stderr: `${message}\n`,
  };
}

function getRunsDirectory(projectRoot, stateRootOverride) {
  // If state-root specified, use it
  if (stateRootOverride) {
    return path.join(stateRootOverride, 'runs');
  }

  // Default to project-local .wazir/runs
  return path.join(projectRoot, '.wazir', 'runs');
}

function listRuns(runsDir) {
  if (!fs.existsSync(runsDir)) {
    return [];
  }

  const entries = fs.readdirSync(runsDir, { withFileTypes: true });
  const runs = entries
    .filter(entry => entry.isDirectory() && RUN_ID_PATTERN.test(entry.name))
    .map(entry => ({
      id: entry.name,
      timestamp: parseRunTimestamp(entry.name),
    }))
    .sort((a, b) => b.timestamp - a.timestamp); // newest first

  return runs;
}

function parseRunTimestamp(runId) {
  // run-20260324-013757 -> 2026-03-24 01:37:57
  const match = runId.match(/^run-(\d{8})-(\d{6})$/);
  if (!match) return 0;

  const [, dateStr, timeStr] = match;
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10);
  const day = parseInt(dateStr.substring(6, 8), 10);
  const hour = parseInt(timeStr.substring(0, 2), 10);
  const min = parseInt(timeStr.substring(2, 4), 10);
  const sec = parseInt(timeStr.substring(4, 6), 10);

  return new Date(year, month - 1, day, hour, min, sec).getTime();
}

export function runPruneCommand(parsed, context = {}) {
  try {
    // parsed.args is an array like ['--keep', '5', '--json']
    const args = Array.isArray(parsed) ? parsed : (parsed.args ?? []);
    
    const { options } = parseCommandOptions(args, {
      boolean: ['json', 'force', 'help'],
      string: ['keep', 'state-root'],
    });

    const projectRoot = context.cwd ?? process.cwd();
    const runsDir = getRunsDirectory(projectRoot, options['state-root']);

    if (options.help) {
      const help = `Usage: wazir prune [OPTIONS]

Options:
  --keep N           Retain newest N runs (default: 5)
  --force            Skip confirmation prompt
  --json             Output as JSON
  --state-root PATH  Operate on state-root instead of project-local runs
  --help             Show this help message

Examples:
  wazir prune                    List runs, no deletion
  wazir prune --keep 10          Delete runs older than 10 newest
  wazir prune --keep 3 --force   Delete without confirmation
  wazir prune --json             JSON output
`;
      return success(help);
    }

    const runs = listRuns(runsDir);

    if (runs.length === 0) {
      return success({
        action: 'list',
        runs_total: 0,
        runs_kept: 0,
        runs_deleted: 0,
        size_freed_mb: 0,
        protected_run: null,
        deleted_runs: [],
        warnings: [],
      }, { json: options.json });
    }

    // Format output
    if (options.json) {
      return success({
        action: 'list',
        runs_total: runs.length,
        runs_kept: runs.length,
        runs_deleted: 0,
        size_freed_mb: 0,
        protected_run: null,
        deleted_runs: [],
        warnings: [],
      }, { json: true });
    }

    // Human-readable output
    const output = ['Runs in ' + runsDir + ':\n'];
    runs.forEach(run => {
      output.push(`  ${run.id}`);
    });
    output.push(`\nTotal: ${runs.length} runs`);

    return success(output.join('\n'));
  } catch (err) {
    return failure(`Error: ${err.message}`);
  }
}
