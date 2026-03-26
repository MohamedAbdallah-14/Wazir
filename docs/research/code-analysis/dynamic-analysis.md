# 27 - Code Execution Analysis

Research into dynamic code analysis, execution-based program understanding, and how runtime
information complements static analysis for code review and quality assurance.

---

## Source 1: Dynamic Program Analysis (Wikipedia)

**URL:** https://en.wikipedia.org/wiki/Dynamic_program_analysis

- Dynamic program analysis is the act of analyzing software by executing the program, as opposed to static analysis which does not execute it
- Analysis can focus on behavior, test coverage, performance, and security
- Key techniques catalogued under dynamic analysis:
  - **Code coverage**: Computing test code coverage identifies code that is not tested; tools include mutation testing
  - **Dynamic symbolic execution (concolic execution)**: Executes a program on concrete input while collecting symbolic path constraints, then uses SMT solvers to generate new inputs that explore different control-flow paths
  - **Dynamic data-flow analysis**: Tracks information flow from sources to sinks; includes dynamic taint analysis
  - **Memory error detection**: Runtime detection of buffer overflows, use-after-free, memory leaks (Valgrind, sanitizers)
  - **Fuzzing**: Providing invalid, unexpected, or random input to discover crashes and vulnerabilities
  - **Performance analysis**: Profiling execution time, memory usage, and function call frequency
- Dynamic analysis is more precise than static analysis at handling runtime features like dynamic binding, polymorphism, and threads
- Fundamental limitation: dynamic analysis can only observe executed paths, so code coverage is inherently incomplete unless combined with exhaustive input generation

---

## Source 2: Static Analysis vs Dynamic Analysis (Parasoft)

**URL:** https://www.parasoft.com/blog/static-analysis-and-dynamic-analysis/

- **Static analysis** examines code without executing it; catches issues early, examines all possible paths and variable values, and can reveal errors that may not manifest for weeks or years
- **Dynamic analysis** tests behavior during execution; reveals subtle defects whose cause is too complex for static analysis to discover
- Static analysis prevents defects before runtime by tracing data flow to detect buffer overflows, null pointer dereferences, and missing input validation
- Dynamic analysis detects memory leaks, performance bottlenecks, and concurrency problems that only appear during execution
- The two approaches are complementary: no single approach finds every error
- Best practice: start with static analysis in the IDE/CI pipeline to prevent bad code from progressing, then use dynamic analysis during QA/staging for runtime-specific issues
- Static analysis has higher false-positive rates; dynamic analysis requires representative test inputs to achieve useful coverage

---

## Source 3: Profiling, Tracing, and Instrumentation (Wikipedia + Vanderbilt/Waddington)

**URL:** https://en.wikipedia.org/wiki/Profiling_(computer_programming)
**URL:** https://www.dre.vanderbilt.edu/~schmidt/PDF/DSIS_Chapter_Waddington.pdf

- **Profiling** measures space/time complexity, instruction usage, and frequency/duration of function calls; counts how many times each basic block executes
- Profiler techniques: event-based, statistical sampling, instrumented, and simulation methods
- **Tracing** records the sequence of basic blocks traversed during execution; can generate UML sequence diagrams from runtime interactions
- **Instrumentation** adds instructions to the target program to collect information:
  - *Source-level*: automated via source-to-source transformation frameworks (TXL, Stratego, DMS)
  - *Binary*: modifies compiled binary directly (Rational Purify, Quantify)
  - *Dynamic/JIT*: performed after loading into memory, immediately before execution; can selectively add/remove profiling without recompilation
- Instrumentation causes performance overhead and may lead to probe effects (altered timing can mask or introduce bugs)
- Trade-off: more detailed instrumentation yields better insight but higher overhead; statistical sampling reduces overhead at the cost of precision

---

## Source 4: Execution Trace Analysis (Quarkslab Blog)

**URL:** https://blog.quarkslab.com/exploring-execution-trace-analysis.html

- Dynamic analysis unveils actual program behavior and provides direct access to execution flow and data, making it powerful for reverse engineering
- Two trace analysis paradigms:
  - *On-line*: information consumed immediately during execution
  - *Off-line*: execution trace stored for later analysis
