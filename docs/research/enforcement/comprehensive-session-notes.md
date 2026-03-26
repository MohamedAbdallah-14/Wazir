# Comprehensive Session Record — 2026-03-19 to 2026-03-21

The most important session in Wazir's history. Three days of brainstorming, research, implementation, testing, and discovery. This document captures EVERYTHING discussed, decided, built, and learned.

---

## Part 1: Brainstorming Decisions (Day 1 — 2026-03-19)

### 1.1 Context-Mode Smart Routing

**Discussion:** Should all Bash commands be routed through context-mode?

**Decision:** Not all — smart routing via a PreToolUse:Bash hook. Small commands (git status, ls) pass through native Bash. Large commands (test runners, builds, diffs) auto-route through `batch_execute`. Threshold: ~30 lines.

**Implemented:** Yes. `hooks/context-mode-router` + `hooks/routing-matrix.json` as canonical command matrix. Skills reference the matrix instead of maintaining their own lists.

### 1.2 Enforce Wazir Index for Exploration

**Discussion:** Agents brute-force read dozens of files instead of using the index.

**Decision:** All codebase exploration MUST use `wazir index search-symbols` first. Maximum 10 direct file reads without a justifying index query. All 25 skills updated with index-first instructions.

**Implemented:** Yes. All SKILL.md files have "Codebase Exploration" section. Subagent dispatch templates include index instructions.

### 1.3 Track Context Savings Metrics

**Decision:** Every index query and context-mode invocation updates a running usage counter. `wazir stats` subcommand surfaces totals. `wazir status` includes one-line savings summary.

**Implemented:** Yes. `tooling/src/capture/usage.js` extended with `recordIndexQuery()`, `consumeRoutingLog()`. `tooling/src/commands/stats.js` created.

### 1.4 Three-Tier Skill Strategy (Delegate / Augment / Own)

**Discussion:** Should we fork superpowers skills or delegate to them?

**Research findings:**
- Superpowers v5.0.5 has 96K stars, 14 skills, daily releases
- Superpowers skill shadowing is FULL OVERRIDE (not merge/append)
- R2 research concluded: Augment tier is NOT implementable

**Decision:** All 25 skills classified as Own. Augment impossible due to superpowers' shadowing mechanism. Deferred to v2 — consider moving preambles to CLAUDE.md and re-evaluating.

**Implemented:** Yes. `docs/reference/skill-tiers.md` created with classification table. `wazir validate skills` checks for conflicts.

### 1.5 Rich Phase Reports + Three-Way Gating Agent

**Decision:** Replace thin reports with structured JSON reports following `schemas/phase-report.schema.json`. Gating agent outputs one of: continue / loop_back / escalate. Default posture: escalate.

**Implemented:** Yes. Schema created. `tooling/src/gating/agent.js` with `evaluatePhaseReport()`. `config/gating-rules.yaml` with verdict matrix. `tooling/src/reports/phase-report.js` for metric collection.

### 1.6 Continuous Learning + User Input Capture

**Decision (design only):** Design the learning system. Implementation deferred.

**Key design points:**
- Build on existing `memory/learnings/proposed/` → `accepted/` → `archived/` path
- User input capture as ndjson per run
- Drift budget: 30% token ratio threshold per role
- CrewAI adaptive scoring + LangMem drift prevention as patterns

**Implemented:** Design document at `learning-system-design.md`. Later sessions implemented parts of it.

### 1.7 Autoresearch Pattern Assessment

**Research:** Karpathy's autoresearch (42K stars) and uditgoenka's Claude autoresearch (1.4K stars).

**Decision:** Don't integrate into Wazir. Use alongside. The philosophies clash — Wazir is phase-gated, autoresearch is "loop forever."

**What to steal:**
- Keep/discard via git revert → use in executor
- Mechanical metric requirement → enforce in phase reports
- STRIDE + OWASP audit loop → inform wz:run-audit

**Self-audit concern:** Running overnight could drift Wazir's identity. Solution: enhanced self-audit with bounded 5-loop cycle, identity-defining files (skills, workflows, roles, manifest) protected from automated modification.

