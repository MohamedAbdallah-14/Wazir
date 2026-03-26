# Codebase Indexing -- Deep Dive Research

Research date: 2026-03-25

---

## Source 1: The Technology Behind GitHub's New Code Search (GitHub Blog)

URL: https://github.blog/engineering/architecture-optimization/the-technology-behind-githubs-new-code-search/

- GitHub built a custom code search engine from scratch in Rust called **Blackbird**, because no off-the-shelf solution fit their scale requirements.
- The system indexes **45 million repositories**, totaling **115 TB of source code** and **15.5 billion documents**.
- Blackbird achieves approximately **640 queries per second**, compared to ~0.01 qps for ripgrep, thanks to precomputed search indices.
- **Indexing throughput** is roughly 120,000 documents per second.
- The infrastructure comprises **5,184 vCPUs, 40 TB of RAM, and 1.25 PB of backing storage**.
- Uses **ngram indexes** (not just trigrams) for content, symbols, and paths. Regular trigrams were found to not be selective enough for a corpus containing many three-letter keywords like `for`.
- **Sharding strategy**: Index is sharded by **Git blob SHA** (content-addressable hashing), enabling horizontal scaling for reads (QPS), storage (disk), and indexing time (CPU/memory).
- **Delta encoding**: A minimum spanning tree of a repository similarity graph provides an ingest order where delta encoding reduces the number of documents to crawl by over 50%. Full re-indexing of the entire corpus takes approximately 18 hours.
- **Compression results**: 115 TB of content is compressed to ~28 TB of unique content via deduplication, and the total index (including all ngram indices plus a compressed copy of all unique content) is only 25 TB.
- **Query processing pipeline**: Front end accepts user query, passes to Blackbird query service, parses into AST, rewrites query (resolving languages to canonical Linguist IDs, adding permission/scope clauses), then routes to index shards.
- Indices are too large for in-memory storage, so Blackbird uses **streaming iterators** that access index elements sequentially without loading entire indices into memory.
- Uses **Kafka** to decouple crawling and indexing modules.
- Supports substring queries, regular expressions, symbol search, and puts the most relevant results first with code-aware ranking.

---

## Source 2: Regular Expression Matching with a Trigram Index (Russ Cox, swtch.com)

URL: https://swtch.com/~rsc/regexp/regexp4.html

