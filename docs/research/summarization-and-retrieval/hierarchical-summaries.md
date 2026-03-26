# Hierarchical Code Summarization & Multi-Level Code Abstraction

Research conducted: 2026-03-25
Topic: Hierarchical representations of codebases, tiered summarization strategies, multi-granularity code understanding, and tools for layered code abstraction.

---

## Source 1: Code-Craft: Hierarchical Graph-Based Code Summarization for Enhanced Context Retrieval (https://arxiv.org/html/2504.08975v1)

**Authors:** David Sounthiraraj, Jared Hancock, Yassin Kortam, Ashok Javvaji, Prabhat Singh, Shaila Shankar (Cisco Systems)

- Introduces Hierarchical Code Graph Summarization (HCGS), a multi-layered representation of a codebase built by generating structured summaries in a **bottom-up fashion** from a code graph
- Uses the **Language Server Protocol (LSP)** for language-agnostic code analysis, making it applicable across programming languages
- Employs a **parallel level-based algorithm** for efficient summary generation — nodes at the same depth in the dependency graph are summarized concurrently
- Each summary incorporates the context of its dependencies, capturing not only syntactic structure but also semantic meaning and relationships between functions
- Constructs a **code graph** where nodes are functions/methods and edges represent call dependencies; summaries propagate upward from leaf functions to high-level entry points
- Evaluation on **5 diverse codebases totaling 7,531 functions** showed up to **82% relative improvement** in top-1 retrieval precision for large codebases (libsignal: 27.15 percentage point improvement)
- Achieves **perfect Pass@3 scores** for smaller repositories
- Hierarchical summaries consistently outperform traditional code-only retrieval across all metrics, with the largest gains in bigger, more complex codebases where understanding function relationships is crucial
- Uses a **structured summary schema** that captures implementation details, dependencies, and cross-function relationships
- Key insight: flat text representations of code lose the structural relationships that are critical for understanding large systems

## Source 2: Hierarchical Repository-Level Code Summarization for Business Applications Using Local LLMs (https://arxiv.org/html/2501.07857v1)

**Authors:** Nilesh Dhulshette, Sapan Shah, Vinay Kulkarni (TCS Research, Tata Consultancy Services) — Presented at LLM4Code Workshop, ICSE 2025

- Proposes a **two-step hierarchical approach** for repository-level code summarization tailored to business applications
- **Step 1:** Smaller code units (functions, variables) are identified using **syntax analysis (AST parsing)** and summarized with local LLMs
- **Step 2:** These summaries are **aggregated** to generate higher-level file and package summaries
- Key innovation: **custom prompts** capture the intended purpose of code artifacts based on the **domain and business context** of the application, not just implementation details
- Uses a **Java parser** to generate Abstract Syntax Trees (ASTs) that decompose large code files into segments: classes, functions, constructors, enums, interfaces
- The AST provides a hierarchical representation where each node corresponds to different language constructs
- Evaluated on a **Business Support System (BSS) for telecommunications domain**
- Results show that syntax analysis-based hierarchical summarization **improves coverage**, while business-context grounding **enhances relevance** of generated summaries
- Addresses a real problem: developers spend **more than 50% of their time** comprehending existing code
- Local LLMs can handle smaller units effectively but struggle with entire files or packages — the hierarchical decomposition solves this context-window limitation
- Three levels of granularity: **method/function -> file -> package**

## Source 3: Commenting Higher-level Code Unit: Full Code, Reduced Code, or Hierarchical Code Summarization (https://arxiv.org/html/2503.10737)

**Authors:** Weisong Sun, Yiran Zhang, Jie Zhu, Zhihui Wang, Chunrong Fang et al. (Nanyang Technological University, Nanjing University, Yangzhou University) — March 2025

- Directly compares **three strategies** for automated code summarization of file-level and module-level code units:
  1. **Full code summarization:** Pass the entire code unit to the LLM
  2. **Reduced code summarization:** Strip implementation details, keep signatures and structure
  3. **Hierarchical code summarization:** First generate summaries for lower-level code units, then use those summaries to generate summaries for higher-level units
- Most existing ACS (Automated Code Summarization) techniques focus on **method-level** — this paper is among the first to systematically study **file-level and module-level** summarization
- Demonstrates model effectiveness through **zero-shot evaluation** on various code summarization tasks
- Finds that **hierarchical summarization** is particularly effective when context windows are limited — it compresses information while preserving structural relationships
- The hierarchical approach first generates method-level summaries, then uses those as building blocks for file-level summaries, which feed into module-level summaries
- Addresses a significant research gap: summaries of higher-level code units are **highly useful** for onboarding, architectural understanding, and maintenance, yet remain underexplored
- Key finding: the optimal strategy depends on the **level of abstraction** — what works best for files may differ from what works best for modules

