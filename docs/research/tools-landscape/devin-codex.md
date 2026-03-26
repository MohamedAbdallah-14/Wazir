# Devin + Codex Agent — Deep Research

## Devin (Cognition Labs)

### Architecture
- Full VM per instance (shell, editor, browser). Not a copilot — fully autonomous.
- Hybrid models: proprietary SWE-1.5 + Claude Sonnet 4.5 foundation
- Anti-multi-agent stance: "Don't Build Multi-Agents" (context sharing > agent fragmentation)
- Auto-indexing repos every few hours, generates wikis + architecture diagrams

### Planning
- Explicit Interactive Planning: scan codebase → suggest plan → human review → execute
- Confidence scoring (highly predictive of success — green = 2x merge rate)
- Dynamic re-planning on roadblocks (Devin 3.0)

### Performance
- SWE-bench: 13.86% (early 2024, unassisted)
- PR merge rate: 67% (up from 34%)
- Answer.AI test: 3 successes, 14 failures, 3 inconclusive / 20 tasks (15%)
- Best at: clear requirements, verifiable outcomes, 4-8hr junior-engineer scope
- Worst at: ambiguity, mid-task requirement changes, unfamiliar tools

### Context Management
- "Context anxiety": Sonnet 4.5 rushes to finish near context limits
- Fix: 1M beta enabled, capped at 200K (model thinks it has runway)
- Model's self-summaries "not comprehensive enough" — Cognition's own compaction better
- Reminders at start AND end of prompt

### Pricing
- $20/month + $2.25/ACU. 1 ACU ≈ 15 min. 1 hour ≈ $8-9.

## OpenAI Codex

### Architecture
- Cloud (isolated container per task) + CLI (open-source, local) + VS Code extension
- Models: codex-1 (o3-based) → GPT-5-Codex → GPT-5.3-Codex → GPT-5.4 (1M context)
- Single shell tool + update_plan + web_search + MCP tools
- Kernel-level sandboxing (Seatbelt macOS, seccomp+landlock Linux)

### Planning
- Built-in `update_plan` tool, dedicated plan mode
- PLANS.md: persistent markdown enabling 7+ hour single-prompt tasks
- AGENTS.md: repo-level standing instructions (model trained to follow closely)

### Verification
- Plan → implement → validate → repair cycle at each milestone
- Runs tests, lint, typecheck. Cites terminal logs as evidence.
- AGENTS.md encodes repo-specific "verified" definition

### Context Management
- `/responses/compact` endpoint with encrypted opaque content
- PLANS.md as external persistent memory
- Known issues: auto-compression not always triggering

### Both Share
- Explicit planning phases (settled question in the field)
- Both evolved toward planning-first
- Both struggle with vague requirements (Codex handles better via plan mode + AGENTS.md)
- Both validate via running tests at milestones
- Human review remains essential for both
