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
> 1. **npm** (Recommended) — `npm install -g wazir`
> 2. **Local link** — `npm link` from the Wazir project root
> 3. **Skip** — Continue without the CLI (some features will be unavailable)

If the user picks 1, run `npm install -g wazir` and verify with `wazir --version`.
If the user picks 2, run `npm link` from the project root and verify.
If the user picks 3, warn that `wazir capture`, `wazir validate`, and `wazir index` commands will not work, then continue.

**If installed**, run `wazir doctor --json` to verify repo health.

### Pipeline Init Check

Check if `.wazir/state/config.json` exists.

- **If missing** — invoke the `init-pipeline` skill. This will ask the user interactive questions to set up the config.
- **If exists** — continue to Step 2.5.

## Step 2.5: Create Run Directory

Generate a run ID using the current timestamp: `run-YYYYMMDD-HHMMSS`

```bash
mkdir -p .wazir/runs/run-YYYYMMDD-HHMMSS/{sources,tasks,artifacts,reviews}
ln -sfn run-YYYYMMDD-HHMMSS .wazir/runs/latest
```

If a previous completed run exists (check for a `completed_at` field in the previous `latest` run's `run-config.yaml`), record its `run_id` as `parent_run_id` in the new run's config.

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
  discover: { enabled: true, reason: "feature intent requires research" }
  design: { enabled: true, reason: "new UI component" }
  spec-challenge: { enabled: true, passes: 2, reason: "standard depth" }
  author: { enabled: false, reason: "no i18n or seed data needed" }
  plan-review: { enabled: true, passes: 1 }

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
| **Scale** (intensity varies) | `spec-challenge`, `plan-review`, `design-review` | Single-pass at quick, multi-pass at deep |

Log skip decisions to the run's `run-config.yaml` with reasons:

```yaml
phase_policy:
  discover: { enabled: true }
  design: { enabled: false, reason: "bugfix intent — no design needed" }
  spec-challenge: { enabled: true, passes: 1, reason: "quick depth" }
```

### Confidence Gate

After building the run config, evaluate confidence:

- **High confidence** (clear intent, depth set, no ambiguity) — show a one-line summary and proceed:
  > **Running: standard depth, feature, sequential. 11 of 14 phases. Proceeding...**

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

## Step 4: Run Clarifier

### Source Capture

Before invoking the clarifier, instruct the researcher to capture all referenced sources locally:

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

### Clarifier Invocation

Invoke the `clarifier` skill.

This runs the full Phase 0 + Phase 1 pipeline:
- Phase 0: Research (autonomous — skipped if depth=quick and intent=bugfix)
- Phase 1A: Clarify (autonomous)
- Phase 1A+: Spec Harden (passes determined by depth)
- Phase 1B: Brainstorm (interactive — **will pause for user approval**. If `team_mode: parallel`, uses structured dialogue with Free Thinker + Grounder + Synthesizer agents)
- Phase 1C: Plan (task generation)

**Resume detection:** If `.wazir/runs/latest/clarified/` already has task specs and an execution plan, ask:

> **Clarification was already completed. What would you like to do?**
>
> 1. **Skip to execution** (Recommended) — Use existing task specs
> 2. **Re-run clarifier** — Start fresh

## Step 5: Run Executor

Invoke the `executor` skill.

This runs Phase 2: autonomous execution with the composition engine, TDD, and quality gates.

If `team_mode: parallel` in run-config, the executor spawns Agent Teams for independent tasks. Otherwise, tasks run sequentially.

**Resume detection:** If `.wazir/runs/latest/artifacts/` has completed artifacts, ask:

> **Some tasks are already completed. What would you like to do?**
>
> 1. **Resume** (Recommended) — Continue from where it left off
> 2. **Start fresh** — Re-run all tasks from scratch

## Step 6: Run Reviewer

Invoke the `reviewer` skill.

This runs Phase 3: final scoring across 7 dimensions, produces a verdict.

## Step 7: Present Results

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

If the user picks option 3, save the findings as the briefing and run the normal pipeline (Steps 3-7) with intent = `bugfix`.

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
