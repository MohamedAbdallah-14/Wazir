# Haiku Compliance Test Results

**Date:** 2026-03-24
**Model:** claude-haiku-4-5 (cheapest model)
**Mode:** Non-interactive (-p), no human reminders

## Results

| Run | Turns | Duration | Cost | Compliance | Key Finding |
|-----|-------|----------|------|-----------|-------------|
| v1 (first attempt) | 41 | 222s | $0.55 | ~50% | Templates unrendered (mustache markers) |
| v2 (after template fix) | 85 | 568s | $1.34 | **67%** | Best result — full pipeline followed |
| v3 (default prompt) | 31 | 83s | $0.30 | N/A | Stopped to ask questions (correct but incomplete) |
| v4 (no questions) | 64 | 287s | $0.85 | ~30% | "Don't ask" prompt caused pipeline skip |

## Best Result: Run v2 — 67% Compliance

### What Haiku did right (without human reminders):
- Init phase: 100% (6/6 items checked)
- Produced 5 clarification artifacts (research-brief, clarification, spec-hardened, design, execution-plan)
- Wrote verification proof
- 3 conventional commits
- Used wazir capture ensure, init, pipeline init

### What Haiku missed:
- Phase file headers not updated after init (transition bug)
- TDD/review skills not explicitly invoked
- 83 test failures (code quality, not process)
- Per-task review not done

## Key Insight

Telling the agent "don't ask questions" HURTS compliance (30% vs 67%). The enforcement works better when the agent follows its natural clarification instinct. The pipeline should encourage questions, not suppress them.

## Comparison to Baseline

| Metric | Bare-metal (no Wazir) | Wazir-enforced |
|--------|----------------------|----------------|
| Init phase followed | 0% | 100% |
| Clarification artifacts | 0 files | 5 files |
| Spec hardening | None | Done |
| Verification proof | None | Written |
| Conventional commits | Mixed | 3/3 conventional |
| Overall compliance | ~40% | **67%** |
