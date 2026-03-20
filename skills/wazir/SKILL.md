---
name: wz:wazir
description: One-command pipeline — type /wazir followed by what you want to build. Handles init, clarification, execution, review, and audits automatically.
---

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
| **Final Review** | Review vs original input, learn, prepare next | `wz:reviewer` | Verdict + learnings + handoff |

---

# Phase 1: Init

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

### CLI Check

Run `which wazir` to check if the CLI is installed.

**If not installed**, present:

> **The Wazir CLI is not installed. It's required for event capture, validation, and indexing.**

Ask the user via AskUserQuestion:
- **Question:** "The Wazir CLI is not installed. How would you like to install it?"
- **Options:**
  1. "npm install -g @wazir-dev/cli" *(Recommended)*
  2. "npm link from the Wazir project root"

Wait for the user's selection before continuing.

The CLI is **required** — the pipeline uses `wazir capture`, `wazir validate`, `wazir index`, and `wazir doctor` throughout execution.

**If installed**, run `wazir doctor --json` to verify repo health. Stop if unhealthy.

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

### Pipeline Init Check

Check if `.wazir/state/config.json` exists.

- **If missing** — invoke the `init-pipeline` skill.
- **If exists** — continue.

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

**No questions asked.** Depth, intent, and mode are all inferred or defaulted.

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
interaction_mode: guided  # auto | guided | interactive

# Workflow policy — individual workflows within each phase
workflow_policy:
  # Clarifier phase workflows
  discover:       { enabled: true, loop_cap: 10 }
  clarify:        { enabled: true, loop_cap: 10 }
  specify:        { enabled: true, loop_cap: 10 }
  spec-challenge: { enabled: true, loop_cap: 10 }
  author:         { enabled: false, loop_cap: 10 }
  design:         { enabled: true, loop_cap: 10 }
  design-review:  { enabled: true, loop_cap: 10 }
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
| **Scale** (intensity varies) | `spec-challenge`, `plan-review`, `design-review` | Loop cap controls iteration depth |
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

- **Codex REQUIRED** — refuse to start auto mode if `multi_tool.codex` is not configured in `.wazir/state/config.json`. Error: "Auto mode requires an external reviewer (Codex). Configure it first or use guided mode."
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
  └── (inline — controller handles directly)

Phase 2: Clarifier        → dispatched as SUBAGENT
  ├── discover (research) ← research-review loop
  ├── clarify ← clarification-review loop
  ├── specify ← spec-challenge loop
  ├── author (adaptive) ← approval gate
  ├── design ← design-review loop
  └── plan ← plan-review loop

Phase 3: Executor          → dispatched as SUBAGENT
  ├── execute (per-task) ← task-review loop per task
  └── verify

Phase 4: Final Review      → dispatched as SUBAGENT
  ├── review (final) ← scored review
  ├── learn
  └── prepare_next
```

**Event capture uses both levels.** When emitting phase events, include `--parent-phase`:
```bash
wazir capture event --run <id> --event phase_enter --phase discover --parent-phase clarifier --status in_progress
```

**Progress markers between workflows:** After each workflow completes, output:
> Phase 2: Clarifier > Workflow: specify (3 of 6 workflows complete)

**`wazir status` shows both levels:** "Phase 2: Clarifier > Workflow: specify"

---

# Subagent Controller Architecture

**This is the core enforcement mechanism.** The controller (this skill, wz:wazir) dispatches ONE fresh Agent per phase. Each subagent gets a clean 200K context with only its skill instructions and artifact paths — never the full pipeline context.

## Why Subagents

A single-context pipeline allows the agent to rationalize skipping phases ("the input is clear enough"). Subagent isolation prevents this:
- Each subagent ONLY sees its own phase instructions
- No subagent can see or skip another phase
- The controller validates artifacts BETWEEN phases
- Hooks provide a second enforcement layer independent of prompt compliance

## Controller Loop

```
initialize pipeline-state.json via createPipelineState(runId, stateRoot)
transitionPhase(stateRoot, 'clarify')

