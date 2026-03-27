# 43 - Infrastructure-as-Code Security Review & Cloud Security Code Review

> Research date: 2026-03-25
> Scope: IaC security scanning tools, Terraform/CloudFormation/Kubernetes security review, Docker/container security, policy-as-code engines, CI/CD pipeline security, cloud security posture management, academic research on IaC security

---

## Source: QodeQuay - Infrastructure as Code Security: Best Practices for 2025 (https://www.qodequay.com/iaac-security-best-practices-2025)

- Key IaC security characteristics: automation, repeatability, version control for consistent security policy application
- Security controls must be embedded at every stage of the development pipeline -- scan IaC templates for vulnerabilities before deployment
- Integration of automated security testing into CI/CD: static analysis (scanning code), dynamic analysis (testing running infra), and penetration testing
- Never store secrets (passwords, API keys) in IaC code; use HashiCorp Vault, AWS Secrets Manager
- Permissions for users and automated processes must follow least privilege
- Store IaC templates in Git -- version control acts as the audit trail
- Develop standardized, secure modules for common infrastructure patterns
- Define compliance rules as code so infrastructure automatically adheres to regulatory requirements
- Regularly check for configuration drift and reconcile differences

---

## Source: Wiz - What is Infrastructure as Code Security? (https://www.wiz.io/academy/iac-security)

- IaC security involves scanning cloud infrastructure provisioned using Terraform, CloudFormation, Kubernetes, Helm, etc. for misconfigurations
- Shift-left approach: catch security flaws during code review rather than in production
- Key risk areas: overly permissive IAM roles, unencrypted storage, exposed network ports, missing logging
- IaC security tools take two approaches: proactive (scan before deployment) and reactive (scan running infrastructure)
- Up to 72% of organizations now use some form of IaC

---

## Source: env0 - Top Infrastructure as Code Security Tools 2025 (https://www.env0.com/blog/top-infrastructure-as-code-security-tools)

- Global market for IaC security tools estimated at USD 2.1 billion in 2024, projected to reach USD 7.5 billion by 2030
- Leading open-source tools: Checkov, Trivy, KICS, Terrascan, Prowler
- Commercial tools: Snyk IaC, Prisma Cloud, Wiz
- All tools converge on common detection categories: encryption, access control, network exposure, logging, compliance

---

## Source: policyascode.dev - Checkov vs TFSec vs Terrascan: Top IaC Scanners Compared (2025) (https://policyascode.dev/guides/checkov-vs-tfsec-vs-terrascan/)

- **Checkov** (by Bridgecrew/Palo Alto Networks): Python-based, 1000+ built-in policies, supports Terraform, CloudFormation, Kubernetes, ARM, Serverless, Helm, Dockerfile; custom policies in Python or YAML; graph-based cross-resource analysis; best for multi-IaC environments
- **tfsec** (by Aqua Security, now deprecated in favor of Trivy): Go-based, originally laser-focused on Terraform, blazing fast, simple YAML/JSON custom policies; best for Terraform-heavy teams where speed is critical
- **Terrascan** (by Tenable): Go-based, uses OPA Rego for all policies, 500+ built-in checks against CIS Benchmarks; best for teams already using OPA/Rego or needing highly flexible custom policies
- Feature comparison table:
  - Performance: Checkov good (slower on large codebases), tfsec excellent (fastest), Terrascan very good
  - IaC support: Checkov broadest, tfsec primarily Terraform, Terrascan multi-IaC
  - Custom policy ease: Checkov moderate (YAML) to complex (Python), tfsec easy (YAML), Terrascan moderate-complex (Rego)
  - Licenses: Checkov Apache 2.0, tfsec MIT, Terrascan Apache 2.0
- All three provide CLI, JSON, JUnit, SARIF output formats

---

## Source: env0 - Which IaC Scanning Tool is the Best? (https://www.env0.com/blog/best-iac-scan-tool)

- Hands-on comparison using identical Terraform code against all three tools
- Checkov detected the most issues out-of-the-box due to its larger policy library
- tfsec provided the fastest scan times and most developer-friendly output
- Terrascan offered the most flexibility for custom policies via Rego
- Recommendation: use Checkov for broad coverage, tfsec/Trivy for speed, Terrascan for OPA-native environments

---

## Source: iacsecurity/tool-compare - IaC Scanner Benchmark (https://github.com/iacsecurity/tool-compare)

- Neutral, open-source benchmark comparing IaC scanners against standardized test cases from CSP best practices and CIS benchmarks
- 284 stars, 61 forks; tests across Terraform AWS and Azure configurations
- **Benchmark results (tested 2021, versions at that time):**
  - Terraform AWS catch rate: Checkov 69%, Indeni Cloudrail 93%, KICS 94%, Snyk 62%, Terrascan 73%, tfsec 61%
  - Terraform Azure catch rate: Checkov 47%, Indeni Cloudrail 35%, KICS 23%, Snyk 30%, Terrascan 8%, tfsec 18%
  - Advanced Language Expressions: Checkov 20%, Indeni Cloudrail 100%, KICS 20%, Snyk 0%, Terrascan 0%, tfsec 0%
  - **Total catch rate: Checkov 59%, Indeni Cloudrail 72%, KICS 65%, Snyk 48%, Terrascan 47%, tfsec 43%**
- Note: these results are from 2021 tool versions; all tools have significantly improved since then
- KICS led on AWS detection; Cloudrail led on advanced expressions; Checkov had most balanced coverage

