# plan-review

## Purpose

Adversarially review the implementation plan before execution starts.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- draft implementation plan
- approved spec

## Primary Role

- `reviewer`

## Outputs

- plan review findings
- revised tasks when needed

## Approval Gate

- execution cannot begin until blocking findings are closed or explicitly accepted

## Gate decision

On approval: `wazir capture event --run <run-id> --event gate_approved --phase <phase-name>`
On rejection: `wazir capture event --run <run-id> --event gate_rejected --phase <phase-name> --message "<reason>"`

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Loop Structure

Follows the review loop pattern in `docs/reference/review-loop-pattern.md` with 8 plan dimensions (including Input Coverage). The planner role resolves findings. Pass count determined by depth. No extension.

**Input Coverage dimension:** The reviewer reads the original input/briefing, counts distinct items, and compares against tasks in the plan. If `tasks_in_plan < items_in_input`, this is a HIGH finding listing the missing items. This prevents silent scope reduction where 21 input items become 5 tasks.

## Failure Conditions

- sequence gaps survive review
