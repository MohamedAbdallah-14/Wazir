# prepare-next

## Purpose

Prepare the next run or next execution slice without silently carrying stale context forward.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- current run summary
- accepted learnings where explicitly enabled
- concern registry and resolutions (final disposition)
- residuals and their disposition
- final review findings (per pass, with adoption rates)
- quality delta (per-dimension first-pass vs final-state)
- cost and timing data

## Primary Role

- `planner`

## Outputs

Two output modes:

### Mode 1: Run Complete
- `execution-summary.md` — what was built, verification summary, concerns/resolutions, findings per pass with adoption rates, residuals disposition, learning proposals, quality delta, cost/timing, SHIP/SHIP WITH CAVEATS/DO NOT SHIP recommendation

### Mode 2: Run Incomplete
- `handover-batch-N.md` — completed/in-progress/remaining subtask IDs, accumulated concerns, blocked subtasks with lifecycle states, partial learnings, environment state, resume prompt (~500 tokens)

## Approval Gate

- no implicit carry-forward of unapproved learnings

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- stale context treated as current truth
