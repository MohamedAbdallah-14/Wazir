# Part III: Completion Pipeline

> Parent document: `docs/vision/pipeline.md`

Execution produces code. Completion produces confidence.

### Why Completion Is Separate

Per-subtask reviews answer: "does this subtask meet its acceptance criteria?" They cannot answer: "does the combined implementation match what the user originally asked for?" That requires seeing all subtasks together, on merged main, with the original input in hand.

- **Drift compounds invisibly.** 5+ transformations, each locally correct, can be globally wrong.
- **Per-subtask reviews have structural blind spots.** Cross-subtask interaction bugs are invisible until assembly.
- **Concerns accumulate without resolution pressure.** Without a dedicated step, trade-offs never get evaluated.
- **Learning without collection is amnesia.** The next run repeats the same mistakes.

## Stage 1: Integration Verification

Full verification suite on merged main: test suite, type checking, lint, build, and full deterministic analysis scan producing merged `analysis-findings.json` (catches cross-subtask issues invisible per-subtask).

If integration fails: identify culprit through the sequential merge record (re-run checks after each individual merge to isolate). Targeted fix executor receives failing output + acceptance criteria + merged code.

## Stage 2: Concern Resolution

A fresh agent reads the full concern registry and evaluates each:

1. Is the concern still valid? (Some become moot after later subtasks.)
2. Was the resolution acceptable? (Full implementation may change the picture.)
3. Does it map to a spec requirement? (If yes, it cannot be dismissed as a trade-off.)
4. Is it systemic? (3+ occurrences = planning gap.)

**Principle: concerns are innocent until proven acceptable.** The burden of proof is on the resolution.

## Stages 3-7: The Final Review (The Boss Fight)

The hardest review in the pipeline. Not another code review — a **compliance audit with fix authority**.

**4 passes. No shortcuts.**

### Inputs (read from disk by each reviewer)

- Merged implementation on main
- `plan/plan.md` (approved plan)
- `spec.md` (approved specification)
- Original user input (ground truth)
- `concern-registry.md` (concerns and resolutions)
- All `proof.json` files (verification evidence)
- Integration test results
- All per-subtask `analysis-findings.json` files (deterministic analysis evidence from execution)
- Merged `analysis-findings.json` from Integration Verification (deterministic analysis on combined main)

### Finding Severity (Final Review Specific)

| Severity | Meaning | Response |
|----------|---------|----------|
| CRITICAL | Implementation contradicts spec or original input | Targeted fix or escalate to user |
| HIGH | Significant drift or integration gap | Targeted fix |
| MEDIUM | Minor drift or quality gap | Document, fix if cheap |
| LOW | Style or convention divergence | Document for learning |

### Pass 1: Drift Detection (Internal Reviewer — Expertise-Loaded)

Loaded with `always.reviewer` + `reviewer_modes.final` + stack antipatterns + auto modules.

**Dual comparison**:
1. **Implementation vs Plan**: does each plan item have a corresponding implementation? Are there files the plan didn't mention? Plan items with no code?
2. **Implementation vs Original Input**: the telephone game check. Would the user recognize this as what they asked for? Five transformations of drift measured from the source.

### Pass 2: Concern & Evidence Audit (Internal Reviewer — Expertise-Loaded)

Same expertise loading. Three dimensions:

1. **Concern resolutions**: re-examine every resolution. Were trade-offs genuinely acceptable, or dismissed too quickly?
2. **Verification evidence quality**: are tests meaningful or tautological? Is every acceptance criterion covered by proof?
3. **Integration completeness**: do cross-subtask interfaces match? Does data flow correctly between modules from different agents?

### Targeted Fixes (Between Internal and Cross-Model Passes)

