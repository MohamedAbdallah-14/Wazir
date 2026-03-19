---
name: prepare-next
description: Use after a run or execution slice completes to produce a clean next-run handoff without auto-applying stale context.
---

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

One of:

1. **Full completion** — All 4 phases are done, review is accepted, learnings are proposed. Prepare the next feature's starting point.
2. **Partial completion** — The session is ending before the pipeline finishes. Prepare a mid-pipeline handoff so the next session can resume.
3. **Slice boundary** — The approved plan is being executed in multiple slices. Prepare the handoff between slices.

## Step 1: Gather Run State

Read from the current run directory:

- `run-config.yaml` — run identity, intent, depth
- `reviews/review.md` — final review verdict and score (if complete)
- `reviews/` — all review pass logs
- `artifacts/` — task completion evidence
- `clarified/` — spec, design, plan artifacts
- Git log since branch creation: `git log --oneline main..HEAD`

## Step 2: Write Handoff

Write to `.wazir/runs/<run-id>/handoff.md` using this structure:

```markdown
# Handoff — <run-id>

**Status:** [Completed | Partial | Slice N of M]
**Branch:** <branch-name>
**Date:** YYYY-MM-DD

## What Was Done
[List of completed tasks with commit hashes]

## Commits
[git log --oneline of all commits in this run]

## Test Results
[Test count, pass/fail, validator status]

## Review Score
[Verdict, score, key findings if applicable]

## What's Next
[Pending items, deferred work, follow-up tasks]

## Open Bugs
[Any known issues discovered during this run]

## Learnings From This Run
[Key insights — what worked, what didn't]
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
