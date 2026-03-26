# Security -- Research vs Vision Comparison

## Strengths

1. **The Composer's auto-module system is well-designed for security injection.** The vision (Architecture > The Composer) specifies that `auto.all-stacks.all-roles` includes "security, secrets, performance, tech-debt" modules loaded into every agent automatically. This directly addresses findings from `security-code-review.md` (Actionable Insight #1) that security review should be context-aware and embedded into every review phase, not bolted on. The always-on injection means no agent can accidentally skip security checks.

2. **Cross-model review catches security blind spots.** The vision's 4-pass final review (Pipeline > Completion Pipeline, Stages 3-7) with cross-model passes directly addresses findings from `owasp-patterns.md` (Source 14, Academic SLR) that LLM-generated code has a 12-65% non-compliance rate with secure coding standards. Using a different model family for passes 3-4 maximizes the chance of catching security issues that the primary model has blind spots for.

3. **Fresh agent per stage eliminates context poisoning of security findings.** The vision principle "Every agent is born, does one job, and dies" (Architecture > Agents Are Stateless Workers) means a reviewer performing security analysis gets a clean context without being anchored by the executor's reasoning about why something is "safe enough." This aligns with `security-code-review.md` (Review Methodology > Hybrid Approach) where independent review context is critical for catching security issues.

4. **Expertise modules as the moat aligns with checklist-driven security review.** The vision's `composition-map.yaml` system (Architecture > The Composer) maps directly to the OWASP checklist-driven approach from `owasp-patterns.md` (Synthesis > Key Patterns, item #2). Stack-specific expertise modules can encode language-specific security risks (e.g., JavaScript prototype pollution, Python unsafe deserialization) as documented in `owasp-patterns.md` (Source 11, Language-Specific Security Guides).

5. **Verification generates proof, not assertions.** Vision Principle #11 directly supports the security review finding from `security-code-review.md` (Key Finding #1) that manual review with evidence remains one of the most effective ways to prevent vulnerabilities. The verifier stage checking for tautological tests (93% coverage / 58% mutation score gap) catches the exact problem where security tests exist but prove nothing.

6. **The review mechanism checks against original input.** Vision (Review Mechanism > "Why original input as reference") ensures security requirements stated by the user cannot be silently dropped through 5+ transformations. This is critical because `owasp-patterns.md` (Source 4, ASVS) and `security-code-review.md` (12-Point Checklist) both emphasize that security requirements must be traceable from specification to implementation.

## Weaknesses

1. **No explicit security review pass in the subtask pipeline.** The vision's subtask pipeline (Execution Pipeline > The Subtask Pipeline) has three stages: Execute, Review, Verify. The review stage is loaded with `always.reviewer` + `reviewer_modes.task-review` + stack antipatterns + auto modules. But there is no dedicated security review pass. The research is unambiguous: `security-code-review.md` (Key Finding #8) states "Layered tooling is non-negotiable. No single tool category provides complete coverage." The vision treats security as a dimension of general review, not a first-class concern. The `owasp-patterns.md` synthesis (Key Patterns, item #1) identifies data flow tracing (source-sink analysis) as "the most effective manual review technique" -- this requires dedicated focus, not a checkbox within a general review.

2. **No mention of supply chain security anywhere in the pipeline.** The vision document does not reference dependency review, SCA scanning, lockfile integrity, SBOM generation, or any supply chain security concern. The `supply-chain.md` research documents that supply chain attacks grew 156% YoY (Sonatype 2024), OWASP now ranks supply chain failures at #3 (2025 Top 10), and the September 2025 npm compromise hit 2.6B weekly downloads. The vision's DISCOVER phase scans the codebase and does online research, but never audits the dependency tree. The PLAN phase creates subtask files with acceptance criteria, but no subtask checklist item validates dependency changes.

3. **No secrets detection gate in the pipeline.** The vision mentions no pre-commit, pre-merge, or CI-level secrets scanning. `secrets-detection.md` documents 39 million secrets leaked on GitHub in 2024, with 70% of 2022 secrets still active in 2025. The research shows AI coding assistants increase leakage by 40% -- directly relevant since Wazir's agents generate code. The vision's executor agents write code via tool calls. Nothing in the pipeline prevents an agent from generating code containing hardcoded credentials, placeholder API keys, or test secrets that make it into the final artifact.

