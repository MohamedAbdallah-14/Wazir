# 14 - Information Summarization for AI Agents

> Research date: 2026-03-25
> Scope: Hierarchical summarization, multi-document summarization, map-reduce patterns, chain of density, progressive summarization, extractive vs abstractive, context compression for agents, tools and frameworks.

---

## Source 1: Chain of Density Prompting — Adams et al. (arXiv, 2023)

**URL:** https://arxiv.org/abs/2309.04269

- **What it is:** "From Sparse to Dense: GPT-4 Summarization with Chain of Density Prompting" by Griffin Adams, Alexander Fabbri, Faisal Ladhak, Eric Lehman, and Noemie Elhadad. Published at the 4th New Frontiers in Summarization Workshop (ACL 2023).
- **Core technique:** GPT-4 generates an initial entity-sparse summary, then iteratively incorporates 1-3 missing salient entities per step *without increasing the summary length*. Each step forces compression and fusion to make room for new entities.
- **Key results:**
  - CoD summaries are more abstractive, exhibit more fusion, and have less lead bias than vanilla GPT-4 summaries.
  - Human preference study on 100 CNN DailyMail articles: humans prefer summaries denser than vanilla prompts and almost as dense as human-written summaries.
  - There exists a clear tradeoff between informativeness and readability — overly dense summaries become hard to follow.
- **Practical implication:** CoD is a prompt-only technique (no fine-tuning) that can be applied to any LLM. It provides a principled way to control information density. Useful for Wazir when summarizing review findings or phase reports where both completeness and readability matter.
- **Dataset:** 500 annotated + 5,000 unannotated CoD summaries on HuggingFace (`griffin/chain_of_density`).

---

## Source 2: Anthropic — Monitoring Computer Use via Hierarchical Summarization (2025)

**URL:** https://alignment.anthropic.com/2025/summarization-for-monitoring/

- **What it is:** Anthropic Safeguards Research Team's approach to monitoring AI computer use capabilities at scale, published February 2025.
- **Two-stage pipeline:**
  1. **Interaction summarization:** Compacts variable-length prompt-completion pairs into structured summaries with fields for task description, tools used, outcomes, and safety-relevant observations.
  2. **Usage summarization:** Aggregates interaction summaries into higher-level usage patterns describing broader behaviors across many interactions.
- **Key insight — aggregate harm detection:** Individual interactions may appear benign (clicking a button) but aggregate patterns reveal harm (click farms). Hierarchical summarization enables reasoning across interactions that individual classifiers cannot.
- **Discovery of unanticipated harms:** The monitoring system is prompted with a specification of potential harms but instructed to flag overtly harmful usage even outside the spec. Successfully flagged attempts to purchase explosive precursors — a harm not explicitly in the specification.
- **Relevance to Wazir:** This is a direct precedent for using hierarchical summarization in an engineering OS. Phase reports, self-audit findings, and compliance checks can all benefit from two-stage summarization: summarize individual checks, then summarize the summaries to detect patterns.

---

## Source 3: NexusSum — Hierarchical LLM Agents for Long-Form Narrative Summarization (ACL 2025)

**URL:** https://arxiv.org/abs/2505.24575

- **What it is:** Multi-agent LLM framework by Hyuntak Kim and Byung-Hak Kim, accepted to ACL 2025 main track.
- **Two key innovations:**
  1. **Dialogue-to-Description Transformation:** Standardizes character dialogue and descriptive text into a unified format, improving coherence.
  2. **Hierarchical Multi-LLM Summarization:** Structured pipeline that optimizes chunk processing and controls output length.
- **Results:** Up to 30% absolute gain in BERTScore (F1) across books, movies, and TV scripts over baselines.
- **No fine-tuning required:** Works via prompting and pipeline orchestration alone.
- **Relevance:** Demonstrates that multi-agent hierarchical pipelines significantly outperform single-pass summarization for long-form content. Applicable to Wazir's multi-phase pipeline where different agents could handle different summarization stages.

---

## Source 4: Context-Aware Hierarchical Merging for Long Document Summarization (ACL 2025 Findings)

**URL:** https://arxiv.org/abs/2502.00977

