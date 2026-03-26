# Keyword Extraction from Code: Research Findings

Date: 2026-03-25

---

## 1. Automated Keyword Extraction: TF-IDF, RAKE, and TextRank

**URL:** https://www.tiernok.com/posts/automated-keyword-extraction-tf-idf-rake-and-textrank.html

- **TF-IDF (Term Frequency-Inverse Document Frequency):** Finds words that have the highest ratio of occurring in the current document vs. their frequency in the larger corpus. Words common across all documents are scored lower. Requires a corpus of documents to compute IDF. Fast (2 seconds for 50 documents).
- **RAKE (Rapid Automatic Keyword Extraction):** Extracts candidate keywords by finding strings of words that do not include phrase delimiters or stop words. Builds a co-occurrence graph to identify the frequency that words are associated together in those phrases. Works on a single document (no corpus needed). Also fast (2 seconds for 50 documents). Tends to produce longer, more descriptive multi-word phrases.
- **TextRank:** Creates a graph of words and relationships from a document, then identifies the most important vertices using PageRank-style recursive importance scoring. Works on a single document. Extremely slow (6.5 minutes for 50 documents). Best for identifying long-term trends and common subjects across documents.
- **Key insight for code:** TF-IDF penalizes words that appear across many documents, which would downweight common programming keywords (e.g., `function`, `return`, `class`). For code, this is actually useful -- it surfaces domain-specific identifiers. RAKE and TextRank work on single documents and can extract multi-token phrases, which maps well to compound identifiers like `getUserPermissions`.
- **Practical finding:** RAKE produced the most intuitively relevant keyword phrases for blog posts. TF-IDF excelled at finding unique, distinguishing terms. TextRank was too slow to be practical for large-scale extraction.

---

## 2. Sourcegraph: Keeping It Boring (and Relevant) with BM25F

**URL:** https://sourcegraph.com/blog/keeping-it-boring-and-relevant-with-bm25f

- **BM25** was introduced in 1994 and has powered search engines for decades. It is an evolution of TF-IDF that adds document length normalization and term frequency saturation (diminishing returns from repeated terms).
- **BM25F** extends BM25 to handle structured documents with multiple weighted fields. In code, these fields can include: symbol definitions, file paths, comments, and code body. Matches on symbol names can be boosted (e.g., 5x more important than body text).
- **Code-specific challenges:** Most code search engines (like Zoekt, used by Sourcegraph) do **not** perform index-time tokenization. This is because tokenization is at odds with code search needs: matching punctuation exactly, matching terms anywhere within a line rather than at pre-defined token boundaries.
- **Key insight:** Sourcegraph implements BM25F on a line-level, computing term frequencies for each line while boosting matches on symbols. This avoids the need for code-specific tokenization while still achieving field-weighted relevance ranking.
- **Implication for keyword extraction:** In production code search, the structure of the code itself (symbol definitions vs. comments vs. body) provides natural field boundaries that can weight keyword importance. You don't necessarily need NLP-style tokenization -- the code's own structure is a signal.

---

## 3. Bag-of-Words Baselines for Semantic Code Search (Zhang et al., NLP4Prog 2021)

**URL:** https://aclanthology.org/2021.nlp4prog-1.10.pdf / https://ml4code.github.io/publications/zhang2021bag/

- Evaluated traditional IR methods (BM25 and RM3 query expansion) on the **CodeSearchNet Corpus** -- natural language queries paired with relevant code snippets across 6 programming languages.
- **Shocking finding:** BM25 and RM3 **outperform several pre-BERT neural models** for semantic code search. The non-neural ElasticSearch baseline performs competitively even among the most complex models.
- **Critical preprocessing insight:** Specialized tokenization dramatically improves effectiveness. Identifiers in code tokens are split into subtokens (e.g., `camelCase` yields `camel` and `case`). Natural language tokens are split using byte-pair encoding (BPE).
- The Neural Bag of Words model (simplest neural baseline) was the best performing model among baseline models, suggesting keyword matching is a crucial facility for code search.
- **Takeaway:** Simple keyword-based methods with good tokenization/identifier splitting are surprisingly powerful for code retrieval. The gap between keyword methods and neural methods is much smaller than commonly assumed.

