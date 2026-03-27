# Security Code Review

> Research compiled 2026-03-25. Covers OWASP guidance, vulnerability taxonomies,
> tooling landscape, context-specific review techniques, and taint/data-flow analysis.

---

## Key Findings

1. **Manual review still catches what automation misses.** Business logic flaws, authorization bypass through workflow manipulation, and race conditions are rarely detected by SAST/DAST tools. Structured human review remains one of the most effective ways to prevent vulnerabilities from reaching production. The most effective strategy combines automated tools (for coverage and speed) with manual human review (for context and logic).

2. **OWASP Top 10:2025 reshuffled priorities.** Broken Access Control holds #1. Security Misconfiguration rose to #2. A new category -- Mishandling of Exceptional Conditions -- entered at #10, reflecting real-world breaches caused by fail-open logic and leaked stack traces. Software Supply Chain Failures expanded to cover build systems and distribution infrastructure, not just outdated dependencies.

3. **CWE/SANS Top 25 (2024-2025) confirms injection dominance.** XSS holds the #1 slot. SQL injection moved to #2. Cross-site request forgery rose to #3. New entries include classic buffer overflow, improper access control, and authorization bypass through user-controlled key.

4. **Taint analysis is the gold standard for injection detection.** It traces untrusted data from sources (user input, API calls, file uploads) through propagators (transformations, assignments) to sinks (SQL queries, command execution, HTML rendering), flagging paths that lack sanitization. Static taint analysis provides full code coverage without execution.

5. **Supply chain attacks scaled dramatically in 2025.** Over 99% of open-source malware in 2025 occurred on npm. The September 2025 npm attack compromised 18 widely-used packages (chalk, debug, ansi-styles) with 2.6B+ weekly downloads via maintainer credential phishing. Typosquatting, dependency confusion, and star-jacking are industrialized attack vectors.

6. **AI-assisted review is maturing rapidly.** Tools like Snyk DeepCode AI, Google CodeMender, and Endor Labs AI Security Code Review go beyond pattern matching to understand semantic context, triage real risk from noise, and auto-generate fixes. They complement but do not replace structured human review.

7. **Effective code reviews cut remediation costs by up to 10x** compared to post-release fixes. Security review integrated into PR workflows becomes a forcing function for better engineering discipline.

8. **Layered tooling is non-negotiable.** No single tool category (SAST, DAST, IAST, SCA, secrets detection) provides complete coverage. The industry consensus is to run Semgrep on every PR for fast pattern matching, CodeQL on schedule for deep semantic analysis, DAST against staging environments, SCA continuously, and secrets scanners in pre-commit hooks.

---

## Vulnerability Pattern Taxonomy

### A. Injection Vulnerabilities

| Pattern | What to Look For | CWE |
|---------|-----------------|-----|
| SQL Injection | String concatenation in queries, missing parameterized statements, dynamic query construction | CWE-89 |
| Cross-Site Scripting (XSS) | Unencoded output in HTML/JS/JSON contexts, innerHTML usage, unsafe DOM manipulation, template engine misconfiguration | CWE-79 |
| Command Injection | User input passed to system-level execution functions without sanitization | CWE-78 |
| Path Traversal | Unsanitized file paths, ../ sequences not stripped, user-controlled directory references | CWE-22 |
| NoSQL Injection | Unvalidated query operators ($gt, $ne), object injection in MongoDB queries | CWE-943 |
| LDAP Injection | Unescaped special characters in LDAP search filters | CWE-90 |
| XML External Entity (XXE) | XML parsers with external entity processing enabled, DTD processing not disabled | CWE-611 |
| Server-Side Template Injection (SSTI) | User input rendered through template engines without sandboxing | CWE-1336 |
| Log Injection | Unsanitized input written to log files, enabling log forging or CRLF injection | CWE-117 |

### B. Authentication and Session Management

| Pattern | What to Look For | CWE |
|---------|-----------------|-----|
| Broken Authentication | Weak password policies, missing brute-force protection, credential stuffing exposure | CWE-287 |
| Session Fixation | Session ID not regenerated after login or privilege escalation | CWE-384 |
| Insecure Session Storage | Session tokens in URLs, missing HttpOnly/Secure/SameSite cookie flags | CWE-539 |
| Insufficient Session Expiration | No idle timeout, no absolute timeout, sessions not invalidated on logout | CWE-613 |
| Missing Multi-Factor Authentication | Sensitive operations without step-up authentication | CWE-308 |

### C. Authorization and Access Control

