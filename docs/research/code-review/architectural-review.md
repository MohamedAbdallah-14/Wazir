# 37 - Architectural Code Review

Research on how to review code for architectural compliance, detect architectural drift,
enforce design principles, and use automated fitness functions to maintain architectural integrity.

---

## Fitness Functions for Your Architecture (InfoQ)

**URL:** https://www.infoq.com/articles/fitness-functions-architecture/

- An architectural fitness function is "any mechanism that provides an objective integrity assessment of some architectural characteristic(s)" -- from *Building Evolutionary Architectures* by Neal Ford, Rebecca Parsons, Patrick Kua, and Pramod Sadalage
- Fitness functions are guardrails that enable continuous evolution of a system's architecture within a desired range and direction -- they can be thought of as automated unit tests for architecture
- With libraries like ArchUnit, writing fitness functions for structural aspects of architecture becomes feasible: checking dependencies between packages/classes, layers/slices, and detecting cyclic dependencies
- Example ArchUnit fitness function for layered architecture enforcement:
  ```java
  noClasses()
    .that().resideInAPackage("..backend..")
    .should().dependOnClassesThat().resideInAPackage("..frontend..");
  ```
- Collecting metrics from static code checkers (PMD, FindBugs/SpotBugs, ESLint, SonarQube) alone does not make a fitness function -- you need fast feedback, clear measures with limits/ranges for tolerated violations, and defined actions for violations
- Using fitness functions fosters communication and collaboration between architects and developers -- architects write their intentions into executable code
- "Shifting left" assessment of architectural characteristics into development teams makes architecture a concern of all people building the software, not just those in architect positions
- Manual architecture reviews and assessments remain valid but come at the cost of speed and scalability; fitness functions protect against unwanted deviations even if manual reviews are also used
- Companies with centralized architecture teams and limited people tend to rely on manual reviews; fitness functions work better for organizations seeking continuous evolution

---

## Building Evolutionary Architectures: Fitness Functions (O'Reilly / Continuous Architecture)

**URL:** https://continuous-architecture.org/practices/fitness-functions/

- Fitness functions are categorized along three dimensions:
  - **Atomic vs. Holistic**: Atomic functions run against a singular context (e.g., a unit test verifying coupling or cyclomatic complexity); holistic functions run against a shared context exercising multiple aspects (e.g., security + scalability)
  - **Triggered vs. Continual**: Triggered functions run based on events (developer running tests, pipeline execution); continual functions execute constant verification (e.g., Monitoring Driven Development tracking transaction speed)
  - **Static vs. Dynamic**: Static functions produce fixed pass/fail results; dynamic functions rely on shifting definitions based on extra context (e.g., response time thresholds that vary by quarter)
- Benefits: communicate/validate/preserve architectural characteristics in an automated and continual manner; clarify expected architecture performance and definition of done; provide real-time feedback on key characteristic failures; produce facts for refactoring plans and architectural runway
- An architect can request changes to architecture concerns which are then verified during the build process
- Fitness functions integrate DevOps constraints and ambitions into architectural work
- The book's 2nd edition subtitle is "Automated Software Governance" -- reinforcing that governance should be automated, not manual

---

## ArchUnit User Guide (archunit.org)

**URL:** https://www.archunit.org/userguide/html/000_Index.html

- ArchUnit is a free, extensible library for checking Java code architecture by analyzing bytecode and importing all classes into a Java code structure
- What ArchUnit can check:
  - **Package Dependency Checks**: Verify allowed/disallowed dependencies between packages
  - **Class Dependency Checks**: Verify class-level dependency rules
  - **Containment Checks**: Ensure classes/packages reside in correct locations
  - **Inheritance Checks**: Validate inheritance hierarchies
  - **Annotation Checks**: Verify correct annotation usage
  - **Layer Checks**: Enforce layered architecture rules (e.g., `layeredArchitecture()` API)
  - **Cycle Checks**: Detect cyclic dependencies between slices/packages
