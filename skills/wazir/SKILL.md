---
name: wz:wazir
description: One-command pipeline — type /wazir followed by what you want to build. Handles init, clarification, execution, review, and audits automatically.
---
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->

# Wazir — Full Pipeline Runner

The user typed `/wazir <their request>`. Run the entire pipeline end-to-end, handling each phase automatically and only pausing where human input is required.

All questions use **numbered interactive options** — one question at a time, defaults marked "(Recommended)", wait for user response before proceeding.

## User Input Capture

After every user response (approval, correction, rejection, redirect, instruction), capture it:

```
captureUserInput(runDir, { phase: '<current-phase>', type: '<instruction|approval|correction|rejection|redirect>', content: '<user message>', context: '<what prompted the question>' })
```

This uses `tooling/src/capture/user-input.js`. The log at `user-input-log.ndjson` feeds the learning system — user corrections are the strongest signal for improvement. At run end, prune logs older than 10 runs via `pruneOldInputLogs(stateRoot, 10)`.

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

## Subcommand Detection

Before anything else, check if the request starts with a known subcommand:

| Input | Action |
|-------|--------|
| `/wazir audit ...` | Jump to **Audit Mode** (see below) |
| `/wazir prd [run-id]` | Jump to **PRD Mode** (see below) |
| `/wazir init` | Invoke the `init-pipeline` skill directly, then stop |
| Anything else | Continue to Phase 1 (Init) |

---

# 4-Phase Pipeline

The pipeline has 4 phases. Each phase groups related workflows. Individual workflows within a phase can be enabled/disabled via `workflow_policy` in run-config.

| Phase | Contains | Owner Skill | Key Output |
|-------|----------|-------------|------------|
| **Init** | Setup, prereqs, run directory, input scan | `wz:wazir` (inline) | `run-config.yaml` |
| **Clarifier** | Research, clarify, specify, brainstorm, plan | `wz:clarifier` | Approved spec + design + plan |
| **Executor** | Implement, verify | `wz:executor` | Code + verification proof |
| **Final Review** | Integration verification, concern resolution, 2+1 pass review, learn, prepare next | `wz:reviewer` | Verdict + learnings + handoff |

---

# Pre-Bootstrap: CLI Check (MANDATORY BEFORE PHASE 0)

**Before bootstrap**, verify the Wazir CLI is installed:

```bash
which wazir
```

**If not installed**, present:

> **The Wazir CLI is not installed. It's required for event capture, validation, and indexing.**

Ask the user via AskUserQuestion:
- **Question:** "The Wazir CLI is not installed. How would you like to install it?"
- **Options:**
  1. "npm install -g @wazir-dev/cli" *(Recommended)*
  2. "npm link from the Wazir project root"

Wait for the user's selection before continuing. **STOP here if CLI is not installed — never enter the pipeline.**

The CLI is **required** — the pipeline uses `wazir capture`, `wazir validate`, `wazir index`, and `wazir doctor` throughout execution.

---

# Phase 0: Bootstrap (MANDATORY FIRST STEP)

**After CLI check passes**, run this command:

```bash
wazir capture ensure
```

This creates or resumes a pipeline run. Until this runs, you CANNOT write code — the bootstrap gate will block all Write/Edit/Bash calls. Please try 100% compliance with Wazir pipeline and skill usage.

## Sync Task List From Phase Checklist

**Immediately after `wazir capture ensure`**, read the active phase checklist and populate your task list to match it exactly. This ensures your task list IS the pipeline — not a competing instruction set.

1. Read the active phase file from `.wazir/runs/latest/phases/` (the file whose header contains `— ACTIVE`)
2. Parse every unchecked item (lines matching `- [ ]`)
3. **Before creating tasks, call TaskList.** If tasks already exist that match the phase checklist items, do not recreate them. If tasks exist that don't match the checklist (stale from a previous session or early agent behavior), they are stale — do not follow them. Create fresh tasks from the current phase checklist instead.
4. For each unchecked item not already in the task list, call `TaskCreate` with:
   - **subject:** The checklist item text (strip the `- [ ]` prefix and any `<!-- ... -->` comments)
   - **description:** "Pipeline checklist item from the active phase"
5. Do NOT create tasks for already-checked items (`- [x]`)
6. Do NOT create your own tasks outside the phase checklist — the checklist is the complete task list

