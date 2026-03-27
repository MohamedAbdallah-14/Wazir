# Codebase Indexing

Research date: 2026-03-25

## Key Findings

1. **Trigram indexing is the dominant technique for code search at scale.** Google Code Search (2006), Zoekt/Sourcegraph, GitHub Blackbird, and Debian Code Search all use trigram-based inverted indexes as their core data structure. Trigrams (3-character sequences) strike the best balance between index size and query selectivity for substring and regex matching.

2. **Code search is fundamentally different from text search.** Code requires exact punctuation matching, no stemming, no stop-word removal, and structure-aware ranking. General-purpose text search engines (Elasticsearch, Solr) perform poorly for code search -- this is why GitHub, Sourcegraph, and Google all built custom engines.

3. **Incremental indexing is essential at scale.** Every production system uses delta-based updates -- processing only changed files rather than re-indexing the entire corpus. Techniques include content-addressable hashing (Git blob IDs), Merkle trees (Cursor), and change-tracking databases (Meta Glean).

4. **Semantic indexing (embeddings + vector search) is the new frontier.** AI coding tools (Cursor, Augment, Roo Code) layer vector-based semantic search on top of structural indexing, enabling "find code that does X" queries even without exact keyword matches. This is critical for RAG pipelines powering AI agents.

5. **Symbol-level indexing via tree-sitter and ctags provides structure-aware search.** Tree-sitter offers incremental, error-tolerant AST parsing across 40+ languages; universal-ctags provides broad language coverage for symbol extraction. Production systems (Zoekt, Sourcegraph) use both together.

6. **SCIP has replaced LSIF as the standard for precise code intelligence.** Sourcegraph's SCIP protocol delivers 10x faster CI indexing and 4x smaller compressed payloads compared to LSIF, with a simpler graph-free data model based on protobuf.

7. **Index compression is critical for feasibility.** Delta encoding of posting lists, variable-byte (varint) encoding, TurboPFor SIMD-accelerated compression, and content deduplication reduce index sizes by 75-90%. GitHub's Blackbird compresses 115 TB of source to a 25 TB index (including a compressed copy of all content).

8. **Two-tier architecture (indexer + searcher) is universal.** Every system separates the indexing pipeline from the query-serving layer, communicating through shared storage (shard files, databases). This enables zero-downtime updates and independent scaling.

## Indexing Techniques

### 1. Trigram Indexing (n-gram Inverted Index)

**How it works:** Extract every overlapping 3-character sequence from source code. Store as keys in an inverted index mapping trigram -> list of (document_id, position) pairs (posting lists).

**Query processing:** For a search query like `limits`:
- Extract trigrams: `lim`, `imi`, `mit`, `its`
- Look up each trigram's posting list
- Intersect the posting lists to find documents containing all trigrams
- Verify candidates against the full query (post-filtering)

**Regex support:** Regular expressions are decomposed into required literal substrings, which are then looked up as trigrams. The regex `arg[eu]ment` might produce required trigrams from `arg` and `ment`. Candidate documents are then verified with the full regex engine.

**Key properties:**
- O(1) index lookup per trigram, intersection is O(min(posting_list_lengths))
- False positives possible (trigrams present but not in correct order) -- requires post-verification
- Index size is manageable: typically 20-30% of source size with compression
- Sub-50ms query times on multi-GB corpora (demonstrated by Zoekt on Android ~2GB)

**Used by:** Google Code Search, Zoekt/Sourcegraph, GitHub Blackbird, Debian Code Search

**Source:** Russ Cox, "Regular Expression Matching with a Trigram Index" (2012); Cursor blog, "Fast regex search: indexing text for agent tools"

### 2. Suffix Array Indexing

**How it works:** Construct a sorted array of all suffixes of the concatenated source text. Each entry stores just the offset into the original text. Binary search finds any substring in O(m log n) time where m is pattern length and n is corpus size.

**Regex support:** Decompose regex into literal fragments, binary-search each fragment in the suffix array to get candidate regions, then verify with the full regex.

**Key properties:**
- Space: 4-8 bytes per character of source (the offset array), though the original text must also be retained
- Construction: O(n) time with modern algorithms (SA-IS)
- Very fast for literal substring queries
- Impractical for extremely large corpora (multi-TB) due to memory requirements
- No false positives for literal searches

