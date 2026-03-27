---
name: wz:compliance-measurement
description: Measure pipeline compliance for a completed run — checks phase execution, artifact production, gate evidence, hook enforcement, and publishes per-step and aggregate compliance scores.
enforcement:
  phased: true
  profile: default
---
The pipeline isn't decoration. It's the process. Start by reading your current phase file at .wazir/runs/latest/phases/. If a skill applies, use the skill — no exceptions. Which checklist items apply to this task?

# Compliance Measurement

Measure how faithfully the pipeline was followed during a run. Produce per-phase and aggregate compliance scores backed by evidence.

## Command Routing
Follow the Canonical Command Matrix in `hooks/routing-matrix.json`.
- Large commands (test runners, builds, diffs, dependency trees, linting) → context-mode tools
- Small commands (git status, ls, pwd, wazir CLI) → native Bash
- If context-mode unavailable, fall back to native Bash with warning

## Codebase Exploration
1. Query `wazir index search-symbols <query>` first
2. Use `wazir recall file <path> --tier L1` for targeted reads
3. Fall back to direct file reads ONLY for files identified by index queries
4. Maximum 10 direct file reads without a justifying index query
5. If no index exists: `wazir index build && wazir index summarize --tier all`

## When to Run

- During the `final_review` phase, after integration verification and before learnings extraction
- On-demand via `/wazir compliance` for any completed or in-progress run

## Inputs

- Run directory: `.wazir/runs/<run-id>/` (or `.wazir/runs/latest/`)
- Event log: `events.jsonl`
- Phase artifacts in run directory
- Git log for the run's branch

## Measurement Dimensions

### 1. Phase Execution (weight: 30%)

Check whether each pipeline phase was entered and exited:

| Check | Evidence | Score |
|---|---|---|
| Phase enter event exists | `events.jsonl` contains `phase_enter` for each expected phase | 1 per phase |
| Phase exit event exists | `events.jsonl` contains `phase_exit` for each completed phase | 1 per phase |
| No phases skipped | All phases between first and last have enter/exit pairs | 0 or 1 |
| Phase order correct | Enter events appear in pipeline-defined sequence | 0 or 1 |

**Scoring:** `(phases_with_enter_exit / expected_phases) * 100`

### 2. Artifact Production (weight: 25%)

Check whether required artifacts exist and are non-empty:

| Phase | Required Artifacts |
|---|---|
| clarify | `clarified/clarification.md` |
| specify | `clarified/spec-hardened.md` |
| design | `clarified/design.md` |
| plan | `clarified/execution-plan.md` |
| execute | `subtask-status.json` per subtask, code on branch |
| verify | `artifacts/verification-proof.md` or `proof.json` |
| review | `findings.md` or `analysis-findings.json` |
| learn | learnings artifacts in `completion/learnings/` |

**Scoring:** `(artifacts_present_and_nonempty / required_artifacts) * 100`

### 3. Gate Evidence (weight: 20%)

Check whether approval gates have evidence of review:

| Gate | Evidence Required |
|---|---|
| spec-challenge | Review findings file exists, verdict recorded |
| design-review | Review findings file exists, verdict recorded |
| plan-review | Review findings file exists, verdict recorded |
| per-subtask review | Review findings per subtask |
| final review | Pass 1 + Pass 2 findings exist |

**Scoring:** `(gates_with_evidence / expected_gates) * 100`

### 4. Hook Enforcement (weight: 15%)

Check whether hooks were active during the run:

| Check | Evidence |
|---|---|
| Bootstrap gate fired | `events.jsonl` or state file shows bootstrap verification |
| Protected paths respected | No modifications to protected paths in git diff |
| Session boundaries honored | Handover artifacts exist at phase transitions |
| Context routing active | Capture routing events in log |

**Scoring:** `(hook_checks_passing / total_hook_checks) * 100`

### 5. Process Quality (weight: 10%)

Check process signals that indicate discipline:

| Check | Evidence |
|---|---|
| Conventional commits | All commits in run follow conventional format |
| TDD evidence | Test files committed before or with implementation |
| Fresh agents used | No same-session fix evidence (multi-turn on same artifact) |
| Handover artifacts | Session boundary handovers exist where required |
| Findings resolved | No unresolved CRITICAL findings in final state |

**Scoring:** `(quality_checks_passing / total_quality_checks) * 100`

## Aggregate Score

```
compliance_score = (
    phase_execution  * 0.30 +
    artifact_production * 0.25 +
    gate_evidence    * 0.20 +
    hook_enforcement * 0.15 +
    process_quality  * 0.10
)
```

### Verdict

| Score | Verdict |
|---|---|
| 90-100% | FULL COMPLIANCE — pipeline followed as designed |
| 75-89% | HIGH COMPLIANCE — minor gaps, pipeline substantially followed |
| 50-74% | PARTIAL COMPLIANCE — significant gaps, review process |
| 0-49% | LOW COMPLIANCE — pipeline not effectively followed |

## Output

Write `compliance-report.md` to `.wazir/runs/<run-id>/completion/compliance-report.md`:

```markdown
# Compliance Report

## Run
- **Run ID:** <run-id>
- **Branch:** <branch>
- **Date:** <date>

## Aggregate Score: <score>% — <verdict>

## Per-Dimension Scores

| Dimension | Score | Weight | Weighted |
|---|---|---|---|
| Phase execution | <n>% | 30% | <weighted>% |
| Artifact production | <n>% | 25% | <weighted>% |
| Gate evidence | <n>% | 20% | <weighted>% |
| Hook enforcement | <n>% | 15% | <weighted>% |
| Process quality | <n>% | 10% | <weighted>% |

## Findings

### Phase Execution
- <list of phases with pass/fail and evidence>

### Artifact Production
- <list of artifacts with present/missing>

### Gate Evidence
- <list of gates with evidence/missing>

### Hook Enforcement
- <list of hook checks with pass/fail>

### Process Quality
- <list of quality checks with pass/fail>

## Trend (if previous runs exist)
- Previous run: <score>%
- Delta: <+/- change>
- Direction: <improving/stable/declining>
```

After drafting the compliance report, invoke `wz:humanize` on the prose sections before writing to disk (domain: technical-docs). Fix any high/medium findings. Compliance reports may be shared with stakeholders to demonstrate pipeline quality.

Store the aggregate score in state.sqlite via `wazir capture event --run <run-id> --event compliance_score --data '{"score": <n>, "verdict": "<verdict>"}'`.

## Trend Analysis

If previous compliance reports exist, include trend data:
- Compare against last 5 runs
- Flag declining trends (3+ consecutive drops)
- Highlight improving dimensions

## Integration with Learning System

Compliance gaps feed the learning system:
- Recurring low-scoring dimensions become learning proposals
- Phases that consistently score below 80% trigger process improvement recommendations
- Hook enforcement gaps trigger hook configuration review
