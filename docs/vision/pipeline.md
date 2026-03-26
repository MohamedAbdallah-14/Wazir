# Wazir Pipeline — Source of Truth

> This document is the grounding reference for all pipeline decisions. Any change to Wazir must be measured against this: does it move closer to or farther from this vision?

## What Wazir Is

A pipeline inside Claude (and other hosts) that enforces agents to work scientifically and follow engineering team best practices. The goal: give anyone access to a high-end software house — encoding a decade+ of software engineering experience into the pipeline itself. Quality of output always wins over cost. Every phase runs. No shortcuts.

## The Core Problem

AI agents degrade on long tasks. Context rot, overconfidence, instruction-following decay, sycophancy — none of this shows on small tasks, but the deeper the session the greater the effect. Users compound this by providing vague input and assuming the agent knows best practices, prior art, and domain context. It doesn't.

The pipeline solves both sides: it forces rigorous process on the agent (research, clarify, specify, review, design, review, plan, review, execute, review, verify, final review, learn) and it forces rigorous input extraction from the user (two inherent interaction points in guided mode, business questions only).

## Research Basis

This pipeline is grounded in 47 research files from parallel research agents.

### Pre-Execution Research (27 files)

- **3 competing repos**: obra/superpowers (v5.0.5), github/spec-kit (SDD, 82K stars), Fission-AI/OpenSpec (delta-based)
- **10 tools analyzed**: gpt-engineer, aider, mentat, CrewAI, AutoGen, ChatDev, MetaGPT (ICLR 2024), Devin (67% PR merge), Codex CLI, Cursor/Windsurf/Bolt
- **AI failure modes**: SWE-bench empirics (80.9% Verified, 17.8% private Pro), context degradation (13.9-85% from length alone), "Lost in the Middle" (proven unfixable), overconfidence (64.5% blind spot, 99% CI correct only 65%), planning-execution gap (38.5% completion even with human plans), multi-agent review (cross-context F1 28.6% vs same-session 24.6%)
- **Academic foundations**: 40+ years requirements engineering (IEEE 830/ISO 29148), CHAOS reports (37% of failures = requirements), Boehm's cost curve (1x → 100x), TDD empirics (40-90% defect reduction), property-based testing (TiCoder: 45.73% improvement)
- **Industry methodologies**: Google design docs, Amazon PR-FAQ, Rust RFCs, Python PEPs, Kubernetes KEPs, Shape Up, ThoughtWorks inception, Pivotal D&F, IDEO Double Diamond, ADRs
- **Multi-agent research**: DeepMind scaling (17.2x error amplification independent, 4.4x centralized, saturates at ~4), Agyn team (72.2% SWE-bench, reviewer = +7.4%), heterogeneous models as "universal antidote"
- **Task decomposition**: INVEST criteria, vertical slices, WBS 100% rule, 35-minute degradation cliff (Zylos 2026), doubling-quadrupling failure law

Full corpus: `docs/research/2026-03-25-vision-research/` (27 files, 6 categories)

### Execution Research (20 files)

- **20 production systems**: Devin, Augment Code, Cursor 2.0 (8 parallel agents), Amazon Q, Google Jules, Replit Agent, OpenHands (72% SWE-bench), mini-SWE-agent (100 lines = 74%), Agentless ($0.70/task), Aider, Codex CLI, Claude Code Teams, Kiro, Cosine, Zencoder, Poolside, Factory, Windsurf, Google Antigravity, GitHub Copilot
- **Patch/diff**: Apply model (98% at 10,500 tok/s — Morph), diff accuracy degradation (85% small → 60% large → 45% recently modified), content-based anchoring, layered fallback
- **Merge conflicts**: 10-20% of merges conflict (Ghiotto et al.), 26x bug rate on manual resolution, auto-discovery eliminates convergence-point conflicts, 3-5 agents practical ceiling
- **DAG engines**: 12 systems (Airflow, Temporal, Prefect, GitHub Actions, Argo, Dagster), Kahn's algorithm, 6 failure strategies
- **Verification**: 93%/58% coverage/mutation gap, separate test agent doubles accuracy (91.5% vs 61%), oracle problem (54%), two-stage review #1 factor, 64.5% self-correction blind spot
- **Context rot**: Lost in the Middle proven architectural, 35-min cliff, 4K output cliff, prompt repetition 47/70 wins, observation masking beats summarization
- **MAKER decomposition**: m=1 optimal, k=3 voting drops error 1% → 0.0001%, small non-reasoning models best reliability-per-dollar, Claude Sonnet half-life 50% at 59 min / 80% at 15 min
- **Anti-patterns**: 15 failure modes, 3 meta-patterns, 67.3% AI PRs rejected vs 15.6% manual
- **Composition**: 9 frameworks, ~150-200 instruction budget, expert personas hurt coding accuracy (Wharton), three agentic pillars +20%

