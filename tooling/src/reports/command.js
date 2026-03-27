import { parseCommandOptions } from '../command-options.js';
import { resolveProjectContext } from '../project-context.js';
import { collectPhaseMetrics, buildPhaseReport } from './phase-report.js';

const USAGE = 'Usage: wazir report phase --run <run-id> --phase <phase> [--base <branch>] [--json]';

function handlePhase(parsed, context = {}) {
  const { options } = parseCommandOptions(parsed.args, {
    boolean: ['json', 'help'],
    string: ['run', 'phase', 'base', 'state-root'],
  });

  if (options.help) {
    return {
      exitCode: 0,
      stdout: `${USAGE}\n\nGenerate a structured phase report with metrics from git, tests, and run state.\n`,
    };
  }

  if (!options.run) {
    return {
      exitCode: 1,
      stderr: `wazir report phase requires --run <id>\n${USAGE}\n`,
    };
  }

  if (!options.phase) {
    return {
      exitCode: 1,
      stderr: `wazir report phase requires --phase <phase>\n${USAGE}\n`,
    };
  }

  const ctx = resolveProjectContext(context.cwd ?? process.cwd(), { stateRootOverride: options.stateRoot });
  const projectRoot = ctx.projectRoot;
  const stateRoot = ctx.stateRoot;

  const metrics = collectPhaseMetrics({
    projectRoot,
    stateRoot,
    runId: options.run,
    phase: options.phase,
    baseBranch: options.base ?? 'main',
  });

  const report = buildPhaseReport(metrics);

  if (options.json) {
    return {
      exitCode: 0,
      stdout: `${JSON.stringify(report, null, 2)}\n`,
    };
  }

  // Human-readable text output
  const lines = [
    `Phase Report: ${report.phase} (run ${report.run_id})`,
    `Generated: ${report.generated_at}`,
    '',
    'Tests:',
    `  total: ${report.metrics.tests.total}, passed: ${report.metrics.tests.passed}, failed: ${report.metrics.tests.failed}, skipped: ${report.metrics.tests.skipped}`,
    '',
    'Diff:',
    `  files changed: ${report.metrics.diff.files_changed}, insertions: ${report.metrics.diff.insertions}, deletions: ${report.metrics.diff.deletions}`,
    '',
    'Files:',
    `  added: ${report.metrics.files.added.length}, modified: ${report.metrics.files.modified.length}, deleted: ${report.metrics.files.deleted.length}`,
    '',
    `Artifacts: ${report.metrics.artifacts.length}`,
    `Duration: ${report.metrics.duration_seconds !== null ? `${report.metrics.duration_seconds}s` : 'N/A'}`,
  ];

  return {
    exitCode: 0,
    stdout: `${lines.join('\n')}\n`,
  };
}

export function runReportCommand(parsed, context = {}) {
  try {
    switch (parsed.subcommand) {
      case 'phase':
        return handlePhase(parsed, context);
      default:
        return {
          exitCode: 1,
          stderr: `${USAGE}\n`,
        };
    }
  } catch (error) {
    return {
      exitCode: 1,
      stderr: `${error.message}\n`,
    };
  }
}