for each phase in [clarify, execute, review]:
  1. Update pipeline-state.json: current_phase = phase
  2. Run pre-phase guardrail (validate previous phase artifacts)
  3. Build subagent prompt (see Subagent Prompt Template below)
  4. Dispatch: Agent(prompt=..., description="wazir: <phase>", mode="bypassPermissions")
  5. On completion: validate output artifacts via runGuardrail(phase, state, runDir)
  6. If guardrail passes:
     a. completePhase(stateRoot, phase, artifacts)
     b. Continue to next phase
  7. If guardrail fails: execute Retry Ladder
  8. Capture events:
     wazir capture event --run <id> --event phase_exit --phase <phase> --status completed

transitionPhase(stateRoot, 'complete')
```

**CRITICAL: No phase runs inline in the controller.** The controller ONLY:
- Manages state transitions
- Dispatches subagents
- Validates guardrails
- Handles retry/escalation
- Presents results to the user

## Subagent Prompt Template

Each subagent receives this prompt structure:

```
You are running the {PHASE} phase of the Wazir pipeline.

Run ID: {run_id}
Run directory: {run_dir}
State root: {state_root}
Depth: {depth}
Interaction mode: {interaction_mode}

## Your Instructions
{Read and paste the full content of skills/{phase_skill}/SKILL.md here}

## Input Artifacts (read from disk)
{List of file paths the subagent should read as input}

## Output Artifacts (write to disk)
{List of file paths the subagent must produce}

## Rules
- Read your input artifacts from the paths above
- Write your output artifacts to the paths above
- Do NOT skip any step in your instructions
- Use wazir index for codebase exploration
- Use context-mode for large command outputs
- When done, state which artifacts you produced
```

The controller reads the phase skill from disk and includes it in the prompt. This ensures each subagent has the latest skill version.

## Subagent Dispatch Rules

1. **No nesting** — all subagents dispatched at depth=1 from the controller
2. **No context sharing** — subagents communicate only via artifacts on disk
3. **No pipeline state awareness** — subagents don't read pipeline-state.json
4. **Controller reads skills** — Read `skills/{name}/SKILL.md` before dispatch, paste into prompt
5. **Verify phase handled by executor** — the executor subagent handles both execute + verify workflows

## Retry Ladder

If a guardrail fails after a phase subagent completes:

```
retry_count = 0
while guardrail fails:
  retry_count++
  if retry_count <= 2:
    # Re-dispatch same phase with failure feedback
    prompt += "\n\nPREVIOUS ATTEMPT FAILED GUARDRAIL:\n{guardrail.reason}\nMissing: {guardrail.missing}\nFix these issues."
    Dispatch Agent again
  elif retry_count == 3:
    # Escalate model (use Opus if not already)
    prompt += "\n\nESCALATED: Previous attempts failed. Produce ALL required artifacts."
    Dispatch Agent with model="opus"
  else:
    # Escalate to human
    Ask user: "Phase {phase} failed guardrail after {retry_count} attempts: {reason}"
    Options: 1. Retry manually  2. Skip phase  3. Abort run
    break
```

## Pipeline State Management

The controller manages `pipeline-state.json` at `$STATE_ROOT/pipeline-state.json`:

```javascript
// Before first phase
createPipelineState(runId, stateRoot)
transitionPhase(stateRoot, 'clarify')

// Between phases
transitionPhase(stateRoot, 'execute')

// After each phase
completePhase(stateRoot, phase, { artifactName: { path: '...' } })

