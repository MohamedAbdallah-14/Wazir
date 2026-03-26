# Repo Map Techniques Research

**Date:** 2026-03-25
**Scope:** How coding assistants represent codebases compactly for LLMs; repo-map algorithms, tools, and trade-offs.

---

## 1. Aider's Repository Map — Official Documentation (https://aider.chat/docs/repomap.html)

- Aider sends a **concise map of the whole git repository** to the LLM with each change request.
- The map contains a **list of files** plus the **key symbols defined in each file**, showing critical lines of code for each definition (class headers, function signatures, field declarations).
- Example format uses indented tree with `|` prefixes and `...` elision markers:
  ```
  aider/coders/base_coder.py:
  ...
  |class Coder:
  |    abs_fnames = None
  ...
  |    @classmethod
  |    def create(self, main_model, edit_format, io, ...):
  ...
  |    def run(self, with_message=None):
  ...
  ```
- **Benefits:** The LLM sees classes, methods, and function signatures from across the repo. It can figure out how to use APIs from the map alone. If it needs more, it can request specific files be added to the chat.
- **Optimization:** For large repos, Aider sends only the **most relevant portions**. It uses a **graph ranking algorithm** (PageRank) on a graph where files are nodes and edges represent dependencies.
- The `--map-tokens` switch controls token budget (default: **1024 tokens**). Aider uses **binary search** to find the largest subset of ranked tags that fits within the token limit, with a 15% tolerance.
- The repo map is **rebuilt on every request**, incorporating the current chat context to personalize relevance.
- Supports **130+ languages** via tree-sitter parsers with language-specific `tags.scm` query files.

## 2. Aider's Tree-sitter Repo Map — Blog Post (https://aider.chat/2023/10/22/repomap.html)

- Tree-sitter **replaced ctags** as the symbol extraction engine. Ctags only extracted definitions; tree-sitter extracts both **definitions and references**.
- The graph is constructed as: each source file = node; edges connect files that have cross-references. A file that *defines* symbol X connects to every file that *references* symbol X.
- **PageRank with personalization** is applied: files currently in the chat get higher personalization weight, so the map prioritizes symbols related to what the user is working on.
- Not all symbols are equally important: a function called by 20 other files is more valuable context than a private helper called once. PageRank captures this naturally.
- **Token efficiency:** Aider's repo-map approach achieves **4.3-6.5% context window utilization** vs. 54-70% for agents using iterative search strategies. This leaves the bulk of the context window for actual edits and conversation.
- The map doesn't contain every class, method, and function but only the **most-often-referenced identifiers**.
- **Benchmark results:** The tree-sitter-based map improved performance on the SWE-bench coding benchmark compared to the ctags-based map, demonstrating that better context selection directly improves edit accuracy.

## 3. DeepWiki: Aider Repository Mapping System Architecture (https://deepwiki.com/Aider-AI/aider/4.1-repository-mapping-system)

- **Architecture components:**
  1. `RepoMap` class — orchestrates the entire mapping pipeline.
  2. `tags.scm` query files — per-language tree-sitter queries that define how to extract definitions (DEF) and references (REF) tags.
  3. Graph construction — directed graph where nodes are files, edges are weighted by number of cross-file symbol references.
  4. PageRank ranking — NetworkX `pagerank()` with personalization dict keyed on chat files.
  5. Token-budgeted rendering — binary search to fit the highest-ranked tags within the token limit.
- **Data flow:** Source files -> tree-sitter parsing -> tag extraction (file, symbol name, kind=DEF|REF, line) -> graph construction -> PageRank -> ranked tag list -> binary search for token fit -> formatted map string.
- **Caching:** Results are cached based on file modification times to avoid reparsing unchanged files.
- The map is **personalized per request**: files the user has added to the chat get stronger personalization, so the map highlights symbols most relevant to the current task.
- **Configuration:** `--map-tokens` (default 1024), `--map-refresh` (auto/always/files/manual), `--map-multiplier-no-files` (increases budget when no files are in chat).

## 4. Code Maps: Blueprint Your Codebase for LLMs (https://origo.prose.sh/code-maps)

- **Core concept:** A code map extracts only **structural elements** (class definitions, function signatures, type declarations) while omitting implementation details.
- **Token reduction:** A typical code map is **5-10% of the original code size** while capturing **~90% of what an LLM needs** to understand the architecture.
- **The Context Window Dilemma:** Too little context = model misses architectural info and generates misaligned code. Too much context = implementation details consume token budget, pushing out important information.
- **RepoPrompt** is cited as the "gold standard" for code maps:
  - Advanced file selection with smart filtering.
  - Token estimation before sending to models.
  - Structured XML prompts for maximum LLM comprehension.
  - Automatic CodeMap extraction of classes, functions, and references.
  - **Type reference detection:** intelligently includes related types that are referenced.
  - Privacy-first: processes code locally, integrates via clipboard.
