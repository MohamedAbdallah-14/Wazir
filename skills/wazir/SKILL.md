---
name: wz:wazir
description: One-command pipeline — type /wazir followed by what you want to build. Handles init, clarification, execution, review, and audits automatically.
---

# Wazir — Full Pipeline Runner

The user typed `/wazir <their request>`. Run the entire pipeline end-to-end, handling each phase automatically and only pausing where human input is required.

All questions use **numbered interactive options** — one question at a time, defaults marked "(Recommended)", wait for user response before proceeding.

## Subcommand Detection

Before anything else, check if the request starts with a known subcommand:

| Input | Action |
|-------|--------|
| `/wazir audit ...` | Jump to **Audit Mode** (see below) |
| `/wazir prd [run-id]` | Jump to **PRD Mode** (see below) |
| `/wazir init` | Invoke the `init-pipeline` skill directly, then stop |
| Anything else | Continue to Step 1 (normal pipeline) |

---

# Normal Pipeline Mode

## Step 1: Capture the Request

Take whatever the user wrote after `/wazir` and save it as the briefing:

1. Create `.wazir/input/` if it doesn't exist
2. Write the user's request to `.wazir/input/briefing.md` with a timestamp header

If the user provided no text after `/wazir`, ask:

> **What would you like to build?**

Save their answer as the briefing, then continue.

### Inline Modifiers

Parse the request for inline modifiers before the main text. These skip the corresponding interview question:

- `/wazir quick fix the login redirect` → depth = quick, intent = bugfix
- `/wazir deep design a new onboarding flow` → depth = deep, intent = feature
- `/wazir feature add CSV export` → intent = feature, depth = standard (default)

Recognized modifiers:
- **Depth:** `quick`, `deep` (standard is default when omitted)
- **Intent:** `bugfix`, `feature`, `refactor`, `docs`, `spike`

## Step 2: Check Prerequisites

### CLI Check

Run `which wazir` to check if the CLI is installed.

**If not installed**, present:

> **The Wazir CLI is not installed. It's required for event capture, validation, and indexing.**
>
> **How would you like to install it?**
>
> 1. **npm** (Recommended) — `npm install -g @wazir-dev/cli`
> 2. **Local link** — `npm link` from the Wazir project root

If the user picks 1, run `npm install -g @wazir-dev/cli` and verify with `wazir --version`.
If the user picks 2, run `npm link` from the project root and verify.

The CLI is **required** — the pipeline uses `wazir capture`, `wazir validate`, `wazir index`, and `wazir doctor` throughout execution. There is no skip option.

**If installed**, run `wazir doctor --json` to verify repo health.

If doctor reports unhealthy:
> **Repo health check failed:** [details from doctor output]
> Fix issues before running the pipeline.

Stop. Do NOT continue the pipeline until the health check passes.

### Branch Check

Run `wazir validate branches` to check the current git branch.

- If on `main` or `develop`:
  > You're on **[branch]**. The pipeline requires a feature branch.
  >
  > 1. **Create feat/<slug>** (Recommended) — branch from current
  > 2. **Continue on [branch]** — not recommended for feature/refactor work

  Wait for the user to answer before continuing.

- If branch name is invalid (not `feat/`, `fix/`, `chore/`, etc.): warn but continue.

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

- **If missing** — invoke the `init-pipeline` skill. This will ask the user interactive questions to set up the config.
- **If exists** — continue to Step 2.5.

## Step 2.5: Resume Detection

Check if a previous incomplete run exists (via `latest` symlink pointing to a run without `completed_at` in its `run-config.yaml`).

**If previous incomplete run found**, present interactive choice:

> **A previous incomplete run was detected:** `<previous-run-id>`
>
> 1. **Resume** (Recommended) — copy artifacts from the previous run and continue from the last completed phase
> 2. **Start fresh** — create a new empty run (previous artifacts remain in the old run directory)

**Wait for the user to answer before continuing.**