Full corpus: `docs/research/execution/` (20 files, 7 categories)

### Hard Design Constraints

| Constraint | Value | Source |
|------------|-------|--------|
| Task duration cliff | 35 minutes | Zylos 2026 |
| Output instruction adherence cliff | 4,000 tokens | LongGenBench ICLR 2025 |
| Multi-turn degradation | 39% average drop | Laban et al. Microsoft 2025 |
| Context alone hurts (perfect retrieval) | 13.9-85% | Du et al. EMNLP 2025 |
| Lost in the Middle | Architectural, proven at initialization | Chowdhury 2026 |
| Effective context for reasoning | 10-20% of nominal | BABILong NeurIPS 2024 |
| Instruction budget per prompt | ~150-200 items | arXiv 2507.11538 |
| 85% per step, 10 steps | 20% total success | Compound probability |
| Claude Sonnet half-life | 50% at 59 min, 80% at 15 min | Toby Ord May 2025 |
| Self-correction blind spot | 64.5% | Tsui 2025 |
| Cross-model ensemble gain | ~9% | Lu et al., 37 models |
| Review improvement saturation | 75% in rounds 1-2 | Yang et al. EMNLP 2025 |
| Merge conflict rate | 10-20% | Ghiotto et al. |
| Manual conflict resolution bug rate | 26x higher | Empirical |
| Parallel agent ceiling | 3-5 | Multiple sources |
| Coverage vs mutation gap | 93% / 58% | FinTech case study |
| Separate test agent accuracy | 91.5% vs 61% | AgentCoder |
| Constrained decoding compliance | 100% vs 40-74.5% | OpenAI, Anthropic |
| Haiku SWE-bench | 73.3% (matches prev-gen Sonnet) | Leaderboard |

---

## Architecture

### Minimal Orchestrator Context

The main session is the orchestrator. It holds pipeline state, dispatches subagents, reads their condensed summaries, makes routing decisions, and interacts with the user. It never does heavy cognitive work itself.

**Every context-heavy operation happens in a subagent with a fresh, focused context window.**

### Agents Are Stateless Workers

Every agent is born, does one job, writes output to disk, and dies. No agent carries state from a previous agent. No agent talks to another agent. No agent knows about the pipeline.

This is research-mandated:
- Context poisoning has no fix except session death ("no wake-up prompt can fix it")
- Multi-turn conversations degrade 39% (Laban et al. Microsoft 2025)
- Self-correction without external feedback degrades performance (64.5% blind spot)
- Fresh context per step is Anthropic's own production recommendation

**Design override: no same-session fixes.** An earlier design considered keeping agents alive for fix feedback (the "Wait" pattern). Rejected. The research is unambiguous: multi-turn degradation, context poisoning, and self-correction blind spots all compound. A fresh fix agent reads current output + error/findings from disk — full context without context rot.

### The File System Is the Communication Bus

Agents communicate by reading from and writing to disk. No agent-to-agent messages. No shared memory. No context passing. Files are the only channel. This eliminates the coordination failures that account for 79% of multi-agent system failures (Cemri et al. NeurIPS 2025).

### The Orchestrator Is a State Machine

Not an LLM doing reasoning. A deterministic scheduler that reads the DAG, identifies dispatchable work, dispatches agents, reads status files, and routes to the next stage. One process, one state file, no concurrent access.

### The Subagent Contract

Every subagent:
1. **Writes the full artifact to disk** (detailed output — research, spec, review report, code)
2. **Returns a summary to the orchestrator** (~200 tokens, enough to route decisions)

Subagent summaries require a mandatory schema enforced via constrained decoding, same as status.json. The schema must include: completion status, output artifact locations, key decisions made (max 3), files modified, open questions, blocking issues (required for routing NEEDS_CONTEXT/BLOCKED/FAILED), and downstream impacts. Mandatory fields act as a checklist — the summarizer cannot silently drop file paths or decisions. The specific field-level schema is defined in the subagent contract implementation spec. Research basis: Factory AI — structured summaries with mandatory sections scored 0.35 points higher on factual retention.