| Pattern | What to Look For | CWE |
|---------|-----------------|-----|
| Broken Access Control | Missing server-side authorization checks, client-side-only enforcement | CWE-284 |
| Insecure Direct Object References (IDOR) | User-supplied IDs used to fetch resources without ownership verification | CWE-639 |
| Privilege Escalation | Role manipulation via request tampering, missing vertical/horizontal access checks | CWE-269 |
| CORS Misconfiguration | Overly permissive Access-Control-Allow-Origin, reflecting arbitrary origins | CWE-942 |
| Missing Function-Level Access Control | Admin endpoints accessible without role verification | CWE-285 |
| CSRF | State-changing requests without anti-CSRF tokens; note: XSS can defeat all CSRF mitigations | CWE-352 |

### D. Cryptography and Secrets

| Pattern | What to Look For | CWE |
|---------|-----------------|-----|
| Hardcoded Credentials | API keys, passwords, tokens embedded in source code (23M+ secrets detected in GitHub in 2024) | CWE-798 |
| Weak Algorithms | MD5, SHA-1, DES, RC4 in use; should be AES-256, RSA-2048+, ECDSA P-256+ | CWE-327 |
| Insecure Random Number Generation | Math.random or equivalent used for security-sensitive operations instead of CSPRNG | CWE-330 |
| Missing Encryption | Sensitive data transmitted or stored without encryption | CWE-311 |
| Improper Certificate Validation | Hostname verification disabled, self-signed certs accepted in production | CWE-295 |
| Insecure Key Management | Keys stored alongside code, no rotation policy, symmetric keys shared across environments | CWE-321 |

### E. Data Exposure and Error Handling

| Pattern | What to Look For | CWE |
|---------|-----------------|-----|
| Sensitive Data in Logs | PII, tokens, passwords written to application logs | CWE-532 |
| Verbose Error Messages | Stack traces, database details, internal paths exposed to users | CWE-209 |
| Information Disclosure via Headers | Server version headers, debug headers in production | CWE-200 |
| Missing Data Classification | Sensitive fields not identified, no differential handling for PII vs. public data | CWE-922 |

### F. Deserialization and Object Manipulation

| Pattern | What to Look For | CWE |
|---------|-----------------|-----|
| Insecure Deserialization | Untrusted data deserialized via unsafe serialization APIs (Python, Java, PHP) or unsafe JSON parsing with constructors | CWE-502 |
| Prototype Pollution | Object.assign or deep merge with user-controlled keys in JavaScript | CWE-1321 |
| Mass Assignment | Framework auto-binding allowing users to set admin flags or internal fields | CWE-915 |

### G. Business Logic Flaws

| Pattern | What to Look For |
|---------|-----------------|
| Workflow Bypass | Users skipping required steps (e.g., payment before checkout validation) |
| Race Conditions (TOCTOU) | Time-of-check vs. time-of-use gaps; non-atomic check-then-act sequences |
| Pricing/Quantity Manipulation | Client-side price values trusted by server, negative quantity allowed |
| State Transition Violations | Invalid state machine transitions not rejected server-side |
| Rate Limit Bypass | Missing or client-side-only rate limiting on sensitive operations |

### H. Supply Chain Vulnerabilities

| Pattern | What to Look For |
|---------|-----------------|
| Known Vulnerable Dependencies | Outdated packages with published CVEs, no automated SCA scanning |
| Typosquatting | Package names with subtle misspellings (e.g., lodahs for lodash) |
| Dependency Confusion | Internal package names published to public registries |
| Malicious Post-Install Scripts | postinstall hooks running arbitrary code in npm/pip packages |
| Unpinned Dependencies | Version ranges allowing untested updates; missing lockfile integrity checks |
| Abandoned Packages | Unmaintained dependencies with known issues and no patches |

### I. Infrastructure-as-Code (IaC) Misconfigurations

| Pattern | What to Look For |
|---------|-----------------|
| Overly Permissive IAM | Wildcard actions in policies, roles with admin privileges |
| Public Storage | S3 buckets, GCS buckets with public access enabled |
| Missing Encryption | EBS volumes, RDS instances, storage without encryption at rest |
| Open Security Groups | Ingress rules open to 0.0.0.0/0 on sensitive ports |
| Secrets in State Files | Terraform state containing plain-text credentials, connection strings |
| Missing Network Segmentation | Flat network topologies, databases on public subnets |

---

## OWASP Top 10:2025 (Complete Ranking)

