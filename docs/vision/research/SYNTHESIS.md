# Research vs Vision -- Final Synthesis

## Methodology

**Scope**: 13 research-vs-vision comparison reports covering 121 research files across 13 categories, all compared against `docs/vision/pipeline.md` (locked 2026-03-25).

| Category | Research Files | Critical Findings Claimed |
|----------|---------------|--------------------------|
| Agent Architecture | 8 | 3 |
| Code Analysis | 7 | 3 |
| Code Review | 13 | 3 |
| Codebase Understanding | 10+ | 3 |
| Content & Data Seeding | 10 | 3 |
| Context Engineering | 8 | 3 |
| Enforcement | 5 | 4 |
| Execution | 22 | 3 |
| Methodology | 7+ | 3 |
| Orchestration | 11 | 3 |
| Security | 5+ | 3 |
| Summarization & Retrieval | 6 | 3 |
| Tools Landscape | 10+ | 3 |
| **Total** | **~121** | **40** |

**Deduplication method**: Every finding from every report was catalogued. Findings sharing the same root cause were merged regardless of how different categories framed them. For example, "no static analysis tools" (code-analysis), "no deterministic rule layer" (content-and-data-seeding), and "no taint analysis" (security) all stem from the same root gap: the pipeline lacks a non-LLM verification layer. These were merged.

**Severity validation method**: Each "critical" finding was tested against three questions:
1. Does the vision ACTUALLY miss this, or did the agent miss where it is covered?
2. Is this a design-level gap (WHAT/WHY) or an implementation detail (HOW)?
3. Does research provide quantified evidence that this gap causes measurable failure?

Findings that failed any question were downgraded or rejected.

---

## Truly Critical (Must Edit Vision)

Seven findings survive scrutiny as genuine design-level gaps that will cause measurable pipeline failure if not addressed. Each has quantified evidence and a specific edit target.

### TC-1. No codebase retrieval architecture

**Finding**: The vision says "codebase indexing" and "identify affected scope" but never specifies what the index contains, how retrieval works, or how agents get the right code into their context windows.

**Sources**: agent-architecture (W1, W6), codebase-understanding (W1-W6), code-analysis (W6), summarization-and-retrieval (W1), tools-landscape (W6), context-engineering (implicit)

**Evidence**:
- Aider's repo map uses 4.3-6.5% of context vs 54-70% for agents using iterative search (agentic-coding.md). Without structured retrieval, 93-96% of context is wasted.
- Hybrid BM25+vector retrieval improves recall 15-30% over either alone (rag-for-code, WeChat industrial study on 1,669 repos).
- AST-based chunking improves Recall@5 by 4.3 points over line-based (chunking-strategies.md).
- SWE-bench failure taxonomy: "Localization failures: principal mode across all approaches."
- Deterministic AST-derived graphs are 70x faster and 20x cheaper than LLM-extracted graphs (Chinthareddy 2026).

**Suggested edit**: Add a new Architecture subsection "Codebase Intelligence" after "The Composer" specifying:
- L1 Structural Index (tree-sitter, dependency graph, repo map via PageRank)
- L2 Text Search Index (trigram)
- L3 Semantic Index (AST-aware chunking, code-specific embeddings, optional)
- Incremental refresh via content hashing (O(changes), not O(repo))
- Repo map delivered to every agent (~5-10% of context budget)

Expand Phase 1 DISCOVER Agent 2 and Agent 3 with concrete mechanisms (graph traversal for scope, not grep).

**Why it cannot wait**: The vision calls DISCOVER "Wazir's moat" (line 166). The Composer's context budgeting depends on a retrieval layer that does not exist in the spec. Every downstream phase -- planning, execution, review -- degrades if agents get the wrong code. This is not an implementation detail; it is the infrastructure that makes the architecture work. Specifying WHAT index layers exist and WHAT retrieval strategy is used is vision-level. Specifying which tree-sitter grammar version to use is not.

---

### TC-2. No non-LLM verification layer (static analysis + deterministic rules)

**Finding**: The pipeline relies entirely on LLM-based review for catching bugs, vulnerabilities, and code quality issues. No traditional static analysis tools (Semgrep, CodeQL) or deterministic rule-based checks run at any point.

