# Anti-Pattern Detection in Code Review

Research date: 2026-03-25

## Key Findings

1. **Anti-patterns are distinct from bugs.** A code smell is "a surface indication that usually corresponds to a deeper problem in the system" (Martin Fowler, coined by Kent Beck, 1999). Smells are quick to spot but do not always indicate a problem -- they are heuristics, not rules. The best smells are easy for even inexperienced developers to notice yet frequently lead to real architectural issues.

2. **The canonical taxonomy is Fowler/Beck (1999, updated 2018).** The original _Refactoring_ catalog defined 22 code smells. The second edition (2018) updated these with JavaScript examples and functional-style refactorings. Mantyla (2003) organized the smells into 7 categories: Bloaters, Object-Orientation Abusers, Change Preventers, Dispensables, Couplers, Encapsulators, and Others.

3. **Automated detection has three generations.** (a) Rule-based/metric-based tools (PMD, Checkstyle, FindBugs, ESLint) from 2000s onward. (b) ML-based detectors (Random Forest, SVM, ensemble methods like SMAD) from 2015 onward, with tree-based algorithms outperforming kernel-based and network-based. (c) LLM/deep-learning detectors (CAME, DeepIaC, GPT/Claude-based reviewers) from 2023 onward, achieving 42-48% bug detection vs. <20% for traditional tools.

4. **No single tool catches everything.** SonarQube achieves Precision 0.83, Recall 0.87, F1 0.85 on Java/C++/Python benchmarks, outperforming CheckStyle and PMD individually. But ML-based detectors still suffer from low accuracy due to inadequate features and class imbalance. The best results come from combining deterministic linting, deep static analysis, and AI-assisted review.

5. **Domain-specific anti-patterns are under-served.** Microservice, IaC (Terraform/Docker/Kubernetes), and frontend-framework anti-patterns have far less tooling coverage than monolithic OOP anti-patterns. This is a gap that a review system like Wazir could fill.

6. **Code review process itself has anti-patterns.** AWS Well-Architected identifies: infrequent reviews, excessive required reviewers, lack of automated feedback, large batch reviews, and unconstructive reviews. These process-level problems often matter more than technical detection capabilities.

---

## Anti-Pattern Taxonomies

### Fowler/Beck Code Smells (Refactoring, 2nd ed. 2018)

Organized by Mantyla's 2003 grouping (adopted by Refactoring Guru):

**Bloaters** -- code that grows too large to work with:
- Long Method
- Large Class (God Class)
- Primitive Obsession
- Long Parameter List
- Data Clumps

**Object-Orientation Abusers** -- incomplete or incorrect OOP:
- Alternative Classes with Different Interfaces
- Refused Bequest
- Switch Statements
- Temporary Field

**Change Preventers** -- one change forces many others:
- Divergent Change
- Shotgun Surgery
- Parallel Inheritance Hierarchies

**Dispensables** -- pointless code whose removal improves clarity:
- Comments (excessive/misleading)
- Duplicate Code
- Lazy Class
- Data Class (all data, no behavior)
- Dead Code
- Speculative Generality

**Couplers** -- excessive coupling between classes:
- Feature Envy
- Inappropriate Intimacy
- Message Chains
- Middle Man
- Incomplete Library Class

### Luzkan Extended Code Smells Catalog

Marcel Jerzyk's academic catalog (luzkan.github.io/smells) extends Fowler with 56+ named smells across 10 categories:

| Category | Subcategories | Example Smells |
|---|---|---|
| Bloaters | Measured Smells | Long Method, Large Class, Long Parameter List |
| Change Preventers | Responsibility | Divergent Change, Shotgun Surgery |
| Couplers | Responsibility, Names | Feature Envy, Inappropriate Intimacy, Binary Operator in Name |
| Data Dealers | Data | Data Clump, Primitive Obsession, Message Chains |
| Dispensables | Duplication, Unnecessary Complexity | Dead Code, Lazy Class, Speculative Generality |
| Functional Abusers | Conditional Logic | Switch Statements, Conditional Complexity |
| Lexical Abusers | Names | Fallacious Comment, Fallacious Method Name, Uncommunicative Name |
| Obfuscators | Unnecessary Complexity, Measured Smells | Clever Code, Obscured Intent, Magic Numbers |
| Object Oriented Abusers | Interfaces, Duplication | Refused Bequest, Base Class Depends on Subclass, Alternative Classes with Different Interfaces |
| Other | Various | Afraid to Fail, Type Embedded in Name |

