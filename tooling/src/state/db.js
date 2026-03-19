import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function getStateDatabasePath(stateRoot) {
  return path.join(stateRoot, 'state', 'state.sqlite');
}

function hashDescription(description) {
  return crypto.createHash('sha256').update(description).digest('hex');
}

function ensureStateSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS learnings (
      id TEXT PRIMARY KEY,
      source_run TEXT NOT NULL,
      category TEXT NOT NULL,
      scope_roles TEXT DEFAULT '',
      scope_stacks TEXT DEFAULT '',
      scope_concerns TEXT DEFAULT '',
      confidence TEXT DEFAULT 'medium' CHECK(confidence IN ('low','medium','high')),
      recurrence_count INTEGER DEFAULT 1,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_applied TEXT,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      phase TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('internal','codex','self-audit','gemini')),
      severity TEXT NOT NULL CHECK(severity IN ('critical','high','medium','low')),
      description TEXT NOT NULL,
      resolved INTEGER DEFAULT 0,
      finding_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT (date('now')),
      finding_count INTEGER DEFAULT 0,
      fix_count INTEGER DEFAULT 0,
      manual_count INTEGER DEFAULT 0,
      quality_score_before REAL,
      quality_score_after REAL
    );

    CREATE TABLE IF NOT EXISTS usage_aggregate (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT (date('now')),
      tokens_saved INTEGER DEFAULT 0,
      bytes_avoided INTEGER DEFAULT 0,
      savings_ratio REAL DEFAULT 0.0,
      index_queries INTEGER DEFAULT 0,
      routing_decisions INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_learnings_category ON learnings(category);
    CREATE INDEX IF NOT EXISTS idx_findings_run_id ON findings(run_id);
    CREATE INDEX IF NOT EXISTS idx_findings_finding_hash ON findings(finding_hash);
    CREATE INDEX IF NOT EXISTS idx_audit_history_run_id ON audit_history(run_id);
    CREATE INDEX IF NOT EXISTS idx_usage_aggregate_run_id ON usage_aggregate(run_id);
  `);
}

// ---------------------------------------------------------------------------
// Database lifecycle
// ---------------------------------------------------------------------------

export function openStateDb(stateRoot) {
  const databasePath = getStateDatabasePath(stateRoot);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath, { timeout: 5000 });
  ensureStateSchema(db);
  return db;
}

export function closeStateDb(db) {
  db.close();
}

// ---------------------------------------------------------------------------
// Learnings CRUD
// ---------------------------------------------------------------------------

export function insertLearning(db, record) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO learnings (id, source_run, category, scope_roles, scope_stacks, scope_concerns, confidence, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    record.source_run,
    record.category,
    record.scope_roles ?? '',
    record.scope_stacks ?? '',
    record.scope_concerns ?? '',
    record.confidence ?? 'medium',
    record.content,
    createdAt,
  );

  return id;
}

export function getLearningsByScope(db, filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.roles) {
    conditions.push("scope_roles LIKE ?");
    params.push(`%${filters.roles}%`);
  }

  if (filters.stacks) {
    conditions.push("scope_stacks LIKE ?");
    params.push(`%${filters.stacks}%`);
  }

  if (filters.concerns) {
    conditions.push("scope_concerns LIKE ?");
    params.push(`%${filters.concerns}%`);
  }

  if (filters.confidence) {
    conditions.push("confidence = ?");
    params.push(filters.confidence);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ? `LIMIT ${Number(filters.limit)}` : '';

  return db.prepare(`
    SELECT * FROM learnings ${where} ORDER BY created_at DESC ${limit}
  `).all(...params);
}

export function updateLearningRecurrence(db, id) {
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE learnings
    SET recurrence_count = recurrence_count + 1,
        last_applied = ?
    WHERE id = ?
  `).run(now, id);
}

export function getRecurringLearnings(db, minCount) {
  return db.prepare(`
    SELECT * FROM learnings
    WHERE recurrence_count >= ?
    ORDER BY recurrence_count DESC
  `).all(minCount);
}

// ---------------------------------------------------------------------------
// Findings CRUD
// ---------------------------------------------------------------------------

export function insertFinding(db, record) {
  const id = crypto.randomUUID();
  const findingHash = record.finding_hash ?? hashDescription(record.description);
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO findings (id, run_id, phase, source, severity, description, finding_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    record.run_id,
    record.phase,
    record.source,
    record.severity,
    record.description,
    findingHash,
    createdAt,
  );

  return id;
}

export function getFindingsByRun(db, runId) {
  return db.prepare(`
    SELECT * FROM findings
    WHERE run_id = ?
    ORDER BY created_at ASC
  `).all(runId);
}

export function getRecurringFindingHashes(db, minOccurrences) {
  return db.prepare(`
    SELECT finding_hash, COUNT(*) AS count
    FROM findings
    GROUP BY finding_hash
    HAVING COUNT(*) >= ?
    ORDER BY count DESC
  `).all(minOccurrences);
}

export function resolveFinding(db, id) {
  db.prepare(`
    UPDATE findings SET resolved = 1 WHERE id = ?
  `).run(id);
}

// ---------------------------------------------------------------------------
// Audit history
// ---------------------------------------------------------------------------

export function insertAuditRecord(db, record) {
  db.prepare(`
    INSERT INTO audit_history (run_id, finding_count, fix_count, manual_count, quality_score_before, quality_score_after)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    record.run_id,
    record.finding_count ?? 0,
    record.fix_count ?? 0,
    record.manual_count ?? 0,
    record.quality_score_before ?? null,
    record.quality_score_after ?? null,
  );
}

export function getAuditTrend(db, limit) {
  const limitClause = limit ? `LIMIT ${Number(limit)}` : '';

  return db.prepare(`
    SELECT * FROM audit_history
    ORDER BY date DESC, id DESC
    ${limitClause}
  `).all();
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

export function insertUsageRecord(db, record) {
  db.prepare(`
    INSERT INTO usage_aggregate (run_id, tokens_saved, bytes_avoided, savings_ratio, index_queries, routing_decisions)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    record.run_id,
    record.tokens_saved ?? 0,
    record.bytes_avoided ?? 0,
    record.savings_ratio ?? 0.0,
    record.index_queries ?? 0,
    record.routing_decisions ?? 0,
  );
}

export function getUsageSummary(db) {
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(tokens_saved), 0) AS total_tokens_saved,
      COALESCE(SUM(bytes_avoided), 0) AS total_bytes_avoided,
      CASE WHEN COUNT(*) > 0 THEN AVG(savings_ratio) ELSE 0.0 END AS avg_savings_ratio,
      COALESCE(SUM(index_queries), 0) AS total_index_queries,
      COUNT(*) AS run_count
    FROM usage_aggregate
  `).get();

  return row;
}

// ---------------------------------------------------------------------------
// Stats (for CLI)
// ---------------------------------------------------------------------------

export function getStateCounts(db) {
  return {
    learning_count: db.prepare('SELECT COUNT(*) AS count FROM learnings').get().count,
    finding_count: db.prepare('SELECT COUNT(*) AS count FROM findings').get().count,
    audit_count: db.prepare('SELECT COUNT(*) AS count FROM audit_history').get().count,
    usage_count: db.prepare('SELECT COUNT(*) AS count FROM usage_aggregate').get().count,
  };
}