### 1.8 Composer Full Expertise Injection

**Decision:** Composition engine must compose FULL content of expertise modules into agent prompts, not just filenames. Loading expertise is additive, not restrictive — an agent with Flutter expertise doesn't forget React.

**Implemented:** Yes. `tooling/src/adapters/composition-engine.js` with 4-layer resolution (always → auto → stacks → concerns), 15-module cap, token budget enforcement, proof artifacts.

### 1.9 Restore Apply Learning + Prepare Next Task

**Decision:** Re-enable the learn and prepare-next workflows that were disabled by default.

**Implemented:** Yes. `phase_policy.learn.enabled: true` and `phase_policy.prepare_next.enabled: true` in run configs.

---

## Part 2: Pipeline Restructure (Day 1-2)

### 2.1 Four-Phase Pipeline

**Discussion:** The 14 micro-phases were confusing. Restructured to 4 clear phases.

**Decision:**
```
Phase 1: Init — setup, prerequisites, scan input, create run
Phase 2: Clarifier — research → clarify → specify → design → plan (all review loops inside)
Phase 3: Executor — implement tasks with TDD, per-task review
Phase 4: Final Review — compare impl vs original input, apply learnings, prepare next
```

**Key principle:** Phase 3 executor reviewer checks implementation vs. task spec. Phase 4 final reviewer checks implementation vs. original user input. Different concerns.

**Implemented:** Yes. Manifest phases updated. wazir/clarifier/executor/reviewer skills rewritten.

### 2.2 Remove Agent Teams

**Decision:** Teams are not ready — too much overhead, experimental, Opus-only. Always sequential.

**Implemented:** Yes. Removed from 6 files, 251 lines deleted. `team_mode: sequential` hard-defaulted.

### 2.3 Remove Init Questions

**Decision:** Stop asking depth, teams, and intent during pipeline init. Infer instead.
- Depth: default standard, override via `/wazir quick` or `/wazir deep`
- Intent: inferred from keywords (fix→bugfix, add→feature, etc.)
- Teams: always sequential

**Implemented:** Yes.

### 2.4 Two-Level Phase Model

**Decision:** 4 top-level phases, 15 workflows inside them. Both levels visible in reports and status output.

**Implemented:** Yes. Event capture uses workflow names. Reports show both levels.

---

## Part 3: Content Author + Security Gate (Day 1-2)

### 3.1 Content Author Auto-Detection

**Discussion:** Content author shouldn't just be for "content-heavy projects" — it should activate for ANY task needing content (seeding, i18n, fixtures, copy).

**Decision:** Clarifier scans hardened spec for content signals and auto-enables author workflow.

**Implemented:** Yes.

### 3.2 Mandatory Security Gate

**Decision:** 40+ security expertise modules exist but no enforcement. Added security sensitivity detector that scans diffs for patterns (auth, password, token, SQL, etc.) and auto-loads security expertise + review dimensions when detected.

**Implemented:** Yes. `tooling/src/checks/security-sensitivity.js`.

---

## Part 4: Interaction Modes (Day 2)

### 4.1 Three Modes: Auto / Guided / Interactive

**Discussion:** The user wanted full-auto mode for overnight runs, and a collaborative mode for complex work.

**Decision:**
| Mode | What happens |
|------|-------------|
| `auto` | Wazir works alone. Codex reviews. Stops ONLY on escalate. |
| `guided` | Wazir leads. User approves at checkpoints. (default) |
| `interactive` | Wazir thinks with user. Co-designs at every step. |

**Naming debate:** "pair" was rejected. Options: collaborate, interactive, hands-on, copilot, workshop, dialogue, deep, engaged, coach, explore. Chosen: `interactive`.

**Implemented:** Yes. `interaction_mode` field in run-config. Inline modifiers: `/wazir auto ...`, `/wazir interactive ...`.

---

## Part 5: User Engagement + Value Reporting (Day 2)

### 5.1 Show Value at Every Phase

**Discussion:** The most important UX improvement. Users don't feel the pipeline working for them.

