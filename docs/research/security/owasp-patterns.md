# 34 - OWASP Security Review Patterns & Secure Coding Guidelines

**Date:** 2026-03-25
**Status:** Research complete
**Sources:** 16 primary sources across OWASP documentation, academic papers, blog posts, and tool comparisons

---

## Source 1: OWASP Code Review Guide v2 (https://owasp.org/www-project-code-review-guide/)

- The OWASP Code Review Guide v2 (July 2017, latest stable) is a technical book written for management, developers, and security professionals responsible for code reviews
- Divided into two main sections: (1) the "why and how of code reviews" and (2) the "types of vulnerabilities and how to identify throughout the review"
- Section two chapters are based on the OWASP Top 10 (2013 edition at time of writing), providing code examples for both "what not to do" and "what to do"
- Appendix includes code reviewer checklists and supplementary materials
- Key position: while security scanners improve daily, manual security code review must remain a prominent part of organizations' Secure Development Life Cycle (SDLC)
- Licensed under Creative Commons Attribution-ShareAlike 4.0 International
- Available as free PDF at https://owasp.org/www-project-code-review-guide/assets/OWASP_Code_Review_Guide_v2.pdf

## Source 2: OWASP Secure Code Review Cheat Sheet (https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html)

- **Review Methodology** consists of two tracks: Baseline Reviews and Diff-Based Reviews
- **Preparation steps for all reviews:**
  - Understand application architecture and business requirements
  - Gather threat models and previous security findings
  - Identify critical assets and high-risk functions
  - Review security requirements and documentation
- **Additional for Baseline Reviews:** map complete application boundaries, analyze security architecture, review incident history, audit third-party libraries
- **Additional for Diff-Based Reviews:** identify modified files and affected components, assess impact on existing security controls, prioritize high-risk modifications
- **Common Vulnerability Patterns to check:**
  - **SQL Injection:** look for string concatenation in database queries and unsafe query construction
  - **XSS:** review output encoding, DOM manipulation, and user input rendering
  - **Path Traversal:** check for unsafe file path construction and directory traversal
  - **Command Injection:** identify direct command execution with user input and unsafe system calls
  - **NoSQL Injection:** examine NoSQL query construction and parameter binding
- **Data Flow Analysis technique:**
  - Identify Sources: user inputs, file uploads, API calls, database reads, environment variables
  - Follow Processing: validation, transformation, business logic, caching
  - Check Sinks: database queries, file writes, output rendering, logging, external APIs
  - Validate Boundaries: input validation and output encoding at trust boundaries
  - Trust Zones: verify security controls at each trust boundary crossing
  - Data Classification: ensure sensitive data receives appropriate protection
- **Authorization Checklist:**
  - Server-side enforcement of all access controls
  - Fail-safe defaults with default deny access policy
  - IDOR prevention with proper authorization for resource access
  - Administrative functions properly protected
  - Role assignments cannot be manipulated
  - Horizontal and vertical privilege escalation prevented
  - Access control logic centralized
  - Authorization verified after authentication
- **SDLC Integration points:**
  - Pull Requests: security-focused review as part of standard PR process
  - Pre-commit Hooks: lightweight security checks on developer commits
  - Feature Completion: security review of completed user stories
  - Sprint Reviews: regular assessment of security implications
  - Hotfix Reviews: rapid security assessment of emergency fixes
  - Continuous Integration: automated triggering of security reviews

## Source 3: OWASP Top 10:2021 with Cheat Sheet Mappings (https://owasp.org/Top10/2021/ and https://cheatsheetseries.owasp.org/IndexTopTen.html)

