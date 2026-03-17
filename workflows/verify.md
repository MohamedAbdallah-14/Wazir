# verify

## Purpose

Produce deterministic proof for the claims made by execution.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- changed files
- claimed outcomes
- acceptance criteria

## Primary Role

- `verifier`

## Outputs

- verification proof artifact

## Approval Gate

- no completion claim without fresh proof

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- stale or partial verification