- **Building your own code map tool:** The post recommends using tree-sitter for extraction, focusing on class/interface definitions, method signatures, import statements, and exported symbols, while stripping implementation bodies.
- **XML output format** is recommended for LLMs (over plain text or JSON) because it provides clear structure boundaries.

## 5. Repomix — Pack Codebase into AI-Friendly Formats (https://github.com/yamadashy/repomix)

- **22.6k GitHub stars.** Packages an entire repository into a single AI-friendly file.
- **Three output formats:** XML (default, recommended for Claude), Markdown, Plain text.
- **`--compress` mode:** Uses tree-sitter to extract only key code elements (signatures, class definitions, imports) — reduces token count while preserving structure. This is essentially a code-map mode.
- **Token counting:** Built-in token counting for the output. Supports `--tokens` flag.
- **Smart filtering:** Respects `.gitignore`, supports glob include/exclude patterns, binary file detection.
- **Security:** Built-in check for accidentally included secrets/API keys (via Secretlint).
- **Remote repos:** Can pack directly from a GitHub URL without cloning.
- **MCP server support:** Can be used as an MCP tool for AI agents.
- Key difference from Aider's repo-map: Repomix packs **full file contents** (or compressed signatures) into a single output, while Aider's map is a **dynamically ranked, token-budgeted summary** personalized to the current task.

## 6. How Cursor Actually Indexes Your Codebase (https://towardsdatascience.com/how-cursor-actually-indexes-your-codebase/)

- Cursor uses a full **RAG (Retrieval-Augmented Generation) pipeline** rather than a static repo map.
- **Step 1 — Chunking:** Code is broken into semantically coherent units (functions, classes, logical blocks) rather than arbitrary text splits. This is "semantic code chunking."
- **Step 2 — Embedding:** Chunks are sent to Cursor's server where embeddings are created (OpenAI embedding API or custom model). Embeddings + metadata (start/end line numbers, file paths) are stored.
- **Step 3 — Merkle Tree for change detection:** Cursor computes a Merkle tree of file hashes. The tree is synced to the server, which periodically checks for fingerprint mismatches. Only changed files are re-indexed.
- **Step 4 — Storage:** Embeddings stored in **Turbopuffer** (serverless vector search engine). Embeddings cached in AWS keyed by chunk hash for fast re-indexing.
- **Step 5 — Semantic search:** Query is embedded with the same model. Turbopuffer returns ranked results by similarity score. Results are metadata only (masked file paths + line ranges) — local client retrieves actual code.
- **Privacy:** Raw source code never stored on servers. File paths are obfuscated using a secret key + fixed nonce. Only numerical embeddings + masked metadata are stored remotely.
- **Hybrid approach:** Semantic vector search + `grep`/`ripgrep` for exact string matches.
- **Key difference from repo-map:** Cursor's approach is query-time retrieval (semantic search per request) vs. Aider's approach of pre-computed ranked summary. Cursor doesn't send a "map" — it dynamically retrieves relevant chunks.

## 7. How Cursor Indexes Codebases Fast — Merkle Trees (https://read.engineerscodex.com/p/how-cursor-indexes-codebases-fast)

- **Merkle tree structure:** Every leaf node = cryptographic hash of a file. Non-leaf nodes = hash of child hashes. Creates a hierarchical fingerprint of the entire codebase.
- **Efficiency:** When one file changes, only its hash and the hashes up the tree path change. Comparison of two tree roots reveals whether anything changed; walking the tree reveals exactly which files changed.
- **Incremental sync:** Cursor syncs the Merkle tree to the server. Server detects mismatches and re-indexes only changed files.
- **Practical performance:** Enables near-instant change detection even for very large codebases with thousands of files.
- The Merkle tree approach solves the **stale index problem** — the index stays current with minimal recomputation.

## 8. Sourcegraph Cody — Remote Repository Context (https://sourcegraph.com/blog/how-cody-provides-remote-repository-context)

