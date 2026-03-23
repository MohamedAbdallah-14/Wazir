#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Arg parsing ──────────────────────────────────────────────

function parseArgs(argv) {
  const args = { dir: '.', mode: 'unknown' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir' && argv[i + 1]) { args.dir = argv[i + 1]; i++; }
    if (argv[i] === '--mode' && argv[i + 1]) { args.mode = argv[i + 1]; i++; }
  }
  args.dir = path.resolve(args.dir);
  return args;
}

// ── File utilities ───────────────────────────────────────────

function globSimple(baseDir, patterns) {
  const matches = [];
  for (const pattern of patterns) {
    try {
      const found = findMatchingFiles(baseDir, pattern);
      matches.push(...found);
    } catch { /* ignore */ }
  }
  return matches;
}

function findMatchingFiles(baseDir, pattern) {
  const results = [];
  const parts = pattern.split('/');
  walkForPattern(baseDir, parts, 0, results);
  return results;
}

function walkForPattern(dir, parts, partIndex, results) {
  if (partIndex >= parts.length) return;

  const part = parts[partIndex];
  const isLast = partIndex === parts.length - 1;

  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }

  if (part === '**') {
    // Match zero or more directories
    // Try skipping ** (zero dirs)
    walkForPattern(dir, parts, partIndex + 1, results);
    // Try each subdir as one level of **
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkForPattern(path.join(dir, entry.name), parts, partIndex, results);
      }
    }
    return;
  }

  const regex = new RegExp('^' + part.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');

  for (const entry of entries) {
    if (!regex.test(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (isLast) {
      results.push(fullPath);
    } else if (entry.isDirectory()) {
      walkForPattern(fullPath, parts, partIndex + 1, results);
    }
  }
}

function detectBaseBranch(dir) {
  // Try common base branches
  for (const base of ['main', 'master', 'develop']) {
    try {
      execFileSync('git', ['rev-parse', '--verify', base], { cwd: dir, encoding: 'utf8', timeout: 5000 });
      return base;
    } catch { /* try next */ }
  }
  return null;
}

function findNewFiles(dir) {
  // Files added or modified vs the base branch (main/master)
  const base = detectBaseBranch(dir);
  if (!base) return [];

  try {
    // First try: diff against base branch merge-base
    const mergeBase = execFileSync('git', ['merge-base', base, 'HEAD'], {
      cwd: dir, encoding: 'utf8', timeout: 5000,
    }).trim();
    const diff = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', mergeBase + '..HEAD'], {
      cwd: dir, encoding: 'utf8', timeout: 10000,
    }).trim();
    if (!diff) return [];
    return diff.split('\n').map(f => path.join(dir, f));
  } catch {
    // Fallback: also include uncommitted changes
    try {
      const diff = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', base], {
        cwd: dir, encoding: 'utf8', timeout: 10000,
      }).trim();
      if (!diff) return [];
      return diff.split('\n').map(f => path.join(dir, f));
    } catch {
      return [];
    }
  }
}

function findNewImplFiles(dir) {
  return findNewFiles(dir).filter(f => {
    const rel = path.relative(dir, f);
    return f.endsWith('.js') &&
      !rel.includes('test') &&
      !rel.includes('node_modules') &&
      !rel.includes('benchmark/');
  });
}

function findNewTestFiles(dir) {
  return findNewFiles(dir).filter(f => {
    const rel = path.relative(dir, f);
    return f.endsWith('.js') &&
      (rel.includes('test') || rel.includes('spec')) &&
      !rel.includes('node_modules') &&
      !rel.includes('benchmark/');
  });
}

function safeReadFile(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); }
  catch { return ''; }
}