- The **Library API** provides predefined rules for common patterns:
  - `Architectures.layeredArchitecture()` for declaring and enforcing layered structures
  - `SlicesRuleDefinition` for checking cycles between package slices
  - `GeneralCodingRules` for common coding rules (no field injection, etc.)
  - **PlantUML Component Diagrams as rules**: Import a PlantUML diagram and check code conforms to it
  - **Freezing Arch Rules**: Allows "freezing" current violations to only flag new ones -- critical for adopting ArchUnit in legacy codebases
  - **Software Architecture Metrics**: Compute metrics like component dependency, cumulative dependency
- ArchUnit runs as standard JUnit 4/5 tests, integrating seamlessly into existing test suites and CI/CD pipelines

---

## Optimizing Software Architecture: Fitness Functions Using ArchUnit (Kamlesh Kumar)

**URL:** https://kamlesh-kumar.com/optimizing-software-architecture-fitness-functions-using-archunit/

- Architecture fitness functions are an automated and effective way to validate architecture guidelines -- unit tests that check architecture rules in a codebase
- Code reviews and pair programming can keep architecture in check for small teams, but become insufficient when teams are large or geographically distributed
- The most effective way to use fitness functions is integrating them into CI/CD pipelines so they run on every build
- ArchUnit can verify: dependencies between classes/packages, naming conventions, correct annotation usage, code flow in layered architecture
- Practical examples with Spring Boot:
  - Enforce that controller classes reside in specific packages
  - Verify service layer does not depend on controller layer
  - Check that all repository classes are annotated with `@Repository`
- When a fitness function fails, the build itself should fail -- giving developers immediate feedback and preventing violations from merging

---

## Why We Didn't Use an LLM-First Approach for Architectural Drift Detection (Revieko / DEV Community)

**URL:** https://dev.to/anviren/why-we-didnt-use-an-llm-first-approach-for-architectural-drift-detection-1ojc

- Architectural drift is not a single "bad line of code" but a gradual shift in the shape of a codebase: boundaries get blurred, hidden coupling appears, state leaks into wrong places, control flow becomes irregular, repo-specific patterns quietly erode
- A generic LLM can read and reason about code, but architectural drift requires understanding whether a change is **structurally abnormal for this specific repository** -- a pattern can be valid in isolation and still be a bad architectural move in a specific repo
- LLMs lack persistent, evolving memory of a repo's structural norms -- they re-derive from raw code every time, leading to inconsistent and noisy signals
- Revieko built **PhaseBrain** -- a model that tracks roles, boundaries, deviations, and coherence in repo evolution over time
- Their approach: use structural analysis as the primary signal for drift detection, with LLMs as a secondary layer for explanation and summarization
- Key insight: architectural drift detection is "what does this change do to the structure of this system over time?" not "what does this code mean?"
- Structural signals are deterministic and reproducible; LLM outputs are probabilistic and can vary between runs

---

## Using AI Agents to Enforce Architectural Standards (Dave Patten / Medium)

**URL:** https://medium.com/@dave-patten/using-ai-agents-to-enforce-architectural-standards-41d58af235a0

- AI adoption has moved beyond productivity tools into enforcement tooling -- CI/CD workflows are becoming AI-augmented
- In pull requests, AI agents review code for violations of architectural standards (e.g., direct database calls from presentation layers)
- In design reviews, AI parses diagrams and documentation to flag violations or missing components
- The "policy-as-prompt" model is emerging: AI agents check PRs against defined architectural rules and post contextual feedback
- **CodeOps** practice: version-control architectural guidelines and compliance checks alongside application code, enabling AI agents to interpret and enforce policies dynamically
  - Example prompt: "Evaluate this pull request against the CodeOps rules defined in /architecture/policies/microservices.yaml"
  - Creates a closed loop: policy definition -> enforcement -> feedback
- The enforcement model creates four capabilities: real-time policy enforcement, contextual knowledge retrieval, cross-system consistency validation, and architectural drift detection
- Key risk: AI agents may hallucinate violations or miss subtle structural issues -- always pair with deterministic checks

