# RAG for Code: Research Survey

**Date**: 2026-03-25
**Scope**: Academic papers, code-specific embedding models, vector databases, chunking strategies, open-source implementations, hybrid search, and evaluation of RAG systems applied to code tasks.

---

## Source 1: Retrieval-Augmented Code Generation: A Survey (Tao et al., CMU/CUHK/SUSTech)

**URL**: https://arxiv.org/abs/2510.04905

- Comprehensive survey of Retrieval-Augmented Code Generation (RACG) with emphasis on repository-level approaches
- Categorizes existing work along: generation strategies, retrieval modalities, model architectures, training paradigms, and evaluation protocols
- Repository-Level Code Generation (RLCG) requires reasoning across entire repositories, capturing long-range dependencies, ensuring global semantic consistency, and generating coherent code spanning multiple files
- RAG addresses RLCG by integrating external retrieval mechanisms with LLMs, enhancing context-awareness and scalability
- Retrieval modalities covered: sparse retrieval (BM25), dense retrieval (CodeBERT, UniXcoder, neural embeddings), and hybrid approaches
- Key challenge: reasoning over dependencies across multiple files, ensuring privacy for sensitive code, and effectively leveraging retrieval
- Summarizes widely used datasets and benchmarks including SWE-Bench, RepoEval, CrossCodeEval, and CodeSearchNet
- Notes that cutting-edge general models (GPT-5, Claude Opus 4.1, Gemini 2.5 Pro) compete on SWE-Bench, underscoring centrality of code generation
- Code-oriented LLMs (CodeLlama, Qwen-Coder, StarCoder) demonstrate strong code generation but benefit significantly from retrieval augmentation

---

## Source 2: CodeRAG-Bench: Can Retrieval Augment Code Generation? (Wang et al., CMU/UW/USC)

**URL**: https://arxiv.org/abs/2406.14497 | https://code-rag-bench.github.io/

- First comprehensive evaluation benchmark for retrieval-augmented code generation
- Encompasses three categories: basic programming, open-domain, and repository-level problems
- Aggregates documents from five retrieval sources: competition solutions, online tutorials, library documentation, StackOverflow posts, and GitHub repositories
- Key finding: notable gains in code generation by retrieving high-quality contexts across various settings
- Current retrievers still struggle to fetch useful contexts especially with limited lexical overlap between queries and code
- Generators fail to improve when context lengths are limited or when models lack ability to integrate additional contexts
- Reveals that combining multiple retrieval sources improves results more than any single source
- Establishes that RAG helps most for open-domain and repository-level tasks where parametric knowledge alone is insufficient
- Serves as a standardized testbed for comparing code-oriented RAG methods

---

## Source 3: A Deep Dive into RAG for Code Completion: Experience on WeChat (Yang et al., Tencent/CUHK)

**URL**: https://arxiv.org/abs/2507.18515

- Industrial-scale study of RAG for code completion on WeChat's proprietary codebase (one of the largest proprietary software systems)
- Constructed evaluation benchmark: 100 examples across seven domains, 1,669 internal WeChat repositories as retrieval corpus
- Compared two RAG paradigms: identifier-based RAG (retrieves definitions of identifiers) vs. similarity-based RAG (retrieves similar implementations)
- Tested across 26 open-source LLMs ranging from 0.5B to 671B parameters
- **Key findings**:
  - Both RAG methods effective in closed-source repos; similarity-based RAG shows superior performance
  - BM25 (lexical) and GTE-Qwen (semantic) achieve best retrieval performance individually
  - Combination of lexical + semantic retrieval yields optimal results, demonstrating complementary strengths
  - Validates that hybrid retrieval is critical for production code RAG
- Production stack: BM25S for lexical retrieval, Qdrant vector database for semantic retrieval, vLLM for LLM serving in Docker containers
- Developer survey confirmed practical utility of RAG methods in real-world development

---

## Source 4: An Empirical Study of Retrieval-Augmented Code Generation (Yang et al., HIT/Concordia/Zhejiang/Huawei)

**URL**: https://arxiv.org/abs/2501.13742

