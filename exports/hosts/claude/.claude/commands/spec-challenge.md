# spec-challenge

## Purpose

Adversarially test the proposed spec for contradictions, omissions, and fake completeness.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- draft spec
- research artifacts

## Primary Role

- `reviewer`

## Outputs

- spec challenge findings

## Approval Gate

- spec cannot be treated as approved until challenge findings are resolved or explicitly accepted

## Gate decision

On approval: `wazir capture event --run <run-id> --event gate_approved --phase <phase-name>`
On rejection: `wazir capture event --run <run-id> --event gate_rejected --phase <phase-name> --message "<reason>"`

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- rubber-stamp review
