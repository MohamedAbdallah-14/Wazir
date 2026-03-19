---
name: wz:codex-cli
description: How to use Codex CLI programmatically for reviews, execution, and sandbox operations within Wazir pipelines.
---

# Codex CLI Integration

## Command Routing
Follow the Canonical Command Matrix in `hooks/routing-matrix.json`.
- Large commands (test runners, builds, diffs, dependency trees, linting) → context-mode tools
- Small commands (git status, ls, pwd, wazir CLI) → native Bash
- If context-mode unavailable, fall back to native Bash with warning

## Codebase Exploration
1. Query `wazir index search-symbols <query>` first
2. Use `wazir recall file <path> --tier L1` for targeted reads
3. Fall back to direct file reads ONLY for files identified by index queries
4. Maximum 10 direct file reads without a justifying index query
5. If no index exists: `wazir index build && wazir index summarize --tier all`

Reference for using the OpenAI Codex CLI in Wazir pipelines. Codex is a terminal-based coding agent that reads your codebase, suggests or implements changes, and executes commands with OS-level sandboxing.

## Commands

### codex (interactive)

Launch the interactive TUI. Default mode for ad-hoc work.

```bash
codex "Fix the failing test in src/auth.ts"
```

### codex exec

Run Codex non-interactively (alias: `codex e`). Streams results to stdout or JSONL. This is the primary command for Wazir automation.

```bash
# Basic non-interactive run
codex exec "Refactor the auth module to use async/await"

# Pipe a long prompt from stdin
cat prompt.md | codex exec -

# JSON event stream for programmatic consumption
codex exec --json "Add error handling to all API routes"

# Write final assistant message to a file
codex exec --output-file result.md "Summarize the codebase architecture"

# Enforce structured output with a JSON schema
codex exec --output-schema schema.json "List all exported functions"

# Ephemeral run (no session files persisted)
codex exec --ephemeral "Quick check: does this file import lodash?"
```

**Key flags:**

| Flag | Description |
|------|-------------|
| `--model <MODEL>` | Override the configured model (e.g., `gpt-5.4`, `gpt-5.4-mini`) |
| `--json` | Emit newline-delimited JSON events (JSONL) instead of formatted text |
| `--output-file <PATH>` | Write the final assistant message to a file |
| `--output-schema <PATH>` | Enforce structured output conforming to a JSON schema |
| `--ephemeral` | Run without persisting session rollout files |
| `--full-auto` | Apply the low-friction automation preset (`workspace-write` sandbox + `on-request` approvals) |
| `--dangerously-bypass-approvals-and-sandbox` / `--yolo` | Bypass all approval prompts and sandboxing (use only inside isolated runners) |
| `-c key=value` | Set a config override (e.g., `-c model=gpt-5.4`) |

**JSONL event types:** `thread.started`, `turn.started`, `turn.completed`, `turn.failed`, `item.message`, `item.command`, `item.file_change`, `item.mcp_tool_call`.

### codex review

Dedicated code review command. This is what Wazir uses for secondary review in the reviewer skill.

```bash
# Review uncommitted changes (staged + unstaged + untracked)
codex review --uncommitted

# Review changes against a base branch
codex review --base main

# Review a specific commit
codex review --commit d5853d9

# Review with custom instructions
codex review --uncommitted "Check for security vulnerabilities and missing error handling"

# Review with model override
codex review --model gpt-5.4 --base main "Review against these acceptance criteria: ..."
```

**Key flags:**

| Flag | Description |
|------|-------------|
| `--uncommitted` | Review staged, unstaged, and untracked changes |
| `--base <BRANCH>` | Review changes against a given base branch |
| `--commit <SHA>` | Review the changes introduced by a specific commit |
| `--model <MODEL>` | Override the model for this review |
| `[PROMPT]` | Optional custom review instructions (positional argument) |

### codex resume

Resume a previous interactive session.

```bash
# Open session picker
codex resume

# Resume most recent session in current directory
codex resume --last

# Resume most recent session from any directory
codex resume --last --all

# Resume a specific session by ID
codex resume <SESSION_ID>
```

### codex fork

Fork a previous session into a new thread, preserving the original transcript. Useful for exploring alternative approaches in parallel.

### codex cloud

Browse or execute Codex Cloud tasks from the terminal without opening the TUI.

### codex execpolicy

