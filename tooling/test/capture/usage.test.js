import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  initUsage,
  readUsage,
  estimateTokens,
  recordCaptureSavings,
  recordPhaseUsage,
  recordRoleUsage,
  recordContextModeSavings,
  recordCompaction,
  recordIndexQuery,
  consumeRoutingLog,
  generateReport,
} from '../../src/capture/usage.js';
import { getRunPaths, ensureRunDirectories } from '../../src/capture/store.js';

function createTempState() {
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-usage-'));
  const runPaths = getRunPaths(stateRoot, 'run-test');
  ensureRunDirectories(runPaths);
  return { stateRoot, runPaths, cleanup: () => fs.rmSync(stateRoot, { recursive: true, force: true }) };
}

describe('estimateTokens', () => {
  test('converts bytes to estimated tokens using ceil(bytes/4)', () => {
    assert.strictEqual(estimateTokens(0), 0);
    assert.strictEqual(estimateTokens(1), 1);
    assert.strictEqual(estimateTokens(4), 1);
    assert.strictEqual(estimateTokens(5), 2);
    assert.strictEqual(estimateTokens(100), 25);
    assert.strictEqual(estimateTokens(1000), 250);
  });
});

describe('initUsage', () => {
  test('creates usage.json with default structure', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      const usage = initUsage(runPaths, 'run-test');
      assert.strictEqual(usage.schema_version, 1);
      assert.strictEqual(usage.run_id, 'run-test');
      assert.deepStrictEqual(usage.phases, {});
      assert.deepStrictEqual(usage.roles, {});
      assert.strictEqual(usage.totals.total_events, 0);
      assert.ok(fs.existsSync(runPaths.usagePath));
    } finally {
      cleanup();
    }
  });

  test('is idempotent — returns existing data on second call', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordCaptureSavings(runPaths, 1000, 100);
      const second = initUsage(runPaths, 'run-test');
      assert.strictEqual(second.savings.capture_routing.raw_bytes, 1000);
    } finally {
      cleanup();
    }
  });
});

describe('readUsage', () => {
  test('returns default empty object when file does not exist', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      const usage = readUsage(runPaths);
      assert.strictEqual(usage.schema_version, 1);
      assert.deepStrictEqual(usage.phases, {});
    } finally {
      cleanup();
    }
  });

  test('returns default on malformed JSON', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      fs.writeFileSync(runPaths.usagePath, 'not-json{{{');
      const usage = readUsage(runPaths);
      assert.strictEqual(usage.schema_version, 1);
      assert.deepStrictEqual(usage.phases, {});
    } finally {
      cleanup();
    }
  });
});

describe('recordCaptureSavings', () => {
  test('accumulates raw and summary bytes', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordCaptureSavings(runPaths, 1000, 100);
      recordCaptureSavings(runPaths, 2000, 200);
      const usage = readUsage(runPaths);
      assert.strictEqual(usage.savings.capture_routing.raw_bytes, 3000);
      assert.strictEqual(usage.savings.capture_routing.summary_bytes, 300);
      assert.strictEqual(usage.savings.capture_routing.estimated_tokens_avoided, estimateTokens(2700));
    } finally {
      cleanup();
    }
  });
});

describe('recordPhaseUsage', () => {
  test('increments events_count across multiple calls', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordPhaseUsage(runPaths, 'verify', { events_count: 1 });
      recordPhaseUsage(runPaths, 'verify', { events_count: 1 });
      recordPhaseUsage(runPaths, 'verify', { events_count: 1 });
      const usage = readUsage(runPaths);
      assert.strictEqual(usage.phases.verify.events_count, 3, 'events_count should be 3 after three calls with 1');
    } finally {
      cleanup();
    }
  });

  test('creates new phase entry with token estimates', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordPhaseUsage(runPaths, 'clarify', { events_count: 5, capture_bytes_raw: 2000, capture_bytes_summary: 200 });
      const usage = readUsage(runPaths);
      assert.strictEqual(usage.phases.clarify.events_count, 5);
      assert.strictEqual(usage.phases.clarify.estimated_tokens_if_raw, estimateTokens(2000));
      assert.strictEqual(usage.phases.clarify.estimated_tokens_avoided, estimateTokens(1800));
    } finally {
      cleanup();
    }
  });
});

describe('recordRoleUsage', () => {
  test('creates new role entry', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordRoleUsage(runPaths, 'researcher', { events_count: 3, capture_bytes_raw: 5000 });
      const usage = readUsage(runPaths);
      assert.strictEqual(usage.roles.researcher.events_count, 3);
      assert.strictEqual(usage.roles.researcher.estimated_tokens_if_raw, estimateTokens(5000));
    } finally {
      cleanup();
    }
  });
});

