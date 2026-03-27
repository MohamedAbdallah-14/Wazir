# Content and Data Seeding — Research vs Vision Comparison

## Scope

10 research files in `docs/research/content-and-data-seeding/`:
- `devtools-content.md` — Developer tool marketing and content strategies
- `few-shot-curation.md` — Few-shot example selection, ordering, and curation
- `knowledge-base-bootstrapping.md` — Cold start solutions, KB bootstrapping patterns
- `seeding-strategies.md` — Synthetic data generation, data seeding for AI systems
- `golden-datasets.md` — Evaluation dataset creation and golden dataset design
- `data-flywheel.md` — Data flywheel patterns in AI products
- `prompt-templates.md` — Prompt template libraries and management systems
- `curriculum-learning.md` — Curriculum learning and data ordering strategies
- `synthetic-data.md` — Synthetic code generation for training and evaluation
- `rule-engines.md` — Rule engine design and seed rules for code analysis

Compared against: `docs/vision/pipeline.md` (locked 2026-03-25)

---

## Strengths

### 1. The Expertise Module Architecture Correctly Implements Seed Content Principles

The vision's Composer system (`composition-map.yaml`, expertise modules, layered lookup) is a direct and correct implementation of what the research calls "structure-before-content" (knowledge-base-bootstrapping.md, Principle 4) and "seed content as context" (prompt-templates.md, Section 10.4). The vision correctly separates template structure (the Composer's prompt assembly) from seed content (expertise modules), exactly as Anthropic's context engineering recommends: "templates define behavior, seed content provides grounding."

**Research citation**: prompt-templates.md Section 10.4 — "Seed content is the 'context' section of a prompt template — the domain-specific knowledge, examples, and reference material that grounds the model's response."

**Vision citation**: Pipeline.md, The Composer — "Expertise modules ARE the domain knowledge — Wazir's moat."

### 2. The Learning System Implements the Data Flywheel Core Loop

The vision's Stage 8 (Apply Learning) is a correct implementation of the data flywheel's four-stage pattern: Collect (per-subtask findings, review reports), Learn (pattern extraction, gap analysis), Improve (expertise proposals), Grow (next run benefits). The vision correctly makes learning propose-only with human-in-the-loop approval, matching the research finding that data flywheels require human oversight to avoid model collapse (data-flywheel.md, Section 10; seeding-strategies.md, Section 8 on model collapse).

**Research citation**: data-flywheel.md, Section 11 Synthesis — "The Universal Data Flywheel Framework" four-stage pattern.

**Vision citation**: Pipeline.md, Stage 8 — "The learning agent proposes. It does NOT auto-apply. The human reviews. This is the flywheel."

### 3. Context Budgeting Aligns With Research on Prompt Template Design

The vision's ~150-200 instruction budget, critical instructions at START and END, and per-subtask context budgets (READ FULL, READ SECTION, KNOW EXISTS) correctly implement what the prompt-templates.md research identifies as context engineering best practice. Anthropic's own guidance: "keep each layer small and on-purpose — only include what helps the current request."

**Research citation**: prompt-templates.md, Section 10.5 — "Good context engineering = smallest possible set of high-signal tokens."

**Vision citation**: Pipeline.md, Prompt Assembly Rules — context budgeting with line counts and ranges.

### 4. Review Expertise Loading Matches the Review-Type Specialization Pattern

The vision loads reviewers with role-specific expertise (`always.reviewer` + `reviewer_modes.task-review` + stack antipatterns + auto modules). This matches the research finding that separate, focused prompts per review dimension outperform monolithic prompts.

**Research citation**: prompt-templates.md, Section 7.1 — Five review dimensions (bug detection, security, performance, maintainability, edge cases) as separate prompt templates. Awesome Reviewers (8,000+ specialized review prompts distilled from real PR comments).

**Vision citation**: Pipeline.md, Stage 2: Review — expertise-loaded reviewer with role + mode + stack antipatterns.

### 5. Constrained Decoding Correctly Enforces Structural Quality

The vision mandates constrained decoding for all structured output (status.json, etc.), citing 100% compliance vs 40-74.5% without. The golden-datasets.md research confirms this matters: "every public structured output benchmark examined was full of erroneous ground-truth outputs" (Cleanlab finding). Structural compliance is non-negotiable for pipeline integrity.