Evaluate execpolicy rule files and check whether a command would be allowed, prompted, or blocked.

### codex auth

Authenticate Codex using ChatGPT OAuth, device auth, or an API key piped over stdin.

### codex completion

Generate shell completion scripts for Bash, Zsh, Fish, or PowerShell.

## Sandbox Modes

Codex provides OS-level sandboxing to protect your system.

| Sandbox Mode | Description |
|-------------|-------------|
| `read-only` | Codex can only read files, no writes or commands |
| `workspace-write` | Codex can write files in the workspace but external commands are sandboxed |
| `danger-full-access` | Full system access with no restrictions (use only in VMs/containers) |

## Approval Policies

| Policy | Description |
|--------|-------------|
| `suggest` | Default. Every action requires explicit approval before execution |
| `auto-edit` | Auto-approves file edits but still requires approval for shell commands |
| `full-auto` | Autonomous mode; executes everything without confirmation |

**Preset shortcut:** `--full-auto` sets `sandbox_mode=workspace-write` + `approval_policy=on-request`.

**Granular control:** Set `approval_policy` to `"on-request"`, `"untrusted"`, or `"never"` in config. You can also define per-command allow/reject rules.

## Model Selection

| Model | Best For | Notes |
|-------|----------|-------|
| `gpt-5.4` | Complex coding, reasoning, professional workflows | Recommended default |
| `gpt-5.4-mini` | Faster, lower-cost tasks, subagents | Uses ~30% of gpt-5.4 quota |
| `gpt-5.3-codex-spark` | Near-instant real-time coding iteration | Research preview, Pro subscribers |

Select via `--model <model>` flag or `-c model=<model>` config override.

## Non-Interactive Usage

### Piping prompts

```bash
# Pipe from stdin
cat prompt.md | codex exec -

# Pipe a diff for review
git diff main | codex exec - "Review this diff for bugs"
```

### Structured output

```bash
# JSONL event stream
codex exec --json "Analyze the test coverage"

# Schema-enforced output
codex exec --output-schema schema.json "List all API endpoints"
```

### Capturing output

```bash
# Write final message to file
codex exec --output-file result.md "Summarize changes since v2.0"

# Tee for both display and capture
codex exec "Review this code" 2>&1 | tee review-output.md
```

## Wazir Integration Patterns

### Secondary Review (used by wz:reviewer)

```bash
CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null)
CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}

# Review uncommitted changes
codex review -c model="$CODEX_MODEL" --uncommitted \
  "Review against these acceptance criteria: <criteria>" \
  2>&1 | tee .wazir/runs/latest/reviews/codex-review.md

# Review committed changes against a base branch
codex review -c model="$CODEX_MODEL" --base main \
  "Review against these acceptance criteria: <criteria>" \
  2>&1 | tee .wazir/runs/latest/reviews/codex-review.md
```

### Non-Code Artifact Review

For reviewing specs, designs, and plans (not code diffs):

```bash
cat artifact.md | codex exec -c model="$CODEX_MODEL" - \
  "Review this spec against these criteria: <criteria>" \
  2>&1 | tee .wazir/runs/latest/reviews/codex-review.md
```

### Parallel Execution

Use Codex as an external validator alongside the primary Wazir review:

```bash
# Run Codex review in background, merge findings later
codex review --uncommitted "Check for security issues" \
  > .wazir/runs/latest/reviews/codex-security.md 2>&1 &
```

## Error Handling

| Error | Handling |
|-------|----------|
| **Non-zero exit** (auth/rate-limit/transport) | Log full stderr, mark pass as `codex-unavailable`, use self-review only for that pass. Next pass re-attempts Codex (transient failures may recover). |
| **Timeout** | Set reasonable timeouts via shell (`timeout 120 codex review ...`). If exceeded, treat as `codex-unavailable`. |
| **Model unavailable** | Fall back to `gpt-5.4-mini` if primary model is overloaded. |
| **Rate limiting** | Respect retry-after headers. Space sequential calls by at least 5 seconds. |

## Configuration

Codex CLI reads configuration from:
- `~/.codex/config.yaml` or `~/.codex/config.json` (global)
- `.codex/config.yaml` in the project root (project-level)
- Command-line flags and `-c key=value` overrides (highest precedence)

Key config fields: `model`, `approval_policy`, `sandbox_mode`, `providers`.
