# 17 — Code Smell Detection

> Research on code smell taxonomies, detection tools, complexity metrics, ML-based approaches, and prioritization strategies.

---

## Source 1: Martin Fowler — Code Smell (https://martinfowler.com/bliki/CodeSmell.html)

- A code smell is a **surface indication** that usually corresponds to a deeper problem in the system. Term coined by Kent Beck during work on Fowler's *Refactoring* book (1999).
- Smells are by definition **quick to spot** — "sniffable." A long method is a classic example: if you see more than a dozen lines of Java, your nose should twitch.
- Smells **don't always indicate a problem**. Some long methods are fine. You must look deeper to see if there is an underlying issue — smells are indicators, not inherent defects.
- The best smells are **easy to spot and lead to interesting problems**. Data classes (all data, no behavior) are a good example — you ask what behavior should be there and refactor to move it in.
- Smells are useful for **teaching**: a lead developer can pick a "smell of the week" and ask team members to look for it, gradually building programming skill across the team.
- Fowler's first edition (1999) catalogued **22 code smells**; the second edition (2018) catalogues **24 code smells** with notable changes:
  - **4 new smells added**: Mysterious Name, Global Data, Mutable Data, Loops
  - **2 smells removed**: Parallel Inheritance Hierarchies, Incomplete Library Class
  - **4 smells renamed**: Lazy Class -> Lazy Element, Long Method -> Long Function, Inappropriate Intimacy -> Insider Trading, Switch Statement -> Repeated Switches
- The second edition also contains a catalog of **70+ proven refactorings** with step-by-step instructions.

## Source 2: Codesai — On Code Smells Catalogues and Taxonomies (https://codesai.com/posts/2022/11/code-smells-taxonomies-and-catalogs-english)

- Comprehensive historical survey of code smell classification systems from 2003 to 2022.
- **Wake's Taxonomy (2003)**: First classification of Fowler's smells; described 31 code smells divided into "Smells within classes" and "Smells between classes."
- **Mantyla et al. Taxonomy (2003)**: Grouped smells by **obstruction** — the type of problem they cause. 7 categories:
  1. **Bloaters** — something that has grown so large it cannot be effectively handled (Long Method, Large Class, Long Parameter List, Primitive Obsession, Data Clumps)
  2. **Object-Orientation Abusers** — solutions that fail to exploit OO design potential (Switch Statements, Refused Bequest, Alternative Classes with Different Interfaces, Temporary Field)
  3. **Change Preventers** — code structures that make changes very difficult (Divergent Change, Shotgun Surgery)
  4. **Dispensables** — unnecessary code whose absence would make things cleaner (Comments, Duplicate Code, Data Class, Dead Code, Lazy Class, Speculative Generality)
  5. **Encapsulators** — issues with communication mechanisms or data encapsulation (Message Chains, Middle Man)
  6. **Couplers** — cases of excessive tight coupling (Feature Envy, Inappropriate Intimacy)
  7. **Others** — uncategorized smells
- **Mantyla et al. Taxonomy (2006)**: Refined version; removed the "Others" category, reclassified remaining smells.
- **Jerzyk et al. Taxonomy (2022)**: Most comprehensive to date, identifying **56 code smells** (16 new original proposals). Three classification criteria:
  - **Obstruction**: type of problem caused (subcategories: Bloaters, Change Preventers, Couplers, Data Dealers, Dispensables, Functional Abusers, Lexical Abusers, Obfuscators, OO Abusers)
  - **Occurrence**: where the smell manifests (Conditional Logic, Data, Duplication, Interfaces, Measured Smells, Message Calls, Names, Responsibility, Unnecessary Complexity)
  - **Expanse**: scope — Between classes vs. Within classes
- **Smell Hierarchies**: Antipattern > Architecture Smell > Design Smell > Code Smell > Implementation Smell > Linguistic Smell

## Source 3: Coding Horror — Code Smells (https://blog.codinghorror.com/code-smells/)

