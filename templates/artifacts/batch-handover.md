---
artifact_type: batch_handover
phase: execute
role: orchestrator
run_id: <run-id>
batch: <batch-number>
status: handover
sources:
  - <execution-plan>
---

# Batch Handover — Batch <N>

## Completed Subtasks

| Subtask ID | Status | Concerns |
|-----------|--------|----------|
| <id> | DONE | — |
| <id> | DONE_WITH_CONCERNS | <concern summary> |

## Remaining DAG State

| Subtask ID | Lifecycle | Dependencies | Notes |
|-----------|-----------|-------------|-------|
| <id> | pending | <dep-ids> | — |
| <id> | upstream_failed | <failed-dep> | Blocked by <dep> abandonment |

## Accumulated Concerns

- <concern from subtask X>
- <concern from subtask Y>

## Blocked Subtasks

| Subtask ID | Lifecycle | Reason |
|-----------|-----------|--------|
| <id> | waiting_on_user | <reason> |
| <id> | abandoned | <reason> |

## Active Learnings

- <learning discovered during this batch>

## Environment State

- **Branch:** <branch-name>
- **Active worktrees:** <list or "none — all merged">
- **Runtime isolation:** <description or "none">

## Resume Instruction

<!-- ~500 tokens max. If this exceeds 500 tokens, the handover contains details the next agent can discover from code. -->

<Self-contained instruction for a fresh session to continue execution. References files for depth.>