| Rank | Category | Key Change |
|------|----------|------------|
| A01 | Broken Access Control | Holds #1; SSRF now included in this category |
| A02 | Security Misconfiguration | Rose from #5 to #2 |
| A03 | Software Supply Chain Failures | Expanded from "Vulnerable Components" to full supply chain |
| A04 | Sensitive Data Exposure/Cryptographic Failures | Maintains focus on data-at-rest and in-transit protection |
| A05 | Injection | Dropped from #3 to #5; includes XSS, SQLi, command injection |
| A06 | Insecure Design | Secure-by-design principles, threat modeling emphasis |
| A07 | Identification and Authentication Failures | Credential stuffing, MFA bypass |
| A08 | Software and Data Integrity Failures | CI/CD pipeline integrity, unsigned updates |
| A09 | Security Logging and Alerting Failures | Insufficient logging, missing audit trails |
| A10 | Mishandling of Exceptional Conditions | **NEW**: fail-open logic, leaked stack traces, DoS via exceptions |

---

## Review Methodology

### OWASP Baseline Review Process (Full Reviews)

1. **Architecture review** for security anti-patterns
2. **Entry point analysis** and input validation mapping
3. **Authentication and authorization** verification
4. **Data flow tracing** (source -> propagator -> sink)
5. **Business logic analysis**
6. **Cryptographic implementation** review
7. **Error handling** verification
8. **Configuration and deployment** review

### OWASP Diff-Based Review Process (PR Reviews)

1. Analyze impact on existing security controls
2. Identify new attack vectors introduced by the change
3. Verify security at modified trust boundaries
4. Check new integration points
5. Ensure no security regression
6. Apply relevant security patterns from checklists

### Hybrid Approach (Recommended)

- **Risk-based scheduling**: Baseline reviews for high-risk components; diff-based for routine changes
- **Incremental baseline updates**: Expand baseline coverage across development cycles
- **Trigger-based escalation**: Escalate from diff-based to baseline when security concerns emerge

### Data Flow Analysis Steps

1. **Identify Sources**: User inputs, file uploads, API calls, database reads, environment variables
2. **Follow Processing**: Validation, transformation, business logic, caching
3. **Check Sinks**: Database queries, file writes, output rendering, logging, external APIs
4. **Validate Boundaries**: Input validation and output encoding at trust boundaries
5. **Verify Trust Zones**: Security controls at each trust boundary crossing
6. **Classify Data**: Ensure sensitive data receives appropriate protection level

---

## Comprehensive Review Checklists

### 12-Point Security Code Review Checklist (SoftwareSecured)

1. **Input Validation and Sanitization** -- All external input treated as untrusted. Server-side revalidation. Strict type enforcement. ReDoS-safe regex. No assumptions about "internal" data sources.

2. **Output Encoding** -- Context-appropriate escaping (HTML vs. JavaScript vs. JSON). Secure template engine configuration. No unsafe DOM injection. No rendering in unsafe contexts.

3. **Authentication Mechanisms** -- Secure credential storage (bcrypt/Argon2). Brute-force protection. MFA for sensitive operations. No credential leakage in logs/URLs.

4. **Authorization and Access Control** -- Server-side enforcement. Default-deny policy. IDOR prevention. Function-level controls. Role validation. Horizontal and vertical escalation prevention. Centralized access control logic.

5. **Session Management** -- Secure, HttpOnly, SameSite cookie flags. Session expiration enforced. Token rotation on privilege escalation. Logout invalidates sessions. Secure refresh token handling.

6. **Cryptography and Key Management** -- Modern algorithms (AES-256, RSA-2048+). No hardcoded keys. Key rotation implemented. Secrets in vaults. CSPRNG for randomness. ASVS 5.0 post-quantum considerations.

7. **Error Handling and Logging** -- Graceful failure without information disclosure. Sensitive data excluded from logs. Data masking for PII. Log integrity controls. Structured logging without injection vectors.

8. **Dependency and Supply Chain Security** -- SCA scanning for known CVEs. Lockfile integrity. No typosquatted packages. Post-install script audit. Dependency pinning. Abandoned package detection.

9. **API and Integration Security** -- Input validation on all endpoints. Authentication on every API call. Rate limiting. Schema validation. No over-fetching of data. CORS configured correctly.

10. **Server-Side Code Execution** -- No dynamic evaluation of user input. Sandboxed execution environments. Resource limits. No unsafe deserialization.

11. **Business Logic Vulnerabilities** -- Workflow step enforcement. Race condition prevention. Pricing/checkout logic server-validated. State transition validation. Multi-step flow enforcement.

