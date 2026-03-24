# Wazir TODO

## Done
- [x] Rollback to PR #4 stable state (9d0f3b0)
- [x] 7-agent enforcement research (30+ papers) — docs/research/2026-03-23-enforcement-research-synthesis.md
- [x] 4-agent context/memory research — fewer context = more compliance
- [x] Pipeline enforcement design — 10 review passes (superpowers x3, wz:code-reviewer x1, codex x6)
- [x] Phase file templates (init, clarifier, executor, final_review) with checklists
- [x] PreToolUse injection hook — injects current step on Write/Edit/Bash
- [x] Stop hook — blocks premature completion
- [x] Phase transition validation via `wazir capture event`
- [x] Layer 2 skill reminders in all 29 skill files
- [x] Bootstrap gate — blocks Write/Edit/Bash until `wazir capture ensure` runs
- [x] Phase-aware write blocking — source writes denied during non-executor phases
- [x] `wazir capture ensure` — idempotent run bootstrap
- [x] Strip mustache markers in createPhaseFiles for immediate usability
- [x] Benchmark: Sonnet — 36x fewer test failures with Wazir vs bare-metal (1 vs 36)
- [x] Benchmark: Haiku — 67% compliance without human reminders
- [x] KI-005: TodoWrite redirect — existing-list guard in SKILL.md Phase 0

## Current: Ship remaining cheap enforcement fixes

### KI-004: Symlink consistency
- [ ] Unify `latest` pointer creation — always symlink, one code path
- [ ] All hooks fail-open when this pointer breaks — high blast radius

## Next
- [ ] Measure compliance with KI-001 + KI-002 + KI-003 + KI-005 all fixed
- [ ] If still below 70%: add `.claude/agents/wz-clarifier.md` with `tools:` restriction (subagent-level enforcement, no rewrite)
- [ ] Skill-level enforcement — scope stack design at docs/plans/2026-03-24-skill-level-enforcement-design.md
- [ ] Sub-skills pipeline awareness (KI-009)
- [ ] DeCRIM-style prompt restructuring

## Banked (researched, not building now)
- [ ] `claude -p` orchestrator — main session dispatches phases as separate `-p` calls with `--disallowedTools`. Fresh context per phase. Clarifier loop protocol. Executor parallel batches with per-task worktrees. Full design in docs/plans/2026-03-24-enforcement-v3-findings.md + research from 2026-03-24 session.
- [ ] Typed artifact envelopes between phases (Codex recommendation)
- [ ] Append-only event log for audit trail (Codex recommendation)
- [ ] Restriction test matrix — canary jobs for forbidden writes/commits/skips

## Future
- [ ] UI for pipeline progress (pixel-agents, claude-replay)
- [ ] Expand to Codex, Gemini, Cursor hosts
- [ ] ContextCov: auto-generate executable constraints from SKILL.md (arXiv:2603.00822)
- [ ] Process Reward Model for step-level compliance checking

## Compliance Data

| Session | Approach | Compliance |
|---------|----------|-----------|
| 1-5 | Prompt engineering, psychology | 15-60% |
| 6 | Interactive mode | 58% |
| 7 | Subagent controller (failed) | 40% |
| 8 | Phase file checklists + human reminders | 76% |
| 9 | Bootstrap gate + phase blocking (Haiku, no human) | 67% |
| 10 | Sonnet benchmark (no human) | ~70% |
| Target | | **80%** |

## Research References
- docs/research/2026-03-23-enforcement-research-synthesis.md — enforcement research
- docs/research/2026-03-21-the-enforcement-problem.md — problem statement
- docs/plans/2026-03-23-pipeline-enforcement-design.md — enforcement design (10 reviews)
- docs/plans/2026-03-23-phase-aware-blocking-design.md — phase-aware blocking
- benchmark/results/FINAL-COMPARISON.md — Sonnet benchmark (36x fewer failures)
