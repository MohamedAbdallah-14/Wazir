---
name: wz:reviewer
description: Run the review phase — adversarial review of implementation against the approved spec, plan, and verification evidence.
---

# Reviewer

## Model Annotation
When multi-model mode is enabled:
- **Sonnet** for internal review passes (internal-review)
- **Opus** for final review mode (final-review)
- **Opus** for spec-challenge mode (spec-harden)
- **Opus** for design-review mode (design)

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

Run the Final Review phase — or any review mode invoked by other phases.

The reviewer role owns all review loops across the pipeline: research-review, clarification-review, spec-challenge, design-review, plan-review, per-task execution review, and final review. Each uses phase-specific dimensions from `docs/reference/review-loop-pattern.md`.

**Key principle for `final` mode:** Compare implementation against the **ORIGINAL INPUT** (briefing + input files), NOT the task specs. The executor's per-task reviewer already validated against task specs — that concern is covered. The final reviewer catches drift: does what we built match what the user actually asked for?

**Reviewer-owned responsibilities** (callers must NOT replicate these):
1. **Two-tier review** — internal review first (fast, cheap, expertise-loaded), Codex second (fresh eyes on clean code)
2. **Dimension selection** — the reviewer selects the correct dimension set for the review mode and depth
3. **Pass counting** — the reviewer tracks pass numbers and enforces the depth-based cap (quick=3, standard=5, deep=7)
4. **Finding attribution** — each finding is tagged `[Internal]`, `[Codex]`, or `[Both]` based on source
5. **Dimension set recording** — each review pass file records which canonical dimension set was used, enabling Phase Scoring (first vs final delta)
6. **Learning pipeline** — ALL findings (internal + Codex) feed into `state.sqlite` and the learning system

## Review Modes

The reviewer operates in different modes depending on the phase. Mode MUST be passed explicitly by the caller (`--mode <mode>`). The reviewer does NOT auto-detect mode from artifact availability. If `--mode` is not provided, ask the user which review to run.

| Mode | Invoked during | Prerequisites | Dimensions | Output |
|------|---------------|---------------|------------|--------|
| `final` | After execution + verification | Completed task artifacts, approved spec/plan/design | 7 final-review dims, scored 0-70 | Scored verdict (PASS/FAIL) |
| `spec-challenge` | After specify | Draft spec artifact | 5 spec/clarification dims | Pass/fix loop, no score |
| `design-review` | After design approval | Design artifact, approved spec | 5 design-review dims (canonical) | Pass/fix loop, no score |
| `plan-review` | After planning | Draft plan artifact | 7 plan dims | Pass/fix loop, no score |
| `task-review` | During execution, per task | Uncommitted changes or `--base` SHA | 5 task-execution dims (correctness, tests, wiring, drift, quality) | Pass/fix loop, no score |
| `research-review` | During discover | Research artifact | 5 research dims | Pass/fix loop, no score |
| `clarification-review` | During clarify | Clarification artifact | 5 spec/clarification dims | Pass/fix loop, no score |

Each mode follows the review loop pattern in `docs/reference/review-loop-pattern.md`. Pass counts are fixed by depth (quick=3, standard=5, deep=7). No extension.

### CHANGELOG Enforcement

In `task-review` and `final` modes, flag missing CHANGELOG entries for user-facing changes as **[warning]** severity. User-facing changes include new features, behavior changes, and bug fixes visible to users. Internal changes (refactors, tooling, tests) do not require CHANGELOG entries.

## Prerequisites

Prerequisites depend on the review mode:

### `final` mode

**Phase Prerequisites (Hard Gate):** Before proceeding, verify ALL of these artifacts exist. If ANY is missing, **STOP** and report which are missing.

- [ ] `.wazir/runs/latest/clarified/clarification.md`
- [ ] `.wazir/runs/latest/clarified/spec-hardened.md`
- [ ] `.wazir/runs/latest/clarified/design.md`
- [ ] `.wazir/runs/latest/clarified/execution-plan.md`
- [ ] `.wazir/runs/latest/artifacts/verification-proof.md`

If any file is missing:

