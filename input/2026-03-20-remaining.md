# Remaining Fixes — 2026-03-20

ALL items must be implemented. Do NOT tier or defer any item.

---

## 1. Proof-of-Implementation Enforcement NOT BLOCKING

**What:** The proof-collector WORKS (it can collect proof). But the enforcement doesn't BLOCK — the run completes even without proof artifacts. The guard exists but isn't stopping anything.

**What's broken:** The run completed without proof artifacts. The guard didn't block it. Either:
- The guard isn't being called at run completion
- The guard checks but doesn't return a blocking exit code
- The wazir skill doesn't check the guard's result before presenting results
- Or the verify workflow runs but doesn't fail when proof is missing

**Deliverables:**
- Debug: run `wazir capture summary` and verify it actually calls `validateRunCompletion` which checks proof artifacts
- Debug: check if `workflows/verify.md` actually invokes `wazir verify proof`
- Debug: check if the executor/wazir skill actually triggers the verify workflow
- Fix whatever is broken — make proof collection MECHANICALLY enforced, not prose
- Test: run the pipeline on a simple task and verify that without proof artifacts, the run CANNOT complete
- The fix must be a CLI-level block, not a skill instruction

---

## 2. Final Reviewer Must Compare Implementation to Original Input + User Feedback

**What:** The final reviewer should compare the implementation against TWO things:
1. The original input file (what the user asked for)
2. The user feedback captured during the run (corrections, approvals, mid-run redirections)

Currently: the reviewer skill says "compare against original input" but:
- It doesn't actually READ the input file
- It doesn't read user-input-log.ndjson
- It compares against the spec/plan instead (which may have drifted from the original input)

**Why this matters:** The spec/plan may have cut scope (clarifier scope-reduction bug). The executor's per-task reviewer already validated against task specs. The FINAL reviewer's job is to catch drift from what the user ACTUALLY asked for — including corrections they made mid-run.

**Deliverables:**
- Update `skills/reviewer/SKILL.md` final mode — MUST read:
  1. Original input file from `.wazir/input/` or `.wazir/runs/<id>/sources/`
  2. User feedback from `.wazir/runs/<id>/user-input-log.ndjson`
  3. The actual implementation (diffs/commits)
- Add explicit review dimension: **Intent Alignment** — does the implementation match the user's original request + their corrections?
- Add explicit review dimension: **Scope Coverage** — are all items from the input present in the implementation?
- If user-input-log.ndjson doesn't exist, the reviewer flags it as a finding ("user input not captured — cannot verify intent alignment")
- This is different from task-level review (which checks implementation vs. task spec)

---

## 3. Hook Errors Still Showing

**What:** Three hook errors appear on every session start:
- `SessionStart:startup hook error`
- `UserPromptSubmit hook error`
- `Stop hook error: TabManager not available`

These were supposedly fixed in PR #4 but still appear.

**Deliverables:**
- Reproduce each error
- Debug `hooks/session-start` — what's failing on startup
- Debug UserPromptSubmit — what hook is intercepting prompt submission and why it fails
- TabManager: detect non-IDE environment and skip gracefully
- All three must be silent in a working session

---

## 4. Save Agent Decisions to File for Auditing

**What:** The agent makes decisions but none are saved. Need a simple decision log — one line per decision, not an essay.

**Deliverables:**
- Create decision log: `.wazir/runs/<id>/decisions.ndjson`
- Format: `{ timestamp, phase, decision, reason }` — keep it simple
- Examples:
  - `{ "phase": "clarify", "decision": "skipped i18n from scope", "reason": "user didn't mention localization" }`
  - `{ "phase": "execute", "decision": "used Sonnet for task-3", "reason": "pure implementation, no design needed" }`
  - `{ "phase": "verify", "decision": "skipped playwright proof", "reason": "no browser output to capture" }`
- The learn phase reads this log to understand what happened and propose learnings
- Self-audit can compare decisions against skill instructions to find violations

---