- Jeff Atwood's consolidated reference of all documented code smells, divided into two groups.
- **Code Smells Within Classes**:
  - Comments (do they explain "why" not "what"?), Long Method, Long Parameter List, Duplicated Code, Conditional Complexity, Combinatorial Explosion, Large Class, Type Embedded in Name, Uncommunicative Name, Inconsistent Names, Dead Code, Speculative Generality, Oddball Solution, Temporary Field
- **Code Smells Between Classes**:
  - Alternative Classes with Different Interfaces, Primitive Obsession, Data Class, Data Clumps, Refused Bequest, Inappropriate Intimacy, Indecent Exposure, Feature Envy, Lazy Class, Message Chains, Middle Man, Divergent Change, Shotgun Surgery, Parallel Inheritance Hierarchies, Incomplete Library Class, Solution Sprawl
- Key insight: **developing your "code nose"** happens early in a programming career, if at all. The reference is designed to help build that instinct.

## Source 4: Code Smells Catalog by Luzkan (https://luzkan.github.io/smells/)

- Online catalog implementing Jerzyk's 2022 taxonomy with **56 code smells**, each with detailed descriptions, related smells, and references.
- Classification axes:
  - **Expanse**: Between (cross-class) vs. Within (single-class)
  - **Obstruction**: Bloaters, Change Preventers, Couplers, Data Dealers, Dispensables, Functional Abusers, Lexical Abusers, Obfuscators, OO Abusers, Other
  - **Occurrence**: Conditional Logic, Data, Duplication, Interfaces, Measured Smells, Message Calls, Names, Responsibility, Unnecessary Complexity
  - **Smell Hierarchies**: Antipattern, Architecture Smell, Code Smell, Design Smell, Implementation Smell, Linguistic Smell
  - **Severity Tags**: Major, Minor
- Notable newer smells not in Fowler: Clever Code, Afraid to Fail, Binary Operator in Name, Fallacious Comment, Fallacious Method Name, Base Class Depends on Subclass.
- Openly available on GitHub with full thesis and paper: https://github.com/Luzkan/smells

## Source 5: SonarSource — Understanding Code Smells (https://www.sonarsource.com/resources/library/code-smells/)

- SonarQube/SonarCloud uses **static analysis** with predefined rules to detect code smells across 20+ programming languages.
- **Common categories detected**: Bloaters, Object-Oriented Abuse, Dispensables, Couplers.
- **Specific smells detected**: High cognitive complexity, duplicated logic, long methods/large classes, feature envy, magic numbers/strings, dead code, excessive parameters, inconsistent naming, mutable shared state.
- **Severity levels**: Blocker, Critical, Major, Minor, Info — helps developers prioritize which smells to fix first.
- **The cost of ignoring code smells**: Leads to increased technical debt, slower development velocity, higher defect rates, harder onboarding, and brittle architecture.
- **Sonar's approach**: Integrates into CI/CD pipelines and IDEs for real-time feedback. Uses a "Clean as You Code" methodology — focus on keeping new code clean rather than trying to fix everything at once.
- **Cognitive Complexity** is a Sonar-exclusive metric (see Source 10) used as a primary indicator for understanding code smell severity related to comprehension difficulty.

## Source 6: SonarSource — Cognitive Complexity Whitepaper (https://www.sonarsource.com/resources/cognitive-complexity/)

- **Cognitive Complexity** is a metric by G. Ann Campbell (SonarSource) formulated to more accurately measure the relative **understandability** of methods.
- Breaks from mathematical models (like cyclomatic complexity) by combining precedents with **human assessment**.
- Yields method complexity scores that align well with how developers **perceive** maintainability.
- **Key differences from Cyclomatic Complexity**:
  - Cyclomatic complexity treats all decision points equally; cognitive complexity accounts for **nesting depth** and **structural complexity**.
  - High cyclomatic complexity = hard to **test**; high cognitive complexity = hard to **change without breaking**.
  - Cognitive complexity penalizes deeply nested structures more heavily, matching developer intuition.
- **Recommendation**: Pair cyclomatic complexity (testability) with cognitive complexity (understandability) for a complete picture of code quality.

## Source 7: Codacy — Code Complexity Metrics (https://blog.codacy.com/code-complexity)

