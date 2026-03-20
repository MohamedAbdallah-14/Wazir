import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fileExistsAndNonEmpty(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  return stat.size > 0;
}

function result(passed, reason, missing = []) {
  return { passed, reason, ...(missing.length > 0 ? { missing } : {}) };
}

// ---------------------------------------------------------------------------
// Per-phase validators
// ---------------------------------------------------------------------------

const CLARIFY_ARTIFACTS = [
  'clarified/clarification.md',
  'clarified/spec-hardened.md',
  'clarified/design.md',
  'clarified/execution-plan.md',
];

/**
 * Validates clarify phase produced all required artifacts.
 */
export function validateClarifyComplete(_state, runDir) {
  const missing = [];
  for (const relPath of CLARIFY_ARTIFACTS) {
    const full = path.join(runDir, relPath);
    if (!fileExistsAndNonEmpty(full)) {
      missing.push(relPath);
    }
  }
  if (missing.length > 0) {
    return result(false, `Missing clarify artifacts: ${missing.join(', ')}`, missing);
  }
  return result(true, 'All clarify artifacts present and non-empty.');
}

/**
 * Validates execute phase: at least one task artifact dir and verification proof.
 */
export function validateExecuteComplete(_state, runDir) {
  const missing = [];
  const artifactsDir = path.join(runDir, 'artifacts');

  // Check for at least one task-NNN directory with content
  const taskDirs = fs.existsSync(artifactsDir)
    ? fs.readdirSync(artifactsDir).filter(d => d.startsWith('task-') && fs.statSync(path.join(artifactsDir, d)).isDirectory())
    : [];

  if (taskDirs.length === 0) {
    missing.push('artifacts/task-NNN/ (no task artifacts found)');
  }

  // Check verification proof
  const proofPath = path.join(artifactsDir, 'verification-proof.md');
  if (!fileExistsAndNonEmpty(proofPath)) {
    missing.push('artifacts/verification-proof.md');
  }

  if (missing.length > 0) {
    return result(false, `Missing execute artifacts: ${missing.join(', ')}`, missing);
  }
  return result(true, `Execute complete: ${taskDirs.length} task(s) + verification proof.`);
}

/**
 * Validates verify phase: proof exists and has substantive content.
 */
export function validateVerifyComplete(_state, runDir) {
  const proofPath = path.join(runDir, 'artifacts', 'verification-proof.md');
  if (!fileExistsAndNonEmpty(proofPath)) {
    return result(false, 'Verification proof missing or empty.', ['artifacts/verification-proof.md']);
  }

  const content = fs.readFileSync(proofPath, 'utf8');
  if (content.trim().length < 20) {
    return result(false, 'Verification proof exists but has insufficient content.', ['artifacts/verification-proof.md']);
  }

  return result(true, 'Verification proof present with evidence.');
}

/**
 * Validates review phase: verdict.json with a numeric score.
 */
export function validateReviewComplete(_state, runDir) {
  const verdictPath = path.join(runDir, 'reviews', 'verdict.json');
  if (!fs.existsSync(verdictPath)) {
    return result(false, 'Review verdict missing.', ['reviews/verdict.json']);
  }

  try {
    const verdict = JSON.parse(fs.readFileSync(verdictPath, 'utf8'));
    if (typeof verdict.score !== 'number') {
      return result(false, 'Review verdict has no numeric score.', ['reviews/verdict.json (missing score)']);
    }
    return result(true, `Review complete with score ${verdict.score}.`);
  } catch {
    return result(false, 'Review verdict is not valid JSON.', ['reviews/verdict.json']);
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const VALIDATORS = {
  clarify: validateClarifyComplete,
  execute: validateExecuteComplete,
  verify: validateVerifyComplete,
  review: validateReviewComplete,
};

/**
 * Run the guardrail for a given phase.
 */
export function runGuardrail(phase, state, runDir) {
  const validator = VALIDATORS[phase];
  if (!validator) {
    throw new Error(`Unknown phase for guardrail: ${phase}`);
  }
  return validator(state, runDir);
}