### 6. The Incremental Rule Introduction Pattern Is Implicitly Correct

The vision's approach of having the learning system propose expertise updates that humans review before applying matches the rule-engines.md research on incremental rollout: warning-only first, then enforcement. Notion's ratcheting system and Semgrep's 4-step rollout both validate this pattern.

---

## Weaknesses

### 1. No Few-Shot Example Strategy for Expertise Modules

The vision describes expertise modules as "the domain knowledge" but never specifies whether they contain few-shot examples, and if so, how those examples are selected, ordered, or maintained. The few-shot-curation.md research is unambiguous: selection quality matters more than quantity (LangChain: 16% to 52% accuracy with just 3 semantically similar examples vs zero-shot). The ordering of examples within a prompt has massive impact — reordering can swing accuracy from near-SOTA to near-random (Zhao et al. 2021, Lu et al. 2022).

**What the research says**: few-shot-curation.md, Section 9 — "2-5 examples is the sweet spot. Dynamic > Static. Ordering matters. Negative examples are underused and powerful."

**What the vision says**: Nothing. Expertise modules are mentioned as containing antipatterns and quality standards, but the document never addresses whether examples are included, how many, how they're selected per-query, or how they're ordered within the prompt.

### 2. No Golden Dataset or Evaluation Strategy

The vision describes verification (Stage 3: Verify) and the learning system but has no concept of a golden dataset for evaluating pipeline quality itself. The golden-datasets.md research is clear: you need a curated evaluation set to measure whether the pipeline is actually improving. Without it, the learning system is flying blind — it proposes expertise updates but has no ground truth to measure whether those updates helped.

**What the research says**: golden-datasets.md — Anthropic: "20-50 simple tasks drawn from real failures is a strong starting point." Booking.com: start with ~50 samples, scale to 500-1000 for judge calibration.

**What the vision says**: The vision has no evaluation dataset, no benchmark tasks, no ground truth for pipeline quality measurement. The learning system acknowledges this gap: "the learning system proposes but doesn't measure whether applied learnings improved the next run."

### 3. No Synthetic Data Strategy for Testing or Training

The synthetic-data.md and seeding-strategies.md research cover synthetic bug generation (SWE-Synth: outperforms real-world datasets by 2.3%), synthetic vulnerability generation (HexaCoder: 85% reduction in vulnerable code), and synthetic code review data. The vision has no strategy for generating synthetic test cases to stress-test the pipeline, train review models, or bootstrap expertise modules.

**What the research says**: synthetic-data.md — "For a code review system like Wazir, synthetic data generation could be applied to: training review models, testing review pipelines, security review training, evaluation dataset construction, distillation for cost."

**What the vision says**: Nothing about synthetic data.

### 4. No Curriculum/Ordering Strategy for Expertise Content

The curriculum-learning.md research demonstrates that ordering of content presented to models matters significantly. Intermediate-difficulty examples maximize learning (PCL: 12.1x faster convergence). The vision's expertise modules are loaded via a composition map but the document never addresses how content within those modules is ordered or difficulty-graded.

**What the research says**: curriculum-learning.md, Key Principle 4 — "The Optimal Difficulty Level: intermediate difficulty is optimal. Prompts with ~50% success probability maximize gradient signal."

**What the vision says**: Expertise modules are resolved via layered lookup (`always`, `auto`, `stacks`, `concerns`) but no ordering principle is defined for content within modules.

### 5. No Prompt Versioning or A/B Testing Strategy

The prompt-templates.md research covers an entire ecosystem of prompt versioning, A/B testing, and evaluation-gated deployment. The vision treats expertise modules as static files versioned in git. There's no mechanism to A/B test prompt changes, measure regression, or gate deployment of new expertise content.

**What the research says**: prompt-templates.md — Braintrust: "Prompt versions failing staging evaluation cannot be auto-promoted to production." Promptfoo/DeepEval for CI/CD integration.

**What the vision says**: The learning system proposes updates, humans review, but there's no evaluation gate, no regression testing against a baseline, no A/B comparison mechanism.

