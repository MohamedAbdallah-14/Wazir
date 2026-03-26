# Code Intelligence Platforms Research

**Date**: 2026-03-25
**Scope**: Sourcegraph architecture, SCIP protocol, GitHub code navigation, code intelligence vs code search, cross-repository navigation, multi-language indexing, and alternative platforms.

---

## Source 1: Sourcegraph Architecture Documentation (https://sourcegraph.com/docs/admin/architecture)

- Sourcegraph maintains a **persistent cache of all connected repositories**. The `gitserver` service stores repos and makes them accessible to other services. The `worker` service keeps repos up-to-date while respecting code host rate limits.
- **Code Search** uses `zoekt` to create a **trigram index of the default branch** of every repository, delivering sub-second search across billions of lines of code. This is why Sourcegraph search is faster than code host search.
- Sourcegraph also has a **non-indexed search path** via the `searcher` service for code not on default branches. This balances the common case (searching default branches) with storage savings (not indexing everything).
- **Code Navigation** has two tiers:
  - **Search-based code navigation** (default): Reuses the text search architecture. Works without extra configuration but can produce false positives (e.g., finding two definitions for a symbol) or false negatives (missing references). Good enough for many use cases.
  - **Precise code navigation**: Repositories add a build pipeline step that computes an index (SCIP or LSIF format) and uploads it to Sourcegraph. Provides compiler-accurate results that search-based navigation cannot.
- **Deep Search** is an agentic code search tool that understands natural language questions. Under the hood, it is an AI agent that uses Sourcegraph's tools (search, navigation, etc.) to generate answers. Under active development.
- **Batch Changes** create changesets (PRs/MRs) across many repositories simultaneously. You specify a search query plus a script to run in each matched repo, then track all PRs until merged. Use cases: linter cleanups, deprecated API migration, dependency upgrades, security patches.
- **Code Insights** aggregates data from searches into visualizations over time, providing metrics like migration progress or code smell trends.
- **Core infrastructure services**: frontend (serves UI and API), gitserver (stores repos), zoekt-indexserver + zoekt-webserver (indexed search), searcher (non-indexed search), repo-updater (syncs repos from code hosts), worker (background jobs), symbols (language-aware symbol search using ctags), syntect-server (syntax highlighting), executor (sandboxed compute for auto-indexing and batch changes).

## Source 2: SCIP -- A Better Code Indexing Format Than LSIF (https://sourcegraph.com/blog/announcing-scip)

- **SCIP** stands for "SCIP Code Intelligence Protocol" (recursive acronym). Pronounced "skip." It is the successor to LSIF for powering code navigation features like "Go to definition" and "Find references."
- **Why replace LSIF?** LSIF uses a graph-based data model (vertices and edges) that is difficult to work with:
  - LSIF graphs are complex: understanding how "Go to definition" works requires tracing edges through multiple vertex types (resultSet, definitionResult, item, range, document).
  - LSIF payloads are large: uncompressed LSIF is ~5x larger than equivalent SCIP. Compressed (gzip) LSIF is ~4x larger than compressed SCIP.
  - LSIF processing is slow: Sourcegraph's backend had to do expensive deduplication and correlation steps.
- **SCIP data model** is simpler and document-oriented:
  - **Index**: top-level container with metadata (tool info, version) and a list of Documents.
  - **Document**: corresponds to a single source file, containing a list of Occurrences and optionally Symbols.
  - **Occurrence**: a specific location in a document (line, character range) tied to a symbol string. Each occurrence has a role (definition, reference, etc.).
  - **Symbol**: a globally unique identifier string that follows a specific format encoding the package manager, package name, version, and path to the symbol within the package. Example: `scip-java maven com.google.guava guava 31.1 com/google/common/collect/ImmutableList#of().`
- **Protobuf-based**: SCIP is defined as a Protobuf schema (`scip.proto`), making it easy to generate bindings for any language. This also provides built-in compression advantages.
- **SCIP is a transmission format**, not a storage format. It is designed for sending data from indexer producers to platform consumers.
- **Supported indexers at launch**: scip-typescript (TypeScript/JavaScript), scip-java (Java, Scala, Kotlin), scip-python, scip-ruby, scip-go, rust-analyzer (Rust), plus community indexers.

## Source 3: From Code Search to a Code Intelligence Platform (https://sourcegraph.com/blog/code-search-to-code-intelligence)