**Sources**: code-analysis (W1, W4), content-and-data-seeding (W7), security (W1, W5), methodology (implicit)

**Evidence**:
- "The hybrid LLM + traditional-tool approach is strictly superior to LLM-only analysis" -- static-analysis-techniques Key Finding 8.
- Semgrep Multimodal: 8x more true positives, 50% less noise vs LLM-only (rule-engines.md).
- Individual SASTs detect vulnerabilities in only ~52% of cases, but combined with LLM filtering, 94-98% of false positives are eliminated (static-analysis-tools).
- LLMs "hallucinate paths that do not exist" in call-graph analysis (static-analysis-techniques).
- The 64.5% self-correction blind spot is shared across all LLM families -- cross-model review cannot close a gap that is structural to the modality.
- AI-generated code has a 12-65% vulnerability rate (owasp-patterns.md Source 14). 100% of Wazir's output is LLM-generated.

**Suggested edit**: Add to the subtask pipeline a deterministic pre-review step: fast-lane rules (Semgrep-style YAML, seconds) on every edit; standard-lane SAST on subtask completion. LLM reviewers receive tool findings as context and classify them (true positive / false positive / needs-investigation). This is the hybrid model proven at 8x improvement.

**Why it cannot wait**: The vision already acknowledges that "self-assessment is untrustworthy" (Principle 13) and that the 64.5% blind spot demands cross-model review. But cross-model review only diversifies LLM blind spots -- it cannot compensate for the structural inability of LLMs to perform precise data flow, taint, or call-graph analysis. This is a modality gap, not a model gap. Deterministic tools have zero blind spot drift for known patterns. The vision needs to state that the review architecture is hybrid (deterministic + LLM), not LLM-only.

---

### TC-3. Enforcement invariants are unstated

**Finding**: The vision describes the desired architecture (orchestrator dispatches subagents, agents are stateless, etc.) but never specifies the mechanical enforcement that makes it work. Without tool restrictions, the orchestrator will do work inline. Without a bootstrap gate, pipeline state is never created. Without Bash restrictions, all tool restrictions are bypassable.

**Sources**: enforcement (W1-W3), orchestration (W1-W2), security (implicit)

**Evidence**:
- 5 Wazir production sessions at 40% compliance with prompt-only enforcement (the-enforcement-problem.md).
- Prompt-only ceiling: ~40-50% for complex multi-step pipelines (research-synthesis.md Level 1). Meincke et al. N=28,000: persuasion caps at 72%.
- Compound probability: 95% per-step compliance across 10 steps = 59% end-to-end success.
- Bootstrap gate was the breakthrough that enabled first autonomous pipeline following (benchmark-v5-results.md).
- Bash access defeats all --disallowedTools restrictions (security-gaming.md). Agent writes `echo 'code' > file.js` via Bash.
- PCAS (ICSE 2026): deterministic reference monitor raised compliance from 48% to 93%.

**Suggested edit**: Add an "Enforcement Invariants" subsection to Architecture:
1. Orchestrator MUST NOT have Write/Edit tools (tool allowlist enforcement)
2. Pipeline state MUST be created mechanically (hook/bootstrap gate), not by the agent
3. Every phase gate MUST have a mechanical check (artifact exists + schema valid + state updated)
4. Bash MUST be restricted via per-phase command allowlists (PreToolUse hook)
5. Document hook limitations (fail-open on crash, no input modification, semantic evasion exists)

Add the compound compliance math to Principle 2: "At 95% per-step, 10 steps = 59% end-to-end. Mechanical gates are mathematically required."

**Why it cannot wait**: Without this section, the vision reads as aspirational architecture. The research proves that well-designed architectures fail at 40% compliance unless mechanically enforced. An implementer reading the vision would build the orchestrator, skip tool restrictions (they seem obvious), and get 40% compliance. The enforcement model is the difference between a design and a working system.

---

### TC-4. Structured summary schema for subagent contract

**Finding**: Subagents return ~200-token summaries to the orchestrator, but the vision specifies no schema for these summaries. The orchestrator makes all routing decisions based on these summaries.

**Sources**: summarization-and-retrieval (W2), context-engineering (implicit)