---

## Source: devDosvid - A Deep Dive Into Terraform Static Code Analysis Tools (2024) (https://devdosvid.blog/2024/04/16/a-deep-dive-into-terraform-static-code-analysis-tools-features-and-comparisons/)

- Compares Checkov, tfsec, Terrascan, KICS, Snyk IaC, and Trivy for Terraform scanning
- tfsec deprecated in 2023, transition to Trivy completed by 2024 -- all tfsec rules migrated
- Migration path: replace `tfsec .` with `trivy config .`; check IDs (e.g., AVD-AWS-0086) work unchanged
- KICS has 2,400+ Rego queries and ships severity-mapped exit codes (60=Critical, 50=High, 40=Medium) for CI/CD gating
- Recommendation: avoid tfsec for new projects; use Trivy as its successor

---

## Source: Bridgecrew/Checkov GitHub Repository (https://github.com/bridgecrewio/checkov)

- Over 80 million downloads; 1,000+ built-in policies
- Scans: Terraform, Terraform plan, CloudFormation, AWS SAM, Kubernetes, Helm, Kustomize, Dockerfile, Serverless, Bicep, OpenAPI, ARM Templates, OpenTofu
- Graph-based scanning: analyzes relationships between cloud resources using graph-based YAML policies
- Supports custom policies in YAML (simplified) or Python (full power)
- Policy-as-Code framework with metadata section and definition section
- Terraform plan scanning provides richer context than HCL scanning alone
- Compliance frameworks: CIS, HIPAA, PCI DSS, SOC2
- CI/CD integration via GitHub Actions (`bridgecrewio/checkov-action`), GitLab CI, Jenkins
- Bridgecrew Platform (SaaS) adds collaboration, reporting, and team management on top of open-source CLI

---

## Source: Tenable Terrascan (https://www.tenable.com/cloud-security/solutions/iac)

- 500+ out-of-the-box policies aligned with CIS Benchmark
- Uses OPA engine with Rego query language for all policies
- Supports Terraform, Kubernetes, Helm, Dockerfiles, CloudFormation
- Unique feature: continuous monitoring of live infrastructure and config drift detection
- Steeper learning curve due to Rego, but maximum flexibility for complex policies
- Best for teams already invested in OPA/Rego ecosystem

---

## Source: Aqua Security - Trivy (https://trivy.dev/)

- Trivy absorbed tfsec in 2024; all tfsec rules fully merged
- Multi-purpose security scanner: container images, filesystems, git repos, IaC formats
- `trivy config .` replaces `tfsec .` for IaC scanning
- Supports Terraform, CloudFormation, Kubernetes, Helm, Dockerfile, and more
- Inline suppressions from tfsec carry over to Trivy
- Additional capabilities: vulnerability scanning, secrets detection, SBOM generation, license scanning
- Most popular open-source security scanner by download count

---

## Source: Google Cloud - Best Practices for Security with Terraform (https://docs.cloud.google.com/docs/terraform/best-practices/security)

- Use Cloud Storage state backend with locking for team collaboration
- Separate state from version control to protect sensitive information
- Encrypt state at rest; use customer-managed encryption keys for highly sensitive state
- Apply principle of least privilege to service accounts running Terraform
- Use `google_project_iam_member` instead of `google_project_iam_policy` to avoid overwriting existing bindings

---

## Source: HashiCorp - Terraform Security: 5 Foundational Practices (https://www.hashicorp.com/en/blog/terraform-security-5-foundational-practices)

- Use remote backends with encryption and access controls for state files
- Never hardcode secrets; reference external secret stores
- Enforce code review through pull requests before any infrastructure changes
- Implement policy-as-code with Sentinel (TFC/TFE) or OPA for guardrails
- Run `terraform fmt`, `terraform validate`, and security scanners in CI/CD

---

## Source: Spacelift - 13 Terraform Security Best Practices (https://spacelift.io/blog/terraform-security)

- State files contain sensitive data (API keys, secrets, resource configs) -- never commit to Git
- Use remote state storage with encryption (S3, GCS, Terraform Cloud)
- Implement RBAC using Terraform Cloud or CI/CD tools
- Verify integrity, source, and version of providers and modules
- Use `terraform validate`, `terraform plan`, and Terratest for testing
- Pin provider and module versions to prevent supply chain attacks
- Use `sensitive = true` for output values containing secrets
- Enable audit logging for all Terraform operations

---

## Source: AWS - Security Best Practices for Terraform (https://docs.aws.amazon.com/prescriptive-guidance/latest/terraform-aws-provider-best-practices/security.html)

- Use IAM roles instead of access keys for Terraform execution
- Store state in S3 with server-side encryption and DynamoDB locking
- Use `backend "s3"` with `encrypt = true`
- Restrict state bucket access with bucket policies
- Use Terraform workspaces to separate environments

---

## Source: Propel - IaC Security Review: Terraform and CloudFormation Best Practices (https://www.propelcode.ai/blog/infrastructure-as-code-security-review-terraform-cloudformation)

- 80% of cloud security incidents stem from misconfigurations, not vulnerabilities
- Common Terraform misconfigs: overly permissive security groups, unencrypted S3 buckets, public-facing databases
- Common CloudFormation misconfigs: open 0.0.0.0/0 inbound rules, missing encryption on EBS/RDS, hardcoded secrets in parameters
- Review checklist: encryption at rest and in transit, least-privilege IAM, network segmentation, logging enabled, no hardcoded secrets