- Systematic study of retrieval-augmented frameworks for code generation using CodeGen, UniXcoder, and CodeT5
- Assessed impact of retrieved code quality and utilization strategies on generation
- **Key recommendations**:
  - BM25 and Sequential Integration Fusion are recommended due to convenience and superior performance
  - Sketch Filling Fusion (extracting a sketch of relevant code) helps models improve further
  - Retrieval-augmented framework is universally beneficial for improving pre-trained model performance
- Investigated trade-off between performance improvement and computational costs at each pipeline phase
- Demonstrated effectiveness even on large language models, not just smaller pre-trained models
- Fusion strategies matter: how retrieved code is integrated into the prompt significantly affects generation quality

---

## Source 5: cAST: Enhancing Code RAG with Structural Chunking via AST (Zhang et al., CMU/Augment Code)

**URL**: https://arxiv.org/abs/2506.15655 | https://github.com/yilinjz/astchunk

- Published in Findings of EMNLP 2025
- Proposes chunking via Abstract Syntax Trees (cAST) for code RAG pipelines
- **Four design goals**: (1) syntactic integrity -- chunk boundaries align with complete syntactic units; (2) high information density -- chunks packed up to fixed size budget; (3) language invariance -- no language-specific heuristics; (4) plug-and-play compatibility -- concatenating chunks reproduces original file verbatim
- **Algorithm**: Parse source code into AST, starting from first level greedily merge AST nodes into chunks; if a node exceeds chunk size limit, recursively break into smaller nodes
- **Results**: Boosts Recall@5 by 4.3 points on RepoEval retrieval, Pass@1 by 2.67 points on SWE-bench generation
- Generates self-contained, semantically coherent units across programming languages
- Provides ASTChunk Python toolkit (open-source on GitHub)
- Demonstrates that structure-aware chunking is strictly superior to line-based or fixed-size chunking for code
- Critical insight: existing line-based chunking heuristics often break semantic structures, splitting functions or merging unrelated code, degrading generation quality

---

## Source 6: Supermemory code-chunk: Production AST-Aware Code Chunking

**URL**: https://supermemory.ai/blog/building-code-chunk-ast-aware-code-chunking/

- Production implementation of cAST paper concepts with enhancements for real-world use
- Built on tree-sitter for AST parsing (battle-tested, powers syntax highlighting in Neovim, Helix, Zed)
- **Problem with text splitters**: splitting code at character boundaries produces useless fragments (e.g., cutting a function mid-variable name), ruining embedding quality
- **Three-step process**: (1) Parse with tree-sitter to get structured AST; (2) Extract entities at function/class/method level rather than arbitrary nodes; (3) Smart merging to combine small entities respecting size limits
- Key divergence from academic cAST: focuses on entity-level extraction (functions, classes, methods) rather than pure AST node manipulation
- Supports basically every language through tree-sitter grammars
- Available as open-source npm package: `code-chunk`
- Practical insight: production code chunking needs to handle edge cases (huge single functions, deeply nested code, mixed content like docstrings) that academic implementations skip

---

## Source 7: voyage-code-3: Code Retrieval Embeddings (Voyage AI)

**URL**: https://blog.voyageai.com/2024/12/04/voyage-code-3/

- Next-generation embedding model optimized specifically for code retrieval
- **Performance**: Outperforms OpenAI-v3-large by 13.80% and CodeSage-large by 16.81% on average across 32 code retrieval datasets
- Supports flexible dimensions: 2048, 1024, 512, 256 via Matryoshka learning
- Multiple quantization options: float32, int8, uint8, binary, ubinary -- dramatically reduces storage/search costs
- 32K-token context length (vs. OpenAI 8K, CodeSage 1K)
- **Training data**: Trillions of tokens with carefully tuned code-to-text ratio; contrastive learning pairs from GitHub repos spanning 300+ programming languages; real-world query-code pairs
- Binary rescoring (retrieve with binary, rescore with full precision) yields up to 4.25% improvement
- At 1024 dimensions, outperforms OpenAI-v3-large at 3072 dimensions (1/3 storage cost) by 13.80%
- **Benchmark categories**: text-to-code, code-to-code, docstring-to-code retrieval

