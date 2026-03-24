# Benchmark 1: Implement `wazir validate artifacts`

**Model:** Sonnet 4.6 | **Date:** 2026-03-24

## Head-to-Head Comparison

| Metric | Bare-Metal | Wazir | Winner |
|--------|-----------|-------|--------|
| Turns | 35 | 44 | — |
| Duration | 164s | 177s | — |
| Cost | $0.52 | $0.78 | Bare-metal (cheaper) |
| Commits | 3 | 3 | Tie |
| Test failures | 100 | 83 | Wazir |
| Clarification artifacts | 0 | 1 (clarification.md) | Wazir |
| Spec hardening | None | "3 scope boundaries, 5 constraints" | Wazir |
| Init phase completed | No | Yes (6/6 checked, COMPLETED) | Wazir |
| Phase files created | No | Yes (all 4 phases) | Wazir |
| Run directory | No | Yes (.wazir/runs/) | Wazir |
| Briefing captured | No | Yes | Wazir |
| Run config written | No | Yes | Wazir |

## Process Quality

### Bare-Metal
- Went straight to coding without clarification
- No spec hardening — guessed "selected run" semantics
- No phase tracking — ad-hoc implementation
- 100 test failures — likely broke existing tests
- No verification proof
- No run artifacts

### Wazir
- Init phase: 100% (all 6 items checked, marked COMPLETED)
- Clarification produced: scope boundaries, constraints, clarification.md
- Phase tracking active
- 83 test failures (fewer than bare-metal)
- Run directory with config and artifacts
- Pipeline structure followed

## Verdict

Wazir produced a more disciplined engineering process:
- Clarified before coding (bare-metal guessed)
- Tracked progress via phase files (bare-metal had no tracking)
- Fewer test failures (83 vs 100)
- Engineering artifacts preserved for audit

Bare-metal was faster and cheaper but produced lower-quality output with no process trail.
