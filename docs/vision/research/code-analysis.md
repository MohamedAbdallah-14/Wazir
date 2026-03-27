# Code Analysis -- Research vs Vision Comparison

Research corpus: 7 files in `docs/research/code-analysis/` (static-analysis-techniques, static-analysis-tools, dynamic-analysis, code-smells, tree-sitter-ast, complexity-metrics, incremental-analysis).

Vision document: `docs/vision/pipeline.md`.

---

## Strengths

1. **Linter gating on every edit is well-grounded.** The vision's patch strategy (Architecture > Subtask Pipeline > Stage 1: Execute) mandates "Linter gating on every edit (syntax validation before persisting)." The static-analysis-tools research validates this: linters are the fastest feedback layer, and CI/CD best practice is to run them at the earliest possible point (Source 11: Codacy CI/CD integration). The vision places them correctly -- at edit time, not at PR time.

2. **Verification stage separating review from proof is architecturally sound.** The vision's 3-stage subtask pipeline (Execute > Review > Verify) maps well to what the research recommends. The code-smells research (Source 10: Tufano et al.) shows 80% of smells survive once introduced, making prevention at creation time the highest-leverage intervention. The vision catches issues at three distinct points: execution-time linting, review-time quality checks, and verification-time proof generation.

3. **Cross-model review aligns with LLM-as-augmenter research.** The static-analysis-techniques research (Key Finding 8) establishes that LLMs excel at false positive reduction but underperform traditional tools on structured analysis. The vision's cross-model review passes (Completion Pipeline, Passes 1-4) use LLM agents for judgment-level review, not for structured analysis like data flow tracking. This is the correct division of labor.

4. **Fresh context per agent prevents analysis rot.** The vision's stateless worker pattern (every agent born, does one job, dies) is validated by the incremental-analysis research. Facebook Infer's success comes from compositionality -- each procedure analyzed independently with a summary. The vision's agents are compositional by design: each reads artifacts from disk, produces output, and dies. No cross-contamination.

5. **The Composer's expertise module system is a natural fit for custom static analysis rules.** The static-analysis-tools research (Synthesis: "Custom Rules as Force Multiplier") identifies project-specific rules as the highest-ROI static analysis capability. The vision's `composition-map.yaml` with `always.<role>`, `stacks.<detected-stack>.<role>`, and `concerns.<declared-concerns>` is structurally equivalent -- domain knowledge encoded as reusable modules. The vision correctly identifies this as "Wazir's moat" (Principle 9).

6. **Tautological test detection is research-backed.** The vision's Verify stage (Stage 3) explicitly targets the 93%/58% coverage/mutation gap. The dynamic-analysis research (Source 9: Google coverage study) confirms that coverage alone is insufficient and must be supplemented by deeper analysis. The vision addresses this.

---

## Weaknesses

1. **No mention of static analysis tooling in the pipeline.** The vision describes review as expertise-loaded LLM agents checking against checklists and antipatterns. It never mentions running actual static analysis tools (Semgrep, CodeQL, SonarQube, ESLint, Pylint) as part of the review or verification stages. The static-analysis-techniques research documents a mature, tiered tooling ecosystem with measurable accuracy (CodeQL: 88% accuracy/5% FP, Semgrep: 82%/12%, Snyk: 85%/8%). The vision relies entirely on LLM-based review, which the research explicitly warns against: "The hybrid approach is strictly superior to LLM-only analysis" (static-analysis-techniques, Key Finding 8). This is the single largest gap.

2. **No code complexity metrics anywhere in the pipeline.** The complexity-metrics research identifies Cognitive Complexity as the best current proxy for code understandability (better than Cyclomatic Complexity, which merely correlates with LOC). The vision's review checklists mention "YAGNI" and "security/performance" but never mention complexity thresholds, method length limits, or nesting depth checks. The research recommends a Cognitive Complexity threshold of 15 per function (SonarQube default) as a quality gate. The vision has no equivalent.

3. **No hotspot analysis or behavioral code analysis.** The code-smells research (Source 12: CodeScene) and complexity-metrics research (Source 13: CodeScene) both identify hotspot analysis -- combining code complexity with Git change frequency -- as the highest-ROI prioritization method for code quality. The vision's DISCOVER phase scans the codebase but only for "affected scope," not for identifying complexity hotspots that intersect with the change set. A reviewer that doesn't know which files are historically problematic is blind to the most important context.

4. **No dynamic analysis in verification.** The dynamic-analysis research identifies six distinct techniques (coverage analysis, sanitizers, fuzzing, dynamic symbolic execution, dynamic taint analysis, property-based testing) that catch bugs invisible to static analysis and code review. The vision's Verify stage runs "ALL verification criteria" and "collects output as evidence," but the verification criteria are defined during planning, not derived from dynamic analysis techniques. There is no mention of sanitizer-enabled test runs, fuzzing, or coverage-in-review. The Datadog research (dynamic-analysis Source 13) explicitly warns: "dynamic analysis is especially important for AI-generated code because AI models may produce code that passes static checks but fails at runtime."