- **Code search** finds matching lines of text. **Code intelligence** finds *answers*: who wrote that code, what are the top usage patterns of a function, which repositories use it, etc.
- Sourcegraph's motto evolved to "answers, not just matching lines."
- The **law of conservation of code complexity**: dev tools improve but software complexity grows proportionally. Every improvement in tooling is spent on building more complex systems.
- Code intelligence integrates **metadata from all dev tools that know things about code**: version control (who changed this and when), CI/CD (is this code passing tests), issue trackers (what bugs are associated), observability (how does this code perform in production).
- The platform is evolving from pure search into a **knowledge layer** that connects code artifacts to their broader lifecycle context.
- **Vision**: Code intelligence should be as natural and ubiquitous as a Google search -- you ask a question about code and get the answer, regardless of which repo, which service, or which language it lives in.

## Source 4: GitHub Code Navigation Documentation (https://docs.github.com/en/repositories/working-with-files/using-files/navigating-code-on-github)

- GitHub code navigation is **built-in and requires zero configuration**. It automatically extracts navigation information for supported languages.
- Powered by the open source **tree-sitter** library, which parses source code into concrete syntax trees.
- **Supported languages** (all via tree-sitter): Bash, C, C#, C++, CodeQL, Elixir, Go, JSX, Java, JavaScript, Lua, PHP, Protocol Buffers, Python, R, Ruby, Rust, Scala, Starlark, Swift, TypeScript.
- **Features**: Jump to definition (within same repo), Find all references (within same repo), symbol pane for quick navigation, symbols search across all files or all public repos.
- **Limitations**: Works only for active branches, only for repos with fewer than 100,000 files.
- GitHub also supports **precise code navigation** for select languages using **stack graphs** (see Source 5), which produces more accurate results than tree-sitter alone.

## Source 5: Introducing Stack Graphs -- GitHub Engineering Blog (https://github.blog/open-source/introducing-stack-graphs/)

- **Stack graphs** are a new open source framework created by GitHub for defining name binding rules using a declarative DSL.
- Based on the **scope graphs** framework from Eelco Visser's research group at TU Delft, adapted to work incrementally and at scale.
- **Why stack graphs?** Name resolution is language-specific and complex:
  - Python allows shadowing of top-level definitions; Rust does not.
  - Imports create cross-file relationships.
  - Modules, classes, and nested scopes create layered naming contexts.
  - Each language has different rules for how names resolve.
- Stack graphs encode **name binding information as a graph structure** where paths through the graph represent valid name bindings.
- **Key innovation: incrementality**. Stack graphs can be computed per-file and then stitched together, meaning you do not need to re-analyze an entire repository when one file changes. This is critical for scaling to all of GitHub.
- **No build system required**: Unlike LSIF/SCIP which often require running a build or compiler, stack graphs work purely from source text. This means GitHub can compute them without access to a project's build configuration.
- Stack graphs work equally well for **dynamic languages** (Python, JavaScript) and **static languages** (Go, Java, Rust).
- The framework is open source: `stack-graphs` Rust crate on crates.io.
- First deployed for **Python** precise code navigation on GitHub.com (all public and private repos).

## Source 6: Zoekt -- Trigram-Based Code Search Engine (https://github.com/sourcegraph/zoekt + https://thomastay.dev/blog/how-zoekt-works/)

- **Zoekt** (Dutch for "seek") is a fast, trigram-based code search engine originally created by Han-Wen Nienhuys at Google. The Sourcegraph fork at `github.com/sourcegraph/zoekt` is the actively maintained version.
- **How trigram indexing works**:
  1. Source files are broken into trigrams (3-character sequences) with positional information.
  2. For a query like "world", Zoekt extracts query trigrams ("wor", "orl", "rld"), looks up only the first and last trigram in the index, and checks that their stored positions are the correct distance apart.
  3. This produces a set of candidate documents. Each candidate is then verified against the full query string. The positional approach allows Zoekt to hold less of the index in RAM while still achieving high recall.
- **Shard-based organization**: Index data is organized into memory-mappable `.zoekt` files. Shard size limited to ~4GB (uint32 offsets), content ~1GB per shard. Large repos are split across multiple shards for parallel search.
- **Supports**: substring search, regex search, symbol-aware search, rich query language (repo filters, file filters, language filters, case sensitivity toggles).
- Zoekt differs from Google's original Code Search (which used a trigram index without positional data) by storing offsets, trading slightly more index space for significantly fewer false positives and faster verification.
- **Performance**: Sub-second searches across billions of lines. The index is designed to be memory-mapped, so the OS virtual memory system handles hot/cold data transparently.

## Source 7: LSIF -- Language Server Index Format (https://microsoft.github.io/language-server-protocol/overviews/lsif/overview/ + https://lsif.dev/)