The orchestrator routes on summaries. Downstream subagents read full artifacts from disk when they need depth.

### The Composer

A deterministic function (not an LLM) that reads a subtask.md and `expertise/composition-map.yaml` and produces an agent configuration.

1. Reads subtask.md — extracts model tier, tools, expertise declarations, context files, constraints
2. Resolves expertise modules via layered lookup:
   - `always.<role>` — baked in for every invocation of that role
   - `auto.all-stacks.all-roles` — security, secrets, performance, tech-debt
   - `stacks.<detected-stack>.<role>` — stack-specific modules
   - `concerns.<declared-concerns>` — task-specific modules
3. Maps model tier to host-specific model ID via config table
4. Assembles prompt from structured XML sections with context budgeting
5. Returns complete agent config ready for dispatch

**Prompt assembly rules:**
- ~150-200 instruction budget (beyond that, linear decay for frontier models, exponential for smaller)
- Critical instructions at START and END (Lost in the Middle is architectural)
- Prompt repetition: critical constraints and acceptance criteria duplicated at START, END, and immediately before the task specification. Zero-cost technique: 47/70 benchmark wins, 0 losses (Leviathan et al., Google Research, Dec 2025). The Composer duplicates the constraint block — this is mechanical, not LLM-decided.
- Positive instructions dominate ("always do X" beats "don't do Y")
- Operational identity, not expert persona ("coding agent" beats "world-class engineer")
- Three agentic pillars: persistence + tool-use + planning (~20% SWE-bench improvement)
- Expertise modules ARE the domain knowledge — Wazir's moat
- Within-session tool output management: observation masking as default. Old tool outputs are trimmed to placeholders, action/reasoning history is preserved. The Composer configures `max_tool_output_tokens` per agent based on model tier. Outputs exceeding this are truncated with a pointer to the full output on disk. The born-work-die model mitigates most context bloat, but tool-heavy agents (executors, verifiers) can fill their effective window within a single session. Research basis: JetBrains Dec 2025 — observation masking beats LLM summarization in 4/5 settings (+2.6% solve rate, 52% cheaper).

### Codebase Intelligence

The pipeline's retrieval layer. Deterministic CLI tooling, not LLM-based. Three indexed layers:

- **L1 Structural**: AST-based parsing for every supported language. Produces: dependency graph (import/export edges), symbol table (functions, classes, types with locations), repo map ranked by dependency centrality (~5-10% of context budget, delivered to every agent via the Composer).
- **L2 Text**: Trigram index for exact and fuzzy text search. Fast keyword lookup without LLM involvement.
- **L3 Semantic** (optional): AST-aware chunking with code-specific embeddings. Used when L1+L2 are insufficient for localization (ambiguous names, cross-cutting concerns). Not required for every project.

Incremental refresh via content hashing per file. Cost is O(changes), not O(repo). Agents consume index results via the Composer's context budget directives — READ FULL (with line count), READ SECTION (with ranges), KNOW EXISTS. The repo map is always included. File-level retrieval uses L1 graph traversal for dependency-driven scope, L2 for keyword search within scope.

Research basis: Aider repo map uses 4.3-6.5% of context vs 54-70% for iterative search agents. Hybrid retrieval (structural + text) improves recall 15-30%. AST-based chunking improves Recall@5 by 4.3 points over line-based. Deterministic AST graphs are 70x faster and 20x cheaper than LLM-extracted.

### Enforcement Invariants

The vision describes desired architecture. This section specifies what mechanically forces compliance. Without mechanical enforcement, prompt-only compliance caps at ~40-50% for complex pipelines (5 production sessions confirmed 40%). Compound probability: at 95% per-step compliance, a 10-step pipeline succeeds 59% of the time. At 99% per-step, 90%. Mechanical enforcement targets 99%+.

**Capability Restrictions** (what agents CAN do):
1. The orchestrator MUST NOT have Write/Edit tools — tool allowlist enforcement prevents the orchestrator from doing work inline
2. Bash MUST be restricted via per-phase command allowlists — unrestricted Bash defeats all tool restrictions
3. Agents MUST NOT be able to modify their own constraints — no self-referential tool access

**Process Gates** (what MUST happen before proceeding):
4. Pipeline state MUST be created by a mechanical gate (hook/bootstrap), not by the agent — the gate's existence proves the pipeline is running
5. Every phase gate MUST have a mechanical check: artifact exists + schema valid + state updated. No phase advances on agent self-report alone

