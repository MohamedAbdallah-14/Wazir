# Agentic Coding Architectures: Research Survey

**Date:** 2026-03-25
**Scope:** Architecture of AI coding agents, context retrieval strategies, multi-agent systems, evaluation benchmarks, and the explore-plan-execute loop.

---

## 1. Anthropic — Building Effective Agents (https://www.anthropic.com/research/building-effective-agents)

**Published:** December 2024

- Anthropic distinguishes between **workflows** (LLMs and tools orchestrated through predefined code paths) and **agents** (LLMs dynamically directing their own processes and tool usage).
- The most successful implementations use **simple, composable patterns** rather than complex frameworks. Many patterns can be implemented in a few lines of code using LLM APIs directly.
- Five fundamental agentic patterns identified:
  1. **Prompt Chaining** — sequential processing where each step builds on the previous, with optional gate checks between steps.
  2. **Routing** — classifying input and directing it to specialized handlers (different prompts, tools, or models).
  3. **Parallelization** — concurrent execution of subtasks, either as fan-out/fan-in or voting/consensus.
  4. **Orchestrator-Workers** — a central LLM dynamically decomposes tasks and delegates to worker LLMs, then synthesizes results. Unlike parallelization, subtasks are not predetermined.
  5. **Evaluator-Optimizer** — one LLM generates output, another provides evaluation/critique, looping until quality threshold is met.
- The basic building block is an **augmented LLM** enhanced with retrieval, tools, and memory. Current frontier models can actively use these capabilities: generating search queries, selecting tools, and determining what to retain.
- Agents add the most value for tasks that: require both conversation and action, have clear success criteria, enable feedback loops, and integrate meaningful human oversight.
- Key implementation advice: start simple, optimize single LLM calls with retrieval and in-context examples first, and only increase complexity when needed. Agentic systems trade latency and cost for better task performance.

---

## 2. Anthropic — Effective Context Engineering for AI Agents (https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

**Published:** September 2025

- **Context engineering** is the natural progression of prompt engineering. It refers to curating and maintaining the optimal set of tokens during LLM inference, including all information beyond just prompts (system instructions, tools, MCP, external data, message history).
- An agent running in a loop generates more and more data that could be relevant for the next turn of inference, and this information must be cyclically refined. Context engineering is the art and science of curating what goes into the limited context window from a constantly evolving universe of possible information.
- Key strategies:
  - **Write context carefully** — be concise and precise; every token competes for attention.
  - **Structure context for the model** — use clear hierarchies, delimiters, and consistent formatting.
  - **Provide relevant context only** — use retrieval and dynamic assembly to include what matters.
  - **Manage context over time** — implement compaction, summarization, and pruning strategies for long-running sessions.
- The shift from prompt engineering to context engineering reflects the move from single-shot tasks to multi-turn, long-horizon agent work where managing the full context state becomes the primary engineering challenge.

---

## 3. Anthropic — Effective Harnesses for Long-Running Agents (https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

**Published:** November 2025

- Long-running agents must work in discrete sessions, each beginning with no memory of what came before. The core challenge is bridging the gap between coding sessions.
- Two-fold solution: an **initializer agent** that sets up the environment on the first run, and a **coding agent** that makes incremental progress in every session while leaving clear artifacts for the next session.
- Common failure modes:
  1. **Trying to do too much at once** — attempting to one-shot a complex app, running out of context mid-implementation, leaving features half-done and undocumented.
  2. **Regression in later sessions** — after some features are built, later sessions break existing work because the agent lacks full context of prior decisions.
- Compaction alone is not sufficient. Even frontier models like Opus 4.5 running in a loop across multiple context windows will fall short without structured harness design.
- The solution draws from human engineering practices: structured handoff artifacts, incremental progress with clear checkpoints, and separation of initialization from execution.
- The Claude Agent SDK provides compaction as a built-in capability, enabling agents to work without exhausting the context window, but the harness (orchestration logic) is what makes it reliable.

