# 51 — Prompt Template Libraries and Prompt Management Systems

**Date:** 2026-03-25
**Scope:** Open-source prompt template libraries, prompt management platforms, prompt registries, curated prompt collections, academic research on prompt design patterns, prompt testing/evaluation frameworks, prompt versioning/A/B testing, template formats, and the relationship between prompt templates and seed content.

---

## 1. Open-Source Prompt Template Libraries

### 1.1 LangChain Prompt Templates and Hub

**URL:** https://github.com/hwchase17/langchain-hub
**Docs:** https://docs.langchain.com/langsmith/prompt-template-format
**LangChain Prompts Docs:** https://python.langchain.com/docs/concepts/prompt_templates/

- LangChain's `PromptTemplate` system is the most widely adopted prompt templating approach in production LLM applications
- Templates are structured around three elements: a **template string** (base text with `{variable}` placeholders), **input variables** (expected data types), and **values** (actual data at execution time)
- **LangChain Hub** (inspired by Hugging Face Hub) is a central registry for sharing and discovering prompts, chains, and agents
- Prompts on the hub are organized by use case with directory structure mirroring the use-case taxonomy
- Loading: `from langchain.prompts import load_prompt; prompt = load_prompt('lc://prompts/path/to/file.json')`
- Uploaded prompts expose a `PROMPT` variable that must be an instance of `BasePromptTemplate`
- **Template format support:** F-string syntax for simple prompts, **Mustache** for complex data structures and logic
- LangSmith (the hosted platform) adds prompt versioning, testing, and deployment with full awareness of chains, agents, and other LangChain constructs

### 1.2 Mirascope

**URL:** https://github.com/Mirascope/mirascope
**Blog:** https://mirascope.com/blog/prompt-management-system

- Self-described as "The LLM Anti-Framework" — a Python toolkit that turns regular functions into LLM API calls via a `@llm.call` decorator
- Two core primitives: `call` and `BasePrompt`
- Strong emphasis on **type safety** — proper Python type hints with a "Goldilocks API" balancing control and ergonomics
- Multi-provider: OpenAI, Anthropic, Google (Gemini/Vertex), Groq, xAI, Mistral, Cohere, LiteLLM, Azure AI, Amazon Bedrock
- **Lilypad** — a companion prompt management framework that versions and traces every prompt and LLM call automatically, keeping prompt edits in sync with the exact type-safe Python code

### 1.3 OpenPrompt (Academic)

**URL:** https://github.com/thunlp/OpenPrompt
**Paper:** https://ar5iv.labs.arxiv.org/html/2111.01998

- An academic open-source framework for **prompt-learning** built on PyTorch
- Core abstraction: a `PromptModel` contains a PLM (Pre-trained Language Model), one or more `Template` objects, and one or more `Verbalizer` objects
- **Templates** wrap original input with textual or soft-encoding templates; a custom **template language** supports token-level customization (shared embeddings, trainable tokens, post-processing)
- **Verbalizers** project original labels to a set of label words (e.g., negative -> "bad", positive -> "good, wonderful, great")
- Supports loading PLMs directly from Hugging Face Transformers
- Primarily relevant for NLP classification tasks via prompt-learning, not generative LLM prompt management

### 1.4 Latitude

**URL:** https://github.com/latitude-dev/latitude-llm
**Site:** https://latitude.so/

- Open-source agent engineering platform (LGPL-3.0 license; commercial license also available)
- **Prompt Manager** — create, version, and collaborate on prompts with an editor supporting variables, conditionals, and loops via **PromptL** (a dedicated LLM templating language)
- **Playground** — interactive testing with different inputs, parameters, and tool configurations
- **AI Gateway** — deploy prompts as API endpoints that auto-update with published changes
- **Datasets** — manage test data for batch evaluations and regression testing
- Designed for cross-functional teams: developers, PMs, and domain experts throughout the AI development process

### 1.5 PromptL

**URL:** https://promptl.ai/

- A dedicated **LLM Templating Language** (used by Latitude)
- Combines prompt, system prompt, model config, default options, schema, and fragments into a single reusable unit
- Designed specifically for the needs of LLM prompts rather than general-purpose templating

### 1.6 Repomix (Context Packing)

**URL:** https://github.com/yamadashy/repomix
**Prompt Examples:** https://repomix.com/guide/prompt-examples

- Packs entire repositories into a single AI-friendly file with token counts per file
- `--compress` option uses Tree-sitter to extract key code elements, reducing tokens while preserving structure
- Provides **standardized prompt templates** for common use cases: code review, refactoring, documentation generation, test generation
- Supports Model Context Protocol (MCP) for direct AI assistant integration
- Relevant as a **context preparation** tool that feeds into prompt templates

---

## 2. Prompt Management Platforms (Commercial/Hosted)

### 2.1 Braintrust

**URL:** https://www.braintrust.dev/articles/what-is-prompt-management
**Versioning:** https://www.braintrust.dev/articles/what-is-prompt-versioning

- Treats prompts as **versioned, first-class objects** with content-addressable version IDs
- Each version includes: prompt text, version ID, metadata (author, timestamp), change reason, linked model/parameters, evaluation results
- **Environment-based deployment:** dev -> staging -> production, with quality gates at each stage
- Prompt versions failing staging evaluation cannot be auto-promoted to production
- **Instant rollback** to previously validated versions without code changes
- Management via UI or programmatically with `braintrust push` / `braintrust pull`
- Links prompt changes -> evaluations -> promotion decisions -> production feedback in a closed loop

