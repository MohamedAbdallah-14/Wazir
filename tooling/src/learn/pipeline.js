/**
 * Learning Pipeline — Findings-to-Antipattern Promotion
 *
 * 4-stage pipeline: TALLY → CANDIDATE → PROMOTE → ACTIVE
 *
 * Stage 1 (TALLY): Automatic. Every finding is hashed, categorized, and
 *   clustered by canonical pattern. Happens at finding insertion time.
 *
 * Stage 2 (CANDIDATE): Automatic. When a cluster reaches the promotion
 *   threshold (3+ occurrences across 2+ runs), it becomes a candidate.
 *
 * Stage 3 (PROMOTE): Human gate. Candidates are proposed for review.
 *   User accepts or rejects. Accepted candidates become active antipatterns.
 *
 * Stage 4 (ACTIVE): Automatic. Active antipatterns are loaded into
 *   reviewer context for future runs. Hit-rate tracking enables demotion.
 *
 * Drift prevention (from research):
 * - Max 30 active project-level antipatterns
 * - 90-day TTL on candidates (auto-expire if not reviewed)
 * - 5% hit-rate demotion threshold (antipatterns that never trigger get demoted)
 * - Principle consolidation when count exceeds 25
 */

import crypto from 'node:crypto';
import {
  upsertFindingCluster,
  getClustersReadyForPromotion,
  promoteClusterToCandidate,
  insertAntipatternCandidate,
  getActiveLearningsCount,
  expireStaleAntipatternCandidates,
} from '../state/db.js';

const MAX_ACTIVE_ANTIPATTERNS = 30;
const PROMOTION_THRESHOLD_OCCURRENCES = 3;
const PROMOTION_THRESHOLD_RUNS = 2;

/**
 * Normalize a finding description to a canonical form for clustering.
 * Strips file paths, line numbers, variable names, and normalizes whitespace.
 */
export function canonicalizeFinding(description) {
  return description
    // Remove file paths
    .replace(/[a-zA-Z0-9_\-./]+\.[a-zA-Z]{1,4}(:\d+)?/g, '<FILE>')
    // Remove line numbers
    .replace(/line \d+/gi, 'line <N>')
    // Remove quoted identifiers
    .replace(/['"`][\w.]+['"`]/g, '<ID>')
    // Remove hex hashes
    .replace(/[0-9a-f]{7,40}/gi, '<HASH>')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Hash a canonicalized finding for dedup and clustering.
 */
export function hashCanonical(canonicalized) {
  return crypto.createHash('sha256').update(canonicalized).digest('hex').slice(0, 16);
}

/**
 * Stage 1: TALLY — Process a finding and cluster it.
 * Called after each finding is inserted into the findings table.
 *
 * @param {object} db - open state database
 * @param {object} finding - { description, category, finding_hash, run_id }
 * @returns {string} cluster ID
 */
export function tallyFinding(db, finding) {
  const canonical = canonicalizeFinding(finding.description);
  const canonicalHash = hashCanonical(canonical);

  return upsertFindingCluster(db, {
    canonical_hash: canonicalHash,
    category: finding.category || '',
    pattern_description: canonical,
    finding_hash: finding.finding_hash,
    run_id: finding.run_id,
    evidence_runs: JSON.stringify([finding.run_id]),
  });
}

/**
 * Stage 2: CANDIDATE — Check clusters that meet the promotion threshold.
 * Returns clusters ready for promotion.
 *
 * @param {object} db - open state database
 * @returns {Array} clusters ready for promotion
 */
export function identifyCandidates(db) {
  return getClustersReadyForPromotion(
    db,
    PROMOTION_THRESHOLD_OCCURRENCES,
    PROMOTION_THRESHOLD_RUNS,
  );
}

/**
 * Stage 2→3: Promote eligible clusters to candidates and generate
 * antipattern proposals.
 *
 * @param {object} db - open state database
 * @param {Array} clusters - from identifyCandidates()
 * @returns {Array} created candidate IDs
 */
export function promoteToCandidates(db, clusters) {
  const activeCount = getActiveLearningsCount(db);
  if (activeCount >= MAX_ACTIVE_ANTIPATTERNS) {
    return []; // Drift prevention: don't propose more if at cap
  }

  const candidateIds = [];

  for (const cluster of clusters) {
    promoteClusterToCandidate(db, cluster.id);

    const runIds = JSON.parse(cluster.run_ids || '[]');
    const candidateId = insertAntipatternCandidate(db, {
      cluster_id: cluster.id,
      title: `Recurring: ${cluster.category || 'uncategorized'}`,
      description: cluster.pattern_description,
      detection_signal: `Pattern occurred ${cluster.occurrence_count} times across ${cluster.distinct_runs} runs`,
      severity: cluster.occurrence_count >= 5 ? 'high' : 'medium',
      evidence_runs: runIds,
      evidence_count: cluster.occurrence_count,
    });

    candidateIds.push(candidateId);
  }

  return candidateIds;
}

/**
 * Run the full pipeline pass: tally → identify → promote → expire stale.
 * Called by the learn workflow after a run completes.
 *
 * @param {object} db - open state database
 * @param {string} runId - current run ID
 * @param {Array} findings - array of { description, category, severity, source }
 * @returns {object} pipeline results
 */
export function runLearningPipeline(db, runId, findings) {
  // Stage 1: Tally all findings
  const clusterIds = [];
  for (const finding of findings) {
    const hash = crypto.createHash('sha256').update(finding.description).digest('hex');
    const clusterId = tallyFinding(db, {
      description: finding.description,
      category: finding.category || '',
      finding_hash: hash,
      run_id: runId,
    });
    clusterIds.push(clusterId);
  }

  // Stage 2: Identify clusters ready for promotion
  const readyClusters = identifyCandidates(db);

  // Stage 2→3: Promote to candidates
  const newCandidateIds = promoteToCandidates(db, readyClusters);

  // Housekeeping: expire stale candidates
  expireStaleAntipatternCandidates(db);

  return {
    findings_tallied: findings.length,
    clusters_touched: new Set(clusterIds).size,
    new_candidates: newCandidateIds.length,
    candidate_ids: newCandidateIds,
  };
}