---

## 4. Repository-Level Code Search with Neural Retrieval Methods (Gandhi et al., CMU, 2025)

**URL:** https://arxiv.org/html/2502.07067v1

- Proposes a multi-stage reranking system: BM25 first-pass retrieval over commit messages, then neural reranking using CodeBERT for file-level relevance.
- **Key finding:** A concise, high-quality retrieved context outperforms a longer, lower-quality one. Well-tuned BM25 with robust reranking greatly narrows search scope and provides better context to LLMs.
- Neural reranking improved MAP, MRR, and P@1 by up to 80% over the BM25 baseline on a dataset from 7 popular open-source repositories.
- **Hybrid approach:** The combination of keyword retrieval (BM25) with semantic reranking (CodeBERT) is the most effective architecture. Neither alone is sufficient.
- **Relevance to keyword extraction:** Commit messages serve as a natural-language summary of code changes, and BM25 over these messages is an effective first-pass retrieval mechanism. This suggests that code-adjacent natural language (commit messages, docstrings, comments) is a rich source of keywords.

---

## 5. On the Naturalness of Software (Hindle et al., ICSE 2012 / CACM 2016)

**URL:** https://cacm.acm.org/research/on-the-naturalness-of-software/

- **The naturalness hypothesis:** Code, despite being written in artificial languages, is a natural product of human effort. Because coding is an act of communication, large code corpora have rich, repetitive, predictable patterns -- similar to natural language.
- Code is **very repetitive**, even more so than natural language. Cross-entropy declines rapidly with n-gram order, saturating around tri- or 4-grams.
- N-gram language models successfully capture these regularities and help with tasks such as code suggestion (up to 61% improvement in keystrokes saved over Eclipse's suggestion engine).
- **Implication for keyword extraction:** Because code is highly repetitive and predictable, the tokens that deviate from expected patterns carry the most information. TF-IDF-like approaches that identify unusual or distinctive tokens in a codebase are well-grounded in this theory -- they surface the tokens with the highest information content.
- **Identifier importance:** Identifiers (variable names, function names, class names) are where developers encode domain knowledge and intent. They are the primary carriers of semantic meaning beyond the programming language's syntax.

---

## 6. Identifier Tokenization and Code Comprehension Research

**URL (Improving Tokenisation):** https://link.springer.com/chapter/10.1007/978-3-642-22655-7_7
**URL (Eye Tracking Study):** https://www.semanticscholar.org/paper/An-Eye-Tracking-Study-on-camelCase-and-under_score-Sharif-Maletic/4524bf32179b61f961efa0c165221e68f567fd49
**URL (Shorter Identifiers):** https://www.se.cs.uni-saarland.de/publications/docs/HoSeHo17.pdf
**URL (Descriptive Compound Names):** https://brains-on-code.github.io/descriptive-compound-identifier-names.pdf

- **Identifiers account for ~70% of source code** in terms of characters. Their quality is critical for maintainability and comprehension.
- Identifier splitting (tokenizing `getRectangleArea` into `get`, `Rectangle`, `Area`) is fundamental for all code keyword extraction. Techniques include camelCase splitting, underscore splitting, and dictionary-based approaches for abbreviations.
- Research evaluated tokenization accuracy by comparing algorithms to manual tokenizations of 28,000 identifier names from 60 open-source Java projects.
- **Eye tracking research:** Developers find semantic defects ~14% faster when identifiers use full descriptive words vs. abbreviations. Developers spend more time on lines before the defect with descriptive names, indicating they build better mental models.
- **CamelCase vs. underscore:** Camel case identifiers improve correctness by 51.5% over underscores in some studies, while others show underscores are recognized more quickly. Novices benefit most from camelCase.
- **Takeaway for keyword extraction:** Identifier splitting is the single most important preprocessing step for code keyword extraction. The sub-tokens within identifiers carry the primary semantic payload. Abbreviation expansion (e.g., `cfg` to `configuration`) is a significant challenge.

---

## 7. EyeLayer: Human Attention Patterns in Code Summarization (Zhang et al., ICPC 2026)

**URL:** https://arxiv.org/html/2602.22368

- Proposes EyeLayer, a module that incorporates human eye-gaze patterns into LLM-based code summarization, using eye-tracking data as a proxy for human expertise.
- **Key finding:** Programmers allocate attention unevenly across code. They concentrate intensively on **semantically critical regions** while attending peripherally to contextual elements (boilerplate, standard patterns).
- EyeLayer models this uneven distribution as a composition of several focus patterns using a Multimodal Gaussian Mixture. Token embeddings are redistributed based on learned attention parameters.
- Achieves up to **13.17% improvement on BLEU-4** over strong fine-tuning baselines across LLaMA-3.2, Qwen3, and CodeBERT.
- **Implication for keyword extraction:** Human attention during code reading is a strong signal for token importance. The tokens developers fixate on most are the semantically critical keywords. These tend to be: (a) identifiers encoding domain logic, (b) control flow statements at decision points, (c) API calls that reveal intent. Boilerplate tokens (braces, standard patterns) receive minimal attention.

---

## 8. Semantic Code Search with Qdrant

**URL:** https://qdrant.tech/documentation/tutorials-search-engineering/code-search/

- Uses two embedding models: a general NLP model (`all-MiniLM-L6-v2`) for natural language queries, and a specialized code model (`jina-embeddings-v2-base-code`) for code-to-code similarity.
- **Code preprocessing for NLP search:** Extract function signatures, divide camelCase and snake_case names into separate words, take docstrings and comments, build natural-language sentences from extracted data using templates, remove special characters.
- **Chunking strategy:** Functions, class methods, structs, enums, and other language-specific constructs are good chunk candidates. They are big enough to contain meaningful information but small enough for embedding models with limited context windows.
- Uses **Language Server Protocol (LSP)** tools (e.g., rust-analyzer) to parse codebases and export to LSIF format. This produces structured chunks with context about location in the project.
- **Key takeaway:** Code search requires converting code tokens into a vocabulary that bridges the semantic gap with natural language. This conversion -- splitting identifiers, extracting docstrings, building sentence templates -- is essentially keyword extraction from code.

---

## 9. Building Intelligent Codebase Indexing with CocoIndex

**URL:** https://medium.com/@cocoindex.io/building-intelligent-codebase-indexing-with-cocoindex-a-deep-dive-into-semantic-code-search-e93ae28519c5

- Uses **Tree-sitter** for language-aware syntactic parsing to extract meaningful code chunks (functions, classes, methods) rather than arbitrary text splits.
- Combines content search (keyword matching), file name search (fuzzy matching), and structure search (AST parsing) for multi-tiered retrieval at different granularity levels.
- Traditional keyword-based search answers "where does this exact string appear?" while semantic search answers "where is the code that handles this concept?"
- **Practical pipeline:** Parse with Tree-sitter -> extract function/class/method chunks -> generate embeddings -> store in vector database -> combine with keyword search for hybrid retrieval.
- **Relevance to keyword extraction:** The AST-level extraction of code structures provides a natural vocabulary of symbols, types, and relationships that form the keyword basis for a codebase index.

---

## 10. YAKE! Keyword Extraction from Single Documents

**URL:** https://github.com/LIAAD/yake / https://liaad.github.io/yake/docs/--home

- YAKE (Yet Another Keyword Extractor) is an unsupervised, lightweight keyword extraction method using **text statistical features** -- no training, no external corpus, no dictionaries.
- Features used: term casing, term position, term frequency, term relatedness to context, term different-sentence frequency.
- Produces a score per candidate keyword: **lower scores indicate more important keywords**.
- Works across multiple languages and domains regardless of text size.
- **Applicability to code:** YAKE's statistical features would need adaptation for code. Term position matters differently in code (imports at top, exports at bottom). Term casing in code is convention-driven (constants are UPPER_CASE, classes are PascalCase). These conventions could actually be exploited as features -- PascalCase tokens are likely type definitions, UPPER_CASE tokens are likely constants, camelCase tokens are likely variables/functions.
- **Limitation for code:** YAKE was designed for natural language. It uses stop word removal and sentence-boundary detection that would need significant modification for code. However, its core idea of using multiple statistical features without supervision is directly applicable.

---

## 11. GraphGen4Code: Code Knowledge Graphs (IBM Research)

**URL:** https://wala.github.io/graph4code/

- Builds knowledge graphs from code with nodes representing **classes, functions, and methods**. Edges indicate function usage, data flow through function calls, and documentation about functions.
- Integrates code analysis with external knowledge: code documentation, usage documentation, and forum discussions (StackOverflow).
- Applied to 1.3 million Python files from GitHub, 2,300 Python modules, and 47 million forum posts, producing a graph with over **2 billion triples**.
- Uses program analysis that follows data and control flow across multiple function calls, simulating each function call even without an explicit main entry point.
- **Key difference from other tools:** Does not assume programs are self-contained. Explicitly models calls to library functions and approximates data flow through those calls.
- **Relevance to keyword extraction:** The vocabulary of a knowledge graph (entity types, relationship types, symbol names) constitutes the extracted keywords of a codebase. The graph structure adds semantic relationships between keywords that a flat keyword list misses.

---

## 12. Building a Knowledge Graph Over a Codebase for LLM (Zimin Chen, 2024)

**URL:** https://medium.com/@ziche94/building-knowledge-graph-over-a-codebase-for-llm-245686917f96

- Motivates knowledge graphs as a way to skip manual code snippet selection and let LLMs figure out which code to reason about.
- **Process:** Parse codebase with AST parsers (Tree-sitter), extract entities (functions, classes, variables), extract relationships (calls, imports, inheritance, data flow), store in graph database.
- The knowledge graph captures four categories: code entities, relationships, metadata (documentation, version history), and external knowledge (API docs, forum discussions).
- **For RAG/Agents:** The graph enables structured retrieval -- given a query, traverse the graph to find related symbols and their context rather than doing flat text search.
- **Implication for keyword extraction:** The entities in a knowledge graph (function names, class names, module names) plus their relationships form a structured vocabulary/ontology. This is a richer form of keyword extraction that preserves semantic connections.

---

## 13. CodePrism: Graph-Based Code Analysis Engine

**URL:** https://rustic-ai.github.io/codeprism/blog/graph-based-code-analysis-engine/

- Uses a **Universal AST** that normalizes language-specific ASTs into a common representation. This enables cross-language analysis (e.g., JavaScript calling Python via API).
- Indexes 1000+ files per second with sub-millisecond query time.
- Traditional AST tools analyze files in isolation and miss inter-file relationships. CodePrism builds a unified graph of the entire codebase.
- Nodes represent code entities (classes, functions, methods); edges represent inheritance, invocations, data flows, and dependencies.
- **Relevance to keyword extraction:** A Universal AST provides a language-agnostic way to identify the structurally important tokens in code -- the ones that define or reference symbols. These structural keywords (definitions, references, imports) are the backbone of code understanding.

---

## 14. API Usage Patterns as Keywords

**URL (API patterns):** https://www.sciencedirect.com/science/article/abs/pii/S0164121216301200
**URL (RACK query reformulation):** https://clones.usask.ca/pubfiles/articles/MRahmanRACKEMSE2019.pdf

- An **API usage pattern** documents a set of method calls from multiple API classes to achieve a reusable functionality. These patterns serve as high-level keywords for code functionality.
- Mining approaches use frequent-sequence mining (e.g., PrefixSpan) to extract API usage patterns from codebases. Code is represented as a network of object usages, with patterns extracted by clustering based on co-existence relations.
- **Query reformulation (RACK):** Translates natural language queries into sets of relevant API classes by exploiting associations between query keywords and API classes. This bridges the vocabulary gap between what developers ask and what exists in code.
- **Implication:** API calls and library usage patterns form a powerful keyword vocabulary for code. The sequence `open -> read -> parse -> close` tells you more about code intent than any individual identifier. API-level keywords capture behavioral semantics.

---

## 15. Kit: AI Devtools Context Engineering Toolkit

**URL:** https://github.com/cased/kit

- Open-source toolkit for building AI developer tools with codebase mapping, symbol extraction, and multiple kinds of code search.
- Provides: content search (keyword matching), file name search (fuzzy matching), and structure search (AST parsing).
- Symbol extraction identifies function definitions, class definitions, method definitions, and their relationships.
- **Multi-tiered search:** Different granularity levels from broad keyword matches to precise symbol definitions.
- **Practical relevance:** Demonstrates that production code intelligence tools combine keyword extraction (lexical), structural extraction (AST), and semantic search (embeddings) in a layered architecture. No single approach is sufficient.

---

## Synthesis

### What are the best keywords in code?

Based on this research, the most semantically important tokens in source code fall into a clear hierarchy:

1. **Identifier names** (~70% of code characters). These carry the primary semantic payload. Splitting compound identifiers (`getUserPermissions` -> `get`, `User`, `Permissions`) is the single most impactful preprocessing step for code keyword extraction.

2. **Symbol definitions** (function names, class names, type names). These are the vocabulary of a codebase. BM25F-style approaches that boost matches on symbol definitions significantly outperform flat text search.

3. **API calls and library usage patterns.** Sequences of API calls encode behavioral intent that no individual token captures. Mining these patterns produces high-level semantic keywords.

4. **Code-adjacent natural language** (docstrings, comments, commit messages). BM25 over commit messages is an effective first-pass retrieval mechanism. These serve as human-authored keyword summaries of code.

5. **Structural tokens** (control flow, imports, exports). While boilerplate is low-information, structural tokens at decision points (if/else, try/catch) carry semantic weight about code behavior.

### Which techniques work best?

| Technique | Strengths | Weaknesses | Best For |
|-----------|-----------|------------|----------|
| **TF-IDF / BM25** | Fast, no training, surprisingly competitive with neural methods | Misses semantic similarity | First-pass retrieval, distinguishing terms |
| **BM25F** | Exploits code structure (fields), production-proven | Requires field annotation | Code search with symbol boosting |
| **RAKE** | Multi-word phrases, no corpus needed | Designed for NL, needs adaptation | Extracting compound keyword phrases |
| **TextRank** | Graph-based importance, no corpus needed | Very slow, NL-oriented | Small-scale analysis |
| **YAKE** | Unsupervised, statistical features, no training | NL-oriented, needs code adaptation | Single-document extraction |
| **Identifier splitting** | Essential preprocessing, massive impact | Abbreviation expansion is hard | Always (foundation step) |
| **AST / Tree-sitter** | Language-aware, structural extraction | Doesn't capture semantics alone | Chunking, symbol extraction |
| **Knowledge graphs** | Rich relationships, structured vocabulary | Complex to build, maintain | Full codebase ontology |
| **Neural embeddings** | Semantic similarity across NL/code gap | Expensive, opaque, need training | Semantic search, reranking |
| **Hybrid (BM25 + neural)** | Best of both worlds | More complex pipeline | Production systems |

### Key principles for code keyword extraction:

1. **Split identifiers first.** This single step has the largest impact on code search effectiveness (Zhang et al., 2021).
2. **Exploit code structure.** Symbol definitions, file paths, comments, and code body are natural fields with different importance weights.
3. **Code is more repetitive than natural language** (Hindle et al., 2012). The tokens that deviate from common patterns carry the most information.
4. **Human attention is concentrated on semantically critical tokens** (Zhang et al., ICPC 2026). Boilerplate receives minimal attention; identifiers at decision points receive maximum attention.
5. **Simple methods with good preprocessing beat complex methods with bad preprocessing.** BM25 with identifier splitting outperforms pre-BERT neural models (Zhang et al., 2021).
6. **Hybrid retrieval is the state of the art.** Combine keyword-based first-pass (BM25/BM25F) with neural reranking for best results.
7. **API usage patterns are high-level keywords.** Sequences of API calls capture behavioral semantics that individual tokens miss.
8. **Knowledge graphs provide structured vocabularies.** When you need a full codebase ontology (not just flat keywords), graph-based approaches capture relationships between symbols.
