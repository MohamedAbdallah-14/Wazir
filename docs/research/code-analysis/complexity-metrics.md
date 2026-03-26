# 29 -- Code Complexity Analysis

Research on code complexity metrics, their effectiveness, limitations, tools, and practical applications.

Date: 2026-03-25

---

## Source 1: Cyclomatic Complexity -- Wikipedia (https://en.wikipedia.org/wiki/Cyclomatic_complexity)

- Cyclomatic complexity was developed by Thomas J. McCabe Sr. in 1976 as a quantitative measure of the number of linearly independent paths through a program's source code.
- Computed using the control-flow graph: `M = E - N + 2P` where E = edges, N = nodes, P = connected components. For a single method with one entry and one exit: complexity = number of decision points + 1.
- McCabe recommended a maximum complexity of 10 per module. NIST corroborated this with substantial evidence but noted limits of 15 may be appropriate in some circumstances.
- The metric was originally conceived for testing guidance (basis path testing): the number of test cases needed equals the cyclomatic complexity.
- **Key limitation -- correlation with program size**: Multiple studies have shown cyclomatic complexity correlates strongly with lines of code. Les Hatton claimed complexity has the same predictive ability as LOC.
- **Key limitation -- data complexity ignored**: It measures only control-flow complexity, not data complexity (complex data structures, state, or data transformations).
- **Key limitation -- human perception gap**: The complexity of a control-flow graph does not necessarily align with what a human would perceive as complex.
- **Key limitation -- theoretical foundations questioned**: A 1988 critique (Shepperd, "A Critique of Cyclomatic Complexity as a Software Metric") argued it is "based upon poor theoretical foundations and an inadequate model of software development" and is often "no more than a proxy for, and in many cases is outperformed by, lines of code."
- Studies controlling for program size (comparing modules with different complexities but similar size) are "generally less conclusive, with many finding no significant correlation."
- Essential complexity is a related metric McCabe proposed to measure how close to structured programming a module is, by iteratively reducing single-entry/single-exit subgraphs.

## Source 2: Cognitive Complexity -- SonarSource Blog (https://www.sonarsource.com/blog/cognitive-complexity-because-testability-understandability/)

- Cognitive Complexity is a SonarSource-exclusive metric designed to measure how difficult the control flow of a method is to understand (maintainability), not just how hard it is to test.
- **Motivation**: Cyclomatic Complexity works well for measuring testability but not maintainability. A deeply nested `for` loop with a labeled `break` and an `if` can score the same as a simple `switch` with flat cases -- both CC=4 -- yet their understandability is vastly different.
- McCabe himself acknowledged the problem: "The only situation in which this limit [of 10] has seemed unreasonable is when a large number of independent cases followed a selection function."
- At the application level, studies show CC correlates with lines of code, so "it really doesn't tell you anything new."
- **Three fundamental rules of Cognitive Complexity**:
  1. **Ignore** structures that allow multiple statements to be readably shorthanded into one (e.g., `switch` cases count once for the whole `switch`, null-coalescing operators are free).
  2. **Increment** (+1) for each break in the linear flow of code (`if`, `else if`, `else`, `for`, `while`, `do while`, `catch`, ternary operators, `goto`, `break`, `continue` to labels).
  3. **Increment for nesting**: flow-breaking structures nested inside other flow-breaking structures incur an additional +1 per nesting level. An `if` inside a `for` inside a `while` gets +3 for the innermost `if`.
- The nesting penalty is the key innovation: it captures the exponential cognitive load of deeply nested code that CC completely ignores.
- Cognitive Complexity incentivizes good coding practices: it rewards early returns, guard clauses, and flat code structure.

## Source 3: Cognitive Complexity White Paper -- SonarSource (https://www.sonarsource.com/docs/CognitiveComplexity.pdf)

