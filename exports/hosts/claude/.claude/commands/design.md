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

- design artifact (`.fig` + exported code + tokens + screenshots)

## Skip Conditions

- project has no visual design needs
- open-pencil MCP server is not available (proceed to planning with text-only design specs)

## Approval Gate

- explicit human approval required before design-review

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- design does not address spec requirements
- missing exported code scaffolds or tokens