**Why:** The agent naturally follows its own task list. If that list matches the pipeline checklist, pipeline compliance happens automatically. If you create a separate task list, it competes with the pipeline and compliance drops.

# Phase 1: Init

**Before starting:** Check `.wazir/runs/latest/phases/init.md` for your current checklist. Complete all items before proceeding to Phase 2.

## Step 1: Capture the Request

Take whatever the user wrote after `/wazir` and save it as the briefing:

1. Create `.wazir/input/` if it doesn't exist
2. Write the user's request to `.wazir/input/briefing.md` with a timestamp header

If the user provided no text after `/wazir`, ask:

> **What would you like to build?**

Save their answer as the briefing, then continue.

### Scan Input Directory

Scan both `input/` (project-level) and `.wazir/input/` (state-level) for existing briefing materials. If files exist beyond `briefing.md`, list them:

> **Found input files:**
> - `input/2026-03-19-deferred-items.md`
> - `.wazir/input/briefing.md`
>
> Using all found input as context for clarification.

### Inline Modifiers

Parse the request for inline modifiers before the main text:

- `/wazir quick fix the login redirect` → depth = quick, intent = bugfix
- `/wazir deep design a new onboarding flow` → depth = deep, intent = feature

Recognized modifiers:
- **Depth:** `quick`, `deep` (standard is default when omitted)
- **Interaction mode:** `auto`, `interactive` (guided is default when omitted)
  - `/wazir auto fix the auth bug` → interaction_mode = auto
  - `/wazir interactive design the onboarding` → interaction_mode = interactive
- **Intent:** `bugfix`, `feature`, `refactor`, `docs`, `spike`

## Step 2: Check Prerequisites

### Config Check

Check if `.wazir/state/config.json` exists and has `config_version: 2`.

- **If missing or v1 (no `config_version` or `config_version !== 2`):** Invoke the `init-pipeline` skill. It handles dependency checks, asks 3-4 questions, and writes config.
- **If exists and v2:** Show one-line config summary and proceed:
  ```
  Config: <model_mode summary> | <interaction_mode> | Reconfigure: /wazir init
  ```
  Model mode summary formats: `single`, `multi-model (Haiku/Sonnet/Opus)`, `multi-tool (Opus + Codex gpt-5.4)`

Run `wazir doctor --json` to verify repo health. Stop if unhealthy.

### Branch Check

Run `wazir validate branches` to check the current git branch.

- If on `main` or `develop`:
  > You're on **[branch]**. The pipeline requires a feature branch.

  Ask the user via AskUserQuestion:
  - **Question:** "You're on a protected branch. Create a feature branch?"
  - **Options:**
    1. "Create feat/<slug> from current branch" *(Recommended)*
    2. "Continue on current branch — not recommended"

  Wait for the user's selection before continuing.

### Index Check

```bash
INDEX_STATS=$(wazir index stats --json 2>/dev/null)
FILE_COUNT=$(echo "$INDEX_STATS" | jq -r '.file_count // 0')
if [ "$FILE_COUNT" -eq 0 ]; then
  wazir index build && wazir index summarize --tier all
else
  wazir index refresh
fi
```

## Step 3: Create Run Directory

Generate a run ID using the current timestamp: `run-YYYYMMDD-HHMMSS`

```bash
mkdir -p .wazir/runs/run-YYYYMMDD-HHMMSS/{sources,tasks,artifacts,reviews,clarified}
ln -sfn run-YYYYMMDD-HHMMSS .wazir/runs/latest
```

Initialize event capture:

```bash
wazir capture init --run <run-id> --phase init --status starting
```

### Resume Detection

Check if a previous incomplete run exists (via `latest` symlink pointing to a run without `completed_at`).

**If previous incomplete run found**, present:

> **A previous incomplete run was detected:** `<previous-run-id>`

Ask the user via AskUserQuestion:
- **Question:** "A previous incomplete run was detected. Resume or start fresh?"
- **Options:**
  1. "Resume from the last completed phase" *(Recommended)*
  2. "Start fresh with a new empty run"

Wait for the user's selection before continuing.

**If Resume:**
- Copy `clarified/` from previous run into new run, EXCEPT `user-feedback.md`.
- Detect last completed phase by checking which artifacts exist.
- **Staleness check:** If input files are newer than copied artifacts, warn and offer to re-run clarification.

## Step 4: Build Run Config

**No questions asked.** Depth, intent, and interaction mode are inferred or read from project config.