---

## AI Code Review for Solution Architects: Enforcing Patterns Across 100+ Microservices (DEV Community)

**URL:** https://dev.to/uss/ai-code-review-for-solution-architects-how-to-enforce-architectural-patterns-across-100-3fa4

- The real challenge at scale: humans cannot hold 100 services worth of context in their heads during a code review
- At 10 microservices, manual review works; at 50, you need documentation and discipline; at 100+, you need automated architectural governance
- **Qodo's Context Engine** indexes the entire codebase across repositories, detecting code duplication across service boundaries
- Architectural pattern enforcement: define custom rules ("no direct database access from API controllers", "all service-to-service calls must include circuit breaker patterns"); Qodo learns from historical PR comments
- Multi-repo breaking change detection: when a service updates its API contract, Qodo analyzes callers across all repos and surfaces affected services
- Case study (120 microservices, payment processing platform):
  - Before: 3-4 production incidents per quarter from service boundary violations; 2-day average to identify affected services
  - After Qodo: boundary violations caught in PR review; 8 potential incidents prevented in 6 months; duplicate business logic decreased 60%
  - Unexpected benefit: junior developers started submitting architecturally compliant PRs without direct mentorship
- Tool comparison table (Qodo vs. Cursor vs. GitHub CodeQL vs. SonarQube vs. CodeGuru vs. CodeRabbit) across capabilities: cross-repo context, breaking change detection, service boundary violation detection, custom architectural rule engine, ADR learning, dependency graph analysis

---

## Ultimate Architecture Enforcement: Prevent Code Violations at Code-Commit Time (SEI / Carnegie Mellon)

**URL:** https://www.sei.cmu.edu/blog/ultimate-architecture-enforcement-prevent-code-violations-at-code-commit-time/

- Two general approaches to enforce architecture: (1) act as "architecture police" or (2) mentor developers to understand and naturally follow the architecture
- Automated commit-time checks paradoxically fall into the mentoring category because they provide immediate, educational feedback rather than after-the-fact policing
- Their implementation uses SVN hooks that send emails to the architecture team when violations are detected at commit time
- Key elements of their approach:
  - Every new developer goes through quick architecture training
  - Multi-view architecture documentation is published on a wiki with rationale for design decisions
  - Architecture team engages in discussions with developers, improving the architecture based on developer feedback
  - Despite all efforts, violations still crop up -- automated hooks catch them
- The combination of documentation + training + automated checks creates a culture where architecture compliance is natural, not adversarial
- Author: Paulo Merson, 2012 -- one of the earliest advocates of automated architecture enforcement integrated into version control

---

## Introducing Architecture as Code in SonarQube (Sonar)

**URL:** https://www.sonarsource.com/blog/introducing-architecture-as-code-in-sonarqube/

- SonarQube added architecture capabilities based on three stages: **Discover, Formalize, Enforce**
- **1. Visualization (Discover)**: Auto-generates an interactive Architecture Map of your codebase using "levelization" logic
  - Left side: high-level orchestrators/UI; right side: low-level utilities/core domain
  - Dependencies should flow left-to-right; backward arrows indicate layering violations
  - Zoom from high-level modules to specific packages; container "weight" shown by lines of code
- **2. Formalize (Define)**: Intended Architecture Editor for defining target structure
  - Works on allow-list principle: explicitly define which relationships are valid; everything else is forbidden
  - Can create placeholders for components that don't exist yet (e.g., future microservice)
  - Configurable incrementally -- start with high-level components, add detail over time
- **3. Enforce (Catch drift)**: Monitors every analysis for deviations
  - **Forbidden Dependency**: Raises issues when code violates defined relationships (e.g., presentation importing database layer)
  - **Wrong Location**: Detects when files are in incorrect packages/folders according to the model
  - Issues appear in CI/CD pipeline and IDE
- **Architecting for the AI era**: "Vibe, then Verify" workflow -- let AI generate code, then let SonarQube check architectural compliance
  - AI models are probabilistic and may generate circular dependencies or duplicate logic; SonarQube catches violations
