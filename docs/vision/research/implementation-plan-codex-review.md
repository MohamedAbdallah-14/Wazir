# Cross-Model Review: `implementation-plan.md`

Overall: not clean. No CRITICAL findings, but there are 4 HIGH, 1 MEDIUM, and 1 LOW issues that should be resolved before treating this plan as ready to apply to `pipeline.md`.

## CRITICAL

No CRITICAL findings.

## HIGH

- **HIGH — Edit 3's anchor text does not exist verbatim in `pipeline.md`, so a literal apply step will miss the insertion point.** `docs/vision/research/implementation-plan.md:91-95`, `docs/vision/pipeline.md:99-105`
  The plan says to find `Returns a summary to the orchestrator (~200 tokens, enough to route decisions)`. The actual Markdown is `2. **Returns a summary to the orchestrator** (~200 tokens, enough to route decisions)`. Because the bold markers and list prefix split the literal string, exact-match tooling will fail.
  Fix: anchor on the full existing line or on the bolded substring `**Returns a summary to the orchestrator**`.

- **HIGH — Edit 4 introduces a merged `analysis-findings.json` artifact but never gives that completion-stage artifact a documented location or an explicit downstream consumer.** `docs/vision/research/implementation-plan.md:141-151`, `docs/vision/research/design-plan.md:58-64`, `docs/vision/pipeline.md:378-409`, `docs/vision/pipeline.md:543-574`
  Sub-edit 4d says Integration Verification produces merged `analysis-findings.json`, but sub-edit 4e only adds per-subtask `analysis-findings.json` files to final-review inputs, and sub-edit 4f only annotates per-subtask worktrees. The output structure still has no `completion/integration/analysis-findings.json`, so the plan creates a named artifact with no documented path and no explicit final-review input.
  Fix: add the merged deterministic-analysis artifact to the integration output structure and include it in Final Review inputs, or stop naming a separate merged `analysis-findings.json`.

- **HIGH — Edit 6a's replacement text is truncated, so applied literally it would corrupt a source-of-truth sentence.** `docs/vision/research/implementation-plan.md:173-176`, `docs/vision/pipeline.md:277`
  The quoted replacement ends with `max_output_tokens (4K instruction cliff...` instead of the full existing sentence. This is not safe replacement text for a locked vision document.
  Fix: provide the complete replacement sentence, or say "insert `max_wall_clock ...` after `max_cost ...` and leave the remainder unchanged."

- **HIGH — Edit 6b makes TIMEOUT a `FAILED` cause code, but the status table still defines `FAILED` as only "Verification failed."** `docs/vision/research/implementation-plan.md:177-179`, `docs/vision/pipeline.md:311-319`
  After the new note is inserted, the table says `FAILED | Verification failed`, while the prose below says TIMEOUT is also a FAILED case. That makes the routing contract internally inconsistent in the exact section that is supposed to be mechanically precise.
  Fix: broaden the FAILED row meaning to cover execution-failure causes such as verification failure, timeout, or tool/runtime failure.

## MEDIUM

- **MEDIUM — The timeout change drops a design-plan requirement for machine-readable timeout encoding in `status.json`, leaving timeout as prose-only despite this section's constrained-decoding focus.** `docs/vision/research/design-plan.md:133-145`, `docs/vision/research/implementation-plan.md:177-179`, `docs/vision/pipeline.md:279`, `docs/vision/pipeline.md:307-319`
  The design plan explicitly says the `error_type` enum in `status.json` gains a `Timeout` entry. The implementation plan only adds a note after the status table. That weakens the structured-output story: the document now names a timeout condition, but not the structured field that records it.
  Fix: mention that the structured status payload includes a timeout/error cause field, or explicitly defer that schema addition if you want the vision doc to stay less specific.

## LOW

- **LOW — The plan's metadata and final verification step use a stale baseline line count for `pipeline.md`.** `docs/vision/research/implementation-plan.md:4`, `docs/vision/research/implementation-plan.md:218`
  The header says the target is 284 lines, and verification item 9 says total lines should increase from current 284. The current file in repo is 628 lines. This does not break the text edits themselves, but it makes the final verification checklist unreliable as written.
  Fix: update the baseline count or remove the line-count assertion and rely on anchor-based verification instead.

## Bottom Line

Most anchors are present and the overall change set is directionally consistent with the design plan. I did not find ordering conflicts across the seven edits. The plan is not ready to apply verbatim yet because one anchor will not match, the timeout edits are under-specified/internally inconsistent, and the merged deterministic-analysis artifact is only half-threaded through the completion path.
