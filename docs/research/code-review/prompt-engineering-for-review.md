# Prompt Engineering for Code Review and Code Analysis

**Research Date**: 2026-03-25
**Topic**: Prompt engineering techniques for LLM-powered code review and code analysis
**Sources surveyed**: Academic papers, practitioner blogs, AI tool builder documentation, open-source projects

---

## Source 1: CrashOverride — How to Prompt LLMs for Better, Faster Security Reviews

**URL**: https://crashoverride.com/blog/prompting-llm-security-reviews
**Author**: Mark Curphey (October 2025)

- Prompt engineering is just good requirements engineering. The same discipline that makes a decent software engineer makes a decent prompter.
- A good prompt needs five things:
  1. **Persona**: Tell the LLM what role it is playing. "You are a senior software engineer" or "You are a code reviewer focused on maintainability." Be specific about expertise — "a backend engineer with expertise in distributed systems" yields more targeted analysis than "a developer."
  2. **Context**: What are you analyzing? What language, frameworks, environment, constraints? If reviewing code, state what the code does.
  3. **Examples (few-shot)**: Show the model what good looks like. Include 3-5 examples of input-output pairs. This is "the most powerful technique" — without examples you are hoping the model guesses; with them you are showing exactly what you expect.
  4. **Specific instructions**: Not "make this better" but "refactor this function to improve readability by extracting complex conditionals into named helper functions." Not "review this code" but "identify potential race conditions in this concurrent code."
  5. **Output format**: Be explicit — JSON for CI/CD integration, Markdown for human reports, structured sections for decision-making.
- Structured JSON output example for security review:
  ```json
  {
    "risk_level": "SAFE | SUSPICIOUS | MALICIOUS",
    "confidence": "high | medium | low",
    "indicators": [...],
    "recommendation": "specific action to take"
  }
  ```
- Providing an example of the exact format you want is more effective than describing the format. Show a perfectly formatted output and the model will mimic that structure.
- Prompt chaining: break complex analysis into sequential steps — first identify all entry points, then analyze each for vulnerabilities, then prioritize findings.
- Good prompts are like good requirements: specific, testable, and clear about what success looks like.

---

## Source 2: Graphite — Effective Prompt Engineering for AI Code Reviews

**URL**: https://graphite.com/guides/effective-prompt-engineering-ai-code-reviews
**Author**: Greg Foster

- Five reasons prompting matters for code review:
  1. **Context sensitivity** — review depends on project understanding, module interactions, patterns, and performance trade-offs. Prompts that give context let AI give tailored feedback.
  2. **Precision vs. noise trade-off** — vague prompts ("review this code") yield generic suggestions. Explicit class-of-issue requests (logic, edge cases, security) reduce false positives.
  3. **Explainability** — good prompts push the AI to say not just what is wrong but why and how to fix it.
  4. **Alignment with team norms** — prompts that embed or reference style guides, performance constraints, and coding standards help the AI align.
  5. **Efficiency** — better prompts reduce back-and-forth, cut review cycles, and catch bugs earlier.
- Generic code review template:
  ```
  You are a senior software engineer reviewing a pull request.
  Language: {lang}, framework: {framework}.
  The project has style guidelines: {style_guide_details}.
  Please review the following code and identify:
  1. Logic bugs or incorrect behavior
  2. Missing edge cases or error handling
  3. Performance or resource inefficiencies
  4. Security or input validation concerns
  5. Style or naming issues
  For each issue, explain why it matters and suggest a concrete fix with code snippet.
  If trade-offs exist, mention them.
  ```
- Key best practices:
  - Create templates for repetitive tasks (code review, refactoring) for consistent output.
  - Continuously refine prompts based on effectiveness.
  - Build a prompt library of successful templates shared across the team.

---

## Source 3: Martin Fowler / Xu Hao — An Example of LLM Prompting for Programming

**URL**: https://martinfowler.com/articles/2023-chatgpt-xu-hao.html
**Author**: Martin Fowler, Xu Hao (April 2023)

- Xu Hao's approach combines two key techniques:
  1. **Chain-of-thought prompting** — primes the LLM with an implementation strategy. The initial prompt describes the architecture (MVVM), tech stack (TypeScript, React, Redux, konvajs), and testing strategy (vitest, cypress). It lists concrete implementation patterns: shared view model as Redux store slice, local view model as component state, hooks as view helpers with `createSelector`/`useSelector`.
  2. **General knowledge prompting** — asks for an implementation plan rather than code. Once the plan is produced, it is used to refine the implementation and generate useful sections of code.