Known limitations: hooks fail-open on crash (the orchestrator must handle hook failure as a blocking error, not silently proceed). Semantic evasion via Bash exists (agent encodes commands as strings). Hooks cannot modify tool input, only block tool calls. Documented so implementers design around them.

Research basis: PCAS (ICSE 2026) — deterministic reference monitor raised compliance from 48% to 93%. Bootstrap gate was the breakthrough that enabled first autonomous pipeline following.

### Hybrid Verification Architecture

The review architecture is hybrid: deterministic tools + LLM reviewers. Not LLM-only.

- **Deterministic tools** handle known-pattern detection: static analysis rules, data flow patterns, known vulnerability signatures, code complexity metrics. Zero blind spot drift, millisecond execution, cheap. Results are authoritative for patterns they cover.
- **LLM reviewers** handle novel-pattern detection: semantic understanding, context-dependent quality assessment, design coherence, specification alignment. Expensive but catches what rules cannot express.
- **Interaction**: LLM reviewers receive deterministic tool findings as input context. They classify findings (true positive / false positive / needs-investigation) rather than independently discovering known patterns.

Specific tool choices are implementation decisions resolved via the Composer's config tables. The vision specifies the hybrid architecture pattern.

Research basis: hybrid LLM + traditional-tool approach is strictly superior to LLM-only. Semgrep Multimodal: 8x more true positives, 50% less noise. Combined SAST + LLM filtering eliminates 94-98% of false positives. The 64.5% self-correction blind spot is shared across all LLM families — cross-model review diversifies LLM blind spots but cannot close a modality gap.

### User Interaction Model

The pipeline has **two inherent interaction points** where information flows between user and pipeline:

1. **Clarify** — scope, constraints, requirements. Business questions only.
2. **Design** — pick a direction from 2-3 presented options with opinionated recommendation.

Three interaction modes control how these points (and additional checkpoints) are handled:

| Mode | Behavior | Best for |
|------|----------|----------|
| **Auto** | Zero human stops. External reviewer (Codex/Gemini) acts as gating agent for all decisions. Escalates to human only on cap exceeded or "not doable." | Overnight runs, clear specs. Requires multi-tool mode. |
| **Guided** | Pauses at the 2 interaction points (Clarify questions, Design choice). Boundary gates between pre-execution → execution and execution → completion ("continue or wait?"). Everything else autonomous. | Most work. The default. |
| **Interactive** | Stops between every sub-phase. Pair-programmer tone — discusses findings, co-designs, helps the user think through clarification and plan. | Ambiguous requirements, new domains, visual design collaboration. |

**Boundary gates** (guided and interactive): after pre-execution completes and after execution completes, the pipeline pauses with "continue or wait?" — not an information exchange, just a go/no-go for the user to review artifacts or take a break.

The user can optionally review final artifacts in any mode.

### Project Initialization

Init is project infrastructure setup — it runs before any pipeline run, like `git init` before `git commit`. It is not a pipeline interaction point.

**Principle: never assume configuration.** The pipeline asks explicit questions for every decision that affects how it operates. No zero-config defaults for choices that depend on the user's setup.

**Init flow:**

1. **Pre-bootstrap prerequisite:** Verify Wazir CLI is installed. If missing, show install instructions and stop. This is the one check that runs before `wazir capture ensure` because bootstrap requires the CLI.
2. **Dependency health check** (automatic, no questions): context-mode MCP availability, `wazir doctor` health. Missing context-mode warns but does not block.
3. **Model mode** (question): single model, multi-model (route tasks by tier), or multi-tool (current model + external CLI tools for cross-model review). No recommended default — depends on user's setup.
4. **Multi-tool configuration** (conditional question): which external tools (Codex/Gemini/both), which models. Privacy notice: multi-tool sends code to external providers. Missing tools fall back to single model.
5. **Interaction mode** (question): auto (zero human stops, external reviewer as gating agent, requires multi-tool), guided (pause at 2 interaction points + boundary gates between pipeline parts), or interactive (stops between every sub-phase, pair-programmer collaboration). Stored as project default, overridable per-run via inline modifiers.
6. **Auto-detect and report**: host, stack, project — no questions.
7. **Write config**: `config_version: 2` schema. No credentials — only tool names and model choices.

**Reinit:** Explicit only via `/wazir init`. Deletes config file (preserves run history), re-asks all questions. Normal `/wazir` calls show a one-line config summary and proceed without prompting.

