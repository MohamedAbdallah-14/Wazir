# Execute Phase Implementation Alignment

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align all execute-phase implementation files with the updated vision (`docs/vision/pipeline-execute.md`).

**Architecture:** The vision defines a subagent pipeline (Executor → Reviewer/Verifier → Cross-Model R/V) orchestrated by the parent session. Implementation files (roles, workflows, skills, schemas, templates) must reflect this model. No runtime code — all changes are documentation and JSON schemas.

**Tech Stack:** Markdown, JSON Schema (draft 2020-12), YAML

**Dependency:** The planner subtask schema (`schemas/implementation-plan.schema.json`) is still generic — it does not yet encode DAG metadata (dependencies, side effects, runtime requirements). Task 10's orchestrator playbook references DAG reading, but full DAG enforcement depends on the planner schema update (documented as "forward-critical" in `docs/plans/2026-03-26-clarify-impl-plan.md:1008`). This plan can proceed — the orchestrator playbook describes the contract, the planner schema catches up separately.

**Schema extension note:** The vision specifies `analysis-findings.json` and status payload structure but does not include `subtask_id` fields. The schemas in this plan add `subtask_id` as an implementation extension — findings and status are useless without subtask traceability. This is intentional, not drift.

---

### Task 1: Create `schemas/analysis-findings.schema.json`

**Files:**
- Create: `schemas/analysis-findings.schema.json`
- Create: `templates/examples/analysis-findings.example.json`

**Step 1: Write the schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://wazir.dev/schemas/analysis-findings.schema.json",
  "title": "Analysis Findings Artifact",
  "description": "Deterministic analysis scan output produced by the executor subagent. Delta semantics: is_new=true for findings introduced by this subtask.",
  "type": "object",
  "required": ["subtask_id", "findings", "baseline_count", "new_count"],
  "properties": {
    "subtask_id": { "type": "string", "minLength": 1 },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "category", "severity", "file", "line", "rule", "message", "is_new"],
        "properties": {
          "id": { "type": "string", "pattern": "^.+-\\d+$" },
          "category": { "type": "string", "enum": ["lint", "type_error", "security", "complexity", "dead_code", "style"] },
          "severity": { "type": "string", "enum": ["critical", "high", "medium", "low"] },
          "file": { "type": "string", "minLength": 1 },
          "line": { "type": "integer", "minimum": 1 },
          "rule": { "type": "string", "minLength": 1 },
          "message": { "type": "string", "minLength": 1 },
          "is_new": { "type": "boolean" }
        },
        "additionalProperties": false
      }
    },
    "baseline_count": { "type": "integer", "minimum": 0 },
    "new_count": { "type": "integer", "minimum": 0 }
  },
  "additionalProperties": false
}
```

**Step 2: Write the example**

```json
{
  "subtask_id": "BE-3.1",
  "findings": [
    {
      "id": "BE-3.1-1",
      "category": "lint",
      "severity": "medium",
      "file": "src/auth/middleware.js",
      "line": 42,
      "rule": "no-unused-vars",
      "message": "Variable 'token' is declared but never used",
      "is_new": true
    },
    {
      "id": "BE-3.1-2",
      "category": "security",
      "severity": "high",
      "file": "src/auth/middleware.js",
      "line": 58,
      "rule": "no-dynamic-require",
      "message": "Avoid dynamic require — potential injection vector",
      "is_new": true
    }
  ],
  "baseline_count": 12,
  "new_count": 2
}
```

**Step 3: Register in schema-examples test**

Add to `tooling/test/schema-examples.test.js` EXAMPLE_CASES array:

```javascript
['templates/examples/analysis-findings.example.json', 'schemas/analysis-findings.schema.json', 'json'],
```

**Step 4: Run tests**

Run: `node --test tooling/test/schema-examples.test.js`
Expected: all pass including new entry

**Step 5: Commit**

```bash
git add schemas/analysis-findings.schema.json templates/examples/analysis-findings.example.json tooling/test/schema-examples.test.js
git commit -m "feat(schemas): add analysis-findings schema with delta semantics"
```

---

### Task 2: Create `schemas/subtask-status.schema.json`

**Files:**
- Create: `schemas/subtask-status.schema.json`
- Create: `templates/examples/subtask-status.example.json`
- Modify: `tooling/test/schema-examples.test.js`

**Step 1: Write the schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://wazir.dev/schemas/subtask-status.schema.json",
  "title": "Subtask Status Artifact",
  "description": "Agent-reported subtask status. Named subtask-status to avoid collision with the run-level status.json ledger.",
  "type": "object",
  "required": ["subtask_id", "status", "summary"],
  "properties": {
    "subtask_id": { "type": "string", "minLength": 1 },
    "status": {
      "type": "string",
      "enum": ["DONE", "DONE_WITH_CONCERNS", "NEEDS_CONTEXT", "BLOCKED", "FAILED"]
    },
    "error_cause": {
      "type": "string",
      "enum": ["verification_failure", "tool_failure", "timeout", "cost_limit", "step_limit"]
    },
    "summary": { "type": "string", "minLength": 1 },
    "concerns": {
      "type": "array",
      "items": { "type": "string" }
    },
    "files_changed": {
      "type": "array",
      "items": { "type": "string" }
    },
    "verification_evidence": {
      "type": "object",
      "properties": {
        "tests_passed": { "type": "boolean" },
        "types_passed": { "type": "boolean" },
        "lint_passed": { "type": "boolean" }
      },
      "additionalProperties": true
    }
  },
  "additionalProperties": true,
  "if": {
    "properties": { "status": { "const": "FAILED" } }
  },
  "then": {
    "required": ["subtask_id", "status", "summary", "error_cause"]
  },
  "else": {
    "not": { "required": ["error_cause"] }
  }
}
```