- **QBDI** (QuarkslaB Dynamic binary Instrumentation): monitors memory accesses, provides API to retrieve addresses and data read/written; recovers memory content unattainable by static analysis
- **REVEN** (Tetrane): timeless debugging platform that records entire VM execution, then provides GUI + Python API access to all CPU instructions, memory, and registers for all processes and kernel modules
- Execution trace analysis is particularly powerful for reversing obfuscated binaries; demonstrated on crackmes and Tigress (obfuscation tool)
- Trace diffing: comparing two execution traces (e.g., correct vs incorrect input) isolates behavioral differences, aiding vulnerability research

---

## Source 5: Sanitizers vs Valgrind (Daniel Lemire's Blog + Red Hat Developer)

**URL:** https://lemire.me/blog/2019/05/16/building-better-software-with-better-tools-sanitizers-versus-valgrind/
**URL:** https://developers.redhat.com/blog/2021/05/05/memory-error-checking-in-c-and-c-comparing-sanitizers-and-valgrind

- **Valgrind** uses dynamic binary translation (JIT rewriting of each basic block); works on unmodified binaries without recompilation; 10x-565x slowdown
- **Sanitizers** (ASan, MSan, TSan, LSan) use compile-time instrumentation (LLVM passes) + runtime library replacements (e.g., malloc); 2x-15x slowdown
- Detection capabilities comparison:
  - ASan detects heap/stack/global buffer overflows, use-after-free, use-after-return, double-free; Valgrind misses stack and global out-of-bounds errors
  - MSan detects uninitialized memory reads (bit-exact tracking); Valgrind also catches these
  - TSan detects data races via tracking all synchronization operations; Valgrind's Helgrind provides similar capability
  - LSan detects memory leaks; Valgrind's memcheck also finds leaks
- Sanitizers are better for multi-threaded applications and have lower overhead
- Valgrind requires no source code access and no recompilation; works on any binary
- **Recommendation from both sources**: use both -- run tests with sanitizers routinely, run Valgrind periodically to catch what sanitizers miss

---

## Source 6: Coverage-Guided Fuzzing -- AFL and libFuzzer (LLVM Docs + Google/AFL)

**URL:** https://llvm.org/docs/LibFuzzer.html
**URL:** https://github.com/google/AFL
**URL:** https://www.fuzzingbook.org/html/GreyboxFuzzer.html

- **libFuzzer**: in-process, coverage-guided fuzzer linked directly with library under test; feeds fuzzed inputs via a target function, tracks code coverage, generates mutations to maximize coverage
- **AFL (American Fuzzy Lop)**: brute-force fuzzer with instrumentation-guided genetic algorithm; uses modified edge coverage to detect subtle control-flow changes
- The feedback loop:
  1. Execute mutated input on instrumented binary
  2. Collect coverage signal (edge coverage, edge counters, value profiles)
  3. If input triggers new coverage, add to corpus
  4. Mutate corpus entries to generate next round of inputs
- AFL injects code after every conditional jump to assign branch unique IDs and increment hit counters; maintains coarse branch hit counts for efficiency
- AFL algorithm: load initial seeds, trim to minimal size preserving behavior, repeatedly mutate with traditional fuzzing strategies, save state-transition-triggering mutations to queue
- Coverage-guided fuzzing has found thousands of real-world bugs in production software (Chrome, Firefox, OpenSSL, Linux kernel)
- **White-box fuzzing** (SAGE at Microsoft): combines fuzzing with symbolic execution; found >30% of bugs fixed in Windows 7 before release; runs on 200+ machines 24/7 at Microsoft

---

## Source 7: Dynamic Symbolic Execution -- KLEE and SAGE (Academic)

**URL:** https://srg.doc.ic.ac.uk/files/slides/symex-tarot-18.pdf
**URL:** https://users.ece.cmu.edu/~aavgerin/papers/Oakland10.pdf
**URL:** https://github.com/klee/klee

