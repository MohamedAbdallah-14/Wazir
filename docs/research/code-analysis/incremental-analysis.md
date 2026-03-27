# 33 - Incremental Code Analysis

> Research on incremental parsing, incremental static analysis, demand-driven analysis, and caching strategies for making code analysis fast on large codebases.

---

## Source 1: Scaling Static Analyses at Facebook (https://m-cacm.acm.org/magazines/2019/8/238344-scaling-static-analyses-at-facebook/fulltext)

**Type:** Industry paper (Communications of the ACM, 2019)
**Authors:** Distefano, Fahndrich, Logozzo, O'Hearn (Facebook)

- Facebook deploys two major static analysis tools: **Infer** (memory safety, concurrency, security for Java/ObjC/C++) and **Zoncolan** (security for Hack, 100M+ LOC)
- Both run on code modifications as bots during code review -- the **"diff-time continuous reasoning"** model
- Infer's main deployment is **fast incremental analysis of code changes** -- it does not need to process the entire codebase to analyze a diff
- Target: Infer runs in **15-20 minutes on a diff** on average, including checkout, build, and analysis
- Over **100,000 reported issues fixed** by developers before code reaches production
- The key technical enabler is **compositionality**: analysis result of a composite program is defined in terms of analysis results of its parts
- Uses **bi-abduction with separation logic** to perform compositional inter-procedural analysis -- each procedure is analyzed independently of its callers, producing a **procedure summary**
- Compositional analyses are **naturally incremental** -- changing one procedure does not necessitate re-analyzing all other procedures
- Two key questions for compositional analysis: (a) how to represent meaning of a procedure concisely (abstraction), (b) how to combine meanings effectively
- Abstract domains must be **precise enough** to capture properties of interest and **coarse enough** to be computationally tractable
- Lesson: advanced inter-procedural static analysis techniques CAN scale to 100M+ LOC codebases if designed around compositionality
- Fix rate is critical metric -- deploying at diff-time catches bugs early and achieves high fix rates vs. batch/nightly analysis

---

## Source 2: Rust Compiler Incremental Compilation (https://rustc-dev-guide.rust-lang.org/queries/incremental-compilation-in-detail.html)

**Type:** Official compiler documentation (Rust Compiler Development Guide)

- Rust's incremental compilation is a **simple extension to the query system** relying on two properties: queries are **pure functions** and compilation forms an **acyclic dependency graph**
- The **Red-Green Algorithm**: after each compiler run, all query results and the query DAG are saved to disk
  - **Green** = cached result proven still valid (all inputs unchanged)
  - **Red** = result has changed after re-evaluation
- The **"try-mark-green" algorithm** determines a query's color:
  - If all of a query's inputs are green, the query is green without re-execution
  - If any input is red, the query is re-executed and its new result compared to the cached one
  - If the new result equals the cached one, the query is still marked green (**early cutoff**) -- this prevents unnecessary recomputation of dependents
- **Fingerprinting**: every query result is hashed. Comparison is done via fingerprints rather than full values
- Computing fingerprints has **non-trivial cost** -- this is the main reason incremental compilation can be slower than non-incremental for clean builds
- **Dependency graph nodes** include the query type + arguments; edges represent which queries were called during execution
- Incremental compilation is the **default for development builds** in Rust; release builds still use non-incremental by default
- The system performs **only the minimum amount of analysis and compilation needed** -- queries for changed items get re-run until reaching the parsed representation of the changed definition

---

## Source 3: Salsa Framework and Durable Incrementality (https://rust-analyzer.github.io/blog/2023/07/24/durable-incrementality.html)

**Type:** Blog post by matklad (rust-analyzer lead), July 2023

- **Salsa** is the incremental computation engine used by rust-analyzer
- Core mechanism: **instrumentation** records dependencies between function calls, building a complete **call graph** (query graph)
- Three key properties of Salsa's approach:
  1. **Early cutoff**: if an input changes but a derived query's result stays the same, dependents are NOT recomputed. Example: adding whitespace to source code does not change the AST, so all AST-dependent queries are shielded
  2. **Laziness/demand-driven**: when input changes, Salsa does NOT eagerly invalidate reverse-dependencies. Instead, validation happens lazily when a query result is actually requested
  3. **Durability optimization**: inputs are classified into durability buckets (e.g., "library code" vs. "user code"). Since library code rarely changes, Salsa can skip re-validating the entire subgraph that depends only on library code. This is an O(1) check that avoids traversing potentially thousands of queries
