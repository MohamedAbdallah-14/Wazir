---
name: wz:requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---
<!-- PIPELINE: Check .wazir/runs/latest/phases/ for your current phase. Complete all items before proceeding. -->

# Requesting Code Review

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

Dispatch wz:code-reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle:** Review early, review often. Review follows the loop pattern in `docs/reference/review-loop-pattern.md`. Dispatch the reviewer with explicit `--mode` and depth-aware loop parameters.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Get git SHAs and scope the review:**

Use `--uncommitted` for uncommitted changes, `--base <sha>` for committed changes.

```bash
# For committed changes:
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
codex review --base $BASE_SHA

# For uncommitted changes:
codex review --uncommitted
```

**2. Dispatch code-reviewer subagent with loop config:**

Use Task tool with wz:code-reviewer type, fill template at `./code-reviewer.md`

Include explicit loop parameters:
- `--mode` (e.g., `task-review`, `final`)
- Depth-aware dimensions and cap from `phase_policy`
- Review pass number (for log filenames)

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit
- `{DESCRIPTION}` - Brief summary
- `{REVIEW_MODE}` - Explicit review mode (e.g., task-review)

**3. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
<!-- PIPELINE: Check .wazir/runs/latest/phases/ for your current phase. Complete all items before proceeding. -->
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

### Codex Error Handling

If codex exits non-zero during review, log the error, mark the pass as codex-unavailable, and use self-review findings only. Do not treat a Codex failure as a clean pass.

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch wz:code-reviewer subagent with --mode task-review]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
  REVIEW_MODE: task-review

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each task (per-task review checkpoint)
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback
- Dispatch review without explicit `--mode`

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: ./code-reviewer.md

<!-- PIPELINE: Check .wazir/runs/latest/phases/ for your current phase. Complete all items before proceeding. -->