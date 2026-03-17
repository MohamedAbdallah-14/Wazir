# review

## Purpose

Run adversarial review against the changed implementation and its evidence.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- changed files
- verification proof
- approved spec and plan
- design artifact (when design phase was used)

## Primary Role

- `reviewer`

## Outputs

- findings
- no-findings verdict when applicable

## Approval Gate

- unresolved blocking findings must stop completion

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- vague review or uncited findings
- design-implementation mismatch not flagged (when design artifact exists)