**Step 2: Write the example**

```json
{
  "subtask_id": "BE-3.1",
  "status": "DONE_WITH_CONCERNS",
  "summary": "Implemented auth middleware with JWT validation and role-based access control",
  "concerns": ["File src/auth/middleware.js is growing large (280 lines) — may need splitting in a future subtask"],
  "files_changed": ["src/auth/middleware.js", "src/auth/middleware.test.js", "src/routes/index.js"],
  "verification_evidence": {
    "tests_passed": true,
    "types_passed": true,
    "lint_passed": true
  }
}
```

**Step 3: Write a FAILED-status example (exercises the if/then conditional)**

Create `templates/examples/subtask-status-failed.example.json`:

```json
{
  "subtask_id": "FE-2.1",
  "status": "FAILED",
  "error_cause": "verification_failure",
  "summary": "Tests fail on auth token refresh — race condition between concurrent requests",
  "files_changed": ["src/auth/refresh.js", "src/auth/refresh.test.js"],
  "verification_evidence": {
    "tests_passed": false,
    "types_passed": true,
    "lint_passed": true
  }
}
```

**Step 4: Register in schema-examples test**

Add both to EXAMPLE_CASES:

```javascript
['templates/examples/subtask-status.example.json', 'schemas/subtask-status.schema.json', 'json'],
['templates/examples/subtask-status-failed.example.json', 'schemas/subtask-status.schema.json', 'json'],
```

**Step 5: Run tests**

Run: `node --test tooling/test/schema-examples.test.js`
Expected: all pass

**Step 6: Commit**

```bash
git add schemas/subtask-status.schema.json templates/examples/subtask-status.example.json templates/examples/subtask-status-failed.example.json tooling/test/schema-examples.test.js
git commit -m "feat(schemas): add subtask-status schema with cause codes and conditional error_cause"
```

---

### Task 3: Create `templates/artifacts/residuals.md`

**Files:**
- Create: `templates/artifacts/residuals.md`

**Step 1: Write the template**

```markdown
---
artifact_type: residuals
phase: execute
role: orchestrator
run_id: <run-id>
subtask_id: <subtask-id>
status: unresolved
sources:
  - <subtask-spec>
  - <review-findings>
---

# Residuals — <subtask-id>

## Loop Summary

- **Steps executed:** <1-7>
- **Total spawns:** <count>
- **Final Reviewer/Verifier pass:** step <N>

## Unresolved Findings

### Finding 1

- **Severity:** <critical | high | medium | low>
- **File:** `<path>`
- **Line:** <number>
- **Source:** <[Internal] | [Codex] | [Gemini] | [Both]>
- **Description:** <what the finding is>
- **What was attempted:** <which executor step tried to fix it, what approach was taken>
- **Why it remains unresolved:** <why the fix didn't work or wasn't attempted>
- **Recommended action:** <fix in cleanup pass | escalate to user | defer to next run>

## Disposition

- **CRITICAL findings:** <count> — triggers Level 2 escalation if > 0
- **Non-critical findings:** <count> — collected for completion gate
```