- The prompt structure is deeply architectural:
  - System description and tech stack
  - Architecture pattern (MVVM with two types of view model)
  - Common implementation strategies enumerated as numbered rules
  - Testing patterns specified per layer (vitest for model/viewmodel, cypress for view)
  - Style rules embedded (e.g., "use `describe` instead of `test`", "data-driven tests are preferred")
- Key insight: ask the LLM to produce a plan first, review it, then use the plan as scaffolding for code generation. This two-phase approach produces significantly better results than asking for code directly.
- Context-stuffing the prompt with architectural decisions and patterns effectively constrains the LLM to produce code that fits the existing codebase.

---

## Source 4: Pornprasit & Tantithamthavorn — Fine-Tuning and Prompt Engineering for LLM-based Code Review Automation (Academic Paper)

**URL**: https://arxiv.org/abs/2402.00905
**Published**: February 2024 (IST journal submission)

- Investigated 12 variations of two LLMs (GPT-3.5 and Magicoder) using fine-tuning, zero-shot, few-shot, and persona prompting for code review automation.
- Key findings:
  - **Fine-tuned GPT-3.5 with zero-shot** achieves 73.17%-74.23% higher exact match (EM) than baseline approaches.
  - **Without fine-tuning, few-shot learning achieves 46.38%-659.09% higher EM** than zero-shot learning. Few-shot is dramatically better for non-fine-tuned models.
  - **Persona prompting did not help** for code review automation when combined with few-shot. Recommendation: use few-shot learning without a persona for cold-start scenarios.
- When data is insufficient for fine-tuning (cold-start problem), few-shot learning without persona is the recommended approach.
- Demonstration examples for few-shot should be selected from training data that is similar to the target review task.

---

## Source 5: Aider — Unified Diffs Make GPT-4 Turbo 3X Less Lazy

**URL**: https://aider.chat/docs/unified-diffs.html
**Author**: Paul Gauthier

- Unified diff format dramatically improves GPT-4 Turbo's code editing performance: baseline 20% with SEARCH/REPLACE blocks, raised to 61% with unified diffs.
- Laziness (outputting comments like "...add logic here...") reduced by 3X with unified diffs.
- Key design principles for LLM-friendly diff formats:
  1. **Choose a format GPT is already familiar with** — unified diffs are well-represented in training data.
  2. **Use a simple format** that avoids escaping, syntactic overhead, and brittle specifiers.
  3. **Drop line numbers** from hunk headers — focus on diffs of semantically coherent chunks. LLMs often generate incorrect hunk header line numbers while the modified lines are correct.
  4. **When applying LLM-generated diffs**: ignore hunk header positions, parse each hunk, search for surrounding context lines in the source, then apply insertions/deletions relative to that anchor point.
- With unified diffs, the LLM acts more like it is writing textual data for a program, not talking to a person. This encourages rigor and reduces lazy placeholder comments.
- "Emotional appeal" folk remedies (saying the user is blind, offering tips, etc.) produced worse benchmark scores, not better.
- Explored many alternatives: function/tool calling, line-number-based formats, other diff-like formats. Unified diffs outperformed all by a wide margin.

---

## Source 6: Onix React — Ultimate Prompts for Every Developer

**URL**: https://medium.com/@onix_react/ultimate-prompts-for-every-developer-031a6d26a569
**Author**: Onix React (November 2025)

- Treats prompts as part of the codebase: structured, explicit, and contextual.
- **Multi-Persona Code Review** pattern — simulates a review panel with three perspectives:
  1. **Security specialist**: Identify vulnerabilities, injection risks, authentication issues, OWASP Top 10 concerns.
  2. **Performance engineer**: Highlight inefficient patterns, memory leaks, bottlenecks. Suggest better data structures or algorithms.
  3. **Maintainability expert**: Point out unclear naming, complex logic, architectural concerns. Suggest how to make code easier to test and extend.
- Each persona provides: concrete issues, suggested improvements, and short rationale for each change.
- Context block included in the prompt: tech stack, runtime, and known constraints (e.g., "cannot introduce new dependencies").
- **Refactoring and Optimization Framework**: Turns the LLM into a dedicated code surgeon focused on clarity and performance without behavioral changes.
- Key structural element: always include a `CONTEXT` section and a `CODE` section in review prompts.

