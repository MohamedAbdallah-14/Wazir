---
name: wz:executor
description: Run the execution phase — implement the approved plan with TDD, quality gates, and verification.
---

# Executor

## Model Annotation
When multi-model mode is enabled, the executor phase uses:
- **Sonnet** for per-task implementation (write-implementation)
- **Sonnet** for per-task review (task-review)
- **Sonnet** for test execution (run-tests)
- **Opus** for orchestration decisions

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

Run the Executor phase — implement the approved plan, then verify all claims.

## Phase Prerequisites (Hard Gate)

Before proceeding, verify these artifacts exist. Check each file. If ANY file is missing, **STOP immediately** and report:

> **Cannot start Executor phase: missing prerequisite artifacts.**
>
> Missing:
> - [list missing files]
>
> Run `/wazir:clarifier` to produce the missing artifacts.

Required artifacts:
- [ ] `.wazir/runs/latest/clarified/clarification.md`
- [ ] `.wazir/runs/latest/clarified/spec-hardened.md`
- [ ] `.wazir/runs/latest/clarified/design.md`
- [ ] `.wazir/runs/latest/clarified/execution-plan.md`

**This is a hard gate. Do NOT proceed without all artifacts. Do NOT rationalize that the input is "clear enough" to skip phases. The existence of detailed input does NOT replace the pipeline's clarification, specification, design, and planning phases.**

**Standalone mode exception:** If `.wazir/runs/latest/` does not exist at all, operate in standalone mode (skip this check).

## Prerequisites

1. Read the execution plan from `.wazir/runs/latest/clarified/execution-plan.md`.
2. Read `.wazir/state/config.json` for depth settings.

## Pre-Execution Validation

Run these checks before implementing:
- `wazir validate manifest` — confirm manifest schema is valid
- `wazir validate hooks` — confirm hook contracts are intact

If either fails, surface the failure and do NOT proceed until resolved.

## Execute (execute workflow)

Implement tasks in the order defined by the execution plan.

For each task:

1. **Read** the task from the execution plan
2. **Implement** using TDD (write test first, make it pass, refactor)
3. **Verify locally** — run tests, type checks, linting as appropriate
4. **Review BEFORE commit** (per-task review, NOT final review):
   - Reviewer runs task-review loop with `--mode task-review` using 5 task-execution dimensions (correctness, tests, wiring, drift, quality)
   - Reads Codex model from config: `CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null); CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}`
   - Uses `codex review -c model="$CODEX_MODEL" --uncommitted` for the current task's changes
   - Codex error handling: if codex exits non-zero, log error, mark pass as `codex-unavailable`, use self-review only for that pass. Do NOT skip. Next pass still attempts Codex.
   - Executor resolves findings, reviewer re-reviews
   - Loop runs for `pass_counts[depth]` passes (quick=3, standard=5, deep=7). No extension.
   - Review logs: `.wazir/runs/latest/reviews/execute-task-<NNN>-review-pass-<N>.md`
   - Loop cap tracking: `wazir capture loop-check --task-id <NNN>`
   - See `docs/reference/review-loop-pattern.md` for full protocol
   - NOTE: this is the per-task review (5 dims), not the final scored review (7 dims) which runs in Phase 4
5. **Commit** — only after review passes, commit with conventional commit format: `<type>(<scope>): <description>`
6. **CHANGELOG** — if user-facing change, update `CHANGELOG.md` under `[Unreleased]` using keepachangelog types: Added, Changed, Fixed, Removed, Deprecated, Security.
7. **Record** evidence at `.wazir/runs/latest/artifacts/task-NNN/`

Review loops follow `docs/reference/review-loop-pattern.md`. Code review scoping: review uncommitted changes before commit. If changes are committed, use `--base <pre-task-sha>`.

Tasks always run sequentially.

**Standalone mode:** When no `.wazir/runs/latest/` exists, review logs go to `docs/plans/`.

## Verify (verify workflow)

After all tasks are complete, run deterministic verification:

1. Run the full test suite
2. Run type checks (if applicable)
3. Run linters
4. Verify all acceptance criteria from the spec have evidence
5. Produce verification proof at `.wazir/runs/latest/artifacts/verification-proof.md`

This is NOT a review loop — it produces proof, not findings. If verification fails, report which criteria lack evidence and offer to fix.

## Context Retrieval

- Use `wazir index search-symbols <query>` to locate relevant code before reading
- Read full files directly when editing or verifying
- Use `wazir recall file <path> --tier L1` for files you need to understand but not modify
- When dispatching subagents, include: "Use wazir index search-symbols before direct file reads."

## Escalation

Pause and ask the user when:
- The plan is blocked or contradictory
- Implementation would require unapproved scope change
- A task's acceptance criteria can't be met

## Done

When all tasks are complete and verified:

> **Executor phase complete.**
>
> - Tasks: [completed]/[total] implemented
> - Verification: proof at `.wazir/runs/latest/artifacts/verification-proof.md`
>
> **Next:** Run `/reviewer --mode final` to review against the original input.