- Cody uses a **"search-first" RAG architecture** rather than a static repo map.
- **Repo-level Semantic Graph (RSG):** Encapsulates core elements of a repository's global context and their dependencies.
- **Two-stage retrieval:** (1) Retrieval phase gathers potential context from local code, remote repos, and documentation. (2) Ranking phase uses an "Expand and Refine" method with graph expansion and link prediction on the RSG.
- **Multi-repository support:** Cody can retrieve context across up to 10 repositories via @-mention. Tested with customers having 300,000+ repositories and monorepos exceeding 90GB.
- **1M token context via Gemini 1.5 Flash:** Automatically identifies relevant files using vector embeddings across repositories.
- **Enterprise scale:** The platform supports remote repository context without local cloning. Developers don't need the repo on their machine.
- **Key insight:** For enterprise codebases, a static repo-map is insufficient; you need a live graph + semantic search that spans multiple repositories and understands cross-service dependencies.

## 9. Augment Code — Context Engine (https://www.augmentcode.com/context-engine)

- **Persistent semantic knowledge graph:** Maps cross-file dependencies, module relationships, and service interactions across the entire stack.
- **Scale:** Indexes 1M+ files. Real-time knowledge graph. Indexed 400,000+ files in ~6 minutes with 45-second incremental updates.
- **Beyond grep:** Recognizes indirect dependencies through event systems, message queues, configuration files, and database triggers.
- Claims "most agents fail on complex tasks" because they "rely on grep to build context. They find files but miss architecture. Match strings but lose patterns."
- **Blind study results:** 500 agent-generated PRs compared to human-written code on Elasticsearch repo (3.6M Java LOC, 2,187 contributors). Augment scored +12.8 overall (outperforming humans), while Cursor scored -13.9 and Claude Code scored -11.8.
- **Real-time sync:** Not a stale snapshot but a live index that updates as developers edit code.
- **Cross-repo:** Understands relationships across microservices, shared libraries, and configuration.
- **Key insight:** The quality of context determines the quality of generated code. A persistent, real-time knowledge graph outperforms both static repo maps and query-time RAG.

## 10. RepoMapper — Standalone Aider-style Repo Map (https://github.com/pdavis68/RepoMapper)

- **144 GitHub stars.** A standalone Python tool that replicates Aider's repo-map as a CLI and MCP server.
- Uses tree-sitter for parsing, NetworkX for PageRank graph ranking.
- **Architecture:** `repomap.py` (CLI entry), `repomap_class.py` (core logic), `importance.py` (graph ranking), `repomap_server.py` (MCP server).
- Language-specific `queries/` directory with tree-sitter `tags.scm` files for each language.
- **MCP integration:** Can be used as an MCP server tool, allowing AI agents to request repo maps on demand.
- **Token-aware:** Outputs are constrained to fit within specified token budgets.
- **Key value:** Decouples Aider's repo-map algorithm from Aider itself, making it usable in any AI coding pipeline.

## 11. cyanheads/repo-map — LLM-Enhanced Repository Summaries (https://github.com/cyanheads/repo-map)

- **39 GitHub stars.** Generates **LLM-enhanced summaries** of repositories — uses an LLM to describe each file's purpose, not just extract symbols.
- Produces structured output with file purposes, potential considerations, and project structure insights.
- **Difference from Aider's approach:** This tool uses AI to *describe* the codebase rather than extracting syntactic symbols. It produces natural-language summaries rather than code signatures.
- Trade-off: Higher quality descriptions but requires LLM calls during map generation (cost + latency). Aider's approach is purely syntactic/algorithmic (free, instant).

## 12. codebase-digest — AI-Friendly Codebase Packer (https://github.com/kamilstanuch/codebase-digest)

- **363 GitHub stars.** Python CLI that traverses a codebase and produces a structured digest.
- **Features:** Directory tree, file sizes, token counts, consolidated text output. Includes a **library of 60+ analysis prompts** for LLMs.
- **Metrics:** Generates file-level and project-level token counts, size distributions, and language breakdowns.
- **Approach:** Full content packing (like Repomix) rather than symbol extraction (like Aider). Focuses on making the full codebase digestible rather than summarizing it.
- **Prompt library** includes templates for: architecture review, security audit, code quality analysis, documentation generation, etc.
- Trade-off: Full content = high token usage but complete information. Best for smaller projects or when using large context windows.

## 13. Semantic Code Indexing with AST and Tree-sitter (https://medium.com/@email2dineshkuppan/semantic-code-indexing-with-ast-and-tree-sitter-for-ai-agents-part-1-of-3-eb5237ba687a)

- **AST vs Tree-sitter distinction:**
  - ASTs capture **program semantics** — great for chunking and embeddings in RAG pipelines.
  - Tree-sitter preserves **exact syntax and positions** — great for retrieval, grounding, and editor-like tasks.
