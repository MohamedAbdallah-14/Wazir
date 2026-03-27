---
name: wz:gemini-cli
description: How to use Gemini CLI programmatically for headless reviews, automation, and sandbox operations within Wazir pipelines.
---
You have a checklist at .wazir/runs/latest/phases/. Go read it before you write a single line of code or make any changes. If a wz: skill applies, you need to invoke it. Have you read your checklist yet?

# Gemini CLI Integration

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

Reference for using the Google Gemini CLI in Wazir pipelines. Gemini CLI is an open-source AI agent that uses a ReAct (reason and act) loop with built-in tools and MCP servers to complete tasks directly in your terminal.

## Commands

### gemini (interactive)

Launch the interactive TUI for ad-hoc work.

```bash
gemini
```

### Headless Mode (non-interactive)

Headless mode is the primary mode for Wazir automation. It is triggered when providing a prompt with the `-p` (or `--prompt`) flag, or when the CLI runs in a non-TTY environment.

```bash
# Basic headless prompt
gemini -p "Explain the architecture of this project"

# Pipe data from stdin
git diff main | gemini -p "Review this diff for bugs and security issues"

# Chain with other tools
gemini -p "List all exported functions" | jq '.response'

# Save output to file
gemini -p "Summarize the test coverage" > summary.md
```

**Key flags:**

| Flag | Description |
|------|-------------|
| `-p, --prompt <PROMPT>` | Run in headless mode; print response to stdout and exit |
| `-m, --model <MODEL>` | Specify the model to use (alias or full name) |
| `--output-format json` | Output a single structured JSON object with the complete result |
| `--output-format stream-json` | Stream real-time JSONL events as they occur |
| `-s, --sandbox` | Enable sandboxed execution for shell commands and file modifications |
| `-y, --yolo` | Auto-approve all operations (enables sandbox by default) |
| `--approval-mode <MODE>` | Set approval mode: `default`, `auto_edit`, `plan`, `yolo` |
| `--checkpoint` | Enable checkpoint mode for long-running tasks |

**Headless mode limitations:**
- No follow-up questions or continued conversation
- Cannot authorize tools (including WriteFile) or run shell commands unless `--yolo` is used
- For tool-using automation, combine `-p` with `--yolo` or `--approval-mode auto_edit`

## Slash Commands

| Command | Description |
|---------|-------------|
| `/model` | Switch model (Pro, Flash, Auto, or Manual selection) |
| `/yolo` | Toggle YOLO mode (auto-approve all tool calls) |
| `/stats` | Show token usage and session statistics |
| `/export` | Export conversation to Markdown or JSON |
| `/help` | Display available commands |
| `/settings` | Open settings editor |

## Approval Modes

| Mode | Description |
|------|-------------|
| `default` | Prompts for approval on every tool use |
| `auto_edit` | Auto-approves file reads/writes, still prompts for shell commands |
| `plan` | Read-only mode; no writes or commands executed |
| `yolo` | Auto-approves everything; enables sandbox by default |

**Enable YOLO mode:**
- CLI flag: `--yolo` or `-y`
- Interactive toggle: `Ctrl+Y`
- Slash command: `/yolo`
- Environment variable: `GEMINI_YOLO=1`

**Granular command auto-approval:** Configure specific commands to run without prompts:
```json
{
  "tools": {
    "shell": {
      "autoApprove": ["git ", "npm test", "ls "]
    }
  }
}
```

## Sandbox Mode

Sandboxing isolates shell commands and file modifications from your host system. Disabled by default except when using YOLO mode.

**Enable sandbox:**
- CLI flag: `--sandbox` or `-s`
- Environment variable: `GEMINI_SANDBOX=1`
- Automatic with `--yolo` or `--approval-mode=yolo`

Sandbox uses a pre-built `gemini-cli-sandbox` Docker image for isolation.

**Safety configuration:** Set `requireApprovals: true` in settings to disallow YOLO mode and "Always allow" options entirely.

## Model Selection

| Model | Best For | Notes |
|-------|----------|-------|
| `gemini-3-pro` | Complex reasoning, coding, multi-step tasks | Latest Pro model |
| `gemini-3-flash` | Fast responses, lighter tasks | Lower latency |
| `gemini-3.1-pro-preview` | Cutting-edge features | Rolling preview access |
| `gemini-2.5-pro` | Legacy stable | Still available |
| `gemini-2.5-flash` | Legacy fast | Still available |
| `auto` | Recommended; CLI picks best model per task | Default with Google login |