- Full technical specification by G. Ann Campbell (2021), the definitive reference for the metric.
- The paper establishes that Cyclomatic Complexity was designed to measure testability (number of linearly independent paths), not understandability.
- Cognitive Complexity intentionally departs from mathematical models by combining CC precedents with human assessment of difficulty.
- The metric yields scores that "align well with how developers perceive maintainability."
- Detailed scoring rules cover: sequences of boolean operators (mixed operators increment, sequences of the same operator do not), recursion, nested lambdas/closures, and language-specific constructs.
- The white paper is the canonical reference used by SonarQube, SonarCloud, and SonarLint implementations.

## Source 4: Halstead Complexity Measures -- Wikipedia (https://en.wikipedia.org/wiki/Halstead_complexity_measures)

- Introduced by Maurice Howard Halstead in 1977, aiming to establish an empirical science of software development.
- **Four base measures**: n1 (distinct operators), n2 (distinct operands), N1 (total operators), N2 (total operands).
- **Derived measures**:
  - Program Vocabulary: `n = n1 + n2`
  - Program Length: `N = N1 + N2`
  - Estimated Program Length: `N_hat = n1 * log2(n1) + n2 * log2(n2)`
  - Volume: `V = N * log2(n)` -- represents the information content of the program, the space needed to store it.
  - Difficulty: `D = (n1/2) * (N2/n2)` -- indicates effort needed to write or understand the code.
  - Effort: `E = D * V` -- predicts the mental activity required to comprehend the code.
  - Time to Program: `T = E/18` seconds (based on the Stroud number, the number of elementary mental discriminations per second).
  - Number of Delivered Bugs: `B = V/3000` or alternatively `B = E^(2/3) / 3000`.
- Halstead's goal was language-independent, platform-independent metrics computed statically from source code.
- **Criticisms**: The metrics rely on clear operator/operand classification which can be ambiguous in different languages. The "bugs delivered" formula has been questioned for its empirical validity. The constants (18, 3000) were derived from limited experimental data.
- Despite criticisms, Halstead Volume remains widely used as a component of the Maintainability Index and is one of the few metrics that attempt to quantify information density of code.

## Source 5: Maintainability Index -- Sourcery Blog (https://www.sourcery.ai/blog/maintainability-index)

- First proposed by Paul Oman and Jack Hagemeister in 1992 at the International Conference on Software Maintenance.
- **Original formula**: `MI = 171 - 5.2 * ln(HV) - 0.23 * CC - 16.2 * ln(LOC) + 50 * sin(sqrt(2.46 * perCOM))`
  - HV = Halstead Volume, CC = Cyclomatic Complexity, LOC = Lines of Code, perCOM = % comment lines.
- **Microsoft Visual Studio formula** (2011, 0-100 scale): `MI = MAX(0, (171 - 5.2 * ln(HV) - 0.23 * CC - 16.2 * ln(LOC)) * 100/171)` -- drops the comments component.
- **Potential issues identified**:
  - **Overly reliant on Lines of Code**: LOC is a direct component, has a direct relationship with Halstead Volume, and is heavily correlated with Cyclomatic Complexity. Adding clarifying comments or splitting operations onto separate lines can decrease MI even though the code is clearer.
  - **Designed for a single company**: The coefficients were determined by HP engineers on HP projects circa 1992. They have not been re-calibrated in 30+ years.
  - **Not built for all languages**: The original formula was calibrated for C code. Applying it unchanged to Python, JavaScript, or Ruby is questionable.
- **Conclusion**: MI is best used for relative comparison within a project rather than as an absolute quality metric. Using MI's individual components (Halstead Volume, CC, LOC) separately may provide more actionable insight.

## Source 6: Maintainability Index Range and Meaning -- Microsoft Learn (https://learn.microsoft.com/en-us/visualstudio/code-quality/code-metrics-maintainability-index-range-and-meaning)