- **What it is:** Paper by Litu Ou and Mirella Lapata addressing hallucination amplification in hierarchical merging.
- **Core problem:** Recursive merging of chunk summaries amplifies LLM hallucinations, increasing factual inaccuracies.
- **Three contextual augmentation approaches:**
  1. **Replacing:** Substitute intermediate summaries with relevant source content.
  2. **Refining:** Improve intermediate summaries using source context as supporting evidence.
  3. **Aligning:** Implicitly connect summaries to input via citations.
- **Key finding:** Refinement methods perform best when paired with extractive summarization for identifying relevant input. Tested on legal and narrative domains with Llama 3.1 model family.
- **Relevance:** Directly applicable to Wazir's review pipeline — when summarizing code review findings across multiple files, grounding summaries in source context prevents hallucinated issues.

---

## Source 5: Galileo — 9 LLM Summarization Strategies (2025)

**URL:** https://galileo.ai/blog/llm-summarization-strategies

- **Comprehensive overview of nine strategies:**
  1. **Stuffing:** Fit entire document into context window. Simple, no information loss, but limited by context size.
  2. **Map-Reduce:** Summarize chunks independently (map), combine summaries (reduce). Highly parallelizable. Best for large document collections.
  3. **Refine:** Start with first chunk summary, iteratively refine with each subsequent chunk. Sequential but maintains cross-chunk coherence. Inspired by functional `foldl`.
  4. **Hierarchical:** Multi-level summarization tree. Good for very long documents but risks hallucination amplification.
  5. **Cluster-based:** Group semantically similar content before summarizing. Handles diverse multi-document sets.
  6. **Chain of Density:** Iterative densification (see Source 1).
  7. **Extraction-then-Abstraction:** First extract key sentences, then generate abstractive summary from extracts.
  8. **Query-focused:** Summarize with respect to a specific question or focus area.
  9. **Incremental/Streaming:** Process data as it arrives, maintaining running summary.
- **Chunk size guidance:** For map-reduce, 1,500-3,000 token chunks with 10-20% overlap works well for most documents.
- **Key tradeoff:** Map-reduce loses cross-document context during the map step. Refine preserves it but cannot parallelize.
- **Evaluation:** Recommends factual consistency checks, coverage metrics, and coherence evaluation. Tools like DeepEval can evaluate summary quality.

---

## Source 6: JetBrains Research — Smarter Context Management for LLM-Powered Agents (2025)

**URL:** https://blog.jetbrains.com/research/2025/12/efficient-context-management/

- **What it is:** Research blog from JetBrains comparing context management strategies for software engineering agents.
- **Two main approaches compared:**
  1. **Observation masking:** Drop or hide older observations/tool outputs. Simple, fast, no extra LLM calls.
  2. **LLM summarization:** Use another LLM to generate short summaries of older context.
- **Surprising finding:** Both approaches halved costs versus no compression, but **observation masking often matched or slightly beat LLM summarization** in solving benchmark tasks. Simplicity wins on total efficiency and reliability.
- **Why summarization can underperform:** Extra cost of summarization calls, risk of losing critical details, and summarization itself consuming context budget.
- **Practical recommendation:** Start with simple masking strategies. Add summarization only when masking demonstrably fails for your specific task type.
- **Relevance to Wazir:** Challenges the assumption that summarization is always better. For short-lived pipeline phases, simple observation masking may outperform summarization. Reserve hierarchical summarization for cross-phase and cross-session contexts.

---

## Source 7: Factory AI — Anchored Iterative Summarization & Evaluation Framework (2025)

**URL (compression):** https://factory.ai/news/compressing-context
**URL (evaluation):** https://factory.ai/news/evaluating-compression

- **What it is:** Factory's production approach to context compression for long-running AI coding agent sessions, with a rigorous evaluation framework.
- **Anchored iterative summarization:**
  - Maintains a persistent, structured summary with explicit sections: session intent, file modifications, decisions made, next steps.
  - When compression triggers, only the newly-truncated span is summarized and merged into the existing summary — never regenerated from scratch.
  - Uses two thresholds: T_max (compression trigger) and T_retained (tokens kept after compression). Always operates below T_max.