**If Resume:**
- Copy `clarified/` from previous run into new run, EXCEPT `user-feedback.md` (starts empty per Item 11).
- The `tasks/` directory is NOT copied (deprecated — all task detail lives in `execution-plan.md`).
- Detect last completed phase by checking which artifacts exist in the copied directory.
- Resume from the last completed phase.
- **Staleness check:** Compare modification times of ALL files in `.wazir/input/` against copied artifacts. If ANY input file is newer than the copied artifacts, present interactive checkpoint:
  > **Warning: The following input files were modified after the previous run's artifacts:**
  > - `<file1>` (modified <date>)
  > - `<file2>` (modified <date>)
  >
  > 1. **Re-run clarification from scratch** (Recommended) — discard copied artifacts and start Phase 0
  > 2. **Continue with existing artifacts** — acknowledge stale risk and proceed

  **Wait for the user to answer before continuing.**

**If Start fresh** or no previous run: create empty run directory.

## Step 2.6: Create Run Directory

Generate a run ID using the current timestamp: `run-YYYYMMDD-HHMMSS`

```bash
mkdir -p .wazir/runs/run-YYYYMMDD-HHMMSS/{sources,tasks,artifacts,reviews,clarified}
ln -sfn run-YYYYMMDD-HHMMSS .wazir/runs/latest
```

