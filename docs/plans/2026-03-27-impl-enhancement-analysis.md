# Wazir Implementation Analysis — Cross-Model Review Request

You are reviewing an analysis comparing Wazir's UPDATED vision (pipeline-complete.md, pipeline.md) against its current implementation (skills, roles, workflows, tooling code).

## Context

The vision was just updated: State Management now allows SQLite as orchestrator projection layer. Final review is 2+conditional 3rd passes (not 4). Fix executors batch by severity tier. Cross-model reviewer gets deterministic inputs only (no prior LLM findings). Concern resolution has sycophancy guard and residuals intake.

## The Analysis Claims 10 Implementation Mechanisms Should Be Added to the Vision

### 1. Learning pipeline 4-stage lifecycle (TALLY→CANDIDATE→PROMOTE→ACTIVE)
Implementation has: auto-tallying at insert, 3+ occurrences AND 2+ runs for candidacy, max 30 active cap, 90-day TTL, human gate. Vision says "pattern extraction: findings in 3+ subtasks" and "proposes, never auto-applies" but lacks the lifecycle states, cap, TTL, or tallying mechanism.

### 2. Quality score convergence for early termination
Self-audit: quality_score = (checks_passing / total_checks) * 100. 3 consecutive loops with delta < 2% → stop early. Vision has fixed pass counts but no convergence detection for the internal review loop.

### 3. Gating rules as YAML config
config/gating-rules.yaml + gating/agent.js: deterministic rule evaluator with continue/loop_back/escalate. Three explicit conditions. Vision describes exit criteria in prose only.

### 4. Phase report schema as structural contract
schemas/phase-report.schema.json: attempted_actions, drift_analysis, quality_metrics, risk_flags, decisions, verdict_recommendation. Vision describes report contents but not the structural contract.

### 5. Model routing table (3 tiers with task-type mapping)
Haiku for mechanical, Sonnet for comprehension, Opus for judgment. Vision says "Maps model tier via config table" but doesn't specify which tasks map to which tiers.

### 6. User input capture as learning signal
Every user correction/rejection/redirect persisted to user-input-log.ndjson. "User corrections are the strongest signal for improvement." Vision's learning system doesn't identify user corrections as a distinct signal.

### 7. Input coverage matrix (3-way post-execution traceability)
Input item → plan task → commit SHA. Missing = HIGH, Partial = MEDIUM. Vision has scope gate at planning but no post-execution traceability check.

### 8. Codex codex-unavailable graceful degradation pattern
Per-pass: log error, mark codex-unavailable, continue with self-review, next pass retries. Vision says "falls back" but doesn't specify the per-pass pattern.

### 9. Protected-path safety rails with runtime verification
Declared paths + git diff --name-only verification. Vision doesn't specify path protection for completion pipeline.

### 10. Reasoning chain (two-layer pattern)
Layer 1: conversation (trigger + reasoning + counterfactual). Layer 2: file (structured entries). Vision's pre-execution has this but completion pipeline doesn't.

## Also Found 6 Implementation Bugs

1. quality_metrics field mismatch — report builder outputs metrics.tests.failed, gating agent reads quality_metrics.test_fail_count
2. Hit-rate demotion documented but not implemented
3. Canonicalization duplicated between db.js and learn/pipeline.js
4. all_passed = true on empty evidence in proof collector
5. Learnings expires_at never enforced
6. Scope coverage guard is count-only, not content-based

## Your Task

Read these files to verify claims:
- docs/vision/pipeline-complete.md (UPDATED — just changed)
- docs/vision/pipeline.md (UPDATED — just changed)
- skills/self-audit/SKILL.md
- skills/executor/SKILL.md
- skills/wazir/SKILL.md
- config/gating-rules.yaml
- schemas/phase-report.schema.json
- tooling/src/state/db.js
- tooling/src/learn/pipeline.js
- tooling/src/gating/agent.js
- tooling/src/verify/proof-collector.js
- tooling/src/reports/phase-report.js
- roles/learner.md
- workflows/learn.md

For EACH of the 10 items:
1. AGREE or DISAGREE that it should go into the vision
2. WHY — cite specific evidence
3. Rate importance: CRITICAL / HIGH / MEDIUM / LOW
4. Flag if the analysis OVERCLAIMS — is this genuinely vision-level or implementation detail?

For the 6 bugs:
1. Verify each bug exists by reading the actual code
2. Rate severity
3. Flag any the analysis missed

Also answer:
- Are any of the 10 items already covered by the updated vision and the analyst missed it?
- Is the analysis biased toward the implementation again?
- What did the analysis miss entirely?

Be adversarial. Don't rubber-stamp.