**Evidence**:
- Factory AI probe-based evaluation: structured summaries with mandatory sections scored 0.35 points higher than free-form on factual retention. "Dedicated sections act as a checklist -- the summarizer cannot silently drop file paths or skip decisions" (information-summarization Source 7).
- The vision already mandates constrained decoding for status.json (100% vs 40-74.5% compliance). The summary is the other half of the subagent output and gets no structural enforcement.

**Suggested edit**: Add to "The Subagent Contract" a mandatory summary schema with constrained decoding: `status` (enum), `output_artifact` (file path), `key_decisions` (list, max 3), `files_modified` (list), `open_questions` (list), `blocking_issues` (list), `downstream_impact` (string, max 50 tokens).

**Why it cannot wait**: The orchestrator is a state machine that routes on summaries. If summaries silently drop file paths or decisions, the orchestrator routes incorrectly and downstream agents operate on incomplete information. The vision correctly enforces structure on status.json but leaves the summary -- which carries richer routing information -- as free-form text. This is an inconsistency in the design's own logic.

---

### TC-5. Secrets detection gate

**Finding**: No pre-commit or pre-merge secrets scanning exists anywhere in the pipeline. LLM-generated code has a documented 40% higher secret leakage rate than human code.

**Sources**: security (W3)

**Evidence**:
- 39 million secrets leaked on GitHub in 2024, 70% of 2022 secrets still active in 2025 (secrets-detection.md).
- Repositories using AI coding assistants show 40% higher secret leakage (secrets-detection.md).
- ~30% of Copilot-generated code contains security weaknesses across 43 CWE categories.
- Average cost of a credential breach: $4.88M.

**Suggested edit**: Add to Execute stage after "Linter gating on every edit": "Secrets gating on every commit. Pattern matching + entropy analysis. Detected secrets block the commit and trigger a fresh fix executor."

**Why it cannot wait**: 100% of Wazir's output is LLM-generated. The 40% higher leakage rate is not hypothetical -- it is measured. A single shipped secret can cause $4.88M in damages. This is not a quality concern; it is a liability concern. The gate is cheap (pattern matching, milliseconds) and the downside of omission is catastrophic.

---

### TC-6. Supply chain security for dependency changes

**Finding**: AI agents hallucinate package names at 5-21% rates. No mechanism validates that new dependencies exist, are non-malicious, or are free of known CVEs.

**Sources**: security (W2)

**Evidence**:
- Supply chain attacks grew 156% YoY (Sonatype 2024).
- OWASP 2025 Top 10 ranks supply chain failures #3.
- Slopsquatting (AI-hallucinated package names registered by attackers) is a documented vector with 5.2-21.7% hallucination rates.
- Lockfile injection is an underreviewed attack surface.

**Suggested edit**: Add to Verify stage (Stage 3): when a subtask modifies dependency manifests, verify all new packages exist in the official registry, check for known CVEs, verify lockfile changes correspond to manifest changes, flag packages younger than 14 days.

**Why it cannot wait**: The pipeline generates code that adds dependencies. AI hallucination of package names is documented and exploitable. Without verification, Wazir could introduce a supply chain attack vector into every project it touches. This is a security boundary, not an implementation detail.

---

### TC-7. Wall-clock timeout / heartbeat for agents

**Finding**: max_steps and max_cost do not protect against an agent stuck in a blocking tool call (network timeout, hung subprocess, infinite blocking I/O). The orchestrator will wait indefinitely.

**Sources**: execution (W3)

**Evidence**:
- Infinite loop is anti-pattern #1 in execution-anti-patterns.md, causing 150x cost explosion.
- State-management.md documents the heartbeat pattern as standard for detecting stuck agents.
- max_steps only increments on completed tool calls. A blocking call never completes and never increments.

**Suggested edit**: Add `max_wall_clock` to the Hard limits paragraph in Stage 1 Execute. Add TIMEOUT as a sixth status value in the Status Protocol.

**Why it cannot wait**: This is a liveness bug. An agent stuck on a network request or hung subprocess will block the entire pipeline indefinitely. The orchestrator has no mechanism to detect or recover from this. Every production orchestration system (Temporal, Airflow, Prefect) has heartbeat detection. Its absence is a design gap, not an implementation detail.

---

## Important But Not Vision-Level

Findings that are real gaps but belong in implementation specs, expertise modules, or CLI documentation rather than in the vision document.