- **Cyclomatic Complexity** (McCabe, 1976): Counts the number of linearly independent paths through source code. Calculated as: `M = E - N + 2P` where E = edges, N = nodes, P = connected components. Each if/else, switch/case, loop adds a path.
  - Thresholds: 1-10 simple, 11-20 moderate, 21-50 high risk, 50+ untestable.
- **Cognitive Complexity**: Evaluates understandability by considering cognitive effort. Increments for: breaks in linear flow, nesting depth, and certain structural patterns. Does NOT increment for: shorthand structures, methods that decompose complexity.
- **Halstead Metrics** (Maurice Halstead, 1977):
  - **Program Vocabulary** (n) = n1 (unique operators) + n2 (unique operands)
  - **Program Length** (N) = N1 (total operators) + N2 (total operands)
  - **Halstead Volume** = N * log2(n) — measures information content
  - **Halstead Difficulty** = (n1/2) * (N2/n2)
  - **Halstead Effort** = Difficulty * Volume — estimates development effort
- **Maintainability Index** (composite metric):
  - Formula: `MI = 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code)`
  - Scale: 0-100, higher is better. Below 65 = problematic code.
- **Lines of Code (LOC)**: Simplest metric but still useful as a rough indicator. Effective when combined with other metrics.
- **Depth of Inheritance**: Measures class hierarchy depth; deeper inheritance = harder to predict behavior.

## Source 8: ML-Based Code Smell Detection Survey (https://www.mdpi.com/2076-3417/14/14/6149)

- Comprehensive 2024 survey of machine learning methods for code smell detection, covering **42 papers** from 2005 to 2024.
- **Most common ML algorithms used**:
  - Random Forest (71% of studies), Naive Bayes (72%), SVM (54%), J48 Decision Tree (29%), Multilayer Perceptron (72%)
- **Deep Learning approaches** gaining traction:
  - CNN, ANN, DNN, LSTM, Attention models, Recursive Autoencoders (RAE)
  - Bi-LSTM and GRU combined with data balancing techniques
- **Main challenge**: Data imbalance — smelly code is far less common than clean code, skewing model training.
- **Feature engineering**: Most ML approaches rely on software metrics (LOC, cyclomatic complexity, coupling, cohesion) as features. Deep learning approaches can work directly on source code or ASTs.
- **Data preparation gaps**: Requirements, collection, cleaning, and labeling techniques have been overlooked in reviews, limiting DL potential.
- **Future directions**: More diverse publicly available datasets, multiple programming languages, semi-automatic labeling, automated real-world data collection.

## Source 9: RABERT — Transformer-Based Code Smell Detection (https://www.mdpi.com/2076-3417/15/8/4559)

- **RABERT** (Relation-Aware BERT): Novel transformer-based model published April 2025 that integrates **relational embeddings** to capture interdependencies among software complexity metrics.
- Targets the **Large Class** smell specifically, using a dataset of 1000 Java 23 classes from GitHub, labeled with 20 software complexity metrics.
- **Performance**: Accuracy 90.0%, Precision 91.0%, but **Recall only ~53.0%** — high confidence in predictions but misses many positive cases.
- **Trade-off**: Relation-aware embeddings improve precision significantly, but imbalanced datasets hinder recall.
- **Advantage over traditional ML**: Traditional gradient boosting and SVM require extensive feature engineering and struggle with intricate semantic dependencies in software structures.
- **Broader trend**: Transformer architectures are being applied to code understanding tasks, with CodeBERT and similar models being fine-tuned for smell detection.

## Source 10: Tufano et al. — "When and Why Your Code Starts to Smell Bad" (https://tufanomichele.com/publications/J3.pdf)

