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

> **Output to the user** before execution begins:
> Each task is implemented with TDD (test first, then code) and reviewed before commit. This catches correctness bugs, missing tests, wiring errors, and spec drift at the task level — before they compound across tasks and become expensive to fix.

## Security Awareness

Before implementing each task, check if the task touches security-sensitive areas. Run `detectSecurityPatterns` (from `tooling/src/checks/security-sensitivity.js`) mentally against the planned changes. If security patterns are detected (auth, token, password, session, SQL, fetch, upload, secret, env, API key, cookie, CORS, CSRF, JWT, OAuth, encrypt, decrypt, hash, salt):

- Load security expertise from the composition map for the relevant concern
- Apply defense-in-depth: validate inputs, parameterize queries, escape outputs, use secure defaults
- The per-task reviewer will automatically add security dimensions when patterns are detected — expect and address security findings

## Execute (execute workflow)

Implement tasks in the order defined by the execution plan.

For each task:

**Before starting each task, output to the user:**

> **Implementing Task [NNN]: [task title]** — This enables [what downstream tasks or user-facing features depend on this task].
>
> **Looking for:** [Key technical concerns for this specific task — e.g., "correct API contract", "database migration safety", "backwards compatibility"]

1. **Read** the task from the execution plan
2. **Implement** using TDD (write test first, make it pass, refactor)
3. **Verify locally** — run tests, type checks, linting as appropriate
4. **Review BEFORE commit** (per-task review, NOT final review):
   - Reviewer runs task-review loop with `--mode task-review` using 5 task-execution dimensions (correctness, tests, wiring, drift, quality)
   - Reads Codex model from config: `CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null); CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}`
   - Uses `codex review -c model="$CODEX_MODEL" --uncommitted` for the current task's changes
   - Codex error handling: if codex exits non-zero, log error, mark pass as `codex-unavailable`, use self-review only for that pass. Do NOT skip. Next pass still attempts Codex.
   - Executor resolves findings, reviewer re-reviews
   - Loop runs for `DEPTH_TABLE[depth].review_passes` passes (see `tooling/src/config/depth-table.js`). No extension.
   - Review logs: `.wazir/runs/latest/reviews/execute-task-<NNN>-review-pass-<N>.md`
   - Loop cap tracking: `wazir capture loop-check --task-id <NNN>`
   - See `docs/reference/review-loop-pattern.md` for full protocol
   - NOTE: this is the per-task review (5 dims), not the final scored review (7 dims) which runs in Phase 4
5. **Commit** — only after review passes, commit with conventional commit format: `<type>(<scope>): <description>`
   - **HARD RULE: One task = one commit.** Commit after EACH task completes its review. Never batch multiple tasks into a single commit. If the reviewer detects multi-task batching, the commit is REJECTED.
6. **CHANGELOG** — if user-facing change, update `CHANGELOG.md` under `[Unreleased]` using keepachangelog types: Added, Changed, Fixed, Removed, Deprecated, Security.
7. **Record** evidence at `.wazir/runs/latest/artifacts/task-NNN/`

**After completing each task, output to the user:**

> **Completed Task [NNN]: [task title].**
>
> **Changed:** [List of files created/modified, tests added, key implementation decisions]
>
> **Without this task:** [Concrete risk — e.g., "no auth middleware means all routes are publicly accessible", "no migration means schema change would require manual DB intervention"]
>
> **Review result:** [N] findings in [N] review passes, [N] fixed before commit

Review loops follow `docs/reference/review-loop-pattern.md`. Code review scoping: review uncommitted changes before commit. If changes are committed, use `--base <pre-task-sha>`.

Tasks always run sequentially.

**Standalone mode:** When no `.wazir/runs/latest/` exists, review logs go to `docs/plans/`.

> **Output to the user** before verification:
> Verification produces deterministic proof — actual command output, not claims. It confirms that tests pass, types check, linters are clean, and every acceptance criterion has evidence. This is the evidence gate that separates "I think it works" from "here is proof it works."

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

## Interaction Mode Awareness

Read `interaction_mode` from run-config at the start of execution:

- **`auto`:** Skip user checkpoints. On escalation, write reason to `.wazir/runs/<id>/escalations/` and STOP (do not proceed without user). Gating agent evaluates phase reports.
- **`guided`:** Standard behavior — ask user on escalation, show per-task completion summaries.
- **`interactive`:** Before implementing each task, briefly describe the approach and ask: "About to implement [task] using [approach] — sound right?" Show more detail in per-task summaries.

## Escalation

Pause and ask the user when:
- The plan is blocked or contradictory
- Implementation would require unapproved scope change
- A task's acceptance criteria can't be met

When escalating, use this pattern:

Ask the user via AskUserQuestion:
- **Question:** "[Describe the specific blocker or conflict]"
- **Options:**
  1. "Adjust the plan to work around the blocker" *(Recommended)*
  2. "Expand scope to handle the new requirement"
  3. "Skip this task and continue with the rest"
  4. "Abort the run"

Wait for the user's selection before continuing.

## Progress Reporting

### Phase Map
At the start of execution and after each task commit, display the task progress map:

```
EXECUTE: [Task 1/8] ████░░░░ 12% — "Add depth table module"
```

### Meaningful Updates
Follow the formula: **"Name the action. State the dependency. Omit the journey."**

Examples:
- `"Task 3/8: Implementing pretooluse-dispatcher (depends on depth-table from Task 1)..."`
- `"RED: Writing tests for artifact-dependencies. 0/13 passing..."`
- `"GREEN: 13/13 tests passing. Committing task 3..."`

### Artifact Previews
After each task commit, show the key files changed:
```
> Committed: feat(hooks): consolidate PreToolUse hooks into single dispatcher
> Files: pretooluse-dispatcher.js (+185), hooks.json (modified), 2 settings synced
```

### Time Estimates
At task start: `"Starting task 4/8 (estimated ~10-15 min)..."`

### Heartbeat
Never exceed the silence threshold for the run's depth level:
- Quick: max 3 minutes
- Standard: max 2 minutes
- Deep: max 90 seconds

During long test runs or implementations, emit: `"Still running tests (23/38 passed)..."`

### Depth Table Reference
All depth-dependent values (review passes, loop caps) come from the canonical depth table in `tooling/src/config/depth-table.js`. Never hardcode depth values.

---

## Reasoning Output

Throughout the executor phase, produce reasoning at two layers:

**Conversation (Layer 1):** Before each task, explain what you're about to implement and why. After each task, state what would have gone wrong without this task.

**File (Layer 2):** Write `.wazir/runs/<id>/reasoning/phase-executor-reasoning.md` with structured entries per implementation decision:
- **Trigger** — what prompted the decision (e.g., "task spec requires auth middleware")
- **Options considered** — implementation alternatives
- **Chosen** — selected approach
- **Reasoning** — why this approach over alternatives
- **Confidence** — high/medium/low
- **Counterfactual** — what would break without this decision

Key executor reasoning moments: architecture choices, library selections, API design decisions, test strategy decisions, and any deviation from the plan.

## Iron Laws of Execution

These are non-negotiable. No context makes them optional.

1. **One task = one commit.** Batching tasks into a single commit defeats per-task review, makes rollback impossible, and hides individual failures.
2. **Never skip per-task review.** The review exists to catch bugs before they compound. A bug in task 3 that depends on task 2 is exponentially harder to fix.
3. **Never claim completion without verification evidence.** "I implemented it" is a claim. A passing test suite is evidence. Only evidence counts.
4. **Follow the plan order.** Tasks are ordered for a reason — dependencies, risk sequencing, or logical progression. Reordering without explicit approval is scope mutation.
5. **Phase prerequisites are hard gates.** If clarification, spec, design, or plan artifacts are missing, STOP. Do not rationalize that the input is "clear enough" to proceed.

**Violating the letter of the execution process is violating the spirit.** Committing multiple tasks together "because they're related" is the most common execution fraud. Each task has its own review cycle, its own commit, and its own verification. Bundling them defeats every quality gate.

## Red Flags — You Are Rationalizing

If you catch yourself thinking any of these, STOP. You are about to violate the execution discipline.

| Thought | Reality |
|---------|---------|
| "These tasks are related, I'll combine them" | Related tasks still get separate commits. The review catches different things per task. |
| "The review will just slow me down" | The review catches the bugs you will spend 3x longer debugging later. |
| "I already verified this in my head" | Mental verification has a ~40% miss rate. Run the actual commands. |
| "The prerequisite artifacts are missing but the input is detailed enough" | Detailed input is not a spec. The pipeline phases exist to catch what "detailed enough" misses. |
| "I'll commit everything at the end" | End-of-run commits have no per-task review, no incremental verification, and no rollback granularity. |
| "This task is trivial, skip the review" | Trivial tasks have trivial reviews. Run them — they cost almost nothing and catch real bugs. |
| "I need to fix something in a previous task while working on this one" | Stop. Commit your current work, go back, fix, re-review, then resume. Never cross-contaminate tasks. |
| "The plan order doesn't matter for these tasks" | If you believe that, ask the user. Do not reorder silently. |
| "I can skip TDD for this task" | No. TDD is mandatory for all behavior changes. See wz:tdd. |

## Done

When all tasks are complete and verified:

> **Executor phase complete.**
>
> - Tasks: [completed]/[total] implemented
> - Verification: proof at `.wazir/runs/latest/artifacts/verification-proof.md`
>
> **Next:** Run `/reviewer --mode final` to review against the original input.
