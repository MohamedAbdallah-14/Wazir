# Context Engineering: Research Findings

> **Research date:** 2026-03-25
> **Scope:** Context engineering as a discipline, techniques for context selection and ranking, how coding tools engineer context, academic research on context-aware AI systems, practical frameworks for context curation.
> **Sources reviewed:** 17 primary sources (blogs, academic papers, engineering posts, industry reports)

---

## Source 1: Andrej Karpathy — "+1 for context engineering" (https://x.com/karpathy/status/1937902205765607626)

- Karpathy coined the most widely-cited definition: "Context engineering is the delicate art and science of filling the context window with just the right information for the next step."
- Uses an OS analogy: the LLM is the CPU, and the context window is RAM. Context engineering plays the role of an operating system, curating what fits into the model's limited working memory.
- The "science" side involves: task descriptions and explanations, few-shot examples, RAG, related (possibly multimodal) data, tools, state and history, compacting. "Doing this well is highly non-trivial."
- The "art" side comes from "the guiding intuition around LLM psychology."
- Prompt engineering has an inferred definition problem: most people think it means "typing things into a chatbot." Context engineering better captures the complexity of industrial-strength LLM applications.

## Source 2: Tobi Lutke (Shopify CEO) — Context engineering tweet (https://x.com/tobi/status/1935533422589399127)

- Lutke's June 19, 2025 tweet popularized the term: "I really like the term 'context engineering' over prompt engineering. It describes the core skill better: the art of providing all the context for the task to be plausibly solvable by the LLM."
- Framed context engineering as a "core skill" rather than a niche technique.
- Simon Willison endorsed the term, noting that the "inferred definition" of context engineering is closer to its intended meaning than prompt engineering ever was.

## Source 3: Anthropic — "Effective Context Engineering for AI Agents" (https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

- Published September 29, 2025. Anthropic's official engineering guide to context engineering.
- **Core definition:** Context refers to the set of tokens included when sampling from an LLM. The engineering problem is "optimizing the utility of those tokens against the inherent constraints of LLMs in order to consistently achieve a desired outcome."
- **Context engineering vs. prompt engineering:** Anthropic views context engineering as the natural progression of prompt engineering. Prompt engineering focuses on writing effective prompts (especially system prompts). Context engineering manages the entire context state: system instructions, tools, MCP, external data, message history, etc.
- **Key insight:** "Good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome."
- **Context pollution:** As agents run in loops, they generate more and more data that could be relevant. This data must be cyclically refined.
- **Strategies for fighting context pollution:**
  - **Compaction:** Summarize conversations nearing the context window limit to create a fresh, condensed context.
  - **Structured note-taking:** The agent writes structured notes/scratchpads that persist key facts.
  - **Multi-agent architectures:** Isolate different concerns into separate agents with their own context windows.
- **Mental model:** Think in context — consider the holistic state available to the LLM at any given time and what potential behaviors that state might yield.

## Source 4: Phil Schmid — "The New Skill in AI is Not Prompting, It's Context Engineering" (https://www.philschmid.de/context-engineering)

- Published June 30, 2025. One of the earliest comprehensive blog posts on the topic.
- **What constitutes "context"** (taxonomy):
  1. Instructions / System Prompt
  2. User Prompt
  3. State / History (short-term memory)
  4. Long-Term Memory (persistent knowledge across conversations)
  5. Retrieved Information (RAG)
  6. Available Tools (function/tool definitions)
  7. Structured Output (response format definitions)
- **Key claim:** "Most agent failures are not model failures anymore, they are context failures."
- **Demo vs. magic distinction:** The difference between a cheap demo and a "magical" agent is the quality of context, not the complexity of code. A "magical" agent gathers calendar data, email threads, user preferences, and relationship context before generating a response.
- **Building agents is less about the code you write or framework you use.** The difference is about the quality of the context you provide.

## Source 5: LangChain — "Context Engineering for Agents" (https://blog.langchain.com/context-engineering-for-agents/)