### 2.2 PromptLayer

**URL:** https://www.promptlayer.com/
**Docs:** https://docs.promptlayer.com/features/prompt-registry/release-labels
**GitHub:** https://github.com/MagnivOrg/prompt-layer-library

- Positions itself as **"Git for prompts"**
- **Prompt Registry** — a CMS for prompt templates and functions; teams edit, label, and release prompts to specific environments
- **Release Labels** — unique labels (e.g., "prod", "staging", "v2") to retrieve specific prompt versions at runtime
- **Dynamic Release Labels** for A/B testing — overload labels to route traffic to different versions based on percentages or user segments
- **Evaluation Pipelines** — automatic regression tests after creating new versions
- Decouples prompts from code through centralized registry; updates deploy without application redeployment
- Middleware approach for comprehensive tracking of prompt usage patterns and costs

### 2.3 Langfuse (Open Source)

**URL:** https://github.com/langfuse/langfuse
**Prompt Management:** https://langfuse.com/docs/prompt-management/overview
**A/B Testing:** https://langfuse.com/docs/prompt-management/features/a-b-testing

- Open-source LLM engineering platform (YC W23)
- **Prompt Management** — centralized versioning, version control, and collaborative iteration
- **Immutable versions** (1, 2, 3...) with **labels as pointers** to specific versions
- Labels serve triple duty: environments (staging, production), tenants (tenant-1, tenant-2), experiments (prod-a, prod-b)
- **A/B Testing** — label versions as `prod-a` and `prod-b`, application randomly alternates, Langfuse tracks latency, cost, token usage, evaluation metrics per version
- **Observability** — LLM-specific tracing: token usage, model parameters, prompt/completion pairs, evaluation scores
- Integrates with OpenTelemetry, LangChain, OpenAI SDK, LiteLLM
- **Self-hostable** — can be customized and deployed on your own infrastructure

### 2.4 LangSmith

**URL:** https://docs.langchain.com/langsmith/prompt-template-format

- Built by the creators of LangChain
- Integrated prompt management for teams using the LangChain ecosystem
- Prompt versioning, testing, and deployment with tight integration into chains, agents, and LangChain constructs
- Full awareness of the LLM application graph when managing prompts
- Template format support: F-string and Mustache

### 2.5 Maxim AI

**URL:** https://www.getmaxim.ai/
**Articles:** https://www.getmaxim.ai/articles/top-5-prompt-management-platforms-in-2025/

- End-to-end AI evaluation and observability infrastructure
- Cross-functional accessibility: non-technical stakeholders experiment through intuitive UI; engineers get SDKs in Python, TypeScript, Java, Go
- **Simulation engine** — test agents at scale across thousands of scenarios
- Prompt versioning with integrated evaluation and observability
- Comprehensive experimentation platform for prompt A/B testing

### 2.6 PromptHub

**URL:** https://www.prompthub.us/
**Blog:** https://www.prompthub.us/blog/prompt-patterns-what-they-are-and-16-you-should-know

- AI prompt management tool for teams building with LLMs
- **Git-style version control** — branch, commit, merge prompt changes like code
- **AI-powered optimization** — generates alternatives, adds reasoning chains, creates personas to improve output quality
- Compare prompt outputs across different AI models side-by-side
- REST API for runtime prompt retrieval
- CI/CD guardrails that block deployments of low-quality prompts
- Prompt chaining for multi-step workflows
- Community-driven: centralized repository for organizing, sharing, tagging, and searching prompts

### 2.7 Agenta (Open Source)

**URL:** https://github.com/Agenta-AI/agenta
**Site:** https://agenta.ai/

- Open-source LLMOps platform (MIT licensed): prompt playground, prompt management, LLM evaluation, LLM observability
- **Playground 2.0** — prompt engineering IDE: experiment, load traces/test sets, side-by-side testing
- **Evaluation** — LLM-as-a-judge, built-in evaluators, code evaluators; both human and automated feedback
- **Observability** — cost/performance tracking, LLM tracing, OpenTelemetry compatible
- Subject matter experts collaborate with developers without touching codebase
- Self-hostable, free tier on Agenta Cloud

### 2.8 MLflow Prompt Registry

**URL:** https://mlflow.org/prompt-registry
**Docs:** https://mlflow.org/docs/latest/genai/prompt-registry/

- Part of the MLflow open-source AI engineering platform
- **Git-inspired versioning** — commit-based versioning with side-by-side diff highlighting
- **Immutable versions** — once created, a prompt version cannot be modified
- **Aliases** — stage names (beta, staging, production) for environment isolation, A/B testing, rollbacks
- **Lineage tracking** — `mlflow.set_active_model()` auto-creates lineage between prompt versions and application versions
- **Prompt optimization** — automatically improve prompts using evaluation feedback and labeled datasets
- Integrates with MLflow's existing model tracking, evaluation, and experiment management

### 2.9 TrueFoundry

**URL:** https://www.truefoundry.com/prompt-management
**Blog:** https://www.truefoundry.com/blog/prompt-management-tools

- Prompt management as part of the broader AI infrastructure layer (not standalone)
- Prompts are first-class assets in the AI Gateway
- Multiple versions per template; teams iterate without overwriting each other
- Runtime resolution: prompt updates roll out independently of application deployments
- AI Gateway performance: ~3-4 ms latency, 350+ RPS on 1 vCPU, horizontal scaling