**Step 2: Commit**

```bash
git add templates/artifacts/residuals.md
git commit -m "feat(templates): add residuals artifact template for unresolved subtask findings"
```

---

### Task 4: Create `templates/artifacts/batch-handover.md`

**Files:**
- Create: `templates/artifacts/batch-handover.md`

**Step 1: Write the template**

```markdown
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
```

**Step 2: Commit**

```bash
git add templates/artifacts/batch-handover.md
git commit -m "feat(templates): add batch-handover template for session boundary handover"
```

---

### Task 5: Update `roles/executor.md`

**Files:**
- Modify: `roles/executor.md`

**Step 1: Rewrite the file**

Reframe as subagent contract. Keep the structure (Purpose, Inputs, Allowed Tools, Required Outputs, etc.) but replace content with subagent responsibilities from the vision.

Key changes:
- Purpose: "Implement a single subtask via TDD within a subagent session. Receives a Composer-built prompt with everything needed — no codebase exploration required."
- Inputs: Composer-built prompt (subtask spec + expertise modules + constraints + file pointers)
- Add: micro-commit flow (lint → analysis → secrets → commit)
- Add: write `subtask-status.json` + `analysis-findings.json`
- Add: hard limits (max_steps, max_cost, max_wall_clock, max_output_tokens)
- Add: external side effects invariant
- Add: code organization awareness (follow spec file structure, don't split files, follow existing patterns)
- Add: self-review checklist before reporting (completeness, quality, honesty)
- Add: escalation permission with STOP conditions (architectural ambiguity, can't find clarity, uncertain approach, unanticipated restructuring, reading without progress)
- Add: status reporting (DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED | FAILED with cause codes)
- Remove: orchestration, review loops, verification, CHANGELOG (those move to orchestrator or R/V)
- Keep: Git-Flow (conventional commits), Writing Quality, Failure Conditions (updated for subagent context)

**Step 2: Verify no broken references**

Run: `rg 'roles/executor' skills workflows docs/reference --files-with-matches`
Check each file still makes sense with the updated role.

**Step 3: Commit**

```bash
git add roles/executor.md
git commit -m "refactor(roles): reframe executor as subagent contract with self-review and escalation"
```

---

### Task 6: Update `roles/reviewer.md`

**Files:**
- Modify: `roles/reviewer.md`

**Step 1: Update the file**

Keep existing structure. Add new content:

- Add to Purpose: "In the subtask pipeline, reviewer and verifier merge into a single Reviewer/Verifier subagent. This role file defines the reviewer half of that merged subagent."
- Add: two-stage review (spec compliance first → code quality second, stage 2 only after stage 1 passes)
- Add: dynamic security dimension injection (scan diff for patterns → add 6 security dims)
- Add: commit discipline check (reject multi-task diffs)
- Add: finding attribution (`[Internal]`, `[Codex]`, `[Gemini]`, `[Both]`)
- Add: analysis-findings.json classification (is_new true → TP/FP/needs-investigation)
- Add: type-aware verification (detect project type: web/API/CLI/library → run type-appropriate checks) — merged from verifier role
- Add: proof.json output specification — merged from verifier role
- Add: agent behavior checks (index usage, context-mode routing — warning-level)
- Add: supply chain verification (conditional)
- Add: tautological test detection
- Keep: all existing content (adversarial review, review modes, context retrieval, escalation, failure conditions)

**Step 2: Verify no broken references**

Run: `rg 'roles/reviewer' skills workflows docs/reference --files-with-matches`

**Step 3: Commit**

```bash
git add roles/reviewer.md
git commit -m "feat(roles): add two-stage review, security dims, attribution, behavior checks to reviewer"
```

---

### Task 7: Update `roles/verifier.md`

**Files:**
- Modify: `roles/verifier.md`

**Step 1: Update the file**

- Add to Purpose: "In the subtask pipeline, verification runs within the Reviewer/Verifier subagent. This role file remains independently valid for standalone verification and for the Cross-Model R/V subagent."
- Add: type-aware verification — detect project type (web/API/CLI/library), run type-appropriate commands
- Add: verification pass responsibilities (run ALL criteria, collect structured evidence, map to acceptance criteria, flag criteria lacking evidence)
- Add: proof.json output specification
- Keep: all existing `wazir validate *` commands, post-execution validation, escalation rules, failure conditions

**Step 2: Commit**

```bash
git add roles/verifier.md
git commit -m "feat(roles): add type-aware verification and cross-reference to merged R/V subagent"
```

---

### Task 8: Update `expertise/composition-map.yaml`

**Files:**
- Modify: `expertise/composition-map.yaml`

**Step 1: Add comment block**

Add a comment block after the header (after line 17) documenting the 3 prompt type resolution paths:

```yaml
# Subagent prompt type resolution (used by the Composer):
#
# Executor prompt:
#   always.executor + stacks.<detected>.executor + concerns.<declared>.executor + auto.all-stacks.all-roles
#   Composer adds: TDD instructions, hard limits, self-review checklist, escalation permission, code org guidance
#
# Reviewer/Verifier prompt:
#   always.reviewer + always.verifier + reviewer_modes.task-review + stacks.<detected>.antipatterns + auto.all-stacks.all-roles
#   Composer adds: two-stage review instructions, security dim injection rules, commit discipline check,
#   finding attribution rules, type-aware verification commands, agent behavior check rules
#
# Cross-Model R/V prompt:
#   Same as Reviewer/Verifier + cross-model tool invocation from multi_tool.tools config (Codex, Gemini, etc.)
#   Composer adds: source attribution rules ([Internal], [Codex], [Gemini], [Both]), merge strategy
```

**Step 2: Commit**

```bash
git add expertise/composition-map.yaml
git commit -m "docs(expertise): document 3 subagent prompt type resolution paths in composition-map"
```

---

### Task 9: Update `docs/reference/review-loop-pattern.md`

**Files:**
- Modify: `docs/reference/review-loop-pattern.md`

**Step 1: Add Subtask Execution Loop section**

Add a new section after the "End-of-Phase Report" section. Title: `## Subtask Execution Loop (Pipeline Mode)`.

Content:

```markdown
## Subtask Execution Loop (Pipeline Mode)

The subtask execution loop replaces the N-pass review loop for in-pipeline execution. It is NOT a variant of the N-pass loop — it is a separate pattern with different structure, different roles, and different termination conditions.

**When to use which:**
- **N-pass loop**: non-execution reviews (spec-challenge, plan-review, clarification-review, design-review, research-review) and standalone `task-review` invocations outside a pipeline run.
- **Subtask execution loop**: in-pipeline execution only. The orchestrator (`workflows/execute.md`) dispatches this loop per subtask.

### The Loop

```
Step 1: Executor          — TDD, implement, micro-commit, self-review
Step 2: Reviewer/Verifier — two-stage review (spec → quality) + verification + proof
Step 3: Executor          — fix findings (if any)
Step 4: Reviewer/Verifier — second round (if step 2 had findings)
Step 5: Executor          — fix findings (if any)
Step 6: Cross-Model R/V   — cross-model review + verification (concurrent)
Step 7: Executor          — fix cross-model + verification findings (if any)
```

### Skip Logic

- Step 2 clean (zero findings) → skip steps 3-4 → advance to step 6 (step 5 is implicitly skipped — no step 4 findings to fix)
- Step 4 clean → skip step 5 → advance to step 6
- Step 6 clean → skip step 7 → subtask complete

### Spawn Counts

- Best case: 2 spawns (executor → R/V clean → done)
- Typical: 4-5 spawns
- Worst case: 7 spawns per attempt

### Residuals

After step 7, if issues remain: unresolved findings are written to `residuals-<subtask-id>.md` (see `templates/artifacts/residuals.md`). CRITICAL residuals trigger Level 2 escalation. Non-critical residuals are collected for the completion gate.

### Level 2 Escalation

Triggered when: subtask loop exhausted with CRITICAL residuals, or subagent reports FAILED/NEEDS_CONTEXT/BLOCKED.

- Tier 1: Replan — failure evidence + residuals to fresh planner. Max 1.
- After Tier 1: Escalate to user with evidence.

Total worst case per subtask: 7 loop spawns + 1 replan + 7 replanned loop spawns = 15 invocations.

### Baseline SHA

The orchestrator captures `PRE_TASK_SHA` before dispatching step 1. All Reviewer/Verifier passes scope their diff to `--base $PRE_TASK_SHA`.

### Finding Attribution

All findings carry source tags: `[Internal]`, `[Codex]`, `[Gemini]`, `[Both]`. The Cross-Model R/V in step 6 merges findings from the cross-model tool with its own, preserving attribution.
```

**Step 2: Commit**

```bash
git add docs/reference/review-loop-pattern.md
git commit -m "docs(reference): add Subtask Execution Loop section to review-loop-pattern"
```

---

### Task 10: Rewrite `workflows/execute.md`

**Files:**
- Modify: `workflows/execute.md`

**Step 1: Rewrite as orchestrator playbook**

Replace current content. Keep structure markers (Purpose, Phase entry/exit). New content:

- Purpose: "Orchestrate the subtask pipeline: dispatch subagents per subtask, route on status, manage worktrees, collect residuals, produce batch handovers."
- Phase entry: preserve `wazir capture event` call
- Pre-execution validation: preserve `wazir validate manifest` + `wazir validate hooks`
- Inputs: approved execution plan (DAG), clarify-to-execute handover, branch state
- Primary Role: orchestrator (parent session)
- Subagent Roles: executor, reviewer+verifier merged, cross-model R/V
- Add: Baseline SHA Capture section (`PRE_TASK_SHA=$(git rev-parse HEAD)` before each subtask)
- Add: The Subtask Loop — reference `docs/reference/review-loop-pattern.md` "Subtask Execution Loop" section
- Add: Status Routing table (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED, FAILED with actions)
- Add: Orchestrator Lifecycle States table (pending, running, completed, abandoned, upstream_failed, waiting_on_user)
- Add: Parallel Execution (DAG, Kahn's, ceiling 4, sequential merge)
- Add: Residuals Collection
- Add: Batch Handover (reference `templates/artifacts/batch-handover.md`)
- Outputs: merged code, residuals, batch handover
- Phase exit: preserve `wazir capture event` call
- Failure Conditions: abandoned without user decision, merge conflicts, undeclared side effects

**Step 2: Commit**

```bash
git add workflows/execute.md
git commit -m "refactor(workflows): rewrite execute as orchestrator playbook with subtask loop and status routing"
```

---

### Task 11: Rewrite `skills/executor/SKILL.md`

**Files:**
- Modify: `skills/executor/SKILL.md`

**Step 1: Rewrite as orchestrator entry point**

Keep: frontmatter (name, description), Phase Prerequisites (Hard Gate), Pre-Execution Validation, Standalone mode exception.

Rewrite sections:
- Remove: Model Annotation, Command Routing, Codebase Exploration, Security Awareness, Execute section (TDD/review/commit), Verify section, CHANGELOG, Context Retrieval
- Add: "Follow `workflows/execute.md` for orchestration" — single sentence replacing 120 lines
- Rewrite Interaction Mode Awareness for orchestrator:
  - `auto`: Dispatch without checkpoints. On escalation, write to escalations dir and STOP.
  - `guided`: Per-subtask completion summaries. Ask user on escalation.
  - `interactive`: Show subtask spec before dispatch, ask confirmation. Show subagent outputs between steps.
- Rewrite Escalation for subagent model (orchestrator escalates when subtask reports BLOCKED/FAILED after Level 2)
- Rewrite Reasoning Output (orchestrator records dispatch decisions, status routing decisions, not implementation decisions)
- Rewrite Done: report subtasks completed/total, residuals count, concerns accumulated. Next: `/reviewer --mode final` or batch handover.

**Step 2: Commit**

```bash
git add skills/executor/SKILL.md
git commit -m "refactor(skills): rewrite executor as orchestrator entry point delegating to execute workflow"
```

---

### Task 12: Rewrite `templates/phases/executor.md`

**Files:**
- Modify: `templates/phases/executor.md`

**Step 1: Rewrite as orchestrator checklist**

```markdown
## Phase: executor
- [ ] Run `wazir capture event --run <id> --event phase_enter --phase execute --status starting`
- [ ] Read clarifier output from `.wazir/runs/<id>/clarified/`
- [ ] Read execution plan (DAG of subtasks)
- [ ] Run pre-execution validation (`wazir validate manifest`, `wazir validate hooks`)
- [ ] For each subtask: capture PRE_TASK_SHA, dispatch via subtask execution loop
- [ ] Route on subtask status (DONE/DONE_WITH_CONCERNS/FAILED/BLOCKED/NEEDS_CONTEXT)
- [ ] Merge completed worktrees sequentially
- [ ] Collect residuals for any subtasks exhausting 7-step loop
- [ ] Produce batch handover or transition to final review
- [ ] Run `wazir capture event --run <id> --event phase_enter --phase final_review --status starting` <!-- transition -->
```

**Step 2: Commit**

```bash
git add templates/phases/executor.md
git commit -m "refactor(templates): rewrite executor phase checklist for orchestrator model"
```

---

### Task 13: Update `skills/reviewer/SKILL.md`

**Files:**
- Modify: `skills/reviewer/SKILL.md`

**Step 1: Add pipeline vs standalone routing to task-review mode**

In the `task-review` prerequisites section (after line 91), add:

"**Pipeline vs standalone:** In-pipeline execution, `task-review` is handled by the subtask execution loop's Reviewer/Verifier steps — the orchestrator dispatches the loop, not this skill. This skill's `task-review` mode is for standalone/non-pipeline invocations only (e.g., manual review of uncommitted changes outside a pipeline run)."

**Step 2: Update cross-model references**

- In the Two-Tier Review section, update Tier 2 heading to: "### Tier 2: Cross-Model Review (Fresh Eyes on Clean Code)"
- In the Codex Review subsection, add a note: "Codex is one implementation of cross-model review. If `gemini` or other tools are in `multi_tool.tools`, follow the same pattern. The principle is different model family, not a specific vendor."
- Keep all Codex CLI examples as-is (they're implementation examples)

**Step 3: Commit**

```bash
git add skills/reviewer/SKILL.md
git commit -m "feat(skills): add pipeline/standalone routing to task-review mode, model-agnostic cross-model refs"
```

---

### Task 14: Commit vision and design changes, run tests

**Files:**
- Already modified: `docs/vision/pipeline-execute.md`, `docs/vision/pipeline.md`
- Already modified: `docs/plans/2026-03-27-execute-alignment-design.md`

**Step 1: Run wazir doctor**

Run: `wazir doctor --json`
Expected: all checks pass

**Step 2: Run schema tests**

Run: `node --test tooling/test/schema-examples.test.js`
Expected: all pass (including new schemas from tasks 1-2)

**Step 3: Run full test suite**

Run: `npm test`
Expected: all pass

**Step 4: Run full wazir validate suite**

Run: `wazir validate manifest && wazir validate hooks && wazir validate docs && wazir validate brand`
Expected: all pass. This plan changes roles, workflows, skills, templates, and schemas — full validation catches cross-file drift.

**Step 5: Commit vision and design changes**

```bash
git add docs/vision/pipeline-execute.md docs/vision/pipeline.md docs/plans/2026-03-27-execute-alignment-design.md docs/plans/2026-03-27-execute-alignment.md
git commit -m "docs(vision): add 11 implementation-proven patterns to execute vision, update design and impl plans"
```

---

## Task Order and Dependencies

```
Tasks 1-9 (all parallel)          ─── all independent: schemas, templates, roles, composition-map,
                                      review-loop-pattern are doc/schema creation with cross-references
                                      by path only — no build dependencies
                                    │
Task 10 (workflows/execute.md)    ─── depends on all above (references roles, schemas, templates, review-loop)
Task 13 (skills/reviewer/SKILL)   ─── depends on Task 9 (review-loop) — can parallel with Task 10
                                    │
Task 11 (skills/executor/SKILL)   ─── depends on Task 10 (references workflow)
                                    │
Task 12 (templates/phases)        ─── depends on Task 11 (references skill)
                                    │
Task 14 (tests + vision commit)   ─── depends on all above
```

**Execution order:** Tasks 1-9 (parallel) → Tasks 10, 13 (parallel) → Task 11 → Task 12 → Task 14
