# Benchmark: One Hard Task — Implementation Plan

## Overview

Build a benchmark that proves Wazir's pipeline value by giving both a bare-metal agent and a Wazir-equipped agent the same deliberately-vague task, then scoring the output automatically.

**Task prompt:** "Add run pruning to the Wazir CLI."

**Deliverables:**
- `benchmark/challenges/run-pruning/prompt.md` — the challenge prompt + setup instructions
- `benchmark/challenges/run-pruning/rubric.json` — scoring dimensions, weights, automated checks
- `benchmark/challenges/run-pruning/evaluator.js` — Node script that scores a completed run
- `benchmark/run-benchmark.sh` — orchestration script
- `benchmark/challenges/run-pruning/evaluator.test.js` — tests for the evaluator itself

---

## Section 1: Challenge Definition Files

### Task 1.1: Create `benchmark/challenges/run-pruning/prompt.md`

The prompt file that both agents receive. Contains:
- The 9-word task: "Add run pruning to the Wazir CLI."
- Context setup: "You are working in the Wazir repository. The codebase has an existing CLI at `tooling/src/cli.js` with commands like `capture`, `index`, `export`. Run data lives under a state root resolved per-project."
- No hints about edge cases, flags, patterns, or acceptance criteria.

**Acceptance criteria:**
- File exists at `benchmark/challenges/run-pruning/prompt.md`
- Contains exactly one task sentence, no implementation hints
- Contains minimal context (repo location, CLI entry point) but no solution guidance

### Task 1.2: Create `benchmark/challenges/run-pruning/rubric.json`

JSON format (Node has no built-in YAML parser). 8 dimensions, weights sum to 100. Pipeline compliance is weighted heavily (15 pts) because it is a core user requirement.

Dimensions and weights:

| Dimension | Weight | Rationale |
|---|---|---|
| clarification | 10 | Did the agent clarify before coding? |
| research | 10 | Did it study existing patterns? |
| spec_design | 10 | Did it write a spec or acceptance criteria? |
| code_conformance | 15 | Does the code match existing CLI patterns? |
| test_quality | 20 | Tests exist, pass, cover edges? |
| edge_case_handling | 15 | Active run, no-runs, dry-run, dates? |
| verification_evidence | 5 | Proof that tests were actually run? |
| pipeline_compliance | 15 | Full pipeline adherence (clarify→research→spec→TDD→verify→review)? |

Checks per dimension:

**clarification** (10):
- `artifact_exists`: patterns `["**/spec.md", "**/clarif*", "**/design*"]`
- `git_log_check`: "First commit is not implementation code"

**research** (10):
- `pattern_conformance`: reference `tooling/src/cli.js`
- `import_style`: "Uses parseCommandOptions, resolveStateRoot, etc."

**spec_design** (10):
- `artifact_exists`: patterns `["**/spec.md", "**/plan*.md", "**/design*.md", "**/acceptance*"]`

**code_conformance** (15):
- `file_structure`: expected `["tooling/src/capture/prune.js OR similar"]`
- `uses_shared_utils`: "Uses parseCommandOptions, resolveStateRoot, getRunPaths"
- `formatResult_pattern`: "Returns {exitCode, stdout} like other commands"
- `json_flag_support`: "Supports --json output flag"

**test_quality** (20):
- `test_file_exists`: test file for prune
- `test_count`: minimum 5
- `tests_pass`: all pass when run
- `edge_case_coverage`: required patterns `["no run", "active", "dry", "older", "fresh"]`

**edge_case_handling** (15):
- `code_grep`: "active|running|current|latest"
- `code_grep`: "no run|nothing|empty|0 run"
- `code_grep`: "dry.?run|dryRun|preview"
- `code_grep`: "days|age|older|before|retention"

**verification_evidence** (5):
- `git_log_check`: "Commit messages reference test results or verification"

**pipeline_compliance** (15):
- `artifact_exists`: patterns `[".wazir/runs/**/phases/*", "**/phase-report*"]` — phase artifacts exist
- `git_log_check`: "Test commits appear before implementation commits" — TDD evidence
- `artifact_exists`: patterns `["**/review*", "**/finding*"]` — review artifacts exist
- `git_log_check`: "Clarification or spec commit appears before any code commit" — pipeline ordering
- `artifact_exists`: patterns `["**/verify*", "**/proof*", "**/test-output*"]` — verification proof exists