| Dimensions | voyage-code-3 | OpenAI v3 large | CodeSage large |
|-----------|--------------|----------------|---------------|
| 2048      | 92.12%       | -              | -             |
| 1024      | 92.28%       | 77.64%         | -             |
| 512       | 92.00%       | -              | -             |
| 256       | 91.34%       | 73.68%         | 67.64%        |

---

## Source 8: 6 Best Code Embedding Models Compared (Modal)

**URL**: https://modal.com/blog/6-best-code-embedding-models-compared

- Comprehensive comparison of six code embedding models for RAG and code search

### Models Compared:

1. **VoyageCode3** -- 32K context, flexible dimensions (256-2048), quantization support, trained on 300+ languages. Best overall performance but API-only.
2. **OpenAI text-embedding-3-large** -- 8191 tokens, 3072 dimensions, strong on both text and code. API-only.
3. **Jina Code V2** -- 8192 tokens, 768 dimensions, excels at code similarity tasks. Open weights available.
4. **Nomic Embed Code** -- 8192 tokens, 768 dimensions, Matryoshka support, open weights (Apache 2.0).
5. **CodeSage Large V2** -- 2048 tokens, 1.3B parameters, Apache 2.0, two-stage training (MLM + contrastive), trained on The Stack V2. Open weights.
6. **CodeRankEmbed** -- 8192 tokens, 137M parameters, MIT license, state-of-the-art code retrieval via contrastive learning. Open weights.

### Key Use Cases:
- Semantic code search across large codebases
- Code completion enhancement with semantic understanding
- Repository analysis (duplicate detection, dependency analysis)
- Docstring-to-code and text-to-code retrieval

### Deployment Recommendations:
- Start with Sentence Transformers for ease of use
- Graduate to Text Embeddings Inference (Hugging Face, Rust-based) for production throughput
- CodeSearchNet and MTEB leaderboard provide standardized benchmarks

---

## Source 9: How Sourcegraph Cody Understands Your Codebase (Sourcegraph)

**URL**: https://sourcegraph.com/blog/how-cody-understands-your-codebase

- Production code RAG system powering Sourcegraph Cody (AI coding assistant)
- **RAG over fine-tuning for code**: RAG is preferred because code changes constantly; fine-tuning captures a point-in-time snapshot. RAG retrieves fresh content at invocation time.
- **Multi-layered context retrieval**:
  - Local file context from immediate editor
  - Local repository context from current codebase
  - Remote repository context via Sourcegraph search
- **Embedding evolution**: Initially used OpenAI text-embedding-ada-002 for vector-based retrieval. Later moved away from embeddings for enterprise due to:
  - Privacy concerns: code sent to third-party (OpenAI) for embedding
  - Operational complexity: creating, maintaining, updating embeddings
  - Scalability issues: embedding storage grows linearly with codebase size
- **Replaced embeddings with**: Sourcegraph's native code search platform (keyword search + code graph via SCIP), zero additional config, scales to massive codebases
- **Hybrid search**: Keywords + vector embeddings for scanning indexed repositories
- **Code graph (SCIP)**: Structural Code Intelligence Platform provides precise go-to-definition, find-references, and other code navigation signals
- **Key lesson**: Embeddings work for retrieval but have significant operational overhead at enterprise scale. Native code search + code intelligence can substitute or complement embeddings.
- Future direction: expanding context to wikis, docs, engineering tickets beyond just code

---

## Source 10: How Cursor Actually Indexes Your Codebase (Towards Data Science / Engineer's Codex)

**URL**: https://towardsdatascience.com/how-cursor-actually-indexes-your-codebase/