- **Dynamic symbolic execution (DSE)** simultaneously executes concrete values and maintains symbolic constraints along execution paths
- Concrete execution directs control flow; symbolic execution collects constraints for conditional branches; negating constraints generates inputs for alternative paths
- **KLEE** (LLVM-based symbolic VM): found 56 previously unknown bugs in GNU coreutils within 1 hour per binary (2008); used by Micro Focus Fortify, NVIDIA, IBM
- **SAGE** (Microsoft): concolic execution engine that found >30% of all bugs fixed before Windows 7 release; standard part of Microsoft's internal testing pipeline
- Schwartz, Avgerinos, and Brumley (IEEE S&P 2010) formalized dynamic taint analysis and forward symbolic execution as extensions to runtime semantics; applications include malware analysis, input filter generation, test case generation, and vulnerability discovery
- Key challenge: path explosion -- number of paths grows exponentially with program branches; heuristics (search strategies, path merging, state pruning) are essential
- Constraint solving is the bottleneck; modern SMT solvers (Z3, STP) have dramatically improved feasibility

---

## Source 8: Property-Based Testing as Execution Analysis (Hypothesis + QuickCheck)

**URL:** https://hypothesis.works/articles/what-is-property-based-testing/
**URL:** https://typeable.io/blog/2021-08-09-pbt.html
**URL:** https://medium.com/criteo-engineering/introduction-to-property-based-testing-f5236229d237

- **Property-based testing (PBT)** specifies logical properties a function should satisfy, then automatically generates random inputs to search for counterexamples
- Operates as a form of dynamic analysis: systematically explores program execution through randomized input generation
- **QuickCheck** (Haskell, 2000): pioneered PBT; generates test cases to falsify assertions, then shrinks counterexamples to minimal failing subsets
- **Hypothesis** (Python): takes a different approach with explicit state management during test execution; allows dynamic manipulation of shrinking state and value generation dependent on previously observed values
- **Shrinking**: when a counterexample is found, the framework reduces the input to the smallest value that still triggers the failure; essential for diagnosis
- PBT finds edge cases and corner cases that hand-written example tests miss because it explores far more of the input space
- PBT bridges testing and specification: properties serve as executable specifications that are continuously validated against runtime behavior
- Frameworks exist for most languages: QuickCheck (Haskell/Erlang), Hypothesis (Python), fast-check (JS/TS), test.check (Clojure), ScalaCheck (Scala), Hedgehog (Haskell), jqwik (Java)
- Key distinction from unit tests: PBT tests *properties* (invariants, postconditions, round-trip laws) rather than specific input/output pairs

---

## Source 9: Code Coverage at Google (Ivankovic et al., ESEC/FSE 2019)

**URL:** https://dl.acm.org/doi/10.1145/3338906.3340459
**URL:** https://homes.cs.washington.edu/~rjust/publ/google_coverage_fse_2019.pdf

- Google computes code coverage for **1 billion lines of code daily** across 7 programming languages
- Coverage infrastructure has four layers:
  1. Language-specific coverage libraries (gcov, Istanbul/NYC, Coverage.py, etc.)
  2. Automation layer integrating coverage into build/test workflows
  3. Integration layer connecting to development tools
  4. Visualization layer displaying coverage in code editors and review tools
- Key insight: making coverage actionable requires applying it at the **changeset and code review level**, not just aggregate project metrics
- Despite coverage not being mandatory at Google, adoption grew steadily; by Q1 2018, >90% of projects used automated coverage tools
- Coverage is displayed directly in the code review UI, highlighting changed lines that lack test coverage
- Finding: developers who see coverage data during review are significantly more likely to add tests for uncovered code
- The paper validates that code coverage, when integrated into developer workflow, is a lightweight dynamic analysis that improves code quality at scale

---

## Source 10: AppMap -- Runtime Code Review for Every Pull Request

**URL:** https://appmap.io/
**URL:** https://dev.to/appmap/announcing-appmap-for-github-runtime-code-reviews-for-every-pull-request-47km
**URL:** https://thenewstack.io/appmap-releases-runtime-code-review-as-a-github-action/

