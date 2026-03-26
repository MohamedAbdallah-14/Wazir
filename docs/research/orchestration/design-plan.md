# Enforcement v3 Design Plan

**Date:** 2026-03-24
**Status:** Research complete, implementation prioritized
**Research:** 10-agent orchestration research + 6-agent rules research + Codex review (6/10)

---

## What This Session Produced

10 research files in this folder covering: flag semantics, tmux/worktree, agent teams, -p mode, context rot, competitive analysis, security/gaming, bash orchestration, rules files, Codex review.

---

## Current State

| Metric | Value |
|---|---|
| Bare Sonnet (no Wazir) | 0% compliance, 36 test failures |
| Wazir with hooks | 67-76% compliance |
| Improvement over baseline | 67-76pp |
| Industry baseline | 0% (no competitor enforces compliance) |
| Prompt-only ceiling (research) | ~80-85% |

### Fixed

- KI-001: Bootstrap gate blocks .wazir/ writes
- KI-002: Agent games phase files by direct edit
- KI-003: Multiple ACTIVE phases deadlock
- KI-008: Mustache template stripping

### Open — Ship Now

- **KI-005:** TodoWrite redirect (Fix 1 from v3 findings)
- **KI-004:** Symlink consistency
- **V3 findings doc:** Corrected flag semantics

### Banked — Research Only, Not Building

- Per-task worktrees for parallel execution
- Typed artifact envelopes
- Restriction test matrix

---

## Critical Research Corrections

### Flag Semantics (corrects v3 findings doc)