- Deep analysis of Cursor's RAG pipeline for codebase indexing
- **Step 1 -- Chunking**: Uses tree-sitter to parse code into AST, chunks at logical boundaries (functions, classes). Chunks are ~hundreds of tokens each. Traverses AST depth-first, splits into sub-trees within token limits, merges sibling nodes to avoid tiny chunks.
- **Step 2 -- Embedding**: Uses OpenAI embedding models or custom embedding model. Each chunk gets a vector + metadata (file path, line numbers).
- **Step 3 -- Obfuscation**: File path masking applied client-side before transmission for privacy. Source code never leaves local machine.
- **Step 4 -- Storage**: Embeddings stored in Turbopuffer (serverless vector + full-text search engine backed by object storage). Embeddings cached in AWS keyed by chunk hash for re-indexing efficiency.
- **Step 5 -- Semantic Search**: Query embedded with same model, compared against stored embeddings. Returns ranked metadata (masked file paths + line ranges). Local client retrieves actual code from local filesystem.
- **Hybrid approach**: Semantic search + regex/grep pattern matching for exact string matches
- **Index synchronization**: Periodic checks (~5 minutes), only refreshes affected files
- **Privacy model**: Only embeddings + metadata in cloud; source code stays local
- **Key architectural insight**: Separating embedding storage (cloud) from code storage (local) enables privacy-preserving semantic search at scale

---

## Source 11: Building RAG on Codebases Parts 1 & 2 (LanceDB / CodeQA)

**URL**: https://lancedb.com/blog/building-rag-on-codebases-part-1/ | https://lancedb.com/blog/building-rag-on-codebases-part-2/

### Part 1 -- Indexing:
- Demonstrates CodeQA tool built on LanceDB for codebase question-answering
- Supports Java, Python, Rust, JavaScript via tree-sitter
- **Naive semantic search limitations**: In-context learning fails for large codebases; fixed-size chunking loses semantic boundaries
- **Syntax-level chunking with tree-sitter**: Parse into AST, traverse to extract language constructs (functions, classes, constructors). Language-agnostic through tree-sitter grammars.
- Extracts at varying granularity: from entire class code down to single variables
- Can capture codebase-wide references with additional implementation

### Part 2 -- Retrieval Pipeline:
- **LLM-generated comments**: Adding 2-3 lines of documentation to methods bridges the natural language gap (queries are NL, code is not). Improves embedding quality for retrieval.
- **Embedding model considerations**: Code-specific models (voyage-code, Jina Code) outperform general-purpose models for code retrieval
- **HyDE (Hypothetical Document Embeddings)**: Generate a hypothetical code answer to the query, then use that as the retrieval query. Helps bridge query-code semantic gap.
- **Hybrid search**: Combine BM25 (keyword) with vector search. BM25 catches exact matches (function names, variable names); vector catches semantic similarity.
- **Re-ranking**: Two-stage pipeline -- fast bi-encoder retrieval for recall (top-20), then cross-encoder reranker for precision (top-3 to LLM). Cross-encoders score query-document pairs jointly for deeper relevance assessment.
- **Choosing rerankers**: bi-encoders are fast but less precise; cross-encoders are accurate but expensive; ColBERT offers a middle ground with late interaction.

---

## Source 12: Code-Graph-RAG: Knowledge Graphs for Codebase RAG

**URL**: https://github.com/vitali87/code-graph-rag

- Open-source tool (2.2k GitHub stars) combining AST parsing + knowledge graphs for code RAG
- Uses tree-sitter for AST parsing across 11 languages with unified graph schema
- Builds knowledge graphs in Memgraph: functions, classes, modules, imports, call relationships
- **Natural language querying**: AI translates questions into Cypher graph queries
- **MCP integration**: Runs as MCP server giving Claude Code 10 tools to query/edit codebases
- Enables structural queries impossible with pure vector search: "What functions call X?", "Show all classes that implement interface Y"
- **Graph RAG advantage**: Captures relationships and dependencies that embeddings flatten away
- Surgical code editing: AST-based function targeting with visual diff previews
- Demonstrates that combining structural (graph) with semantic (vector) retrieval captures both code relationships and code meaning

---

## Source 13: NirDiamant/RAG_Techniques Repository

**URL**: https://github.com/NirDiamant/RAG_Techniques

- Comprehensive open-source collection (26.3k stars) of advanced RAG techniques with implementations
- Covers foundational to advanced RAG patterns applicable to code:
  - Simple RAG, context-enriched chunking, multi-faceted filtering
  - Hybrid search (semantic + keyword), fusion retrieval
  - Intelligent reranking, query transformations
  - HyDE, graph-based RAG, agentic RAG
  - Multi-modal RAG, evaluation techniques