12. **Code Quality and Security Hygiene** -- No commented-out secrets. Debug flags disabled in production. Insecure defaults removed. Dead code cleaned. Clear naming to reduce misuse.

### OWASP Cryptography Checklist

- [ ] Strong algorithms: AES-256, RSA-2048+, ECDSA P-256+
- [ ] Key management: Proper generation, storage, rotation
- [ ] Certificate validation: Including hostname verification
- [ ] Random generation: Cryptographically secure RNG
- [ ] Data protection: Encryption at rest and in transit
- [ ] IV/Nonce handling: Unique and unpredictable initialization vectors
- [ ] Library maintenance: Up-to-date cryptographic libraries
- [ ] Side-channel protection: Timing attack considerations

### OWASP Authorization Checklist

- [ ] Server-side enforcement of all access controls
- [ ] Default deny access policy
- [ ] IDOR prevention with proper authorization for resource access
- [ ] Administrative functions properly protected
- [ ] Role assignments cannot be manipulated
- [ ] Horizontal and vertical escalation prevented
- [ ] Access control logic centralized
- [ ] Authorization verified after authentication

---

## Tools and Frameworks

### Static Application Security Testing (SAST)

| Tool | Type | Key Strengths | Scan Speed | Languages |
|------|------|--------------|------------|-----------|
| **Semgrep** | Pattern-matching SAST | Lightweight, 20,000+ Pro rules, custom rule authoring in approx. 1 hour, CI-friendly | 10-30 seconds per PR | 30+ |
| **CodeQL** | Semantic SAST | Deep data-flow/taint analysis, whole-program analysis, 400+ community queries | 5-30+ min (requires DB build) | 10+ |
| **Checkmarx One** | Enterprise SAST | Source code scanning without build, SAST+DAST+SCA+IaC integrated, 7x Gartner Leader | 15 min to hours | 35+ |
| **Fortify (OpenText)** | Enterprise SAST | Deep analysis, 11x Gartner Leader, defense/government standard | 15 min to hours | 30+ |
| **Veracode** | Cloud SAST | 100+ languages including COBOL/VB6/RPG, compliance-focused, SCA included | Variable | 100+ |
| **SonarQube** | Code quality + SAST | Developer-friendly, quality gates, IDE integration, taint analysis | Fast (incremental) | 35+ |
| **Snyk Code** | AI-powered SAST | DeepCode AI engine, inline PR feedback, 19+ languages, 25M+ data flow cases | Real-time | 19+ |

**Recommendation**: Run Semgrep on every PR (fast, catches patterns). Run CodeQL on schedule (deep semantic analysis). Use enterprise tools (Checkmarx/Fortify/Veracode) for compliance requirements.

### Dynamic Application Security Testing (DAST)

| Tool | Key Strengths |
|------|--------------|
| **OWASP ZAP** | Open-source, extensible, CI/CD integration, active community |
| **Burp Suite** | Industry standard for manual + automated testing, extensive extension ecosystem |
| **Acunetix (Invicti)** | 7,000+ vulnerability checks, combined DAST+IAST, fast scanning |
| **Nuclei** | Template-based scanning, 8,000+ community templates, fast, open-source |
| **AccuKnox** | Developer-first, CI/CD-integrated, API security scanning |

### Interactive Application Security Testing (IAST)

| Tool | How It Works |
|------|-------------|
| **Contrast Security Assess** | Instruments running applications, monitors data flow in real-time during testing/QA, no dedicated scan needed |
| **Seeker (Synopsys)** | Runtime instrumentation, correlates with SAST/DAST findings |

IAST deploys sensors inside running applications to observe behavior during testing. It provides broader coverage than SAST (sees runtime context) and fewer false positives than DAST (understands internal code paths). Best used during QA/integration testing phases.

### Runtime Application Self-Protection (RASP)

| Tool | How It Works |
|------|-------------|
| **Contrast Protect** | Embeds in application runtime, blocks attacks in real-time, zero-day defense |
| **Imperva RASP** | Runtime monitoring with automatic blocking |

RASP provides defense after deployment against live attacks. It does not replace vulnerability detection but complements it.

### Software Composition Analysis (SCA)

| Tool | Key Strengths |
|------|--------------|
| **Snyk Open Source** | Largest vulnerability database, auto-fix PRs, transitive dependency analysis |
| **Dependabot (GitHub)** | Native GitHub integration, automatic PRs for updates |
| **Renovate** | Highly configurable, multi-platform, grouping strategies |
| **OWASP Dependency-Check** | Free, open-source, NVD-based, CI-friendly |
| **Socket.dev** | Supply chain attack detection, behavioral analysis of packages |