- Architecture erosion is insidious: as drift increases, software evolution becomes harder and developer productivity stalls; without tooling, teams realize drift too late
- Currently supports C#, Java, JavaScript, Python, TypeScript

---

## Controlling Software Architecture Erosion: A Survey (de Silva & Balasubramaniam, Journal of Systems and Software, 2012)

**URL:** https://www.sciencedirect.com/science/article/abs/pii/S0164121211002044

- Architecture erosion occurs when the "as-implemented" architecture does not conform to the "as-intended" architecture, degrading system performance and shortening useful lifetime
- The paper classifies approaches into three broad categories:
  - **Minimize erosion**: Process-oriented architecture conformance (code reviews, documentation, training); architecture evolution management (managing change over time)
  - **Prevent erosion**: Architecture design enforcement (code generation, DSLs for design rules); architecture to implementation linkage (continuous bi-directional correlation between architecture spec and code)
  - **Repair erosion**: Architecture restoration via recovery, discovery, and reconciliation techniques
- Key techniques surveyed:
  - **Reflexion models** (Murphy et al.): Compare high-level architectural model with source code to find convergences, divergences, and absences
  - **DSLs for expressing design rules**: Domain-specific languages that declare architectural constraints checkable against code
  - **Runtime conformance checking**: Monitor running systems for architectural violations
  - **Self-adaptation**: Self-healing systems that adapt to maintain architectural integrity without human intervention
- Process-oriented factors: Parnas (1992) highlights inadequate documentation, misunderstood design principles, and poor developer training as key triggers of erosion
- No single strategy is sufficient -- the paper argues for combining multiple approaches
- 153 references, cited by 155+ papers -- foundational survey in the field

---

## What to Look for in a Code Review: SOLID Principles (JetBrains / Trisha Gee)

**URL:** https://blog.jetbrains.com/upsource/2015/08/31/what-to-look-for-in-a-code-review-solid-principles-2/

- Part 5 of a 6-part series on what to look for in code reviews
- Practical code review checklist for each SOLID principle:
  - **SRP (Single Responsibility)**: Look for classes with too many methods/fields, poor LCOM (Lack of Cohesion of Methods) scores, classes that change for multiple unrelated reasons
  - **OCP (Open/Closed)**: Check if adding new behavior requires modifying existing code rather than extending; look for switch/case statements that grow with each feature
  - **LSP (Liskov Substitution)**: Look for explicit casting -- if you must cast an object to some type, you are not using the base class without knowledge of derived classes; check for methods throwing NotImplementedException
  - **ISP (Interface Segregation)**: Look for interfaces with many methods; check if implementations contain methods solely to satisfy the interface (empty methods, throw-not-implemented)
  - **DIP (Dependency Inversion)**: Check that high-level modules don't import/depend on low-level modules directly; both should depend on abstractions
- Not all teams prioritize SOLID checking equally -- it depends on whether the codebase is trying to follow or move toward these principles
- The series also covers: design, readability, naming, style, tests, and performance

---

## Write More SOLID Code (NDepend)

**URL:** https://www.ndepend.com/docs/write-more-solid-code

- NDepend provides automated static analysis rules that objectively detect SOLID violations in .NET code:
  - **SRP**: Rules for "Avoid Types Too Big", "Avoid Types With Too Many Methods/Fields", "Avoid Methods That Are Too Big and Too Complex", "Avoid Methods With Too Many Parameters/Local Variables"
  - **OCP**: Rule "Base class should not use derivatives" detects direct OCP violations; a base class referencing its derived classes means modification is needed for extension
  - **LSP**: Rule "Do implement methods that throw NotImplementedException" detects methods that exist only to satisfy an interface but cannot actually perform the operation
  - **ISP**: Rule "Avoid interfaces too big" (more than 10 methods); rules checking for unused interface members
  - **DIP**: Dependency graph analysis and rules checking that high-level modules depend on abstractions, not concretions
