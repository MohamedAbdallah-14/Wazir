# Code Review — Research vs Vision Comparison

Based on 13 research files in `docs/research/code-review/` compared against `docs/vision/pipeline.md`.

---

## Strengths

The vision document gets a lot right about code review. These are the areas where the research directly supports the design decisions.

### 1. Cross-model review is correctly treated as structural, not optional

The vision (Principle 18, Stage 2 of subtask pipeline, Passes 3-4 of final review) mandates cross-model review and cites the 64.5% self-correction blind spot. The `ai-assisted-review.md` research confirms this with the Self-Correction Bench data (arXiv 2507.02778): 64.5% blind spot across 14 models, heterogeneous ensembles achieving ~9% higher accuracy. The vision's multi-pass final review (2 internal + 2 cross-model) is directly grounded.

**Research file**: `ai-assisted-review.md` (Key Finding 4, Pattern 5)
**Vision section**: Principles 18, Stage 2 Review, Passes 3-4 of Final Review

### 2. Fresh context per review is well-justified

The vision's "every agent is born, does one job, and dies" pattern (Principle 4) maps directly to the research on multi-turn degradation. The `academic-papers.md` research (Bacchelli & Bird 2013, Bosu et al. 2015) shows reviewer effectiveness depends on focused context, and `ai-assisted-review.md` confirms that context window pollution degrades review quality. Fresh agents for each review pass avoid the compounding context rot problem.

**Research file**: `academic-papers.md` (Synthesis), `ai-assisted-review.md` (Context Engineering section)
**Vision section**: Architecture — "Agents Are Stateless Workers"

### 3. Review round limits (max 2-3) are empirically correct