### Secrets Detection

| Tool | Key Strengths |
|------|--------------|
| **GitGuardian** | Real-time monitoring, 350+ detectors, CI/CD integration, remediation workflows |
| **TruffleHog** | Historical git log scanning, entropy-based detection, open-source |
| **Gitleaks** | Fast, configurable, pre-commit hook support, open-source |
| **GitHub Secret Scanning** | Native GitHub integration, partner program for token revocation |

**Recommendation**: Run secrets scanners in pre-commit hooks (Gitleaks) AND CI pipelines (GitGuardian/TruffleHog). 23M+ secrets were detected in GitHub commits in 2024.

### Infrastructure-as-Code (IaC) Scanning

| Tool | Key Strengths |
|------|--------------|
| **Checkov (Bridgecrew)** | Terraform, CloudFormation, K8s, 1,000+ policies, graph-based analysis |
| **tfsec** | Terraform-focused, fast, supports custom rules |
| **Terrascan** | Multi-IaC support, OPA-based policies |
| **KICS (Checkmarx)** | 2,400+ queries, 15+ IaC technologies, open-source |
| **Trivy** | Container + IaC scanning, vulnerability + misconfiguration in one tool |

### AI-Assisted Security Review

| Tool | Approach |
|------|---------|
| **Snyk DeepCode AI** | Multiple AI models, 25M+ data flow cases, semantic understanding, auto-fix |
| **Google CodeMender** | AI agent that is both reactive (patches new vulns) and proactive (rewrites insecure code) |
| **Endor Labs AI Security Code Review** | Identifies code changes that introduce real security risk, even without matching known patterns |
| **SonarQube AI CodeFix** | AI-generated fix suggestions integrated into developer workflow |
| **CodeAnt AI** | Open-source focus, security + code quality combined |

---

## Context-Specific Review Guidance

### Web Application Security Review

**Priority vulnerabilities**: XSS (output encoding), CSRF (anti-forgery tokens), session management (cookie flags), authentication (credential storage), access control (server-side enforcement).

**Key review points**:
- Every user input rendered in HTML must be context-encoded (HTML entity, JavaScript, URL, CSS contexts are different)
- Anti-CSRF tokens on all state-changing requests; verify framework built-in protections are active
- Session cookies: Secure, HttpOnly, SameSite=Strict (or Lax minimum)
- Content Security Policy headers configured to prevent inline script execution
- XSS can defeat all CSRF mitigations -- both must be addressed together

### API Security Review (REST / GraphQL)

**Priority vulnerabilities**: Broken object-level authorization, excessive data exposure, lack of rate limiting, mass assignment.

**REST-specific review points**:
- Every endpoint enforces authentication and authorization independently
- Input validation against defined schemas (OpenAPI/JSON Schema)
- No sensitive data in query parameters (logged by proxies/servers)
- Rate limiting per-user, per-endpoint, and per-IP
- CORS restricted to known origins

**GraphQL-specific review points**:
- Authentication at gateway, but authorization at field resolver level -- never assume query-level auth protects nested fields
- Query depth limiting to prevent recursive query attacks
- Query complexity/cost analysis for rate limiting (single GraphQL query can be extremely expensive)
- Introspection disabled in production
- Pagination enforced on list fields to prevent data dumping
- Batch query limiting to prevent amplification attacks

### Infrastructure-as-Code (IaC) Security Review

**Priority concerns**: Overly permissive IAM, public storage, missing encryption, secrets in state files.

**Key review points**:
- IAM policies follow least-privilege; no wildcard actions or resources in production
- All storage encrypted at rest (EBS, RDS, S3, GCS)
- Security groups restrict ingress to necessary ports and source CIDRs
- State files stored in encrypted, access-controlled backends (S3 with SSE, locked DynamoDB)
- No hardcoded credentials in Terraform/CloudFormation; use data sources or secret managers
- Network segmentation: databases on private subnets, no direct public access

### Microservices and Container Security Review

**Key review points**:
- Container images use minimal base images (distroless, Alpine)
- No running as root inside containers
- Secrets injected via environment or volume mounts, never baked into images
- Inter-service communication authenticated (mTLS, service mesh)
- Network policies restrict pod-to-pod communication
- Resource limits set to prevent noisy-neighbor DoS

---

## Taint Analysis Deep Dive

### Core Concepts

