## Phase: clarifier
- [ ] Read `.wazir/input/briefing.md` and any input files
{{#workflow.discover}}
- [ ] Use `Skill(wz:clarifier)` — run discover workflow (research codebase + external sources)
{{/workflow.discover}}
{{#workflow.clarify}}
- [ ] Use `Skill(wz:clarifier)` — run clarify workflow (scope, constraints, assumptions)
{{/workflow.clarify}}
{{#workflow.specify}}
- [ ] Use `Skill(wz:clarifier)` — run specify workflow (measurable spec)
{{/workflow.specify}}
{{#workflow.spec-challenge}}
- [ ] Use `Skill(wz:clarifier)` — run spec-challenge review
{{/workflow.spec-challenge}}
{{#workflow.author}}
- [ ] Use `Skill(wz:clarifier)` — run content-author workflow
{{/workflow.author}}
{{#workflow.design}}
- [ ] Use `Skill(wz:brainstorming)` — run design workflow (2-3 approaches)
- [ ] Get user approval on design choice
{{/workflow.design}}
{{#workflow.design-review}}
- [ ] Run architectural-design-review loop
{{/workflow.design-review}}
{{#workflow.plan}}
- [ ] Use `Skill(wz:writing-plans)` — produce execution plan
{{/workflow.plan}}
{{#workflow.plan-review}}
- [ ] Run plan-review loop
{{/workflow.plan-review}}
- [ ] Get user approval on clarified spec and plan
- [ ] Write outputs to `.wazir/runs/<id>/clarified/`
- [ ] Run `wazir capture event --run <id> --event phase_enter --phase executor --status starting` <!-- transition -->
