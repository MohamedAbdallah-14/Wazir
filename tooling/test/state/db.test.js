import { describe, test } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  openStateDb,
  closeStateDb,
  insertLearning,
  getLearningsByScope,
  updateLearningRecurrence,
  getRecurringLearnings,
  insertFinding,
  getFindingsByRun,
  getRecurringFindingHashes,
  resolveFinding,
  insertAuditRecord,
  getAuditTrend,
  insertUsageRecord,
  getUsageSummary,
  getStateCounts,
} from '../../src/state/db.js';

function createTempStateRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-state-'));
  return { stateRoot: dir, cleanup() { fs.rmSync(dir, { recursive: true, force: true }); } };
}

describe('state database schema', () => {
  test('openStateDb creates all four tables', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('learnings', 'findings', 'audit_history', 'usage_aggregate') ORDER BY name",
      ).all();

      assert.deepStrictEqual(
        tables.map((r) => r.name),
        ['audit_history', 'findings', 'learnings', 'usage_aggregate'],
      );

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('openStateDb creates indexes', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const indexes = db.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name",
      ).all();
      const indexNames = indexes.map((r) => r.name);

      assert.ok(indexNames.includes('idx_learnings_category'));
      assert.ok(indexNames.includes('idx_findings_run_id'));
      assert.ok(indexNames.includes('idx_findings_finding_hash'));
      assert.ok(indexNames.includes('idx_audit_history_run_id'));
      assert.ok(indexNames.includes('idx_usage_aggregate_run_id'));

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('database path is at state/state.sqlite under stateRoot', () => {
    const tmp = createTempStateRoot();

    try {
      openStateDb(tmp.stateRoot);
      const expectedPath = path.join(tmp.stateRoot, 'state', 'state.sqlite');
      assert.ok(fs.existsSync(expectedPath), `expected ${expectedPath} to exist`);
    } finally {
      tmp.cleanup();
    }
  });
});