**Interaction mode wiring:** Read `interaction_mode` from `.wazir/state/config.json` as the project default. Inline modifiers override:
```
interaction_mode = inline_modifier ?? project_config.interaction_mode ?? 'guided'
```

### Intent Inference

Infer intent from the request text using keyword matching:

| Keywords in request | Inferred Intent |
|-------------------|-----------------|
| fix, bug, broken, crash, error, issue, wrong | `bugfix` |
| refactor, clean, restructure, reorganize, rename, simplify | `refactor` |
| doc, document, readme, guide, explain | `docs` |
| research, spike, explore, investigate, prototype | `spike` |
| (anything else) | `feature` |

Depth defaults to `standard`. Override only via inline modifiers (`/wazir quick ...`, `/wazir deep ...`).

### Write Run Config

Save to `.wazir/runs/<run-id>/run-config.yaml`:

```yaml
run_id: run-YYYYMMDD-HHMMSS
parent_run_id: null
continuation_reason: null

request: "the original user request"
request_summary: "short summary"
parsed_intent: feature
entry_point: "/wazir"

depth: standard
interaction_mode: guided  # from inline modifier ?? project config ?? 'guided'

# Workflow policy — individual workflows within each phase
workflow_policy:
  # Clarifier phase workflows
  discover:       { enabled: true, loop_cap: 10 }
  clarify:        { enabled: true, loop_cap: 10 }
  specify:        { enabled: true, loop_cap: 10 }
  spec-challenge: { enabled: true, loop_cap: 10 }
  author:         { enabled: false, loop_cap: 10 }
  design:         { enabled: true, loop_cap: 10 }
  design-review:  { enabled: true, loop_cap: 10 }  # covers architectural-design-review + visual-design-review
  plan:           { enabled: true, loop_cap: 10 }
  plan-review:    { enabled: true, loop_cap: 10 }
  # Executor phase workflows
  execute:        { enabled: true, loop_cap: 10 }
  verify:         { enabled: true, loop_cap: 5 }
  # Final Review phase workflows
  review:         { enabled: true, loop_cap: 10 }
  learn:          { enabled: true, loop_cap: 5 }
  prepare_next:   { enabled: true, loop_cap: 5 }
  run_audit:      { enabled: false, loop_cap: 10 }

research_topics: []

created_at: "YYYY-MM-DDTHH:MM:SSZ"
completed_at: null
```

### Workflow Skip Rules

Map intent + depth to applicable workflows. The system decides — the user does NOT pick.

| Class | Workflows | Rules |
|-------|-----------|-------|
| **Core** (always run) | `clarify`, `execute`, `verify`, `review` | Never skipped |
| **Adaptive** (run when evidence says so) | `discover`, `design`, `author`, `specify` | Skipped for bugfix/docs/spike at quick depth |
| **Scale** (intensity varies) | `spec-challenge`, `plan-review`, `architectural-design-review`, `visual-design-review` | Loop cap controls iteration depth |
| **Post-run** (always run) | `learn`, `prepare_next` | Part of Final Review phase |

Log skip decisions with reasons in `workflow_policy`.

### Confidence Gate

After building run config:

- **High confidence** — one-line summary and proceed:
  > **Running: standard depth, feature, sequential. Proceeding...**

- **Low confidence** — show plan and ask:

  Ask the user via AskUserQuestion:
  - **Question:** "Does this run configuration look right?"
  - **Options:**
    1. "Yes, proceed" *(Recommended)*
    2. "No, let me adjust"

  Wait for the user's selection before continuing.

```bash
wazir capture event --run <run-id> --event phase_exit --phase init --status completed
```

Run the phase report and display it to the user:
```bash
wazir report phase --run <run-id> --phase init
```

Output the report content to the user in the conversation.

---

# Interaction Modes

The `interaction_mode` field in run-config controls how the pipeline interacts with the user:

| Mode | Inline modifier | Behavior | Best for |
|------|----------------|----------|----------|
| **`guided`** | (default) | Pipeline runs, pauses at phase checkpoints for user approval. Current default behavior. | Most work |
| **`auto`** | `/wazir auto ...` | No human checkpoints. Codex reviews all. Gating agent decides continue/loop_back/escalate. Stops ONLY on escalate. | Overnight, clear spec, well-understood domain |
| **`interactive`** | `/wazir interactive ...` | More questions, more discussion, co-designs with user. Researcher presents options. Executor checks approach before coding. | Ambiguous requirements, new domain, learning |

