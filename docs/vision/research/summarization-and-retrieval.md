# Summarization and Retrieval — Research vs Vision Comparison

Research corpus: 6 files, 86 sources total across `docs/research/summarization-and-retrieval/`
Vision document: `docs/vision/pipeline.md`

---

## Strengths

### 1. Stateless agents with fresh context — perfectly aligned with compression research

The vision's core architectural decision ("Every agent is born, does one job, writes output to disk, and dies") is the single best mitigation for context rot. The JetBrains research (information-summarization Source 6) found that observation masking halved costs without degrading performance — and Wazir's agent-per-stage model is the extreme version of this: you don't mask old observations, you never accumulate them in the first place. The vision cites Laban et al. (39% multi-turn degradation) and context poisoning research as justification. The research corpus validates this completely.

**Research**: information-summarization Sources 6, 11 (JetBrains, Zylos)
**Vision**: "Agents Are Stateless Workers" section, lines 79-89

### 2. File system as communication bus — eliminates the summarization-loss problem

The vision's file-based communication (line 93) means downstream agents read full artifacts from disk rather than receiving summarized context. This sidesteps the core finding from information-summarization Source 4 (Context-Aware Hierarchical Merging) that recursive merging amplifies hallucinations. When Agent B reads Agent A's full output file, there is zero information loss. The orchestrator routes on ~200-token summaries (line 104), but agents that need depth read the originals.

**Research**: information-summarization Source 4 (Ou & Lapata, ACL 2025 — hallucination amplification in hierarchical merging)
**Vision**: "The File System Is the Communication Bus" section, "The Subagent Contract" section

### 3. Orchestrator routes on summaries, agents read full artifacts — correct two-tier architecture

The subagent contract (line 99-105) implements the exact pattern Factory AI recommends (information-summarization Source 7): structured summaries for routing decisions, full content for actual work. The ~200-token summary budget is tight enough to prevent context pollution in the orchestrator while preserving decision-relevant information.

**Research**: information-summarization Source 7 (Factory AI anchored iterative summarization)
**Vision**: "The Subagent Contract" section, lines 99-105

### 4. Handover documents for session boundaries — addresses the session resumption problem

The vision's handover mechanism (lines 358-361, 526-531) that produces `handover-batch-N.md` with completed/remaining subtasks, concerns, learnings, environment state, and a ~500-token resume prompt addresses the cross-session memory problem identified by Mem0 (information-summarization Source 9) and Letta (Source 15). The vision correctly identifies that handover needs structured fields, not free-form narrative.

**Research**: information-summarization Sources 9, 15 (Mem0, Letta)
**Vision**: "Batch Execution and Session Handover" section, "Mode 2: Run Incomplete" section

### 5. Tree-sitter for codebase indexing — matches the research consensus

The vision references codebase indexing in Phase 1 DISCOVER (line 158). The research corpus is unanimous: tree-sitter + AST-based parsing is the gold standard for code chunking (chunking-strategies Sources 1, 10, 12; rag-for-code Sources 5, 6; hierarchical-summaries Sources 1, 2, 11; code-summarization Source 9). The vision doesn't specify the tool, but the research corpus provides clear direction.

**Research**: Multiple sources across all 6 files
**Vision**: Phase 1 DISCOVER, line 158-162

---

## Weaknesses

### 1. No specification of HOW codebase indexing works

The vision mentions "Codebase indexing (or refresh)" as Agent 2's job in DISCOVER (line 158) but says nothing about the indexing strategy. The research corpus provides extensive, specific guidance:

