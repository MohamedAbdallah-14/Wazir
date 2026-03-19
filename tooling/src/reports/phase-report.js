import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Parse Node.js test runner output to extract pass/fail/skip counts.
 * Handles the built-in `node --test` reporter format.
 * @param {string} output - raw test runner stdout+stderr
 * @returns {{ total: number, passed: number, failed: number, skipped: number }}
 */
export function parseTestOutput(output) {
  const result = { total: 0, passed: 0, failed: 0, skipped: 0 };

  if (!output) {
    return result;
  }

  // Node built-in test runner summary lines:
  //   # tests 12
  //   # pass 10
  //   # fail 1
  //   # skipped 1
  const totalMatch = output.match(/^# tests\s+(\d+)/m);
  const passMatch = output.match(/^# pass\s+(\d+)/m);
  const failMatch = output.match(/^# fail\s+(\d+)/m);
  const skipMatch = output.match(/^# skipped\s+(\d+)/m);

  if (totalMatch) {
    result.total = Number.parseInt(totalMatch[1], 10);
  }

  if (passMatch) {
    result.passed = Number.parseInt(passMatch[1], 10);
  }

  if (failMatch) {
    result.failed = Number.parseInt(failMatch[1], 10);
  }

  if (skipMatch) {
    result.skipped = Number.parseInt(skipMatch[1], 10);
  }

  // Fallback: if no summary lines found, try TAP-style counting
  if (!totalMatch && !passMatch && !failMatch) {
    const okLines = output.match(/^ok \d+/gm);
    const notOkLines = output.match(/^not ok \d+/gm);
    const skipLines = output.match(/^ok \d+ .+# skip/gim);

    result.passed = (okLines?.length ?? 0) - (skipLines?.length ?? 0);
    result.failed = notOkLines?.length ?? 0;
    result.skipped = skipLines?.length ?? 0;
    result.total = result.passed + result.failed + result.skipped;
  }

  return result;
}

/**
 * Run tests and parse results, or return null on failure.
 * @param {string} projectRoot
 * @returns {{ total: number, passed: number, failed: number, skipped: number } | null}
 */
function collectTestResults(projectRoot) {
  try {
    const output = execFileSync(
      'node',
      ['--test', '--experimental-test-snapshots'],
      { cwd: projectRoot, encoding: 'utf8', timeout: 120_000 },
    );

    return parseTestOutput(output);
  } catch (error) {
    // Test command may exit non-zero if tests fail — still parse output
    if (error.stdout || error.stderr) {
      return parseTestOutput(`${error.stdout ?? ''}${error.stderr ?? ''}`);
    }

    return null;
  }
}

/**
 * Parse `git diff --stat` output for files changed, insertions, deletions.
 * @param {string} statOutput - output of git diff --stat
 * @returns {{ files_changed: number, insertions: number, deletions: number }}
 */
export function parseDiffStat(statOutput) {
  const result = { files_changed: 0, insertions: 0, deletions: 0 };

  if (!statOutput) {
    return result;
  }

  // Summary line: " 5 files changed, 120 insertions(+), 30 deletions(-)"
  const summaryMatch = statOutput.match(
    /(\d+) files? changed(?:,\s*(\d+) insertions?\(\+\))?(?:,\s*(\d+) deletions?\(-\))?/,
  );

  if (summaryMatch) {
    result.files_changed = Number.parseInt(summaryMatch[1], 10);
    result.insertions = summaryMatch[2] ? Number.parseInt(summaryMatch[2], 10) : 0;
    result.deletions = summaryMatch[3] ? Number.parseInt(summaryMatch[3], 10) : 0;
  }

  return result;
}

/**
 * Parse `git diff --name-status` output into added/modified/deleted arrays.
 * @param {string} nameStatusOutput
 * @returns {{ added: string[], modified: string[], deleted: string[] }}
 */
export function parseNameStatus(nameStatusOutput) {
  const result = { added: [], modified: [], deleted: [] };

  if (!nameStatusOutput) {
    return result;
  }

  for (const line of nameStatusOutput.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    const statusChar = trimmed[0];
    const filePath = trimmed.slice(1).trim();

    if (!filePath) {
      continue;
    }

    switch (statusChar) {
      case 'A':
        result.added.push(filePath);
        break;
      case 'M':
        result.modified.push(filePath);
        break;
      case 'D':
        result.deleted.push(filePath);
        break;
      default:
        // R (rename), C (copy), etc. — treat as modified
        result.modified.push(filePath);
        break;
    }
  }

  return result;
}

/**
 * Collect diff stats from git.
 * @param {string} projectRoot
 * @param {string} baseBranch
 * @returns {{ files_changed: number, insertions: number, deletions: number } | null}
 */
function collectDiffStats(projectRoot, baseBranch) {
  try {
    const output = execFileSync(
      'git',
      ['diff', '--stat', `${baseBranch}...HEAD`],
      { cwd: projectRoot, encoding: 'utf8', timeout: 15_000 },
    );

    return parseDiffStat(output);
  } catch {
    return null;
  }
}

/**
 * Collect file change summary from git.
 * @param {string} projectRoot
 * @param {string} baseBranch
 * @returns {{ added: string[], modified: string[], deleted: string[] } | null}
 */
function collectFileChanges(projectRoot, baseBranch) {
  try {
    const output = execFileSync(
      'git',
      ['diff', '--name-status', `${baseBranch}...HEAD`],
      { cwd: projectRoot, encoding: 'utf8', timeout: 15_000 },
    );

    return parseNameStatus(output);
  } catch {
    return null;
  }
}

/**
 * List artifact files in run directories.
 * @param {string} stateRoot
 * @param {string} runId
 * @returns {string[]}
 */
function collectArtifacts(stateRoot, runId) {
  const artifacts = [];
  const clarifiedDir = path.join(stateRoot, 'runs', runId, 'clarified');
  const artifactsDir = path.join(stateRoot, 'runs', runId, 'artifacts');

  for (const dir of [clarifiedDir, artifactsDir]) {
    if (fs.existsSync(dir)) {
      try {
        const entries = fs.readdirSync(dir);

        for (const entry of entries) {
          artifacts.push(path.join(dir, entry));
        }
      } catch {
        // ignore read errors
      }
    }
  }

  return artifacts;
}

/**
 * Compute phase duration from events.ndjson.
 * Looks for phase_enter and phase_exit events matching the given phase.
 * @param {string} stateRoot
 * @param {string} runId
 * @param {string} phase
 * @returns {number | null} duration in seconds, or null if unavailable
 */
function collectDuration(stateRoot, runId, phase) {
  const eventsPath = path.join(stateRoot, 'runs', runId, 'events.ndjson');

  if (!fs.existsSync(eventsPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(eventsPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);

    let enterTime = null;
    let exitTime = null;

    for (const line of lines) {
      const event = JSON.parse(line);

      if (event.phase !== phase) {
        continue;
      }

      if (event.event === 'phase_enter' && event.created_at) {
        enterTime = new Date(event.created_at).getTime();
      }

      if (event.event === 'phase_exit' && event.created_at) {
        exitTime = new Date(event.created_at).getTime();
      }
    }

    if (enterTime !== null && exitTime !== null && exitTime > enterTime) {
      return Math.round((exitTime - enterTime) / 1000);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Collect metrics for a phase report.
 * @param {object} opts
 * @param {string} opts.projectRoot - project root path
 * @param {string} opts.stateRoot - state root path
 * @param {string} opts.runId - current run ID
 * @param {string} opts.phase - phase name (init|clarifier|executor|final_review)
 * @param {string} [opts.baseBranch] - base branch for diff (default: 'main')
 * @returns {object} structured metrics
 */
export function collectPhaseMetrics(opts) {
  const { projectRoot, stateRoot, runId, phase } = opts;
  const baseBranch = opts.baseBranch ?? 'main';

  return {
    run_id: runId,
    phase,
    generated_at: new Date().toISOString(),
    tests: collectTestResults(projectRoot),
    diff: collectDiffStats(projectRoot, baseBranch),
    files: collectFileChanges(projectRoot, baseBranch),
    artifacts: collectArtifacts(stateRoot, runId),
    duration_seconds: collectDuration(stateRoot, runId, phase),
  };
}

/**
 * Build a complete phase report JSON.
 * Deterministic fields from code, qualitative fields left as placeholders for agent.
 * @param {object} metrics - output from collectPhaseMetrics
 * @param {object} [qualitative] - agent-provided qualitative fields
 * @returns {object} complete report
 */
export function buildPhaseReport(metrics, qualitative = {}) {
  return {
    run_id: metrics.run_id,
    phase: metrics.phase,
    generated_at: metrics.generated_at,
    metrics: {
      tests: metrics.tests ?? { total: 0, passed: 0, failed: 0, skipped: 0 },
      diff: metrics.diff ?? { files_changed: 0, insertions: 0, deletions: 0 },
      files: metrics.files ?? { added: [], modified: [], deleted: [] },
      artifacts: metrics.artifacts ?? [],
      duration_seconds: metrics.duration_seconds ?? null,
    },
    qualitative: {
      summary: qualitative.summary ?? '',
      drift_analysis: qualitative.drift_analysis ?? '',
      decisions: qualitative.decisions ?? [],
      risks: qualitative.risks ?? [],
    },
  };
}
