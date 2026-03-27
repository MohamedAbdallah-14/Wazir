# Research Index

**123 files | 13 categories | 800+ sources**

---

## Categories

### 1. [Code Review](code-review/) — 13 files
How humans and machines review code, what works, what doesn't.

| File | Key Finding |
|------|-------------|
| [best-practices.md](code-review/best-practices.md) | 200-400 LOC sweet spot, 70-90% defect discovery (SmartBear/Cisco) |
| [academic-papers.md](code-review/academic-papers.md) | Google 9M reviews, real value is knowledge transfer not bug-finding |
| [big-tech-practices.md](code-review/big-tech-practices.md) | Uber uReview: 75% useful, 1500 dev-hours saved weekly |
| [ai-assisted-review.md](code-review/ai-assisted-review.md) | 1.68x more issues in AI code, 96% hallucination mitigation possible |
| [automation-tools.md](code-review/automation-tools.md) | 4-stage pipeline: Generate/Filter/Validate/Dedup with judge agent |
| [anti-pattern-detection.md](code-review/anti-pattern-detection.md) | 56+ smell taxonomy, 3 generations of detection tools |
| [anti-pattern-review-process.md](code-review/anti-pattern-review-process.md) | 16+ named reviewer anti-patterns (rubber-stamping, bikeshedding) |
| [comment-quality.md](code-review/comment-quality.md) | 6 properties of useful comments, Conventional Comments standard |
| [diff-analysis.md](code-review/diff-analysis.md) | Meta risk score eliminated code freezes, 20% files hold 75% defects |
| [architectural-review.md](code-review/architectural-review.md) | ArchUnit, LLMs fail at drift detection, layered defense model |
| [performance-review.md](code-review/performance-review.md) | Nested loop→Map: 64x JS / 1,864x Python speedup |
| [prompt-engineering-for-review.md](code-review/prompt-engineering-for-review.md) | Few-shot: 46-659% improvement, unified diff reduces laziness 3X |
| [community-discussions.md](code-review/community-discussions.md) | AI generates code faster than humans review (91% review time increase) |

### 2. [Security](security/) — 5 files
Application security, supply chain, secrets, infrastructure.

| File | Key Finding |
|------|-------------|
| [security-code-review.md](security/security-code-review.md) | Single SAST = 52% detection, 76% noise, AI code 25-40% vuln rate |
| [owasp-patterns.md](security/owasp-patterns.md) | 6-layer OWASP review stack, ASVS v5.0.0, 12-65% LLM code has vulns |
| [supply-chain.md](security/supply-chain.md) | 156% YoY increase, 700K+ malicious packages, OSCAR F1 0.95 |
| [secrets-detection.md](security/secrets-detection.md) | 39M secrets leaked on GitHub 2024, Copilot repos 40% higher leak rate |
| [infrastructure-security.md](security/infrastructure-security.md) | IaC tools: 43-72% catch rate, Cedar 42-60x faster than OPA |

### 3. [Code Analysis](code-analysis/) — 7 files
Static, dynamic, incremental analysis techniques and tools.

| File | Key Finding |
|------|-------------|
| [static-analysis-techniques.md](code-analysis/static-analysis-techniques.md) | 3-tier taxonomy, 20+ tools, LLMs eliminate 94-98% false positives |
| [static-analysis-tools.md](code-analysis/static-analysis-tools.md) | SAST on 319 real vulnerabilities (ISSTA 2024) |
| [tree-sitter-ast.md](code-analysis/tree-sitter-ast.md) | Language-agnostic, stack-graphs high potential for Wazir |
| [code-smells.md](code-analysis/code-smells.md) | 80% of smells survive forever, born at creation time |
| [dynamic-analysis.md](code-analysis/dynamic-analysis.md) | SAGE found >30% of Windows 7 bugs, Google coverage 1B lines/day |
| [complexity-metrics.md](code-analysis/complexity-metrics.md) | Cognitive complexity best proxy, EEG validates metrics |
| [incremental-analysis.md](code-analysis/incremental-analysis.md) | Facebook Infer: 100M+ LOC in 15-20 min, CodeQL 58% faster |

### 4. [Codebase Understanding](codebase-understanding/) — 10 files
How to parse, index, search, and navigate codebases.

