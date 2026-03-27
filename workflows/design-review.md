# design-review

## Purpose

Validate design artifacts against the approved spec. Supports two review modes with different dimension sets:

- **`architectural-design-review`** — validates implementation approach selection (Phase 5 DESIGN). Used after brainstorming.
- **`visual-design-review`** — validates visual design artifacts from pencil MCP (Phase 4a VISUAL DESIGN). Used after collaborative visual design, when enabled.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

### architectural-design-review
- design artifact (implementation approaches with trade-offs)
- approved spec artifact
- original user input (`briefing.md`)

### visual-design-review
- visual design artifact (`.fig` + exported code + tokens + screenshots)
- author artifact (if content-author workflow ran)
- approved spec artifact
- accessibility guidelines
- original user input (`briefing.md`)

## Primary Role

- `reviewer`

## Outputs

- design review findings with severity
- no-findings verdict when applicable

## Approval Gate

- unresolved blocking findings must stop progression to planning

## Gate decision

On approval: `wazir capture event --run <run-id> --event gate_approved --phase <phase-name>`
On rejection: `wazir capture event --run <run-id> --event gate_rejected --phase <phase-name> --message "<reason>"`

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Loop Structure

Follows the review loop pattern in `docs/reference/review-loop-pattern.md`.

**architectural-design-review:** 6 dimensions (feasibility, spec alignment, completeness, trade-off documentation, YAGNI, security/performance). The designer role resolves findings. Pass count determined by depth. No extension.

**visual-design-review:** 5 dimensions (spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity). The designer role resolves findings. Only runs when Phase 4a VISUAL DESIGN is active. Pass count determined by depth. No extension.

## Failure Conditions

- vague findings without evidence
- rubber-stamp approval without checking dimensions
- design drift from spec not flagged
- (visual only) accessibility issues not flagged
