# clarify

## Purpose

Convert operator input into clarified scope, explicit questions, and a usable problem frame.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- `input/` briefing files
- active research where required

## Primary Role

- `clarifier`

## Outputs

- clarification artifact
- unresolved questions list
- scope summary

## Approval Gate

- no formal approval gate, but unresolved material ambiguity must be escalated

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- unresolved ambiguity hidden as certainty
