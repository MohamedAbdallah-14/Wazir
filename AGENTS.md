# Wazir Agents

> Auto-maintained. See `expertise/composition-map.yaml` for canonical policy.

## Roles

| Role | Model Tier | Capabilities | Max Turns | Notes |
|---|---|---|---|---|
| controller | orchestration | read, shell, search, skills, agents | 50 | Dispatch-only, no write/edit |
| clarifier | review | read, write, shell, search, skills | 30 | |
| researcher | exploration | read, write, shell, search, skills, web | 25 | |
| specifier | review | read, write, shell, search, skills | 25 | |
| content-author | implementation | read, write, shell, search, skills, web | 30 | |
| designer | review | read, write, shell, search, skills | 30 | MCP: pencil |
| planner | review | read, write, shell, search, skills | 30 | |
| executor | implementation | read, write, edit, shell, search, skills | 80 | Isolation: worktree |
| verifier | review | read, write, shell, search, skills | 30 | |
| reviewer | review | read, write, shell, search, skills | 40 | |
| learner | implementation | read, write, shell, search, skills | 20 | |
| reviewer-verifier | review | read, write, shell, search, skills | 40 | |

## How Agents Are Dispatched

The orchestrator (controller) dispatches phase agents in sequence. Each agent gets:
- A fresh context window
- Only its role contract and relevant expertise modules
- Tool restrictions enforced by YAML frontmatter in `.claude/agents/`

## Files

- Role contracts: `roles/*.md`
- Agent definitions (Claude): `exports/hosts/claude/.claude/agents/*.md`
- Agent policy: `expertise/composition-map.yaml` → `agent_policy` section
