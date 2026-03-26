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

Full verification suite on merged main. Two sources of verification criteria:

1. **Plan-defined integration criteria**: run the exact commands specified in `plan/plan.md` under "Integration verification criteria." These are the commands the planner defined for post-merge validation — they are the plan's contract with the completion pipeline.
2. **Standard suite**: test suite, type checking, lint, build, and full deterministic analysis scan producing merged `analysis-findings.json` (catches cross-subtask issues invisible per-subtask).

**Side effects verification**: check all declared external side effects (from subtask specs) were completed or properly compensated. Any undeclared side effects discovered at this stage are CRITICAL findings — they represent work the pipeline cannot track or roll back.

If integration fails: identify culprit through the sequential merge record (re-run checks after each individual merge to isolate). Targeted fix executor receives failing output + acceptance criteria + merged code.

## Stage 2: Concern Resolution

A fresh agent — one that did NOT produce any of the artifacts being evaluated — reads three input sources:

1. **Concern registry**: all DONE_WITH_CONCERNS entries from execution.
2. **Residuals**: all `residuals-<subtask-id>.md` files from execution. Each residual is a finding that exhausted the 7-spawn subtask loop without resolution. CRITICAL residuals already triggered Level 2 escalation during execution; non-critical residuals arriving here need evaluation.
3. **Batch-boundary disposition**: execution checks concerns at batch boundaries. This stage evaluates: (a) concerns accumulated since the last batch check, (b) concerns from the final batch (no boundary check occurred), (c) all residuals, (d) cross-subtask systemic patterns.

For each concern and residual, four questions:

1. Is the concern still valid? (Some become moot after later subtasks.)
2. Was the resolution acceptable? (Full implementation may change the picture.)
3. Does it map to a spec requirement? (If yes, it cannot be dismissed as a trade-off.)
4. Is it systemic? (3+ occurrences across subtasks = planning gap.)

**Principle: concerns are innocent until proven acceptable.** The burden of proof is on the resolution.

**Sycophancy guard**: the generating agent MUST NOT rebut or respond to reviewer concerns during this stage. Research: models abandon correct answers 98% of the time when challenged (overconfidence.md, Claude 1.3 study). If a concern is contested, route to human — not to agent debate. Concern resolution is evaluation, not negotiation.

## Stages 3-6: The Final Review (The Boss Fight)

The hardest review in the pipeline. Not another code review — a **compliance audit with fix authority**.

**2 passes + conditional 3rd. No shortcuts.**

### Inputs

**Pass 1 (Internal) receives all inputs**:
- Merged implementation on main
- `plan/plan.md` (approved plan)
- `spec.md` (approved specification)
- Original user input (ground truth)
- Concern resolution output from Stage 2 (including residuals disposition)
- All `proof.json` files (verification evidence)
- Integration test results from Stage 1
- All per-subtask `analysis-findings.json` files (deterministic analysis evidence from execution)
- Merged `analysis-findings.json` from Integration Verification (deterministic analysis on combined main)

**Pass 2 (Cross-Model) receives deterministic inputs only**:
- Merged implementation on main
- `plan/plan.md` (approved plan)
- `spec.md` (approved specification)
- Original user input (ground truth)
- All `proof.json` files (verification evidence)
- Integration test results from Stage 1
- All `analysis-findings.json` files (deterministic analysis — both per-subtask and merged)
- Concern resolution output from Stage 2

Pass 2 does NOT receive Pass 1's LLM-generated findings. Deterministic findings (static analysis, test results) reduce hallucinations 60-80% (Diffray). Prior LLM opinions cause self-conditioning — prior errors in context cause more errors (planning-vs-execution.md). The distinction: facts help, opinions contaminate.

### Finding Severity (Final Review Specific)

| Severity | Meaning | Response |
|----------|---------|----------|
| CRITICAL | Implementation contradicts spec or original input | Targeted fix or escalate to user |
| HIGH | Significant drift or integration gap | Targeted fix |
| MEDIUM | Minor drift or quality gap | Document, fix if cheap |
| LOW | Style or convention divergence | Document for learning |

### Pass 1: Internal Review (Expertise-Loaded)

Composer-built prompt with `always.reviewer` + `reviewer_modes.final` + stack antipatterns + auto modules.

**Dual comparison**:
1. **Implementation vs Plan** (bidirectional): does each plan item have a corresponding implementation? Are there files the plan didn't mention? Plan items with no code? Code that no plan item requested?
2. **Implementation vs Original Input**: the telephone game check. Would the user recognize this as what they asked for? Drift measured from the source across all transformations.

