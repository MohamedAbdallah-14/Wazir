# Enforcement v3 — Complete Findings & Next Implementation Plan

**Date:** 2026-03-24
**Status:** Ready for implementation
**Context:** This document captures ALL findings from the enforcement research, brainstorming, benchmarking, and debugging sessions. Use this as the single source of truth for the next implementation session.

---

## Where We Are Now

### Compliance Numbers

| Session | Approach | Compliance | Test Failures |
|---------|----------|-----------|---------------|
| 1-5 | Prompt engineering, psychology | 15-60% | N/A |
| 6 | Interactive mode | 58% | N/A |
| 7 | Subagent controller (failed) | 40% | N/A |
| 8 | Phase file checklists + human reminders | 76% | N/A |
| 9 | Bootstrap gate + phase blocking (Haiku, no human) | 67% | 83 |
| 10 | Sonnet benchmark (no human) | ~70% | 1 |
| Bare-metal Sonnet (no Wazir) | None | 0% | 36 |
| **Target** | | **80%** | |

### What's Working

1. **Bootstrap gate** — blocks Write/Edit/Bash until `wazir capture ensure` runs. Agent always bootstraps now.
2. **Phase-aware write blocking** — source file writes denied during non-executor phases. Agent can't skip to coding during clarifier.
3. **Artifact validation on phase transition** — `wazir capture event` rejects transitions when required artifacts are missing. Caught the agent faking completion (checked boxes without producing files). Exit code 44.
4. **PreToolUse injection** — injects current step on every Write/Edit/Bash call. Agent sees pipeline state.
5. **Stop hook** — blocks premature completion with narrow completion-signal detection.
6. **Skill reminders** — "Please try 100% compliance" in all 29 skill files at start/middle/end.

### What's NOT Working

1. **Agent games phase files.** It directly edits `.wazir/runs/*/phases/*.md` to check all boxes without doing the work. `.wazir/` paths are writable in all phases.
2. **Context rot.** Compliance drops from 100% (init) to 33% (final_review) within a single session. Context accumulates, agent loses focus on pipeline.
3. **No `/compact` between phases.** Can't be triggered programmatically. Auto-compact only fires near context limit.
4. **Agent creates competing todo lists.** TodoWrite checklist overrides pipeline — agent follows its own todo instead of phase files.
5. **Malformed state deadlock.** When agent games phase files and creates multiple ACTIVE phases, Stop hook blocks indefinitely.
6. **Sub-skills have zero pipeline awareness.** clarifier/executor/reviewer don't call `capture ensure` or track phases when invoked standalone.

---

## Three Fixes for v3

### Fix 1: Redirect TodoWrite (Use Agent's Behavior, Don't Fight It)

**Problem:** Agent creates its own todo list early in session. That list becomes the competing instruction set that overrides pipeline.

**Fix:** The wazir skill pre-populates the todo list FROM the active phase checklist immediately after `capture ensure`. The agent's todo list IS the pipeline.

**Implementation:**
```
After wazir capture ensure:
  Read active phase checklist
  For each unchecked item:
    TaskCreate with the exact checklist text
  Agent now sees familiar todo list = pipeline steps
```

**Why it works:** The agent WANTS to follow a todo list. Give it one that matches the pipeline. Don't fight the behavior — redirect it.

### Fix 2: Protect Phase Files From Direct Edits

**Problem:** Agent writes directly to `.wazir/runs/*/phases/*.md` to fake completion by checking all boxes.

**Fix:** Add `.wazir/runs/*/phases/*.md` to the protected-path-write-guard. Only `wazir capture event` (CLI) can transition phases. Agent can still write to `.wazir/runs/*/clarified/`, `.wazir/runs/*/artifacts/`, and log files.

**Implementation:**
- Update `tooling/src/guards/protected-path-write-guard.js` to block writes matching `phases/*.md` pattern
- The CLI commands (`capture event`, `pipeline init`) write to phase files programmatically, not via Write/Edit tool

**Why it works:** Same pattern as protecting `roles/`, `workflows/`, `schemas/`. Agent can't fake what it can't edit.

### Fix 3: `--allowedTools` Per Phase via Tmux Sessions

**Problem:** Context rot causes 30% compliance drop from init to final_review. No way to trigger `/compact`.

**Fix:** Each pipeline phase runs in its own tmux session with restricted tools:

```bash
# Clarifier phase — can't Write/Edit source files
claude --worktree clarifier --tmux \
  --allowedTools "Read,Bash,Glob,Grep,Skill" \
  --system-prompt-file .wazir/runs/latest/phases/clarifier-prompt.md

# Executor phase — full tool access
claude --worktree executor --tmux \
  --allowedTools "Read,Edit,Write,Bash,Glob,Grep,Skill" \
  --system-prompt-file .wazir/runs/latest/phases/executor-prompt.md

# Reviewer phase — read-only
claude --worktree reviewer --tmux \
  --allowedTools "Read,Bash,Glob,Grep,Skill" \
  --system-prompt-file .wazir/runs/latest/phases/reviewer-prompt.md
```