| File | Key Finding |
|------|-------------|
| [comprehension-cognitive-models.md](codebase-understanding/comprehension-cognitive-models.md) | 58% of dev time on comprehension, Sillito's 44-question taxonomy |
| [comprehension-books-and-practice.md](codebase-understanding/comprehension-books-and-practice.md) | 6 cognitive models, brain imaging confirms naming impact |
| [indexing-techniques.md](codebase-understanding/indexing-techniques.md) | Trigram dominant, tree-sitter primary, SCIP 10x faster than LSIF |
| [indexing-platforms.md](codebase-understanding/indexing-platforms.md) | GitHub Blackbird, livegrep, 30-year academic survey |
| [dependency-graphs.md](codebase-understanding/dependency-graphs.md) | AST graphs 70x faster, 20x cheaper than LLM-extracted |
| [knowledge-graphs.md](codebase-understanding/knowledge-graphs.md) | Graph RAG > vector RAG for structural queries, CGM 43% SWE-bench |
| [semantic-search.md](codebase-understanding/semantic-search.md) | CodeBERT family, hybrid search dominates, code harder than prose |
| [vector-embeddings.md](codebase-understanding/vector-embeddings.md) | voyage-code-3 SOTA, LoRACode +86.69% MRR with <2% params |
| [repo-maps.md](codebase-understanding/repo-maps.md) | Aider: tree-sitter + PageRank, 5-10% of code as blueprint |
| [code-intelligence-platforms.md](codebase-understanding/code-intelligence-platforms.md) | SCIP 4-5x smaller than LSIF, Cody dropped embeddings for graphs |

### 5. [Context Engineering](context-engineering/) — 8 files
The core discipline: minimal context, maximum quality.

| File | Key Finding |
|------|-------------|
| [context-engineering-discipline.md](context-engineering/context-engineering-discipline.md) | Mask-don't-remove, ranking beats stuffing, ACE +10.6% |
| [minimal-context-max-quality.md](context-engineering/minimal-context-max-quality.md) | 4x fewer tokens = 17.1% better output (LLMLingua) |
| [context-reduction.md](context-engineering/context-reduction.md) | Reasoning degrades at ~3K tokens, CoT doesn't help |
| [llm-attention-patterns.md](context-engineering/llm-attention-patterns.md) | Only 5% of heads do retrieval, effective = 30-60% of stated window |
| [prompt-compression.md](context-engineering/prompt-compression.md) | Code compresses better than math, 93x KV cache compression |
| [context-degradation.md](context-engineering/context-degradation.md) | Context degradation mechanisms in AI agents |
| [lost-in-the-middle.md](context-engineering/lost-in-the-middle.md) | U-shaped attention, 20+ pt accuracy drops in middle positions |
| [context-management.md](context-engineering/context-management.md) | Context management strategies for multi-agent systems |

### 6. [Summarization & Retrieval](summarization-and-retrieval/) — 6 files
How to compress, summarize, chunk, and retrieve code context.

| File | Key Finding |
|------|-------------|
| [code-summarization.md](summarization-and-retrieval/code-summarization.md) | Hierarchical bottom-up most promising, BLEU/ROUGE poor proxy |
| [keyword-extraction.md](summarization-and-retrieval/keyword-extraction.md) | Identifier splitting outperforms pre-BERT neural models |
| [information-summarization.md](summarization-and-retrieval/information-summarization.md) | Masking matches summarization, context drift kills 65% of agents |
| [rag-for-code.md](summarization-and-retrieval/rag-for-code.md) | AST chunking +4.3 Recall@5, Sourcegraph dropped embeddings |
| [hierarchical-summaries.md](summarization-and-retrieval/hierarchical-summaries.md) | Build bottom-up, retrieve top-down, 79.8% compression |
| [chunking-strategies.md](summarization-and-retrieval/chunking-strategies.md) | AST chunking strictly superior, 512-1024 optimal, context cliff at 2.5K |

### 7. [Content & Data Seeding](content-and-data-seeding/) — 10 files
How to bootstrap knowledge, generate seed data, build flywheels.

| File | Key Finding |
|------|-------------|
| [seeding-strategies.md](content-and-data-seeding/seeding-strategies.md) | Self-Instruct: 175 seeds → 52K examples for $500 |
| [synthetic-data.md](content-and-data-seeding/synthetic-data.md) | SWE-smith 50K instances, HexaCoder 85% vuln reduction |
| [few-shot-curation.md](content-and-data-seeding/few-shot-curation.md) | 2-5 examples sweet spot, CEDAR 333% over baselines |
| [knowledge-base-bootstrapping.md](content-and-data-seeding/knowledge-base-bootstrapping.md) | Reddit faked early content, Wikipedia bots 3M articles |
| [golden-datasets.md](content-and-data-seeding/golden-datasets.md) | SWE-bench: 68.3% filtered out, contamination inflates 4.9x |
| [devtools-content.md](content-and-data-seeding/devtools-content.md) | Cursor $200M ARR zero marketing, Stripe docs 367K/mo |
| [data-flywheel.md](content-and-data-seeding/data-flywheel.md) | 1-3% explicit feedback rate, NVIDIA 98.6% cost reduction |
| [prompt-templates.md](content-and-data-seeding/prompt-templates.md) | Awesome Reviewers 8K+ prompts, 58 techniques taxonomy |
| [rule-engines.md](content-and-data-seeding/rule-engines.md) | Semgrep 2K+ rules, hybrid rules+LLM 8x more TPs |
| [curriculum-learning.md](content-and-data-seeding/curriculum-learning.md) | CL doesn't always help, 18-45% fewer steps when it does |

