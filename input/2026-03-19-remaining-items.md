# Remaining Items — 2026-03-19

Items NOT yet implemented from the brainstorming session. Each needs implementation, not discussion.

---

## 3. Fix: Pipeline Doesn't Read `input/` Directory

**What:** `/wazir` and `/clarifier` don't scan `input/` for briefing materials automatically. The user has to manually tell the pipeline what to work on.

**Fix:** Scan both `input/` (project-level) and `.wazir/input/` (state-level) at startup. Present what's found, ask user which items to work on. If only one file, use it automatically.

**Files to change:** `skills/wazir/SKILL.md` (Step 1), `skills/clarifier/SKILL.md` (Prerequisites)

### Online Research
- How GitHub Spec-Kit reads `specs/` directory to auto-discover specs
- How Cursor reads `.cursor/rules/` to auto-load project context
- How aider handles file discovery and auto-inclusion — `.aider.conf.yml` patterns

---

## 6. Deep Research: Codex CLI, Gemini CLI, Claude CLI

**What:** Research all three CLIs and create Wazir skills for each. Make cross-tool orchestration first-class.

**Current state:** Wazir uses Codex CLI for reviews (`codex exec`). No formal skill. Gemini CLI and Claude CLI not integrated.

**Deliverables:**
- `skills/codex-cli/SKILL.md` — how to use Codex programmatically (exec, review, sandbox modes, model selection)
- `skills/gemini-cli/SKILL.md` — how to use Gemini CLI programmatically
- `skills/claude-cli/SKILL.md` — how to use Claude CLI programmatically (-p print mode, --model, --allowedTools)
- Update `skills/reviewer/SKILL.md` to reference the Codex skill instead of inline codex commands

### Online Research
- Codex CLI full documentation — `codex exec`, `codex review`, sandbox modes, model selection, App-Server Protocol
- Gemini CLI documentation — command surface, non-interactive mode, sandbox, model selection
- Claude CLI documentation — `claude` command surface, `-p` print mode, `--model`, `--allowedTools`, `--output-format`
- How OpenAI Symphony uses Codex CLI programmatically via App-Server Protocol
- How superpowers integrates with multiple hosts (Claude Code, Codex, Gemini CLI, OpenCode, Cursor)
- How aider integrates with multiple LLM providers
- Comparison: Codex sandbox vs. Claude Code sandbox vs. Gemini CLI sandbox

---

## 7. Interactive Claude — Arrow-Key Selection

**What:** When Claude asks the user a question with options, use arrow-key selection instead of typing numbers. Also: remove all interactive CLI prompts (`wazir init --force`) that always fail in Claude Code's Bash tool.

**Reference:** https://github.com/bladnman/ideation_team_skill — does this well in Claude Code.

**Deliverables:**
- Research how bladnman implements interactive selection
- If it's a Claude Code native feature (AskUserQuestion), wire it into skills
- If custom, implement the pattern
- Remove `@inquirer/prompts` usage from `tooling/src/init/command.js` — handle all init in the skill conversation instead
- Remove `@inquirer/prompts` from `package.json` dependencies if no longer needed

### Online Research
- https://github.com/bladnman/ideation_team_skill — full source analysis
- Claude Code `AskUserQuestion` tool — does it support structured options with selection?
- How superpowers handles user interaction in skills
- How VS Code extension API handles `showQuickPick` — native selection pattern
- How GitHub CLI (`gh`) handles interactive prompts with `--prompter`

---

## 9. PreToolUse:Write and PreToolUse:Edit Hook Errors

**What:** These hooks are throwing errors. Needs investigation and fix.

**Deliverables:**
- Reproduce the error
- Identify root cause
- Fix the hook or the guard logic
- Add test coverage

### Online Research
- Claude Code hooks documentation — PreToolUse hook contract, exit codes, error handling
- Claude Code GitHub issues related to hook errors
- How superpowers hooks handle errors — recovery patterns

---

## 11. Phase Reports Still Partially Prose-Based

**What:** The reviewer skill has instructions to generate phase reports per the schema, but there's no executable code that auto-generates the JSON. It's skill prose telling the agent what fields to fill.

**Deliverables:**
- Create `tooling/src/reports/phase-report.js` — builds JSON from actual data (test results, lint output, diff stats)
- Wire into the review workflow so reports are generated automatically
- Replace or merge the thin between-phase reports (commit 6c84455) with the new schema
- Hybrid approach: code collects metrics deterministically, agent fills qualitative fields (drift analysis, decisions)

### Online Research
- How GitHub Actions produces structured job summaries (GITHUB_STEP_SUMMARY)
- How Jest/Vitest output structured test reports (JSON reporters)
- How Allure Report structures multi-dimensional test/quality reports
- How Datadog CI Visibility structures pipeline reports
- How OpenTelemetry structures observability data — spans, metrics, traces

---

## 12. Opus Orchestrator with Model-Aware Delegation

**What:** Opus acts as orchestrator and delegates each sub-task to the cheapest model that can handle it. Not "Phase 3 uses Sonnet" — per-sub-task model routing.