**Per-run checks stay in Phase 1, not init:** Branch safety (are you on main?), index freshness, resume detection. These are per-run invariants that can change between runs. Init owns one-time project setup only.

**Per-run override:** `interaction_mode` from project config seeds each run's `run-config.yaml`. Inline modifiers (`/wazir auto ...`, `/wazir interactive ...`) override without changing stored config.

Full specification: `docs/vision/pipeline-init.md`

### State Management

Files for everything. No database. The access pattern (single-threaded orchestrator, one writer per file, sequential stages per subtask, parallel subtasks in separate worktrees) eliminates concurrent write problems.

**Research note**: execution research recommends SQLite over files. This pipeline departs from that recommendation because Wazir's access pattern has no concurrent writers. SQLite adds complexity without solving a real problem given this architecture. If the orchestrator ever becomes multi-process, revisit.

Append-only event log records every state transition. If the state file is lost, replay events to reconstruct. Event sourcing — the log is the authority, the state file is a materialized view.

---

# Pipeline Parts

The pipeline has three parts, each in its own file. This root document contains the shared architecture, principles, and design decisions that govern all three.

| Part | File | Scope |
|------|------|-------|
| **I. Pre-Execution** | [`pipeline-clarify.md`](pipeline-clarify.md) | 8 phases: Discover → Clarify → Specify → Review → Design → Review → Plan → Review. Three interaction modes (auto/guided/interactive). Review mechanism. |
| **II. Execution** | [`pipeline-execute.md`](pipeline-execute.md) | Subtask pipeline (Execute → Review → Verify → Done), status protocol, parallel execution, failure handling, batch handover. |
| **III. Completion** | [`pipeline-complete.md`](pipeline-complete.md) | Integration verification, concern resolution, 4-pass final review, learning system, session handover. |
| **Init** | [`pipeline-init.md`](pipeline-init.md) | Project initialization: dependency checks, model mode, interaction mode, config schema. |

---

## Output Structure

```
.wazir/runs/<run-id>/
├── execution-state.json         — orchestrator state (one writer)
├── events.jsonl                 — append-only audit trail
├── execution-summary.md         — (complete) or handover-batch-N.md (incomplete)
├── completion/
│   ├── integration/
│   │   ├── test-results.json
│   │   ├── typecheck-results.json
│   │   ├── lint-results.json
│   │   ├── integration-status.json
│   │   └── analysis-findings.json
│   ├── concerns/
│   │   ├── resolved.md
│   │   ├── escalated.md
│   │   ├── deferred.md
│   │   └── systemic.md
│   ├── final-review/
│   │   ├── pass-1-drift.md
│   │   ├── pass-2-audit.md
│   │   ├── pass-3-cross-model.md
│   │   └── pass-4-signoff.md
│   └── learnings/
│       ├── review-patterns.md
│       ├── planning-gaps.md
│       ├── concern-patterns.md
│       ├── model-performance.md
│       ├── review-effectiveness.md
│       └── proposed-updates.md
└── worktrees/                   — per-subtask isolation (cleaned after merge)
```

Per-subtask worktrees also contain `analysis-findings.json` (deterministic analysis results) alongside existing `status.json`, `findings.md`, and `proof.json`.

---

## Principles

1. **Quality always wins over cost.** Context costs are real but acceptable.
2. **Every phase runs.** No skipping because "scope seems clear."
3. **The plan IS the intelligence. Execution IS mechanical.** Cheap models execute well-written subtasks.
4. **Every agent is born, does one job, and dies.** Fresh context per stage. No session continuity.
5. **Fresh agents for fixes, always.** No same-session fix loops. Context rot is worse than one extra spawn.
6. **The file system is the communication bus.** No agent-to-agent communication.
7. **The orchestrator is a state machine, not an LLM.** Deterministic scheduling.
8. **The composer is a function, not an agent.** Deterministic module resolution.
9. **Expertise modules are the domain knowledge.** composition-map.yaml is Wazir's moat.
10. **Review is expertise-trained.** Each reviewer gets the antipatterns and quality standards relevant to its subtask.
11. **Verification generates proof, not assertions.** Evidence that acceptance criteria are met.
12. **Merge conflicts are a planning failure.** File dependency matrix + auto-discovery = zero conflicts.
13. **Self-assessment is untrustworthy.** Agents report evidence. Orchestrator and reviewers determine truth.
14. **Constrained decoding for all structured output.** Zero tolerance for format errors.
15. **Concerns are checked at batch boundaries, not just at the end.** Early signals prevent cascading failures.
16. **The original user input is the only ground truth.** Drift is measured from the source.
17. **Final review is the hardest gate.** 4 passes: 2 internal + 2 cross-model. No shortcuts.
18. **Cross-model review is structural, not optional.** 64.5% blind spot demands it.
19. **Concerns are innocent until proven acceptable.** Burden of proof is on the resolution.
20. **Learning feeds back into expertise.** Every run generates prioritized proposals. The flywheel is core.
21. **The pipeline knows when to stop.** If 4 passes can't resolve findings, escalate — don't loop.
22. **Every run ends with a deliverable.** Complete → summary. Incomplete → handover.
23. **Cost controls are structural.** max_steps, max_cost, max_wall_clock, max_retries. Cheap before expensive.
24. **Wazir doesn't fall for appearances.** Input that looks good isn't assumed to be good.