- NDepend generates architecture diagrams showing dependencies between modules, methods, and fields
- Can suggest architecture refactorings: when detecting problematic double dependencies between classes, it suggests splits to remove the cycle
- Estimates technical debt delta since a baseline snapshot, highlighting recent code smells, vulnerabilities, and regressions
- Available as Visual Studio extension, standalone, and CI/CD integration

---

## Using Machine Learning to Detect Design Patterns (SEI / Carnegie Mellon)

**URL:** https://www.sei.cmu.edu/blog/using-machine-learning-to-detect-design-patterns/

- Authors: Robert Nord and Zachary Kurtz (2020) at CMU Software Engineering Institute
- Traditional design pattern detection relies on static analysis of ASTs and structural matching, which is brittle and language-specific
- ML-based approach: train models on labeled examples of design pattern implementations to detect patterns in new codebases
- The approach addresses limitations of rule-based detection:
  - Rule-based tools require exact structural matches and miss variations in implementation
  - ML models can learn to recognize the "intent" of patterns even when implementation varies
  - Works better across diverse codebases with different coding conventions
- FINDER tool detects 22 of 23 GoF design patterns using fine-grained static analysis
- MARPLE (Metrics and Architecture Reconstruction Plug-in for Eclipse) combines design pattern detection with architecture reconstruction
- Design pattern detection aids architecture analysis by revealing the structural vocabulary actually in use -- comparing intended patterns (from architecture docs) with detected patterns (from code) reveals drift

---

## The Architecture Gap: Why Your Code Becomes Hard to Change (Security Boulevard / SonarQube)

**URL:** https://securityboulevard.com/2026/02/the-architecture-gap-why-your-code-becomes-hard-to-change-5/

- The "4:30 PM on a Friday" problem: the correct architectural path requires creating a new interface in the Core layer, implementing it, registering it in DI... but the shortcut (direct reference) takes 3 minutes
- Architecture decay accelerates: each shortcut makes the next shortcut more likely and harder to unwind
- SonarQube's architecture capability turns "following guidelines" from a bureaucratic chore into an automated guardrail
- When you respect structure: tests run faster (components are isolated), refactoring is safer (dependencies are explicit), onboarding is easier (code maps to reality)
- Key message: "Stop the drift. Visualize the reality. Build code you can trust."
- The "Vibe, then Verify" approach to AI-generated code: let AI generate, then verify architectural compliance
- Architecture drift is the "silent killer of engineering velocity"

---

## Architecture Decision Records and Code Review Governance (Multiple Sources)

**URLs:**
- https://github.com/joelparkerhenderson/architecture-decision-record
- https://martinfowler.com/bliki/ArchitectureDecisionRecord.html
- https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/

- ADRs document architectural decisions with context, decision, and consequences
- ADRs serve as reference during code reviews: when a reviewer finds changes that violate an ADR, they share a link to the ADR and request code updates
- Storing ADRs in the code repository enables reviewing them in Pull Requests alongside code changes
- ADRs bridge the gap between architectural intent and implementation by making decisions discoverable, versioned, and reviewable
- AWS best practices: store ADRs in a central accessible location; integrate ADR management into development and code review processes; revise regularly during major project changes
- ADRs combined with automated fitness functions create a powerful governance model: ADRs define the "why" and intent; fitness functions enforce the "what" automatically

---

## OWASP Dependency-Check: Software Composition Analysis (OWASP)

**URL:** https://owasp.org/www-project-dependency-check/

- Dependency-Check is a Software Composition Analysis (SCA) tool that detects publicly disclosed vulnerabilities in project dependencies
- Determines Common Platform Enumeration (CPE) identifiers for dependencies and generates reports linking to CVE entries
- Analysis happens in seven phases: INITIAL, PRE_INFORMATION_COLLECTION, INFORMATION_COLLECTION (populates evidence), IDENTIFIER_ANALYSIS (finds CPE identifiers), POST_IDENTIFIER_ANALYSIS, FINDING_ANALYSIS (matches against NVD CVE data), FINAL
- Supports Java, .NET, Python, Ruby, JavaScript ecosystems
- Available as CLI, Maven plugin, Gradle plugin, Ant task, Jenkins plugin
- Limitations: only covers NVD vulnerabilities; lacks speed and breadth of commercial SCA tools
- Architectural relevance: dependency analysis is a key architectural fitness function -- ensuring the dependency tree conforms to security and licensing policies

