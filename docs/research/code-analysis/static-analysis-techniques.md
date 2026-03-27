# Static Code Analysis Techniques

> Research compiled 2026-03-25. Covers foundational techniques, modern tooling, and emerging LLM-hybrid approaches.

---

## Key Findings

1. **Static analysis is a mature discipline with a clear technique hierarchy.** The field spans a spectrum from lightweight pattern matching (linters) through heavyweight formal methods (abstract interpretation, model checking). Each level trades speed for precision.

2. **Data flow and taint analysis remain the backbone of security-focused static analysis.** Every major SAST tool (CodeQL, Semgrep, SonarQube, Snyk Code) relies on interprocedural data flow tracking to detect vulnerability classes like SQL injection, XSS, and command injection.

3. **AST-based analysis is the universal entry point.** All static analysis begins with parsing source code into an AST or CST. Tree-sitter has become the de facto multi-language parser, offering 40+ language grammars with incremental parsing and a 36x speedup over traditional parsers.

4. **CodeQL treats code as a queryable relational database.** This is the most expressive general-purpose static analysis approach available today, achieving 88% accuracy with a 5% false positive rate in benchmarks.

5. **Semgrep democratized custom rule writing.** Its pattern syntax mirrors the target language itself, eliminating the need to learn a separate query language. Taint mode, autofix, and constant propagation make it practical for both security and code quality.