- Landmark study analyzing **500,000+ commits** from **200 open-source projects** (Android, Apache, Eclipse ecosystems).
- **Finding 1**: Most smell instances are introduced **when an artifact is first created**, not during subsequent evolution. This contradicts the conventional wisdom that smells accumulate during maintenance.
- **Finding 2**: **80% of code smells survive** in the system — once introduced, they rarely get removed.
- **Finding 3**: Code smells are often introduced by developers under **time pressure**, especially newcomers or contributors unfamiliar with the codebase.
- **Finding 4**: The majority of code smells (89%-98%) were introduced in the **month before a major release**, providing empirical support for the danger of "rush to release" periods.
- **Smells studied**: Blob Class, Class Data Should Be Private, Complex Class, Functional Decomposition, Spaghetti Code.
- **Implication**: Prevention (catching smells at creation time) is more effective than cure (refactoring later). This strongly supports real-time detection in code review and CI/CD.

## Source 11: Scrum.org / The Liberators — Technical Debt and Code Smells: Scientific Insights (https://medium.com/the-liberators/on-technical-debt-and-code-smells-ae8de66f0f8b)

- Christiaan Verwijs' synthesis of peer-reviewed research on when/why code smells are introduced and their impact.
- **Code smells increase time to change code** and the chance that bugs are introduced. The effect is particularly apparent for smells that lead to **longer classes** and **classes with multiple smells**.
- **Not all smells are equal**: The impact depends on context — a long method in a rarely-touched legacy module vs. a bloated method in a frequently-changed onboarding service.
- **Smells cluster**: Files with one smell are likely to have more. The presence of multiple smells in a single artifact is a stronger predictor of defects than any single smell.
- **Developer experience matters**: Less experienced developers introduce more smells, but even experienced developers do so under time pressure.
- **Practical recommendations from the research**:
  - Invest in **prevention** (pair programming, code review, TDD) over detection-after-the-fact.
  - Use **automated detection** as a safety net, not a replacement for good practices.
  - Focus refactoring on **hotspots** — code that changes frequently and has smells.
  - Make code quality a **team concern**, not an individual responsibility.

## Source 12: CodeScene — Prioritize Technical Debt by Impact (https://codescene.com/blog/prioritize-technical-debt-by-impact/)

- Adam Tornhill's approach: **behavioral code analysis** — combine code complexity with version-control data (change frequency) to identify **hotspots**.
- **Key insight**: Technical debt cannot be estimated from code alone. The main danger in prioritizing based on complexity alone is missing **impact**. What if that complex module hasn't been modified in 5 years?
- **Hotspots** = complicated code that developers work with often. This is "high-interest" technical debt — even minor debt gets expensive due to frequent interaction.
- **The long tail**: Most code is rarely touched. That code has **lower priority** for debt paydown regardless of its complexity score.
- **Prioritization method**:
  1. Mine **change frequency** (number of commits) per file from Git history
  2. Combine with a **code health metric** (complexity, duplication, etc.)
  3. The intersection = hotspots with highest ROI for improvement
- **Positive message**: You do NOT need to pay down all technical debt. Focus on parts with the highest return on investment based on your unique development patterns.
- **Visualization**: Hotspot maps show the codebase as a treemap where size = code volume and color = code health, overlaid with change frequency data.

## Source 13: CodeClimate / Qlty — Maintainability Platform (https://docs.codeclimate.com/docs/maintainability)

- CodeClimate (now Qlty) assigns a **letter grade (A-F)** to files based on maintainability, making pass/fail thresholds straightforward.
- **Default maintainability checks** with thresholds:
  - Argument count: 4
  - Complex logic: 4
  - File lines: 250
  - Method complexity: 5
  - Method count: 20
  - Method length: 25
  - Nested control flow: 4
  - Return statements: 4
  - Duplication detection (enabled by default)
- **Rating system** built on two pillars: maintainability (inverse of technical debt) and test coverage.
- **Qlty** (successor to CodeClimate Quality) supports 40+ languages, provides linting, auto-formatting, security scanning, code coverage, duplication detection, complexity analysis, code smell detection, and metrics dashboards.
- **Integration**: Works with VCS and CI to analyze every commit and pull request, surfacing hotspots and enforcing quality gates that block merges when thresholds are violated.

## Source 14: PMD Source Code Analyzer (https://pmd.github.io/)