### 2.10 LaunchDarkly AI Configs

**URL:** https://launchdarkly.com/blog/prompt-versioning-and-management/
**Docs:** https://launchdarkly.com/docs/home/ai-configs/quickstart

- Brings **feature flag discipline** to prompt management
- Manage model configuration and messages outside application code
- Gradual rollout: upgrade model version then progressively release to customers
- **Completion mode** — multi-message chat-style prompts for single-step responses
- **Agent mode** — structured multi-step workflows with instructions
- Key insight: prompts are not deterministic like code — you need additional tooling to monitor outputs, track performance, and manage variability

---

## 3. Curated Prompt Collections (GitHub)

### 3.1 Awesome ChatGPT Prompts

**URL:** https://github.com/f/prompts.chat (f.k.a. Awesome ChatGPT Prompts)

- **143k+ GitHub stars** — the largest community-curated prompt collection
- Referenced by Harvard and Columbia
- Works across ChatGPT, Claude, Gemini, Llama, and any text-accepting model
- Free and open source; self-hostable for organizational privacy

### 3.2 Awesome Prompt Engineering

**URL:** https://github.com/promptslab/Awesome-Prompt-Engineering

- Hand-curated resources for prompt engineering covering papers, tools, models, APIs, benchmarks, courses, and communities
- Focus on GPT, ChatGPT, PaLM, and similar models

### 3.3 Awesome AI System Prompts

**URL:** https://github.com/dontriskit/awesome-ai-system-prompts

- Curated collection of system prompts for top AI tools
- Covers: ChatGPT, Claude, Perplexity, Manus, Claude-Code, Loveable, v0, Grok, Same.new, Windsurf, Notion, MetaAI

### 3.4 Awesome System Prompts (Coding Agents)

**URL:** https://github.com/EliFuzz/awesome-system-prompts

- System prompts and tool definitions from AI coding agents: Augment Code, Claude Code, Cluely, Cursor, Devin AI, Kiro, Perplexity, VSCode Agent, Gemini, Codex, OpenAI

### 3.5 Awesome-Awesome-Prompts (Meta-list)

**URL:** https://github.com/dukeluo/awesome-awesome-prompts

- An awesome list of awesome lists related to prompt engineering — the meta-index

### 3.6 Awesome Reviewers (Code Review Prompts)

**URL:** https://github.com/baz-scm/awesome-reviewers
**Blog:** https://baz.co/resources/from-review-thread-to-team-standard-how-we-built-awesomereviewers

- **8,000+ specialized review prompts** across major engineering ecosystems
- Each prompt distilled from **actual pull request comments** in leading open-source repositories
- Design principle: "Code reviews are a dataset. Use them."
- Extracts recurring feedback patterns (performance regressions, test coverage, type misuse) into formalized reviewer rules
- Integration with **Baz** platform for automated PR review, or copy-paste into VS Code, Cursor, Claude, or any AI agent
- **Highly relevant to Wazir** — demonstrates how to build a prompt catalog from real review data

### 3.7 Claude Code System Prompts

**URL:** https://github.com/Piebald-AI/claude-code-system-prompts

- All parts of Claude Code's system prompt: 18 builtin tool descriptions, sub-agent prompts (Plan/Explore/Task), utility prompts (CLAUDE.md, compact, statusline, magic docs, WebFetch, Bash, security review, agent creation)
- Updated for each Claude Code version (current: v2.1.81, March 2026)

---

## 4. Academic Research on Prompt Design Patterns

### 4.1 A Prompt Pattern Catalog (Vanderbilt, 2023)

**Paper:** https://arxiv.org/abs/2302.11382
**PDF:** https://www.dre.vanderbilt.edu/~schmidt/PDF/prompt-patterns.pdf
**Published:** ACM PLoP 2023 (30th Conference on Pattern Languages of Programs)

- **The seminal paper** on prompt design patterns — analogous to GoF software design patterns
- Defines prompt patterns as reusable solutions to common LLM interaction problems
- Introduces **fundamental contextual statements** — written descriptions of key ideas to communicate in a prompt
- **Six pattern categories:**
  1. **Input Semantics** — controlling how the model interprets input
  2. **Output Customization** — shaping the format and content of responses
  3. **Error Identification** — detecting and correcting mistakes
  4. **Prompt Improvement** — meta-patterns for refining prompts
  5. **Interaction** — managing multi-turn conversations
  6. **Context Control** — managing what information the model considers
- Authors: Jules White, Quchen Fu, Sam Hays, Michael Sandborn, Carlos Olea, Henry Gilbert, Ashraf Elnashar, Jesse Spencer-Smith, Douglas C. Schmidt

### 4.2 The Prompt Report: A Systematic Survey (2024)

**Paper:** https://arxiv.org/abs/2406.06608
**Interactive Site:** https://trigaten.github.io/Prompt_Survey_Site/

- **The most comprehensive survey on prompt engineering to date**
- 32 researchers from OpenAI, Google, Stanford, and other top institutions
- Analyzed 1,500+ academic papers on prompting
- Establishes: 33 vocabulary terms, **58 LLM prompting techniques**, 40 techniques for other modalities
- 58 text-based techniques grouped into **6 problem-solving categories**
- Includes meta-analysis of the entire literature on natural language prefix-prompting
- Best practices and guidelines for prompting state-of-the-art LLMs