- **Recommended hybrid:** Use ASTs for indexing (semantic understanding) and tree-sitter for retrieval (source-faithful grounding). Best results come from combining both.
- **Code is more than text:** An AI agent looking at thousands of files can't just memorize them — it needs structure. It needs to know what belongs where, what calls what, how pieces fit together.
- **Chunking strategies for code:**
  - Naive text splitting = broken syntax, lost context.
  - AST-based splitting = semantically coherent chunks (functions, classes, methods).
  - Tree-sitter incremental = fast re-parsing on edit, only changed subtrees update.
- **Key insight:** The combination of structural understanding (AST/tree-sitter) with semantic similarity (embeddings) produces the highest retrieval quality for code.

## 14. Understanding AI Coding Agents Through Aider's Architecture (https://simranchawla.com/understanding-ai-coding-agents-through-aiders-architecture/)

- **Context Window Trap:** GPT-4's 128k context holds ~50 average Java files. Enterprise apps have 2,000+ files. Dumping everything fails due to: cost explosion, information overload, attention degradation.
- **Aider's hierarchy of context priority:**
  1. Always included: system instructions, repository map.
  2. Dynamically selected: relevant file contents, related files via dependency analysis, similar pattern examples.
  3. Lowest priority: chat history beyond recent context, unrelated files.
- **The repo map as a "table of contents":** Gives AI structural awareness without burning tokens on implementation. When asked to "add JWT authentication," the map tells the AI which files are relevant before diving into specifics.
- **Key quote:** "Instead of trying to see everything, [Aider] builds a sophisticated understanding of what matters."
- PageRank-scored code context achieves significantly higher edit accuracy than naive file inclusion.

## 15. AI Coding Assistants for Large Codebases (https://blog.kilo.ai/p/ai-coding-assistants-for-large-codebases)

- **"Bigger context windows aren't enough"** — the real problem is retrieval, not capacity. Most tools stuff the wrong files into the prompt.
- **Hybrid indexing (AST/code graph + vector search)** addresses retrieval in ways that larger context windows cannot:
  - AST parsing + code graph analysis captures **structural relationships** (call graphs, import chains, type hierarchies).
  - Vector search captures **semantic similarity** (conceptually related code that looks different).
  - Hybrid methods achieve higher factual correctness than either approach alone.
- **Persistent vs. per-request context:** Tools like Augment Code maintain a persistent graph (always up-to-date). Tools like Aider rebuild context per request. Cursor sits between with cached embeddings + incremental updates.
- **Key architectural requirement:** A coding assistant for large codebases needs: (1) intelligent retrieval, (2) dependency awareness, (3) persistent state, (4) cross-repository understanding.

## 16. GitHub Next — Visualizing a Codebase (https://githubnext.com/projects/repo-visualization/)

- **Visual repo fingerprinting:** Circle-packing visualization where each file is a circle, sized by file size, colored by file type.
- **Design goals:** "Bird's eye view" of a codebase that gives viewers a sense of structure without overwhelming with data. Not meant to replace the folder/file view but supplement it.
- **Implementation:** Node.js script clones a repo, returns a deeply nested tree structure. Visualization built with React.js and D3.js using circle-packing layout.
- **GitHub Action integration:** Generates a diagram and updates it on every push. Can be embedded in README.
- Experimented with tree maps, node-link diagrams, and circle packing — circle packing was clearest for nested structure.
- **Key insight:** Even a non-text visual representation of repository structure helps developers orient. Side-by-side comparisons of different codebases reveal structural patterns.
- **Limitation:** This is a visual/human tool, not an LLM context tool. But the principle of compact structural representation applies to both.

## 17. Addy Osmani — LLM Coding Workflow 2026 (https://addyosmani.com/blog/ai-coding-workflow/)

- **"LLMs are only as good as the context you provide"** — show them the relevant code, docs, and constraints.
- **Spec-first workflow:** Write a `spec.md` with requirements, architecture decisions, data models, and testing strategy before any code generation. This spec serves as persistent context.
- **Structured prompt plans:** Generate a sequence of prompts for each task so tools can execute them one by one with focused context.
- **Repomix for repo context:** Uses Repomix to give LLMs full repository context when needed.
- **Key workflow pattern:** Plan -> break into small tasks -> provide focused context per task -> review every output. The context management is deliberate, not automatic.
- **At Anthropic:** ~90% of Claude Code's own code is written by Claude Code itself, demonstrating that with good context management, AI-assisted development scales.
- **Key insight for repo maps:** The most effective workflow isn't about dumping a whole repo map but about providing the *right* context for each specific task.

## 18. WorkOS — Context is King: Tools for Feeding Code to LLMs (https://workos.com/blog/context-is-king-tools-for-feeding-your-code-and-website-to-llms)