- Comprehensive framework identifying **four core strategies** for context engineering:
  1. **Write:** Proactively create context artifacts. Agents write plans, scratchpads, structured notes, and memories that persist across steps.
  2. **Select:** Choose what goes into context. Use retrieval, filtering, and ranking to pick the most relevant information from available sources.
  3. **Compress:** Reduce token usage. Summarize long histories, trim irrelevant tool outputs, compact conversation threads.
  4. **Isolate:** Separate concerns. Use multi-agent architectures where each agent has its own focused context window for a specific subtask.
- **Context types:** Instructions (prompts, memories, few-shot examples, tool descriptions), Knowledge (facts, memories), Tools (feedback from tool calls).
- **Agents as OS:** Builds on Karpathy's analogy. The LLM is the CPU, the context window is RAM. Context engineering curates what fits.
- **Key challenge for agents:** Agents interleave LLM invocations and tool calls, often for long-running tasks. The context window fills up fast with action-observation pairs, requiring active management.

## Source 6: Manus — "Context Engineering for AI Agents: Lessons from Building Manus" (https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)

- Published July 18, 2025, by Yichao "Peak" Ji. Manus bet on context engineering over fine-tuning, allowing them to "ship improvements in hours instead of weeks."
- **Design Around the KV-Cache:** "If I had to choose just one metric, I'd argue that the KV-cache hit rate is the single most important metric for a production-stage AI agent." It directly affects both latency and cost.
  - Agents operate in loops: receive input, select action, execute in environment, observe result, append to context, repeat.
  - KV-cache lets the model reuse previously computed key-value pairs for the unchanged prefix of the context.
  - **Rule:** Never mutate the prefix of the context. Append only. Any change to earlier tokens invalidates the entire cache.
  - **Practical implication:** System prompts, tool definitions, and earlier conversation turns must remain stable across iterations.
- **Stochastic Graduate Descent (SGD):** Manus affectionately calls their iterative process of architecture searching, prompt fiddling, and empirical guesswork "Stochastic Graduate Descent." They rebuilt their agent framework four times.
- **Mask, Don't Remove:** Rather than removing tools from context (which breaks KV-cache), mask unavailable actions at the token-logit level so that the model cannot select them.
- **Context as an evolving artifact:** The context isn't static. It's a living document that grows with each agent step and must be actively managed.

## Source 7: Martin Fowler / Thoughtworks — "Context Engineering for Coding Agents" (https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html)

- Published February 5, 2026, by Birgitta Bockeler (Distinguished Engineer at Thoughtworks).
- **Definition:** "Context engineering is curating what the model sees so that you get a better result." (Bharani Subramaniam, Thoughtworks)
- **Taxonomy of context in coding agents:**
  - **Reusable Prompts:** Markdown files with prompts, split into two categories:
    - *Instructions:* Tell the agent to do something (e.g., "Write an E2E test in the following way...")
    - *Guidance:* General conventions/guardrails (e.g., "Always write independent tests.")
  - **Context Interfaces:** Descriptions of how the LLM can get more context on demand:
    - *Tools:* Built-in capabilities (bash, file search)
    - *MCP Servers:* Custom programs providing data sources and actions
    - *Skills:* Descriptions of additional resources the LLM can load on demand
  - **Auto-context:** Information automatically injected by the tool (git status, project structure, open files).
- **Balance principle:** One goal of context engineering is to balance the amount of context given — not too little, not too much. Even though context windows have grown large, indiscriminately dumping information isn't advisable, as agent effectiveness decreases with too much context.
- **Claude Code as exemplar:** Claude Code leads the charge with innovations in this space (CLAUDE.md files, MCP integrations, skills). Other coding assistants are quickly following suit.

## Source 8: Shaped AI — "Context Window Optimization: Why Ranking, Not Stuffing, Is the Scaling Law for Agents" (https://www.shaped.ai/blog/context-window-optimization-why-ranking-not-stuffing-is-the-scaling-law-for-agents)

