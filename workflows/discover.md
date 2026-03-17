# discover

## Purpose

Gather source-backed research that reduces planning and implementation risk.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- clarified scope
- explicit research questions

## Primary Role

- `researcher`

## Outputs

- research artifact
- cited findings

## Approval Gate

- no formal approval gate, but unsupported research cannot flow forward

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- missing citations
