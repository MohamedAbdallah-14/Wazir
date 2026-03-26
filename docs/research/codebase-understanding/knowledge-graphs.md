# Code Knowledge Graphs for Software Engineering

> Research date: 2026-03-25
> Topic: Building, querying, and leveraging knowledge graphs from source code

---

## 1. Neo4j Blog -- Codebase Knowledge Graph (https://neo4j.com/blog/developer/codebase-knowledge-graph/)

- **What it is**: A Codebase Knowledge Graph is a graph-structured dataset with free-form relationships between entities of a codebase, semantic models of programming language constructs, project structure, and other interlinked knowledge.
- **Tool: Strazh** -- A .NET Core ETL (Extract, Transform, Load) console application that generates graphs from C# codebases. Written in C#, also runs as a Docker container.
- **Pipeline**: (1) Extract codebase models using the Roslyn compiler API to traverse Syntax and Semantic Trees, (2) Transform models into RDF triples (subject-predicate-object), (3) Load RDF triples into Neo4j as nodes and relationships.
- **Roslyn analyzer**: The .NET compiler provides APIs for code analysis; you traverse Syntax and Semantic Trees to extract any structural or semantic information from the codebase.
- **RDF triples**: Resource Description Framework triples encode relationships as (subject, predicate, object) -- e.g., `(ClassA, IMPLEMENTS, InterfaceB)`.
- **Graph enables querying**: Having a codebase as a graph allows exploration, querying, and analysis of nodes and relationships using Cypher queries instead of writing Roslyn rules or custom analyzers.
- **Key insight**: The way you choose to organize data into a graph is called an Ontology -- this is a research field in itself. The ontology determines what becomes a node, what becomes a relationship, and what becomes a property.

## 2. GraphGen4Code / Graph4Code -- IBM Research (https://wala.github.io/graph4code/)

- **Paper**: "A Toolkit for Generating Code Knowledge Graphs" (arXiv:2002.09440), published at K-CAP 2021. Authors: Ibrahim Abdelaziz, Julian Dolby, James P. McCusker, Kavitha Srinivas (IBM Research).
- **What it does**: Builds code knowledge graphs that power program search, code understanding, bug detection, and code automation.
- **Key nodes**: Classes, functions, and methods. **Edges**: Function usage (data flow through function calls from program analysis), documentation (code docs, usage docs, StackOverflow forum discussions).
- **Analysis backbone**: Uses WALA (Watson Libraries for Analysis) -- a standard static analysis library. Analysis follows data and control flow across multiple function calls within the same script, simulates each function call even without explicit main entry points.
- **Differentiator vs. other frameworks**: Does not assume each program is self-contained; explicitly models calls to library functions and approximates data flow through those calls. Handles real Python code full of library calls.
- **Output format**: Named graphs in RDF (one graph per program) or JSON.
- **Scale**: Applied to 1.3 million Python files from GitHub, 2,300 Python modules, and 47 million forum posts, producing an integrated code graph with over 2 billion triples.
- **Applications**: AutoML pipelines, recommendation engine for developers, building language models for code understanding, enforcing best practices, learning from big code.
- **GitHub**: https://github.com/wala/graph4code (358 stars, 318 commits).

## 3. Code Property Graph -- Yamaguchi et al. (IEEE S&P 2014) / Joern (https://github.com/joernio/joern)

- **Seminal paper**: "Modeling and Discovering Vulnerabilities with Code Property Graphs" (IEEE Security & Privacy 2014, Fabian Yamaguchi et al.). Received the IEEE Test-of-Time Award in 2024.
- **CPG = AST + CFG + PDG**: A Code Property Graph merges three classic program representations into a single joint data structure:
  - **Abstract Syntax Tree (AST)**: Tree of syntactic structure; nodes represent constructs (functions, variables, expressions).
  - **Control Flow Graph (CFG)**: Directed graph of basic blocks and possible control flow paths.
  - **Program Dependence Graph (PDG)**: Nodes are code statements; edges indicate data dependencies and control dependencies.