### Wikipedia Comprehensive Anti-Pattern List

**Generic Software Design Anti-Patterns:**
- Abstraction Inversion, Ambiguous Viewpoint, Big Ball of Mud, Database-as-IPC, Inner-Platform Effect, Input Kludge, Interface Bloat, Magic Pushbutton, Race Hazard, Stovepipe System

**Object-Oriented Anti-Patterns:**
- Anemic Domain Model, Call Super, Circle-Ellipse Problem, Circular Dependency, Constant Interface, God Object, Object Cesspool, Object Orgy, Poltergeist, Sequential Coupling, Yo-yo Problem

**Programming Anti-Patterns:**
- Accidental Complexity, Action at a Distance, Boat Anchor (dead code), Busy Waiting, Caching Failure, Cargo Cult Programming, Coding by Exception, Error Hiding, Hard Code, Lava Flow, Loop-Switch Sequence, Magic Numbers, Magic Strings, Soft Code, Spaghetti Code

**Configuration/Deployment Anti-Patterns:**
- Dependency Hell, DLL Hell, Extension Conflict, JAR Hell

### Microservice Anti-Patterns (Taibi et al., 2018; Neri et al., 2023)

A tertiary study derived 58 disjoint microservice anti-patterns from 203 originally identified patterns, grouped into 5 categories:
- **Coupling:** Distributed Monolith, Shared Database, Chatty Services, Co-change Coupling, Inappropriate Service Intimacy
- **Sizing:** Nano Service (too small), Mega Service (too large), Microservice Greedy
- **Structure:** Wrong Cuts, Ambiguous Service, Knot Service, Sand Pile
- **Communication:** Transactional Integration, ESB Usage
- **Data:** Data-driven Migration, Shared Persistence

Detection approaches include distributed tracing analysis, graph neural networks (GNNs detecting cyclic dependencies, ESB usage, greediness, inappropriate intimacy), and the MSANose tool (11 microservice-specific smells).

### Security Anti-Patterns (OWASP)

From the OWASP Secure Code Review Cheat Sheet:
- **Injection:** String concatenation in SQL queries, unsanitized user input in commands
- **XSS:** Missing output encoding, unsafe DOM manipulation, unescaped user input rendering
- **Authentication:** Weak session token generation (<64 bits entropy), missing session regeneration post-login, credentials in source code
- **Cryptography:** Hard-coded credentials, weak cryptographic algorithms, improper key management
- **Error Handling:** Verbose error messages exposing internals, catch-all exception swallowing
- **Configuration:** Debug mode in production, default credentials, missing security headers

### Infrastructure-as-Code Anti-Patterns

- Using `latest` Docker image tags (unpredictable deployments)
- Mixing infrastructure and application deployment in one pipeline
- Embedding complex logic in Helm/Kustomize templates (reducing visibility)
- Configuration drift from manual changes
- Stage-specific images instead of ConfigMap-based configuration
- Hardcoded secrets in pipeline configurations

---

## Language/Framework-Specific Anti-Patterns