- AppMap is an open-source dynamic runtime code analysis tool that records code execution traces and renders them as interactive diagrams in the code editor
- Records HTTP requests, function calls, SQL queries, and other runtime events while the application runs
- Depicts information as navigable diagrams showing how functions, web APIs, databases, security, I/O, and other services interact
- **Runtime code review**: reviews code using actual runtime behavior rather than static rules; catches bugs, misunderstandings, flawed behavior, and edge cases before human review
- Available as a GitHub Action for automated runtime code review on every pull request
- Detects runtime-only issues: failed tests, API changes, security flaws (deprecated crypto, improper session management, unauthorized access), performance issues (N+1 queries, slow functions, sluggish HTTP)
- Works with Rails, Django, Flask, Express, Spring; compatible with Ruby, Java, Python, Node.js
- Represents a new category: **dynamic analysis integrated into code review workflow**, bridging the gap between testing and review

---

## Source 11: Systematic Survey of Program Comprehension through Dynamic Analysis (Cornelissen et al., IEEE TSE 2009)

**URL:** https://ieeexplore.ieee.org/document/4815280/
**URL:** https://repository.tudelft.nl/file/File_b091c7ab-5e92-43d4-ab45-42ffc3991664

- Systematic literature survey examining program comprehension through dynamic analysis
- Reviewed 4,795 articles from 14 venues (July 1999 -- June 2008); selected 176 articles
- Characterized research along four facets:
  1. **Activity**: what the developer is trying to do (understand architecture, locate features, debug, etc.)
  2. **Target**: what is being analyzed (execution traces, call graphs, object interactions)
  3. **Method**: how dynamic analysis is applied (trace collection, visualization, abstraction, pattern matching)
  4. **Evaluation**: how the approach is validated (case studies, controlled experiments, surveys)
- Key finding: dynamic analysis is particularly effective for **feature location** (finding which code implements a specific feature) and **architecture recovery** (understanding how components interact at runtime)
- Execution trace visualization (sequence diagrams, call trees, interaction diagrams) is the dominant method for communicating dynamic analysis results to developers
- Challenge: execution traces are massive; abstraction and filtering techniques (trace summarization, pattern detection, trace comparison) are essential for practical use

---

## Source 12: Curated List of Dynamic Analysis Tools (analysis-tools-dev/dynamic-analysis)

**URL:** https://github.com/analysis-tools-dev/dynamic-analysis

- Community-maintained curated list of dynamic analysis tools for all programming languages, binaries, and more
- Focus on tools that improve code quality: linters, formatters, profilers, sanitizers, fuzzers, and coverage tools
- Organized by language and category; companion website at analysis-tools.dev adds rankings and user comments
- Notable tools catalogued (representative sample):
  - **Memory analysis**: Valgrind, Dr. Memory, bytehound, ASan/MSan/LSan
  - **Fuzzing**: AFL/AFL++, libFuzzer, hongfuzz, Jazzer (Java), go-fuzz
  - **Symbolic execution**: KLEE, S2E, angr, Manticore
  - **Coverage**: gcov/lcov, Istanbul/NYC, Coverage.py, JaCoCo
  - **Profiling**: perf, gprof, Callgrind, async-profiler, py-spy
  - **Binary analysis**: QBDI, DynamoRIO, Intel Pin, Frida
  - **Concurrency**: TSan, Helgrind, Go race detector
- The breadth of the list demonstrates that dynamic analysis is a mature, multi-faceted discipline with dedicated tooling for every major language and analysis category

---

## Source 13: Delivery Guardrails for AI-Generated Code (Datadog Blog, 2025)

**URL:** https://www.datadoghq.com/blog/delivery-guardrails-for-ai-generated-code/

- Datadog engineers "vibe coded" a path tracer using AI, then used static and dynamic analysis to fix correctness, performance, and security issues
- **Vibe coding** produces code fast but often not performant, accurate, or secure enough for production
- With proper delivery guardrails (automated checks), AI-generated code can be corrected to meet existing quality standards
- Guardrails split into two categories:
  - **Static analysis**: linters, type checkers, proof checkers, safety checkers
  - **Dynamic analysis**: profiling, benchmarking, runtime error detection, fuzzing
