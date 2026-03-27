# Completion Pipeline: Vision-Implementation Alignment

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align all implementation files (skills, roles, workflows, reference docs) with the updated completion pipeline vision in `docs/vision/pipeline-complete.md` and `docs/vision/pipeline.md`.

**Architecture:** All edits are to Markdown files — no code changes. The vision describes an 8-stage completion pipeline; the implementation currently has a flat 3-sub-phase final review. This plan restructures implementation docs bottom-up: reference doc → roles → workflows → skills. Each task targets 1-2 files with exact edit locations.

**Tech Stack:** Markdown only. Git for commits.

**Scope boundary:** This plan aligns doc/skill/role/workflow/template files with the vision. Runtime enforcement changes (bootstrap-gate.js write-guard during targeted fixes, phase-report.schema.json SHIP disposition, gating-rules.yaml CRITICAL precedence, agent.js severity routing) are tracked separately as implementation bugs — they require code changes, not doc alignment.

---

## Gap Analysis

| # | Gap | Vision Says | Implementation Has | Severity |
|---|-----|-------------|-------------------|----------|
| 1 | No Integration Verification | Stage 1: full suite on merged main + plan-defined criteria + side effects | Phase 4 jumps straight to `wz:reviewer --mode final` | HIGH |
| 2 | No Concern Resolution | Stage 2: fresh agent, sycophancy guard, residuals intake, 4 evaluation questions | Nothing | HIGH |
| 3 | Final Review is 1 pass | 2+1 passes (internal → fixes → cross-model → conditional reconciliation) | "always 7 dims, 1 pass" | HIGH |
| 4 | Finding severity mismatch | CRITICAL/HIGH/MEDIUM/LOW with per-level responses | blocking/warning/note | MEDIUM |
| 5 | No targeted fix batching | Batch by severity tier between passes | Per-finding fix cycle | MEDIUM |
| 6 | No exit criteria precedence | Single unresolved CRITICAL blocks SHIP regardless of score | Score-based verdicts only | HIGH |
| 7 | Drift ground truth wrong | "Implementation vs Original Input" | "does the implementation match the approved plan?" | MEDIUM |
| 8 | Learn missing inputs | User corrections, adoption rates, quality delta, model calibration, review effectiveness | Has 4-stage lifecycle but missing these signals | MEDIUM |
| 9 | Roles missing inputs | Reviewer: concerns + residuals + integration. Learner: user corrections | Neither role lists these | LOW |
| 10 | Wazir Phase 4 flat | 8 completion stages | 3 sub-phases (review, learn, prepare_next) | HIGH |
| 11 | No reasoning capture during completion | Two-layer reasoning per completion stage | Generic reasoning section, no completion-specific moments | MEDIUM |
| 12 | No user interaction constraints | Autonomous + 2 exceptions (drift, unresolvable concern) | Generic interaction mode awareness | MEDIUM |
| 13 | Prepare-next missing vision fields | Two modes (complete/incomplete) with specific fields | Flat handoff template | MEDIUM |
| 14 | Phase checklist stale | 5 items (integration, concerns, review, learn, prepare) | 3 items (review, learn, prepare) | HIGH |
| 15 | Prepare-next skill stale | Two modes, vision fields | Single handoff.md with old structure | HIGH |
| 16 | Phase 4 interaction contradicts vision | Autonomous with 2 exceptions | AskUserQuestion at every verdict | HIGH |
| 17 | Plan artifact path inconsistency | `plan/plan.md` in vision | `.wazir/runs/latest/clarified/execution-plan.md` in implementation | MEDIUM |

---

## Task Dependency Order

```
Task 1 (review-loop-pattern.md) ─┐
Task 2 (roles/reviewer.md) ──────┤
Task 3 (roles/learner.md) ────────┤─── Can run in parallel (different files)
Task 4 (workflows/review.md) ─────┤
Task 5 (workflows/learn.md) ──────┤
Task 5b (workflows/prepare-next.md) ─┘
Task 6 (skills/reviewer/SKILL.md) ──── After Tasks 1, 2, 4 (depends on reference + role + workflow)
Task 6b (skills/prepare-next/SKILL.md) ──── After Task 5b (depends on workflow)
Task 7 (skills/wazir/SKILL.md) ──── After Tasks 6, 6b (pipeline runner references both skills)
Task 7b (templates/phases/final_review.md) ──── After Task 7 (checklist reflects final structure)
Task 8 (commit) ──── After all tasks
```

**Batch 1** (parallel): Tasks 1, 2, 3, 4, 5, 5b
**Batch 2** (sequential): Task 6 → Task 6b → Task 7 → Task 7b
**Batch 3**: Task 8 (commit)

---

## Batch 1 — Foundation Layer (parallel, different files)

### Task 1: Fix review-loop-pattern.md — Final Review Structure + Drift Ground Truth

**Files:**
- Modify: `docs/reference/review-loop-pattern.md`

**Gaps addressed:** #3 (1 pass → 2+1), #7 (drift ground truth)

**Step 1: Fix the Per-Depth Coverage Contract table**

In `docs/reference/review-loop-pattern.md`, find the row that says final review is "always 7 dims, 1 pass" (around line 351-355):

```markdown
| Quick | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | always 7 dims, 1 pass |
| Standard | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | always 7 dims, 1 pass |
| Deep | dims 1-6, 7 passes | dims 1-5, 7 passes | dims 1-6, 7 passes | dims 1-5, 7 passes | dims 1-8, 7 passes | dims 1-5, 7 passes | always 7 dims, 1 pass |
```

Replace the final column description AND the paragraph below:

```markdown
| Quick | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | always 7 dims, 2+1 passes |
| Standard | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | always 7 dims, 2+1 passes |
| Deep | dims 1-6, 7 passes | dims 1-5, 7 passes | dims 1-6, 7 passes | dims 1-5, 7 passes | dims 1-8, 7 passes | dims 1-5, 7 passes | always 7 dims, 2+1 passes |
```

Replace the paragraph after the table (around line 355):

Old:
```markdown
Pass counts are FIXED per depth. Quick = 3 passes, standard = 5 passes, deep = 7 passes. No extension. No early-exit. Final review is always a single scored pass across all 7 dimensions -- it is a gate, not a loop.
```

New:
```markdown
Pass counts are FIXED per depth. Quick = 3 passes, standard = 5 passes, deep = 7 passes. No extension. No early-exit. Final review uses a different structure: 2 mandatory passes (Pass 1 internal + Pass 2 cross-model) with a conditional 3rd pass for reconciliation when Passes 1 and 2 have conflicting CRITICAL or HIGH findings. All 3 passes cover all 7 dimensions. This is not a fix loop — it is a multi-perspective compliance audit. See `docs/vision/pipeline-complete.md` Stages 3-6 for the full structure.
```

**Step 2: Fix drift dimension ground truth**

In the Final Review Dimensions section (around line 331-342), find:

```markdown
5. **Drift** -- does the implementation match the approved plan?
```

Replace with:

```markdown
5. **Drift** -- does the implementation match what the user originally asked for? (ground truth = original input, not approved plan — Vision Principle 16)
```

**Step 3: Add Completion Pipeline Review section**