**Acceptance criteria:**
- File exists and is valid JSON (`JSON.parse` succeeds)
- All 8 dimensions present with weights summing to 100
- Each dimension has at least 1 automated check
- Checks use only types the evaluator implements

### Task 1.3: Verify challenge definition files

```bash
node -e "const fs = require('fs'); const r = JSON.parse(fs.readFileSync('benchmark/challenges/run-pruning/rubric.json','utf8')); const total = Object.values(r.dimensions).reduce((s,d) => s+d.weight, 0); console.log('Total weight:', total); console.assert(total === 100, 'Weights must sum to 100');"
cat benchmark/challenges/run-pruning/prompt.md
```

---

## Section 2: Evaluator Script

### Task 2.1: Create evaluator.js core structure

`benchmark/challenges/run-pruning/evaluator.js` — a Node script that:
- Takes `--dir <path>` pointing to the repo after a benchmark run
- Takes `--mode bare-metal|wazir` for labeling
- Reads rubric.json (JSON.parse — no external deps)
- Runs each check type against the repo state
- Outputs a score report (JSON + human-readable)

Core check implementations:

| Check type | Implementation |
|---|---|
| `artifact_exists` | Glob for patterns in the dir, score 1 if any match |
| `git_log_check` | Parse `git log --oneline` for patterns |
| `pattern_conformance` | Read reference file, check new code follows same structure |
| `uses_shared_utils` | Grep new files for expected imports |
| `formatResult_pattern` | Grep for `exitCode` and `stdout` in new files |
| `file_structure` | Check new files are in expected directories |
| `test_file_exists` | Glob for test files matching the feature |
| `test_count` | Count `test(` occurrences in test files |
| `tests_pass` | Run `node --test` on relevant test files |
| `edge_case_coverage` | Grep test files for required pattern keywords |
| `code_grep` | Grep implementation files for required patterns |
| `json_flag_support` | Grep for `--json` or `options.json` in new code |

**Acceptance criteria:**
- Script runs with `node benchmark/challenges/run-pruning/evaluator.js --dir . --mode bare-metal`
- Outputs JSON with per-dimension scores and total
- Handles missing files gracefully (score 0, not crash)
- Uses only Node.js built-in modules + child_process for git/grep

### Task 2.2: Implement check runners

All 12 check types, each as a named function returning `{ passed: boolean, detail: string }`:

| # | Function name | Check type | What it does |
|---|---|---|---|
| 1 | `checkArtifactExists` | `artifact_exists` | Glob for patterns, pass if any match |
| 2 | `checkGitLog` | `git_log_check` | Parse git log for patterns/ordering |
| 3 | `checkPatternConformance` | `pattern_conformance` | Read reference file, check new code follows same structure |
| 4 | `checkImportStyle` | `import_style` | Grep new files for expected import names |
| 5 | `checkFileStructure` | `file_structure` | Check new files are in expected directories |
| 6 | `checkUsesSharedUtils` | `uses_shared_utils` | Grep new files for shared util imports |
| 7 | `checkFormatResultPattern` | `formatResult_pattern` | Grep for `exitCode` and `stdout` in new files |
| 8 | `checkJsonFlagSupport` | `json_flag_support` | Grep for `--json` or `options.json` in new code |
| 9 | `checkTestFileExists` | `test_file_exists` | Glob for test files matching the feature |
| 10 | `checkTestCount` | `test_count` | Count `test(` occurrences in test files |
| 11 | `checkTestsPass` | `tests_pass` | Run `node --test` on relevant test files |
| 12 | `checkEdgeCaseCoverage` | `edge_case_coverage` | Grep test files for required keyword patterns |
| 13 | `checkCodeGrep` | `code_grep` | Grep implementation files for required patterns |

A `CHECK_RUNNERS` map dispatches: `{ artifact_exists: checkArtifactExists, ... }`.

**Acceptance criteria:**
- All 13 functions exist and are exported
- `CHECK_RUNNERS` map has an entry for every check type used in rubric.json
- Every runner catches exceptions internally, returns `{ passed: false, detail: error.message }` on error
- Every runner is pure (reads files/runs commands, no side effects)

### Task 2.3: Implement score aggregation and report output

Score calculation:
- Per dimension: `(checks_passed / total_checks) * weight`
- Total: sum of all dimension scores
- Output: JSON report + human-readable table to stdout