## Source 4: Repository-Level Code Understanding by LLMs via Hierarchical Summarization: Improving Code Search and Bug Localization (https://link.springer.com/chapter/10.1007/978-3-031-97576-9_6)

**Published at:** ICCSA 2025 Workshops (Computational Science and Its Applications), June 2025

- Introduces a **structure-aware methodology** for creating repository-aware LLMs using hierarchical summarization
- **Pre-processing phase:**
  1. Constructs an **abstract repository tree** reflecting the directory/file structure
  2. Creates a **context-aware LLM** primed with project knowledge
  3. Generates hierarchical summaries at **three levels: project, directory, and file**
- **Inference phase:** Employs a **top-down search strategy** — the LLM progressively narrows from directory-level to file-level, effectively localizing bug-relevant code
- Mitigates the **context window bottleneck** by providing structured, hierarchical summaries instead of raw code
- Evaluated on a **real-world Jira dataset** from a large-scale industrial project
- Achieves **Pass@10 of 0.89** and **Recall@10 of 0.33**, significantly outperforming both flat retrieval baselines and state-of-the-art LLM+RAG systems
- Key insight: the top-down search mirrors how human developers navigate codebases — start with the project overview, drill into the relevant directory, then find the specific file
- Addresses the **domain and vocabulary mismatch** between end-user bug reports and codebase semantics

## Source 5: Meta-RAG on Large Codebases Using Code Summarization (https://arxiv.org/html/2508.02611v1)

**Authors:** Vali Tawosi, Salwa Alamir, Xiaomo Liu, Manuela Veloso (JP Morgan AI Research) — Presented at AGENT 2026 Workshop, ICSE 2026

- Proposes **Meta-RAG**, a novel RAG approach that uses summaries to **condense codebases by an average of 79.8%** into a compact, structured, natural language representation
- Multi-agent system for **bug localization** in large pre-existing codebases
- Hierarchical retrieval process:
  1. Starts with **one-liner file summaries** — the Control Agent short-lists relevant files
  2. Provides **full summaries** of selected files — the agent then selects relevant code parts (classes, functions)
  3. Delivers the actual **code** for final analysis
- Summaries are generated via AST parsing and stored in a database, structurally matched to file structures
- Achieves **84.67% file-level** and **53.0% function-level** correct localization rates on SWE-bench Lite — state-of-the-art performance
- The 79.8% compression ratio demonstrates that most code can be effectively represented by structured natural language summaries without losing critical semantic information
- Key architectural insight: the progressive zoom (one-liner -> full summary -> code) maps directly to the hierarchical abstraction levels of a codebase

## Source 6: DocAgent: A Multi-Agent System for Automated Code Documentation Generation (https://arxiv.org/html/2504.08725v1)

**Authors:** Dayu Yang, Antoine Simoulin, Xin Qian, Xiaoyi Liu, Yuwei Cao, Zhaopu Teng, Grey Yang (Meta AI) — ACL 2025

- Uses **topological code processing** for incremental context building — processes code components by analyzing dependencies, starting with files having fewer dependencies
- Five specialized agents: **Reader** (extracts code structure), **Searcher** (finds related context), **Writer** (drafts docstrings), **Verifier** (checks quality), **Orchestrator** (coordinates)
- The hierarchical processing order is critical: builds a **documented foundation** before tackling more complex, dependency-heavy code
- **Ablation study confirms** the vital role of the topological processing order — without it, documentation quality degrades significantly
- Multi-faceted evaluation framework assessing **Completeness, Helpfulness, and Truthfulness**
- Significantly outperforms baselines consistently across all evaluation dimensions
- Key insight for hierarchical summarization: **processing order matters** — you must summarize dependencies before dependents, building context bottom-up
- Available as open source from Facebook Research

## Source 7: Code Summarization Beyond Function Level (https://arxiv.org/html/2502.16704v1)

**Authors:** Vladimir Makharev, Vladimir Ivanov (Innopolis University, AIRI) — LLM4Code Workshop, ICSE 2025