- **Chunking**: AST-based via tree-sitter is non-negotiable (chunking-strategies Source 1: +4.3 Recall@5, +2.67 Pass@1 vs line-based). Fixed-size chunking demonstrably destroys code semantics.
- **Retrieval**: Hybrid BM25 + vector search is required (rag-for-code Sources 3, 15: 15-30% recall improvement over either alone). Every production system (Cursor, Sourcegraph, WeChat) uses hybrid.
- **Summarization levels**: L1 (function) -> L2 (file) -> L3 (package) -> L4 (repo) hierarchy (hierarchical-summaries synthesis). Bottom-up summarization, top-down retrieval.
- **Embedding models**: Code-specific models outperform general-purpose by 14-17% (rag-for-code Source 7: voyage-code-3).
- **Reranking**: Two-stage retrieve-then-rerank is standard (rag-for-code Source 11: BM25+vector top-20, cross-encoder rerank to top-5).

The vision leaves this entirely unspecified. This is a gap, not a flaw — the indexing strategy is an implementation detail — but given that the indexing is Wazir's stated "moat" (line 166), the absence of any design constraints is notable.

**Research**: chunking-strategies synthesis, rag-for-code synthesis, hierarchical-summaries synthesis
**Vision**: Phase 1 DISCOVER, line 158 (one line)

### 2. No structured summary schema for phase-to-phase handoffs

The vision specifies that subagents return ~200-token summaries to the orchestrator (line 103) but doesn't define what those summaries must contain. Factory AI's research (information-summarization Source 7) proved that dedicated sections in summaries (intent, file modifications, decisions made, next steps) prevent silent information loss. Without a mandatory schema, summaries become free-form and unreliable.

The vision defines structured output for status.json (line 279: "Constrained decoding required"), proving it understands the value of schemas. But the same principle isn't applied to summaries.

**Research**: information-summarization Source 7 (Factory AI: "Dedicated sections act as a checklist — the summarizer cannot silently drop file paths or skip decisions")
**Vision**: "The Subagent Contract" section, line 103 — specifies token budget but not structure

### 3. No tiered context retention policy

The research identifies that different information types deserve different compression strategies (information-summarization Source 16, Maxim):
- System prompts / role contracts: always retained verbatim
- Tool outputs: aggressively compressed
- Decisions and rationale: preserved with moderate compression
- File paths and artifact references: never compressed (Factory Source 7 probe-based evaluation shows these are the highest-value tokens)

The vision doesn't distinguish between types of information when discussing what the orchestrator retains or what summaries capture. It treats all information uniformly.

**Research**: information-summarization Source 16 (Maxim — tiered context management)
**Vision**: No corresponding section

### 4. No mention of the knowledge-to-code ratio problem

Codified Context research (hierarchical-summaries Source 9) found that a 108,000-line system required ~26,200 lines of structured context documentation (24.2% ratio) for AI agents to work effectively. This was organized into three tiers: hot memory (always loaded, 0.6%), specialist agents (invoked per task, 8.6%), and cold memory (on-demand, 15.0%).

The vision's composition-map.yaml and expertise modules are structurally similar to this three-tier model, but the vision doesn't acknowledge the scale of context documentation needed or plan for it. If Wazir targets real-world codebases of 50K-100K+ lines, the expertise module corpus will need to be substantial.

**Research**: hierarchical-summaries Source 9 (Codified Context: 24.2% knowledge-to-code ratio)
**Vision**: "The Composer" section, lines 109-127

### 5. No evaluation framework for summary quality

The research is emphatic: traditional metrics (BLEU, ROUGE, embedding similarity) do not predict real-world usefulness of summaries (code-summarization Sources 8, 13; information-summarization Source 7). Factory AI developed a probe-based evaluation with four types: Recall (factual retention), Artifact (file tracking), Continuation (task planning), Decision (reasoning chain). BooookScore (information-summarization Source 14) identified 8 coherence error types.

The vision has no mechanism for evaluating whether the summaries agents return to the orchestrator are actually useful for routing decisions. The learning system (Stage 8, line 483) collects signals but doesn't measure summary quality specifically.

**Research**: information-summarization Source 7 (Factory AI probes), Source 14 (BooookScore), code-summarization Source 8 (human study)
**Vision**: Stage 8 Apply Learning — no summary quality dimension

### 6. The "observation masking beats summarization" finding is unaddressed