---

# Synthesis

## Core Concepts

**Architectural drift** is the gradual divergence between intended architecture and implemented architecture. It manifests as boundary erosion, hidden coupling, pattern violations, and structural inconsistency. Unlike bugs that cause immediate failures, drift silently degrades maintainability and developer productivity until changes become prohibitively expensive.

**Fitness functions** (from *Building Evolutionary Architectures*) provide the primary mechanism for automated architectural governance. They are objective, automated checks that verify architectural characteristics are preserved. They come in multiple dimensions: atomic/holistic scope, triggered/continual cadence, static/dynamic thresholds.

## Layered Defense Model

The research converges on a multi-layered approach to architectural code review:

1. **Design-time prevention**: Architecture Decision Records (ADRs) document intent and rationale; architecture diagrams formalize structure
2. **Development-time enforcement**: ArchUnit/NDepend fitness functions run as unit tests; pre-commit hooks catch violations before code enters the repository
3. **CI/CD-time verification**: SonarQube architecture checks, Qodo cross-repo analysis, and CodeQL queries run in pipelines as quality gates
4. **Review-time validation**: Human reviewers check SOLID compliance, pattern adherence, and architectural intent with AI-assisted tools providing context
5. **Runtime monitoring**: Continual fitness functions and monitoring detect drift in production behavior

## Tools Landscape

| Tool | Focus | Language Support |
|------|-------|-----------------|
| **ArchUnit** | Structural fitness functions (layers, cycles, dependencies) | Java (ArchUnitTS for TypeScript) |
| **NDepend** | SOLID verification, architecture diagrams, technical debt | .NET |
| **SonarQube** | Architecture visualization, intended architecture modeling, drift detection | Java, C#, JS, Python, TS |
| **Qodo** | Cross-repo architectural governance, breaking change detection | Multi-language |
| **OWASP Dependency-Check** | Dependency vulnerability analysis | Multi-language |
| **CodeQL** | Custom architectural queries | Multi-language |
| **FINDER/MARPLE** | Design pattern detection | Java |

## Key Findings for Automated Architectural Review

1. **No single strategy suffices** (de Silva & Balasubramaniam, 2012): Combine process-oriented conformance, design enforcement, implementation linkage, and restoration techniques
2. **Deterministic checks beat probabilistic analysis** (Revieko): Structural analysis should be the primary signal; LLMs are useful as a secondary layer for explanation, not primary detection
3. **Shift-left architecture governance**: Running fitness functions as unit tests gives developers immediate feedback at development time, not post-hoc during audits
4. **Freezing rules enables adoption**: ArchUnit's "freeze" capability allows teams to adopt architectural checks in legacy codebases without fixing all existing violations first
5. **AI accelerates drift**: AI coding assistants solve immediate tasks but risk missing the "big picture" -- SonarQube's "Vibe, then Verify" pattern addresses this
6. **Architecture as Code**: Storing architecture models alongside application code (SonarQube, ADRs) enables versioning, review, and automated verification
7. **Fitness functions foster collaboration**: When architects encode intentions as executable tests, developers understand and discuss architectural rules, bridging the traditional architect-developer gap
8. **SOLID principles are partially automatable**: SRP (class/method size metrics), OCP (base class referencing derivatives), LSP (NotImplementedException), ISP (interface size) can be detected automatically; OCP's "closed for modification" and DIP require more nuanced human review
9. **Cross-service governance requires repo-spanning context**: At scale (50+ microservices), tools must index across repositories to detect duplication, breaking changes, and boundary violations
10. **The goal is education, not policing**: The most effective enforcement models create learning feedback loops rather than adversarial gatekeeping (SEI, 2012)
