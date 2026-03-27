# discover

## Purpose

Gather source-backed research that reduces planning and implementation risk.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- user briefing (`.wazir/input/briefing.md` + any `input/*.md` files)
- research questions extracted from briefing

## Primary Role

- `researcher`

## Outputs

- research artifact
- cited findings

## Review Loop

Research artifact is reviewed by the reviewer role using the review loop pattern (`docs/reference/review-loop-pattern.md`) with research dimensions (coverage, source quality, relevance, gaps, contradictions). The reviewer is invoked with `--mode research-review`. The researcher resolves findings. Research does not flow to specify until all review passes complete.

## Approval Gate

- no formal approval gate, but unsupported research cannot flow forward

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- missing citations
