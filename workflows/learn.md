# learn

## Purpose

Extract durable scoped learnings and experiments from the completed run.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- run artifacts
- review findings
- verification proof

## Primary Role

- `learner`

## Outputs

- proposed learning artifacts
- experiment summaries

## Approval Gate

- accepted learnings require explicit review and scope tags

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- auto-applied learning drift
