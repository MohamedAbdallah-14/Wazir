# AI Coding Tools: Requirement-to-Implementation Pipeline Comparison

## Tool-by-Tool Analysis

### 1. GitHub Copilot Workspace (sunset May 2025) → Spec Kit

**Pipeline: Issue → Spec → Plan → Implement → Verify**

The most explicit spec-plan-implement pipeline ever shipped:
1. **Topic Generation**: Issue → before/after success criteria
2. **Specification**: Current state + desired state (editable)
3. **Planning**: Files to modify + steps per file (editable)
4. **Implementation**: File-by-file generation + repair agent
5. **Brainstorm Agent**: Discuss alternatives before committing

Key insight: **downstream regeneration** — edit spec, all downstream steps regenerate.

Replaced by Copilot Coding Agent (more autonomous, lost explicit spec/plan editing). GitHub released Spec Kit to recreate the structured pipeline as a tool-agnostic framework.

### 2. Cursor

**Pipeline: Prompt → (optional Plan) → Agent Execution → Review**

- Plan Mode (Shift+Tab): Codebase research → plan.md → user edit → Build
- MoE model, 4x faster than similar intelligence models
- Up to 8 parallel agents via Git worktrees
- Planning is **opt-in**, not enforced
- Key limitation: long discussions consume context before implementation begins

### 3. Windsurf (Cascade)

**Pipeline: Prompt → Implicit Background Planning → Execution → Todo Tracking**

- Dual-agent: background planner + foreground executor (always-on, not opt-in)
- M-Query proprietary RAG for codebase retrieval
- Real-time awareness of all user actions
- Planning is **implicit** — no "approve the spec" step

### 4. Devin (Cognition)

**Pipeline: Task → Interactive Planning → Autonomous Execution → Self-Review → PR**

Compound AI system:
- **Planner** (high-reasoning model)
- **Coder** (specialized code-gen)
- **Critic** (adversarial reviewer)
- **Browser** (documentation scraping)

Performance: 67% PR merge rate. "Senior at understanding, junior at execution." 85% failure on complex/ambiguous tasks.

### 5. Codex CLI (OpenAI)

**Pipeline: Prompt → Agent Loop → Result**

- Single `shell` tool (deliberately minimal)
- Built-in `update_plan` tool for step tracking
- PLANS.md for multi-hour tasks
- Kernel-level sandboxing (Seatbelt/Landlock/seccomp)
- No enforced spec/plan step

### 6. Claude Code (Anthropic)

**Pipeline: (Optional Plan Mode) → Agent Loop → Result**

- Single-threaded master loop with real-time steering (h2A queue)
- TodoWrite for structured task tracking
- Plan Mode: read-only phase, structured plan output
- Sub-agents for parallel work
- Hooks (17 programmable events) for safety

### 7. Bolt.new / Lovable / v0

**Pipeline: Prompt → Code → Deploy**

No planning phase. "What makes these apps work isn't LLMs, but wrapping them in guardrails."

### 8. Amazon Kiro

**Pipeline: Requirements (EARS) → Technical Design → Tasks → Execute**

Most explicitly spec-driven tool after Copilot Workspace's sunset.

## The Explicit Planning Comparison

| Tool | Spec Phase | Plan Phase | Plan Editable | Verifies | Iterates |
|------|:---:|:---:|:---:|:---:|:---:|
| Copilot Workspace | Yes | Yes | Full edit | Yes | Downstream regen |
| Spec Kit | Yes (4 phases) | Yes (gated) | Yes | Yes | Yes |
| Kiro | Yes (EARS) | Yes | Yes | Yes (tests) | Yes |
| Cursor | No | Opt-in | Yes | Partial | Partial |
| Windsurf | No | Implicit | Via conversation | Partial | Yes |
| Devin | No | Yes (interactive) | Yes | Yes (Critic) | Yes |
| Claude Code | No | Opt-in | Yes | Yes (tests) | Yes |
| Codex CLI | No | Opt-in | Yes | Yes (sandbox) | Yes |
| Bolt/Lovable/v0 | No | No | No | Partial | Partial |

## Hard Data on Complex Tasks

- **METR 2025**: Experienced developers took **19% more time** with AI tools
- **Stack Overflow 2025**: Developer trust dropped to **29%** (from 40%)
- **CodeRabbit Dec 2025**: AI PRs have **1.7x more issues**: 75% more logic errors, 3x readability, 2.74x security
- **Multi-file accuracy**: 19.36% for distributed changes vs 87.2% for single-function
- **15-agent benchmark**: Same model (Opus 4.5) scored **17 problems apart** depending on agent harness

## Key Takeaway

**The scaffolding matters more than the model.** Structured workflows, context management, and enforcement produce better outcomes than raw model capability. This is Wazir's thesis validated by independent measurement.
