---
name: wz:verification
description: Use before claiming work is complete. Every completion claim needs fresh command evidence or another deterministic proof path.
---

# Verification

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

Every completion claim must include:

- what was verified
- the exact command or deterministic check
- the actual result

Minimum rule:

- no success claim without fresh evidence from the current change

When verification fails:

- do not mark the work complete
- fix the issue or report the gap honestly
- rerun verification after the fix