**Decision:** Every phase explains:
- Before: "I'm about to research X because Y"
- After: "Found X, which means Y. Without this, Z would have gone wrong."
- Counterfactual: what would have broken if we skipped this phase

**Implemented:** Yes (in skills as conversation templates). But agents DON'T FOLLOW the templates — this is a known enforcement problem.

### 5.2 Clarifier Must ASK, Not Decide

**Discussion:** Clarifier made scope decisions without asking (decided "docs and i18n are out of scope" without asking the user).

**Decision:** Research runs FIRST, then clarifier asks INFORMED questions in 1-3 batches of 3-7 questions. Every scope exclusion must be explicitly confirmed by user.

**Implemented:** Yes (in skill prose). AP-24 antipattern added.

### 5.3 Proof of Implementation

**Discussion:** New feature — verifier must produce mechanical evidence.

**Decision:**
- Runnable (web page, API, CLI): actually run it, capture evidence (screenshot, curl, CLI output)
- Non-runnable (library, config): lint + format + type-check + tests as acceptance criteria

**Implemented:** Yes. `tooling/src/verify/proof-collector.js`. But enforcement doesn't block — the run completes even without proof artifacts.

### 5.4 Reasoning Chain + Decision Logging

**Decision:** Save agent decisions to `decisions.ndjson` for auditing. Simple format: `{ timestamp, phase, decision, reason }`.

**Implemented:** Yes. `tooling/src/capture/decision.js`. But agents don't actually call `appendDecision()` during runs.

---

## Part 6: Learnings Pipeline (Day 2)

### 6.1 What Learnings Are Actually For

**Critical discussion:** Learnings are NOT project context ("this project uses Supabase"). They are **pipeline enforcement feedback** — patterns of what the agent gets wrong.

**The loop:**
1. Every review finding → `memory/findings/cumulative-findings.md`
2. Every agent skip → `decisions.ndjson`
3. Every 5-10 runs → run cumulative findings through clarifier
4. Patterns become new antipattern entries in `expertise/antipatterns/`

**Key principle:** Learnings don't change agent behavior directly (no drift risk). Learnings improve the ANTIPATTERN CATALOG which the reviewer loads. The pipeline gets stricter over time, not different.

### 6.2 Self-Audit Input Coverage

**Decision:** Self-audit should compare input items vs plan tasks vs commits. Missing items = HIGH severity.

**Implemented:** Yes (in skill). Also added plan-review Input Coverage dimension.

---

## Part 7: The Enforcement Crisis (Day 2-3)

### 7.1 The Pattern Emerges

Across 5 sessions, pipeline compliance was:
- Session 1: 60%
- Session 2: 15%
- Session 3: 35%
- Session 4: 40%
- Session 5: 40%

The same things fail every time:
- Agent writes artifacts directly instead of invoking skills
- Agent does 1 review pass instead of 7 (deep depth)
- Agent skips TDD (writes implementation before tests)
- Agent batches commits instead of one-per-task
- Agent skips learn + prepare-next workflows

### 7.2 Root Cause Analysis

The agent reads the full wazir skill (500+ lines), sees "dispatch subagents per phase," and decides to do the work inline instead. Every enforcement mechanism in the skill is prose that the agent rationalizes away.

The research confirmed: **prose instructions top out at ~72% compliance** (Meincke et al. 2025, N=28,000). We're at 40% — below even the theoretical ceiling — because the agent doesn't invoke the skills that contain the persuasion engineering.

### 7.3 The Five Enforcement Failures

1. **Agent skipped all phases** (session 1) → Fixed with phase-prerequisite-guard
2. **Clarifier cut 70% of scope** (session 2) → Fixed with scope-coverage-guard
3. **Agent skipped learn/prepare-next** (session 3) → Fixed with run-completion validator
4. **Agent skipped proof collection** (session 4) → Built proof-collector but enforcement doesn't block
5. **Agent doesn't invoke skills** (all sessions) → UNSOLVED

---

## Part 8: Deep Research — 33 Architecture Agents (Day 2)

### 8.1 Five Research Topics, 25 Agents