- **Why structure matters:** Dedicated sections act as a checklist — the summarizer cannot silently drop file paths or skip decisions. Each section must be populated or explicitly left empty.
- **Evaluation framework (probe-based):**
  - Four probe types: Recall (factual retention), Artifact (file tracking), Continuation (task planning), Decision (reasoning chain).
  - Traditional metrics (ROUGE, embedding similarity) fail to capture functional quality — a summary can score high on overlap while missing the one file path the agent needs.
  - Factory scores 0.35 points higher than OpenAI and 0.26 higher than Anthropic on their evaluation suite.
- **Key insight:** The right optimization target is **tokens per task**, not tokens per request. Aggressive compression may save per-request costs but cause re-exploration that wastes far more tokens overall.
- **Relevance to Wazir:** Directly applicable pattern for phase-to-phase context handoff. Structured summaries with mandatory sections (decisions, file changes, open questions) would prevent context loss between pipeline phases.

---

## Source 8: ACON — Optimizing Context Compression for Long-Horizon LLM Agents (Microsoft, 2025)

**URL:** https://arxiv.org/abs/2510.00615

- **What it is:** Agent Context Optimization (ACON) by Minki Kang et al. (Microsoft). A unified framework for compressing both environment observations and interaction histories.
- **Core innovation — failure-driven guideline optimization:**
  - Given paired trajectories where full context succeeds but compressed context fails, capable LLMs analyze the causes of failure.
  - Compression guidelines (in natural language) are iteratively refined based on this failure analysis.
  - Gradient-free: no parameter updates needed, works with closed-source models.
- **Distillation:** Optimized compression guidelines from a large LLM can be distilled into smaller models for cost-efficient deployment.
- **Performance:**
  - Reduces memory usage by 26-54% (peak tokens) while preserving task performance.
  - Preserves over 95% of accuracy when distilled into smaller compressors.
  - Enhances smaller LMs as long-horizon agents with up to 46% performance improvement.
- **Tested on:** AppWorld, OfficeBench, Multi-objective QA.
- **Relevance to Wazir:** The failure-driven optimization loop is directly applicable to Wazir's self-audit cycle. Compression prompts for phase summaries could be iteratively refined by analyzing cases where compressed context caused downstream phase failures.

---

## Source 9: Mem0 — LLM Chat History Summarization Guide (2025)

**URL:** https://mem0.ai/blog/llm-chat-history-summarization-guide-2025

- **What it is:** Comprehensive guide on chat history summarization techniques, focusing on memory management for production LLM applications.
- **Core approaches compared:**
  1. **Sliding window truncation:** Drop messages older than N turns. Fast but loses continuity.
  2. **Rolling LLM summarization:** Compress older segments into summaries. Moderate cost, preserves gist.
  3. **Memory formation:** Instead of compressing everything, identify specific facts, preferences, and patterns worth remembering. Fundamentally different from compression.
- **Hierarchical memory architecture:**
  - Short-term memory: recent turns verbatim.
  - Medium-term memory: compressed summaries of recent sessions.
  - Long-term memory: key facts and relationships extracted from historical interactions.
- **Memory formation > summarization:** Mem0 cuts token costs by 80-90% while improving response quality by 26% vs basic chat history management. Selective fact extraction outperforms blanket compression.
- **Two-phase memory pipeline:** Ingests latest exchange + rolling summary + recent messages to extract candidate memories. Consolidates by deduplicating, merging related facts, and resolving contradictions.
- **Relevance to Wazir:** The memory formation paradigm applies to cross-session project memory. Rather than summarizing everything from previous runs, extract and store specific facts (decisions made, files modified, patterns discovered) as structured memory.

---

## Source 10: Tiago Forte — Progressive Summarization (2017, updated 2023)

**URL:** https://fortelabs.com/blog/progressive-summarization-a-practical-technique-for-designing-discoverable-notes/

- **What it is:** A method for opportunistic, layered compression of notes over time. Core technique from the "Building a Second Brain" methodology.
- **Five layers of progressive summarization:**
  1. **Layer 0:** Original full source text.
  2. **Layer 1:** Notes — selected passages saved to a note-taking app.
  3. **Layer 2:** Bold passages — the best parts of the notes bolded.
  4. **Layer 3:** Highlighted passages — the very best parts highlighted within the bold.
  5. **Layer 4:** Executive summary — a few bullet points or sentences in your own words at the top.