The vision caps review at 2 rounds per subtask (citing Yang et al. EMNLP 2025: 75% improvement in rounds 1-2) and 4 final review passes. The `best-practices.md` research (SmartBear/Cisco: 60-minute effectiveness cliff, Dr. Greiler: defect detection drops after 60 min) and `ai-assisted-review.md` (Cursor BugBot's evolution from 8 shallow passes to 1 deep agentic pass) converge on the same conclusion: more passes hit diminishing returns fast.

**Research file**: `best-practices.md` (SmartBear data), `ai-assisted-review.md` (Actionable Insight 5)
**Vision section**: Stage 2 Review, "Why 4 Passes"

### 4. Original user input as ground truth is well-supported

The vision's Principle 16 ("The original user input is the only ground truth") and the review mechanism that always includes original user input mirrors the `academic-papers.md` finding from Bacchelli & Bird (2013): reviews drift from intent through multiple transformations. The 79% multi-agent coordination failure rate (Cemri et al. 2025) cited in the vision further justifies this.

**Research file**: `academic-papers.md` (Expectations, Outcomes, and Challenges)
**Vision section**: Review Mechanism (Generic), Principle 16

### 5. Structured review findings with severity levels

The vision uses CRITICAL/HIGH/MEDIUM/LOW severity for all review findings. The `comment-quality.md` research (Google eng-practices, Conventional Comments standard, Graphite taxonomy) unanimously confirms that labeled severity is essential: "Without explicit labels, authors interpret all comments as mandatory, creating unnecessary friction." The vision's severity system maps cleanly to the P0-P5 priority framework synthesized across 14 sources in `comment-quality.md`.

**Research file**: `comment-quality.md` (Synthesis — "What Makes a Review Comment Useful?")
**Vision section**: Review Mechanism (Generic), Finding Severity tables

### 6. Verification generates proof, not assertions

The vision's Principle 11 and Stage 3 (Verify) correctly separate review (quality judgment) from verification (evidence generation). The `ai-assisted-review.md` research on the "burden of proof" shift (Addy Osmani: "If your pull request doesn't contain evidence that it works, you're not shipping faster") directly supports this. The 93%/58% coverage/mutation gap cited in the vision is a real problem that the verification stage addresses.

**Research file**: `ai-assisted-review.md` (Actionable Insight 16), `performance-review.md` (Synthesis)
**Vision section**: Stage 3 Verify, Principle 11

---

## Weaknesses

These are gaps where the research says something important that the vision misses or contradicts.

### 1. No judge/filter agent in the review pipeline

The single most consistent finding across `ai-assisted-review.md` and `automation-tools.md` is that two-stage review (generate comments, then judge/filter comments) is the "single most important architectural decision" for effective AI review. HubSpot's Sidekick achieved 80% thumbs-up rate and 90% time-to-feedback reduction specifically because of the Judge Agent. Uber's uReview independently converged on the same Generate -> Filter -> Validate -> Deduplicate pipeline.

The vision's review mechanism (Section "Review Mechanism (Generic)") dispatches a review subagent that "produces structured findings" with severity levels. But there is no explicit filtering or quality-gating step between the review agent producing findings and those findings being acted upon. The vision goes straight from "produces structured findings" to "if CRITICAL/HIGH -> fix -> re-review."

**Research file**: `ai-assisted-review.md` (Key Finding 1, Pattern 4), `automation-tools.md` (Key Finding 2)
**Vision says**: Reviewer produces findings -> fix loop
**Research says**: Reviewer produces findings -> judge evaluates each finding for accuracy/actionability -> only validated findings reach fix stage

### 2. No explicit anti-pattern or expertise-catalog structure for reviewers

The `anti-pattern-detection.md` research identifies a three-layer detection architecture (baseline hygiene -> deep analysis -> AI-assisted review) as the emerging consensus, with Fowler/Beck taxonomy as the canonical vocabulary. The `architectural-review.md` research identifies fitness functions and architectural drift detection as critical review capabilities.

The vision mentions "expertise-loaded" reviewers and references `always.reviewer` + `reviewer_modes.task-review` + "stack antipatterns" + "auto modules." But the vision never specifies what these contain or how they are structured. The research provides a concrete taxonomy: Fowler/Beck 22 smells in 5 categories, Mantyla's 7-category grouping, Luzkan's 56+ extended catalog, OWASP security anti-patterns, microservice anti-patterns (58 known), language-specific anti-patterns, and SOLID principle checks.

**Research file**: `anti-pattern-detection.md` (Taxonomies, Three-Layer Architecture), `architectural-review.md` (SOLID, Fitness Functions)
**Vision says**: Reviewers get "stack antipatterns" (unspecified)
**Research says**: A canonical taxonomy exists and should be the foundation of review expertise modules

### 3. No mention of diff-only vs system-aware review distinction

The `diff-analysis.md` research makes a sharp distinction between reviewing the diff (what changed) and reviewing the impact (what the change affects). Meta's Diff Risk Score uses change diffusion (files/modules/subsystems touched) as the strongest predictor of failure. The CHID tool (Springer 2024) combines call-graph dependency analysis with history mining for PR-level risk scoring. Palantir's best practice separates refactoring from behavior changes because mixed diffs are "the hardest to review correctly."

The vision's review stages describe reviewing "output vs acceptance criteria" and "output vs antipatterns" but never mention analyzing the diff structurally: semantic diff analysis, change impact analysis, change diffusion metrics, or separation of refactoring from behavioral changes.

**Research file**: `diff-analysis.md` (Synthesis — all 10 principles), `big-tech-practices.md` (Meta DRS)
**Vision says**: Nothing about diff analysis techniques
**Research says**: Structural diff analysis, change impact analysis, and risk scoring are critical review capabilities

### 4. Performance review is absent

The `performance-review.md` research identifies algorithmic complexity as the single highest-impact review target (64x speedup in JS, 1,864x in Python from replacing O(n^2) with hash map lookups), N+1 queries as the most common database anti-pattern, and resource leak detection as a systematic review discipline with 5 resource types and 12 detection patterns. The research also identifies continuous benchmarking (CodSpeed, Bencher, GitHub Action Benchmark) as a CI/CD integration point.

The vision's review checklists (Phase 4, 6, 8, Stage 2) mention "security/performance" as a checklist item for design review but never elaborate. There is no performance-specific review guidance, no mention of algorithmic complexity review, no N+1 query detection, no resource leak patterns, and no continuous benchmarking integration.

**Research file**: `performance-review.md` (entire file)
**Vision says**: "security/performance" as one bullet in the Phase 6 checklist
**Research says**: Performance review requires its own checklist covering algorithmic complexity, I/O patterns, memory/resource management, and language-specific patterns

### 5. No walkthrough/summary requirement before review findings

The `community-discussions.md` research identifies the "summarize before approving" pattern as "the single most effective technique for improving review quality" (HN thread #4). The `comment-quality.md` research (Gergely Orosz: "better reviews look at the change in context of the larger system") and `ai-assisted-review.md` (recommended approach: AI generates walkthrough summary before listing findings) converge on this.

The vision's review agents produce "structured findings" but are never required to first produce a summary of what they reviewed and how they understand it. A comprehension summary before findings forces the reviewer to demonstrate understanding and surfaces misunderstandings before they become false findings.

**Research file**: `community-discussions.md` (Thread 4), `comment-quality.md` (Source 5), `ai-assisted-review.md` (Pattern 1)
**Vision says**: Review produces findings directly
**Research says**: Review should produce comprehension summary first, then findings

### 6. No feedback loop on review comment quality

Both `big-tech-practices.md` (Google Critique's "Not useful" button, Uber uReview's usefulness ratings at 75%) and `ai-assisted-review.md` (Key Finding 5: 16.6% AI suggestion adoption rate vs 56.5% for humans) demonstrate that measuring which review comments are actually addressed is critical for calibrating review quality over time.

The vision's learning system (Stage 8: Apply Learning) captures "review effectiveness: which pass found what, detection rate per pass" but does not track whether individual review findings were accepted, rejected, or ignored. The difference matters: a review pass that generates 50 findings of which 5 are adopted is worse than a pass that generates 8 findings of which 7 are adopted.

**Research file**: `big-tech-practices.md` (Patterns 7-8), `ai-assisted-review.md` (Key Finding 5)
**Vision says**: Track detection rate per pass
**Research says**: Track adoption rate per finding, not just detection rate per pass

---

## Critical to Edit

These findings must be incorporated. Ignoring them creates design flaws in the review pipeline.

### CRITICAL-1: Add a Judge/Validation stage to the review pipeline

**Research finding**: Two-stage review (generate -> judge) is the single highest-leverage architectural decision for AI code review. HubSpot achieved 80% thumbs-up, 90% time-to-feedback reduction. Uber independently converged on the same pattern. Without it, false positives erode trust: after 3-5 hallucinated findings, developers ignore all AI feedback, including valid catches (`ai-assisted-review.md`, Diffray research: 15-30 min wasted per false positive).

**Why it's critical**: The vision already acknowledges that "self-assessment is untrustworthy" (Principle 13) but applies this only to executor self-reports, not to reviewer output. A review agent's findings are themselves a form of assessment that can be wrong. Without validation, false findings enter the fix loop, wasting executor spawns and potentially introducing regressions. The 64.5% self-correction blind spot applies to reviewers too.

**Suggested edit**: In the "Review Mechanism (Generic)" section (lines 239-256), after step 4 ("Produces structured findings"), add a validation step:

> 4b. **Validate findings** — A fresh validation agent (or deterministic check where possible) cross-references each finding against the actual codebase context. Findings that cannot be substantiated with specific code evidence are downgraded or removed. This is the Judge pattern (HubSpot, Uber): generate comments, then evaluate each for accuracy and actionability before acting on them.

Also update the flow: "If validated CRITICAL/HIGH -> fix -> re-review."

### CRITICAL-2: Require review agents to produce comprehension summary before findings

**Research finding**: The "summarize before approving" pattern forces genuine comprehension and surfaces misunderstandings. Multiple sources converge: HN's most-upvoted review technique, Gergely Orosz's "better reviews" framework, and the empirical finding that AI review comments with code snippets targeting specific hunks are most likely to be adopted (arXiv 2508.18771).

**Why it's critical**: Without a comprehension step, a review agent can pattern-match against antipattern lists without understanding what the code does. This produces findings that are technically plausible but contextually wrong -- the exact failure mode that Platform Toolsmith documented when their AI flagged a "blocker" that a guard clause two files away already handled. The comprehension summary also provides the orchestrator with a lightweight check: if the summary doesn't match what the subtask was supposed to do, the review is already suspect.

**Suggested edit**: In the "Review Mechanism (Generic)" section, add before the findings production step:

> 2b. **Produce comprehension summary** (~100 tokens) — Before generating findings, the review agent writes a brief summary of what the artifact does and how it relates to the original input. This forces comprehension and gives the orchestrator a signal: if the summary doesn't align with the subtask brief, findings from this review are suspect.

### CRITICAL-3: Add change impact analysis to the review toolkit

**Research finding**: Change diffusion (how spread out a change is across the codebase) is the strongest predictor of failure risk (Mockus & Weiss 2000, Meta Diff Risk Score). Cross-file impact analysis identifies code affected by (not just part of) the change. Palantir's critical structural rule: refactoring changes mixed with behavior changes are the #1 source of review errors.

**Why it's critical**: The vision's review stages check "output vs acceptance criteria" and "output vs antipatterns" but never analyze what the change impacts beyond the files it touches. In a multi-subtask parallel execution pipeline, this is especially dangerous: subtask A's change may ripple into areas that subtask B depends on, and the per-subtask review won't see it. The final review's "integration completeness" check (Pass 2) partially addresses this, but it arrives too late -- the fix loop is far more expensive at the final review stage than at the per-subtask stage.

**Suggested edit**: In Stage 2 (Review) of the subtask pipeline (lines 285-293), add to the review passes:

> Review pass also includes: **change impact check** — the reviewer identifies files and modules affected by the change beyond those directly modified, flags any subtask whose acceptance criteria could be invalidated by this change's side effects, and checks that behavior-changing code is not mixed with refactoring in the same subtask.

---

## Nice to Have

These would improve the vision but are not blocking design flaws.

### NICE-1: Structured anti-pattern taxonomy for expertise modules

The `anti-pattern-detection.md` research provides a ready-made taxonomy: Fowler/Beck 22 smells -> Mantyla 7 categories -> Luzkan 56+ extended -> plus OWASP security, microservice anti-patterns (58 known), and language-specific catalogs. The vision references "stack antipatterns" without defining them. Mapping these taxonomies to the `composition-map.yaml` structure would give reviewers concrete detection targets rather than vague guidance.

### NICE-2: Performance review checklist

The `performance-review.md` synthesis provides a ready-made checklist: algorithmic complexity (nested loops, data structure choices), I/O patterns (N+1 queries, sequential async), memory/resources (leak detection for 5 resource types), and language-specific patterns (Python: list comprehension vs append, sets for membership; JS: JSON.parse hoisting, Promise.all). This could be a new expertise module in `composition-map.yaml`.

### NICE-3: Conventional Comments format for review findings

The `comment-quality.md` research highlights the Conventional Comments standard (`<label> [decorations]: <subject>`) as machine-parseable and friction-reducing. Adopting this or a similar structured format for review findings would make the learning system's analysis of review effectiveness more precise and enable automated triage.

### NICE-4: Context enrichment beyond the subtask file

The `ai-assisted-review.md` research (CodeRabbit's 1:1 code-to-context ratio, Platform Toolsmith's agentic file fetching) identifies six context sources that drive review quality: PR/issue linking, code graph analysis, custom instructions, linter output, web queries, and verification scripts. The vision gives reviewers the artifact + checklist + original user input. Adding codebase dependency context (which files import the changed files, what tests cover them) would catch more cross-file issues.

### NICE-5: Architectural fitness functions as review complement

The `architectural-review.md` research identifies ArchUnit-style fitness functions as automated architectural governance that complements review. These are deterministic checks (layer violations, cyclic dependencies, SOLID violations) that run as tests, not as LLM review. The vision's verification stage (Stage 3) could incorporate fitness function results as evidence, further strengthening the proof-based verification approach.

### NICE-6: Few-shot examples over persona prompting for review agents

The `prompt-engineering-for-review.md` research (Pornprasit & Tantithamthavorn 2024) found that persona prompting ("act as a senior developer") does NOT help for code review and can hurt performance. Few-shot learning (46-659% improvement over zero-shot) is the single most impactful prompting technique. The vision's composer (lines 109-127) mentions "operational identity, not expert persona" which partially aligns, but the expertise modules should prioritize concrete review examples over role descriptions.

---

## Improvements

Concrete changes to the vision document, ordered by importance.

### Improvement 1: Add Judge/Validation step to Review Mechanism

**Section**: Review Mechanism (Generic), between steps 4 and 5 (lines 244-248)
**What to add**: A validation sub-step after findings production where a fresh agent (or deterministic check) cross-references each finding against actual codebase context. Findings without code-level evidence are downgraded or removed.
**Why** (citing research): `ai-assisted-review.md` Key Finding 1 (HubSpot 80% thumbs-up), `automation-tools.md` Key Finding 2 (Uber/HubSpot independent convergence on Generate -> Filter -> Validate -> Deduplicate). Without this, false positives waste fix executor spawns and erode trust.

### Improvement 2: Add comprehension summary requirement to review agents

**Section**: Review Mechanism (Generic), between steps 2 and 3 (lines 242-244)
**What to add**: Before producing findings, the review agent writes a ~100-token comprehension summary of what the artifact does. The orchestrator can use this as a lightweight sanity check.
**Why** (citing research): `community-discussions.md` Thread 4 ("summarize before approving" = most effective review technique), `ai-assisted-review.md` Pattern 1 (walkthrough summary before findings). Forces genuine comprehension, surfaces contextual misunderstandings before they become false findings.

### Improvement 3: Add change impact analysis to per-subtask review

**Section**: Stage 2 Review in the subtask pipeline (lines 285-293)
**What to add**: A review dimension for change impact: which files/modules beyond the direct diff are affected, whether behavior changes are mixed with refactoring, and whether side effects could invalidate other subtasks' acceptance criteria.
**Why** (citing research): `diff-analysis.md` (Mockus & Weiss: change diffusion = strongest risk predictor, Meta DRS, Palantir: mixed diffs = #1 review error source). Especially important in parallel execution where subtask A's changes can ripple into subtask B's territory.

### Improvement 4: Add performance review to expertise modules

**Section**: New entry in the "Design Decisions" table or as a note near the Composer section (lines 109-127)
**What to add**: Reference a performance review expertise module covering: algorithmic complexity (O(n^2) detection), I/O anti-patterns (N+1 queries, sequential async), resource leak patterns (5 resource types), and language-specific performance patterns.
**Why** (citing research): `performance-review.md` (Jin et al. PLDI 2012: performance bugs take 2x longer to fix, the ratio increases over time; StackInsight: 64-1864x speedup from single algorithmic fix). Performance is currently a single bullet point in one checklist; the research shows it deserves its own expertise module.

### Improvement 5: Track finding adoption rate in the learning system

**Section**: Stage 8 Apply Learning (lines 482-505), specifically the "Review effectiveness" item
**What to change**: Expand "which pass found what, detection rate per pass" to also track "finding adoption rate: proportion of findings that led to actual code changes per pass, per severity, per review dimension."
**Why** (citing research): `big-tech-practices.md` (Google "Not useful" button, Uber 75% usefulness rating, Meta Eyeball Time as guardrail), `ai-assisted-review.md` Key Finding 5 (16.6% AI adoption vs 56.5% human). Detection rate alone is a vanity metric. A pass that generates 50 findings with 10% adoption is worse than one generating 8 findings with 87% adoption.

### Improvement 6: Specify that few-shot examples should dominate expertise modules for review

**Section**: The Composer section (lines 109-127), specifically prompt assembly rules
**What to add**: A note that review expertise modules should prioritize concrete few-shot examples (input code + expected findings) over role descriptions or persona prompts. "Operational identity" is already specified; this sharpens it for review-specific modules.
**Why** (citing research): `prompt-engineering-for-review.md` (Pornprasit & Tantithamthavorn 2024: persona prompting hurts code review, few-shot achieves 46-659% improvement over zero-shot), `ai-assisted-review.md` Actionable Insight 12 (few-shot = single most impactful technique). The vision's existing stance against "expert persona" is correct but should be made more explicit for review roles.