4. **No IaC security review methodology.** The vision's review checklists (Phase 4, Phase 6, Phase 8) cover spec/design/plan quality dimensions but have no IaC-specific checklist items. `infrastructure-security.md` documents that 80% of cloud security incidents stem from misconfigurations and IaC templates contain misconfigurations in over 60% of deployments. If a Wazir run produces Terraform, CloudFormation, Kubernetes manifests, or Dockerfiles, nothing in the pipeline specifically validates those artifacts against CIS benchmarks, checks for overly permissive IAM, or lints Dockerfiles.

5. **No data flow / taint analysis requirement.** The vision's review stages check "internal consistency" and "input alignment" but never require tracing data flow from sources to sinks. `security-code-review.md` (Key Finding #4, Taint Analysis Deep Dive) establishes taint analysis as "the gold standard for injection detection." The `owasp-patterns.md` synthesis (Key Pattern #1) identifies source-sink analysis as the single most effective review technique. The vision does not instruct reviewers to trace user input through the implementation to identify injection, XSS, path traversal, SSRF, or command injection vulnerabilities.

6. **The vision treats LLM-generated code as equivalent to human code.** `owasp-patterns.md` (Source 14) documents that 12-65% of LLM-generated code has security vulnerabilities, and `secrets-detection.md` (AI Copilots section) shows ~30% of Copilot-generated code contains security weaknesses across 43 CWE categories. The vision's execution pipeline has no additional security scrutiny for agent-generated code versus human code. Given that ALL code in Wazir is LLM-generated, this is a systematic blind spot.

7. **OWASP Top 10 not referenced as a review framework.** Despite the research corpus containing detailed OWASP Top 10:2021 and 2025 mappings (`owasp-patterns.md` Sources 3-6, `security-code-review.md` OWASP Top 10:2025 section), the vision's review checklists (Phase 4: completeness/consistency/clarity/verifiability/scope/YAGNI; Phase 6: feasibility/spec-alignment/completeness/trade-offs/YAGNI/security-performance) reference "security" as a single word alongside "performance" rather than decomposing it into actionable vulnerability categories.

## Critical to Edit

### C1: Add secrets detection as a pipeline gate

**Research finding:** `secrets-detection.md` -- 39M secrets leaked on GitHub in 2024. AI coding assistants increase secret leakage by 40%. Pre-commit hooks are necessary but insufficient; defense-in-depth requires pre-commit + CI/CD + continuous monitoring. Average cost of a credential breach is $4.88M.

**Why it's critical:** Every piece of code in Wazir is LLM-generated. LLMs are documented to produce hardcoded credentials, placeholder API keys, and test tokens. Without a secrets gate, Wazir could ship code with embedded secrets. This is not a quality issue -- it is a direct security liability.

**Suggested edit:** In the Execution Pipeline > The Subtask Pipeline > Stage 1: Execute section, after "Linter gating on every edit (syntax validation before persisting)", add:

> **Secrets gating on every commit.** Every micro-commit is scanned for secrets (API keys, tokens, credentials, PII) before persisting. Scan uses pattern matching + entropy analysis. Any detected secret blocks the commit and triggers a fresh fix executor. This is non-negotiable: LLM-generated code has a 40% higher secret leakage rate than human code.

### C2: Add supply chain security checks to the review pipeline

**Research finding:** `supply-chain.md` -- Supply chain attacks grew 156% YoY. OWASP 2025 Top 10 ranks supply chain failures #3. Lockfile injection is an underreviewed attack surface. Slopsquatting (AI-hallucinated packages) is a new vector with 5.2-21.7% hallucination rates.

**Why it's critical:** AI agents hallucinate package names. If a Wazir executor agent adds a dependency, it could reference a non-existent package that an attacker has registered (slopsquatting), a typosquatted variant, or a package with known CVEs. The vision's PLAN phase defines subtask acceptance criteria but has no supply chain validation requirement.

**Suggested edit:** In the Execution Pipeline > The Subtask Pipeline > Stage 3: Verify section, after the current verification criteria, add:

> **Dependency verification.** If the subtask modifies any dependency manifest (package.json, requirements.txt, go.mod, pom.xml, Gemfile, or their lockfiles): (1) validate all new packages exist in the official registry, (2) check for known CVEs at the pinned version, (3) verify lockfile changes correspond to manifest changes (lockfile-only changes are rejected), (4) flag packages younger than 14 days for human review. AI agents hallucinate package names at 5-21% rates -- every dependency addition is verified against the registry.

