#!/usr/bin/env bash
# Run a single benchmark: bare-metal vs Wazir
# Usage: ./benchmark/run-benchmark.sh <test-number> <variant: bare|wazir>

set -euo pipefail

TEST_NUM="${1:?Usage: run-benchmark.sh <1-5> <bare|wazir>}"
VARIANT="${2:?Usage: run-benchmark.sh <1-5> <bare|wazir>}"
BENCH_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$BENCH_DIR")"
RESULTS_DIR="$BENCH_DIR/results"
WORKTREE_DIR="/tmp/wazir-bench-${TEST_NUM}-${VARIANT}"

mkdir -p "$RESULTS_DIR"

# Read prompt from benchmark suite
PROMPTS=(
  ""
  "Implement wazir validate artifacts in this repo. Validate a selected run's pipeline artifacts against existing schemas/templates. Fail clearly for missing artifacts, malformed files, and schema violations. Support --json output. Add focused automated tests and update any docs or command-registry surfaces made stale by the new command. Commit your work when done."
  "Add an explicit verifier enforcement phase between executor and final_review. The phase must have its own phase file/template. Verification artifacts should belong to this phase, not final_review. final_review must require both the verification-proof artifact and a completed verifier phase exit. Update guards, manifests, templates, docs, and automated tests so the enforcement is consistent end-to-end. Commit your work when done."
  "Extend wazir state findings with --recurring --min n. Show recurring unresolved finding patterns across runs. Support human-readable output and --json. Include count, distinct run count, first_seen, last_seen, and a representative description. Add tests and docs. Commit your work when done."
  "Fix wazir report phase metric parsing. Correctly parse modern Node test runner summary lines and legacy/TAP-style summaries. Correctly classify renamed/copied files from git diff --name-status. Add regression tests and keep backward compatibility. Commit your work when done."
  "Extend the verification proof collector for CLI projects. Add a new verification.cli_smoke_commands field to wazir.manifest.yaml. For CLI projects, collectProof should run those smoke commands in addition to --help. Capture each smoke command output in the proof artifact. Fail clearly when a smoke command fails. Preserve current behavior when the field is absent. Add tests and docs. Commit your work when done."
)

PROMPT="${PROMPTS[$TEST_NUM]}"

if [ "$VARIANT" = "wazir" ]; then
  PROMPT="/wazir:wazir $PROMPT Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill please."
fi

# Create worktree
echo "=== Setting up worktree: $WORKTREE_DIR ==="
rm -rf "$WORKTREE_DIR"
BRANCH="benchmark/${TEST_NUM}-${VARIANT}"
git -C "$PROJECT_ROOT" worktree add "$WORKTREE_DIR" -b "$BRANCH" origin/main 2>/dev/null || \
  git -C "$PROJECT_ROOT" worktree add "$WORKTREE_DIR" "$BRANCH" 2>/dev/null || \
  (git -C "$PROJECT_ROOT" branch -D "$BRANCH" 2>/dev/null; git -C "$PROJECT_ROOT" worktree add "$WORKTREE_DIR" -b "$BRANCH" origin/main)

echo "=== Running $VARIANT benchmark $TEST_NUM ==="
echo "Prompt: ${PROMPT:0:100}..."

OUTPUT_FILE="$RESULTS_DIR/bench-${TEST_NUM}-${VARIANT}.log"

cd "$WORKTREE_DIR"
rm -rf .wazir/state/ .wazir/runs/ 2>/dev/null

claude --dangerously-skip-permissions \
  --model sonnet \
  --verbose \
  -p "$PROMPT" \
  > "$OUTPUT_FILE" 2>&1 || true

echo "=== Collecting results ==="

# Collect metrics
RESULT_FILE="$RESULTS_DIR/bench-${TEST_NUM}-${VARIANT}-metrics.json"

TEST_OUTPUT=$(cd "$WORKTREE_DIR" && npm test 2>&1 || true)
TEST_PASS=$(echo "$TEST_OUTPUT" | grep "^ℹ pass" | awk '{print $3}' || echo "0")
TEST_FAIL=$(echo "$TEST_OUTPUT" | grep "^ℹ fail" | awk '{print $3}' || echo "0")
TEST_TOTAL=$(echo "$TEST_OUTPUT" | grep "^ℹ tests" | awk '{print $3}' || echo "0")
COMMIT_COUNT=$(cd "$WORKTREE_DIR" && git log --oneline origin/main..HEAD | wc -l | tr -d ' ')
DIFF_STATS=$(cd "$WORKTREE_DIR" && git diff --stat origin/main..HEAD | tail -1 || echo "0")
FILES_CHANGED=$(cd "$WORKTREE_DIR" && git diff --name-only origin/main..HEAD | wc -l | tr -d ' ')

cat > "$RESULT_FILE" <<METRICS
{
  "benchmark": $TEST_NUM,
  "variant": "$VARIANT",
  "test_pass": $TEST_PASS,
  "test_fail": $TEST_FAIL,
  "test_total": $TEST_TOTAL,
  "commit_count": $COMMIT_COUNT,
  "files_changed": $FILES_CHANGED,
  "diff_stats": "$DIFF_STATS"
}
METRICS

echo "=== Done: bench-${TEST_NUM}-${VARIANT} ==="
echo "Results: $RESULT_FILE"
echo "Log: $OUTPUT_FILE"

# Clean up worktree
cd "$PROJECT_ROOT"
git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
git branch -D "$BRANCH" 2>/dev/null || true