- Microsoft rebased MI from its original 171-to-negative range to 0-100 for clarity.
- Threshold interpretation in Visual Studio: Green (20-100) = good maintainability, Yellow (10-19) = moderate, Red (0-9) = low maintainability.
- Microsoft chose conservative thresholds: "if the index showed red then we would be saying with a high degree of confidence that there was an issue with the code."
- The formula treats all values <= 0 as 0 because "the difference between code at 0 and some negative value wasn't useful."

## Source 7: McCabe's Cyclomatic Complexity and Why We Don't Use It -- Teamscale Blog (https://teamscale.com/blog/en/news/blog/mccabe-cyclomatic-complexity)

- Teamscale (CQSE GmbH) is a commercial code quality analysis tool vendor; they deliberately chose not to use McCabe CC.
- **Problem 1 -- Inconsistent tool implementations**: The original paper is vague on how to handle boolean operators in conditions. `if (a > 17 && b < 42)` may score 2 or 3 depending on the tool. This makes comparisons across tools unreliable.
- **Problem 2 -- No nesting awareness**: A flat sequence of 10 `if` statements scores the same (CC=11) as 10 nested `if` statements. The nested version is dramatically harder to understand.
- **Problem 3 -- Switch statements inflate scores**: A simple, readable `switch` with many cases can score very high, even though each case is trivially understandable.
- **Recommendation**: Use metrics that account for nesting depth and structural complexity rather than just counting decision points. Teamscale uses a proprietary "method length" metric combined with nesting-aware analysis.

## Source 8: An Empirical Investigation of Correlation between Code Complexity and Bugs -- Chen, 2019 (https://arxiv.org/abs/1912.01142)

- Investigates the correlation between path complexity and bugs, comparing it to cyclomatic complexity and NPATH complexity.
- **Finding 1**: For simple bugs, there is no strong correlation between path complexity and the presence of bugs.
- **Finding 2**: For complex real-world bugs, path complexity has a higher correlation with bug presence than cyclomatic complexity and NPATH complexity (though still not strong).
- **Implication**: Path complexity may be more useful for building bug prediction models than CC, especially for non-trivial defects.
- **Implication for test generation**: Path complexity can serve as a guiding mechanism for test generation, since it better captures the space of execution paths that may harbor complex bugs.

## Source 9: On the Accuracy of Code Complexity Metrics: A Neuroscience-Based Guideline for Improvement -- Frontiers in Neuroscience, 2023 (https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2022.1065366/full)

- Controlled experiment with 27 programmers, using EEG (electroencephalography) and eye tracking to directly measure cognitive load during code comprehension.
- Compared five perspectives on measuring code complexity:
  1. Classic metrics (McCabe CC, Halstead)
  2. Scored-construct cognitive complexity metrics
  3. SonarQube's Cognitive Complexity (CC-Sonar)
  4. Human behavioral metrics (reading time, revisits) via eye tracking
  5. Cognitive load via EEG