describe('recordContextModeSavings', () => {
  test('records context-mode stats', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordContextModeSavings(runPaths, {
        available: true,
        raw_kb: 315.0,
        context_kb: 5.4,
        savings_ratio: '98.3%',
        per_tool: { fetch_and_index: { call_count: 3, raw_kb: 180.0, context_kb: 2.1 } },
      });
      const usage = readUsage(runPaths);
      assert.strictEqual(usage.savings.context_mode.available, true);
      assert.strictEqual(usage.savings.context_mode.raw_kb, 315.0);
    } finally {
      cleanup();
    }
  });

  test('never overwrites existing data with zeros', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordContextModeSavings(runPaths, { available: true, raw_kb: 100, context_kb: 5, savings_ratio: '95%', per_tool: {} });
      recordContextModeSavings(runPaths, { available: true, raw_kb: 0, context_kb: 0, savings_ratio: '0%', per_tool: {} });
      const usage = readUsage(runPaths);
      assert.strictEqual(usage.savings.context_mode.raw_kb, 100);
    } finally {
      cleanup();
    }
  });
});

describe('recordCompaction', () => {
  test('accumulates compaction count and token estimates', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordCompaction(runPaths, 80000, 5000);
      recordCompaction(runPaths, 60000, 4000);
      const usage = readUsage(runPaths);
      assert.strictEqual(usage.savings.compaction.compaction_count, 2);
      assert.strictEqual(usage.savings.compaction.pre_compaction_tokens_est, 140000);
      assert.strictEqual(usage.savings.compaction.post_compaction_tokens_est, 9000);
    } finally {
      cleanup();
    }
  });
});

describe('recordIndexQuery', () => {
  test('records a single index query with correct calculations', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordIndexQuery(runPaths, {
        query: 'auth middleware',
        file_count_in_results: 10,
        median_file_size: 500,
        summary_bytes: 200,
      });
      const usage = readUsage(runPaths);
      const iq = usage.savings.index_queries;
      assert.strictEqual(iq.count, 1);
      assert.strictEqual(iq.total_raw_bytes, 5000);
      assert.strictEqual(iq.total_summary_bytes, 200);
      assert.strictEqual(iq.bytes_avoided, 4800);
      assert.strictEqual(iq.estimated_tokens_saved, estimateTokens(4800));
    } finally {
      cleanup();
    }
  });

  test('accumulates across multiple index queries', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordIndexQuery(runPaths, {
        query: 'auth middleware',
        file_count_in_results: 10,
        median_file_size: 500,
        summary_bytes: 200,
      });
      recordIndexQuery(runPaths, {
        query: 'database models',
        file_count_in_results: 5,
        median_file_size: 1000,
        summary_bytes: 300,
      });
      const usage = readUsage(runPaths);
      const iq = usage.savings.index_queries;
      assert.strictEqual(iq.count, 2);
      assert.strictEqual(iq.total_raw_bytes, 10000);
      assert.strictEqual(iq.total_summary_bytes, 500);
      assert.strictEqual(iq.bytes_avoided, 9500);
      assert.strictEqual(iq.estimated_tokens_saved, estimateTokens(9500));
    } finally {
      cleanup();
    }
  });

  test('default usage includes index_queries section', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      const usage = initUsage(runPaths, 'run-test');
      assert.deepStrictEqual(usage.savings.index_queries, {
        count: 0,
        total_raw_bytes: 0,
        total_summary_bytes: 0,
        estimated_tokens_saved: 0,
        bytes_avoided: 0,
      });
    } finally {
      cleanup();
    }
  });
});

