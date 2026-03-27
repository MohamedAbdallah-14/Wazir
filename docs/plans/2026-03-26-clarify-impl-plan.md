# Clarify Phase: Implementation Alignment

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align implementation files with the updated pre-execution pipeline vision (10 tasks, 3 batches).

**Architecture:** All edits are to Markdown skill/workflow/role files. No code changes. Each task is a self-contained edit to 1-2 files with exact old/new text. Batch 1 (5 tasks: Tasks 1→2→3 sequential, then 4+8 parallel). Batch 2 (3 tasks: 5, 6, 7) sequential after Batch 1. Batch 3 (2 tasks: 9, 10) deferred to a future session.

**Tech Stack:** Markdown only. Git for commits.

---

## Batch 1 — Sequential start, then parallel (Tasks 1→2→3 sequential, then 4+8 parallel)

Tasks 1, 2, 3 must be sequential (overlapping edits to `skills/reviewer/SKILL.md` and `skills/clarifier/SKILL.md`). After Task 3, Tasks 4 and 8 can run in parallel (different files or non-overlapping sections).

### Task 1: Checkpoint gating per interaction_mode

**Files:**
- Modify: `skills/clarifier/SKILL.md:90-103` (Research checkpoint)
- Modify: `skills/clarifier/SKILL.md:181-194` (Clarification checkpoint)
- Modify: `skills/clarifier/SKILL.md:241-254` (Spec hardening checkpoint)
- Modify: `skills/clarifier/SKILL.md:274-297` (Design approval checkpoint)
- Modify: `skills/clarifier/SKILL.md:329-343` (Plan review checkpoint)

**Context:** The vision defines three interaction modes (auto/guided/interactive) with a per-phase checkpoint table in `docs/vision/pipeline-clarify.md:8-19`. Currently all 5 `AskUserQuestion` checkpoints fire unconditionally. Each checkpoint needs mode-aware behavior. The two boundary gates (pre-exec->exec, exec->complete) are in the `/wazir` main skill, NOT here.

**Step 0: Update the global pacing rule**

In `skills/clarifier/SKILL.md`, find:

```markdown
**Pacing rule:** This skill has mandatory user checkpoints between sub-workflows. Do NOT skip checkpoints. Do NOT combine sub-workflows. Complete each fully, present output, and wait for explicit user approval before advancing.
```

Replace with:

```markdown
**Pacing rule:** This skill has checkpoints between sub-workflows. Checkpoint behavior depends on `interaction_mode` (see Interaction Mode Behavior below). In `interactive` mode, all checkpoints pause. In `guided` mode, only Clarify and Design pause. In `auto` mode, no checkpoints pause — the gating agent handles decisions. Do NOT combine sub-workflows regardless of mode. Complete each fully before advancing.
```

**Step 1: Add interaction_mode to Prerequisites**

In `skills/clarifier/SKILL.md`, find:

```markdown
4. Read `depth` from `run-config.yaml`. Read `multi_tool` from `.wazir/state/config.json`.
```

Replace with:

```markdown
4. Read `depth` from `run-config.yaml`. Read `multi_tool` from `.wazir/state/config.json`.
5. Read `interaction_mode` from `run-config.yaml` (values: `auto`, `guided`, `interactive`; default: `guided`).
```

Then renumber the existing steps. Find:

```markdown
5. **Load accepted learnings:** Glob `memory/learnings/accepted/*.md`. For each accepted learning, read scope tags. Inject learnings whose scope matches the current run's intent/stack into context. Limit: top 10 by confidence, most recent first. This is how prior run insights improve future runs.
6. Create a run directory if one doesn't exist:
```

Replace with:

```markdown
6. **Load accepted learnings:** Glob `memory/learnings/accepted/*.md`. For each accepted learning, read scope tags. Inject learnings whose scope matches the current run's intent/stack into context. Limit: top 10 by confidence, most recent first. This is how prior run insights improve future runs.
7. Create a run directory if one doesn't exist:
```

**Step 2: Add Interaction Mode Reference section**

After the renumbered Prerequisites step 7 (Create a run directory) and before `## Context-Mode Usage`, insert:

```markdown
## Interaction Mode Behavior

Checkpoints are conditional on `interaction_mode`:

| Sub-Workflow | Auto | Guided | Interactive |
|--------------|------|--------|-------------|
| SW1: Research | skip | skip | **PAUSE** — present research findings |
| SW2: Clarify | gating agent answers | **PAUSE** | **PAUSE** — pair-program the clarification |
| SW3: Spec Harden | skip | skip | **PAUSE** — walk through spec changes |
| SW3a: Visual Design | skip | skip | **PAUSE** — heavy collaboration (if enabled) |
| SW4: Brainstorm | gating agent picks | **PAUSE** | **PAUSE** — co-design approach |
| SW5: Plan | skip | skip | **PAUSE** — walk through plan |

**Auto**: gating agent (external reviewer) handles Clarify/Design decisions. Escalates to human only on loop cap exceeded or "not doable."
**Guided**: 2 interaction points (Clarify + Design) + boundary gates between pipeline parts.
**Interactive**: pair-programmer — stops between sub-phases, discusses findings, co-designs decisions.

---
```

**Step 3: Wrap Research checkpoint (SW1)**

In `skills/clarifier/SKILL.md`, find the Research checkpoint section (around line 90):

```markdown
### Checkpoint: Research Review

> **Research complete. Here's what I found:**
>
> [Summary of codebase state, relevant architecture, external context]

Ask the user via AskUserQuestion:
- **Question:** "Does the research look complete and accurate?"
- **Options:**
  1. "Looks good, continue" *(Recommended)*
  2. "Missing context — let me add more information"
  3. "Wrong direction — let me clarify the intent"

Wait for the user's selection before continuing.
```

Replace with:

```markdown
### Checkpoint: Research Review

**Mode gate:** This checkpoint pauses only in `interactive` mode. In `auto` and `guided` modes, research flows directly to the next sub-workflow.

**If `interaction_mode == interactive`:**

> **Research complete. Here's what I found:**
>
> [Summary of codebase state, relevant architecture, external context]

Ask the user via AskUserQuestion:
- **Question:** "Does the research look complete and accurate?"
- **Options:**
  1. "Looks good, continue" *(Recommended)*
  2. "Missing context — let me add more information"
  3. "Wrong direction — let me clarify the intent"

Wait for the user's selection before continuing.

**If `interaction_mode == auto` or `guided`:** Log research summary to reasoning file and continue.

**All modes:** If research reveals the request is impossible, contradictory, or fundamentally wrong approach — present evidence and stop before proceeding to questions. This is not a checkpoint; it's a guard. In `auto` mode, escalate to the gating agent. In `guided`/`interactive`, present to the user.
```

**Step 4: Wrap Clarification checkpoint (SW2)**

Find the Clarification checkpoint section (around line 181):

```markdown
### Checkpoint: Clarification Review

> **Here's the clarified scope:**
>
> [Full clarification]

Ask the user via AskUserQuestion:
- **Question:** "Does the clarified scope accurately capture what you want to build?"
- **Options:**
  1. "Approved — continue to spec hardening" *(Recommended)*
  2. "Needs changes — let me provide corrections"
  3. "Missing important context — let me add information"

Wait for the user's selection before continuing. Route feedback: plan corrections → `user-feedback.md`, new requirements → `briefing.md`.
```

Replace with:

```markdown
### Checkpoint: Clarification Review

**Mode gate:** This checkpoint pauses in `guided` and `interactive` modes. In `auto` mode, the gating agent evaluates the clarification.

**If `interaction_mode == interactive` or `guided`:**

> **Here's the clarified scope:**
>
> [Full clarification]

Ask the user via AskUserQuestion:
- **Question:** "Does the clarified scope accurately capture what you want to build?"
- **Options:**
  1. "Approved — continue to spec hardening" *(Recommended)*
  2. "Needs changes — let me provide corrections"
  3. "Missing important context — let me add information"

Wait for the user's selection before continuing. Route feedback: plan corrections → `user-feedback.md`, new requirements → `briefing.md`.

**If `interaction_mode == auto`:** Submit clarification artifact to gating agent. If gating agent approves, continue. If gating agent requests changes, loop. If gating agent escalates, present to user.
```

**Step 5: Wrap Spec Hardening checkpoint (SW3)**

Find the Spec Hardening checkpoint section (around line 241):

```markdown
### Checkpoint: Hardened Spec Review

> **Spec hardened. Changes made:**
>
> [List of gaps found and how they were tightened]

Ask the user via AskUserQuestion:
- **Question:** "Are the spec hardening changes acceptable?"
- **Options:**
  1. "Approved — continue to brainstorming" *(Recommended)*
  2. "Disagree with a change — let me specify"
  3. "Found more gaps — let me add"

Wait for the user's selection before continuing.
```

Replace with:

```markdown
### Checkpoint: Hardened Spec Review

**Mode gate:** This checkpoint pauses only in `interactive` mode. In `auto` and `guided` modes, the hardened spec flows directly to the next sub-workflow.

**If `interaction_mode == interactive`:**

> **Spec hardened. Changes made:**
>
> [List of gaps found and how they were tightened]

Ask the user via AskUserQuestion:
- **Question:** "Are the spec hardening changes acceptable?"
- **Options:**
  1. "Approved — continue to brainstorming" *(Recommended)*
  2. "Disagree with a change — let me specify"
  3. "Found more gaps — let me add"

Wait for the user's selection before continuing.

**If `interaction_mode == auto` or `guided`:** Log spec hardening summary to reasoning file and continue.
```

**Step 6: Wrap Design Approval checkpoint (SW4)**

Find the Design Approval checkpoint section (around line 274):

```markdown
### Checkpoint: Design Approval

Ask the user via AskUserQuestion:
- **Question:** "Which design approach should we implement?"
- **Options:**
  1. "Approach A — [one-line summary]" *(Recommended)*
  2. "Approach B — [one-line summary]"
  3. "Approach C — [one-line summary]"
  4. "Modify an approach — let me specify changes"

Wait for the user's selection before continuing. This is the most important checkpoint.
```

Replace with:

```markdown
### Checkpoint: Design Approval

**Mode gate:** This checkpoint pauses in `guided` and `interactive` modes. In `auto` mode, the gating agent selects the approach.

**If `interaction_mode == interactive` or `guided`:**

Ask the user via AskUserQuestion:
- **Question:** "Which design approach should we implement?"
- **Options:**
  1. "Approach A — [one-line summary]" *(Recommended)*
  2. "Approach B — [one-line summary]"
  3. "Approach C — [one-line summary]"
  4. "Modify an approach — let me specify changes"

Wait for the user's selection before continuing. This is the most important checkpoint.

**If `interaction_mode == auto`:** Submit all approaches with trade-offs to gating agent. Gating agent selects one or escalates to user.
```

**Step 7: Wrap Plan Review checkpoint (SW5)**

Find the Plan Review checkpoint section (around line 329):

```markdown
### Checkpoint: Plan Review

> **Implementation plan: [N] tasks**
>
> | # | Task | Complexity | Dependencies | Description |
> |---|------|-----------|--------------|-------------|

Ask the user via AskUserQuestion:
- **Question:** "Does the implementation plan look correct and complete?"
- **Options:**
  1. "Approved — ready for execution" *(Recommended)*
  2. "Reorder or split tasks"
  3. "Missing tasks"
  4. "Too granular / too coarse"

Wait for the user's selection before continuing.
```

Replace with:

```markdown
### Checkpoint: Plan Review

**Mode gate:** This checkpoint pauses only in `interactive` mode. In `auto` and `guided` modes, the plan flows to the scope coverage gate and then to execution.

**If `interaction_mode == interactive`:**

> **Implementation plan: [N] tasks**
>
> | # | Task | Complexity | Dependencies | Description |
> |---|------|-----------|--------------|-------------|

Ask the user via AskUserQuestion:
- **Question:** "Does the implementation plan look correct and complete?"
- **Options:**
  1. "Approved — ready for execution" *(Recommended)*
  2. "Reorder or split tasks"
  3. "Missing tasks"
  4. "Too granular / too coarse"

Wait for the user's selection before continuing.

**If `interaction_mode == auto` or `guided`:** Log plan summary to reasoning file. Proceed to scope coverage gate.
```

**Step 8: Verify and commit**

Run: `grep -c "Mode gate" skills/clarifier/SKILL.md`
Expected: `5` (one per checkpoint)

Run: `grep -c "interaction_mode" skills/clarifier/SKILL.md`
Expected: at least `12` (prereqs + table + 5 checkpoints with if/else)

```bash
git add skills/clarifier/SKILL.md
git commit -m "feat(clarifier): add checkpoint gating per interaction_mode

Wrap all 5 AskUserQuestion checkpoints with mode-conditional behavior:
- auto: skip or route to gating agent
- guided: pause at Clarify + Design only
- interactive: pause at all 5

Aligns with vision pipeline-clarify.md interaction mode table."
```

---

### Task 2: Brainstorming uses architectural-design-review mode

**Files:**
- Modify: `skills/brainstorming/SKILL.md:48`
- Modify: `skills/clarifier/SKILL.md:298` (design-review reference)
- Modify: `skills/reviewer/SKILL.md:14,31` (model annotation + ownership text)
- Modify: `workflows/design-review.md:1-50` (purpose + loop structure)
- Modify: `workflows/design.md:36-38` (review mode reference)

**Context:** The vision splits design-review into two dimension sets: architectural (6 dims, for Phase 5 DESIGN) and visual (5 dims, for Phase 4a VISUAL DESIGN). Currently `brainstorming/SKILL.md` uses `--mode design-review` which maps to the visual dimensions. It should use `--mode architectural-design-review`. The `design.md` workflow (pencil MCP visual design) keeps `--mode visual-design-review`. The `design-review.md` workflow needs to describe both modes.

**Step 1: Update brainstorming skill**

In `skills/brainstorming/SKILL.md`, find:

```markdown
6. After user approves the design concept, the reviewer role runs the design-review loop with `--mode design-review` using canonical design-review dimensions (spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity). See `workflows/design-review.md` and `docs/reference/review-loop-pattern.md`. The designer resolves any findings. If the design-review loop completes all passes clean, hand off to `wz:writing-plans`. Planning does not start until design-review is complete.
```

Replace with:

```markdown
6. After user approves the design concept, the reviewer role runs the design-review loop with `--mode architectural-design-review` using the 6 architectural design-review dimensions (feasibility, spec alignment, completeness, trade-off documentation, YAGNI, security/performance). See `workflows/design-review.md` and `docs/reference/review-loop-pattern.md`. The designer resolves any findings. If the design-review loop completes all passes clean, hand off to `wz:writing-plans`. Planning does not start until design-review is complete.
```

**Step 2: Update brainstorming skill — clarifier reference**

In `skills/clarifier/SKILL.md`, find:

```markdown
After approval: design-review loop with `--mode design-review` (5 canonical dimensions: spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity).
```

Replace with:

```markdown
After approval: design-review loop with `--mode architectural-design-review` (6 architectural dimensions: feasibility, spec alignment, completeness, trade-off documentation, YAGNI, security/performance). See `docs/reference/review-loop-pattern.md` for the full dimension set.
```

**Step 3: Update design-review.md workflow**

Replace the entire content of `workflows/design-review.md` with:

```markdown
# design-review

## Purpose

Validate design artifacts against the approved spec. Supports two review modes with different dimension sets:

- **`architectural-design-review`** — validates implementation approach selection (Phase 5 DESIGN). Used after brainstorming.
- **`visual-design-review`** — validates visual design artifacts from pencil MCP (Phase 4a VISUAL DESIGN). Used after collaborative visual design, when enabled.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

### architectural-design-review
- design artifact (implementation approaches with trade-offs)
- approved spec artifact
- original user input (`briefing.md`)

### visual-design-review
- visual design artifact (`.fig` + exported code + tokens + screenshots)
- author artifact (if content-author workflow ran)
- approved spec artifact
- accessibility guidelines
- original user input (`briefing.md`)

## Primary Role

- `reviewer`

## Outputs

- design review findings with severity
- no-findings verdict when applicable

## Approval Gate

- unresolved blocking findings must stop progression to planning

## Gate decision

On approval: `wazir capture event --run <run-id> --event gate_approved --phase <phase-name>`
On rejection: `wazir capture event --run <run-id> --event gate_rejected --phase <phase-name> --message "<reason>"`

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Loop Structure

Follows the review loop pattern in `docs/reference/review-loop-pattern.md`.

**architectural-design-review:** 6 dimensions (feasibility, spec alignment, completeness, trade-off documentation, YAGNI, security/performance). The designer role resolves findings. Pass count determined by depth. No extension.

**visual-design-review:** 5 dimensions (spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity). The designer role resolves findings. Only runs when Phase 4a VISUAL DESIGN is active. Pass count determined by depth. No extension.

## Failure Conditions

- vague findings without evidence
- rubber-stamp approval without checking dimensions
- design drift from spec not flagged
- (visual only) accessibility issues not flagged
```

**Step 4: Update design.md workflow review reference**

In `workflows/design.md`, find:

```markdown
After user approval, design artifact is reviewed via the design-review workflow (`workflows/design-review.md`) using the review loop pattern with the canonical design-review dimensions (spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity). The reviewer is invoked with `--mode design-review`. Design does not flow to planning until all review passes complete.
```

Replace with:

```markdown
After user approval, visual design artifact is reviewed via the design-review workflow (`workflows/design-review.md`) using the review loop pattern with the visual design-review dimensions (spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity). The reviewer is invoked with `--mode visual-design-review`. Design does not flow to planning until all review passes complete.
```

**Step 5: Update reviewer SKILL.md stale design-review references**

In `skills/reviewer/SKILL.md`, find:

```markdown
- **Opus** for design-review mode (design)
```

Replace with:

```markdown
- **Opus** for architectural-design-review mode (design)
- **Opus** for visual-design-review mode (visual design)
```

In `skills/reviewer/SKILL.md`, find:

```markdown
The reviewer role owns all review loops across the pipeline: research-review, clarification-review, spec-challenge, design-review, plan-review, per-task execution review, and final review. Each uses phase-specific dimensions from `docs/reference/review-loop-pattern.md`.
```

Replace with:

```markdown
The reviewer role owns all review loops across the pipeline: research-review, clarification-review, spec-challenge, architectural-design-review, visual-design-review, plan-review, per-task execution review, and final review. Each uses phase-specific dimensions from `docs/reference/review-loop-pattern.md`.
```

**Step 6: Verify and commit**

Run: `grep -r "architectural-design-review" skills/ workflows/ docs/reference/`
Expected: hits in `brainstorming/SKILL.md`, `clarifier/SKILL.md`, `reviewer/SKILL.md`, `design-review.md`, `review-loop-pattern.md`

Run: `grep -r "\-\-mode design-review" skills/ workflows/`
Expected: 0 hits (old mode name should be gone — replaced by `architectural-design-review` or `visual-design-review`)

```bash
git add skills/brainstorming/SKILL.md skills/clarifier/SKILL.md skills/reviewer/SKILL.md workflows/design-review.md workflows/design.md
git commit -m "feat(design-review): split into architectural and visual modes

- brainstorming now uses --mode architectural-design-review (6 dims)
- design.md (pencil MCP) now uses --mode visual-design-review (5 dims)
- design-review.md workflow updated with both modes and inputs
- removes ambiguous --mode design-review

Aligns with vision V-3: two design dimension sets."
```

---

### Task 3: Original input as reference passed to every review

**Files:**
- Modify: `roles/reviewer.md:7-11` (Inputs section)
- Modify: `skills/reviewer/SKILL.md:95-105` (per-mode prerequisites)
- Modify: `docs/reference/review-loop-pattern.md:67-69` (pseudocode signature)

**Context:** Vision Principle 16: "original user input is the only ground truth." The review mechanism says `review(artifact_path, checklist, original_input)`. But the reviewer role inputs don't list the original briefing, and the review-loop pseudocode doesn't pass it. The reviewer SKILL.md already mentions original input for `final` mode and `plan-review` mode, but NOT for `spec-challenge`, `design-review`, `research-review`, or `clarification-review`.

**Step 1: Update reviewer role inputs**

In `roles/reviewer.md`, find:

```markdown
## Inputs

- changed files
- approved spec and plan
- verification evidence
```

Replace with:

```markdown
## Inputs

- original user input (`.wazir/input/briefing.md` + any `input/*.md` files) — ground truth for every review mode
- changed files (for task-review and final modes)
- approved spec and plan (for task-review and final modes)
- verification evidence (for final mode)
- phase-specific artifact (for all other modes)
```

**Step 2: Update reviewer skill per-mode prerequisites**

In `skills/reviewer/SKILL.md`, find:

```markdown
### `spec-challenge`, `design-review`, `plan-review`, `research-review`, `clarification-review` modes
1. The appropriate input artifact for the mode exists.
2. Read `depth` from `run-config.yaml`. Read `.wazir/state/config.json` for `multi_tool` settings.
3. **`plan-review` additional dimension — Input Coverage:**
```

Replace with:

```markdown
### `spec-challenge`, `architectural-design-review`, `visual-design-review`, `plan-review`, `research-review`, `clarification-review` modes
1. The appropriate input artifact for the mode exists.
2. Read the original user input from `.wazir/input/briefing.md` and any `input/*.md` files. This is required for ALL review modes — it serves as the ground truth reference per Vision Principle 16.
3. Read `depth` from `run-config.yaml`. Read `.wazir/state/config.json` for `multi_tool` settings.
4. **`plan-review` additional dimension — Input Coverage:**
```

The indented bullet items under the old item 3 (`plan-review` additional dimension) now fall under item 4. No text change needed — they're indented bullets, not numbered sub-items.

**Step 3: Update review-loop pseudocode signature**

In `docs/reference/review-loop-pattern.md`, find:

```
review_loop(artifact_path, phase, dimensions[], depth, config, options={}):
```

Replace with:

```
review_loop(artifact_path, original_input_path, phase, dimensions[], depth, config, options={}):
```

And add a comment line after the options block:

```
  # original_input_path -- path to .wazir/input/briefing.md (ground truth for all reviews)
```

Also update the `self_review` call in the pseudocode body. Find:

```
    findings = self_review(artifact_path, focus=dimension, mode=options.mode)
```

Replace with:

```
    findings = self_review(artifact_path, original_input_path, focus=dimension, mode=options.mode)
```

**Step 4: Update reviewer skill mode table**

In `skills/reviewer/SKILL.md`, find the row:

```markdown
| `design-review` | After design approval | Design artifact, approved spec | 5 design-review dims (canonical) | Pass/fix loop, no score |
```

Replace with:

```markdown
| `architectural-design-review` | After architectural design approval (Phase 5) | Design artifact, approved spec, original input | 6 architectural design-review dims | Pass/fix loop, no score |
| `visual-design-review` | After visual design (Phase 4a, conditional) | Visual design artifact, approved spec, original input | 5 visual design-review dims | Pass/fix loop, no score |
```

Also update the other rows to include "original input" in Prerequisites:

Find: `| `spec-challenge` | After specify | Draft spec artifact |`
Replace: `| `spec-challenge` | After specify | Draft spec artifact, original input |`

Find: `| `research-review` | During discover | Research artifact |`
Replace: `| `research-review` | During discover | Research artifact, original input |`

Find: `| `clarification-review` | During clarify | Clarification artifact |`
Replace: `| `clarification-review` | During clarify | Clarification artifact, original input |`

Find: `| `plan-review` | After planning | Draft plan artifact |`
Replace: `| `plan-review` | After planning | Draft plan, approved spec, design artifact, original input |`

**Step 5: Verify and commit**

Run: `grep -c "original input" roles/reviewer.md`
Expected: at least `1`

Run: `grep -c "original_input" docs/reference/review-loop-pattern.md`
Expected: at least `2`

```bash
git add roles/reviewer.md skills/reviewer/SKILL.md docs/reference/review-loop-pattern.md
git commit -m "feat(reviewer): pass original input as reference to every review mode

- reviewer role inputs now list briefing.md as ground truth
- all review mode prerequisites require reading original input
- review-loop pseudocode signature includes original_input_path
- reviewer mode table updated with original input in prerequisites

Aligns with Vision Principle 16: original user input is the only ground truth."
```

---

### Task 4: Fix discover.md workflow inputs

**Files:**
- Modify: `workflows/discover.md:13-14`

**Context:** Vision says DISCOVER runs BEFORE clarification. The workflow currently says inputs are "clarified scope" which is wrong — clarification hasn't happened yet at this point.

**Step 1: Fix inputs**

In `workflows/discover.md`, find:

```markdown
## Inputs

- clarified scope
- explicit research questions
```

Replace with:

```markdown
## Inputs

- user briefing (`.wazir/input/briefing.md` + any `input/*.md` files)
- research questions extracted from briefing
```

**Step 2: Verify and commit**

Run: `grep "clarified scope" workflows/discover.md`
Expected: 0 hits

```bash
git add workflows/discover.md
git commit -m "fix(discover): correct inputs — user briefing, not clarified scope

DISCOVER runs before CLARIFY, so its input is the raw user briefing
and research questions extracted from it, not clarified scope.

Aligns with vision P-5: research-first hard rule."
```

---

## Batch 2 — Sequential (after Batch 1 completes)

### Task 5: Visual design triage question during CLARIFY

**Files:**
- Modify: `skills/clarifier/SKILL.md` (within the Clarification sub-workflow, after question batching)

**Context:** Vision `pipeline-clarify.md` lines 51-57 require the clarifier to ask the user whether the project needs visual design. Three options. If user picks "collaborative visual design" but isn't in interactive mode, enforce the mode requirement. Currently no mechanism exists.

**Step 1: Add visual design question**

In `skills/clarifier/SKILL.md`, after the question batching section and before "### Clarification Production", insert:

```markdown
### Visual Design Triage (after question batching)

During clarification, determine whether the project needs visual design artifacts. Ask the user:

**Design tool detection:** Before asking, check if pencil MCP or equivalent design tools are available. Option 2 (collaborative) is only offered if design tools are detected.

**Mode gate:** In `auto` mode, this question goes to the gating agent. In `guided` and `interactive` modes, ask the user.

**Question:** "Does this project need visual design?"
**Options:**
1. **No visual design** — no UI work (API, CLI, backend, library). Proceed directly to clarification production.
2. **Collaborative visual design** — co-design with pencil MCP or equivalent tools. Triggers the VISUAL DESIGN sub-phase (Phase 4a). Requires interactive mode. *(Only shown if design tools detected.)*
3. **Design from references** — you provide existing designs (Figma links, screenshots, sketches) as input. Pipeline works from those without a visual design sub-phase.

**If the user selects option 2 but `interaction_mode` is not `interactive`:**

> Collaborative visual design requires interactive mode. Switch to interactive, or pick another option.

**In `auto` mode:** Gating agent evaluates — defaults to option 1 (no visual design) unless input explicitly references UI/visual work.

Set `workflow_policy.visual_design.enabled` and `workflow_policy.visual_design.mode` in the run config based on the answer.
```

**Step 2: Verify and commit**

Run: `grep -c "Visual Design Triage" skills/clarifier/SKILL.md`
Expected: `1`

```bash
git add skills/clarifier/SKILL.md
git commit -m "feat(clarifier): add visual design triage question during CLARIFY

Three options: no visual design, collaborative (pencil MCP, interactive
only), or design from references. Enforces interactive mode requirement
for collaborative visual design.

Aligns with vision pipeline-clarify.md lines 51-57."
```

---

### Task 6: Content-author ordering with visual design

**Files:**
- Modify: `skills/clarifier/SKILL.md` (Content-Author Detection section, around line 227-240)

**Context:** Content-author detection exists but ordering vs visual design isn't explicit. Vision says: REVIEW(spec) -> content-author (if detected) -> VISUAL DESIGN (if enabled) -> DESIGN. Author workflow runs autonomously with review loop, no human approval gate.

**Step 1: Update Content-Author Detection section**

In `skills/clarifier/SKILL.md`, find:

```markdown
If detected, set `workflow_policy.author.enabled = true` in the run config and note:
> **Content needs detected.** The content-author workflow will run after design approval to produce: [list detected content types].
```

Replace with:

```markdown
If detected, set `workflow_policy.author.enabled = true` in the run config.

**Content-author runs autonomously** with its own review loop — no human approval gate. It produces content artifacts (microcopy, i18n keys, terminology, seed data) that downstream phases need.

**Ordering when content-author is detected:**
1. REVIEW(spec) completes
2. Content-author workflow runs (autonomous, review loop)
3. VISUAL DESIGN runs (if enabled and `interaction_mode == interactive`)
4. DESIGN (architectural brainstorming)

The designer role expects content-author artifacts as input. Content gaps discovered during execution are 10-100x more expensive to fix.

> **Content needs detected.** The content-author workflow will now run autonomously to produce: [list detected content types]. No approval needed — review loop ensures quality.
```

**Step 2: Add Phase 4a VISUAL DESIGN sub-workflow delegation**

In `skills/clarifier/SKILL.md`, between the Spec Harden section (Sub-Workflow 3) and the Brainstorm section (Sub-Workflow 4), insert:

```markdown
## Sub-Workflow 3a: Visual Design (conditional, interactive-only)

**Condition:** Only runs if `workflow_policy.visual_design.enabled == true` AND `workflow_policy.visual_design.mode == "collaborative"` AND `interaction_mode == interactive`.

If conditions are met, delegate to the design workflow (`workflows/design.md`):

1. The **designer role** produces visual design artifacts using pencil MCP or equivalent tools.
2. This is the most interaction-heavy part of the pipeline — heavy user collaboration.
3. After user approves the visual designs, invoke `wz:reviewer --mode visual-design-review`.
4. Loop runs for `pass_counts[depth]` passes.

**Produces:** design files, design tokens (colors, spacing, typography), screenshot references. Optionally exports code scaffolds as reference — these are convenience exports, not architecture decisions. Phase 5 determines the implementation stack.

Save result to `.wazir/runs/latest/clarified/visual-design/`.

### Checkpoint: Visual Design Review

**Mode gate:** This sub-workflow only runs in `interactive` mode, so this checkpoint always pauses.

Present visual designs to the user for approval before proceeding to architectural design.

**If conditions are NOT met:** Skip directly to Sub-Workflow 4 (Brainstorm).
```

**Step 3: Verify and commit**

Run: `grep -c "autonomously" skills/clarifier/SKILL.md`
Expected: at least `2`

Run: `grep -c "Sub-Workflow 3a" skills/clarifier/SKILL.md`
Expected: `1`

```bash
git add skills/clarifier/SKILL.md
git commit -m "feat(clarifier): content-author ordering + Phase 4a visual design

- Ordering: REVIEW(spec) → content-author (autonomous) → VISUAL DESIGN
  (if enabled, interactive only) → DESIGN
- Adds Sub-Workflow 3a delegation to workflows/design.md
- Author runs with review loop, no human gate

Aligns with vision P-1 and Phase 4a."
```

---

### Task 7: Interactive mode compaction between phases

**Files:**
- Modify: `skills/clarifier/SKILL.md` (after each checkpoint in interactive mode)

**Context:** Vision says interactive mode should ask user to compact context between phases to prevent context rot. This only applies to `interactive` mode.

**Step 1: Add compaction guidance to Interaction Mode Behavior section**

In the new "Interaction Mode Behavior" section added in Task 1, after the table and mode descriptions, add:

```markdown
**Interactive mode compaction:** Between phases, the orchestrator suggests the user compact context. The main session accumulates discussion across checkpoints; compaction between phases prevents context rot from degrading later phases. After each checkpoint where the user approves, suggest:

> Context is growing from our discussion. To keep later phases sharp, consider compacting now (`/compact`). This preserves decisions but frees working memory.

This is a suggestion, not a gate. The user can skip compaction.
```

**Step 2: Verify and commit**

Run: `grep -c "compaction" skills/clarifier/SKILL.md`
Expected: at least `2`

Run: `grep "compact" skills/clarifier/SKILL.md`
Expected: at least `2` hits

```bash
git add skills/clarifier/SKILL.md
git commit -m "feat(clarifier): add interactive mode compaction between phases

In interactive mode, suggest context compaction after each checkpoint
to prevent context rot across the long clarifier session.

Aligns with vision: interactive mode compaction."
```

---

### Task 8: Fix scope coverage gate to item-level traceability

**Files:**
- Modify: `skills/clarifier/SKILL.md:347-368` (Scope Coverage Gate section)

**Context:** The current scope gate uses count comparison (`tasks_in_plan < items_in_input`). Vision says item-level traceability: every input item must map to at least one task. A vertical-slice task covering 3 input items is valid. 10 tasks that miss 2 input items is not.

**Step 1: Rewrite Scope Coverage Gate**

In `skills/clarifier/SKILL.md`, find:

```markdown
### Scope Coverage Gate (Hard Gate)

Before presenting the plan to the user, verify ALL input items are covered:

1. Count distinct items/deliverables in the input briefing (`.wazir/input/briefing.md` + any `input/*.md` files)
2. Count tasks in the execution plan
3. **If `tasks_in_plan < items_in_input`:** STOP and present:

> **Scope reduction detected.** The input contains [N] items but the plan only covers [M].
>
> Missing items: [list]

Ask the user via AskUserQuestion:
- **Question:** "The plan is missing [N-M] items from your input. How should we proceed?"
- **Options:**
  1. "Add missing items to the plan" *(Recommended)*
  2. "Approve reduced scope — I confirm these items can be dropped"

**The clarifier MUST NOT autonomously drop items into "future tiers", "deferred", or "out of scope" without explicit user approval. This is a hard rule.**

Invariant: `items_in_plan >= items_in_input` unless user explicitly approves reduction.
```

Replace with:

```markdown
### Scope Coverage Gate (Hard Gate)

Mechanical gate, separate from the review loop. Before the plan exits pre-execution:

1. List every distinct item/deliverable in the original input (`.wazir/input/briefing.md` + any `input/*.md` files)
2. For each input item, verify at least one task in the plan maps to it
3. **If any input item has no mapped task → BLOCK:**

> **Scope coverage failure.** The following input items have no mapped task in the plan:
>
> | Input Item | Status |
> |-----------|--------|
> | [item description] | **UNMAPPED** |
> | ... | ... |

Ask the user via AskUserQuestion:
- **Question:** "[N] input items are not covered by any task. How should we proceed?"
- **Options:**
  1. "Add missing items to the plan" *(Recommended)*
  2. "Approve reduced scope — I confirm these items can be dropped"

This is **item-level traceability**, not a count comparison. A vertical-slice task covering 3 input items is valid. 10 tasks that miss 2 input items is not. The check is: every input item is accounted for, not that task count >= item count.

**The clarifier MUST NOT autonomously drop items into "future tiers", "deferred", or "out of scope" without explicit user approval. This is a hard rule.** The review loop's "100% rule" checklist item catches coverage issues during review; this gate catches them mechanically at the exit.
```

**Step 2: Update workflows/plan-review.md stale count comparison**

In `workflows/plan-review.md`, find:

```markdown
**Input Coverage dimension:** The reviewer reads the original input/briefing, counts distinct items, and compares against tasks in the plan. If `tasks_in_plan < items_in_input`, this is a HIGH finding listing the missing items. This prevents silent scope reduction where 21 input items become 5 tasks.
```

Replace with:

```markdown
**Input Coverage dimension:** The reviewer reads the original input/briefing, lists every distinct item, and verifies each maps to at least one task in the plan. If any input item has no mapped task, this is a HIGH finding listing the unmapped items. This is item-level traceability, not a count comparison — a vertical-slice task covering 3 input items is valid. This prevents silent scope reduction.
```

**Step 3: Update reviewer skill plan-review input coverage dimension**

In `skills/reviewer/SKILL.md`, find (under plan-review prerequisites):

```markdown
   - Count distinct items/requirements in the input
   - Count tasks in the execution plan
   - If `tasks_in_plan < items_in_input` → **HIGH** finding: "Plan covers [N] of [M] input items. Missing: [list of uncovered items]"
   - If `tasks_in_plan >= items_in_input` → dimension passes
   - One task MAY cover multiple input items if justified in the task description
   - This is the review-level enforcement of the "no scope reduction" rule
```

Replace with:

```markdown
   - List every distinct item/requirement in the original input
   - For each input item, check whether at least one task maps to it
   - If any input item has no mapped task → **HIGH** finding: "Input item '[item]' has no mapped task in the plan"
   - One task MAY cover multiple input items (vertical-slice) if justified in the task description
   - This is item-level traceability, not a count comparison — aligns with the scope coverage hard gate
```

**Step 4: Verify and commit**

Run: `grep -c "item-level traceability" skills/clarifier/SKILL.md`
Expected: `1`

Run: `grep "count comparison" skills/clarifier/SKILL.md`
Expected: 0 hits for old count-based logic

```bash
git add skills/clarifier/SKILL.md skills/reviewer/SKILL.md workflows/plan-review.md
git commit -m "fix(clarifier): scope gate uses item-level traceability, not count

Rewrite scope coverage gate from count comparison (tasks < items)
to item-level traceability (every input item maps to a task).
Update reviewer plan-review dimension and workflows/plan-review.md.

Aligns with vision P-2: scope coverage hard gate."
```

---

## Batch 3 — Deferred (separate session)

### Task 9: Plan subtask schema (forward-critical)

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

**Deferred.** This task updates the writing-plans skill to produce subtasks matching `docs/vision/examples/subtask-example.md` with expertise declarations, context budgets, file dependency matrix, etc. Critical for executor/Composer work but not blocking the clarifier alignment.

### Task 10: Gating agent protocol for auto mode (forward-critical)

**Files:**
- Create: `docs/reference/gating-agent-protocol.md` or add to `skills/clarifier/SKILL.md`

**Deferred.** Defines the decision contract, inputs, response format, and escalation path for the gating agent in auto mode.

---

## Summary

| Task | Gap | Files | Batch |
|------|-----|-------|-------|
| 1 | Checkpoint gating per interaction_mode | `skills/clarifier/SKILL.md` | 1 (first) |
| 2 | Architectural-design-review mode | `skills/brainstorming/SKILL.md`, `skills/reviewer/SKILL.md`, `workflows/design-review.md`, `workflows/design.md`, `skills/clarifier/SKILL.md` | 1 (after Task 1) |
| 3 | Original input to every review | `roles/reviewer.md`, `skills/reviewer/SKILL.md`, `docs/reference/review-loop-pattern.md` | 1 (after Task 2) |
| 4 | Discover.md wrong inputs | `workflows/discover.md` | 1 (after Task 3) |
| 5 | Visual design triage question | `skills/clarifier/SKILL.md` | 2 |
| 6 | Content-author ordering + Phase 4a | `skills/clarifier/SKILL.md` | 2 |
| 7 | Interactive compaction | `skills/clarifier/SKILL.md` | 2 |
| 8 | Scope gate item-level traceability | `skills/clarifier/SKILL.md`, `skills/reviewer/SKILL.md`, `workflows/plan-review.md` | 1 (after Task 3) |
| 9 | Plan subtask schema | `skills/writing-plans/SKILL.md` | 3 (deferred) |
| 10 | Gating agent protocol | TBD | 3 (deferred) |

**Execution order:**
- Task 1 first (modifies checkpoints + adds Interaction Mode section)
- Task 2 second (modifies reviewer SKILL.md model annotation + ownership text)
- Task 3 third (modifies reviewer SKILL.md mode table + prerequisites)
- Tasks 4 and 8 in parallel (different files/non-overlapping sections)
- Tasks 5, 6, 7 sequential (all modify clarifier SKILL.md, add to sections created/modified by Batch 1)
- Tasks 9-10 deferred to future session

**Why sequential for Tasks 1→2→3:** All three modify `skills/reviewer/SKILL.md` or `skills/clarifier/SKILL.md` in overlapping sections. Task 2 renames `design-review` references in reviewer SKILL.md lines 14, 31. Task 3 splits the mode table row and adds original input to prerequisites. Running them sequentially avoids old_string collisions.

**Removed from plan:**
- ~~Feasibility check as formal task~~ — no separate checkpoint. Instead, Task 1's research sub-workflow output block already says "Changed because of this work: [key discoveries]." Add one line to that block: *"If research reveals the request is impossible, contradictory, or fundamentally wrong approach — present evidence and stop before proceeding to questions."* This goes in Task 1 Step 3's `auto/guided` else-branch as well: log the feasibility concern and escalate.
- ~~Business vs technical question routing~~ — The research-first rule already prevents uninformed questions. The existing escalation rule in `roles/clarifier.md` ("escalate when ambiguity changes architecture, feasibility, or acceptance criteria") already covers what matters. Any question that impacts the project should be asked regardless of classification.