- Investigates the effectiveness of code summarization models **beyond the function level**, exploring the impact of class and repository contexts on summary quality
- Uses revised benchmarks for evaluating models at **class and repository levels** (Modified ClassEval, Modified CodeSearchNet)
- **Deepseek Coder 1.3B** and **Starcoder2 15B** demonstrated substantial improvements in BLEURT, METEOR, and BLEU-4 at both class and repository levels
- Fine-tuned **CodeT5+ base model** excelled in function-level code summarization
- Few-shot learning and **RAG with retrieved code chunks** significantly enhanced LLM performance
- Repository-level summarization shows promising potential but **necessitates significant computational resources** and benefits from structured context
- Employs the **SIDE code summarization metric** in evaluation
- Key finding: adding class and repository context improves function-level summaries, confirming that **hierarchical context propagation** benefits all levels

## Source 8: Beyond More Context: How Granularity and Order Drive Code Completion Quality (https://arxiv.org/html/2510.06606v1)

**Authors:** Uswat Yusuf, Genevieve Caumartin, Diego Elias Costa — ASE 2025 Context Collection Challenge

- Demonstrates that **granularity matters more than quantity** for code context — selecting code snippets rather than complete files improves model performance
- **Chunk-based retrieval** using static analysis achieved a **6% improvement** over file-retrieval strategy and **16% over the no-context baseline** for Python
- Reversing the order of selected code snippets yields a small improvement, suggesting **ordering effects** on LLM attention
- Key finding: overloading a model's context window leads to **noise** and degrades performance — more context is not always better
- The results highlight the importance of **retrieval granularity, ordering, and hybrid strategies** in developing effective context collection pipelines
- Directly validates the hierarchical approach: finer-grained, well-selected context outperforms coarse file-level context

## Source 9: Codified Context: Infrastructure for AI Agents in a Complex Codebase (https://arxiv.org/html/2602.20478v1)

**Author:** Aristidis Vasilopoulos (Independent Researcher) — February 2026

- Presents a **three-tier codified context infrastructure** developed during construction of a 108,000-line C# distributed system:
  - **Tier 1 (Hot memory):** A constitution (~660 lines, 0.6% of code) encoding conventions, retrieval hooks, and orchestration protocols — always loaded
  - **Tier 2 (Specialist agents):** 19 specialized domain-expert agents (~9,300 lines, 8.6%) invoked per task via a trigger table
  - **Tier 3 (Cold memory):** A knowledge base of 34 on-demand specification documents (~16,250 lines, 15.0%) queried through an MCP retrieval service
- Establishes a **knowledge-to-code ratio of 24.2%** — for a 108k-line system, 26,200 lines of structured context documentation were needed
- Knowledge base served through a **Model Context Protocol (MCP) server** (~1,600 lines Python) with five search tools: list_subsystems, get_files_for_subsystem, find_relevant_context, search_context_documents, suggest_agent
- Developed across **283 sessions** with 2,801 human prompts and 1,197 agent invocations
- Key insight: single-file manifests (.cursorrules, CLAUDE.md) **do not scale** beyond modest codebases — a 100,000-line system requires a structured, tiered documentation architecture
- The three-tier structure maps to hierarchical code understanding: always-on conventions (system-level), domain-specific agents (module-level), and detailed specifications (component-level)
- Treats documentation as **load-bearing infrastructure** that AI agents depend on to produce correct output

## Source 10: ProConSuL: Project Context for Code Summarization with LLMs (https://aclanthology.org/2024.emnlp-industry.65/)

**Authors:** Vadim Lomshakov, Andrey Podivilov, Sergey Savin, Oleg Baryshnikov, Alena Lisevych, Sergey Nikolenko — EMNLP 2024 (Industry Track)

- Proposes **ProConSuL** (Project Context for Code Summarization with LLMs), a framework that provides LLMs with **precise structural information** from program analysis (compiler, IDE language services)
- Builds a **call graph** to provide context from callees — summaries include information about what a function calls, not just what it does
- Uses **task decomposition derived from code structure** — the summarization task is broken into subtasks aligned with the code's dependency graph
- Two-phase training: **SFT (supervised fine-tuning) + preference alignment** to train the model to effectively use project context
- Evaluation benchmark for **C/C++ functions** with proxy metrics
- Results: significant improvements in code summaries and **reduction of hallucinations** compared to base model (CodeLlama-7B-instruct)
- Key insight: **program analysis + hierarchical decomposition** is more effective than just giving the LLM more raw code — structured context enables better understanding

## Source 11: Aider Repository Map (https://aider.chat/docs/repomap.html)

**Tool:** Aider (open-source AI coding assistant)