### D-1. Tree-sitter as the specific parser (code-analysis C3, codebase-understanding)
Tree-sitter is the correct choice, but specifying it by name is implementation. The vision should specify "AST-based structural parsing with 100+ language support" (which only Tree-sitter currently satisfies) without naming the tool. **TC-1 above addresses this at the right abstraction level.**

### D-2. Specific static analysis tool names (code-analysis C1)
The vision should require a hybrid deterministic+LLM review architecture (TC-2 above). Specifying "Semgrep" or "CodeQL" by name is implementation. The Composer's expertise modules and config tables are where tool names belong.

### D-3. Code complexity metric thresholds (code-analysis N1)
Cognitive Complexity <= 15 per function is a good default, but it belongs in expertise modules (`quality/complexity-thresholds.md`), not in the vision. The vision specifies WHAT the review checks; expertise modules specify the thresholds.

### D-4. Hotspot analysis via git history (code-analysis N2, codebase-understanding N2)
Mining git history for change frequency is a useful prioritization technique. It belongs in the DISCOVER phase's implementation spec, not the vision. The vision already says "Identify affected scope in codebase" -- hotspot analysis is one way to do that.

### D-5. Few-shot example strategy for expertise modules (content-and-data-seeding C1)
The research on few-shot selection (3-5 examples, dynamic selection, ordering effects) is strong. But this describes HOW expertise modules are structured internally -- it belongs in a composition-map design spec, not the vision. The vision says "Expertise modules ARE the domain knowledge" and the Composer assembles them. Internal module structure is implementation.

### D-6. Golden dataset / pipeline evaluation (content-and-data-seeding C2)
Important for the learning flywheel, but the vision already acknowledges this gap explicitly: "the learning system proposes but doesn't measure whether applied learnings improved the next run." The vision marks it as a future enhancement. Promoting it to a vision-level requirement would be premature -- you need a working pipeline before you can build an evaluation dataset from real runs.

### D-7. Token budgets per prompt section (context-engineering C1)
The 200-token system identity, 500-1500 token task instructions, etc. are implementation-level sizing. The vision correctly specifies the ~150-200 instruction budget and the principle that context is budgeted. Per-section token allocations belong in the Composer's implementation spec.

### D-8. Tool definition filtering (context-engineering C2)
Research shows 3x accuracy gain from filtering irrelevant tool definitions. This is a Composer implementation optimization. The vision already says the Composer produces "complete agent config ready for dispatch" -- filtering tools per subtask is part of that assembly process.

### D-9. Requirements smell detection (methodology C2)
The smell catalog (subjective language, ambiguous adverbs, vague pronouns) belongs in an expertise module (`quality/requirements-smells.md`), not the vision. The vision specifies THAT spec review checks for "clarity" -- the smell catalog operationalizes what clarity means.

### D-10. Property-based testing (methodology C1)
PBT is the researched countermeasure to the "same author" problem. But specifying PBT as a testing technique is implementation-level. The vision already addresses the underlying problem: the Verifier (Stage 3) catches tautological tests, and the 93%/58% gap is cited. Adding a `properties:` field to subtask.md is a good idea for the subtask template spec, not the vision.

### D-11. Design by Contract encoding (methodology C3)
Instructing executors to encode preconditions as runtime guards is implementation guidance for executor prompts, not a vision-level design decision.

### D-12. Model-specific edit format selection (tools-landscape C2)
Aider's finding that each model has an optimal edit format (SEARCH/REPLACE for Claude, whole-file for o1/o3) is important. But this is a Composer configuration table entry, not a vision-level design decision. The vision already specifies model tier mapping via config tables.

### D-13. Per-project constitution (tools-landscape C3)
Spec Kit and Superpowers both use immutable project principles. This is a good feature but it maps naturally to the existing `always.<role>` expertise loading -- a `context.always.project-constitution` entry in composition-map.yaml. It is a composition-map configuration, not a new architectural concept.

### D-14. Context-specific security expertise loading (security C3)
Loading different security checklists for web vs API vs IaC contexts is important but belongs in the composition-map's `concerns.<declared-concerns>` resolution, not the vision. The architecture already supports this.

### D-15. Structured handover format (context-engineering C3)
The specific sections of a handover document (session intent, completed subtasks, remaining subtasks, concerns, decisions, environment state, resume instruction) belong in an implementation spec. The vision correctly specifies ~500 tokens and the purpose. The structure is implementation.