- **Key finding**: Existing code complexity metrics (including SonarQube's CC-Sonar) show significant divergence from actual cognitive load measured by EEG. Some code regions with low metric scores produced high cognitive load, and vice versa.
- **Specific divergences found**:
  - Code with complex variable naming/data manipulation but simple control flow scored low on CC metrics but high on EEG cognitive load.
  - Code with many branches but simple, readable patterns scored high on CC metrics but low on EEG cognitive load.
- **Guidelines proposed to improve metrics**:
  - Metrics should account for data complexity, not just control-flow complexity.
  - Variable naming quality and semantic complexity affect cognitive load but are invisible to current metrics.
  - The context in which code appears (surrounding code, module purpose) significantly impacts comprehension difficulty.
- The NASA-TLX subjective workload assessment correlated well with EEG data, validating the use of EEG as a reference.
- This is one of the first papers to use neuroscience methods (EEG) to empirically validate (or invalidate) code complexity metrics.

## Source 10: Measuring Software Complexity: What Metrics to Use? -- The Valuable Dev (https://thevaluable.dev/complexity-metrics-software/)

- Comprehensive blog-format overview of complexity metrics with practical guidance on when to use each.
- **Core principle**: Always define the question you want to answer before looking at metrics. "Looking at metrics without having any question in mind is like searching in a massive haystack."
- **Categories of metrics covered**:
  - **Size metrics**: LOC, SLOC, LLOC -- simple but surprisingly useful as baselines.
  - **Code shape**: Nesting depth, line length, indentation patterns.
  - **Cyclomatic complexity**: Useful for testability, poor for understandability.
  - **Cognitive complexity**: Better proxy for human understanding.
  - **Halstead metrics**: Information-theoretic view of code.
  - **Coupling and Cohesion**: Architectural-level complexity.
- **Coupling categories** (from worst to best):
  1. Content coupling -- modules accessing each other's internals.
  2. Common coupling -- modules mutating shared global variables.
  3. Control coupling -- modules controlling logic of others.
  4. External coupling -- modules exchanging info via external means (files).
  5. Stamp coupling -- modules passing data structures where receiver uses only part.
  6. Data coupling -- modules exchanging data where receiver uses all of it.
- **OOP-specific metrics**: CBO (Coupling Between Objects), LCOM (Lack of Cohesion of Methods), DIT (Depth of Inheritance Tree) from the Chidamber-Kemerer (CK) metric suite.
- **Semantic coupling**: CCM (Conceptual Coupling Between Methods), CCMC (Conceptual Coupling Between Method and Class), CCBC (Conceptual Coupling Between Classes) -- uses machine learning to analyze name/comment relationships.
- **Dynamic coupling**: Coupling at runtime (polymorphism, dynamic binding) -- rarely needed unless excessive generalization.
- **Key takeaway**: No single metric captures the full picture. Use a combination and interpret them in context.

## Source 11: Codacy -- Code Complexity: An In-Depth Explanation and Metrics (https://blog.codacy.com/code-complexity)

- Practical guide to code complexity aimed at development teams using Codacy's platform.
- Covers cyclomatic complexity, cognitive complexity, Halstead Volume, and switch statement/logic condition complexity.
- **Halstead Volume** explained practically: `V = N * log2(n)`, where N = total operators + operands, n = unique operators + operands. Represents the information content and effort to understand the code.
- **Cognitive Complexity** scoring: weights assigned to programming constructs and their nesting levels. Simple constructs like individual `if` conditions get lower scores; deeply nested or chained conditions get higher scores.
- **Switch statement complexity**: Can be a cleaner alternative to nested if-else when dealing with mutually exclusive conditions. CC penalizes switches heavily; cognitive complexity does not.
- **Practical reduction strategies**: Extract methods, reduce nesting via early returns/guard clauses, simplify boolean expressions, break large functions into smaller focused ones.

## Source 12: Radon -- Introduction to Code Metrics (https://radon.readthedocs.io/en/latest/intro.html)

- Radon is a Python tool for computing code metrics: Cyclomatic Complexity, Halstead metrics, Maintainability Index, and raw metrics (LOC, SLOC, LLOC, comments, blanks).
- **CC scoring in Radon**: Analyzes the AST tree. `if` +1, `elif` +1, `else` +0, `for` +1, `while` +1, `except` +1, `finally` +0, `with` +1, `assert` +1, comprehension +1, boolean operator (`and`, `or`) +1.
- **Radon's MI formula** (combined SEI + Visual Studio variant): `MI = MAX(0, 100 * (171 - 5.2*ln(V) - 0.23*G - 16.2*ln(L) + 50*sin(sqrt(2.4*C))) / 171)` -- includes comment percentage.
- Radon explicitly notes: "Maintainability Index is still a very experimental metric, and should not be taken into account as seriously as the other metrics."
- **Halstead metrics in Radon**: Computes all standard Halstead measures: h1, h2, N1, N2, vocabulary, length, calculated length, volume, difficulty, effort, time, and bugs.

## Source 13: CodeScene -- Change Coupling: Visualize the Cost of Change (https://codescene.com/blog/change-coupling-visualize-the-cost-of-change)

- CodeScene (by Adam Tornhill, author of "Your Code as a Crime Scene") introduces behavioral code analysis as a complement to static complexity metrics.
- **Change coupling**: Files/modules that frequently change together in commits, revealing temporal/logical dependencies invisible to static analysis. This is mined from Git history, not from code structure.
- **Why static dependencies are insufficient**:
  1. Any non-trivial system has a myriad of dependencies; most are benign (e.g., standard library usage). Change coupling highlights only the expensive ones.
  2. Static analysis ignores the temporal dimension. A stable, well-understood dependency is not a problem; one that drives constant co-changes is.
  3. Static analyzers miss logical dependencies (e.g., two services communicating via a message bus leave no visible coupling in code).
- **Hotspot analysis**: Combines Code Health metrics with development activity (commit frequency) to identify where poor code quality actively slows down the team.
- **Two types of code complexity**: (1) Implementation complexity -- a class that is hard to understand due to accidental complexity in isolation, and (2) Dependency complexity -- code that looks simple but has complex behavioral dependencies.
- **Key insight**: Architectural complexity often matters more than local code complexity. A function with CC=5 that triggers cascading changes across 20 files is far more dangerous than a function with CC=25 that is self-contained.

## Source 14: Iterators -- Code Complexity Metrics: Writing Clean, Maintainable Software (https://www.iteratorshq.com/blog/code-complexity-metrics-writing-clean-maintainable-software/)

- Practitioner-focused guide covering real-world scenarios of complexity problems.
- **Key practical scenarios**:
  - Maintaining a legacy codebase with deeply nested if/else statements.
  - Debugging a feature with intertwined logic where fixing one bug creates another.
  - Onboarding new developers who cannot understand existing code.
- **Metrics recommended for tracking**: Cyclomatic Complexity (testing guidance), Cognitive Complexity (understandability), Lines of Code (size baseline), Depth of Nesting (readability), Fan-in/Fan-out (coupling).
- **Fan-in / Fan-out**: Fan-in = number of modules calling a given module (high fan-in suggests the module is a critical dependency). Fan-out = number of modules a given module calls (high fan-out suggests the module has too many responsibilities or dependencies).
- **Best practices for managing complexity**: Automate complexity analysis in CI/CD pipelines, set threshold gates on PRs, conduct regular code reviews focused on complexity hotspots, and schedule dedicated refactoring sprints.

## Source 15: The Correlation Among Software Complexity Metrics with Case Study -- ArXiv, 2014 (https://arxiv.org/pdf/1408.4523)

- Studies the correlation among multiple complexity metrics (LOC, CC, Halstead metrics, MI) across real-world Java projects.
- **Finding**: LOC, Cyclomatic Complexity, and Halstead Volume are strongly correlated with each other. This confirms that CC often adds little predictive value beyond what LOC already provides.
- **Finding**: The Maintainability Index is largely driven by LOC due to the triple influence (LOC directly, Halstead Volume correlated with LOC, CC correlated with LOC).
- **Implication**: Using multiple highly correlated metrics gives a false sense of multi-dimensional analysis. Teams should be aware that "three different metrics" may effectively be measuring the same thing (program size).

## Source 16: Tools for Measuring Code Complexity (multiple sources)

**Comprehensive tool landscape** compiled from search results:

| Tool | Languages | Metrics | Notes |
|------|-----------|---------|-------|
| **SonarQube** | 30+ | CC, Cognitive, duplications, code smells | Community edition free; industry standard |
| **Radon** | Python | CC, Halstead, MI, raw metrics | Open source, CLI + API |
| **Lizard** | 15+ | CC, function length, parameters | Fast, lightweight, Codacy integration (2025) |
| **CodeScene** | Language-agnostic (Git-based) | Hotspots, change coupling, code health | Behavioral analysis from Git history |
| **Codacy** | 40+ | CC, duplication, security | Cloud-based, integrates Lizard |
| **CodeClimate** | Multiple | Maintainability, duplication, churn | ML-based pattern analysis |
| **NDepend** | .NET | CC, coupling, cohesion, dependency graphs | Deep .NET analysis |
| **Teamscale** | Multiple | Custom metrics, nesting-aware | Commercial, avoids McCabe CC |
| **Verifysoft Testwell CMC** | C/C++/Java | McCabe, Halstead, MI | Embedded systems focus |
| **ESLint (sonarjs plugin)** | JavaScript/TypeScript | Cognitive complexity | Rule-based, configurable threshold |
| **Qodo** | Multiple | AI-driven complexity hotspots | Context-aware, CI integration |
| **CodeAnt AI** | Multiple | Complexity hotspots per PR | AI-powered, real-time PR analysis |
| **TIOBE TICSCyclox** | All (via TiCS) | CC, code quality | Part of TIOBE Quality Indicator |

---

## Synthesis

### What the research converges on

1. **Cyclomatic Complexity is a useful but limited metric.** It was designed for testability (how many test paths to cover), not for measuring understandability or maintainability. Its strong correlation with lines of code means it often provides no additional predictive power beyond simple size metrics. It ignores nesting depth, data complexity, and code readability.

2. **Cognitive Complexity is the best current proxy for code understandability.** By penalizing nesting, ignoring benign structures like `switch` cases, and aligning with developer intuition, it addresses the main shortcomings of CC. However, the 2023 Frontiers neuroscience study shows it still diverges from actual measured cognitive load in some cases -- particularly where data complexity or variable naming difficulty dominates.

3. **Halstead metrics capture information density that other metrics miss**, but their practical utility is limited by ambiguous operator/operand classification and questionable empirical constants. Their primary modern value is as a component of the Maintainability Index.

4. **The Maintainability Index is conceptually appealing but technically flawed.** It over-weights lines of code (since LOC, Halstead Volume, and CC are all strongly correlated with each other), was calibrated for 1990s HP C code, and has not been re-validated across modern languages or development practices. It is best used for relative comparison, not absolute thresholds.

5. **No single metric captures architectural complexity.** Coupling metrics (CBO, fan-in/fan-out, change coupling) and cohesion metrics (LCOM) are essential but require different tools and analysis approaches. CodeScene's behavioral analysis (mining Git history for change coupling) reveals temporal and logical dependencies that static analysis completely misses.

6. **Bug density correlation is nuanced.** Complexity metrics correlate with defect rates, but the correlation is often confounded by program size. When controlling for size, results are mixed. Path complexity shows better correlation with complex real-world bugs than CC does. The combination of metrics with static analysis achieves approximately 78% accuracy in predicting pre-release fault density.

7. **Neuroscience research is beginning to ground-truth complexity metrics.** EEG-based studies show that existing metrics fail to account for data complexity, variable naming quality, and contextual comprehension difficulty. Future metrics should incorporate these dimensions.

### Practical recommendations for code review and quality gates

- **Use Cognitive Complexity as the primary per-function metric** with a threshold of 15 (SonarQube default). It incentivizes the right coding patterns.
- **Use Cyclomatic Complexity only for test coverage planning**, not for judging code quality.
- **Track LOC as an honest size baseline** rather than relying on composite metrics that disguise it.
- **Monitor architectural metrics separately**: fan-in/fan-out, change coupling (from Git), and LCOM for cohesion.
- **Automate complexity checks in CI/CD** with tools like SonarQube, Codacy, or Lizard, setting PR gates on per-function thresholds rather than per-file or per-project averages.
- **Do not treat the Maintainability Index as authoritative.** If used at all, use it for relative comparison within a project.
- **Combine metrics rather than relying on any single one.** The combination of Cognitive Complexity (understandability), change coupling (architectural risk), and code churn (development activity) provides a much richer picture than any individual metric.
