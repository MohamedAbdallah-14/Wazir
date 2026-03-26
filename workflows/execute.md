# execute

## Purpose

Orchestrate the subtask pipeline: dispatch subagents per subtask, route on status, manage worktrees, collect residuals, produce batch handovers.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase execute --status in_progress`

## Pre-execution validation

Before dispatching any subtask:
- `wazir validate manifest` — confirm manifest schema is valid
- `wazir validate hooks` — confirm hook contracts are intact

If either fails, surface and do NOT proceed.

## Inputs

- approved execution plan (DAG of subtask files)
- clarify-to-execute handover artifact
- current branch state

## Primary Role

- orchestrator (parent session)

## Subagent Roles

Dispatched via Agent tool, each with a Composer-built prompt:

- **Executor** (`roles/executor.md` + expertise modules): implements subtask via TDD, micro-commits, self-review
- **Reviewer/Verifier** (`roles/reviewer.md` + `roles/verifier.md` + expertise): two-stage review (spec → quality) + type-aware verification + proof.json
- **Cross-Model R/V** (same as R/V + cross-model tool config): runs configured cross-model tool + verification concurrently

## Orchestration

### Baseline SHA Capture

Before dispatching step 1 for each subtask:

    PRE_TASK_SHA=$(git rev-parse HEAD)

All Reviewer/Verifier passes scope their diff to `--base $PRE_TASK_SHA`.

### The Subtask Loop

For each subtask, run the 7-step subtask execution loop per `docs/reference/review-loop-pattern.md` "Subtask Execution Loop" section.

### Status Routing

After the subtask loop completes (all 7 steps exhausted or clean exit), route on the subtask's final status. This table does NOT apply to individual step outputs within the loop — step-to-step routing is handled by the subtask execution loop in `docs/reference/review-loop-pattern.md`.

| Status | Action |
|--------|--------|
| DONE | Merge worktree. Unblock dependents. |
| DONE_WITH_CONCERNS | Merge worktree. Accumulate concerns. Check at batch boundary and before completion gate. |
| NEEDS_CONTEXT | Replan immediately (Level 2 Tier 1). |
| BLOCKED | Check dependency. Wait or escalate to user. |
| FAILED | Enter fix loop. If loop exhausted, Level 2 escalation. |

### Orchestrator Lifecycle States

Tracked per subtask, set by the orchestrator (not by agents):

| State | Meaning | Trigger |
|-------|---------|---------|
| `pending` | Not yet started | Initial DAG state |
| `running` | Agent dispatched | Orchestrator dispatches |
| `completed` | Pipeline finished | Final R/V clean |
| `abandoned` | Will not complete | User decision after escalation |
| `upstream_failed` | Dependency abandoned | Transitive dep abandoned |
| `waiting_on_user` | Escalated | BLOCKED or post-Level-2 |

### Parallel Execution

DAG determines parallelism (Kahn's algorithm). Concurrency ceiling: 4 worktrees.

Worktrees isolate files, not ports, databases, or services. For subtasks requiring runtime resources (dev servers, database connections, bound ports), the subtask spec must declare these requirements during planning. The orchestrator provisions runtime isolation (e.g., per-worktree containers, database branches) based on declarations. Most coding subtasks need only file isolation; runtime isolation is the exception.

Sequential merge: one worktree at a time, fast integration check after each. Full integration suite after every ~4 merges.

### Residuals Collection

After step 7 with remaining issues: write `residuals-<subtask-id>.md` per `templates/artifacts/residuals.md`. CRITICAL residuals trigger Level 2 escalation. Non-critical residuals collected for completion gate.

### Batch Handover

At DAG wave boundaries, produce `batch-handover.md` per `templates/artifacts/batch-handover.md`. Fresh-session resume: new session consumes the handover artifact. Host session restore is prohibited — it reintroduces context rot.

## Outputs

- merged subtask code on branch
- residuals files (if any)
- batch handover (if session boundary)

## Approval Gate

- no new scope without explicit approval

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase execute --status completed`

## Failure Conditions

- subtask abandoned without user decision
- merge conflicts (planning failure)
- undeclared external side effects
