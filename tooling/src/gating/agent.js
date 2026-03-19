import { readYamlFile } from '../loaders.js';

/**
 * Resolve a dotted field path (e.g. "quality_metrics.test_fail_count") on an object.
 * Returns undefined when any segment is missing.
 */
function resolvePath(obj, fieldPath) {
  const segments = fieldPath.split('.');
  let current = obj;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[seg];
  }
  return current;
}

/**
 * Check whether a single condition holds against a report.
 */
function evaluateCondition(report, condition) {
  const value = resolvePath(report, condition.field);

  switch (condition.operator) {
    case 'eq':
      return value === condition.value;

    case 'gt':
      return typeof value === 'number' && value > condition.value;

    case 'lt':
      return typeof value === 'number' && value < condition.value;

    case 'none_match': {
      // field must be an array; none of its items may match all key/value
      // pairs in condition.match
      if (!Array.isArray(value)) return value === undefined || value === null;
      const matchEntries = Object.entries(condition.match);
      return value.every(
        (item) => !matchEntries.every(([k, v]) => item[k] === v),
      );
    }

    default:
      // Unknown operator — treat as ambiguous → condition fails
      return false;
  }
}

/**
 * Extract human-readable failure descriptions from the report for loop_back fixes.
 */
function extractFixes(report) {
  const fixes = [];

  const testFails = resolvePath(report, 'quality_metrics.test_fail_count');
  if (typeof testFails === 'number' && testFails > 0) {
    fixes.push(`fix ${testFails} failing test(s)`);
  }

  const lintErrors = resolvePath(report, 'quality_metrics.lint_errors');
  if (typeof lintErrors === 'number' && lintErrors > 0) {
    fixes.push(`fix ${lintErrors} lint error(s)`);
  }

  const typeErrors = resolvePath(report, 'quality_metrics.type_errors');
  if (typeof typeErrors === 'number' && typeErrors > 0) {
    fixes.push(`fix ${typeErrors} type error(s)`);
  }

  return fixes;
}

/**
 * Evaluate a phase report against gating rules and return a verdict.
 *
 * @param {object|null|undefined} report  — parsed phase report JSON
 * @param {string} rulesPath              — path to gating-rules.yaml
 * @param {object} [context={}]           — additional context for the evaluation
 * @param {string} [context.userInput]    — optional user input that triggered the evaluation
 * @param {object} [context.decisions]    — optional prior decisions for multi-phase flows
 * @returns {{ verdict: string, reason: string, fixes?: string[] }}
 */
export function evaluatePhaseReport(report, rulesPath, context = {}) {
  // --- Load rules --------------------------------------------------------
  let rules;
  try {
    rules = readYamlFile(rulesPath);
  } catch (err) {
    return {
      verdict: 'escalate',
      reason: `Failed to load gating rules: ${err.message}`,
    };
  }

  // --- Guard: missing / empty report -------------------------------------
  if (report == null || typeof report !== 'object' || Object.keys(report).length === 0) {
    return {
      verdict: rules.default_verdict ?? 'escalate',
      reason: 'Report is empty or missing',
    };
  }

  // --- Try "continue" rule -----------------------------------------------
  const continueRule = rules.rules?.continue;
  if (continueRule && Array.isArray(continueRule.conditions) && continueRule.conditions.length > 0) {
    const allPass = continueRule.conditions.every((c) => evaluateCondition(report, c));
    if (allPass) {
      return { verdict: 'continue', reason: continueRule.description };
    }
  }

  // --- Try "loop_back" rule ----------------------------------------------
  // The loop_back rule fires when ANY deterministic failure exists.
  // The YAML conditions encode test_fail_count > 0 explicitly; the agent
  // also checks lint_errors > 0 and type_errors > 0 per the rule comments
  // ("# OR lint_errors > 0 OR type_errors > 0").
  const loopBackRule = rules.rules?.loop_back;
  if (loopBackRule) {
    const explicitMatch = Array.isArray(loopBackRule.conditions)
      && loopBackRule.conditions.length > 0
      && loopBackRule.conditions.some((c) => evaluateCondition(report, c));

    const lintErrors = resolvePath(report, 'quality_metrics.lint_errors');
    const typeErrors = resolvePath(report, 'quality_metrics.type_errors');
    const implicitMatch =
      (typeof lintErrors === 'number' && lintErrors > 0)
      || (typeof typeErrors === 'number' && typeErrors > 0);

    if (explicitMatch || implicitMatch) {
      const fixes = extractFixes(report);
      return {
        verdict: 'loop_back',
        reason: loopBackRule.description,
        fixes,
      };
    }
  }

  // --- Fallback to "escalate" --------------------------------------------
  const escalateRule = rules.rules?.escalate;
  return {
    verdict: 'escalate',
    reason: escalateRule?.description ?? 'Default escalation — no rule matched',
  };
}