### 6. No Cold Start Strategy for New Stacks/Domains

The knowledge-base-bootstrapping.md research identifies the cold start problem as fundamental: every successful knowledge base starts with a minimal but high-quality seed. The vision assumes expertise modules exist but never addresses how to bootstrap expertise for a stack/domain Wazir hasn't seen before.

**What the research says**: knowledge-base-bootstrapping.md, Principle 1 — "The Atomic Seed Principle: the seed must be small, high-quality, and representative of the desired end state."

**What the vision says**: The Composer resolves expertise via `stacks.<detected-stack>.<role>`, but what happens when the detected stack has no modules? The vision is silent.

### 7. No Rule Engine Design for Deterministic Checks

The rule-engines.md research covers how linting tools seed default rule sets, rule writing patterns (Semgrep YAML, ESLint AST visitors, CodeQL QL), and the emerging hybrid model (rules + AI). The vision relies entirely on LLM-based review with expertise loading. There's no deterministic rule layer for the known-pattern checks where rules are strictly superior to LLMs (SQL injection, secrets exposure, type errors).

**What the research says**: rule-engines.md — Semgrep Multimodal: "combines rule-based SAST with LLM reasoning — 8x more true positives, 50% less noise vs. foundation models alone." Static analysis tools average precision 0.7, recall 0.527. Hybrid pipeline recommended.

**What the vision says**: Reviewers are LLM agents loaded with expertise modules containing antipatterns. No deterministic rule layer.

---

## Critical to Edit

### C1. Add Few-Shot Example Strategy to the Composer Section

**Research finding**: Few-shot example selection quality matters more than quantity. Dynamic selection (semantic similarity retrieval) with 3 examples outperforms 13 static examples (LangChain). Ordering matters catastrophically (Zhao et al. 2021). Negative examples are powerful for boundary detection. Code tasks specifically benefit from difficulty-based selection (CodeExemplar, CEDAR: 333% improvement).

**Why it's critical**: The Composer assembles agent prompts from expertise modules, but without specifying how examples within those modules are selected and ordered, different runs will get inconsistent quality. The research shows this can swing accuracy from SOTA to random chance. This is not a nice-to-have — it's a load-bearing design decision that the vision currently leaves undefined.

**Suggested edit**: Add a subsection to "The Composer" section:

> **Example Selection Within Expertise Modules**
>
> Expertise modules contain both instructional content (rules, antipatterns, guidelines) and examples (positive and negative demonstrations). Example handling follows research-mandated principles:
>
> 1. **3-5 examples per module** — diminishing returns beyond this (Brown et al. 2020, Libretto benchmark). Exception: specialized security/style modules may carry up to 10 covering distinct edge cases.
> 2. **Dynamic selection when the example pool exceeds 5** — embed examples in a vector store, retrieve the k most semantically similar to the current subtask. 3 dynamically selected examples outperform 13 static (LangChain finding).
> 3. **Ordering: common cases first, strongest/edge-case example last** — the final example has outsized influence due to recency bias (Lu et al. 2022, Zhao et al. 2021).
> 4. **At least 1 negative example per review module** — "don't do this, do this instead" examples dramatically improve boundary detection (Prompting Weekly).
> 5. **Consistent formatting across all examples** — inconsistent formatting degrades pattern recognition. Treat examples like unit tests.

### C2. Add Golden Dataset / Pipeline Evaluation Strategy to Completion Pipeline

**Research finding**: Without a golden evaluation dataset, you cannot measure whether the pipeline is improving. Anthropic recommends 20-50 tasks from real failures as a starting point. The learning system's acknowledged gap ("doesn't measure whether applied learnings improved the next run") is a design flaw without this.

**Why it's critical**: The learning system is the flywheel — Wazir's core competitive advantage. But a flywheel without measurement is a guess engine. You need ground truth to close the loop: was the expertise update good or bad? Without evaluation data, bad updates accumulate and degrade the system — exactly the model collapse pattern the research warns about.

**Suggested edit**: Add to Stage 8 (Apply Learning) or as a new paragraph in the "Acknowledged gap" section:

