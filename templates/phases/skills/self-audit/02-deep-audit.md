## Phase: deep_audit
source_write_policy: deny
- [ ] Check cross-reference consistency (roles, workflows, skills, schemas)
- [ ] Check documentation drift (architecture, roles-and-workflows, README)
- [ ] Check export freshness (`wazir export --check`)
- [ ] Check schema coverage
- [ ] Check hook integrity
- [ ] Check skill structure (SKILL.md frontmatter)
- [ ] Check code quality (eslint, tsc if available)
- [ ] Check test coverage
- [ ] Check expertise coverage (composition-map references)
- [ ] Check input coverage (if run context exists)
- [ ] Assign severity to each finding (critical/high/medium/low)
- [ ] Run `wazir capture skill-phase --phase fix` <!-- transition -->