// When done
transitionPhase(stateRoot, 'complete')
```

The Stop hook reads this file to block premature completion.
The PreToolUse hook reads this file to enforce phase-specific tool restrictions.

---

# Phase 2: Clarifier (Subagent)

**Before dispatching, output to the user:**

> **Clarifier Phase** — Dispatching clarifier subagent to research your codebase, clarify requirements, harden the spec, brainstorm designs, and produce an execution plan.
>
> **Why this matters:** Without this, I'd guess your tech stack, misunderstand constraints, miss edge cases in the spec, and build the wrong architecture. Every ambiguity left unresolved here becomes a bug or rework cycle later.

## Pre-Dispatch

```bash
wazir capture event --run <run-id> --event phase_enter --phase clarifier --status in_progress
```

Update pipeline state:
```
transitionPhase(stateRoot, 'clarify')
```

## Dispatch

Read `skills/clarifier/SKILL.md` from disk. Build the subagent prompt using the Subagent Prompt Template above.

**Input artifacts for clarifier subagent:**
- `.wazir/input/briefing.md`
- `.wazir/runs/<id>/sources/` (all captured sources)
- `.wazir/runs/<id>/run-config.yaml`
- `input/` directory (project-level input files)

**Required output artifacts:**
- `.wazir/runs/<id>/clarified/clarification.md`
- `.wazir/runs/<id>/clarified/spec-hardened.md`
- `.wazir/runs/<id>/clarified/design.md`
- `.wazir/runs/<id>/clarified/execution-plan.md`

Dispatch: `Agent(prompt=..., description="wazir: clarifier")`

## Post-Dispatch

Run guardrail: `validateClarifyComplete(state, runDir)`

If guardrail passes:
```bash
completePhase(stateRoot, 'clarify', { clarification: {...}, spec: {...}, design: {...}, plan: {...} })
wazir capture event --run <run-id> --event phase_exit --phase clarifier --status completed
wazir report phase --run <run-id> --phase clarifier
```

If guardrail fails: execute Retry Ladder.

### Scope Invariant

**Hard rule:** `items_in_plan >= items_in_input` unless the user explicitly approves scope reduction. The clarifier MUST NOT autonomously tier, defer, or drop items from the user's input.

**After clarifier subagent completes, output to the user:**

> **Clarifier Phase complete.**
>
> **Found:** [N] ambiguities resolved, [N] assumptions made explicit, [N] scope boundaries drawn, [N] acceptance criteria hardened
>
> **Without this phase:** Requirements would be interpreted differently across tasks, acceptance criteria would be vague and untestable, the design would be ad-hoc, and the plan would miss dependency ordering

---

# Phase 3: Executor (Subagent)

**Before dispatching, output to the user:**

> **Executor Phase** — Dispatching executor subagent to implement [N] tasks with TDD, per-task review, and verification.
>
> **Why this matters:** Without this discipline, tests get skipped, edge cases get missed, integration points break silently, and review catches problems too late.

## Pre-Dispatch Guardrail (Hard Gate)

Run `validateClarifyComplete(state, runDir)` to verify ALL clarifier artifacts exist. If ANY file is missing, **STOP** — do not dispatch the executor subagent.

```bash
wazir validate manifest && wazir validate hooks
# Hard gate — stop if either fails.
```

Update pipeline state:
```
transitionPhase(stateRoot, 'execute')
wazir capture event --run <run-id> --event phase_enter --phase executor --status in_progress
```

## Dispatch

Read `skills/executor/SKILL.md` from disk. Build the subagent prompt.

**Input artifacts for executor subagent:**
- `.wazir/runs/<id>/clarified/clarification.md`
- `.wazir/runs/<id>/clarified/spec-hardened.md`
- `.wazir/runs/<id>/clarified/design.md`
- `.wazir/runs/<id>/clarified/execution-plan.md`
- `.wazir/runs/<id>/run-config.yaml`
- `.wazir/state/config.json`

**Required output artifacts:**
- `.wazir/runs/<id>/artifacts/task-NNN/` (at least one)
- `.wazir/runs/<id>/artifacts/verification-proof.md`

Dispatch: `Agent(prompt=..., description="wazir: executor")`

The executor subagent handles BOTH the execute and verify workflows internally.

## Post-Dispatch

Run guardrail: `validateExecuteComplete(state, runDir)`

If guardrail passes:
```bash
completePhase(stateRoot, 'execute', { verification_proof: { path: '...' } })
transitionPhase(stateRoot, 'verify')
completePhase(stateRoot, 'verify', { verification_proof: { path: '...' } })
wazir capture event --run <run-id> --event phase_exit --phase executor --status completed
wazir report phase --run <run-id> --phase executor
```

If guardrail fails: execute Retry Ladder.

**After executor subagent completes, output to the user:**

> **Executor Phase complete.**
>
> **Found:** [N]/[N] tasks implemented, [N] tests written, [N] per-task review passes completed
>
> **Without this phase:** Code would ship without tests, review findings would accumulate until final review (10x more expensive to fix), and verification claims would be unsubstantiated

---

# Phase 4: Final Review (Subagent)

**Before dispatching, output to the user:**

> **Final Review Phase** — Dispatching reviewer subagent for adversarial 7-dimension review comparing implementation against your original input.
>
> **Why this matters:** Without this, implementation drift ships undetected, missing acceptance criteria go unnoticed, and the same mistakes repeat.

## Pre-Dispatch Guardrail (Hard Gate)

Run `validateVerifyComplete(state, runDir)` to verify verification proof exists. If missing, **STOP**.

Update pipeline state:
```
transitionPhase(stateRoot, 'review')
wazir capture event --run <run-id> --event phase_enter --phase final_review --status in_progress
```

## Dispatch

Read `skills/reviewer/SKILL.md` from disk. Build the subagent prompt.

**Input artifacts for reviewer subagent:**
- `.wazir/input/briefing.md` (original input — compare implementation against THIS)
- `.wazir/runs/<id>/clarified/spec-hardened.md`
- `.wazir/runs/<id>/artifacts/verification-proof.md`
- `.wazir/runs/<id>/run-config.yaml`
- `.wazir/state/config.json`
- Git diff: `git diff main..HEAD`

**Required output artifacts:**
- `.wazir/runs/<id>/reviews/final-review.md`
- `.wazir/runs/<id>/reviews/verdict.json` (must have numeric `score` field)

Additional instructions in the subagent prompt:
```
Run in --mode final. Produce a 7-dimension scored review.
Write verdict.json with { "score": N, "verdict": "PASS|NEEDS_MINOR_FIXES|NEEDS_REWORK|FAIL" }
Compare implementation against the ORIGINAL INPUT (briefing.md), not just the spec.
Use Codex for external review if configured in config.json.
```

Dispatch: `Agent(prompt=..., description="wazir: reviewer")`

## Post-Dispatch

Run guardrail: `validateReviewComplete(state, runDir)`

If guardrail passes:
```bash
completePhase(stateRoot, 'review', { review_verdict: { path: '...' } })
wazir capture event --run <run-id> --event phase_exit --phase final_review --status completed
transitionPhase(stateRoot, 'complete')
wazir report phase --run <run-id> --phase final_review
```

If guardrail fails: execute Retry Ladder.

**After reviewer subagent completes, output to the user:**

> **Final Review Phase complete.**
>
> **Found:** [N] findings across 7 dimensions, [N] blocking issues, [N] warnings
>
> **Without this phase:** Implementation drift from the original request would ship undetected, untested paths would hide production bugs

---

## Step 5: CHANGELOG + Gitflow Validation (Hard Gates)

Before presenting results:

```bash
wazir validate changelog --require-entries --base main
wazir validate commits --base main
```

Both must pass before PR. These are not warnings.

## Step 6: Present Results

After the reviewer completes, present verdict with numbered options:

### If PASS (score 56+):

> **Result: PASS (score/70)**

Ask the user via AskUserQuestion:
- **Question:** "Pipeline passed. What would you like to do next?"
- **Options:**
  1. "Create a PR" *(Recommended)*
  2. "Merge directly"
  3. "Review the changes first"

Wait for the user's selection before continuing.

### If NEEDS MINOR FIXES (score 42-55):

> **Result: NEEDS MINOR FIXES (score/70)**

Ask the user via AskUserQuestion:
- **Question:** "Minor issues found. How should we handle them?"
- **Options:**
  1. "Auto-fix and re-review" *(Recommended)*
  2. "Fix manually"
  3. "Accept as-is"

Wait for the user's selection before continuing.

### If NEEDS REWORK (score 28-41):

> **Result: NEEDS REWORK (score/70)**

Ask the user via AskUserQuestion:
- **Question:** "Significant issues found. How should we proceed?"
- **Options:**
  1. "Re-run affected tasks" *(Recommended)*
  2. "Review findings in detail"
  3. "Abandon this run"

Wait for the user's selection before continuing.

### If FAIL (score 0-27):

> **Result: FAIL (score/70)**
>
> Something fundamental went wrong. Review the findings above.

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