---

## 4. OpenAI — Unrolling the Codex Agent Loop (https://openai.com/index/unrolling-the-codex-agent-loop/)

**Published:** January 2026

- The **agent loop** is the core logic responsible for orchestrating interaction between user, model, and tools. It is a request-response cycle where Codex CLI sends HTTP requests to the Responses API.
- Each cycle: user submits input -> Codex transforms it into a structured prompt (system instructions, available tools, contextual metadata about local dev environment) -> model either produces a final message or requests a tool call -> if tool call, Codex executes locally, appends results to prompt, resubmits -> loop continues until model stops emitting tool calls.
- **Stateless request handling** for Zero Data Retention compliance — the model has no persistent memory between API calls; all context must be in the prompt.
- **Prompt caching** optimization: strategically structured prompts so that the prefix (system instructions, tool definitions) remains stable across turns, achieving cache hits that reduce latency and cost. This achieves linear rather than quadratic performance.
- **Automatic context window management** through intelligent compaction — when the conversation grows too long, the harness compacts older turns while preserving critical information.
- **Sandboxed execution**: every tool call runs in an isolated environment. The model can execute shell commands, read/write files, but within strict boundaries.
- Key models: GPT-5-Codex (September 2025) was the first GPT-5 optimized for agentic coding. GPT-5.2-Codex (December 2025) was the turning point where autonomous coding agents became considered reliable.
- The post emphasizes that the harness (agent loop implementation) is just as important as the model — a world-class model with a poor harness will underperform.

---

## 5. SWE-agent — Agent-Computer Interfaces for Automated Software Engineering (https://github.com/SWE-agent/SWE-agent)