- **LSIF** (Language Server Index Format, pronounced "else if") is a standard format created by Microsoft for persisting code intelligence data that language servers produce.
- **Motivation**: The Language Server Protocol (LSP) provides real-time code intelligence (autocomplete, go-to-definition, find references) but requires all source code on local disk plus a running language server. LSIF decouples the *computation* from the *consumption* by pre-computing the data in CI and storing it.
- **Data model**: LSIF uses a graph of vertices and edges. Documents, ranges, hover results, definition results, and reference results are vertices. Relationships between them are edges. This mirrors LSP request/response structure.
- **How LSIF is generated**: An LSIF indexer (typically wrapping or extending a language server) analyzes a project and emits a stream of JSON vertices and edges. This is done in CI as a build step.
- **Benefits**: Fast (precomputed), precise (comes from a real compiler/analyzer environment), portable (the dump file can be consumed by any LSIF-compatible tool).
- **LSIF.dev** tracks community indexer implementations. As of research date, indexers exist for: TypeScript/JavaScript, Java, Go, Python, C/C++, C#, Dart, Haskell, Kotlin, Rust, Swift, and others at varying maturity levels.
- **Adoption**: Used by Sourcegraph, GitLab, GitHub (initially, before stack graphs), and other code browsing tools.
- **Limitations that led to SCIP**: LSIF's graph model is complex and verbose. Processing requires correlating edges and vertices in memory, which scales poorly for large repos. SCIP replaced it as the primary format at Sourcegraph.

## Source 8: The LSIF at Sourcegraph -- A Year in Review (https://sourcegraph.com/blog/evolution-of-the-precise-code-intel-backend)

- Sourcegraph's precise code intelligence backend evolved through **multiple generations** of storage and processing:
  - **Gen 1**: Stored raw LSIF dumps in PostgreSQL as large JSON blobs. Simple but extremely slow for large repos.
  - **Gen 2**: Converted LSIF graphs into a SQLite database per upload, stored on disk. Queries became fast but managing thousands of SQLite files had operational complexity.
  - **Gen 3**: Moved to a custom encoding stored in cloud blob storage (S3/GCS) with a PostgreSQL metadata layer for lookup. This balanced query speed with operational simplicity.
- **Cross-repository intelligence** requires linking LSIF data across uploads from different repos. When you click "Go to definition" on an imported symbol, the system must: (a) look up the symbol in the current repo's index, (b) identify which external package/version it references, (c) find the index for that external package, (d) resolve the definition location.
- The system processes **millions of LSIF vertices and edges** per upload. The backend must handle concurrent uploads, version-aware lookups (different commits have different indexes), and garbage collection of stale data.
- **Key engineering lesson**: The graph model of LSIF made processing expensive. The move to SCIP's document-oriented model significantly simplified the processing pipeline.

## Source 9: Sourcegraph Cross-Repository Code Navigation (https://sourcegraph.com/blog/cross-repository-code-navigation)

- **Cross-repository navigation** allows clicking on an imported symbol and jumping to its definition in another repository, seeing every caller of a function regardless of which repo they are in, and following dependency chains across the entire codebase.
- **How it works under the hood**:
  1. Each repository is indexed with SCIP, producing a set of symbol identifiers that include package manager, package name, version, and symbol path.
  2. When you click on a reference, Sourcegraph looks up the symbol ID in the current repo's index.
  3. The symbol ID encodes enough information to identify which external package defines it.
  4. Sourcegraph finds the index for that external package (if it has been indexed) and resolves the definition location.
  5. The user is navigated to the exact line in the external repository.
- **"Find References" across repos**: When invoked on a definition, Sourcegraph queries all uploaded indexes to find every occurrence of that symbol across all repositories. This is fundamentally different from text search -- it finds semantic references, not string matches.
- **Dependency graph awareness**: The system understands package manager dependency relationships (npm, Maven, pip, Go modules, etc.) so it can resolve which version of a dependency a repo uses and navigate to the correct version's source.
- **Use cases**: Debugging shared library issues, understanding API usage patterns across services, tracking security patch adoption across all consumers of a library.

## Source 10: Sourcegraph Auto-Indexing (https://sourcegraph.com/blog/announcing-auto-indexing)

- **Auto-indexing** automates the process of generating SCIP/LSIF indexes. Previously, each repo had to manually add a build step -- a significant adoption barrier.
- **How auto-indexing works**:
  1. Sourcegraph detects the languages and build systems in a repository (by inspecting manifest files like `package.json`, `go.mod`, `pom.xml`, etc.).
  2. It infers the correct indexer and configuration.
  3. The repository is cloned into an **executor** -- a sandboxed compute environment that has access only to the cloned repo and the public internet.
  4. The indexer runs inside the sandbox, producing a SCIP/LSIF index file.
  5. The index is uploaded back to the Sourcegraph instance.