### 4.3 The Prompt Canvas (2024)

**Paper:** https://arxiv.org/abs/2412.05127

- A structured framework from literature review using design-based research
- Consolidates diverse, fragmented prompt engineering techniques into an accessible, practical tool
- Identifies **7 key skills** for prompt engineering: Creativity, Clarity/Precision, Adaptability, Critical Thinking, Empathy, Cognitive Flexibility, Goal Orientation
- Modular structure: practitioners customize techniques for specific tasks/domains
- Designed as a learning resource for education and workforce training

### 4.4 Cataloging Prompt Patterns (Vanderbilt, Position Paper)

**PDF:** https://www.dre.vanderbilt.edu/~schmidt/PDF/ADA_Europe_Position_Paper.pdf

- Companion paper to the Prompt Pattern Catalog
- Argues for treating prompt patterns with the same rigor as software patterns
- Proposes expanding the catalog with domain-specific patterns

### 4.5 Comprehensive Taxonomy of Prompt Engineering Techniques (2025)

**Paper:** https://link.springer.com/article/10.1007/s11704-025-50058-z

- Published in Frontiers of Computer Science (Springer)
- Provides a comprehensive taxonomy of prompt engineering techniques for LLMs

### 4.6 PromptHub's 16 Prompt Patterns

**URL:** https://www.prompthub.us/blog/prompt-patterns-what-they-are-and-16-you-should-know

- Practitioner-oriented guide covering 16 key prompt patterns derived from the Vanderbilt catalog
- Includes: Persona, Audience, Template, Fact Check List, Tail Generation, Menu Actions, Outline Expansion, Cognitive Verifier, Flipped Interaction, Reflection, Refusal Breaker, Context Manager, Recipe, Alternative Approaches, Game Play, Infinite Generation

---

## 5. Prompt Testing and Evaluation Frameworks

### 5.1 Promptfoo

**URL:** https://github.com/promptfoo/promptfoo
**Docs:** https://www.promptfoo.dev/docs/intro/

- Open-source (MIT), CLI + library for evaluating and red-teaming LLM apps
- **Acquired by OpenAI** (March 16, 2026)
- YAML-based configuration: define prompts with `{{variable}}` placeholders, providers, test cases, and assertions
- Supports **60+ providers** including OpenAI, Anthropic, Google
- Red teaming/pentesting/vulnerability scanning for AI
- Compare performance across GPT, Claude, Gemini, Llama simultaneously
- CI/CD integration via command line
- `promptfoo init` — interactive CLI setup; `promptfoo eval setup` — browser-based setup
- `promptfoo validate` — validate configuration files
- Example YAML structure:
  ```yaml
  prompts:
    - 'Convert the following English text to {{language}}: {{input}}'
  providers:
    - openai:gpt-4
    - anthropic:claude-3-opus
  tests:
    - vars:
        language: French
        input: "Hello world"
      assert:
        - type: contains
          value: "Bonjour"
  ```

### 5.2 DeepEval

**URL:** https://github.com/confident-ai/deepeval
**Docs:** https://deepeval.com/docs/getting-started

- Open-source LLM evaluation framework — **"Pytest for LLM apps"**
- 50+ LLM-evaluated metrics, most research-backed, all multi-modal
- Metrics include: G-Eval, task completion, answer relevancy, hallucination, faithfulness, etc.
- Uses LLM-as-a-judge and NLP models that run locally
- Supports: RAG, agents, chatbots; both end-to-end and component-level evaluation
- Python unit test style: define test case + metric, use `assert_test()` to execute
- CI/CD integration via Pytest integration
- Test case structure: `input` (mandatory), `actual_output` (mandatory), `expected_output` (optional)
- Python >= 3.9 required

### 5.3 Google LLM-Evalkit

**URL:** https://cloud.google.com/blog/products/ai-machine-learning/introducing-llm-evalkit

- Lightweight evaluation framework built on Vertex AI SDKs
- Centralizes and streamlines prompt engineering
- Objective metrics tracking and iterative improvement

### 5.4 Microsoft GenAIOps Promptflow Template

**URL:** https://github.com/microsoft/genaiops-promptflow-template

- GenAIOps template for building LLM-infused apps using Prompt Flow
- Features: centralized code hosting, lifecycle management, variant/hyperparameter experimentation, A/B deployment, reporting
- Supports GitHub, Azure DevOps, and Jenkins CI/CD
- CI pipeline runs experimentation and evaluation flows in sequence, registers flows in Azure ML Registry
- Supports pure Python evaluation via `promptflow-evals` package

---

## 6. Prompt Versioning and A/B Testing

### 6.1 Core Principles of Prompt Versioning

**URL:** https://www.braintrust.dev/articles/what-is-prompt-versioning

- Prompts are code, yet too many teams treat them as configuration files
- Every modification requires evaluation before production deployment
- **Regression testing** — automated LLM evaluation across hundreds of test cases
- **Comparative analysis** — generate outputs from both current and proposed versions on identical inputs
- Each version records: prompt text, version ID, author/timestamp metadata, change reason, model/parameters, evaluation results

### 6.2 A/B Testing Approaches

