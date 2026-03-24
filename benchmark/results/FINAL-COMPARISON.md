# Wazir vs Bare-Metal: Final Benchmark Report

**Date:** 2026-03-24
**Model:** Sonnet 4.6
**Task:** Add run pruning to the Wazir CLI
**Protocol:** Properly stripped bare-metal (no CLAUDE.md, .claude/, hooks/, skills/, --disable-slash-commands, --strict-mcp-config) vs full Wazir enforcement

---

## Results

```text
Test Failures

Bare-Metal    ████████████████████████████████████░  36 failures
Wazir         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   1 failure

                                                     36x fewer failures
```

| Metric | Bare-Metal | Wazir | Improvement |
|--------|-----------|-------|-------------|
| **Test failures** | **36** | **1** | **97% fewer (36x)** |
| Tests total | 782 | 796 | +14 more tests written |
| Clarification artifacts | 0 | 4 | Spec, design, plan, clarification |
| Init phase | Not tracked | 100% (COMPLETED) | Full pipeline tracking |
| Duration | 361s (6min) | 713s (12min) | 2x slower |
| Cost | $1.23 | $2.72 | 2.2x more |
| Source files created | 3 | 4 | +1 (separated concerns) |

---

## What Bare-Metal Did

1. Read `cli.js` and `capture/command.js` to understand patterns
2. Wrote implementation directly (no spec, no design)
3. Wrote tests after implementation
4. One monolithic commit
5. 36 test failures — broke existing tests

## What Wazir Did

1. **Bootstrap:** `wazir capture ensure` → created run, phase files
2. **Init (100%):** briefing, branch, run-config, pipeline init, transition
3. **Clarifier:** produced 4 artifacts:
   - `clarification.md` — scope and constraints
   - `spec-hardened.md` — measurable acceptance criteria
   - `design.md` — architecture decision
   - `execution-plan.md` — ordered task breakdown
4. **Executor:** implemented from the plan, 14 more tests than bare-metal
5. **Result:** 1 test failure (vs 36)

---

## Why Wazir Produces Better Code

The quality difference comes from **clarification before coding**:

- Bare-metal guessed how `resolveStateRoot()` works → broke 36 tests
- Wazir researched the codebase first, documented the state root contract in `spec-hardened.md`, then implemented against that spec → 1 failure

The 4 clarification artifacts took ~3 minutes of the 12-minute run. That 3-minute investment prevented the ~30 minutes of debugging that 36 test failures would require.

---

## Compliance (Wazir run)

| Phase | Status | Items |
|-------|--------|-------|
| Init | COMPLETED | 6/6 (100%) |
| Clarifier | Artifacts produced | 4 files |
| Executor | Code + tests | 795/796 pass |
| Pipeline compliance | **~70%** | Without human reminders |

---

## Cross-Model Compliance

| Model | Compliance (no human) | Test failures |
|-------|----------------------|---------------|
| Haiku (cheapest) | 67% | 83 failures (code quality) |
| Sonnet (mid-tier) | ~70% | **1 failure** |
| Baseline (no Wazir) | 0% | 36 failures |

---

## The Bottom Line

Wazir costs 2.2x more per run but produces 36x fewer failures. The ROI:

- **Without Wazir:** $1.23 + debugging 36 failures (~30 min developer time)
- **With Wazir:** $2.72 + debugging 1 failure (~2 min developer time)

Net saving: ~28 minutes of developer time per task. At $100/hr, that's $47 saved for $1.49 additional API cost.

---

## Methodology

- Bare-metal: `claude --dangerously-skip-permissions --model sonnet --disable-slash-commands --setting-sources project --strict-mcp-config`
- Wazir: `claude --dangerously-skip-permissions --model sonnet` with full enforcement stack
- Both: `-p` mode (non-interactive), `--output-format json`, `--max-turns 150-200`
- Same task prompt (with `/wazir:wazir` prefix for Wazir variant)
- Same base branch, same codebase state
- Bare-metal stripped: no CLAUDE.md, no .claude/, no hooks/, no skills/