6. **Abstract interpretation provides soundness guarantees.** Tools like Astree (used in Airbus avionics) and Facebook Infer (used at scale in Meta's code review pipeline) guarantee zero false negatives at the cost of false positives.

7. **Symbolic execution finds deep bugs but faces path explosion.** KLEE found 56 unknown bugs in GNU coreutils in 1 hour per binary. Hybrid approaches (concolic execution, static-guided symbolic execution) mitigate scalability problems.

8. **LLMs are emerging as static analysis augmenters, not replacements.** Research from 2024-2025 shows LLMs excel at false positive reduction (filtering noise from traditional tools) and taint specification inference, but underperform traditional tools on call-graph analysis. The hybrid LLM + traditional-tool approach is the current state of the art.

9. **Incremental and differential analysis solve the CI/CD speed problem.** Facebook Infer's compositional bi-abduction approach enables re-analysis of only changed procedures, making interprocedural analysis viable on every pull request.

10. **False positive management is the key adoption bottleneck.** The most effective mitigation combines tool-level precision tuning, LLM-based filtering, and delta-only reporting in code review workflows.

---

## Technique Taxonomy

### Level 1: Syntactic Analysis (Fastest, Least Precise)

#### 1.1 Pattern Matching / Linting

- **What it does:** Matches code against predefined textual or structural patterns.
- **How it works:** Regex-based or AST-pattern-based matching against rule sets.
- **Strengths:** Near-instant execution, easy rule authoring, high developer adoption.
- **Weaknesses:** No semantic understanding; high false positive/negative rates for complex bugs.
- **Tools:** ESLint (JavaScript), Pylint (Python), Clippy (Rust), Oxlint (50-100x faster ESLint alternative written in Rust), flake8 (Python).
- **Best for:** Style enforcement, simple anti-pattern detection, coding standard compliance.

#### 1.2 AST-Based Analysis

- **What it does:** Parses source code into an Abstract Syntax Tree and performs structural queries.
- **How it works:** Source code is parsed into a tree where each node represents a language construct (function declaration, if-statement, binary expression, etc.). Analysis traverses the tree to check structural properties.
- **Key distinction:** ASTs are *abstract* -- they omit syntactic details like parentheses and semicolons, retaining only semantic structure. Concrete Syntax Trees (CSTs), as produced by Tree-sitter, preserve full source fidelity.
- **Applications:**
  - Code clone detection (AST differencing)
  - Semantic code search
  - Refactoring and automated code transformation
  - IDE tooling (go-to-definition, rename, hover information)
- **Tools:**
  - **Tree-sitter** -- Incremental parser generator supporting 40+ languages; produces CSTs with error recovery; used by GitHub for online code navigation; 36x speedup over traditional parsers.
  - **Babel** (JavaScript AST), **Roslyn** (.NET AST), Python `ast` module, `go/ast` (Go).
- **Research:** "Abstract Syntax Tree for Programming Language Understanding and Representation: How Far Are We?" (arXiv:2312.00413) surveys AST applications in code understanding and ML.

#### 1.3 Semantic Pattern Matching (Semgrep-style)

- **What it does:** Combines AST-level pattern matching with lightweight semantic understanding (constant propagation, type awareness).
- **How it works:** Rules are written in a syntax that mirrors the target language. The engine parses both the rule pattern and the target code into ASTs, then performs structural matching with semantic extensions.
- **Key features:**
  - **Metavariables** (`$X`): Capture arbitrary code expressions for reuse in patterns.
  - **Ellipsis operator** (`...`): Matches zero or more arguments, statements, or expressions.
  - **Deep expression matching** (`<... pattern ...>`): Matches a pattern nested arbitrarily deep within an expression.
  - **Constant propagation**: Tracks known-constant values across assignments (cross-file in paid editions).
  - **Pattern combinators**: `patterns` (AND), `pattern-either` (OR), `pattern-not` (negation).
  - **Autofix**: The `fix:` key supports metavariable interpolation for automated remediation.
- **Strengths:** Low barrier to entry; rules look like the code they match; fast execution.
- **Weaknesses:** Limited interprocedural reasoning in open-source edition; no full data flow analysis without taint mode.

---

### Level 2: Data Flow and Control Flow Analysis (Core of SAST)

#### 2.1 Control Flow Analysis (CFA)

- **What it does:** Constructs a Control Flow Graph (CFG) representing all possible execution paths through a program.
- **How it works:** Basic blocks of sequential statements are identified, then connected by edges representing branches (if/else, loops, switch, exceptions, returns). The CFG is the foundation for most subsequent analyses.
- **Detects:**
  - Unreachable (dead) code
  - Infinite loops
  - Faulty conditions (branches that can never execute)
  - Exception handling paths that are never taken
  - Missing return statements
- **Tools:** Built into virtually all compilers and analysis frameworks (LLVM, GCC, JetBrains Qodana).

#### 2.2 Data Flow Analysis (DFA)

- **What it does:** Tracks how data values are defined, propagated, and used across the CFG.
- **How it works:** Operates over the CFG using fixed-point iteration. At each program point, computes sets of facts (e.g., "variable x may be uninitialized here"). Propagates facts forward (reaching definitions, available expressions) or backward (live variables, very busy expressions) along CFG edges.
- **Classic analyses:**
  - **Reaching definitions**: Which assignments to a variable can reach a given use?
  - **Live variable analysis**: Is a variable's value needed after this point?
  - **Available expressions**: Has an expression already been computed and not invalidated?
  - **Constant propagation**: Can a variable be replaced with a known constant?
- **Detects:** Uninitialized variables, null pointer dereferences, unused variables, dead stores, use-after-free.
- **Foundation for:** Taint analysis, type inference, compiler optimization, and all higher-level analyses.

#### 2.3 Taint Analysis

- **What it does:** Traces the flow of untrusted ("tainted") data from *sources* (user input, network data, file reads) through the program to *sinks* (dangerous operations like SQL queries, OS commands, HTML output).
- **How it works:** Flow-sensitive, interprocedural, and context-sensitive data flow analysis marks variables originating from sources as tainted, propagates taint through assignments and function calls, and flags any tainted value reaching a sink without passing through a *sanitizer*.
- **Vulnerability classes detected:**
  - SQL injection (tainted data reaches SQL query)
  - Cross-site scripting / XSS (tainted data reaches HTML output)
  - Command injection (tainted data reaches `exec`/`system`)
  - Path traversal (tainted data reaches file system operations)
  - SSRF (tainted data reaches HTTP request URLs)
- **Semgrep taint mode:** Enabled via `mode: taint` in YAML rules. Defines `pattern-sources`, `pattern-sinks`, and `pattern-sanitizers`. Supports metavariable-based `requires` expressions for fine-grained taint propagation control.
- **CodeQL taint tracking:** Extends data flow analysis with steps where values are not preserved but the insecure object is still propagated. Configured via a `TaintTracking::Configuration` class defining `isSource`, `isSink`, and `isSanitizer` predicates.
- **Limitations:** Prone to false positives when sanitizer logic is complex or when taint flows through reflection, serialization, or dynamic dispatch.

#### 2.4 Interprocedural Analysis

- **What it does:** Extends intraprocedural (single-function) analysis across procedure/function boundaries.
- **Prerequisite:** Call graph construction -- mapping each call site to the set of procedures it may invoke.
- **Call graph construction approaches:**
  - **Class Hierarchy Analysis (CHA)**: Resolves virtual calls using the class hierarchy. Fast but imprecise.
  - **Rapid Type Analysis (RTA)**: Restricts CHA to types that are actually instantiated in the program.
  - **Points-to analysis (Andersen's, Steensgaard's)**: Computes which heap objects each pointer variable may reference, enabling precise virtual dispatch resolution.
  - **Context-sensitive analysis**: Distinguishes different calling contexts to avoid merging unrelated data flows.
- **Scalability challenge:** Precise interprocedural analysis is expensive (often exponential). Facebook Infer solves this with compositional analysis via bi-abduction.
- **Tools:** PhASAR (C/C++ on LLVM IR), SVF (interprocedural value-flow analysis on LLVM), Tai-e (Java), CodeQL (multi-language).

---

### Level 3: Semantic and Formal Analysis (Most Precise, Most Expensive)

#### 3.1 Abstract Interpretation

- **What it does:** Approximates the semantics of a program by computing over abstract domains instead of concrete values, guaranteeing soundness (no false negatives).
- **Theoretical foundation:** Based on Galois connections between concrete and abstract domains over lattices. Introduced by Patrick and Radhia Cousot (1977).
- **How it works:**
  1. Choose an abstract domain (e.g., intervals, octagons, polyhedra).
  2. Define abstract transfer functions for each program operation.
  3. Compute a fixed point over the abstract domain using iterative analysis.
  4. Apply *widening operators* to guarantee termination when the abstract domain has infinite height.
- **Abstract domains (increasing precision and cost):**
  - **Signs domain**: Variables are positive, negative, or zero. Cheapest, least precise.
  - **Interval domain** (`[a, b]`): Variables bounded by numeric intervals. Fast, non-relational.
  - **Octagon domain** (`+/-x +/-y <= c`): Captures pairwise linear relationships between variables. Moderate cost.
  - **Polyhedra domain** (linear inequalities over all variables): Full relational precision. Expensive.
  - **Interval polyhedra** (`itvPol`): Hybrid domain that can express certain non-convex properties.
- **Guarantees:** Sound (every real error is reported). May produce false positives. *Never misses a bug in the abstracted domain.*
- **Detects:** Division by zero, arithmetic overflow, array bounds violations, null dereferences, uninitialized memory access, dead code, shared-variable race conditions.
- **Key tools:**
  - **Astree**: Used by Airbus for flight control software certification. Checks for the absence of all runtime errors in embedded C.
  - **Facebook Infer**: Uses separation logic and bi-abduction for compositional, incremental analysis at scale (see 3.2).
  - **Polyspace** (MathWorks): Abstract interpretation for C/C++ in safety-critical systems (automotive, medical).
- **Limitations:** False positives from over-approximation; struggles with highly dynamic language features (reflection, `eval`, dynamic typing).

#### 3.2 Separation Logic and Bi-Abduction (Facebook Infer)

- **What it does:** Enables compositional (per-procedure) analysis of heap-manipulating programs.
- **How it works:**
  - **Separation logic** allows reasoning about disjoint memory regions independently. The "separating conjunction" (`P * Q`) asserts that heap can be split into two disjoint parts satisfying P and Q respectively.
  - **Bi-abduction** automatically infers both the precondition (what memory the procedure needs) and the frame (what memory is untouched). This enables analyzing each procedure independently without knowing its callers.
  - **Compositional analysis**: Procedure summaries computed once; reused across all call sites. Only re-analyzed when the procedure itself changes.
- **Scale:** Deployed at Meta, analyzing millions of lines of code on every diff. Reports findings as automated comments on code reviews.
- **Detects:** Null dereferences, memory leaks, use-after-free, thread-safety violations, resource leaks.
- **History:** Developed from academic research by Calcagno, Distefano, and O'Hearn (Monoidics, acquired by Facebook in 2013; open-sourced 2015).

#### 3.3 Symbolic Execution

- **What it does:** Executes programs with symbolic (not concrete) inputs, exploring all feasible execution paths and using constraint solvers to determine path feasibility.
- **How it works:**
  1. Replace concrete inputs with symbolic variables.
  2. At each branch, fork execution and add the branch condition (or its negation) to the path constraint.
  3. Use an SMT solver (STP, Z3) to check satisfiability of path constraints.
  4. If a path leads to an assertion violation and the constraint is satisfiable, generate a concrete test case triggering the bug.
- **Concolic (concrete + symbolic) execution:** Runs the program concretely while collecting symbolic constraints alongside. Uses concrete values to guide exploration and handle blackbox calls. Alternates between concrete and symbolic phases.
- **Path explosion mitigation strategies:**
  - Random path selection or coverage-guided heuristics
  - Path summarization (analyze functions/loops statically)
  - Path merging (combine similar execution states)
  - Chopped symbolic execution (focus on slices relevant to the bug)
  - LLM-generated ghost code to defuse logic bombs
- **Detects:** Buffer overflows, null pointer dereferences, integer overflows, assertion violations, division by zero, use-after-free.
- **Key tools:**
  - **KLEE**: Operates on LLVM IR; found 56 unknown bugs in GNU coreutils in 1 hour per binary (2008). Uses STP solver.
  - **S2E**: Selective symbolic execution -- mixes concrete and symbolic execution.
  - **angr**: Python framework for binary analysis with symbolic execution.
  - **CBMC**: Bounded model checker for C/C++; unrolls loops to a given depth and encodes as SAT/SMT formula.
  - **Sys**: Combines static analysis with targeted symbolic execution for browser code.
- **Limitations:** Path explosion (exponential in program size), constraint solver timeouts, difficulty with complex data structures and system calls.

#### 3.4 Bounded Model Checking

- **What it does:** Verifies program properties by unrolling loops to a bounded depth and encoding the entire program as a Boolean satisfiability (SAT) or SMT formula.
- **How it works:**
  1. Unroll all loops up to a specified bound *k*.
  2. Translate the unrolled program + negated property into a propositional formula.
  3. Feed to a SAT/SMT solver. If satisfiable, a counterexample (bug) exists.
- **Key tool -- CBMC:**
  - Supports C89, C99, most of C11/C17, plus GCC/Clang/MSVC extensions.
  - Bit-precise translation (models actual integer widths and overflow behavior).
  - Verifies memory safety, undefined behavior, and user-specified assertions.
  - Used to verify parts of the Linux kernel.
  - Variant JBMC handles Java bytecode.
- **Strengths:** Precise (bit-level accuracy), automated (no annotations needed), produces concrete counterexamples.
- **Weaknesses:** Completeness limited by loop bound; does not verify unbounded loops.

#### 3.5 Type Inference and Type Checking

- **What it does:** Automatically deduces types of expressions (inference) or verifies that declared types are consistent with usage (checking).
- **Relationship to static analysis:**
  - Type checking is a form of static analysis performed by every typed-language compiler.
  - Type inference extends this to reconstruct types when declarations are missing (e.g., Hindley-Milner inference in ML/Haskell, TypeScript type inference).
  - Advanced type systems (dependent types, refinement types, linear types) encode deeper properties, blurring the line between type checking and full program verification.
- **Applications in static analysis:**
  - Reconstructing type declarations in partial/incomplete programs to enable further analysis.
  - Improving precision of other analyses (e.g., more precise call graph via type-aware virtual dispatch resolution).
  - Practical type-based taint checking (using type qualifiers to track tainted vs. clean data).
  - TypeScript's flow-sensitive type narrowing is a form of data flow analysis.
- **Tools:** TypeScript compiler, mypy (Python), Sorbet (Ruby), Flow (JavaScript), GHC (Haskell).
- **LLM comparison:** Studies show LLMs demonstrate higher accuracy than traditional methods in type inference for dynamically-typed languages (Python), but exhibit limitations in call-graph analysis.

---

## Modern Tools

### Tier 1: General-Purpose SAST Platforms

| Tool | Approach | Languages | Key Strength | Accuracy / FP Rate |
|------|----------|-----------|-------------|-------------------|
| **CodeQL** (GitHub) | Code-as-database + QL query language | C/C++, C#, Go, Java, Kotlin, JS, Python, Ruby, TS, Swift | Most expressive query language; deep taint tracking | 88% accuracy, 5% FP |
| **Semgrep** (Semgrep Inc.) | Semantic pattern matching + taint mode | 30+ languages | Easiest custom rule authoring; YAML rules mirror code | 82% accuracy, 12% FP |
| **SonarQube** (SonarSource) | Multi-technique (DFA, CFA, pattern matching) | 35+ languages + IaC | Code quality + security in one platform; architecture analysis | Mature, widely adopted |
| **Snyk Code** (Snyk) | AI/ML-trained engine | 15+ languages | Fastest results (seconds); learns from real-world code | 85% accuracy, 8% FP |

### Tier 2: Specialized / Research Tools

| Tool | Technique | Domain |
|------|-----------|--------|
| **Facebook Infer** | Abstract interpretation + bi-abduction + separation logic | Memory safety, concurrency (Java, C, C++, Obj-C) |
| **Astree** | Abstract interpretation (interval/octagon/polyhedra domains) | Safety-critical embedded C (aerospace, automotive) |
| **Polyspace** (MathWorks) | Abstract interpretation | Automotive/medical embedded C/C++ |
| **KLEE** | Symbolic execution on LLVM IR | Deep bug finding in C/C++ |
| **CBMC** | Bounded model checking | C/C++ formal verification |
| **angr** | Binary-level symbolic execution | Reverse engineering, binary analysis |
| **Cppcheck** | Pattern matching + data flow | C/C++ bug finding |

### Tier 3: Language-Specific Linters

| Tool | Language | Focus |
|------|----------|-------|
| **ESLint** | JavaScript/TypeScript | Style, anti-patterns, basic bug detection |
| **Oxlint** | JavaScript/TypeScript | 50-100x faster ESLint alternative (Rust-based) |
| **Pylint** / **flake8** | Python | Style, error detection, code smells |
| **Clippy** | Rust | Idiomatic Rust patterns, common mistakes |
| **rust-analyzer** | Rust | IDE analysis, type inference, refactoring |
| **Sorbet** | Ruby | Gradual type checking |
| **mypy** | Python | Static type checking |

### Tier 4: Emerging LLM-Hybrid Tools

| Tool / Approach | Method | Status |
|----------------|--------|--------|
| **IRIS** (arXiv:2405.17238) | LLM-assisted taint specification inference + whole-repo reasoning | Research (2024) |
| **ZeroFalse** (arXiv:2510.02534) | LLM-based false positive filtering for traditional SAST output | Research (2025) |
| **LLM4FPM** | Context-enriched LLM filtering using eCPG-Slicer + call chain analysis | Research (2025) |
| **GPT-4o + SonarQube** | LLM auto-remediation of SAST-detected code smells | Research (2025) |

---

## Emerging Trends (2024-2025)

### LLM + Traditional Tool Hybrid Approaches

The most promising direction combines traditional static analysis (high recall, structured reasoning) with LLMs (semantic understanding, natural language explanations):

- **LLMs as false positive filters:** Traditional tools report candidates; LLMs reason about context, sanitizers, and data flow to suppress false positives. This preserves recall while improving precision.
- **LLMs as taint specification generators:** Instead of manually writing source/sink/sanitizer specifications, LLMs infer them from API documentation and code context (IRIS approach).
- **LLMs for code review explanation:** Generate human-readable explanations of why a static analysis finding matters and how to fix it.
- **Limitation:** LLMs underperform traditional tools on structured tasks like call-graph construction and precise data flow tracking. They hallucinate paths that do not exist. The hybrid approach is strictly superior to LLM-only analysis.

### Incremental and Differential Analysis

- **Incremental analysis:** Maintains analysis artifacts from prior runs; only re-analyzes changed files and their dependents. Facebook Infer's bi-abduction approach is the gold standard.
- **Differential analysis:** Uses VCS (Git) metadata to identify changed files; leverages cached system context from full-build analysis servers to provide full-system-equivalent results while analyzing only the delta. Critical for CI/CD integration where analysis must complete in minutes, not hours.
- **Delta-only reporting:** Show only new/changed findings in pull request reviews, not the full backlog. Reduces cognitive load and prevents "alert fatigue."

### Architecture-as-Code Analysis

SonarQube (2025) introduced architecture analysis that automatically extracts code structure (classes, modules, dependencies), validates against declared architecture constraints (YAML/JSON), and raises issues when code diverges from intended architecture. Currently Java-only.

---

## Sources (with URLs)

### Surveys and Research Papers

- [Static Code Analysis for IoT Security: A Systematic Literature Review (ACM Computing Surveys)](https://dl.acm.org/doi/10.1145/3745019)
- [A Systematic Survey on Large Language Models for Static Code Analysis (ARO 2025)](https://aro.koyauniversity.org/index.php/aro/article/view/2082)
- [An Empirical Study of Static Analysis Tools for Secure Code Review (ISSTA 2024)](https://dl.acm.org/doi/10.1145/3650212.3680313)
- [Static Analysis Techniques for Embedded Systems: A Comprehensive Survey (MDPI Electronics)](https://www.mdpi.com/2079-9292/15/5/918)
- [The Emergence of LLMs in Static Analysis: A First Look through Micro-Benchmarks (FORGE 2024)](https://dl.acm.org/doi/10.1145/3650105.3652288)
- [IRIS: LLM-Assisted Static Analysis for Detecting Security Vulnerabilities (arXiv:2405.17238)](https://arxiv.org/abs/2405.17238)
- [AST for Programming Language Understanding: How Far Are We? (arXiv:2312.00413)](https://arxiv.org/abs/2312.00413)
- [Scaling Symbolic Execution to Large Software Systems (arXiv:2408.01909)](https://arxiv.org/abs/2408.01909)
- [Symbolic Execution in Practice: A Survey (arXiv:2508.06643)](https://arxiv.org/pdf/2508.06643)
- [Reducing False Positives in Static Bug Detection with LLMs (arXiv:2601.18844)](https://arxiv.org/html/2601.18844v1)
- [ZeroFalse: Improving Precision in Static Analysis with LLMs (arXiv:2510.02534)](https://www.arxiv.org/pdf/2510.02534)
- [LLMs for Source Code Analysis: Applications, Models and Datasets (arXiv:2503.17502)](https://arxiv.org/html/2503.17502v1)
- [A Dual Perspective Review on LLMs and Code Verification (Frontiers 2025)](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1655469/full)
- [The Octagon Abstract Domain (arXiv:cs/0703084)](https://arxiv.org/pdf/cs/0703084)
- [CBMC: The C Bounded Model Checker (arXiv:2302.02384)](https://arxiv.org/abs/2302.02384)
- [Type Inference for C: Applications to Static Analysis of Incomplete Programs (ACM TOPLAS)](https://dl.acm.org/doi/10.1145/3421472)

### Tool Documentation and Tutorials

- [CodeQL Zero to Hero Part 1: Fundamentals (GitHub Blog)](https://github.blog/developer-skills/github/codeql-zero-to-hero-part-1-the-fundamentals-of-static-analysis-for-vulnerability-research/)
- [CodeQL Zero to Hero Part 2: Getting Started (GitHub Blog)](https://github.blog/developer-skills/github/codeql-zero-to-hero-part-2-getting-started-with-codeql/)
- [About CodeQL (Official Docs)](https://codeql.github.com/docs/codeql-overview/about-codeql/)
- [CodeQL Data Flow Analysis (Official Docs)](https://codeql.github.com/docs/writing-codeql-queries/about-data-flow-analysis/)
- [Semgrep Rule Pattern Syntax (Official Docs)](https://semgrep.dev/docs/writing-rules/pattern-syntax)
- [Semgrep Taint Analysis (Official Docs)](https://semgrep.dev/docs/writing-rules/data-flow/taint-mode/overview)
- [Semgrep Autofix (Official Docs)](https://semgrep.dev/docs/writing-rules/autofix)
- [SonarQube Design and Architecture Overview (Sonar Docs 2025.3)](https://docs.sonarsource.com/sonarqube-server/2025.3/design-and-architecture/overview)
- [Facebook Infer: Separation Logic and Bi-Abduction (Official Docs)](https://fbinfer.com/docs/separation-logic-and-bi-abduction/)
- [CBMC: C Bounded Model Checker (Official)](https://www.cprover.org/cbmc/)
- [Tree-sitter: Using Parsers (Official Docs)](https://tree-sitter.github.io/tree-sitter/using-parsers/)
- [Python ast Module (Official Docs)](https://docs.python.org/3/library/ast.html)
- [Clang Data Flow Analysis Introduction (Official Docs)](https://clang.llvm.org/docs/DataFlowAnalysisIntro.html)

### Reference and Community

- [OWASP: Static Code Analysis](https://owasp.org/www-community/controls/Static_Code_Analysis)
- [Abstract Interpretation in a Nutshell (Cousot)](https://www.di.ens.fr/~cousot/AI/IntroAbsInt.html)
- [Abstract Interpretation (Wikipedia)](https://en.wikipedia.org/wiki/Abstract_interpretation)
- [Data-flow Analysis (Wikipedia)](https://en.wikipedia.org/wiki/Data-flow_analysis)
- [Control-flow Analysis (Wikipedia)](https://en.wikipedia.org/wiki/Control_flow_analysis)
- [AST Parsing at Scale: Tree-sitter Across 40 Languages (Dropstone)](https://www.dropstone.io/blog/ast-parsing-tree-sitter-40-languages)
- [JetBrains Qodana: Control and Data Flow Analysis](https://www.jetbrains.com/pages/static-code-analysis-guide/control-data-flow-analysis/)
- [JetBrains Qodana: What is Taint Analysis?](https://www.jetbrains.com/pages/static-code-analysis-guide/what-is-taint-analysis/)
- [Finding Inter-Procedural Bugs at Scale with Infer (Meta Engineering)](https://engineering.fb.com/2017/09/06/android/finding-inter-procedural-bugs-at-scale-with-infer-static-analyzer/)
- [Awesome Static Analysis (GitHub, curated list)](https://github.com/analysis-tools-dev/static-analysis)
- [Demystifying Differential and Incremental Analysis (SD Times)](https://sdtimes.com/devops/demystifying-differential-and-incremental-analysis-for-static-code-analysis-within-devops/)
- [Best AI Code Security Tools 2025: Comparison (sanj.dev)](https://sanj.dev/post/ai-code-security-tools-comparison)
- [Static Code Analysis: Top 7 Methods (Oligo Security)](https://www.oligo.security/academy/static-code-analysis)

---

## Actionable Insights

### For Wazir's Review and Context System

1. **Layer static analysis into the review pipeline.** Use a tiered approach:
   - **Fast lane (seconds):** Semgrep with custom YAML rules for project-specific anti-patterns, plus language-specific linters (ESLint, Pylint, Clippy). Run on every save/pre-commit.
   - **Standard lane (minutes):** CodeQL or SonarQube for interprocedural data flow and taint analysis. Run on every PR.
   - **Deep lane (on-demand):** Symbolic execution or model checking for critical code paths. Run on release candidates or security-sensitive changes.

2. **Use Tree-sitter for universal AST access.** With 40+ language grammars and incremental parsing, Tree-sitter is the ideal foundation for any multi-language code understanding system. It can power:
   - Semantic code indexing for AI agents
   - Scope-aware context extraction
   - Structural diff computation (beyond line-level diffs)

3. **Adopt Semgrep for custom rule authoring.** The YAML rule format that mirrors target code is dramatically easier to learn than CodeQL's QL language. For a Wazir review skill:
   - Write project-specific rules as YAML in the repo
   - Use taint mode for security-relevant flows
   - Use autofix for mechanical remediation

4. **Implement delta-only analysis in code review workflows.** Following Facebook Infer's model:
   - Cache analysis results per procedure/function
   - On code change, re-analyze only changed functions and their callers
   - Report only *new* findings in review comments, not pre-existing technical debt

5. **Use LLMs as a precision layer on top of traditional analysis.** The research consensus is clear: LLMs should not replace SAST tools but should filter their output:
   - Feed SAST findings + surrounding code context to the LLM
   - Ask the LLM to classify each finding as true positive, false positive, or needs-investigation
   - Generate human-readable fix suggestions for confirmed true positives

6. **Encode architectural constraints as static analysis rules.** Following SonarQube 2025's architecture-as-code approach:
   - Define module boundaries and allowed dependency directions in a config file
   - Use static analysis to enforce that code changes do not violate architectural constraints
   - Surface violations as review comments alongside bug/vulnerability findings

7. **Track precision/recall metrics for analysis rules.** Every custom rule should be measured:
   - **Precision** = true positives / (true positives + false positives) -- "when we flag, are we right?"
   - **Recall** = true positives / (true positives + false negatives) -- "do we catch everything?"
   - Target > 80% precision for developer-facing alerts (below this, alert fatigue kills adoption)
   - Accept lower precision for security-critical vulnerability classes (better to over-report than miss)

8. **Consider interprocedural taint tracking for AI-generated code review.** When an AI agent reviews a PR, it should trace data flows across function boundaries, not just look at the diff in isolation. CodeQL's approach of building a relational database of the entire codebase and querying it is the most powerful model for this. Semgrep's cross-file taint analysis (Pro edition) is a more accessible alternative.