> **Pipeline Evaluation Dataset (Future — Required Before v1)**
>
> A golden evaluation dataset of 50-100 tasks from real pipeline runs measures whether expertise updates improve quality. Each entry: a task input, the expected behavior, and grading criteria. The learning system tags applied proposals with run ID and compares finding rates on the next run against this dataset. If finding rate decreases, the update was effective. If it increases, the update is rolled back. This closes the flywheel loop.
>
> Dataset design follows research principles: representative of production distribution, expert-validated ground truth, living/evolving (add new failure modes from production), contamination-free (never used as expertise module content).

### C3. Add Deterministic Rule Layer to Review Mechanism

**Research finding**: Semgrep Multimodal (2026) finds 8x more true positives with 50% less noise by combining rule-based SAST with LLM reasoning. Traditional rules excel at known patterns (injection, secrets, type errors); LLMs handle business logic and intent. Static analysis tools average precision 0.7, recall 0.527 — but for known patterns, rules are strictly superior.

**Why it's critical**: The vision's review mechanism relies entirely on LLM-based review. For known vulnerability patterns (SQL injection, XSS, secrets in code, null dereference), deterministic rules are faster, cheaper, more reliable, and have no blind spot drift. Running LLM review without a deterministic pre-filter means: (1) burning expensive tokens on checks rules handle better, (2) missing known patterns the LLM's blind spot covers 64.5% of the time, (3) no reproducibility for security compliance. The research is clear that hybrid (rules + LLM) is the correct architecture.

**Suggested edit**: Add to Stage 2 (Review) or as a new pre-review stage:

> **Deterministic Pre-Review (Before LLM Review)**
>
> Before dispatching the LLM reviewer, run deterministic rule-based checks on the subtask output. Rules cover known-pattern categories where deterministic analysis is strictly superior: security vulnerabilities (CWE-mapped), type errors, null dereference, resource leaks, secrets exposure.
>
> Rules are versioned YAML (Semgrep-style syntax), composable (AND/OR/NOT), and carry metadata: severity, confidence, CWE mapping, fix suggestions. New rules follow incremental rollout: warning-only first, then enforcement after false-positive tuning.
>
> LLM reviewers receive deterministic findings as context, focusing their attention on business logic, architecture, and patterns rules cannot detect. This matches the hybrid model proven by Semgrep Multimodal (8x true positives, 50% less noise).

---

## Nice to Have

### N1. Cold Start Bootstrap Strategy

Define what happens when `stacks.<detected-stack>` has no expertise modules. Research suggests: (1) fall back to `auto.all-stacks.all-roles` modules, (2) use the online research from Phase 1 (DISCOVER) to generate temporary expertise context, (3) log the gap for the learning system. Low priority because Wazir currently targets known stacks, but becomes critical at scale.

### N2. Synthetic Test Case Generation for Pipeline Stress Testing

Use SWE-Synth or BugPilot-style approaches to generate synthetic tasks that stress-test the pipeline. The research shows synthetic bugs can outperform real-world datasets for training (SWE-Synth: +2.3% on SWE-bench). This would let Wazir validate pipeline changes before shipping. Not blocking because manual testing suffices early, but important for confidence at scale.

### N3. Prompt Versioning and Regression Testing

Treat expertise modules as versioned prompt assets with regression testing. When the learning system proposes an update, run the golden dataset evaluation before applying. Gate deployment: if regression > threshold, reject the update. The prompt-templates.md ecosystem (Promptfoo, DeepEval, Langfuse) provides the tooling. Not blocking because the human-review gate catches most issues, but automation reduces human burden as the system matures.

### N4. Curriculum Ordering Within Expertise Modules

Order content within expertise modules by difficulty: foundational patterns first, edge cases last. The curriculum-learning.md research shows this accelerates convergence (18-45% fewer training steps). For Wazir, this means: common antipatterns at the top of the module, rare/subtle patterns at the bottom. The recency bias research supports this — the model pays more attention to content near the end, so putting the hardest cases last is correct. Low priority because the context window is small enough that ordering effects are dampened, but becomes relevant as modules grow.

### N5. Data Flywheel Metrics

The data-flywheel.md research identifies specific metrics: prediction error cost per customer (Superhuman), acceptance rate (Copilot), routing accuracy (NVIDIA NVInfo). The vision's learning system captures qualitative signals but no quantitative flywheel metrics. Adding: finding rate per run, finding severity distribution, expertise module hit rate, model tier success rate — would make the flywheel measurable.

