# 09 — Codebase Graphs: Dependency Graphs, Call Graphs, and Code Knowledge Graphs

> Research date: 2026-03-25
> Scope: Dependency graph construction and analysis, call/control-flow/data-flow graphs, tooling (Madge, dependency-cruiser, pydeps, Joern, Emerge), academic foundations, code knowledge graphs for LLM context, and graph-based code understanding.

---

## 1. Neo4j Developer Blog — "Codebase Knowledge Graph: Code Analysis with Graphs" (https://neo4j.com/blog/developer/codebase-knowledge-graph/)

- A codebase knowledge graph models code entities (projects, classes, methods, namespaces, NuGet packages) as graph nodes and their relationships as edges, stored in Neo4j.
- **Strazh** is the reference tool: a Docker-based analyzer for .NET Core that parses solution/project files and produces a Neo4j graph. Supports tiered analysis — "Project" tier (projects + NuGet packages) or "All" tier (full class/method/namespace detail).
- Construction pipeline: parse source code -> extract entities -> create nodes with attributes -> create labeled edges (DEPENDS_ON, CONTAINS, CALLS, INHERITS) -> load into Neo4j.
- Code analysis is performed via **Cypher queries** rather than traditional Roslyn rules. Example queries: "What functions call UserService.create_user?", "Show all classes implementing the Repository interface", dead code detection, dependency tracking.
- Having code as a graph enables **graph algorithms** (community detection, PageRank, centrality) via Neo4j GDS plugin — useful for identifying tightly coupled modules, architectural boundaries, and refactoring candidates.
- Key insight: graph-based code analysis is language-agnostic in principle; the same query patterns work regardless of whether the underlying code is C#, Java, or Python once the graph is built.

## 2. Joern / Code Property Graph — "Code Property Graph" (https://docs.joern.io/code-property-graph/)

- The **Code Property Graph (CPG)** merges three classical program representations into a single property graph:
  - **Abstract Syntax Tree (AST)**: captures syntactic structure — nodes are statements, expressions, declarations.
  - **Control Flow Graph (CFG)**: models execution paths — edges connect basic blocks showing possible execution order.
  - **Program Dependence Graph (PDG)**: combines control dependencies (which statements govern execution of others) and data dependencies (which definitions reach which uses).
- The merge key: statements and predicates exist as nodes in all three sub-graphs, so they are unified at those points. The resulting CPG has AST nodes as its primary structure, with CFG edges (red) and PDG edges (blue) overlaid.
- CPG is a **directed, edge-labeled, attributed multigraph**. Each node has a type (METHOD, LOCAL, CALL, LITERAL, IDENTIFIER, etc.) and key-value attributes (name, signature, type, line number). Multiple edge types coexist: AST, CFG, REACHING_DEF, CALL, CONTAINS.
- **Joern** is the open-source reference implementation. Supports C/C++, Java, JavaScript, Python, Kotlin, PHP, and binary analysis. Won the IEEE Test-of-Time Award in 2024 for the foundational 2014 paper "Modeling and Discovering Vulnerabilities with Code Property Graphs."
- Query language: a Scala-based DSL for graph traversals. Enables **taint analysis** — track attacker-controlled data from sources to sinks across function boundaries.
- Bugs, vulnerabilities, and code patterns are expressed as **graph traversal algorithms**, making it possible to mine large codebases (tested on the Linux kernel) for vulnerability patterns at scale.
- Originally used Neo4j + Gremlin as backend; now uses custom **OverflowDB** for performance.
- The CPG specification is open-sourced by Qwiet AI (formerly ShiftLeft) at https://github.com/ShiftLeftSecurity/codepropertygraph.

## 3. dependency-cruiser — "Validate and visualize dependencies" (https://github.com/sverweij/dependency-cruiser)