**Published:** NeurIPS 2024 (https://openreview.net/forum?id=mXpq6ut8J3)

- SWE-agent facilitates LLM agents to autonomously use computers to solve software engineering tasks via a custom **Agent-Computer Interface (ACI)**.
- The ACI enhances agents' ability to create/edit code files, navigate repositories, and execute tests — analogous to how HCI (Human-Computer Interface) design matters for human productivity.
- Key ACI design decisions:
  - Custom file viewer with search, scroll, and context display.
  - Simplified edit commands that show the agent a before/after diff.
  - Linting feedback integrated into the edit loop to catch syntax errors immediately.
  - Repository-level navigation commands (find files, grep, directory traversal).
- The quality of the interface matters more than model scale — Mini-SWE-Agent achieves >74% on benchmarks in just 100 lines of Python, demonstrating that architecture design matters more than complexity.
- Each task runs in a **dedicated Docker sandbox** with full shell access within strict boundaries, isolating the impact of mistakes.
- Repository context is managed through an `AGENTS.md` file encoding team-specific conventions.

---

## 6. OpenHands — Open Platform for AI Software Developers (https://github.com/OpenHands/OpenHands, https://arxiv.org/abs/2407.16741)

**Published:** 2024–2026 (ICLR 2025)

- OpenHands is an open-source, model-agnostic platform for cloud coding agents, allowing agents to interact like human developers: writing code, using command lines, browsing the web.
- **Event stream architecture**: all agent-environment interactions flow as typed events through a central hub. This event-sourced state model with immutable configuration enables replay, debugging, and audit.
- V0 had a monolithic, sandbox-centric design; **V1 refactored** into a modular SDK with clear boundaries, opt-in sandboxing, and reusable agent/tool/workspace packages.
- **Multi-agent delegation**: agents can hand off subtasks to the most qualified collaborator, supporting division of labor and skill specialization.
- Docker-sandboxed execution by default, built-in browser automation, and workspace-level remote interfaces.
- The **Software Agent SDK** provides Python and REST APIs for building agents that can be run locally or scaled to thousands of agents in the cloud.
- Key insight: the platform separates the agent logic from the execution environment, allowing any model to drive the agent while the SDK handles sandboxing, tool execution, and state management.

---

## 7. Agentless — Demystifying LLM-based Software Engineering Agents (https://arxiv.org/abs/2407.01489)

**Published:** 2024 (ACM)

- Agentless is a deliberately simple, **non-agentic approach** to autonomous software engineering: no agent loop, no autonomous decision-making by the LLM.
- Three-phase deterministic pipeline:
  1. **Localization** — hierarchical fault localization: file-level -> class/function-level -> fine-grained edit locations. Uses the LLM to progressively narrow down where the bug lives.
  2. **Repair** — samples multiple candidate patches in simple diff format.
  3. **Patch Validation** — generates reproduction tests, runs regression tests, and selects the best patch.
- Achieved 32.00% on SWE-bench Lite (96 correct fixes), outperforming all open-source agent-based approaches at the time, with comparably low cost.
- Adopted by OpenAI, Meta, DeepSeek, and inspired design of subsequent agents.
- Key insight: a simple, interpretable procedural approach can outperform complex agent-based systems. The LLM is used as a tool within a structured pipeline, not as an autonomous decision-maker.
- This challenges the assumption that more autonomy = better performance; structured decomposition with targeted LLM calls can be more reliable.

---

## 8. Aider — AI Pair Programming Architecture (https://aider.chat/, https://simranchawla.com/understanding-ai-coding-agents-through-aiders-architecture/)

- Aider is a terminal-based AI pair programmer that connects a local git repo to LLMs (GPT-4o, Claude, DeepSeek, etc.).
- Core innovation: the **repository map** system.
  - Uses **Tree-sitter AST parsing** for definition/reference extraction across 40+ languages.
  - Builds a **NetworkX dependency graph** with **PageRank ranking** to identify the most structurally important code elements.
  - Token-optimized repository maps using **binary search** to fit symbols within configurable token budgets.
  - Achieves high efficiency: 4.3–6.5% context utilization while preserving architectural context through dependency graphs.
- **Context prioritization hierarchy**:
  - Always included: system instructions, repository map (file/function structure).
  - Dynamically selected: relevant file contents, related files via dependency analysis, similar pattern examples.
  - Lowest priority: chat history beyond recent context, unrelated files.
- Multi-file editing that respects project architecture with automatic, descriptive git commits.
- Key insight: you need intelligent context selection, not bigger context windows. The repository map provides broad awareness while selected file contents give implementation details where needed.

---

## 9. Devin — Coding Agents 101 (https://devin.ai/agents101)

**Published:** June 2025

- Devin operates as a fully autonomous agent: you describe a task, it plans, codes, tests, and delivers a PR. It spins up its own cloud environment with terminal, code editor, and browser.
- Sequential decision-making at each step: write code, compile, run tests, check for errors, leveraging reinforcement learning to learn from iterative feedback.
- **Key principles for effective agent use:**
  - **"Say how you want things done, not just what"** — the most important prompting principle. Tell the agent your preferred approach, not just the end goal.
  - **Knowledge management** — use `.devin/` directory with markdown files for project conventions, architecture decisions, and codebase maps. This is the agent's "onboarding documentation."
  - **Task decomposition** — break complex work into focused, well-scoped tasks. Think of delegating to a junior engineer.
  - **Feedback loops** — review agent output, provide specific corrections, and iterate.
- Devin 2.0 (April 2025) introduced cloud-based development with multiple parallel instances, each in an isolated VM.
- The document emphasizes that senior-to-staff engineers adopt agents fastest because they already know how to decompose problems, write clear specs, and review work — skills that transfer directly to agent supervision.

---

## 10. Sourcegraph — Lessons from Building AI Coding Assistants: Context Retrieval (https://sourcegraph.com/blog/lessons-from-building-ai-coding-assistants-context-retrieval-and-evaluation)

**Published:** February 2025 (RecSys '24 industry paper)

- To go from LLM to coding assistant, **context is key**: without codebase-specific context, an LLM can only provide generic responses.
- The **context engine** retrieves and ranks relevant code for the LLM, using multiple retrieval strategies:
  - **Keyword/lexical search** — fast pattern matching for exact references.
  - **Semantic/embedding search** — vector similarity for conceptual relevance.
  - **Graph-based retrieval** — following dependency chains and call graphs.
- Retrievers are **complementary**: keyword search finds direct references, semantic search surfaces conceptually related code with different terminology. Combining multiple retrievers yields better recall.
- **Evaluation challenges**: standard retrieval metrics (precision, recall, MRR) don't fully capture quality for coding assistants. They developed custom evaluation frameworks measuring whether the context actually improves the LLM's output quality.
- The context pipeline: query understanding -> multi-strategy retrieval -> re-ranking -> context assembly within token budget -> LLM inference.
- Key finding: the retrieval/context layer is often more impactful than the choice of LLM model. A weaker model with great context can outperform a stronger model with poor context.

---

## 11. JetBrains Research — Cutting Through the Noise: Smarter Context Management for LLM-Powered Agents (https://blog.jetbrains.com/research/2025/12/efficient-context-management/)

**Published:** December 2025

- Agents "take notes" on every generated output, and after a while, the accumulated context piles up so high that finding what's useful takes more token budget than the work itself.
- Two main approaches to managing context growth:
  1. **Observation masking** — selectively hiding/removing old observations (tool outputs) that are no longer relevant, keeping only the most recent or most important.
  2. **LLM summarization** — using a smaller/cheaper model to summarize older context into a compressed form.
- Key finding: **observation masking outperforms LLM summarization** in overall efficiency and reliability.
- Both approaches consistently **cut costs by over 50%** compared to unmanaged memory, drastically reducing context growth without hurting agents' ability to solve problems.
- The research measured impact on SWE-bench tasks, finding that agents with managed context performed comparably to (and sometimes better than) agents with full unmanaged context, while using far fewer tokens.
- Implications for agent design: context management should be a first-class component of agent architecture, not an afterthought.

---

## 12. ContextBench — Benchmark for Context Retrieval in Coding Agents (https://arxiv.org/abs/2602.05892)

**Published:** February 2026

- ContextBench is a **process-oriented evaluation** of context retrieval in coding agents, with 1,136 issue-resolution tasks from 66 repositories across 8 programming languages.
- Each task is augmented with **human-annotated gold contexts** — the specific code files/functions that experts identified as necessary for resolving the issue.
- Automated evaluation framework tracks **agent trajectories** and measures context recall, precision, and efficiency throughout issue resolution.
- Key findings — "The Bitter Lesson" of coding agents:
  - Sophisticated agent scaffolding yields **only marginal gains** in context retrieval compared to simpler approaches.
  - LLMs consistently **favor recall over precision** — they retrieve more context than needed rather than risking missing something.
  - Substantial **gaps exist between explored and utilized context** — agents look at far more code than they actually use in their solutions.
- This benchmark fills a critical gap: existing evaluations focus on final task success (did the patch work?) but provide limited insight into **how** agents retrieve and use context during problem solving.
- Companion benchmark SWE Context Bench (https://arxiv.org/abs/2602.08316) focuses specifically on context learning in coding tasks.

---

## 13. LangChain — Open SWE: Open-Source Asynchronous Coding Agent (https://blog.langchain.com/introducing-open-swe-an-open-source-asynchronous-coding-agent/)

**Published:** 2025

- Open SWE is the first open-source, async, cloud-hosted coding agent, built on LangGraph.
- Design philosophy: agents will be **long-running, asynchronous, and more autonomous** — running in the cloud, integrating with existing tooling, with enough codebase context to plan over longer horizons.
- Multi-agent architecture with dedicated **Planner** and **Reviewer** components:
  - The Planner researches the codebase to form a robust strategy first.
  - The agent writes code, runs tests, and reviews its own work before completing.
- Every task runs in a **dedicated cloud sandbox** with full shell access within strict boundaries.
- Context management: repository context via `AGENTS.md` files encoding team conventions; task-specific context from issue trackers and communication channels.
- Open SWE targets asynchronous, cloud-based tasks that run while developers work on other things, matching how teams actually delegate work.
- Key architectural insight: the overall flow and UX (how tasks are delegated, monitored, and reviewed) matters as much as the prompts and tools used.

---

## 14. MetaGPT and ChatDev — Multi-Agent Software Development (https://github.com/FoundationAgents/MetaGPT, https://arxiv.org/html/2308.00352v6)

**Published:** 2023–2024 (ICLR 2024 for MetaGPT)

- **MetaGPT** formalizes the "software company" pattern: `Code = SOP(Team)`. It materializes Standard Operating Procedures and applies them to LLM-agent teams.
  - Roles: Product Manager, Architect, Project Manager, Engineer, QA Engineer.
  - Workflow: requirements -> architecture design (with sequence diagrams) -> task allocation -> code generation -> testing/review.
  - Key differentiator: **structured communication** (documents, diagrams, schemas) rather than free-form natural language chat between agents.
- **ChatDev** uses the waterfall model with agents mimicking CEO, CTO, CPO, Programmer, Designer, Tester, Reviewer roles.
  - Phases: designing, coding, testing, documenting.
  - Agents communicate through **dialogue** (natural language), unlike MetaGPT's structured artifacts.
- Both demonstrate that multi-agent role specialization can decompose complex software tasks, but MetaGPT's structured communication reduces hallucination and miscommunication between agents.
- Key tension: role-based multi-agent systems add coordination overhead. For many tasks, a single well-prompted agent outperforms a team of poorly-coordinated specialized agents.

---

## 15. Addy Osmani — Self-Improving Coding Agents (https://addyosmani.com/blog/self-improving-agents/)

**Published:** 2025

- The **continuous coding loop** ("Ralph Wiggum technique"): break development into many small tasks and run an AI agent in a loop to tackle them one by one.
- Each iteration: pick next task -> implement -> validate (run tests, type checks) -> commit if checks pass -> update task status, log learnings -> reset agent context -> repeat.
- **Stateless but iterative** design: by resetting memory each iteration, the agent avoids accumulating confusion. Each run starts with a fresh, bounded prompt for a single well-defined task.
- **Memory persistence** across iterations via external files:
  - Task list (JSON/markdown) tracking status, blockers, and dependencies.
  - `LEARNINGS.md` file where the agent logs discoveries about the codebase.
  - `CHANGELOG.md` for tracking what was done.
- **QA validation loop**: every change must pass automated tests before being committed. If tests fail, the agent gets feedback and retries (with a retry limit to prevent infinite loops).
- Scaling strategies: run multiple agents in parallel on independent tasks, use orchestrator agents to coordinate, implement dependency-aware task scheduling.
- Risk management: use feature branches, automated rollback on test failure, human review gates for critical changes.

---

## 16. Victor Dibia — The Agent Execution Loop: Building an Agent From Scratch (https://victordibia.com/blog/agent-execution-loop/)

**Published:** December 2025

- Three core agent components: **Model** (reasoning engine), **Tools** (functions for action), **Memory** (short-term conversation history + long-term persistent storage).
- The execution loop:
  1. Receive user input and add to message history.
  2. Call the LLM with the full message history + tool definitions.
  3. If the LLM returns a tool call: execute the tool, append the result to history, go to step 2.
  4. If the LLM returns a final message: return to user.
- **Tool calling** is the mechanism that transforms a text-generating model into an agent. The model decides which tools to invoke and with what parameters based on the conversation context.
- Key design decisions:
  - **Streaming** — tokens are produced incrementally, enabling real-time display.
  - **Error handling** — tool failures must be gracefully communicated back to the model so it can adapt.
  - **Loop termination** — preventing infinite loops via max iteration limits, timeout guards, and explicit stop conditions.
- The post emphasizes that understanding this loop is essential — all commercial agents (Claude Code, Gemini CLI, Copilot) are variations on this same fundamental pattern.

---

## 17. Martin Fowler / Thoughtworks — Context Engineering for Coding Agents (https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html)

**Published:** February 2026

- Context engineering definition: "curating what the model sees so that you get a better result."
- Main categories of context in coding agents:
  1. **Reusable Prompts** — divided into Instructions ("do X in this way") and Guidance ("always follow convention Y").
  2. **Context Interfaces** — descriptions of how the LLM can get more context on demand:
     - **Tools**: built-in capabilities (bash, file search, etc.).
     - **MCP Servers**: custom programs providing data sources and actions.
     - **Skills**: descriptions of additional resources, instructions, and scripts the LLM can load on demand when it decides they are relevant.
  3. **Injected Context** — information automatically added to the prompt by the harness: project structure, recent git history, file contents, etc.
- **Claude Code as case study**: CLAUDE.md files for project instructions, slash commands for reusable prompts, MCP integration for tool extensibility, and skills as a new pattern where the agent decides what additional context to load.
- Key insight: the explosion of context configuration options means that **context engineering is becoming a huge part of the developer experience** of coding agents, not just a backend concern.

---

## 18. Tweag / Modus Create — Introduction to Agentic Coding (https://www.tweag.io/blog/2025-10-23-agentic-coding-intro/)

**Published:** October 2025

- Agentic coding is a **structured, AI-assisted workflow** where skilled engineers prompt intentionally, validate rigorously, and guide output within clear architectural boundaries.
- Contrast with "vibe coding" (loose, improvisational prompting):
  - Agentic: structured plan, scoped prompts, rigorous validation, human-guided architecture.
  - Vibe: no planning, loose prompts, ad-hoc testing, model-guided architecture.
- Based on a controlled experiment: two teams, same scope, same timeline. The agentic team used AI agents to scaffold, implement, and iterate.
- Key practices:
  - **Implementation plans** before any code generation.
  - **Bounded tasks** — each prompt is scoped to a single, well-defined unit of work.
  - **Validation gates** — tests and reviews after each agent output.
  - **Context files** — project rules, architecture docs, and conventions fed to the agent.
- Insight: agentic coding shifts the engineer's role from typing code to **designing systems, decomposing problems, and validating outputs**.

---

## 19. Tribe AI / Ellipsis — Lessons from 27 Months Building LLM Coding Agents (https://www.tribe.ai/applied-ai/lessons-from-27-months-building-llm-coding-agents)

**Published:** January 2025

- Architecture: GitHub App -> webhook events -> workflow queue -> agent execution. Asynchronous processing where latency matters less than accuracy.
- **Many small specialized agents** instead of one mega-agent: dozens of smaller agents independently benchmarked and optimized.
  - Multiple **Comment Generators** run in parallel to find different types of issues (rule violations, duplicated code, etc.).
  - Multi-stage **Filtering Pipeline** to reduce false positives — developers' most common complaint about AI code review.
  - Filtering includes: deduplication, logical correctness checks (detecting hallucinations), and comment refinement.
- **Mix and match models**: different generators can use different models (GPT-4o vs Sonnet) — why choose one when you can use both?
- Code search architecture:
  - **Two-pass embedding**: first chunk the codebase, then embed with code-specialized models.
  - **Hybrid retrieval**: combine BM25 (keyword) with vector similarity, then re-rank.
  - **Graph-aware context**: follow import chains and call graphs to find related code.
- Key lesson: making the problem easier for the LLM is more effective than making the LLM bigger. Decomposition and specialization beat monolithic agents.

---

## 20. SWE-bench — Evaluation Benchmarks for Coding Agents (https://www.swebench.com/, https://www.vals.ai/benchmarks/swebench)

- **SWE-bench**: 2,294 real-world GitHub issues from 12 Python repositories, challenging agents to generate patches that resolve issues.
- **SWE-bench Verified**: 500 human-verified samples, removing problematic test cases.
- **SWE-bench Pro**: 1,865 problems from 41 repositories, spanning 123 programming languages.
- **SWE-rebench**: re-evaluation addressing test leakage and weak test cases.
- 2025-2026 leaderboard results:
  - Best systems resolve ~72-81% on SWE-bench Verified (Verdent: 76.1% pass@1, 81.2% pass@3).
  - On the harder SWE-bench Pro, best performers (GPT-5, Claude Opus 4.1) achieve only ~23%.
  - Open-source models catching up: Qwen3-Coder-Next showing strong performance with ~3B active parameters.
- **Solution leakage problem**: 60.83% of "resolved" issues involve solution leakage in the benchmark; 47.93% were incorrectly marked as resolved due to weak test cases. Filtered resolution rates drop from 42.1% to 21.8%.
- Key evaluation insight: end-to-end benchmarks measure outcomes but not process. ContextBench and SWE Context Bench address this gap by evaluating how agents retrieve and use context, not just whether the final patch works.

---

## 21. Cursor — AI-Native IDE Architecture (https://cursor.com/docs/context/codebase-indexing, https://blog.bytebytego.com/p/how-cursor-serves-billions-of-ai)

- Cursor is a VS Code fork rebuilt as an AI-native IDE with three interaction modes: **Tab** (autocomplete), **Chat** (conversation), **Composer** (multi-file agent).
- **Codebase indexing pipeline**:
  1. Project opened -> files analyzed and split into chunks (functions, classes).
  2. Chunks encrypted locally, sent to Cursor's server with obfuscated identifiers.
  3. Server computes embedding vectors using a code-specialized AI model.
  4. Vectors stored in a vector database (Turbopuffer) for semantic search.
- **Tab Completions** (60-70% of routine coding): custom models predict next actions based on codebase index, recent changes, and surrounding code context. Goes beyond single-word to multi-line edits.
- **Semantic search**: understands the codebase through embeddings, enabling natural language queries to find relevant code.
- Architecture enables: rapid file search, context-aware suggestions across the whole project, and multi-file agent edits grounded in project-specific understanding.

---

## 22. Academic Survey — LLM-based Agents for Software Engineering (https://arxiv.org/abs/2408.02479, https://arxiv.org/abs/2510.09721)

**Published:** 2024-2025

- Comprehensive surveys covering 150+ papers on LLM-powered software engineering.
- Taxonomy of approaches:
  1. **Prompt-based paradigms** — carefully crafted prompts for specific SE tasks (code generation, bug fixing).
  2. **Fine-tuning-based paradigms** — domain-specific model training on code datasets.
  3. **Agent-based paradigms** — autonomous systems with planning, tool use, and feedback loops.
- LLM-based code generation agents simulate the complete human programmer workflow: analyzing requirements, writing code, running tests, diagnosing errors, applying fixes.
- Six key SE topics covered: requirement engineering, code generation, autonomous decision-making, software design, test generation, software maintenance.
- The survey identifies a **convergence** in agent architectures: most successful systems combine hierarchical planning, tool-augmented execution, and iterative feedback loops, regardless of the specific framework used.
- Open challenges: long-horizon planning (maintaining coherence across many steps), cross-repository understanding, handling ambiguous requirements, and cost/latency optimization.

---

## Synthesis: Cross-Cutting Themes and Key Takeaways

### 1. The Agent Loop is Universal

Every coding agent — whether Codex CLI, Claude Code, SWE-agent, OpenHands, or Aider — implements the same fundamental loop: receive input -> prompt the model -> model either responds or requests a tool call -> execute the tool -> feed results back -> repeat until done. The differences lie in the harness design around this loop: how tools are defined, how context is managed, and how the loop terminates.

### 2. Context Engineering > Model Selection

Multiple sources (Sourcegraph, Aider, JetBrains, Anthropic) converge on the same finding: **the quality of context provided to the model matters more than the choice of model**. A weaker model with excellent context can outperform a stronger model with poor context. This makes context engineering — retrieval, ranking, compaction, and budget management — the highest-leverage engineering work in agent development.

### 3. The Spectrum from Agentless to Fully Autonomous

There is a clear spectrum of agent architectures:
- **Agentless** (structured pipeline, no autonomous decisions) — simpler, cheaper, surprisingly competitive.
- **Single-agent with tools** (Aider, Codex CLI, Claude Code) — one model with access to tools, making sequential decisions.
- **Multi-agent with roles** (MetaGPT, ChatDev, OpenHands, Open SWE) — specialized agents coordinating through structured communication.
- **Fully autonomous loops** (Devin, self-improving agents) — agents running unsupervised for extended periods.

The Agentless result (outperforming complex agents with a simple 3-phase pipeline) is a crucial counterpoint to the assumption that more autonomy always means better results. The right point on this spectrum depends on task complexity, cost constraints, and reliability requirements.

### 4. Context Retrieval is Multi-Strategy

Effective agents combine multiple retrieval approaches:
- **Lexical search** (grep, ripgrep) for exact pattern matching.
- **Semantic search** (embeddings, vector databases) for conceptual similarity.
- **AST-based extraction** (Tree-sitter) for structural code understanding.
- **Graph-based traversal** (dependency graphs, call graphs, PageRank) for architectural context.
- **Agentic search** (the model itself decides what to search for next, iterating until it has enough context).

No single strategy is sufficient. The best systems layer these approaches, with the agent itself orchestrating which strategy to use based on the query type.

### 5. Structured Handoffs Enable Long-Running Work

For agents working across multiple sessions or context windows, the critical design pattern is **structured handoffs**: explicit artifacts (scratchpads, task lists, learnings files, status documents) that bridge the gap between sessions. Compaction alone is not enough — agents need external persistent state to maintain coherence over long-running tasks. Both Anthropic's long-running harness and Osmani's continuous coding loop independently converge on this pattern.

### 6. Decomposition Beats Monolithic Prompts

Across all sources: breaking work into small, bounded tasks with clear success criteria dramatically outperforms asking an agent to handle complex work in one shot. This applies at every level — from Addy Osmani's task-per-iteration loop to Tribe AI's many-small-agents architecture to Devin's recommendation to decompose like you would for a junior engineer.

### 7. Evaluation is an Unsolved Problem

SWE-bench and its variants have driven rapid progress but suffer from solution leakage, weak test cases, and end-to-end-only evaluation. ContextBench represents an important shift toward **process-oriented evaluation** — measuring not just whether the final patch works, but how effectively the agent retrieves and uses context. The finding that "sophisticated scaffolding yields only marginal gains in context retrieval" (ContextBench's "Bitter Lesson") suggests that improvements in the base model's reasoning may matter more than elaborate agent frameworks for context quality.

### 8. The Harness is as Important as the Model

OpenAI, Anthropic, and Tribe AI all emphasize that the **orchestration logic** (harness/agent loop) around the model is as important as the model itself. This includes: prompt structure and caching strategy, tool definitions and sandboxing, context window management, error recovery, loop termination, and human-in-the-loop integration points. A world-class model with a poor harness underperforms.

### 9. The Developer's Role is Shifting

From Tweag's agentic coding experiments to Devin's observation that senior engineers adopt agents fastest: the engineer's role is shifting from writing code to **designing systems, decomposing problems, writing specifications, and reviewing outputs**. Context engineering (writing CLAUDE.md files, structuring project conventions, defining rules) is becoming a core developer skill.

### 10. Cost and Reliability are the Current Frontiers

The most capable agent systems can solve 23-81% of real-world issues depending on the benchmark, but at significant cost and with variable reliability. The next frontier is making agents reliable enough for unsupervised operation while keeping costs manageable. Observation masking (JetBrains), prompt caching (OpenAI), and intelligent context budgeting (Aider) are all approaches to this efficiency challenge.