- Uses a concise **repo map** of the whole git repository including the most important classes, functions, types, and call signatures
- Built automatically using **tree-sitter** to parse source files and extract symbol definitions
- Employs a **graph ranking algorithm (PageRank via NetworkX)** on a graph where source files are nodes and edges connect files with dependencies
- **Personalization** of PageRank based on chat context — files relevant to the current conversation are weighted higher
- The `to_tree()` method formats ranked tags into a **hierarchical tree structure** showing file paths and their definitions
- Only includes the **most important identifiers** — those most often referenced by other portions of the code
- **Token-budgeted**: optimizes the repo map by selecting the most important parts that fit within the active token budget
- Provides a practical middle ground: not full code, not just file names, but **structural signatures** that give the LLM enough context to understand APIs and relationships
- Key design principle: the LLM can see class/method/function signatures from everywhere in the repo, and can request specific files if it needs to see more

## Source 12: C4 Model for Software Architecture (https://c4model.com/introduction)

**Author:** Simon Brown

- Creates **"maps of your code"** at various levels of detail, analogous to Google Maps zoom levels
- Four hierarchical levels:
  1. **System Context:** How the software system fits into the world (users, external systems)
  2. **Container:** Applications and data stores inside the system (independently deployable units)
  3. **Component:** Building blocks and modules inside each container
  4. **Code:** Implementation details (e.g., UML class diagrams)
- Each level builds on the previous one, ensuring **consistency** across zoom levels
- The hierarchy serves **different audiences**: executives see System Context, architects see Containers, developers see Components and Code
- Key principle: abstraction levels work like **zoom levels on a map** — high-level describes the big picture, each successive level adds more implementation detail
- Directly applicable to code summarization: summaries at each C4 level would serve different purposes and different consumers
- Notation-independent and tooling-independent — the model is about the **abstraction hierarchy**, not specific diagram formats

## Source 13: Swimm Auto-Docs with Static Analysis (https://swimm.io/blog/how-swimm-uses-static-analysis-to-generate-quality-code-documentation)

**Author:** Omer Rosenbaum (Swimm) — November 2024

- Uses a **three-step deterministic approach** to generate hierarchical documentation:
  1. **Code mapping:** Deterministic static analysis identifies all relevant flows and logical components
  2. **Retrieval:** Deterministically retrieves relevant context for specific topics (grounded in actual code, not AI assumptions)
  3. **Generation:** LLMs transform accurately retrieved context into coherent explanations and diagrams
- Static analysis builds a **knowledge base** from the code, revealing architecture, patterns, and hidden logic
- Generates **Mermaid diagrams** to visualize flows and relationships
- Provides **overview documentation** giving developers a high-level summary for broad understanding of a system, project, or codebase
- Key differentiator: every part of the model's output is **anchored to specific parts of the codebase**, preventing hallucinations
- The deterministic foundation (static analysis) combined with LLM generation creates a reliable hierarchy: code structure -> retrieved context -> generated documentation

## Source 14: CocoIndex Multi-Codebase Summarization (https://cocoindex.io/examples-v1/multi-codebase-summarization)

**Tool:** CocoIndex (data transformation framework for AI)

- Builds a pipeline that automatically generates **one-pager wiki for each project** with incremental processing — always up-to-date
- Hierarchical summarization process:
  1. Scans subdirectories, treating each as a separate project
  2. **Per-file extraction** using LLM: extracts public classes, functions with summaries, and relationship graphs
  3. **Aggregation:** For multi-file projects, synthesizes all file summaries into one cohesive project overview
- Generates **Mermaid diagrams** showing call relationships
- Uses a **unified CodebaseInfo model**: project purpose (not individual files), most important public classes, most important public functions
- **Incremental processing:** When source data changes or processing logic updates, only reprocesses the minimum needed
- Practical implementation of hierarchical summarization: file-level -> project-level, with structured schemas at each level

## Source 15: JetBrains Research — Cutting Through the Noise: Smarter Context Management for LLM-Powered Agents (https://blog.jetbrains.com/research/2025/12/efficient-context-management/)

**Authors:** Katie Fraser, Tobias Lindenbauer (JetBrains Research / TUM) — NeurIPS 2025 (DL4Code Workshop)

- Empirical study comparing two context management approaches for coding agents:
  1. **Observation Masking:** Targets environment observation only, preserving action and reasoning history — the masked content is typically the largest portion of an agent's turn
  2. **LLM Summarization:** Reduces resolution of all three parts of involved turns by compressing long history into compact form