**Langfuse:** https://langfuse.com/docs/prompt-management/features/a-b-testing
**PromptLayer:** https://docs.promptlayer.com/why-promptlayer/ab-releases
**Braintrust:** https://www.braintrust.dev/articles/ab-testing-llm-prompts
**Maxim AI:** https://www.getmaxim.ai/articles/how-to-perform-a-b-testing-with-prompts-a-comprehensive-guide-for-ai-teams/

- A/B testing runs controlled experiments comparing prompt versions with real user traffic
- Key metrics: task completion rates, user satisfaction, downstream conversion, response latency, cost, token usage
- **Langfuse approach:** Label versions as `prod-a` and `prod-b`; application randomly alternates; Langfuse tracks metrics per version
- **PromptLayer approach:** Dynamic release labels route traffic based on percentages or user segments
- **Braintrust approach:** Content-addressable versions with environment-based promotion gates
- **Trace-level analysis** — drill into individual request traces to diagnose prompt failures

### 6.3 Staged Deployment Pattern

**URL:** https://launchdarkly.com/blog/prompt-versioning-and-management/

- Deploy different versions to dev, staging, production environments
- Test changes in staging before promoting to production
- Roll back to last known good version when issues arise
- Application code loads correct version automatically based on environment context
- Mirrors software deployment best practices

### 6.4 Documentation and Governance

- Each version includes metadata: author, timestamp, change reason, linked model, parameters, evaluation results
- Essential for compliance in regulated industries (finance, healthcare)
- Every change — including temperature tweaks — must be logged

---

## 7. Prompt Organization for Different Review Types

### 7.1 Structured Review Templates

**URL:** https://graphite.com/guides/effective-prompt-engineering-ai-code-reviews
**URL:** https://medium.com/data-science-collective/youre-using-ai-to-write-code-you-re-not-using-it-to-review-code-728e5ec2576e

- Graphite's recommended template structure:
  - **Role definition:** "You are a senior software engineer reviewing a pull request"
  - **Context:** language, framework, style guide details
  - **Specific instructions:** numbered checklist of what to look for
  - **Output format:** "For each issue, explain why it matters and suggest a concrete fix with code snippet"

- **Five review dimensions** commonly used as separate prompt templates:
  1. **Bug Detection** — logic errors, off-by-one, null handling, race conditions
  2. **Security Review** — injection risks, auth issues, data exposure, input validation
  3. **Performance Analysis** — N+1 queries, unnecessary loops, memory leaks, caching
  4. **Maintainability** — naming, complexity, duplication
  5. **Edge Cases** — boundary conditions, error scenarios, unusual inputs

### 7.2 Security-Specific Review Prompts

**URL:** https://crashoverride.com/blog/prompting-llm-security-reviews
**URL:** https://deepwiki.com/anthropics/claude-code-security-review/4.1-prompt-engineering-and-templates

- Security review templates focus on: vulnerability identification, common anti-patterns, error handling, input validation, dependency security
- Include specific examples and remediation steps
- OWASP-aligned categories for comprehensive coverage

### 7.3 Performance-Specific Review Prompts

- Performance templates cover: bottleneck identification, resource utilization, algorithmic efficiency, caching strategies
- Include specific optimization recommendations with code examples

### 7.4 Awesome Reviewers as Organizational Model

**URL:** https://github.com/baz-scm/awesome-reviewers

- Demonstrates organizing review prompts by **engineering ecosystem** (language/framework)
- Each prompt distilled from thousands of real review comments
- Checklist-style instructions — clear, actionable rules for the AI reviewer
- Key design: formalize recurring feedback patterns into reusable reviewer rules

### 7.5 Folder/Tag Organization Pattern

**URL:** https://promptdrive.ai/how-to-organize-ai-prompt-workflows/

- Structured folders mirroring team workflow: broad categories broken into specific tasks
- Clear file naming conventions
- Tagging for cross-cutting concerns (e.g., a "security" tag on prompts across different review types)
- Standardized templates with variables (tone, length, audience, focus area)

---

## 8. Template Formats Comparison

### 8.1 Jinja2

**URL:** https://learn.microsoft.com/en-us/semantic-kernel/concepts/prompts/jinja2-prompt-templates
**GitHub:** https://github.com/theroyallab/llm-prompt-templates

- Expressions: `{{ ... }}` for variables, `{% ... %}` for control structures
- Full-featured: template inheritance, macros, filters, loops, conditionals
- Python-native (Flask, Django ecosystem)
- Used by: TabbyAPI, Aphrodite Engine, HuggingFace `apply_chat_template`, Semantic Kernel
- **Best for:** Complex prompts requiring logic, inheritance, or conditional sections

### 8.2 Mustache

**URL:** https://stackshare.io/stackups/jinja-vs-mustache

- Logic-less template syntax: `{{ variable }}`, `{{# section }}...{{/ section }}`
- Simpler syntax, limited features
- Language-agnostic — implementations in virtually every programming language
- **Best for:** Simple prompts where portability matters more than logic

### 8.3 Handlebars

- Extension of Mustache with custom helpers and block helpers
- Double curly braces `{{ }}` like Mustache/Jinja
- Primarily JavaScript ecosystem
- **Best for:** JavaScript/TypeScript applications needing more than Mustache but less than Jinja2

### 8.4 PromptL

**URL:** https://promptl.ai/

- Purpose-built LLM templating language (used by Latitude)
- Combines prompt + system prompt + model config + schema + fragments in one unit
- **Best for:** LLM-specific needs where general-purpose templating is insufficient

### 8.5 Liquid Templates

