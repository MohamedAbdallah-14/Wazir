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

## Review Loop

Clarification artifact is reviewed by the reviewer role using the review loop pattern with spec/clarification dimensions. The reviewer is invoked with `--mode clarification-review`. The clarifier resolves findings. Clarification does not flow to specify until all review passes complete.

## Approval Gate

- no formal approval gate, but unresolved material ambiguity must be escalated

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- unresolved ambiguity hidden as certainty