### 8. [Agent Architecture](agent-architecture/) — 8 files
How AI coding agents work, fail, and improve.

| File | Key Finding |
|------|-------------|
| [agentic-coding.md](agent-architecture/agentic-coding.md) | Context engineering > model selection, 150+ papers surveyed |
| [multi-agent-architectures.md](agent-architecture/multi-agent-architectures.md) | Multi-agent system design patterns |
| [multi-agent-review.md](agent-architecture/multi-agent-review.md) | Multi-agent review collaboration patterns |
| [agent-failure-modes.md](agent-architecture/agent-failure-modes.md) | Common failure modes in AI coding agents |
| [overconfidence.md](agent-architecture/overconfidence.md) | Agent overconfidence and calibration |
| [planning-vs-execution.md](agent-architecture/planning-vs-execution.md) | Planning vs execution tradeoffs in agents |
| [swe-bench.md](agent-architecture/swe-bench.md) | SWE-bench evaluation and leakage findings |
| [industry-best-practices.md](agent-architecture/industry-best-practices.md) | Industry best practices for AI agents |

### 9. [Execution](execution/) — 22 files
How to execute plans: composition, parallelism, patches, state, verification.

| File | Key Finding |
|------|-------------|
| [composition-engines.md](execution/composition-engines.md) | Composition engine patterns |
| [executor-prompts.md](execution/executor-prompts.md) | Prompt design for execution agents |
| [maker-decomposition.md](execution/maker-decomposition.md) | Task decomposition strategies |
| [model-routing.md](execution/model-routing.md) | Model routing for different task types |
| [dag-execution-engines.md](execution/dag-execution-engines.md) | DAG-based execution engines |
| [dag-execution-engines-deep-dive.md](execution/dag-execution-engines-deep-dive.md) | Deep dive on DAG engines |
| [worktree-patterns.md](execution/worktree-patterns.md) | Git worktree patterns for parallel execution |
| [integration-testing.md](execution/integration-testing.md) | Integration testing for multi-step execution |
| [rollback-recovery.md](execution/rollback-recovery.md) | Rollback and recovery strategies |
| [merge-conflicts.md](execution/merge-conflicts.md) | Merge conflict resolution |
| [patch-application.md](execution/patch-application.md) | Patch application strategies |
| [patch-diff-strategies.md](execution/patch-diff-strategies.md) | Diff and patch format strategies |
| [state-management.md](execution/state-management.md) | Execution state management |
| [handover-protocols.md](execution/handover-protocols.md) | Session handover protocols |
| [structured-output.md](execution/structured-output.md) | Structured output for execution steps |
| [production-systems.md](execution/production-systems.md) | Production execution system patterns |
| [code-review-effectiveness.md](execution/code-review-effectiveness.md) | Code review effectiveness in execution |
| [proof-of-implementation.md](execution/proof-of-implementation.md) | Proof of implementation patterns |
| [tdd-for-ai-agents.md](execution/tdd-for-ai-agents.md) | TDD adapted for AI agents |
| [context-rot-mitigation.md](execution/context-rot-mitigation.md) | Mitigating context rot during execution |
| [execution-anti-patterns.md](execution/execution-anti-patterns.md) | Common execution anti-patterns |

### 10. [Orchestration](orchestration/) — 11 files
Multi-agent orchestration, tooling flags, host integration.

| File | Key Finding |
|------|-------------|
| [design-plan.md](orchestration/design-plan.md) | Orchestration strategy overview |
| [allowedtools-flag.md](orchestration/allowedtools-flag.md) | AllowedTools flag semantics |
| [tmux-worktree.md](orchestration/tmux-worktree.md) | tmux + worktree orchestration |
| [agent-teams.md](orchestration/agent-teams.md) | Agent team coordination |
| [claude-p-mode.md](orchestration/claude-p-mode.md) | Claude -p mode for orchestration |
| [context-rot.md](orchestration/context-rot.md) | Context rot in long orchestration runs |
| [competitive-analysis.md](orchestration/competitive-analysis.md) | Competitive analysis of orchestrators |
| [security-gaming.md](orchestration/security-gaming.md) | Security gaming analysis |
| [bash-orchestrator.md](orchestration/bash-orchestrator.md) | Bash orchestrator patterns |
| [rules-files.md](orchestration/rules-files.md) | Rules files research |
| [codex-architecture.md](orchestration/codex-architecture.md) | Codex architecture review |

