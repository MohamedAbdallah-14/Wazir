## Phase: init
- [ ] Run `wazir capture init --run <id> --phase init --status starting`
- [ ] Write briefing to `.wazir/input/briefing.md`
- [ ] Run `git checkout -b feat/<name>` (if on main)
- [ ] Write run-config to `.wazir/runs/<id>/run-config.yaml`
- [ ] Run `wazir pipeline init --run <id>` to render phase checklists
- [ ] Run `wazir capture event --run <id> --event phase_enter --phase clarifier --status starting` <!-- transition -->
