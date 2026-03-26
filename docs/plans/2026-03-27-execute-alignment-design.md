# Execute Phase Implementation Alignment — Design

## Context

The execute vision (`docs/vision/pipeline-execute.md`) was rewritten in session 2026-03-26 to use a subagent pipeline model: 3 roles (Executor, Reviewer/Verifier, Cross-Model R/V), 7-step subtask loop, residuals, status protocol with cause codes, DAG-driven parallel execution via worktrees. The vision was then enhanced with 11 implementation-proven patterns (two-stage review, self-review, escalation UX, dynamic security dims, model-agnostic cross-model review, finding attribution, baseline SHA capture, commit discipline check, type-aware verification, code organization guidance, agent behavior checks). The current implementation files still describe a monolithic single-session executor with separate reviewer/verifier roles. This design aligns the implementation to the updated vision.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Full alignment: docs + schemas + templates + Composer prompt structures | Schemas are the contract — without them the docs are just prose |
| 2 | Keep both `roles/reviewer.md` and `roles/verifier.md`, cross-reference the merged subagent concept | Verifier role is independently useful for Codex/verifier agent and standalone verification |
| 3 | Add Subtask Execution Loop section to `review-loop-pattern.md`, keep N-pass loop | N-pass loop still correct for non-execution reviews (spec, plan, clarification, design) |
| 4 | Composer prompt assembly is inline — no separate prompt template files | Expertise modules ARE the templates. Composer assembles from composition-map + subtask spec |
| 5 | `skills/executor/SKILL.md` = entry point, `workflows/execute.md` = orchestrator playbook, roles = subagent contracts | Parent session IS the orchestrator by virtue of running the execute workflow |
| 6 | Schemas in `schemas/`, residuals template in `templates/artifacts/` | Schemas are contracts, not docs or expertise |
| 7 | Phase checklist rewritten for orchestrator steps | Subagents get instructions from Composer, not phase checklists |

## File Changes

### Rewrites

**`skills/executor/SKILL.md`** — Entry point + prerequisites + interaction mode awareness. Delegates to `workflows/execute.md` for orchestration. Removes inline TDD/review/verify logic (subagent work now).

Sections that survive in the orchestrator entry point:
- Phase Prerequisites (Hard Gate) — still gates execution
- Pre-Execution Validation — still runs before dispatch
- Interaction Mode Awareness — rewritten for orchestrator semantics (see below)
- Escalation — rewritten for subagent model
- Reasoning Output — orchestrator records dispatch decisions, not implementation decisions
- Standalone mode exception — preserved
- Done — updated for orchestrator completion

Sections that move to subagent contracts (roles):
- Model Annotation — Composer handles model selection per subagent
- Command Routing — subagents get routing from Composer
- Codebase Exploration — subagents get this from Composer
- Security Awareness — loaded via expertise modules
- Execute (TDD, review loop, commit) — subagent work
- Verify — subagent work
- CHANGELOG — executor subagent responsibility

Interaction mode mapping for orchestrator:
- **`auto`:** Dispatch all subtasks without user checkpoints. On escalation (FAILED after Level 2, BLOCKED), write to escalations dir and STOP.
- **`guided`:** Show per-subtask completion summaries. Ask user on escalation.
- **`interactive`:** Before dispatching each subtask, show the subtask spec summary and ask: "About to dispatch [subtask] — sound right?" Show subagent outputs between steps.

**`workflows/execute.md`** — Becomes the orchestrator playbook:
- Phase entry/exit event capture (`wazir capture event`) — preserved from current workflow
- Read DAG from execution-plan.md
- Baseline SHA capture (`PRE_TASK_SHA=$(git rev-parse HEAD)`) before dispatching each subtask — scopes all review passes to the subtask's changes
- Dispatch subagents via Agent tool per subtask (using `isolation: "worktree"` for parallel execution)
- 7-step subtask loop with skip logic (step 2 clean → skip 3-4-5, step 6 clean → skip 7)
- Status routing: DONE → merge worktree, DONE_WITH_CONCERNS → merge worktree + accumulate concerns (check at batch boundary and before completion gate), FAILED → fix loop then Level 2, NEEDS_CONTEXT → replan, BLOCKED → check dependency
- Orchestrator lifecycle states defined here: `pending`, `running`, `completed`, `abandoned`, `upstream_failed`, `waiting_on_user` — tracked per subtask in orchestrator state
- Worktree management (up to 4 concurrent, sequential merge)
- Failure handling: Level 1 (7-spawn loop, worst case 7 spawns per attempt) + Level 2 (replan → user escalation, worst case 15 total invocations including replan)
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

**`roles/executor.md`** — Reframe as subagent contract: TDD, micro-commit (lint → analysis → secrets → commit), write `subtask-status.json` + `analysis-findings.json`, hard limits (max_steps, max_cost, max_wall_clock, max_output_tokens), external side effects invariant. Remove orchestration concerns. Add from vision: code organization awareness (follow subtask spec file structure, don't split files without plan guidance, follow existing patterns), self-review checklist before reporting status (completeness, quality, honesty), escalation permission with specific STOP conditions (architectural ambiguity, can't find clarity, uncertain approach, unanticipated restructuring, reading without progress).

**`roles/reviewer.md`** — Add cross-reference to merged Reviewer/Verifier subagent concept. Add from vision: two-stage review (spec compliance first, code quality second — stage 2 only runs after stage 1 passes), dynamic security dimension injection (scan diff for security patterns → add 6 security dims if triggered), commit discipline check (reject multi-task diffs), finding attribution (`[Internal]`, `[Codex]`, `[Gemini]`, `[Both]`), analysis-findings.json classification (is_new true → classify as TP/FP/needs-investigation), type-aware verification (detect project type → run type-appropriate checks), agent behavior checks (index usage, context-mode routing — warning-level), proof.json output, supply chain verification (conditional), tautological test detection.

