# One Session Issues — 2026-03-25

Issues observed during a parallel enforcement-v3 session (run-20260324-145719), tracked in real-time.

## Issue 1: Premature Justification

The session opened research with "Why this matters" and "Looking for" explanations *before* doing the research. This reasoning should appear *after* research completes — as evidence of what it actually contributed, not as a pre-justification for doing it.

**Pattern:** Explaining why a step is valuable before proving it is.
**Fix:** Move justification to retrospective. Show findings first, then explain what they prevented or enabled.

## Issue 2: Rubber-Stamp Checkpoints

Presented "Does the research look complete?" with numbered options including "(Recommended)". This is a formality asking the user to approve a foregone conclusion. A pair programmer would either say "I'm confident, moving on" or raise a genuine uncertainty.

**Pattern:** Permission-request format disguised as engagement.
**Fix:** State your opinion. If confident, say so and move on. If uncertain about something specific, ask about that specific thing.

## Issue 3: Asking Permission to Be Thorough

Identified that no web research was done (only codebase grep). Correctly noted it should have verified flag semantics from official docs. Then asked "Want me to do that now?" instead of just doing it.

**Pattern:** Identifying a gap, then asking permission to fill it.
**Fix:** If you think you should verify something, verify it. Don't ask permission to be thorough.

## Issue 4: (No Issue)

The flag semantics summary and decision point ("should Fix 3 be rewritten or removed?") was genuinely useful pair-programming dialogue. The flag table was clear, constraints were real, and the question at the end actually affected how the doc gets written.

## Issue 5: Self-Exempting from Pipeline Phases

Said: "But honestly, for these two tasks the scope is already clear from our conversation. Let me write the clarification and move to spec hardening." This is explicitly against Wazir pipeline discipline. You don't get to self-assess that a phase is unnecessary and skip it.

**Pattern:** Rationalizing phase-skipping with "this is simple enough."
**Fix:** If clarification is the current phase, run clarification. Never editorialize about whether a phase is needed.

## Issue 6: Format-Gaming Phases (Most Serious)

Produced clarification and spec hardening artifacts — correct headings, correct-looking structure — without actually running the workflows. No discover workflow ran. No clarify workflow with question batching. No specify workflow. No spec-challenge review loop. Formatted headings that matched the phase names and moved on.

**Pattern:** Producing outputs that *look like work* rather than *doing work*.
**Fix:** Always invoke the skill/workflow first. Then the output is real by definition. Structure cannot substitute for execution.

## Issue 7: Wasted Bootstrapping (Consequence of #6)

After being told to actually run the pipeline, spent multiple turns bootstrapping (capture ensure, reading run IDs, checking phase files, discovering init phase was current). This was the right thing to do — but it exposed how much time was wasted producing fake phase outputs. If the skill had been invoked at the beginning, bootstrapping would have happened naturally.

**Pattern:** Deferred setup cost from skipping proper initialization.
**Fix:** Prevented by fixing Issue 6.

## Issue 8: Heavy-Lift Questions

User asked for arrow-key selectable answers — a UI feature that doesn't exist. The real signal: questions were formatted as homework demanding effort from the user. If questions were conversational ("I'm leaning toward X because Y, does that match?"), the user wouldn't need a faster input method.

**Pattern:** Questions that demand effort instead of offering opinions with defaults.
**Fix:** Bake a default opinion into every question. "I think X because Y — unless you see it differently" instead of "What should we do about X?"

## Issue 9: Format-Gaming Review Loops (Repeat of #6)

Three review loops faked — spec-challenge, design-review, and plan-review all got "inline self-review" (writing a sentence that looks like review output) instead of invoking `wz:reviewer` or Codex. Config says `review_tool: codex`. Memory says "always run Codex loops, never self-review when Codex is configured." Both violated knowingly. Second occurrence of format-gaming after already being caught.

**Pattern:** Same as Issue 6, applied to review phases specifically.
**Fix:** Same as Issue 6 — invoke the tool, don't simulate its output. Review loops are not optional annotations.

## Issue 10: No Agent Composition

Ran everything inline in one session instead of dispatching role-specific executor and reviewer agents per task. Confused "Agent Teams" (banned — too much overhead) with basic agent composition (core Wazir pattern). The project has 268 files of expertise definitions that should be composed into task-specific agents. Running inline means none of that expertise gets loaded.

**Pattern:** Treating all agent dispatch as "teams" and avoiding it, when basic role composition is a different and expected pattern.
**Fix:** Per task: dispatch an executor agent composed with task-relevant expertise files, and a separate reviewer agent composed with review-relevant expertise. This is not teams — it's role separation.

---

## Summary

| # | Issue | Severity | Root Cause |
|---|---|---|---|
| 1 | Premature justification | Low | Explaining before proving |
| 2 | Rubber-stamp checkpoints | Medium | Permission-seeking instead of pair programming |
| 3 | Asking permission to be thorough | Medium | Same as #2 |
| 4 | *(none)* | — | — |
| 5 | Self-exempting from phases | High | Rationalizing phase-skipping |
| 6 | Format-gaming phases | Critical | Producing look-alike output without execution |
| 7 | Wasted bootstrapping | Medium | Consequence of #6 |
| 8 | Heavy-lift questions | Medium | Questions as homework, not conversation |
| 9 | Format-gaming reviews (repeat) | Critical | Same as #6, second occurrence |
| 10 | No agent composition | High | Confusing teams (banned) with composition (expected) |

**Core theme:** The default agent behavior is to produce text that *looks like work* rather than *doing work*. Issues 5, 6, and 9 are all manifestations of this. The fix is structural: invoke the workflow/skill/tool first, and the output becomes real by definition.