### D-16. Observation masking for within-session context (execution C2, summarization-and-retrieval W6)
Trimming old tool outputs within a single agent session is a good technique. But since Wazir agents are born-work-die with short sessions, this is a Composer-level optimization, not a vision-level design decision.

### D-17. Prompt repetition technique (execution C3)
Duplicating critical instructions at START, END, and before the task block. The vision already says "Critical instructions at START and END" (line 123). Adding "and before the task block" is a refinement of existing prompt assembly rules, not a new design decision.

### D-18. Conventional Comments format (code-review N3)
A structured format for review findings is useful but belongs in the reviewer's expertise module configuration, not the vision.

---

## Duplicates Merged

The following findings appeared in multiple reports. Each is listed with all source categories and the single consolidated finding it maps to.

| Consolidated Finding | Source Categories | Count |
|---------------------|-------------------|-------|
| **Codebase indexing/retrieval unspecified** | agent-architecture, codebase-understanding, code-analysis, summarization-and-retrieval, tools-landscape, context-engineering | 6 |
| **No static analysis / deterministic rules** | code-analysis, content-and-data-seeding, security | 3 |
| **Tree-sitter not named as parser** | code-analysis, codebase-understanding, summarization-and-retrieval, tools-landscape | 4 |
| **Observation masking not specified** | agent-architecture, execution, summarization-and-retrieval, context-engineering | 4 |
| **No repo map for agents** | agent-architecture, codebase-understanding, tools-landscape | 3 |
| **Architect/editor split not used** | execution, tools-landscape | 2 |
| **Hotspot analysis via git history** | code-analysis, codebase-understanding | 2 |
| **Bash escape hatch unaddressed** | orchestration, security, enforcement | 3 |
| **Fresh context per agent is correct** | ALL 13 categories | 13 |
| **Cross-model review is correct** | agent-architecture, code-review, orchestration, security, enforcement, execution | 6 |
| **File system as communication bus is correct** | agent-architecture, orchestration, execution, summarization-and-retrieval, context-engineering, tools-landscape | 6 |

The most duplicated gap is codebase retrieval (6 categories independently identified it). The most duplicated strength is fresh context per agent (unanimous across all 13).

---

## Overclaimed / Rejected

Findings marked "critical" by individual agents that do not survive scrutiny.

### Rejected-1: "Add sample-and-select for the PLAN phase" (agent-architecture C2)

**Claimed**: MAKER's k=3 voting should be applied to planning. Single plan = single point of failure.

**Why rejected**: The vision already has REVIEW(plan) as Phase 8, with up to 3 rounds same-model and a cross-model pass. This IS the sample-and-select mechanism -- the review identifies flaws and the plan is revised. Generating 3 independent plans and selecting the best sounds appealing but: (a) the research on k=3 voting applies to simple, well-defined tasks with clear correct answers, not to complex multi-file decomposition plans where "best" is subjective; (b) the cost is 3x planning tokens for uncertain benefit; (c) comparing/synthesizing plans requires a meta-planner that itself becomes a single point of failure. The review mechanism is the right quality assurance pattern for plans.

### Rejected-2: "Add Agent-Computer Interface specification" (agent-architecture C3)

**Claimed**: SWE-agent showed 3.3x improvement from ACI design. The vision must specify what tools look like.

**Why rejected**: The vision correctly specifies WHAT tools agents use ("structured edit tools," "linter gating," "micro-commits") and the Composer's role in assembling agent configs. HOW those tools present themselves to the agent (windowed file viewer, diff preview, etc.) is host-specific implementation. Wazir runs inside Claude, Codex, Gemini, and Cursor -- each host has its own tool interface. Specifying ACI details in the vision would either be platform-generic (useless) or platform-specific (wrong scope). The Composer's config table is where tool definitions are resolved per host.

### Rejected-3: "Add Judge/Validation stage to review pipeline" (code-review CRITICAL-1)

**Claimed**: Two-stage review (generate findings, then judge findings) is the "single most important architectural decision."