## `auto` mode constraints

- **External reviewer REQUIRED** — refuse to start auto mode if no external reviewer is configured (requires multi-tool mode with Codex or Gemini in `.wazir/state/config.json`). Error: "Auto mode requires an external reviewer (multi-tool mode with Codex or Gemini). Configure it first or use guided mode."
- **On escalate:** STOP immediately, write the escalation reason to `.wazir/runs/<id>/escalations/`, and wait for user input
- **Wall-clock limit:** default 4 hours. If exceeded, stop with escalation.
- **Never auto-commits to main** — always work on feature branch
- All checkpoints (AskUserQuestion) are skipped — gating agent evaluates phase reports and decides

## `guided` mode (default)

Current behavior — no changes needed. Checkpoints at phase boundaries, user approves before advancing.

## `interactive` mode

- **Clarifier:** asks more detailed questions, presents research findings with options: "I found 3 approaches — which interests you?"
- **Executor:** checks approach before coding: "I'm about to implement auth with Supabase — sound right?"
- **Reviewer:** discusses findings with user, not just presents verdict: "I found a potential auth bypass — here's why I think it's high severity, do you agree?"
- Slower but highest quality for complex/ambiguous work

## Mode checking in phase skills

All phase skills check `interaction_mode` from run-config at every checkpoint:

```
# Read from run-config
interaction_mode = run_config.interaction_mode ?? 'guided'

# At each checkpoint:
if interaction_mode == 'auto':
    # Skip checkpoint, let gating agent decide
elif interaction_mode == 'interactive':
    # More detailed question, present options, discuss
else:
    # guided — standard checkpoint with AskUserQuestion
```

---

# Two-Level Phase Model

The pipeline has 4 top-level **phases**, each containing multiple **workflows** with review loops:

```
Phase 1: Init
  └── (inline — no sub-workflows)

Phase 2: Clarifier
  ├── discover (research) ← research-review loop
  ├── clarify ← clarification-review loop
  ├── specify ← spec-challenge loop
  ├── author (adaptive) ← approval gate
  ├── design ← architectural-design-review loop
  └── plan ← plan-review loop

Phase 3: Executor
  ├── execute (per-task) ← task-review loop per task
  └── verify

Phase 4: Final Review (Completion Pipeline)
  ├── integration-verify ← full suite on merged main
  ├── concern-resolve ← fresh agent, sycophancy guard
  ├── review (final) ← 2+1 pass compliance audit
  ├── learn ← adoption rates, quality delta, user corrections
  └── prepare_next
```
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->

**Event capture uses both levels.** When emitting phase events, include `--parent-phase`:
```bash
wazir capture event --run <id> --event phase_enter --phase discover --parent-phase clarifier --status in_progress
```

**Progress markers between workflows:** After each workflow completes, output:
> Phase 2: Clarifier > Workflow: specify (3 of 6 workflows complete)

**`wazir status` shows both levels:** "Phase 2: Clarifier > Workflow: specify"

---

# Phase 2: Clarifier

**Before starting:** Check `.wazir/runs/latest/phases/clarifier.md` for your current checklist. Complete all items before proceeding to Phase 3.

**Before starting this phase, output to the user:**

> **Clarifier Phase** — About to research your codebase, clarify requirements, harden the spec, brainstorm designs, and produce an execution plan.
>
> **Why this matters:** Without this, I'd guess your tech stack, misunderstand constraints, miss edge cases in the spec, and build the wrong architecture. Every ambiguity left unresolved here becomes a bug or rework cycle later.
>
> **Looking for:** Unstated assumptions, scope boundaries, conflicting requirements, missing acceptance criteria

```bash
wazir capture event --run <run-id> --event phase_enter --phase clarifier --status in_progress
```

Invoke the `wz:clarifier` skill. It handles all sub-workflows internally:

1. **Source Capture** — fetch URLs from input
2. **Research** (discover workflow) — codebase + external research
3. **Clarify** (clarify workflow) — scope, constraints, assumptions
4. **Spec Harden** (specify + spec-challenge workflows) — measurable spec
5. **Brainstorm** (architectural design + architectural-design-review) — design approaches
6. **Plan** (plan + plan-review workflows) — execution plan

Each sub-workflow has its own review loop. User checkpoints between major steps.

### Scope Invariant

**Hard rule:** `items_in_plan >= items_in_input` unless the user explicitly approves scope reduction. The clarifier MUST NOT autonomously tier, defer, or drop items from the user's input. It can suggest prioritization, but the decision belongs to the user.