| Topic | Agents | Key Finding |
|-------|--------|-------------|
| Hooks | 5 | Stop hook CAN block completion. PreToolUse has 7 decision patterns. State machine via pipeline-state.json. |
| Subagent | 5 | Controller-as-orchestrator. 200K tokens per subagent. No nesting (depth=1). File-mediated handoff. |
| Interactive | 5 | AskUserQuestion supports 2-4 options with arrow keys. Progressive disclosure at 3 levels. |
| Learning | 5 | 4-stage promotion: Tally→Candidate→Promote→Active. LLM-assisted clustering. Semi-automatic. |
| Review | 5 | Two-tier: internal (Sonnet, patterns) → external (Codex, fresh eyes). Mode-specific reviewer composition. |

### 8.2 The Universal Pattern

From ALL frameworks (CrewAI, LangGraph, Temporal, Symphony, GitHub Actions):

> **The framework holds the loop, not the agent.**

- CrewAI: Python for-loop iterates tasks
- LangGraph: channel triggers determine what fires
- Temporal: `await` blocks at language level
- Symphony: orchestrator tick sequence
- GitHub Actions: `needs:` DAG

### 8.3 The Three-Layer Enforcement Pyramid

```
         /\
        /  \   Git pre-push hooks (git runs them)
       /    \
      /------\  PreToolUse hooks (Claude Code runs them)
     /        \
    /----------\  Stop hook blocks completion
   /            \
  /--------------\  Subagent isolation (one agent per phase)
 /                \
/------------------\  Persuasion engineering (superpowers-style)
```

### 8.4 Key Hook Findings

- **Stop hook blocks completion:** `{"decision": "block", "reason": "..."}` — proven by ralph-loop plugin
- **PreToolUse denies tool calls:** `permissionDecision: "deny"` — proven by context-mode plugin
- **Critical limitations:** Hooks can block but can't compel. "Hook error" labels are a Claude Code bug. SubagentStop is broken. Agent can escape via AskUserQuestion.
- **Must check `stop_hook_active`** to prevent infinite loops
- **Must allow context-limit and user-abort stops** — never block these

### 8.5 Superpowers Analysis

- 100% prompt engineering, ZERO mechanical enforcement
- Issue #463: agents STILL skip reviews — the author knows it's unsolved
- Commenter: "The only reliable fix is making reviews structural, not instructional"
- 47 rationalization entries across 5 skills
- Persuasion doubles compliance (33%→72%) but doesn't reach 100%
- CSO critical: skill descriptions must be triggers, never process summaries

---

## Part 9: Deep Research — 8 Psychology Agents (Day 2-3)

### 9.1 Why LLMs Skip Instructions

- Next-token prediction, not goal tracking — no persistent working memory
- Attention is finite — instructions far from generation point get less weight
- "Lost in the middle" — middle-positioned instructions followed 15-25% less
- Compositional constraints degrade multiplicatively — 5 constraints = ~50% all satisfied
- Multi-turn decay: ~39% performance drop in multi-turn vs single-turn

### 9.2 What Makes Instructions Followable

| Technique | Compliance Impact |
|-----------|------------------|
| Output template with example | Highest (~95%) |
| XML tags for structure | Very High |
| Numbered steps (≤7) | High |
| Few-shot examples (1-3) | High |
| Strategic repetition (2-3x) | High |
| Positive + negative pairing | Moderate-High |
| Bookend critical rules (begin+end) | Moderate |
| Bold/CAPS for critical items | Moderate |

### 9.3 The Priority Hierarchy

From research on goal conflict:
- "Be helpful" almost always beats "follow process" because RLHF rewards helpfulness
- The fix: **reframe compliance AS helpfulness** — "following the pipeline IS how you help"
- Implementation intentions (IF X → THEN Y) are 25% more effective than abstract rules
- Identity framing ("you are a pipeline-enforcement agent") is the most durable compliance strategy

### 9.4 The Perfect Prompt Architecture

```
ZONE 1 — PRIMACY (first 500 tokens): Identity + Iron Laws + Priority Stack
ZONE 2 — PROCESS (structured middle): Steps + Gates + Rationalization Tables
ZONE 3 — RECENCY (last 500 tokens): Re-anchor Laws + Red Flags + Meta-instruction
```

