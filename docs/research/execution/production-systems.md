# Multi-Agent AI Coding Systems in Production (2024-2026)

## Research Summary

How real-world systems execute code changes. Architecture, parallelism, verification, failure handling, production metrics.

## Key Findings

### Three Parallelism Models
1. **Fleet**: identical agents on different repos (Devin, Jules)
2. **Worktree**: multiple agents on same repo (Cursor, Augment, Claude Code)
3. **Pipeline**: specialized agents in sequence (Amazon Q, Aider)

### Systems Analyzed (20)

**Devin**: 67% PR merge rate, 4x faster YoY, fleet parallelism in cloud VMs. "Senior at codebase understanding, junior at execution."

**Augment Code (Intent)**: Coordinator-Implementor-Verifier pattern. Living spec, worktree isolation. BYOA (Bring Your Own Agent).

**Cursor 2.0**: Up to 8 parallel agents in worktrees. Per-model tuning. Plan mode saves to `.cursor/plans/`.

**Amazon Q**: Memory/Critic/Debugger agents. Intelligent backtracking, inter-iteration memory.

**Google Jules**: Async, Gemini 2.5 Pro, cloud VM per task. "As models improved, need for intricate scaffolding diminished."

**Google Antigravity**: Multi-agent (plan, code, test, browse), Manager View dashboard, "Artifacts" as verifiable deliverables.

**Replit Agent**: Manager + Editor + Verifier agents. Custom Python DSL for tools (not function calling -- 90% success). Scope isolation: "more exposure = more incorrect choices."

**OpenHands**: Event-sourced state, Docker sandbox, 72% SWE-bench Verified. MIT licensed.

**Mini-SWE-agent**: 100 lines of Python, >74% SWE-bench. No tools other than bash. "Minimal scaffolding outperforms heavy frameworks with capable models."

**Agentless**: No agent loop. Three-phase linear pipeline. 32% SWE-bench Lite at $0.70.

**Aider**: Architect/Editor pattern. R1 + Sonnet = 64.0% at 14x less cost.

**Codex**: codex-1 (o3 optimized). Rust workspace. Sandbox: Seatbelt/Bubblewrap/Landlock. Prompt caching by design.

**Claude Code Teams**: Teammates communicate directly. Shared task list with dependencies. File locking. 100K-line compiler across ~2,000 sessions.

### The Scaffolding Debate
| Camp | Evidence | Systems |
|------|----------|---------|
| Heavy | Specialized agents, role isolation, formal specs | Augment, Replit, Amazon Q |
| Minimal | 100 lines = 74%, models internalize logic | mini-SWE-agent, Jules |

Both deliver production results. Trend line favors simplification as models improve. BUT: 67.3% of AI PRs rejected (LinearB) -- quality still matters.

### Verification Hierarchy (Ascending Sophistication)
1. No scaffold (mini-SWE-agent: LM internalizes) -- 74%
2. Linear validation (Agentless: generate + rank) -- 32% Lite
3. Test loop (most: edit -> build -> test -> fix -> repeat)
4. Multi-agent verification (Augment: Verifier, Amazon Q: Critic + rollback)
5. Confidence scoring (Devin: predictive merge probability)

### Failure Rates
- 41-87% across 7 SOTA open-source multi-agent systems
- 67.3% AI PRs rejected vs 15.6% manual (LinearB)
- 99% per-step across 10 steps = 90.4% overall
- Anthropic: naive multi-agent -35%, proper architecture +90.2%

### Market (Early 2026)
- 51%+ of committed code AI-generated or substantially AI-assisted (GitHub)
- Rakuten: 12.5M-line codebase task in 7 hours, 99.9% accuracy
- Zapier: 89% AI adoption, 800+ internal agents

## Sources
- Devin: https://cognition.ai/blog/devin-annual-performance-review-2025
- Augment Intent: https://www.augmentcode.com/blog/intent-a-workspace-for-agent-orchestration
- Cursor: https://cursor.com/blog/agent-best-practices
- Amazon Q: https://aws.amazon.com/blogs/devops/dissecting-the-performance-gains-in-amazon-q-developer-agent-for-code-transformation/
- Jules: https://blog.google/innovation-and-ai/models-and-research/google-labs/jules/
- Replit: https://www.langchain.com/breakoutagents/replit
- OpenHands: https://arxiv.org/abs/2407.16741
- Mini-SWE-agent: https://github.com/SWE-agent/mini-swe-agent
- Codex: https://openai.com/index/unrolling-the-codex-agent-loop/
- Claude Code Teams: https://code.claude.com/docs/en/agent-teams
- Kiro: https://kiro.dev/