- Published February 27, 2026. Central thesis: **The defining problem of production agents isn't model intelligence. It's context window management.**
- **Quadratic attention cost:** Doubling your context doesn't double your cost, it quadruples it. Every extra chunk makes everything slower, more expensive, and paradoxically, less accurate.
- **Ranking vs. stuffing:** Instead of passing 200 unranked chunks, pass 10 ranked results selected by ML models trained on your data. Less context, better answers, lower cost.
- **Key takeaways:**
  - Cosine similarity is not ranking. Vector search returns "similar" results. Trained ranking models return "useful" results. These are fundamentally different things.
  - Real-time signals matter more than static embeddings for production agent quality.
  - Research consistently shows retrieval precision matters more than recall for downstream task performance.
- **Multi-retriever pipelines:** Production systems need multiple retrieval strategies (vector, keyword, metadata filtering) combined with a learned reranker.
- **The "lost in the middle" effect:** Models attend well to the start and end of context but poorly to the middle, causing 30%+ accuracy drops for information placed in the middle.

## Source 9: Chroma Research — "Context Rot: How Increasing Input Tokens Impacts LLM Performance" (https://research.trychroma.com/context-rot)

- Chroma's 2025 research tested 18 frontier models (GPT-4.1, Claude Opus 4, Gemini 2.5) and found that **every model exhibits performance degradation at every input length increment tested.**
- **Context rot defined:** Measurable degradation in LLM output quality as input context length increases, even when the additional context is not adversarial.
- **Three mechanisms of degradation:**
  1. **Lost-in-the-middle effect:** Models attend well to start and end of context but poorly to the middle, causing 30%+ accuracy drops.
  2. **Attention dilution:** Transformer attention is quadratic — 100K tokens means 10 billion pairwise relationships to manage.
  3. **Distractor interference:** Semantically similar but irrelevant content actively misleads the model.
- **Attention budget:** Like humans with limited working memory, LLMs have an "attention budget" that every new token depletes, increasing the need to carefully curate tokens.
- **Complex tasks degrade faster:** Performance degradation is more severe on more complex tasks, not just simple retrieval.
- **Practical implication:** Even with million-token context windows, more context is not better context. Careful curation and ranking are essential.

## Source 10: GitHub Blog — "Want Better AI Outputs? Try Context Engineering" (https://github.blog/ai-and-ml/generative-ai/want-better-ai-outputs-try-context-engineering/)

- Published January 12, 2026, by Christina Warren.
- **Three practical techniques for context engineering with GitHub Copilot:**
  1. **Custom instructions:** Files like `.github/copilot-instructions.md` that define coding conventions, language preferences, naming standards, documentation style. Applied automatically.
  2. **Reusable prompts:** Saved prompt files (`.github/prompts/*.prompt.md`) that standardize common workflows — code reviews, scaffolding components, generating tests.
  3. **Custom agents:** Purpose-built agents with dedicated tool access and contextual grounding for specific workflows.
- **Framing:** Context engineering is "the evolution of prompt engineering," focused less on clever phrasing and more on "bringing the right information in the right format to the LLM" (quoting Braintrust CEO Ankur Goyal).

## Source 11: Weaviate — "Context Engineering: LLM Memory and Retrieval for AI Agents" (https://weaviate.io/blog/context-engineering)

- **The 6 Pillars of Context Engineering:**
  1. **Agents:** Orchestrate decisions about what context to load and when.
  2. **Query Augmentation:** Refine user input before retrieval (query rewriting, expansion, decomposition).
  3. **Retrieval:** Connect to external knowledge stores (vector databases, document stores).
  4. **Prompting:** Guide the model's reasoning with well-structured instructions.
  5. **Memory:** Preserve history across turns and sessions (short-term and long-term).
  6. **Tools:** Enable real-world actions and data access.
- **Key insight:** "Context engineering is about shifting our role from being prompters who talk at a model to architects who build the world the model lives in."
- **Context window as scarce resource:** All LLMs are constrained by finite context windows. Context engineering treats that window as a scarce resource, designing retrieval, memory, tool integrations, and prompts so the model spends its limited attention budget only on high-signal tokens.
- **System interdependence:** A powerful agent is useless without clean data from retrieval; great retrieval is wasted if a poor prompt misguides the model; the best prompt can't function without memory or tool access.

