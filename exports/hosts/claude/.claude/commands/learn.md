# learn

## Purpose

Extract durable scoped learnings from the completed run using the 4-stage promotion pipeline.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase learn --status in_progress`

## Inputs

- run artifacts
- review findings (all passes, all tiers)
- verification proof

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

## Outputs

- Tallied findings in `finding_clusters` table
- Promoted candidates in `antipattern_candidates` table
- Proposed learning artifacts in `memory/learnings/proposed/`
- Cumulative findings appended to `memory/findings/cumulative-findings.md`

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