Output: approved spec + design + execution plan in `.wazir/runs/latest/clarified/`.

**After completing this phase, output to the user:**

> **Clarifier Phase complete.**
>
> **Found:** [N] ambiguities resolved, [N] assumptions made explicit, [N] scope boundaries drawn, [N] acceptance criteria hardened
>
> **Without this phase:** Requirements would be interpreted differently across tasks, acceptance criteria would be vague and untestable, the design would be ad-hoc, and the plan would miss dependency ordering
>
> **Changed because of this work:** [List spec tightening changes, resolved questions, design decisions, scope adjustments]

```bash
wazir capture event --run <run-id> --event phase_exit --phase clarifier --status completed
```

Run the phase report and display savings to the user:
```bash
wazir report phase --run <run-id> --phase clarifier
wazir stats --run <run-id>
```

**Show savings in conversation output:**
> **Context savings this phase:** Used wazir index for [N] queries and context-mode for [M] commands, saving ~[X] tokens ([Y]% reduction). Without these, this phase would have consumed [A] tokens instead of [B].

Output the report content to the user in the conversation.

---

# Phase 3: Executor

**Before starting:** Check `.wazir/runs/latest/phases/executor.md` for your current checklist. Complete all items before proceeding to Phase 4.

**Before starting this phase, output to the user:**

> **Executor Phase** — About to implement [N] tasks in dependency order with TDD (test-first), per-task code review, and verification before each commit.
>
> **Why this matters:** Without this discipline, tests get skipped, edge cases get missed, integration points break silently, and review catches problems too late when they're expensive to fix.
>
> **Looking for:** Correct dependency ordering, test coverage for each task, clean per-task review passes, no implementation drift from the approved plan

## Phase Gate (Hard Gate)

Before entering the Executor phase, verify ALL clarifier artifacts exist:

- [ ] `.wazir/runs/latest/clarified/clarification.md`
- [ ] `.wazir/runs/latest/clarified/spec-hardened.md`
- [ ] `.wazir/runs/latest/clarified/design.md`
- [ ] `.wazir/runs/latest/clarified/execution-plan.md`

If ANY file is missing, **STOP**:

> **Cannot enter Executor phase: missing prerequisite artifacts from Clarifier.**
>
> Missing: [list missing files]
>
> The Clarifier phase must complete before execution can begin. Run `/wazir:clarifier` first.

**Do NOT skip this check. Do NOT rationalize that the input is "clear enough" to bypass clarification. Every pipeline run must produce these artifacts.**

```bash
wazir capture event --run <run-id> --event phase_enter --phase executor --status in_progress
```

**Pre-execution gate:**

```bash
wazir validate manifest && wazir validate hooks
# Hard gate — stop if either fails.
```

Invoke the `wz:executor` skill. It handles:

1. **Execute** (execute workflow) — per-task TDD cycle with review before each commit
2. **Verify** (verify workflow) — deterministic verification of all claims

Per-task review: `--mode task-review`, 5 task-execution dimensions.
Tasks always run sequentially.

Output: code changes + verification proof in `.wazir/runs/latest/artifacts/`.

**After completing this phase, output to the user:**

> **Executor Phase complete.**
>
> **Found:** [N]/[N] tasks implemented, [N] tests written, [N] per-task review passes completed, [N] findings fixed before commit
>
> **Without this phase:** Code would ship without tests, review findings would accumulate until final review (10x more expensive to fix), and verification claims would be unsubstantiated
>
> **Changed because of this work:** [List of commits with conventional commit messages, test counts, verification evidence collected]

```bash
wazir capture event --run <run-id> --event phase_exit --phase executor --status completed
```

Run the phase report and display savings to the user:
```bash
wazir report phase --run <run-id> --phase executor
wazir stats --run <run-id>
```

Output the report content to the user in the conversation.

**Show savings in conversation output:**
> **Context savings this phase:** Used wazir index for [N] queries and context-mode for [M] commands, saving ~[X] tokens ([Y]% reduction).

---

# Phase 4: Final Review

**Before starting:** Check `.wazir/runs/latest/phases/final_review.md` for your current checklist. Complete all items before marking the run complete.

**Before starting this phase, output to the user:**