---

## Source: Cycode - AWS CloudFormation Security: 8 Best Practices (https://cycode.com/blog/aws-cloudformation-security-8-best-practices/)

- Use NoEcho for sensitive CloudFormation parameters
- Integrate with AWS Systems Manager Parameter Store for secrets
- Implement CloudFormation Guard for policy-as-code validation
- Use cfn-lint for template syntax and best practice validation
- Enable drift detection to ensure deployed infra matches IaC
- Apply least privilege to CloudFormation execution roles
- Use StackSets with guardrails for multi-account deployments

---

## Source: stelligent/cfn_nag - CloudFormation Linter (https://github.com/stelligent/cfn_nag)

- Open-source Ruby-based CloudFormation template scanner
- 140+ predefined patterns including IAM rules
- Detects: overly permissive IAM policies, insecure security groups, missing access logging, lack of encryption, hardcoded passwords
- Integrates with AWS CodePipeline for automated scanning

---

## Source: AWS - CloudFormation Guard (https://aws.amazon.com/blogs/mt/write-preventive-compliance-rules-for-aws-cloudformation-templates-the-cfn-guard-way/)

- Domain-specific language (DSL) for writing policy rules
- Written in Rust; compiles to native binary for fast evaluation of thousands of rules
- Easier learning curve than Python/Ruby required by cfn_nag
- Can validate both CloudFormation templates and Terraform plans (via JSON)

---

## Source: Atmosly - Kubernetes Security Checklist (2025): 50 Best Practices (https://atmosly.com/blog/kubernetes-security-checklist-50-best-practices-2025)

- Organizations with properly configured RBAC reduced security incidents by 64% (2024 Security Benchmark Report)
- 47% faster incident remediation with structured RBAC
- 71% of enterprises struggle maintaining RBAC configurations over time; permissions frequently expand beyond necessary boundaries
- AKS clusters face first attack within 18 minutes of creation; EKS within 28 minutes
- Service mesh implementations reduced successful network-based attacks by 62%
- Recommended: default deny-all network policies, Pod Security Standards at restricted level, runAsNonRoot, drop ALL capabilities

---

## Source: Kubernetes Official Docs - Pod Security Standards (https://kubernetes.io/docs/concepts/security/pod-security-standards/)

- Three policy levels: Privileged (unrestricted), Baseline (prevent known escalations), Restricted (hardening best practices)
- Pod Security Admission (PSA) controller modes: enforce (reject), audit (log), warn (user warning)
- Generally available since Kubernetes 1.25
- Restricted level requires: runAsNonRoot, drop ALL capabilities, seccompProfile, no hostNetwork/hostPID/hostIPC, no privileged containers
- Baseline level prevents: hostNetwork, hostPID, hostIPC, privileged containers, host path volumes, host ports
- Applied via namespace labels: `pod-security.kubernetes.io/enforce: restricted`

---

## Source: Mogenius - Kubernetes Security: RBAC, Network Policies, and Kubernetes Policies (https://mogenius.com/blog-post/enhancing-kubernetes-security-through-rbac-network-policies-and-kubernetes-policies)

- Start with deny-by-default RBAC; disable legacy ABAC
- Prefer Roles/RoleBindings scoped to namespaces over ClusterRoles
- Bind service accounts explicitly; avoid default service account access
- Network Policies: default deny-all, then explicitly allow required traffic
- Use Admission Controllers (OPA Gatekeeper, Kyverno) for policy enforcement at the API server level

---

## Source: Sealos - Practical Guide to Kubernetes Security Hardening (2025) (https://sealos.io/blog/a-practical-guide-to-kubernetes-security-hardening-your-cluster-in-2025/)

- Enable audit logging for all API server requests
- Encrypt etcd data at rest
- Use network policies to segment namespaces
- Rotate certificates and tokens regularly
- Use admission webhooks for runtime policy enforcement
- Monitor with Falco for runtime threat detection

---

## Source: Kubernetes Network Policy Best Practices (https://daily.dev/blog/kubernetes-network-policies-best-practices)

- First policy should always be default deny-all ingress and egress
- Use namespace selectors for cross-namespace policies
- Label-based selection for fine-grained pod-to-pod rules
- Test policies in audit mode before enforcing
- Microsoft recommends Cilium for Linux (eBPF-based enforcement), Calico for Windows
- Cilium supports Layer 7 (application layer) policies; Calico 3.31 offers ~15k rules per endpoint direction
- Use monitoring tools (Prometheus, Grafana, Hubble) to track traffic and policy performance

---

## Source: Medium - Strengthening Kubernetes Security with Kubesec & Kube-bench (https://medium.com/@khanmohammadiaryan/strengthening-kubernetes-security-with-kubesec-kube-bench-56f85b47264f)

- **KubeSec**: static analysis of Kubernetes YAML files; detects overly permissive roles, missing resource limits, insecure pod configs; integrates into CI/CD pipelines
- **Kube-bench**: compliance checker against CIS Kubernetes Benchmark; validates cluster component and control plane configuration
- **Kube-hunter**: proactive vulnerability hunter for Kubernetes clusters; tests for exposed APIs, default credentials, network exposures
- Dual approach: KubeSec at manifest level + kube-bench at infrastructure level significantly reduces attack surface

---

## Source: Spacelift - Kubernetes with OPA & Gatekeeper (https://spacelift.io/blog/opa-kubernetes)

