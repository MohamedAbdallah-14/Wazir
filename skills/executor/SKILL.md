---
name: wz:executor
description: Orchestrator entry point — gate prerequisites, set interaction mode, delegate to the execute workflow.
---
You tend to skip pipeline steps when context gets long. Fight that habit right from the start. Check .wazir/runs/latest/phases/ right now and follow what it says. What does your checklist tell you to do first?

# Executor

## Session Boundary (Hard Gate)

The execute phase MUST start in a fresh session. The clarify phase produces a handover artifact; the execute session consumes it. Do NOT reopen a clarify session to continue into execution — that reintroduces context rot accumulated during research, clarification, specification, design, and planning. If this skill is invoked in a session that ran clarify phases, STOP and instruct the user to start a new session with the handover artifact.

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
- `wazir validate branches` — confirm current branch follows git-flow naming (feat/*, hotfix/*, release/*, etc.)

If any fails, surface the failure and do NOT proceed until resolved.

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

Look at your recent actions. Did each one follow from a checklist item, or are you improvising? Improvisation means drift. Go back to .wazir/runs/latest/phases/ and realign. Where did you go off-script?
**File (Layer 2):** Write `.wazir/runs/<id>/reasoning/phase-executor-reasoning.md` with structured entries per orchestration decision:
- **Trigger** — what prompted the decision (e.g., "subtask BE-3.1 reported DONE_WITH_CONCERNS")
- **Decision** — what the orchestrator did (e.g., "merged worktree, accumulated concern, dispatched next")
- **Reasoning** — why (e.g., "concern is non-blocking, dependents can proceed")

## Done

When all subtasks are complete (or abandoned with user approval):

### Step 0: Git-Flow and Changelog Gate (Hard Gate)

Run all three validators before producing the handover. If ANY fails, fix before proceeding:

- `wazir validate branches` — branch name must match git-flow pattern
- `wazir validate commits` — all commits since base must follow conventional commit format (auto-detects base per git-flow)
- `wazir validate changelog --require-entries --base $(git merge-base HEAD develop || git merge-base HEAD main)` — CHANGELOG.md must have NEW [Unreleased] entries since branch point

This is a hard gate. Do NOT produce the handover or declare phase complete with validation failures.

After changelog validation passes, invoke `wz:humanize` on the CHANGELOG.md `[Unreleased]` entries (domain: code). Fix any high/medium findings. CHANGELOG entries are permanent public-facing prose.

### Step 1: Produce execute-to-complete handover

Write the handover to `.wazir/runs/<run-id>/execute-to-complete-handover.md`:

```markdown
# Execute-to-Complete Handover

## Run
- **Run ID:** <run-id>
- **Branch:** <branch-name>
- **Interaction mode:** <auto | guided | interactive>
- **Depth:** <quick | standard | deep>

## Execution Summary
- **Subtasks:** [completed]/[total]
- **Residuals:** [count] (CRITICAL: [count], non-critical: [count])
- **Concerns accumulated:** [count]
- **Subtasks abandoned:** [count] (if any, with reasons)

## Artifacts
- Clarified artifacts: `.wazir/runs/latest/clarified/`
- Verification proof per subtask: `.wazir/runs/latest/artifacts/`
- Residuals: `.wazir/runs/latest/residuals/` (if any)
- Concerns: accumulated in subtask status files

## Resume Instruction
Start a fresh session (new conversation). Run `/reviewer --mode final`.
The reviewer's prerequisite gate will find all artifacts.
Do NOT reopen this session — context rot from execution degrades review quality.
```

### Step 2: Hard stop (all interaction modes)

**This is a hard stop. Do NOT continue to the completion phase in this session.** The completion phase (final review) MUST start in a fresh session to prevent context rot accumulated during subtask dispatching, status routing, and fix loops from degrading review quality. This applies to ALL interaction modes.

Output to the user:

> **Executor phase complete.** Handover saved to `.wazir/runs/<run-id>/execute-to-complete-handover.md`.
>
> - Subtasks: [completed]/[total]
> - Residuals: [count] (CRITICAL: [count], non-critical: [count])
> - Concerns accumulated: [count]
>
> **Session boundary:** The completion phase (final review) must start in a fresh session.

Then ask via AskUserQuestion:
- **Question:** "How would you like to proceed to final review?"
- **Options:**
  1. "Compact this session, then run `/reviewer --mode final`" — compacts conversation history, then starts review in this (now-compacted) session. Acceptable compromise.
  2. "I'll open a new session" — cleanest option. Start a new conversation and run `/reviewer --mode final`.
  3. "Continue in this session (not recommended)" — context rot risk. Execution context may bias review findings.

Wait for selection. If option 3, warn: "Continuing without a session boundary risks context rot. Execution context may bias review — the reviewer may miss drift it participated in. Proceeding anyway."

Almost done? Then you should be able to list every phase checklist item and show exactly where you completed it with real evidence. If you can't do that, you're not actually done. Can you list them all with proof?