- **Key principles:**
  - **Just-in-time compression:** Summarize only when you revisit a note, not at capture time. Each revisit adds one layer of compression.
  - **Compression happens in small spurts:** Spread across time, in the course of other work.
  - **Discoverable over organized:** The goal is rapid discoverability, not perfect categorization.
  - **Information only as compressed as it deserves:** Not everything needs Layer 4.
- **Tradeoff between discoverability and understanding:** Too much compression strips meaning; too little makes notes undiscoverable.
- **Adaptation for code/AI:** Not directly addressed by Forte, but the principle of layered, on-demand compression maps naturally to:
  - Layer 0: Full code/conversation
  - Layer 1: Key excerpts selected by relevance
  - Layer 2: Critical decisions and changes highlighted
  - Layer 3: Compressed findings per file/component
  - Layer 4: Executive summary for handoff
- **Relevance to Wazir:** Progressive summarization could structure how phase reports are built up: each pipeline phase adds a layer of compression rather than re-summarizing everything from scratch.

---

## Source 11: Zylos Research — AI Agent Context Compression Strategies (2026)

**URL:** https://zylos.ai/research/2026-02-28-ai-agent-context-compression-strategies

- **What it is:** Comprehensive survey of the state of context compression for AI agents as of early 2026.
- **Key statistic:** Nearly 65% of enterprise AI failures in 2025 were attributed to context drift or memory loss during multi-step reasoning — not raw context exhaustion.
- **Reliability math:** At 95% per-step reliability over a 20-step workflow, combined success rate drops to just 36%. A 2% misalignment early in a chain can compound into 40% failure rate by the end.
- **Context accumulation sources:** conversation turns, tool outputs (often verbose JSON), and observation history (DOM, file listings, code diffs).
- **Compression approaches ranked:**
  1. Sliding window / full replacement — simplest, loses continuity.
  2. Rolling LLM summarization (full reconstruction) — moderate, redundant re-summarization.
  3. Anchored iterative summarization (Factory approach) — best accuracy, completeness, continuity.
  4. ACON failure-driven optimization — best for automated guideline refinement.
  5. Provider-native compaction APIs (Anthropic `compact-2026-01-12`) — production-ready, zero-config.
- **Industry trend:** Context window size is plateauing. Focus is shifting from expanding windows to smarter context management, inference-time scaling, hybrid compression+caching, and memory-augmented architectures.
- **Relevance to Wazir:** The 65% failure rate from context drift validates the need for structured context management in multi-phase pipelines. The ranked compression approaches provide a decision framework for Wazir's different context management needs.

---

## Source 12: Google Cloud — Long Document Summarization with Workflows and Gemini (2024)

**URL:** https://cloud.google.com/blog/products/ai-machine-learning/long-document-summarization-with-workflows-and-gemini-models

- **What it is:** Google Cloud's practical guide to implementing map-reduce and iterative refinement summarization using Workflows and Gemini models, without requiring a dedicated LLM framework.
- **Two approaches detailed:**
  1. **Map/Reduce:** Split long document into chunks fitting the context window, summarize each chunk independently (map), then combine all summaries into a final summary (reduce). Parallelizable.
  2. **Iterative Refinement (Refine):** Summarize first chunk, then iteratively feed each subsequent chunk with the current summary to the LLM, asking it to integrate new information. Sequential but maintains coherence.
- **Implementation insight:** Can be implemented with a serverless orchestration engine (Google Cloud Workflows) without heavyweight LLM frameworks. The orchestration handles chunking, parallel execution, and aggregation.
- **Practical considerations:** Chunk boundaries matter — splitting mid-sentence or mid-paragraph degrades quality. Semantic chunking (by section/paragraph boundaries) outperforms fixed-size tokenization.
- **Relevance to Wazir:** Validates that summarization pipelines can be orchestrated with lightweight workflow engines, which aligns with Wazir's YAML-driven workflow architecture.

---

## Source 13: Multi-LLM Text Summarization — Fang et al. (arXiv, 2024)