- CRITICAL/HIGH code issues → scoped fix executor (one finding, relevant files, violated criterion)
- CRITICAL/HIGH drift → escalate to user (pipeline can't decide user intent)
- MEDIUM → fix if ≤10 lines, otherwise document
- LOW → document only (regression risk exceeds value)

Fix executors are scoped. They receive one finding, not the entire review report. Prevents fix pollution.

After fixes: commit, re-run integration verification. Fixed state becomes input for Pass 3.

### Pass 3: Cross-Model Independent Review (Highest Available)

Different model family from Passes 1-2. Selection priority:
1. Different vendor, highest tier (maximizes blind spot diversity)
2. Same vendor, different generation
3. Same vendor, same tier (last resort — still a fresh context)

Does NOT know what Pass 1-2 found. Approaches independently. Same dual comparison (implementation vs plan vs original input). Also reviews concern resolutions and verification evidence that Pass 2 approved.

### Pass 4: Cross-Model Final Verification (Highest Available)

Same model family as Pass 3, fresh context.

1. Verify fixes from Pass 3 findings
2. Confirm all CRITICAL/HIGH across ALL passes resolved
3. Cross-check: no fix introduced a regression
4. Produce final sign-off: SHIP / SHIP WITH CAVEATS / DO NOT SHIP

### Exit Criteria

- All CRITICAL findings resolved
- All HIGH findings resolved or explicitly accepted by user
- MEDIUM/LOW documented in learning system
- Every spec requirement has implementation evidence
- No undetected drift (or drift explicitly approved)
- Cross-model reviewer has no unresolved CRITICAL/HIGH
- Sign-off is SHIP or SHIP WITH CAVEATS

If not met after Pass 4: escalate to user with full finding history.

### Why 4 Passes

Rounds 1-2 capture 75% of improvement (Yang et al.). Cross-model rounds 3-4 catch model-specific blind spots. Beyond 4, diminishing returns dominate. If 4 passes can't resolve findings, the problem is upstream (spec, design, plan), not review thoroughness. Two model families capture nearly all diversity benefit (<2% gain from a third).

## Stage 8: Apply Learning

A dedicated learning agent with fresh context reads all signals from the run:

- Per-subtask findings.md and proof.json
- Final review reports (all 4 passes)
- Concern registry and resolutions
- Retry evidence (which subtasks, which tier, why)
- Model performance data (success/failure per tier per complexity)
- Timing data (bottlenecks)
- Merge issues (conflicts despite planning)

**What it does**:
1. **Pattern extraction**: findings in 3+ subtasks = systematic expertise gap
2. **Planning gap analysis**: subtasks needing replanning = decomposition weakness
3. **Model tier calibration**: empirical data → update tier mapping config
4. **Review effectiveness**: which pass found what, detection rate per pass
5. **Expertise proposals**: concrete updates to antipatterns, composition-map, quality modules, plan checklists

**Impact scoring** per proposal:
- **HIGH**: 3+ subtasks or Tier 2+ escalation. Systematic gap.
- **MEDIUM**: 1-2 subtasks, stage-level fix loops. Single improvement.
- **LOW**: Style, convention, marginal optimization.

The learning agent proposes. It does NOT auto-apply. The human reviews. This is the flywheel: execution → evidence → expertise → better execution.

**Acknowledged gap**: the learning system proposes but doesn't measure whether applied learnings improved the next run. Future enhancement: tag applied proposals with run ID, compare finding rates on the next run. If rate decreased, learning was effective. This closes the loop.

## Stage 9: Prepare Next Session

### Mode 1: Run Complete

Produces `execution-summary.md`:
- What was built (linked to spec requirements, status per requirement)
- Verification summary (tests, coverage, pass/fail)
- Concerns and resolutions (final disposition)
- Final review findings and resolution
- Learning proposals (count by impact, pointer to full file)
- Cost and timing data
- Recommendation: SHIP / SHIP WITH CAVEATS / DO NOT SHIP

One document answering: what did you build, does it work, what should I know?

### Mode 2: Run Incomplete

Produces `handover-batch-N.md`:
- Completed/in-progress/remaining subtask IDs with status and lifecycle state
- Accumulated concerns from DONE_WITH_CONCERNS subtasks pending resolution
- Blocked subtasks with reasons and current lifecycle state (`abandoned`, `upstream_failed`, `waiting_on_user`)
- Partial learnings discovered during this batch
- Environment state (active branches, worktrees, provisioned runtime isolation)
- Resume prompt (~500 tokens, self-contained, references files for depth)

### User Interaction During Completion

Autonomous with two exceptions:
1. **Drift escalation**: implementation doesn't match what user asked for
2. **Unresolvable concern**: requires spec/design change

Pipeline pauses, presents evidence, waits. User's decision is final.
