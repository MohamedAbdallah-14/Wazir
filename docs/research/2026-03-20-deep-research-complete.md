# Deep Research Complete — 2026-03-20

## 25 Research Agents — ALL COMPLETED

Total output: ~6.8MB across 25 agents. Full transcripts at:
`/private/tmp/claude-501/-Users-mohamedabdallah-Work-Wazir/96398c18-9868-43bc-a4d6-d7f388880d4a/tasks/`

## Executive Summary

### The Architecture for Wazir v2

**Three-layer enforcement pyramid:**
1. **Hooks** (mechanical, can't bypass): Stop blocks completion, PreToolUse blocks writes/commits/pushes
2. **Subagent isolation** (architectural, can't see full pipeline): one agent per phase, controller holds the loop
3. **Persuasion engineering** (behavioral, won't bypass): superpowers-style rationalization tables, red flags, authority language

### Key Findings

**Hooks:**
- Stop hook CAN block completion (`{"decision": "block"}`) — proven by ralph-loop (492+ iterations)
- PreToolUse has 7 decision patterns: silent allow, advisory, systemMessage, modify, JSON deny, exit-code deny, echo-trick redirect
- State tracking via `pipeline-state.json` — hooks read, CLI writes, atomic temp+rename
- Critical limitations: hooks can block but not compel; "hook error" labels poison the model; SubagentStop is broken; agent can escape via AskUserQuestion
- Must check `stop_hook_active` to prevent infinite loops; must allow context-limit and user-abort stops

**Subagent Architecture:**
- Controller-as-orchestrator: wz:wazir holds the loop, dispatches one subagent per phase
- Each subagent gets fresh 200K context (~165K usable after overhead)
- No nesting (depth=1) — controller dispatches ALL subagents directly
- File-mediated handoff (MetaGPT pattern): artifacts on disk, not in context
- Artifact dependency: each artifact has `requires` block with predecessor digest for staleness detection
- Guardrail functions per phase boundary with concrete pass/fail criteria
- Retry ladder: same-model×2 → model-escalation×1 → human escalation
- Error classification: transient (retry), quality (retry+feedback), deterministic (escalate), resource (model-escalate)

**Persuasion Engineering:**
- Superpowers is 100% prompt engineering, zero mechanical enforcement — and agents STILL skip (issue #463)
- Meincke et al. 2025: persuasion doubles compliance (33%→72%, N=28,000, p<.001)
- Best combination: Authority + Commitment + Scarcity
- CSO critical: skill descriptions must be triggers only, never process summaries
- 47 rationalization entries across 5 superpowers skills — Wazir has ZERO
- "Violating the letter is violating the spirit" — single most impactful sentence
- TDD for skills: RED (observe baseline failures) → GREEN (write skill addressing those) → REFACTOR (close new loopholes)

**Learning System:**
- 4-stage pipeline: Tally → Candidate → Promote → Active
- Findings classified by 8 categories × 4 severity levels
- Recurrence detection via finding_hash dedup (PagerDuty pattern)
- Semi-automatic promotion: auto-propose, human-approve (CodeGuru + Snyk model)
- Drift prevention: 30 active project learnings max, 90-day TTL, 5% hit-rate demotion, principle consolidation at 25+ entries
- Decision audit trail: v2 schema with category, alternatives, confidence, outcome_ref, supersedes
- User feedback: capture corrections/approvals in ndjson, classify signal vs noise

**Review Architecture:**
- Two-tier: internal (Sonnet, expertise-loaded, pattern-matching) → external (Codex, fresh eyes, unknown-unknowns)
- Critical finding: reviewer always-layer is 99K tokens against 50K ceiling — 5 of 8 modules are dropped
- Fix: mode-specific reviewer composition (different modules per review mode)
- Reviewer digest modules: 3-5K tokens each (not 12K originals)
- Findings classified by 8 categories (correctness, security, completeness, wiring, verification, drift, performance, style)
- Auto-classification rules per category with severity floors
- Feedback-to-learning: 7-step loop, LLM-assisted clustering for pattern detection

**Interactive UX:**
- AskUserQuestion: 1-4 questions, 2-4 options each, arrow-key selection, multiSelect supported
- Bug: DO NOT list in skill's allowed-tools (causes empty answers)
- Progressive disclosure: status line (what) → paragraph (why) → full report (everything)
- Key formula: "Name the action. State the dependency. Omit the journey."
- 5 progress patterns: phase map, meaningful updates, artifact previews, time estimates, heartbeat
- Heartbeat: never >2min silence (standard), >90s (deep), >3min (quick)
- Steerability: classify mutation level → show impact → selective regeneration → preserve completed work
- Three modes: auto (gating agent steers) / guided (checkpoints steer) / interactive (continuous steer)

## Agent Output Index

| # | Agent | Key Deliverable |
|---|-------|----------------|
| 1 | Stop hook patterns | Complete blueprint for pipeline-gate Stop hook with 10 edge cases |
| 2 | PreToolUse catalog | 7 decision patterns with code examples from 4 real plugins |
| 3 | State machine design | pipeline-state.json schema with 30+ fields, update rules, session isolation |
| 4 | Hook limitations | 13 limitations with workarounds, including "hook error" label poisoning |
| 5 | Persuasion playbook | 10 patterns, 47 rationalization entries, CSO rules, implementation checklist |
| 6 | Controller pattern | Hybrid architecture: flat orchestration with file-mediated handoff |
| 7 | Artifact dependencies | Per-phase schemas with requires/digest, write-time validation |
| 8 | Context isolation | 200K per subagent, no nesting, MCP tool caveats, MetaGPT pub-sub |
| 9 | Guardrail validation | 6 guardrail functions with concrete pass/fail criteria per phase |
| 10 | Failure + retry | 3-tier ladder (same-model→escalate→human), error classification |
| 11 | AskUserQuestion API | Full schema, 2-4 options, multiSelect, known bugs, plugin examples |
| 12 | Showing reasoning | Progressive disclosure templates at 3 levels with anti-patterns |
| 13 | Depth parameters | (in bladnman analysis) 4 depth levels with per-parameter tables |
| 14 | Steerability | Mutation classification, impact assessment, selective regeneration |
| 15 | Progress reporting | 5 patterns (phase map, finding updates, previews, time estimates, heartbeat) |
| 16 | Findings → antipatterns | 4-stage promotion pipeline, 3+ occurrence threshold, human gate |
| 17 | Cumulative tracking | SQLite schema (5 tables), dedup algorithm, recurrence detection |
| 18 | Drift prevention | 7 mechanisms with concrete limits (30 active, 90-day TTL, 5% demotion) |
| 19 | Decision audit trail | v2 schema with alternatives, confidence, outcome correlation |
| 20 | User feedback capture | Signal classification, correction weighting, ndjson format |
| 21 | Two-tier review | Internal→external, critical asymmetry (known vs unknown unknowns) |
| 22 | Reviewer composition | Mode-specific modules, 3-5K digests, 50K budget analysis |
| 23 | Findings classification | 8 categories × 4 severities, auto-classification rules |
| 24 | Feedback-to-learning | 7-step loop, LLM clustering, minimum viable phases A-D |
| 25 | Proof-of-implementation | Per-type matrix (web/API/CLI/library), Playwright MCP, Symphony model |