**Trade-offs vs. trigrams:**
- Suffix arrays are more precise (no false positives for literals) but use more memory
- Trigram indexes are more space-efficient and scale better to very large corpora
- Suffix arrays excel for single-machine, moderate-size deployments

**Used by:** livegrep (indexes Linux kernel source), Cursor's local index engine

**Source:** Nelson Elhage, "Regular Expression Search with Suffix Arrays" (2015)

### 3. Symbol Indexing (AST-based)

#### Tree-sitter

**How it works:** Incremental parsing library that builds a concrete syntax tree (CST) for source code. Supports 40+ languages via grammar definitions. Key capabilities:
- **Incremental parsing:** When code is edited, only the changed subtree is re-parsed. Cost is O(edit_size), not O(file_size).
- **Error recovery:** Produces valid parse trees even for syntactically incomplete code, identifying error boundaries and continuing.
- **S-expression queries:** Pattern-matching against the AST for precise, syntax-aware extraction of functions, classes, variables, imports.
- **Performance:** 36x faster than JavaParser for Java; parses most files in <1ms.

**MCP integration:** The mcp-server-tree-sitter exposes tree-sitter capabilities (file listing, AST fetching, query execution, symbol extraction, dependency analysis) as MCP tools for AI agents.

**Used by:** Zoekt (symbol extraction for common languages), Sourcegraph, CocoIndex, Cursor, Neovim, Helix, VS Code

#### Universal Ctags

**How it works:** Parses source code to produce a tag file mapping symbol names (functions, classes, variables) to their definition locations. Supports 50+ languages with extensible parsers.

**Key capabilities:**
- Tags both definitions and references (unlike Exuberant Ctags which only tagged definitions)
- Produces structured output (name, file, line, kind, scope, signature)
- Fast single-pass parsing -- suitable for CI/CD pipelines

**Used by:** Zoekt (long-tail language coverage), OpenGrok, Vim/Emacs, many editors

#### SCIP (SCIP Code Intelligence Protocol)

**How it works:** Language-agnostic protobuf-based protocol for emitting precise code intelligence data (definitions, references, implementations, type information). Replaces LSIF.

**Key improvements over LSIF:**
- **10x faster** CI indexing (scip-typescript vs lsif-node)
- **4x smaller** gzip-compressed payloads
- **Simpler model:** Document-oriented rather than graph-based; no need for complex graph traversal
- **Symbol naming scheme:** Globally unique, human-readable symbol identifiers (e.g., `npm package-name 1.0.0 src/`file.ts`/MyClass#method().`)

**Supported languages:** TypeScript/JavaScript (scip-typescript), Java/Scala/Kotlin (scip-java), Python (scip-python), Ruby (scip-ruby), Rust (rust-analyzer), Go, C/C++ (via clangd), and more.

**Used by:** Sourcegraph (precise code navigation), GitLab (via LSIF, with SCIP support planned)

#### LSP and LSIF

**LSP (Language Server Protocol):** Standardized JSON-RPC protocol between editors and language servers for real-time code intelligence (completions, definitions, references, diagnostics). Designed for interactive use -- requires a running language server process.

**LSIF (Language Server Index Format):** Offline serialization of LSP data into a graph format (vertices = documents/ranges/results, edges = LSP requests). Enables code navigation without running a language server. Being superseded by SCIP due to complexity and size issues.

### 4. Semantic / Vector Indexing

**How it works:** Code is chunked (using tree-sitter for syntax-aware boundaries), each chunk is embedded into a high-dimensional vector using an embedding model, and vectors are stored in a vector database for similarity search.

**Pipeline stages:**
1. **Chunking:** Tree-sitter splits code into semantic units (functions, classes, methods). Chunks are sized to fit within token limits by traversing the AST depth-first, merging siblings as long as they stay under the limit.
2. **Embedding:** Code chunks are converted to vectors using embedding models (OpenAI, SentenceTransformers, custom models). Augment Code uses custom AI models trained specifically for code.
3. **Storage:** Vectors stored in vector databases (Qdrant, Turbopuffer, PGVector/Postgres, Pinecone).
4. **Retrieval:** Query text is embedded with the same model; nearest-neighbor search returns top-k similar chunks.

