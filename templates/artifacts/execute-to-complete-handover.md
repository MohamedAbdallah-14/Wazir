---
artifact_type: execute_to_complete_handover
phase: execute
role: orchestrator
run_id: <run-id>
status: handover
sources:
  - <execution-plan>
  - <subtask-status-files>
---

# Execute-to-Complete Handover

## Run
- **Run ID:** <run-id>
- **Branch:** <branch-name>
- **Interaction mode:** <auto | guided | interactive>
- **Depth:** <quick | standard | deep>

## Execution Summary
- **Subtasks:** <completed>/<total>
- **Residuals:** <count> (CRITICAL: <count>, non-critical: <count>)
- **Concerns accumulated:** <count>
- **Subtasks abandoned:** <count> (if any, with reasons)

## Artifacts
- Clarified artifacts: `.wazir/runs/latest/clarified/`
- Verification proof per subtask: `.wazir/runs/latest/artifacts/`
- Residuals: `.wazir/runs/latest/residuals/` (if any)
- Concerns: accumulated in subtask status files

## Resume Instruction
Start a fresh session (new conversation). Run `/reviewer --mode final`.
The reviewer's prerequisite gate will find all artifacts.
Do NOT reopen this session — context rot from execution degrades review quality.