5. **No incremental analysis strategy.** The incremental-analysis research documents how Facebook Infer analyzes diffs in 15-20 minutes, CodeQL's incremental mode is 20-58% faster, and content-hashed caching enables fast re-analysis across PR iterations. The vision's review agents read full artifacts from disk every time. For codebases of any significant size, this means every review agent re-analyzes everything from scratch. There is no caching of analysis results, no diff-scoped analysis, no content-addressed result reuse.

6. **Tree-sitter is absent from the architecture.** The tree-sitter-ast research documents it as critical infrastructure for AI coding tools: Aider uses it for repository maps, Cursor/Windsurf/Copilot use it for code RAG, and an MCP server exists for AI agent access. The vision mentions "Codebase indexing (or refresh)" in DISCOVER but does not specify Tree-sitter or any parser. For a system that claims to be a "host-native engineering OS kit," the absence of a concrete code understanding layer is a gap. The research shows Tree-sitter provides: 36x parsing speedup, 100+ language grammars, error-tolerant parsing of incomplete code, and structure-aware chunking for LLM context.

7. **No code smell detection or prevention strategy.** The code-smells research shows that 80% of code smells survive once introduced (Tufano et al., 500K+ commits, 200 projects) and 89-98% are introduced in the month before a release. The vision's review checklists do not include smell detection. The research recommends multi-layered detection: rule-based linting + metric-based analysis + behavioral data (change frequency). The vision has none of these layers explicitly.

8. **False positive management is unaddressed.** The static-analysis-tools research (Source 8: Tencent study) shows 75.7% of static analysis alerts are false positives. The static-analysis-techniques research identifies false positive management as "the key adoption bottleneck" (Key Finding 10). The vision's review mechanism produces CRITICAL/HIGH/MEDIUM/LOW findings but has no strategy for distinguishing true positives from false positives, no LLM-based filtering layer, and no delta-only reporting to avoid alert fatigue from pre-existing issues.

---

## Critical to Edit

### 1. Add static analysis tools as a mandatory verification layer

**Research finding:** The static-analysis-techniques research (Key Finding 8) and the static-analysis-tools research (Synthesis) both establish that LLM-only analysis is inferior to hybrid LLM + traditional-tool analysis. Individual SASTs detect vulnerabilities in only ~52% of cases (static-analysis-tools Source 3), but combining them with LLM filtering eliminates 94-98% of false positives (static-analysis-tools Source 8). The vision currently has zero traditional static analysis in the pipeline.

**Why critical:** Without static analysis tools, Wazir's review depends entirely on LLM agents to catch data flow bugs, taint violations, security vulnerabilities, and structural anti-patterns. The research is unambiguous: LLMs "underperform traditional tools on call-graph analysis" and "hallucinate paths that do not exist" (static-analysis-techniques, Emerging Trends). An LLM-only review pipeline has a structural blind spot that no amount of cross-model review can close, because the blind spot is shared across all LLM families.

**Suggested edit:** Add to the Execute stage's patch strategy or create a new verification sub-step: "Static analysis tools run on every subtask completion. Tiered: fast-lane linters (Semgrep custom rules + language linters, seconds) on every edit; standard-lane SAST (CodeQL or equivalent, minutes) on subtask completion. Findings feed into the Review stage as structured input alongside the reviewer's own findings. LLM reviewers classify tool findings as true positive, false positive, or needs-investigation." Update the Composer to include static analysis tool configuration in subtask expertise declarations.

### 2. Add dynamic analysis to the Verify stage

**Research finding:** The dynamic-analysis research (Synthesis) establishes that static and dynamic analysis are complementary -- neither alone is sufficient. AI-generated code specifically requires dynamic verification because models produce "syntactically correct but semantically flawed implementations" (dynamic-analysis Source 13: Datadog). Coverage-in-review nudges developers (and reviewers) to focus on untested paths (dynamic-analysis Source 9: Google). Sanitizer-enabled test runs catch memory and concurrency bugs invisible to code review.

**Why critical:** Wazir generates AI-written code. The research specifically warns that AI-generated code passes static checks but fails at runtime. The vision's Verify stage generates "proof" but only by running pre-defined verification criteria. If those criteria don't include dynamic analysis techniques, the proof has a systematic gap. The 93%/58% coverage/mutation score gap the vision already cites is evidence that static verification alone is insufficient.