## 5. Learnings Pipeline Not Working — No Files Ever Created

**What:** The learning system has skill instructions but `memory/learnings/` directories don't exist. No learning has ever been saved or loaded.

**Deliverables (keep it simple):**
- Create directories: `memory/learnings/proposed/`, `memory/learnings/accepted/`, `memory/learnings/archived/`
- The learn workflow must ACTUALLY write proposed learning files using `templates/artifacts/learning-proposal.md`
- The clarifier must ACTUALLY read and inject accepted learnings at startup
- Run completion guard: if learn workflow is enabled and no learning files are written, flag it
- CLI commands deferred — manual file management is fine for now

**CRITICAL — What learnings are actually FOR:**

Learnings are NOT project context ("this project uses Supabase"). They are **pipeline enforcement feedback** — patterns of what the agent gets wrong so we can prevent it.

**The loop:**
1. Every review finding → appended to `memory/findings/cumulative-findings.md`
2. Every agent skip/violation → logged in `decisions.ndjson` (item 4)
3. Every 5-10 runs → run cumulative-findings.md through the clarifier
4. Clarifier identifies patterns: "executor skipped proof 3 times", "reviewer missed auth issues twice"
5. Patterns become **new antipattern entries** in `expertise/antipatterns/` — actual rules, not injected context

**What this means:**
- Learnings don't change agent behavior directly (no drift risk)
- Learnings improve the ANTIPATTERN CATALOG which the reviewer loads
- More antipatterns = more things the reviewer catches = fewer repeat failures
- The pipeline gets stricter over time, not different
- After 20 runs, the executor still follows its skill — but the reviewer has 20 more antipatterns to check against

**Auto-review trigger:** After every 5th run, the learn phase flags: "5 runs accumulated. Review cumulative findings for new antipattern candidates?"

---

## 6. User Engagement — Agent Must Explain What It's Doing and Why

**What:** "Show value at every phase" was shipped in PR #4 but doesn't work in practice. The website test run felt disengaged — the agent silently researched, silently clarified, silently executed. The user had no idea what was happening or why.

**The problem is the instructions are too vague.** "Show reasoning" doesn't tell the agent WHAT to say. It needs concrete templates.

**Deliverables:**
- Update ALL phase skills with CONCRETE conversation output templates (not "show reasoning" — actual text patterns)

**Before research:**
```
I'm about to research your request. Here's what I need to figure out:
1. [specific thing] — because [why it matters for YOUR request]
2. [specific thing] — because [risk if we skip this]
3. [specific thing] — because [what could go wrong]
```

**After research:**
```
Research complete. Here's what I found and why it matters:
1. [finding] — this means [impact on your project]
   Without this: [what would have gone wrong]
2. [finding] — this changes [specific decision]
   Without this: [concrete mistake avoided]
```

**Before clarification questions:**
```
I have [N] questions before we proceed. These aren't bureaucratic — each one prevents a specific mistake:
1. [question] — asking because [what goes wrong if I assume]
2. [question] — asking because [concrete risk]
```

**Before execution:**
```
Starting implementation. Here's what I'm building and in what order:
- Task 1: [what] — depends on nothing, starting first
- Task 2: [what] — needs Task 1's [specific output]
I'll commit after each task and show you what changed.
```

**After each task:**
```
Task [N] complete: [one line summary]
- Changed: [files]
- Tests: [pass/fail count]
- Commit: [hash]
```

**The key principle:** Don't say "I'm researching." Say "I'm researching your auth setup because if I guess wrong I'll build JWT when you use Supabase — that's 2 days wasted."

### Online Research
- How Devin shows progress and explains decisions to users during long runs
- How GitHub Copilot Workspace explains each step with reasoning
- How Cursor Agent shows "thinking" and intermediate reasoning
- How Anthropic's effective context engineering blog recommends agent transparency
- How linear.app shows AI reasoning for issue categorization
- UX patterns for long-running AI agent transparency and trust building
