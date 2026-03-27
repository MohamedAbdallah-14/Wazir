# 36 — Code Chunking Strategies for LLM Processing

> Research date: 2026-03-25
> Topic: How to split code into chunks for LLM processing, RAG pipelines, and retrieval systems
> Sources: 15 high-quality sources (academic papers, engineering blogs, tool documentation, GitHub repos)

---

## Source 1: cAST: Enhancing Code RAG with Structural Chunking via AST (https://arxiv.org/abs/2506.15655)

**Authors:** Yilin Zhang, Xinran Zhao, Zora Zhiruo Wang, Chenyang Yang, Jiayi Wei, Tongshuang Wu (Carnegie Mellon University, Augment Code). Published at EMNLP 2025 Findings.

- Proposes **chunking via Abstract Syntax Trees (cAST)**, a structure-aware method that recursively breaks large AST nodes into smaller chunks and merges sibling nodes while respecting size limits
- Existing line-based chunking heuristics often break semantic structures — splitting functions or merging unrelated code — which degrades generation quality
- The algorithm works in two phases: (1) **split** — recursively break oversized AST nodes into children until each fits the size budget; (2) **merge** — combine adjacent sibling nodes that together fit the size limit into a single chunk
- Generates self-contained, semantically coherent units across programming languages and tasks
- **Benchmark results:**
  - Boosted Recall@5 by **4.3 points** on RepoEval retrieval
  - Boosted Pass@1 by **2.67 points** on SWE-bench generation
- Pursues four aligned goals: syntactic integrity, high information density, language invariance, and plug-and-play compatibility
- Key insight: fixed-size chunking breaks the structure of methods, causing the model to lose context regarding return values, parameters, and control flow — leading to incorrect code generation
- Open-source implementation: https://github.com/yilinjz/astchunk

---

## Source 2: Can LLMs Replace Humans During Code Chunking? (https://arxiv.org/abs/2506.19897)

**Authors:** Christopher Glasz et al. (The MITRE Corporation). Published June 2025.

- Examines chunking for **legacy government code** written in Assembly Language Code (ALC) and MUMPS
- Investigates three categories of partitioning strategies:
  1. **Naive chunking** — fixed-size splits without regard to code structure
  2. **Structure-based chunking** — splits at syntactic boundaries (subroutines, labels)
  3. **Expert-driven chunking** — human experts manually identify partition points
- Tested across GPT-4o, Claude 3 Sonnet, Mixtral, and Llama 3
- **Key finding:** LLMs can select partition points closely aligned with human expert partitioning
- LLM-created partitions produce comments that are up to **20% more factual** and up to **10% more useful** than when humans create partitions
- Chunking approach has **significant impact on downstream tasks** such as documentation generation
- Conclusion: LLMs can be used as suitable replacements for human partitioning of large codebases during LLM-aided modernization
- Implication for code chunking: even for unfamiliar legacy languages, structure-aware (or LLM-guided) chunking significantly outperforms naive approaches

---

## Source 3: Chroma Research — Evaluating Chunking Strategies for Retrieval (https://research.trychroma.com/evaluating-chunking)

- Proposes a **token-level evaluation methodology** for chunking — measuring what fraction of relevant answer text the retriever actually surfaces, rather than document-level relevance
- Traditional IR benchmarks (like MTEB) evaluate at the document level and cannot account for chunking effects
- Evaluates multiple strategies: fixed-size token chunking, recursive character splitting, semantic chunking, and document-based chunking
- **Key finding:** the gap between the best and worst chunking strategy on the same corpus reached **9% in recall**
- Chunks may contain both relevant and irrelevant tokens, and relevant excerpts may be split across chunks — both degrade retrieval
- LLMs are relatively insensitive to position of relevant information in the context window, but highly sensitive to whether relevant information is present at all
- Recommends evaluating chunking at the **passage/token level**, not document level, for AI application use cases
- Identifies that for any given query, only a small portion of the text corpus is likely relevant — chunking determines whether that portion is retrievable as a coherent unit

---

## Source 4: PremAI — RAG Chunking Strategies: The 2026 Benchmark Guide (https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/)

