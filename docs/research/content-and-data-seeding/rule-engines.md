# Rule Engine Design and Seed Rules for Code Analysis

> Research date: 2026-03-25
> Focus: How linting tools seed default rule sets, rule writing patterns and taxonomies, prioritization strategies, community rule registries, rule lifecycle management, and building custom rule engines for code review.

---

## Semgrep Rule Writing Methodology (https://semgrep.dev/blog/2020/writing-semgrep-rules-a-methodology/)

- Semgrep uses YAML rule files with pattern-oriented matching against AST (Abstract Syntax Tree) representations of source code
- Methodology: create a sample source file with example code snippets, write an initial rule to match, test on one real repo, then scan across many repositories
- **Build in pieces**: when writing complex, multi-part patterns, build incrementally and test each step -- write an initial `pattern` to find the general case, then add `pattern-not` clauses to filter false positives
- **`pattern-either`**: combine multiple pattern clauses under `pattern-either` when code snippets can't all be matched by the same pattern
- **Metavariables** (`$X`, `$WIDGET`, `$USERS_2`) are an abstraction to match code when you don't know the value ahead of time -- similar to regex capture groups. They track values across a specific code scope (variables, functions, arguments, classes, imports, etc.)
- Advanced operators: `metavariable-regex`, `metavariable-pattern`, `focus-metavariable`, taint mode
- After vetting against test examples, clone a real repo and scan it to see if the rule finds what was intended

## Semgrep Community Rules and Registry (https://github.com/semgrep/semgrep-rules)

- The Semgrep Registry contains **2,000+ community-driven rules** covering security, correctness, and dependency vulnerabilities
- Semgrep Code's **Pro rules** include 600+ high confidence rules written by Semgrep's security research team
- Supports **30+ languages**: Apex, Bash, C, C++, C#, Clojure, Dart, Dockerfile, Go, HTML, Java, JavaScript, JSX, JSON, Kotlin, Lua, OCaml, PHP, Python, R, Ruby, Rust, Scala, Solidity, Swift, Terraform, TypeScript, TSX, YAML, XML, and Generic (ERB, Jinja)
- Namespacing format: `<language>/<framework>/<category>/$MORE` -- if no framework, use `lang` in place of `<framework>`
- Rulesets group rules by programming language, OWASP category, or framework
- Rule types: Community rules (reviewed by Semgrep team), Third-party rules (Trail of Bits, GitLab, etc.), Private rules (organization-authored)
- Contributors must sign CLA; PRs require at least one maintainer approval and passing CI

## Semgrep Rule Severity and Confidence (https://semgrep.dev/docs/kb/rules/understand-severities)

- **Confidence levels** (set by rule author, describes rule precision):
  - **HIGH**: Rules using advanced features (metavariable-comparison, taint mode) with targeted patterns -- high true positive rate
  - **MEDIUM**: Security concerns with some false positives; useful in CI/CD pipelines
  - **LOW**: Audit-style rules; expect a fair amount of false positives
- **Severity levels** (four levels): Critical, High, Medium, Low
- **Likelihood**: How likely the impact is to occur (e.g., web app user input = HIGH, OS environment = MEDIUM)
- **Impact**: How much damage the issue can cause (e.g., SQL injection = HIGH, info disclosure = LOW)
- Required metadata for security rules: CWE identifiers, confidence, severity, likelihood, impact
- Findings include `message` (describes the issue) and optional `fix` (creates SCM suggestion in GitHub/GitLab/Bitbucket)

## Semgrep Rule Structure and Syntax (https://semgrep.dev/docs/writing-rules/rule-syntax)

- Rules are YAML files that can have multiple patterns, detailed output messages, and rule-defined fixes
- Composition via Boolean operators: `patterns` (AND), `pattern-either` (OR), `pattern-not` (NOT)
- Structure Mode (2024): Makes it impossible to write an invalid rule, solving YAML errors and indentation mistakes
- Common mistakes: passing a list of YAML strings to the `pattern` operator (only accepts strings)

## Semgrep Multimodal: AI + Rules Combined (https://semgrep.dev/blog/2026/attackers-cant-have-all-the-advantage-introducing-semgrep-multimodal/)

- Launched March 2026: combines AI reasoning with rule-based analysis for detection, triage, and remediation
- Finds up to **8x more true positives** while **cutting noise by 50%** vs. foundation models alone
- Traditional rule-based SAST excels at known patterns (SQLi, SSRF, secrets) but struggles with business logic flaws (IDORs, broken auth)
- LLMs can reason about logic but produce unacceptably high false positive rates alone
- Pairing the Semgrep Pro engine's precise program analysis with LLM reasoning covers both dimensions
- Built on Semgrep Workflows -- teams encode security policies into automated pipelines