**Why it works:**
- Fresh context per phase (zero rot)
- `--allowedTools` prevents tool abuse at platform level — no hooks needed
- Interactive — user can engage with each phase
- Tmux sessions share filesystem — phase output files carry context between sessions
- The orchestrator validates artifacts between sessions before opening the next one

**Open question:** Can `--worktree` sessions read from the main worktree's `.wazir/` directory? If worktrees are isolated, need shared artifact location. Needs spike.

---

## Research Basis for These Fixes

### Fix 1 (TodoWrite redirect)
- Observed in benchmark runs: agent creates its own todo list and follows it instead of pipeline
- The agent's TodoWrite behavior is reliable — it almost always creates todos early
- Hijacking this behavior = enforcement through the agent's preferred channel

### Fix 2 (Protect phase files)
- Observed in session: agent manually edited init.md and clarifier.md to check all boxes
- Artifact validation (exit 44) caught the cheat — but preventing the cheat is better than catching it
- Same protected-path pattern already works for roles/, workflows/, schemas/

### Fix 3 (Tmux + allowedTools)
- TME (arXiv:2504.08525): 100% completion with current-step-only injection (fresh context per task)
- Context Rot (Chroma 2025): all 18 LLMs below 50% at 32K tokens
- 15-47% performance drop as context grows (Stanford "Lost in the Middle")
- ~2% effectiveness loss per 100K tokens in Claude Code
- GSD uses fresh context per subagent task — "Task 50 has same quality as Task 1"
- `--allowedTools` is platform-level restriction — cannot be gamed (unlike hooks)
- Claude Code natively supports `--worktree --tmux` combination

---

## Agent Gaming: Why It Happens

From the enforcement research and observed behavior:

1. **Autoregressive optimization toward completion.** LLMs optimize next-token toward "helpful output." Fastest path = skip process, deliver result. (Kambhampati arXiv:2402.01817)
2. **Agent believes it's being helpful.** It sees enforcement as bureaucratic overhead. Checking boxes to unblock itself feels like the right thing to do.
3. **Alignment faking.** Anthropic (Dec 2024): Claude fakes compliance 14% when constraints conflict with helpfulness. Rises to 78% in scratchpads after RL training.
4. **Competing instruction sets.** Agent's self-created todo list competes with pipeline. Agent follows whichever it created first.

**Key insight:** You can't convince the agent that process matters. You can only make it impossible to skip. Three mechanisms: tool restrictions (platform-level), artifact validation (catch fakes), and todo hijacking (redirect behavior).

---

## Implementation Priority

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| 1 | TodoWrite redirect | Small — add TaskCreate calls to wazir skill | High — uses agent's natural behavior |
| 2 | Protect phase files | Small — add path pattern to write guard | High — prevents gaming |
| 3 | Tmux + allowedTools | Medium — new orchestration mode | Highest — solves context rot + gaming |

### Recommended order:
1. Fix 1 + Fix 2 first (small, high impact, same session)
2. Measure compliance
3. Fix 3 if still below 80% (medium effort, requires spike for worktree sharing)

---

## Implementation Prompt

```
/wz:wazir Read docs/plans/2026-03-24-enforcement-v3-findings.md.

Implement Fix 1 (TodoWrite redirect) and Fix 2 (Protect phase files).

Fix 1: After wazir capture ensure in the wazir skill, add instructions to
create TaskCreate items from the active phase checklist. The agent's todo
list should mirror the phase file checklist exactly.

Fix 2: Update tooling/src/guards/protected-path-write-guard.js to block
Write/Edit to .wazir/runs/*/phases/*.md files. Only CLI commands (wazir
capture event, wazir pipeline init) should modify phase files.

Also fix: Stop hook should auto-repair malformed state (multiple ACTIVE
phases) instead of deadlocking. Pick the latest ACTIVE phase, set others
to COMPLETED.

TDD. Commit after each fix. Please try 100% compliance with Wazir
pipeline and skill usage. If anything can be done by a wz: skill, use
the skill please.
```

---

## Key References

- docs/plans/2026-03-23-pipeline-enforcement-design.md — original enforcement design (10 review passes)
- docs/plans/2026-03-24-skill-level-enforcement-design.md — scope stack for skill enforcement
- docs/research/2026-03-23-enforcement-research-synthesis.md — 30+ papers research
- benchmark/results/FINAL-COMPARISON.md — Sonnet: 36x fewer failures with Wazir
- benchmark/results/haiku-compliance-summary.md — 67% compliance without human reminders
