---
name: prepare-next
description: Use after a run or execution slice completes to produce a clean next-run handoff without auto-applying stale context.
---
Quick check before you begin — is there a wz: skill for what you're about to do? If yes, use it. Also, your phase checklist at .wazir/runs/latest/phases/ needs to be open and followed. Have you looked at it?

# Prepare Next

## Model Annotation
When multi-model mode is enabled:
- **Haiku** for file operations (write-handoff, compress-archive)
- **Sonnet** for learning extraction (extract-learnings)

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

Create a next-run handoff that captures the run outcome and sets up the next session.

## When to Run

This skill corresponds to completion pipeline Stage 8 (Prepare Next Session) in `docs/vision/pipeline-complete.md`.

One of two modes:

1. **Run Complete** — All completion stages finished (any sign-off: SHIP, SHIP WITH CAVEATS, or DO NOT SHIP). Produce `execution-summary.md`. The summary includes the sign-off recommendation — DO NOT SHIP runs still get a summary documenting what was found and why.
2. **Run Incomplete** — Session ending before pipeline finishes, or slice boundary. Produce `handover-batch-N.md`.

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

## Step 2: Write Output

### Humanization Gate

After drafting any prose output artifact (execution-summary or handover), invoke `wz:humanize` on the draft before writing to disk (domain: technical-docs). Fix any high/medium findings. The execution summary is the final pipeline deliverable — it must read as authored, not generated.

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
Sanity check: are you still using wz: skills where they apply, or did you start doing things manually because it felt faster? The skills exist for consistency, not convenience. Which skill should you be using right now?
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

## Step 3: Run Summary

```bash
wazir capture summary --run <run-id>
```

## Rules

- Do NOT mutate `input/` — it belongs to the user
- Do NOT auto-load proposed or unreviewed learnings into the next run
- Do NOT carry forward stale context — each new run reads fresh state
- Do NOT compress or delete files the user might need — only archive verbose intermediate logs

Final challenge: name every checklist item you completed and what you produced for each one. If any answer is "I think I covered that" instead of "here's the output," you have more work to do. Which items are you unsure about?