**Why rejected**: The vision already has this. The review mechanism (lines 239-256) dispatches a review subagent, and if CRITICAL/HIGH findings exist, a fresh fix executor addresses them, then a NEW review subagent (fresh context) re-reviews. The re-review IS the judge -- it independently validates whether the original finding was real and whether the fix resolved it. Additionally, cross-model Pass 3 in the final review independently evaluates findings from Passes 1-2 without knowing what they found. The agent overclaimed because the validation is structural (fresh agent re-reviews) rather than a named "Judge" stage.

### Rejected-4: "Require review agents to produce comprehension summary" (code-review CRITICAL-2)

**Claimed**: Reviews should produce a comprehension summary before findings.

**Why rejected**: This is a prompt engineering technique for the reviewer's expertise module, not a vision-level design decision. The vision specifies WHAT reviewers check (internal consistency + input alignment) and HOW findings are structured (severity levels). Adding "write a summary first" is an instruction in `always.reviewer`, not a pipeline phase. Downgraded to implementation.

### Rejected-5: "Add change impact analysis to per-subtask review" (code-review CRITICAL-3)

**Claimed**: Reviews must analyze what the change impacts beyond files it touches.

**Why rejected**: The vision already addresses this at the correct level. The PLAN phase builds a file dependency matrix (line 215) specifically to prevent cross-subtask interference. The Final Review Pass 2 checks "integration completeness: do cross-subtask interfaces match?" (line 434). Per-subtask impact analysis is redundant with planning-time dependency analysis -- the plan already knows which files each subtask affects. Adding impact analysis to every subtask review is over-engineering when the plan prevents the problem.

### Rejected-6: "Add memory formation to learning system" (summarization-and-retrieval C3)

**Claimed**: Cross-run project memory (facts, preferences, patterns) should persist.

**Why rejected**: The vision already has this mechanism. The learning system (Stage 8) extracts patterns and proposes expertise updates. The handover mechanism persists project state across sessions. The expertise modules themselves ARE the persistent memory -- they accumulate project knowledge through the learning flywheel. What the agent is really asking for is a structured key-value store alongside expertise modules. That is an implementation choice for the learning system's storage format, not a vision-level design gap.

### Rejected-7: "Add 45% Saturation Rule" (agent-architecture N1)

**Claimed**: Multi-agent is a net negative when single-agent baseline >45%. The vision should acknowledge this.

**Why rejected**: The vision explicitly addresses this in Principle 2 ("Every phase runs. No skipping.") and the Design Decisions table locks it with override condition. The agent acknowledged this is "correct for the current quality-first mandate" and suggested it as a future optimization, not a current change. Including it in the vision would weaken Principle 2 without evidence.

### Rejected-8: "No downstream regeneration on spec edit" (tools-landscape W2)

**Claimed**: If the user edits the spec, downstream artifacts should auto-regenerate (Copilot Workspace pattern).

**Why rejected**: The vision's interaction model has exactly 2 user interaction points: Clarify and Design. The user does not edit the spec -- the spec is generated by an autonomous agent and reviewed by another. If Phase 4 REVIEW(spec) finds issues, the spec is revised and re-reviewed. There is no scenario in the current design where the user edits spec.md directly. This finding assumes an interaction model the vision explicitly rejected.

---

## Cross-Category Patterns

Five systemic themes emerge across multiple categories. These are not individual findings -- they are structural characteristics of the vision's gaps.

### Pattern 1: The vision specifies WHAT but not HOW for retrieval/indexing

Six categories independently identified that codebase understanding is the vision's biggest unspecified subsystem. The vision says "codebase indexing" and "identify affected scope" but treats the entire retrieval layer as a black box. This is unusual because the vision is extremely specific about other subsystems (prompt assembly rules, review mechanism, status protocol, DAG scheduling). The asymmetry suggests the vision author was more confident in pipeline design than in retrieval engineering. **TC-1 addresses this.**

### Pattern 2: The vision trusts LLMs for tasks where deterministic tools are strictly superior

Three categories identified that the review pipeline is LLM-only. For data flow analysis, taint tracking, call-graph traversal, known vulnerability patterns, and secrets detection, deterministic tools have zero blind spot drift and are faster, cheaper, and more reliable. The vision's reliance on LLM-only review is inconsistent with its own Principle 13 ("Self-assessment is untrustworthy") -- if agent self-assessment is untrustworthy, agent-as-reviewer assessment should also be verified by non-agent means. **TC-2 addresses this.**

