# Deferred Work Items — 2026-03-19

Items agreed upon during brainstorming + pipeline session. Each needs discussion before implementation.

---

## PRIORITY: Restructure Pipeline to 4 Main Phases

The current pipeline has too many micro-phases. Restructure into 4 clear phases:

### Phase 1: Init
- Straightforward setup
- Read config, check prerequisites, create run directory
- No questions (depth/intent/teams inferred or defaulted — see items #4, #5)
- Scan `input/` directory automatically (see item #3)

### Phase 2: Clarifier
- Everything from reading input to having an implementation plan
- Includes: research, clarification, spec hardening, brainstorming/design, planning
- All review loops happen within this phase (research-review, clarification-review, spec-challenge, design-review, plan-review)
- Output: approved spec + design + execution plan with task specs

### Phase 3: Executor
- The simplest phase — pure implementation
- Should work with a lower-quality model (e.g., Sonnet for executor, medium-quality for per-task reviewer)
- Per-task TDD cycle: write test → implement → review against task spec
- The per-task reviewer checks implementation against the TASK spec (not input)
- Should still produce the same quality results with cheaper models

### Phase 4: Final Review
- Compare implementation against the ORIGINAL INPUT (not the task specs)
- The executor's per-task reviewer already validated against task specs — that's covered
- Final reviewer validates: does what we built actually match what the user asked for?
- Input-to-implementation comparison catches drift that task-level review misses
- After review: apply learnings (from the run)
- After review: prepare for next task (compress/archive unneeded files, write handoff)
- This is where learn + prepare-next phases get folded in

### Key Principle
- Phase 3 executor reviewer reviews: implementation vs. task spec
- Phase 4 final reviewer reviews: implementation vs. original user input
- These are different concerns — task-level correctness vs. intent alignment

### Online Research
- How MetaGPT structures its pipeline phases (ProductManager → Architect → Engineer → QA) — their phase boundaries and handoff contracts
- How OpenAI Symphony structures Poll → Dispatch → Resolve → Land — what happens between phases
- How CrewAI Flows handle phase transitions with routers and conditional branching
- How GitHub Spec-Kit structures spec → implement → verify — their phase model
- LangGraph's multi-step agent pipelines — how they define phase boundaries vs. node boundaries
- How Devin structures its planning → implementation → verification phases
- How Cursor Agent / Windsurf Cascade structure their internal pipeline phases

---

## 16. One-Command Install + Zero-Config Start

**Goal:** Wazir should be one of the easiest agent frameworks to install and use.

**Current experience (too many steps, one breaks):**
```bash
git clone wazir
npm install
npx wazir export build   # 4 host exports
npx wazir init            # interactive arrows — FAILS in Claude Code
# then learn phases, roles, skills, composition...
```

**Target experience:**
```bash
npx wazir
```

One command. Everything else is automatic or deferred until needed.

**What `npx wazir` should do:**
1. Detect host (Claude Code? Codex? Cursor? Gemini?) from environment
2. Export the right files for that host automatically
3. Scan the project (language, framework, stack)
4. Ask "What do you want to build?" — one question, no config
5. Run the full pipeline

**No init questions.** Defaults for everything:
- Depth: standard (override with `/wazir deep ...`)
- Intent: inferred from request text
- Teams: sequential (always)
- Model mode: detected from available tools

**Install paths (from easiest to most control):**

| Path | Command | Who |
|------|---------|-----|
| Plugin marketplace | `/plugin install wazir` | Claude Code users |
| npx (zero install) | `npx @wazir-dev/cli` | Any Node project |
| Global install | `npm i -g @wazir-dev/cli` | Power users |
| Clone + link | `git clone && npm link` | Contributors |

**First-run experience:**
- No CLAUDE.md editing required
- No config files to create
- No concepts to learn upfront
- Just: install → `/wazir build me a login page` → pipeline runs

**Deep when you need it:**
- `wazir config` for power users who want control
- `wazir doctor` to see what's configured
- `wazir stats` to see what Wazir saved you
- Expertise modules, review loops, composition — all there, all optional to understand

**Principle:** Like git — `git init` is one command, `git config` is deep. Instant start, deep when you need it.

### Online Research
- How superpowers plugin handles install (`/plugin marketplace add`) — onboarding flow, zero-config
- How Cursor rules / .cursorrules get auto-detected and applied — zero-config pattern
- How `create-react-app`, `create-next-app`, `create-t3-app` handle project scaffolding — one-command patterns
- How Vercel CLI (`npx vercel`) auto-detects framework and deploys — zero-config detection
- How `degit` (Rich Harris) handles instant project scaffolding without git history
- How Yeoman generators and `npm create` handle interactive scaffolding vs. zero-config
- How the Claude Code plugin marketplace install flow works (behind the scenes)
- How OpenAI Codex handles first-run experience — what config does it need?
- How aider (Paul Gauthier) handles zero-config start — `aider` just works in any repo
- How bolt.new / v0.dev handle instant project start with no config

---

## 15. SQLite State Database for Learnings, Findings, and Trends

**What:** Extend the existing SQLite infrastructure (already used for index) with a `state.sqlite` for persistent cross-run data.

**Why files don't work:** Can't query "show me all executor learnings for node stack", can't detect recurring findings, can't trend across runs without reading every past report.

**New tables in `state.sqlite` (separate from `index.sqlite` to survive rebuilds):**
- `learnings` — id, source_run, category, scope_roles, scope_stacks, scope_concerns, confidence, recurrence_count, content, created_at, last_applied, expires_at
- `findings` — id, run_id, phase, source (internal/codex/self-audit), severity, description, resolved, finding_hash (for dedup/recurrence detection)
- `audit_history` — run_id, date, finding_count, fix_count, manual_count, quality_score_before, quality_score_after
- `usage_aggregate` — run_id, date, tokens_saved, bytes_avoided, savings_ratio, index_queries, routing_decisions

**Key queries this enables:**
- `SELECT * FROM findings WHERE finding_hash IN (SELECT finding_hash FROM findings GROUP BY finding_hash HAVING COUNT(*) >= 2)` — recurring findings → auto-propose as learnings
- `SELECT run_id, finding_count FROM audit_history ORDER BY date` — trend tracking
- `SELECT * FROM learnings WHERE scope_stacks LIKE '%node%' AND confidence = 'high'` — targeted learning injection
- `SELECT SUM(tokens_saved) FROM usage_aggregate` — cumulative savings

**No new dependency:** `node:sqlite` already used by the index. Same infrastructure, new file.

### Online Research
- How CrewAI stores long-term memory (SQLite3 backend) — schema, query patterns, adaptive scoring
- How LangGraph Store uses PostgreSQL + pgvector for cross-session persistence — schema design
- How LangMem stores and retrieves memories with TTL and semantic search
- How Mem0 (formerly EmbedChain) structures its memory database — entities, relations, facts
- How OpenHands stores agent state and history across sessions
- SQLite FTS5 full-text search for finding content — already used by context-mode plugin
- How Datasette (Simon Willison) exposes SQLite as a browsable interface — could be useful for `wazir stats`
- How Litestream handles SQLite replication — relevant if state.sqlite needs backup/sync
- SQLite WAL mode for concurrent reads during pipeline execution

---

## 14. Self-Audit V2 — Learnings + Trend Tracking + Severity

**What:** Current self-audit finds and fixes issues but doesn't learn from them. Needs a second pass.

**What's missing:**

1. **No learning** — findings should feed into `memory/learnings/proposed/`. If the same issue recurs across audits, it becomes an accepted learning injected into executor context to prevent the issue from being created.

2. **No comparison to previous audits** — each audit starts fresh with no awareness of what was found last time. Should track: "last audit found 12 issues, this time 8 — are they the same or new?" Trend detection across runs.

3. **Fixes are mechanical only** — can fix lint, stale exports, broken references. Can't fix architectural drift, skill degradation, logic issues. These become "manual required" that nobody acts on. Need: escalation path for manual findings (create a task? file an issue?).

4. **No severity or prioritization** — all findings are equal. Should have severity levels: critical (abort loop), high (fix now), medium (fix if time), low (log and skip).

5. **Doesn't audit its own effectiveness** — after 5 loops, did the fixes improve anything? Need a before/after quality score per loop to measure convergence quality, not just convergence count.

**Connection to item #13:** Self-audit findings should feed the SAME learning pipeline as review findings. Both are signals about recurring quality issues.

### Online Research
- How SonarQube tracks code quality trends across builds — severity levels, technical debt measurement
- How CodeClimate maintains quality scores over time — GPA model, trend detection
- How GitHub Advanced Security tracks recurring vulnerabilities — alert lifecycle (open → dismissed → fixed → reopened)
- How ESLint's `--cache` tracks which files have been linted before — incremental audit pattern
- How Snyk tracks dependency vulnerabilities across versions — recurring vs. new findings
- How PagerDuty/OpsGenie handle alert fatigue and dedup — relevant for finding dedup
- How Netflix Chaos Monkey evolved its audit approach — game days, severity escalation
- Academic: "Technical Debt Detection and Management" survey papers — automated detection patterns

---

## 13. Internal Review First, Codex Second + Review Findings Feed Learning

**What:** Restructure the review loop: internal review skill first (fast, cheap, expertise-loaded), Codex second (slow, expensive, fresh eyes). Review findings must feed the learning system.

**Current problem:**
- Everything goes to Codex first — slow, expensive, overkill for most findings
- Review findings are consumed and forgotten — same mistakes repeat across runs
- Wazir is not evolving from its own reviews

**New review flow:**
1. **Internal review** — `wz:reviewer` with full expertise modules composed in context (composition engine). Catches ~80% of issues. Uses Sonnet (not Opus). Fast and cheap.
2. **Fix cycle** — executor fixes internal findings, re-review internally until clean
3. **Codex review** — only AFTER internal review passes. Fresh eyes on clean code. Catches subtle issues the internal reviewer missed.
4. **Fix cycle** — executor fixes Codex findings
5. **Learning extraction** — ALL review findings (internal + Codex) feed into the learning system

**Review findings → Learning pipeline:**
- After each run, the learner role scans all review findings
- Findings that recur across 2+ runs → auto-proposed as learnings
- Recurring learnings get injected into future executor context
- Example: if Codex keeps finding "missing error handling in async functions" across 3 runs, that becomes an accepted learning injected into every future executor prompt
- This is how Wazir evolves — it stops making the same mistakes

**Reference skills:**
- superpowers: `requesting-code-review` (dispatches review subagent)
- CodeRabbit: `code-reviewer` (autonomous review agent)
- Wazir: `wz:reviewer` (phase-aware, multi-mode)

**Decision needed:** Should internal review use a dedicated review subagent (like superpowers) or the current inline reviewer skill?

### Online Research
- How superpowers `requesting-code-review` dispatches review subagents — architecture and prompt design
- How CodeRabbit AI review agent works — what it checks, how it structures findings
- How GitHub Copilot code review works — inline suggestions vs. PR-level review
- How Amazon CodeGuru Reviewer detects recurring patterns — ML-based finding detection
- How Google's Critique (internal code review tool) prioritizes findings
- How Facebook/Meta's Sapienz handles automated test generation from review findings
- How Sourcery.ai structures automated code review — rules vs. AI vs. hybrid
- How Qodo (formerly CodiumAI) generates review-driven test suggestions
- LangMem's prompt optimization from feedback — how review findings become prompt improvements
- Academic: "Learning from Code Reviews" — mining patterns from historical review data

---

## 12. Opus Orchestrator with Model-Aware Delegation

**What:** Opus acts as orchestrator and decides which model handles each sub-task. Not "Phase 3 uses Sonnet" — every sub-task across all phases gets the cheapest model that can do it.

**Examples:**
| Sub-task | Model | Why |
|----------|-------|-----|
| Orchestration / decisions | Opus | Needs judgment |
| Fetch URL content | Haiku | Mechanical, no reasoning |
| Read/summarize a file | Sonnet | Comprehension, not deep reasoning |
| Write implementation code | Sonnet | Good spec + plan = mechanical |
| Per-task code review | Sonnet | Diff review against clear spec |
| Spec hardening / design | Opus | Creativity + adversarial thinking |
| Final review (input vs impl) | Opus | Holistic judgment |
| Apply learnings | Sonnet | Structured extraction |
| Write handoff / compress | Haiku | Mechanical file operations |

**How:** Claude Code supports `model` field in agent frontmatter (`model: sonnet | opus | haiku | inherit`). Opus spawns subagents with explicit model overrides via the Agent tool.

**What needs to change:**
- Implement the `multi-model` mode in config (exists as option, never built)
- Add model-routing logic: Opus decides model per sub-task based on task complexity
- Composition engine dispatch includes model selection
- Skills/workflows annotate which sub-tasks are Haiku/Sonnet/Opus-grade

**Principle:** Not all clarifier sub-agents should be Opus. The agent that grabs data from the internet doesn't need Opus. The one that designs the architecture does.

### Online Research
- How BAMAS (Budget-Aware Multi-Agent Structuring) models cost budgets in multi-agent systems — academic paper
- How AutoGen/AG2 handles model routing across agent roles — model selection per agent
- How CrewAI assigns different LLMs to different agents — per-agent model configuration
- How LangGraph routes to different models based on task complexity — conditional model selection
- How OpenRouter handles model routing and fallback — API-level model selection patterns
- How Anthropic's own Claude Agent SDK handles model selection for subagents
- How Martian's model router selects optimal model per query — automated model routing
- Token cost comparison across models (Opus vs Sonnet vs Haiku) for different task types
- How the Mixture of Agents (MoA) pattern uses cheap models for drafting, expensive for refinement

---

## 11. Phase Reports Still Partially Prose-Based

**What:** The reviewer skill has instructions to generate phase reports per the new schema, but there's no executable code that auto-generates the JSON. It's skill prose telling the agent what fields to fill, not a function that produces it deterministically.

**What's needed:**
- A `tooling/src/reports/phase-report.js` module that builds the JSON from actual data (test results, lint output, diff stats)
- Wiring into the review workflow so reports are generated automatically, not by agent interpretation
- Between-phase reports (from commit 6c84455) are separate and still thin — need to be replaced or merged with the new schema

**Decision needed:** Should report generation be code (deterministic) or skill prose (agent-generated)? Or hybrid — code collects metrics, agent fills qualitative fields?

### Online Research
- How GitHub Actions produces structured job summaries — GITHUB_STEP_SUMMARY format
- How Jest/Vitest output structured test reports (JSON reporters) — machine-readable test results
- How Allure Report structures multi-dimensional test/quality reports
- How Datadog CI Visibility structures pipeline reports with metrics
- How OpenTelemetry structures observability data — spans, metrics, traces as structured data
- How CircleCI Test Insights tracks test results across runs with trend analysis
- How Buildkite annotations structure build reports with metadata

---

## 1. Continuous Learning Implementation (Decision #7)

**What:** Build the learning system. Design is done, implementation deferred.

**Context:** The original Wazir (v0.1.0 initial commit) already had:
- `memory/learnings/proposed/` → `accepted/` → `archived/` promotion path
- Learner role with scope tags, evidence, confidence
- Explicit review required before acceptance (no auto-apply)
- Templates: `templates/artifacts/learning-proposal.md`, `templates/artifacts/accepted-learning.md`
- Guard: fresh runs do NOT auto-load learnings by default

**What the new design adds (from learning-system-design.md):**
- User input capture (all messages, corrections, approvals as ndjson)
- Cross-run injection (top-K learnings loaded into next run's context)
- Drift budget (30% token ratio threshold per role)
- Feedback loop (auto-confidence adjustment based on recurrence)
- CrewAI-style adaptive scoring (semantic + recency + importance weights)

**Decision needed:** Build on existing `memory/learnings/` structure or replace with the new design?

### Online Research
- How CrewAI Memory system works — 4-layer memory (short-term, long-term, entity, contextual), adaptive scoring
- How LangMem SDK implements prompt optimization from feedback — gradient-based updates
- How LangGraph Store handles cross-session persistence with TTL and semantic search
- How Mem0 structures persistent memory — entities, relations, facts, temporal decay
- How Voyager (Minecraft agent) implements skill library as persistent learning — learning through play
- How RLHF (Reinforcement Learning from Human Feedback) pipelines structure feedback collection
- How Constitutional AI implements self-improvement from principles
- How OpenHands stores and retrieves agent experiences across sessions
- Academic: "Experience Replay in Multi-Agent Systems" — how agents learn from past interactions
- Academic: "Reflexion: Language Agents with Verbal Reinforcement Learning" — self-reflective learning

---

## 2. Restore Apply Learning + Prepare Next Task

**What:** The original pipeline had learn + prepare-next as final phases. Currently disabled.

**Context:**
- `workflows/learn.md` exists — learner role extracts learnings
- `workflows/prepare-next.md` exists — planner role creates clean handoff
- `skills/prepare-next/SKILL.md` exists — writes handoff using template
- Both are `enabled: false` in `phase_policy` in every run config

**Decision needed:** Enable these phases by default? Or only for deep-depth runs?

### Online Research
- How OpenAI Symphony's proof-of-work system handles post-execution learning and handoff
- How Devin handles context handoff between sessions — what persists, what's compressed
- How Claude Code's auto-memory (`/memory`) handles session-to-session learning
- How Anthropic recommends structuring long-running agent state — `claude-progress.txt` pattern
- How Cursor's .cursorrules evolve across sessions — do they learn?

---

## 3. Fix: Pipeline Doesn't Read `input/` Directory

**What:** `/wazir` and `/clarifier` don't scan `input/` for briefing materials automatically.

**Context:** User placed enhancement decisions in `input/` but the pipeline didn't pick them up. Had to manually create a briefing.

**Fix:** Scan both `input/` (project-level) and `.wazir/input/` (state-level) at startup. Present what's found, ask user which items to work on.

**Decision needed:** Should this be a skill fix or a CLI fix? Which takes priority — project `input/` or state `.wazir/input/`?

### Online Research
- How GitHub Spec-Kit reads `specs/` directory to auto-discover specs for implementation
- How Cursor reads `.cursor/rules/` to auto-load project context
- How aider handles file discovery and auto-inclusion — `.aider.conf.yml` patterns
- How Anthropic recommends structuring project context in CLAUDE.md

---

## 4. Remove Agent Teams From Pipeline

**What:** Remove the teams question and team_mode from the pipeline. Always sequential.

**Context:** User decided teams are not ready — too much overhead, experimental, Opus-only.

**Scope:**
- Remove teams question from `skills/wazir/SKILL.md` Step 3
- Remove teams question from `skills/init-pipeline/SKILL.md` Step 6
- Hard-default `team_mode: sequential` in run config
- Remove or stub the Agent Teams Structured Dialogue section in `skills/brainstorming/SKILL.md`
- Keep the code paths but don't expose the choice to users

**Decision needed:** Remove entirely or just hide the option?

### Online Research
- How Claude Code Agent Teams actually work now (2026) — stability, token consumption, real-world results
- How superpowers handles agent teams — their v5.0 approach
- How OpenAI Symphony handles parallel agent execution — supervision trees vs. teams
- When to revisit: track Claude Code team stability announcements

---

## 5. Remove 3 Init Questions

**What:** Stop asking depth, teams, and intent during pipeline init. Infer instead.

**Current questions removed:**
- "How thorough should this run be?" (depth) — default to standard, override via inline modifier (`/wazir deep ...`)
- "Would you like to use Agent Teams?" (teams) — always sequential (see #4)
- "What kind of work does this project mostly involve?" (intent) — infer from the request text

**Context:** These questions slow down the pipeline start. The user wants fewer questions, smarter inference.

**Decision needed:** What's the inference logic for intent? Options:
- Keywords: "fix" → bugfix, "add/build/create" → feature, "refactor/clean" → refactor
- Or just default to feature and let inline modifiers override

### Online Research
- How GitHub Copilot Workspace infers intent from issue descriptions — NLU for code intent
- How Linear auto-categorizes issues (bug/feature/improvement) from title/description
- How Jira Smart Commits parse commit messages for intent signals
- How aider infers what the user wants from natural language — no explicit intent selection

---

## 6. Deep Research: Codex CLI, Gemini CLI, Claude CLI

**What:** Research all three CLIs and create Wazir skills for each.

**Goal:** Make cross-tool orchestration a first-class Wazir capability.

**Current state:** Wazir uses Codex CLI for reviews (multi-tool mode with `codex exec`). No formal skill for it. Gemini CLI and Claude CLI not integrated at all.

**Research scope:**
- Full command surface of each CLI
- How to use them programmatically (non-interactive mode)
- Integration patterns (review, second opinion, parallel execution)
- What skills would be useful for Wazir

**Decision needed:** Priority order? Start with Codex (already used) or research all three in parallel?

### Online Research
- Codex CLI full documentation — `codex exec`, `codex review`, `codex exec review`, sandbox modes, model selection
- Gemini CLI documentation — `gemini` command surface, non-interactive mode, sandbox, model selection
- Claude CLI (Claude Code) documentation — `claude` command surface, `-p` print mode, `--model`, `--allowedTools`
- How OpenAI Symphony uses Codex CLI programmatically — the App-Server Protocol
- How superpowers integrates with multiple hosts (Claude Code, Codex, Gemini CLI, OpenCode, Cursor)
- How aider integrates with multiple LLM providers — model routing across providers
- Comparison: Codex sandbox vs. Claude Code sandbox vs. Gemini CLI sandbox — capabilities and limitations

---

## 7. Interactive Claude — Arrow-Key Selection

**What:** When Claude asks the user a question with options, use arrow-key selection instead of typing numbers.

**Reference:** https://github.com/bladnman/ideation_team_skill — does this really well in Claude Code.

**Also:** Remove all attempts to use interactive CLI prompts (`wazir init --force` with `@inquirer/prompts`). Arrow-key prompts ALWAYS fail in Claude Code's Bash tool. Handle init questions in the skill/conversation instead.

**Research needed:**
- How does bladnman/ideation_team_skill implement arrow-key selection?
- Is this a Claude Code native capability (AskUserQuestion with options)?
- Can we use it in skills without external dependencies?

**Decision needed:** Is this a Claude Code platform feature we can use, or does it require a custom implementation?

### Online Research
- https://github.com/bladnman/ideation_team_skill — how it implements interactive selection in Claude Code
- Claude Code `AskUserQuestion` tool — does it support structured options with selection?
- How Inquirer.js handles prompts in non-TTY environments — relevant for understanding why CLI prompts fail
- How superpowers handles user interaction in skills — numbered lists vs. native selection
- How Cursor handles inline user choices — dropdowns, quick-pick menus
- How VS Code extension API handles `showQuickPick` — native selection pattern
- How GitHub CLI (`gh`) handles interactive prompts with `--prompter` — cross-environment pattern

---

## 8. Skill Tier Re-evaluation

**What:** Currently all 25 skills are Own tier. Re-evaluate whether some can be Delegate.

**Approach:**
1. Move Command Routing + Codebase Exploration preambles from every SKILL.md to CLAUDE.md
2. Re-evaluate: without preambles, which skills are pure superpowers forks?
3. Candidates for Delegate: finishing-a-development-branch, dispatching-parallel-agents, using-git-worktrees, receiving-code-review, requesting-code-review

**Blocker:** Superpowers shadowing is full-override (R2 finding). Even if we delegate, we can't augment. It's all-or-nothing per skill.

**Decision needed:** Is it worth the effort to delegate 5 skills? Trade-off: less maintenance vs. less control.

### Online Research
- Superpowers v5.0.5 skill loading mechanism — `skills-core.js` resolveSkillPath() behavior
- Claude Code native skills directory (`~/.claude/skills/`) — how discovery and priority work
- How other Claude Code plugins handle skill conflicts with superpowers
- Superpowers roadmap — any planned extensibility/composition mechanism?

---

## 9. PreToolUse:Write and PreToolUse:Edit Hook Errors

**What:** These hooks are throwing errors. Needs investigation.

**Decision needed:** Priority? Is this blocking anything?

### Online Research
- Claude Code hooks documentation — PreToolUse hook contract, exit codes, error handling
- How superpowers hooks handle errors — their error recovery patterns
- Claude Code GitHub issues related to hook errors — known bugs or limitations

---

## 10. Clarifier Overhaul Reconciliation

**What:** A 14-issue clarifier overhaul was in progress (paused at Phase 1A review pass 1) before this session. The changes we shipped may conflict.

**Decision needed:** Resume the overhaul or consider it superseded by the enhancement session changes?

### Online Research
- No online research needed — this is internal reconciliation. Compare the 14 issues against what was shipped.

---

## 18. ENFORCE Pipeline — Agent Must Never Skip Phases

**What:** The Wazir pipeline was completely bypassed in a real run. The agent saw a detailed input and skipped clarify/specify/design/plan/verify/review — went straight to parallel implementation. This defeats the purpose of Wazir.

**Root cause:** The `/wazir` skill says "Run the entire pipeline end-to-end" but has no enforcement mechanism. The agent can rationalize "the spec is already clear" and jump to execution. There's no hard gate that prevents this.

**How to enforce:**
1. **Mandatory phase artifacts** — execution phase MUST NOT start without: clarification.md, spec-hardened.md, design.md, execution-plan.md in the run directory. The executor skill should CHECK for these files and REFUSE to start if they're missing.
2. **Phase entry validation** — `wazir capture event --phase execute` should fail if the previous phases haven't completed (check events.ndjson for phase_exit events)
3. **Skill-level hard gates** — each phase's skill should verify the previous phase's artifact exists before proceeding. Not a suggestion — a file-existence check that blocks.
4. **Antipattern entry** — add "skipping pipeline phases because the input looks clear enough" to `expertise/antipatterns/process/ai-coding-antipatterns.md`

**This is the most important enforcement in Wazir.** If the pipeline can be bypassed, nothing else matters.

### Online Research
- How CrewAI Task Guardrails enforce mandatory phase completion before advancing
- How LangGraph's `interrupt()` creates hard gates that can't be rationalized away
- How GitHub Actions enforces job dependencies — `needs:` field prevents out-of-order execution
- How Temporal.io enforces workflow step ordering — each step must complete before the next starts

---

## 17. Content Author Should Activate for Any Content Need

**What:** Currently content-author phase is disabled by default and documented as "for content-heavy projects." Wrong framing — it should activate whenever ANY task needs content of any kind.

**Examples where content-author should activate:**
- Database seeding (seed data, fixtures, sample records)
- Sample content for UI (placeholder text, demo data)
- Test fixtures (mock API responses, test data files)
- Translations / i18n strings
- Copy (button labels, error messages, onboarding text)
- Documentation content (user guides, API docs)
- Email templates, notification text

**Current state:**
- `workflows/author.md` exists — content-author role writes non-code content
- `roles/content-author.md` exists — with i18n, editorial, humanize expertise
- `composition-map.yaml` has content-author entries for 15+ concerns
- Phase is `enabled: false` by default in phase_policy

**What needs to change:**
- The clarifier should detect content needs during spec hardening and auto-enable the author phase
- Author phase should run AFTER spec approval, BEFORE planning (so the plan includes content tasks)
- Content artifacts should be reviewed like any other artifact

### Online Research
- How Contentful / Sanity handle content modeling and structured content — content-as-data patterns
- How Storybook handles sample content / mock data for component development
- How i18n frameworks (i18next, react-intl) handle content authoring workflows
- How Faker.js / seed libraries structure realistic seed data generation
- How design systems handle content guidelines (voice/tone, placeholder standards)