- **Microbenchmarking** measures performance with high confidence and provides quick feedback on whether changes improve or degrade performance
- Key insight for code review: dynamic analysis is especially important for AI-generated code because AI models may produce code that passes static checks but fails at runtime (incorrect algorithms, performance regressions, resource leaks)
- The combination of static + dynamic guardrails creates a safety net that allows faster iteration with AI while maintaining code quality

---

## Synthesis

### What is Code Execution Analysis?

Code execution analysis (dynamic program analysis) encompasses all techniques that analyze software by executing it. This contrasts with static analysis, which examines source code without running it. The two approaches are complementary: static analysis covers all code paths but produces false positives and misses runtime-specific issues; dynamic analysis observes actual behavior but only covers executed paths.

### Core Techniques Taxonomy

Dynamic analysis techniques form a spectrum from lightweight to heavyweight:

1. **Code coverage** -- the simplest form: which lines/branches/functions executed during testing. Google computes this for 1B lines daily and surfaces it during code review.
2. **Profiling and tracing** -- measuring performance characteristics (time, memory, call frequency) and recording execution sequences. Three instrumentation approaches: source-level, binary, and dynamic/JIT.
3. **Memory error detection** -- sanitizers (ASan, MSan, TSan, LSan) and Valgrind detect buffer overflows, use-after-free, data races, uninitialized reads, and leaks at runtime.
4. **Fuzzing** -- automated input generation to find crashes and vulnerabilities. Coverage-guided fuzzers (AFL, libFuzzer) use a feedback loop: execute, measure coverage, mutate, repeat. Has found thousands of real-world bugs.
5. **Dynamic symbolic execution** -- combines concrete and symbolic execution to systematically explore paths. KLEE and SAGE are landmark tools. Microsoft found >30% of Windows 7 bugs this way.
6. **Dynamic taint analysis** -- tracks information flow from untrusted sources to sensitive sinks at runtime. Critical for security analysis.
7. **Property-based testing** -- specifies invariants and generates random inputs to find counterexamples. Acts as a dynamic analysis by exploring far more of the execution space than hand-written tests.

### Key Insight: Dynamic Analysis for Code Review

The traditional code review workflow is purely static: reviewers read diffs and reason about behavior mentally. Several developments are changing this:

- **Coverage-in-review** (Google): showing which changed lines lack test coverage directly in the review UI nudges developers to add tests
- **Runtime code review** (AppMap): recording execution traces during test runs and analyzing them for bugs, security flaws, and performance issues on every pull request
- **Delivery guardrails** (Datadog): combining static and dynamic checks as automated gates, especially important for AI-generated code where runtime correctness cannot be assumed from syntactic correctness

### Why This Matters for Wazir

For an engineering OS focused on code quality and review:

1. **Coverage as a review signal**: surfacing coverage data during review phases helps reviewers focus on untested code paths
2. **Sanitizer integration**: running tests with sanitizers catches memory and concurrency bugs that no amount of code reading will find
3. **Fuzzing as a quality gate**: even brief fuzzing sessions (minutes) can find edge cases that extensive unit testing misses
4. **Property-based testing**: specifying properties is a form of executable specification that continuously validates runtime behavior
5. **Execution traces for understanding**: for complex changes, execution traces (recorded during tests) can help reviewers understand actual control flow rather than reasoning about it abstractly
6. **Dynamic analysis is especially critical for AI-generated code**: static analysis alone is insufficient when code is generated by models that may produce syntactically correct but semantically flawed implementations

### Limitations and Trade-offs

- Dynamic analysis only covers executed paths; input generation quality determines effectiveness
- Instrumentation overhead ranges from 2x (sanitizers) to 500x+ (Valgrind); must be balanced against development velocity
- Execution traces can be massive; abstraction and filtering are essential for practical use
- Path explosion limits symbolic execution to moderate-size programs without heuristics
- Dynamic analysis complements but never replaces static analysis; the strongest approach uses both
