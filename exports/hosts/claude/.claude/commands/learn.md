# learn

## Purpose

Extract durable scoped learnings from the completed run using the 4-stage promotion pipeline.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase learn --status in_progress`

## Inputs

- run artifacts
- review findings (all passes, all tiers — per-subtask + final review)
- verification proof
- user corrections (`user-input-log.ndjson` — approvals, rejections, redirects, scope changes). User corrections are the highest-priority learning signal — they represent direct evidence of where the pipeline diverged from user intent.
- concern registry, resolutions, and residuals disposition
- model performance data (success/failure per tier per complexity)
- timing data (bottlenecks per phase)
- merge issues (conflicts despite planning)

## Primary Role

- `learner`

## Pipeline Stages

The learning pipeline follows a 4-stage promotion model (Tally → Candidate → Promote → Active):

### Stage 1: TALLY (Automatic)

Every finding from the run is:
1. Canonicalized (file paths, line numbers, identifiers stripped)
2. Hashed for dedup
3. Clustered by semantic similarity in `finding_clusters` table
4. Category-tagged (from the reviewer's finding category)

Also:
- Read `.wazir/runs/<id>/decisions.ndjson` for recurring patterns
- Append summary to `memory/findings/cumulative-findings.md`

Implementation: `tooling/src/learn/pipeline.js` → `tallyFinding()`

### Stage 2: CANDIDATE (Automatic)

Clusters meeting the promotion threshold are flagged:
- **Occurrence threshold:** 3+ findings with the same canonical pattern
- **Run threshold:** Pattern must appear across 2+ distinct runs
- **Drift cap:** No promotion if active antipatterns count >= 30

Implementation: `tooling/src/learn/pipeline.js` → `identifyCandidates()` + `promoteToCandidates()`

### Stage 3: PROMOTE (Human Gate)

Candidates are proposed for user review:
- Written to `memory/learnings/proposed/<run-id>-<NNN>.md`
- User reviews and accepts/rejects via `/wazir audit learnings`
- Accepted candidates move to `status: accepted` in `antipattern_candidates` table

### Stage 4: ACTIVE (Automatic)

Accepted antipatterns are loaded into reviewer context for future runs:
- Injected as project-level learnings alongside expertise modules
- Hit-rate tracked: if an antipattern triggers in <5% of runs over 90 days, it's demoted
- Max 30 active project-level antipatterns (drift prevention)

## Drift Prevention

- **Cap:** 30 active project antipatterns maximum
- **TTL:** 90-day expiry on unreviewed candidates
- **Demotion:** Antipatterns with <5% hit rate over 90 days are auto-demoted
- **Consolidation:** When count exceeds 25, similar antipatterns are merged

## Signal Processing

Beyond the 4-stage lifecycle, the learning agent processes these additional signals:

### Finding Adoption Rate
Proportion of findings that led to actual code changes, tracked per pass, per severity, per source (internal/Codex/Gemini). Detection rate alone is a vanity metric — a pass generating 50 findings with 10% adoption is worse than 8 findings with 87% adoption.

### Quality Delta
Per-dimension scores at first review pass vs final state. Dimensions that consistently improve 5+ points during review indicate executor weaknesses — feed into expertise module proposals targeting those dimensions.

### Review Effectiveness
Which pass found what. Detection rate per pass, per source. Identifies whether internal review or cross-model review is providing more value.

### Model Tier Calibration
Empirical success/failure data per model tier per task complexity. Updates tier mapping configuration.

### User Corrections (Highest Priority)
User approvals, rejections, redirects, and scope changes captured during the run. A user rejection during clarification is stronger signal than 10 reviewer findings.

## Outputs

- Tallied findings in `finding_clusters` table
- Promoted candidates in `antipattern_candidates` table
- Proposed learning artifacts in `memory/learnings/proposed/` with impact scoring (HIGH/MEDIUM/LOW)
- Cumulative findings appended to `memory/findings/cumulative-findings.md`
- Finding adoption rates (per pass, per severity, per source)
- Quality delta report (per-dimension first-pass vs final-state)
- Review effectiveness metrics (detection rate per pass)
- Model tier calibration data
- Expertise proposals (antipatterns, composition-map updates, quality modules, plan checklists)

## Approval Gate

- Accepted learnings require explicit user review and scope tags
- Learnings are NEVER auto-applied to future runs without user acceptance

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase learn --status completed`

## Failure Conditions

- auto-applied learning drift (bypassing human gate)
- candidate count exceeds cap without consolidation
- stale candidates not expired