describe('learnings CRUD', () => {
  test('insertLearning + getLearningsByScope round-trip', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const id = insertLearning(db, {
        source_run: 'run-001',
        category: 'architecture',
        scope_roles: 'architect',
        scope_stacks: 'node',
        scope_concerns: 'performance',
        confidence: 'high',
        content: 'Always prefer streaming over buffering for large files.',
      });

      assert.ok(id, 'should return an id');
      assert.strictEqual(typeof id, 'string');

      const results = getLearningsByScope(db, { roles: 'architect' });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, id);
      assert.strictEqual(results[0].content, 'Always prefer streaming over buffering for large files.');
      assert.strictEqual(results[0].category, 'architecture');
      assert.strictEqual(results[0].confidence, 'high');
      assert.strictEqual(results[0].scope_roles, 'architect');
      assert.strictEqual(results[0].scope_stacks, 'node');
      assert.strictEqual(results[0].recurrence_count, 1);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('getLearningsByScope filters by multiple scope fields', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      insertLearning(db, {
        source_run: 'run-001',
        category: 'testing',
        scope_roles: 'developer',
        scope_stacks: 'node',
        content: 'Use node:test for testing.',
      });

      insertLearning(db, {
        source_run: 'run-001',
        category: 'architecture',
        scope_roles: 'architect',
        scope_stacks: 'python',
        content: 'Use pytest for testing.',
      });

      const nodeResults = getLearningsByScope(db, { stacks: 'node' });
      assert.strictEqual(nodeResults.length, 1);
      assert.strictEqual(nodeResults[0].scope_stacks, 'node');

      const allResults = getLearningsByScope(db);
      assert.strictEqual(allResults.length, 2);

      const limited = getLearningsByScope(db, { limit: 1 });
      assert.strictEqual(limited.length, 1);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('getLearningsByScope filters by confidence', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      insertLearning(db, {
        source_run: 'run-001',
        category: 'testing',
        confidence: 'high',
        content: 'High confidence learning.',
      });

      insertLearning(db, {
        source_run: 'run-001',
        category: 'testing',
        confidence: 'low',
        content: 'Low confidence learning.',
      });

      const highOnly = getLearningsByScope(db, { confidence: 'high' });
      assert.strictEqual(highOnly.length, 1);
      assert.strictEqual(highOnly[0].confidence, 'high');

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('updateLearningRecurrence increments count and sets last_applied', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const id = insertLearning(db, {
        source_run: 'run-001',
        category: 'testing',
        content: 'Recurrent learning.',
      });

      updateLearningRecurrence(db, id);
      updateLearningRecurrence(db, id);

      const results = getLearningsByScope(db);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].recurrence_count, 3);
      assert.ok(results[0].last_applied, 'last_applied should be set');

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('getRecurringLearnings returns learnings above threshold', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const id1 = insertLearning(db, {
        source_run: 'run-001',
        category: 'testing',
        content: 'Frequent learning.',
      });

      updateLearningRecurrence(db, id1);
      updateLearningRecurrence(db, id1);

      insertLearning(db, {
        source_run: 'run-001',
        category: 'testing',
        content: 'Rare learning.',
      });

      const recurring = getRecurringLearnings(db, 3);
      assert.strictEqual(recurring.length, 1);
      assert.strictEqual(recurring[0].content, 'Frequent learning.');
      assert.strictEqual(recurring[0].recurrence_count, 3);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('insertLearning defaults confidence to medium', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      insertLearning(db, {
        source_run: 'run-001',
        category: 'testing',
        content: 'Default confidence.',
      });

      const results = getLearningsByScope(db);
      assert.strictEqual(results[0].confidence, 'medium');

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });
});

describe('findings CRUD', () => {
  test('insertFinding + getFindingsByRun round-trip', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const id = insertFinding(db, {
        run_id: 'run-001',
        phase: 'review',
        source: 'codex',
        severity: 'high',
        description: 'Missing error handling in file upload.',
      });

      assert.ok(id, 'should return an id');

      const results = getFindingsByRun(db, 'run-001');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, id);
      assert.strictEqual(results[0].run_id, 'run-001');
      assert.strictEqual(results[0].phase, 'review');
      assert.strictEqual(results[0].source, 'codex');
      assert.strictEqual(results[0].severity, 'high');
      assert.strictEqual(results[0].description, 'Missing error handling in file upload.');
      assert.strictEqual(results[0].resolved, 0);
      assert.ok(results[0].finding_hash, 'should have a finding_hash');

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('finding_hash is auto-generated from description via SHA-256', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const description = 'Duplicate function declaration.';
      insertFinding(db, {
        run_id: 'run-001',
        phase: 'lint',
        source: 'internal',
        severity: 'medium',
        description,
      });

      const expectedHash = crypto.createHash('sha256').update(description).digest('hex');
      const results = getFindingsByRun(db, 'run-001');
      assert.strictEqual(results[0].finding_hash, expectedHash);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('finding_hash dedup: same description across runs produces same hash', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const description = 'Unused import detected.';

      insertFinding(db, {
        run_id: 'run-001',
        phase: 'lint',
        source: 'internal',
        severity: 'low',
        description,
      });

      insertFinding(db, {
        run_id: 'run-002',
        phase: 'lint',
        source: 'internal',
        severity: 'low',
        description,
      });

      insertFinding(db, {
        run_id: 'run-003',
        phase: 'lint',
        source: 'internal',
        severity: 'low',
        description,
      });

      const run1 = getFindingsByRun(db, 'run-001');
      const run2 = getFindingsByRun(db, 'run-002');
      assert.strictEqual(run1[0].finding_hash, run2[0].finding_hash);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('getRecurringFindingHashes detects recurring findings', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const description = 'Unused import detected.';

      insertFinding(db, {
        run_id: 'run-001',
        phase: 'lint',
        source: 'internal',
        severity: 'low',
        description,
      });

      insertFinding(db, {
        run_id: 'run-002',
        phase: 'lint',
        source: 'internal',
        severity: 'low',
        description,
      });

      insertFinding(db, {
        run_id: 'run-001',
        phase: 'lint',
        source: 'internal',
        severity: 'medium',
        description: 'Unique finding.',
      });

      const recurring = getRecurringFindingHashes(db, 2);
      assert.strictEqual(recurring.length, 1);
      assert.strictEqual(recurring[0].count, 2);

      const expectedHash = crypto.createHash('sha256').update(description).digest('hex');
      assert.strictEqual(recurring[0].finding_hash, expectedHash);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('resolveFinding sets resolved flag to 1', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const id = insertFinding(db, {
        run_id: 'run-001',
        phase: 'review',
        source: 'codex',
        severity: 'high',
        description: 'Fix this bug.',
      });

      resolveFinding(db, id);

      const results = getFindingsByRun(db, 'run-001');
      assert.strictEqual(results[0].resolved, 1);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('getFindingsByRun returns empty array for unknown run', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const results = getFindingsByRun(db, 'nonexistent-run');
      assert.deepStrictEqual(results, []);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });
});

describe('audit history', () => {
  test('insertAuditRecord + getAuditTrend returns ordered records', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      insertAuditRecord(db, {
        run_id: 'run-001',
        finding_count: 5,
        fix_count: 3,
        manual_count: 2,
        quality_score_before: 60.0,
        quality_score_after: 80.0,
      });

      insertAuditRecord(db, {
        run_id: 'run-002',
        finding_count: 3,
        fix_count: 3,
        manual_count: 0,
        quality_score_before: 80.0,
        quality_score_after: 95.0,
      });

      const trend = getAuditTrend(db);
      assert.strictEqual(trend.length, 2);
      // Both have today's date, ordered by id DESC so run-002 comes first
      assert.strictEqual(trend[0].run_id, 'run-002');
      assert.strictEqual(trend[1].run_id, 'run-001');

      assert.strictEqual(trend[0].finding_count, 3);
      assert.strictEqual(trend[0].fix_count, 3);
      assert.strictEqual(trend[0].quality_score_before, 80.0);
      assert.strictEqual(trend[0].quality_score_after, 95.0);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('getAuditTrend respects limit', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      insertAuditRecord(db, { run_id: 'run-001', finding_count: 1 });
      insertAuditRecord(db, { run_id: 'run-002', finding_count: 2 });
      insertAuditRecord(db, { run_id: 'run-003', finding_count: 3 });

      const trend = getAuditTrend(db, 2);
      assert.strictEqual(trend.length, 2);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('getAuditTrend returns empty array when no records exist', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const trend = getAuditTrend(db);
      assert.deepStrictEqual(trend, []);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });
});

describe('usage aggregate', () => {
  test('insertUsageRecord + getUsageSummary aggregates correctly', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      insertUsageRecord(db, {
        run_id: 'run-001',
        tokens_saved: 1000,
        bytes_avoided: 5000,
        savings_ratio: 0.3,
        index_queries: 10,
        routing_decisions: 5,
      });

      insertUsageRecord(db, {
        run_id: 'run-002',
        tokens_saved: 2000,
        bytes_avoided: 8000,
        savings_ratio: 0.5,
        index_queries: 20,
        routing_decisions: 8,
      });

      const summary = getUsageSummary(db);
      assert.strictEqual(summary.total_tokens_saved, 3000);
      assert.strictEqual(summary.total_bytes_avoided, 13000);
      assert.strictEqual(summary.avg_savings_ratio, 0.4);
      assert.strictEqual(summary.total_index_queries, 30);
      assert.strictEqual(summary.run_count, 2);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });

  test('getUsageSummary returns zeros when no records', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      const summary = getUsageSummary(db);
      assert.strictEqual(summary.total_tokens_saved, 0);
      assert.strictEqual(summary.total_bytes_avoided, 0);
      assert.strictEqual(summary.avg_savings_ratio, 0.0);
      assert.strictEqual(summary.total_index_queries, 0);
      assert.strictEqual(summary.run_count, 0);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });
});

describe('getStateCounts', () => {
  test('returns correct counts across all tables', () => {
    const tmp = createTempStateRoot();

    try {
      const db = openStateDb(tmp.stateRoot);

      insertLearning(db, { source_run: 'run-001', category: 'test', content: 'L1' });
      insertLearning(db, { source_run: 'run-001', category: 'test', content: 'L2' });

      insertFinding(db, {
        run_id: 'run-001',
        phase: 'review',
        source: 'internal',
        severity: 'low',
        description: 'F1',
      });

      insertAuditRecord(db, { run_id: 'run-001' });

      insertUsageRecord(db, { run_id: 'run-001', tokens_saved: 100 });
      insertUsageRecord(db, { run_id: 'run-002', tokens_saved: 200 });

      const counts = getStateCounts(db);
      assert.strictEqual(counts.learning_count, 2);
      assert.strictEqual(counts.finding_count, 1);
      assert.strictEqual(counts.audit_count, 1);
      assert.strictEqual(counts.usage_count, 2);

      closeStateDb(db);
    } finally {
      tmp.cleanup();
    }
  });
});

describe('state database isolation', () => {
  test('state DB is separate from index DB path', () => {
    const tmp = createTempStateRoot();

    try {
      openStateDb(tmp.stateRoot);

      const stateDbPath = path.join(tmp.stateRoot, 'state', 'state.sqlite');
      const indexDbPath = path.join(tmp.stateRoot, 'index', 'index.sqlite');

      assert.ok(fs.existsSync(stateDbPath), 'state.sqlite should exist');
      assert.ok(!fs.existsSync(indexDbPath), 'index.sqlite should NOT exist (separate DB)');
    } finally {
      tmp.cleanup();
    }
  });
});
