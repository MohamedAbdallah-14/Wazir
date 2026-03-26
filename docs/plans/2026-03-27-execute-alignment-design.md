# Execute Phase Implementation Alignment — Design

## Context

The execute vision (`docs/vision/pipeline-execute.md`) was rewritten in session 2026-03-26 to use a subagent pipeline model: 3 roles (Executor, Reviewer/Verifier, Codex-R/V), 7-step subtask loop, residuals, status protocol with cause codes, DAG-driven parallel execution via worktrees. The current implementation files still describe a monolithic single-session executor with separate reviewer/verifier roles. This design aligns the implementation to the vision.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Full alignment: docs + schemas + templates + Composer prompt structures | Schemas are the contract — without them the docs are just prose |
| 2 | Keep both `roles/reviewer.md` and `roles/verifier.md`, cross-reference the merged subagent concept | Verifier role is independently useful for Codex/verifier agent and standalone verification |
| 3 | Add Subtask Execution Loop section to `review-loop-pattern.md`, keep N-pass loop | N-pass loop still correct for non-execution reviews (spec, plan, clarification, design) |
| 4 | Composer prompt assembly is inline — no separate template files | Expertise modules ARE the templates. Composer assembles from composition-map + subtask spec |
| 5 | `skills/executor/SKILL.md` = entry point, `workflows/execute.md` = orchestrator playbook, roles = subagent contracts | Parent session IS the orchestrator by virtue of running the execute workflow |
| 6 | Schemas in `schemas/`, residuals template in `templates/artifacts/` | Schemas are contracts, not docs or expertise |
| 7 | Phase checklist rewritten for orchestrator steps | Subagents get instructions from Composer, not phase checklists |

## File Changes

### Rewrites

**`skills/executor/SKILL.md`** — Entry point + prerequisites + interaction mode awareness. Delegates to `workflows/execute.md` for orchestration. Removes inline TDD/review/verify logic (subagent work now). Keeps: phase prerequisites hard gate, pre-execution validation, escalation rules, reasoning output, standalone mode.

**`workflows/execute.md`** — Becomes the orchestrator playbook:
- Read DAG from execution-plan.md
- Dispatch subagents via Agent tool per subtask
- 7-step subtask loop with skip logic (step 2 clean → skip 3-4, step 6 clean → skip 7)
- Status routing: DONE → merge worktree, FAILED → fix loop then Level 2, NEEDS_CONTEXT → replan, BLOCKED → check dependency
- Worktree management (up to 4 concurrent, sequential merge)
- Failure handling: Level 1 (7-spawn loop) + Level 2 (replan → user escalation)
- Residuals collection after step 7
- Batch handover at DAG wave boundaries

**`templates/phases/executor.md`** — Orchestrator checklist:
- Read clarifier output and execution plan
- Pre-execution validation
- For each subtask: dispatch, monitor status, route
- Merge completed worktrees
- Collect residuals
- Produce batch handover or transition to final review

### Updates

**`roles/executor.md`** — Reframe as subagent contract: TDD, micro-commit (lint → analysis → secrets → commit), write status.json + analysis-findings.json, hard limits (max_steps, max_cost, max_wall_clock, max_output_tokens), external side effects invariant. Remove orchestration concerns.

**`roles/reviewer.md`** — Add cross-reference to merged Reviewer/Verifier subagent concept. Add: review dimensions for task-execution, analysis-findings.json classification (is_new true → classify as TP/FP/needs-investigation), proof.json output, supply chain verification (conditional), tautological test detection.

**`roles/verifier.md`** — Add cross-reference: "In the subtask pipeline, verification runs within the Reviewer/Verifier subagent." Keep standalone validation commands (`wazir validate *`). Add: verification pass responsibilities from vision (run ALL criteria, collect evidence, map to acceptance criteria).

**`docs/reference/review-loop-pattern.md`** — Add "Subtask Execution Loop" section:
- 7-step pipeline diagram
- Skip logic rules
- Residuals: unresolved findings after step 7 → `residuals-<subtask-id>.md`
- Level 2 escalation triggers
- Worst case: 15 invocations (7 loop + 1 replan + 7 replanned loop)
- Relationship to existing N-pass loop: N-pass is for non-execution reviews, subtask loop is for execution

**`expertise/composition-map.yaml`** — Add module mappings for 3 subagent prompt types:
- Executor: `always.executor` + stack + concerns + TDD instructions + hard limits
- Reviewer/Verifier: `always.reviewer` + `always.verifier` + `reviewer_modes.task-review` + stack antipatterns + `quality/evidence-based-verification.md`
- Codex-R/V: same as R/V + Codex invocation config + merge strategy

### New Files

**`schemas/analysis-findings.schema.json`** — JSON Schema per vision:
- findings array: id, category (lint|type_error|security|complexity|dead_code|style), severity (critical|high|medium|low), file, line, rule, message, is_new
- baseline_count, new_count
- Delta semantics: is_new=true for this subtask's findings, is_new=false for pre-existing

**`schemas/status.schema.json`** — JSON Schema for agent-reported status:
- status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED | FAILED
- error_cause (when FAILED): verification_failure | tool_failure | timeout | cost_limit | step_limit
- Constrained decoding required

**`templates/artifacts/residuals.md`** — Template:
- Subtask ID, finding severity, file, line
- What was attempted (which steps ran)
- Why it remains unresolved
- Recommended action (fix in cleanup pass, escalate, defer)

## Architecture

```
User/Pipeline
    |
    v
skills/executor/SKILL.md  (entry point, prerequisites, mode)
    |
    v
workflows/execute.md  (orchestrator playbook)
    |
    +--- Read DAG from execution-plan.md
    +--- For each subtask (up to 4 parallel via worktrees):
    |       |
    |       +-- Step 1: Agent(Executor)          <- Composer: roles/executor.md + expertise
    |       +-- Step 2: Agent(Reviewer/Verifier)  <- Composer: roles/reviewer.md + verifier.md
    |       +-- Step 3: Agent(Executor)            [skip if step 2 clean]
    |       +-- Step 4: Agent(Reviewer/Verifier)   [skip if step 2 clean]
    |       +-- Step 5: Agent(Executor)            [skip if step 4 clean]
    |       +-- Step 6: Agent(Codex-R/V)          <- Composer: R/V + Codex config
    |       +-- Step 7: Agent(Executor)            [skip if step 6 clean]
    |
    +--- Status routing per subtask
    +--- Residuals collection
    +--- Batch handover if session boundary
```

## What Does NOT Change

- `docs/vision/pipeline-execute.md` — Source of truth, already updated
- `docs/vision/pipeline.md` (Composer section) — Already updated
- `docs/vision/pipeline-complete.md` — Already aligned
- `skills/reviewer/SKILL.md` — Still handles all review modes independently
- `skills/verification/SKILL.md` — Standalone verification still valid