function gitLog(dir, format = '%s') {
  const base = detectBaseBranch(dir);
  if (!base) return [];
  try {
    const mergeBase = execFileSync('git', ['merge-base', base, 'HEAD'], {
      cwd: dir, encoding: 'utf8', timeout: 5000,
    }).trim();
    return execFileSync('git', ['log', '--format=' + format, mergeBase + '..HEAD'], {
      cwd: dir, encoding: 'utf8', timeout: 10000,
    }).trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// ── Check runners ────────────────────────────────────────────
// Every runner returns { passed: boolean, detail: string }

export function checkArtifactExists(dir, check) {
  try {
    const matches = globSimple(dir, check.patterns || []);
    const found = matches.filter(f => !f.includes('node_modules') && !f.includes('benchmark/'));
    // Cross-reference with new files to avoid false positives from pre-existing repo files
    const newFiles = new Set(findNewFiles(dir).map(f => f));
    const newMatches = found.filter(f => newFiles.has(f));
    if (newMatches.length > 0) {
      return { passed: true, detail: `Found: ${newMatches.map(f => path.relative(dir, f)).join(', ')}` };
    }
    return { passed: false, detail: `No NEW files matching ${JSON.stringify(check.patterns)}` };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkGitLog(dir, check) {
  try {
    const commits = gitLog(dir);
    if (commits.length === 0) {
      return { passed: false, detail: 'No commits found' };
    }

    const pattern = new RegExp(check.pattern, 'i');
    const mode = check.mode || 'any_commit_matches';

    if (mode === 'first_commit_matches') {
      const first = commits[commits.length - 1]; // oldest commit in range
      const matches = pattern.test(first);
      return {
        passed: matches,
        detail: matches
          ? `First commit matches: "${first}"`
          : `First commit does not match pattern /${check.pattern}/: "${first}"`,
      };
    }

    if (mode === 'any_commit_matches') {
      const match = commits.find(c => pattern.test(c));
      return {
        passed: !!match,
        detail: match
          ? `Found matching commit: "${match}"`
          : `No commits match pattern /${check.pattern}/`,
      };
    }

    if (mode === 'test_before_impl') {
      const testPattern = /test|spec|red|green/i;
      const implPattern = /feat|add|implement|prune|command/i;
      let firstTest = -1;
      let firstImpl = -1;
      // commits are newest-first, reverse for chronological
      const chrono = [...commits].reverse();
      for (let i = 0; i < chrono.length; i++) {
        if (firstTest === -1 && testPattern.test(chrono[i])) firstTest = i;
        if (firstImpl === -1 && implPattern.test(chrono[i])) firstImpl = i;
      }
      if (firstTest === -1) {
        return { passed: false, detail: 'No test commits found' };
      }
      const passed = firstTest <= firstImpl || firstImpl === -1;
      return {
        passed,
        detail: passed
          ? `Test commit (#${firstTest}) appears before impl commit (#${firstImpl})`
          : `Impl commit (#${firstImpl}) appears before test commit (#${firstTest})`,
      };
    }

    if (mode === 'clarify_before_code') {
      const clarifyPattern = /clarif|spec|design|plan|research/i;
      const codePattern = /feat|add|implement|fix|refactor/i;
      const chrono = [...commits].reverse();
      let firstClarify = -1;
      let firstCode = -1;
      for (let i = 0; i < chrono.length; i++) {
        if (firstClarify === -1 && clarifyPattern.test(chrono[i])) firstClarify = i;
        if (firstCode === -1 && codePattern.test(chrono[i])) firstCode = i;
      }
      if (firstClarify === -1) {
        return { passed: false, detail: 'No clarification commits found' };
      }
      const passed = firstClarify <= firstCode || firstCode === -1;
      return {
        passed,
        detail: passed
          ? `Clarification commit (#${firstClarify}) before code commit (#${firstCode})`
          : `Code commit (#${firstCode}) before clarification (#${firstClarify})`,
      };
    }

    return { passed: false, detail: `Unknown git_log_check mode: ${mode}` };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkPatternConformance(dir, check) {
  try {
    const refPath = path.join(dir, check.reference_file);
    const refContent = safeReadFile(refPath);
    if (!refContent) {
      return { passed: false, detail: `Reference file not found: ${check.reference_file}` };
    }
    // Check if cli.js was modified to register the new command
    const newFiles = findNewImplFiles(dir);
    if (newFiles.length === 0) {
      return { passed: false, detail: 'No new implementation files found' };
    }
    // Check if the CLI registration file references the new functionality
    const cliContent = safeReadFile(refPath);
    const hasPruneRef = /prune/i.test(cliContent);
    // Also check if the new files follow the command pattern (export a run* function)
    const followsPattern = newFiles.some(f => {
      const content = safeReadFile(f);
      return /export\s+(async\s+)?function\s+run/i.test(content) ||
             /export\s+\{[^}]*run/i.test(content);
    });
    const passed = hasPruneRef || followsPattern;
    return {
      passed,
      detail: passed
        ? 'New code follows CLI command registration pattern'
        : 'New code does not follow CLI command pattern (no exported run* function)',
    };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkImportStyle(dir, check) {
  try {
    const newFiles = findNewImplFiles(dir);
    if (newFiles.length === 0) {
      return { passed: false, detail: 'No new implementation files found' };
    }
    const required = check.required_imports || [];
    const allContent = newFiles.map(f => safeReadFile(f)).join('\n');
    const found = required.filter(imp => allContent.includes(imp));
    const passed = found.length >= Math.ceil(required.length / 2);
    return {
      passed,
      detail: `Found ${found.length}/${required.length} expected imports: ${found.join(', ') || 'none'}`,
    };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkFileStructure(dir, check) {
  try {
    const newFiles = findNewImplFiles(dir);
    if (newFiles.length === 0) {
      return { passed: false, detail: 'No new implementation files found' };
    }
    const expectedDirs = check.expected_dirs || [];
    const inExpected = newFiles.filter(f => {
      const rel = path.relative(dir, f);
      return expectedDirs.some(d => rel.startsWith(d));
    });
    const passed = inExpected.length > 0;
    return {
      passed,
      detail: passed
        ? `Files in correct dirs: ${inExpected.map(f => path.relative(dir, f)).join(', ')}`
        : `No new files in expected dirs: ${expectedDirs.join(', ')}`,
    };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkUsesSharedUtils(dir, check) {
  try {
    const newFiles = findNewImplFiles(dir);
    const allContent = newFiles.map(f => safeReadFile(f)).join('\n');
    const required = check.required_imports || [];
    const found = required.filter(imp => allContent.includes(imp));
    const passed = found.length > 0;
    return {
      passed,
      detail: `Shared utils used: ${found.join(', ') || 'none'} (expected: ${required.join(', ')})`,
    };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkFormatResultPattern(dir, check) {
  try {
    const newFiles = findNewImplFiles(dir);
    const allContent = newFiles.map(f => safeReadFile(f)).join('\n');
    const patterns = check.required_patterns || ['exitCode', 'stdout'];
    const found = patterns.filter(p => allContent.includes(p));
    const passed = found.length === patterns.length;
    return {
      passed,
      detail: `Found ${found.length}/${patterns.length} result pattern tokens: ${found.join(', ')}`,
    };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkJsonFlagSupport(dir, check) {
  try {
    const newFiles = findNewImplFiles(dir);
    const allContent = newFiles.map(f => safeReadFile(f)).join('\n');
    const patterns = check.required_patterns || ['json'];
    const found = patterns.filter(p => allContent.toLowerCase().includes(p.toLowerCase()));
    const passed = found.length > 0;
    return {
      passed,
      detail: passed ? 'JSON output support detected' : 'No --json flag support found',
    };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkTestFileExists(dir, check) {
  try {
    const patterns = check.patterns || ['**/prune*test*', '**/test*prune*'];
    const matches = globSimple(dir, patterns);
    const found = matches.filter(f => !f.includes('node_modules') && !f.includes('benchmark/'));
    // Also check git diff for new test files
    const newTests = findNewTestFiles(dir);
    const allFound = [...new Set([...found, ...newTests])];
    const passed = allFound.length > 0;
    return {
      passed,
      detail: passed
        ? `Test files: ${allFound.map(f => path.relative(dir, f)).join(', ')}`
        : 'No test files found for prune functionality',
    };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkTestCount(dir, check) {
  try {
    const testFiles = findNewTestFiles(dir);
    if (testFiles.length === 0) {
      return { passed: false, detail: 'No test files found' };
    }
    let totalTests = 0;
    for (const f of testFiles) {
      const content = safeReadFile(f);
      const matches = content.match(/\btest\s*\(/g);
      totalTests += matches ? matches.length : 0;
    }
    const minimum = check.minimum || 5;
    const passed = totalTests >= minimum;
    return {
      passed,
      detail: `Found ${totalTests} test cases (minimum: ${minimum})`,
    };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkTestsPass(dir, check) {
  try {
    const testFiles = findNewTestFiles(dir);
    if (testFiles.length === 0) {
      return { passed: false, detail: 'No test files to run' };
    }
    for (const f of testFiles) {
      try {
        execFileSync('node', ['--test', f], {
          cwd: dir, encoding: 'utf8', timeout: 30000,
        });
      } catch (e) {
        return {
          passed: false,
          detail: `Test failed: ${path.relative(dir, f)}: ${e.stderr || e.message}`,
        };
      }
    }
    return { passed: true, detail: `All ${testFiles.length} test files pass` };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkEdgeCaseCoverage(dir, check) {
  try {
    const testFiles = findNewTestFiles(dir);
    const allContent = testFiles.map(f => safeReadFile(f)).join('\n');
    if (!allContent) {
      return { passed: false, detail: 'No test file content' };
    }
    const required = check.required_patterns || [];
    const found = required.filter(p => new RegExp(p, 'i').test(allContent));
    const passed = found.length >= Math.ceil(required.length * 0.6);
    return {
      passed,
      detail: `Edge cases covered: ${found.length}/${required.length} — ${found.join(', ') || 'none'}`,
    };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

export function checkCodeGrep(dir, check) {
  try {
    const newFiles = findNewImplFiles(dir);
    const allContent = newFiles.map(f => safeReadFile(f)).join('\n');
    if (!allContent) {
      return { passed: false, detail: 'No implementation files to check' };
    }
    const pattern = new RegExp(check.pattern, 'i');
    const passed = pattern.test(allContent);
    return {
      passed,
      detail: passed
        ? `Pattern /${check.pattern}/ found in implementation`
        : `Pattern /${check.pattern}/ not found in implementation`,
    };
  } catch (e) {
    return { passed: false, detail: e.message };
  }
}

// ── Check runner dispatch ────────────────────────────────────

export const CHECK_RUNNERS = {
  artifact_exists: checkArtifactExists,
  git_log_check: checkGitLog,
  pattern_conformance: checkPatternConformance,
  import_style: checkImportStyle,
  file_structure: checkFileStructure,
  uses_shared_utils: checkUsesSharedUtils,
  formatResult_pattern: checkFormatResultPattern,
  json_flag_support: checkJsonFlagSupport,
  test_file_exists: checkTestFileExists,
  test_count: checkTestCount,
  tests_pass: checkTestsPass,
  edge_case_coverage: checkEdgeCaseCoverage,
  code_grep: checkCodeGrep,
};

// ── Scoring ──────────────────────────────────────────────────

export function scoreDimension(dir, dimension) {
  const results = [];
  for (const check of dimension.checks) {
    const runner = CHECK_RUNNERS[check.type];
    if (!runner) {
      results.push({ check: check.description, passed: false, detail: `Unknown check type: ${check.type}` });
      continue;
    }
    const result = runner(dir, check);
    results.push({ check: check.description, ...result });
  }
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const score = total > 0 ? Math.round((passed / total) * dimension.weight) : 0;
  return { score, maxScore: dimension.weight, passed, total, results };
}

export function scoreAll(dir, rubric) {
  const dimensions = {};
  let totalScore = 0;
  let totalMax = 0;

  for (const [key, dimension] of Object.entries(rubric.dimensions)) {
    const result = scoreDimension(dir, dimension);
    dimensions[key] = {
      label: dimension.label,
      ...result,
    };
    totalScore += result.score;
    totalMax += result.maxScore;
  }

  return { totalScore, totalMax, dimensions };
}

// ── Report output ────────────────────────────────────────────

function bar(score, max, width = 20) {
  const filled = max > 0 ? Math.round((score / max) * width) : 0;
  return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled);
}

export function formatReport(mode, scores) {
  const lines = [];
  lines.push('');
  lines.push(`Benchmark: run-pruning | Mode: ${mode}`);
  lines.push('\u2550'.repeat(50));

  for (const [, dim] of Object.entries(scores.dimensions)) {
    const label = (dim.label || '').padEnd(22);
    const scoreStr = `${dim.score}/${dim.maxScore}`.padStart(6);
    lines.push(`  ${label} [${bar(dim.score, dim.maxScore)}] ${scoreStr}`);
  }

  lines.push('  ' + '\u2500'.repeat(48));
  lines.push(`  ${'TOTAL'.padEnd(22)} ${' '.repeat(22)} ${String(scores.totalScore).padStart(3)}/${scores.totalMax}`);
  lines.push('\u2550'.repeat(50));
  lines.push('');
  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rubricPath = path.join(__dirname, 'rubric.json');

  let rubric;
  try {
    rubric = JSON.parse(fs.readFileSync(rubricPath, 'utf8'));
  } catch (e) {
    console.error(`Failed to read rubric: ${e.message}`);
    process.exit(1);
  }

  const scores = scoreAll(args.dir, rubric);
  const report = formatReport(args.mode, scores);
  console.log(report);

  // Write JSON results
  const resultsDir = path.join(__dirname, '..', '..', 'results', args.mode);
  fs.mkdirSync(resultsDir, { recursive: true });
  const jsonPath = path.join(resultsDir, 'score.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    challenge: 'run-pruning',
    mode: args.mode,
    timestamp: new Date().toISOString(),
    totalScore: scores.totalScore,
    totalMax: scores.totalMax,
    dimensions: scores.dimensions,
  }, null, 2) + '\n');

  console.log(`Results written to: ${path.relative(process.cwd(), jsonPath)}`);
}

// Run if executed directly
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  main();
}