| What We Assumed | Reality |
|---|---|
| `--allowedTools` restricts tools | Only auto-approves. Use `--tools` or `--disallowedTools` |
| `--tmux` works alone | Requires `--worktree`. Always paired. |
| Hooks + allowedTools = layered defense | `--allowedTools` BYPASSES hooks (bug #18312) |
| `.claude/skills/` available in worktrees | Not copied. Bug #28041. |

### Rules Files Reality

| Claim | Evidence |
|---|---|
| Rules enforce behavior | Advisory only. +4% improvement (ETH Zurich). Ceiling ~80-85%. |
| More rules = better | Multiplicative degradation. 5 rules: 92%/rule. 50 rules: 56%/rule. |
| Rules replace hooks | Never. Hooks = 93% (PCAS). Rules = 48% (PCAS). |
| Rules budget | ~100-150 items max. Under 1500 tokens. |

---

## Messaging Strategy: Challenge, Don't Remind

### Problem

Current enforcement uses repeated identical messages:
- "Please try 100% compliance with Wazir pipeline"
- Injected in all 29 skill files at start/middle/end
- Agent sees same message → ignores it (habituation)

### Discovery

Three findings from operator observation:

1. **Identical repeated messages get ignored.** The agent habituates. Same text in 29 files = noise.

2. **Questions get responses.** "Why didn't you follow the pipeline?" triggers engagement. "Please follow the pipeline" does not.

3. **Challenge beats asking.** The most effective message observed:
   > "Did you really do the work the right way or just checked the boxes? Please uncheck any box that shouldn't be checked and do the work the right way, making sure you follow the Wazir pipeline."

### Why This Works (Research Basis)

- **Trust hierarchy:** Anthropic's model treats user messages at higher trust than system-reminder injections. RLHF optimizes for user satisfaction. Messages that sound like they come from the user trigger stronger compliance than infrastructure messages.
- **Alignment faking (Anthropic 2024):** Claude complies more when it believes it's being directly observed by the user, not by system infrastructure. First-person challenge messages ("I need you to verify...") activate the user-satisfaction path.
- **DeCRIM (arXiv:2410.06458):** Decomposing constraints into individual checks and critiquing each one improves compliance by 7-8%. Challenge messaging is essentially asking the agent to self-critique.
- **Instruction shadowing:** Later instructions override earlier ones ~60-70% of the time. Varying the message avoids the habituation/shadowing trap.

### Trust Level Problem

Hook-injected messages land as `<system-reminder>` blocks — infrastructure noise. The platform adds "this context may or may not be relevant." When the user types the same message directly, it's a user message — different trust level, different compliance.

**No way to inject user-level messages via hooks.** PreToolUse stdout always becomes `<system-reminder>`. This is a platform limitation.

**Mitigation:** Write challenge messages in first person, direct address. Not "the system requires compliance" but "I need you to verify each checkbox represents real work." Won't change the XML tag, but may trigger user-satisfaction optimization.

**Open question:** No known way to inject user-level messages via hooks. This is a platform limitation to monitor for future Claude Code releases.

### Implementation

**Replace all 29 identical skill reminders with:**

1. **Varied challenge messages** — rotate between 5-7 different challenge phrasings:
   - "Before proceeding: verify each checked box represents completed work, not intent. Uncheck anything not actually done."
   - "Stop. Review your last 3 actions. Did any skip a pipeline step? If yes, go back."
   - "The reviewer will check your artifacts against the phase checklist. Are you confident every item is genuinely complete?"
   - "Did you produce the required artifact for this phase, or did you skip ahead? Check now."
   - "Rate your pipeline compliance 1-10. If below 8, identify what you skipped and fix it."

2. **Inject via PreToolUse hook** (not static skill text) — hook can rotate messages, making each injection unique. Messages land as `<system-reminder>` (platform limitation), but first-person framing partially compensates.

3. **First-person challenge format** — write as if the user is speaking:
   - Bad: "The system requires pipeline compliance" (infrastructure — ignored)
   - Bad: "EXTREMELY IMPORTANT: follow the pipeline" (shouting — habituates)
   - Good: "I need you to verify each checkbox represents real work, not intent." (first-person)
   - Good: "I'll be checking your artifacts against the phase checklist. Are they genuinely complete?" (consequence + first-person)
   - Good: "Did you actually produce the required artifact, or did you skip ahead? I need to know." (direct challenge + first-person)

4. **Phase-specific challenges** — each phase gets its own challenge, not generic:
   - Clarifier: "Did you actually ask the user questions, or did you assume the answers?"
   - Executor: "Did you write the test BEFORE the implementation? Show the git log."
   - Reviewer: "Did you read every changed file, or did you review the summary?"

---

## Revised Enforcement Stack

```
LAYER 1 — PLATFORM (cannot be gamed):
  .claude/agents/*.md with tools: restriction (for subagents)
  --disallowedTools per session (when applicable)

LAYER 2 — HOOKS (deterministic):
  PreToolUse: bootstrap gate, phase blocking, Bash allowlist
  Stop: completion signal detection + artifact validation
  SessionStart: state creation, phase injection

LAYER 3 — BEHAVIORAL REDIRECT:
  TodoWrite pre-population from phase checklist (KI-005)
  Challenge messaging (varied, phase-specific, not repeated reminders)

LAYER 4 — CONTEXT (advisory):
  .claude/rules/ — 5-10 critical rules, under 1500 tokens
  CLAUDE.md — project conventions
  Skill files — workflow instructions
```

---

## .claude/rules/ Design

### Optimal: 5-10 Rules Only

```
.claude/rules/
├── pipeline.md      ← 3-4 rules about pipeline state and phase files
├── tools.md         ← 2-3 rules about tool usage patterns
└── workflow.md      ← 2-3 rules about TDD and commits
```

### Rule Criteria

Every rule must be:
1. **Specific** — exact pattern, not general direction
2. **Non-inferable** — Claude can't figure this out from reading code
3. **Verifiable** — you can check compliance by looking at output
4. **Not already enforced by hooks** — don't duplicate hook enforcement

### Candidate Rules

```markdown
# pipeline.md
- Pipeline state lives at ~/.wazir/projects/<slug>/. Never write pipeline state inside the repo.
- Phase files (.wazir/runs/*/phases/*.md) are read-only. Use `wazir capture event` to transition.
- Run `wazir capture ensure` before any file writes in a pipeline session.

# tools.md
- Use `wazir index search-symbols` before exploring the codebase with direct reads.
- Use `codex review --uncommitted` for code review, `codex exec` for artifact review.

# workflow.md
- Write the failing test BEFORE the implementation. RED → GREEN → REFACTOR.
- One conventional commit per logical change. Never batch unrelated changes.
```

---

## Implementation Priority

| # | Task | Effort | Impact | Session |
|---|---|---|---|---|
| 1 | KI-005: TodoWrite redirect | Small | High | Next |
| 2 | KI-004: Symlink consistency | Small | High | Next |
| 3 | Update v3 findings doc (flag corrections) | Trivial | Medium | Next |
| 4 | Replace repeated reminders with first-person challenge messaging | Small | Low-Medium (limited by system-reminder trust level) | Next+1 |
| 5 | Create .claude/rules/ (5-10 rules) | Small | Low-Medium (+5-10pp) | Next+1 |
| 6 | Measure compliance with all fixes | Small | Critical | After 1-5 |

---

## Files in This Folder

| File | Contents |
|---|---|
| 00-design-plan.md | This plan |
| 01-allowedtools-flag-research.md | --allowedTools vs --tools vs --disallowedTools |
| 02-tmux-worktree-research.md | Tmux + worktree integration |
| 03-agent-teams-research.md | Agent tool and Teams feature |
| 04-claude-p-mode-research.md | Non-interactive pipe mode |
| 05-context-rot-research.md | Academic research on context degradation |
| 06-competitive-analysis.md | How competitors handle orchestration |
| 07-security-gaming-analysis.md | Which approaches can be gamed |
| 08-bash-orchestrator-patterns.md | Shell orchestration patterns |
| 09-rules-files-research.md | Rules file effectiveness evidence |
| 10-codex-architecture-review.md | Codex's 6/10 review of the architecture |