- **Key insight**: Statements and predicates have a node in each sub-graph, enabling the merge. AST nodes form the primary structure; CFG and PDG add edges (visualized as different colors).
- **Vulnerability detection**: Detected 10 out of 12 vulnerability types in the Linux kernel in 2012. Only design errors and race conditions were hard to address with CPG traversal alone.
- **Joern tool**: Open-source platform (3k stars, 4,124 commits) for analyzing source code, bytecode, and binary executables. Generates CPGs stored in a custom graph database (OverflowDB). Queries use a Scala-based domain-specific query language.
- **Languages supported**: C, C++, Java, JavaScript, Python, Kotlin, binary/LLVM. Cross-language analysis capability.
- **Open specification**: Qwiet AI (formerly ShiftLeft) open-sourced the CPG implementation and specification. Available at https://cpg.joern.io.
- **Commercial adoption**: ShiftLeft (now Qwiet AI) uses CPG as backend technology for commercial security solutions.

## 4. FalkorDB Code Graph (https://www.falkordb.com/blog/code-graph/)

- **What it is**: A visual representation of a codebase as a Knowledge Graph that maps entities (functions, variables, classes) and their relationships (inheritance, method invocations, program dependence, data flows).
- **Workflow for building a Code Graph**:
  1. **Code Parsing**: Analyze source code to identify entities and relationships using parsers and static analysis tools.
  2. **Graph Construction**: Create nodes for each entity and edges for relationships using Cypher queries.
  3. **Storage**: Store in FalkorDB (ultra-low-latency graph database).
  4. **Querying & Visualization**: Query with Cypher, visualize with browser-based explorer.
- **LLM integration**: OpenAI GPT-4/GPT-4o converts natural language queries into Cypher. Examples:
  - "Find the top 10 functions with the most arguments" becomes: `MATCH (f:Function)-[:HAS_ARGUMENT]->(a:Argument) RETURN f.name, COUNT(a) ORDER BY COUNT(a) DESC LIMIT 10`
  - "List all functions that are not called by any other functions" becomes: `MATCH (f:Function) WHERE NOT (f)<-[:CALLS]-(:Function) RETURN f.name`
  - "Find all functions indirectly called by 'main'" becomes: `MATCH path = (start:Function {name: "main"})-[:CALLS*2..]->(end:Function) RETURN DISTINCT end.name, length(path) ORDER BY length(path)`
- **Benefits**: Improved understanding, impact analysis, enhanced debugging, dependency management, code quality assessment.
- **Open source**: https://github.com/FalkorDB/code-graph -- Python module for creating Code Graphs from any public Git repository with a deployable browser-based explorer.

## 5. Code Graph Model (CGM) -- NeurIPS 2025 (https://arxiv.org/abs/2505.16901)

- **Paper**: "Code Graph Model (CGM): A Graph-Integrated Large Language Model for Repository-Level Software Engineering Tasks" (Accepted NeurIPS 2025). Authors from Ant Group, ShanghaiTech, Zhejiang University, Shanghai Jiaotong University.
- **Core idea**: Integrates repository code graph structures directly into an LLM's attention mechanism using a specialized adapter that maps node attributes to the LLM's input space.
- **Code graph construction**: Builds a code graph for each repository that characterizes hierarchical dependencies (file contains class, class contains method) and reference dependencies (function calls, imports, type references).
- **Agentless approach**: Demonstrates that open-source LLMs can address repository-level tasks without requiring agent-based approaches, by comprehending functions and files through their semantic information and structural dependencies.
- **SWE-bench results**: Achieves 43.00% resolution rate on SWE-bench Lite using Qwen2.5-72B. Ranks first among open weight models, second among methods with open-source systems, eighth overall. Surpasses previous best open-source model-based method by 12.33%.
- **Graph RAG framework**: Combined with a Rewriter-Retriever-Reranker (R3) pipeline for issue fixing; the graph structure guides retrieval of relevant code context.
- **Open source**: https://github.com/codefuse-ai/CodeFuse-CGM -- technical paper, core code, model weights, and training data all open-sourced.