- OPA Gatekeeper integrates OPA into Kubernetes admission control via CRDs
- ConstraintTemplate defines Rego code; Constraint applies it to specific resources
- Common policy examples: block privileged containers, require labels, enforce resource limits, validate ingress hostnames
- Gatekeeper automates OPA configuration as admission controller
- Alternative: Kyverno (YAML-based policies, no Rego required)

---

## Source: OWASP Docker Security Cheat Sheet (https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

- **RULE #0**: Keep host and Docker updated (protect against container escape like Leaky Vessels)
- **RULE #1**: Do not expose the Docker daemon socket
- **RULE #2**: Set a user (avoid running as root)
- **RULE #3**: Limit capabilities (drop ALL, add only needed)
- **RULE #4**: Add --no-new-privileges flag
- **RULE #5**: Disable inter-container communication (use custom networks instead of --icc=false)
- **RULE #6**: Use Linux Security Modules (seccomp, AppArmor, SELinux)
- **RULE #7**: Limit resources (memory, CPU, file descriptors, processes, restarts)
- **RULE #8**: Set filesystem and volumes to read-only
- **RULE #9**: Integrate container scanning tools into CI/CD pipeline
- **RULE #10**: Keep Docker daemon logging level at info
- **RULE #11**: Run Docker in rootless mode
- **RULE #12**: Use Docker Secrets for sensitive data management
- **RULE #13**: Enhance supply chain security
- Docker manages its own iptables/nftables and bypasses UFW -- common firewall misconfiguration
- Podman mentioned as a daemonless alternative with better security defaults

---

## Source: Snyk - 10 Docker Image Security Best Practices (https://snyk.io/blog/10-docker-image-security-best-practices/)

- Use minimal base images (Alpine, distroless) to reduce attack surface
- Pin image versions (e.g., `node:16-alpine`) instead of `latest`
- Multi-stage builds to minimize final image size and attack surface
- Don't run as root -- use USER instruction in Dockerfile
- Scan images for vulnerabilities using Trivy, Snyk, or Docker Scout
- Don't leak secrets in build layers -- use BuildKit secrets or multi-stage builds
- Use .dockerignore to prevent sensitive files from entering build context
- Sign images with Cosign for supply chain integrity
- Generate and verify SBOMs for transparency

---

## Source: Sysdig - Top 20 Dockerfile Best Practices (https://www.sysdig.com/learn-cloud-native/dockerfile-best-practices)

- Use official and verified base images
- Pin versions with SHA256 digests for maximum reproducibility
- Order layers from least to most frequently changing for cache efficiency
- Combine RUN commands to reduce layers
- Remove package manager caches after installation
- Use COPY instead of ADD (ADD has tar extraction and URL fetch side effects)
- Set HEALTHCHECK for container health monitoring
- Use `--no-install-recommends` with apt-get

---

## Source: Hadolint - Dockerfile Linter (https://github.com/hadolint/hadolint)