- **37+ CLI tools** exist for packing repository files into LLM prompts.
- **Gitingest:** Fastest zero-setup option. Replace "hub" with "ingest" in any GitHub URL to get a text digest. No local install needed.
- **Local digest scripts:** Simple shell scripts can concatenate repo files with headers. A basic approach: `find . -name "*.ts" | xargs cat` with file-path annotations.
- **llms.txt convention:** A proposed `/llms.txt` file at a website root that provides LLM-friendly content. Markdown format with brief background, guidance, and links to detailed docs. Not yet adopted by major AI companies but gaining traction.
- **2-2.5x productivity gains** reported from using repo-packing tools with aggressive filtering (removing tests, dependencies, build artifacts).
- **Key insight:** Even a naive "concatenate all files" approach with good filtering is useful. The spectrum runs from simple concatenation to sophisticated ranked maps, with different tools optimizing for different points on that spectrum.

---

## Synthesis

### The Spectrum of Repo Map Approaches

There is a clear spectrum of codebase representation techniques, from simplest to most sophisticated:

| Level | Approach | Token Cost | Quality | Example Tools |
|-------|----------|-----------|---------|---------------|
| 1. File tree | Directory structure only | Very low | Orientation only | `tree`, GitHub Action |
| 2. Full packing | Concatenate all files | Very high | Complete but overwhelming | Repomix, Gitingest, codebase-digest |
| 3. Compressed packing | Tree-sitter extraction of signatures | Medium | Good structure, no implementation | Repomix `--compress`, RepoPrompt CodeMap |
| 4. Ranked symbol map | PageRank-ranked signatures within token budget | Low | High relevance, task-aware | Aider repo-map, RepoMapper |
| 5. Embedding RAG | Semantic vector search per query | Variable | Query-specific | Cursor, Roo Code |
| 6. Knowledge graph | Persistent semantic graph with dependency tracking | Pre-computed | Comprehensive, real-time | Augment Code, Sourcegraph Cody |

### Key Technical Decisions

1. **Static map vs. dynamic retrieval:** Aider's repo-map is rebuilt per request but uses deterministic algorithms (tree-sitter + PageRank). Cursor/Cody use query-time semantic search. Augment Code maintains a persistent live graph. The trend is toward persistent, real-time approaches.

2. **Symbol extraction technology:** Tree-sitter has emerged as the clear winner for symbol extraction — it supports 130+ languages, is incremental (fast re-parsing), and preserves source positions. ctags is legacy. AST parsing is complementary for semantic understanding.

3. **Ranking algorithm:** PageRank on a file-dependency graph is the proven approach (Aider). It naturally surfaces highly-connected, frequently-referenced symbols. Personalization (weighting chat files higher) makes it task-relevant.

4. **Token budgeting:** Binary search to fit ranked content within a token limit is the standard approach. Default budgets range from 1k tokens (Aider) to effectively unlimited (Repomix full packing). The sweet spot depends on context window size and how much space is needed for actual work.

5. **Granularity trade-offs:**
   - **File-level only** (just file names/paths): minimal tokens, enough for orientation, insufficient for coding.
   - **Symbol-level** (function signatures, class headers): 5-10% of original size, captures ~90% of architectural understanding. This is the sweet spot for most use cases.
   - **Full implementation**: complete information but extremely high token cost. Only viable with very large context windows or small codebases.

### Critical Insights for Wazir

1. **A ranked symbol map is the highest-value, lowest-cost approach.** Aider's PageRank + tree-sitter achieves 4.3-6.5% context utilization while providing sufficient architectural context for most tasks.

2. **The map should be task-personalized.** Static maps waste tokens on irrelevant code. Personalizing the ranking based on what files/topics are currently active dramatically improves relevance.

3. **Hybrid is best in class.** The highest-performing systems combine structural analysis (tree-sitter/AST for call graphs, imports, type hierarchies) with semantic search (embeddings for conceptual similarity). Either alone has blind spots.

4. **Incremental updates are essential.** Merkle trees (Cursor) or file-modification-time caching (Aider) prevent expensive full-repo re-indexing on every change.

5. **The repo map serves as a "table of contents" for the LLM** — it doesn't replace reading files, it tells the LLM *which* files to read. This two-phase approach (map for orientation, then targeted file reads) is more effective than trying to pack everything.

6. **Format matters.** XML format is recommended for Claude (per Repomix defaults). Structured formats with clear delimiters outperform raw text concatenation.

7. **For a skill/workflow system like Wazir,** the repo map could be generated once per session and refreshed on file changes, providing persistent architectural context across all phases of a workflow run.