describe('consumeRoutingLog', () => {
  test('does nothing when routing.ndjson does not exist', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      consumeRoutingLog(runPaths);
      const usage = readUsage(runPaths);
      assert.strictEqual(usage.routing.total_commands, 0);
      assert.strictEqual(usage.routing.context_mode_routed, 0);
      assert.strictEqual(usage.routing.passthrough, 0);
      assert.deepStrictEqual(usage.routing.by_category, {});
    } finally {
      cleanup();
    }
  });

  test('aggregates routing decisions from ndjson log', () => {
    const { stateRoot, runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');

      // Create the logs directory and write routing.ndjson at state root level
      const logsDir = path.join(stateRoot, 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      const logPath = path.join(logsDir, 'routing.ndjson');

      const entries = [
        { ts: '2026-03-19T10:00:00Z', hook: 'context_mode_router', command: 'find . -name "*.js"', category: 'large', route: 'context-mode', context_mode_enabled: true },
        { ts: '2026-03-19T10:00:01Z', hook: 'context_mode_router', command: 'git status', category: 'small', route: 'passthrough', context_mode_enabled: true },
        { ts: '2026-03-19T10:00:02Z', hook: 'context_mode_router', command: 'cat package.json | jq .', category: 'ambiguous', route: 'context-mode', context_mode_enabled: true },
        { ts: '2026-03-19T10:00:03Z', hook: 'context_mode_router', command: 'ls', category: 'small', route: 'passthrough', context_mode_enabled: true },
      ];
      fs.writeFileSync(logPath, entries.map(e => JSON.stringify(e)).join('\n') + '\n');

      consumeRoutingLog(runPaths);
      const usage = readUsage(runPaths);

      assert.strictEqual(usage.routing.total_commands, 4);
      assert.strictEqual(usage.routing.context_mode_routed, 2);
      assert.strictEqual(usage.routing.passthrough, 2);
      assert.strictEqual(usage.routing.by_category.large, 1);
      assert.strictEqual(usage.routing.by_category.small, 2);
      assert.strictEqual(usage.routing.by_category.ambiguous, 1);
    } finally {
      cleanup();
    }
  });

  test('skips malformed lines gracefully', () => {
    const { stateRoot, runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');

      const logsDir = path.join(stateRoot, 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      const logPath = path.join(logsDir, 'routing.ndjson');

      const lines = [
        JSON.stringify({ ts: '2026-03-19T10:00:00Z', command: 'find .', category: 'large', route: 'context-mode' }),
        'not-valid-json{{{',
        JSON.stringify({ ts: '2026-03-19T10:00:01Z', command: 'ls', category: 'small', route: 'passthrough' }),
      ];
      fs.writeFileSync(logPath, lines.join('\n') + '\n');

      consumeRoutingLog(runPaths);
      const usage = readUsage(runPaths);

      assert.strictEqual(usage.routing.total_commands, 2);
      assert.strictEqual(usage.routing.context_mode_routed, 1);
      assert.strictEqual(usage.routing.passthrough, 1);
    } finally {
      cleanup();
    }
  });

  test('re-aggregates from scratch on each call', () => {
    const { stateRoot, runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');

      const logsDir = path.join(stateRoot, 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      const logPath = path.join(logsDir, 'routing.ndjson');

      // First call with one entry
      fs.writeFileSync(logPath, JSON.stringify({ ts: '2026-03-19T10:00:00Z', command: 'find .', category: 'large', route: 'context-mode' }) + '\n');
      consumeRoutingLog(runPaths);

      // Append another entry and call again
      fs.appendFileSync(logPath, JSON.stringify({ ts: '2026-03-19T10:00:01Z', command: 'ls', category: 'small', route: 'passthrough' }) + '\n');
      consumeRoutingLog(runPaths);

      const usage = readUsage(runPaths);
      // Should be 2, not 3 (no double-counting from first call)
      assert.strictEqual(usage.routing.total_commands, 2);
      assert.strictEqual(usage.routing.context_mode_routed, 1);
      assert.strictEqual(usage.routing.passthrough, 1);
    } finally {
      cleanup();
    }
  });

  test('default usage includes routing section', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      const usage = initUsage(runPaths, 'run-test');
      assert.deepStrictEqual(usage.routing, {
        total_commands: 0,
        context_mode_routed: 0,
        passthrough: 0,
        by_category: {},
      });
    } finally {
      cleanup();
    }
  });

  test('handles empty log file', () => {
    const { stateRoot, runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');

      const logsDir = path.join(stateRoot, 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      fs.writeFileSync(path.join(logsDir, 'routing.ndjson'), '');

      consumeRoutingLog(runPaths);
      const usage = readUsage(runPaths);
      assert.strictEqual(usage.routing.total_commands, 0);
    } finally {
      cleanup();
    }
  });
});

describe('generateReport', () => {
  test('returns JSON format when requested', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordCaptureSavings(runPaths, 4000, 400);
      const report = generateReport(runPaths, 'json');
      const parsed = JSON.parse(report);
      assert.strictEqual(parsed.run_id, 'run-test');
    } finally {
      cleanup();
    }
  });

  test('returns human-readable markdown by default', () => {
    const { runPaths, cleanup } = createTempState();
    try {
      initUsage(runPaths, 'run-test');
      recordCaptureSavings(runPaths, 4000, 400);
      const report = generateReport(runPaths, 'text');
      assert.ok(report.includes('Usage Report'));
      assert.ok(report.includes('Token Savings by Strategy'));
      assert.ok(report.includes('What If'));
    } finally {
      cleanup();
    }
  });
});