### 9.5 The Instruction Persistence Stack

```
Layer 1: --system-prompt with 3-5 absolute constraints
Layer 2: CLAUDE.md with behavioral rules (re-injected each turn)
Layer 3: PreCompact hook externalizing state before compaction
Layer 4: Periodic system-reminder re-injection of core rules
Layer 5: Custom compaction instructions mandating rule preservation
Layer 6: Agent writes critical state to files outside context window
```

---

## Part 10: Implementation Sessions (Day 1-3)

### Session 1: Three-Layer Enforcement (10 commits)

Built the mechanical enforcement layer:
- `pipeline-state.js` — state machine with phase tracking
- Per-phase guardrail validators
- Stop hook blocking completion without proof/review/learnings
- PreToolUse hook with phase-aware tool restrictions
- Subagent-per-phase controller architecture

### Session 2: Persuasion Engineering (1 commit)

- Rationalization tables added to 6 discipline skills
- CSO description fixes (triggers only)
- Mode-specific reviewer composition with 8 digest modules (3-5K tokens)
- Findings-to-antipattern learning pipeline
- State DB extended for clustering and promotion

### Session 3: Interactive UX (2 commits)

- Depth parameter table (40+ parameters)
- Consolidated PreToolUse dispatcher (3 hooks → 1)
- Artifact dependency graph with digest verification
- AskUserQuestion patterns for checkpoints
- Progressive disclosure progress reporting
- Steerability with mutation classification

### Session 4: Psychology-Driven Skill Rewriting (1 commit)

- All 29 SKILL.md files restructured to 3-zone architecture
- Iron Laws in every skill
- Priority stack P0-P5 with conflict examples
- IF-THEN implementation intentions replacing abstract rules
- Identity framing: "pipeline compliance IS helpfulness"
- Commitment priming: announce plan before executing
- Meta-instruction: user CAN override preferences, CANNOT override Iron Laws

### Session 5: Todo API Test Run

- Full pipeline test with a simple todo API
- Result: 40% compliance — same as sessions 3-4
- Agent still writes artifacts directly instead of invoking skills
- 3-zone rewrite produced ZERO compliance improvement

---

## Part 11: Recurring Issues Discovered

### 11.1 Hook Errors (All Sessions)