- **A01:2021 - Broken Access Control** (moved up from #5)
  - Related cheat sheets: Authorization, Insecure Direct Object Reference Prevention, Transaction Authorization, Cross-Site Request Forgery Prevention
  - Code review focus: check for missing access control checks, IDOR flaws, CORS misconfigurations, metadata manipulation
- **A02:2021 - Cryptographic Failures** (previously "Sensitive Data Exposure")
  - Related cheat sheets: Cryptographic Storage, Transport Layer Security, HTTP Strict Transport Security, Secrets Management, Key Management, Pinning
  - Code review focus: data transmitted in cleartext, old/weak algorithms, improper key management, missing encryption
- **A03:2021 - Injection** (moved down from #1)
  - Related cheat sheets: Injection Prevention, SQL Injection Prevention, LDAP Injection Prevention, OS Command Injection Defense, Cross Site Scripting Prevention, Query Parameterization
  - Code review focus: string concatenation in queries, unvalidated user input in interpreters, missing parameterized queries
- **A04:2021 - Insecure Design** (NEW category)
  - Related cheat sheets: Secure Product Design, Threat Modeling, Abuse Case
  - Code review focus: missing threat modeling, lack of security design patterns, insufficient security controls in architecture
- **A05:2021 - Security Misconfiguration** (moved up from #6)
  - Related cheat sheets: Infrastructure as Code Security, XML External Entity Prevention, PHP Configuration
  - Code review focus: default credentials, unnecessary features enabled, verbose error messages, missing security headers
- **A06:2021 - Vulnerable and Outdated Components**
  - Related cheat sheets: Vulnerable Dependency Management, Third Party JavaScript Management, npm Security
  - Code review focus: unknown component versions, unsupported libraries, unpatched dependencies
- **A07:2021 - Identification and Authentication Failures** (previously "Broken Authentication")
  - Related cheat sheets: Authentication, Session Management, Forgot Password, Credential Stuffing Prevention, Multifactor Authentication
  - Code review focus: credential stuffing, weak passwords, session fixation, improper session invalidation
- **A08:2021 - Software and Data Integrity Failures** (NEW category)
  - Related cheat sheets: Deserialization, Software Supply Chain Security
  - Code review focus: insecure deserialization, unsigned updates, untrusted CI/CD pipelines
- **A09:2021 - Security Logging and Monitoring Failures** (previously "Insufficient Logging & Monitoring")
  - Related cheat sheets: Logging, Application Logging Vocabulary
  - Code review focus: auditable events not logged, logs not monitored, logs stored only locally
- **A10:2021 - Server-Side Request Forgery (SSRF)** (NEW category)
  - Related cheat sheets: Server Side Request Forgery Prevention
  - Code review focus: URL fetching without validation, unfiltered redirect destinations

## Source 4: OWASP ASVS v5.0.0 (https://owasp.org/www-project-application-security-verification-standard/)

- Latest stable version 5.0.0 (May 2025), provides basis for testing web application security controls and requirements for secure development
- Requirement identifier format: `<chapter>.<section>.<requirement>` (e.g., `1.11.3`)
- **Three verification levels:**
  - **Level 1:** Low-assurance, completely penetration testable, suitable for all applications as minimum baseline
  - **Level 2:** For applications containing sensitive data requiring protection (the recommended level for most applications)
  - **Level 3:** For the most critical applications (high-value transactions, sensitive medical data, critical infrastructure)
- **14 Verification Chapters:**
  1. Encoding and Sanitization
  2. Validation, Binding, and Parameterization
  3. Web Frontend Security
  4. API and Web Service
  5. File Handling
  6. Configuration
  7. Authentication
  8. Session Management
  9. Access Control
  10. Error and Exception Handling
  11. Logging
  12. Cryptography
  13. Data Protection
  14. Business Logic
- Provides a mapping between cheat sheets and each ASVS section via https://cheatsheetseries.owasp.org/IndexASVS.html
- Used as metric (assess degree of trust), guidance (build security controls), and procurement specification (verification in contracts)
- Available in PDF, Word, CSV, and JSON formats for integration into tooling

## Source 5: OWASP Secure Coding Practices Quick Reference Guide (https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

- Technology-agnostic checklist for integrating into the development lifecycle
- **14 Checklist Categories:**
  1. **Input Validation:** server-side validation, centralized routine, allow-lists over deny-lists, validate data types/ranges/lengths, canonicalization, reject on failure
  2. **Output Encoding:** server-side encoding, standard tested routines, contextual encoding for SQL/XML/LDAP/OS commands, specify UTF-8
  3. **Authentication & Password Management:** require auth for all non-public resources, enforce on trusted system, standardized auth services, centralized failure responses, credential-specific error messages avoided
  4. **Session Management:** server-generated session identifiers, high entropy, set domain/path restrictively, logout terminates session, session timeout, disallow concurrent sessions, regenerate on re-auth
  5. **Access Control:** default deny, enforce on trusted system, centralized mechanism, restrict access to protected URLs/functions/services/data/files, server-side validation of permissions
  6. **Cryptographic Practices:** use well-vetted algorithms, protect master secrets, generate random numbers with approved generators, establish key management policy
  7. **Error Handling & Logging:** do not expose sensitive info in error responses, use custom error pages, release allocated memory on error, log all authentication and access control failures, use a common logging mechanism
  8. **Data Protection:** least privilege principle, remove temporary files promptly, encrypt sensitive data at rest and in transit, remove unnecessary comments in production code
  9. **Communication Security:** TLS for all connections with sensitive data, validate TLS certificates, use TLS for external connections
  10. **System Configuration:** ensure servers are hardened, keep components up to date, disable directory listings, restrict web server privileges
  11. **Database Security:** parameterized queries, input validation before database operations, principle of least privilege for database accounts, disable default accounts, close connections ASAP
  12. **File Management:** do not pass user-supplied data to dynamic includes, require authentication for file uploads, limit upload types, validate file types server-side, do not save files in web-accessible directories
  13. **Memory Management:** validate buffer boundaries, truncate input to buffer size, free allocated resources on error, utilize non-executable stacks where available
  14. **General Coding Practices:** use well-tested code, check return values, use checksums/hashes to verify integrity, avoid deserializing data from untrusted sources, implement safe updating

## Source 6: OWASP Top 10 Proactive Controls 2024 (https://top10proactive.owasp.org/archive/2024/the-top-10/)

- Focus on defensive techniques developers should implement *proactively* (vs. the Top 10 which focuses on vulnerabilities to avoid)
- Provides positive patterns to implement solutions considered secure by design
- **The 10 Controls (2024 version):**
  - **C1: Implement Access Control** - enforce authorization checks server-side, default deny, centralized mechanism
  - **C2: Use Cryptography properly** - protect data at rest and transit with vetted algorithms, proper key management
  - **C3: Validate all Input & Handle Exceptions** - validate all input server-side, define allowlists, handle all exceptions gracefully
  - **C4: Address Security from the Start** - secure architecture, threat modeling during design, secure design patterns, defense in depth
  - **C5: Secure By Default Configurations** - minimize attack surface, disable unnecessary features, secure defaults out-of-the-box
  - **C6: Keep your Components Secure** - track dependencies, monitor for CVEs, update promptly, use SCA tools
  - **C7: Secure Digital Identities** - strong authentication, multi-factor auth, secure session management, credential storage
  - **C8: Leverage Browser Security Features** - Content Security Policy, Subresource Integrity, security headers, same-site cookies
  - **C9: Implement Security Logging and Monitoring** - log security events, protect log integrity, enable alerting, support incident response
  - **C10: Stop Server Side Request Forgery** - validate/sanitize URLs, allowlist approaches, network segmentation

## Source 7: OWASP Secure by Design Framework v0.5.0 (https://owasp.org/www-project-secure-by-design-framework/)

- Draft version 0.5.0 (August 2025), focused on design-time decisions before code is written
- Intended for system/product architects, product engineers, and security engineers
- **Core position:** security flaws introduced during system design are the most costly and complex to remediate, often requiring fundamental architectural changes
- **Project Deliverables:**
  - Structured Secure-by-Design Framework with principle-driven guide
  - Design-Phase Security Checklist for architects and engineers
  - Best-Practice Guides covering microservices, resilience, service-to-service interactions
  - Secure API & Messaging Guidance for HTTP, gRPC, Kafka, AMQP, event-driven designs
  - Reference Implementations & Real-World Examples
- **Scope:** does NOT cover secure coding practices (OWASP Top 10, ASVS), implementation-phase testing, or threat-modeling methodology itself
- Complements ASVS and Top 10 by addressing the architectural layer that precedes implementation

## Source 8: OWASP Cheat Sheet Series (https://cheatsheetseries.owasp.org/index.html)

- Over 80 cheat sheets covering specific application security topics
- Each cheat sheet focuses on a specific vulnerability or security practice with concrete guidance and code examples
- Updated periodically to reflect current threats and best practices
- Language-agnostic by design, applicable across web development technologies
- Licensed under Creative Commons Attribution-ShareAlike 4.0 International
- **Key security-review-relevant cheat sheets include:**
  - SQL Injection Prevention, XSS Prevention, CSRF Prevention
  - Authentication, Session Management, Authorization
  - Input Validation, Output Encoding
  - Cryptographic Storage, Transport Layer Security
  - Error Handling, Logging
  - Deserialization, File Upload, SSRF Prevention
  - Threat Modeling, Secure Product Design
  - Secrets Management, Key Management
- Indexed by OWASP Top 10 mapping and by ASVS section for cross-referencing

## Source 9: NCSC Security Architecture Anti-Patterns (https://www.ncsc.gov.uk/whitepaper/security-architecture-anti-patterns)

- Published by UK National Cyber Security Centre, aimed at network designers, technical architects, and security architects
- **Six anti-patterns to avoid:**
  1. **Browse-up for administration:** using a less-trusted device to administer a more-trusted system (e.g., browsing to admin console from standard workstation). Fix: use dedicated admin workstations, separate admin network
  2. **Management bypass:** management/monitoring traffic bypasses security controls placed on data traffic. Fix: treat management plane with at least same rigor as data plane
  3. **Back-to-back firewalls:** two firewalls in series from different vendors, adding complexity without meaningful security gain. Fix: single well-configured firewall, invest effort in proper rules rather than redundant hardware
  4. **Building on-prem solution in cloud:** lifting on-prem architecture to cloud without leveraging cloud-native security features. Fix: redesign for cloud-native security patterns, use IAM, VPCs, security groups properly
  5. **Uncontrolled and unobserved third-party access:** giving third parties broad access without monitoring or limiting scope. Fix: least privilege, audit trails, time-limited access, network segmentation
  6. **The un-patchable system:** systems that cannot be updated due to certification, vendor lock-in, or operational fear. Fix: design for patchability, maintain test environments, plan update cycles
- Uses trust-based terminology: "less trusted" (low side) vs "more trusted" (high side)

## Source 10: Security Design Patterns vs Anti-Patterns in Literature (https://dev.to/ihonchar/why-software-design-patterns-matter-for-cybersecurity-377e and https://ksiresearch.org/seke/seke21paper/paper179.pdf)

- **Key thesis:** design patterns are a "silent force multiplier" for security -- they define boundaries, responsibilities, and communication rules that make it possible to enforce security policies predictably
- **Patterns that strengthen security:**
  - **Layered Architecture / MVC:** enforces separation of concerns, prevents security logic from leaking between layers
  - **Proxy Pattern:** acts as gatekeeper, ideal for access control, rate limiting, input validation before requests reach core logic
  - **Strategy Pattern:** swap security algorithms (encryption, auth) without changing core code
  - **Observer Pattern:** enables real-time security event monitoring and alerting
  - **Facade Pattern:** simplifies API surface, reducing attack surface exposed to clients
  - **Singleton Pattern (for security services):** ensures consistent security configuration across the application
  - **Factory Pattern:** centralizes object creation, preventing injection of malicious objects
- **Anti-patterns that create vulnerabilities:**
  - God Object: concentrates too much logic, single point of failure for security
  - Spaghetti Code: impossible to audit for security, hides vulnerability patterns
  - Hard-coded credentials: classic anti-pattern, detected by SAST tools
  - Shared mutable state: race conditions that bypass security checks
- **Academic research (SEKE 2021 paper):** structured approach to map vulnerability anti-patterns to best-fit secure design patterns at architectural, design, and implementation levels. Example: XSS anti-patterns map to input validation (implementation), output encoding (design), and CSP headers (architectural)

## Source 11: Language-Specific Security Guides (Multiple OWASP sources)

- **JavaScript (JS-SCP):** https://github.com/Checkmarx/JS-SCP
  - Based on OWASP Secure Coding Practices Quick Reference Guide v2
  - Key concerns: XSS via DOM manipulation, prototype pollution, unsafe dynamic code execution from user input, insecure npm dependencies, CSRF in SPAs
  - Recommendations: DOMPurify for sanitization, Content Security Policy, strict mode, input validation with allowlists
- **Go (Go-SCP):** https://github.com/OWASP/Go-SCP and https://owasp.org/www-project-go-secure-coding-practices-guide/
  - Hands-on approach to secure coding in Go
  - Key concerns: race conditions in goroutines, SQL injection via string formatting, directory traversal, insecure TLS configurations
  - Go-specific: use html/template for output encoding, database/sql with parameterized queries, crypto/rand for random number generation
- **Python:** covered in general OWASP guides
  - Key concerns: injection via f-strings in SQL, command injection via unsafe subprocess usage with shell=True, YAML deserialization attacks, unsafe object serialization formats
  - Recommendations: parameterized queries via ORMs, subprocess.run() with shell=False, yaml.safe_load(), use JSON for data interchange instead of unsafe serialization
- **General principle:** language-specific guides all trace back to the same OWASP Secure Coding Practices checklist but provide idiomatic examples for each language's unique risk surface

## Source 12: SAST Tools Implementing OWASP Checks (https://owasp.org/www-community/Source_Code_Analysis_Tools)

- OWASP maintains a list of SAST tools at their Source Code Analysis Tools page
- **Strengths of SAST tools:** scales well (nightly builds, CI), identifies known patterns (buffer overflows, SQL injection), provides filename/line/snippet context
- **Weaknesses of SAST tools:** difficult to automate auth/access-control/crypto checks, high false positive rates, limited to small percentage of flaws, cannot find config issues in code, difficult to prove findings are real vulnerabilities
- **Key open-source tools:**
  - **Semgrep:** semantic pattern matching, 900+ rules for OWASP Top 10, YAML-based custom rules, 10-second median CI scan time, supports 30+ languages. Free for open source.
  - **SonarQube:** 6,000+ rules across 35+ languages, covers bugs/vulnerabilities/code smells/security hotspots, OWASP Top 10 coverage built-in, quality gate enforcement
  - **CodeQL (GitHub):** semantic code analysis, query language for writing security checks, integrated with GitHub Advanced Security, open-source query packs
  - **Bandit (Python):** Python-specific, finds common security issues, integrates with CI/CD
  - **ESLint Security Plugin (JavaScript):** eslint-plugin-security for Node.js security patterns
  - **gosec (Go):** Go-specific security scanner, checks for crypto, injection, file handling issues
  - **SpotBugs + FindSecBugs (Java):** Java bytecode analysis with security-focused plugin
- **Selection criteria:** language support, detection accuracy (false positive/negative rates), OWASP Benchmark score, integration capabilities, reporting quality

## Source 13: Semgrep vs SonarQube Comparison (https://dev.to/rahulxsingh/semgrep-vs-sonarqube-sast-tools-compared-2026-4hm6)

- **Semgrep:** security-first scanner, custom YAML rules, fast CI scans (seconds not minutes), AI-powered triage (Semgrep Assistant) reduces false positives, open-source CLI free for commercial use
- **SonarQube:** code quality platform first, security second, 6,000+ out-of-the-box rules, comprehensive dashboard for bugs/smells/duplication/security, quality gates
- **Key differentiation:** Semgrep engineering effort goes into security scanning; SonarQube distributes effort across security + quality + duplication + complexity
- **OWASP coverage:** both map findings to OWASP Top 10 and CWE/SANS Top 25
- **Recommendation:** use Semgrep when security is primary goal (deeper findings, fewer false positives); use SonarQube when comprehensive code quality + security in single platform is needed; many teams use both

## Source 14: Academic SLR - LLMs and Code Security (https://arxiv.org/html/2412.15004v2)

- Systematic Literature Review by Basic & Giaretta (Orebro University, 2024)
- **Scope:** investigates security benefits and drawbacks of LLMs for code-related tasks: vulnerability introduction, detection, fixing, and impact of data poisoning
- **Key findings on LLM-generated vulnerabilities:**
  - 12-65% of LLM-generated code snippets are non-compliant with secure coding standards or trigger CWE-classified vulnerabilities
  - Prevalent weakness classes: buffer overflows, unchecked return values, hard-coded credentials, SQL injection, code injection, cryptographic misuse, path traversal, improper input validation
  - Security vulnerabilities frequently persist and increase through iterative LLM feedback loops
- **Key findings on LLM vulnerability detection:**
  - LLMs can be powerful detection tools when provided with detailed prompts and clear context
  - Chain-of-Thought prompting enhances reasoning for complex code analysis
  - Large decoder-only models (GPT, CodeLlama) used in 65% of fine-tuning experiments
  - Fine-tuning approaches (SVEN, SafeCoder) on curated datasets achieve up to 35% reduction in vulnerability rate
- **Implications for code review:** LLM-assisted review should complement, not replace, manual OWASP-based review; LLM outputs themselves need security review

## Source 15: GitHub Blog - OWASP Proactive Controls (https://github.blog/open-source/write-more-secure-code-owasp-top-10-proactive-controls/)

- By Alvaro Munoz (GitHub Security Lab), December 2021
- **Key argument:** expecting developers to know every vulnerability category does not scale; proactive controls provide defensive programming concepts that reduce odds of introducing vulnerabilities regardless of specific knowledge
- **Quote:** "From my experience all software developers are now security engineers whether they know it, admit to it, or do it." -- Jim Manico
- **Limits of Top 10 risk lists:** cannot be comprehensive, may not apply to specific tech stacks, evolve constantly
- **Proactive controls approach:** by consistently applying defensive programming, developers reduce vulnerability introduction even without deep security expertise
- **Specific guidance per control:** implement security early in design, use well-vetted libraries rather than rolling your own, apply defense-in-depth at every layer
- **Integration with GitHub:** CodeQL for automated detection, Dependabot for dependency security, security advisories for coordinated disclosure

## Source 16: HackTheBox 10-Point Secure Code Review Checklist (https://www.hackthebox.com/blog/secure-code-reviews)

- Practical, developer-oriented checklist published March 2024
- **Preparation before review:** control code change size, document changes, define required tests, run formatting/linting, run SAST/security testing first
- **The 10-Point Checklist:**
  1. **Input validation issues:** check all user inputs validated server-side, allowlists over denylists, validate type/length/range/format
  2. **Authentication and authorization flaws:** verify auth on all endpoints, check for privilege escalation paths, validate token handling
  3. **Data encryption and secure communication:** TLS everywhere, proper certificate validation, no sensitive data in logs or URLs
  4. **Exception handling and logging:** no stack traces in production, sensitive data not leaked in errors, security events logged
  5. **Dependency management:** check for known CVEs, pin versions, audit new dependencies before adoption
  6. **Proper use of API and integration points:** validate all external API responses, rate limiting, proper error handling for third-party calls
  7. **CSRF protections:** verify anti-CSRF tokens on state-changing operations, SameSite cookie attributes
  8. **Server-side code execution validation:** no dynamic code execution with user input, safe deserialization, template injection prevention
  9. **Business logic errors:** race conditions, TOCTOU bugs, negative quantity attacks, workflow bypass
  10. **Code quality and best practices:** no dead code hiding security issues, consistent patterns, security-relevant code comments
- **Measuring impact:** track vulnerability density, mean time to remediation, percentage of reviews that catch security issues

---

## Synthesis

### Core Framework: The OWASP Security Review Stack

OWASP provides a layered, complementary set of resources that form a complete security review framework:

1. **Architecture layer** -- Secure by Design Framework + Proactive Control C4 (Address Security from the Start) establish that security must be designed in before code is written. The NCSC anti-patterns provide concrete examples of what to avoid architecturally.

2. **Requirements layer** -- ASVS v5.0.0 provides 14 chapters of testable security requirements at three assurance levels, serving as the definitive checklist for what a secure application must satisfy.

3. **Implementation layer** -- The Secure Coding Practices Quick Reference Guide provides the technology-agnostic checklist (14 categories, ~130 items) that developers follow during coding. Language-specific guides (JS-SCP, Go-SCP, Python patterns) translate these into idiomatic code for each language.

4. **Review layer** -- The Code Review Guide v2 and Secure Code Review Cheat Sheet provide the methodology: preparation, data flow analysis, vulnerability pattern recognition, and checklists for manual review.

5. **Automation layer** -- SAST tools (Semgrep, SonarQube, CodeQL, Bandit, gosec) implement automated detection mapped to OWASP Top 10 and CWE, complementing manual review for known patterns.

6. **Reference layer** -- The 80+ Cheat Sheet Series provides deep-dive guidance on every specific vulnerability class and secure coding topic, cross-indexed to both the Top 10 and ASVS.

### Key Patterns for a Security Review Skill

For a Wazir security review skill, the research points to these patterns:

1. **Data Flow Tracing (Source-Sink Analysis):** The most effective manual review technique. Trace user input from source (request params, file uploads, API calls) through processing to sink (database queries, file writes, output rendering, external APIs). This catches injection, XSS, path traversal, SSRF, and command injection.

2. **Checklist-Driven Review by OWASP Category:** Map each OWASP Top 10 category to specific code patterns to look for. The Cheat Sheet Index mapped to Top 10 provides the exact lookup table.

3. **Trust Boundary Validation:** At every trust boundary crossing (client-server, service-service, application-database), verify that input validation, output encoding, authentication, and authorization are enforced.

4. **Design Pattern Enforcement:** Verify that security-relevant code uses established patterns (centralized auth, parameterized queries, output encoding libraries) rather than ad-hoc implementations.

5. **Negative Pattern Detection:** Flag known anti-patterns: string concatenation in queries, dynamic code execution with user input, hard-coded credentials, shared mutable state, deserialization of untrusted data, shell=True in subprocess calls.

6. **Defense-in-Depth Verification:** Check that security is not dependent on a single control. Multiple layers should exist: input validation + parameterized queries + least-privilege database accounts for SQL injection defense.

7. **Language-Specific Risk Awareness:** Each language has unique risk surfaces (JavaScript: prototype pollution, unsafe dynamic execution; Python: unsafe deserialization, f-string SQL; Go: goroutine race conditions, string-formatted queries).

### SAST Tool Integration Strategy

- Use **Semgrep** as primary security scanner: fast, custom rules in YAML, OWASP Top 10 coverage, low false positive rate
- Use **SonarQube** for broader code quality + security in a single dashboard
- Use **CodeQL** for deep semantic analysis on GitHub-hosted code
- Use language-specific tools (**Bandit** for Python, **gosec** for Go, **eslint-plugin-security** for JS) for idiomatic checks
- Manual review remains essential for: access control logic, business logic flaws, race conditions, cryptographic misuse, and architectural issues that SAST cannot detect

### Academic Research Implications

- LLM-assisted code review is promising but unreliable: 12-65% of LLM-generated code has security issues
- LLMs should be used as an *additional* layer alongside OWASP-based manual review, not as a replacement
- Chain-of-Thought prompting and fine-tuning on secure/vulnerable code pairs improve LLM detection accuracy
- The field is actively evolving; any LLM-based security review should be grounded in OWASP patterns rather than relying on model knowledge alone

### Quantitative Baseline

- OWASP Top 10 covers the vulnerability classes behind 62% of breaches (per 2024 data)
- SAST tools can automatically detect only a "relatively small percentage" of security flaws (OWASP's own assessment)
- The gap between automated and manual detection is largest for: authentication problems, access control issues, cryptographic misuse, and business logic flaws
- A complete security review combines automated scanning (catches known patterns at scale) with manual review (catches logic, design, and context-dependent issues)