---

## Design Decisions (Do Not Revisit Without Evidence)

| Decision | Rationale | Override Condition |
|----------|-----------|-------------------|
| 2 inherent interaction points (Clarify, Design) | Business questions to user, technical to agents. Auto proxies both to gating agent, guided pauses at both, interactive adds sub-phase checkpoints. | Never — interaction model is load-bearing |
| Fresh agents, never same-session | 39% degradation, unfixable context poisoning | Never — research is unambiguous |
| Files not SQLite for state | Single-threaded orchestrator, no concurrent writers | Orchestrator becomes multi-process |
| 4 final review passes | 75% in rounds 1-2, cross-model for blind spots, >4 diminishing | Learning data showing 5th pass consistently catches missed category |
| Internal passes before cross-model | Fix cheap issues before burning highest-tier tokens | Never — cost-optimal by definition |
| Targeted fixes not full re-execution | Scoped context prevents pollution | Learning data showing >30% regression rate |
| Learning proposes, never auto-applies | Expertise changes affect all future runs | Never — human-in-the-loop is safety invariant |
| Concerns resolved before final review | Final review sees resolved state, not raw accumulation | Never — ordering is load-bearing |
| Concurrency ceiling of 4 | 10-20% conflict rate, 26x bug rate, DORA research | Production data showing 5+ works reliably |
| Auto-discovery for convergence points | Eliminates the primary merge conflict source | Never — the alternative is manual conflict resolution |
| 3 fix attempts per stage | Balances cost vs recovery probability | Learning data on optimal retry count |
| Executor writes tests (TDD) not separate agent | Verifier catches tautological tests as compensation | Learning data showing persistent test quality problems |
| Hybrid deterministic + LLM review | LLMs hallucinate data flow paths; 64.5% blind spot is cross-model; deterministic tools have zero drift for known patterns | Never — modality gap is structural |
| Mechanical enforcement required | Prompt-only caps at 40-50%; compound probability demands 99%+ per-step | Never — the math doesn't change |
| Secrets gating on every commit | LLM-generated code leaks 40% more; $4.88M average breach cost | Never — liability concern |
| Supply chain verification on dependency changes | 5-21% package hallucination rate; +156% YoY supply chain attacks | Never — security boundary |
| Interactive-first init, never assume config | Users have different model setups, tool availability, and interaction preferences. Zero-config biases toward defaults the user never chose. | Learning data showing >90% of users accept defaults unchanged |
| Init is project setup, not a run interaction point | Vision's 2 interaction points (Clarify, Design) are per-run. Init is infrastructure like `git init`. | Never — architectural distinction |
| Branch and index checks per-run, not init-only | Users switch branches and indexes go stale between runs. These are runtime invariants. | Never — per-run checks are load-bearing |
| Heavy scaffolding over minimal | mini-SWE-agent (100 lines) achieves 74% SWE-bench; minimal scaffolding trends upward as models improve. Wazir targets complex multi-file tasks where scaffolding value is highest. | Learning data showing >90% success on Wazir-class tasks without pipeline phases |
| Executor combines reasoning + editing | Architect/Editor split achieves 85% accuracy, Morph apply model 98% at 10,500 tok/s. Current single-executor is simpler; review/verify stages catch edit failures. | Learning data showing >20% of failures are formatting/edit-application errors — then split via Composer model routing |

---

## Document Status: LOCKED

This document is locked as of 2026-03-25. It is the source of truth for all Wazir pipeline decisions — pre-execution, execution, and completion. Changes require: (1) evidence from the learning system or new research, (2) a specific section to modify, (3) reasoning for why the change improves quality. Targeted amendments only.
