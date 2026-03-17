# Skills

Wazir uses skills as reusable in-host procedures.

The active thesis is:

- use Wazir inside your AI host
- keep the operating model in canonical repo skills

## Active Skills

These skills remain on the active surface:

| Skill | Purpose |
| --- | --- |
| `wz:using-skills` | Ensures skill discovery happens before work starts |
| `wz:brainstorming` | Turns briefings into approved designs before implementation |
| `scan-project` | Builds a project profile from the repo and `input/`, with index build/refresh and `index stats` in the profile output |
| `wz:writing-plans` | Produces execution-grade implementation plans |
| `wz:debugging` | Runs a disciplined observe-hypothesize-test-fix loop with symbol-first exploration (index search-symbols, recall L1) in the OBSERVE phase |
| `wz:humanize` | Detects and removes AI writing patterns from text artifacts via a 4-phase pipeline (Scan, Identify, Rewrite, Verify) |
| `wz:tdd` | Enforces RED -> GREEN -> REFACTOR for implementation work |
| `wz:verification` | Requires fresh proof before completion claims |
| `wz:design` | Guides the designer role through open-pencil MCP workflow to produce design artifacts |
| `prepare-next` | Produces a clean next-run handoff without auto-loading stale context |
| `run-audit` | Runs a structured codebase audit producing source-backed findings with remediation |
| `self-audit` | Runs a worktree-isolated audit-fix loop — validates, audits, fixes, verifies, and merges back only on green |

## Rules

- Skills must reference `input/`, canonical roles/workflows, or external state-root conventions.
- Skills must not instruct users to run background services or wrapper scripts that are not part of the canonical workflow surface.
- When a skill becomes contradictory to the current operating model, remove it from `skills/`.