- This is the **foundational reference** for trigram-based code search, explaining how Google Code Search worked before its shutdown in 2013.
- A **trigram** is any substring of length 3. An inverted index maps each trigram to a list of document IDs containing that trigram.
- **Why trigrams**: 2-grams (bigrams) produce too few distinct keys with massive posting lists; 4-grams produce too many distinct keys with tiny posting lists. Trigrams are the practical sweet spot.
- **Indexing**: Extract every overlapping 3-character sequence from each document. Use these as tokens in the inverted index.
- **Query processing**: Extract trigrams from the search substring, fetch and intersect document ID lists for all trigrams, then verify candidates against the full query string.
- **Regex support**: Regular expressions are decomposed into a set of required trigrams. All relevant posting lists are loaded from the inverted index, producing a candidate document set. The final result is obtained by running the full regex against only these candidates -- always faster than scanning the entire codebase.
- Russ Cox open-sourced a basic Go implementation at `github.com/google/codesearch`, which became the foundation for Zoekt, Hound, and many other code search tools.
- The technique is now used in databases (PostgreSQL's `pg_trgm` extension), search engines (Elasticsearch), and every major code search platform.

---

## Source 3: Zoekt -- Fast Trigram Based Code Search (Sourcegraph/GitHub)

URL: https://github.com/sourcegraph/zoekt

- Zoekt is a **Go-based trigram code search engine** created by Han-Wen Nienhuys at Google, now maintained by Sourcegraph.
- **Index structure**: Breaks text into trigrams (including spaces, without delineating word boundaries). Stores a map from trigram to the byte offset of each occurrence as sorted B+ trees.
- **Search optimization**: For a query like "world" (trigrams: "wor", "orl", "rld"), Zoekt only checks the trigrams at the beginning and end ("wor" and "rld"), verifying their positions are the correct distance apart -- avoids checking all intermediate trigrams.
- **Regex decomposition**: The query parser extracts literal substrings from regular expressions. For example, `(Path|PathFragment).*=/usr/local` is decomposed to search for trigrams in "Path", "PathFragment", and "/usr/local".
- **Memory efficiency**: Posting lists for trigrams can be stored on SSD, so searching with positional trigrams requires only **1.2x corpus size of RAM**.
- **Index size**: Approximately **3.5x the corpus size** (uncompressed).
- Achieves **sub-50ms search times** on large codebases like Android (~2 GB of text).
- Sourcegraph uses Zoekt to index the default branch of every repository for fast search. Non-indexed branches use a separate fast-path search.
- Design document available at `zoekt/doc/design.md` with full technical specifications.

---

## Source 4: A 5x Reduction in RAM Usage with Zoekt Memory Optimizations (Sourcegraph Blog)

URL: https://sourcegraph.com/blog/zoekt-memory-optimizations-for-sourcegraph-cloud

- When scaling Sourcegraph Cloud to **1 million open source repositories**, Zoekt's memory consumption became a bottleneck.
- Achieved a **5x reduction** in per-repository RAM usage: from **1,400 KB per repo to 310 KB** with no measurable latency changes.
- Optimizations focused on reducing the in-memory footprint of index metadata and posting list structures.
- This demonstrates that trigram-based search can scale to massive multi-repository deployments with careful engineering of the memory layout.

---

## Source 5: Code Search at Google: The Story of Han-Wen and Zoekt (Sourcegraph Blog)

URL: https://sourcegraph.com/blog/zoekt-creating-internal-tools-at-google

- Han-Wen Nienhuys created Zoekt as a byproduct of his experience developing internal tooling at Google, starting in 2006.
- The first version was implemented in **a week or two**, demonstrating that a basic trigram search engine is achievable as a solo project.
- Early adopters included Google's **Bazel and Gerrit teams** and a Swedish security camera company.
- Sourcegraph accepted maintainership of Zoekt in late 2021.
- Every Sourcegraph instance has a Zoekt instance inside it -- it is the primary search backend for all indexed search.

---

## Source 6: OpenGrok -- Source Code Search and Cross Reference Engine (Oracle)

URL: https://github.com/oracle/opengrok

- OpenGrok is an open-source code search and cross-reference engine written in Java, backed by **Apache Lucene** for indexing.
- **Architecture**: Two components -- the indexer (`org.opengrok.index`) builds/updates the Lucene index recursively through the directory tree; the search component (`org.opengrok.search`) provides search and context matching.
- **Analyzer system**: `AnalyzerGuru` determines which analyzer to use based on file extensions and magic numbers. Custom analyzers for each file type produce token streams for Lucene's inverted index.
- **Ctags integration**: Source files are passed through **ctags** to generate cross-references and symbol data, which is stored alongside the Lucene index along with version history.
- **Lucene inverted index**: Standard word-to-document-set mapping, augmented with code-specific tokenization that preserves punctuation and case sensitivity.
- Supports incremental updates -- only re-indexes changed files.
- Designed for **single-organization scale** (not multi-tenant/multi-million-repo like GitHub or Sourcegraph).
- Provides a web interface for browsing, searching, and cross-referencing code with syntax highlighting.

---

## Source 7: Exploring Zoekt -- How Zoekt Works (Thomas Tay's Blog)

URL: https://thomastay.dev/blog/how-zoekt-works/

- Detailed technical walkthrough of Zoekt's trigram search methodology.
- Explains that Zoekt breaks files into trigrams **including spaces** (no word boundary delineation at index time). The word "world" becomes trigrams "wor", "orl", "rld".
- Once a document has been matched via trigram lookup, the document is retrieved and verified against the entire substring. This is a quick check since the **start and end index in the document are already known** from the positional trigram data.
- Describes Zoekt as "highly underrated" technology that provides full-text substring and regex search capabilities.
- The blog provides worked examples showing how trigram intersection narrows candidates before full verification.

---

## Source 8: Fast Regex Search: Indexing Text for Agent Tools (Cursor Blog)

URL: https://cursor.com/blog/fast-regex-search

- Cursor analyzed code search needs specifically for **AI coding agents**, where the primary operation is grep-like text lookup.
- **Problem with ripgrep**: No matter how fast ripgrep matches file contents, it must scan **all files** -- there is no way to skip files that cannot match. This is O(corpus) per query.
- **Historical foundation**: The idea of indexing textual data for speeding up regex matches was first published in 1993 by **Zobel, Moffat, and Sacks-Davis** ("Searching Large Lexicons for Partially Specified Terms using Compressed Inverted Files").
- **Local indexing is critical**: Server-side indexing would require synchronizing all files or expensive round-trips. Client-side indexing is trivial, avoids security/privacy concerns, and enables instant updates.
- **Hybrid approach**: Cursor combines trigram/regex indexing with semantic (embedding-based) search. There are queries that only regex can resolve, and queries where semantic search excels. The combination produces the best agent performance.
- Cursor's approach validates that **code search indexing is not just a developer UX feature** -- it is a critical infrastructure component for AI agent tool performance.

---

## Source 9: Code Search: A Survey of Techniques for Finding Code (Di Grazia & Pradel, ACM Computing Surveys, 2022)

URL: https://arxiv.org/abs/2204.02765

- Comprehensive **30-year survey** of code search research, published in ACM Computing Surveys.
- **Query taxonomy**: Distinguishes between informal queries (natural language descriptions), formal queries (code snippets, type signatures, API calls), and hybrid combinations.
- **Indexing techniques surveyed**: Inverted indexes (keyword and n-gram), AST-based structural indexes, program dependence graphs, type-based indexes, and neural embedding indexes.
- **Retrieval approaches**: Boolean matching, TF-IDF, BM25, learning-to-rank, and neural ranking models.
- **Key finding**: Code search is fundamentally different from text search because code requires exact punctuation matching, no stemming, no stop-word removal, and structure-aware ranking. General text search engines perform poorly.
- **Preprocessing techniques**: Query expansion (adding synonyms, related API names), query reformulation (rewriting natural language to structured queries), and relevance feedback.
- **Ranking challenges**: Code search must balance textual similarity with structural relevance (a function definition should rank higher than a comment mentioning the same term).
- Identifies open problems: cross-language search, search over program behavior (not just syntax), and evaluation benchmarks.

---

## Source 10: Survey of Code Search Based on Deep Learning (ACM TOSEM, 2023)

URL: https://arxiv.org/abs/2305.05959

- Surveys **deep learning-based code search** as the leading paradigm for semantic code retrieval.
- **Architecture pattern**: Dual-encoder models that map natural language queries and code snippets to a shared vector space, then measure cosine similarity.
- **Code representation methods**: Token sequences, abstract syntax trees (ASTs), control flow graphs (CFGs), data flow graphs (DFGs), and combinations thereof.
- **Key models**: CodeBERT, GraphCodeBERT, UniXcoder, CodeT5 -- all pre-trained Transformer models adapted for code understanding.
- **Multi-view inputs**: Combining multiple code representations (e.g., tokens + AST + data flow) significantly improves retrieval accuracy over single-view approaches.
- **Three-phase taxonomy**: (1) semantic modeling of the query, (2) semantic modeling of code, (3) semantic matching between query and code representations.
- Pre-trained Transformer models have become the dominant approach, replacing earlier CNN and RNN-based methods.

---

## Source 11: Livegrep -- Interactive Regex Code Search with Suffix Arrays

URL: https://github.com/livegrep/livegrep

- Livegrep is a **suffix-array-based code search engine** inspired by Google Code Search, designed for interactive regex search of ~gigabyte-scale repositories.
- **Architecture**: Two components -- `codesearch` (C++ backend that indexes and searches, with pthreads) and `livegrep` (Go web server serving the UI and proxying API requests via GRPC).
- Uses **Russ Cox's RE2** regular expression library for matching.
- **Suffix array index**: Indexes all substrings within the corpus. Binary search finds any substring in O(m log n) time. No false positives for literal searches.
- **Storage options**: Default is in-memory index; can also serialize to disk for indexes too large for RAM or for reuse across restarts.
- **Trade-off vs. trigrams**: Suffix arrays are more precise (zero false positives for literals) but use 4-8 bytes per character of source. Trigram indexes are more space-efficient and scale better to very large corpora. Suffix arrays are optimal for single-machine, moderate-size deployments.
- Communication between frontend and backend is via **GRPC** protocol.
- The `codesearch` component is stateless after index construction -- the `livegrep` web server is also stateless.

---

## Source 12: Building a Custom Code Search Index in Go for searchcode.com (Ben Boyter)

URL: https://boyter.org/posts/how-i-built-my-own-index-for-searchcode/

- Ben Boyter built a custom code search index for searchcode.com using **bloom filters** sharded by unique document trigrams.
- Indexes **180-200 million documents** and **75 billion lines of code**.
- **Bloom filter approach**: With 1,320 trigrams and a 1% false positive rate, each document requires 12,653 bits (~1.5 KB) stored in a fixed 2,048-bit bloom filter.
- **How it works**: Extract trigrams from each document, set corresponding bits in a per-document bloom filter. At query time, extract query trigrams, check bloom filters to identify candidate documents, then verify candidates with full matching.
- Documents are **truncated** to prevent overfilling bloom filters -- only the head of large files is indexed.
- **Performance**: Reduced search times from many seconds to **~40 ms** across the entire searchcode corpus.
- Based on the **BitFunnel paper** (SIGIR 2017), which described how Bing uses bit signatures/bloom filters for its fresh index.
- Replaced a multi-machine deployment with a single **16-core, 128 GB RAM** machine.
- False positives are inherent to bloom filters and must be removed via post-verification.

---

## Source 13: Indexing Code at Scale with Glean (Meta Engineering Blog)

URL: https://engineering.fb.com/2024/12/19/developer-tools/glean-open-source-code-indexing/

- **Glean** is Meta's open-source system for collecting, deriving, and querying **facts** about source code at massive scale.
- **Schema-driven architecture**: A schema defines the types of facts stored. Each fact represents a node in a data graph (e.g., "function X is defined at file Y, line Z" or "class A extends class B").
- **Storage backend**: Facts are stored in databases backed by **RocksDB**, with an efficient binary representation.
- **Language-specific indexers**: Transform source code into ASTs, then emit facts according to language-specific schemas. Supports multiple languages including C++, Hack, Python, Haskell, and more.
- **Incremental indexing**: Critical innovation for monorepo scale -- indexes only diffs/changesets rather than the entire repository. A "diff sketch" is a machine-readable summary listing all changes (new class, removed method, added field, new function call, etc.).
- **Derived predicates**: Glean can compute new facts from existing facts using its **Angle** query language, enabling transitive analyses (e.g., "all callers of callers of function X").
- Used internally at Meta for code browsing, documentation generation, code analysis, and AI-assisted development.
- Open-sourced at `github.com/facebookincubator/Glean`.

---

## Source 14: Tree-sitter -- Incremental Parsing for Code Intelligence

URL: https://github.com/tree-sitter/tree-sitter

- Tree-sitter is a **parser generator and incremental parsing library** that builds concrete syntax trees (CSTs) for source code.
- **Incremental parsing**: When code is edited, only the affected subtree is re-parsed. The new tree shares unchanged portions with the old tree, making updates fast and memory-efficient. Cost is O(edit_size), not O(file_size).
- **Error recovery**: Produces valid parse trees even for syntactically incomplete or erroneous code, identifying error boundaries and continuing parsing.
- **Language support**: 40+ language grammars available, each defined as a JavaScript grammar specification compiled to C.
- **S-expression queries**: Pattern-matching language for extracting specific AST nodes (functions, classes, variables, imports) with precise structural matching.
- **Performance**: Parses most files in <1 ms. 36x faster than JavaParser for Java files.
- **Code intelligence applications**: Syntax highlighting, code folding, symbol extraction, scope analysis, code navigation (find definition, find references within file).
- **Complementary to LSP**: Tree-sitter provides fast, local, structural understanding. LSP provides cross-file semantic understanding (go-to-definition across modules, type checking). Many language servers use tree-sitter internally.
- Used by Neovim, Helix, VS Code, Zoekt, Sourcegraph, Cursor, CocoIndex, and many other tools.

---

## Source 15: Universal Ctags -- Symbol Extraction Across 50+ Languages

URL: https://github.com/universal-ctags/ctags

- Universal Ctags (u-ctags) is a maintained fork of Exuberant Ctags that generates **tag files** mapping symbol names to their definition locations.
- **Supports 50+ programming languages** with extensible parser architecture.
- **Definition and reference tags**: Unlike Exuberant Ctags (definitions only), Universal Ctags also tags **references** -- places where named language objects are used, not just where they are defined.
- **Output format**: Structured entries containing name, file, line number, kind (function/class/variable/etc.), scope, and signature.
- **Fast single-pass parsing**: Suitable for CI/CD pipelines and batch indexing.
- Used by Zoekt (for long-tail language coverage where tree-sitter grammars are not available), OpenGrok (core symbol extraction), Vim, Emacs, and many editors.
- Cross-reference output mode produces human-readable information about all language objects found in source files.

---

## Source 16: How Cursor Actually Indexes Your Codebase (Towards Data Science)

URL: https://towardsdatascience.com/how-cursor-actually-indexes-your-codebase/

- Cursor uses a **RAG (Retrieval-Augmented Generation)** pipeline for codebase-aware AI assistance.
- **Chunking**: When a file changes, Cursor splits it into **syntactic chunks** (using AST-aware boundaries, not arbitrary line splits), which are converted into embeddings.
- **Embedding storage**: Chunk embeddings with metadata are stored in **Turbopuffer**, a vector database optimized for fast semantic search across millions of code chunks.
- **Privacy model**: Only embeddings and metadata are stored in the cloud. Original source code **never** leaves the local machine and is never stored on Cursor servers or in Turbopuffer.
- **File path obfuscation**: File paths are masked on the client side using a secret key and fixed nonce before transmission.
- **Search process**: Query text is embedded, compared against code embeddings in the vector database, and the most semantically similar chunks are returned in ranked order by similarity score.
- The codebase index acts as the retrieval mechanism for Cursor's `@Codebase` and `Cmd+Enter` features.

---

## Source 17: GitLab Exact Code Search with Zoekt

URL: https://about.gitlab.com/blog/exact-code-search-find-code-faster-across-repositories/

- GitLab adopted **Zoekt** for exact code search, complementing their existing Elasticsearch/OpenSearch for non-code search (issues, merge requests, comments, wikis).
- **Rationale**: Elasticsearch is excellent for natural language content but was not designed for code. Code search requires exact substring matching, regex support, and punctuation sensitivity.
- **Self-registering node architecture** (inspired by GitLab Runner): Automatic shard assignment and load balancing across Zoekt nodes with bidirectional API communication.
- **Independent replication**: Each Zoekt node independently indexes from Gitaly (GitLab's Git storage), eliminating complex cross-node synchronization.
- **Unified binary**: Single `gitlab-zoekt` binary operates in both indexer and webserver modes.
- **Scale on GitLab.com**: Indexes and searches over **48 TB of code data** across millions of repositories and thousands of namespaces, with millisecond response times.
- Demonstrates that Zoekt's architecture can be embedded into existing platforms as a specialized code search backend.

---

## Source 18: Trigrep -- Indexed Regex Search for Large Codebases (PythonicNinja)

URL: https://github.com/PythonicNinja/trigrep

- Open-source CLI tool implementing **trigram/sparse n-gram indexes** for grep-like regex search on large codebases.
- **Index construction**: Walks the repo (respecting `.gitignore`), extracts every overlapping 3-byte trigram from each text file, writes an inverted index to `.trigrep/` on disk.
- **Search process**: Regex is parsed and decomposed into literal fragments, which are converted to trigrams and looked up via **binary search in the mmap'd index**.
- **Performance benchmark on git.git**: trigrep mean query time 0.0405s vs ripgrep 0.0640s vs grep 0.5990s -- trigrep is fastest for indexed search.
- Search latency stays **almost flat** as the monorepo grows, unlike ripgrep which scales linearly with corpus size.
- Designed to be useful for **AI coding agents** and developers who search frequently in large trees.
- Supports regex patterns, case-insensitive search, whole-word matching, and JSON output format.

---

## Source 19: Semantic Code Indexing with AST and Tree-sitter for AI Agents (Medium)

URL: https://medium.com/@email2dineshkuppan/semantic-code-indexing-with-ast-and-tree-sitter-for-ai-agents-part-1-of-3-eb5237ba687a

- Describes a pipeline for **semantic code indexing** targeting AI agent use cases.
- **AST-based chunking**: Code is parsed using tree-sitter to extract semantic chunks (functions, classes, docstrings) rather than splitting at arbitrary line boundaries.
- **Embedding generation**: Chunks are embedded using code-specific models. Optionally, an LLM generates summary comments for each chunk to improve embedding quality.
- **Why ASTs matter for embeddings**: ASTs provide a clean, semantic view of code that is ideal for creating meaningful chunks. Arbitrary text splitting breaks semantic units and degrades retrieval quality.
- **Pipeline stages**: Parse -> Chunk -> Summarize (optional) -> Embed -> Store in vector DB -> Retrieve via similarity search.
- Validates that tree-sitter is the preferred tool for producing semantically coherent code chunks for RAG pipelines.

---

## Source 20: Codebase Indexing & Semantic Search Research (tuandinh GitHub Gist)

URL: https://gist.github.com/tuandinh0801/056bebc4912f5789804119e9e9247cd5

- Comprehensive research gist covering the **full landscape** of codebase indexing and semantic search approaches.
- **Chunking strategy**: The goal is to break code into meaningful, semantically coherent units (functions, classes, logical code blocks) rather than arbitrary splits. Semantic chunking leads to more accurate retrieval.
- **Embedding models for code**: Transformer-based models (CodeBERT, StarCoder, etc.) trained on source code produce vector representations capturing semantic meaning.
- **Vector storage options**: Turbopuffer (Cursor's choice), Qdrant, PGVector/Postgres, Pinecone, Weaviate -- each with different trade-offs for latency, scale, and hosting model.
- **Hybrid search**: Combining keyword/trigram search with vector similarity search produces better results than either alone. Keyword search catches exact matches that semantic search might miss; semantic search catches conceptual matches that keyword search cannot find.
- **Local-first approach**: A companion gist explores local-first indexing solutions, where the index lives entirely on the developer's machine -- important for privacy and latency.

---

## Synthesis

### Core Indexing Techniques -- Comparison

| Technique | Data Structure | Query Type | False Positives | Space | Best For |
|-----------|---------------|------------|-----------------|-------|----------|
| **Trigram (n-gram)** | Inverted index (trigram -> doc/pos) | Substring, regex | Yes (requires post-verification) | 0.2-3.5x corpus | Large-scale multi-repo search |
| **Suffix Array** | Sorted suffix offsets | Substring, regex | No (for literals) | 4-8 bytes/char + corpus | Single-machine, moderate corpora |
| **Bloom Filter** | Per-document bit arrays | Substring | Yes (inherent to bloom) | ~1.5 KB/doc | Very large doc counts, simple queries |
| **Lucene Inverted Index** | Term -> doc mapping | Keyword, tokenized | No (but no substring) | ~0.3x corpus | Natural language + code hybrid |
| **Vector Embedding** | High-dimensional vectors | Semantic similarity | N/A (ranked, not boolean) | Varies (8x reduction w/ quantization) | "What does this code do?" queries |
| **AST / Tree-sitter** | Concrete syntax tree | Structural, symbol-based | No | In-memory, ephemeral | Symbol extraction, code navigation |
| **Ctags** | Tag file (name -> location) | Symbol lookup | No | Small (~1% of corpus) | Quick symbol definition lookup |

### Architecture Patterns Observed Across All Systems

1. **Two-tier separation**: Every production system separates indexing from serving. The indexer writes to shared storage (shard files, databases, vector stores); the query service reads from that storage. This enables independent scaling and zero-downtime index updates.

2. **Content-addressable deduplication**: GitHub (Git blob SHA), Sourcegraph (content hashing), and Meta (Glean fact deduplication) all avoid re-indexing identical content. This is essential at scale where repository forking and vendored dependencies create massive duplication.

3. **Incremental updates over full re-indexing**: Every system tracks what changed and re-indexes only the delta. Techniques include Git diff tracking (GitLab/Zoekt), Merkle tree comparison (Cursor), diff sketches (Meta Glean), and Kafka-based change streams (GitHub Blackbird).

4. **Hybrid search is the emerging standard**: The combination of structural/keyword search (trigrams, suffix arrays) with semantic/vector search (embeddings) consistently outperforms either approach alone. Cursor, Augment Code, and the academic literature all converge on this finding.

5. **Code search requires custom engines**: Every major platform (GitHub, Google, Sourcegraph, Meta) built custom search engines because general-purpose text search (Elasticsearch, Solr) fails at code-specific requirements: exact punctuation, no stemming, substring matching, regex support, and structure-aware ranking.

### Scale Reference Points

| System | Corpus Size | Index Size | Query Latency | Throughput |
|--------|-------------|------------|---------------|------------|
| GitHub Blackbird | 115 TB (45M repos) | 25 TB | Not published | 640 qps |
| Sourcegraph/Zoekt | Billions of LOC | ~3.5x corpus | <50 ms | Not published |
| GitLab/Zoekt | 48 TB | Not published | Milliseconds | Not published |
| searchcode.com | 75B LOC (200M docs) | Bloom filters | ~40 ms | Not published |
| livegrep | ~GB scale | In-memory suffix array | Interactive | Not published |
| Cursor | Per-project | Turbopuffer cloud | Not published | Not published |

### Key Takeaway for AI Agent Tool Infrastructure

Code indexing is no longer just a developer experience feature -- it is **critical infrastructure for AI coding agents**. Cursor's blog explicitly states that the primary consumer of code search tools is the AI agent itself, not the human developer. Without an index, every agent grep/search call scans the entire codebase (O(corpus)), which is unacceptable for latency and token cost. With a trigram or suffix array index, the same search becomes O(results), enabling agents to search effectively in large monorepos. Layering semantic embeddings on top enables "find code that does X" queries that pure text search cannot answer, which is essential for RAG-based context retrieval in AI-assisted development.
