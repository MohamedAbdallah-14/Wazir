# Remaining 8 Items — IMPLEMENT ALL OF THEM

CRITICAL: This file contains 8 items. ALL 8 must appear in the execution plan. Do NOT tier, prioritize, or defer any item. Every item has clear deliverables — implement them all.

---

## Item 19: Enforce No Autonomous Scope Reduction

**What:** The clarifier autonomously tiered 21 input items and only executed 5, dropping 70% of the user's requested work. This must be prevented with a hard gate.

**Deliverables:**
- Add a check to `skills/clarifier/SKILL.md` — count items in input, count items in execution plan, REFUSE to proceed if plan has fewer items than input (unless user explicitly approved the reduction)
- Add to `tooling/src/guards/phase-prerequisite-guard.js` — validate that the execution plan covers all input items
- Add to `expertise/antipatterns/process/ai-coding-antipatterns.md` — AP-22: "Autonomous scope reduction — cutting user's requested work into tiers without approval"
- Add invariant to `skills/wazir/SKILL.md`: "items_in_plan >= items_in_input unless user explicitly approves reduction"

### Online Research
- How CrewAI Task Guardrails enforce mandatory task completion
- How project management tools (Linear, Jira) prevent silent scope reduction in sprints

---

## Item 11: Phase Reports Code Module

**What:** Replace prose-based phase report generation with executable code.

**Deliverables:**
- Create `tooling/src/reports/phase-report.js` — builds JSON from actual data (test results, lint output, diff stats)
- Wire into the review workflow so reports are generated automatically
- Hybrid: code collects metrics deterministically, agent fills qualitative fields (drift analysis, decisions)
- Replace thin between-phase reports with the new schema

### Online Research
- How Jest/Vitest output structured test reports (JSON reporters)
- How Allure Report structures multi-dimensional test/quality reports
- How GitHub Actions produces structured job summaries (GITHUB_STEP_SUMMARY)

---

## Item 12: Opus Orchestrator with Model-Aware Delegation

**What:** Opus orchestrates and delegates each sub-task to the cheapest model that can handle it.

**Deliverables:**
- Implement `multi-model` mode in config (exists as option, never built)
- Add model-routing logic — Opus decides model per sub-task based on complexity
- Composition engine dispatch includes model selection in Agent tool calls
- Skills/workflows annotate which sub-tasks are Haiku/Sonnet/Opus-grade
- Update subagent dispatch to pass `model` parameter

### Online Research
- How AutoGen/AG2 handles model routing across agent roles
- How CrewAI assigns different LLMs to different agents
- How the Mixture of Agents (MoA) pattern uses cheap models for drafting, expensive for refinement
- Claude Code `model` field in agent frontmatter — `model: sonnet | opus | haiku | inherit`

---

## Item 13: Internal Review First, Codex Second

**What:** Restructure review loop: internal review first (fast, cheap, expertise-loaded), Codex second (fresh eyes on clean code). All findings feed learning.

**Deliverables:**
- Update `skills/reviewer/SKILL.md` — internal review pass BEFORE Codex
- Internal review uses Sonnet with full expertise modules composed in context
- Fix cycle between internal passes until clean
- Codex review only AFTER internal review passes
- All findings (internal + Codex) feed into learning system via `workflows/learn.md`

### Online Research
- How superpowers `requesting-code-review` dispatches review subagents
- How CodeRabbit AI review agent works
- How Sourcery.ai structures automated code review — rules vs AI vs hybrid

---

## Item 14: Self-Audit V2 — Learnings + Trend Tracking + Severity

**What:** Self-audit finds and fixes but doesn't learn. Add learning integration, trend tracking, severity.

**Deliverables:**
- Self-audit findings feed into `memory/learnings/proposed/`
- Compare against previous audit results (track recurring vs new findings)
- Add severity levels: critical (abort), high (fix now), medium (fix if time), low (log and skip)
- Before/after quality score per loop to measure effectiveness
- Escalation path for manual findings

### Online Research
- How SonarQube tracks code quality trends — severity, technical debt
- How CodeClimate maintains quality scores — GPA model
- How GitHub Advanced Security tracks recurring vulnerabilities

---

## Item 15: SQLite State Database

**What:** Extend existing SQLite infrastructure with `state.sqlite` for persistent cross-run data.

**Deliverables:**
- Create `state.sqlite` (separate from `index.sqlite` to survive rebuilds)
- Tables: `learnings`, `findings`, `audit_history`, `usage_aggregate`
- Migration logic (create tables if not exist)
- Wire learning system to read/write from SQLite instead of YAML files
- Wire self-audit to store findings in SQLite
- Wire `wazir stats` to read aggregated usage from SQLite

### Online Research
- How CrewAI stores long-term memory (SQLite3) — schema, adaptive scoring
- How LangMem stores memories with TTL and semantic search
- SQLite FTS5 full-text search — already used by context-mode plugin
- SQLite WAL mode for concurrent reads during pipeline execution

---

## Item 16: One-Command Install + Zero-Config Start

**What:** `npx wazir` should be all you need. Auto-detect host, export, scan project, ask what to build.

**Deliverables:**
- `npx @wazir-dev/cli` works as entry point
- Auto-detect host (Claude Code / Codex / Cursor / Gemini) from environment
- Auto-export for detected host
- Auto-scan project (language, framework, stack)
- One question: "What do you want to build?"
- Remove mandatory `wazir init` — fold into first `/wazir` invocation
- Plugin marketplace install path

### Online Research
- How superpowers plugin handles install via marketplace
- How Vercel CLI (`npx vercel`) auto-detects framework — zero-config
- How aider handles zero-config start — just works in any repo
- How `create-next-app` handles one-command scaffolding

---

## Item 6: Deep Research: Codex CLI, Gemini CLI, Claude CLI + Create Skills

**What:** Research all three CLIs and create Wazir skills for each.

**Deliverables:**
- `skills/codex-cli/SKILL.md` — how to use Codex programmatically (exec, review, sandbox modes, model selection)
- `skills/gemini-cli/SKILL.md` — how to use Gemini CLI programmatically
- `skills/claude-cli/SKILL.md` — how to use Claude CLI programmatically (-p print mode, --model, --allowedTools)
- Update `skills/reviewer/SKILL.md` to reference the Codex skill instead of inline codex commands

### Online Research
- Codex CLI full documentation — `codex exec`, `codex review`, sandbox modes, model selection
- Gemini CLI documentation — command surface, non-interactive mode, sandbox
- Claude CLI documentation — `claude` command surface, `-p` print mode, `--model`, `--allowedTools`, `--output-format`
- How OpenAI Symphony uses Codex CLI via App-Server Protocol