## Source 12: Elastic — "The Impact of Relevance in Context Engineering for AI Agents" (https://www.elastic.co/search-labs/blog/context-engineering-relevance-ai-agents-elasticsearch)

- Published November 5, 2025.
- **Context rot in practice:** One NIAH benchmark (NOLIMA) found "performance degrades significantly as context length increases," with 11 models dropping below 50% of their short-length baselines at 32K tokens.
- **From RAG to just-in-time context:** The trend is shifting from pre-loading all potentially relevant data upfront toward agents that use "just-in-time" context — retrieving precisely what they need at each step.
- **Hybrid retrieval for relevance:** Combine lexical search precision with semantic recall for maximum signal-to-noise ratio. Pure embedding similarity is insufficient at scale.
- **Agentic search:** Rather than one-shot retrieval, agents iteratively refine their search queries, evaluate results, and re-retrieve until they have sufficient context. This mirrors how a human researcher works.
- **Relevance scoring signals:**
  - Embedding similarity (cosine similarity to current query)
  - Recency weighting (boost recently updated documents)
  - Source priority (authoritative sources ranked above informal ones)
  - Reranking models (learned models that predict which chunks will most improve response quality)

## Source 13: Anthropic — "Contextual Retrieval" (https://www.anthropic.com/news/contextual-retrieval)

- Published September 19, 2024. Foundational technique that underpins modern context engineering.
- **The problem with traditional RAG:** When you chunk documents for embedding, each chunk loses the context of its surrounding document. A chunk saying "the company's revenue grew 3%" doesn't specify which company.
- **Contextual Retrieval solution:** Two sub-techniques:
  1. **Contextual Embeddings:** Before embedding each chunk, prepend a short document-level context summary (generated by the LLM) that explains the chunk's role in the larger document.
  2. **Contextual BM25:** Apply the same contextual enrichment to keyword (BM25) search, improving lexical retrieval accuracy.
- **Results:** Reduces failed retrievals by 49%. Combined with reranking, reduces failures by 67%.
- **Scaling note:** For knowledge bases under 200K tokens (~500 pages), simply include everything in the prompt using prompt caching. Use contextual retrieval for larger knowledge bases.

## Source 14: Addy Osmani — "Context Engineering: Bringing Engineering Discipline to Prompts" (https://addyo.substack.com/p/context-engineering-bringing-engineering)

- Published July 13, 2025. Frames context engineering as applying software engineering discipline to AI context management.
- **Core framing:** Context engineering means providing an AI with all the information and tools it needs to complete a task — not just a cleverly worded prompt. It's the evolution of prompt engineering, reflecting a broader, system-level approach.
- **Practical tips for improving context:**
  - Be precise: Vague requests produce vague answers.
  - Provide relevant code: Share specific files and functions the model needs.
  - Define constraints: Specify language versions, frameworks, patterns.
  - Include error context: When debugging, share the full error, stack trace, and what you've tried.
  - Separate concerns: Break large tasks into focused sub-tasks with targeted context for each.
- **Information architecture of prompts:** Treats prompt construction as an information architecture problem — structure, hierarchy, and organization of information matter as much as the content itself.

## Source 15: SwirlAI Newsletter — "State of Context Engineering in 2026" (https://www.newsletter.swirlai.com/p/state-of-context-engineering-in-2026)

