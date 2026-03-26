# --allowedTools / --tools / --disallowedTools Flag Research

**Date:** 2026-03-24
**Source:** 10-agent deep research session

## Critical Discovery: Three Distinct Flags

| Flag | Purpose | Semantics |
|------|---------|-----------|
| `--allowedTools` | **Permission bypass** — listed tools execute without prompting | Does NOT restrict tools. Only auto-approves. |
| `--disallowedTools` | **Deny list** — listed tools removed from model context entirely | Actually restricts tools. Model cannot use them. |
| `--tools` | **Availability restriction** — restricts which built-in tools Claude can use | `""` disables all, `"default"` for all, or tool names like `"Bash,Edit,Read"` |

**`--allowedTools` does NOT restrict tools. It only auto-approves them.**

## Pattern Syntax (for --allowedTools)

| Pattern | Meaning |
|---------|---------|
| `Bash` | Auto-approve all Bash commands |
| `Bash(git:*)` | Auto-approve Bash starting with `git` (colon required) |
| `Edit(*.py)` | Auto-approve edits to `.py` files |
| `mcp__server__tool` | Auto-approve specific MCP tool |

## Full Built-in Tool Names

Task/Agent, Bash, Glob, Grep, LS, Read, Edit, MultiEdit, Write, NotebookRead, NotebookEdit, WebFetch, WebSearch, TodoRead, TodoWrite, exit_plan_mode, SlashCommand/Skill

## Critical Bugs

| Issue | Impact |
|-------|--------|
| #18312 | **When tool is in `--allowedTools`, PreToolUse hooks returning "deny" are IGNORED** |
| #12232 | `--allowedTools` completely ignored with `bypassPermissions` mode |
| #13077 | MCP wildcard patterns (`mcp__server__*`) silently fail |
| #1424 | Init message lists ALL tools regardless of restrictions |
| #25978 | Variadic `--allowedTools` consumes positional prompt argument |
| #14956 | Skill `allowed-tools` frontmatter does not grant Bash permissions |

## MCP Tool Support

- Name format: `mcp__<server-name>__<tool-name>`
- Wildcards unreliable for MCP tools — list each explicitly
- Settings.json `permissions.allow` may support wildcards, CLI does not

## Compatibility

| Combination | Works? |
|---|---|
| `--allowedTools` + `-p` | Yes |
| `--allowedTools` + `--worktree` | Yes |
| `--allowedTools` + `--tmux` | Yes (tmux requires worktree) |
| `--disallowedTools` + hooks | Yes (no bypass) |
| `--allowedTools` + hooks | **Broken** — hooks bypassed |

## Practical Recommendations for Wazir

1. Use `--disallowedTools` or `--tools` for restriction, never `--allowedTools` alone
2. Use `--allowedTools` only for auto-approval in `-p` mode
3. Do NOT put tools in allow list if PreToolUse hooks need to deny them
4. For MCP tools, list each explicitly by full name
5. `bypassPermissions` mode disables all restrictions — never use for enforcement

## Sources

- Claude Code CLI Reference: code.claude.com/docs/en/cli-reference
- Issue #893, #563, #12232, #13077, #14956, #17577, #18312, #18973, #20242, #25978, #1424
- SDK Issue #115, Action Issue #690
