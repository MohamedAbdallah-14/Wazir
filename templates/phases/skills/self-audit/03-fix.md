## Phase: fix
source_write_policy: allow
- [ ] Abort on critical findings (discard worktree)
- [ ] Fix high-severity findings
- [ ] Fix medium-severity findings (if loop budget allows)
- [ ] Log low-severity findings (no fix attempted)
- [ ] Verify no protected paths modified (`git diff --name-only`)
- [ ] Run `wazir capture skill-phase --phase verify` <!-- transition -->