- `SessionStart:startup hook error` — session-start hook failing
- `UserPromptSubmit hook error` — prompt submission hook failing
- `Stop hook error: TabManager not available` — Claude Code internal bug
- "PreToolUse:Bash hook error" on EVERY tool call — Claude Code labels all hook executions as "errors" even when they succeed (issue #34713)

### 11.2 Context-Mode Broken

- `better_sqlite3.node` compiled against different Node.js version
- All `execute_file` calls fail
- Routing hook suggests context-mode but it can't work
- Workaround: fall back to raw bash

### 11.3 False Positives in Hooks

- Security hook fires on `db.js` (no security code)
- Context-mode hook detects "curl" in heredoc commit messages
- Read hook context tips fire on every file regardless of size

### 11.4 Pipeline Doesn't Read `input/` Directory

- `/wazir` and `/clarifier` don't scan `input/` for briefing materials
- User has to manually tell the pipeline what to work on
- Input scanner utility created but not wired into the pipeline skill

---

## Part 12: Ideas for the Future

### 12.1 OpenCode + Local LLMs

**Vision:** Wazir as model-agnostic engineering OS. Per-role provider config — any role can map to any provider (Claude, Codex, Gemini, local LLMs via OpenCode/Ollama).

**Why it matters:**
- No competition — nobody builds disciplined pipelines for local models
- Composition engine's 300 expertise modules make dumb models perform like frontier models
- "Local review first, cloud second" = free review loops
- Privacy: some teams can't send code to cloud

### 12.2 Opus Orchestrator with Model-Aware Delegation

**Decision:** Opus acts as orchestrator, delegates to cheapest model per sub-task. Not "Phase 3 uses Sonnet" — per-sub-task routing.

| Sub-task | Model |
|----------|-------|
| Orchestration | Opus |
| Fetch URLs | Haiku |
| Write implementation | Sonnet |
| Per-task review | Sonnet |
| Final review | Opus |

### 12.3 Overnight Skill Research

**Decision:** Build an overnight mode that researches N skills against the ecosystem (superpowers, CrewAI, etc.), compares, rates, recommends improvements. Output: reports only, no skill changes. Human reads and decides.

### 12.4 Real-Time Pipeline UI

**Inspiration:** https://github.com/pablodelucca/pixel-agents

**Concept:** Live terminal or web UI showing pipeline progress, current phase, artifact status, token savings. Deferred until enforcement works.

### 12.5 One-Command Install

**Target:** `npx wazir` — auto-detect host, export, scan project, ask what to build. Zero config.

---

## Part 13: The Unsolved Problem

### 13.1 The Core Issue

After 5 implementation sessions, 33 architecture research agents, 8 psychology research agents, 3-zone skill rewrites, Iron Laws, rationalization tables, identity framing, and mechanical hooks:

**Pipeline compliance is stuck at 40%.**

The agent consistently:
- Writes artifacts directly instead of invoking skills
- Does 1 review pass instead of 7
- Skips TDD
- Batches commits
- Skips learn/prepare-next

### 13.2 Why Current Approaches Failed

| Approach | Why it failed |
|----------|--------------|
| Better skill prose | Agent doesn't read the skills it's supposed to invoke |
| Rationalization tables | Tables are IN the skills the agent skips |
| Iron Laws | Laws are IN the skills the agent skips |
| 3-zone architecture | Architecture is IN the skills the agent skips |
| Mechanical hooks | Hooks check pipeline-state.json which agent doesn't create |
| Subagent controller | Controller is described in wazir skill which agent reads but doesn't follow |

### 13.3 Three Possible Solutions

1. **Accept 40% and ship.** Output quality is consistently high. Process is sloppy but results are good.

2. **Strip the wazir skill to ONLY dispatch subagents.** No inline instructions for how to clarify/specify/design/plan. Just: dispatch subagent, validate output, dispatch next. The agent can't do work itself because the skill doesn't tell it how.

3. **Move the controller out of the skill entirely.** SessionStart hook creates the run and state. Stop hook dispatches the next phase when one completes. The agent's only job is to follow the current subagent's instructions.

### 13.4 The Fundamental Insight

From the framework research:

> **"Give the agent a task, not a plan."**

The wazir skill gives the agent the FULL PLAN and says "follow this." Every framework that works does the opposite — the agent sees ONE task at a time.

---

## Part 14: Key Metrics

### Code Shipped

| Metric | Value |
|--------|-------|
| Total commits (across all sessions) | ~50 |
| Files changed | 200+ |
| Lines added | 30,000+ |
| Tests | 783 passing |
| Research agents | 33 (architecture) + 8 (psychology) = 41 |
| Research output | ~8MB |
| PRs merged | #3, #4, #5 (closed), #6 |

### Wazir Value Props Documented

1. Measure twice, cut once
2. Deep research (mandatory, not optional)
3. Clarifier + task planning
4. Content author
5. Self-audit
6. Composer (300 expertise modules)
7. Review loops
8. Continuous learning
9. Antipatterns (first-class, loaded before domain expertise)
10. Multi-host
11. Context efficiency (60-80% token savings)
12. Verification before completion
13. Gating agent
14. Humanize

---

## Part 15: All Feedback Saved to Memory

| Memory | What |
|--------|------|
| Use wazir index first | Never spawn heavyweight exploration agents |
| Challenge ideas | Push back when disagreeing, user wants debate |
| No checkpoint stops | Ask Codex for questions, only stop for critical |
| Never pause pipeline | Compact and continue, finish in one session |
| No scope reduction | Never drop items without user approval |
| Pipeline always wins | 100% compliance > speed/tokens/anything |
| Input dir ignored | Bug: pipeline doesn't scan input/ directory |
| Issues are tasks | When user reports issue, fix the skill/workflow |