## 6. Code-Graph-RAG (https://github.com/vitali87/code-graph-rag)

- **What it is**: "The ultimate RAG for your monorepo" -- a graph-based RAG system for querying, understanding, and editing multi-language codebases with AI and knowledge graphs. 2.2k stars, 1,652 commits.
- **Architecture**: Two main components:
  1. **Multi-language Parser**: Tree-sitter-based parsing system that analyzes codebases and ingests data into Memgraph (graph database).
  2. **RAG System**: Interactive CLI for querying the stored knowledge graph.
- **Graph schema**: Nodes represent code entities (files, classes, functions, methods, variables, parameters, etc.). Edges represent relationships (CALLS, IMPORTS, EXTENDS, IMPLEMENTS, etc.).
- **Performance design**: Multiple specialized indexes for different query patterns -- symbol resolution, call graph adjacency lists, dependency graphs, inheritance trees, full-text content indexes, pattern indexes, and hot-path caches.
- **Multi-language support**: Supports any language with a Tree-sitter grammar. Adding new languages requires only providing the grammar.
- **Available on PyPI**: `pip install code-graph-rag`.

## 7. Zimin Chen -- Building Knowledge Graph over a Codebase for LLM (https://medium.com/@ziche94/building-knowledge-graph-over-a-codebase-for-llm-245686917f96)

- **Motivation**: Enabling LLMs to reason over selected code snippets is straightforward (copy-paste + prompt engineering). Extending this to an entire codebase is the hard problem. Knowledge graphs can tackle this by structuring relationships for retrieval.
- **Use cases for code knowledge graphs with LLMs**:
  1. Better context retrieval for RAG over a codebase (graph-guided retrieval beats flat vector search for structural queries).
  2. Large codebase understanding for Coding Agents -- the graph can improve generation, editing, and completion performance at codebase level.
  3. Enabling/improving many repository-level coding tasks (an emerging research topic in 2023-2024).
- **Key insight**: Traditional embedding-based RAG retrieves semantically similar code chunks but misses structural relationships. A knowledge graph captures call chains, inheritance hierarchies, and cross-file dependencies that flat retrieval cannot.
- **Emerging field**: Many papers published in 2023-2024 on "repository level coding" or "repository level code LLM" on Google Scholar, demonstrating growing academic interest.

## 8. CodeGraph Analyzer (https://github.com/ChrisRoyse/CodeGraph)

- **What it is**: A universal code intelligence platform providing cross-language analysis, Neo4j integration, and MCP (Model Context Protocol) integration for AI-powered codebase interaction. 71 stars.
- **Two-Pass Analysis**: (1) First pass builds detailed ASTs for each file, (2) Second pass resolves complex cross-file relationships (imports, calls, inheritance).
- **Rich element identification**: Extracts files, directories, classes, interfaces, functions, methods, variables, parameters, type aliases, components, SQL tables, and more.
- **Relationship types mapped**: IMPORTS, EXPORTS, CALLS, EXTENDS, IMPLEMENTS, HAS_METHOD, RENDERS_ELEMENT, USES_COMPONENT, REFERENCES_TABLE, and others.
- **Relationship-First Design** (from associated architecture docs): Traditional ASTs focus on structure; universal ASTs focus on relationships. The `CodeGraph` data structure stores nodes (the "what"), edges (the "how they connect"), and specialized indexes for fast queries.
- **Edge types in the schema**: `Calls`, `Imports`, `Inherits`, `References`, `DataFlow`, `Controls` (if/loop/try).
- **Query examples enabled**: "Find all functions that call `authenticate` directly or indirectly", "Trace data flow from user input to database query", "Show all classes that inherit from `BaseModel` across all languages".
- **Frameworks supported**: React/Preact, Tailwind CSS, Supabase, Deno, with component hierarchies, JSX elements, and prop mapping.