**Suggested edit:** Add to Stage 3 (Verify): "Verification includes dynamic analysis signals: (1) test coverage of changed lines surfaced as evidence, (2) tests run with sanitizers when the stack supports them (ASan/MSan for C/C++, race detector for Go), (3) property-based test generation for functions with clear input/output contracts. Coverage gaps in acceptance-criteria-relevant code paths are flagged as MEDIUM findings."

### 3. Specify Tree-sitter as the code understanding layer

**Research finding:** The tree-sitter-ast research documents Tree-sitter as the de facto standard for AI coding tool infrastructure: Aider uses it for repository maps with PageRank-style ranking, Cursor/Windsurf/Copilot use it for structure-aware code RAG, GitHub uses it for code navigation across hundreds of millions of repos, and an MCP server exposes it to AI agents. It supports 100+ languages, provides 36x parsing speedup, tolerates syntax errors, and enables structure-aware chunking that respects code boundaries.

**Why critical:** The vision's DISCOVER phase includes "Codebase indexing" and the Composer needs to read subtask files with "Context budget: READ FULL, READ SECTION, KNOW EXISTS." Without a concrete parser, context extraction is either raw text (losing structural information) or requires per-language tooling. Tree-sitter provides language-agnostic structural understanding with a single API, which is load-bearing for the Composer's context budgeting and the DISCOVER phase's scope identification.

**Suggested edit:** Add to Architecture section, after "The Composer": "Code understanding is powered by Tree-sitter. The indexer parses all source files into concrete syntax trees, extracts symbol definitions (functions, classes, methods with signatures), and builds a repository map using relevance ranking (PageRank-style, following Aider's approach). This map is the input for context budgeting in subtask files. Tree-sitter's incremental parsing, error tolerance, and 100+ language grammar ecosystem make it the only viable choice for a language-agnostic engineering OS."

---

## Nice to Have

1. **Complexity metric thresholds in review checklists.** The complexity-metrics research recommends Cognitive Complexity <= 15 per function as the primary quality gate, with Cyclomatic Complexity reserved for test coverage planning only. Adding these to the review checklists (Phase 4, 6, 8, and Stage 2) would give reviewers concrete, measurable criteria instead of subjective judgments about code quality. The neuroscience research (complexity-metrics Source 9) warns that even Cognitive Complexity diverges from actual cognitive load in some cases, so thresholds should be guidelines, not absolute gates.

2. **Hotspot-aware review prioritization.** The code-smells research (Source 12: CodeScene) shows that combining code complexity with Git change frequency identifies the files with highest ROI for review attention. During DISCOVER or PLAN, mining Git history for change coupling and hotspots would let the pipeline focus review effort on historically problematic code. This is lower priority because the pipeline already reviews everything, but it could inform review depth (more passes on hotspots).

3. **Incremental analysis caching for multi-session runs.** The incremental-analysis research shows content-hashed caching of analysis results (Turborepo/Bazel model) enables fast re-analysis across iterations. For Wazir's batch execution and session handover, caching analysis results per-subtask and reusing them when code hasn't changed would reduce redundant work. This matters most for large codebases where full re-analysis is expensive.

4. **Code smell taxonomy in expertise modules.** The code-smells research documents Jerzyk's 2022 taxonomy of 56 code smells across three classification axes. Encoding the most impactful smells (Bloaters, Change Preventers, Couplers) as expertise module content -- specifically for the `always.reviewer` and stack-specific reviewer modules -- would give LLM reviewers a structured vocabulary for identifying quality issues beyond what they know from training data.

5. **Structural diff for review.** The tree-sitter-ast research (Source 14: Difftastic) shows that syntax-aware diffs highlight semantic changes while ignoring formatting changes. For the Review stage, providing reviewers with structural diffs rather than line-level diffs would reduce noise and focus attention on actual behavioral changes. Lower priority because LLM agents can often infer this from context, but it would improve review precision.

6. **Architecture-as-code enforcement.** The static-analysis-techniques research (Emerging Trends) notes SonarQube 2025's architecture analysis that validates code against declared module boundaries. For Wazir projects that define architectural constraints, encoding these as Semgrep or CodeQL rules and running them during verification would catch architectural drift that subtask-level review misses. This is a completion-pipeline concern more than a subtask concern.

7. **Delta-only finding reporting.** The static-analysis-techniques and incremental-analysis research both emphasize reporting only new findings in changed code, not the full backlog of pre-existing issues. The vision's review agents currently see full artifacts. Scoping findings to only code changed by the current subtask would reduce noise and prevent the review from being overwhelmed by pre-existing technical debt.

---

## Improvements

### 1. Execute Stage -- Add static analysis tool integration

**Section:** Part II > The Subtask Pipeline > Stage 1: Execute, "Patch strategy" paragraph.

