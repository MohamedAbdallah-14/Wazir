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

## Current: Extend enforcement to all structured skills
Agents skip 80% of skill instructions. Self-audit ran Phase 1 only, skipped Phase 2-5. The enforcement hooks only work for /wazir pipeline phases. Every skill with structured phases needs the same enforcement pattern. Design in progress with Codex.

## Next
- [ ] Implement skill-level enforcement (pending Codex design)
- [ ] DeCRIM-style prompt restructuring — decomposed constraints, not prose paragraphs
- [ ] Measure compliance after prompt changes
- [ ] Build compliance self-audit that actually enforces its own phases

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