JetBrains research (information-summarization Source 6, hierarchical-summaries Source 15) found that simple observation masking often matched or slightly beat LLM summarization for coding agent tasks. Both approaches halved costs. A hybrid combining both achieved 7-11% additional cost reduction.

The vision uses fresh agents (effectively total observation masking between stages) but doesn't consider within-stage context management. An executor working on a subtask accumulates tool outputs over its lifetime. The vision sets max_steps (line 277) as a hard limit but doesn't specify whether tool outputs within a single agent session should be masked or compressed.

**Research**: information-summarization Source 6 (JetBrains), hierarchical-summaries Source 15 (JetBrains)
**Vision**: No within-stage context management specification

---

## Critical to Edit

### C1. Define a mandatory structured schema for subagent summaries

**Research finding**: Factory AI (information-summarization Source 7) proved that structured summaries with mandatory sections prevent silent information loss. Their anchored summaries with explicit sections (session intent, file modifications, decisions made, next steps) scored 0.35 points higher than OpenAI and 0.26 higher than Anthropic on functional evaluation probes. The key insight: "Dedicated sections act as a checklist — the summarizer cannot silently drop file paths or skip decisions. Each section must be populated or explicitly left empty."

**Why it's critical**: The ~200-token summary is the ONLY information the orchestrator uses for routing decisions (line 103-105). If a summary silently drops a file path or a decision, the orchestrator routes incorrectly, and downstream agents operate on incomplete information. The current vision specifies token budget but not structure — this is equivalent to accepting free-form status reports instead of structured status.json (which the vision correctly rejects for executor status, line 279).

**Suggested edit to vision**: Add to "The Subagent Contract" section (after line 105):

> **Summary schema (constrained decoding required):**
> Every subagent summary follows a structured schema with mandatory fields. The orchestrator uses constrained decoding to enforce the schema at generation time, matching the principle applied to status.json.
>
> Fields: `status` (enum), `output_artifact` (file path), `key_decisions` (list, max 3), `files_modified` (list), `open_questions` (list), `blocking_issues` (list, may be empty), `downstream_impact` (string, max 50 tokens).
>
> This is a research-mandated decision: Factory AI's probe-based evaluation proved that structured summaries with mandatory sections prevent the silent information loss that free-form summaries allow.

### C2. Specify hybrid retrieval for codebase indexing in DISCOVER

**Research finding**: Every production code RAG system and every empirical study confirms hybrid BM25 + vector retrieval outperforms either alone by 15-30% recall (rag-for-code Sources 3, 15). AST-based chunking via tree-sitter improves retrieval Recall@5 by 4.3 points and generation Pass@1 by 2.67 points vs line-based (chunking-strategies Source 1). The WeChat industrial study (rag-for-code Source 3) validated this at scale on 1,669 repositories.

**Why it's critical**: The vision calls codebase understanding Wazir's "moat" (line 166) and DISCOVER its differentiator. But the indexing agent (line 158) has no design constraints whatsoever. An implementor could reasonably build a grep-based indexer or a pure embedding search — both would be significantly inferior. The research provides clear, converging guidance that should be locked in as design constraints, not left as implementation choices.

**Suggested edit to vision**: Expand Phase 1 DISCOVER, Agent 2 description:

> - Agent 2: Codebase indexing (or refresh)
>   - **Chunking**: AST-based via tree-sitter. Chunks aligned to syntactic units (functions, classes, methods). Max chunk size 512-1024 tokens with AST boundaries as primary split points. Fixed-size chunking is prohibited — research shows it destroys code semantics.
>   - **Retrieval**: Hybrid BM25 (keyword) + vector (semantic) with reciprocal rank fusion. Neither alone is sufficient — code requires exact identifier matching (BM25) AND semantic similarity (vectors). 15-30% recall improvement over single-method.
>   - **Summaries**: Hierarchical L1-L4 (function -> file -> package -> repo). Built bottom-up, retrieved top-down.
>   - **Reranking**: Two-stage pipeline — fast hybrid retrieval (top-20), cross-encoder rerank (top-5 to agent).

