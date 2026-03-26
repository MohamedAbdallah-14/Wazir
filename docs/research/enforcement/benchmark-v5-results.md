# Benchmark v5 Results — Phase-Aware Blocking + Bootstrap Gate

**Date:** 2026-03-23
**Model:** claude-haiku-4-5 (cheapest, testing enforcement not output quality)
**Mode:** non-interactive (-p flag, no human reminders)
**Task:** Add run pruning to CLI

## Key Finding

**The enforcement stack worked autonomously for the first time.** The agent followed the pipeline without any human reminders.

## What Happened

1. Agent's first action: `wazir capture ensure` (bootstrap gate forced this)
2. Agent created briefing, run-config, phase files
3. Agent called `wazir pipeline init`
4. Agent transitioned init → clarifier via `wazir capture event`
5. Agent invoked `Skill(wz:clarifier)` — first autonomous skill invocation
6. Agent researched codebase using `wazir index search-symbols`
7. Agent wrote clarification artifacts to `.wazir/runs/latest/clarified/`
8. Agent read the phase checklist to track progress
9. Session ended mid-clarifier (Haiku context limit)

## What Didn't Happen

- Agent did NOT skip to coding (blocked by phase-aware gate)
- Agent did NOT ignore the pipeline (bootstrap gate forced ensure)
- Agent did NOT write source files during clarifier (phase gate would have blocked)

## Comparison

| Session | Model | Human reminders | Pipeline followed | Compliance |
|---------|-------|----------------|-------------------|-----------|
| Sessions 1-5 | Opus | None | No — skipped to coding | 15-60% |
| Session 6 | Opus | Interactive mode | Partially | 58% |
| Session 8 | Opus | Every 5 minutes | Yes | 76% |
| Benchmark v2 | Opus | None, no hooks working | No — skipped to coding | ~40% |
| **Benchmark v5** | **Haiku** | **None** | **Yes — followed init → clarifier → research** | **TBD (incomplete)** |

## Architecture That Produced This

1. Bootstrap gate (PreToolUse) — blocks Write/Edit/Bash until `wazir capture ensure` runs
2. Phase-aware blocking (PreToolUse) — blocks source writes during non-executor phases
3. Phase injection (PreToolUse) — injects current step on every tool call
4. Stop hook — blocks premature completion
5. Skill reminders — "Please try 100% compliance" in all 29 skill files
6. Wazir skill Phase 0 — "run wazir capture ensure BEFORE anything else"

## Limitation

Session ended mid-clarifier because Haiku hit context/token limits in -p mode. Need to run with Sonnet or Opus for full pipeline completion. But the enforcement architecture is validated — the agent followed the pipeline through the first two phases without human intervention.