## Trail of Bits Semgrep Rules (https://github.com/trailofbits/semgrep-rules)

- 30+ custom Semgrep rules for Ansible playbooks, Java/Kotlin, shell scripts, Docker Compose
- Rules specifically for detecting misconfigurations in Apollo GraphQL server (v3 and v4)
- Used in Trail of Bits' security audits, vulnerability research, and internal projects
- Licensed under AGPLv3
- Trail of Bits also provides a `semgrep-rule-creator` skill that walks through writing and refining custom rules

## Introducing Semgrep to an Organization (https://blog.trailofbits.com/2024/01/12/how-to-introduce-semgrep-to-your-organization/)

- **Incremental rollout**: begin with warning-only mode, establish baselines, tune rules without blocking deployments
- Gartner analysis: organizations implementing security scanning incrementally see **40% faster adoption** and fewer developer friction issues
- Step 1: Pilot test on a single repository
- Step 2: Implement full scan on a schedule on the main branch in CI/CD
- Step 3: Diff-aware scanning on PRs (scan only changes, fine-tuned high-confidence rules)
- Step 4: Configure to block PR pipeline with unresolved findings (mature implementation)

## ESLint Rule Architecture (https://eslint.org/docs/latest/extend/custom-rules)

- Rules are the **core building block** of ESLint -- they validate if code meets expectations and what to do if it doesn't
- Every ESLint rule is an **AST visitor** using the ESTree AST specification
- Rule file exports an object with `meta` and `create` properties
- `meta` object includes: `type` (problem/suggestion/layout), `docs`, `fixable`, `hasSuggestions`, `schema`
- `create()` returns an object with methods ESLint calls to "visit" AST nodes
- `meta.fixable` is **mandatory** for fixable rules (ESLint throws error otherwise)
- `meta.schema` specifies options to prevent invalid rule configurations
- Each core rule has three files: source file, test file, documentation markdown file

## ESLint Rule Categories and Evolution (https://eslint.org/docs/latest/rules/)

- Three main categories:
  - **"Problem" rules**: identify code that will cause errors or confusing behavior
  - **"Suggestion" rules**: identify things that could be done better but won't cause errors
  - **"Layout" rules**: whitespace, semicolons, commas, parentheses (now deprecated)
- **Recommended rules** (`eslint:recommended`): subset enabled by default -- metadata property `meta.docs.recommended: true`
- ESLint v8.53.0 (Nov 2023): **formatting rules formally deprecated** -- moved to ESLint Stylistic project
- Reason: maintaining consistency among core rules became difficult as rules grew from <30 to 300; whitespace management is better handled by formatters
- Rule deprecation policy: rules only removed if replaced by another core rule or a functionally equivalent plugin rule exists

## ESLint Custom Rule Tutorial (https://eslint.org/docs/latest/extend/custom-rule-tutorial)

- Define `create` function accepting a `context` object
- Return an object with a property for each syntax node type to handle
- Can use any ESTree node type or CSS-style selector
- `context.report()` publishes warnings/errors with message, node reference, and optional fix
- Auto-fix via `fix` function that receives a `fixer` object with methods like `replaceText()`, `insertTextBefore()`

## CodeQL Query Structure and Metadata (https://codeql.github.com/docs/writing-codeql-queries/about-codeql-queries/)

- Queries use QL language with `from`, `where`, `select` clauses
- Metadata in QLDoc comments at top of file:
  - **`@kind`**: `problem` (simple alert), `path-problem` (alert with code path), `diagnostic`, `metric`
  - **`@precision`**: proportion of true positives (very-high, high, medium, low)
  - **`@problem.severity`**: `error`, `warning`, `recommendation`
  - **`@security-severity`**: 0.0 to 10.0 scale for security-tagged queries
  - **`@tags`**: broad categories (security, correctness, maintainability, readability)
- Predicates encapsulate reusable query logic (like mini from-where-select queries)
- Classes represent specific data types with custom predicates
- QL tutorials: Introduction to QL, "Catch the fire starter" (predicates/classes), "Crown the rightful heir" (recursion)

## CodeQL Query Suites and Coverage (https://docs.github.com/en/code-security/code-scanning/managing-your-code-scanning-configuration/codeql-query-suites)