---

## Source 7: Addy Osmani — The Prompt Engineering Playbook for Programmers

**URL**: https://addyo.substack.com/p/the-prompt-engineering-playbook-for
**Author**: Addy Osmani (May 2025)

- AI pair programmers are powerful but not magical — they have no prior knowledge of your project, your team's conventions, or your system's unique requirements.
- **Refactoring prompt patterns**:
  - State refactoring goals explicitly. "Refactor this code" is too open-ended. Specify: readability? Reduce complexity? Optimize performance? Different paradigm?
  - Enumerate specific issues: "Issues I'd like to address: 1) [performance issue], 2) [code duplication], 3) [outdated API usage]."
  - The AI needs a target — stating performance goals leads to algorithm/caching changes; stating readability goals leads to function decomposition.
- **Context is everything**: include project architecture, tech stack, dependencies, and constraints. The depth and quality of context directly correlates with relevance and accuracy of output.
- **Test cases in prompts**: including explicit test cases is one of the most effective ways to clarify expectations — they provide concrete inputs/outputs and eliminate ambiguity about edge cases.
- **Prompt chaining for large codebases**: break complex tasks into smaller, sequential prompts to overcome token limits and maintain coherence.
- **Directory structure and dependencies**: analyze and include where new functionality should be implemented, considering dependency relationships and module boundaries.
- **Formatting**: use Markdown triple backticks for code, consistent delimiters for input/output examples. Consistency helps the model parse intent.

---

## Source 8: Ajit Singh — Building a Code Review Assistant with LLMs

**URL**: https://singhajit.com/building-code-review-assistant-with-llms/
**Author**: Ajit Singh (2026)

- Architecture for a code review assistant: fetch PR diffs, send to LLM with structured prompt, parse structured output, post comments to PR.
- **System prompt design**: clearly define the bot's persona, purpose, and rules. Include links to style guides, examples of good and bad code, and desired tone.
- **Structured JSON output**: instruct the LLM to return feedback as JSON so scripts can reliably extract comments and post them to correct lines. Example:
  ```json
  [
    {
      "file": "src/auth.js",
      "line": 42,
      "severity": "high",
      "issue": "SQL injection vulnerability",
      "suggestion": "Use parameterized queries",
      "confidence": 0.9
    }
  ]
  ```
- **Confidence scoring**: include confidence scores as a tuning dial. Start with 0.7 threshold, adjust based on false positive rate.
- **Explicit exclusions (DO NOT section)**: without them, LLMs comment on formatting and naming, which is almost always noise. Explicitly say what not to flag.
- Most LLM code reviews are polite and useless. Structured prompts force actionable output where every finding includes severity, location, and a concrete fix.

---

## Source 9: Jose Casanova — Simple Claude Code Review Prompt

**URL**: https://www.josecasanova.com/blog/claude-code-review-prompt
**Author**: Jose Casanova (August 2025, updated March 2026)

- Default AI code review prompts are too verbose and nit-picky — every review feels like a laundry list of style suggestions.
- Minimalist prompt that cuts noise dramatically:
  ```
  Please analyze the changes in this PR and focus on identifying critical issues related to:
  - Potential bugs or issues
  - Performance
  - Security
  - Correctness

  If critical issues are found, list them in a few short bullet points.
  If no critical issues are found, provide a simple approval.
  Sign off with a checkbox emoji: (approved) or (issues found).

  Keep your response concise. Only highlight critical issues that must be addressed before merging.
  Skip detailed style or minor suggestions unless they impact performance, security, or correctness.
  ```
- Deployed as a GitHub Action using `anthropics/claude-code-action@beta` with `direct_prompt`.
- Key lesson: explicitly telling the LLM what NOT to do (skip style, skip minor suggestions) is as important as telling it what to do.
- Human review still has the last word — AI catches issues before a human even looks.

---

## Source 10: Diffray — LLM Hallucinations Pose Serious Risks for AI Code Review

**URL**: https://diffray.ai/blog/llm-hallucinations-code-review/
**Published**: December 2025