- Published March 22, 2026, by Aurimas Griciūnas. The most recent comprehensive survey of the field.
- **Context engineering went from niche concern to the core discipline of AI engineering in under a year.** Gartner identified it as a top emerging technology skill for 2026.
- **Five patterns for managing context:**
  1. Structured persistent memory (hot/cold memory architecture)
  2. Dynamic context selection (retrieve only what's relevant per step)
  3. Compaction and summarization (keep context windows lean)
  4. Multi-agent isolation (separate context per agent role)
  5. KV-cache-aware design (never mutate prefixes, append only)
- **Key timeline:** Manus and LangChain laid the groundwork in mid-2025. Anthropic published their engineering guide in September 2025. The Agent Skills format was released by Anthropic in December 2025 and adopted by OpenAI, Google, GitHub, and Cursor within weeks.
- **Enterprise projection:** Task-specific AI agents projected to reach 40% enterprise adoption by end of 2026, up from <5% in 2025.

## Source 16: ACE Paper — "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models" (https://arxiv.org/abs/2510.04618)

- Published October 2025 by Stanford University and SambaNova Systems.
- **ACE framework:** Treats contexts as "evolving playbooks" that accumulate, refine, and organize strategies through a modular process of generation, reflection, and curation.
- **Two failure modes of prior approaches:**
  1. **Brevity bias:** Drops domain insights in favor of concise summaries.
  2. **Context collapse:** Iterative rewriting erodes details over time.
- **ACE solution:** Structured, incremental updates that preserve detailed knowledge and scale with long-context models.
- **Results:** +10.6% improvement on agent benchmarks, +8.6% on finance tasks, while reducing adaptation latency and rollout cost.
- **Offline and online optimization:** ACE optimizes contexts both offline (system prompts) and online (agent memory).
- **No labeled supervision required:** ACE can adapt effectively by leveraging natural execution feedback rather than requiring labeled training data.
- **On the AppWorld leaderboard:** ACE matches the top-ranked production-level agent and surpasses it on harder test-challenge splits, despite using a smaller open-source model.

## Source 17: "Codified Context: Infrastructure for AI Agents in a Complex Codebase" (https://arxiv.org/abs/2602.20478)

- Published February 24, 2026, by Aristidis Vasilopoulos. Empirical study from building a 108,000-line C# distributed system.
- **Three-component infrastructure:**
  1. **Hot-memory constitution:** Encoding conventions, retrieval hooks, and orchestration protocols. Always loaded.
  2. **19 specialized domain-expert agents:** Each with focused context for their domain.
  3. **Cold-memory knowledge base:** 34 on-demand specification documents loaded only when needed.
- **Key distinction:** Codified context indexes knowledge *about* code — design intent, constraints, and failure modes not present in any single source file. This differs from code indexing.
- **Quantitative results:** 283 development sessions tracked. Codified context propagates across sessions to prevent failures and maintain consistency.
- **Persistent memory problem:** LLM-based agents lose coherence across sessions, forget project conventions, and repeat known mistakes. Codified context infrastructure solves this.

## Additional Academic Reference: "Structured Context Engineering for File-Native Agentic Systems" (https://arxiv.org/abs/2602.05447)

- Published February 2026 by Damon McMillan. 9,649 experiments across 11 models, 4 formats (YAML, Markdown, JSON, TOON), schemas from 10 to 10,000 tables.
- **Key findings:**
  - Format does not significantly affect aggregate accuracy (chi-squared=2.45, p=0.484).
  - Model capability is the dominant factor: 21 percentage-point accuracy gap between frontier and open-source tiers.
  - File-native agents scale to 10,000 tables through domain-partitioned schemas.
  - File size does not predict runtime efficiency.

---

## Synthesis

### What Context Engineering Is

Context engineering is the discipline of designing systems that dynamically curate, rank, structure, and manage the information provided to an LLM at each inference step. It emerged in mid-2025 when Tobi Lutke and Andrej Karpathy popularized the term, and within a year became what Gartner calls a "top emerging technology skill." It subsumes prompt engineering: prompts are one component of context, but context also includes memory, retrieved data, tool definitions, conversation history, structured outputs, and agent scratchpads.

### Why It Matters

The central insight across all sources is: **most agent failures are context failures, not model failures.** The quality of context determines whether an agent produces a "cheap demo" or a "magical" production system. Context windows are fundamentally constrained — even million-token windows degrade due to context rot, attention dilution, and the lost-in-the-middle effect (Chroma's research confirms this across all 18 frontier models tested). More context is not better context.

### Core Principles

1. **Minimize, don't maximize.** Good context engineering finds the smallest set of high-signal tokens that maximize desired outcomes (Anthropic). Ranking beats stuffing (Shaped AI). Retrieval precision matters more than recall.

2. **Design for the KV-cache.** In production agents, the KV-cache hit rate is the single most important metric (Manus). Never mutate the prefix. Append only. Mask unavailable actions at the logit level rather than removing tool definitions.

3. **Fight context rot actively.** Every additional token depletes the model's attention budget. Use compaction, summarization, multi-agent isolation, and structured note-taking to keep context lean (Anthropic, Chroma, SwirlAI).

4. **Rank, don't stuff.** Use hybrid retrieval (vector + keyword), reranking models, recency weighting, and source priority scoring to surface only the most relevant information (Shaped AI, Elastic, Anthropic Contextual Retrieval).

5. **Separate hot and cold memory.** Hot memory (always loaded: conventions, rules, tool definitions) stays in the context prefix. Cold memory (specifications, documentation, historical data) is loaded on demand (Codified Context paper, Martin Fowler/Thoughtworks).

6. **Use multi-agent isolation.** Different subtasks get different agents with focused context windows, preventing any single agent from being overwhelmed (LangChain, Anthropic, Codified Context).

### The Four Strategies (LangChain Framework)

| Strategy | Description | Examples |
|----------|-------------|----------|
| **Write** | Proactively create context artifacts | Plans, scratchpads, structured notes, agent memories |
| **Select** | Choose what enters context | RAG retrieval, filtering, ranking, tool selection |
| **Compress** | Reduce token usage | Summarization, compaction, trimming tool outputs |
| **Isolate** | Separate concerns | Multi-agent architectures, sub-agent context windows |

### The Six Pillars (Weaviate Framework)

| Pillar | Role |
|--------|------|
| **Agents** | Orchestrate decisions about what context to load |
| **Query Augmentation** | Refine input before retrieval |
| **Retrieval** | Connect to external knowledge |
| **Prompting** | Guide reasoning with structured instructions |
| **Memory** | Preserve history across turns and sessions |
| **Tools** | Enable real-world actions and data access |

### How Coding Tools Engineer Context

| Tool | Approach |
|------|----------|
| **Claude Code** | CLAUDE.md files, MCP server integrations, skills (on-demand context loading), conversation history, auto-context (git status, project structure). Leading innovator in this space. |
| **GitHub Copilot** | Custom instruction files (.github/copilot-instructions.md), reusable prompts (.github/prompts/), custom agents. Narrower context window than alternatives. |
| **Cursor** | Full codebase indexing for cross-file awareness, .cursorrules for conventions, @-mentions for explicit context inclusion. Struggles with consistency across dozens of files. |

### Prompt Engineering vs. Context Engineering

| Dimension | Prompt Engineering | Context Engineering |
|-----------|-------------------|---------------------|
| **Scope** | Single input-output pair | Everything the model sees |
| **Focus** | How you communicate | What information is available |
| **Lifecycle** | Static, per-request | Dynamic, iterative, per-step |
| **Applies to** | One-shot tasks, demos | Multi-turn agents, production systems |
| **Relationship** | Subset of context engineering | Superset that includes prompting |

### Implications for Wazir

Context engineering research directly informs several Wazir design decisions:

1. **Hot/cold memory architecture:** Wazir's manifest and role contracts serve as hot memory (always loaded); skill specifications and workflow phase documents serve as cold memory (loaded on demand). This maps to the Codified Context paper's three-tier architecture.

2. **Context-aware review:** Review phases should receive only the relevant diff context, not the entire codebase. Ranking and selection matter more than volume.

3. **KV-cache-friendly design:** Wazir's system prompts, tool definitions, and role contracts should be stable across agent steps. Changes to these invalidate the cache and increase latency/cost.

4. **Multi-agent isolation:** Wazir's role-based architecture naturally isolates context per role. Each role agent should receive only the context relevant to its domain.

5. **Active context management:** As agents execute phases, context accumulates. Wazir should implement compaction strategies between phases to prevent context rot.

6. **Skill-based on-demand loading:** Wazir's skills pattern aligns with Martin Fowler's "context interfaces" concept — descriptions that let the agent pull in more context when it decides it needs it, rather than front-loading everything.
