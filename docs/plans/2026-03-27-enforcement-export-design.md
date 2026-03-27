# Enforcement Export Gaps — Design

**Date:** 2026-03-27
**Branch:** feat/clarify-vision-edits
**Reviewed by:** Codex GPT-5.4 (8/10)

## Problem

`wazir export build` generates `.claude/agents/*.md` and `CLAUDE.md` for the plugin package. Two gaps:

1. Agent definitions are raw role contracts without YAML frontmatter — no tool restrictions, model routing, or turn limits
2. CLAUDE.md is a metadata dump — no pipeline identity or enforcement rules

## Decision 1: agent_policy in composition-map.yaml

Add `agent_policy` section using host-agnostic vocabulary. The Claude exporter translates to Claude-specific YAML frontmatter.

Canonical capabilities (host-agnostic):
- `read`, `write`, `edit`, `shell`, `search`, `skills`, `agents`, `web`

Claude exporter translates:
- `read` → `Read`
- `write` → `Write`
- `edit` → `Edit`
- `shell` → `Bash`
- `search` → `Glob, Grep`
- `skills` → `Skill`
- `agents` → `Agent`
- `web` → `WebSearch, WebFetch`

Model tier mapping (Claude):
- `implementation` → `sonnet`
- `review` → `opus`
- `orchestration` → `sonnet`
- `exploration` → `sonnet`

### Tool matrix

| Role | Capabilities | Extra | max_turns |
|---|---|---|---|
| executor | read, write, edit, shell, search, skills | isolation: worktree | 80 |
| reviewer | read, write, shell, search, skills | | 40 |
| verifier | read, write, shell, search, skills | | 30 |
| clarifier | read, write, shell, search, skills | | 30 |
| researcher | read, write, shell, search, skills, web | | 25 |
| specifier | read, write, shell, search, skills | | 25 |
| designer | read, write, shell, search, skills | mcp_servers: [pencil] | 30 |
| planner | read, write, shell, search, skills | | 30 |
| content-author | read, write, shell, search, skills, web | | 30 |
| learner | read, write, shell, search, skills | | 20 |
| controller | read, shell, search, skills, agents | dispatch-only, no write | 50 |
| reviewer-verifier | read, write, shell, search, skills | merged R/V subagent | 40 |

Only executor gets `edit`. Controller gets `agents` but no `write`/`edit`.

## Decision 2: CLAUDE.md template

Create `templates/exports/claude-md.md` using the existing template-renderer.js (no new dependency).

Content covers: pipeline identity, dispatch rule, phase sequence, agent list, hard invariants, execution rules, review rules, escalation rules, state conventions. Under 200 lines.

## Decision 3: Source hashing update

`collectCanonicalSources()` must hash `composition-map.yaml` and `templates/exports/claude-md.md` so export drift detection catches changes to either.

## Decision 4: Extra generated agents

Two agents not backed by role files:
- `controller.md` — dispatch-only, no write/edit
- `reviewer-verifier.md` — merged from reviewer + verifier contracts

## Files changed

| File | Change |
|---|---|
| `expertise/composition-map.yaml` | Add `agent_policy` section |
| `tooling/src/export/compiler.js` | Read agent_policy, translate to frontmatter, render CLAUDE.md from template, generate controller + R/V agents, update source hashing |
| `templates/exports/claude-md.md` | New — CLAUDE.md template |
| `exports/hosts/claude/` | Regenerated |

## What stays unchanged

- Skills (30, working)
- Hooks (7, mechanical enforcement, working)
- Commands (15, working)
- Role contract content (unchanged, wrapped with frontmatter)
- Other host exports (codex, gemini, cursor — later)