- 29-45% of AI-generated code contains security vulnerabilities; 19.7% of package recommendations are fabricated (non-existent libraries).
- **The trust erosion cycle**: developer receives AI comment about "critical issue" -> investigates (15-30 min) -> realizes it is a hallucination -> after 3-5 incidents, stops trusting the tool and ignores all comments including valid ones.
- **Layered defense architecture** for prompt-based mitigation:
  1. **Input layer**: Traditional static analysis for high-precision definite issues.
  2. **Retrieval layer**: RAG with code context, documentation, and static analysis results (60-80% hallucination reduction).
  3. **Generation layer**: LLMs with chain-of-thought prompting and structured output formats.
  4. **Verification layer**: Multi-agent cross-validation or self-verification for high-stakes suggestions.
  5. **Output layer**: Guardrails and deterministic validation before surfacing to developers.
- Combined mitigations achieve up to 96% hallucination reduction.
- **Prompt engineering for hallucination mitigation**:
  - Chain-of-thought (CoT) prompting significantly reduces hallucinations in prompt-sensitive scenarios.
  - ICE method: Instructions (specific asks) + Constraints (boundaries like "only from retrieved docs") + Escalation (fallback: "Say 'I don't know' if unsure").
  - Lower temperature (0.1-0.2) makes output more deterministic and less hallucinatory.
- Validation phase: after agents generate findings, a validation agent cross-checks each issue against actual codebase context before surfacing to developers.

---

## Source 11: CodeRabbit — Context Engineering: Level Up Your AI Code Reviews

**URL**: https://www.coderabbit.ai/blog/context-engineering-ai-code-reviews
**Author**: Sahil Mohan Bansal (July 2025)

- CodeRabbit packs a **1:1 ratio of code-to-context** in LLM prompts — equal weight of surrounding context for every line of code under review.
- Context sources: Jira tickets, code graph, past PRs, learnings from chat conversations, linter output.
- **Context engineering pipeline**:
  1. **PR and Issue Indexing** — link PRs to their originating issues for intent understanding.
  2. **Code Graph Analysis** — understand file dependencies and module boundaries.
  3. **Custom Review Instructions** — path-based instructions using glob patterns (deterministic, kick in when patterns match).
  4. **Linters and Static Analyzers** — feed linter output as context to the LLM.
  5. **Web Query** — fetch relevant documentation and API references.
  6. **Verification Scripts** — run scripts to validate findings before surfacing.
- **Path-based instructions**: custom review instructions that only apply to files matching provided glob patterns. Different parts of the codebase get different review criteria.
- Prompt packaging: once raw info is gathered, CodeRabbit optimizes how the prompt is packaged and adjusts review depth based on file complexity and importance.
- Key principle: the LLM should never be reviewing code in a vacuum. Surround every code change with as much relevant context as possible.

---

## Source 12: Baz SCM — Awesome Reviewers (Open-Source System Prompts)

**URL**: https://github.com/baz-scm/awesome-reviewers
**Repository**: 630+ commits, 117 stars

- Collection of over 8,000 ready-to-use system prompts for agentic code review, distilled from actual pull request comments.
- Organized by engineering ecosystem and review focus area (security, performance, style, architecture).
- Each prompt is grounded in real code review scenarios, ensuring practical, actionable advice.
- Provides a template structure for building specialized reviewers with consistent quality.
- Demonstrates the value of building a prompt library: reusable, tested, and evolved over time from real-world usage.

---

## Source 13: Santana Junior et al. — Which Prompting Technique Should I Use? (Academic Paper)

**URL**: https://arxiv.org/abs/2506.05614
**Published**: June 2025

- Systematic evaluation of **14 established prompt techniques** across **10 SE tasks** using **4 LLM models**.
- Prompting techniques span six core dimensions: Zero-Shot, Few-Shot, Thought Generation, Ensembling, Self-Criticism, and Decomposition.
- Tasks evaluated: code generation, bug fixing, code-oriented question answering, among others.
- Key findings:
  - **Thought generation** (chain-of-thought) techniques are most effective for SE tasks requiring complex logic and intensive reasoning.
  - **Few-shot** and example-driven techniques are most effective for tasks relying on contextual understanding and pattern matching.
  - **Self-criticism** techniques (where the LLM reviews its own output) provide an additional quality improvement layer.
  - **Decomposition** (breaking tasks into subtasks) helps with complex multi-step analysis.
- Reports time and token consumption for each technique per task and model — practical guidance for selecting optimal technique given cost constraints.
- Correlation analysis between linguistic characteristics of prompts and effectiveness — certain prompt structures consistently outperform others regardless of model.

---

## Source 14: Repomix — Prompt Examples for Code Review