### C3: Add security-specific expertise loading to review stages

**Research finding:** `security-code-review.md` (Actionable Insights #1, #7) -- Security review must be context-aware with different focus areas per context (web: XSS/CSRF, API: authorization/rate-limiting, IaC: misconfiguration). `owasp-patterns.md` (Synthesis) identifies 7 key review patterns including data flow tracing, trust boundary validation, negative pattern detection, and defense-in-depth verification.

**Why it's critical:** The vision's review stage loads `always.reviewer` + `reviewer_modes.task-review` + stack antipatterns + auto modules. The "auto" modules include security, but this is generic. A reviewer checking a web application handler needs different security guidance (XSS output encoding, CSRF tokens, session management) than one checking a Terraform module (IAM least privilege, encryption at rest, network segmentation). Without context-specific security expertise, the reviewer falls back on general model knowledge, which the research shows is unreliable for security.

**Suggested edit:** In the Execution Pipeline > The Subtask Pipeline > Stage 2: Review, update the expertise loading description:

> Reviewer (fresh context) loaded with expertise: `always.reviewer` + `reviewer_modes.task-review` + stack antipatterns + auto modules + **`security/<context>.md`** (context-specific security review checklist: web, API, GraphQL, IaC, container, or general -- selected based on subtask expertise declarations).

And in the Architecture > The Composer > expertise resolution, add under `auto.all-stacks.all-roles`:

> `security.<detected-context>` -- context-specific security checklist (OWASP-mapped) loaded for all reviewer invocations.

## Nice to Have

1. **SBOM generation at completion.** `supply-chain.md` (Section 6) documents that SBOM generation is becoming a regulatory requirement (EU Cyber Resilience Act). The completion pipeline could generate a CycloneDX SBOM as part of Stage 1 (Integration Verification). Not blocking because Wazir is a development pipeline, not a release pipeline, but it future-proofs the output for organizations with compliance requirements.

2. **OWASP ASVS level mapping.** `owasp-patterns.md` (Source 4) describes three verification levels (L1 minimum, L2 recommended for most apps, L3 for critical apps). The SPECIFY phase could allow users to declare an ASVS level that determines the depth of security review applied. This would be valuable but adds complexity to the user interaction model.

3. **Container and Dockerfile linting.** `infrastructure-security.md` (Docker/Container Security sections) documents that Hadolint is the standard Dockerfile linter and image scanning is "non-negotiable" for CI/CD. If a subtask produces Dockerfiles or container configurations, the verifier could run Hadolint and a container scanner. Not critical because this is tooling integration, not a pipeline design gap.

4. **Tracking vulnerability pattern distribution across runs.** `security-code-review.md` (Actionable Insight #10) recommends aggregating findings by CWE category across reviews to identify systemic weaknesses. The learning system (Completion Pipeline > Stage 8) already does pattern extraction for 3+ subtask findings. Extending this to track CWE categories across runs would strengthen the flywheel for security improvements.

5. **CI/CD pipeline security guidance.** `infrastructure-security.md` (CI/CD Pipeline Security section) documents that CI/CD pipelines are high-value targets, that tj-actions/changed-files compromised 23,000+ repos, and that 57% of organizations admit pipelines are inadequately secured. If Wazir generates CI/CD configuration (GitHub Actions, GitLab CI), the security expertise modules should include pipeline security patterns (pin Actions to SHA, least-privilege tokens, ephemeral runners). This is a specialized case rather than a pipeline design issue.

## Improvements

### I1: Add a security dimension to review checklists

**Section to edit:** Phase 4: REVIEW(spec), Phase 6: REVIEW(design), Phase 8: REVIEW(plan)

**What to add:** Each review checklist currently lists generic quality dimensions. Add explicit security dimensions:

- Phase 4 (spec review): Add "security requirements coverage -- are authentication, authorization, data protection, and input validation requirements specified? Are trust boundaries identified?"
- Phase 6 (design review): Change "security/performance" to "security (OWASP Top 10 coverage for relevant categories, trust boundary analysis, threat surface assessment), performance"
- Phase 8 (plan review): Add "security expertise declarations present in subtasks touching auth, crypto, user input, external APIs, dependency changes, or IaC"

**Why (citing research):** `owasp-patterns.md` (Source 7, OWASP Secure by Design) states "security flaws introduced during system design are the most costly and complex to remediate, often requiring fundamental architectural changes." `security-code-review.md` (OWASP Baseline Review Process) puts architecture review for security anti-patterns as step 1 of 8. Security review starting at execution is too late; it must start at spec/design.

### I2: Add taint analysis as a reviewer instruction

**Section to edit:** Execution Pipeline > The Subtask Pipeline > Stage 2: Review

**What to add:** After "2-3 passes within one session: output vs acceptance criteria, output vs antipatterns, finding verification", add:

> For subtasks that process user input, external API responses, or database reads: the reviewer traces data flow from sources (entry points) through processing to sinks (queries, renders, writes, external calls), verifying sanitization/validation at each trust boundary. This is the single most effective manual security review technique.

**Why (citing research):** `owasp-patterns.md` (Synthesis > Key Patterns #1) -- "Data Flow Tracing (Source-Sink Analysis): The most effective manual review technique." `security-code-review.md` (Taint Analysis Deep Dive) provides the complete framework: identify sources, follow propagators, check sinks, validate boundaries. The 12-Point Security Checklist (Item #1, Input Validation) and OWASP Code Review Cheat Sheet (Data Flow Analysis technique) both center on this approach.

### I3: Add LLM-generated code security awareness to the executor constraints

**Section to edit:** Execution Pipeline > The Subtask Pipeline > Stage 1: Execute

**What to add:** Under "Hard limits", add:

> **LLM security awareness**: Executor agents are instructed never to generate hardcoded credentials, placeholder API keys, example tokens, or test secrets in production code. All secrets must reference environment variables or external secret stores. This constraint exists because LLM-generated code has a documented 12-65% vulnerability rate and 40% higher secret leakage rate.

**Why (citing research):** `owasp-patterns.md` (Source 14) -- 12-65% of LLM-generated code has CWE-classified vulnerabilities. `secrets-detection.md` (AI Copilots section) -- repositories with AI coding assistants show 40% higher secret leakage. ~30% of Copilot-generated code contains security weaknesses across 43 CWE categories. Since 100% of Wazir's output is LLM-generated, this is a first-order concern.

### I4: Add negative pattern detection to auto expertise modules

**Section to edit:** Architecture > The Composer > expertise module resolution, specifically `auto.all-stacks.all-roles`

**What to add:** The security auto-module should include explicit negative patterns (anti-patterns to flag):

> The `auto.all-stacks.all-roles.security` module includes: (1) Negative pattern checklist: string concatenation in queries, dynamic code execution with user input, hardcoded credentials, shared mutable state, deserialization of untrusted data, shell=True in subprocess calls, innerHTML with user data, disabled certificate verification. (2) Language-specific risk surface: JavaScript (prototype pollution, unsafe dynamic execution), Python (unsafe deserialization, f-string SQL, shell=True), Go (goroutine race conditions, string-formatted queries). (3) OWASP Top 10 mapping for finding classification.

**Why (citing research):** `owasp-patterns.md` (Synthesis > Key Patterns #5) identifies negative pattern detection as one of 7 key review patterns. `owasp-patterns.md` (Source 11) provides language-specific risk surfaces. `security-code-review.md` (Vulnerability Pattern Taxonomy, sections A-I) provides a comprehensive taxonomy of 50+ patterns organized by category with CWE mappings. These are exactly the kind of patterns that belong in expertise modules.

### I5: Add dependency change detection to the plan phase

**Section to edit:** Pre-Execution Pipeline > Phase 7: PLAN > subtask.md contents

**What to add:** Add a field to the subtask template:

> **Dependency changes**: NONE | ADD <list> | UPDATE <list> | REMOVE <list>. Subtasks declaring dependency changes trigger supply chain verification in the verify stage.

**Why (citing research):** `supply-chain.md` (Synthesis > Relevance to Code Review Automation) -- "supply chain security checks should be a mandatory part of every PR that modifies dependency files." The plan phase is where subtask scope is defined. If the planner knows a subtask will add dependencies, it can budget for supply chain verification and flag it for additional scrutiny. Slopsquatting (`supply-chain.md` Section 2.3) means AI-hallucinated package names are predictable attack targets, making this especially relevant for Wazir.