### C3. Add memory formation to the learning system

**Research finding**: Mem0 (information-summarization Source 9) demonstrated that memory formation (selective fact extraction) cuts token costs by 80-90% while improving response quality by 26% compared to basic compression/summarization. The key distinction: instead of compressing everything, identify specific facts, preferences, and patterns worth remembering. Letta (Source 15) implements a three-tier architecture: core memory (in-context blocks), archival memory (semantic search), recall memory (conversation history search).

**Why it's critical**: The learning system (Stage 8, lines 483-505) proposes expertise updates but doesn't persist structured project-level memories across runs. The handover document (lines 526-531) covers session continuity, but there is no mechanism for the system to remember: "This codebase uses a custom ORM — don't use the standard pattern" or "The user rejected approach B in run 3 for reason X." Without cross-run memory formation, each run starts from zero project knowledge except what's in the expertise modules and handover docs.

**Suggested edit to vision**: Add a new subsection under Stage 8 Apply Learning:

> **Memory formation (cross-run project memory):**
> Beyond expertise proposals, the learning agent extracts structured facts from the run:
> - **Project facts**: codebase conventions, architectural patterns, technology choices discovered during execution
> - **User preferences**: design decisions, rejected approaches with rationale, stated constraints
> - **Pattern library**: recurring code patterns specific to this project
>
> These are stored as structured records in the project's state directory, not as compressed summaries of the full run. Downstream DISCOVER phases query these records via semantic search. This is research-mandated: Mem0 showed 80-90% token cost reduction with 26% quality improvement by storing facts rather than compressing conversations.

---

## Nice to Have

### N1. Progressive summarization for phase reports

Tiago Forte's progressive summarization (information-summarization Source 10) suggests that each pipeline phase could add a layer of compression rather than re-summarizing from scratch: full output (L0) -> key excerpts (L1) -> critical decisions (L2) -> compressed findings (L3) -> executive summary (L4). This maps naturally to the pipeline's progressive refinement but adds no capability the current design lacks — it's an optimization of how summaries are constructed within the existing architecture.

### N2. Chain of Density for the execution summary

Chain of Density prompting (information-summarization Source 1) produces summaries that are information-dense without being unreadable, by iteratively incorporating missing entities without increasing length. The final `execution-summary.md` (lines 513-521) would benefit from this technique to ensure the user gets maximum information in minimum reading time. Not blocking — the current structure with specific fields already ensures coverage.

### N3. Code graph / knowledge graph for structural queries

Code-Graph-RAG (rag-for-code Source 12) and GraphGen4Code (keyword-extraction Source 11) demonstrate that knowledge graphs capture call relationships, inheritance hierarchies, and dependency structures that vector search cannot represent. The DISCOVER phase could build a lightweight graph for structural queries ("What calls this function?" "What implements this interface?"). This complements the hybrid search in C2 but isn't required for basic operation.

### N4. Late chunking for embedding quality

Weaviate research (chunking-strategies Source 5) describes late chunking: embed the full document first to get context-aware token embeddings, then split into chunks. Each chunk's embedding retains document-wide context, solving the anaphoric reference problem. This would improve embedding quality for codebase indexing but adds complexity to the indexing pipeline.

### N5. ACON failure-driven compression optimization

Microsoft's ACON (information-summarization Source 8) demonstrates that compression guidelines can be automatically improved by analyzing cases where compressed context caused downstream failures. Wazir's self-audit cycle could apply this: when a downstream phase fails due to missing context, trace back to the summary that lost the information and refine the summary schema. This is an enhancement to the learning system, not a structural change.

### N6. Explicit developer-expectation grounding for code summaries

