---
name: prepare-next
description: Use after a run or execution slice completes to produce a clean next-run handoff without auto-applying stale context.
---

# Prepare Next

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

Create a next-run handoff that captures:

- current status
- completed work
- unresolved blockers
- required approvals
- explicitly accepted learnings only

Rules:

- do not mutate `input/`
- do not auto-load proposed or unreviewed learnings into the next run
- write the handoff using the `templates/artifacts/next-run-handoff.md` structure
