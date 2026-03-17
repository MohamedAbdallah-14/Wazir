# prepare-next

## Purpose

Prepare the next run or next execution slice without silently carrying stale context forward.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- current run summary
- accepted learnings where explicitly enabled

## Primary Role

- `planner`

## Outputs

- next-step handoff
- scoped context summary

## Approval Gate

- no implicit carry-forward of unapproved learnings

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- stale context treated as current truth
