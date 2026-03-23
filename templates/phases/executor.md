## Phase: executor
- [ ] Read clarifier output from `.wazir/runs/<id>/clarified/`
- [ ] Use `Skill(wz:tdd)` for each task — RED, GREEN, REFACTOR
- [ ] Run `npm test` — all tests pass
- [ ] Use `Skill(wz:requesting-code-review)` — per-task review before each commit
- [ ] Commit each task with conventional message
- [ ] Use `Skill(wz:verification)` — write verification proof to `.wazir/runs/<id>/artifacts/verification-proof.md`
- [ ] Run `wazir capture event --run <id> --event phase_enter --phase final_review --status starting` <!-- transition -->