**URL**: https://repomix.com/guide/prompt-examples

- Provides structured prompt templates for different review types:
  - **Architecture Review**: Evaluate structure, patterns, architectural issues, scalability improvements, best-practice adherence.
  - **Security Review**: Identify vulnerabilities, check anti-patterns, review error handling and input validation, assess dependency security.
  - **Performance Review**: Identify bottlenecks, check resource utilization, review algorithmic efficiency, assess caching strategies.
  - **Code Quality**: Review naming conventions, code organization, error handling, commenting practices.
- Tips for better results:
  - Be specific: include clear objectives and evaluation criteria.
  - Set context: specify your role and expectations.
  - Define scope: focus on specific aspects per review pass.
  - Request actionable output: ask for specific examples and remediation steps.
- Token management: Repomix provides token counts per file so you can strategically select which parts of the codebase to submit within context limits.

---

## Source 15: Dev.to — Prompt Engineering for Developers: Patterns That Actually Work

**URL**: https://dev.to/chengyixu/prompt-engineering-for-developers-patterns-that-actually-work-5bgf
**Author**: Chengyi Xu

- Mental model: think of a prompt as a function signature with explicit contract.
  ```javascript
  // Bad: unclear contract
  const output = await claude("help me with my code");

  // Good: explicit contract
  const output = await claude({
    task: "Review this function for security vulnerabilities",
    input: { code: functionBody, language: "javascript" },
    format: "JSON array of {severity, description, line, fix}",
    constraints: ["Only flag real issues, not style preferences"]
  });
  ```
- 12 concrete patterns for production prompt engineering, including:
  - **Structured input/output contracts**: define exactly what goes in and what comes out.
  - **Constraint specification**: explicitly state what to include AND what to exclude.
  - **Test harness for prompts**: measure which prompts work with repeatable evaluation.
  - **Cost/quality tradeoffs**: different patterns have different token costs and accuracy profiles.
- Key insight: treat prompts as code — version them, test them, refactor them, review them.

---

## Source 16: DextraLabs — AI Driven Code Reviews: Prompt Strategies for Better Code

**URL**: https://dextralabs.com/blog/ai-driven-code-reviews-prompts/
**Author**: Kunal Singh (January 2026)

- **Core principles of high-quality AI prompts for code review**:
  1. **Clarity and Scope**: define exactly what to review and what to ignore.
  2. **Role-specific evaluation**: assign the model a specific role (senior architect, security expert).
  3. **Context-aware feedback**: include project standards, language, and framework.
  4. **Actionable output**: every finding should include severity, location, and a concrete fix.
- Prompt-based review vs. generic AI: produces context-aware feedback tailored to project standards, supports security-focused instructions beyond surface-level formatting, enables role-specific evaluation.
- The model should be explicitly told to behave like a senior architect or a security expert to get the corresponding depth of analysis.
- Building reliable systems: prompts should be integrated seamlessly with real-world workflows (CI/CD, PR pipelines).

---

## Source 17: Docker/Dev.to — How to Get Automatic Code Review Using LLM Before Committing

**URL**: https://dev.to/docker/how-to-get-automatic-code-review-using-llm-before-committing-3nkj

- Uses Code Llama in Docker containers for local, pre-commit code review.
- Challenges in traditional code review that AI prompting addresses:
  - Lack of consistency across reviewers.
  - Time-consuming manual review that delays CI/CD.
  - Knowledge and expertise gaps in specific technologies.
- Integration pattern: git pre-commit hook fetches staged diffs, sends to local LLM with review prompt, blocks commit if critical issues found.
- Key prompt design for pre-commit: focus on critical issues only (bugs, security, correctness), skip style and minor issues to avoid blocking developer flow.
- Demonstrates that prompt design must account for the integration point — pre-commit prompts need to be fast and high-signal; PR review prompts can be more comprehensive.

---

---

# Synthesis

## Core Principles of Effective Code Review Prompts

### 1. Structure prompts like function signatures

The most effective code review prompts have explicit contracts: persona, context, input specification, output format, and constraints. Think of prompts as typed function calls, not natural language requests. The Dev.to patterns article captures this well: treat prompts as code that should be versioned, tested, and refactored.

### 2. The five essential components (PCESO)

