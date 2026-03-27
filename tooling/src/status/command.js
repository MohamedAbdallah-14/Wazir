import fs from 'node:fs';
import path from 'node:path';

import { parseCommandOptions } from '../command-options.js';
import { resolveProjectContext } from '../project-context.js';
import { estimateTokens } from '../capture/usage.js';

function readUsageSavingsSummary(stateRoot, runId) {
  const usagePath = path.join(stateRoot, 'runs', runId, 'usage.json');

  if (!fs.existsSync(usagePath)) {
    return null;
  }

  try {
    const usage = JSON.parse(fs.readFileSync(usagePath, 'utf8'));
    const cr = usage.savings?.capture_routing ?? {};
    const cm = usage.savings?.context_mode ?? {};
    const co = usage.savings?.compaction ?? {};
    const iq = usage.savings?.index_queries ?? {};

    const crTokensSaved = cr.estimated_tokens_avoided ?? 0;
    const cmRawTokens = estimateTokens(Math.round((cm.raw_kb ?? 0) * 1024));
    const cmAfterTokens = estimateTokens(Math.round((cm.context_kb ?? 0) * 1024));
    const cmTokensSaved = cmRawTokens - cmAfterTokens;
    const coTokensSaved = (co.pre_compaction_tokens_est ?? 0) - (co.post_compaction_tokens_est ?? 0);
    const iqTokensSaved = iq.estimated_tokens_saved ?? 0;

    const totalSaved = crTokensSaved + cmTokensSaved + coTokensSaved + iqTokensSaved;

    if (totalSaved === 0) {
      return null;
    }

    const crRawTokens = crTokensSaved + estimateTokens(cr.summary_bytes ?? 0);
    const withoutSavings = crRawTokens + cmRawTokens + (co.pre_compaction_tokens_est ?? 0);
    const pct = withoutSavings > 0
      ? `${((totalSaved / withoutSavings) * 100).toFixed(0)}%`
      : '0%';

    return `Context savings: ~${totalSaved.toLocaleString('en-US')} tokens saved (${pct} reduction)`;
  } catch {
    return null;
  }
}

function success(payload, options = {}) {
  if (options.json) {
    return {
      exitCode: 0,
      stdout: `${JSON.stringify(payload, null, 2)}\n`,
    };
  }

  const parentPhase = payload.parent_phase ?? payload.phase;
  const workflow = payload.workflow;
  const phaseLabel = workflow
    ? `Phase: ${parentPhase} > Workflow: ${workflow}`
    : `Phase: ${parentPhase}`;
  let output = `${payload.run_id} ${phaseLabel} ${payload.status}\n`;

  if (payload.savings_summary) {
    output += `${payload.savings_summary}\n`;
  }

  return {
    exitCode: 0,
    stdout: output,
  };
}

export function runStatusCommand(parsed, context = {}) {
  try {
    if (parsed.subcommand) {
      return {
        exitCode: 1,
        stderr: 'Usage: wazir status --run <id> [--state-root <path>] [--json]\n',
      };
    }

    const { options } = parseCommandOptions(parsed.args, {
      boolean: ['json'],
      string: ['run', 'state-root'],
    });

    if (!options.run) {
      return {
        exitCode: 1,
        stderr: 'wazir status requires --run <id>\n',
      };
    }

    const ctx = resolveProjectContext(context.cwd ?? process.cwd(), { stateRootOverride: options.stateRoot });
    const projectRoot = ctx.projectRoot;
    const stateRoot = ctx.stateRoot;
    const statusPath = path.join(stateRoot, 'runs', options.run, 'status.json');

    if (!fs.existsSync(statusPath)) {
      return {
        exitCode: 1,
        stderr: `Run status not found: ${statusPath}\n`,
      };
    }

    const payload = {
      ...JSON.parse(fs.readFileSync(statusPath, 'utf8')),
      status_path: statusPath,
    };

    const savingsSummary = readUsageSavingsSummary(stateRoot, options.run);

    if (savingsSummary) {
      payload.savings_summary = savingsSummary;
    }

    return success(payload, { json: options.json });
  } catch (error) {
    return {
      exitCode: 1,
      stderr: `${error.message}\n`,
    };
  }
}