Report format:
```
Benchmark: run-pruning | Mode: wazir
═══════════════════════════════════════════
  Clarification        [██████████]  10/10
  Research             [████████░░]   8/10
  Spec/Design          [██████████]  10/10
  Code Conformance     [████████████░░░]  12/15
  Test Quality         [████████████████████]  20/20
  Edge Cases           [████████████░░░]  12/15
  Verification         [█████]   5/5
  Pipeline Compliance  [████████████░░░]  12/15
  ─────────────────────────────────────────
  TOTAL                          89/100
```

**Acceptance criteria:**
- JSON output written to `benchmark/results/<mode>/score.json`
- Human-readable table printed to stdout
- Score.json includes per-dimension breakdown with check details

### Task 2.4: Verify evaluator

```bash
node benchmark/challenges/run-pruning/evaluator.js --dir . --mode test
```

Should produce a valid score (will score low since no pruning feature exists — that's correct).

---

## Section 3: Benchmark Runner

### Task 3.1: Create `benchmark/run-benchmark.sh`

Shell script that:
1. Accepts `--mode bare-metal|wazir` and optional `--challenge run-pruning`
2. Creates a fresh branch: `benchmark/<mode>-<challenge>-<timestamp>`
3. Prints the challenge prompt to stdout
4. Prints instructions: "Complete this task, then run: `node benchmark/challenges/run-pruning/evaluator.js --dir . --mode <mode>`"

The script does NOT run the agent — it sets up the environment and the human triggers the agent manually.

**Acceptance criteria:**
- Script is executable (`chmod +x`)
- Creates branch from current HEAD
- Prints prompt from `prompt.md`
- Does not auto-run any agent
- Exits cleanly

### Task 3.2: Create `benchmark/compare.js`

Node script that loads two score.json files and outputs a side-by-side comparison:

```
═══════════════════════════════════════════════════════════
  Benchmark: run-pruning     bare-metal  vs  wazir
═══════════════════════════════════════════════════════════
  Clarification          0/10  [░░░░░░░░░░]  vs  10/10  [██████████]
  Research               2/10  [██░░░░░░░░]  vs   9/10  [█████████░]
  ...
  Pipeline Compliance    0/15  [░░░░░░░░░░]  vs  13/15  [████████░░]
  ─────────────────────────────────────────────────────────
  TOTAL                 14/100              vs  91/100
  DELTA                         +77 points
═══════════════════════════════════════════════════════════
```

Usage: `node benchmark/compare.js --bare-metal benchmark/results/bare-metal/score.json --wazir benchmark/results/wazir/score.json`

**Acceptance criteria:**
- Loads two score.json files
- Outputs per-dimension side-by-side with bar charts
- Shows total delta
- Exits 0 on success, 1 if files missing

### Task 3.3: Verify runner

```bash
bash benchmark/run-benchmark.sh --mode bare-metal --challenge run-pruning --dry-run
```

Should print the prompt and instructions without creating a branch (dry-run mode).

---

## Section 4: Evaluator Tests

### Task 4.1: Create `benchmark/challenges/run-pruning/evaluator.test.js`

Tests for the evaluator itself using `node:test`:

1. **Score calculation:** Given mock check results, verify correct weighted scores
2. **artifact_exists check:** Create temp dir with/without files, verify detection
3. **code_grep check:** Create temp file with/without pattern, verify detection
4. **test_count check:** Create temp test file with N test cases, verify count
5. **Graceful failure:** Point evaluator at empty dir, verify 0 score (not crash)
6. **Report format:** Verify JSON output has expected structure

**Acceptance criteria:**
- At least 6 test cases
- All tests pass with `node --test benchmark/challenges/run-pruning/evaluator.test.js`
- Tests use temp directories, no side effects on repo

### Task 4.2: Run all tests

```bash
node --test benchmark/challenges/run-pruning/evaluator.test.js
```

All green.

---

## Section 5: Integration Verification

### Task 5.1: End-to-end dry run

1. Run `bash benchmark/run-benchmark.sh --mode wazir --challenge run-pruning --dry-run`
2. Run `node benchmark/challenges/run-pruning/evaluator.js --dir . --mode baseline`
3. Verify: prompt prints correctly, evaluator produces valid 0-score baseline, no crashes

### Task 5.2: Verify no regressions

```bash
cd /Users/mohamedabdallah/Work/Wazir && node --test tooling/test/
```

Existing tests still pass — benchmark adds new files but does not modify existing ones.

**Acceptance criteria:**
- All existing tooling tests pass
- Benchmark evaluator tests pass
- No modifications to any existing file
