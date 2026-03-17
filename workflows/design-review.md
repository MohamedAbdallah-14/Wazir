# design-review

## Purpose

Validate the design artifact and author artifact against the approved spec, checking visual consistency, accessibility, and completeness before planning.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- design artifact
- author artifact
- approved spec artifact
- accessibility guidelines

## Primary Role

- `reviewer`

## Outputs

- design review findings with severity
- no-findings verdict when applicable

## Approval Gate

- unresolved blocking findings must stop progression to planning

## Gate decision

On approval: `wazir capture event --run <run-id> --event gate_approved --phase <phase-name>`
On rejection: `wazir capture event --run <run-id> --event gate_rejected --phase <phase-name> --message "<reason>"`

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- vague findings without visual evidence
- rubber-stamp approval without checking accessibility
- design drift from spec not flagged
