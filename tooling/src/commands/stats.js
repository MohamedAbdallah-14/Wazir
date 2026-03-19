import fs from 'node:fs';
import path from 'node:path';

import { parseCommandOptions } from '../command-options.js';
import { readYamlFile } from '../loaders.js';
import { findProjectRoot } from '../project-root.js';
import { resolveStateRoot } from '../state-root.js';
import { getRunPaths } from '../capture/store.js';
import { readUsage, estimateTokens, consumeRoutingLog } from '../capture/usage.js';

function formatNumber(n) {
  return n.toLocaleString('en-US');
}

function buildStatsPayload(usage) {
  const savings = usage.savings;
  const cr = savings.capture_routing;
  const cm = savings.context_mode;
  const co = savings.compaction;
  const iq = savings.index_queries;

  const totalQueriesFromPhases = Object.values(usage.phases)
    .reduce((sum, p) => sum + (p.events_count ?? 0), 0);
  const totalQueries = totalQueriesFromPhases + (iq.count ?? 0);

  const crTokensSaved = cr.estimated_tokens_avoided ?? 0;
  const cmRawTokens = estimateTokens(Math.round((cm.raw_kb ?? 0) * 1024));
  const cmAfterTokens = estimateTokens(Math.round((cm.context_kb ?? 0) * 1024));
  const cmTokensSaved = cmRawTokens - cmAfterTokens;
  const coTokensSaved = (co.pre_compaction_tokens_est ?? 0) - (co.post_compaction_tokens_est ?? 0);
  const iqTokensSaved = iq.estimated_tokens_saved ?? 0;

  const totalEstimatedTokensSaved = crTokensSaved + cmTokensSaved + coTokensSaved + iqTokensSaved;
  const totalBytesAvoided = (cr.raw_bytes ?? 0) - (cr.summary_bytes ?? 0) + (iq.bytes_avoided ?? 0);

  const crRawTokens = crTokensSaved + estimateTokens(cr.summary_bytes ?? 0);
  const iqRawTokens = estimateTokens(iq.total_raw_bytes ?? 0);
  const iqAfterTokens = estimateTokens(iq.total_summary_bytes ?? 0);
  const withoutSavings = crRawTokens + cmRawTokens + (co.pre_compaction_tokens_est ?? 0) + iqRawTokens;
  const withAll = estimateTokens(cr.summary_bytes ?? 0) + cmAfterTokens + (co.post_compaction_tokens_est ?? 0) + iqAfterTokens;
  const savingsRatio = withoutSavings > 0
    ? `${((1 - withAll / withoutSavings) * 100).toFixed(1)}%`
    : '0.0%';

  return {
    run_id: usage.run_id,
    total_queries: totalQueries,
    total_estimated_tokens_saved: totalEstimatedTokensSaved,
    total_bytes_avoided: totalBytesAvoided,
    savings_ratio: savingsRatio,
    per_tool: {
      capture_routing: {
        tokens_saved: crTokensSaved,
        raw_bytes: cr.raw_bytes ?? 0,
        summary_bytes: cr.summary_bytes ?? 0,
      },
      context_mode: {
        tokens_saved: cmTokensSaved,
        raw_kb: cm.raw_kb ?? 0,
        context_kb: cm.context_kb ?? 0,
      },
      compaction: {
        tokens_saved: coTokensSaved,
        compaction_count: co.compaction_count ?? 0,
      },
      index_queries: {
        tokens_saved: iqTokensSaved,
        query_count: iq.count ?? 0,
        bytes_avoided: iq.bytes_avoided ?? 0,
      },
    },
  };
}

function formatTextOutput(payload) {
  const lines = [
    `Stats: ${payload.run_id}`,
    '',
    `Total queries:              ${formatNumber(payload.total_queries)}`,
    `Total estimated tokens saved: ${formatNumber(payload.total_estimated_tokens_saved)}`,
    `Total bytes avoided:        ${formatNumber(payload.total_bytes_avoided)}`,
    `Overall savings ratio:      ${payload.savings_ratio}`,
    '',
    'Per-tool breakdown:',
    `  Capture routing:  ${formatNumber(payload.per_tool.capture_routing.tokens_saved)} tokens saved`,
    `  Context-mode:     ${formatNumber(payload.per_tool.context_mode.tokens_saved)} tokens saved`,
    `  Compaction:       ${formatNumber(payload.per_tool.compaction.tokens_saved)} tokens saved (${payload.per_tool.compaction.compaction_count} compactions)`,
    `  Index queries:    ${formatNumber(payload.per_tool.index_queries.tokens_saved)} tokens saved (${payload.per_tool.index_queries.query_count} queries)`,
  ];

  return lines.join('\n');
}

export function runStatsCommand(parsed, context = {}) {
  try {
    if (parsed.subcommand) {
      return {
        exitCode: 1,
        stderr: 'Usage: wazir stats --run <id> [--state-root <path>] [--json]\n',
      };
    }

    const { options } = parseCommandOptions(parsed.args, {
      boolean: ['json', 'help'],
      string: ['run', 'state-root'],
    });

    if (options.help) {
      return {
        exitCode: 0,
        stdout: 'Usage: wazir stats --run <id> [--state-root <path>] [--json]\n\nShow token savings statistics for a run.\n',
      };
    }

    if (!options.run) {
      return {
        exitCode: 1,
        stderr: 'wazir stats requires --run <id>\n',
      };
    }

    const projectRoot = findProjectRoot(context.cwd ?? process.cwd());
    const manifest = readYamlFile(path.join(projectRoot, 'wazir.manifest.yaml'));
    const stateRoot = resolveStateRoot(projectRoot, manifest, {
      cwd: context.cwd ?? process.cwd(),
      override: options.stateRoot,
    });
    const runPaths = getRunPaths(stateRoot, options.run);

    if (!fs.existsSync(runPaths.usagePath)) {
      return {
        exitCode: 1,
        stderr: `Run usage data not found: ${runPaths.usagePath}\n`,
      };
    }

    // Lazy aggregation: consume the routing log before computing stats
    // so that routing decisions are reflected in the usage data.
    consumeRoutingLog(runPaths);

    const usage = readUsage(runPaths);
    const payload = buildStatsPayload(usage);

    if (options.json) {
      return {
        exitCode: 0,
        stdout: `${JSON.stringify(payload, null, 2)}\n`,
      };
    }

    return {
      exitCode: 0,
      stdout: `${formatTextOutput(payload)}\n`,
    };
  } catch (error) {
    return {
      exitCode: 1,
      stderr: `${error.message}\n`,
    };
  }
}
