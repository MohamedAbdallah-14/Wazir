# Claude -p (Non-Interactive/Pipe) Mode Research

**Date:** 2026-03-24

## How It Works

Accepts prompt, executes with full agentic capabilities, prints result to stdout, exits. No TUI.

## Key Facts

- Each `-p` call gets completely fresh context (no implicit state carryover)
- Exit codes: 0=success, 1=error, 2=auth error
- Sessions persisted to disk by default (can use `--resume` to continue)
- `--bare` flag (v2.1.81): skips hooks, LSP, plugins, auto-memory, CLAUDE.md — fastest startup

## Flag Compatibility

| Flag | Works with -p? | Notes |
|------|---------------|-------|
| `--output-format json/text/stream-json` | Yes | json includes usage/cost data |
| `--json-schema` | Yes | Constrained decoding (guaranteed compliance) |
| `--model opus/sonnet/haiku` | Yes | Per-call model selection |
| `--fallback-model` | Yes | Only works with -p |
| `--max-turns` | Yes | Limits agentic turns |
| `--max-budget-usd` | Yes | Only works with -p |
| `--allowedTools/--disallowedTools` | Yes | Critical for unattended use |
| `--system-prompt-file` | Yes | Only works with -p |
| `--append-system-prompt` | Yes | Safer than --system-prompt |
| `--worktree` | Yes | Isolated git worktree |
| `--continue/--resume` | Yes | Session continuity |
| `--no-session-persistence` | Yes | Only works with -p |
| Hooks | Yes (unless --bare) | |
| CLAUDE.md | Yes (unless --bare) | |

## Session Chaining

```bash
# Capture session ID
SID=$(claude -p --output-format json "Step 1" | jq -r '.session_id')
# Resume same session
claude -p --resume "$SID" "Step 2"
```

## Structured Output

`--json-schema` forces output to conform via constrained decoding (mathematically guaranteed, not prompting).

## MCP Servers

- stdio-based: work in -p mode
- HTTP-based: do NOT load in -p mode (bug #34131)

## Cost Tracking

JSON output includes usage field:
```json
{ "usage": { "input_tokens": 1245, "output_tokens": 28756 }, "costUSD": 0.45 }
```

## Sources

- code.claude.com/docs/en/cli-reference, headless
- Issues #34131, #16963, #24594, #8413
