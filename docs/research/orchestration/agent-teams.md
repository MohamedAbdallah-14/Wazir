# Agent Tool & Teams Research

**Date:** 2026-03-24

## Subagent Context Isolation

- Each subagent gets fresh, isolated context window
- Only channel from parent → subagent is the prompt string
- Only the final message returns to parent (intermediate tool calls stay inside)
- Subagent transcripts persist at `~/.claude/projects/{project}/{sessionId}/subagents/`

## Built-in Subagent Types

| Type | Model | Tools | Purpose |
|------|-------|-------|---------|
| Explore | Haiku | Read-only | File discovery, code search |
| Plan | Inherits | Read-only | Research during plan mode |
| General-purpose | Inherits | All tools | Complex tasks, code modifications |

## Tool Restrictions Per Agent

Custom agents in `.claude/agents/*.md` support:
- `tools:` field (allowlist) — agent can ONLY use listed tools
- `disallowedTools:` field (denylist) — inherits all except listed
- `Agent(worker, researcher)` — restrict which subagents can be spawned

**This is confirmed to enforce tool restrictions at platform level.**

## Lead Context Accumulation

Lead only receives final output from each subagent. But it still accumulates context from:
- Reading subagent results
- User messages
- Its own reasoning

Mitigations: auto-compaction at ~95%, delegating verbose work to subagents.

## Communication

- Individual subagents: report back to parent only. No inter-agent messaging.
- Team teammates: can message each other via SendMessage.

## Depth Limit

**Subagents cannot spawn subagents. Depth limit is exactly 1.**

## Token Overhead

Multi-agent workflows use ~4-7x more tokens than single-agent. Each subagent loads system prompt, CLAUDE.md, needs time to gather context.

## Teams (Experimental)

- Disabled by default. Enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Spawn backends: in-process, tmux, iTerm2
- 3-5 teammates with 5-6 tasks each is the sweet spot
- Same-file edits create merge conflicts — avoid
- Anthropic used 16 agents for a C compiler: ~2,000 sessions, $20,000, 100K lines

## Agent Definition Fields

name, description, tools, disallowedTools, model, permissionMode, maxTurns, skills, mcpServers, hooks, memory

## Sources

- code.claude.com/docs/en/sub-agents, agent-teams
- AddyOsmani.com - Claude Code Swarms
- Anthropic: Building a C Compiler with Agent Teams
