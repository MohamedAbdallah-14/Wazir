# review

## Purpose

Run adversarial review against the changed implementation and its evidence.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- changed files
- verification proof
- approved spec and plan
- design artifact (when design phase was used)
- original user input (ground truth — `.wazir/input/briefing.md` + `input/*.md`)
- concern resolution output (concern registry + residuals disposition from completion Stage 2)
- integration verification results (test/lint/typecheck/build on merged main from completion Stage 1)
- all `analysis-findings.json` files (deterministic analysis — per-subtask + merged)
- all `proof.json` files (verification evidence from execution)

## Primary Role

- `reviewer`

## Outputs

- findings
- no-findings verdict when applicable

## Approval Gate

- unresolved blocking findings must stop completion
- **precedence rule**: a single unresolved CRITICAL finding prevents SHIP regardless of any other signal (score, pass count, other findings)
- all HIGH findings must be resolved or explicitly accepted by user
- cross-model reviewer must have no unresolved CRITICAL/HIGH
- sign-off: SHIP / SHIP WITH CAVEATS / DO NOT SHIP

## Completion Pipeline Prerequisites

The final review (`--mode final`) requires two upstream completion stages before it runs:

### Stage 1: Integration Verification
Full verification suite on merged main. Two sources:
1. Plan-defined integration criteria from the execution plan (`.wazir/runs/latest/clarified/execution-plan.md`)
2. Standard suite: tests, type checking, lint, build, deterministic analysis

Side effects verification: all declared external side effects from subtask specs must be completed or compensated. Undeclared side effects are CRITICAL findings.

### Stage 2: Concern Resolution
Fresh agent (NOT the producer) evaluates:
1. Concern registry (all DONE_WITH_CONCERNS entries from execution)
2. Residuals (all `residuals-<subtask-id>.md` from execution)
3. Batch-boundary disposition

Sycophancy guard: generating agent MUST NOT rebut concerns during this stage.

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- vague review or uncited findings
- design-implementation mismatch not flagged (when design artifact exists)