Across all sources, five components recur:
- **Persona**: Assign a specific expert role (security specialist, performance engineer, senior architect). Academic research (Source 4) found persona helps in some scenarios but not all — test whether it improves your specific use case.
- **Context**: Include tech stack, architecture patterns, project conventions, module boundaries, and file dependencies. CodeRabbit's 1:1 code-to-context ratio is a strong guideline.
- **Examples (few-shot)**: Provide 3-5 input-output pairs showing what good review output looks like. Academic evidence (Source 4) shows few-shot achieves 46-659% improvement over zero-shot for non-fine-tuned models. Diminishing returns after 2-3 examples.
- **Specific instructions**: Enumerate exactly what to check (logic bugs, edge cases, security, performance) and what to skip (formatting, naming unless impacting correctness).
- **Output format**: Define structured output (JSON for automation, Markdown for humans). Include confidence scores as a tuning dial (start at 0.7 threshold).

### 3. Multi-persona review is high-value

The multi-persona pattern (Source 6) — security specialist + performance engineer + maintainability expert reviewing the same code — consistently produces more thorough reviews than single-perspective prompts. Each perspective catches different classes of issues.

### 4. Chain-of-thought for complex analysis

For tasks requiring reasoning about control flow, concurrency, or architecture, chain-of-thought prompting dramatically improves results (Source 13). The two-phase approach (Source 3) — ask for a plan first, then generate code/analysis — is particularly effective. CoT also reduces hallucinations (Source 10).

### 5. Explicit exclusions matter as much as inclusions

Without a "DO NOT" section, LLMs default to commenting on formatting, naming, and style, which is almost always noise (Source 8). Telling the LLM what to skip (Source 9: "Skip detailed style or minor suggestions") is as important as telling it what to find.

### 6. Unified diff format is optimal for code changes

Aider's research (Source 5) is definitive: unified diffs reduce laziness by 3X, outperform all other formats (function calling, line-number-based, SEARCH/REPLACE blocks). Key rules: drop line numbers from hunk headers, focus on semantically coherent chunks, match context lines rather than relying on header positions. "Emotional appeal" prompts (tipping, claiming disability) make results worse, not better.

### 7. Hallucination mitigation requires a layered approach

No single technique eliminates hallucinations (Source 10). The most effective mitigation combines: static analysis for the input layer (high precision), RAG with code context (60-80% reduction), CoT + structured output at generation (Sources 10, 13), multi-agent cross-validation for verification, and deterministic guardrails for output. Combined: up to 96% reduction.

### 8. Context engineering > prompt engineering

CodeRabbit's approach (Source 11) signals the field's evolution from "prompt engineering" to "context engineering." It is not just about how you phrase the question — it is about what information you surround the question with. PR intent (from Jira tickets), code graph dependencies, past PR patterns, linter output, and custom per-path instructions all feed into the prompt. The LLM should never review code in a vacuum.

### 9. Prompt libraries are a team asset

Multiple sources (Sources 2, 7, 12, 14) recommend building and maintaining a prompt library — reusable, tested templates organized by review type (security, performance, architecture, code quality). Baz SCM's 8,000+ prompts (Source 12) demonstrate this at scale. Prompts should be versioned and refined over time, just like code.

### 10. Integration point determines prompt design

Pre-commit hooks need fast, high-signal prompts focused on critical issues only (Source 17). PR review prompts can be more comprehensive and multi-faceted. GitHub Action prompts need structured output for posting inline comments (Source 8, 9). The context of where the review runs shapes what the prompt should ask for.

## Recommended Prompt Architecture for Wazir

Based on this research, a production code review prompt should follow this structure:

```
SYSTEM:
You are a {role} reviewing code changes in a {language}/{framework} project.
Project architecture: {architecture_summary}
Style guide: {style_guide_ref}
Known constraints: {constraints}

DO NOT comment on: {exclusion_list}
Output format: {format_spec with example}
Confidence threshold: only report findings with confidence >= {threshold}

USER:
## Code Context
{file_dependencies}
{related_module_summaries}
{PR_description_or_intent}

## Changes (unified diff, no line numbers in hunk headers)
{unified_diff}

## Review Focus
{specific_review_checklist}

Analyze step by step. For each finding, provide:
- File and location
- Severity (critical/high/medium/low)
- Issue description
- Why it matters
- Concrete fix with code
- Confidence score
```

This architecture combines the strongest patterns from all 17 sources: persona assignment, rich context injection, unified diff format, explicit exclusions, structured output, confidence scoring, and chain-of-thought reasoning.