**Deliverables:**
- Implement `multi-model` mode in config (exists as option, never built)
- Add model-routing logic to skill dispatch — Opus decides model per sub-task
- Composition engine dispatch includes model selection in Agent tool calls
- Skills/workflows annotate which sub-tasks are Haiku/Sonnet/Opus-grade
- Update subagent dispatch to pass `model` parameter

### Online Research
- How BAMAS (Budget-Aware Multi-Agent Structuring) models cost budgets — academic paper
- How AutoGen/AG2 handles model routing across agent roles
- How CrewAI assigns different LLMs to different agents
- How LangGraph routes to different models based on task complexity
- How OpenRouter handles model routing and fallback
- How Anthropic's Claude Agent SDK handles model selection for subagents
- How Martian's model router selects optimal model per query
- How the Mixture of Agents (MoA) pattern uses cheap models for drafting, expensive for refinement

---

## 13. Internal Review First, Codex Second

**What:** Restructure the review loop: internal review skill first (fast, cheap, expertise-loaded), Codex second (slow, expensive, fresh eyes). Review findings must feed the learning system.

**Deliverables:**
- Update `skills/reviewer/SKILL.md` — internal review pass BEFORE Codex
- Internal review uses Sonnet with full expertise modules composed in context
- Fix cycle between internal passes until clean
- Codex review only AFTER internal review passes
- All findings (internal + Codex) feed into the learning system via `workflows/learn.md`
- Update `skills/executor/SKILL.md` per-task review to follow same pattern

### Online Research
- How superpowers `requesting-code-review` dispatches review subagents
- How CodeRabbit AI review agent works — what it checks, finding structure
- How GitHub Copilot code review works — inline vs PR-level
- How Amazon CodeGuru Reviewer detects recurring patterns
- How Sourcery.ai structures automated code review — rules vs AI vs hybrid
- How Qodo (formerly CodiumAI) generates review-driven test suggestions
- LangMem's prompt optimization from feedback — review findings → prompt improvements

---

## 14. Self-Audit V2 — Learnings + Trend Tracking + Severity

**What:** Current self-audit finds and fixes but doesn't learn. Needs learning integration, trend tracking, severity levels.

**Deliverables:**
- Self-audit findings feed into `memory/learnings/proposed/`
- Compare against previous audit results (track recurring vs new findings)
- Add severity levels: critical (abort), high (fix now), medium (fix if time), low (log and skip)
- Before/after quality score per loop to measure effectiveness
- Escalation path for manual findings (create a task or file an issue)

### Online Research
- How SonarQube tracks code quality trends across builds — severity, technical debt
- How CodeClimate maintains quality scores over time — GPA model
- How GitHub Advanced Security tracks recurring vulnerabilities — alert lifecycle
- How ESLint's `--cache` tracks previously linted files — incremental audit
- How Snyk tracks dependency vulnerabilities across versions
- How PagerDuty handles alert fatigue and dedup

---

## 15. SQLite State Database for Learnings, Findings, and Trends

**What:** Extend existing SQLite infrastructure with `state.sqlite` for persistent cross-run data.

**Deliverables:**
- Create `state.sqlite` (separate from `index.sqlite` to survive rebuilds)
- Tables: `learnings`, `findings`, `audit_history`, `usage_aggregate`
- Migration logic (create tables if not exist)
- Wire learning system to read/write from SQLite instead of YAML files
- Wire self-audit to store findings in SQLite
- Wire `wazir stats` to read aggregated usage from SQLite
- Add `wazir db` subcommand for querying (optional)

### Online Research
- How CrewAI stores long-term memory (SQLite3) — schema, adaptive scoring
- How LangGraph Store uses PostgreSQL + pgvector — schema design patterns
- How LangMem stores memories with TTL and semantic search
- How Mem0 structures its memory database — entities, relations, facts
- SQLite FTS5 full-text search — already used by context-mode plugin
- How Datasette exposes SQLite as browsable interface
- How Litestream handles SQLite replication
- SQLite WAL mode for concurrent reads during pipeline execution

---

## 16. One-Command Install + Zero-Config Start

**What:** `npx wazir` should be all you need. Auto-detect host, export, scan project, ask what to build.

**Deliverables:**
- `npx @wazir-dev/cli` works as entry point
- Auto-detect host (Claude Code / Codex / Cursor / Gemini) from environment
- Auto-export for detected host
- Auto-scan project (language, framework, stack)
- One question: "What do you want to build?"
- Plugin marketplace install path (`/plugin install wazir`)
- Remove mandatory `wazir init` — fold into first `/wazir` invocation

### Online Research
- How superpowers plugin handles install via marketplace — onboarding flow
- How Cursor rules auto-detect and apply — zero-config pattern
- How `create-next-app`, `create-t3-app` handle one-command scaffolding
- How Vercel CLI (`npx vercel`) auto-detects framework — zero-config
- How aider handles zero-config start — just works in any repo
- How bolt.new / v0.dev handle instant project start
- How the Claude Code plugin marketplace install flow works behind the scenes
