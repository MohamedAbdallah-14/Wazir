# learn

## Purpose

Extract durable scoped learnings and experiments from the completed run.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- run artifacts
- review findings
- verification proof

## Primary Role

- `learner`

## Steps

1. **Read decision log:** Read `.wazir/runs/<id>/decisions.ndjson` to identify recurring decision patterns for learning extraction. Look for decisions with low confidence, decisions that were revised, and decisions that produced unexpected outcomes.

2. **Write proposed learnings:** Write one proposed learning file per durable insight to `memory/learnings/proposed/run-<id>-NNN.md` using `templates/artifacts/learning-proposal.md` as template. Each file must include scope tags, confidence level, and the evidence chain from the run that produced it.

3. **Append cumulative findings:** Append a summary of this run's review findings to `memory/findings/cumulative-findings.md`. Format:
   ```
   ## Run <id> (YYYY-MM-DD)
   - [finding]
   ```

4. **Check for antipattern review trigger:** After every 5th run (check count of `## Run` headers in `memory/findings/cumulative-findings.md`): output 'N runs accumulated. Review cumulative findings for new antipattern candidates?'

## Outputs

- proposed learning artifacts in `memory/learnings/proposed/run-<id>-NNN.md`
- experiment summaries
- cumulative findings appended to `memory/findings/cumulative-findings.md`

## Approval Gate

- accepted learnings require explicit review and scope tags

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Failure Conditions

- auto-applied learning drift
