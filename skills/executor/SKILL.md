---
name: wz:executor
description: Run the execution phase — implement the approved plan with TDD, quality gates, and verification.
---

# Executor

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

Run Phase 2 (Execute) for the current project.

## Prerequisites

1. Check `.wazir/runs/latest/clarified/execution-plan.md` exists. If not, tell the user to run `/wazir:clarifier` first.
2. Read the execution plan and task specs from `.wazir/runs/latest/tasks/`.
3. Read `.wazir/state/config.json` for team_mode and depth settings.

## Pre-Execution Validation

Run these checks before implementing:
- `wazir validate manifest` — confirm manifest schema is valid
- `wazir validate hooks` — confirm hook contracts are intact

If either fails, surface the failure and do NOT proceed until resolved.

## Execution

Implement tasks in the order defined by the execution plan.

For each task:

1. **Read** the task spec at `.wazir/runs/latest/tasks/task-NNN/spec.md`
2. **Implement** using TDD (write test first, make it pass, refactor)
3. **Verify** — run tests, type checks, linting as appropriate
4. **Review BEFORE commit** (per-task review, NOT final review):
   - Reviewer runs task-review loop with `--mode task-review` using 5 task-execution dimensions (correctness, tests, wiring, drift, quality)
   - Reads the Codex model from config: `CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null); CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}`
   - Uses `codex review -c model="$CODEX_MODEL" --uncommitted` for the current task's changes
   - Codex error handling: if codex exits non-zero, log error, mark pass as `codex-unavailable`, use self-review only for that pass. Do NOT treat a Codex failure as a clean review. Do NOT skip the pass. The next pass still attempts Codex (transient failures may recover).
   - Executor resolves findings, reviewer re-reviews
   - Loop runs for `pass_counts[depth]` passes (quick=3, standard=5, deep=7). No extension.
   - Review logs: `.wazir/runs/latest/reviews/execute-task-<NNN>-review-pass-<N>.md`
   - Loop cap tracking: `wazir capture loop-check --task-id <NNN>` (each task has its own cap counter)
   - See `docs/reference/review-loop-pattern.md` for full protocol
   - NOTE: this is the per-task review (5 dims), not the final scored review (7 dims) which runs later in `/wazir:reviewer --mode final`
5. **Commit** — only after review passes, commit with conventional commit format: `<type>(<scope>): <description>`
6. **CHANGELOG** — if the change is user-facing (new feature, behavior change, bug fix visible to users), update `CHANGELOG.md` under `[Unreleased]` using keepachangelog types: Added, Changed, Fixed, Removed, Deprecated, Security. If not user-facing (refactor, internal tooling, tests), skip.
7. **Record** evidence at `.wazir/runs/latest/artifacts/task-NNN/`

Review loops follow the pattern in `docs/reference/review-loop-pattern.md`. Code review scoping: review uncommitted changes before commit. If changes are already committed (subagent workflow), use `codex review -c model="$CODEX_MODEL" --base <pre-task-sha>`.

Tasks always run sequentially.

**Standalone mode:** When no `.wazir/runs/latest/` exists, review logs go to `docs/plans/` alongside the artifact.

## Context Retrieval

- Use `wazir index search-symbols <query>` to locate relevant code before reading
- Use wazir index search-symbols before direct file reads
- Read full files directly when editing or verifying
- Use `wazir recall file <path> --tier L1` for files you need to understand but not modify
- When dispatching subagents, include this instruction: "Use wazir index search-symbols before direct file reads."

## Escalation

Pause and ask the user when:
- The plan is blocked or contradictory
- Implementation would require unapproved scope change
- A task's acceptance criteria can't be met

## Done

When all tasks are complete, present:

> **Execution complete.**
>
> - Tasks: [completed]/[total] implemented
> - Artifacts: `.wazir/runs/latest/artifacts/`
>
> **Next:** Run `/wazir:reviewer --mode final` to review the changes, or `/wazir` for the full pipeline.