- **PMD**: Extensible multilanguage static code analyzer, primarily Java and Apex, supporting **16+ languages** with **400+ built-in rules**.
- **How it works**: Uses JavaCC and Antlr to parse source code into **Abstract Syntax Trees (AST)**, then runs rules against them to find violations. Rules can be written in Java or using XPath queries.
- **Rule categories for Java**:
  - **Best Practices**: Standards which should be followed
  - **Code Style**: Rules enforcing a specific coding style
  - **Design**: Rules that identify design issues (God class, excessive coupling, etc.)
  - **Error Prone**: Rules to detect constructs that are error-prone or confusing
  - **Performance**: Rules that flag suboptimal code
  - **Security**: Rules for security vulnerabilities
  - **Documentation**: Rules about documentation/comments
- **Code size rules**: Specifically detect violations regarding method size and structural complexity.
- **Copy-Paste Detection (CPD)**: Built-in duplicate code detector that works across multiple languages.
- **Custom rules**: Two approaches — XPath expressions against the AST, or Java classes for complex logic.
- **Integration**: Build tools (Maven, Gradle, Ant), CI/CD pipelines, IDEs. Latest version: 7.22.0 (February 2026).

## Source 15: CodeAnt.ai — 10 Best Code Smell Detection Tools in 2025 (https://www.codeant.ai/blogs/10-best-code-smell-detection-tools-in-2025)

- Comprehensive comparison using 7 evaluation criteria: accuracy/depth, language support, AI prioritization, CI/CD integration, fix suggestions, dashboard/reporting, cost/licensing.
- **Top tools ranked**:
  1. **CodeAnt AI** — AI-powered, auto-fixes, multi-language
  2. **SonarQube** — Enterprise-grade, 20+ languages, mature ecosystem, quality gates
  3. **DeepSource** — Auto-fixes 30-40% of issues, real-time CI/CD integration
  4. **Codacy** — Unified dashboard, supports 40+ languages
  5. **ESLint** — JS/TS focused, highly extensible plugin ecosystem
  6. **PMD** — Java-focused, open-source, rule-based
  7. **Checkstyle** — Java style enforcement
  8. **RuboCop** — Ruby style guide enforcement with auto-correction
  9. **Pylint** — Python-focused, strict standards
  10. **Qodana** — JetBrains IDE-native analysis
- **Key distinction**: Static analysis platforms (SonarQube, Codacy, DeepSource) analyze across files, track metrics over time, enforce quality gates. Linters (ESLint, RuboCop, Pylint) focus on individual file-level checks and style.
- **AI trend**: Tools increasingly use AI to **prioritize** which issues matter most, suggest fixes, and reduce alert fatigue.

## Source 16: GitHub — analysis-tools-dev/static-analysis (https://github.com/analysis-tools-dev/static-analysis)

- Curated list of static analysis (SAST) tools and linters for **all programming languages**, with 14.5K stars and 9,260 commits.
- Focus on tools that **improve code quality** — linters, formatters, and analyzers.
- **Notable multi-language tools**:
  - **Mega-Linter**: 70+ embedded linters, advanced reporting, auto-formatting
  - **lizard**: Extensible cyclomatic complexity analyzer for many languages + copy-paste detection
  - **Infer** (Meta): Static analyzer for Java, C, Objective-C
  - **Semgrep**: Lightweight static analysis with pattern-matching syntax
  - **Super Linter**: GitHub Action running multiple linters
- **Companion repo**: `analysis-tools-dev/dynamic-analysis` for runtime analysis tools.
- The list is continuously maintained and serves as the definitive community reference for finding language-specific and cross-language analysis tools.

---

## Synthesis

### What Code Smells Are

Code smells are surface-level indicators of potential deeper design problems. They are not bugs — code with smells still functions — but they signal weaknesses that increase maintenance cost, defect risk, and developer cognitive load over time. The concept was formalized by Kent Beck and Martin Fowler in 1999 and has since been expanded from 22 original smells to 56 in modern taxonomies (Jerzyk 2022).

### Taxonomy Evolution

