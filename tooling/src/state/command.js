import { parseCommandOptions } from '../command-options.js';
import { resolveProjectContext } from '../project-context.js';
import {
  closeStateDb,
  getAuditTrend,
  getFindingsByRun,
  getLearningsByScope,
  getStateCounts,
  getUsageSummary,
  openStateDb,
} from './db.js';

function success(payload, options = {}) {
  if (options.json) {
    return {
      exitCode: 0,
      stdout: `${JSON.stringify(payload, null, 2)}\n`,
    };
  }

  return {
    exitCode: 0,
    stdout: `${options.formatText ? options.formatText(payload) : String(payload)}\n`,
  };
}

function failure(message, exitCode = 1) {
  return {
    exitCode,
    stderr: `${message}\n`,
  };
}

function loadProjectContext(context, stateRootOverride) {
  const ctx = resolveProjectContext(context.cwd ?? process.cwd(), { stateRootOverride });
  return {
    projectRoot: ctx.projectRoot,
    manifest: ctx.manifest,
    stateRoot: ctx.stateRoot,
  };
}

export function runStateCommand(parsed, context = {}) {
  try {
    const { positional, options } = parseCommandOptions(parsed.args, {
      boolean: ['json'],
      string: ['state-root', 'limit'],
    });
    const { stateRoot } = loadProjectContext(context, options.stateRoot);

    switch (parsed.subcommand) {
      case 'stats': {
        const db = openStateDb(stateRoot);

        try {
          const counts = getStateCounts(db);
          const usage = getUsageSummary(db);

          return success({ ...counts, usage }, {
            json: options.json,
            formatText: (value) => [
              `Learnings: ${value.learning_count}`,
              `Findings:  ${value.finding_count}`,
              `Audits:    ${value.audit_count}`,
              `Usage records: ${value.usage_count}`,
            ].join('\n'),
          });
        } finally {
          closeStateDb(db);
        }
      }

      case 'learnings': {
        const db = openStateDb(stateRoot);

        try {
          const limit = options.limit ? Number(options.limit) : undefined;
          const learnings = getLearningsByScope(db, { limit });

          return success(learnings, {
            json: options.json,
            formatText: (rows) => rows.length === 0
              ? 'No learnings recorded.'
              : rows.map((row) => {
                const scope = [row.scope_roles, row.scope_stacks, row.scope_concerns]
                  .filter(Boolean)
                  .join(', ');
                return `[${row.category}] ${row.content}${scope ? ` (${scope})` : ''} x${row.recurrence_count}`;
              }).join('\n'),
          });
        } finally {
          closeStateDb(db);
        }
      }

      case 'findings': {
        const runId = positional[0];

        if (!runId) {
          return failure('Usage: wazir state findings <run-id> [--state-root <path>] [--json]');
        }

        const db = openStateDb(stateRoot);

        try {
          const findings = getFindingsByRun(db, runId);

          return success(findings, {
            json: options.json,
            formatText: (rows) => rows.length === 0
              ? `No findings for run ${runId}.`
              : rows.map((row) => {
                const status = row.resolved ? 'RESOLVED' : 'OPEN';
                return `[${row.severity}] [${status}] ${row.description} (${row.source}, ${row.phase})`;
              }).join('\n'),
          });
        } finally {
          closeStateDb(db);
        }
      }

      case 'trend': {
        const db = openStateDb(stateRoot);

        try {
          const limit = options.limit ? Number(options.limit) : 10;
          const trend = getAuditTrend(db, limit);

          return success(trend, {
            json: options.json,
            formatText: (rows) => rows.length === 0
              ? 'No audit history.'
              : rows.map((row) => {
                const before = row.quality_score_before != null ? row.quality_score_before.toFixed(1) : '?';
                const after = row.quality_score_after != null ? row.quality_score_after.toFixed(1) : '?';
                return `${row.date} ${row.run_id} findings=${row.finding_count} fixed=${row.fix_count} manual=${row.manual_count} quality=${before}->${after}`;
              }).join('\n'),
          });
        } finally {
          closeStateDb(db);
        }
      }

      default:
        return failure('Usage: wazir state <stats|learnings|findings|trend> [options]');
    }
  } catch (error) {
    return failure(error.message);
  }
}
