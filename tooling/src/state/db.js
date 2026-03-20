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

/**
 * Normalize a finding description for clustering.
 * Strips file paths, line numbers, identifiers to produce a canonical pattern.
 */
function canonicalizeFindingText(description) {
  return description
    .replace(/[a-zA-Z0-9_\-./]+\.[a-zA-Z]{1,4}(:\d+)?/g, '<FILE>')
    .replace(/line \d+/gi, 'line <N>')
    .replace(/['"`][\w.]+['"`]/g, '<ID>')
    .replace(/[0-9a-f]{7,40}/gi, '<HASH>')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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

    CREATE TABLE IF NOT EXISTS finding_clusters (
      id TEXT PRIMARY KEY,
      canonical_hash TEXT NOT NULL,
      category TEXT NOT NULL,
      pattern_description TEXT NOT NULL,
      finding_hashes TEXT NOT NULL DEFAULT '[]',
      run_ids TEXT NOT NULL DEFAULT '[]',
      occurrence_count INTEGER DEFAULT 1,
      distinct_runs INTEGER DEFAULT 1,
      first_seen TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'tally' CHECK(status IN ('tally','candidate','promoted','active','demoted')),
      promoted_at TEXT,
      antipattern_id TEXT
    );

    CREATE TABLE IF NOT EXISTS antipattern_candidates (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL REFERENCES finding_clusters(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      detection_signal TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('critical','high','medium','low')),
      scope_roles TEXT DEFAULT 'reviewer',
      scope_stacks TEXT DEFAULT 'all',
      evidence_runs TEXT NOT NULL DEFAULT '[]',
      evidence_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'proposed' CHECK(status IN ('proposed','accepted','rejected','expired')),
      proposed_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      expires_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_finding_clusters_status ON finding_clusters(status);
    CREATE INDEX IF NOT EXISTS idx_finding_clusters_canonical_hash ON finding_clusters(canonical_hash);
    CREATE INDEX IF NOT EXISTS idx_antipattern_candidates_status ON antipattern_candidates(status);
  `);

  // Safe migration: add category column to findings if it doesn't exist
  try {
    db.exec(`ALTER TABLE findings ADD COLUMN category TEXT DEFAULT ''`);
  } catch (_) {
    // Column already exists — ignore
  }

  // Index on findings.category (must run after migration adds the column)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_findings_category ON findings(category)`);
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
  const category = record.category || '';

  db.prepare(`
    INSERT INTO findings (id, run_id, phase, source, severity, description, finding_hash, category, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    record.run_id,
    record.phase,
    record.source,
    record.severity,
    record.description,
    findingHash,
    category,
    createdAt,
  );

  // Auto-tally: cluster the finding for the learning pipeline
  upsertFindingCluster(db, {
    canonical_hash: hashDescription(canonicalizeFindingText(record.description)),
    category,
    pattern_description: canonicalizeFindingText(record.description),
    finding_hash: findingHash,
    run_id: record.run_id,
  });

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
// Finding Clusters (Learning Pipeline)
// ---------------------------------------------------------------------------

export function upsertFindingCluster(db, record) {
  const existing = db.prepare(`
    SELECT * FROM finding_clusters WHERE canonical_hash = ?
  `).get(record.canonical_hash);

  if (existing) {
    const hashes = JSON.parse(existing.finding_hashes);
    if (!hashes.includes(record.finding_hash)) {
      hashes.push(record.finding_hash);
    }
    // Track distinct runs from the DB row, not the incoming record
    const existingRuns = new Set(JSON.parse(existing.run_ids || '[]'));
    if (record.run_id) existingRuns.add(record.run_id);

    db.prepare(`
      UPDATE finding_clusters
      SET finding_hashes = ?,
          run_ids = ?,
          occurrence_count = occurrence_count + 1,
          distinct_runs = ?,
          last_seen = datetime('now'),
          category = COALESCE(NULLIF(?, ''), category)
      WHERE id = ?
    `).run(
      JSON.stringify(hashes),
      JSON.stringify([...existingRuns]),
      existingRuns.size,
      record.category || '',
      existing.id,
    );

    return existing.id;
  }

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO finding_clusters (id, canonical_hash, category, pattern_description, finding_hashes, run_ids, occurrence_count, distinct_runs)
    VALUES (?, ?, ?, ?, ?, ?, 1, 1)
  `).run(
    id,
    record.canonical_hash,
    record.category || 'uncategorized',
    record.pattern_description,
    JSON.stringify([record.finding_hash]),
    JSON.stringify(record.run_id ? [record.run_id] : []),
  );

  return id;
}

export function getClustersByStatus(db, status) {
  return db.prepare(`
    SELECT * FROM finding_clusters
    WHERE status = ?
    ORDER BY occurrence_count DESC
  `).all(status);
}

export function getClustersReadyForPromotion(db, minOccurrences = 3, minRuns = 2) {
  return db.prepare(`
    SELECT * FROM finding_clusters
    WHERE status = 'tally'
      AND occurrence_count >= ?
      AND distinct_runs >= ?
    ORDER BY occurrence_count DESC
  `).all(minOccurrences, minRuns);
}

export function promoteClusterToCandidate(db, clusterId) {
  db.prepare(`
    UPDATE finding_clusters
    SET status = 'candidate',
        promoted_at = datetime('now')
    WHERE id = ?
  `).run(clusterId);
}

// ---------------------------------------------------------------------------
// Antipattern Candidates (Learning Pipeline)
// ---------------------------------------------------------------------------

export function insertAntipatternCandidate(db, record) {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90-day TTL

  db.prepare(`
    INSERT INTO antipattern_candidates (id, cluster_id, title, description, detection_signal, severity, scope_roles, scope_stacks, evidence_runs, evidence_count, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    record.cluster_id,
    record.title,
    record.description,
    record.detection_signal,
    record.severity,
    record.scope_roles || 'reviewer',
    record.scope_stacks || 'all',
    JSON.stringify(Array.isArray(record.evidence_runs) ? record.evidence_runs : []),
    record.evidence_count || 0,
    expiresAt,
  );

  return id;
}

export function getAntipatternCandidatesByStatus(db, status) {
  return db.prepare(`
    SELECT * FROM antipattern_candidates
    WHERE status = ?
    ORDER BY proposed_at DESC
  `).all(status);
}

export function acceptAntipatternCandidate(db, candidateId) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE antipattern_candidates
    SET status = 'accepted',
        reviewed_at = ?
    WHERE id = ?
  `).run(now, candidateId);
}

export function rejectAntipatternCandidate(db, candidateId) {
  const now = new Date().toISOString();
  // Get the cluster_id before updating so we can reset the cluster
  const candidate = db.prepare(`SELECT cluster_id FROM antipattern_candidates WHERE id = ?`).get(candidateId);
  db.prepare(`
    UPDATE antipattern_candidates
    SET status = 'rejected',
        reviewed_at = ?
    WHERE id = ?
  `).run(now, candidateId);
  // Reset cluster back to 'tally' so the pattern can be re-proposed if it keeps recurring
  if (candidate) {
    db.prepare(`UPDATE finding_clusters SET status = 'tally' WHERE id = ?`).run(candidate.cluster_id);
  }
}

export function expireStaleAntipatternCandidates(db) {
  const now = new Date().toISOString();
  // Get cluster IDs for candidates about to expire so we can reset them
  const expiring = db.prepare(`
    SELECT cluster_id FROM antipattern_candidates
    WHERE status = 'proposed' AND expires_at < ?
  `).all(now);

  const result = db.prepare(`
    UPDATE antipattern_candidates
    SET status = 'expired'
    WHERE status = 'proposed'
      AND expires_at < ?
  `).run(now);

  // Reset clusters back to 'tally' so patterns can be re-proposed
  for (const { cluster_id } of expiring) {
    db.prepare(`UPDATE finding_clusters SET status = 'tally' WHERE id = ?`).run(cluster_id);
  }

  return result;
}

export function getActiveLearningsCount(db) {
  return db.prepare(`
    SELECT COUNT(*) AS count FROM antipattern_candidates
    WHERE status = 'accepted'
  `).get().count;
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
    cluster_count: db.prepare('SELECT COUNT(*) AS count FROM finding_clusters').get().count,
    candidate_count: db.prepare('SELECT COUNT(*) AS count FROM antipattern_candidates WHERE status = ?').get('proposed').count,
    active_antipattern_count: db.prepare('SELECT COUNT(*) AS count FROM antipattern_candidates WHERE status = ?').get('accepted').count,
  };
}
