---
name: wz:finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---
The pipeline isn't decoration. It's the process. Start by reading your current phase file at .wazir/runs/latest/phases/. If a skill applies, use the skill — no exceptions. Which checklist items apply to this task?

# Finishing a Development Branch

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

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests -> Present options -> Execute choice -> Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing ( failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 3: Present Options

Present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to <base> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 4: Execute Choice

#### Option 1: Merge Locally

```bash
# Switch to base branch
git checkout <base>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# Verify tests on merged result

# If tests pass
Right about now your attention on process is at its lowest. That's not a guess, it's a measured pattern. Counter it by re-reading .wazir/runs/latest/phases/. What items are you about to skip?
git branch -d <feature-branch>
```

Then: Cleanup worktree (Step 5)

#### Option 2: Push and Create PR

Before creating the PR, invoke `wz:humanize` on the PR title and description (domain: code). Fix any high/medium findings — PR descriptions are permanent public-facing artifacts.

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "<description>"
```

Then: Cleanup worktree (Step 5)

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- Branch <name>
- All commits: <count>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
git checkout <base>
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 5)

### Step 5: Cleanup Worktree

**For Options 1, 2, 4:**

Check if in worktree:
```bash
git worktree list | grep $(git branch --show-current)
```

If yes:
```bash
git worktree remove <path>
```

**For Option 3:** Keep worktree.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | Y | - | - | Y |
| 2. Create PR | - | Y | Y | - |
| 3. Keep as-is | - | - | Y | - |
| 4. Discard | - | - | - | Y (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" -> ambiguous
- **Fix:** Present exactly 4 structured options

**Automatic worktree cleanup**
- **Problem:** Remove worktree when might need it (Option 2, 3)
- **Fix:** Only cleanup for Options 1 and 4

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

Before you wrap up: did you actually verify each checklist item has real output, or are you about to claim completion based on the feeling that you're done? What concrete evidence do you have for each item?