- Each technique has runnable Python scripts and Jupyter notebooks
- Includes evaluation framework for comparing RAG approaches
- Not code-specific but techniques directly transfer: hybrid search, reranking, graph RAG, and contextual retrieval are all critical for code RAG pipelines

---

## Source 14: Vector Databases for Code RAG (Multiple Sources)

**URLs**:
- https://python.plainenglish.io/pinecone-vs-chroma-vs-weaviate-a-deep-dive-on-vector-databases-for-production-rag-7ae9443ea62e
- https://digitaloneagency.com.au/best-vector-database-for-rag-in-2025-pinecone-vs-weaviate-vs-qdrant-vs-milvus-vs-chroma/
- https://liquidmetal.ai/casesAndBlogs/vector-comparison/

### Comparison for Code Search Use Cases:

| Database | Best For | Hybrid Search | Open Source | Scale |
|----------|---------|--------------|-------------|-------|
| **Pinecone** | Managed, zero-ops, enterprise | Via metadata filters | No (managed) | Billions of vectors |
| **Weaviate** | Hybrid search (best native support) | Native BM25 + vector | Yes + managed | Large scale |
| **Qdrant** | Performance, Rust-based | Yes | Yes + managed | Large scale |
| **Chroma** | Prototyping, simplicity | Limited | Yes | Small-medium |
| **Milvus/Zilliz** | High throughput, GPU-accelerated | Yes | Yes + managed | Massive scale |
| **LanceDB** | Embedded, serverless, cost-efficient | Yes | Yes | Medium-large |
| **Turbopuffer** | Serverless, object-storage backed | Vector + full-text | Managed | Large scale |

- **For code RAG specifically**: Weaviate and Qdrant stand out for native hybrid search (BM25 + vector). WeChat study used Qdrant in production. Cursor uses Turbopuffer.
- **For prototyping**: Chroma excels for rapid iteration with Python ML pipelines
- **Production consideration**: Hybrid search (keyword + semantic) is critical for code; databases with native support reduce pipeline complexity

---

## Source 15: Hybrid Search for Code Retrieval (Multiple Sources)

**URLs**:
- https://www.elastic.co/what-is/hybrid-search
- https://medium.com/etoai/hybrid-search-combining-bm25-and-semantic-search-for-better-results-with-lan-1358038fe7e6
- https://dev.to/kuldeep_paul/advanced-rag-from-naive-retrieval-to-hybrid-search-and-re-ranking-4km3

- **Why hybrid search matters for code**: Code contains both semantic meaning and precise identifiers (function names, variable names, API calls) that need exact matching
- BM25 excels at exact keyword matching (critical for code identifiers); dense vectors excel at semantic similarity (critical for finding functionally similar code with different naming)
- **Empirical improvement**: 15-30% better recall than either method alone
- **Fusion methods**: Reciprocal Rank Fusion (RRF) works well out of the box without tuning; weighted sum normalization allows fine-tuning the balance
- **Two-stage pipeline**: Fast hybrid retrieval (BM25 + vector, top-20-100 candidates), then cross-encoder reranking (top-3-5 to LLM)
- **ColBERT** as middle ground: late interaction encodes query and document separately, computes token-level similarity -- high accuracy with reasonable performance
- **Production pattern**: BM25 for identifier/API matching + vector search for semantic understanding + reranker for final precision

---

## Synthesis

### The State of Code RAG (2024-2026)

