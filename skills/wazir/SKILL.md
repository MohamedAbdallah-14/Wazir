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

# Phase 2: Clarifier

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
5. **Brainstorm** (design + design-review workflows) — design approaches
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

Run the phase report and display it to the user:
```bash
wazir report phase --run <run-id> --phase clarifier
```

Output the report content to the user in the conversation.

---

# Phase 3: Executor

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

Run the phase report and display it to the user:
```bash
wazir report phase --run <run-id> --phase executor
```

Output the report content to the user in the conversation.

---

# Phase 4: Final Review

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

**After completing this phase, output to the user:**

> **Final Review Phase complete.**
>
> **Found:** [N] findings across 7 dimensions, [N] blocking issues, [N] warnings, [N] learnings proposed for future runs
>
> **Without this phase:** Implementation drift from the original request would ship undetected, untested paths would hide production bugs, and recurring mistakes would never get captured as learnings
>
> **Changed because of this work:** [List of findings fixed, score achieved, learnings extracted, handoff prepared]

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
