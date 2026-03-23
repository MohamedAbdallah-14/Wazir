#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

MODE=""
CHALLENGE="run-pruning"
DRY_RUN=false

usage() {
  cat <<'EOF'
Usage: ./benchmark/run-benchmark.sh --mode <bare-metal|wazir|both> [options]

Creates isolated git worktrees for benchmark runs. Use --mode both to set up
bare-metal and wazir side-by-side for simultaneous recording.

  --mode        bare-metal, wazir, or both
  --challenge   Challenge name (default: run-pruning)
  --dry-run     Show what would happen without creating worktrees
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --challenge) CHALLENGE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --help|-h) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

[[ -z "$MODE" ]] && { echo "Error: --mode required (bare-metal, wazir, or both)"; exit 1; }
[[ "$MODE" != "bare-metal" && "$MODE" != "wazir" && "$MODE" != "both" ]] && {
  echo "Error: --mode must be bare-metal, wazir, or both"; exit 1;
}

PROMPT_FILE="$SCRIPT_DIR/challenges/$CHALLENGE/prompt.md"
[[ ! -f "$PROMPT_FILE" ]] && { echo "Error: $PROMPT_FILE not found"; exit 1; }

# Extract prompts (bare-metal is between 1st pair of ---, wazir between 2nd pair)
BM_PROMPT=$(awk '/^---$/{n++; next} n==1' "$PROMPT_FILE")
WZ_PROMPT=$(awk '/^---$/{n++; next} n==3' "$PROMPT_FILE")

setup_worktree() {
  local mode="$1"
  local branch="benchmark/${mode}-${CHALLENGE}"
  local worktree_dir="${REPO_ROOT}-benchmark-${mode}"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [DRY RUN] Would create:"
    echo "    Branch:    $branch"
    echo "    Worktree:  $worktree_dir"
    return
  fi

  cd "$REPO_ROOT"

  # Clean up previous worktree/branch if they exist
  git worktree remove "$worktree_dir" --force 2>/dev/null || true
  git branch -D "$branch" 2>/dev/null || true

  # Create fresh worktree from main
  git worktree add -b "$branch" "$worktree_dir" main

  # For bare-metal: strip all Wazir context so it's a vanilla Claude session
  if [[ "$mode" == "bare-metal" ]]; then
    rm -f "$worktree_dir/CLAUDE.md"
    rm -rf "$worktree_dir/.claude"
    rm -rf "$worktree_dir/hooks"
    echo "  Stripped:  CLAUDE.md, .claude/, hooks/ (vanilla agent)"
  fi

  echo "  Branch:    $branch"
  echo "  Worktree:  $worktree_dir"
  if [[ "$mode" == "bare-metal" ]]; then
    echo "  Launch:    cd $worktree_dir && claude --dangerously-skip-permissions --disable-slash-commands --setting-sources project --strict-mcp-config"
  else
    echo "  Launch:    cd $worktree_dir && claude --dangerously-skip-permissions"
  fi
}

echo ""
echo "══════════════════════════════════════════════"
echo "  Wazir Benchmark: $CHALLENGE"
echo "══════════════════════════════════════════════"
echo ""

if [[ "$MODE" == "both" ]]; then
  echo "Setting up BARE-METAL worktree..."
  setup_worktree "bare-metal"
  echo ""
  echo "Setting up WAZIR worktree..."
  setup_worktree "wazir"
else
  echo "Setting up $MODE worktree..."
  setup_worktree "$MODE"
fi

if [[ "$MODE" == "both" ]]; then
  echo ""
  echo "── BARE-METAL prompt ──────────────────────────"
  echo "$BM_PROMPT"
  echo "────────────────────────────────────────────────"
  echo ""
  echo "── WAZIR prompt ───────────────────────────────"
  echo "$WZ_PROMPT"
  echo "────────────────────────────────────────────────"
else
  echo ""
  echo "── Prompt ─────────────────────────────────────"
  if [[ "$MODE" == "wazir" ]]; then echo "$WZ_PROMPT"; else echo "$BM_PROMPT"; fi
  echo "────────────────────────────────────────────────"
fi

if [[ "$DRY_RUN" != "true" ]]; then
  echo ""
  echo "After both finish, score from the main repo:"
  echo ""
  BM_DIR="${REPO_ROOT}-benchmark-bare-metal"
  WZ_DIR="${REPO_ROOT}-benchmark-wazir"
  if [[ "$MODE" == "both" ]]; then
    echo "  node benchmark/challenges/$CHALLENGE/evaluator.js --dir $BM_DIR --mode bare-metal"
    echo "  node benchmark/challenges/$CHALLENGE/evaluator.js --dir $WZ_DIR --mode wazir"
    echo ""
    echo "  node benchmark/compare.js \\"
    echo "    --bare-metal benchmark/results/bare-metal/score.json \\"
    echo "    --wazir benchmark/results/wazir/score.json"
  else
    local_dir="${REPO_ROOT}-benchmark-${MODE}"
    echo "  node benchmark/challenges/$CHALLENGE/evaluator.js --dir $local_dir --mode $MODE"
  fi
fi
echo ""
