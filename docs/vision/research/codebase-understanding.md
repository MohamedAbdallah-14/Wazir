# Codebase Understanding — Research vs Vision Comparison

## Strengths

### 1. Phase 1 DISCOVER correctly uses parallel codebase indexing

The vision's Phase 1 (DISCOVER) dispatches "Agent 2: Codebase indexing (or refresh)" and "Agent 3: Identify affected scope in codebase" as parallel subagents. This aligns with the research consensus that codebase understanding requires both structural indexing and scope analysis as distinct activities.

**Research basis**: `indexing-techniques.md` (two-tier architecture pattern — every production system separates indexing from serving); `comprehension-cognitive-models.md` (Sillito et al.'s 44-question taxonomy starts with "finding initial focus points" before expanding outward).

### 2. Hierarchical context delivery matches cognitive science

The vision's context budget system in subtask.md (READ FULL / READ SECTION / KNOW EXISTS) directly implements the research finding that information must be layered by abstraction level. The subtask planner decides what depth of codebase context each agent needs.

**Research basis**: `comprehension-cognitive-models.md` (Strategy 5: Cognitive Load Management — "present information in layers of increasing detail"); `comprehension-books-and-practice.md` (Gao et al. 2025 CodeMap — "global-to-local information architecture matches natural cognitive flow").

### 3. Fresh context per agent mirrors the "first encounter" comprehension model

The vision mandates stateless agents that are "born, do one job, write output to disk, and die." This is consistent with Pennington's bottom-up model — on first encounter with unfamiliar code, bottom-up comprehension dominates. Every agent approaches code fresh, avoiding the context poisoning that would corrupt an accumulated mental model.

**Research basis**: `comprehension-cognitive-models.md` (Pennington 1987 — "for a first encounter with unfamiliar code, bottom-up comprehension dominates"); `comprehension-books-and-practice.md` (von Mayrhauser & Vans 1995 — programmers dynamically switch comprehension strategies based on context).

### 4. Expertise modules as "beacons" for agents

The composer's expertise module system (`always.<role>`, `stacks.<detected-stack>.<role>`, `concerns.<declared-concerns>`) functions as a formalized beacon system. Brooks (1983) showed experts use beacons to rapidly confirm hypotheses. The expertise modules pre-load agents with the pattern knowledge that serves as their beacons.

**Research basis**: `comprehension-cognitive-models.md` (Brooks 1983 — beacons as "sets of features that typically indicate the occurrence of certain structures"); `comprehension-books-and-practice.md` (Soloway & Ehrlich 1984 — programming plans as stereotypic action sequences).

### 5. Original user input as ground truth combats specification telephone

The vision's principle "the original user input is the only ground truth" with every review checking back against it directly addresses the delocalized-plan comprehension problem — where meaning drifts as it passes through multiple transformations.

**Research basis**: `comprehension-books-and-practice.md` (Letovsky 1986 — delocalized plans are a "major source of comprehension difficulty because the programmer must mentally reconstruct a coherent plan from dispersed fragments").

### 6. File dependency matrix addresses a real code understanding bottleneck

The plan's file dependency matrix and convergence-point analysis directly targets the research finding that understanding cross-file relationships is the hardest part of codebase comprehension.

**Research basis**: `dependency-graphs.md` (Chinthareddy 2026 — deterministic AST-derived graphs achieve 90.2% coverage and are 70x faster than LLM-extracted graphs); `knowledge-graphs.md` (graph-guided retrieval consistently outperforms vector-only RAG for structural queries).

---

## Weaknesses

### 1. Vision says "codebase indexing" but never specifies WHAT kind of index

Phase 1 mentions "Codebase indexing (or refresh)" and references "indexed, L1/L2/L3" but never defines what L1, L2, L3 mean, what indexing technology to use, or what the index contains. The research corpus has 10 files with extensive findings on indexing techniques, semantic search, knowledge graphs, dependency graphs, repo maps, vector embeddings, and code intelligence platforms. The vision treats codebase understanding as a black box.

**Research says**: `indexing-techniques.md` defines a clear technology stack (tree-sitter for structural parsing, trigram index for text search, vector embeddings for semantic search, Merkle trees for change detection, SCIP for precise code navigation). `repo-maps.md` identifies a spectrum from file trees to knowledge graphs with specific token costs and quality tradeoffs. None of this appears in the vision.

**Vision says**: "Agent 2: Codebase indexing (or refresh)" and "Scan the codebase (indexed, L1/L2/L3)." That is the entire specification.

### 2. No repo map or structural context strategy for agents

The research conclusively shows that giving LLMs a ranked structural summary of the codebase (a "repo map") dramatically improves edit accuracy while using only 4.3-6.5% of the context window. The vision has no equivalent concept. Agents get context files listed in subtask.md, but there is no mechanism to give them architectural orientation before they start working.

**Research says**: `repo-maps.md` (Aider's PageRank + tree-sitter achieves 4.3-6.5% context utilization; "the repo map serves as a table of contents for the LLM — it tells the LLM which files to read"); `comprehension-cognitive-models.md` (Gao et al. 2025 — CodeMap reduced reliance on LLM text by 79% through hierarchical visualization).

**Vision says**: Nothing. The subtask.md has a "Context budget" with READ FULL/READ SECTION/KNOW EXISTS, but this is decided at planning time — there is no dynamic codebase orientation mechanism at execution time.

### 3. No semantic search capability specified

The research identifies semantic code search as essential for AI agent context retrieval — "find code that does X" queries that pure text search cannot answer. The vision does not mention semantic search, embeddings, or vector databases anywhere.

**Research says**: `semantic-search.md` (hybrid search combining semantic + keyword consistently outperforms either alone; Greptile's NL-summary trick bridges code-NL gap; chunking strategy is the #1 quality factor); `vector-embeddings.md` (code-specific embedding models significantly outperform general-purpose; AST-aware chunking at function/class boundaries is critical).

**Vision says**: Nothing about how agents find relevant code. Phase 1 Agent 3 "identifies affected scope" but the mechanism is unspecified.

### 4. No knowledge graph or dependency graph for cross-file reasoning

The research demonstrates that graph-based retrieval solves multi-hop reasoning (call chains, inheritance hierarchies, dependency tracing) that flat retrieval cannot. The vision's file dependency matrix in the plan is manually constructed by a planning agent — there is no automated graph that agents can query at execution time.

**Research says**: `knowledge-graphs.md` (CGM at NeurIPS 2025 — feeding graph structure directly into LLM attention outperforms both flat retrieval and agent-based approaches, 43% SWE-bench Lite); `dependency-graphs.md` (graph-based retrieval solves multi-hop reasoning that vector search cannot — "controller -> service -> repository chains").

**Vision says**: The plan has a "file dependency matrix" listing which subtasks write/read which files. This is a static planning artifact, not a queryable code graph.

### 5. Cognitive load management is implicit, not engineered

The research provides specific, quantified cognitive load findings (4+/-1 working memory chunks, 3 types of load, specific strategies for each). The vision's context budget is the only mechanism, and it operates at the wrong level — it controls how much file content an agent sees, not how information is structured for comprehension.

**Research says**: `comprehension-cognitive-models.md` (Strategy 5 — reduce extraneous load by filtering noise, manage intrinsic load by layering detail, maximize germane load by highlighting patterns); `comprehension-books-and-practice.md` (Fakhoury 2018 — poor naming measurably increases cognitive load via fNIRS brain imaging).

**Vision says**: The composer has a "~150-200 instruction budget" and "critical instructions at START and END." These are prompt engineering constraints, not comprehension-optimized information delivery.

### 6. No incremental indexing or change detection mechanism

The research unanimously says incremental indexing is essential — re-indexing an entire repo on every change is not viable. The vision mentions "Codebase indexing (or refresh)" but doesn't specify how refresh works.

**Research says**: `indexing-techniques.md` (Merkle tree change detection — Cursor; content-addressable hashing — GitHub; diff sketches — Meta Glean; all achieve O(changes) not O(repository)); `repo-maps.md` (file-modification-time caching prevents expensive full-repo re-indexing).

**Vision says**: "(or refresh)" — parenthetical, no specification.

---

## Critical to Edit

### 1. Define the codebase index architecture

**Research finding**: Every production AI coding tool uses a multi-layer index: structural parsing (tree-sitter) + text search (trigram index) + semantic search (vector embeddings). The combination consistently outperforms any single approach. Aider's PageRank-ranked repo map uses only 4.3-6.5% of context while providing sufficient architectural orientation. Deterministic AST-derived graphs are 70x faster and 20x cheaper than LLM-extracted graphs.

**Why critical**: Without specifying the index, every agent in Phase 1 and every executor in Part II operates blind. The planner must manually enumerate context files without tool support. The scope-identification agent has no defined mechanism. This is not a nice-to-have — it is the infrastructure that makes every other pipeline phase work. The vision says "codebase indexing" is Wazir's moat (Phase 1: "Wazir's moat. No competing tool does combined online + local research before specification"), but the moat has no specification.

**Suggested edit to vision**: Add a new section after "Architecture" titled "Codebase Intelligence" or expand Phase 1 DISCOVER with:

```
### Codebase Index (Three Layers)

**L1 — Structural Index (always available, zero-config)**
Tree-sitter parsing of all source files. Extracts: files, functions, classes,
methods, imports, exports. Builds a dependency graph (CALLS, IMPORTS, INHERITS,
IMPLEMENTS, CONTAINS edges). Incremental — re-parses only changed files using
file modification timestamps.

Output: repo-map (ranked symbol summary, PageRank on dependency graph,
token-budgeted to fit within context allocation).

**L2 — Text Search Index (always available, zero-config)**
Trigram inverted index over all source files. Enables sub-millisecond substring
and regex search. Incremental — indexes only changed files.

**L3 — Semantic Index (optional, requires embedding model)**
AST-aware chunking at function/class boundaries via tree-sitter. Embedded with
code-specific model. Stored in lightweight vector store. Enables "find code
that does X" queries. Hybrid retrieval: semantic results merged with L2
keyword results.

**Change detection**: Merkle tree over file hashes. O(changes) re-indexing,
not O(repository).

**Repo map**: Every agent receives a token-budgeted structural summary of the
codebase (L1), personalized to its subtask's affected files via PageRank
with personalization weights on subtask context files.
```

### 2. Add repo map to agent context model

**Research finding**: Aider's repo map — a PageRank-ranked, tree-sitter-extracted symbol summary — uses 4.3-6.5% of context window while providing sufficient architectural context for most tasks. It improved SWE-bench performance over ctags-based maps. The map serves as a "table of contents" telling the LLM which files matter. Without it, agents either get too little context (miss dependencies) or too much (drown in irrelevant code).

**Why critical**: The vision's subtask.md specifies context files at planning time, but the planner itself needs codebase understanding to make good file selections. At execution time, agents may discover they need files not listed in the subtask. The repo map solves both: it gives every agent architectural orientation, and it enables the planner to make informed context budget decisions. Without it, the context budget system is a manual process with no tool support.

**Suggested edit to vision**: In "The Subagent Contract" section, add:

```
3. **Receives a repo map** (~5-10% of context budget, auto-generated from L1 index,
   personalized to subtask context files)
```

And in the subtask.md template, add `repo_map: auto | custom | none` as a field.

### 3. Add graph-based scope analysis to Phase 1

**Research finding**: When a function changes, graph traversal (callers, callees, implementors, dependents) provides structurally correct impact analysis that topical similarity misses entirely. The 2026 Chinthareddy paper showed deterministic AST-derived graphs achieve 90.2% coverage in seconds. Code-Graph-RAG and Greptile both use this pattern for AI-assisted code understanding.

**Why critical**: Phase 1 Agent 3 "identifies affected scope in codebase" but has no defined mechanism. Without a code graph, scope analysis is grep + LLM guessing — exactly the approach the research shows produces structurally incorrect results. When the planner later builds the file dependency matrix, it needs accurate scope information. Wrong scope = wrong plan = wrong execution. This is upstream of everything.

**Suggested edit to vision**: In Phase 1 DISCOVER, change Agent 3 from:

```
- Agent 3: Identify affected scope in codebase
```

to:

```
- Agent 3: Identify affected scope via L1 dependency graph traversal
  (changed nodes → callers → callees → implementors → dependents,
  bounded by configurable depth)
```

---

## Nice to Have

### 1. Sillito question taxonomy as a formal comprehension protocol

The research catalogs 44 types of questions programmers ask during code comprehension, organized into 4 progressive categories. This could formalize how the Phase 1 scope-identification agent explores the codebase — starting with focus points, expanding outward, building connections, then integrating.

**Research basis**: `comprehension-cognitive-models.md` (Sillito et al. 2006 — 44 question types in 4 categories).

**Suggested addition**: Include in the scope-identification agent's expertise module as a structured exploration protocol.

### 2. Hotspot analysis via git history

The research identifies git log analysis (most-edited files, temporal coupling, knowledge distribution) as a powerful codebase understanding tool. The 80/20 rule applies: a few hotspot files do most of the work.

**Research basis**: `comprehension-books-and-practice.md` (Tornhill 2018 — Software Design X-Rays — hotspot analysis combines complexity with change frequency); `comprehension-books-and-practice.md` (MLH guide — `git log --pretty=format: --name-only | sort | uniq -c | sort -rg` identifies the 80/20 files).

**Suggested addition**: Phase 1 could include a lightweight hotspot analysis subagent that identifies the most-changed files in the affected scope. This helps the planner prioritize which files need the most careful subtask design.

### 3. SCIP for precise cross-file navigation

SCIP provides compiler-accurate go-to-definition and find-references across files, replacing the less precise tree-sitter-based approach. The vision could specify SCIP as an optional L1+ enhancement for languages where SCIP indexers exist.

**Research basis**: `code-intelligence-platforms.md` (SCIP — 10x faster CI indexing, 4x smaller than LSIF, document-oriented); `indexing-techniques.md` (SCIP has replaced LSIF as the standard for precise code intelligence).

**Impact**: Would improve scope analysis accuracy for TypeScript, Java, Python, Go, Rust. Not critical because tree-sitter provides good-enough structural understanding for planning purposes.

### 4. Code Property Graphs for security-focused reviews

The research identifies Code Property Graphs (AST + CFG + PDG merged) as the gold standard for security analysis. The vision's review stages could optionally use CPG analysis for security-sensitive subtasks.

**Research basis**: `dependency-graphs.md` (Joern CPG — detected 10/12 vulnerability types in Linux kernel; IEEE Test-of-Time Award 2024); `knowledge-graphs.md` (CPGs are the gold standard for security analysis but heavier to construct).

**Impact**: Would strengthen security gate reviews. Not critical because the expertise module system can encode security patterns without full CPG analysis.

### 5. Binary quantization for large monorepo support

For codebases exceeding 10M+ LOC, binary quantization of embeddings (1 bit per dimension) reduces memory 8x while maintaining 99.9% retrieval accuracy.

**Research basis**: `indexing-techniques.md` (Augment Code's binary quantization — 2GB to 250MB for 100M LOC, <200ms search latency, 99.9% accuracy).

**Impact**: Relevant only for very large codebases. The vision should note this as a scaling option but doesn't need it in the core spec.

### 6. Eye-tracking insights for review agent attention patterns

Research shows experts focus on method signatures and call sites, while novices fixate on comments. This could inform how review agents allocate attention during code review passes.

**Research basis**: `comprehension-books-and-practice.md` (Zhang et al. 2026 EyeLayer — human gaze patterns improve code summarization by 13.17% BLEU-4).

**Impact**: Marginal. The expertise module system already directs reviewer attention via antipatterns and checklists.

---

## Improvements

### Improvement 1: Add "Codebase Intelligence" section to Architecture

**Section to edit**: After "The Composer" and before "User Interaction Model"

**What to add**: A new subsection defining the three-layer index architecture (L1 structural/tree-sitter, L2 text/trigram, L3 semantic/embeddings), change detection mechanism (Merkle trees), and repo map generation (PageRank-ranked symbol summary). Define what L1/L2/L3 mean since these labels are used but never defined in Phase 1.

**Why (citing research)**: `indexing-techniques.md` actionable insight #1 ("Use tree-sitter as the primary structural parser"), #2 ("Build a trigram index for fast text/regex search"), #3 ("Layer semantic embeddings"), #4 ("Implement Merkle tree change detection"). `repo-maps.md` critical insight #1 ("A ranked symbol map is the highest-value, lowest-cost approach"). Every production AI coding tool uses this layered architecture — Cursor, Augment Code, Sourcegraph Cody, GitHub Copilot. The vision cannot leave this unspecified.

### Improvement 2: Expand Phase 1 DISCOVER with concrete indexing specification

**Section to edit**: Phase 1: DISCOVER, subagent list

**What to change**: Replace the vague "Agent 2: Codebase indexing (or refresh)" with:

```
- Agent 2a: Codebase structural index (tree-sitter parse → dependency graph →
  repo map). If index exists and Merkle tree root matches, skip.
  Otherwise incremental refresh.
- Agent 2b: Codebase semantic index refresh (re-embed changed chunks only).
  Optional — depends on embedding model availability.
```

And replace "Agent 3: Identify affected scope in codebase" with:

```
- Agent 3: Scope analysis via dependency graph traversal. Starting from
  user-mentioned entities, traverse CALLS/IMPORTS/INHERITS/IMPLEMENTS edges
  to configurable depth. Output: affected file list with relationship context.
```

**Why**: `dependency-graphs.md` key insight #1 ("Deterministic AST-derived graphs beat LLM-extracted graphs for reliability, speed, and cost"); `knowledge-graphs.md` key insight #4 ("LLM + Graph integration is the frontier — CGM showed graph structure directly fed to LLM attention outperforms flat retrieval"). The current specification gives the planner no tools to work with.

### Improvement 3: Add repo map to the Subagent Contract

**Section to edit**: "The Subagent Contract"

**What to add**: A third contract item: "Receives a repo map (auto-generated from L1 index, personalized to subtask context via PageRank, token-budgeted to ~5-10% of context allocation)."

**Why**: `repo-maps.md` — Aider's repo map achieves "4.3-6.5% context window utilization vs. 54-70% for agents using iterative search strategies." The vision already has the composer assembling prompts with "context budgeting" — the repo map is the missing piece that makes that budgeting effective. Without architectural orientation, agents waste context on iterative file exploration. This is exactly what the research warns against: `comprehension-cognitive-models.md` (Ko et al. — "35% of time spent on mechanics of foraging between code fragments").

### Improvement 4: Add hybrid search to executor's tool capabilities

**Section to edit**: Stage 1: Execute, "Patch strategy" paragraph

**What to add**: Before the patch strategy details, add: "The executor has access to hybrid codebase search (L2 trigram for exact matches + L3 semantic for conceptual matches). This replaces grep-only exploration and is critical for finding relevant code that the subtask's context budget may not have anticipated."

**Why**: `semantic-search.md` — "hybrid search is non-negotiable for production quality — combine semantic results with keyword results." `indexing-platforms.md` — Cursor's blog explicitly states "the primary consumer of code search tools is the AI agent itself." The vision's current executor has "structured edit tools" and "linter gating" but no specified search capability. If an executor encounters a reference it doesn't understand, it currently has no mechanism to look it up.

### Improvement 5: Add comprehension-optimized context delivery to the Composer

**Section to edit**: "The Composer", prompt assembly rules

**What to add**: Add a prompt assembly rule: "Context files are ordered global-to-local: repo map first (architectural orientation), then broad-scope files (interfaces, types), then narrow-scope files (implementation details). This matches the natural comprehension flow from top-down hypothesis formation to bottom-up verification."

**Why**: `comprehension-cognitive-models.md` (von Mayrhauser & Vans 1995 — the most empirically validated model shows programmers start top-down when domain context is available, switch to bottom-up for unfamiliar code); `comprehension-books-and-practice.md` (Gao et al. 2025 — "auditors understand codebases by flowing from global to local levels"). The current prompt assembly rules address instruction placement (Lost in the Middle) but not context file ordering. Context ordering is a distinct cognitive load concern.

### Improvement 6: Note the per-developer branch-aware indexing requirement

**Section to edit**: "Codebase Intelligence" section (new, per Improvement 1), or Phase 1 DISCOVER

**What to add**: "The index must reflect the developer's current working tree, not just the main branch. Agents work on feature branches with uncommitted changes. Index refresh must include unstaged files."

**Why**: `indexing-techniques.md` actionable insight #10 ("Per-developer, branch-aware indexing for real-time use. Augment's insight: developers switch branches frequently, and stale indexes cause hallucinations"). The vision's worktree-per-subtask execution model creates exactly this problem — each subtask's executor works in a different worktree with different file states. If the index only reflects main, executors get stale context.