## 9. Code-Graph-Analysis-Pipeline / jQAssistant + Neo4j (https://github.com/JohT/code-graph-analysis-pipeline)

- **What it is**: A fully automated pipeline for static code graph analysis built on jQAssistant and Neo4j. Supports Java and experimental TypeScript analysis. 31 stars, 2,483 commits.
- **jQAssistant**: An open-source tool that extracts metadata from Java applications (bytecode, Git history, Maven dependencies, XML, JSON, YAML) and writes them into Neo4j. Plugin-based architecture supports many technologies and frameworks.
- **Pipeline automation**: Uses GitHub Actions to automate the entire analysis process -- checkout, download artifacts, setup Neo4j, run jQAssistant scanning, execute Cypher queries, generate CSV reports, run Jupyter notebooks for visualization.
- **Analysis capabilities**: Discovers which libraries matter most, how modules build on each other, which parts have few contributors, which files change together, where structural anomalies emerge.
- **Machine learning integration**: Supports anomaly detection, association rule mining, and machine learning pipelines on top of the code graph.
- **Cypher reports**: Generates hundreds of expert-level reports using Cypher queries executed against the Neo4j graph.
- **Key topics**: Static code analysis, code dependency analysis, graph analysis, git history analysis, anomaly detection.

## 10. Bevel Software -- Code-to-Knowledge-Graph (https://github.com/Bevel-Software/code-to-knowledge-graph)

- **What it is**: A toolkit designed to parse complex source code and transform it into a rich, structured, and queryable knowledge graph. 145 stars, written in Kotlin.
- **Parser options**: Uses ANTLR grammars and VS Code language server integration for parsing. Directories include `antlr/`, `providers/`, `regex/`, `vscode/` for different parsing strategies.
- **Direct integration**: Available as a Gradle dependency (`software.bevel:code-to-knowledge-graph:1.1.3`). API returns a `Graphlike` object with nodes and connections.
- **Usage example**:
  ```java
  Parser parser = FactoriesKt.createVsCodeParser(projectPath);
  Graphlike graph = parser.parse(List.of(projectPath));
  // graph.getNodes().size(), graph.getConnections().getAllConnections().size()
  ```
- **Design philosophy**: Multiple parsing backends (ANTLR, regex, VS Code) allow flexibility depending on language and accuracy requirements.

## 11. Athale & Vaddina -- Knowledge Graph Based Repository-Level Code Generation (https://arxiv.org/abs/2505.14394)

- **Paper**: "Knowledge Graph Based Repository-Level Code Generation" (2025). Authors from Northeastern University and Quantiphi Inc.
- **Three-stage methodology**:
  1. **Construct**: Build a comprehensive knowledge graph representing the repository's entities and relationships.
  2. **Retrieve**: Retrieve relevant code components based on graph traversal guided by semantic relevance.
  3. **Generate**: Use an LLM to generate code that adheres to the repository's architectural and stylistic constraints.
- **Hybrid retrieval**: Combines structural graph traversal with semantic similarity for improved contextual relevance. Tracks inter-file modular dependencies to ensure consistency.
- **Benchmark**: Evaluated on EvoCodeBench, a repository-level code generation benchmark. Demonstrates significant improvement over baseline approaches.
- **Key contribution**: Shows that knowledge graph-based code generation advances robust, context-sensitive coding assistance by capturing structural and relational information that flat retrieval misses.

## 12. Sourcegraph SCIP -- Code Intelligence Protocol (https://github.com/sourcegraph/scip)