ExpSum research (code-summarization Source 5) found 57.4% of state-of-the-art code summaries are rejected by developers. Developers want function categorization, domain terminology, and avoidance of implementation details — not what models naturally optimize for. Wazir's code summarization prompts should include constraint-driven instructions specifying "what/why, not how" and using project-specific vocabulary. This is a prompt engineering detail, not a structural gap.

---

## Improvements

### I1. Add structured summary schema to "The Subagent Contract"

**Section**: "The Subagent Contract" (lines 99-105)
**Change**: Add a mandatory summary schema with constrained decoding, specifying fields for status, output artifact path, key decisions, files modified, open questions, blocking issues, and downstream impact.
**Why**: Factory AI research (information-summarization Source 7) proved structured summaries prevent silent information loss. The vision already mandates constrained decoding for status.json — the same principle applies to summaries. (See C1 for full suggested text.)

### I2. Expand DISCOVER Agent 2 with indexing design constraints

**Section**: Phase 1 DISCOVER (lines 157-162)
**Change**: Add specifications for AST-based chunking (tree-sitter), hybrid BM25+vector retrieval, hierarchical L1-L4 summaries, and two-stage reranking.
**Why**: The research corpus converges unanimously on these techniques. Leaving indexing unspecified when it's called Wazir's "moat" is an oversight. (See C2 for full suggested text.)

### I3. Add memory formation subsection to Stage 8 Apply Learning

**Section**: Stage 8 Apply Learning (lines 483-505)
**Change**: Add a "Memory formation" subsection for extracting and storing structured project facts, user preferences, and patterns across runs.
**Why**: Mem0 research (information-summarization Source 9) shows 80-90% cost reduction with 26% quality improvement from fact extraction vs blanket compression. (See C3 for full suggested text.)

### I4. Add within-stage context management to executor specification

**Section**: Stage 1 Execute (lines 272-282)
**Change**: Add after the "Hard limits" paragraph: "**Within-stage context management**: Tool outputs from earlier steps within a single executor session are masked (hidden but recoverable) rather than LLM-summarized. Research shows observation masking matches or slightly beats LLM summarization for coding tasks while halving costs (JetBrains, NeurIPS 2025). The executor sees its subtask brief + current file state + most recent tool output. Prior tool outputs are available via explicit recall if needed."
**Why**: JetBrains research (information-summarization Source 6, hierarchical-summaries Source 15) found observation masking matched LLM summarization. The vision's max_steps limit is necessary but insufficient — an executor with 20 tool calls before hitting max_steps will accumulate significant context. Masking keeps it clean. Citing: hierarchical-summaries Source 15.

### I5. Add tiered retention policy to orchestrator state management

**Section**: State Management (lines 139-145)
**Change**: Add: "**Tiered retention for orchestrator context**: Not all information the orchestrator handles has equal value. System prompts and role contracts are retained verbatim. File paths and artifact references are never compressed. Tool output summaries are aggressively compressed. Decision rationale is preserved at moderate compression. This tiered approach is research-supported (Maxim 2025) and prevents the orchestrator's context from being dominated by low-value verbose tool outputs."
**Why**: The research (information-summarization Source 16) shows that tiered retention policies outperform uniform treatment. The orchestrator is the longest-lived entity in the pipeline — it needs the most disciplined context management.

### I6. Add summary quality dimension to the learning system

**Section**: Stage 8 Apply Learning, "What it does" list (lines 493-498)
**Change**: Add item 6: "**Summary quality audit**: Did any orchestrator routing decision fail because a summary missed critical information? Map routing errors to summary gaps. If a pattern emerges (e.g., file paths consistently dropped), refine the summary schema. Evaluate using probe-based methods: can the summary answer factual recall, artifact tracking, continuation planning, and decision reasoning questions? (Factory AI 2025)"
**Why**: Factory AI's probe-based evaluation (information-summarization Source 7) outperforms ROUGE/embedding similarity for measuring functional quality of summaries. Without measuring summary quality, the learning system cannot detect whether summaries are a failure point. Citing: information-summarization Sources 7, 14.