- **dependency-cruiser** (6.5k GitHub stars) validates and visualizes dependencies in JavaScript, TypeScript, CoffeeScript, and LiveScript projects (ES6, CommonJS, AMD module systems).
- Core capability: a **rule engine** that lets teams declare forbidden and allowed dependency patterns. Rules are written in `.dependency-cruiser.js` and enforced in CI. Example rule: `"don't allow dependencies from outside the test folder to test"`.
- Built-in rules detect: circular dependencies, orphan modules, dependencies not declared in package.json, production code depending on devDependencies.
- Output formats: text reports (for CI), **dot/SVG/HTML** graphs (for visualization). The HTML report is navigable and interactive.
- `depcruise --init` bootstraps a sensible default configuration. Rules use `from`/`to` matchers with path patterns, enabling fine-grained architectural enforcement.
- Integrates with CI pipelines — violations cause build errors. More robust than Madge for CI use cases because of its rule validation system and configurable severity levels.
- Key differentiator from Madge: custom rule definitions, multiple language support, HTML interactive reports, CI-native error reporting.

## 4. Madge — "Create graphs from your module dependencies" (https://github.com/pahen/madge)

- **Madge** (10k GitHub stars) generates visual dependency graphs from CommonJS, AMD, or ES6 module dependencies. Also supports CSS preprocessors (Sass, Stylus, Less).
- Primary use cases: circular dependency detection, dependency visualization, identifying orphan modules (no dependents) and leaf modules (no dependencies).
- CLI examples:
  - `madge --circular path/src/app.js` — find circular dependencies.
  - `madge --image graph.svg path/src/app.js` — generate SVG graph (requires Graphviz).
  - `madge --depends wheels.js path/src/app.js` — find what depends on a given module.
  - `madge --orphans path/src/` — find modules no one depends on.
  - `madge --leaves path/src/` — find modules with no dependencies.