### 11. [Enforcement](enforcement/) — 5 files
Pipeline compliance, benchmarking, enforcement strategies.

| File | Key Finding |
|------|-------------|
| [the-enforcement-problem.md](enforcement/the-enforcement-problem.md) | The enforcement problem definition |
| [enforcement-blueprint.md](enforcement/enforcement-blueprint.md) | Enforcement architecture blueprint |
| [research-synthesis.md](enforcement/research-synthesis.md) | Enforcement research synthesis |
| [benchmark-v5-results.md](enforcement/benchmark-v5-results.md) | Benchmark v5 results |
| [comprehensive-session-notes.md](enforcement/comprehensive-session-notes.md) | Multi-session enforcement notes |

### 12. [Methodology](methodology/) — 6 files
Software engineering methodology, delivery patterns, verification.

| File | Key Finding |
|------|-------------|
| [consulting-delivery.md](methodology/consulting-delivery.md) | Consulting delivery methodology |
| [requirements-engineering.md](methodology/requirements-engineering.md) | Requirements engineering patterns |
| [rfc-design-doc-processes.md](methodology/rfc-design-doc-processes.md) | RFC and design doc processes |
| [tdd-bdd-atdd.md](methodology/tdd-bdd-atdd.md) | TDD, BDD, ATDD comparison |
| [formal-verification.md](methodology/formal-verification.md) | Lightweight formal verification |
| [task-decomposition.md](methodology/task-decomposition.md) | Task decomposition research |

### 13. [Tools Landscape](tools-landscape/) — 12 files
AI coding tools comparison, individual tool analyses.

| File | Key Finding |
|------|-------------|
| [landscape-overview.md](tools-landscape/landscape-overview.md) | AI coding tools landscape overview |
| [ai-coding-tools-comparison.md](tools-landscape/ai-coding-tools-comparison.md) | Head-to-head tool comparison |
| [aider.md](tools-landscape/aider.md) | Aider architecture and approach |
| [autogen.md](tools-landscape/autogen.md) | AutoGen framework analysis |
| [chatdev-metagpt.md](tools-landscape/chatdev-metagpt.md) | ChatDev and MetaGPT comparison |
| [crewai.md](tools-landscape/crewai.md) | CrewAI framework analysis |
| [devin-codex.md](tools-landscape/devin-codex.md) | Devin and Codex analysis |
| [gpt-engineer.md](tools-landscape/gpt-engineer.md) | GPT-Engineer analysis |
| [mentat.md](tools-landscape/mentat.md) | Mentat analysis |
| [repos/openspec.md](tools-landscape/repos/openspec.md) | OpenSpec repo analysis |
| [repos/spec-kit.md](tools-landscape/repos/spec-kit.md) | Spec-Kit repo analysis |
| [repos/superpowers.md](tools-landscape/repos/superpowers.md) | Superpowers repo analysis |

---

## Top 10 Cross-Cutting Findings

1. **Context quality > context quantity** -- More context degrades LLM performance starting at 2,500-3,000 tokens. 4x compression improved output by 17.1%.
2. **Build summaries bottom-up, retrieve top-down** -- Hierarchical summarization with dependency-aware processing order produces 82% retrieval improvement.
3. **AST-based analysis is the foundation** -- Tree-sitter for parsing, AST chunking strictly superior to text splitting, deterministic graphs 70x faster than LLM-extracted.
4. **Multi-stage review pipelines** -- Uber, HubSpot, and others converge on Generate/Filter/Validate/Dedup with a judge agent.
5. **Hybrid search dominates** -- BM25 keyword first-pass + neural reranking outperforms pure semantic or pure keyword search.
6. **Security requires layered defense** -- Single SAST catches only 52%, 76% is noise. Manual + SAST + AI required. Supply chain is 156% YoY growth.
7. **Graph-based retrieval for structural queries** -- Vector search fails on multi-hop architectural reasoning. Code knowledge graphs solve this.
8. **Mask don't summarize for in-session context** -- Simple observation masking matches LLM summarization quality at 52% lower cost.
9. **Identifier splitting is the most impactful preprocessing** -- 70% of code is identifiers. Splitting them outperforms pre-BERT neural models for search.
10. **Seed small, compound fast** -- Self-Instruct: 175 seeds to 52K examples for $500. Reddit faked all early content. Quality > quantity always.