**Change:** After "Linter gating on every edit (syntax validation before persisting)" add: "Static analysis tools run at subtask completion: fast-lane (Semgrep custom rules + language linters) gates every edit; standard-lane (CodeQL or stack-appropriate SAST) runs on subtask completion. Tool findings are written to `findings-sast.json` alongside the executor's own output, becoming input for the Review stage."

**Why:** The research consensus (static-analysis-techniques Key Finding 8, static-analysis-tools Source 3, Source 8) is that LLM review without traditional tool support has a structural blind spot for data flow bugs, taint violations, and interprocedural security issues. Citing: "The hybrid LLM + traditional-tool approach is the current state of the art" (static-analysis-techniques).

### 2. Review Stage -- Add tool finding classification

**Section:** Part II > The Subtask Pipeline > Stage 2: Review.

**Change:** Add after the current review description: "When SAST findings exist, the reviewer classifies each as true positive, false positive, or needs-investigation. True positives become review findings at the appropriate severity. This LLM-as-filter pattern eliminates 94-98% of false positives (Du et al. 2024, Tencent) while preserving the recall of traditional tools."

**Why:** The static-analysis-tools research (Source 8) shows 75.7% of static analysis alerts are false positives, each costing 10-20 minutes of manual review. Without filtering, tool findings would overwhelm the review. The LLM reviewer is the natural filter -- it already has the code context. Citing: static-analysis-tools Source 8.

### 3. Verify Stage -- Add dynamic analysis signals

**Section:** Part II > The Subtask Pipeline > Stage 3: Verify.

**Change:** After "Catches tautological tests (93% coverage / 58% mutation score gap)" add: "Dynamic analysis signals supplement static verification: (1) test coverage of acceptance-criteria-relevant code paths surfaced as evidence, (2) sanitizer-enabled test execution when stack supports it, (3) property-based tests for functions with clear input/output contracts where the executor's TDD tests are example-based only."

**Why:** The dynamic-analysis research (Source 13: Datadog, Source 9: Google) establishes that AI-generated code specifically requires dynamic verification and that coverage-in-review is the most effective lightweight dynamic analysis intervention.

### 4. Architecture -- Add Tree-sitter as the code understanding layer

**Section:** Architecture, after "The Composer" subsection.

**Change:** Add a new subsection "### The Code Understanding Layer" specifying Tree-sitter as the parser for codebase indexing, repository map generation, structure-aware context extraction, and context budgeting. Reference Aider's PageRank-style repository map approach and Tree-sitter's 100+ language grammar ecosystem.

**Why:** The tree-sitter-ast research documents it as the universal foundation for AI coding tool infrastructure. The vision's DISCOVER phase and Composer both depend on code understanding but don't specify the mechanism. Citing: tree-sitter-ast Sources 3 (Aider), 9-10 (AI agent indexing), 15 (MCP server).

### 5. PLAN Phase -- Add complexity budget to subtask files

**Section:** Part I > Phase 7: PLAN, "Each subtask.md contains" list.

**Change:** Add to the subtask.md contents: "Complexity constraints: maximum Cognitive Complexity per function (default 15), maximum method length (default 25 lines). Derived from project configuration or defaults." Add to Phase 8 REVIEW(plan) checklist: "complexity constraints set."

**Why:** The complexity-metrics research shows Cognitive Complexity is the best proxy for code understandability (better than Cyclomatic Complexity), and that automated complexity gates in CI/CD are the recommended practice. Putting constraints in the subtask file means the executor and reviewer both know the target. Citing: complexity-metrics Sources 2-3 (SonarSource Cognitive Complexity), Source 7 (Teamscale on CC limitations).

### 6. Expertise Modules -- Add code smell taxonomy

**Section:** Architecture > The Composer, expertise module description.

**Change:** Add to the `auto.all-stacks.all-roles` expertise category: "code-quality/smell-detection.md -- top code smell categories (Bloaters, Change Preventers, Couplers) with detection heuristics and refactoring guidance, sourced from Jerzyk 2022 taxonomy."

**Why:** The code-smells research (Source 10: Tufano et al.) shows 80% of smells survive once introduced. The expertise module system is the natural place to encode smell detection knowledge so that every reviewer agent has it. Citing: code-smells Synthesis, Source 10.

### 7. DISCOVER Phase -- Add hotspot analysis

**Section:** Part I > Phase 1: DISCOVER, "Subagents" list.

**Change:** Add: "Agent N+1: Hotspot analysis -- mine Git history for change frequency per file, combine with complexity metrics to identify high-risk files intersecting with the change scope. Output feeds into PLAN for review depth decisions."

**Why:** The code-smells research (Source 12: CodeScene) and complexity-metrics research (Source 13: CodeScene) both establish that hotspot analysis (complexity x change frequency) is the highest-ROI method for prioritizing code quality attention. Files that are both complex and frequently changed are where bugs cluster. Citing: code-smells Source 12, complexity-metrics Source 13.