- **Top-line recommendation:** Recursive character splitting at 512 tokens with 50-100 tokens of overlap is the benchmark-validated default; scored **69% accuracy** in the largest real-document test of 2026
- Cites a Vectara study (NAACL 2025, arXiv:2410.13070) that tested 25 chunking configurations with 48 embedding models: **chunking configuration had as much or more influence on retrieval quality as the choice of embedding model**
- Four independent benchmarks synthesized (2024-2026):
  - **FloTorch/Vecta (Feb 2026):** 50 academic papers, 905K tokens — fixed-size chunking at 69% accuracy outperformed semantic chunking (54%) across document retrieval, evidence retrieval, and answer generation
  - **NVIDIA (2024):** Page-level chunking won with 0.648 accuracy and lowest variance on paginated financial documents
  - **Chroma Research:** Token-level retrieval recall, 9% gap between best and worst strategy
  - **Clinical decision support (2025):** Adaptive chunking hit 87% accuracy vs 13% for fixed-size baselines
- Two failure modes dominate: chunks too small lose context (semantic chunking averaged 43 tokens, scored only 54%); chunks too large dilute relevance ("context cliff" around 2,500 tokens)
- **Overlap finding:** A January 2026 systematic analysis using SPLADE retrieval found overlap provided **no measurable benefit** and only increased indexing cost
- Microsoft Azure recommends 512 tokens with 25% overlap (128 tokens) using BERT tokens
- Arize AI found chunk sizes of 300-500 with K=4 retrieval offer best speed-quality tradeoff
- For code or highly technical docs, **recursive and language-specific chunking** is recommended

---

## Source 5: Weaviate — Chunking Strategies to Improve LLM RAG Pipeline Performance (https://weaviate.io/blog/chunking-strategies-for-rag)

- Comprehensive taxonomy of chunking strategies:
  - **Simple:** Fixed-size (token) chunking, recursive chunking, document-based chunking
  - **Advanced:** Semantic chunking, LLM-based chunking, agentic chunking, late chunking, hierarchical chunking, adaptive chunking
- **Fixed-size chunking:** Splits text into predetermined token counts with optional overlap; fast, predictable, but ignores semantic boundaries
- **Recursive chunking:** Uses a hierarchy of separators (e.g., `\n\n`, `\n`, ` `, `""`) and recursively splits until chunks fit the size budget — recommended as the best general-purpose approach
- **Semantic chunking:** Uses text embeddings to split documents based on semantic content; compares similarity of all sentences and groups semantically similar ones together
- **Late chunking:** Solves the **anaphoric reference problem** — when chunks are embedded independently, the embedding model cannot resolve pronouns and references. Late chunking feeds the entire document into a long-context embedding model first, creates token-level embeddings with full context, then splits into chunks. Each chunk retains document-wide context
- **Agentic chunking:** Uses an LLM to determine chunk boundaries by evaluating whether each sentence belongs in the current chunk or starts a new one
- The size, content, and semantic boundaries of each chunk influence retrieval performance — getting chunking right is one of the **highest-leverage decisions** in RAG pipelines

---

## Source 6: Pinecone — Chunking Strategies for LLM Applications (https://www.pinecone.io/learn/chunking-strategies/)

- Chunking is about finding chunks big enough to contain meaningful information, while small enough to enable performant applications and low-latency responses
- **Two big reasons chunking is necessary:** (1) ensure embedding models can fit data into context windows, (2) ensure chunks contain the information necessary for search
- Exceeding embedding model context windows means excess tokens are **truncated** — potentially losing critical context
- Key factors for choosing strategy:
  - Nature of the content (long documents vs short messages vs code)
  - Embedding model and its optimal performance range
  - Expected length and complexity of user queries
  - How retrieved results will be used (semantic search, Q&A, summarization)
- For code: customize separators to respect function and class boundaries
- Recommends starting with RecursiveCharacterTextSplitter (LangChain) or SentenceSplitter (LlamaIndex) — they work for **80% of use cases**

---

## Source 7: LlamaIndex — Evaluating the Ideal Chunk Size for a RAG System (https://www.llamaindex.ai/blog/evaluating-the-ideal-chunk-size-for-a-rag-system-using-llamaindex-6207e5d3fec5)