- **Default suite**: highly precise queries, few false positives -- runs **479 security queries** covering **169 CWEs**
- **Security-extended suite**: adds **131 additional queries** covering 32 more CWEs
- Every security query is associated with one or more CWEs (most precise CWEs)
- Taint tracking across vulnerability categories: tainted path, zip-slip, XSS, LDAP injection, response splitting
- Data flow tracking through global variables supports nested field access (e.g., `global_var.obj.field`)

## CodeQL Community Packs (https://github.blog/security/vulnerability-research/announcing-codeql-community-packs/)

- Community-driven CodeQL query, library, and extension packs from GitHub Security Lab
- Designed to move Signal-to-Noise ratio closer to low false negatives (useful for security researchers)
- Contributions range from Model As Data (MaD) lines to new queries for novel vulnerability classes
- Queries contributed by CodeQL engineers, GitHub Security Lab researchers, and broader community
- Open source repository welcomes pull requests
- Published to GitHub Packages for public availability

## SonarQube Rule Taxonomy and Quality Profiles (https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-rules/rules)

- **"Sonar way" profile**: built-in default profile for each language; designed as a starting point for most projects
- Rules categorized by software qualities in MQR (Multi-Quality Rule) mode:
  - **Security**: code exploitable by attackers
  - **Reliability**: demonstrably wrong code (bugs)
  - **Maintainability**: confusing/hard-to-maintain code (code smells)
  - **Security Hotspots**: security-sensitive code needing manual review