Taint analysis tracks untrusted data through program execution to identify paths where unsanitized input reaches dangerous operations.

**Three elements**:
1. **Sources** -- Entry points where untrusted data enters: HTTP parameters, form inputs, file uploads, database reads, environment variables, external API responses, message queue payloads
2. **Propagators** -- Operations that transfer taint: variable assignments, string concatenation, collection operations, function parameters, return values
3. **Sinks** -- Operations where tainted data causes harm: SQL execution, HTML rendering, command execution, file system writes, redirect targets, log writes, HTTP response headers

### Static vs. Dynamic Taint Analysis

| Aspect | Static Taint Analysis | Dynamic Taint Analysis |
|--------|----------------------|----------------------|
| Execution | Analyzes source/IR without running | Monitors running application |
| Coverage | All code paths (including untriggered) | Only executed paths |
| Timing | Pre-deployment (CI/CD, PR checks) | During testing/QA |
| False positives | Higher (over-approximation) | Lower (concrete execution) |
| Performance impact | None at runtime | Runtime overhead |
| Best for | Broad coverage, early detection | Precise validation, confirming findings |

### Tools with Taint Analysis Capabilities

- **Semgrep Pro** -- Cross-file taint tracking, configurable sources/sinks/propagators
- **CodeQL** -- Full interprocedural taint analysis with custom sink/source definitions
- **Snyk Code** -- Contextual data flow with 25M+ taint cases
- **SonarQube/SonarCloud** -- Static taint flow analysis for injection detection
- **JetBrains Qodana** -- IDE-integrated taint analysis with security inspections
- **Fortify** -- Enterprise-grade taint analysis with deep interprocedural tracking
- **Checkmarx** -- Source-to-sink tracking across complex call chains

### Practical Application in Code Review

When manually reviewing, follow taint paths:

1. Start at entry points (HTTP handlers, API endpoints, message consumers)
2. Trace each user-controlled value through transformations
3. Check for sanitization/validation before each sink
4. Verify sanitization is context-appropriate (HTML-encoding does not prevent SQL injection)
5. Watch for double-encoding or encoding bypass
6. Flag indirect flows: user input -> database -> read back -> sink (second-order injection)

---

## Sources (with URLs)