- **Executor architecture**: Executors are isolated VMs (using Firecracker or Docker) that run untrusted compute. This separation is important because indexing may require installing dependencies or running build tools.
- **Auto-indexing policies** control which repos and branches are indexed, and how often. Policies can be set globally or per-repo.
- **Supported languages for auto-indexing** (at time of blog): Go, TypeScript, JavaScript, Python, Ruby, JVM (Java/Kotlin/Scala).
- Auto-indexing reduced setup from "hours per repository" to "minutes for all repositories."

## Source 11: How Cody Understands Your Codebase (https://sourcegraph.com/blog/how-cody-understands-your-codebase)

- **Cody** is Sourcegraph's AI coding assistant. Its key differentiator is using Sourcegraph's code intelligence platform for context retrieval rather than relying solely on embeddings.
- **Context retrieval pipeline**:
  1. When a user asks a question, Cody uses Sourcegraph's **Search API** to find relevant code across local and remote repositories.
  2. It leverages the **code graph** (SCIP indexes) to understand symbol relationships, call hierarchies, and dependency chains.
  3. Retrieved context is passed to the LLM alongside the user's question.
- **Why platform context beats embeddings**:
  - No need to send code to an external embedding processor.
  - Zero additional configuration.
  - Scales to massive codebases (Sourcegraph already indexes everything).
  - Context is always up-to-date because it queries the live index, not a stale embedding store.
- **Context sources**: Open files in the editor, the current repository, all connected repositories (for enterprise), symbol definitions and references from the code graph.
- LLMs are "only as good as the context they're given." For code-specific questions, having the right code context is the difference between a generic answer and a precise, codebase-aware answer.

## Source 12: GitLab Code Intelligence (https://docs.gitlab.com/user/project/code_intelligence/)

