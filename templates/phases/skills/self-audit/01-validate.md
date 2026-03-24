## Phase: validate
source_write_policy: deny
- [ ] Run `wazir validate manifest`
- [ ] Run `wazir validate hooks`
- [ ] Run `wazir validate docs`
- [ ] Run `wazir doctor --json`
- [ ] Run `wazir export --check`
- [ ] Run `npm test` and capture pass/fail counts
- [ ] Calculate `quality_score_before`
- [ ] Run `wazir capture skill-phase --phase deep_audit` <!-- transition -->