**Optimization -- Binary Quantization (Augment Code):**
- Full float32 embeddings reduced to binary vectors (1 bit per dimension)
- 8x memory reduction (2GB -> 250MB for 100M LOC)
- Search latency from 2+ seconds to <200ms
- 99.9% accuracy maintained on typical queries
- Automatic fallback to full precision for edge cases

**Hybrid search:** Combining vector similarity (60%) with keyword matching (40%) improves precision from 72% to 87% (empirical finding from RAG pipeline research).

**Used by:** Cursor (Turbopuffer), Augment Code (custom), Roo Code (Qdrant), CocoIndex (PGVector)

### 5. Index Compression Techniques

**Delta encoding:** Store differences between consecutive document IDs in sorted posting lists rather than absolute IDs. Reduces integer sizes dramatically when IDs are clustered.

**Variable-byte (varint) encoding:** Use 1-4 bytes per integer based on magnitude. The high bit of each byte signals continuation. Fast to decode, reasonable compression ratio.

**TurboPFor:** SIMD-accelerated integer compression combining bitpacking with patched frame-of-reference encoding. Used by Debian Code Search for positional indexes. Achieves decoding speeds of billions of integers per second.

**Positional index with posrel bits (Debian Code Search):** Store (doc, position) pairs with a bitstream indicating document boundaries (1 = next document, 0 = same document). Reduces index size to ~75% while enabling positional queries that are 14x faster than non-positional approaches.

**Content deduplication (GitHub):** Shard by Git blob object ID to avoid indexing duplicate content. GitHub's 115 TB of source contains enough duplication that deduplication + delta encoding reduces it to 28 TB of unique content.

## Tools and Platforms

### Production Code Search Engines

| Platform | Engine | Language | Index Type | Scale | Key Feature |
|----------|--------|----------|-----------|-------|-------------|
| **GitHub** | Blackbird | Rust | Trigram (ngram) | 45M repos, 115 TB source | 640 qps, content-addressable dedup |
| **Sourcegraph** | Zoekt | Go | Positional trigram | Billions of LOC | BM25F ranking, symbol-aware search |
| **Google** | Code Search (internal) | C++ | Sparse n-gram | 1.5 TB code | 200 qps, ~50ms median latency |
| **Meta** | Glean | Haskell | Schema-driven fact DB | Entire Meta codebase | Derived predicates, Angle query language |
| **OpenGrok** | Lucene-based | Java | Inverted index (Lucene) | Single-org scale | Ctags integration, incremental updates |
| **Debian** | DCS | Go | Positional trigram + TurboPFor | 140 GB source (18K packages) | Positional queries, SIMD compression |
| **livegrep** | Custom | C++ | Suffix array | Single-repo (Linux kernel) | In-memory, interactive regex |

### AI Coding Tool Indexing

| Tool | Indexing Approach | Change Detection | Vector DB | Key Innovation |
|------|------------------|-------------------|-----------|----------------|
| **Cursor** | Embedding + Merkle tree sync | Merkle tree (10-min cycle) | Turbopuffer | Server-side index, fast suffix arrays for regex |
| **Augment Code** | Custom embeddings + binary quantization | Real-time (<seconds) | Custom | Per-developer branch-aware index, 8x memory reduction |
| **Roo Code** | Configurable embedding providers | On-change | Qdrant | Multiple embedding providers, configurable thresholds |
| **CocoIndex** | Tree-sitter + SentenceTransformers | Incremental (change-only) | PGVector | Open-source pipeline, real-time updates |

### Symbol Indexing Protocols

| Protocol | Format | Key Properties | Used By |
|----------|--------|---------------|---------|
| **SCIP** | Protobuf | Document-oriented, globally unique symbol IDs, 4x smaller than LSIF | Sourcegraph |
| **LSIF** | JSON graph | Graph-based (vertices + edges), offline LSP data | GitLab, VS Code |
| **LSP** | JSON-RPC | Real-time, requires running server | All modern editors |
| **ctags** | Tag file (text) | Simple name-to-location mapping, 50+ languages | Vim, Emacs, OpenGrok, Zoekt |
| **tree-sitter** | In-memory AST | Incremental, error-tolerant, S-expression queries | Neovim, Helix, Zoekt, CocoIndex |

