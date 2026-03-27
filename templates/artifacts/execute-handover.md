---
artifact_type: execute_handover
phase: clarifier
role: clarifier
run_id: <run-id>
status: handover
sources:
  - <clarified-spec>
  - <clarified-design>
  - <clarified-plan>
---

# Clarify-to-Execute Handover

## Run
- **Run ID:** <run-id>
- **Branch:** <branch-name>
- **Interaction mode:** <auto | guided | interactive>
- **Depth:** <quick | standard | deep>

## Artifacts (all verified present)
- Spec: `.wazir/runs/latest/clarified/spec-hardened.md`
- Design: `.wazir/runs/latest/clarified/design.md`
- Plan: `.wazir/runs/latest/clarified/execution-plan.md`
- Clarification: `.wazir/runs/latest/clarified/clarification.md`

## Resume Instruction
Start a fresh session (new conversation). Run `/executor`.
The executor's prerequisite gate will find all artifacts at `.wazir/runs/latest/clarified/`.
Do NOT reopen this session — context rot from clarify degrades execution quality.