### N6. Content Seeding for Wazir's Own Adoption (DevTools Marketing)

The devtools-content.md research is entirely about marketing and adoption strategies for developer tools. While not directly relevant to the pipeline design, it's relevant to Wazir's go-to-market. Key finding: "Documentation IS Marketing" — Stripe, Twilio, Vercel all treat docs as their primary conversion channel. Wazir's pipeline.md is itself a form of documentation-as-marketing. This is deferred as it's outside pipeline scope.

---

## Improvements

### I1. Add Example Selection Strategy to Composer Section

**Section**: The Composer (between "Prompt assembly rules" and "User Interaction Model")

**What to add**: A new subsection "Example Handling in Expertise Modules" specifying: 3-5 examples per module, dynamic selection for pools > 5, ordering (common first, strongest last), mandatory negative examples in review modules, consistent formatting. See C1 above for full text.

**Why (citing research)**: few-shot-curation.md demonstrates that 3 dynamically selected examples match or beat 13 static examples (LangChain). Ordering can swing accuracy from SOTA to random (Zhao et al. 2021). This is the single most impactful missing specification in the Composer design.

### I2. Add Pipeline Evaluation Dataset to Learning System

**Section**: Stage 8: Apply Learning, after the "Acknowledged gap" paragraph

**What to add**: A "Pipeline Evaluation Dataset" specification requiring 50-100 golden tasks, expert-validated, living/evolving, used to measure whether applied learnings improve the next run. See C2 above for full text.

**Why (citing research)**: golden-datasets.md — Anthropic recommends 20-50 tasks. The vision already acknowledges this gap. Adding the specification commits to closing it.

### I3. Add Deterministic Rule Layer to Review

**Section**: Stage 2: Review, or as a new pre-review stage between Execute and Review

**What to add**: A deterministic pre-review step running versioned YAML rules for known patterns (security, correctness). Findings passed to LLM reviewer as context. See C3 above for full text.

**Why (citing research)**: rule-engines.md — Semgrep Multimodal proves hybrid rules+LLM is 8x better than LLM alone, 50% less noise. The 64.5% self-correction blind spot (already cited in the vision) is partly mitigatable by deterministic checks that have no blind spot for known patterns.

### I4. Extend the Design Decisions Table

**Section**: Design Decisions (Do Not Revisit Without Evidence)

**What to add**: Three new rows:

| Decision | Rationale | Override Condition |
|----------|-----------|-------------------|
| 3-5 examples per expertise module | Diminishing returns beyond 5 (Brown et al.), dynamic selection for larger pools (LangChain) | Learning data showing consistent improvement from more examples |
| No auto-apply of expertise updates without evaluation | Model collapse from recursive self-improvement (Nature 2024), golden dataset required | Evaluation dataset shows 95%+ improvement rate from auto-applied updates |
| Hybrid deterministic + LLM review | Rules 8x true positives for known patterns (Semgrep 2026), LLM for business logic | Learning data showing rule-based findings are consistently false positives |

**Why (citing research)**: These are load-bearing decisions backed by multiple research sources. Locking them in the design decisions table prevents future regression.

### I5. Add Flywheel Closure to Acknowledged Gap

**Section**: Stage 8: Apply Learning, the "Acknowledged gap" paragraph

**What to change**: Replace the current speculative "Future enhancement" language with a committed design:

Current: "Future enhancement: tag applied proposals with run ID, compare finding rates on the next run."

Proposed: "Required before v1: tag applied proposals with run ID, compare finding rates against the pipeline evaluation dataset. If finding rate decreased, learning was effective. If increased, roll back the update. Track three flywheel metrics: (1) finding rate per run, (2) finding severity distribution trend, (3) expertise module hit rate. These metrics are the flywheel's speedometer."

**Why (citing research)**: data-flywheel.md — "A data flywheel is only a competitive advantage if it's measurable." The Superhuman blog: "Track prediction error cost per customer quarterly — watch the line drop as dataset grows." Without metrics, you can't tell if the flywheel is spinning or stalled.
