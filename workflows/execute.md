# execute

## Purpose

Implement the approved plan in ordered, verified batches.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Pre-execution validation

Before implementing, run these checks to ensure the repo is in a valid state:
- `wazir validate manifest` — confirm the manifest schema is still valid
- `wazir validate hooks` — confirm hook contracts are intact

If either check fails:
1. Surface the failure to the user
2. Do NOT proceed with implementation until the issue is resolved

## Inputs

- approved implementation plan
- current branch state
- author artifact (i18n keys, seed data, notification templates)

## Primary Role

- `executor`

## Outputs

- code and docs changes
- execution notes

## Approval Gate

- no new scope without explicit approval

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- plan drift