### Pattern 3: The vision describes desired behavior but not enforcement mechanisms

Three categories identified that the vision says what should happen (orchestrator dispatches subagents, agents are stateless, phases run sequentially) without specifying what forces it to happen. The enforcement research is the most empirically grounded in the entire corpus -- 5 production sessions proving 40% compliance without mechanical enforcement. The vision's architecture section reads like a description of a well-run team, not a specification of a deterministic system. **TC-3 addresses this.**

### Pattern 4: Security is treated as a dimension of general review, not a first-class concern

The security report identified 7 weaknesses, more than any other category except codebase-understanding. The root cause: security appears as a single word ("security/performance") in review checklists rather than being decomposed into actionable categories (secrets, supply chain, taint analysis, IaC misconfiguration). For a pipeline that generates 100% LLM-authored code with documented 12-65% vulnerability rates, security review needs more specificity than a checklist bullet point. **TC-5 and TC-6 address the highest-severity items; the rest belong in expertise modules (D-14).**

### Pattern 5: Implementation details were frequently overclaimed as vision-level gaps

Of the 40 findings marked "critical" across 13 reports, only 7 survive as genuinely vision-level. The remaining 33 are real findings that belong in implementation specs, expertise modules, composition-map configurations, or CLI documentation. The most common overclaim pattern: agents treated specific tooling choices (Tree-sitter, Semgrep, Conventional Comments) as vision-level when the vision correctly operates at a higher abstraction level. The vision is a design spec, not an implementation manual. It should specify "AST-based structural parsing" (which only Tree-sitter satisfies), not "Tree-sitter."

---

## Final Score

### Coverage Assessment

Of the ~121 research files:

| Coverage Level | Count | % | Description |
|---------------|-------|---|-------------|
| **Directly incorporated with citations** | ~55 | 45% | Core architecture, failure modes, design constraints, prompt engineering, decomposition, review research |
| **Correctly reflected without explicit citation** | ~25 | 21% | Methodology, consulting patterns, RFC processes, status protocols |
| **Partially reflected (principle correct, detail missing)** | ~20 | 16% | Retrieval/indexing, static analysis, enforcement mechanisms, security specifics |
| **Not reflected** | ~21 | 17% | Dynamic analysis, code smells taxonomy, supply chain, secrets detection, infrastructure security, synthetic data, prompt versioning, knowledge graphs |

**Overall research coverage: ~66% adequately reflected, ~17% partially, ~17% absent.**

### Biggest Blind Spots (by impact)

1. **Codebase retrieval architecture** (TC-1) -- 6 categories flagged it. The vision's claimed moat has no specification. Highest impact because every phase depends on it.

2. **Non-LLM verification layer** (TC-2) -- 3 categories flagged it. The vision trusts LLMs for tasks where deterministic tools are proven superior. Creates a structural blind spot shared across all model families.

3. **Enforcement mechanics** (TC-3) -- 3 categories flagged it. The difference between a 40% working system and a 90%+ working system. Backed by the strongest empirical evidence in the entire research corpus (5 production sessions).

4. **Security specificity** (TC-5, TC-6) -- 100% LLM-generated code with 12-65% vulnerability rates needs more than "security/performance" as a checklist item. Secrets and supply chain are the two highest-liability gaps.

### What the Vision Gets Right

The vision is strong on the topics its author clearly understood deeply:
- Agent architecture (stateless, fresh context, file-based communication) -- unanimous validation
- Pipeline structure (8 pre-execution phases, subtask pipeline, completion pipeline) -- no competitor covers this
- Review mechanism (cross-context, cross-model, bounded rounds) -- correctly implements the research
- Decomposition (35-min cliff, vertical slices, INVEST, context window sizing) -- thoroughly grounded
- Prompt engineering (instruction budget, positional placement, operational identity) -- research-optimal
- Cost architecture (cheap before expensive, tier escalation, bounded retries) -- well-designed

The seven critical findings are additive, not corrective. The architecture is sound. The gaps are in subsystems the vision left unspecified (retrieval, enforcement mechanics) and in security concerns specific to LLM-generated code. None of the 7 findings require rethinking the architecture -- all are new sections or paragraphs added to existing sections.