- Empirical evaluation of chunk sizes: 128, 256, 512, 1024, 2048
- **Metrics used:** Average Faithfulness (absence of hallucinations) and Average Relevancy (response relevance to query and retrieved context)
- **Key finding:** Chunk size of **1024 tokens** strikes the optimal balance — faithfulness reaches its peak at 1024, and relevancy shows consistent improvement also peaking at 1024
- As chunk size increases, there is a minor uptick in average response time
- Small chunk sizes (128) risk excluding vital information from top retrieved chunks, especially with restrictive similarity_top_k (e.g., 2)
- Chunk size of 512 is likely to encompass all necessary information within the top chunks
- Determining optimal chunk size is an **iterative process** — test different sizes against different queries until best performance is found
- LlamaIndex provides specific node parsers for code: **CodeSplitter** (uses tree-sitter for AST-based splitting with configurable chunk_lines and max_chars)

---

## Source 8: Stack Overflow Blog — Breaking Up Is Hard to Do: Chunking in RAG Applications (https://stackoverflow.blog/2024/12/27/breaking-up-is-hard-to-do-chunking-in-rag-applications/)

- Include too much in a chunk and the vector loses the ability to be specific; include too little and you lose context
- Chunking is not just about splitting — it is about preserving the **semantic integrity** of the information
- For code: naive character splitting cuts functions in half, producing chunks where the embedding has no understanding of incomplete tokens or truncated logic
- Recommends language-aware approaches that respect syntactic boundaries (functions, classes, methods)
- Discusses the interplay between chunk size, embedding model context window, and retrieval quality
- Key insight: even a perfect retrieval system fails if it searches over poorly prepared data — **the unit of retrieval determines what can be found**

---

## Source 9: OptyxStack — RAG Chunking Strategy: How Chunk Size, Overlap, and Document Structure Affect Recall (https://optyxstack.com/rag-reliability/rag-chunking-strategy-chunk-size-overlap-document-structure-recall)

- **Core thesis:** The right chunking strategy preserves answer-bearing units; it does not just split text into convenient token windows
- When teams say "our retrieval is weak," the problem is often not the retriever — it is the unit of retrieval
- **Overlap findings:**
  - Overlap helps when boundaries cut clauses, steps, or parameter rules
  - Too much overlap creates duplicate-heavy retrieval and worse context precision
  - Recommended: **10-20% of chunk size** as overlap (e.g., 500-token chunk = 50-100 tokens overlap)
- **Document-aware chunking** often moves recall more than swapping embedding models, especially for:
  - Policies, API docs, tables, and multi-step procedures
  - Code with function/class boundaries
- Headings, bullets, warnings, tables, examples, and exception clauses are **semantic boundaries** — ignoring them is one of the fastest ways to lower effective recall
- Adaptive chunking dynamically adjusts chunk size based on content complexity: smaller chunks for information-rich sections, larger chunks for general introductory material

---

## Source 10: SuperMemory — Building code-chunk: AST Aware Code Chunking (https://supermemory.ai/blog/building-code-chunk-ast-aware-code-chunking/)

- Built on the cAST paper from CMU but extended for production use
- Uses **tree-sitter** to parse source code into AST — tree-sitter is battle-tested (powers syntax highlighting in Neovim, Helix, Zed) and supports virtually every language
- **The problem with text splitters for code:** splitting Python at 500 characters cuts functions in half; embeddings have no idea what truncated tokens mean; search queries for relevant functions may return useless fragments
- **Production enhancements beyond the paper:**
  1. **Rich context extraction** — extracts full entity metadata, builds scope trees, formats context for embeddings (not just raw chunks)
  2. **Overlap support** — chunks can include the last N lines from the previous chunk to help with queries targeting code at chunk boundaries
  3. **Streaming** — process large files without loading everything into memory
  4. **Concurrent processing** — chunk multiple files in parallel with configurable concurrency
  5. **WASM support** — works in Cloudflare Workers and edge runtimes
  6. **Effect library integration** — first-class support for the Effect TypeScript library