- Key finding: both approaches **reduce cost by ~50%** without significantly degrading downstream task performance
- Surprising result: sophisticated LLM summarization **cannot consistently outperform** simple observation masking — raises questions about the necessity of complex summarization strategies
- A hybrid combining both achieves an additional **7-11% cost reduction** over either alone
- Relevance to hierarchical summarization: suggests that for agent context management, **simpler compression** at the right granularity level can be as effective as complex multi-level summarization
- Challenges the assumption that more sophisticated summarization always yields better results

---

## Synthesis

### The Emerging Hierarchy

The research converges on a consistent multi-level hierarchy for code understanding:

| Level | Granularity | Typical Content | Primary Use |
|-------|------------|----------------|-------------|
| **L0** | Statement/expression | Raw code lines | Debugging, code review |
| **L1** | Function/method | Signature + behavior summary | API understanding, local changes |
| **L2** | Class/file | Aggregated function summaries + relationships | Module comprehension, file-level navigation |
| **L3** | Package/directory | Aggregated file summaries + dependency structure | Subsystem understanding, bug localization |
| **L4** | Repository/project | One-liner project summary + key architectural decisions | Onboarding, cross-repo navigation |

### Key Findings Across Sources

1. **Bottom-up summarization works.** Multiple papers (Code-Craft, TCS hierarchical, DocAgent) confirm that summarizing leaf-level units first and aggregating upward produces better results than trying to summarize entire files or packages directly. The hierarchical approach handles context window limitations while preserving structural relationships.

2. **Top-down search is the natural complement.** While summaries are built bottom-up, *retrieval* works best top-down (ICCSA 2025, Meta-RAG). Start with project-level summaries, narrow to directory, then file, then function. This mirrors how humans navigate codebases.

3. **Granularity beats quantity.** The ASE 2025 Context Collection Challenge (Source 8) demonstrates that chunk-level retrieval outperforms file-level retrieval by 6-16%. More context is not better — *the right level of abstraction* is better.

4. **Structured summaries outperform flat text.** Code-Craft's 82% improvement over code-only retrieval shows that capturing dependencies, relationships, and calling context in structured summaries dramatically improves retrieval and understanding tasks.

5. **Processing order matters.** DocAgent's ablation study confirms that topological ordering (process dependencies before dependents) is critical. Random processing order significantly degrades documentation quality.

6. **Business/domain context enriches summaries.** The TCS paper (Source 2) shows that adding domain and business context to summaries improves their relevance for real-world applications beyond what pure code analysis can achieve.

7. **The knowledge-to-code ratio is substantial.** Codified Context (Source 9) finds that a 108k-line system requires ~26k lines of structured context (24.2%) for AI agents to work effectively. Hierarchical organization of this context (hot/warm/cold tiers) is essential for scalability.

8. **Compression ratios are impressive.** Meta-RAG achieves 79.8% compression while maintaining state-of-the-art bug localization accuracy. This validates that hierarchical natural-language summaries can effectively replace raw code for many understanding tasks.

### Practical Architecture for Hierarchical Code Summaries

Based on the research, an effective system would:

1. **Parse:** Use tree-sitter or LSP to extract AST and dependency graphs (language-agnostic)
2. **Build graph:** Construct a call/dependency graph with functions as nodes and calls as edges
3. **Summarize bottom-up:** Generate L1 summaries for leaf functions first, then propagate upward incorporating dependency context
4. **Aggregate:** Combine L1 summaries into L2 (file), L2 into L3 (directory/package), L3 into L4 (project)
5. **Index:** Store summaries at each level with structural metadata for retrieval
6. **Retrieve top-down:** For queries, start at L4, narrow to L3/L2, retrieve L1/L0 only as needed
7. **Maintain incrementally:** Re-summarize only changed units and propagate updates upward (CocoIndex pattern)

### Open Challenges

- **Staleness:** Summaries must be updated when code changes. Incremental approaches (CocoIndex) help but add complexity.
- **Cross-cutting concerns:** Some code concepts span multiple levels (logging, error handling, security). Hierarchical summarization can miss these.
- **Optimal granularity is task-dependent:** Bug localization, code review, onboarding, and code generation each benefit from different levels of detail (JetBrains finding that simpler approaches sometimes suffice).
- **Evaluation metrics:** There is no standard benchmark for hierarchical code summarization. Most papers use proxy tasks (retrieval, bug localization) rather than direct summary quality assessment.
- **Computational cost:** Repository-level summarization requires significant resources (Source 7), especially for large codebases with deep dependency trees.