If a previous completed run exists (check for a `completed_at` field in the previous `latest` run's `run-config.yaml`), record its `run_id` as `parent_run_id` in the new run's config.

After creating the run directory, initialize event capture:

```bash
wazir capture init --run <run-id> --phase clarify --status starting
```

Record context-mode availability in the run-config so downstream phases know whether to use `fetch_and_index`/`execute` or fall back to `WebFetch`/`Bash`. Read `context_mode` from `.wazir/state/config.json` and note it in the run's `run-config.yaml`.

## Step 3: Pre-Flight Configuration

Build the run configuration. Skip questions that were answered via inline modifiers.

### Question 1: Depth (if not set via modifier)

> **How thorough should this run be?**
>
> 1. **Quick** — Minimal research, single-pass review, fast execution. Good for small fixes and config changes.
> 2. **Standard** (Recommended) — Balanced research, multi-pass hardening, full review. Good for most features.
> 3. **Deep** — Extended research, thorough hardening, strict review thresholds. Good for complex or security-critical work.

### Question 2: Intent (if not set via modifier and not obvious from the request)

Only ask this if the request is ambiguous. If the intent is clear from the text (e.g., "fix the bug" → bugfix), infer it and skip.

> **What kind of work is this?**
>
> 1. **Feature** (Recommended) — New functionality or enhancement
> 2. **Bugfix** — Fix broken behavior
> 3. **Refactor** — Restructure without changing behavior
> 4. **Docs** — Documentation only
> 5. **Spike** — Research and exploration, no production code

### Question 3: Agent Teams (conditional)

Only ask this if ALL of these are true:
- The host is Claude Code (not Codex/Gemini/Cursor)
- Depth is `standard` or `deep`
- Intent is `feature` or `refactor` (not bugfix/docs/spike)

> **Would you like to use Agent Teams for parallel execution?**
>
> 1. **No** (Recommended) — Tasks run sequentially. Predictable, lower cost.
> 2. **Yes** — Spawns parallel teammates for independent tasks. Potentially faster and richer output.
>
> *Agent Teams is experimental from Claude's side. Requires Opus model. Higher token consumption.*

### Write Run Config

Save all decisions to `.wazir/runs/<run-id>/run-config.yaml`:

```yaml
# Identity
run_id: run-20260317-143000
parent_run_id: null                    # set if resuming/continuing from a prior run
continuation_reason: null              # e.g. "review found minor fixes"

# User request
request: "the original user request"
request_summary: "short summary of intent"
parsed_intent: feature                 # feature | bugfix | refactor | docs | spike
entry_point: "/wazir"                  # how the user entered the pipeline

# Configuration
depth: standard                        # quick | standard | deep
team_mode: sequential                  # sequential | parallel
parallel_backend: none                 # none | claude_teams (future: subagents, worktrees)

# Phase policy (system-decided, not user-facing)
phase_policy:
  discover:       { enabled: true, loop_cap: 10 }
  clarify:        { enabled: true, loop_cap: 10 }
  specify:        { enabled: true, loop_cap: 10 }
  spec-challenge: { enabled: true, loop_cap: 10 }
  author:         { enabled: false, loop_cap: 10 }
  design:         { enabled: true, loop_cap: 10 }
  design-review:  { enabled: true, loop_cap: 10 }
  plan:           { enabled: true, loop_cap: 10 }
  plan-review:    { enabled: true, loop_cap: 10 }
  execute:        { enabled: true, loop_cap: 10 }
  verify:         { enabled: true, loop_cap: 5 }
  review:         { enabled: true, loop_cap: 10 }
  learn:          { enabled: false, loop_cap: 5 }
  prepare_next:   { enabled: false, loop_cap: 5 }
  run_audit:      { enabled: false, loop_cap: 10 }

# Research
research_topics: []                    # populated by researcher phase

# Timestamps
created_at: 2026-03-17T14:30:00Z
completed_at: null
```

Mutable execution state (current phase, task progress, error counts) lives in `.wazir/runs/<run-id>/status.json`, NOT in `run-config.yaml`. The run config captures setup decisions only.

### Phase Policy

Map intent + depth to applicable phases. The system decides — the user does NOT pick phases.

**Phase classes:**

| Class | Phases | Rules |
|-------|--------|-------|
| **Core** (always run) | `clarify`, `verify`, `review` | Never skipped |
| **Adaptive** (run when evidence says so) | `discover`, `design`, `author`, `specify` | Skipped for bugfix/docs/spike at quick depth |
| **Scale** (intensity varies) | `spec-challenge`, `plan-review`, `design-review` | Loop cap controls iteration depth |

Log skip decisions to the run's `run-config.yaml` with reasons:

```yaml
phase_policy:
  discover:       { enabled: true, loop_cap: 10 }
  design:         { enabled: false, loop_cap: 10, reason: "bugfix intent — no design needed" }
  spec-challenge: { enabled: true, loop_cap: 10 }
```

### Confidence Gate

After building the run config, evaluate confidence:

- **High confidence** (clear intent, depth set, no ambiguity) — show a one-line summary and proceed:
  > **Running: standard depth, feature, sequential. 11 of 15 phases. Proceeding...**

- **Low confidence** (ambiguous intent, unclear scope) — show the full plan and ask:
  > **Here's the run plan:**
  > - Depth: standard
  > - Intent: feature
  > - Phases: [list enabled phases]
  > - Skipped: [list skipped with reasons]
  >
  > **Does this look right?**
  > 1. **Yes, proceed** (Recommended)
  > 2. **No, let me adjust**

## Step 4: Run Pipeline Phases

The full pipeline runs these phases in order. Each phase produces an artifact that must pass its review loop before flowing to the next phase. Review mode is always passed explicitly (`--mode`) -- no auto-detection.

**Phase exit protocol:** At EVERY `phase_exit` event, immediately after the exit event capture, run these steps in order:

1. **Usage capture:**
   ```bash
   wazir capture usage --run <run-id> --phase <phase> --json
   ```
   Output: `.wazir/runs/<run-id>/reviews/usage-<phase>.json`

2. **End-of-phase report:** Generate a report at `.wazir/runs/<run-id>/reviews/<phase>-report.md` containing: Summary, Key Changes, Quality Delta (per-dimension before/after scores), Findings Log (per-pass finding counts by severity — e.g., "Pass 1: 6 findings (3 blocking, 2 warning, 1 note)"), Usage (from step 1), Context Savings (from context-mode stats if available, omit if not), Time Spent (wall-clock elapsed from phase start, omit if timestamps unavailable). See `docs/reference/review-loop-pattern.md` "End-of-Phase Report" for the full template.

This applies to ALL phases: clarify, discover, specify, spec-challenge, design, design-review, plan, plan-review, execute, review.

### 4a: Source Capture

Before invoking the clarifier, capture all referenced sources locally:

- Fetch all URLs referenced in `.wazir/input/` briefing files
- Save fetched content to `.wazir/runs/<run-id>/sources/`
- Name files as `src-NNN-<slug>.md` (fetched content) or `src-NNN-fetch-failed.json` (failures)
- Create `.wazir/runs/<run-id>/sources/manifest.json` indexing all captures:

```json
[
  {
    "id": "src-001",
    "origin_url": "https://...",
    "fetch_time": "2026-03-17T14:30:00Z",
    "content_hash": "sha256:abc...",
    "status": "captured",
    "local_path": "src-001-github-readme.md"
  },
  {
    "id": "src-002",
    "origin_url": "https://...",
    "status": "failed",
    "error": "403 Forbidden",
    "fetch_time": "2026-03-17T14:30:01Z"
  }
]
```

Research briefs produced by the researcher must reference local paths (`sources/src-001-...`) instead of live URLs. The original URL is preserved in the manifest for provenance. Failures are recorded explicitly — never silently skipped.

### 4b: Clarify (clarifier role)

```bash
wazir capture event --run <run-id> --event phase_enter --phase clarify --status in_progress
```

Invoke the clarifier skill for Phase 1A.
Produces clarification artifact.
Review: clarification-review loop (`--mode clarification-review`, spec/clarification dimensions).
Pass count: quick=3, standard=5, deep=7. No extension.
Checkpoint: user approves clarification.

```bash
wazir capture event --run <run-id> --event phase_exit --phase clarify --status completed
```

### 4c: Research (researcher role via discover workflow)

```bash
wazir capture event --run <run-id> --event phase_enter --phase discover --status in_progress
```

Clarifier delegates to discover workflow (researcher role).
Produces research artifact.
Review: research-review loop (`--mode research-review`, research dimensions).
Pass count: quick=3, standard=5, deep=7. No extension.
Skip condition: depth=quick AND intent=bugfix.

```bash
wazir capture event --run <run-id> --event phase_exit --phase discover --status completed
```

### 4d: Specify (specifier role)

```bash
wazir capture event --run <run-id> --event phase_enter --phase specify --status in_progress
```

Delegate to specify workflow.
Specifier produces measurable spec from clarification + research.
Review: spec-challenge loop (`--mode spec-challenge`, spec/clarification dimensions).
Pass count: quick=3, standard=5, deep=7. No extension.
Checkpoint: user approves spec.

```bash
wazir capture event --run <run-id> --event phase_exit --phase specify --status completed
```

### 4d.5: Author (content-author role) [ADAPTIVE]

```bash
wazir capture event --run <run-id> --event phase_enter --phase author --status in_progress
```

Enabled when `phase_policy.author.enabled = true` (default: false).
Content-author writes non-code content artifacts.
Approval gate: human approval required (not a review loop).
Skip condition: disabled by default. Enable for content-heavy projects.

```bash
wazir capture event --run <run-id> --event phase_exit --phase author --status completed
```

### 4e: Brainstorm (designer role)

```bash
wazir capture event --run <run-id> --event phase_enter --phase design --status in_progress
```

Invoke brainstorming skill for Phase 1B.
Interactive -- pauses for user approval of design concept.
After user approval: design-review loop (`--mode design-review`,
canonical design-review dimensions: spec coverage, design-spec consistency,
accessibility, visual consistency, exported-code fidelity).
Pass count: quick=3, standard=5, deep=7. No extension.
Skip condition: intent=bugfix/docs.

```bash
wazir capture event --run <run-id> --event phase_exit --phase design --status completed
```

### 4f: Plan (planner role via wz:writing-plans)

```bash
wazir capture event --run <run-id> --event phase_enter --phase plan --status in_progress
```

Delegate to `wz:writing-plans`.
Planner produces execution plan and task specs.
Review: plan-review loop (`--mode plan-review`, plan dimensions).
Pass count: quick=3, standard=5, deep=7. No extension.
Checkpoint: user approves plan.

```bash
wazir capture event --run <run-id> --event phase_exit --phase plan --status completed
```

### 4g: Execute (executor role)

```bash
wazir capture event --run <run-id> --event phase_enter --phase execute --status in_progress
```

**Pre-execution gate** — run before the first task:

```bash
wazir validate manifest && wazir validate hooks
# If either fails, stop and report the failure. Do NOT proceed to task execution.
```

Invoke executor skill for Phase 2.
Per-task review: task-review loop (`--mode task-review --task-id <NNN>`,
5 task-execution dimensions) before each commit.
Review logs: `execute-task-<NNN>-review-pass-<N>.md`
Cap tracking: `wazir capture loop-check --task-id <NNN>`
Codex error handling: non-zero exit -> codex-unavailable, self-review only.
NOTE: per-task review is NOT the final review.

If `team_mode: parallel` in run-config, the executor spawns Agent Teams for independent tasks. Otherwise, tasks run sequentially.

```bash
wazir capture event --run <run-id> --event phase_exit --phase execute --status completed
```

### 4h: Verify (verifier role)

```bash
wazir capture event --run <run-id> --event phase_enter --phase verify --status in_progress
```

Deterministic verification of execution claims.
Not a review loop -- produces proof, not findings.

```bash
wazir capture event --run <run-id> --event phase_exit --phase verify --status completed
```

### 4i: Final Review (reviewer role in final mode)

```bash
wazir capture event --run <run-id> --event phase_enter --phase review --status in_progress
```

Invoke reviewer skill with `--mode final`.
7-dimension scored review (correctness, completeness, wiring, verification,
drift, quality, documentation). Score 0-70.
This IS the scored final review gate.

```bash
wazir capture event --run <run-id> --event phase_exit --phase review --status completed
```

### 4j: Learn (learner role) [ADAPTIVE]

Enabled when `phase_policy.learn.enabled = true` (default: false).
Extract durable learnings from the completed run.
No review loop. Learnings require explicit scope tags.
Skip condition: disabled by default. Enable for retrospective runs.

### 4k: Prepare Next (planner role) [ADAPTIVE]

Enabled when `phase_policy.prepare_next.enabled = true` (default: false).
Prepare context and handoff for the next run.
No review loop. No implicit carry-forward of unapproved learnings.
Skip condition: disabled by default.

`run_audit` is NOT part of the pipeline flow -- it is an on-demand standalone phase invoked separately.

### Resume Detection

If the run has partial progress, detect the latest completed phase and resume:

- If clarification exists but no spec: resume at 4d (specify)
- If spec exists but no design: resume at 4e (brainstorm)
- If design exists but no plan: resume at 4f (plan)
- If plan exists but no task artifacts: resume at 4g (execute)
- If task artifacts exist but no verification: resume at 4h (verify)
- If verification exists: resume at 4i (final review)

Present resume options:

> **Previous progress detected (completed through [phase]).**
>
> **What would you like to do?**
> 1. **Resume from [next phase]** (Recommended)
> 2. **Start fresh** — Re-run all phases from scratch

## Step 4.5: CHANGELOG + Gitflow Validation (Hard Gates)

Before presenting results or creating a PR, run these validations. Both are **hard gates** — must fix before PR:

```bash
wazir validate changelog --require-entries --base main
```
If this fails, CHANGELOG entries are missing for user-facing changes. Must fix before continuing.

```bash
wazir validate commits --base main
```
If this fails, commits don't follow conventional format or branch naming. Must fix before continuing.

These are not warnings — the pipeline stops here until both pass.

## Step 5: Present Results

After the reviewer completes, present the verdict and offer next steps with numbered options:

### If PASS (score 56+):

> **Result: PASS (score/70)**
>
> [score breakdown]
>
> **What would you like to do?**
> 1. **Create a PR** (Recommended)
> 2. **Merge directly**
> 3. **Review the changes first**

### If NEEDS MINOR FIXES (score 42-55):

> **Result: NEEDS MINOR FIXES (score/70)**
>
> [findings list]
>
> **What would you like to do?**
> 1. **Auto-fix and re-review** (Recommended)
> 2. **Fix manually**
> 3. **Accept as-is**

### If NEEDS REWORK (score 28-41):

> **Result: NEEDS REWORK (score/70)**
>
> [findings list with affected tasks]
>
> **What would you like to do?**
> 1. **Re-run affected tasks** (Recommended)
> 2. **Review findings in detail**
> 3. **Abandon this run**

### If FAIL (score 0-27):

> **Result: FAIL (score/70)**
>
> [full findings]
>
> Something fundamental went wrong. Review the findings above and decide how to proceed.

### Run Summary

After presenting results (regardless of verdict), capture the run summary:

```bash
wazir capture summary --run <run-id>
wazir status --run <run-id> --json
```

## Error Handling

If any phase fails or the user cancels:

1. Report which phase failed and why
2. Present recovery options:

> **Phase [name] failed: [reason]**
>
> **What would you like to do?**
> 1. **Retry this phase** (Recommended)
> 2. **Skip and continue** (only if phase is adaptive, not core)
> 3. **Abort the run**

The run config persists, so running `/wazir` again will detect the partial state and offer to resume.

---

# Audit Mode

Triggered by `/wazir audit` or `/wazir audit <focus>`.

Runs a structured codebase audit. Invokes the `run-audit` skill with the interactive question flow.

## Inline Audit Modifiers

Parse for known audit types after `audit`:

- `/wazir audit security` → audit type = security, skip Question 1
- `/wazir audit deps` → audit type = dependencies, skip Question 1
- `/wazir audit` → ask Question 1

Then let the `run-audit` skill handle the rest (scope, output mode). All its questions already follow the interactive numbered pattern.

After the audit completes:

> **Audit complete. What would you like to do?**
>
> 1. **Review the findings** (Recommended)
> 2. **Generate a fix plan** — turn findings into implementation tasks
> 3. **Run the pipeline on the fix plan** — generate plan, then execute and review fixes

If the user picks option 3, save the findings as the briefing and run the normal pipeline (Steps 3-5) with intent = `bugfix`.

---

# PRD Mode

Triggered by `/wazir prd` or `/wazir prd <run-id>`.

Generates a Product Requirements Document from a completed pipeline run.

## Pre-Flight

1. If a `<run-id>` was provided, use that run's directory. Otherwise, use `.wazir/runs/latest`.
2. Verify the run has completed artifacts:
   - Design doc in the run's tasks or in `docs/plans/`
   - Task specs in the run's `clarified/`
   - Review results in the run's `reviews/` (if available)
3. If the run is incomplete or has no artifacts:

> **No completed run found. Run `/wazir <your request>` first to create a pipeline run, then use `/wazir prd` to generate the PRD.**

## Inputs (read-only)

Read these artifacts from the completed run:
- Approved design document
- Task specs (all `spec.md` files in `clarified/`)
- Execution plan
- Review results and verification proofs (if available)
- Run config (for context on depth, intent, decisions)

## Output

Generate a PRD and save to `docs/prd/YYYY-MM-DD-<topic>-prd.md`.

### PRD Template

```markdown
# Product Requirements Document — <Topic>

**Generated from run:** `<run-id>`
**Date:** YYYY-MM-DD

## Vision & Core Thesis

[1-2 paragraphs synthesized from the design document's core approach]

## What We're Building

### Feature Area 1: <name>

**What:** [description from task specs]
**Why:** [rationale from design doc]
**Requirements:**
- [ ] [from task spec acceptance criteria]
- [ ] ...

### Feature Area 2: <name>
...

## Success Criteria

[From review results and verification proofs — what was tested and confirmed]

## Technical Constraints

[From architecture decisions, run config, and design trade-offs]

## What's NOT in Scope

[From design doc's rejected alternatives and explicit exclusions]

## Open Questions

[From design doc's open questions and review findings]
```

## After Generation

> **PRD generated at `docs/prd/YYYY-MM-DD-<topic>-prd.md`.**
>
> **What would you like to do?**
> 1. **Review the PRD** (Recommended)
> 2. **Commit it**
> 3. **Edit before committing**

---

## Interaction Rules

These rules apply to ALL questions in the pipeline, including those asked by sub-skills (clarifier, executor, reviewer) and audit modes:

- **One question at a time** — never combine multiple questions
- **Numbered options** — always present choices as numbered lists
- **Mark defaults** — always show "(Recommended)" on the suggested option
- **Wait for answer** — never proceed past a question until the user responds
- **No open-ended questions** — every question has concrete options to pick from
- **Inline answers accepted** — users can type the number or the option name
