# Bash Orchestrator Patterns

**Date:** 2026-03-24

## Sequential Phase Orchestration

```bash
run_phase() {
  local name="$1" prompt="$2"
  claude -p "$prompt" --output-format json \
    > "${STATE_DIR}/artifacts/${name}.json" 2>"${STATE_DIR}/logs/${name}.stderr"
}

# Chain with artifact passing
run_phase "design" "Analyze the codebase..."
design=$(jq -r '.result' "${STATE_DIR}/artifacts/design.json")
run_phase "implement" "Implement this design: $design"
```

## Session Continuity

```bash
SID=$(claude -p --output-format json "Step 1" | jq -r '.session_id')
claude -p --resume "$SID" "Step 2"
```

## Validation Gates

```bash
gate_files_exist() {
  for f in "$@"; do [[ -f "$f" ]] || return 1; done
}

gate_content_contains() {
  local file="$1"; shift
  for pattern in "$@"; do grep -q "$pattern" "$file" || return 1; done
}
```

## Parallel Execution

```bash
claude -p "Review auth" > review-auth.md &
claude -p "Review api" > review-api.md &
wait
cat review-*.md | claude -p "Synthesize reviews"
```

## Cost Tracking

```bash
claude -p --output-format json "task" | jq '{
  input: .usage.input_tokens,
  output: .usage.output_tokens,
  cost: .costUSD
}'
```

## Key Flags for Orchestration

- `--max-turns N` — safety cap on agentic turns
- `--max-budget-usd N` — cost cap per call
- `--json-schema` — guaranteed structured output
- `--bare` — skip hooks/CLAUDE.md for fastest startup
- `--no-session-persistence` — no disk writes for ephemeral jobs

## Tmux Orchestration

```bash
# Create session
tmux new-session -d -s "claude-phase" -c "$dir" "claude --verbose"
# Send input
tmux send-keys -t "claude-phase" 'your prompt' Enter
# Capture output
tmux capture-pane -t "claude-phase" -p > output.txt
# Detect completion: poll tmux list-sessions
```

## Sources

- Claude Code CLI reference
- aaddrick/claude-pipeline, ruflo wiki
- GitHub Actions patterns
