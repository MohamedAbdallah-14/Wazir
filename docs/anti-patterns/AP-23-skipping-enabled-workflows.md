# AP-23: Selectively Skipping Enabled Workflows Within a Phase

## Pattern

An agent completes a phase but skips one or more enabled workflows. The run proceeds to completion without the skipped workflow's output. No error is raised because the phase gate only checks artifacts from explicitly required predecessors, not workflow-level completeness.

## Example

The final review phase has three workflows: `review`, `learn`, `prepare_next`. The agent completes `review` and presents the verdict, but skips `learn` and `prepare_next`. The run is marked complete. No learnings are captured, no handoff document is produced.

## Harm

- Learnings from the run are lost — the same mistakes repeat in future runs
- Handoff documents are missing — the next session starts without context
- Verification evidence is incomplete — claims cannot be audited
- The user believes the pipeline ran fully when it did not

## Detection

`validateRunCompletion(runDir, manifestPath)` in `tooling/src/guards/phase-prerequisite-guard.js` checks that every workflow declared in `wazir.manifest.yaml` has a `phase_exit` event with `status: completed` in the run's `events.ndjson`.

`wazir capture summary --complete` calls this check and refuses to finalize the run if any enabled workflow was skipped.

## Fix

1. Always emit `phase_exit` events for every workflow: `wazir capture event --run <id> --event phase_exit --phase <workflow> --status completed`
2. Use `wazir capture summary --complete` instead of bare `wazir capture summary` at run end
3. The wazir pipeline skill checks completion before presenting final results