- **What it is**: SCIP (SCIP Code Intelligence Protocol) is a language-agnostic protocol for indexing source code, used at Sourcegraph to power code navigation features ("Go to definition", "Find references").
- **Design**: A Protobuf schema centered around human-readable string IDs for symbols, replacing LSIF concepts of "monikers" and "resultSets". Heavily inspired by SemanticDB from the Scala ecosystem.
- **Performance vs. LSIF**: 10x speedup in CI (replacing lsif-node with scip-typescript); LSIF indexes are on average 4x larger (gzip compressed) compared to equivalent SCIP payloads.
- **Language indexers**: scip-typescript (TypeScript, JavaScript), scip-java (Java, Scala, Kotlin), with community indexers for other languages.
- **Relevance to knowledge graphs**: SCIP produces a structured index of symbol definitions, references, and relationships across a codebase -- essentially a serialized code knowledge graph optimized for navigation and cross-reference queries. While not a traditional knowledge graph database, it captures the same entity-relationship structure.

## 13. Daytona -- Building a Knowledge Graph of Your Codebase (https://www.daytona.io/dotfiles/building-a-knowledge-graph-of-your-codebase)

- **Code knowledge graph captures**: Code entities (functions, classes, variables), relationships (function calls, inheritance, data flow), metadata (documentation, version history), external knowledge (API docs, forum discussions).
- **The challenge**: As software systems grow, traditional code search tools fall short. Knowledge graphs map the entire ecosystem of code, capturing structure and meaning.
- **LLMs as the secret sauce**: Modern approaches use LLMs with structured outputs to enrich the graph with semantic understanding beyond what static analysis provides.
- **Practical queries enabled**: "Show me all the places where we're using deprecated APIs", "What's the impact of changing this interface?", dependency tracing, dead code detection.
- **Future vision**: A new era of software engineering where developers interact with codebases through intelligent graph-backed queries rather than grep/search.

---

## Synthesis

### What is a Code Knowledge Graph?

A code knowledge graph (CKG) is a graph-structured representation of a codebase where **nodes** represent code entities (files, classes, functions, methods, variables, parameters, interfaces, components) and **edges** represent relationships between them (calls, imports, extends, implements, data flow, control flow, contains). Unlike flat indexes or vector embeddings, CKGs preserve the structural topology of code -- call chains, inheritance hierarchies, cross-file dependencies, and data flow paths.

### How Code Knowledge Graphs Are Built

The construction pipeline typically follows an ETL pattern:

