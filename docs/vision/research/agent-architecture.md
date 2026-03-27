# Agent Architecture — Research vs Vision Comparison

**Research corpus**: 8 files in `docs/research/agent-architecture/`
**Vision document**: `docs/vision/pipeline.md`
**Date**: 2026-03-25

---

## Strengths

The vision document is exceptionally well-grounded in this research category. Most of the core architectural decisions are not just consistent with the research — they are directly derived from it with cited sources.

### 1. Stateless agents with fresh contexts — perfectly aligned

The vision's "Agents Are Stateless Workers" section (lines 79-89) correctly incorporates:
- Multi-turn degradation of 39% (`agent-failure-modes.md` Section 2, `multi-agent-architectures.md`)
- Self-correction blind spot of 64.5% (`overconfidence.md`, `multi-agent-review.md` Section 1)
- Context poisoning having no fix except session death (`agentic-coding.md` Section 3 — Anthropic long-running harness: "compaction alone is insufficient")

The explicit "Design override: no same-session fixes" callout shows the vision author understood the research deeply enough to reject an earlier design that contradicted it.

### 2. Centralized orchestrator — correct architecture choice

The vision's "Orchestrator Is a State Machine" (lines 96-97) directly matches the DeepMind finding: centralized orchestrator = 4.4x error amplification (best cost/benefit), vs 17.2x for independent agents (`multi-agent-architectures.md` Section 1, `agent-failure-modes.md` Section 7). The vision correctly keeps it deterministic rather than LLM-based.

### 3. File system as communication bus — well-justified