### JavaScript / TypeScript
- Using `any` type (disables TypeScript's type checking)
- Implicit enum values (fragile ordering)
- Multiple boolean states instead of state machines
- Security smells: hard-coded credentials, weak cryptography, missing input validation
- Test smells (under-tooled in JS/TS ecosystem; smelly-test is emerging)
- ESLint is the primary detection tool; DeepScan for deeper static analysis

### Python
- Catching all exceptions with bare `except: pass` (swallowed errors)
- Inconsistent return types from functions
- Java-style getters/setters instead of properties
- Unnecessary list comprehensions creating unneeded allocations
- Not using EAFP (Easier to Ask Forgiveness than Permission) style
- Tools: Pylint, Flake8, MyPy, DeepSource; "The Little Book of Python Anti-Patterns" is a reference catalog

### Go
- Verbose `if err != nil` error handling obscuring business logic
- No standardized project structure leading to inconsistent patterns
- Missing race condition detection (use `-race` flag)
- Goroutine leaks from unbounded spawning

### Rust
- Overusing `.clone()` causing unnecessary heap allocations
- Inefficient async/parallel code patterns
- Fighting the borrow checker with excessive `Rc<RefCell<T>>` wrappers

### React / Frontend Frameworks
- God Components (one massive deeply-nested component)
- Copy-pasting similar components across pages
- Using global state for local/ephemeral UI state
- Prop drilling through intermediate components
- Mixing concerns in `useEffect` or render functions
- Installing full libraries for trivial functionality
- Loading everything upfront instead of lazy loading

---

## Tools and Approaches

### Traditional Static Analysis Tools

| Tool | Languages | Detection Focus | Integration |
|---|---|---|---|
| **SonarQube** | 20+ languages | Bugs, code smells, vulnerabilities; 5 severity levels (Blocker to Info) | CI/CD, IDE, GitHub |
| **ESLint** | JS/TS | Style, syntax, plugin-based smell detection | IDE, CI/CD, GitHub Actions |
| **PMD** | Java, JS, Apex, others | Copy-paste detection, dead code, complexity | CI/CD, IDE |
| **Checkstyle** | Java | Coding standards, naming conventions | CI/CD, IDE |
| **SpotBugs** (FindBugs successor) | Java/JVM | Null pointer bugs, concurrency, performance | CI/CD, IDE |
| **Pylint / Flake8** | Python | Style violations, common pitfalls, type errors | CI/CD, IDE |
| **Semgrep** | 30+ languages | Security-first; custom rules; 10-100x faster than SonarQube in CI | CI/CD, GitHub Actions |
| **CodeClimate** | Multiple | Maintainability, complexity, technical debt tracking | GitHub, CI/CD |

### AI-Powered Code Review Tools (2025-2026)

| Tool | Approach | Key Capabilities |
|---|---|---|
| **CodeRabbit** | LLM-based PR review | Comprehensive pull request analysis, configuration file review, anti-pattern detection |
| **DeepCode (Snyk)** | 25M data flow cases, 11 languages | Security flaw detection, data flow analysis |
| **GitHub Copilot Autofix** | GPT-based | Vulnerability detection and automated fix suggestions |
| **Macroscope v3** (Feb 2026) | AST graph + OpenAI o4-mini-high + Anthropic Opus 4 consensus | Graph-based codebase representation, multi-model verification |
| **CodeAnt.ai** | AI severity prioritization | Code smells and anti-patterns ranked by severity, impact, frequency |
| **Panto** | ML-based | Code smell detection with IDE integration |

### ML/Deep Learning Research Approaches

| Approach | Method | Performance |
|---|---|---|
| **CAME** (Convolutional Analysis of code Metrics Evolution) | CNN on historical code metrics from VCS | Detects God Class, Feature Envy from structural + historical features |
| **SMAD** (Smart Aggregation of Anti-pattern Detectors) | Ensemble ML aggregating multiple detectors | Combines internal detection rules of various tools |
| **DeepIaC** | Deep learning on IaC scripts | 0.785-0.915 accuracy on linguistic anti-patterns |
| **Random Forest classifiers** | Tree-based on software metrics | Highest performance among ML algorithms for smell detection |
| **SMOTE + ML** | Class balancing + supervised learning | Addresses class imbalance in smell severity detection |

### Three-Layer Detection Architecture (emerging consensus, 2025-2026)

1. **Baseline Hygiene:** Formatters (Prettier, Black) + linters (ESLint, Pylint) -- fast, deterministic, catches style and syntax
2. **Deep Analysis:** Semgrep, CodeQL, SonarQube -- security rules, data flow analysis, complexity metrics
3. **AI-Assisted Review:** LLM-based reviewers -- architectural anti-patterns, context-dependent smells, cross-file analysis

Performance data: AI code review tools show 42-48% bug detection rates (vs. <20% traditional), 40% time savings, 39% higher PR merge rates, 62% fewer production bugs.

---

## Code Review Anti-Pattern Detection Checklist

A practical checklist for reviewers, synthesized from AWS Well-Architected, DZone, and community sources:

### Structure and Complexity
- [ ] Are there methods longer than ~20 lines? (Long Method)
- [ ] Are there classes with more than one clear responsibility? (God Class)
- [ ] Are there parameter lists longer than 3-4 params? (Long Parameter List)
- [ ] Is there duplicated logic across multiple locations? (Duplicate Code)
- [ ] Are there deeply nested conditionals (>3 levels)?

### Object-Oriented Design
- [ ] Does any method access another object's data more than its own? (Feature Envy)
- [ ] Are there classes with all data and no behavior? (Anemic Domain Model / Data Class)
- [ ] Are there unused inherited methods? (Refused Bequest)
- [ ] Does a change in one class require changes in many others? (Shotgun Surgery)
- [ ] Are there long chains of method calls? (Message Chains)

### Naming and Clarity
- [ ] Are there magic numbers or magic strings without named constants?
- [ ] Do method/variable names accurately describe their purpose?
- [ ] Are comments explaining "what" instead of "why"? (Comments smell)
- [ ] Is there clever/obscure code that requires mental gymnastics to understand?

### Error Handling and Security
- [ ] Are exceptions caught too broadly (catch-all) or silently swallowed?
- [ ] Is user input validated and sanitized before use?
- [ ] Are there hardcoded credentials or secrets?
- [ ] Is SQL constructed via string concatenation?
- [ ] Are error messages exposing internal details?

### Performance
- [ ] Are there N+1 query patterns?
- [ ] Is there unnecessary cloning/copying of data structures?
- [ ] Are there synchronous calls where async would be appropriate?
- [ ] Are large libraries imported for trivial functionality?

### Architecture (for larger changes)
- [ ] Does the change increase coupling between modules?
- [ ] Are there circular dependencies?
- [ ] Does configuration mix with business logic?
- [ ] Are there distributed monolith indicators (shared DBs, synchronous chains)?

---

## Sources (with URLs)

### Foundational References
- [Martin Fowler - Code Smell (bliki)](https://martinfowler.com/bliki/CodeSmell.html)
- [Martin Fowler - Refactoring: Improving the Design of Existing Code, 2nd ed.](https://martinfowler.com/books/refactoring.html)
- [Refactoring Guru - Code Smells](https://refactoring.guru/refactoring/smells)
- [Luzkan Code Smells Catalog](https://luzkan.github.io/smells/)
- [Wikipedia - List of Software Anti-Patterns](https://en.wikipedia.org/wiki/List_of_software_anti-patterns)
- [Wikipedia - Code Smell](https://en.wikipedia.org/wiki/Code_smell)
- [Coding Horror - Code Smells (Jeff Atwood)](https://blog.codinghorror.com/code-smells/)
- [Codesai - On Code Smells Catalogues and Taxonomies](https://codesai.com/posts/2022/11/code-smells-taxonomies-and-catalogs-english)

### Code Smells Taxonomy Gists
- [OOP Code Smells by Fowler/Beck grouped by Mantyla](https://gist.github.com/tgroshon/8715d054b341ed9c2a89f48356829c09)
- [Anti-Pattern Checklist (based on Wikipedia)](https://gist.github.com/Potherca/2e5817a37b1229ea1930)
- [Industrial Logic - Smells to Refactorings Cheatsheet](https://www.industriallogic.com/blog/smells-to-refactorings-cheatsheet/)
- [GitHub - lee-dohm/code-smells](https://github.com/lee-dohm/code-smells)

### Code Review Anti-Patterns
- [AWS Well-Architected - Anti-Patterns for Code Review](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/anti-patterns-for-code-review.html)
- [Simon Tatham - Code Review Antipatterns](https://www.chiark.greenend.org.uk/~sgtatham/quasiblog/code-review-antipatterns/)
- [DEV Community - Code Review Anti-Patterns](https://dev.to/adam_b/code-review-anti-patterns-2e6a)
- [CodeRabbit - 5 Code Review Anti-Patterns You Can Eliminate with AI](https://www.coderabbit.ai/blog/5-code-review-anti-patterns-you-can-eliminate-with-ai)
- [DZone - Code Review Patterns and Anti-Patterns](https://dzone.com/refcardz/code-review-patterns-and-anti-patterns)
- [GitHub - mgreiler/code-review-checklist](https://github.com/mgreiler/code-review-checklist)

### Automated Detection Tools
- [SonarSource - Understanding Code Smells](https://www.sonarsource.com/resources/library/code-smells/)
- [CodeAnt.ai - 10 Best Code Smell Detection Tools 2025](https://www.codeant.ai/blogs/10-best-code-smell-detection-tools-in-2025)
- [DEV Community - Top Code Smell Detection Tools 2025](https://dev.to/pantoai/top-code-smell-detection-tools-in-2025-to-boost-code-quality-mcf)
- [DigitalOcean - 10 AI Code Review Tools 2025](https://www.digitalocean.com/resources/articles/ai-code-review-tools)
- [Konvu - Semgrep vs SonarQube 2026](https://konvu.com/compare/semgrep-vs-sonarqube)

### Academic Papers - ML/Deep Learning Detection
- [Machine Learning-Based Methods for Code Smell Detection: A Survey (MDPI, 2024)](https://www.mdpi.com/2076-3417/14/14/6149)
- [Code smell detection based on supervised learning models: A survey (ScienceDirect, 2023)](https://www.sciencedirect.com/science/article/abs/pii/S0925231223011372)
- [On the adequacy of static analysis warnings with respect to code smell prediction (Springer/PMC, 2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8930969/)
- [A machine-learning based ensemble method for anti-patterns detection (ScienceDirect, 2019)](https://www.sciencedirect.com/science/article/abs/pii/S0164121219302602)
- [Deep Learning Anti-patterns from Code Metrics History (arXiv, 2019)](https://arxiv.org/abs/1910.07658)
- [DeepIaC: deep learning-based linguistic anti-pattern detection in IaC (ACM, 2020)](https://dl.acm.org/doi/10.1145/3416505.3423564)
- [An Anti-Pattern Detection Technique Using Machine Learning (ResearchGate, 2021)](https://www.researchgate.net/publication/351649364_An_Anti-Pattern_Detection_Technique_Using_Machine_Learning_to_Improve_Code_Quality)
- [Python code smells detection using conventional ML models (PMC, 2023)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10280480/)
- [Data Preparation for Deep Learning based Code Smell Detection (arXiv, 2024)](https://www.arxiv.org/pdf/2406.19240)

### Microservice Anti-Patterns
- [Catalog and detection techniques of microservice anti-patterns: A tertiary study (ScienceDirect, 2023)](https://www.sciencedirect.com/science/article/pii/S0164121223002248)
- [Microservices Anti-Patterns: A Taxonomy (arXiv, 2019)](https://arxiv.org/pdf/1908.04101)
- [Automatic Anti-Pattern Detection in Microservice Architectures Based on Distributed Tracing (IEEE, 2022)](https://ieeexplore.ieee.org/document/9794000)
- [Detecting Microservice Architectural Anti-Pattern Indicators Using GNNs (Wiley, 2025)](https://onlinelibrary.wiley.com/doi/10.1002/spe.70035)
- [Automated Code-Smell Detection in Microservices Through Static Analysis (MDPI, 2020)](https://www.mdpi.com/2076-3417/10/21/7800)

### Language/Framework-Specific
- [Detection of code smells in React with TypeScript (ScienceDirect, 2025)](https://www.sciencedirect.com/science/article/abs/pii/S0950584925001740)
- [Characterizing JavaScript Security Code Smells (arXiv, 2024)](https://arxiv.org/html/2411.19358v1)
- [GitHub - codurance/typescript-code-smells](https://github.com/codurance/typescript-code-smells)
- [GitHub - marabesi/smelly-test (JS/TS test smells)](https://github.com/marabesi/smelly-test)
- [The Little Book of Python Anti-Patterns](https://docs.quantifiedcode.com/python-anti-patterns/)
- [DeepSource - Common Anti-Patterns in Python](https://deepsource.com/blog/8-new-python-antipatterns)
- [Three Dots Labs - Common Anti-Patterns in Go Web Applications](https://threedots.tech/post/common-anti-patterns-in-go-web-applications/)
- [7 Rust Anti-Patterns Killing Your Performance (Medium, 2025)](https://medium.com/solo-devs/the-7-rust-anti-patterns-that-are-secretly-killing-your-performance-and-how-to-fix-them-in-2025-dcebfdef7b54)

### Security
- [OWASP Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html)
- [Augment Code - Secure Code Review Checklist: OWASP-Aligned](https://www.augmentcode.com/guides/secure-code-review-checklist-owasp-aligned-framework)

### AI/LLM-Powered Review (2025-2026)
- [AI-powered Code Review with LLMs: Early Results (arXiv, 2024)](https://arxiv.org/html/2404.18496v2)
- [Verdent - Best AI for Code Review 2026](https://www.verdent.ai/guides/best-ai-for-code-review-2026)
- [Addy Osmani - My LLM Coding Workflow Going into 2026](https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e)
- [Latent Space - How to Kill the Code Review](https://www.latent.space/p/reviews-dead)

### CI/CD Integration
- [GitHub Gist - Patterns and Anti-Patterns for CI/CD](https://gist.github.com/michaellihs/ea43fe9eab2ab02db863a3a0686ee5b6)
- [CodeRabbit - How to Run Static Analysis on CI/CD Pipelines Using AI](https://www.coderabbit.ai/blog/how-to-run-static-analysis-on-your-ci-cd-pipelines-using-ai)
- [Bito.ai - Automate Static Code Analysis with GitHub Actions](https://bito.ai/blog/automate-static-code-analysis/)
- [Codefresh - Kubernetes Deployment Antipatterns](https://codefresh.io/blog/kubernetes-antipatterns-1/)
- [Pulumi - Avoiding Kubernetes Anti-Patterns](https://www.pulumi.com/blog/kubernetes-anti-patterns/)

---

## Actionable Insights

### For Wazir's Review Skill

1. **Implement a tiered detection model.** Map to the three-layer architecture: (a) deterministic lint rules catch formatting and simple smells, (b) structural analysis catches complexity/coupling metrics, (c) LLM review catches architectural/contextual anti-patterns. Each tier has different cost and accuracy profiles.

2. **Use Fowler's taxonomy as the canonical smell vocabulary.** The 22 Fowler/Beck smells (5 categories) are universally recognized. Extend with Luzkan's catalog for finer granularity. Every detected issue should map to a named smell with a severity level.

3. **Build language-specific rulesets.** The research shows anti-patterns are highly language-dependent. TypeScript's `any` type, Python's bare `except`, Go's error handling verbosity, and Rust's `.clone()` overuse each require targeted detection logic. A generic checklist misses these.

4. **Prioritize by impact, not by count.** CodeAnt.ai's approach of ranking by severity x impact x frequency is sound. A single God Class matters more than 20 minor naming issues. The review skill should weight architectural smells (Shotgun Surgery, Distributed Monolith) higher than cosmetic smells.

5. **Include security anti-patterns as first-class citizens.** OWASP's secure code review framework maps directly to detectable patterns: SQL concatenation, missing input validation, hard-coded credentials, verbose error messages. These should be Blocker-severity by default.

6. **Address the process anti-patterns too.** The review skill should enforce: small PRs (AWS recommends time-boxing reviews to 30 min), focused scope (no unrelated changes), and constructive tone. Detecting that a PR is too large to review effectively is itself a valuable detection.

7. **Target the under-served domains.** Microservice anti-patterns (58 known patterns, few tools), IaC anti-patterns (Docker tag misuse, secret leakage), and frontend component anti-patterns (God Components, prop drilling) are poorly covered by existing tools. This is where Wazir can differentiate.

8. **Combine human and AI review for maximum coverage.** Research consistently shows 42-48% AI bug detection + human architectural judgment outperforms either alone. The review skill should flag issues for human attention, not attempt to be the sole reviewer. The emerging multi-model consensus approach (e.g., Macroscope v3 using o4-mini-high + Opus 4) suggests that cross-model verification reduces false positives.

9. **Integrate smell-to-refactoring mapping.** Industrial Logic's "Smells to Refactorings" cheatsheet maps each smell to its recommended refactoring. The review skill should not just detect but suggest the specific refactoring technique (Extract Method, Move Method, Replace Conditional with Polymorphism, etc.).

10. **Track smell evolution over time.** CAME's research shows that analyzing code metrics history via VCS improves detection accuracy. The review skill should track whether smells are accumulating (lava flow) or being resolved across PRs.