**`roles/verifier.md`** — Add cross-reference: "In the subtask pipeline, verification runs within the Reviewer/Verifier subagent." Keep standalone validation commands (`wazir validate *`). Add: type-aware verification (detect project type: web/API/CLI/library → run type-appropriate commands), verification pass responsibilities from vision (run ALL criteria, collect evidence, map to acceptance criteria).

**`docs/reference/review-loop-pattern.md`** — Add "Subtask Execution Loop" section:
- 7-step pipeline diagram
- Skip logic rules
- Residuals: unresolved findings after step 7 → `residuals-<subtask-id>.md`
- Level 2 escalation triggers
- Worst case: 15 invocations (7 loop + 1 replan + 7 replanned loop)
- Relationship to existing N-pass loop: N-pass is for non-execution reviews (spec-challenge, plan-review, clarification-review, design-review) and standalone invocations. Subtask loop governs pipeline execution. The `task-review` mode in the N-pass loop is for standalone/non-pipeline use only; in-pipeline per-task review is handled by the subtask loop's Reviewer/Verifier steps.

**`expertise/composition-map.yaml`** — No structural YAML change needed. The existing keys (`always.executor`, `always.reviewer`, `always.verifier`, `reviewer_modes.task-review`, `auto`, `stacks`, `concerns`) already map to the 3 subagent prompt types:
- Executor prompt: Composer reads `always.executor` + `stacks.<detected>.executor` + `concerns.<declared>.executor` + `auto.all-stacks.all-roles`
- Reviewer/Verifier prompt: Composer reads `always.reviewer` + `always.verifier` + `reviewer_modes.task-review` + `stacks.<detected>.antipatterns` + `auto.all-stacks.all-roles`
- Cross-Model R/V prompt: same as R/V, Composer appends cross-model tool invocation instructions from `multi_tool.tools` config (Codex, Gemini, or any configured external model CLI) + source attribution rules (`[Internal]`, `[Codex]`, `[Gemini]`, `[Both]`)

Only change: add a comment block documenting the 3 prompt type resolution paths.

### New Files

**`schemas/analysis-findings.schema.json`** — JSON Schema per vision:
- findings array: id, category (lint|type_error|security|complexity|dead_code|style), severity (critical|high|medium|low), file, line, rule, message, is_new
- baseline_count, new_count
- Delta semantics: is_new=true for this subtask's findings, is_new=false for pre-existing

**`schemas/subtask-status.schema.json`** — JSON Schema for agent-reported subtask status (named `subtask-status` to avoid collision with the existing run-level `status.json` ledger used by hooks and guards):
- status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED | FAILED
- error_cause (when FAILED): verification_failure | tool_failure | timeout | cost_limit | step_limit
- Constrained decoding required

**`templates/artifacts/residuals.md`** — Template:
- Subtask ID, finding severity, file, line
- What was attempted (which steps ran)
- Why it remains unresolved
- Recommended action (fix in cleanup pass, escalate, defer)

**`templates/artifacts/batch-handover.md`** — Template for session boundary handover:
- Completed subtask IDs with final status
- Remaining DAG state (pending subtasks with dependency status)
- Accumulated concerns from DONE_WITH_CONCERNS subtasks
- Blocked subtasks with reasons and current lifecycle state
- Active learnings discovered during this batch
- Environment state (active branches, worktrees, provisioned runtime isolation)
- Resume instruction (~500 tokens)

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
    |       +-- Step 6: Agent(Cross-Model R/V)     <- Composer: R/V + cross-model config
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
- `skills/verification/SKILL.md` — Standalone verification still valid

### Also Updates (moved from "What Does NOT Change")

**`skills/reviewer/SKILL.md`** — Substantive update to `task-review` mode: add pipeline vs standalone routing. In-pipeline execution, task-review is handled by the subtask loop's Reviewer/Verifier steps — the N-pass `task-review` mode is for standalone/non-pipeline invocations only. The hardcoded internal-plus-Codex loop in the reviewer skill remains valid for standalone use but must not be invoked during pipeline execution (the orchestrator dispatches the subtask loop instead). Also update cross-model references: "Codex" → "configured cross-model tool (Codex, Gemini, etc.)" to match the vision's model-agnostic principle.

## Dependencies

- **Planner subtask schema**: The execute alignment assumes the planner produces subtask files with DAG metadata (dependencies, side effects, runtime requirements). The current `schemas/implementation-plan.schema.json` is generic. The plan subtask schema update is already documented as "forward-critical" in `docs/plans/2026-03-26-clarify-impl-plan.md:1008`. Execute alignment can proceed but full orchestrator DAG reading depends on this.

## Known Gaps (Out of Scope)

- `docs/vision/pipeline-complete.md` Stage 3 inputs do not list residuals files, though the vision says "The final review phase (completion gate) sees all residuals." This is a completion-phase alignment task, not execute-phase.
- Event log segmentation per batch (vision line 199) — deferred, not needed for initial alignment.
- Secondary/derivative docs need updating after primary alignment: `docs/readmes/features/workflows/execute.md`, `docs/reference/roles-reference.md`, `docs/reference/templates.md`, `docs/concepts/artifact-model.md`. These describe the primary contracts — they get updated after the contracts are finalized, not during.