- Each chunk includes: scope chain, imports, siblings, and entity signatures as metadata
- GitHub: https://github.com/supermemoryai/code-chunk (171 stars, TypeScript)

---

## Source 11: LangChain — Code Text Splitter Integration Guide (https://docs.langchain.com/oss/python/integrations/splitters/code_splitter)

- `RecursiveCharacterTextSplitter` includes prebuilt lists of **language-specific separators** for code
- Supported languages (24+): cpp, go, java, kotlin, js, ts, php, proto, python, rst, ruby, rust, scala, swift, markdown, latex, html, sol, csharp, cobol, c, lua, perl, haskell, elixir, powershell
- Usage: `RecursiveCharacterTextSplitter.from_language(language=Language.PYTHON, chunk_size=50, chunk_overlap=0)`
- For **Python**, separators include class definitions, function definitions, and control flow statements
- For **JavaScript/TypeScript**, separators include function declarations, class declarations, and block-level constructs
- The approach uses **syntactic delimiters** (not AST parsing) — faster but less precise than tree-sitter-based approaches
- Can be combined with LlamaIndex via `LangchainNodeParser` wrapper
- Limitation: uses regex-based pattern matching for language constructs rather than true parsing — can misidentify boundaries in edge cases (e.g., string literals containing function keywords)

---

## Source 12: LlamaIndex CodeSplitter — API Reference (https://developers.llamaindex.ai/python/framework-api-reference/node_parsers/code/)

- **CodeSplitter** is LlamaIndex's dedicated code chunking node parser
- Uses **tree-sitter** under the hood for actual AST parsing (not regex)
- Configurable parameters:
  - `language` — programming language for the parser
  - `chunk_lines` — target number of lines per chunk
  - `max_chars` — maximum characters per chunk (fallback when a single AST node exceeds chunk_lines)
  - `chunk_lines_overlap` — number of overlapping lines between consecutive chunks
- Also available: **SemanticSplitterNodeParser** (uses embedding similarity to find breakpoints), **SentenceWindowNodeParser** (includes surrounding context window in metadata), **HierarchicalNodeParser** (creates parent-child chunk relationships)
- The `CodeSplitter` respects AST boundaries, so chunks correspond to complete syntactic units (functions, classes, modules) rather than arbitrary line counts

---

## Source 13: Galileo — Mastering RAG: Advanced Chunking Techniques for LLM Applications (https://galileo.ai/blog/mastering-rag-advanced-chunking-techniques-for-llm-applications)

- Text structure (sentence, paragraph, code, table, transcript) significantly impacts the chunk size — must understand how structure relates to content type
- **Impact of chunking on five dimensions:**
  1. Retrieval quality — defines the unit of information stored/searched
  2. Vector database cost — grows linearly with number of chunks; chunks should be as large as possible to keep costs low
  3. Vector database query latency — fewer chunks = lower latency
  4. LLM latency and cost — larger chunks = more tokens = higher cost
  5. LLM hallucinations — excessive context can lead to hallucinations; balancing contextual richness with retrieval precision is essential
- **Propositions (Dense X Retrieval):** Atomic expressions where each encapsulates a distinct factoid in a concise, self-contained natural language format — an alternative to chunk-level retrieval
- **Evaluation metrics:**
  - **Chunk Attribution:** measures whether the LLM's response can be attributed back to the retrieved chunks
  - **Chunk Utilization:** measures how much of each retrieved chunk was actually used in generating the response
- The questions users will ask should determine the chunking technique — specific factual questions need different chunking than complex questions requiring information from multiple chunks

---

## Source 14: GitHub Repos Implementing Code-Aware Chunking

### supermemoryai/code-chunk (https://github.com/supermemoryai/code-chunk)
- **Language:** TypeScript | **Stars:** 171 | **License:** MIT
- AST-aware chunking using tree-sitter; splits at semantic boundaries (functions, classes, methods)
- Each chunk includes rich context: scope chain, imports, siblings, entity signatures
- Supports streaming, concurrent processing, WASM for edge runtimes

