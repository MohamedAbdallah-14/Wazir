# Cross-Model Review: `design-plan.md`

Overall: not clean. No CRITICAL findings, but there are 2 HIGH, 2 MEDIUM, and 1 LOW issues that should be resolved before treating this plan as ready.

## CRITICAL

No CRITICAL findings.

## HIGH

- **HIGH — TC-6 is no longer addressed at the stage the synthesis called for, which weakens the pipeline's independent verification model.** `docs/vision/research/design-plan.md:106-116`, `docs/vision/research/SYNTHESIS.md:146-160`, `docs/vision/pipeline.md:295-301`
  The synthesis explicitly places supply-chain verification in Stage 3 Verify. The plan merges TC-5 and TC-6 into Execute, so the same stage that edits dependency manifests now also owns the dependency-security gate. That is not just additive wording; it changes stage responsibility in a pipeline whose current semantics are "Execute implements" and "Verify generates proof." Secrets gating belongs naturally in Execute, but supply-chain verification is closer to the verifier's role and should stay independently checked.
  Fix: keep secrets scanning in Execute, but put supply-chain verification in Verify as synthesized, or require it in both places with Verify producing the authoritative proof artifact.

- **HIGH — The new hybrid-verification artifacts are threaded only into Review, not into the proof/completion path, so the plan leaves the merged-state gate partially unchanged.** `docs/vision/research/design-plan.md:38-59`, `docs/vision/pipeline.md:283-301`, `docs/vision/pipeline.md:378-408`, `docs/vision/pipeline.md:543-573`, `docs/vision/research/SYNTHESIS.md:65-81`
  Change 2 says deterministic analysis writes `analysis-findings.json` and that Stage 2 Review consumes it. The plan does not say Stage 3 Verify reruns or validates those checks, does not add the artifact to the documented output structure, and does not extend Completion Stage 1 / final-review inputs to include deterministic findings on merged main. That means the plan adds a hybrid-review principle but only wires it into one part of the pipeline.
  Fix: explicitly propagate deterministic/security analysis into Verify and merged-main Integration Verification, and update the output-structure/final-review inputs so the new evidence is part of the source-of-truth pipeline, not a side artifact seen only by reviewers.

## MEDIUM

- **MEDIUM — The structured summary schema drops blocker information that the synthesis said was mandatory for routing.** `docs/vision/research/design-plan.md:90-100`, `docs/vision/research/SYNTHESIS.md:112-124`, `docs/vision/pipeline.md:307-321`
  The synthesis called for a mandatory summary schema including `blocking_issues`. The plan includes completion status, artifact locations, decisions, modified files, open questions, and downstream impacts, but not blockers. "Open questions" is not enough for routing NEEDS_CONTEXT, BLOCKED, and FAILED cases. This is one of the few fields the orchestrator can least afford to lose.
  Fix: add a required blocker/blocking-issues category to the summary schema.

- **MEDIUM — The timeout change slips into implementation policy and leaves adjacent source-of-truth sections stale.** `docs/vision/research/design-plan.md:121-130`, `docs/vision/pipeline.md:277-281`, `docs/vision/pipeline.md:333-356`, `docs/vision/pipeline.md:602-603`
  Adding `max_wall_clock` is a good vision-level fix. The rest of the proposal is much lower-level: doubling the timeout on first failure, escalating after the second timeout, and adding a concrete `error_type` enum entry. At the same time, the plan does not mention the matching edits needed in Failure Handling and Principle 23, which still describe cost controls as `max_steps`, `max_cost`, and `max_retries`.
  Fix: keep the vision-level requirement as "agents have a wall-clock timeout and timeout is distinguishable from other failures," then either remove the retry-policy specifics or explicitly update Failure Handling and Principles so the document stays internally consistent.

## LOW

- **LOW — Change 5 contains an internal wording contradiction about what is actually in the micro-commit flow.** `docs/vision/research/design-plan.md:112-116`
  The text says secrets scanning and supply-chain verification are both part of the Execute-stage completion protocol, then gives the flow as `lint → static analysis → secrets scan → commit`. Supply-chain verification is not in that sequence, which makes the change read as partially merged rather than cleanly designed.
  Fix: either show the conditional supply-chain branch in the flow or stop describing both controls as the same checkpoint sequence.

## Bottom Line

The plan is directionally right and covers all seven synthesis findings, but it is not fully self-consistent yet. The main issue is that it weakens or under-specifies where the new deterministic/security evidence lives in the existing Execute → Review → Verify → Completion model. Resolve that, add blocker information back to the summary schema, and tighten the timeout wording before using this as the amendment plan for `pipeline.md`.