The classification of code smells has matured significantly:
- **Fowler (1999/2018)**: 22-24 smells, flat list with refactoring mappings
- **Wake (2003)**: 31 smells, divided by scope (within/between classes)
- **Mantyla (2003/2006)**: 7 categories based on obstruction type (Bloaters, OO Abusers, Change Preventers, Dispensables, Encapsulators, Couplers)
- **Jerzyk (2022)**: 56 smells with three orthogonal classification axes (Obstruction, Occurrence, Expanse) plus smell hierarchy levels

### Detection Approaches

Three generations of detection approaches exist:

1. **Rule-based / Metric-based** (traditional): Tools like PMD, SonarQube, and ESLint use predefined rules against ASTs or metrics thresholds. Well-understood, deterministic, customizable, but require manual threshold tuning and produce false positives.

2. **Machine Learning** (2010s-present): Random Forest, SVM, Naive Bayes, and ensemble methods trained on labeled datasets of smelly/clean code. Can achieve good accuracy but require extensive feature engineering and suffer from data imbalance.

3. **Deep Learning / Transformers** (2020s-present): CNN, LSTM, BERT-based models (RABERT) that work on raw code or embeddings. Can capture semantic relationships but struggle with recall due to imbalanced training data. RABERT achieves 90% accuracy / 91% precision but only 53% recall.

### Key Metrics

- **Cyclomatic Complexity**: Counts independent paths; indicates testability. Thresholds: 1-10 simple, 11-20 moderate, 21-50 high risk.
- **Cognitive Complexity**: SonarSource metric measuring human comprehension difficulty; penalizes nesting depth; indicates changeability.
- **Halstead Volume**: V = N * log2(n); measures information content based on operators and operands.
- **Maintainability Index**: Composite formula combining Halstead Volume, Cyclomatic Complexity, and LOC. Below 65 = problematic.
- **Best practice**: Use cyclomatic + cognitive complexity together — one measures testability, the other understandability.

### Prioritization: Which Smells Matter Most

The research strongly converges on **impact-based prioritization**:

1. **Hotspot analysis** (CodeScene/Tornhill): Combine code complexity with change frequency from Git. Complicated code that changes often = highest priority. Code in the "long tail" (rarely touched) = lowest priority regardless of complexity.
2. **Smell clustering**: Files with multiple smells are stronger defect predictors than any single smell. Prioritize multi-smell hotspots.
3. **Business context**: A bloated method in a core payment service that changes weekly is more urgent than the same smell in a one-off ETL script.
4. **Prevention over cure**: Tufano's research shows 80% of smells survive once introduced, and most are introduced at creation time. Real-time detection during code review and CI/CD is more effective than periodic refactoring campaigns.
5. **Release pressure**: 89-98% of smells are introduced in the month before a release. Quality gates and review discipline are most critical during crunch periods.

### Tool Landscape (2025-2026)

The tool ecosystem has settled into clear tiers:
- **Enterprise platforms**: SonarQube, Codacy, DeepSource, Qodana — multi-language, CI/CD integration, dashboards, quality gates
- **Language-specific linters**: ESLint (JS/TS), PMD (Java), RuboCop (Ruby), Pylint (Python), Checkstyle (Java)
- **Behavioral analysis**: CodeScene — Git-mining plus code health for hotspot prioritization
- **AI-augmented**: CodeAnt, DeepSource — auto-fix suggestions, smart prioritization, reduced alert fatigue
- **Code Climate / Qlty**: Maintainability scoring (A-F grades) with sensible default thresholds

### Implications for Automated Code Review

1. **Detection should be multi-layered**: Combine rule-based linting (fast, deterministic) with metric-based analysis (complexity, duplication) and behavioral data (change frequency).
2. **Prioritization is essential**: Raw smell counts cause alert fatigue. Weight findings by change frequency, business criticality, and smell co-occurrence.
3. **Thresholds should be configurable but sensible defaults matter**: CodeClimate's defaults (method length 25, complexity 5, file lines 250) provide a reasonable starting point.
4. **Prevention at creation time is the highest-leverage intervention**: Tufano's research shows most smells are born with the code and survive indefinitely. Catching them in PR review is the critical moment.
5. **Cognitive complexity > cyclomatic complexity** for human reviewers: It better predicts which code developers will struggle to understand and safely modify.
