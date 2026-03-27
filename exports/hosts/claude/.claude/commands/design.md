# design

## Purpose

Transform the approved spec into visual designs using open-pencil MCP tools.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- approved spec artifact
- research artifacts
- brand/style guidelines (if available)
- author artifact

## Primary Role

- `designer`

## Outputs

- design artifact (`.fig` + tokens + screenshots, optionally exported code scaffolds as reference)

## Skip Conditions

- project has no visual design needs
- open-pencil MCP server is not available (proceed to architectural design with text-only design specs)

## Approval Gate

- explicit human approval required before visual-design-review

## Review Loop

After user approval, visual design artifact is reviewed via the design-review workflow (`workflows/design-review.md`) using the review loop pattern with the visual design-review dimensions (spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity). The reviewer is invoked with `--mode visual-design-review`. Design does not flow to planning until all review passes complete.

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- design does not address spec requirements
- missing design tokens