**URL:** https://datawizz.ai/blog/leveling-up-prompt-management-with-liquid-templates

- Advanced prompt management with Liquid templates
- Popular in the Shopify ecosystem, gaining adoption for LLM prompt management
- Good balance between logic capabilities and simplicity

---

## 9. PromptOps: Treating Prompts as Infrastructure

### 9.1 The PromptOps Movement

**URL:** https://testrigor.com/blog/why-devops-needs-a-promptops-layer/
**URL:** https://dev.to/astronaut27/prompt-management-is-infrastructure-requirements-tools-and-patterns-32nn
**URL:** https://www.v2solutions.com/blogs/promptops-for-engineering-leaders/

- **PromptOps** — the systemic handling of prompts as operational assets
- Version control with history, diffs, and approvals (treating prompts as code)
- Automated testing ensuring prompts deliver intended outcomes
- Observability for monitoring performance and detecting drift
- Same rigor as infrastructure-as-code or CI/CD pipelines

### 9.2 Two Fundamental Patterns (Hamilton/DAGWorks)

**URL:** https://blog.dagworks.io/p/llmops-production-prompt-engineering
**URL:** https://towardsdatascience.com/llmops-production-prompt-engineering-patterns-with-hamilton-5c3a20178ad2/

- **Pattern 1: Prompts as Dynamic Runtime Variables** — external system passes prompts to dataflows, or pulls from DB at runtime
- **Pattern 2: Prompts as Code** — encode prompts directly in code; operationally simpler; immutable per deployment
- Hamilton (DAG framework) recommendation: treat prompts as code for production unless speed-to-change is critical
- Hamilton's `@config.when` and module switching enables versioned prompt selection
- Key: determine what prompt was used for any given invocation (observability)

### 9.3 Required Capabilities for Production Prompt Management

**URL:** https://dev.to/astronaut27/prompt-management-is-infrastructure-requirements-tools-and-patterns-32nn
**URL:** https://www.truefoundry.com/blog/why-production-ai-needs-dedicated-prompt-management

1. **Version control** — tracking every change with who, when, and why metadata
2. **Environment separation** — different prompts for dev, staging, production
3. **Runtime retrieval** — fetching correct version at inference time
4. **Rollback capability** — quick recovery when changes cause issues
5. **Performance tracking** — correlating prompt versions with quality metrics
6. **Access control** — managing who can modify production prompts
7. **Feedback loops** — capturing actual performance and logging gaps for revision

### 9.4 Production Agents Reference Prompts by ID

- In production-ready setups, agents do not embed prompt text directly
- Instead, they reference prompts by identifier (similar to tool/model references)
- This enables decoupled deployment, versioning, and runtime resolution

---

## 10. Context Engineering and the Prompt-Seed Content Relationship

### 10.1 Context Engineering vs. Prompt Engineering

**URL:** https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
**URL:** https://www.promptingguide.ai/guides/context-engineering-guide
**URL:** https://www.elastic.co/search-labs/blog/context-engineering-vs-prompt-engineering

- **Prompt engineering** is what you do *inside* the context window
- **Context engineering** is how you decide *what fills* the window
- Prompt engineering is a **subset** of context engineering
- Context engineering optimizes the information provided in the LLM's finite context window

### 10.2 Anthropic's Context Engineering Best Practices

**URL:** https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

- Key insight: "Claude is already smart enough — intelligence is not the bottleneck, context is"
- **Six context layers:** system rules, memory, retrieved docs, tool schemas, recent conversation, current task
- Keep each layer small and on-purpose — only include what helps the current request
- Use diverse, representative examples (not exhaustive lists)
- Include both good and bad examples to clarify behavior boundaries
- System prompts: extremely clear, simple, direct language at the right altitude

### 10.3 Three Facets of Context (LangChain Model)

- **Instructional context** — prompts or guidance provided (the template itself)
- **Knowledge context** — domain information or facts, often via retrieval (seed content, RAG results)
- **Tool context** — information from the model's environment via tools or API calls
- A robust LLM application needs all three

### 10.4 Prompt Templates and Seed Content Relationship

**URL:** https://medium.com/@WilllliamZhou/prompt-engineering-101-a-system-level-view-062e378d4664

- A well-constructed prompt template has four sections:
  1. **Instructions** — define the model's response/behavior (the template structure)
  2. **Context** — additional information, sometimes with examples (the seed content)
  3. **User Input** — the actual question or input
  4. **Output Indicator** — marks the beginning of the model's response
- **Seed content is the "context" section** of a prompt template — the domain-specific knowledge, examples, and reference material that grounds the model's response
- Templates define *structure and behavior*; seed content provides *knowledge and grounding*
- At regular intervals, have the model summarize accomplishments and current state; use summaries as seeds for fresh context in new sessions

### 10.5 Context Rot and Window Management

- **Context rot:** as token count increases, recall accuracy decreases (needle-in-a-haystack research)
- Three failure modes: too little (hallucination), too much (attention overwhelm), wrong content (irrelevance)
- n-squared attention relationships stretch the model's budget thin
- Good context engineering = **smallest possible set of high-signal tokens** that maximize desired outcome

---

## 11. Synthesis and Key Takeaways

### Landscape Summary

The prompt management ecosystem has matured significantly by 2025-2026, splitting into distinct categories:

