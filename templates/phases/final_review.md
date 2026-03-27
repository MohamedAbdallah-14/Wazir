## Phase: final_review (Completion Pipeline — fresh session required)
- [ ] Run integration verification on merged main (tests, typecheck, lint, build, plan-defined criteria) <!-- 4a -->
- [ ] Verify all declared external side effects completed or compensated <!-- 4a -->
- [ ] Run concern resolution — fresh agent evaluates concern registry + residuals <!-- 4b -->
- [ ] Use `Skill(wz:reviewer)` — run 2+1 pass compliance audit against original input <!-- 4c -->
- [ ] Address CRITICAL/HIGH findings via targeted fix executors (batched by severity tier) <!-- 4c -->
- [ ] Re-run full Stage 1 integration verification after fixes (all checks: tests, typecheck, lint, build, deterministic analysis, plan-defined criteria, side-effects) <!-- 4c -->
- [ ] Extract learnings with adoption rates, quality delta, user corrections <!-- 4d -->
- [ ] Prepare execution-summary.md or handover-batch-N.md <!-- 4e -->
- [ ] Run `wazir capture event --run <id> --event phase_exit --phase final_review --status completed` <!-- transition -->
