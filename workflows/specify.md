# specify

## Purpose

Turn clarified scope and research into a measurable spec.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- clarification artifact
- research artifacts

## Primary Role

- `specifier`

## Outputs

- spec artifact
- acceptance criteria
- assumptions and non-goals

## Approval Gate

- explicit human approval required before planning

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- acceptance criteria are not testable