| Category | Key Players | Open Source? |
|---|---|---|
| Template Libraries | LangChain, Mirascope, OpenPrompt, PromptL | Yes |
| Management Platforms | Langfuse, Agenta, MLflow | Yes |
| Management Platforms | Braintrust, PromptLayer, LangSmith, Maxim | No (hosted) |
| Feature Flag Integration | LaunchDarkly AI Configs | No |
| Testing/Evaluation | Promptfoo, DeepEval, MS Promptflow | Yes |
| Prompt Collections | Awesome Reviewers, Awesome ChatGPT Prompts | Yes |
| Context Packing | Repomix | Yes |

### Key Design Patterns Emerging

1. **Prompts as Versioned Assets** — every platform now treats prompts with version control, metadata, and audit trails; the debate is whether to store them in code (Hamilton pattern) or in a separate registry (PromptLayer pattern)

2. **Environment-Based Promotion** — dev -> staging -> production with quality gates mirrors software deployment; Braintrust, Langfuse, PromptLayer, and MLflow all implement this

3. **Label-Based Routing** — using labels/aliases to point at specific prompt versions enables A/B testing, canary releases, and instant rollback without code changes

4. **Evaluation-Gated Deployment** — prompt changes trigger evaluations; only versions passing quality thresholds can be promoted; DeepEval and Promptfoo enable this in CI/CD

5. **Review-Type Specialization** — the most effective code review systems use separate, focused prompts for each review dimension (security, performance, bugs, style) rather than one monolithic prompt; Awesome Reviewers and Graphite both demonstrate this

6. **Prompt Patterns as Software Patterns** — the Vanderbilt catalog establishes that prompt engineering has its own pattern language analogous to GoF design patterns, with six categories and growing

7. **Context Engineering > Prompt Engineering** — Anthropic's framing elevates the conversation: the template is necessary but not sufficient; what fills the context window (seed content, retrieved docs, tool output) matters as much as the instructions

### Implications for Wazir

1. **Review prompt organization** — adopt the Awesome Reviewers model: separate prompts per review type (security, performance, style, architecture), each distilled from real review patterns, stored as versioned assets

