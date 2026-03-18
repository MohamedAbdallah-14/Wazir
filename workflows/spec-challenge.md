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

## Loop Structure

This workflow IS a review loop. Follows the pattern in `docs/reference/review-loop-pattern.md` with spec/clarification dimensions. The specifier role resolves findings. Loop count tracked via `wazir capture loop-check --mode spec-challenge`. Pass count determined by depth (quick=3, standard=5, deep=7). No extension beyond depth pass count.

## Failure Conditions

- rubber-stamp review