> **Cannot run final review: missing prerequisite artifacts.**
>
> Missing: [list missing files]
>
> Run `/wazir:clarifier` (for clarified/* files) or `/wazir:executor` (for verification-proof.md) first.

1. Check `.wazir/runs/latest/artifacts/` has completed task artifacts. If not, tell the user to run `/wazir:executor` first.
2. Read the approved spec, plan, and design from `.wazir/runs/latest/clarified/`.
3. Read `.wazir/state/config.json` for depth and multi_tool settings.

### `task-review` mode
1. Uncommitted changes exist for the current task, or a `--base` SHA is provided for committed changes.
2. Read `.wazir/state/config.json` for depth and multi_tool settings.

### `spec-challenge`, `design-review`, `plan-review`, `research-review`, `clarification-review` modes
1. The appropriate input artifact for the mode exists.
2. Read `.wazir/state/config.json` for depth and multi_tool settings.

## Review Process (`final` mode)

**Input:** Read the ORIGINAL user input (`.wazir/input/briefing.md`, `input/` directory files) and compare against what was built. This catches intent drift that task-level review misses.

Perform adversarial review across 7 dimensions:

1. **Correctness** — Does the code do what the original input asked for? catches: logic errors, wrong return values, inverted conditions, off-by-one errors
2. **Completeness** — Are all requirements from the original input met? catches: missing features, partial implementations, unhandled input variants
3. **Wiring** — Are all paths connected end-to-end? catches: dead imports, unregistered routes, orphaned components, broken dependency chains
4. **Verification** — Is there evidence (tests, type checks) for each claim? catches: untested code paths, missing assertions, stale snapshots, type holes
5. **Drift** — Does the implementation match what the user originally requested? (not just the plan — the INPUT) catches: scope creep, silent re-scoping, requirements reinterpreted without user approval
6. **Quality** — Code style, naming, error handling, security catches: unhandled promise rejections, SQL injection, hardcoded secrets, inconsistent naming
7. **Documentation** — Changelog entries, commit messages, comments catches: missing changelog entries for user-facing changes, misleading commit messages, stale inline comments

## Context Retrieval

- Read the diff first (primary input)
- Use `wazir index search-symbols <name>` to locate related code
- Use `wazir recall symbol <name-or-id> --tier L1` to check structural alignment
- Read files directly for: logic errors, missing edge cases, integration concerns

## Scoring (`final` mode)

Score each dimension 0-10. Total out of 70.

| Verdict | Score | Action |
|---------|-------|--------|
| **PASS** | 56+ | Ready for PR or merge |
| **NEEDS MINOR FIXES** | 42-55 | Auto-fix and re-review |
| **NEEDS REWORK** | 28-41 | Re-run affected tasks |
| **FAIL** | 0-27 | Fundamental issues |

## Two-Tier Review Flow

The review process has two tiers. Internal review catches ~80% of issues quickly and cheaply. Codex review provides fresh eyes on clean code.

### Tier 1: Internal Review (Fast, Cheap, Expertise-Loaded)

1. **Compose expertise:** Load relevant expertise modules from `expertise/composition-map.yaml` into context based on the review mode and detected stack. This gives the internal reviewer domain-specific knowledge.
2. **Run internal review** using the dimension set for the current mode. When multi-model is enabled, use **Sonnet** (not Opus) for internal review passes — it's fast and good enough for pattern matching against expertise.
3. **Produce findings:** Each finding is tagged `[Internal]` with severity (blocking, warning, note).
4. **Fix cycle:** If blocking findings exist, the executor fixes them. Re-run internal review. Repeat until clean or cap reached.

Internal review passes are logged to `.wazir/runs/latest/reviews/<mode>-internal-pass-<N>.md`.

### Tier 2: External Review (Fresh Eyes on Clean Code)

Only runs AFTER Tier 1 produces a clean pass (no blocking findings).

Read `.wazir/state/config.json`. If `multi_tool.tools` includes external reviewers:

#### Codex Review

**For detailed Codex CLI usage, see `wz:codex-cli` skill.**

If `codex` is in `multi_tool.tools`:

1. Run Codex review against the current changes:
   ```bash
   CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null)
   CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}
   codex review -c model="$CODEX_MODEL" --uncommitted --title "Wazir review: <brief summary>" \
     "Review against these acceptance criteria: <paste criteria from spec>" \
     2>&1 | tee .wazir/runs/latest/reviews/codex-review.md
   ```
   Or if changes are committed:
   ```bash
   CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null)
   CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}
   codex review -c model="$CODEX_MODEL" --base <base-branch> --title "Wazir review: <brief summary>" \
     "Review against these acceptance criteria: <paste criteria from spec>" \
     2>&1 | tee .wazir/runs/latest/reviews/codex-review.md
   ```

2. **Extract findings only** (context protection): After tee, use `execute_file` to extract only the final findings from the Codex output (everything after the last `codex` marker). If context-mode is unavailable, use `tac <file> | sed '/^codex$/q' | tac | tail -n +2`. If no marker found, fail closed (0 findings, warn user). See `docs/reference/review-loop-pattern.md` "Codex Output Context Protection" for full protocol.
3. Incorporate extracted Codex findings into your scoring — if Codex flags something you missed, add it. If you disagree with a Codex finding, note it with your rationale.

**Codex error handling:** If codex exits non-zero (auth/rate-limit/transport failure), log the full stderr, mark the pass as `codex-unavailable` in the review log, and use internal review findings only for that pass. Do NOT treat a Codex failure as a clean review. Do NOT skip the pass. The next pass still attempts Codex (transient failures may recover).

**Code review scoping by mode:**
- Use `--uncommitted` when reviewing uncommitted changes (`task-review` mode).
- Use `--base <sha>` when reviewing committed changes.
- Use `codex exec -c model="$CODEX_MODEL"` with stdin pipe for non-code artifacts (`spec-challenge`, `design-review`, `plan-review`, `research-review`, `clarification-review` modes).
- See `docs/reference/review-loop-pattern.md` for code review scoping rules.

#### Gemini Review

If `gemini` is in `multi_tool.tools`, follow the same pattern using the Gemini CLI when available. **For detailed Gemini CLI usage, see `wz:gemini-cli` skill.**

### Fix Cycle (Codex Findings)

If Codex produces blocking findings:
1. Executor fixes the Codex findings
2. Re-run internal review (quick pass) to verify fixes didn't introduce regressions
3. Optionally re-run Codex for a clean pass

### Merging Findings

The final review report must clearly attribute each finding:
- `[Internal]` — found by Tier 1 internal review
- `[Codex]` — found by Tier 2 Codex review
- `[Gemini]` — found by Tier 2 Gemini review
- `[Both]` — found independently by multiple sources

### Finding Persistence (Learning Pipeline)

ALL findings from both tiers are persisted to `state.sqlite` for cross-run learning:

```javascript
// After each review pass
const { insertFinding, getRecurringFindingHashes } = require('tooling/src/state/db');
const db = openStateDb(stateRoot);

for (const finding of allFindings) {
  insertFinding(db, {
    run_id: runId,
    phase: reviewMode,
    source: finding.attribution, // 'internal', 'codex', 'gemini'
    severity: finding.severity,
    description: finding.description,
    finding_hash: hashFinding(finding.description),
  });
}

// Check for recurring patterns
const recurring = getRecurringFindingHashes(db, 2);
// Recurring findings → auto-propose as learnings in the learn phase
```

This is how Wazir evolves — findings that recur across runs become accepted learnings injected into future executor context, preventing the same mistakes.

## Task-Review Log Filenames

In `task-review` mode, use task-scoped log filenames and cap tracking:
- Log filenames: `.wazir/runs/latest/reviews/execute-task-<NNN>-review-pass-<N>.md`
- Cap tracking: `wazir capture loop-check --task-id <NNN>` (each task has its own independent cap counter)

## Output

Save review results to `.wazir/runs/latest/reviews/review.md` with:
- Findings with severity (blocking, warning, note)
- Rationale tied to evidence
- Score breakdown
- Verdict

## Phase Report Generation

After completing any review pass, generate a phase report following `schemas/phase-report.schema.json`:

1. **`attempted_actions`** — Populate from the review findings. Each finding becomes an action entry:
   - `description`: the finding summary
   - `outcome`: `"success"` if the finding passed, `"fail"` if it is a blocking issue, `"uncertain"` if ambiguous
   - `evidence`: the rationale or evidence supporting the outcome

2. **`drift_analysis`** — Compare review findings against the approved spec:
   - `delta`: count of deviations between implementation and spec (0 = no drift)
   - `description`: summary of any drift detected and its impact

3. **`quality_metrics`** — Populate from test, lint, and type-check results gathered during review:
   - `test_pass_count`, `test_fail_count`: from test runner output
   - `lint_errors`: from linter output
   - `type_errors`: from type checker output

4. **`risk_flags`** — Populate from any high-severity findings:
   - `severity`: `"low"`, `"medium"`, or `"high"`
   - `description`: what the risk is
   - `mitigation`: recommended mitigation (if known)

5. **`decisions`** — Populate from any scope or approach decisions made during the review:
   - `description`: what was decided
   - `rationale`: why
   - `alternatives_considered`: other options evaluated (optional)
   - `source`: `"[Wazir]"`, `"[Codex]"`, or `"[Both]"` (optional)

6. **`verdict_recommendation`** — Set based on the gating rules in `config/gating-rules.yaml`:
   - `verdict`: `"continue"` (PASS), `"loop_back"` (NEEDS MINOR FIXES / NEEDS REWORK), or `"escalate"` (FAIL with fundamental issues)
   - `reasoning`: brief explanation of why this verdict was chosen

### Report Output Paths

Save reports to two formats under the run directory:
- `.wazir/runs/<id>/reports/phase-<name>-report.json` — machine-readable, validated against `schemas/phase-report.schema.json`
- `.wazir/runs/<id>/reports/phase-<name>-report.md` — human-readable Markdown summary

The gating agent (`tooling/src/gating/agent.js`) consumes the JSON report to decide: **continue**, **loop_back**, or **escalate**.

### Report Fields Reference

All required fields per `schemas/phase-report.schema.json`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phase_name` | string | yes | Review mode name (e.g., `"final"`, `"task-review"`) |
| `run_id` | string | yes | Current run identifier |
| `timestamp` | string (date-time) | yes | ISO 8601 timestamp of report generation |
| `attempted_actions` | array | yes | Findings mapped to action outcomes |
| `drift_analysis` | object | yes | Spec-vs-implementation drift summary |
| `quality_metrics` | object | yes | Test/lint/type results |
| `risk_flags` | array | yes | High-severity risk items |
| `decisions` | array | yes | Scope/approach decisions made |
| `verdict_recommendation` | object | no | Gating verdict based on `config/gating-rules.yaml` |

## Post-Review: Learn (final mode only)

After the final review verdict, extract durable learnings using the **learner role** (`roles/learner.md`).

### Step 1: Gather all findings

Collect review findings from ALL sources in this run:
- `.wazir/runs/<run-id>/reviews/` — all review pass logs (task-review, final review)
- Codex findings (attributed `[Codex]` or `[Both]`)
- Self-audit findings (if `run_audit` was enabled)

### Step 2: Identify learning candidates

A finding becomes a learning candidate if:
- It recurred across 2+ review passes within this run (same issue found repeatedly)
- It matches a finding from a prior run (check `memory/learnings/proposed/` and `accepted/` for similar patterns)
- It represents a class of mistake, not just a single instance (e.g., "missing error handling in async functions" vs "missing try-catch on line 42")

### Step 3: Write learning proposals

For each candidate, write a proposal to `memory/learnings/proposed/<run-id>-<NNN>.md`:

```markdown
---
artifact_type: proposed_learning
phase: learn
role: learner
run_id: <run-id>
status: proposed
sources:
  - <review-file-1>
  - <review-file-2>
approval_status: required
---

# Proposed Learning: <title>

## Scope
- **Roles:** [which roles should receive this learning — e.g., executor, reviewer]
- **Stacks:** [which tech stacks — e.g., node, react, or "all"]
- **Concerns:** [which concerns — e.g., error-handling, testing, security]

## Evidence
- [finding from review pass N: description]
- [finding from review pass M: same pattern]
- [optional: similar finding from prior run <run-id>]

## Learning
[The concrete, actionable instruction that should be injected into future executor context]

## Expected Benefit
[What this prevents in future runs]

## Confidence
- **Level:** low | medium | high
- **Basis:** [single run observation | multi-run recurrence | user correction]
```

### Step 4: Report

Present proposed learnings to the user:

> **Learnings proposed:** [count]
> - [title 1] (confidence: high, scope: executor/node)
> - [title 2] (confidence: medium, scope: reviewer/all)
>
> Proposals saved to `memory/learnings/proposed/`. Review and accept with `/wazir audit learnings`.

Learnings are NEVER auto-applied. They require explicit user acceptance before being injected into future runs.

## Post-Review: Prepare Next (final mode only)

After learning extraction, invoke the `prepare-next` skill to prepare the handoff:

### Handoff document

Write to `.wazir/runs/<run-id>/handoff.md`:

```markdown
# Handoff — <run-id>

**Status:** [Completed | Partial]
**Branch:** <branch-name>
**Date:** YYYY-MM-DD

## What Was Done
[List of completed tasks with commit hashes]

## Test Results
[Test count, pass/fail, validator status]

## Review Score
[Final review verdict and score]

## What's Next
[Pending items, deferred work, follow-up tasks]

## Open Bugs
[Any known issues discovered during this run]

## Learnings From This Run
[Key insights — what worked, what didn't, what to change]
```

### Cleanup

- Archive verbose intermediate review logs (compress to summary)
- Update `.wazir/runs/latest` symlink if creating a new run
- Do NOT mutate `input/` — it belongs to the user
- Do NOT auto-load proposed learnings into the next run

## Done

Present the verdict and offer next steps:

> **Review complete: [VERDICT] ([score]/70)**
>
> [Score breakdown and findings summary]
>
> **Learnings proposed:** [count] (see `memory/learnings/proposed/`)
> **Handoff:** `.wazir/runs/<run-id>/handoff.md`
>
> **What would you like to do?**
> 1. **Create a PR** (if PASS)
> 2. **Auto-fix and re-review** (if MINOR FIXES)
> 3. **Review findings in detail**