> **Final Review Phase** — About to run adversarial 7-dimension review comparing the implementation against your original input, extract durable learnings, and prepare the handoff.
>
> **Why this matters:** Without this, implementation drift ships undetected, missing acceptance criteria go unnoticed, untested code paths hide bugs, and the same mistakes repeat in the next run.
>
> **Looking for:** Spec violations, missing features, dead code paths, unsubstantiated claims, scope creep, security gaps, stale documentation

## Phase Gate (Hard Gate)

Before entering the Final Review phase, verify the Executor produced its proof:

- [ ] `.wazir/runs/latest/artifacts/verification-proof.md`

If missing, **STOP**:

> **Cannot enter Final Review: missing verification proof from Executor.**
>
> The Executor phase must complete and produce `verification-proof.md` before final review. Run `/wazir:executor` first.

```bash
wazir capture event --run <run-id> --event phase_enter --phase final_review --status in_progress
```

This phase validates the implementation against the **ORIGINAL INPUT** (not the task specs — the executor's per-task reviewer already covered that).

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

**After completing this phase, output to the user:**

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

```bash
wazir capture event --run <run-id> --event phase_exit --phase final_review --status completed
```

Run the phase report and display it to the user:
```bash
wazir report phase --run <run-id> --phase final_review
```

Output the report content to the user in the conversation.

---

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

### Run Summary

```bash
wazir capture summary --run <run-id>
wazir status --run <run-id> --json
```

## Error Handling

If any phase fails:

> **Phase [name] failed: [reason]**

Ask the user via AskUserQuestion:
- **Question:** "Phase [name] failed: [reason]. How should we proceed?"
- **Options:**
  1. "Retry this phase" *(Recommended)*
  2. "Skip and continue" *(only if workflows within phase are adaptive)*
  3. "Abort the run"

Wait for the user's selection before continuing.

---

# Audit Mode

Triggered by `/wazir audit` or `/wazir audit <focus>`.

Runs a structured codebase audit. Invokes the `run-audit` skill.

Parse inline audit types: `/wazir audit security` → skip Question 1.

After audit:

Ask the user via AskUserQuestion:
- **Question:** "Audit complete. What would you like to do with the findings?"
- **Options:**
  1. "Review the findings" *(Recommended)*
  2. "Generate a fix plan"
  3. "Run the pipeline on the fix plan"

Wait for the user's selection before continuing.

If option 3, save findings as briefing and run pipeline with intent = `bugfix`.

---

# PRD Mode

Triggered by `/wazir prd` or `/wazir prd <run-id>`.

Generates a PRD from a completed run. Reads approved design, task specs, execution plan, review results. Saves to `docs/prd/YYYY-MM-DD-<topic>-prd.md`.

After generation:

Ask the user via AskUserQuestion:
- **Question:** "PRD generated. What would you like to do?"
- **Options:**
  1. "Review the PRD" *(Recommended)*
  2. "Commit it"
  3. "Edit before committing"

Wait for the user's selection before continuing.

---

## Reasoning Chain Output

Every phase produces reasoning output at two layers:

### Layer 1: Conversation Output (concise — for the user)

Before each major decision, output one trigger sentence and one reasoning sentence:

> "Your request mentions 'overnight autonomous run' — researching how Devin and Karpathy's autoresearch handle this, because unattended runs need different safety constraints than interactive ones."

After each phase, output what was found and a counterfactual:

> "Found: you use Supabase auth (not custom JWT). If I'd skipped research, I would have built JWT middleware — completely wrong."

### Layer 2: File Output (detailed — for learning and reports)

Save full reasoning chain to `.wazir/runs/<id>/reasoning/phase-<name>-reasoning.md` with entries:

```markdown
### Decision: [title]
- **Trigger:** What prompted this decision
- **Options considered:** List of alternatives
- **Chosen:** The selected option
- **Reasoning:** Why this option was chosen
- **Confidence:** high | medium | low
- **Counterfactual:** What would have gone wrong without this information
```

Create the `reasoning/` directory during run init. Every phase skill (clarifier, executor, reviewer) writes its own reasoning file. Counterfactuals appear in BOTH conversation output AND reasoning files.

## Interaction Rules

- **One question at a time** — never combine multiple questions
- **Numbered options** — always present choices as numbered lists
- **Mark defaults** — always show "(Recommended)" on the suggested option
- **Wait for answer** — never proceed past a question until the user responds
- **No open-ended questions** — every question has concrete options to pick from
- **Inline answers accepted** — users can type the number or the option name

<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->