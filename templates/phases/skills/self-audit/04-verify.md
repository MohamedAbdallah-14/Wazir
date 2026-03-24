## Phase: verify
source_write_policy: deny
- [ ] Re-run full Phase 1 validation sweep
- [ ] All checks must pass
- [ ] Revert any failing fixes and re-verify
- [ ] Calculate `quality_score_after` and delta
- [ ] Run `wazir capture skill-phase --phase report` <!-- transition -->