After the "Per-Depth Coverage Contract" section (after the paragraph fixed in Step 1), add a new section:

```markdown
---

## Completion Pipeline: Final Review Structure

The final review follows a different structure from all other review modes. While other modes use the standard review loop (fix-and-re-review for N passes), the final review is a **multi-perspective compliance audit** with targeted fixes between passes.

### Structure: 2 + Conditional 3rd Pass

| Pass | Agent | Inputs | Purpose |
|------|-------|--------|---------|
| **Pass 1: Internal** | Expertise-loaded (Composer: `always.reviewer` + `reviewer_modes.final` + stack antipatterns) | All inputs including concern resolution output | Dual comparison: implementation vs plan (bidirectional) + implementation vs original input (telephone game check) |
| **Targeted Fixes** | Fix executors batched by severity tier | CRITICAL findings → one executor, HIGH → another | Batching prevents "Death of a Thousand Round Trips" anti-pattern |
| **Pass 2: Cross-Model** | Different model family, fresh session | Deterministic inputs only (no Pass 1 LLM findings) | Independent review. Facts help, opinions contaminate. |
| **Pass 3: Reconciliation** | Fresh agent (conditional) | Both pass outputs | Runs ONLY if Passes 1-2 have conflicting CRITICAL/HIGH findings |

### Finding Severity (Final Review Specific)

Final review uses a 4-level severity scale (not the blocking/warning/note scale used in other modes):

| Severity | Meaning | Response |
|----------|---------|----------|
| CRITICAL | Implementation contradicts spec or original input | Targeted fix or escalate to user |
| HIGH | Significant drift or integration gap | Targeted fix |
| MEDIUM | Minor drift or quality gap | Document, fix if cheap (≤10 lines) |
| LOW | Style or convention divergence | Document for learning only |

### Exit Criteria

**Precedence rule**: a single unresolved CRITICAL finding prevents SHIP regardless of score. Blocking findings take precedence over score thresholds.

- All CRITICAL findings resolved (including CRITICAL residuals from execution)
- All HIGH findings resolved or explicitly accepted by user
- MEDIUM/LOW documented in learning system
- Every spec requirement has implementation evidence
- Cross-model reviewer has no unresolved CRITICAL/HIGH
- Sign-off: SHIP / SHIP WITH CAVEATS / DO NOT SHIP

### Prerequisites (Before Final Review)

Final review requires two completion stages to run first:

1. **Integration Verification** (Stage 1): full test/lint/typecheck/build on merged main + plan-defined integration criteria + side effects verification
2. **Concern Resolution** (Stage 2): fresh agent evaluates concern registry + residuals + batch-boundary disposition. Sycophancy guard: generating agent MUST NOT rebut concerns.

See `docs/vision/pipeline-complete.md` for full stage definitions.
```

**Step 4: Verify changes**

Read `docs/reference/review-loop-pattern.md` and confirm:
- Final review column says "2+1 passes" in all depth rows
- Drift dimension references original input
- New completion pipeline section is present
- No contradictions with `docs/vision/pipeline-complete.md`

**Step 5: Commit**

```bash
git add docs/reference/review-loop-pattern.md
git commit -m "fix(review-loop): align final review with vision — 2+1 passes, drift ground truth, completion pipeline structure"
```

---

### Task 2: Update roles/reviewer.md — Add Completion Pipeline Inputs

**Files:**
- Modify: `roles/reviewer.md`

**Gaps addressed:** #9 (missing inputs)

**Step 1: Update inputs**