- GitLab code intelligence is **built into GitLab** and powered by LSIF.
- Features: type signatures, symbol documentation, go-to-definition, find references.
- **CI/CD-driven indexing**: A CI job generates an LSIF document using a language-specific indexer, then uploads it as a CI artifact.
- **Processing pipeline**:
  1. The CI job produces an LSIF artifact.
  2. Workhorse (GitLab's HTTP proxy) receives the upload and asks GitLab Rails to authorize it.
  3. If authorized, Workhorse reads the LSIF document line-by-line and generates per-file JSON code intelligence data.
  4. The output is a zipped directory of JSON files mirroring the project structure, stored in object storage.
  5. When a user views a file, the frontend fetches the corresponding JSON directly from object storage.
- **Limitation**: GitLab processes one LSIF file per project and does not support different LSIF files per branch.
- **SCIP support**: GitLab does not natively support SCIP, but you can use the SCIP CLI to convert SCIP indexes to LSIF format. Native SCIP support is tracked as a feature request.
- **CI/CD component**: GitLab provides a reusable CI/CD component for easy setup. Supported languages: Go (1.21+), TypeScript/JavaScript, Java (8/11/17/21), Python, .NET/C#.

## Source 13: Greptile -- Graph-Based Codebase Context (https://www.greptile.com/docs/how-greptile-works/graph-based-codebase-context)

- **Greptile** is an AI code review agent that builds a **complete graph of your repository** to understand how changes affect the whole system.
- **Indexing process**:
  1. **Repository Scanning**: Parses every file to extract directories, files, functions, classes, variables.
  2. **Relationship Mapping**: Connects all elements -- function calls, imports, dependencies, variable usage.
  3. **Graph Storage**: Stores the complete graph for instant querying during reviews.
- **How it differs from diff-only tools**: Most AI review tools (CodeAnt AI, Sourcery) analyze only the diff in a PR. Greptile reviews every change within the full context of the repository, catching cross-file dependency breaks, architectural drift, and convention violations.
- **Function-level analysis**: When a function changes, Greptile traces its callers (who calls this function), callees (what does this function call), similar functions (are there patterns being violated), and related tests.
- **Learning system**: Thumbs up/down reactions and replies teach Greptile what matters to your team. After 2-3 weeks, it stops surfacing irrelevant suggestions.
- **Indexing performance**: Small repos take 3-5 minutes to index; large repos can take over an hour.
- **API**: Three core operations -- index a repository (POST /repositories), check index status (GET /repositories/:id), query in natural language (POST /query).

## Source 14: Tree-sitter -- Incremental Parser Generator (https://github.com/tree-sitter/tree-sitter)

- **Tree-sitter** is an incremental parsing library that builds concrete syntax trees (CSTs) and efficiently updates them as source files are edited.
- **How it works**: You write a grammar in JavaScript describing a language's syntax. Tree-sitter (written in Rust) generates a parser (in C or WebAssembly) for that language. The parser uses a **GLR-based algorithm** that handles ambiguous grammars.
- **Incremental parsing**: When a file is edited, tree-sitter does not re-parse the entire file. It reuses existing parse tree nodes that have not changed, only parsing the modified regions. This makes it fast enough for real-time use in editors.
- **Error recovery**: Tree-sitter can produce a usable syntax tree even when the source code has errors (incomplete edits, syntax mistakes). It determines the start and end of each error region and provides the best possible tree.
- **S-expression query system**: Tree-sitter includes a built-in query language for pattern matching on syntax trees. This is how tools extract definitions, references, and other structural information.
- **Language support**: Active community grammars cover 40+ languages. Official editor integrations: Neovim, Emacs (29+), Zed, Helix, Lapce, Atom.
- **Used by**: GitHub (code navigation, syntax highlighting), Sourcegraph (search-based code navigation, syntax analysis), numerous AI coding tools for parsing context.

---

## Synthesis

### The Spectrum of Code Intelligence

Code intelligence exists on a **spectrum from heuristic to precise**:

| Level | Approach | Accuracy | Setup Cost | Example |
|-------|----------|----------|------------|---------|
| Text search | Trigram index (Zoekt) | Low -- string matching only | Zero | Sourcegraph code search |
| Syntax-aware search | Tree-sitter parsing + ctags | Medium -- understands structure but not semantics | Zero | GitHub basic code nav |
| Heuristic navigation | Search-based nav (regex + heuristics) | Medium -- many false positives/negatives | Zero | Sourcegraph default nav |
| Precise navigation | SCIP/LSIF indexing from compiler front-ends | High -- compiler-accurate | Medium (CI pipeline step) | Sourcegraph precise nav |
| Stack graph navigation | Declarative name binding rules | High -- no build required | Zero (computed server-side) | GitHub precise Python nav |
| Full code graph | AST + relationship graph + AI | Variable -- depends on graph quality | Low-Medium (indexing step) | Greptile, Cody |

### Key Architectural Patterns

1. **Separation of indexing and serving**: Every serious platform separates the expensive indexing phase (done in CI or via executors) from the lightweight serving phase (fast lookups from precomputed data). This is the core insight behind LSIF and SCIP.

2. **Document-oriented beats graph-oriented**: Sourcegraph's experience with LSIF (graph model) vs SCIP (document model) showed that document-oriented formats are simpler to process, smaller to store (4-5x), and easier to reason about. The graph model was theoretically elegant but practically painful.

3. **Symbol identifiers are the universal join key**: Cross-repository intelligence works because SCIP symbol strings encode the full coordinate path (package manager + package + version + symbol path). This allows any reference in any repo to be resolved to its definition in any other repo, as long as both are indexed.

4. **Zero-config vs. precise is a fundamental tradeoff**: GitHub's stack graphs and tree-sitter navigation require zero configuration but trade off some accuracy. Sourcegraph's SCIP indexing requires CI setup but delivers compiler-accurate results. The ideal system offers both tiers.

5. **Incremental computation matters at scale**: Stack graphs' per-file incrementality and Zoekt's shard-based indexing both reflect the same principle -- you cannot re-process everything on every change at GitHub/Sourcegraph scale.

6. **Code intelligence powers AI coding assistants**: Sourcegraph Cody uses the code graph for context retrieval instead of embeddings, gaining accuracy, freshness, and scale. This is the emerging pattern: code intelligence infrastructure becomes the context engine for AI tools.

### Implications for Wazir

- **For code review workflows**: Greptile's approach of analyzing PRs against a full codebase graph (not just the diff) catches cross-file issues that diff-only review misses. This aligns with Wazir's goal of thorough review.
- **For context retrieval**: SCIP-style symbol identifiers could serve as a stable, language-agnostic way to reference code elements across Wazir's pipeline phases.
- **For multi-language support**: Tree-sitter provides zero-config structural parsing across 40+ languages. SCIP provides precise semantic indexing for fewer languages but with compiler accuracy. A tiered approach (tree-sitter base + SCIP where available) mirrors what Sourcegraph and GitHub both do.
- **For incremental operation**: Any code intelligence Wazir integrates should be incremental -- re-indexing an entire repo on every change is not viable for an interactive development workflow.
- **For cross-repository understanding**: The SCIP symbol format provides a proven model for how to uniquely identify and link code elements across repository boundaries.