2. **Template format** — Mustache is the pragmatic choice for a polyglot system (already in use per Wazir's mustache template work); Jinja2 if more logic is needed

3. **Versioning** — treat prompts as code in the repo (Hamilton Pattern 2) for simplicity; consider a lightweight registry pattern if non-developers need to iterate on prompts

4. **Seed content architecture** — clearly separate template structure (instructions, format, persona) from seed content (domain knowledge, examples, reference material); the template defines *behavior*, seed content provides *grounding*

5. **Evaluation integration** — adopt Promptfoo or DeepEval-style YAML-driven evaluation to test prompt changes before they ship; integrate into CI/CD

6. **Context budgeting** — apply Anthropic's six-layer model (system rules, memory, retrieved docs, tool schemas, conversation, task) to manage context window allocation; minimize each layer to high-signal tokens only

---

## Sources

### Platforms and Tools
- [Braintrust — Prompt Management](https://www.braintrust.dev/articles/what-is-prompt-management)
- [Braintrust — Prompt Versioning](https://www.braintrust.dev/articles/what-is-prompt-versioning)
- [Braintrust — A/B Testing LLM Prompts](https://www.braintrust.dev/articles/ab-testing-llm-prompts)
- [Braintrust — Best Prompt Management Tools 2026](https://www.braintrust.dev/articles/best-prompt-management-tools-2026)
- [PromptLayer](https://www.promptlayer.com/)
- [PromptLayer — Release Labels](https://docs.promptlayer.com/features/prompt-registry/release-labels)
- [PromptLayer — A/B Releases](https://docs.promptlayer.com/why-promptlayer/ab-releases)
- [Langfuse — Prompt Management](https://langfuse.com/docs/prompt-management/overview)
- [Langfuse — A/B Testing](https://langfuse.com/docs/prompt-management/features/a-b-testing)
- [Langfuse GitHub](https://github.com/langfuse/langfuse)
- [LangSmith — Prompt Template Format](https://docs.langchain.com/langsmith/prompt-template-format)
- [LangChain Hub](https://github.com/hwchase17/langchain-hub)
- [LangChain Prompt Templates](https://python.langchain.com/docs/concepts/prompt_templates/)
- [Agenta GitHub](https://github.com/Agenta-AI/agenta)
- [Agenta — Top Open-Source Prompt Management Platforms 2026](https://agenta.ai/blog/top-open-source-prompt-management-platforms)
- [MLflow — Prompt Registry](https://mlflow.org/prompt-registry)
- [MLflow — Prompt Management](https://mlflow.org/docs/latest/prompts)
- [Maxim AI](https://www.getmaxim.ai/)
- [Maxim AI — Top 5 Prompt Management Platforms 2025](https://www.getmaxim.ai/articles/top-5-prompt-management-platforms-in-2025/)
- [Maxim AI — Prompt Versioning Best Practices](https://www.getmaxim.ai/articles/prompt-versioning-best-practices-for-ai-engineering-teams/)
- [Maxim AI — A/B Testing Guide](https://www.getmaxim.ai/articles/how-to-perform-a-b-testing-with-prompts-a-comprehensive-guide-for-ai-teams/)
- [PromptHub](https://www.prompthub.us/)
- [TrueFoundry — Prompt Management](https://www.truefoundry.com/prompt-management)
- [TrueFoundry — Prompt Management Tools](https://www.truefoundry.com/blog/prompt-management-tools)
- [LaunchDarkly — Prompt Versioning & Management](https://launchdarkly.com/blog/prompt-versioning-and-management/)
- [LaunchDarkly — AI Configs Quickstart](https://launchdarkly.com/docs/home/ai-configs/quickstart)
- [Mirascope GitHub](https://github.com/Mirascope/mirascope)
- [Mirascope — Prompt Management System](https://mirascope.com/blog/prompt-management-system)
- [Latitude GitHub](https://github.com/latitude-dev/latitude-llm)
- [Latitude — Collaborative Prompt Engineering](https://latitude.so/blog/collaborative-prompt-engineering-best-tools-and-methods)
- [PromptL](https://promptl.ai/)

### Testing and Evaluation
- [Promptfoo GitHub](https://github.com/promptfoo/promptfoo)
- [Promptfoo Docs](https://www.promptfoo.dev/docs/intro/)
- [Promptfoo — Configuration Guide](https://www.promptfoo.dev/docs/configuration/guide/)
- [DeepEval GitHub](https://github.com/confident-ai/deepeval)
- [DeepEval Docs](https://deepeval.com/docs/getting-started)
- [DeepEval — Unit Testing in CI/CD](https://deepeval.com/docs/evaluation-unit-testing-in-ci-cd)
- [Google LLM-Evalkit](https://cloud.google.com/blog/products/ai-machine-learning/introducing-llm-evalkit)
- [Microsoft GenAIOps Promptflow Template](https://github.com/microsoft/genaiops-promptflow-template)
- [Mirascope — Prompt Testing Frameworks 2025](https://mirascope.com/blog/prompt-testing-framework)

### Curated Collections
- [Awesome ChatGPT Prompts](https://github.com/f/prompts.chat)
- [Awesome Prompt Engineering](https://github.com/promptslab/Awesome-Prompt-Engineering)
- [Awesome AI System Prompts](https://github.com/dontriskit/awesome-ai-system-prompts)
- [Awesome System Prompts (Coding Agents)](https://github.com/EliFuzz/awesome-system-prompts)
- [Awesome-Awesome-Prompts](https://github.com/dukeluo/awesome-awesome-prompts)
- [Awesome Reviewers](https://github.com/baz-scm/awesome-reviewers)
- [Claude Code System Prompts](https://github.com/Piebald-AI/claude-code-system-prompts)

### Academic Papers
- [A Prompt Pattern Catalog (Vanderbilt, 2023)](https://arxiv.org/abs/2302.11382)
- [Cataloging Prompt Patterns (Vanderbilt, Position Paper)](https://www.dre.vanderbilt.edu/~schmidt/PDF/ADA_Europe_Position_Paper.pdf)
- [The Prompt Report: Systematic Survey (2024)](https://arxiv.org/abs/2406.06608)
- [The Prompt Canvas (2024)](https://arxiv.org/abs/2412.05127)
- [Comprehensive Taxonomy of Prompt Engineering (2025)](https://link.springer.com/article/10.1007/s11704-025-50058-z)
- [OpenPrompt Framework Paper](https://ar5iv.labs.arxiv.org/html/2111.01998)
- [From Prompts to Templates: Systematic Analysis for Real-world LLM Apps](https://arxiv.org/html/2504.02052v2)

### Architecture and Best Practices
- [Anthropic — Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Prompting Guide — Context Engineering Guide](https://www.promptingguide.ai/guides/context-engineering-guide)
- [Hamilton — LLMOps Production Prompt Engineering Patterns](https://blog.dagworks.io/p/llmops-production-prompt-engineering)
- [PromptOps: Why DevOps Needs a PromptOps Layer](https://testrigor.com/blog/why-devops-needs-a-promptops-layer/)
- [Prompt Management Is Infrastructure (DEV Community)](https://dev.to/astronaut27/prompt-management-is-infrastructure-requirements-tools-and-patterns-32nn)
- [PromptOps: Why Prompts Break Production](https://www.v2solutions.com/blogs/promptops-for-engineering-leaders/)
- [Prompt Versioning: The Missing DevOps Layer](https://dasroot.net/posts/2026/02/prompt-versioning-devops-ai-driven-operations/)
- [Graphite — Effective Prompt Engineering for AI Code Reviews](https://graphite.com/guides/effective-prompt-engineering-ai-code-reviews)
- [Repomix — Prompt Examples](https://repomix.com/guide/prompt-examples)
- [PromptHub — 16 Prompt Patterns](https://www.prompthub.us/blog/prompt-patterns-what-they-are-and-16-you-should-know)
- [Claude API — Prompt Templates and Variables](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompt-templates-and-variables)
- [Datawizz — Liquid Templates for Prompt Management](https://datawizz.ai/blog/leveling-up-prompt-management-with-liquid-templates)
- [Jinja2 Prompt Templates (Microsoft Semantic Kernel)](https://learn.microsoft.com/en-us/semantic-kernel/concepts/prompts/jinja2-prompt-templates)
- [LLM Prompt Templates (Jinja2)](https://github.com/theroyallab/llm-prompt-templates)
- [ZenML — Prompt Engineering Management in Production](https://www.zenml.io/blog/prompt-engineering-management-in-production-practical-lessons-from-the-llmops-database)
- [Prompt Engineering Architecture: System Design](https://medium.com/@WilllliamZhou/prompt-engineering-101-a-system-level-view-062e378d4664)