### yilinjz/astchunk (https://github.com/yilinjz/astchunk)
- **Language:** Python | **Stars:** 157
- Official implementation of the cAST paper (EMNLP 2025)
- Uses tree-sitter for parsing; supports Python, Java, C#, TypeScript, and more
- Recursive split-then-merge algorithm respecting size limits

### wangxj03/code-splitter (https://github.com/wangxj03/code-splitter)
- **Language:** Rust
- Uses tree-sitter to parse code into AST and merge sibling nodes to create largest possible chunks without exceeding size limit
- Supports multiple token counting methods

### gomantics/chunkx (https://github.com/gomantics/chunkx)
- **Language:** Go
- Implements the CAST algorithm; supports 30+ programming languages via tree-sitter
- Configurable chunk sizes and optional chunk overlapping

### ilanaliouchouche/ASTSnowballSplitter (https://github.com/ilanaliouchouche/ASTSnowballSplitter)
- **Language:** Python | Available on PyPI
- Uses AST to split code; designed for RAG systems enhancing coding assistants

---

## Source 15: Firecrawl — Best Chunking Strategies for RAG (and LLMs) in 2026 (https://www.firecrawl.dev/blog/best-chunking-strategies-rag)

- **Default recommendation:** Start with RecursiveCharacterTextSplitter at 400-512 tokens with 10-20% overlap; move to semantic or page-level chunking only if metrics show you need it
- **Performance benchmarks (2026):**
  - Recursive splitting achieves **88-89% recall** with 400-token chunks using text-embedding-3-large
  - Fixed-size chunking with 400-token size and 20% overlap achieves ~82% recall
- Identified a **"context cliff"** around 2,500 tokens where response quality drops
- Sentence chunking matched semantic chunking up to ~5,000 tokens at a fraction of the cost
- For code-heavy documentation: use hybrid approaches — route PDFs to page-level chunking, web pages to recursive splitting, and **code to code-aware separators** based on file type
- For larger chunks with more context in code docs, recommends chunk_size=1500, chunk_overlap=300, with separators respecting markdown structure (`\n## `, `\n### `, `\n\n`, `\n`)

---

## Synthesis

### The Core Problem with Code Chunking

Code is fundamentally different from prose. Naive text splitting (by character count or fixed token windows) produces chunks that sever functions mid-body, separate class definitions from their methods, and create fragments where truncated identifiers are meaningless to both embedding models and LLMs. The cAST paper (Source 1) demonstrates this concretely: fixed-size chunking that breaks a `compute_stats` method causes the model to lose context about return values, generating incorrect code.

### The Hierarchy of Code Chunking Approaches

From worst to best, based on the research:

1. **Fixed-size character/token splitting** — Fast, predictable, but structurally unaware. Works as a baseline. Scores well in general text benchmarks but fails for code-specific retrieval where function boundaries matter.

2. **Regex-based language-aware splitting (LangChain)** — Uses language-specific separators (class/function/method keywords) to find split points. Covers 24+ languages. Better than naive splitting but relies on pattern matching, not true parsing. Can misfire on edge cases like function keywords inside string literals.

3. **AST-based splitting (tree-sitter)** — Parses code into an Abstract Syntax Tree and chunks at syntactic boundaries. The cAST algorithm (split oversized nodes recursively, merge small siblings) produces self-contained, semantically coherent units. The gold standard for code chunking. Implementations exist in Python (astchunk), TypeScript (code-chunk), Rust (code-splitter), and Go (chunkx).

4. **LLM-guided chunking** — Uses an LLM to identify optimal partition points. The MITRE study (Source 2) found that LLM-created partitions were up to 20% more factual than human expert partitions. Expensive but highest quality. Practical mainly for high-value legacy code modernization, not routine RAG indexing.

### Optimal Chunk Size for Code

The research converges on these ranges:

| Use Case | Recommended Size | Source |
|---|---|---|
| General RAG default | 400-512 tokens | PremAI, Firecrawl, Microsoft Azure |
| Balanced faithfulness + relevancy | 1024 tokens | LlamaIndex evaluation |
| Code documentation (broader context) | 1500 tokens | Firecrawl |
| Maximum before quality cliff | ~2500 tokens | Firecrawl 2026 analysis |
| Too small (context loss) | <128 tokens | LlamaIndex, PremAI |
| Semantic chunking (caution: often too small) | Avg 43 tokens | FloTorch 2026 benchmark |

