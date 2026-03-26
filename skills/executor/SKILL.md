---
name: wz:executor
description: Orchestrator entry point — gate prerequisites, set interaction mode, delegate to the execute workflow.
---

# Executor

## Model Annotation

When multi-model mode is enabled, the orchestrator uses Opus for dispatch decisions. Subagent model selection is handled by the Composer.

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
2. Read `depth` from `run-config.yaml`. Read `.wazir/state/config.json` for `multi_tool` settings.

## Pre-Execution Validation

Run these checks before implementing:
- `wazir validate manifest` — confirm manifest schema is valid
- `wazir validate hooks` — confirm hook contracts are intact

If either fails, surface the failure and do NOT proceed until resolved.

## Interaction Mode Awareness

Read `interaction_mode` from run-config at the start of execution:

- **`auto`:** Dispatch all subtasks without user checkpoints. On escalation (FAILED after Level 2, BLOCKED), write reason to `.wazir/runs/<id>/escalations/` and STOP (do not proceed without user).
- **`guided`:** Show per-subtask completion summaries (subtask ID, status, concerns). Ask user on escalation.
- **`interactive`:** Before dispatching each subtask, show the subtask spec summary and ask: "About to dispatch [subtask] — sound right?" Show subagent outputs between steps.

## Execute

Follow `workflows/execute.md` for orchestration. The workflow describes the subtask loop, status routing, worktree management, and failure handling. The skill's job is prerequisites + mode awareness + delegation.

## Escalation

Pause and escalate to user when:
- A subtask reports BLOCKED or FAILED after Level 2 (replan exhausted)
- A subtask reports NEEDS_CONTEXT and replan cannot resolve
- Implementation would require unapproved scope change
- CRITICAL residuals remain after the subtask loop

When escalating, present: subtask ID, status, what was attempted, evidence.

## Reasoning Output

Throughout the executor phase, produce reasoning at two layers:

**Conversation (Layer 1):** Before each subtask dispatch, state which subtask and why (dependency order). After each subtask completes, state the status and routing decision.

**File (Layer 2):** Write `.wazir/runs/<id>/reasoning/phase-executor-reasoning.md` with structured entries per orchestration decision:
- **Trigger** — what prompted the decision (e.g., "subtask BE-3.1 reported DONE_WITH_CONCERNS")
- **Decision** — what the orchestrator did (e.g., "merged worktree, accumulated concern, dispatched next")
- **Reasoning** — why (e.g., "concern is non-blocking, dependents can proceed")

## Done

When all subtasks are complete (or abandoned with user approval):

> **Executor phase complete.**
>
> - Subtasks: [completed]/[total]
> - Residuals: [count] (CRITICAL: [count], non-critical: [count])
> - Concerns accumulated: [count]
>
> **Next:** Run `/reviewer --mode final` to review against the original input.