- The durability system assigns each input a durability level. The global revision counter is tracked per-durability-level. If the max revision for a durability level hasn't changed, all queries depending only on that level are trivially valid
- This is a critical optimization for IDE scenarios where most of the dependency graph (standard library, third-party deps) rarely changes
- Designing effective **"early cutoff shields"** is the bulk of the work -- e.g., not storing source positions in the AST so that whitespace changes don't propagate

---

## Source 4: Salsa Algorithm Explained (https://medium.com/@eliah.lakhin/salsa-algorithm-explained-c5d6df1dd291)

**Type:** Blog post by Ilya Lakhin, November 2023

- Salsa manages a DAG of pure functions where each function's output depends only on its inputs (other function results or external "user input")
- The framework uses **memoization** of function results to reduce re-computations
- When user input changes, the framework updates the **minimum number of memoization caches** in the function graph
- Incremental frameworks are **demand-driven**: they compute necessary subsets of the function graph only when specific results are observed, leaving the rest intact
- Multiple input changes can accumulate before any recomputation -- the framework propagates changes only when results are requested
- Additional Salsa features:
  - **Cycle detection**: handles programmer-introduced cycles between managed functions
  - **Updates interruption**: can cancel unfinished graph updates mid-computation without damaging the structure (critical for IDE responsiveness)
  - **Durability**: barriers between managed functions so update propagation skips parts of the dependency graph that are updated infrequently
- Salsa is designed for **multi-threaded** computational environments with data structures optimized for concurrent computations

---

## Source 5: Tree-sitter Incremental Parsing (https://tomassetti.me/incremental-parsing-using-tree-sitter/)

**Type:** Technical blog post (Strumenta), February 2025

- Tree-sitter is an **incremental parsing library** using **Generalized LR (GLR) parsing**
- Created by Max Brunsfeld at GitHub for the Atom editor; survived Atom's death and is now used across VS Code, Neovim, GitHub code navigation, and many other tools
- Core incremental mechanism: when an edit is made, the **new syntax tree shares parts of the old tree** that weren't edited -- creating the new tree is fast and memory-efficient
- This makes it possible to **parse source code on every keystroke** in an editor
- **Error recovery**: Tree-sitter produces useful partial parse trees even when code is in an invalid/incomplete state -- critical for IDE scenarios where code is temporarily broken during editing
- Based on research paper: **"Efficient and Flexible Incremental Parsing"** by Tim Wagner (sentential-form incremental LR parsing)
- Key design papers also include: "Practical Algorithms for Incremental Software Development Environments" and "Incremental Analysis of Real Programming Languages"
- Tree-sitter generates parsers as **C code** for portability and performance
- The **on-demand lexing** approach: at any given position in a source document, the lexer only tries to recognize tokens that are valid at that position, reducing wasted work
- Tree-sitter has become the de facto standard for incremental parsing in code editors and AI coding assistants

---

## Source 6: Why the Sorbet Typechecker Is Fast (https://blog.nelhage.com/post/why-sorbet-is-fast/)

**Type:** Blog post by Nelson Elhage (Sorbet co-creator), undated

- Sorbet typechecks ~**100,000 lines of Ruby per second per core** -- one of the fastest production typecheckers
- Written in **C++** for direct native code, explicit data structure layout, and control over allocation
- **Cache locality by design**: core data structures designed to maximize CPU cache hit rates
  - `GlobalState` holds all state in large **flat arrays** referenced by **32-bit indexes** (`NameRef`, `SymbolRef`)
  - This minimizes allocator traffic, improves cache locality (sequential access of arrays), reduces pointer size (32-bit vs 64-bit), and simplifies copy operations