### OWASP Resources
- [OWASP Code Review Guide](https://owasp.org/www-project-code-review-guide/)
- [OWASP Code Review Guide v2 PDF](https://owasp.org/www-project-code-review-guide/assets/OWASP_Code_Review_Guide_v2.pdf)
- [OWASP Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html)
- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [OWASP Top 10:2025 Introduction](https://owasp.org/Top10/2025/0x00_2025-Introduction/)
- [OWASP Static Code Analysis](https://owasp.org/www-community/controls/Static_Code_Analysis)
- [OWASP Security Code Review 101](https://owasp.org/SecureCodingDojo/codereview101/)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- [OWASP Code Review Methodology (GitHub)](https://github.com/OWASP/www-project-code-review-guide/blob/master/current/chapter_002/methodology.md)

### CWE/SANS
- [CWE/SANS Top 25 Most Dangerous Software Errors](https://www.sans.org/top25-software-errors)
- [2024 CWE Top 25 Most Dangerous Software Weaknesses (CISA)](https://www.cisa.gov/news-events/alerts/2024/11/20/2024-cwe-top-25-most-dangerous-software-weaknesses)
- [Top 25 Most Dangerous Software Weaknesses of 2025 (Infosecurity Magazine)](https://www.infosecurity-magazine.com/news/top-25-dangerous-software/)

### Security Code Review Guides and Checklists
- [The Ultimate Security Code Review Checklist (SoftwareSecured)](https://www.softwaresecured.com/post/the-ultimate-security-code-review-checklist)
- [10-Point Secure Code Review Checklist (HackTheBox)](https://www.hackthebox.com/blog/secure-code-reviews)
- [Security Code Review Checklist (Redwerk)](https://redwerk.com/blog/security-code-review-checklist/)
- [Secure Code Review Checklist: OWASP-Aligned Framework (Augment Code)](https://www.augmentcode.com/guides/secure-code-review-checklist-owasp-aligned-framework)
- [Application Security Code Review: The Ultimate 2025 Guide (FailSafe)](https://getfailsafe.com/application-security-code-review-the-ultimate-2025-guide)
- [OWASP Code Review Guide Explained (CodeAnt)](https://www.codeant.ai/blogs/owasp-code-review-guide-explained)
- [OWASP Code Review Guidelines (Graphite)](https://graphite.com/guides/owasp-code-review-guidelines)

### SAST/DAST/IAST Tools
- [Top 10 SAST Tools in 2025 (OX Security)](https://www.ox.security/blog/static-application-security-sast-tools/)
- [SAST and DAST: Still Essential in 2025 (OX Security)](https://www.ox.security/blog/sast-and-dast-tools-still-essential-security-solutions-in-2025/)
- [Top DAST Tools 2026 (Intruder)](https://www.intruder.io/blog/top-dast-tools)
- [Top 10 DAST Tools Benchmarked (AIMultiple)](https://aimultiple.com/dast-tools)
- [35 Best SAST Tools Compared (AppSec Santa)](https://appsecsanta.com/sast-tools)
- [Veracode vs Checkmarx vs Fortify (Aikido)](https://www.aikido.dev/blog/veracode-vs-checkmarx-vs-fortify)
- [Best IAST Tools (Aikido)](https://www.aikido.dev/blog/top-iast-tools)
- [SAST vs DAST vs IAST vs RASP Explained 2025 (DeepStrike)](https://deepstrike.io/blog/sast-vs-dast-vs-iast-vs-rasp-2025)

### Semgrep vs CodeQL
- [Semgrep vs CodeQL Technical Comparison (Konvu)](https://konvu.com/compare/semgrep-vs-codeql)
- [Semgrep vs CodeQL: Patterns vs Semantic Analysis (AI Code Review)](https://aicodereview.cc/blog/semgrep-vs-codeql/)
- [Comparing Semgrep and CodeQL (Doyensec)](https://blog.doyensec.com/2022/10/06/semgrep-codeql.html)
- [Best AI Code Security Tools 2025: Snyk vs Semgrep vs CodeQL](https://sanj.dev/post/ai-code-security-tools-comparison)

### Taint Analysis
- [What Is Taint Analysis? (Apiiro)](https://apiiro.com/glossary/taint-analysis/)
- [What is Taint Analysis? (JetBrains Qodana)](https://www.jetbrains.com/pages/static-code-analysis-guide/what-is-taint-analysis/)
- [Static Taint Flow Analysis (SonarSource)](https://www.sonarsource.com/solutions/taint-analysis/)
- [Taint Analysis with Snyk Code](https://snyk.io/blog/analyze-taint-analysis-contextual-dataflow-snyk-code/)
- [Taint Analysis: Detect Data Flow Vulnerabilities (AppSentinels)](https://appsentinels.ai/resources/academy/taint-analysis/)
- [LDRA Taint Analysis](https://ldra.com/capabilities/taint-analysis/)

### AI-Assisted Security Review
- [Snyk DeepCode AI](https://snyk.io/platform/deepcode-ai/)
- [10 AI Code Review Tools (DigitalOcean)](https://www.digitalocean.com/resources/articles/ai-code-review-tools)
- [Introducing AI Security Code Review (Endor Labs)](https://www.endorlabs.com/learn/introducing-ai-security-code-review)
- [Introducing CodeMender (Google DeepMind)](https://deepmind.google/blog/introducing-codemender-an-ai-agent-for-code-security/)
- [Best 7 AI Code Review Tools for Security (CodeAnt)](https://www.codeant.ai/blogs/ai-secure-code-review-platforms)
- [AI for Secure Code: Automated Vulnerability Scanning (Graphite)](https://graphite.com/guides/ai-secure-code-automated-vulnerability-scanning)

### Supply Chain Security
- [September 2025 npm Supply Chain Attack (CISA)](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem)
- [Inside the September 2025 npm Attack (ArmorCode)](https://www.armorcode.com/blog/inside-the-september-2025-npm-supply-chain-attack)
- [Typosquatting and Dependency Confusion (GitGuardian)](https://blog.gitguardian.com/protecting-your-software-supply-chain-understanding-typosquatting-and-dependency-confusion-attacks/)
- [npm Under Siege (Cymulate)](https://cymulate.com/blog/npm-under-siege-supply-chain-attacks/)

### Secrets Detection
- [Managing Risks of Hard-Coded Secrets (Codacy)](https://blog.codacy.com/hard-coded-secrets)
- [Why Hard-Coded Credentials Are Urgent (GitGuardian)](https://blog.gitguardian.com/why-its-urgent-to-deal-with-your-hard-coded-credentials/)
- [Hardcoded Secrets Tutorial (Snyk Learn)](https://learn.snyk.io/lesson/hardcoded-secrets/)

### IaC Security
- [IaC Scanning for Vulnerabilities (Spacelift)](https://spacelift.io/blog/iac-scanning)
- [IaC Security Scanning for Terraform and Kubernetes (Aikido)](https://www.aikido.dev/blog/iac-security-scanning-terraform-kubernetes-misconfigurations)
- [KICS - Keeping Infrastructure as Code Secure](https://www.kics.io/index.html)
- [Fantastic IaC Security Attacks (GitLab)](https://about.gitlab.com/blog/fantastic-infrastructure-as-code-security-attacks-and-how-to-find-them/)

### API Security
- [API Security Best Practices (StackHawk)](https://www.stackhawk.com/blog/api-security-best-practices-ultimate-guide/)
- [Practical API Security Checklist (HackproofHacks)](https://www.hackproofhacks.com/blog/api-security-checklist.html)
- [9 Ways to Secure GraphQL API (Apollo)](https://www.apollographql.com/blog/9-ways-to-secure-your-graphql-api-security-checklist)
- [GraphQL Security Best Practices (StackHawk)](https://www.stackhawk.com/blog/graphql-security/)

### Error Handling and Logging
- [OWASP A09:2025 Security Logging and Alerting Failures](https://owasp.org/Top10/2025/A09_2025-Security_Logging_and_Alerting_Failures/)
- [How to Keep Sensitive Data Out of Logs (Skyflow)](https://www.skyflow.com/post/how-to-keep-sensitive-data-out-of-your-logs-nine-best-practices)
- [Error Handling Flaws (Veracode)](https://www.veracode.com/security/error-handling-flaws-information-and-how-fix-tutorial/)
- [CWE-209: Information Exposure Through Error Message (Veracode)](https://www.veracode.com/security/java/cwe-209/)

---

## Actionable Insights

### For Wazir's Security Review Skill

1. **Implement a layered review checklist.** Use the 12-point checklist as the basis for a security review phase. Each point maps to specific CWEs that can be checked both manually and with tooling. The checklist should be context-aware: web apps get CSRF/XSS emphasis, APIs get authorization/rate-limiting emphasis, IaC gets misconfiguration emphasis.

2. **Integrate taint analysis into the review pipeline.** The review skill should trace data flow from sources to sinks for every code change. For automated support, Semgrep Pro provides cross-file taint tracking that can run in CI. For manual review guidance, the skill should prompt reviewers to follow the source-propagator-sink model.

3. **Map every finding to OWASP Top 10 and CWE.** Every security observation should reference a specific CWE ID and OWASP Top 10 category. This enables consistent severity classification, compliance reporting, and trend analysis across reviews.

4. **Adopt a dual-tool SAST strategy.** Run Semgrep on every PR (10-30 second scans, pattern matching, custom rules writable in an hour). Run CodeQL on a schedule (deep interprocedural taint analysis). This covers both fast feedback and deep analysis.

5. **Mandate secrets scanning in pre-commit hooks.** Given that 23M+ secrets were detected in GitHub in 2024, pre-commit scanning with Gitleaks is non-negotiable. CI-level scanning with GitGuardian or TruffleHog provides a second layer.

6. **Include supply chain review as a first-class concern.** Every dependency change should trigger SCA scanning. Lockfile integrity must be verified. Post-install scripts should be audited for new packages. The September 2025 npm incident demonstrates this is a critical attack surface.

7. **Build context-specific review templates.** Different review contexts need different focus areas:
   - **Web**: XSS, CSRF, session management, CSP headers
   - **API**: Authorization per-endpoint, rate limiting, input schema validation, CORS
   - **GraphQL**: Field-level authorization, query complexity, introspection, depth limiting
   - **IaC**: IAM least-privilege, encryption at rest, network segmentation, state file security
   - **Containers**: Base image minimality, no root execution, secret injection, network policies

8. **Treat business logic review as mandatory, not optional.** Automation cannot catch workflow bypass, race conditions, pricing manipulation, or state transition violations. The review skill should include explicit business logic review prompts: "Can a user skip steps?", "Are check-then-act sequences atomic?", "Is pricing validated server-side?"

9. **Implement the OWASP hybrid review approach.** Use baseline reviews for new modules and high-risk components. Use diff-based reviews for routine changes. Escalate automatically when changes touch authentication, authorization, cryptography, or payment flows.

10. **Track and report vulnerability pattern distribution.** Aggregate findings by CWE category across reviews to identify systemic weaknesses. If a team consistently produces XSS findings, that signals a training need, not just a code fix.
