# author

## Purpose

Write and package all non-code content artifacts before visual design begins.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- approved spec artifact (post spec-challenge)
- research artifacts
- existing locale/glossary sources
- brand/style guidelines (if available)

## Primary Role

- `content-author`

## Outputs

- author artifact (microcopy, i18n keys, seed data, glossary, asset metadata, state coverage, notification templates, content coverage matrix)

## Approval Gate

Hard — human approval required. Content informs design; errors here cascade downstream.

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- incomplete state coverage
- missing locale entries
- placeholder/dummy text
- untraceable copy (no screen-to-key mapping)
- layout-breaking copy not flagged