- **Local-only inference**: method bodies are typechecked independently using read-only `GlobalState` instances. This means inference can be **parallelized trivially** -- it takes almost half of total time and is the dominant cost in incremental runs
- **Lazy error construction**: error message formatting (string operations) is guarded by conditionals -- if the error text isn't needed (e.g., `--quiet` mode), it's never generated. This avoids the most expensive part of the typechecking pipeline
- **Avoiding string operations**: string manipulation is a major performance bottleneck; Sorbet uses `NameRef` integers instead of string comparisons throughout
- **Profile-driven tuning**: internal metrics framework collects statistics on real code (Stripe's codebase) to tune data structure sizes, inline vector sizes, and pattern-matching case ordering
- Key architectural insight: by requiring explicit types for global symbols (not inferring them), Sorbet **limits dependencies between typechecking different parts of a program**, enabling both parallelism and incremental updates

---

## Source 7: Incrementalizing Production CodeQL Analyses (https://arxiv.org/abs/2308.09660)

**Type:** Academic paper (FSE 2023), by Tamas Szabo

- Instead of re-analyzing from scratch, an **incremental static analysis** analyzes a codebase once completely, then **updates previous results based on code changes**
- Challenge: sophisticated static analyses use features that can **ruin incremental performance** -- inter-procedurality, context-sensitivity
- The study empirically validates that incrementalization helps for **production CodeQL analyses** providing automated feedback on GitHub pull requests
- Key result: **update times proportional to the size of the code change** (not the size of the codebase)
- Created a **prototype incremental solver for CodeQL** that exploits incrementality
- GitHub's production deployment (2025-2026):
  - Incremental analysis only analyzes **new or changed code** in pull requests
  - Combines an incremental CodeQL database for changed code with a **cached database for the entire codebase**
  - JavaScript/TypeScript saw the **highest average reduction** in scan times, with most impacted scans **58% faster**
  - Overall **up to 20% faster** across all supported languages
  - Tested across **8,000+ repositories** in private beta, then **100,000+ repositories** in production
  - Enabled by default on github.com for C#, Java, JS/TS, Python, Ruby
- The CodeQL Action now only reports **new alerts found within the changed code (diff range)** rather than all alerts in the entire codebase

---

## Source 8: Efficient Incremental Static Analysis Using Path Abstraction (https://link.springer.com/chapter/10.1007/978-3-642-54804-8_9)

**Type:** Academic paper (FASE 2014)

- Addresses the problem that existing incremental analysis tools **perform redundant computations** due to poor abstraction
- Proposes a novel incremental analysis algorithm using **path abstraction**: encodes different program paths as a set of constraints (boolean formulas)
- Boolean formulas are input to a **SAT solver**; (un)satisfiability drives the analysis
- Key insight: a majority of boolean formulas are **similar across multiple versions** of the code
- Finding boolean formula equivalence is **graph isomorphism complete** -- the paper addresses a relaxed version using efficient **memoization techniques**
- Experimental results on codebases up to **87 KLOC**: performance gain of **up to 32%** with incremental analysis
- Overhead of formula equivalence checking is **less than 8.4%** of overall analysis time -- net positive
- Keywords: null pointer analysis, boolean formula, symbolic execution, incremental analysis

---

## Source 9: Adapton: Composable, Demand-Driven Incremental Computation (https://www.cs.tufts.edu/~jfoster/papers/cs-tr-5027.pdf)

**Type:** Academic paper (PLDI 2014), by Hammer, Khoo, Hicks, Foster

- Adapton is a framework for **demand-driven incremental computation** combining memoization with the flexibility of mutation
- When a value is mutated, computations depending on it are **marked dirty** -- their results must be recomputed when demanded
- Key innovation: **composable** -- unlike prior self-adjusting computation systems, Adapton's demand-driven approach avoids unnecessary recomputation of results that are never observed
- Provides a **drop-in replacement** for defining functions that memoize results and record computation graphs
- Implemented in multiple languages: Python, OCaml, Rust, Racket
- The Rust implementation offers the best performance because: (1) Rust is fast, (2) traversal-based garbage collection in other languages presents performance challenges for incremental computation
- Related work: miniAdapton (arxiv:1609.05337) provides a minimal implementation in Scheme for pedagogical purposes
- Adapton inspired the design of Salsa (used in rust-analyzer) and influenced rustc's query system

---

## Source 10: Demystifying Differential and Incremental Analysis (https://sdtimes.com/devops/demystifying-differential-and-incremental-analysis-for-static-code-analysis-within-devops/)

**Type:** Industry article (SD Times, 2021)

- Distinguishes between **incremental analysis** and **differential analysis**:
  - **Incremental analysis**: maintains "analysis objects" from a prior build, initiates a dependency check to determine which source files changed and need re-analysis. Like a compiler doing an "update build" vs. a clean rebuild
  - **Differential analysis**: an enhanced form that uses system context data from previous builds to examine **only files that are new or changed**. Designed specifically for CI/CD pipelines where full analysis is impractical
- For large codebases (35M+ LOC like Android AOSP, or Unreal Engine), full analysis is too time-consuming for fast feedback
- Incremental analysis is **much faster than full analysis with no impact on accuracy** when done correctly
- Critical for DevSecOps pipelines where security/safety compliance must be "baked in" to the process
- The concept applies across coding standards compliance, security analysis, and safety-critical verification

---

## Source 11: Building a Query-Based Incremental Compilation Engine in Rust (https://dev.to/simmypeet/building-a-query-based-incremental-compilation-engine-in-rust-nj6)

**Type:** Blog post (DEV Community)

- Describes practical implementation of the **query-based architecture** used by Rust compiler and LSP
- Contrasts with traditional **pipeline-based compilers** (lexing -> parsing -> type-checking -> IR -> codegen) where each stage runs sequentially
- Query-based architecture: instead of a linear pipeline, computation is organized as **queries that can invoke other queries**
- Queries are **memoized** -- first invocation computes the result, subsequent invocations return cached results from a hashtable
- **Demand-driven**: queries are only computed when their results are needed, not eagerly
- The system records the **dependency graph** between queries during execution
- When inputs change, the system can determine which cached results are still valid and which need recomputation
- Practical benefits for IDE/LSP: when a user edits a file, only the affected queries are re-evaluated, providing near-instant feedback
- Challenge: the architecture is more complex to implement than a simple pipeline, requiring careful management of the query graph and cache invalidation

---

## Source 12: Incremental Compilation Explained: Build System Architecture (https://medium.com/@sohail_saifii/the-build-system-architecture-that-achieves-true-incremental-compilation-7e169c25c0a5)

**Type:** Blog post (Medium, 2025)

- **Coarse-grained incremental compilation**: saves final output (compiled object files) and reuses if source unchanged -- file-level granularity
- **Fine-grained incremental compilation**: saves intermediate representations at each stage -- AST from parsing, type info from analysis, IR from optimization
  - Changed a function's implementation but not its signature? AST for other files calling this function is still valid, type checking is still valid, only code generation for that function needs to re-run
- **Content-addressable caching** (Turborepo): hashes actual content, not just file timestamps. If a file is changed back to a previous state, the cached result from that exact content is reused. Works well in monorepos
- **Bazel** (Google): caches everything based on content hashes, can share cache entries **across machines** and team members
- **Technical challenges**:
  - **Dependency detection**: must have perfect knowledge of dependencies. Missing = incorrect builds. Phantom = unnecessary recompilation. Dynamic imports, runtime loading, reflection break assumptions
  - **Memory/storage tradeoffs**: caching all intermediate state can consume gigabytes. Sometimes the overhead of loading cached data is worse than recompiling from scratch (Kotlin/Wasm found serialization/deserialization became a bottleneck)
  - **Correctness**: incorrect incremental builds where binary doesn't match source are a nightmare. Excel's "dirty cell" calculation chain is cited as a simple but robust model
- **"Live compilation"**: some tools experiment with continuous recompilation as you type, only possible with extremely fast incremental compilation

---

## Source 13: Wikipedia - Incremental Computing (https://en.wikipedia.org/wiki/Incremental_computing)

**Type:** Encyclopedia article

- Incremental computing saves time by **only recomputing outputs that depend on changed data**
- Two broad approaches:
  - **Static approaches**: derive an incremental program from a conventional program via manual refactoring or automatic program transformations, before any inputs are provided
  - **Dynamic approaches**: record execution information on a particular input and use it when the input changes to update the output
- **Change propagation**: the dominant dynamic approach. Records execution as a dynamic dependency graph, then propagates changes through the graph
- **Memoization** is a related but distinct technique -- it avoids redundant computation by caching results, but classic memoization doesn't handle input changes automatically
- **Self-adjusting computation**: programs that automatically adjust their output in response to input changes. Key works by Umut Acar (2005)
- Spreadsheets are the canonical example of incremental computing -- cells are recomputed when their dependencies change
- Prominent frameworks: Adapton (demand-driven), Self-Adjusting Computation (eager), Salsa (Rust ecosystem)
- The field connects to **functional reactive programming**, **build systems** (Make, Bazel), and **database view maintenance**

---

## Source 14: Common Threads in Incremental Data Flow Analysis: A Comprehensive Survey (https://dl.acm.org/doi/10.1145/3768155)

**Type:** Academic survey (ACM Computing Surveys, 2025)

- Comprehensive survey of incremental methods for data flow analysis
- Classifies techniques based on the **reset and recompute** paradigm -- the foundational strategy underlying all incremental techniques
- Two primary approaches for updating analysis after code changes:
  - **From-scratch analysis**: re-run the entire analysis
  - **Incremental analysis**: update only affected parts, reusing previously computed information
- **Reduction-based (analysis-oriented)** approaches: reduce the scope of new analysis to focus on parts impacted by the change, limiting reverification to impacted parts
- Related to **incremental algebraic program analysis (APA)**: computes a path expression summarizing program paths of interest, with incremental algorithms that reduce analysis time by leveraging intermediate results computed before program changes

---

## Synthesis

### Core Principles of Incremental Code Analysis

1. **Dependency graph tracking**: Every successful incremental system builds an explicit graph of dependencies between computations. Whether it's Salsa's query graph, Rust's dependency DAG, or Infer's procedure summaries, knowing what depends on what is the foundation.

2. **Demand-driven (lazy) evaluation**: Rather than eagerly recomputing everything that might be affected, the best systems (Salsa, Adapton, rust-analyzer) only recompute when a result is actually requested. This avoids wasted work on results that are never observed.

3. **Early cutoff / change absorption**: A changed input does not always produce a changed output. Parsing a file with an extra whitespace produces the same AST. The most effective systems detect when a recomputed result is the same as the cached one and stop propagating the change. This "shields" downstream computations.

4. **Compositionality**: Facebook's Infer demonstrates that designing analysis to be compositional (each procedure analyzed independently with a summary) makes incrementality natural. Changing one procedure only requires re-analyzing that procedure and combining its new summary.

5. **Content-addressable caching**: Systems like Turborepo and Bazel hash actual content rather than relying on timestamps. This enables cache reuse across machines, across time, and even when files are reverted.

### Architectural Patterns

| Pattern | Used By | Key Mechanism |
|---------|---------|---------------|
| Query-based DAG with memoization | rustc, rust-analyzer (Salsa) | Pure function queries, fingerprinted results, red-green validation |
| Compositional procedure summaries | Facebook Infer | Bi-abduction, separation logic, per-procedure summaries |
| Incremental parsing with tree reuse | Tree-sitter | GLR parsing, subtree sharing, on-demand lexing |
| Flat array + parallel local inference | Sorbet | GlobalState with 32-bit refs, read-only parallelism |
| Incremental database with cached baseline | CodeQL | Changed-code database merged with full cached database |
| Dirty-marking with demand propagation | Adapton | Mark dirty on mutation, recompute only when observed |
| File-level caching with content hashing | ESLint, build systems | Cache lint/compile results keyed by file content hash |

### Performance Numbers

| Tool | Metric | Result |
|------|--------|--------|
| Sorbet | Typechecking throughput | ~100K LOC/sec/core |
| Facebook Infer | Diff analysis time | 15-20 min target (including checkout + build) |
| CodeQL incremental | Scan time reduction | Up to 20% average, 58% for most impacted JS/TS scans |
| Path abstraction (FASE 2014) | Analysis speedup | Up to 32% reduction on 87 KLOC |
| ESLint --cache | Relint time | 5-10x faster after initial cache |

### Key Tradeoffs

- **Granularity vs. overhead**: Finer-grained tracking (per-expression vs per-file) gives better incrementality but adds bookkeeping cost. Rust's fingerprinting overhead makes incremental slower for clean builds.
- **Memory vs. speed**: Caching all intermediate results consumes significant memory/disk. Kotlin/Wasm found serialization overhead can exceed recompilation cost.
- **Correctness risk**: Incorrect dependency tracking leads to stale results. Systems must be conservative -- when in doubt, recompute. Excel's simple dirty-cell model is praised for its robustness.
- **Compositionality vs. precision**: Compositional analysis (like Infer) trades some precision for scalability and natural incrementality. Whole-program analyses are harder to incrementalize.

### Implications for Wazir

For a system that needs to analyze code changes during review:

1. **Diff-scoped analysis** (like Infer/CodeQL) is the most practical starting point -- only analyze changed files and their immediate dependents
2. **Content-hashed caching** of analysis results enables fast re-analysis when reviewing iterations of the same PR
3. **Compositional design** where each file/function produces a summary allows incremental updates without full re-analysis
4. **Tree-sitter** provides a ready-made incremental parsing layer that handles the lowest level (syntax) efficiently
5. **Lazy/demand-driven evaluation** prevents wasting compute on analysis results that are never requested by the reviewer
6. **Early cutoff** at the AST/type level prevents cosmetic changes from triggering expensive semantic re-analysis