Code RAG has matured from an academic concept to a production technology powering major developer tools (Cursor, Sourcegraph Cody, GitHub Copilot, WeChat's internal tools). The research and industry evidence converges on several clear patterns:

### 1. Chunking: AST-Based is Non-Negotiable

Fixed-size or line-based chunking is demonstrably inferior for code. The cAST paper (EMNLP 2025) proved that AST-aware chunking improves both retrieval (Recall@5 +4.3 on RepoEval) and generation (Pass@1 +2.67 on SWE-bench). Production systems (Cursor, Supermemory, CodeQA) all use tree-sitter for AST parsing. The key principle: chunk boundaries must align with syntactic units (functions, classes, methods) to preserve semantic coherence.

### 2. Embedding Models: Specialized Code Models Win

Voyage-code-3 leads the field, outperforming OpenAI-v3-large by ~14% and CodeSage by ~17% on code retrieval benchmarks. Key differentiators:
- Code-specific training data (docstring-code pairs, code-code pairs across 300+ languages)
- Matryoshka learning for flexible dimensions (cost/quality tradeoff)
- Long context (32K tokens vs 1-8K for competitors)

For open-source/self-hosted: CodeRankEmbed (137M params, MIT) and CodeSage Large V2 (1.3B params, Apache 2.0) are the best options. Jina Code V2 excels at code similarity tasks specifically.

### 3. Hybrid Search is Critical

Every production system and empirical study confirms: combining lexical (BM25) and semantic (vector) retrieval outperforms either alone. The WeChat study found this combination yields optimal results. Code uniquely benefits because:
- Identifiers, API names, and exact syntax need keyword matching
- Semantic similarity catches functionally equivalent code with different naming
- 15-30% recall improvement over single-method retrieval

### 4. Reranking is the Precision Layer

The two-stage retrieve-then-rerank pattern is standard:
- Stage 1: Fast hybrid retrieval (BM25 + vector) returns 20-100 candidates
- Stage 2: Cross-encoder reranker scores each query-document pair jointly, returns top 3-5

This captures both recall (stage 1) and precision (stage 2) without the computational cost of running cross-encoders over the entire corpus.

### 5. Graph RAG Adds Structural Understanding

Pure vector search flattens code relationships. Knowledge graph approaches (Code-Graph-RAG, Sourcegraph's SCIP) capture call graphs, import chains, class hierarchies, and dependency structures that embeddings cannot represent. The combination of graph traversal (for structural queries) + vector search (for semantic queries) provides the most complete understanding.

### 6. Production Architecture Pattern

The emerging standard architecture for production code RAG:

```
Codebase -> tree-sitter AST parsing -> Semantic chunking (function/class level)
         -> Code-specific embeddings (voyage-code-3 or equivalent)
         -> Vector DB with hybrid search (Qdrant/Weaviate/Turbopuffer)
         -> BM25 index (parallel)
         -> Hybrid retrieval (BM25 + vector fusion via RRF)
         -> Cross-encoder reranking
         -> Top-K context assembly -> LLM generation
```

Privacy-preserving variant (Cursor model): embeddings in cloud, source code local-only, metadata-based resolution.

### 7. Evaluation: CodeRAG-Bench is the Standard

CodeRAG-Bench provides the most comprehensive evaluation framework with three task categories and five retrieval sources. Key metrics: Recall@K for retrieval, Pass@1 for generation, exact match, and BLEU. The benchmark reveals that RAG helps most for open-domain and repository-level tasks where parametric knowledge is insufficient.

### 8. Open Challenges

- **Context window limits**: Even with good retrieval, generators struggle with limited context or too many retrieved chunks
- **Cross-file reasoning**: Repository-level tasks requiring understanding of dependencies across many files remain hard
- **Privacy vs. quality**: Embedding code requires sending it somewhere (unless self-hosted), creating tension with enterprise security
- **Freshness**: Keeping indexes up-to-date with rapidly changing codebases adds operational complexity
- **Cost at scale**: Large codebases with millions of chunks create significant embedding, storage, and search costs -- Matryoshka and quantization help but don't eliminate the issue

### Relevance to Wazir

For a host-native engineering OS kit, code RAG could enhance:
- **Context gathering**: Before running review or generation workflows, retrieve relevant code context from the project
- **Self-audit**: Use code RAG to find related code sections that might be affected by changes
- **Skill execution**: Skills could use RAG to understand the codebase structure before making modifications
- **Review workflows**: Retrieve similar past implementations or patterns to compare against new code

The most pragmatic approach for Wazir: leverage tree-sitter chunking + a self-hosted embedding model (CodeRankEmbed for minimal resources, or voyage-code-3 API for best quality) + hybrid BM25/vector search, with an optional graph layer for structural queries. This avoids vendor lock-in while achieving production-quality retrieval.