1. **Parse**: Source code is parsed into an intermediate representation. Tools range from language-specific compilers (Roslyn for C#, WALA for Java/Python) to universal parsers (Tree-sitter, ANTLR) to full CPG generators (Joern). The choice determines the depth of analysis -- from syntactic structure only (AST) to full semantic analysis (AST + CFG + PDG).

2. **Extract Entities and Relationships**: The parser output is walked to identify nodes (classes, functions, variables) and edges (calls, imports, inherits, data flow). Two-pass approaches are common: first pass builds per-file ASTs, second pass resolves cross-file relationships.

3. **Transform to Graph Model**: Extracted entities are transformed into a graph representation -- either RDF triples (subject-predicate-object) for semantic web tools, or property graph nodes/edges for Neo4j/Memgraph/FalkorDB. The ontology design (what becomes a node vs. an edge vs. a property) is a critical design decision.

4. **Load into Graph Database**: The graph is loaded into a database (Neo4j, Memgraph, FalkorDB, OverflowDB, or a triplestore for RDF). This enables persistent storage and efficient querying.

### Ontologies and Schemas for Code

There is no single universal ontology, but common patterns emerge:

- **Node types**: File, Module, Package, Namespace, Class, Interface, Function, Method, Variable, Parameter, TypeAlias, Component, SQLTable
- **Edge types**: CONTAINS, IMPORTS, EXPORTS, CALLS, EXTENDS, IMPLEMENTS, HAS_METHOD, HAS_PARAMETER, REFERENCES, DATA_FLOW, CONTROL_FLOW, RENDERS_ELEMENT, USES_COMPONENT
- **Property enrichments**: Documentation strings, line numbers, file paths, complexity metrics, version history, test coverage

The Code Property Graph (CPG) specification provides a formal schema merging AST, CFG, and PDG into a single graph, with an open specification maintained by the Joern project.

### Querying Code Relationships

Graph query languages enable powerful code analysis:

- **Cypher** (Neo4j, FalkorDB, Memgraph): Pattern-matching queries like `MATCH (a:Function)-[:CALLS*]->(b:Function) WHERE b.name = 'authenticate'` to find all callers of a function, direct or transitive.
- **Scala DSL** (Joern): Domain-specific query language for CPG traversal, optimized for vulnerability patterns.
- **SPARQL** (RDF triplestores): For GraphGen4Code's RDF-based graphs.
- **Natural language to Cypher**: LLMs (GPT-4, etc.) can translate developer questions into Cypher queries, making graph exploration accessible to non-experts.

### How Knowledge Graphs Enable Code Understanding

1. **Structural navigation**: Follow call chains, inheritance hierarchies, and dependency graphs that flat text search cannot traverse.
2. **Impact analysis**: Assess ripple effects of code changes by querying transitive dependencies.
3. **Vulnerability detection**: CPGs enable large-scale security analysis by combining syntax, control flow, and data flow in a single queryable structure.
4. **RAG for LLMs**: Graph-guided retrieval provides structurally relevant code context that vector similarity alone misses. The CGM paper showed a 12.33% improvement over previous best on SWE-bench.
5. **Code generation**: Knowledge graph-based retrieval improves repository-level code generation by tracking inter-file dependencies and architectural patterns.
6. **Anomaly detection**: Graph analysis can identify structural anomalies, unusual dependency patterns, and architectural violations.

### Tool Landscape Summary

| Tool | Languages | Graph DB | Parser | Scale | Focus |
|------|-----------|----------|--------|-------|-------|
| GraphGen4Code | Python | RDF triplestore | WALA | 2B triples / 1.3M files | Research, code understanding |
| Joern | C/C++/Java/JS/Python/Kotlin | OverflowDB | Custom CPG | Large codebases | Security, vulnerability detection |
| FalkorDB Code Graph | Multi-language | FalkorDB | Language parsers | Any repo | Visualization, LLM querying |
| CodeGraph Analyzer | TS/JS/Python/React/SQL | Neo4j | Custom two-pass | Project-level | Cross-language intelligence |
| Code-Graph-RAG | Multi-language | Memgraph | Tree-sitter | Monorepo-scale | RAG for code understanding |
| jQAssistant Pipeline | Java, TypeScript | Neo4j | Bytecode scanner | Enterprise | Architecture governance |
| Bevel Code-to-KG | Multi-language | In-memory | ANTLR/VS Code | Project-level | Parsing toolkit |
| Strazh | C# | Neo4j | Roslyn | .NET projects | .NET codebase analysis |
| CGM (NeurIPS 2025) | Python (benchmarked) | Custom | Static analysis | Repository-level | LLM-integrated graph reasoning |
| SCIP | TS/JS/Java/Scala/Kotlin | Serialized index | Language-specific | Enterprise | Code navigation, cross-references |

### Key Takeaways for Wazir

1. **Tree-sitter is the practical choice** for multi-language parsing when building code knowledge graphs without requiring full semantic analysis. It is fast, incremental, and supports 100+ languages.
2. **Two-pass analysis** (per-file AST, then cross-file relationship resolution) is the standard pattern used by CodeGraph, Code-Graph-RAG, and others.
3. **Neo4j + Cypher** is the dominant stack for queryable code graphs, though Memgraph and FalkorDB are competitive alternatives.
4. **LLM + Graph** integration is the frontier: CGM (NeurIPS 2025) showed that feeding graph structure directly into LLM attention mechanisms outperforms both flat retrieval and agent-based approaches for repository-level tasks.
5. **Code Property Graphs** (CPGs) are the gold standard for security analysis but are heavier to construct than lightweight entity-relationship graphs. For code review and understanding (vs. vulnerability detection), lighter-weight knowledge graphs suffice.
6. **Graph-guided RAG** consistently outperforms vector-only RAG for structural code queries (call chains, dependency tracing, impact analysis), making it a strong candidate for code review context gathering.
