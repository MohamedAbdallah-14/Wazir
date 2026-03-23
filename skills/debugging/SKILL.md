---
name: wz:debugging
description: Use when behavior is wrong or verification fails. Follow an observe-hypothesize-test-fix loop instead of guesswork.
---
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->

# Debugging

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

> **Note:** This skill uses Wazir CLI commands for symbol-first code
> exploration. If the CLI index is unavailable, fall back to direct file reads —
> the generic OBSERVE methodology (read files, inspect state, gather evidence)
> still applies.

Follow this order:

1. **Observe**

   Use symbol-first exploration to locate the fault efficiently:

   1. `wazir index search-symbols <suspected-area>`
      — find relevant symbols by name.
   2. `wazir recall symbol <name-or-id> --tier L1`
      — understand structure (signature, JSDoc, imports).
   3. Form a hypothesis based on L1 summaries.
   4. `wazir recall file <path> --start-line N --end-line M`
      — read ONLY the suspect code slice.
   5. Escalate to a full file read only if the bug cannot be localized from slices.
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->
   6. If recall fails (no index/summaries), fall back to direct file reads — the
      generic OBSERVE methodology (read files, inspect state, gather evidence)
      still applies.

   Also record the exact failure, reproduction path, command output, and current
   assumptions.

2. **Hypothesize**

   List 2-3 plausible root causes and rank them.

3. **Test**

   Run the smallest discriminating check that can confirm or reject the top hypothesis.

4. **Fix**

   Apply the minimum corrective change, then rerun the failing check and the relevant broader verification set.

## Loop Cap Awareness

Debugging loops respect the loop cap when running inside a pipeline:
- **Pipeline mode** (`.wazir/runs/latest/` exists): use `wazir capture loop-check` to track iteration count. If the cap is reached (exit 43), escalate to the user with all evidence collected so far.
- **Standalone mode** (no `.wazir/runs/latest/`): the loop runs for `pass_counts[depth]` passes (quick=3, standard=5, deep=7) with no cap guard. Track iteration count manually.

In standalone mode, any debug logs go to `docs/plans/` alongside the artifact.

See `docs/reference/review-loop-pattern.md` for cap guard integration.

## Rules

- change one thing at a time
- keep evidence for each failed hypothesis
- if three cycles fail, record the blocker in the active execution artifact or handoff instead of inventing certainty

<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->