Vision line 93 cites the 79% coordination failure stat from Cemri et al. The research (`multi-agent-architectures.md` Section 3) confirms structured artifacts > free-form chat (MetaGPT's core insight). Using files eliminates the coordination overhead that causes 515% cost for ~2% gain in hybrid dense architectures.

### 4. Planning as the intelligence, execution as mechanical — strong alignment

The vision's "Implementation Quality Principle" (lines 257-259) and Principle 3 (line 582) directly incorporate:
- MAKER finding that smaller non-reasoning models achieve best reliability-per-dollar (`planning-vs-execution.md` Section on MAKER)
- Aider's architect/editor separation showing o1-preview + DeepSeek = 85% SOTA (`planning-vs-execution.md`)
- The 38.5% completion rate even with human plans — the vision's response is to make plans so detailed that execution becomes mechanical

### 5. Cross-model review — correctly prioritized

The vision implements cross-model review at multiple points (subtask review Stage 2, lines 287-291; Final Review Passes 3-4, lines 447-478). This directly reflects:
- Heterogeneous models as "universal antidote" (`multi-agent-architectures.md`)
- Cross-family verification having the largest gains (`multi-agent-review.md` Section 3)
- Same-model review being nearly worthless — F1 24.6%, and reviewing twice makes it WORSE at 21.7% (`multi-agent-review.md` Section 1)

### 6. Concurrency ceiling of 4 — research-backed

Vision line 327 and Design Decisions table correctly set this at 4. The DeepMind finding that performance saturates at ~4 agents (`multi-agent-architectures.md` point 4) and the 45% Saturation Rule are both respected.

### 7. Explicit checklists for reviews — correct mechanism

Vision's review mechanism (lines 239-256) uses structured checklists rather than open-ended "review this" prompts. `multi-agent-review.md` Section "When Review WORKS" explicitly lists "Explicit checklists/criteria" as condition #3 for effective review, and Section "When Review FAILS" lists "No structured criteria" as failure mode #3.

### 8. Linting integration — present

Vision line 275 specifies "Linter gating on every edit." `swe-bench.md` calls this "non-negotiable" — SWE-agent showed 3.0% absolute improvement from linting rejection alone.

### 9. Structured specifications — deeply incorporated

Vision Phases 3-4 (SPECIFY and REVIEW) use Given/When/Then and EARS notation. `industry-best-practices.md` Principle 2 ("Specs Must Be Structured, Not Free-Form") and the broader research showing 40% fewer errors with structured specs (`agent-failure-modes.md` Section 6) are well-reflected.

---

## Weaknesses

### 1. Context retrieval strategy is absent

The vision describes WHAT the orchestrator dispatches (subagents) and HOW they communicate (files), but never specifies how agents retrieve codebase context. The research is emphatic on this:

- `agentic-coding.md` Synthesis Theme 2: "Context engineering > model selection. A weaker model with excellent context can outperform a stronger model with poor context."
- `agentic-coding.md` Synthesis Theme 4: Effective agents combine lexical search, semantic search, AST-based extraction, graph-based traversal, and agentic search. No single strategy is sufficient.
- Sourcegraph (Section 10): "The retrieval/context layer is often more impactful than the choice of LLM model."
- Aider (Section 8): Tree-sitter AST parsing + PageRank dependency graphs achieve 4.3-6.5% context utilization — meaning 93-96% of context would be wasted without intelligent selection.
- ContextBench (Section 12): "LLMs consistently favor recall over precision" — they retrieve more than needed. Without a structured retrieval pipeline, agents will stuff their contexts with irrelevant code.

The vision's Phase 1 DISCOVER mentions "codebase indexing" and "identify affected scope" but says nothing about the indexing technology, retrieval strategy, or how context is budgeted across agents. The Composer section (lines 109-127) mentions "context budgeting" in subtask files but not the retrieval mechanism that populates them.

### 2. The 45% Saturation Rule is not incorporated

`multi-agent-architectures.md` point 5: "Multi-agent yields negative returns when single-agent baseline >45%." This is a critical efficiency finding. The vision runs every task through the full multi-agent pipeline regardless of complexity. For simple tasks where a single agent would succeed >45% of the time, the overhead of orchestrator + composer + separate executor + separate reviewer + separate verifier is a net negative.

The vision's Principle 2 ("Every phase runs. No skipping.") directly contradicts this finding for simple tasks.

### 3. Observation masking vs summarization — not addressed

`agentic-coding.md` Section 11 (JetBrains): observation masking outperforms LLM summarization for context management, cutting costs by 50%+ without hurting performance. The vision mentions neither strategy. Since agents are stateless and die after one job, this matters less for individual agents, but the orchestrator's context grows over a long run (reading summaries from many subagents). The vision has no explicit strategy for managing orchestrator context growth.

### 4. The "Wait" prompt finding is dismissed too quickly

`multi-agent-review.md` Section 1 notes the "Wait" prompt reduces blind spots by 89.3% — it's a "dormant capability." The vision (line 89) rejects same-session fixes entirely. The research supports that rejection for multi-turn fix loops, but the "Wait" technique is different: it's a single-turn prompt intervention that activates latent self-checking. This could be incorporated into the Composer's prompt assembly as a final "review your output before returning" instruction, without requiring multi-turn interaction.

### 5. Sample-and-select (voting) is underused

`swe-bench.md` Principle 3: "Sample-and-select beats single-shot." `overconfidence.md` lists self-consistency (+17.9% GSM8K) and multi-model verification (precision 94.1% -> 97.7%). `planning-vs-execution.md` MAKER section: k=3 voting drops error from 1% to 0.0001%.

The vision mentions MAKER but only uses voting implicitly (cross-model review). For critical decisions — model routing, failure escalation, concern resolution — the vision relies on single-agent judgment. The planning phase, which the vision correctly identifies as the highest-value phase, generates exactly one plan. Sampling 3 plans and selecting the best would directly apply the MAKER finding.

### 6. Localization is not treated as a first-class problem

`swe-bench.md` Principle 1: "Localization is the bottleneck, not generation." The Agentless approach's entire success comes from hierarchical localization (file -> class/function -> edit location). AutoCodeRover uses AST-based spectrum fault localization to achieve 46.2% at <$0.70.

The vision's DISCOVER phase mentions "identify affected scope" but doesn't describe a localization pipeline. During execution, the subtask.md contains a "Context budget" with READ FULL/READ SECTION/KNOW EXISTS, which suggests localization happens during planning. But the mechanism for accurate localization — how the planner determines which files and line ranges matter — is unspecified.

### 7. Interface design is not discussed

`swe-bench.md`: "3.3x improvement from interface design alone (not model improvement)." `agentic-coding.md` Section 5 (SWE-agent): "The quality of the interface matters more than model scale." Mini-SWE-Agent achieves >74% in 100 lines because of ACI design.

The vision specifies that agents use "tool calls (structured edit tools)" (line 275) but doesn't discuss what those tools look like, how file viewing works, or how the Agent-Computer Interface is designed. The Composer section discusses prompt assembly but not tool design.

### 8. Model convergence warning not acknowledged

`multi-agent-review.md` Section 3: "Warning: model mistakes are becoming more correlated as frontier models converge." The vision relies heavily on cross-model review as a structural defense (Passes 3-4 of Final Review, subtask cross-model review). If frontier models are converging in their error patterns, this defense weakens over time. The vision has no mitigation for this trend.

---

## Critical to Edit

### C1. Add a context retrieval architecture section

**Research finding**: Context engineering matters more than model selection (Sourcegraph, Aider, JetBrains, Anthropic — 4 independent sources in `agentic-coding.md`). Multi-strategy retrieval (lexical + semantic + AST + graph) is required for effective context selection (`agentic-coding.md` Theme 4). Agents without structured retrieval waste 93-96% of their context window on irrelevant code (Aider's 4.3-6.5% utilization metric).

**Why critical**: The vision's Composer assembles prompts with a ~150-200 instruction budget and context budgets per subtask. But it never specifies how the right context is found. If agents get the wrong files, all downstream work is poisoned. `swe-bench.md` failure taxonomy: "Localization failures: principal mode across all approaches." The pipeline could produce perfect specs, perfect plans, and still fail because the executor reads the wrong code.

**Suggested edit**: Add a new subsection under "Architecture" (after "The Composer", around line 127) titled "Context Retrieval Pipeline." Specify:
1. Indexing strategy (AST-based with Tree-sitter for structural understanding + embedding-based for semantic search)
2. Retrieval pipeline (query understanding -> multi-strategy retrieval -> re-ranking -> budget-constrained assembly)
3. That the DISCOVER phase builds/refreshes the index, the PLAN phase uses it to set context budgets, and the Composer uses it to populate agent contexts
4. Observation masking as the context management strategy for the orchestrator

### C2. Add sample-and-select for the PLAN phase

**Research finding**: MAKER's k=3 voting drops error from 1% to 0.0001% (`planning-vs-execution.md`). Self-consistency with multiple samples gives +17.9% on reasoning tasks (`overconfidence.md`). Agentless samples multiple candidate patches and selects the best (`swe-bench.md`, `agentic-coding.md` Section 7).

**Why critical**: The vision correctly identifies planning as the highest-value phase ("The plan IS the intelligence. Execution IS mechanical." — Principle 3). Yet it generates exactly one plan with one planner. A single planning failure cascades to every downstream subtask. The compound reliability math (85% per step, 10 steps = 20% total) that the vision uses to justify decomposition applies equally to the plan itself. One plan = one sample = single point of failure at the most critical phase.

**Suggested edit**: In Phase 7: PLAN (line 202), add: "Generate 2-3 candidate plans from independent planning agents (fresh context each). Evaluate against spec alignment, decomposition quality, and parallelism opportunity. Select the best or synthesize. This applies the MAKER k=3 voting principle at the phase where it has the highest leverage."

### C3. Define the Agent-Computer Interface

**Research finding**: SWE-agent showed 3.3x improvement from interface design alone — not model improvement (`swe-bench.md`). Mini-SWE-Agent at 100 lines achieves >74% because of ACI design, not model capability (`agentic-coding.md` Section 5). Tool design is as important as prompt design.

**Why critical**: The vision's Composer section carefully designs prompt assembly (instruction budget, placement, positive framing, operational identity). But the tool side — what file viewing, editing, searching, and testing tools look like to the agent — is unspecified. The Composer produces a "complete agent config ready for dispatch" but that config's tool definitions are invisible. If agents get a raw `write_file` tool instead of an edit-with-diff-preview tool, a 3.3x performance gap opens up. This is the same magnitude as switching model generations.

**Suggested edit**: Add a subsection under "The Composer" or as a new Architecture section titled "Agent-Computer Interface." Specify:
1. File viewing: windowed viewer with search and context display (not dump-entire-file)
2. Editing: structured edit with before/after diff preview + immediate linting feedback
3. Navigation: repository-level search (grep, semantic, AST-aware)
4. Testing: integrated test execution with output capture
5. Reference SWE-agent's ACI as the research basis for these design choices

---

## Nice to Have

### N1. Incorporate the 45% Saturation Rule as a future optimization

The vision's "Every phase runs" principle is correct for the current quality-first mandate. But `multi-agent-architectures.md` point 5 shows multi-agent is a net negative when single-agent baseline >45%. Once the pipeline has learning data showing which task types consistently succeed at subtask level, a "fast path" that skips the full orchestrator pipeline for trivially simple subtasks would reduce cost without reducing quality. This contradicts Principle 2, so it should be framed as a future optimization gated on empirical evidence, not a current change.

**Suggested edit**: Add to "Design Decisions (Do Not Revisit Without Evidence)" table: "Full pipeline for all tasks | Quality-first, no shortcuts | Learning data showing >45% single-agent success rate for a task category, with no quality regression on fast-path runs"

### N2. Add the "Wait" prompt technique to Composer prompt assembly

`multi-agent-review.md`: the "Wait" prompt reduces blind spots by 89.3%. This is a zero-cost intervention — a single instruction appended to the agent's prompt asking it to pause and re-examine its output before returning. It doesn't require multi-turn interaction (which the vision correctly rejects).

**Suggested edit**: In "Prompt assembly rules" (line 121), add: "End-of-task self-check instruction ('Before returning, re-examine your output against the acceptance criteria — flag anything uncertain'). Research shows this activates a dormant self-checking capability (89.3% blind spot reduction) without requiring multi-turn interaction."

### N3. Acknowledge model convergence risk

`multi-agent-review.md` Section 3 warns that frontier model mistakes are becoming more correlated. The vision's cross-model review defense assumes models have different blind spots. If this trend continues, the defense weakens.

**Suggested edit**: Add a note to the "Cross-Model Independent Review" section (around line 447): "Risk: frontier model error patterns are converging (Lu et al.). If cross-model review effectiveness degrades, the mitigation is to include a non-frontier model (e.g., open-source) as a third reviewer — complementary knowledge matters more than raw capability (`multi-agent-review.md` Section 4: 'GPT-2 can supervise GPT-4 to GPT-3.5 level')."

### N4. Add debate/adversarial patterns for design decisions

`multi-agent-review.md` Section 5: debate achieves 76% accuracy for non-expert models (vs 48% naive) and 88% for non-expert humans (vs 60% naive). The vision's DESIGN phase (Phase 5) presents 2-3 options to the user, but the options are generated by a single agent. Having two agents debate the design alternatives would surface trade-offs more reliably.

### N5. Reference Agentless as a validation of the pipeline-over-autonomy approach

`agentic-coding.md` Section 7, `swe-bench.md`: Agentless achieves 32% on SWE-bench Lite at $0.70 with NO agent loop — just a 3-phase deterministic pipeline. This directly validates Wazir's core architectural bet: structured pipeline > autonomous agents. The vision's "Research Basis" section could cite this as supporting evidence.

### N6. Add cost-cutting context management for orchestrator

`agentic-coding.md` Section 11 (JetBrains): observation masking cuts costs by 50%+ without performance loss. The orchestrator reads summaries from many subagents over a long run. Applying observation masking (dropping older subagent summaries that are no longer routing-relevant) would keep the orchestrator lean. Since the full artifacts are on disk anyway, the orchestrator can always re-read if needed.

---

## Improvements

### I1. New section: "Context Retrieval Pipeline" under Architecture

**Where**: After "The Composer" section, around line 127.

**What to add**:
```
### Context Retrieval Pipeline

Agents need the right code in their context, not all the code. The retrieval layer matters more than model selection (Sourcegraph, Aider, Anthropic — independently confirmed).

The index is built/refreshed in DISCOVER (Phase 1) and used by PLAN (Phase 7) for context budgets and by the Composer for context population.

**Indexing**: AST-based (Tree-sitter) for structural understanding (definitions, references, dependency graphs) + embedding-based for semantic search. Aider's approach: PageRank on dependency graphs to identify structurally important code.

**Retrieval per agent**: Multi-strategy — lexical for exact references, semantic for conceptual relevance, graph-based for dependency chains. Re-rank and assemble within the agent's context budget.

**Orchestrator context management**: Observation masking — older subagent summaries that are no longer routing-relevant are dropped. Full artifacts remain on disk.
```

**Why**: The vision has a gap between "the subtask file specifies a context budget" and "the agent gets the right context." The retrieval pipeline is the bridge. Without it, context budgets are aspirational, not operational.

### I2. Sample-and-select in Phase 7: PLAN

**Where**: Phase 7: PLAN section, after line 233.

**What to add**: "Generate 2-3 candidate plans from independent planning agents (fresh context each). Select via structured comparison against: spec alignment, decomposition granularity, parallelism opportunity, and file dependency complexity. This applies MAKER's k=3 voting at the highest-leverage phase."

**Why**: Planning is the single highest-value phase. Single-sample planning is a single point of failure. The MAKER finding (k=3 voting drops error from 1% to 0.0001%) is the strongest statistical argument in the entire research corpus, and the vision currently applies it nowhere. Cite: `planning-vs-execution.md` MAKER section, `overconfidence.md` self-consistency finding.

### I3. New section: "Agent-Computer Interface" under Architecture

**Where**: After "The Composer" or after the proposed "Context Retrieval Pipeline" section.

**What to add**:
```
### Agent-Computer Interface

Interface design produces 3.3x improvement independent of model capability (SWE-agent, NeurIPS 2024). The tools agents use are as important as the prompts they receive.

Standard ACI for all coding agents:
1. **File viewer**: windowed with search, scroll, and surrounding context display (not full-file dumps)
2. **Editor**: structured edit with before/after diff preview + immediate linting feedback (linting rejection = 3.0% absolute improvement, non-negotiable)
3. **Navigator**: repository-level search (lexical, semantic, AST-aware)
4. **Tester**: integrated test execution with structured output capture
5. **Git**: micro-commit capability with rollback support

The Composer includes ACI tool definitions in every agent config. Tool definitions count against the ~150-200 instruction budget.
```

**Why**: The vision specifies "structured edit tools" and "linter gating" in one line (275) but never defines the full tool interface. SWE-agent's 3.3x improvement from interface design alone is one of the largest single-factor effects in the research. Cite: `swe-bench.md` Section on SWE-agent, `agentic-coding.md` Section 5.

### I4. Add to Design Decisions table: future fast-path consideration

**Where**: Design Decisions table, after the last row.

**What to add**:

| Full pipeline for all tasks | Quality-first: no shortcuts until pipeline proves itself | Learning data showing consistent >45% single-agent success for a task category (DeepMind 45% Saturation Rule) with zero quality regression on simplified runs |

**Why**: Acknowledges the research finding without weakening the current "every phase runs" principle. The override condition is specific and measurable. Cite: `multi-agent-architectures.md` point 5.

### I5. Add "Wait" self-check to Composer prompt assembly rules

**Where**: "Prompt assembly rules" section, after line 126.

**What to add**: "- End-of-task self-check: 'Before returning, re-examine your output against the acceptance criteria and flag anything uncertain.' Activates dormant self-checking (89.3% blind spot reduction) without requiring multi-turn interaction."

**Why**: Zero-cost intervention. Does not contradict the "no same-session fixes" principle because it's a single-turn prompt instruction, not a multi-turn loop. Cite: `multi-agent-review.md` Section 1.

### I6. Add model convergence risk note to Cross-Model Review sections

**Where**: Pass 3 description (line 447) and/or Design Decisions table.

**What to add**: "Risk: frontier model error patterns are converging over time (Lu et al.). Mitigation: periodically include a non-frontier or open-source model as reviewer — complementary knowledge matters more than raw capability (GPT-2 can supervise GPT-4 to GPT-3.5 level)."

**Why**: The vision's heaviest defensive mechanism (4-pass final review with cross-model passes) assumes model diversity. If that assumption erodes, the defense erodes. A single sentence acknowledges the risk and names the mitigation. Cite: `multi-agent-review.md` Sections 3-4.

---

## Summary Assessment

The vision is strong on agent architecture. The core decisions — stateless agents, centralized deterministic orchestrator, file-based communication, fresh contexts, cross-model review, structured checklists, planning-as-intelligence — are all directly supported by the research with specific citations.

The three critical gaps are operational, not architectural: (1) the context retrieval mechanism is unspecified, (2) the highest-value phase (planning) uses single-sample generation instead of sample-and-select, and (3) the agent-computer interface is mentioned but not designed. All three have strong research showing they produce large, measurable improvements (context retrieval > model selection; k=3 voting drops error by orders of magnitude; ACI design = 3.3x improvement).

None of these gaps invalidate the architecture. They are holes in an otherwise research-grounded design that need filling before implementation.