- Most popular open-source Dockerfile linter, written in Haskell
- Parses Dockerfile into AST and applies comprehensive rule set
- Uses ShellCheck internally to validate shell code in RUN instructions
- Severity levels: Error (severe/security), Warning (minor security), Style (formatting), Info (suggestions)
- Key security rules: DL3007 (don't use `latest` tag), DL3009 (clean apt cache), DL3015 (use `--no-install-recommends`)
- Can restrict allowed registries -- fails if images come from unauthorized registries
- CI/CD integration: GitHub Actions, GitLab CI, Jenkins, VS Code extension
- Configuration via `.hadolint.yaml` for rule ignoring and severity customization

---

## Source: Checkmarx - Docker Container Security Best Practices (https://checkmarx.com/learn/container-security/docker-container-security-best-practices-image-scanning-is-non-negotiable/)

- Image scanning is "non-negotiable" -- must be part of every CI/CD pipeline
- Scanning tools: Trivy, Clair, Docker Scout, Snyk Container
- Static scanning checks Dockerfile and image layers; dynamic scanning checks running containers
- SBOM generation becoming a regulatory requirement (EU Cyber Resilience Act)
- Container runtime security: Falco, Sysdig Secure for anomaly detection

---

## Source: Container Supply Chain Security - Cosign and SBOM Signing (https://openssf.org/blog/2024/02/16/scaling-up-supply-chain-security-implementing-sigstore-for-seamless-container-image-signing/)

- Software supply chain attacks increased 742% between 2019 and 2024
- Cosign 2.0 (Feb 2024): keyless signing for container images fully supported
- Cosign stores signatures in OCI registry alongside image (as .sig tag)
- SBOM attestation workflow: generate SBOM with Syft, create in-toto attestation, sign with Cosign
- EU Cyber Resilience Act (CRA) mandates supply chain transparency for software products
- Notation (by Microsoft/CNCF): alternative to Cosign for container signing, OCI-native

---

## Source: Permit.io - Policy as Code: OPA's Rego vs. Cedar (https://www.permit.io/blog/opa-vs-cedar)

- **OPA/Rego**: general-purpose policy engine; Rego is Datalog/Prolog derivative; steep learning curve; highly expressive but error-prone
- **Cedar**: AWS-developed declarative authorization language; more readable than Rego; strictly typed; designed for RBAC and ABAC
- Cedar is 42-60x faster than Rego in benchmarks
- Cedar provides formal verification capabilities
- OPA better for: multi-service architectures, infrastructure-wide policy enforcement, teams with existing Rego expertise
- Cedar better for: application authorization, readability-focused teams, AWS ecosystem alignment

---

## Source: Teleport/Doyensec - Security Benchmarking Authorization Policy Engines (2025) (https://goteleport.com/blog/benchmarking-policy-languages/)

- Dynamic evaluation framework (SPEF) developed to benchmark Rego, Cedar, OpenFGA, Teleport ACD
- Based on 2024 Trail of Bits threat model commissioned by AWS
- Results: **Rego** is expressive but error-prone, failing several tests due to runtime exceptions, non-determinism, and extensibility risks
- **Cedar** is safe and deterministic with strong validation and isolation, but less flexible for complex rules outside access control
- **OpenFGA** is simple and scalable for relationship-based models, not suited for complex logic
- **TeleportACD** performs reliably but lacks fine-grained policy semantics
- Security Policy Evaluation Framework (SPEF) is open-source: https://github.com/gravitational/policy-languages-framework

---

## Source: policyascode.dev - OPA vs Sentinel: Enterprise Policy as Code Comparison (2025) (https://policyascode.dev/guides/opa-vs-sentinel-enterprise/)

- **Sentinel**: purpose-built for HashiCorp workflows; first-class imports like tfplan/v2; shines in TFC/TFE
- **OPA**: universal engine for Kubernetes, APIs, infrastructure, bespoke JSON
- Sentinel enforcement modes: Advisory (warn), Soft Mandatory (override with permission), Hard Mandatory (no override)
- Sentinel not portable outside HashiCorp ecosystem; OPA is CNCF-graduated and vendor-neutral
- Choose Sentinel for pure Terraform Cloud/Enterprise shops; choose OPA for multi-tool, multi-cloud environments

---

## Source: HashiCorp - Sentinel Policy as Code (https://www.hashicorp.com/en/blog/sentinel-and-terraform-enterprise-policy-as-code)

- Sentinel adds a step between Terraform plan and apply for policy enforcement
- Pre-written Sentinel policies for AWS CIS benchmark available (GA 2025)
- Enforcement levels: Advisory, Soft Mandatory, Hard Mandatory
- GitHub repository with example policies: https://github.com/hashicorp/terraform-sentinel-policies
- Sentinel supports Terraform, Vault, Consul, Nomad

---

## Source: AWS - Cedar Policy Language (https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-api-access-authorization/cedar.html)

- Cedar policies have three components: effect (permit/forbid), scope (principal/action/resource), conditions (attribute-based)
- Written in Rust, executes in milliseconds; most operators constant time
- Secure-by-default: implicitly denies access unless explicit permit matches
- Cedar entering CNCF sandbox; seeking contributors for new language bindings
- Amazon Verified Permissions is the managed Cedar service on AWS

---

## Source: Palo Alto Unit42 - GitHub Actions Supply Chain Attack (CVE-2025-30066) (https://unit42.paloaltonetworks.com/github-actions-supply-chain-attack/)

- March 2025: tj-actions/changed-files compromised, affecting 23,000+ repositories
- Attackers injected payload dumping CI/CD runner memory, exposing secrets (access keys, PATs, npm tokens, RSA keys)
- Attack chain: compromised SpotBugs GitHub Action -> moved laterally to reviewdog -> compromised tj-actions
- Attack originated in November 2024 but discovered months later
- Coinbase was a specific target; 70,000 customers impacted
- `pull_request_target` trigger allows fork workflows to access secrets -- root cause of many PPE attacks

---

## Source: DarkReading - Supply Chain Attacks Targeting GitHub Actions Increased in 2025 (https://www.darkreading.com/application-security/supply-chain-attacks-targeting-github-actions-increased-in-2025)

- Third-party GitHub Actions run with the same permissions as your workflow -- massive attack surface
- Major 2024-2025 compromises: Ultralytics, Singularity, Shibaud/Shai-Hulud, tj-actions/changed-files
- Mitigations: pin all Actions to specific SHA commits, limit outbound network access on runners, scope environment variables tightly, reduce unnecessary permissions

---

## Source: StepSecurity - Top 2024 Predictions for CI/CD Security (https://www.stepsecurity.io/blog/top-2024-predictions-for-ci-cd-security)

- Model GitHub Actions/GitLab CI as "always-on RCE-as-a-Service platforms"
- Apply threat modeling to CI/CD pipelines
- Enforce least privilege on tokens and runners
- Separate untrusted PR evaluation from trusted release processes
- Tools: Legitify (detect misconfigurations), poutine (detect pipeline vulnerabilities), Harden-Runner (network egress filtering)

---

## Source: OWASP CI/CD Security Cheat Sheet (https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html)

- CI/CD pipelines are high-value targets: they have access to source code, secrets, and deployment credentials
- Key principles: supply chain security, auditability, version control of pipeline dependencies
- CI/CD variables are less secure than secrets management providers
- Use ephemeral runners; avoid self-hosted runners with persistent state
- Audit all pipeline configuration changes

---

## Source: BleepingComputer/HackerNews - GitLab Pipeline Execution Vulnerabilities (2024) (https://www.bleepingcomputer.com/news/security/gitlab-warns-of-critical-pipeline-execution-vulnerability/)

- **CVE-2024-9164** (CVSS 9.6): unauthorized users can trigger CI/CD pipelines on any branch
- **CVE-2024-6678** (CVSS 9.9): attacker can execute environment stop actions as the stop action job owner
- **CVE-2024-6385** (CVSS 9.6): trigger pipeline as another user under certain conditions
- Pattern: GitLab repeatedly finds critical pipeline execution vulnerabilities -- organizations must patch promptly and restrict pipeline triggers

---

## Source: SentinelOne - GitLab CI/CD Security: Risks & Best Practices (https://www.sentinelone.com/cybersecurity-101/cloud-security/gitlab-ci-cd-security/)

- 57% of respondents admit CI/CD pipelines not adequately secured
- Key risks: poisoned pipeline execution (PPE), secrets exposure, unauthorized pipeline triggers
- Best practices: use protected branches, restrict who can run pipelines, use merge request approvals, enable pipeline audit events

---

## Source: Snyk - Infrastructure as Code Security (https://snyk.io/product/infrastructure-as-code-security/)

- Scans Terraform, CloudFormation, Kubernetes, Helm, ARM templates
- Integrations: IDE (VS Code, IntelliJ), CLI, SCM, CI/CD
- Terraform plan scanning via Terraform Cloud run tasks
- Built-in rulesets backed by CIS benchmarks and Snyk threat-modeling research
- Can optionally block Terraform runs that introduce critical misconfigurations

---

## Source: Datadog - Key Learnings from the 2025 State of Cloud Security Study (https://www.datadoghq.com/blog/cloud-security-study-learnings-2025/)

- IaC templates contain misconfigurations in over 60% of reviewed deployments
- 23% of cloud security incidents in 2025 originate from misconfigured resources
- Over 80% of cloud security incidents result from human error, inconsistent policies, or poor change control
- Long-lived cloud credentials remain pervasive and risky
- Adoption of public access blocks in cloud storage is plateauing

---

## Source: DataStackHub - 50 Cloud Misconfiguration Statistics for 2025-2026 (https://www.datastackhub.com/insights/cloud-misconfiguration-statistics/)

- 82% of enterprises experienced security incidents due to cloud misconfigurations (Check Point 2024 Cloud Security Report)
- 31% of cloud security incidents resulted from misconfigurations
- CISA issued Binding Operational Directive 25-01 (Dec 2024) mandating federal agencies secure cloud environments through 2025

---

## Source: Prowler - Open Source Cloud Security Tool (https://github.com/prowler-cloud/prowler)

- Most widely used open-source cloud security platform
- Supports AWS, Azure, GCP, Microsoft 365, Kubernetes
- Hundreds of ready-to-use security checks with remediation guidance
- Compliance frameworks: CIS, NIST 800, NIST CSF, PCI-DSS, GDPR, HIPAA, SOC2, FedRAMP, ENS, AWS Well-Architected
- Written in Python using Boto3, Azure SDK, GCP API Client
- Agentless, scalable, fully automated
- Prowler App (web UI) for managing scans across accounts

---

## Source: Springer - Towards a Taxonomy of IaC Misconfigurations: An Ansible Study (SummerSOC 2024) (https://link.springer.com/chapter/10.1007/978-3-031-72578-4_5)

- Systematic analysis of 100 Ansible user manuals to compile catalog of 25 configuration errors
- Developed proof-of-concept tool for generating misconfiguration detection rules from user manuals
- Taxonomy assists practitioners and researchers in building misconfiguration detection tools
- Misconfigurations in IaC scripts hinder automation benefits, incur costs, and leave systems insecure

---

## Source: IEEE Xplore - Static Analysis of Infrastructure as Code: A Survey (2022) (https://ieeexplore.ieee.org/abstract/document/9779848)

- Comprehensive survey of static analysis techniques for IaC
- Covers code smells, security anti-patterns, defect detection
- Techniques applied to Ansible, Chef, Terraform, Puppet
- IaC scripts can contain defects resulting in security and reliability issues in deployed infrastructure

---

## Source: Springer - Vulnerabilities in Infrastructure as Code (2025) (https://link.springer.com/article/10.1007/s10664-025-10672-8)

- Analyzed over 1,600 repositories to identify IaC vulnerabilities using static security testing tools
- Explores what vulnerabilities exist, how many, and who introduces them
- Provides empirical data on the prevalence and distribution of IaC security issues

---

## Source: ArXiv - Security Smells in IaC Scripts: A Taxonomy (2025) (https://arxiv.org/pdf/2509.18761)

- Expanded taxonomy: 62 security smell categories (up from original 7 "Seven Sins")
- Covers seven IaC tools: Terraform, Ansible, Chef, Puppet, Pulumi, Saltstack, Vagrant
- Common smells: empty password, hard-coded secret, no integrity check, suspicious comment, unrestricted IP address, HTTP without SSL/TLS, weak cryptography
- Researchers implemented new checking rules in linters achieving 1.00 precision score
- Security smells persist for extended periods in GitHub projects due to inadequate detection tools

---

## Source: ResearchGate - The Seven Sins: Security Smells in Infrastructure as Code Scripts (https://www.researchgate.net/publication/335428832_The_Seven_Sins_Security_Smells_in_Infrastructure_as_Code_Scripts)

- Original "Seven Sins" paper identifying seven categories of security smells in IaC
- Categories: admin by default, empty password, hard-coded secret, invalid IP address binding, suspicious comment, use of HTTP without TLS, use of weak cryptography algorithm
- Foundational work that subsequent studies extended to more tools and more categories

---

## Source: ACM TOSEM - Security Smells in Ansible and Chef Scripts: A Replication Study (https://dl.acm.org/doi/10.1145/3408897)

- Replication study confirming security smells in Ansible (6 smells) and Chef (8 smells)
- Ansible: empty password, hard-coded secret, no integrity check, suspicious comment, unrestricted IP address, HTTP without SSL/TLS
- Chef: admin by default, hard-coded secret, no integrity check, suspicious comment, switch without default, unrestricted IP, HTTP without TLS, weak cryptography
- Validated that security smells are prevalent across IaC languages

---

## Source: GitHub - GLITCH: Technology-Agnostic IaC Code Smell Detection (https://github.com/sr-lab/GLITCH)

- Open-source framework for automated detection of code smells in IaC scripts
- Technology-agnostic: works across multiple IaC languages
- Implements detection rules from academic research on IaC security smells

---

## Source: Kepler Security - Complete Guide to Cloud Security Posture Management in 2025 (https://keplersec.com/blog/cloud-security-posture-2025/)

- CSPM continuously monitors and remediates security risks across cloud infrastructure
- Purpose-built for dynamic, distributed cloud environments (not traditional on-premises)
- Identifies misconfigurations, compliance violations, and security risks across AWS, Azure, GCP
- CSPM market: USD 2.21 billion in 2024, projected USD 7.02 billion by 2030 (CAGR 19.8%)
- Modern CSPM integrates with DevOps pipelines through policy-as-code and IaC scans

---

## Source: Security Boulevard - Cloud Security Posture Management in 2026 (https://securityboulevard.com/2026/03/cloud-security-posture-management-in-2026/)

- By 2026, CSPM evolved into AI-driven, context-aware pillar of CNAPP (Cloud-Native Application Protection Platform)
- Modern CSPM: "Security as Code," automated remediation across multi-cloud
- Integrates with SIEM/SOAR tools and threat intelligence
- Monitors misconfigurations in CI/CD pipeline to detect vulnerabilities pre-production

---

## Source: Checkmarx - IaC Security Best Practices (https://checkmarx.com/learn/iac-security/iac-security-best-practices-how-to-secure-infrastructure-as-code/)

- IaC security review checklist: encryption, access control, network segmentation, logging, secrets management
- Use standardized, pre-approved modules for common patterns
- Enforce naming and tagging policies
- Regular auditing and monitoring with drift detection
- Structured code review process with multiple reviewers

---

## Source: CyberSecurityNews - What is IaC Security? Best Practices Guide (2024) (https://cybersecuritynews.com/infrastructure-as-code-security/)

- 83% of organizations experienced at least one cloud security incident in 2024
- Static analysis examines IaC files without executing them using pattern matching and rule-based detection
- Runtime monitoring observes actual infrastructure behavior for anomaly detection
- Tools like Semgrep and SonarQube provide extensive rule libraries covering OWASP standards

---

## Source: Medium/Spacelift - DevSecOps in 2025: Shifting Security Left Without Slowing Down (https://medium.com/@jsocitblog/devsecops-in-2025-shifting-security-left-without-slowing-down-ae180ac49de5)

- 2025 DevSecOps evolving beyond "shift-left" to "shift everywhere" -- right tools at right pipeline stages
- IaC security scanning incorporated within CI/CD to detect issues before deploying infrastructure changes
- Automated security checks at every step; vulnerabilities flagged immediately and automatically
- Research shows gaps in sustained IaC investigation within DevSecOps literature

---

## Source: Coherence - 10 Steps to Secure IaC Workflow in 2024 (https://www.withcoherence.com/articles/10-steps-to-secure-iac-workflow-in-2024)

- Store all IaC in version control with mandatory code review
- Use static analysis tools to scan for misconfigurations
- Implement policy-as-code guardrails
- Automate security testing in CI/CD
- Monitor for configuration drift continuously
- Use separate environments (dev/staging/prod) with promotion gates

---

---

## Synthesis

### The IaC Security Tool Landscape

The IaC security scanning ecosystem has consolidated around a few key players. **Checkov** (Bridgecrew/Palo Alto Networks) leads in breadth with 1,000+ policies across 12+ IaC frameworks and graph-based cross-resource analysis. **KICS** (Checkmarx) offers the widest platform coverage (22+ platforms) with 2,400+ Rego queries and severity-mapped exit codes ideal for CI/CD gating. **Trivy** (Aqua Security) has absorbed tfsec and become the recommended replacement, combining IaC scanning with container vulnerability detection, SBOM generation, and secrets detection in a single tool. **Terrascan** (Tenable) provides maximum policy flexibility through native OPA/Rego support plus unique live infrastructure monitoring. **Snyk IaC** offers the best IDE integration and developer experience. The iacsecurity/tool-compare benchmark showed significant variation in detection rates (43-72% total catch rate), underscoring that no single tool catches everything -- organizations should consider running multiple tools or selecting based on their specific IaC stack.

### Terraform, CloudFormation, and Kubernetes Security Review Patterns

Across all three IaC formats, the same security anti-patterns recur: hardcoded secrets, overly permissive access controls, unencrypted data at rest/in transit, exposed network interfaces, and missing logging/monitoring. For **Terraform**, the critical concern is state file security -- state contains sensitive data and must use encrypted remote backends with locking, never committed to Git. Provider and module verification prevents supply chain attacks. For **CloudFormation**, cfn-nag (140+ rules) and CloudFormation Guard (Rust-based DSL) provide static scanning, while NoEcho parameters and Systems Manager integration protect secrets. For **Kubernetes**, the multi-layer approach is essential: Pod Security Standards (restricted level for production), RBAC with deny-by-default, default deny-all network policies, and admission controllers (OPA Gatekeeper or Kyverno) for runtime enforcement. The data is striking: RBAC reduces security incidents by 64%, but 71% of enterprises struggle to maintain correct configurations over time.

### Docker and Container Security

Container security requires a defense-in-depth approach across the entire lifecycle. The OWASP Docker Security Cheat Sheet provides 13 rules covering host security, daemon protection, user namespaces, capability dropping, resource limits, filesystem restrictions, and supply chain integrity. **Hadolint** is the standard Dockerfile linter, parsing into AST and using ShellCheck for embedded shell validation. Image scanning (Trivy, Snyk, Clair, Docker Scout) is considered "non-negotiable" for CI/CD. The supply chain dimension has become critical: software supply chain attacks increased 742% from 2019-2024, driving adoption of Cosign/Sigstore for image signing, SBOM generation with Syft, and regulatory mandates like the EU Cyber Resilience Act. Multi-stage builds, minimal base images (Alpine, distroless), pinned versions with SHA256 digests, and running as non-root are foundational Dockerfile practices.

### Policy-as-Code Engines

The policy-as-code landscape divides into three camps. **OPA/Rego** is the CNCF-graduated, vendor-neutral standard -- extremely expressive but with a steep learning curve and error-prone behavior (runtime exceptions, non-determinism found in Teleport/Doyensec benchmarks). **Cedar** (AWS) is 42-60x faster than Rego, more readable, formally verifiable, and deterministic, but newer and less widely adopted; entering CNCF sandbox. **Sentinel** (HashiCorp) is purpose-built for Terraform Cloud/Enterprise with pre-written CIS policies for AWS, but locked to the HashiCorp ecosystem. The 2025 Teleport SPEF benchmarks provide the most rigorous dynamic comparison to date, finding Cedar safest and Rego most expressive but error-prone. For IaC-specific policy enforcement, OPA (via Terrascan or Gatekeeper) and Sentinel (via TFC/TFE) are the primary options.

### CI/CD Pipeline Security

CI/CD pipelines have emerged as one of the highest-value attack surfaces. The March 2025 tj-actions/changed-files supply chain attack (CVE-2025-30066) compromised 23,000+ repositories and exposed secrets from Coinbase affecting 70,000 customers. GitLab suffered multiple CVSS 9.6-9.9 pipeline execution vulnerabilities in 2024. Key patterns: `pull_request_target` in GitHub Actions is inherently dangerous (gives fork PRs access to secrets); third-party Actions run with identical workflow permissions; 57% of organizations admit pipelines are inadequately secured. Mitigations: pin all Actions to SHA commits, use Harden-Runner for network egress filtering, separate untrusted PR evaluation from trusted release, apply least privilege to tokens/runners, and treat CI/CD as "always-on RCE-as-a-Service."

### Cloud Security Posture Management (CSPM) and Code Review Integration

CSPM has evolved from runtime-only monitoring to shift-left integration. Modern CSPM tools (Prowler, Wiz, Prisma Cloud, Microsoft Defender) scan IaC templates before deployment, catching the same issues they would find in production. IaC templates contain misconfigurations in over 60% of reviewed deployments (Datadog 2025). The market is growing rapidly (USD 2.21B in 2024, projected 7.02B by 2030). The convergence of CSPM with IaC scanning creates a "security as code" paradigm where misconfiguration prevention happens at the PR stage.

### Academic Research Findings

Academic work has established a rigorous foundation for IaC security. The "Seven Sins" paper identified foundational security smells (admin by default, empty password, hard-coded secret, invalid IP binding, suspicious comment, HTTP without TLS, weak cryptography). This was extended to 62 smell categories across 7 IaC tools (2025 taxonomy). The Springer SummerSOC 2024 paper created a 25-error taxonomy from Ansible user manuals with automated rule generation. Empirical analysis of 1,600+ repositories confirmed widespread IaC vulnerabilities. These smells persist for extended periods because detection tooling remains inadequate -- a clear opportunity for automated code review tools to address.

### Key Recommendations for IaC Security Review

1. **Run multiple scanners**: No single tool catches everything (43-72% detection rates). Layer Checkov + Trivy or KICS + Terrascan.
2. **Shift left aggressively**: Embed scanning in IDE (Snyk, Checkov VS Code), pre-commit hooks, and CI/CD pipelines.
3. **Enforce policy-as-code**: Use OPA/Gatekeeper for Kubernetes, Sentinel for Terraform Cloud, or Cedar for AWS-native authorization.
4. **Secure the pipeline itself**: Pin GitHub Actions to SHA, restrict `pull_request_target`, apply least-privilege tokens, use ephemeral runners.
5. **Protect secrets and state**: Never hardcode; use external secret managers; encrypt and lock remote Terraform state.
6. **Container defense-in-depth**: Lint Dockerfiles (Hadolint), scan images (Trivy), sign images (Cosign), generate SBOMs, run non-root.
7. **Kubernetes layered security**: Pod Security Standards (restricted), RBAC (deny-by-default), network policies (deny-all baseline), admission controllers.
8. **Monitor continuously**: Drift detection, runtime monitoring (Falco), CSPM for deployed infrastructure.
9. **Review IaC like application code**: Structured checklists covering encryption, access control, network exposure, logging, secrets, and compliance.
10. **Track academic research**: The expanding taxonomy of IaC security smells (now 62 categories) provides a systematic checklist for manual review.
