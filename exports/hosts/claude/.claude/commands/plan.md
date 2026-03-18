# plan

## Purpose

Translate the approved spec into an execution-grade implementation plan.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- approved spec
- repo state
- research artifacts
- author artifact

## Primary Role

- `planner`

## Outputs

- implementation plan artifact
- ordered tasks and verification steps

## Review Loop

Plan artifact is reviewed via the plan-review workflow (`workflows/plan-review.md`) using the review loop pattern with plan dimensions. The reviewer is invoked with `--mode plan-review`.

## Approval Gate

- explicit human approval required before execution

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- missing dependencies or unverifiable steps
