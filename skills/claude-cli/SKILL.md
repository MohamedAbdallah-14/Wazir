---
name: wz:claude-cli
description: How to use Claude Code CLI programmatically for reviews, automation, and non-interactive operations within Wazir pipelines.
---

# Claude Code CLI Integration

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

Reference for using the Claude Code CLI (Anthropic's official CLI for Claude) in Wazir pipelines. Claude Code is an agentic coding tool that operates in your terminal with access to tools like file operations, search, and bash execution.

## Commands

### claude (interactive)

Launch the interactive TUI for ad-hoc work.

```bash
claude
claude "Fix the failing test in src/auth.ts"
```

### Print Mode (non-interactive)

The `-p` (or `--print`) flag is the primary mode for Wazir automation. It runs Claude Code non-interactively, outputs the result to stdout, and exits.

```bash
# Basic non-interactive prompt
claude -p "Explain the architecture of this project"

# Pipe data from stdin (avoids command-line length limits)
git diff main | claude -p "Review this diff for bugs"

# Chain with other tools
claude -p "List all exported functions" --output-format json | jq '.result'

# Save output to file
claude -p "Summarize the test coverage" > summary.md
```

**Key flags (all work with `-p`):**

| Flag | Description |
|------|-------------|
| `-p, --print` | Run non-interactively; print response to stdout and exit |
| `--model <MODEL>` | Select model: `opus`, `sonnet`, `haiku`, or full name (e.g., `claude-opus-4-6`) |
| `--fallback-model <MODEL>` | Fallback model when the primary is overloaded (print mode) |
| `--output-format <FORMAT>` | Output format: `text` (default), `json`, `stream-json` |
| `--json-schema <SCHEMA>` | Enforce structured output conforming to a JSON schema (requires `--output-format json`) |
| `--allowedTools <TOOLS...>` | Pre-approve specific tools without prompting (space-separated) |
| `--disallowedTools <TOOLS...>` | Block specific tools from being used |
| `--max-turns <N>` | Limit agentic turns in a session |
| `--append-system-prompt <TEXT>` | Add custom instructions while keeping default capabilities (safe choice) |
| `--system-prompt <TEXT>` | Replace the entire system prompt (removes all defaults; use with caution) |
| `--dangerously-skip-permissions` | Bypass all permission barriers (CI/CD and dev containers only) |
| `--verbose` | Enable verbose output for debugging |
| `--input-format <FORMAT>` | Input format: `text` (default) |

### Session Management

```bash
# Continue most recent session in current directory
claude -c

# Resume a specific session by ID
claude -r <SESSION_ID>

# Resume from a PR
claude --from-pr <NUMBER>

# Fork a session into a new thread
claude --fork-session <SESSION_ID>

# Set a custom session ID
claude --session-id <ID>
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `claude mcp add` | Add an MCP server (`--transport http\|stdio`, `-s` for scope, `-e` for env vars) |
| `claude mcp serve` | Expose Claude Code itself as an MCP server |
| `claude agents` | List all configured agents |
| `claude config` | Manage configuration settings |
| `claude remote-control` | Serve your local environment for external builds |

## Model Selection

| Model | Best For | Notes |
|-------|----------|-------|
| `opus` / `claude-opus-4-6` | Complex reasoning, architecture, multi-step tasks | Most capable, highest cost |
| `sonnet` / `claude-sonnet-4-6` | Daily coding, balanced performance | Recommended default |
| `haiku` / `claude-haiku-4-5` | Quick tasks, fast responses, high volume | Lowest cost, fastest |

**Select via:**
- CLI flag: `--model opus` or `--model claude-opus-4-6`
- Interactive: `/model` slash command
- Environment variable: `CLAUDE_MODEL`
- Settings: `.claude/settings.json`

**Fallback:** Use `--fallback-model haiku` with `-p` to auto-switch when the primary model is overloaded.

## Permission Management

### allowedTools

Pre-approve tools to avoid interactive permission prompts. Critical for non-interactive automation.

```bash
# Allow specific tools
claude -p --allowedTools "Read" "Grep" "Glob" "Bash(npm run test:*)" \
  "Review the test suite"

# Allow all tools (equivalent to dangerously-skip-permissions but scoped)
claude -p --allowedTools "Read" "Write" "Edit" "Bash" "Grep" "Glob" \
  "Fix the bug in auth.ts"
```

**Tool name patterns:**
- Exact: `"Read"`, `"Write"`, `"Edit"`, `"Bash"`, `"Grep"`, `"Glob"`
- Scoped: `"Bash(npm run test:*)"` allows only matching bash commands
- MCP tools: `"mcp__servername__toolname"`

### disallowedTools

Block specific tools:

```bash
claude -p --disallowedTools "Write" "Edit" "Bash" \
  "Analyze this codebase for security issues"
```

### Project permissions

Store permanent permissions in `.claude/settings.json`:

```json
{
  "permissions": {
    "allowedTools": ["Read", "Grep", "Glob"],
    "deny": ["Bash(rm *)"]
  }
}
```

## Non-Interactive Usage

### Piping data

```bash
# Pipe a diff for review
git diff main | claude -p "Review this diff for correctness"

# Pipe file content
cat src/auth.ts | claude -p "Find potential bugs"

# Pipe combined context
{ echo "## Spec"; cat spec.md; echo "## Code"; cat src/main.ts; } | \
  claude -p "Does the code match the spec?"
```

### Structured output

```bash
# JSON output with full metadata (tool calls, token usage)
claude -p --output-format json "List all API endpoints"

# Streaming JSONL (real-time events)
claude -p --output-format stream-json "Analyze the codebase"

# Schema-enforced structured output
claude -p --output-format json --json-schema '{"type":"object","properties":{"findings":{"type":"array"},"summary":{"type":"string"}}}' \
  "Review this code and return findings"
```

### System prompt customization

```bash
# Append instructions (keeps default Claude Code capabilities)
claude -p --append-system-prompt "You are a security auditor. Focus only on vulnerabilities." \
  "Review src/auth.ts"

# Full override (removes all defaults; use when you need a clean slate)
claude -p --system-prompt "You are a JSON-only responder. Return only valid JSON." \
  --output-format json "List all functions in this file"
```

## MCP Server Integration

Claude Code supports MCP (Model Context Protocol) servers for extended capabilities.

### Adding MCP servers

```bash
# stdio transport
claude mcp add github -- npx -y @modelcontextprotocol/server-github

# HTTP transport
claude mcp add api --transport http https://api.example.com

# With scope (project vs user)
claude mcp add myserver -s project -- node server.js

# With environment variables
claude mcp add myserver -e API_KEY=xxx -- node server.js
```

### Using MCP tools in automation

```bash
# Allow specific MCP tools in print mode
claude -p --allowedTools "mcp__github__create_pull_request" "mcp__github__list_issues" \
  "Create a PR for the current changes"
```

### Claude Code as MCP server

```bash
# Expose Claude Code as an MCP server for other tools
claude mcp serve
```

**Tool Search (lazy loading):** Since early 2026, Claude Code uses Tool Search for MCP tools by default, loading tool schemas on demand rather than all at once. This reduces context usage by ~95%.

## Built-in Slash Commands

| Command | Description |
|---------|-------------|
| `/model` | Switch model |
| `/cost` | Show token usage and cost |
| `/clear` | Clear conversation context |
| `/compact` | Compress conversation to save tokens |
| `/help` | Display available commands |
| `/review` | Review current changes |
| `/debug` | Debug a failing test or error |
| `/effort` | Set reasoning effort level |

## Wazir Integration Patterns

### Secondary Review (used by wz:reviewer)

```bash
CLAUDE_MODEL=$(jq -r '.multi_tool.claude.model // empty' .wazir/state/config.json 2>/dev/null)
CLAUDE_MODEL=${CLAUDE_MODEL:-sonnet}

# Review uncommitted changes
git diff | claude -p --model "$CLAUDE_MODEL" \
  --allowedTools "Read" "Grep" "Glob" \
  "Review this diff against these acceptance criteria: <criteria>" \
  2>&1 | tee .wazir/runs/latest/reviews/claude-review.md

# Review a spec or design artifact
cat artifact.md | claude -p --model "$CLAUDE_MODEL" \
  "Review this spec against these criteria: <criteria>" \
  2>&1 | tee .wazir/runs/latest/reviews/claude-review.md
```

### Structured Review Output

```bash
claude -p --model "$CLAUDE_MODEL" --output-format json \
  --json-schema '{"type":"object","properties":{"findings":{"type":"array","items":{"type":"object","properties":{"severity":{"type":"string"},"description":{"type":"string"},"location":{"type":"string"}}}},"summary":{"type":"string"}}}' \
  "Review the changes in src/auth/" \
  > .wazir/runs/latest/reviews/claude-review.json
```

### Parallel Execution as External Validator

```bash
# Run Claude review in background
git diff main | claude -p --model haiku \
  --allowedTools "Read" "Grep" \
  "Quick security scan of this diff" \
  > .wazir/runs/latest/reviews/claude-security.md 2>&1 &
```

### Multi-Turn Programmatic Sessions

For complex automation requiring multiple turns:

```bash
# Limit turns to prevent runaway sessions
claude -p --max-turns 5 --allowedTools "Read" "Grep" "Bash(npm test)" \
  "Run the tests, analyze any failures, and suggest fixes"
```

## Error Handling

| Error | Handling |
|-------|----------|
| **Non-zero exit** (auth/rate-limit/transport) | Log full stderr, mark pass as `claude-unavailable`, use self-review only. Next pass re-attempts. |
| **Timeout** | Wrap with `timeout 120 claude -p ...`. Treat timeout as `claude-unavailable`. |
| **Model overloaded** | `--fallback-model haiku` auto-switches. Without it, retry after backoff. |
| **Permission denied** | Add required tools to `--allowedTools` or use `--dangerously-skip-permissions` in CI. |
| **Max turns reached** | Increase `--max-turns` or break the task into smaller prompts. |

## Configuration

Claude Code reads configuration from (highest to lowest precedence):
1. CLI flags (`--model`, `--allowedTools`, etc.)
2. Environment variables (`CLAUDE_MODEL`, `ANTHROPIC_API_KEY`)
3. `.claude/settings.json` (project-level)
4. `~/.claude/settings.json` (user-level)
5. `.claude/rules/` directory (modular rule files)
6. `CLAUDE.md` (project instructions)
7. Auto Memory (persisted learnings)

Key config fields in `settings.json`: `model`, `maxTokens`, `permissions.allowedTools`, `permissions.deny`, `env`.
