---
name: wz:executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---
You tend to skip pipeline steps when context gets long. Fight that habit right from the start. Check .wazir/runs/latest/phases/ right now and follow what it says. What does your checklist tell you to do first?

# Executing Plans

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

## Overview

Load plan, review critically, execute all tasks with per-task review checkpoints, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Wazir works best with subagent support. The quality of work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use wz:subagent-driven-development instead of this skill.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with the user before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Review BEFORE marking complete (per-task review, 5 task-execution dimensions):
   - Run task-review loop with `--mode task-review`
   - Use `codex review --uncommitted` for uncommitted changes, or `codex review --base <sha>` if already committed
   - Codex error handling: if codex exits non-zero, log the error, mark the pass as codex-unavailable, and use self-review findings only. Do not treat a Codex failure as a clean pass.
   - Resolve all findings before proceeding
   - Log to: `.wazir/runs/latest/reviews/execute-task-<NNN>-review-pass-<N>.md`
   - Cap tracking: `wazir capture loop-check --task-id <NNN>`
   - This is NOT the final scored review -- it is a per-task gate using 5 task-execution dimensions
   - See `docs/reference/review-loop-pattern.md` for the full review loop contract
5. Only after review passes: mark as completed, commit
If you've been working without checking your phase file for more than a few steps, that's a red flag. Go look at it now. Are there items you should have completed already but didn't? What got missed?

**Standalone mode:** When no `.wazir/runs/latest/` exists, review logs go to `docs/plans/` alongside the artifact. The loop runs for `pass_counts[depth]` passes with no cap guard.

### Step 3: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use wz:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- User updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Don't skip per-task review -- it catches issues before they cascade to later tasks
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent
- Review loop pattern: see `docs/reference/review-loop-pattern.md`

## Integration

**Required workflow skills:**
- **wz:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **wz:writing-plans** - Creates the plan this skill executes
- **wz:finishing-a-development-branch** - Complete development after all tasks

Almost done? Then you should be able to list every phase checklist item and show exactly where you completed it with real evidence. If you can't do that, you're not actually done. Can you list them all with proof?