**URL:** https://arxiv.org/abs/2412.15487

- **What it is:** Framework investigating centralized and decentralized multi-LLM summarization strategies by Jiangnan Fang et al. (Adobe Research).
- **Two strategies:**
  1. **Centralized:** k different LLMs generate diverse summaries; a single LLM evaluates and selects the best one.
  2. **Decentralized:** k LLMs generate summaries; k LLMs evaluate (each evaluating others' summaries).
- **Multi-round conversation:** Each round consists of generation and evaluation steps. Over multiple rounds, summaries are iteratively improved through cross-model feedback.
- **Key result:** Multi-LLM approaches outperform single-LLM baselines by up to 3x on standard summarization benchmarks.
- **Why it works:** Different LLMs have different strengths, biases, and failure modes. Combining them produces more balanced, comprehensive summaries than any single model.
- **Relevance to Wazir:** Supports the case for Wazir's multi-model routing. Different models could handle different summarization tasks (extraction vs abstraction vs evaluation), with a coordinator selecting the best output.

---

## Source 14: BooookScore — Book-Length Summarization Evaluation (ICLR 2024)

**URL:** https://arxiv.org/abs/2310.00785

- **What it is:** The first systematic evaluation of coherence in LLM-based book-length (>100K tokens) summarization, published as an oral at ICLR 2024.
- **Evaluated two prompting workflows:**
  1. **Hierarchical merging:** Merge chunk-level summaries in a tree structure.
  2. **Incremental updating:** Maintain and update a running summary with each new chunk.
- **Eight coherence error types identified** through 1,193 fine-grained human annotations on GPT-4 summaries of 100 recently published books.
- **BooookScore metric:** LLM-based evaluation metric that identifies and explains instances of the eight coherence error types. Measures the proportion of sentences free of any coherence error. High agreement with human annotations while saving $15K USD and 500 hours in human evaluation.
- **Key findings:**
  - Closed-source LLMs (GPT-4, Claude 2) produce more coherent summaries than open-source models.
  - Hierarchical merging and incremental updating each have distinct failure modes.
  - Mixtral achieves parity with GPT-3.5-Turbo despite LLaMA 2 falling behind.
- **Relevance to Wazir:** Provides a concrete evaluation framework for measuring summarization quality. The eight coherence error types could be adapted as a checklist for Wazir's self-audit of its own summary outputs.

---

## Source 15: Letta — Agent Memory: How to Build Agents that Learn and Remember (2025)

**URL:** https://www.letta.com/blog/agent-memory

- **What it is:** Letta's comprehensive guide to building stateful agents with persistent memory, treating memory as context engineering.
- **Memory as context management:** What an agent "remembers" is determined by what exists in its context window at any given moment. Designing memory = designing context engineering.
- **Memory components:**
  1. **Message buffer:** Recent messages in a perpetual thread.
  2. **Core memory (in-context blocks):** Editable memory blocks for user preferences, persona, current task. Managed by the agent itself.
  3. **Archival memory (external storage):** Long-term storage with semantic search. Agent can write to and query this store.
  4. **Recall memory (search over history):** Full conversation history searchable via text or date filters.
- **Key architectural insight:** Memory systems compose multiple techniques — summarization, context rewriting, and retrieval — to manage various memory components.
- **Eviction strategies:** When context fills, evicted messages undergo recursive summarization — summarized along with existing summaries from previously summarized messages.
- **Relevance to Wazir:** The multi-tier memory architecture (core/archival/recall) maps directly to Wazir's needs: core memory for current phase state, archival for project-level facts, recall for searching across run history.

---

## Source 16: Maxim — Context Window Management Strategies for Long-Context AI Agents (2025)

**URL:** https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/

- **What it is:** Comprehensive article covering production strategies for context window management in AI agents and chatbots.
- **Strategies covered:**
  1. **Selective context injection:** Only inject context relevant to the current query/task. Use RAG or semantic search to select.
  2. **Semantic compression:** Identify and preserve information-dense segments while removing redundancy. Claims 6:1 compression ratios while maintaining semantic fidelity.
  3. **Sliding window with summarization:** Keep recent turns verbatim, compress older turns. Hybrid approach.
  4. **Vectorized memory:** Store interactions as embeddings; retrieve semantically similar past conversations on demand.
  5. **Tiered context management:** Different retention policies for different information types (system prompts always retained, tool outputs aggressively compressed, user messages moderately compressed).
- **Compression vs summarization distinction:** Compression keeps original phrasing but removes redundancy (safer for precision). Summarization rewrites content (more compact but risks losing nuance). Some systems achieve 10:1 compression while maintaining response quality.
- **Relevance to Wazir:** The tiered approach — different retention policies per information type — is directly applicable. System prompts/role contracts should be retained verbatim; tool outputs can be aggressively compressed; decisions and rationale should be preserved with moderate compression.

---

## Synthesis

### Core Techniques Taxonomy

| Technique | Parallelizable | Preserves Cross-Doc Context | Hallucination Risk | Best For |
|---|---|---|---|---|
| Stuffing | N/A | Yes (single pass) | Low | Short documents within context window |
| Map-Reduce | Yes | No (lost in map step) | Medium | Large document collections, speed-critical |
| Refine (Iterative) | No | Yes (sequential) | Medium | Ordered documents, narrative coherence |
| Hierarchical Merging | Partially | Partially | High (amplification) | Very long documents (>100K tokens) |
| Chain of Density | No | N/A (single doc) | Low | Controlling information density precisely |
| Context-Aware Merging | Partially | Yes (via augmentation) | Lower than naive | Long docs where factual accuracy matters |
| Anchored Iterative | No | Yes (persistent state) | Low | Long-running agent sessions |
| ACON (Failure-Driven) | No | Yes (optimized guidelines) | Low | Automated compression optimization |

### Key Findings for Wazir

1. **Structure forces preservation.** Factory's anchored summarization proves that dedicated summary sections (decisions, files, next steps) prevent silent information loss. Phase reports should have mandatory sections, not free-form summaries.

2. **Summarization is not always the answer.** JetBrains found that simple observation masking often matches or beats LLM summarization on benchmarks. For within-phase context, masking may be more cost-effective. Reserve summarization for cross-phase handoffs.

3. **Context drift kills before context limits.** 65% of enterprise AI failures stem from drift, not exhaustion (Zylos). This means *quality* of retained context matters more than *quantity*. Wazir's pipeline phases should validate context integrity, not just context size.

4. **Memory formation > blanket compression.** Mem0 shows 80-90% token cost reduction with 26% quality improvement by selectively storing facts rather than compressing everything. Wazir should extract specific facts (decisions, file changes, patterns) rather than summarizing entire conversations.

5. **Failure-driven optimization is practical.** ACON demonstrates that compression guidelines can be automatically improved by analyzing when compressed context causes failures. This is directly applicable to Wazir's self-audit cycle.

6. **Progressive summarization adapts to code pipelines.** Forte's layered approach (capture -> bold -> highlight -> executive summary) maps to: full output -> key excerpts -> critical decisions -> phase summary. Each pipeline phase adds a layer rather than re-summarizing from scratch.

7. **Multi-LLM summarization outperforms single-LLM.** Cross-model generation + evaluation produces up to 3x better summaries (Fang et al.). Wazir's model routing could assign different models to generate and evaluate summaries.

8. **Evaluation needs task-specific probes, not generic metrics.** Factory's probe-based evaluation (recall, artifact, continuation, decision) outperforms ROUGE/embedding similarity for measuring functional quality. Wazir should evaluate summaries by whether downstream phases can use them, not by lexical overlap.

### Recommended Approach for Wazir

A three-tier summarization architecture:

- **Within-phase:** Simple observation masking with structured tool output compression. No LLM summarization calls needed.
- **Phase-to-phase handoff:** Anchored iterative summarization with mandatory sections (intent, decisions, file changes, open questions, next steps). Each phase produces a structured summary that the next phase consumes.
- **Cross-session / project memory:** Memory formation (fact extraction) over blanket summarization. Store decisions, patterns, and key findings as structured records. Use semantic search for retrieval.

Progressive densification via Chain of Density could be applied to the final project-level summary, ensuring it is information-dense without being unreadable.