For code specifically, AST-based chunking naturally produces variable-sized chunks aligned to function/class boundaries. The `max_chars` or `chunk_lines` parameter serves as an upper bound, with the AST structure determining actual boundaries.

### Overlap: When It Helps and When It Hurts

- **Recommended default:** 10-20% of chunk size (e.g., 50-100 tokens for a 500-token chunk)
- **Helps when:** boundaries cut mid-clause, mid-parameter-list, or mid-step in procedures
- **Hurts when:** too much overlap creates duplicate-heavy retrieval, reducing diversity in top-k results
- **Surprising finding:** A January 2026 analysis using SPLADE retrieval found overlap provided **no measurable benefit** and only increased indexing cost (Source 4)
- **For AST-based code chunking:** overlap is less critical because chunks already align to syntactic boundaries; the SuperMemory implementation (Source 10) adds optional overlap of N lines from the previous chunk for boundary queries

### Semantic vs. Syntactic Chunking for Code

| Dimension | Syntactic (AST-based) | Semantic (embedding-based) |
|---|---|---|
| Mechanism | Parse tree structure | Embedding similarity between sentences |
| Boundary quality for code | Excellent — functions, classes, methods | Poor — code sentences lack clear semantic transitions |
| Speed | Fast (tree-sitter is native) | Slow (requires embedding each sentence) |
| Language support | 30+ via tree-sitter | Language-agnostic but code-unaware |
| Context preservation | High — complete syntactic units | Variable — may group unrelated code by embedding similarity |
| Best for | Source code files | Prose documentation about code |

**Verdict:** For actual source code, syntactic/AST-based chunking is strictly superior. Semantic chunking is better suited for natural language documents and may complement AST chunking for mixed code-and-documentation files.

### The Context Loss Problem and Solutions

Three strategies address context loss at chunk boundaries:

1. **Late chunking** (Weaviate, Source 5) — Embed the full document first, then split. Each chunk's embedding retains document-wide context. Solves the anaphoric reference problem where chunks containing pronouns lose their referents.

2. **Contextual chunking** — Prepend context summaries to each chunk (e.g., `[CONTEXT: This function belongs to the UserAuth class and handles OAuth token refresh]`). Dramatically improves matching on queries about cross-referenced code.

3. **Rich metadata in AST chunks** (SuperMemory, Source 10) — Attach scope chain, imports, sibling signatures, and parent class information to each chunk. The embedding and retrieval system can use this metadata without consuming chunk token budget.

### Key Metrics for Evaluating Code Chunking

- **Chunk Attribution** (Galileo) — Can the LLM's response be traced back to retrieved chunks?
- **Chunk Utilization** (Galileo) — How much of each retrieved chunk was actually used?
- **Token-level Recall** (Chroma) — What fraction of relevant answer tokens did the retriever surface?
- **Faithfulness** (LlamaIndex) — Absence of hallucinations in generated responses
- **Relevancy** (LlamaIndex) — Response relevance to query and retrieved context

### Practical Recommendations for a Code RAG System

1. **Use AST-based chunking** (tree-sitter) for all source code files. Start with the `astchunk` Python library or `code-chunk` TypeScript library.
2. **Set max chunk size to 512-1024 tokens** with AST boundaries as the primary split points and token budget as the fallback.
3. **Use language-specific recursive splitting** (LangChain `from_language`) as a faster fallback for languages without tree-sitter grammar support.
4. **Apply 10-20% overlap** for documentation and prose; overlap is less necessary for AST-chunked code.
5. **Attach rich metadata** — scope chain, imports, class context — to each code chunk for embedding enrichment.
6. **Evaluate iteratively** using faithfulness, relevancy, and token-level recall metrics against representative queries.
7. **Avoid pure semantic chunking for code** — it produces fragments too small for useful retrieval (avg 43 tokens in the FloTorch benchmark).
8. **Consider late chunking or contextual prefixes** for files where cross-chunk references are common (e.g., a class definition referenced across multiple method implementations).