- A rule may impact **multiple** software qualities, each with its own severity
- **Clean Code attributes**: Consistency, Intentionality, Adaptability, Responsibility
- Severity levels: Blocker, Critical, Major, Minor, Info
- Severity assessment: evaluates impact (crashes? corrupts data?) and likelihood (probability of worst case)
- **Prioritized rules** (Enterprise edition): rules that break quality gate on per-rule per-project basis
- Default rule counts vary by language (e.g., C# ~100 active / ~280 inactive, Java ~250 active / ~100 inactive)
- Target: zero false positives for maintainability/reliability; >80% true positives for vulnerabilities

## SonarQube Software Qualities (https://docs.sonarsource.com/sonarqube-server/user-guide/rules/software-qualities)

- **Security**: protection from unauthorized access, use, or destruction
- **Reliability**: capable of maintaining performance level under stated conditions for stated period
- **Maintainability**: ease of repair, improvement, and understanding of software code
- Traditional issue types: Bug (runtime error), Vulnerability (attack surface), Code Smell (maintainability issue)

## Rules Engine Design Pattern (https://deviq.com/design-patterns/rules-engine-pattern/)

- Three components: rules engine, collection of rules, and input to evaluate
- **Conditions and Actions**: conditions field stores trigger logic; actions field defines what happens when conditions met
- Evaluation: system runs through all rules, picks ones where condition is true, evaluates corresponding actions in priority order
- Replaces long if-else or switch statements; useful when data may match multiple conditions
- Follows **Single Responsibility Principle** (each rule in own class) and **Open/Closed Principle** (add rules without changing system)
- Related patterns: Command (encapsulate actions), Interpreter (composable expressions), Mediator (orchestrate components), Observer (notify on trigger)

## Martin Fowler on Rules Engines (https://martinfowler.com/bliki/RulesEngine.html)

- **Simple approach**: create objects with conditions and actions, store in collection, evaluate conditions and execute actions
- **Avoid complex rules engine products** -- each case Fowler encountered didn't work out well
- **Problem with rule chaining**: sounds appealing but easily becomes very hard to reason about and debug
- **Recommendation**: build domain-specific rules engines with a narrow context rather than adopting comprehensive products
- **Best practice**: prototype with both a product and a hand-rolled domain-specific approach to compare

## Building a Rules Engine from First Principles (https://towardsdatascience.com/building-a-rules-engine-from-first-principles/)

- Challenge: truth tables appear "impossibly large" but are actually **sparse matrices** in disguise
- Knowledge base compiled into a **state vector** (sparse matrix representation)
- Logical inference reduced to **algebraic manipulations** -- straightforward implementation
- Avoids calculating giant truth tables during inference
- Packaged as open-source Python library: `vector-logic`
- Positioned between nested if-else (cumbersome) and automated theorem provers/SMT solvers (overkill)

## Building Custom Rule Engines (https://amzi.com/articles/rule_engines.htm)

- Major goal: reduce the **semantic gap** between problem-domain rule expression and code
- Rule format: 'if-then' syntax, or more generally 'left hand side (LHS)' and 'right hand side (RHS)'
- Rule engine decides which rules to activate and in what order, based on data
- Execution order is **determined dynamically** as a function of input data
- Custom rule language should: mate well with problem domain, provide domain-relevant integration tools, process rules sensibly
- Not encumbered with unneeded features; moldable to express specifications almost exactly as written
- Prolog's built-in pattern-matching and search capabilities are powerful for implementation, but design is language-independent

## json-rules-engine (https://github.com/CacheControl/json-rules-engine)

- Lightweight Node.js library for defining business rules in pure JSON
- Core concepts: **Conditions** (evaluated per rule), **Facts** (input dataset), **Events** (outcomes when conditions met)
- Dynamic evaluation at runtime -- real-time responsiveness to changing conditions
- Rules persist to JSON via `rule.toJSON()` and restore via Rule constructor
- Custom operators for comparison logic (strings, arrays, numbers, etc.)
- Use cases: dynamic pricing, RBAC, fraud detection, notification systems, chatbot logic

## Microsoft RulesEngine (https://github.com/microsoft/RulesEngine)

- Open-source .NET library for JSON-based rules with dynamic expression support
- Rules stored as JSON using .NET lambda expression syntax
- **Workflow** = container for group of rules; each rule has name, expression, parameters, success/failure actions
- `RuleExpressionParser` for expression evaluation without full engine
- Benefit: update rule definitions without redeploying application
- Available as NuGet package

## AI-Powered Code Review with Custom Rules (https://www.kinde.com/learn/ai-for-software-engineering/code-reviews/ai-code-review-automation-building-custom-linting-rules-with-llms/)

- AI-powered code review uses LLMs to analyze changes based on **natural language rules**
- Unlike traditional linters (rigid, predefined checks), AI reviewers understand intent and context
- Rules as natural language instructions: "Ensure all new public API endpoints include rate limiting" or "Verify that database transactions have proper error handling"
- Architecture: CI/CD pipeline triggers job on PR, sends code changes + custom rules to LLM
- Can enforce architectural patterns, security rules, and team-specific standards

## Custom Instructions for Code Review Tools (https://docs.github.com/en/copilot/tutorials/use-custom-instructions)

- GitHub Copilot, Rovo Dev: custom instructions in `.github/copilot-instructions.md` or `.rovodev/.review-agent.md`
- Guidelines as files in repository -- agent automatically follows project-specific standards
- Every relevant review comment includes **Citations section** linking to triggering guideline
- Best practice: clear, focused, actionable rules addressing one topic at a time, with examples of good and bad practices

## Linting Rules: From Enforcement to Education (https://medium.com/agoda-engineering/how-to-make-linting-rules-work-from-enforcement-to-education-be7071d2fcf0)

- Problem: when rules introduced without context, developers add `eslint-disable` comments or disable entire files
- When linting perceived as **punitive** rather than helpful, developers focus on silencing the linter
- Solution: shift from **policing to teaching** -- explain the "why" behind rules
- **Fail-fast in IDE** (warnings) is less disruptive than CI failures
- Every rule should have clear explanation and link to documentation
- **"Warning only" period** before enforcement: allows team to adjust and provide feedback
- Linting rules shouldn't be static -- build process to review and refine standards regularly
- Highlight a specific rule each week, explaining purpose and demonstrating good practices

## Introducing New Lint Rules Incrementally (https://dev.to/christiankohler/one-bite-at-a-time-how-to-introduce-new-lint-rules-in-a-large-codebase-37ph)

- Enable new rule while ensuring nobody introduces new violations
- **Two config approach**: main config + extended config with new rules; enforce extended config via pre-commit hook
- **"Hold the Line"**: run tools only on new changes, not old code -- adopt without running on entire codebase
- **Baseline configurations**: snapshot current warnings, only report new issues
- **Lint to the Future**: tool for progressively improving codebase over time
- **lint-blame**: blames lint complaints to enable incremental adoption of new rules

## Notion's Ratcheting System (https://www.notion.com/blog/how-we-evolved-our-code-notions-ratcheting-system-using-custom-eslint-rules)

- Open-sourced as **eslint-seatbelt** -- gradually enforces lint rules without compromising developer velocity
- Maintains database tracking error counts for all lint rules and files
- Existing errors treated as **temporarily acceptable** while preventing new instances
- When developer fixes existing error, system **automatically decreases allowed count** via pre-commit hook
- When developer adds new error, CI pipeline **blocks merge**
- Implementation: ESLint custom processor that downgrades errors to warnings when count <= ratchet file threshold
- "Ratcheting" ensures errors trend **downward in steady, irreversible process**

## Progressive Lint (https://medium.com/quintoandar-tech-blog/progressive-lint-how-to-continuously-improve-the-codebase-507f823b1d38)

- Start with applying linters to **new code only**, gradually refactoring existing code
- Incremental adoption: baseline ignoring current issues, enforce on new changes
- Each project may require different linting rules -- that's expected
- If a rule doesn't help you, remove it -- purpose is to make developer life easier

## Rule Severity Classification Research (https://link.springer.com/article/10.1007/s42979-023-01979-8)

- Severity classification helps developers better understand code smells and **prioritize refactoring operations**
- Machine learning models for severity classification: XGBoost achieved **99.12% accuracy** using Chi-square feature selection for long method code smell
- Deep learning approaches (DeepCSS) also applied to severity classification
- Research shows correlation between code smells and security vulnerabilities

## Seven Pernicious Kingdoms: Software Security Error Taxonomy (https://cwe.mitre.org/documents/sources/SevenPerniciousKingdoms.pdf)

- Vulnerability categories = "phyla"; collections sharing theme = "kingdoms"
- First seven kingdoms: security defects in source code
- Eighth kingdom: security issues outside actual code
- Basis for CWE (Common Weakness Enumeration) -- CWE-699 covers **40 categories** of coding weaknesses
- Maps to OWASP Top 10 for broader risk assessment

## Static Analysis Tool Effectiveness Research (https://www.researchgate.net/publication/236594107_Static_analysis_of_source_code_security_Assessment_of_tools_against_SAMATE_tests)

- Studies show average **precision of 0.7** and average **recall of 0.527** across analyzed tools
- Repeatable methodologies allow ranking tools by vulnerability coverage and effectiveness
- Major issue: large number of false positives (low precision / high FPR)
- Precision and recall often show **inverse relationship** -- improving one worsens the other
- Hybrid pipeline recommended: LLMs for broad context-aware triage, deterministic rule-based scanners for high-assurance verification

## Detection as Code (https://www.splunk.com/en_us/blog/learn/detection-as-code.html)

- Treats detections like software: **versioned, owned, testable, automated**
- Detections written in query languages (e.g., Sigma), stored in Git, deployed via CI/CD
- Every rule is peer-reviewed, tested against historical data, easily audited
- Detection engineering lifecycle: continuous feedback loop of visibility, threat modeling, DaC, validation
- Traditional management suffers from: lack of version control, no peer review, testing gaps, deployment inconsistencies, rollback challenges

## Code Review in the Age of AI (https://addyo.substack.com/p/code-review-in-the-age-of-ai)

- AI increases volume: PRs ~18% larger, incidents per PR up ~24%, change failure rates up ~30%
- Properly configured AI reviewers catch **70-80% of low-hanging fruit**, freeing humans for architecture and business logic
- Reviewing AI-generated code is "more taxing" than human code
- Only 48% of developers consistently check AI-assisted code before committing
- ~45% of AI-generated code contains security flaws
- Human sign-off evolving to focus on: roadmap alignment, institutional context, security
- Recommended: review tests first for AI-generated changes

## Open Source Linting Tools Comparison (https://github.com/VahidN/awesome-static-analysis)

- **RuboCop** (Ruby): 700+ customizable cops covering style, performance, security
- **Pylint** (Python): comprehensive default rules covering wide range of issues
- **PMD** (Java/others): huge set of rules for unused variables, empty catch blocks, unnecessary objects
- **Checkstyle** (Java): style/conventions focus -- Javadoc, whitespace, braces, naming conventions
- **ESLint** (JavaScript): started <30 rules, grew to 300; plugin architecture for extensibility
- Philosophy varies: Pylint enforces strict standards; RuboCop is flexible per community style guide
- PMD provides deeper analysis than Checkstyle (flaws vs. formatting)

## ESLint Rule Deprecation Policy (https://eslint.org/docs/latest/use/rule-deprecation)

- Rules deprecated as needed and marked in all documentation
- Only removed if replaced by another core rule or functionally equivalent plugin exists
- Per semantic versioning: deprecated rules remain in current major version, removed in next major
- Deprecation is initially only a documentation change
- ESLint Stylistic project took over formatting rules maintenance

## CWE and OWASP Mapping (https://owasp.org/www-project-cwe-toolkit/)

- CWEs mapped to OWASP Top 10 categories (2017, 2021, 2025)
- Static analysis tools generate CWE IDs to benchmark against OWASP Top 10
- CWE-to-OWASP mappings vary among vendor implementations
- OWASP Top 10 2025: expanded from code-level issues to include supply chain security

---

## Synthesis

### How Linting Tools Seed Their Default Rule Sets

1. **Curated "recommended" sets**: ESLint uses `meta.docs.recommended: true` on individual rules to mark them for the recommended config. SonarQube ships a "Sonar way" profile per language (e.g., ~250 active Java rules out of ~350). Semgrep organizes 2,000+ community rules into named rulesets by language, OWASP category, and framework.
2. **Layered profiles**: CodeQL offers Default (479 queries, 169 CWEs) and Security-Extended (+131 queries, +32 CWEs). SonarQube allows profile inheritance and customization. ESLint uses flat config with composable extends.
3. **Community-driven growth**: Semgrep Registry accepts community contributions via CLA-signed PRs. CodeQL Community Packs (GitHub Security Lab) accept Model-as-Data contributions and new queries. ESLint's plugin ecosystem has thousands of third-party rules.

### Rule Writing Patterns and Taxonomies

1. **Pattern categories by impact**:
   - **Security**: SQL injection, XSS, SSRF, secrets exposure, tainted path (CWE-mapped)
   - **Reliability/Correctness**: null dereference, array bounds, unreachable code, resource leaks
   - **Maintainability**: code smells, complexity, naming conventions, dead code
   - **Style/Formatting**: whitespace, semicolons, braces (increasingly delegated to formatters)
2. **Rule structure patterns**: Semgrep (YAML + code-like patterns), ESLint (JS AST visitors), CodeQL (QL from-where-select), SonarQube (Java-based analyzers)
3. **Metadata taxonomy**: severity (blocker/critical/major/minor/info), confidence (high/medium/low), precision, CWE mapping, OWASP category, tags, fixability

### How to Prioritize Which Rules to Implement First

1. **Security-critical first**: rules with HIGH confidence and HIGH impact (SQL injection, XSS, SSRF, secrets)
2. **High true-positive rate**: start with rules that produce few false positives to build developer trust
3. **Diff-aware scanning**: apply strict rules only to new/changed code initially
4. **Incremental rollout**: warning-only period -> CI reporting -> PR blocking (Semgrep's recommended 4-step approach)
5. **Ratcheting**: Notion's pattern of tracking error counts and preventing new violations while allowing gradual cleanup
6. **Bug-prone patterns**: rules detecting demonstrably wrong code (null deref, resource leaks, off-by-one)

### Rule Lifecycle Management

1. **Introduction**: warning-only period, IDE integration, developer education (explain "why")
2. **Adoption**: baseline existing violations, enforce on new code only, "hold the line"
3. **Maturation**: tune false positives, adjust severity, add autofix suggestions
4. **Evolution**: update patterns as frameworks change, add new variants
5. **Deprecation**: mark deprecated in docs, maintain for current major version, remove in next major
6. **Retirement**: replace with improved rules or delegate to specialized tools (e.g., formatters)

### Design Principles for a Custom Rule Engine

1. **Keep it simple**: Martin Fowler advises against complex rule engine products -- build domain-specific engines with narrow context
2. **Separate rules from processing**: Single Responsibility Principle -- each rule in its own module
3. **Conditions + Actions pattern**: evaluate conditions against input, execute matching actions in priority order
4. **Declarative rule format**: reduce semantic gap between problem-domain expression and code
5. **Composability**: support AND/OR/NOT composition of conditions (Semgrep's patterns/pattern-either/pattern-not)
6. **Metadata-rich**: every rule carries severity, confidence, CWE, tags, documentation, fix suggestions
7. **Testable**: every rule has test cases with true positive and false positive examples
8. **Feedback loop**: track false positive rates, analyst feedback, auto-tune thresholds

### The Emerging Hybrid Model: Rules + AI

1. Semgrep Multimodal (2026): combines rule-based SAST with LLM reasoning -- 8x more true positives, 50% less noise
2. Traditional rules excel at known patterns; LLMs handle business logic, context, and intent
3. Natural language rules for AI reviewers complement AST-based rules for deterministic checks
4. Detection-as-Code principles apply to both: version control, testing, peer review, CI/CD deployment
5. Human oversight remains essential: ~45% of AI-generated code has security flaws, review is evolving not disappearing

### Recommended Seed Rule Categories for a New Tool

Based on this research, a new code analysis rule engine should seed with rules in this priority order:

1. **Security - Critical** (HIGH confidence): injection flaws, secrets exposure, authentication bypass
2. **Security - High** (HIGH confidence): XSS, SSRF, path traversal, insecure deserialization
3. **Correctness - Bugs** (HIGH confidence): null dereference, resource leaks, type errors, unchecked returns
4. **Security - Medium** (MEDIUM confidence): information disclosure, insecure defaults, missing encryption
5. **Maintainability - High Impact**: excessive complexity, duplicated logic, dead code
6. **Best Practices**: error handling patterns, logging standards, API contract violations
7. **Performance**: known anti-patterns (N+1 queries, unnecessary allocations, blocking operations)
8. **Style/Consistency**: naming conventions, import ordering (lowest priority, consider delegating to formatters)

---

## All Sources

- [Semgrep Rule Writing Methodology](https://semgrep.dev/blog/2020/writing-semgrep-rules-a-methodology/)
- [Semgrep Community Rules Repository](https://github.com/semgrep/semgrep-rules)
- [Semgrep Rule Structure Syntax](https://semgrep.dev/docs/writing-rules/rule-syntax)
- [Semgrep Rule Severity Levels](https://semgrep.dev/docs/kb/rules/understand-severities)
- [Semgrep Contributing Guide](https://semgrep.dev/docs/contributing/contributing-to-semgrep-rules-repository)
- [Semgrep Structure Mode](https://semgrep.dev/blog/2024/structure-mode-never-write-an-invalid-semgrep-rule/)
- [Semgrep Multimodal Launch](https://semgrep.dev/blog/2026/attackers-cant-have-all-the-advantage-introducing-semgrep-multimodal/)
- [Semgrep Multimodal Press Release](https://www.businesswire.com/news/home/20260319711078/en/Semgrep-Launches-Multimodal-Combining-AI-Reasoning-With-Rule-Based-Analysis-for-Detection-Triage-and-Remediation)
- [Semgrep Run Rules](https://semgrep.dev/docs/running-rules)
- [Semgrep Policies](https://semgrep.dev/docs/semgrep-code/policies)
- [Trail of Bits Semgrep Rules](https://github.com/trailofbits/semgrep-rules)
- [Trail of Bits: How to Introduce Semgrep](https://blog.trailofbits.com/2024/01/12/how-to-introduce-semgrep-to-your-organization/)
- [Trail of Bits Semgrep Rule Creator](https://github.com/trailofbits/skills/tree/main/plugins/semgrep-rule-creator)
- [Semgrep Building Enterprise-Ready Program](https://semgrep.dev/blog/2022/building-enterprise-ready-scalable-program/)
- [ESLint Custom Rules](https://eslint.org/docs/latest/extend/custom-rules)
- [ESLint Custom Rule Tutorial](https://eslint.org/docs/latest/extend/custom-rule-tutorial)
- [ESLint Rules Reference](https://eslint.org/docs/latest/rules/)
- [ESLint Core Concepts](https://eslint.org/docs/latest/use/core-concepts/)
- [ESLint Architecture](https://eslint.org/docs/latest/contribute/architecture/)
- [ESLint Rule Deprecation](https://eslint.org/docs/latest/use/rule-deprecation)
- [ESLint Deprecating Formatting Rules](https://eslint.org/blog/2023/10/deprecating-formatting-rules/)
- [ESLint Configuration Files](https://eslint.org/docs/latest/use/configure/configuration-files)
- [CodeQL About Queries](https://codeql.github.com/docs/writing-codeql-queries/about-codeql-queries/)
- [CodeQL Metadata for Queries](https://codeql.github.com/docs/writing-codeql-queries/metadata-for-codeql-queries/)
- [CodeQL Query Suites](https://docs.github.com/en/code-security/code-scanning/managing-your-code-scanning-configuration/codeql-query-suites)
- [CodeQL CWE Coverage](https://codeql.github.com/codeql-query-help/codeql-cwe-coverage/)
- [CodeQL Query Metadata Style Guide](https://github.com/github/codeql/blob/main/docs/query-metadata-style-guide.md)
- [CodeQL Community Packs](https://github.com/GitHubSecurityLab/CodeQL-Community-Packs)
- [Announcing CodeQL Community Packs](https://github.blog/security/vulnerability-research/announcing-codeql-community-packs/)
- [CodeQL Community Contributions](https://github.blog/2022-01-05-how-the-community-powers-github-advanced-security-with-codeql-queries/)
- [Sharing Security Expertise Through CodeQL Packs](https://github.blog/security/vulnerability-research/sharing-security-expertise-through-codeql-packs-part-i/)
- [CodeQL Repository](https://github.com/github/codeql)
- [CodeQL Zero to Hero Part 2](https://github.blog/developer-skills/github/codeql-zero-to-hero-part-2-getting-started-with-codeql/)
- [CodeQL Zero to Hero Part 3](https://github.blog/security/vulnerability-research/codeql-zero-to-hero-part-3-security-research-with-codeql/)
- [Custom CodeQL Queries Guide](https://github.com/readme/guides/custom-codeql-queries)
- [SonarQube Rules](https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-rules/rules)
- [SonarQube Software Qualities](https://docs.sonarsource.com/sonarqube-server/user-guide/rules/software-qualities)
- [SonarQube Quality Profiles](https://docs.sonarsource.com/sonarqube-server/10.8/instance-administration/analysis-functions/quality-profiles)
- [SonarQube Clean Code Analysis](https://docs.sonarsource.com/sonarqube-server/10.8/core-concepts/clean-code/code-analysis)
- [SonarQube Clean as You Code](https://www.sonarsource.com/blog/clean_coding-quality_profile_quality_gate_guidance/)
- [Rules Engine Pattern - DevIQ](https://deviq.com/design-patterns/rules-engine-pattern/)
- [Rules Engine Design Patterns - Nected](https://www.nected.ai/blog/rules-engine-design-pattern)
- [Martin Fowler: Rules Engine](https://martinfowler.com/bliki/RulesEngine.html)
- [Building Rules Engine from First Principles](https://towardsdatascience.com/building-a-rules-engine-from-first-principles/)
- [Building Custom Rule Engines - Amzi](https://amzi.com/articles/rule_engines.htm)
- [Basic Rules Engine Design Pattern](https://tenmilesquare.com/resources/software-development/basic-rules-engine-design-pattern/)
- [json-rules-engine](https://github.com/CacheControl/json-rules-engine)
- [Microsoft RulesEngine](https://github.com/microsoft/RulesEngine)
- [How to Write a Basic Rule Engine in Python](https://dev.to/fractalis/how-to-write-a-basic-rule-engine-in-python-3eik)
- [AI Code Review Automation with LLMs - Kinde](https://www.kinde.com/learn/ai-for-software-engineering/code-reviews/ai-code-review-automation-building-custom-linting-rules-with-llms/)
- [GitHub Copilot Custom Instructions for Code Review](https://docs.github.com/en/copilot/tutorials/use-custom-instructions)
- [Bito Custom Code Review Rules](https://docs.bito.ai/ai-code-reviews-in-git/implementing-custom-code-review-rules)
- [Agoda: Linting Rules Enforcement to Education](https://medium.com/agoda-engineering/how-to-make-linting-rules-work-from-enforcement-to-education-be7071d2fcf0)
- [One Bite at a Time: Introducing Lint Rules](https://dev.to/christiankohler/one-bite-at-a-time-how-to-introduce-new-lint-rules-in-a-large-codebase-37ph)
- [Progressively Improving with Lint to the Future](https://mainmatter.com/blog/2025/03/03/lttf-process/)
- [Notion's Ratcheting System](https://www.notion.com/blog/how-we-evolved-our-code-notions-ratcheting-system-using-custom-eslint-rules)
- [Progressive Lint - QuintoAndar](https://medium.com/quintoandar-tech-blog/progressive-lint-how-to-continuously-improve-the-codebase-507f823b1d38)
- [eslint-seatbelt (Notion's ratcheting tool)](https://github.com/justjake/eslint-seatbelt)
- [Code Review in the Age of AI - Addy Osmani](https://addyo.substack.com/p/code-review-in-the-age-of-ai)
- [Evaluating LLMs for Code Review](https://arxiv.org/html/2505.20206v1)
- [Detection as Code - Splunk](https://www.splunk.com/en_us/blog/learn/detection-as-code.html)
- [Detection-as-Code CI/CD Guide](https://blog.runreveal.com/runreveal-detection-cicd-guide/)
- [Seven Pernicious Kingdoms Taxonomy](https://cwe.mitre.org/documents/sources/SevenPerniciousKingdoms.pdf)
- [CWE-1344 OWASP Top Ten Mapping](https://cwe.mitre.org/data/definitions/1344.html)
- [OWASP CWE Toolkit](https://owasp.org/www-project-cwe-toolkit/)
- [Static Analysis Taxonomy](https://www.researchgate.net/publication/251940397_Taxonomy_of_static_code_analysis_tools)
- [Static Analysis Tools Assessment (SAMATE)](https://www.researchgate.net/publication/236594107_Static_analysis_of_source_code_security_Assessment_of_tools_against_SAMATE_tests)
- [Severity Classification of Code Smells (Springer)](https://link.springer.com/article/10.1007/s42979-023-01979-8)
- [DeepCSS: Severity Classification for Code Smell](https://link.springer.com/article/10.1007/s10664-025-10637-x)
- [Awesome Static Analysis](https://github.com/VahidN/awesome-static-analysis)
- [Lint (software) - Wikipedia](https://en.wikipedia.org/wiki/Lint_(software))
