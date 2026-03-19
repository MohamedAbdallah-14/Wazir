---
name: wz:tdd
description: Use for implementation work that changes behavior. Follow RED -> GREEN -> REFACTOR with evidence at each step.
---

# Test-Driven Development

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

Sequence:

1. RED
Write or update a test that expresses the new behavior or the bug being fixed, then run it and confirm failure.

**Test quality check (single-pass):** Before proceeding to GREEN, verify:
- Are these tests testing the right behavior?
- Are they real assertions, not tautologies?
- Do they fail for the right reason (not a syntax error or import failure)?
If any check fails, fix the test before moving on. This is a single-pass quality check, not a full review loop.

2. GREEN
Write the smallest implementation change that makes the failing test pass.

3. REFACTOR
Improve structure while keeping the full relevant test set green.

Rules:

- do not skip the failing-test step when automated verification is feasible
- do not rewrite tests to fit broken behavior
- rerun verification after each meaningful refactor

For the full review loop pattern, see `docs/reference/review-loop-pattern.md`. TDD uses a single-pass quality check, not the full loop.