## Sources (with URLs)

### Primary Technical References

- [The technology behind GitHub's new code search (Timothy Clem, GitHub Blog, 2023)](https://github.blog/engineering/architecture-optimization/the-technology-behind-githubs-new-code-search/) -- Definitive reference for Blackbird architecture, ngram indexing, content-addressable sharding, delta indexing, and query processing at GitHub scale.

- [Regular Expression Matching with a Trigram Index (Russ Cox, 2012)](https://swtch.com/~rsc/regexp/regexp4.html) -- Foundational paper on how Google Code Search worked. Explains trigram extraction, posting list intersection, and regex-to-trigram conversion.

- [Regular Expression Search with Suffix Arrays (Nelson Elhage, 2015)](https://blog.nelhage.com/2015/02/regular-expression-search-with-suffix-arrays/) -- livegrep's suffix-array approach to code search, with detailed comparison to trigram methods.

- [Fast regex search: indexing text for agent tools (Cursor Blog, 2025)](https://cursor.com/blog/fast-regex-search) -- Cursor's analysis of trigram vs. suffix array approaches, performance benchmarks, and why regex indexing matters for AI agents.

- [SCIP - a better code indexing format than LSIF (Sourcegraph Blog, 2022)](https://sourcegraph.com/blog/announcing-scip) -- Design rationale for SCIP, comparison with LSIF, performance improvements.

- [Indexing code at scale with Glean (Meta Engineering Blog, 2024)](https://engineering.fb.com/2024/12/19/developer-tools/glean-open-source-code-indexing/) -- Meta's schema-driven code indexing system, derived predicates, Angle query language.

- [Keeping it boring (and relevant) with BM25F (Sourcegraph Blog)](https://sourcegraph.com/blog/keeping-it-boring-and-relevant-with-bm25f) -- How Zoekt applies BM25F scoring with field-weighted ranking for code search (content, symbols, filenames).

### Architecture Deep Dives

- [Zoekt Architecture (DeepWiki)](https://deepwiki.com/sourcegraph/zoekt/1.1-architecture) -- Detailed breakdown of Zoekt's two-subsystem architecture, shard management, and memory mapping.

- [Zoekt GitHub Repository](https://github.com/sourcegraph/zoekt) -- Source code and design docs for the trigram-based search engine powering Sourcegraph.

- [A brief history of code search at GitHub (GitHub Blog, 2021)](https://github.blog/engineering/architecture-optimization/a-brief-history-of-code-search-at-github/) -- Context for why GitHub built Blackbird from scratch.

- [OpenGrok GitHub Repository](https://github.com/oracle/opengrok) -- Oracle's open-source code search engine using Lucene + ctags.

- [Universal Ctags Documentation](https://docs.ctags.io/) -- Reference for universal-ctags symbol extraction capabilities.

### AI/Semantic Indexing

- [How we made code search 40% faster for 100M+ line codebases using quantized vector search (Augment Code)](https://www.augmentcode.com/blog/repo-scale-100M-line-codebase-quantized-vector-search) -- Binary quantization achieving 8x memory reduction with 99.9% accuracy.

- [A real-time index for your codebase (Augment Code)](https://www.augmentcode.com/blog/a-real-time-index-for-your-codebase-secure-personal-scalable) -- Per-developer branch-aware indexing, custom embedding models, real-time updates.

- [How Cursor Indexes Codebases Fast (Engineer's Codex, 2025)](https://read.engineerscodex.com/p/how-cursor-indexes-codebases-fast) -- Merkle tree-based change detection for efficient incremental sync.

- [Securely indexing large codebases (Cursor Blog)](https://cursor.com/blog/secure-codebase-indexing) -- Cursor's security model for server-side codebase indexing.

- [Codebase Indexing (Roo Code Documentation)](https://docs.roocode.com/features/codebase-indexing) -- Roo Code's configurable embedding + Qdrant approach.

- [Build Real-Time Codebase Indexing for AI Code Generation (CocoIndex)](https://cocoindex.io/blogs/index-code-base-for-rag) -- Open-source tree-sitter + embedding pipeline.

### Compression and Performance

- [Debian Code Search: positional index, TurboPFor-compressed (Michael Stapelberg, 2019)](https://michael.stapelberg.ch/posts/2019-09-29-dcs-positional-turbopfor-index/) -- Positional index design with TurboPFor SIMD compression.

- [Techniques for Inverted Index Compression (arXiv, 2019)](https://arxiv.org/pdf/1908.10598) -- Survey of delta encoding, varint, gamma codes, and modern SIMD approaches.

- [Index Compression (Stanford NLP IR Book, Ch. 5)](https://nlp.stanford.edu/IR-book/pdf/05comp.pdf) -- Textbook reference for posting list compression techniques.

### Tree-sitter and Code Intelligence

- [Tree-sitter GitHub Repository](https://github.com/tree-sitter/tree-sitter) -- The incremental parsing library powering modern code intelligence.

- [mcp-server-tree-sitter (GitHub)](https://github.com/wrale/mcp-server-tree-sitter) -- MCP server exposing tree-sitter capabilities to AI agents.

- [AST Parsing at Scale: Tree-sitter Across 40 Languages (Dropstone Research)](https://www.dropstone.io/blog/ast-parsing-tree-sitter-40-languages) -- Practical guide to tree-sitter parsing at scale.

- [SCIP GitHub Repository](https://github.com/sourcegraph/scip) -- SCIP protocol specification and tooling.

- [Language Server Protocol (Microsoft)](https://microsoft.github.io/language-server-protocol/) -- LSP specification.

- [The Language Server Index Format (VS Code Blog, 2019)](https://code.visualstudio.com/blogs/2019/02/19/lsif) -- LSIF specification and motivation.

## Actionable Insights

### For Wazir's Codebase Context System

1. **Use tree-sitter as the primary structural parser.** It provides incremental parsing (only re-parse what changed), error tolerance (works on incomplete code), and cross-language support (40+ grammars). The mcp-server-tree-sitter pattern shows how to expose this as MCP tools. Extract functions, classes, imports, and module structures for the index.

2. **Build a trigram index for fast text/regex search.** Trigram indexing is proven at every scale from single-repo (Debian Code Search) to 45M repos (GitHub). For a project-level tool, a simple trigram inverted index with delta-encoded posting lists provides sub-millisecond substring search. This is what AI agents actually need when they call grep-like tools.

3. **Layer semantic embeddings for "what does this code do?" queries.** Use tree-sitter chunking (split at function/class boundaries, not arbitrary lines) to produce semantically coherent chunks. Embed with a code-specific model. Store in a lightweight vector store (PGVector in SQLite equivalent, or Qdrant). This enables RAG retrieval for the AI context window.

4. **Implement Merkle tree change detection.** Follow Cursor's approach: hash each file, build a Merkle tree over the directory structure, compare root hashes to detect changes, then re-index only changed subtrees. This makes re-indexing cost O(changes) not O(repository).

5. **Use content-addressable deduplication.** When indexing multiple branches or related projects, shard by content hash (like Git blob IDs) to avoid re-indexing identical files. GitHub found this reduces crawl volume by 50%+.

6. **Adopt SCIP for precise code navigation.** If Wazir needs go-to-definition or find-references across the indexed codebase, SCIP indexers exist for all major languages and produce compact, fast-to-process output. This is strictly better than LSIF.

7. **Separate indexing from serving.** Follow the universal two-tier pattern: an indexer that writes to a shared store (shard files or database), and a query service that reads from that store. This allows independent scaling and zero-downtime updates. Zoekt's filesystem-based communication is the simplest proven model.

8. **Consider binary quantization for large codebases.** If Wazir users work in 10M+ LOC monorepos, Augment's binary quantization approach (1 bit per embedding dimension) reduces memory 8x while maintaining 99.9% retrieval accuracy. Only fall back to full precision for edge cases.

9. **BM25F for ranking, not just boolean matching.** When returning search results, weight matches on symbol definitions higher than matches in comments or string literals. Zoekt's BM25F approach (weighted fields: filename > symbols > content) produces significantly better result ordering than naive text ranking.

10. **Per-developer, branch-aware indexing for real-time use.** Augment's insight is critical: developers switch branches frequently, and stale indexes cause hallucinations. If Wazir provides context to AI agents, the index must reflect the developer's current working tree, not just the main branch. Update within seconds of file saves, not on 10-minute polling cycles.
