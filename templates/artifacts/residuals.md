---
artifact_type: residuals
phase: execute
role: orchestrator
run_id: <run-id>
subtask_id: <subtask-id>
status: unresolved
sources:
  - <subtask-spec>
  - <review-findings>
---

# Residuals — <subtask-id>

## Loop Summary

- **Steps executed:** <1-7>
- **Total spawns:** <count>
- **Final Reviewer/Verifier pass:** step <N>

## Unresolved Findings

### Finding 1

- **Severity:** <critical | high | medium | low>
- **File:** `<path>`
- **Line:** <number>
- **Source:** <[Internal] | [Codex] | [Gemini] | [Both]>
- **Description:** <what the finding is>
- **What was attempted:** <which executor step tried to fix it, what approach was taken>
- **Why it remains unresolved:** <why the fix didn't work or wasn't attempted>
- **Recommended action:** <fix in cleanup pass | escalate to user | defer to next run>

## Disposition

- **CRITICAL findings:** <count> — triggers Level 2 escalation if > 0
- **Non-critical findings:** <count> — collected for completion gate