**Three additional dimensions**:
3. **Concern & residual resolutions**: re-examine every resolution from Stage 2. Were trade-offs genuinely acceptable, or dismissed too quickly?
4. **Verification evidence quality**: are tests meaningful or tautological? Is every acceptance criterion covered by proof?
5. **Integration completeness**: do cross-subtask interfaces match? Does data flow correctly between modules from different agents?

### Targeted Fixes (Between Passes 1 and 2)

- CRITICAL/HIGH code issues → fix executor batched by severity tier (all CRITICAL findings to one executor, all HIGH to another). Each executor receives all findings of its tier + relevant files + violated criteria. Batching prevents the "Death of a Thousand Round Trips" anti-pattern — drip-feeding one issue at a time is the worst review pattern (Tatham).
- CRITICAL/HIGH drift → escalate to user (pipeline can't decide user intent)
- MEDIUM → fix if ≤10 lines, otherwise document
- LOW → document only (regression risk exceeds value)

After fixes: commit, re-run integration verification (Stage 1 commands). Fixed state becomes input for Pass 2.

### Pass 2: Cross-Model Review (Fresh Session, Different Family)

Different model family from Pass 1. Selection priority:
1. Different vendor, highest tier (maximizes blind spot diversity)
2. Same vendor, different generation
3. Same vendor, same tier (last resort — still a fresh context)

Independent review. Same dual comparison (implementation vs plan vs original input). Also reviews concern resolutions and verification evidence independently.

If Codex/Gemini CLI is the cross-model tool: invoked via Bash in a fresh subagent session. Falls back to same-model fresh-context review if external tools are unavailable.

### Pass 3: Reconciliation (Conditional)

Runs ONLY if Passes 1 and 2 have conflicting CRITICAL or HIGH findings — where one pass flagged an issue the other did not, or they disagree on severity/resolution.

A fresh agent reads both pass outputs and reconciles:
- **Both found it** → confirmed finding
- **Only one found it** → evaluate with code evidence. If substantiated by code, confirmed. If not, downgrade or remove.
- **Conflicting assessments** → escalate to user with both rationales

If Passes 1 and 2 agree (no conflicting CRITICAL/HIGH): skip Pass 3, merge findings with deduplication.

### Exit Criteria

**Precedence rule**: a single unresolved CRITICAL finding prevents SHIP regardless of any other signal. Blocking findings take precedence over score thresholds. When signals disagree, blocking findings win.

- All CRITICAL findings resolved (including CRITICAL residuals from execution)
- All HIGH findings resolved or explicitly accepted by user
- MEDIUM/LOW documented in learning system
- Every spec requirement has implementation evidence
- No undetected drift (or drift explicitly approved)
- Cross-model reviewer has no unresolved CRITICAL/HIGH
- Sign-off is SHIP or SHIP WITH CAVEATS / DO NOT SHIP

If not met after Pass 3 (or Pass 2 when Pass 3 is skipped): escalate to user with full finding history.

### Why 2+1 Passes

Rounds 1-2 capture 75% of improvement (Yang et al. EMNLP 2025). Reviewer count converges to 2 across all studied organizations (Rigby & Bird ESEC/FSE 2013). Sequential passes compound failure probability — 4 passes at 95%/step = 81.5% overall pipeline success. The execution pipeline already runs cross-model review (Codex-Reviewer/Verifier) on every subtask, so the 64.5% blind spot is addressed before completion begins. Pass 3 (reconciliation) adds value only when passes disagree — making it conditional avoids wasted tokens on runs where passes 1-2 converge. If 2-3 passes can't resolve findings, the problem is upstream (spec, design, plan), not review thoroughness.

## Stage 7: Apply Learning

A dedicated learning agent with fresh context reads all signals from the run:

- Per-subtask findings.md and proof.json
- Final review reports (all passes)
- Concern registry, resolutions, and residuals disposition
- Retry evidence (which subtasks, which tier, why)
- Model performance data (success/failure per tier per complexity)
- Timing data (bottlenecks)
- Merge issues (conflicts despite planning)
- **User corrections** (approvals, rejections, redirects, scope changes captured during the run). User corrections are the highest-priority learning signal — they represent direct evidence of where the pipeline's autonomous decisions diverged from what the user wanted. A user rejection during clarification is stronger signal than 10 reviewer findings.

**What it does**:
1. **Pattern extraction**: findings in 3+ subtasks = systematic expertise gap
2. **Planning gap analysis**: subtasks needing replanning = decomposition weakness
3. **Model tier calibration**: empirical data → update tier mapping config
4. **Review effectiveness**: which pass found what, detection rate per pass
5. **Finding adoption rate**: proportion of findings that led to actual code changes, per pass, per severity, per source (internal/Codex/Gemini). Detection rate alone is a vanity metric — a pass generating 50 findings with 10% adoption is worse than 8 findings with 87% adoption. Research basis: Uber uReview tracks 65% addressal rate as its success metric; Google Critique's "Not useful" button creates the feedback loop that drives improvement.
6. **Quality delta**: per-dimension scores at first review pass vs final state. Dimensions that consistently improve 5+ points during review indicate executor weaknesses in those areas — feed into expertise module proposals targeting those dimensions.
7. **Expertise proposals**: concrete updates to antipatterns, composition-map, quality modules, plan checklists

**Impact scoring** per proposal:
- **HIGH**: 3+ subtasks or Tier 1+ escalation. Systematic gap.
- **MEDIUM**: 1-2 subtasks, stage-level fix loops. Single improvement.
- **LOW**: Style, convention, marginal optimization.

### Learning Lifecycle

Findings progress through a staged lifecycle. Each stage has a gate — no finding becomes active expertise without human approval.

1. **TALLY** (automatic): every finding is canonicalized and clustered by pattern. Tallying happens at finding persistence time, not as a separate pass. Identical patterns across runs accumulate into a single cluster.
2. **CANDIDATE** (automatic): clusters exceeding occurrence and distinct-run thresholds are promoted to candidates. Candidates have a TTL — unreviewed candidates expire and reset to TALLY. This prevents stale accumulation.
3. **PROMOTE** (human gate): candidates are presented to the user for review. The user accepts, rejects, or defers. Rejection resets the cluster to TALLY. A cap on total active learnings prevents expertise bloat — when the cap is reached, no new candidates are created until existing learnings are retired.
4. **ACTIVE** (post-acceptance): accepted learnings are injected into reviewer/executor context via the Composer's expertise resolution. Active learnings with low hit rates (finding recurrence drops below threshold after activation) are demoted back to TALLY.

Specific thresholds (occurrence count, distinct-run count, cap size, TTL duration, hit-rate threshold) are implementation configuration, not vision constants. The lifecycle structure and the human gate between CANDIDATE and ACTIVE are the design invariants.

The learning agent proposes. It does NOT auto-apply. The human reviews. This is the flywheel: execution → evidence → expertise → better execution.

**Acknowledged gap**: the learning system proposes but doesn't measure whether applied learnings improved the next run. Future enhancement: tag applied proposals with run ID, compare finding rates on the next run. If rate decreased, learning was effective. This closes the loop.

## Stage 8: Prepare Next Session

### Mode 1: Run Complete

Produces `execution-summary.md`:
- What was built (linked to spec requirements, status per requirement)
- Verification summary (tests, coverage, pass/fail)
- Concerns and resolutions (final disposition)
- Final review findings and resolution (per pass, with adoption rates)
- Residuals from execution and their final disposition
- Learning proposals (count by impact, pointer to full file)
- Quality delta (per-dimension first-pass vs final-state scores)
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

### Reasoning Capture

Every completion stage produces reasoning at two layers, consistent with the pre-execution pipeline's reasoning capture pattern:

**Conversation layer**: before each stage, state the trigger and what it checks. After each stage, state what was found and the counterfactual — what would have shipped without this stage.

**File layer**: structured entries written to `reasoning/phase-completion-reasoning.md` per decision:
- **Trigger** — what prompted the decision (e.g., "Pass 1 found 3 CRITICAL drift findings")
- **Options considered** — alternatives evaluated (e.g., "fix vs escalate to user")
- **Chosen** — selected option
- **Reasoning** — why
- **Confidence** — high/medium/low
- **Counterfactual** — what would go wrong without this (e.g., "auth middleware would ship unwired to 3 routes")

Key completion reasoning moments: severity assignments, SHIP/DO NOT SHIP decisions, concern resolution dispositions, reconciliation verdicts, and learning proposal priorities.

### User Interaction During Completion

Autonomous with two exceptions:
1. **Drift escalation**: implementation doesn't match what user asked for
2. **Unresolvable concern**: requires spec/design change

Pipeline pauses, presents evidence, waits. User's decision is final.