- Supports multiple Graphviz layout engines: dot, neato, fdp, sfdp, twopi, circo.
- Also usable as a Node.js library (programmatic API): `madge('path/to/app.js').then(res => res.image('graph.svg'))`.
- Output formats: JSON (pipeable for transformations), DOT, SVG, JPG, PNG.
- Limitation: no rule engine, no CI-native validation, no custom forbidden-dependency rules. For enforcement, dependency-cruiser is the better choice.
- **Skott** (https://dev.to/antoinecoulon/introducing-skott-the-new-madge-1bfl) is pitched as "the new Madge" with additional features.

## 5. pydeps — "Python Module Dependency Graphs" (https://github.com/thebjorn/pydeps)

- **pydeps** (2.1k GitHub stars) visualizes Python module dependency graphs. Command-line tool: `pydeps <package>` generates a graph image.
- Requires **Graphviz** for rendering. Outputs SVG by default.
- Key features:
  - **Cycle detection**: pydeps detects and displays circular dependency cycles.
  - **Erdos-like scoring (Bacon number)**: `--max-bacon=N` filters modules to those within N hops of the target module. Default is 2. `--max-bacon=0` means infinite (show all). Useful for finding a module's interface to the rest of the world.
  - **Max module depth**: `--max-module-depth=N` limits how deep into nested package structures the graph goes. Critical for large packages like pandas where full graphs become overwhelming.
  - **Exclusion patterns**: `-x` flag to exclude private/test modules (e.g., `-x pandas._* pandas.test*`).
  - **Color clustering**: modules that belong together get similar colors automatically.
- Can be used as a Python library, not just CLI.
- Comparable tools for Python: **pipdeptree** (shows installed package dependency tree), **import-linter** (enforces architectural boundaries in Python imports).

## 6. Emerge — "Browser-based Interactive Codebase and Dependency Visualization" (https://github.com/glato/emerge)

- **Emerge** (1k GitHub stars) is a browser-based interactive tool for codebase and dependency visualization supporting many programming languages.
- Supports: Java, Kotlin, Swift, Ruby, Python, JavaScript, TypeScript, C, C++, Groovy, and more.
- Produces interactive force-directed graph visualizations in the browser. Nodes represent files/modules, edges represent dependencies. Users can click, drag, zoom, and explore.
- Computes **graph metrics**: fan-in, fan-out, modularity, coupling metrics, and basic code quality metrics (lines of code, complexity).
- Configured via YAML. Analyzes import/include statements to build the dependency graph.
- Unique value: multi-language support with a consistent interactive visualization interface. Useful for polyglot codebases and monorepos.

## 7. Guardsquare Blog — "Call Graphs: The Bread and Butter of Program Analysis" (https://www.guardsquare.com/blog/call-graphs-the-bread-and-butter-of-program-analysis)

- A **call graph** models interprocedural control flow: nodes represent methods/functions, edges represent call relationships.
- Without call graph information, any analysis is confined to single methods. Dataflow analysis across method boundaries requires call graph data. Missing it "drastically reduces overall accuracy and usability."
- **Construction algorithms** (from least to most precise):
  - **Class Hierarchy Analysis (CHA)**: resolves virtual calls by considering all possible subtypes in the class hierarchy. Fast but over-approximates — includes call targets that may never actually execute.
  - **Rapid Type Analysis (RTA)**: refines CHA by only considering types that are actually instantiated in the program. Significantly reduces false call edges.
  - **Points-to Analysis (Andersen's, Steensgaard's)**: tracks which heap objects each variable can point to. Most precise but most expensive. Gives near-exact call targets for virtual/dynamic dispatch.
- **Static vs. dynamic call graphs**: static analysis over-approximates (includes infeasible paths), dynamic analysis (profiling/tracing) under-approximates (only captures observed executions). Hybrid approaches combine both.
- Call graphs enable: dead code elimination (unreachable methods), code shrinking/tree shaking, taint analysis, vulnerability scanning, impact analysis for code changes.
- **ProGuardCORE** is referenced as an open-source Java/JVM call graph library providing CHA-based analysis with uncertainty modeling.

## 8. Tweag Blog — "Managing Dependency Graph in a Large Codebase" (https://www.tweag.io/blog/2025-09-18-managing-dependency-graph/)

- Part of a three-part series on dependency graphs in large codebases (second post). Focuses on practical challenges.
- **Diamond dependency problem**: when two libraries depend on different versions of the same transitive dependency. Common in large projects; requires careful version management or deduplication.
- **Incomplete build metadata**: build systems may not capture all actual dependencies (e.g., runtime-loaded plugins, reflection-based instantiation). Leads to "phantom dependencies" — code that works by accident because something else pulls in the needed transitive dependency.
- **Circular dependencies**: particularly dangerous in large codebases. Build systems like Bazel/Buck reject them outright. Detection and elimination is a key maintenance task.
- **Dependency graph metrics** for health monitoring:
  - **Fan-in / fan-out**: high fan-out modules are fragile (break when any dependency changes); high fan-in modules are load-bearing (breaking them affects many consumers).
  - **Depth**: deep dependency chains amplify transitive risk.
  - **Width**: wide graphs (many siblings at same level) indicate potential for parallel builds but also coordination challenges.
- **Architecture enforcement**: build systems like Pants and Bazel provide **visibility rules** that restrict which targets can depend on which. This turns architectural decisions into enforceable constraints.
- **Strategies**: version pinning, dependency lockfiles, automated dependency update tools (Dependabot, Renovate), explicit dependency declaration, and regular graph auditing.

## 9. Zimin Chen — "Building Knowledge Graph over a Codebase for LLM" (https://medium.com/@ziche94/building-knowledge-graph-over-a-codebase-for-llm-245686917f96)

- Motivation: LLMs handle individual code snippets well, but reasoning over an entire codebase requires understanding cross-file relationships. A knowledge graph captures these relationships structurally.
- **Construction pipeline**:
  1. Parse code using AST parsers (tree-sitter is language-agnostic).
  2. Extract entities: classes, methods, functions, variables, modules, imports.
  3. Extract relationships: calls, imports, inherits, contains, depends_on.
  4. Optionally enrich with metadata: function signatures, documentation comments, code metrics (cyclomatic complexity, LOC), version control history.
  5. Store in a graph database (Neo4j, FalkorDB) or as RDF triples.
- **Use in RAG**: the knowledge graph enables structured retrieval — when an LLM needs context about a function, the graph can retrieve not just the function but its callers, callees, parent class, implemented interfaces, and related tests.
- **Use in Coding Agents**: agents can traverse the graph to understand impact of changes, find related code, and reason about architectural patterns.
- Key insight: vector similarity search captures topical similarity but fails on **multi-hop architectural reasoning** (e.g., controller -> service -> repository chains). Graph traversal handles these naturally.

## 10. Chinthareddy (2026) — "Reliable Graph-RAG for Codebases: AST-Derived Graphs vs LLM-Extracted Knowledge Graphs" (https://arxiv.org/html/2601.08773)

- **Academic paper (January 2026)** benchmarking three retrieval pipelines for code RAG on Java codebases (Shopizer, ThingsBoard, OpenMRS Core):
  - **(A) No-Graph Naive RAG**: vector-only similarity search.
  - **(B) LLM-Generated Knowledge Graph RAG (LLM-KB)**: uses an LLM to extract entities and relationships from code.
  - **(C) Deterministic AST-derived Knowledge Graph RAG (DKB)**: uses Tree-sitter to deterministically parse code and build a graph with labeled edges for inheritance, dependency injection, and call relationships.
- **Key findings — speed**: DKB builds its graph in seconds (2.81s on Shopizer; 13.77s on ThingsBoard). LLM-KB takes orders of magnitude longer (200s on Shopizer; 884s on ThingsBoard).
- **Key findings — completeness**: LLM-KB exhibits **probabilistic indexing incompleteness**. On Shopizer, 377 files were SKIPPED/MISSED by the LLM, yielding 68.8% per-file success rate and 64.1% corpus coverage. DKB achieved 90.2% coverage deterministically.
- **Key findings — graph size**: LLM-KB produced 842 nodes vs. DKB's 1158 nodes (72.7% node coverage). Deterministic parsing is more complete.
- **Key findings — cost**: end-to-end cost (indexing + answering 15 architecture questions) was $0.04 (No-Graph), $0.09 (DKB, ~2.25x), $0.79 (LLM-KB, ~19.75x). DKB is dramatically cheaper than LLM-based extraction.
- **DKB construction method**: Tree-sitter parses each file into an AST. Labeled edges are added for `extends`/`implements` (inheritance), field types and constructor parameter types (dependency injection). Bidirectional graph traversal at query time expands context using successors and predecessors. Interface-consumer expansion improves upstream discovery.
- **Conclusion**: deterministic AST-derived graphs are faster, cheaper, more complete, and more reliable than LLM-extracted graphs. LLM-KB's stochastic behavior makes it unsuitable for production code understanding pipelines where completeness matters.

## 11. FalkorDB Blog — "Code Graph: From Visualization to Integration" (https://www.falkordb.com/blog/code-graph/)

- FalkorDB provides an open-source Code Graph tool (https://github.com/FalkorDB/code-graph) that creates a deployable graph explorer from any GitHub repository.
- **Detailed knowledge graph schema for code**:
  - **Entity types (nodes)**: Module (name, path), Class (name, access_modifier, is_abstract, documentation), Function (name, return_type, access_modifier, documentation, complexity, lines_of_code), Argument (name, type, default_value), Variable (name, type, initial_value), File (name, path, size, modification_date).
  - **Relationship types (edges)**: CONTAINS (module->class, class->function), CALLS (function->function), INHERITS (class->class), IMPLEMENTS (class->interface), IMPORTS (module->module), HAS_ARGUMENT (function->argument), DEFINES (function->variable), READS/WRITES (function->variable), DEPENDS_ON (module->module), OVERRIDES (function->function), THROWS (function->exception), ANNOTATED_WITH (class/function->annotation).
- **Construction workflow**: (1) Code Parsing — use a language-specific parser (tree-sitter, LSP) to extract structural information from source files. (2) Graph Construction — create nodes for each entity and edges for each relationship using Cypher queries. (3) Enrichment — optionally add metadata like complexity metrics, documentation, and VCS history. (4) Visualization — render the graph in an interactive browser interface.
- **Querying**: uses Cypher. Example: find all functions that call a specific function, trace inheritance chains, identify circular dependencies, find dead code (functions with zero callers).
- Benefits: improved understanding, impact analysis, autocompletion suggestions, onboarding acceleration, refactoring support.

## 12. GraphGen4Code — "A Toolkit for Generating Code Knowledge Graphs" (https://wala.github.io/graph4code/)

- **GraphGen4Code** (IBM Research, published at AAAI) builds code knowledge graphs at massive scale: applied to 1.3 million Python files, 2,300 Python modules, and 47 million forum posts, producing a graph with over **2 billion RDF triples**.
- Key nodes represent **classes, functions, and methods**. Edges indicate:
  - **Function usage**: how data flows through function calls, derived from program analysis of real code.
  - **Documentation**: code docs, usage docs, and forum discussions (e.g., StackOverflow).
- Uses **named graphs in RDF** to model one graph per program. Can also output as JSON.
- **Differentiators from other frameworks**:
  - Does not assume programs are self-contained — explicitly models calls to library functions and approximates data flow through those calls.
  - Follows data and control flow across multiple function calls within the same script.
  - Simulates function calls within a script even if the script does not explicitly invoke them (no explicit `main` required).
- Applications: program search, code understanding, bug detection, code automation, AutoML (learning ML pipeline patterns), recommendation engine for developers, building language models for code understanding, enforcing best practices, learning from big code.
- Schema includes: class nodes, function/method nodes, data flow edges, parameter edges, return edges, call edges, documentation nodes linked to code entities.
- Paper: https://arxiv.org/abs/2002.09440

## 13. PuppyGraph — "Software Dependency Graphs: Definition, Use Cases, and Implementation" (https://www.puppygraph.com/blog/software-dependency-graph)

- Comprehensive taxonomy of **dependency types**:
  - **Direct dependencies**: explicitly declared in manifests (package.json, pom.xml, requirements.txt).
  - **Transitive dependencies**: pulled in by direct dependencies. The 2025 OSSRA report found the average application contains 1,200+ open-source components with 64% being transitive.
  - **Compile-time dependencies**: needed to build but not necessarily at runtime.
  - **Run-time dependencies**: required during execution.
  - **Deployment dependencies**: infrastructure, config files, environment variables, container images.
- **Construction approaches**:
  - **Static analysis**: scans source code, config files, and manifests to capture declared relationships (imports, function calls, package usage). Reveals intended structure without running code.
  - **Dynamic analysis**: traces actual runtime behavior via profiling, logging, or instrumentation. Captures relationships that static analysis misses (reflection, dynamic loading).
  - **Hybrid**: combines both for maximum coverage.
- **Graph analytics use cases**: impact analysis (what breaks if X changes), taint analysis (trace data flow for security), dead code detection (unreachable nodes), SBOM generation for compliance, CI/CD pipeline optimization.
- **PuppyGraph** enables zero-ETL graph queries directly on existing data sources using Gremlin and openCypher, without needing to load data into a separate graph database.

## 14. Shivam Sahu — "How I Built CodeRAG with Dependency Graph Using Tree-Sitter" (https://medium.com/@shsax/how-i-built-coderag-with-dependency-graph-using-tree-sitter-0a71867059ae)

- Practical blog post (November 2025) on building a CodeRAG system that uses dependency graphs for LLM-powered codebase Q&A.
- **Challenge**: code files are fundamentally different from text documents. Random chunking strategies break semantic boundaries (splitting a function in half). AST-aware chunking preserves structural integrity.
- **Tree-sitter** is used as the language-agnostic parser. It produces ASTs from which entities (functions, classes, imports) and their relationships are extracted.
- **AST-based chunking**: parse code into AST, traverse it, extract relevant subtrees (function declarations, class definitions) as chunks. Each chunk remains syntactically valid and semantically meaningful.
- **Dependency graph construction**: after extracting entities, build a graph where nodes are code entities and edges represent import/call/inheritance relationships. This graph is stored alongside vector embeddings.
- **Retrieval strategy**: at query time, retrieve relevant chunks via vector similarity, then **expand context via graph traversal** — follow edges to callers, callees, parent classes, imported modules. This provides the LLM with structurally related context, not just topically similar text.
- Referenced research paper: CAST (Enhancing Code Retrieval-Augmented Generation with Structural Chunking via Abstract Syntax Tree).
- Tools like Cursor, Windsurf, and Copilot use similar CodeRAG approaches internally.

## 15. Wikipedia / Harvard CS153 — "Control-Flow Graphs" and "Call Graphs" (https://en.wikipedia.org/wiki/Control-flow_graph, https://en.wikipedia.org/wiki/Call_graph)

- **Control Flow Graph (CFG)**: a graph where nodes are basic blocks (sequences of instructions with single entry/exit) and edges represent jumps, branches, and fall-throughs. Fundamental to compiler optimization and static analysis.
- **Data Flow Analysis** operates over CFGs: propagates facts (reaching definitions, live variables, available expressions) along CFG edges until a fixpoint is reached. Enables optimizations like constant propagation, dead code elimination, and common subexpression elimination.
- **Call Graph**: nodes are procedures/functions, edges indicate calling relationships. Essential for interprocedural analysis. Without it, analysis is limited to single-function scope.
- **Program Dependence Graph (PDG)**: combines control dependencies and data dependencies. Used for program slicing — computing the set of statements that may affect values at a point of interest. Critical for debugging, understanding, and reengineering.
- **Program slicing** on PDGs: given a variable and a program point, compute the backward slice (all statements that could affect that variable at that point). Enables focused debugging and impact analysis.
- CFGs form the basis for: loop detection, dominance analysis, reaching definitions, liveness analysis, and SSA (Static Single Assignment) form construction.

---

## Synthesis

### Graph Types and Their Purposes

| Graph Type | Nodes | Edges | Primary Use |
|---|---|---|---|
| **Dependency Graph** | Modules/packages/files | Import/require/dependency relationships | Architecture visualization, build optimization, security audit |
| **Call Graph** | Functions/methods | Call relationships | Dead code elimination, impact analysis, taint analysis |
| **Control Flow Graph** | Basic blocks | Execution flow (branch/jump) | Compiler optimization, path analysis, bug detection |
| **Data Flow Graph** | Variables/definitions | Def-use chains | Reaching definitions, constant propagation, vulnerability detection |
| **Program Dependence Graph** | Statements | Control + data dependencies | Program slicing, debugging, change impact |
| **Code Property Graph** | All of the above merged | AST + CFG + PDG edges | Vulnerability mining, pattern matching across representations |
| **Code Knowledge Graph** | Classes, functions, modules, variables | Calls, imports, inherits, contains, etc. | LLM context retrieval, codebase understanding, onboarding |

### Construction Approaches

1. **Static parsing (deterministic)**: Tree-sitter, language-specific parsers, or LSP-based analysis. Fast (seconds), complete (90%+ coverage), cheap. The 2026 Chinthareddy paper shows deterministic AST-derived graphs are 70x faster and 20x cheaper than LLM-extracted graphs with better completeness.

2. **LLM-based extraction**: use an LLM to read code and emit entities/relationships. Flexible but slow, expensive, and probabilistically incomplete (68.8% file coverage in benchmarks). Not recommended for production pipelines where completeness matters.

3. **Hybrid**: static parsing for structure, LLM for semantic enrichment (documentation, intent, architectural pattern classification). Best of both worlds when cost is acceptable.

### Tool Landscape

| Tool | Language | Focus | Stars | Key Strength |
|---|---|---|---|---|
| **dependency-cruiser** | JS/TS/Coffee/Live | Validation + visualization | 6.5k | Rule engine, CI integration |
| **Madge** | JS (CJS/AMD/ES6) | Visualization | 10k | Simple, fast, good graphs |
| **pydeps** | Python | Module dependency viz | 2.1k | Bacon scoring, depth control |
| **Joern** | C/C++/Java/JS/Py/Kt | Security analysis via CPG | - | CPG, taint analysis, IEEE award |
| **Emerge** | Multi-language | Interactive browser viz | 1k | Polyglot, graph metrics |
| **GraphGen4Code** | Python (at scale) | Knowledge graph construction | - | 2B+ triples, includes docs |
| **FalkorDB Code Graph** | Multi-language | Knowledge graph + explorer | - | Full schema, Cypher queries |
| **Neo4j + Strazh** | .NET | Knowledge graph | - | Graph algorithms (GDS) |
| **PuppyGraph** | Language-agnostic | Zero-ETL graph queries | - | Query existing data in place |
| **Depends** | Multi-language | Dependency extraction | - | CLI, exports to GraphViz/PlantUML |
| **NDepend** | .NET | Architecture analysis | - | Deep .NET integration, metrics |
| **Skott** | JS/TS | Modern Madge alternative | - | Newer API, additional features |

### Key Insights for Wazir

1. **Deterministic AST-derived graphs beat LLM-extracted graphs** for reliability, speed, and cost. Tree-sitter is the standard parser for language-agnostic AST extraction. Use static parsing as the foundation; add LLM enrichment only where semantic understanding is needed.

2. **Graph-based retrieval solves multi-hop reasoning** that vector search cannot. When an LLM needs to understand "what happens when I change this function," graph traversal (callers, callees, implementors, dependents) provides structurally correct context that topical similarity misses entirely.

3. **The Code Property Graph (CPG) is the gold standard** for deep code analysis. Merging AST + CFG + PDG into one queryable graph enables vulnerability detection, pattern mining, and taint analysis. Joern is the reference implementation.

4. **For dependency validation and enforcement**, dependency-cruiser's rule engine is the strongest JS/TS option. For Python, pydeps + import-linter. For build-system-level enforcement, Bazel/Pants visibility rules.

5. **Graph metrics (fan-in, fan-out, depth, modularity)** are underutilized but powerful signals for code health. High fan-out = fragility. High fan-in = load-bearing module. Circular dependencies = architectural debt. These metrics should be part of any automated review pipeline.

6. **Knowledge graph schema is converging** on a standard set of entity types (Module, Class, Function, Variable, File) and relationship types (CALLS, IMPORTS, INHERITS, IMPLEMENTS, CONTAINS, DEPENDS_ON, READS, WRITES). FalkorDB's schema is the most complete reference.

7. **Scale is achievable**: GraphGen4Code demonstrates 2 billion triples from 1.3M Python files. Neo4j, FalkorDB, and PuppyGraph all handle production-scale code graphs. The bottleneck is not storage or querying — it is construction quality and completeness.

8. **For LLM-powered code review**, the optimal pipeline is: (a) build a deterministic code graph via Tree-sitter, (b) store in a graph database, (c) at review time, use the diff to identify changed nodes, (d) traverse the graph to gather impacted callers/callees/dependents, (e) feed that structured context to the LLM alongside the diff. This is the architecture that tools like Cursor and Copilot are converging on.