**Select via:**
- CLI flag: `-m <model>` or `--model <model>`
- Environment variable: `export GEMINI_MODEL="gemini-3-pro"`
- Interactive: `/model` slash command
- Config: `settings.json` model field
Mid-task check: look at your phase checklist again. Is every completed item actually done with real output, or did you just move past it mentally? Which items have you genuinely finished?

**Note:** With a Google login (not API key), the CLI may auto-blend Pro and Flash models based on task complexity and system capacity.

## Non-Interactive Usage

### Piping data

```bash
# Pipe a diff for review
git diff main | gemini -p "Review this diff for correctness and security"

# Pipe file content
cat src/auth.ts | gemini -p "Find potential bugs in this code"

# Multi-file context
cat src/types.ts src/auth.ts | gemini -p "Are these types used correctly in auth?"
```

### Structured output

```bash
# JSON output (single object)
gemini -p "List all API endpoints" --output-format json | jq '.response'

# Streaming JSONL (real-time events)
gemini -p "Analyze codebase" --output-format stream-json
```

### Output in scripts

```bash
# Capture to variable
RESULT=$(gemini -p "What does this function do?" --output-format json | jq -r '.response')

# Save to file
gemini -p "Generate a test plan" > test-plan.md
```

## MCP Server Integration

Gemini CLI supports MCP servers for extended tool capabilities.

**Configuration in `settings.json`:**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@my-org/mcp-server"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

**Extensions:** Gemini CLI extensions package prompts, MCP servers, and custom commands into installable bundles via `gemini-extension.json`. Extensions use a secure tool-merge approach where exclusions are combined and inclusions are intersected (most restrictive policy wins).

**Tool control:**
- `includeTools` / `excludeTools` in extension or settings config
- MCP tools appear alongside built-in tools once configured

## Built-in Tools

Gemini CLI includes these tools out of the box:
- **Google Search grounding** (web search)
- **File operations** (read, write, list)
- **Shell commands** (subject to approval mode)
- **Web fetching** (retrieve URL content)

## Wazir Integration Patterns

### Secondary Review (used by wz:reviewer)

```bash
GEMINI_MODEL=$(jq -r '.multi_tool.gemini.model // empty' .wazir/state/config.json 2>/dev/null)
GEMINI_MODEL=${GEMINI_MODEL:-gemini-3-pro}

# Review uncommitted changes
git diff | gemini -m "$GEMINI_MODEL" -p \
  "Review this diff against these acceptance criteria: <criteria>" \
  2>&1 | tee .wazir/runs/latest/reviews/gemini-review.md

# Review a spec or design artifact
cat artifact.md | gemini -m "$GEMINI_MODEL" -p \
  "Review this spec against these criteria: <criteria>" \
  2>&1 | tee .wazir/runs/latest/reviews/gemini-review.md
```

### Automation with Tool Access

When the review needs tool access (e.g., reading additional files for context):

```bash
gemini -m "$GEMINI_MODEL" --yolo -p \
  "Review the changes in src/auth/ for security issues. Read related test files for context." \
  2>&1 | tee .wazir/runs/latest/reviews/gemini-review.md
```

### Structured Review Output

```bash
gemini -m "$GEMINI_MODEL" -p \
  "Review this code and return JSON with fields: findings (array), severity, summary" \
  --output-format json | jq '.response' \
  > .wazir/runs/latest/reviews/gemini-review.json
```

## Error Handling

| Error | Handling |
|-------|----------|
| **Non-zero exit** (auth/quota/transport) | Log full stderr, mark pass as `gemini-unavailable`, use self-review only. Next pass re-attempts. |
| **Timeout** | Wrap with `timeout 120 gemini -p ...`. Treat timeout as `gemini-unavailable`. |
| **Model unavailable** | Fall back to `gemini-3-flash` if Pro model is overloaded. |
| **Rate limiting** | Respect backoff. Free-tier users share capacity; API key users have dedicated quota. |
| **Headless tool denial** | If a headless prompt needs tool access, re-run with `--yolo` or `--approval-mode auto_edit`. |

## Configuration

Gemini CLI reads configuration from:
- `~/.gemini/settings.json` (global)
- `.gemini/settings.json` in the project root (project-level)
- Environment variables (`GEMINI_MODEL`, `GEMINI_SANDBOX`, `GEMINI_YOLO`, `GOOGLE_API_KEY`)
- CLI flags (highest precedence)

Key config fields: `model`, `approvalMode`, `sandbox`, `mcpServers`, `tools`, `requireApprovals`.

You're about to say you're done. Are you really? Go back to .wazir/runs/latest/phases/ and check every item one more time. If something was skipped or half-done, now is the time to finish it. What was left incomplete?