Find:
```markdown
## Inputs

- original user input (`.wazir/input/briefing.md` + any `input/*.md` files) — ground truth for every review mode
- changed files (for task-review and final modes)
- approved spec and plan (for task-review and final modes)
- verification evidence (for final mode)
- phase-specific artifact (for all other modes)
```

Replace with:
```markdown
## Inputs

- original user input (`.wazir/input/briefing.md` + any `input/*.md` files) — ground truth for every review mode
- changed files (for task-review and final modes)
- approved spec and plan (for task-review and final modes)
- verification evidence (for final mode)
- phase-specific artifact (for all other modes)
- concern resolution output (for final mode — concern registry + residuals disposition from Stage 2)
- integration verification results (for final mode — test/lint/typecheck/build results from Stage 1)
- all `analysis-findings.json` files (for final mode — deterministic analysis from execution + merged)
```

**Step 2: Add sycophancy guard to purpose**

Find:
```markdown
## Purpose

Perform adversarial review to find correctness, scope, wiring, verification, and drift failures. Owns all review loops: research-review, clarification-review, spec-challenge, architectural-design-review, visual-design-review, plan-review, task-review, and final review.
```

Replace with:
```markdown
## Purpose

Perform adversarial review to find correctness, scope, wiring, verification, and drift failures. Owns all review loops: research-review, clarification-review, spec-challenge, architectural-design-review, visual-design-review, plan-review, task-review, and final review.

In concern resolution (completion Stage 2): the generating agent MUST NOT rebut or respond to reviewer concerns. Models abandon correct answers 98% of the time when challenged. If a concern is contested, route to human — not to agent debate.
```

**Step 3: Add final review structure to failure conditions**

Find:
```markdown
## Failure Conditions

- vague findings
- uncited criticism
- rubber-stamp approval
```

Replace with:
```markdown
## Failure Conditions

- vague findings
- uncited criticism
- rubber-stamp approval
- final review: unresolved CRITICAL finding shipped (precedence rule violation)
- concern resolution: generating agent rebutted concerns (sycophancy guard violation)
```

**Step 4: Verify and commit**

```bash
git add roles/reviewer.md
git commit -m "fix(reviewer): add completion pipeline inputs, sycophancy guard, failure conditions"
```

---

### Task 3: Update roles/learner.md — Add Vision Signal Types

**Files:**
- Modify: `roles/learner.md`

**Gaps addressed:** #8 (missing inputs), #9 (role contract)

**Step 1: Update inputs**

Find:
```markdown
## Inputs

- run artifacts
- review findings
- verification evidence
```

Replace with:
```markdown
## Inputs

- run artifacts
- review findings (all passes, all tiers — including per-subtask and final review)
- verification evidence
- user corrections (approvals, rejections, redirects, scope changes from `user-input-log.ndjson`) — highest-priority learning signal
- concern registry and resolutions (final disposition from completion Stage 2)
- residuals and their disposition
- model performance data (success/failure per tier per complexity)
- timing data (bottlenecks per phase)
```

**Step 2: Update required outputs**

Find:
```markdown
## Required Outputs

- proposed learning artifacts
- experiment summaries
- confidence and scope metadata
```

Replace with:
```markdown
## Required Outputs

- proposed learning artifacts with impact scoring (HIGH/MEDIUM/LOW)
- experiment summaries
- confidence and scope metadata
- finding adoption rate (proportion of findings that led to code changes, per pass, per severity, per source)
- quality delta (per-dimension first-pass vs final-state scores)
- review effectiveness metrics (detection rate per pass, per source)
- model tier calibration data (empirical tier → performance mapping)
- expertise proposals (concrete updates to antipatterns, composition-map, quality modules)
```

**Step 3: Verify and commit**

```bash
git add roles/learner.md
git commit -m "fix(learner): add user corrections, adoption rate, quality delta, model calibration outputs"
```

---

### Task 4: Update workflows/review.md — Add Completion Prerequisites

**Files:**
- Modify: `workflows/review.md`

**Gaps addressed:** #1 (no integration verification), #2 (no concern resolution), #6 (no exit criteria)

**Step 1: Update inputs**

Find:
```markdown
## Inputs

- changed files
- verification proof
- approved spec and plan
- design artifact (when design phase was used)
```

Replace with:
```markdown
## Inputs

- changed files
- verification proof
- approved spec and plan
- design artifact (when design phase was used)
- original user input (ground truth — `.wazir/input/briefing.md` + `input/*.md`)
- concern resolution output (concern registry + residuals disposition from completion Stage 2)
- integration verification results (test/lint/typecheck/build on merged main from completion Stage 1)
- all `analysis-findings.json` files (deterministic analysis — per-subtask + merged)
- all `proof.json` files (verification evidence from execution)
```

**Step 2: Add completion prerequisites section**

After the `## Approval Gate` section, add:

```markdown
## Completion Pipeline Prerequisites

The final review (`--mode final`) requires two upstream completion stages before it runs:

### Stage 1: Integration Verification
Full verification suite on merged main. Two sources:
1. Plan-defined integration criteria from the execution plan (`.wazir/runs/latest/clarified/execution-plan.md`)
2. Standard suite: tests, type checking, lint, build, deterministic analysis

Side effects verification: all declared external side effects from subtask specs must be completed or compensated. Undeclared side effects are CRITICAL findings.

### Stage 2: Concern Resolution
Fresh agent (NOT the producer) evaluates:
1. Concern registry (all DONE_WITH_CONCERNS entries from execution)
2. Residuals (all `residuals-<subtask-id>.md` from execution)
3. Batch-boundary disposition

Sycophancy guard: generating agent MUST NOT rebut concerns during this stage.
```

**Step 3: Update approval gate**

Find:
```markdown
## Approval Gate

- unresolved blocking findings must stop completion
```

Replace with:
```markdown
## Approval Gate

- unresolved blocking findings must stop completion
- **precedence rule**: a single unresolved CRITICAL finding prevents SHIP regardless of any other signal (score, pass count, other findings)
- all HIGH findings must be resolved or explicitly accepted by user
- cross-model reviewer must have no unresolved CRITICAL/HIGH
- sign-off: SHIP / SHIP WITH CAVEATS / DO NOT SHIP
```

**Step 4: Verify and commit**

```bash
git add workflows/review.md
git commit -m "fix(review-workflow): add completion prerequisites, exit criteria, precedence rule"
```

---

### Task 5: Update workflows/learn.md — Add Vision Signal Types

**Files:**
- Modify: `workflows/learn.md`

**Gaps addressed:** #8 (missing learn inputs)

**Step 1: Update inputs**

Find:
```markdown
## Inputs

- run artifacts
- review findings (all passes, all tiers)
- verification proof
```

Replace with:
```markdown
## Inputs

- run artifacts
- review findings (all passes, all tiers — per-subtask + final review)
- verification proof
- user corrections (`user-input-log.ndjson` — approvals, rejections, redirects, scope changes). User corrections are the highest-priority learning signal — they represent direct evidence of where the pipeline diverged from user intent.
- concern registry, resolutions, and residuals disposition
- model performance data (success/failure per tier per complexity)
- timing data (bottlenecks per phase)
- merge issues (conflicts despite planning)
```

**Step 2: Add signal processing section**

After the `## Drift Prevention` section, add:

```markdown
## Signal Processing

Beyond the 4-stage lifecycle, the learning agent processes these additional signals:

### Finding Adoption Rate
Proportion of findings that led to actual code changes, tracked per pass, per severity, per source (internal/Codex/Gemini). Detection rate alone is a vanity metric — a pass generating 50 findings with 10% adoption is worse than 8 findings with 87% adoption.

### Quality Delta
Per-dimension scores at first review pass vs final state. Dimensions that consistently improve 5+ points during review indicate executor weaknesses — feed into expertise module proposals targeting those dimensions.

### Review Effectiveness
Which pass found what. Detection rate per pass, per source. Identifies whether internal review or cross-model review is providing more value.

### Model Tier Calibration
Empirical success/failure data per model tier per task complexity. Updates tier mapping configuration.

### User Corrections (Highest Priority)
User approvals, rejections, redirects, and scope changes captured during the run. A user rejection during clarification is stronger signal than 10 reviewer findings.
```

**Step 3: Update outputs**

Find:
```markdown
## Outputs

- Tallied findings in `finding_clusters` table
- Promoted candidates in `antipattern_candidates` table
- Proposed learning artifacts in `memory/learnings/proposed/`
- Cumulative findings appended to `memory/findings/cumulative-findings.md`
```

Replace with:
```markdown
## Outputs

- Tallied findings in `finding_clusters` table
- Promoted candidates in `antipattern_candidates` table
- Proposed learning artifacts in `memory/learnings/proposed/` with impact scoring (HIGH/MEDIUM/LOW)
- Cumulative findings appended to `memory/findings/cumulative-findings.md`
- Finding adoption rates (per pass, per severity, per source)
- Quality delta report (per-dimension first-pass vs final-state)
- Review effectiveness metrics (detection rate per pass)
- Model tier calibration data
- Expertise proposals (antipatterns, composition-map updates, quality modules, plan checklists)
```

**Step 4: Verify and commit**

```bash
git add workflows/learn.md
git commit -m "fix(learn-workflow): add user corrections, adoption rate, quality delta, model calibration"
```

---

### Task 5b: Update workflows/prepare-next.md — Vision-Aligned Contract

**Files:**
- Modify: `workflows/prepare-next.md`

**Gaps addressed:** #13 (missing vision fields), #15 (prepare-next stale)

**Step 1: Update inputs**

Find:
```markdown
## Inputs

- current run summary
- accepted learnings where explicitly enabled
```

Replace with:
```markdown
## Inputs

- current run summary
- accepted learnings where explicitly enabled
- concern registry and resolutions (final disposition)
- residuals and their disposition
- final review findings (per pass, with adoption rates)
- quality delta (per-dimension first-pass vs final-state)
- cost and timing data
```

**Step 2: Update outputs**

Find:
```markdown
## Outputs

- next-step handoff
- scoped context summary
```

Replace with:
```markdown
## Outputs

Two output modes:

### Mode 1: Run Complete
- `execution-summary.md` — what was built, verification summary, concerns/resolutions, findings per pass with adoption rates, residuals disposition, learning proposals, quality delta, cost/timing, SHIP/SHIP WITH CAVEATS/DO NOT SHIP recommendation

### Mode 2: Run Incomplete
- `handover-batch-N.md` — completed/in-progress/remaining subtask IDs, accumulated concerns, blocked subtasks with lifecycle states, partial learnings, environment state, resume prompt (~500 tokens)
```

**Step 3: Verify and commit**

```bash
git add workflows/prepare-next.md
git commit -m "fix(prepare-next-workflow): add vision inputs, two output modes"
```

---

## Batch 2 — Skill Layer (sequential, depends on Batch 1)

### Task 6: Restructure skills/reviewer/SKILL.md — Final Mode to 2+1 Passes

**Files:**
- Modify: `skills/reviewer/SKILL.md`

**Gaps addressed:** #1 (integration verification), #2 (concern resolution), #3 (2+1 passes), #4 (severity), #5 (fix batching), #6 (exit criteria)

This is the largest task. The reviewer skill needs a new section for the completion pipeline's final review structure. The key changes:

1. The existing "Review Process (`final` mode)" section needs restructuring
2. The existing "Two-Tier Review Flow" section stays for non-final modes
3. A new completion pipeline section describes the 2+1 pass structure for final mode

**Step 1: Update the Review Modes table**

In the Review Modes table (around line 48-58), update the `final` row:

Old:
```markdown
| `final` | After execution + verification | Completed task artifacts, approved spec/plan/design, original input | 7 final-review dims, scored 0-70 | Scored verdict (PASS/FAIL) |
```

New:
```markdown
| `final` | After integration verification + concern resolution | All completion inputs (see Completion Pipeline section) | 7 final-review dims, 2+1 passes, scored 0-70 | Scored verdict with severity-based exit criteria (SHIP/SHIP WITH CAVEATS/DO NOT SHIP) |
```

**Step 2: Update Reviewer-owned responsibilities**

Find item 3 in the reviewer-owned responsibilities (around line 39):

Old:
```markdown
3. **Pass counting** — the reviewer tracks pass numbers and enforces the depth-based cap (quick=3, standard=5, deep=7)
```

New:
```markdown
3. **Pass counting** — the reviewer tracks pass numbers and enforces the depth-based cap (quick=3, standard=5, deep=7). Final mode uses a different structure: 2+1 passes (see Completion Pipeline section).
```

**Step 3: Replace the "Review Process (`final` mode)" section**

Find the entire section starting with `## Review Process (\`final\` mode)` (around line 109) through the end of the scoring table (around line 148). Replace with:

```markdown
## Review Process (`final` mode) — Completion Pipeline

**The final review is not another code review — it is a compliance audit with fix authority.**

The full completion pipeline runs three stages before and during the final review. The reviewer skill orchestrates all three.

### Integration Verification (Vision Stage 1)

Before any review pass, run the full verification suite on merged main:

1. **Plan-defined integration criteria**: run the exact commands specified in `.wazir/runs/latest/clarified/execution-plan.md` under "Integration verification criteria"
2. **Standard suite**: test suite, type checking, lint, build, and full deterministic analysis scan
3. **Side effects verification**: check all declared external side effects from subtask specs were completed or compensated. Undeclared side effects discovered here are CRITICAL findings.

If integration fails: identify the culprit via sequential merge record (re-run checks after each individual merge). Targeted fix executor receives failing output + acceptance criteria + merged code.

Save results to `.wazir/runs/latest/completion/integration/`.

### Concern Resolution (Vision Stage 2)

A fresh agent — one that did NOT produce any of the artifacts being evaluated — reads:

1. **Concern registry**: all DONE_WITH_CONCERNS entries from execution
2. **Residuals**: all `residuals-<subtask-id>.md` files from execution (findings that exhausted the 7-spawn subtask loop)
3. **Batch-boundary disposition**: concerns from final batch + cross-subtask systemic patterns

For each concern and residual, four questions:
1. Is the concern still valid? (Some become moot after later subtasks.)
2. Was the resolution acceptable? (Full implementation may change the picture.)
3. Does it map to a spec requirement? (If yes, cannot be dismissed as trade-off.)
4. Is it systemic? (3+ occurrences across subtasks = planning gap.)

**Principle: concerns are innocent until proven acceptable.** Burden of proof is on the resolution.

**Sycophancy guard**: the generating agent MUST NOT rebut or respond to reviewer concerns during this stage. Models abandon correct answers 98% of the time when challenged. If a concern is contested, route to human — not to agent debate.

Save results to `.wazir/runs/latest/completion/concerns/`.

### Final Review — 2+1 Passes (Vision Stages 3-6)

**Before starting, output to the user:**

> **Final Review** — About to run 2+1 pass compliance audit comparing your implementation against the original input. Pass 1: expertise-loaded internal review. Pass 2: cross-model fresh-context review. Pass 3 (conditional): reconciliation if passes disagree.
>
> **Why this matters:** Without this, implementation drift ships undetected. Per-task review confirms each task matches its spec, but cannot catch: tasks that collectively miss the original intent, scope creep, or acceptance criteria rewritten to match implementation.

#### Pass 1: Internal Review (Expertise-Loaded)

Composer-built prompt with `always.reviewer` + `reviewer_modes.final` + stack antipatterns + auto modules.

**Input:** All completion inputs — merged implementation, approved plan, approved spec, original user input, concern resolution output, all `proof.json` files, integration results, all `analysis-findings.json` files.

**Dual comparison:**
1. **Implementation vs Plan** (bidirectional): does each plan item have implementation? Are there files the plan didn't mention? Plan items with no code? Code no plan item requested?
2. **Implementation vs Original Input**: the telephone game check. Would the user recognize this as what they asked for? Drift measured from the source across all transformations.

**Three additional dimensions:**
3. **Concern & residual resolutions**: re-examine every resolution from Stage 2
4. **Verification evidence quality**: are tests meaningful or tautological? Every acceptance criterion covered by proof?
5. **Integration completeness**: do cross-subtask interfaces match? Data flow correct between modules?

Score each of the 7 canonical dimensions 0-10. Total out of 70. Additionally classify each finding by severity (CRITICAL/HIGH/MEDIUM/LOW).

Save to `.wazir/runs/latest/completion/final-review/pass-1-internal.md`.

#### Finding Severity (Final Review Specific)

| Severity | Meaning | Response |
|----------|---------|----------|
| CRITICAL | Implementation contradicts spec or original input | Targeted fix or escalate to user |
| HIGH | Significant drift or integration gap | Targeted fix |
| MEDIUM | Minor drift or quality gap | Document, fix if ≤10 lines |
| LOW | Style or convention divergence | Document for learning only |

#### Targeted Fixes (Between Passes 1 and 2)

- **CRITICAL/HIGH code issues** → fix executor batched by severity tier. All CRITICAL findings to one executor, all HIGH to another. Each executor receives all findings of its tier + relevant files + violated criteria. Batching prevents the "Death of a Thousand Round Trips" anti-pattern.
- **CRITICAL/HIGH drift** → escalate to user (pipeline can't decide user intent)
- **MEDIUM** → fix if ≤10 lines, otherwise document
- **LOW** → document only (regression risk exceeds value)

After fixes: commit, re-run integration verification (Stage 1). Fixed state becomes input for Pass 2.

**Finding adoption tracking**: after targeted fixes, record which findings led to code changes vs documented vs ignored. Write to `.wazir/runs/latest/completion/final-review/finding-adoption.md`. This is the learner's source data for adoption rate metrics — without it, the learning system has no way to measure review effectiveness.

#### Pass 2: Cross-Model Review (Fresh Session, Different Family)

Different model family from Pass 1. Selection priority:
1. Different vendor, highest tier (maximizes blind spot diversity)
2. Same vendor, different generation
3. Same vendor, same tier (last resort — still a fresh context)

**Input:** Deterministic inputs + concern resolution output — merged implementation, plan, spec, original input, `proof.json` files, integration results, `analysis-findings.json` files, concern resolution output. Pass 2 does NOT receive Pass 1's LLM-generated findings. Deterministic findings reduce hallucinations 60-80%. Prior LLM opinions cause self-conditioning. Note: concern resolution output is included despite being LLM-generated because it is a neutral evaluation by a fresh agent (not the producer's self-assessment) — the vision explicitly includes it in Pass 2's inputs.

Independent review. Same dual comparison (implementation vs plan vs original input). Also reviews concern resolutions and verification evidence independently.

If Codex/Gemini CLI is the cross-model tool: invoked via Bash in a fresh subagent session. Falls back to same-model fresh-context review if external tools unavailable.

Save to `.wazir/runs/latest/completion/final-review/pass-2-cross-model.md`.

#### Pass 3: Reconciliation (Conditional)

Runs ONLY if Passes 1 and 2 have conflicting CRITICAL or HIGH findings — one pass flagged an issue the other did not, or they disagree on severity/resolution.

A fresh agent reads both pass outputs and reconciles:
- **Both found it** → confirmed finding
- **Only one found it** → evaluate with code evidence. If substantiated, confirmed. If not, downgrade or remove.
- **Conflicting assessments** → escalate to user with both rationales

If Passes 1 and 2 agree (no conflicting CRITICAL/HIGH): skip Pass 3, merge findings with deduplication.

Save to `.wazir/runs/latest/completion/final-review/pass-3-reconciliation.md` (if run).

### Scoring and Exit Criteria

Score each dimension 0-10. Total out of 70. Same verdict thresholds:

| Verdict | Score | Action |
|---------|-------|--------|
| **PASS** | 56+ | Ready for SHIP sign-off |
| **NEEDS MINOR FIXES** | 42-55 | Auto-fix and re-review |
| **NEEDS REWORK** | 28-41 | Re-run affected tasks |
| **FAIL** | 0-27 | Fundamental issues |

**Verdict-to-sign-off mapping:** Score verdicts (PASS/NEEDS FIXES/etc.) determine the *next action*. Sign-off labels (SHIP/SHIP WITH CAVEATS/DO NOT SHIP) are the *final disposition* after all actions are complete. PASS with no remaining findings → SHIP. PASS with accepted MEDIUM/LOW findings → SHIP WITH CAVEATS. NEEDS REWORK or FAIL after all passes exhausted → DO NOT SHIP.

**Precedence rule**: a single unresolved CRITICAL finding prevents SHIP regardless of score. When score and blocking findings disagree, blocking findings win.

Full exit criteria:
- All CRITICAL findings resolved (including CRITICAL residuals from execution)
- All HIGH findings resolved or explicitly accepted by user
- MEDIUM/LOW documented in learning system
- Every spec requirement has implementation evidence
- No undetected drift (or drift explicitly approved)
- Cross-model reviewer has no unresolved CRITICAL/HIGH

If not met after Pass 3 (or Pass 2 when Pass 3 skipped): escalate to user with full finding history.
```

**Step 4: Update the Two-Tier Review Flow applicability**

Add a note at the top of the "Two-Tier Review Flow" section (around line 149) to clarify it applies to non-final modes:

Find:
```markdown
## Two-Tier Review Flow

The review process has two tiers. Internal review catches ~80% of issues quickly and cheaply. Codex review provides fresh eyes on clean code.
```

Replace with:
```markdown
## Two-Tier Review Flow (Non-Final Modes)

The review process for non-final modes has two tiers. Internal review catches ~80% of issues quickly and cheaply. Codex review provides fresh eyes on clean code.

**Note:** Final mode uses the Completion Pipeline structure above (2+1 passes), not this two-tier flow. The two-tier flow applies to: task-review, spec-challenge, architectural-design-review, visual-design-review, plan-review, research-review, and clarification-review modes.
```

**Step 5: Update the Output section for final mode severity**

Find (around line 274-279):
```markdown
## Output

Save review results to `.wazir/runs/latest/reviews/review.md` with:
- Findings with severity (blocking, warning, note)
```

Replace with:
```markdown
## Output

Save review results to `.wazir/runs/latest/reviews/review.md` (non-final modes) or `.wazir/runs/latest/completion/final-review/` (final mode) with:
- Findings with severity: blocking/warning/note (non-final modes) or CRITICAL/HIGH/MEDIUM/LOW (final mode)
```

**Step 6: Update the Post-Review: Prepare Next section**

Find (around line 415-453) the "Post-Review: Prepare Next (final mode only)" section. Update to reflect vision's two modes:

Find:
```markdown
## Post-Review: Prepare Next (final mode only)

After learning extraction, invoke the `prepare-next` skill to prepare the handoff:

### Handoff document

Write to `.wazir/runs/<run-id>/handoff.md`:
```

Replace with:
```markdown
## Post-Review: Prepare Next (final mode only)

After learning extraction (completion Stage 7), prepare the session handoff. This corresponds to completion pipeline Stage 8 in `docs/vision/pipeline-complete.md`.

### Mode 1: Run Complete

Produces `.wazir/runs/<run-id>/execution-summary.md`:
- What was built (linked to spec requirements, status per requirement)
- Verification summary (tests, coverage, pass/fail)
- Concerns and resolutions (final disposition)
- Final review findings and resolution (per pass, with adoption rates)
- Residuals from execution and their final disposition
- Learning proposals (count by impact, pointer to full file)
- Quality delta (per-dimension first-pass vs final-state scores)
- Cost and timing data
- Recommendation: SHIP / SHIP WITH CAVEATS / DO NOT SHIP

### Mode 2: Run Incomplete

Produces `.wazir/runs/<run-id>/handover-batch-N.md`:
```

Then update the handoff template fields to include:
- Accumulated concerns from DONE_WITH_CONCERNS subtasks pending resolution
- Blocked subtasks with reasons and current lifecycle state
- Partial learnings discovered during this batch
- Environment state (active branches, worktrees)
- Resume prompt (~500 tokens, self-contained)

**Step 7: Add reasoning capture to completion stages**

After the "Post-Review: Prepare Next" section, add:

```markdown
## Completion Reasoning Capture

Every completion stage produces reasoning at two layers, consistent with the pre-execution pipeline's reasoning capture pattern:

**Conversation layer**: before each stage, state the trigger and what it checks. After each stage, state what was found and the counterfactual — what would have shipped without this stage.

**File layer**: structured entries written to `.wazir/runs/<id>/reasoning/phase-completion-reasoning.md` per decision:
- **Trigger** — what prompted the decision
- **Options considered** — alternatives evaluated
- **Chosen** — selected option
- **Reasoning** — why
- **Confidence** — high/medium/low
- **Counterfactual** — what would go wrong without this

Key completion reasoning moments: severity assignments, SHIP/DO NOT SHIP decisions, concern resolution dispositions, reconciliation verdicts, and learning proposal priorities.
```

**Step 8: Add user interaction constraints during completion**

After the "Completion Reasoning Capture" section, add:

```markdown
## User Interaction During Completion

Completion is autonomous with exactly two exceptions:
1. **Drift escalation**: implementation doesn't match what user asked for (CRITICAL/HIGH drift finding)
2. **Unresolvable concern**: requires spec/design change (concern maps to spec requirement but resolution is unacceptable)

Pipeline pauses, presents evidence, waits. User's decision is final. All other completion stages run without user interaction.
```

**Step 9: Update the Post-Review: Learn section**

The existing learn section (around line 345-413) references "After the final review verdict" — update to reference completion pipeline:

Find:
```markdown
## Post-Review: Learn (final mode only)

After the final review verdict, extract durable learnings using the **learner role** (`roles/learner.md`).
```

Replace with:
```markdown
## Post-Review: Learn (final mode only)

After the final review verdict (completion Stage 3 exit), extract durable learnings using the **learner role** (`roles/learner.md`). This corresponds to completion pipeline Stage 7 (Apply Learning) in `docs/vision/pipeline-complete.md`.

The learning agent receives ALL signals from the run — not just review findings. See `roles/learner.md` for the full input list including user corrections (highest-priority signal), adoption rates, and quality deltas.
```

**Step 10: Verify and commit**

Read the full modified `skills/reviewer/SKILL.md` and verify:
- Final mode table row updated
- Completion Pipeline section present with integration verification, concern resolution, 2+1 passes
- Two-Tier Review Flow scoped to non-final modes
- Output section references both severity systems
- Prepare Next section has two modes (complete/incomplete) matching vision
- Reasoning capture section present with completion-specific moments
- User interaction constraints present (autonomous + 2 exceptions)
- Learn section references completion pipeline
- No contradictions with `docs/vision/pipeline-complete.md`

```bash
git add skills/reviewer/SKILL.md
git commit -m "feat(reviewer): restructure final mode — 2+1 passes, completion pipeline stages, severity-based exit criteria"
```

---

### Task 6b: Update skills/prepare-next/SKILL.md — Two-Mode Handoff

**Files:**
- Modify: `skills/prepare-next/SKILL.md`

**Gaps addressed:** #13 (prepare-next missing vision fields), #15 (prepare-next skill stale)

**Step 1: Update "When to Run" to match vision modes**

Find:
```markdown
## When to Run

One of:

1. **Full completion** — All 4 phases are done, review is accepted, learnings are proposed. Prepare the next feature's starting point.
2. **Partial completion** — The session is ending before the pipeline finishes. Prepare a mid-pipeline handoff so the next session can resume.
3. **Slice boundary** — The approved plan is being executed in multiple slices. Prepare the handoff between slices.
```

Replace with:
```markdown
## When to Run

This skill corresponds to completion pipeline Stage 8 (Prepare Next Session) in `docs/vision/pipeline-complete.md`.

One of two modes:

1. **Run Complete** — All completion stages passed, sign-off is SHIP or SHIP WITH CAVEATS. Produce `execution-summary.md`.
2. **Run Incomplete** — Session ending before pipeline finishes, or slice boundary. Produce `handover-batch-N.md`.
```

**Step 2: Update Step 1 (Gather Run State) to include completion outputs**

Find:
```markdown
## Step 1: Gather Run State

Read from the current run directory:

- `run-config.yaml` — run identity, intent, depth
- `reviews/review.md` — final review verdict and score (if complete)
- `reviews/` — all review pass logs
- `artifacts/` — task completion evidence
- `clarified/` — spec, design, plan artifacts
- Git log since branch creation: `git log --oneline main..HEAD`
```

Replace with:
```markdown
## Step 1: Gather Run State

Read from the current run directory:

- `run-config.yaml` — run identity, intent, depth
- `completion/final-review/` — all pass reports (pass-1-internal.md, pass-2-cross-model.md, pass-3-reconciliation.md if exists)
- `completion/final-review/finding-adoption.md` — which findings led to code changes
- `completion/concerns/` — concern resolution output
- `completion/integration/` — integration verification results
- `reviews/` — all per-task review pass logs
- `artifacts/` — task completion evidence
- `clarified/` — spec, design, plan artifacts
- `user-input-log.ndjson` — user corrections (for learning proposals section)
- Git log since branch creation: `git log --oneline main..HEAD`
```

**Step 3: Replace Step 2 handoff template with two-mode structure**

Find the entire Step 2 section starting with `## Step 2: Write Handoff` through the closing code fence of the handoff template. Replace with:

```markdown
## Step 2: Write Output

### Mode 1: Run Complete → `execution-summary.md`

Write to `.wazir/runs/<run-id>/execution-summary.md`:

```markdown
# Execution Summary — <run-id>

**Status:** Complete
**Branch:** <branch-name>
**Date:** YYYY-MM-DD
**Sign-off:** SHIP / SHIP WITH CAVEATS / DO NOT SHIP

## What Was Built
[Linked to spec requirements, status per requirement]

## Verification Summary
[Tests: N pass / N fail. Type errors: N. Lint errors: N. Coverage: N%]

## Concerns and Resolutions
[Final disposition of each concern from completion Stage 2]

## Final Review Findings
[Per pass: Pass 1 (internal) — N findings. Pass 2 (cross-model) — N findings. Pass 3 (reconciliation) — ran/skipped.]
[Finding adoption rate: X% of findings led to code changes]

## Residuals
[Residuals from execution and their final disposition]

## Learning Proposals
[Count by impact (HIGH/MEDIUM/LOW), pointer to memory/learnings/proposed/]

## Quality Delta
[Per-dimension first-pass vs final-state scores]

## Cost and Timing
[Token usage, wall-clock time per phase]

## Commits
[git log --oneline of all commits in this run]
```

### Mode 2: Run Incomplete → `handover-batch-N.md`

Write to `.wazir/runs/<run-id>/handover-batch-N.md`:

```markdown
# Handover — <run-id> Batch N

**Status:** Incomplete
**Branch:** <branch-name>
**Date:** YYYY-MM-DD

## Subtask Status
[Completed / in-progress / remaining subtask IDs with status and lifecycle state]

## Accumulated Concerns
[DONE_WITH_CONCERNS entries pending resolution]

## Blocked Subtasks
[Subtask IDs with reasons and lifecycle state (abandoned, upstream_failed, waiting_on_user)]

## Partial Learnings
[Learnings discovered during this batch]

## Environment State
[Active branches, worktrees, provisioned runtime isolation]

## Resume Prompt
[~500 tokens, self-contained, references files for depth]
```
```

**Step 4: Verify and commit**

```bash
git add skills/prepare-next/SKILL.md
git commit -m "feat(prepare-next): two-mode handoff — execution-summary.md and handover-batch-N.md with vision fields"
```

---

### Task 7: Update skills/wazir/SKILL.md — Phase 4 Restructure

**Files:**
- Modify: `skills/wazir/SKILL.md`

**Gaps addressed:** #10 (flat Phase 4), #16 (interaction contradicts vision)

**Step 1: Update the pipeline phase table**

Find (around line 53-58):
```markdown
| **Final Review** | Review vs original input, learn, prepare next | `wz:reviewer` | Verdict + learnings + handoff |
```

Replace with:
```markdown
| **Final Review** | Integration verification, concern resolution, 2+1 pass review, learn, prepare next | `wz:reviewer` | Verdict + learnings + handoff |
```

**Step 2: Update the two-level phase model**

Find (around line 407-412):
```markdown
Phase 4: Final Review
  ├── review (final) ← scored review
  ├── learn
  └── prepare_next
```

Replace with:
```markdown
Phase 4: Final Review (Completion Pipeline)
  ├── integration-verify ← full suite on merged main
  ├── concern-resolve ← fresh agent, sycophancy guard
  ├── review (final) ← 2+1 pass compliance audit
  ├── learn ← adoption rates, quality delta, user corrections
  └── prepare_next
```

**Step 3: Restructure Phase 4 section**

Find the Phase 4 section (around line 566-636). Replace the sub-phases:

Old:
```markdown
### 4a: Review (reviewer role in final mode)

Invoke `wz:reviewer --mode final`.
7-dimension scored review comparing implementation against the original user input.
Score 0-70. Verdicts: PASS (56+), NEEDS MINOR FIXES (42-55), NEEDS REWORK (28-41), FAIL (0-27).

### 4b: Learn (learner role)

Extract durable learnings from the completed run:
- Scan all review findings (internal + Codex)
- Propose learnings to `memory/learnings/proposed/`
- Findings that recur across 2+ runs → auto-proposed as learnings
- Learnings require explicit scope tags (roles, stacks, concerns)

### 4c: Prepare Next (planner role)

Prepare context and handoff for the next run:
- Write handoff document
- Compress/archive unneeded files
- Record what's left to do
```

New:
```markdown
### 4a: Integration Verification

Full verification suite on merged main before any review:
1. Run plan-defined integration criteria from the execution plan
2. Run standard suite: tests, type checking, lint, build, deterministic analysis
3. Verify all declared external side effects were completed or compensated

If integration fails: identify culprit via sequential merge record. Targeted fix executor receives failing output + acceptance criteria.

### 4b: Concern Resolution

A fresh agent (NOT the executor or any producing agent) evaluates:
1. Concern registry — all DONE_WITH_CONCERNS entries from execution
2. Residuals — all `residuals-<subtask-id>.md` files
3. Batch-boundary disposition — concerns from final batch + cross-subtask patterns

**Sycophancy guard**: generating agent MUST NOT rebut concerns. Route contested concerns to human.

### 4c: Review (reviewer role in final mode)

Invoke `wz:reviewer --mode final`.
2+1 pass compliance audit comparing implementation against the original user input:
- Pass 1: Internal expertise-loaded review (7 dims, scored 0-70)
- Targeted fixes between passes (batched by severity tier)
- Pass 2: Cross-model review (fresh session, deterministic inputs only)
- Pass 3: Reconciliation (conditional — only if passes 1-2 have conflicting CRITICAL/HIGH)

**Exit criteria**: single unresolved CRITICAL blocks SHIP regardless of score.
Score verdicts: PASS (56+), NEEDS MINOR FIXES (42-55), NEEDS REWORK (28-41), FAIL (0-27).
Final sign-off (after all actions): SHIP / SHIP WITH CAVEATS / DO NOT SHIP.

### 4d: Learn (learner role)

Extract durable learnings from the completed run:
- Scan all review findings (all passes, internal + cross-model)
- Process user corrections as highest-priority signal
- Track finding adoption rates (per pass, per severity, per source)
- Calculate quality delta (per-dimension first-pass vs final-state)
- Propose learnings to `memory/learnings/proposed/` with impact scoring
- Learnings require explicit scope tags (roles, stacks, concerns)

### 4e: Prepare Next (planner role)

Prepare context and handoff for the next run:
- Write `execution-summary.md` (complete) or `handover-batch-N.md` (incomplete)
- Include: concerns and resolutions, residuals disposition, quality delta, finding adoption rates
- Record SHIP / SHIP WITH CAVEATS / DO NOT SHIP recommendation
- Compress/archive unneeded files
```

**Step 4: Update the "After completing this phase" output**

Find (around line 617-625):
```markdown
> **Final Review Phase complete.**
>
> **Found:** [N] findings across 7 dimensions, [N] blocking issues, [N] warnings, [N] learnings proposed for future runs
>
> **Without this phase:** Implementation drift from the original request would ship undetected, untested paths would hide production bugs, and recurring mistakes would never get captured as learnings
>
> **Changed because of this work:** [List of findings fixed, score achieved, learnings extracted, handoff prepared]
```

Replace with:
```markdown
> **Final Review Phase complete (Completion Pipeline).**
>
> **Integration verification:** [PASS/FAIL] — [N] tests, [N] type errors, [N] lint errors
> **Concern resolution:** [N] concerns evaluated, [N] residuals resolved, [N] escalated
> **Final review (2+1 passes):** [N] findings — [N] CRITICAL, [N] HIGH, [N] MEDIUM, [N] LOW. Score: [score]/70.
> **Pass 3 reconciliation:** [ran/skipped] — [reason]
> **Learnings:** [N] proposed (adoption rate: [X]%, quality delta: [Y] points average)
>
> **Without this phase:** Implementation drift would ship undetected, concerns would accumulate without resolution, cross-subtask integration bugs would hide, and recurring mistakes would never get captured
>
> **Changed because of this work:** [List of findings fixed per pass, score improvement, learnings extracted, handoff prepared]
```

**Step 5: Update Phase 4 interaction model — autonomous with 2 exceptions**

The vision says completion is autonomous with exactly two exceptions (drift escalation, unresolvable concern). The current wazir skill has AskUserQuestion at every verdict (PASS, NEEDS MINOR FIXES, NEEDS REWORK, FAIL). Replace the entire Step 6: Present Results section for Phase 4 with:

Find the section starting with `## Step 5: CHANGELOG + Gitflow Validation` through all the verdict options (PASS, NEEDS MINOR FIXES, NEEDS REWORK, FAIL, Run Summary). Replace with:

```markdown
## Step 5: CHANGELOG + Gitflow Validation (Hard Gates)

Before presenting results:

```bash
wazir validate changelog --require-entries --base main
wazir validate commits --base main
```

Both must pass before PR. These are not warnings.

## Step 6: Present Results

Completion is **autonomous** — the pipeline presents its sign-off and proceeds. User interaction happens only for two exceptions:

### Autonomous Sign-Off

Present the completion pipeline results:

> **Completion Pipeline Results**
>
> **Integration verification:** [PASS/FAIL]
> **Concern resolution:** [N] concerns, [N] residuals
> **Final review (2+1 passes):** Score [score]/70 — [N] CRITICAL, [N] HIGH, [N] MEDIUM, [N] LOW
> **Sign-off:** [SHIP / SHIP WITH CAVEATS / DO NOT SHIP]
>
> **Learnings:** [N] proposed. **Handoff:** `.wazir/runs/<run-id>/execution-summary.md`

If SHIP or SHIP WITH CAVEATS: proceed to create PR automatically.

If DO NOT SHIP: present findings and stop.

### Exception 1: Drift Escalation

If any CRITICAL or HIGH drift finding exists (implementation doesn't match what user asked for):

> **Drift detected — user decision required.**
>
> [List drift findings with evidence]

Ask the user via AskUserQuestion:
- **Question:** "Implementation drift detected. How should we proceed?"
- **Options:**
  1. "Accept the drift"
  2. "Fix and re-review"
  3. "Abort the run"

### Exception 2: Unresolvable Concern

If a concern maps to a spec requirement but the resolution is unacceptable (requires spec/design change):

> **Unresolvable concern — user decision required.**
>
> [Concern details, spec requirement it maps to, why resolution failed]

Ask the user via AskUserQuestion:
- **Question:** "This concern requires a spec change to resolve. How should we proceed?"
- **Options:**
  1. "Accept as-is with caveat"
  2. "Modify spec and re-run affected tasks"
  3. "Abort the run"

### CRITICAL Precedence

Even if score is 56+, a single unresolved CRITICAL finding overrides to DO NOT SHIP. Present the CRITICAL finding(s) and stop.
```

**Note:** The existing error handling section (around line 710) can remain as-is — it covers phase-level failures, not verdict interaction.

**Step 6: Verify and commit**

Read the full modified Phase 4 section and verify:
- 5 sub-phases (4a-4e) present
- Integration verification before review
- Concern resolution with sycophancy guard
- 2+1 pass structure referenced
- Exit criteria with precedence rule
- Learn section includes all vision signals
- Prepare next includes vision outputs

```bash
git add skills/wazir/SKILL.md
git commit -m "feat(wazir): restructure Phase 4 — 5-stage completion pipeline with integration, concerns, 2+1 review"
```

---

### Task 7b: Update templates/phases/final_review.md — Completion Pipeline Checklist

**Files:**
- Modify: `templates/phases/final_review.md`

**Gaps addressed:** #14 (phase checklist stale)

**Step 1: Replace the checklist**

Find:
```markdown
## Phase: final_review
- [ ] Use `Skill(wz:reviewer)` — run 7-dimension scored review against original input
- [ ] Address review findings (fix Critical and Important issues)
- [ ] Run `npm test` — all tests still pass after fixes
- [ ] Extract learnings to `memory/learnings/proposed/`
- [ ] Prepare handoff document
- [ ] Run `wazir capture event --run <id> --event phase_exit --phase final_review --status completed` <!-- transition -->
```

Replace with:
```markdown
## Phase: final_review (Completion Pipeline)
- [ ] Run integration verification on merged main (tests, typecheck, lint, build, plan-defined criteria) <!-- 4a -->
- [ ] Verify all declared external side effects completed or compensated <!-- 4a -->
- [ ] Run concern resolution — fresh agent evaluates concern registry + residuals <!-- 4b -->
- [ ] Use `Skill(wz:reviewer)` — run 2+1 pass compliance audit against original input <!-- 4c -->
- [ ] Address CRITICAL/HIGH findings via targeted fix executors (batched by severity tier) <!-- 4c -->
- [ ] Run `npm test` — all tests still pass after fixes <!-- 4c -->
- [ ] Extract learnings with adoption rates, quality delta, user corrections <!-- 4d -->
- [ ] Prepare execution-summary.md or handover-batch-N.md <!-- 4e -->
- [ ] Run `wazir capture event --run <id> --event phase_exit --phase final_review --status completed` <!-- transition -->
```

**Step 2: Verify and commit**

```bash
git add templates/phases/final_review.md
git commit -m "fix(template): update final_review checklist — 5-stage completion pipeline"
```

---

## Batch 3 — Final Commit

### Task 8: Squash-Merge Verification

**Step 1: Run tests**

```bash
cd /Users/mohamedabdallah/Work/Wazir && npm test
```

**Step 2: Verify all modified files**

Read each modified file and spot-check:
- `docs/reference/review-loop-pattern.md` — 2+1 in table, drift references original input, completion section exists
- `roles/reviewer.md` — completion inputs, sycophancy guard, failure conditions
- `roles/learner.md` — user corrections, adoption rate, quality delta
- `workflows/review.md` — completion prerequisites, exit criteria, precedence rule
- `workflows/learn.md` — user corrections, adoption rate, quality delta, signal processing
- `workflows/prepare-next.md` — two output modes, vision-aligned inputs
- `skills/reviewer/SKILL.md` — completion stages, 2+1 passes, severity levels, fix batching, exit criteria, reasoning capture, user interaction constraints
- `skills/prepare-next/SKILL.md` — two-mode handoff, vision fields
- `skills/wazir/SKILL.md` — 5 sub-phases (4a-4e), autonomous interaction with 2 exceptions
- `templates/phases/final_review.md` — 9 checklist items covering all 5 sub-phases

**Step 3: Cross-reference with vision**

For each vision stage in `docs/vision/pipeline-complete.md`, verify at least one implementation file covers it:

| Vision Stage | Implementation Coverage |
|-------------|----------------------|
| Stage 1: Integration Verification | `skills/reviewer/SKILL.md` (Stage 1), `skills/wazir/SKILL.md` (4a), `workflows/review.md` (prereqs) |
| Stage 2: Concern Resolution | `skills/reviewer/SKILL.md` (Stage 2), `skills/wazir/SKILL.md` (4b), `roles/reviewer.md` (sycophancy guard) |
| Stages 3-6: Final Review (2+1) | `skills/reviewer/SKILL.md` (Stage 3), `docs/reference/review-loop-pattern.md` (completion section) |
| Stage 7: Apply Learning | `skills/wazir/SKILL.md` (4d), `workflows/learn.md`, `roles/learner.md` |
| Stage 8: Prepare Next | `skills/wazir/SKILL.md` (4e), `skills/prepare-next/SKILL.md`, `workflows/prepare-next.md` |

## Known Out-of-Scope Gaps (Runtime Enforcement)

These require code changes and are tracked separately from this doc-alignment plan:

| Gap | File | What's Needed |
|-----|------|--------------|
| Bootstrap gate blocks writes during final_review targeted fixes | `tooling/src/hooks/bootstrap-gate.js` | Add exception for targeted-fix sub-stage or run fixes before phase transition |
| Phase report schema lacks SHIP disposition | `schemas/phase-report.schema.json` | Add `ship`/`ship_with_caveats`/`do_not_ship` to verdict enum |
| Gating rules don't know CRITICAL precedence | `config/gating-rules.yaml`, `tooling/src/gating/agent.js` | Add CRITICAL severity routing |
| Manifest doesn't register new workflows | `wazir.manifest.yaml` | Add `integration-verify`, `concern-resolve` (or treat as stages within `review` workflow) |

**Step 4: Final commit (if individual commits were made per task)**

If using a single commit instead of per-task commits:

```bash
git add docs/reference/review-loop-pattern.md roles/reviewer.md roles/learner.md workflows/review.md workflows/learn.md skills/reviewer/SKILL.md skills/wazir/SKILL.md
git commit -m "feat(completion): align implementation with vision — 2+1 passes, integration verification, concern resolution, severity-based exit criteria"
```
