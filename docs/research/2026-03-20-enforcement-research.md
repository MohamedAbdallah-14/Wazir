# Enforcement Research — 2026-03-20

## The Answer

**Prose instructions don't work. The agent will always rationalize skipping them.** Every framework that achieves reliable enforcement uses the same pattern: **the framework holds the loop, not the agent.**

## The Three-Layer Strategy

### Layer 1: Mechanical Hooks (agent CANNOT bypass)

**Stop hook** blocks completion: `{"decision": "block", "reason": "..."}` — proven by ralph-loop plugin (official marketplace). The agent literally cannot stop until all artifacts exist.

**PreToolUse hooks** block actions:
- `PreToolUse:Write|Edit` — blocks implementation code if no plan artifact exists
- `PreToolUse:Bash` — blocks `git commit` if no tests run, blocks `git push` if no review
- Returns `permissionDecision: "deny"` — the tool call is prevented entirely

**State tracking** via `pipeline-state.json` — hooks READ state, CLI WRITES state. No race conditions.

**Key: command hooks only, never prompt hooks.** Prompt hooks re-introduce the rationalization problem.

### Layer 2: Subagent Isolation (agent CANNOT see full pipeline)

From every framework (CrewAI, LangGraph, Symphony, ideation_team_skill): **give the agent a task, not a plan.**

- Each phase is a separate subagent invocation
- Phase N+1 receives phase N's artifact as input — if it doesn't exist, the call fails
- The controller (wazir skill) holds the loop and decides what runs next
- No single agent can rationalize skipping from research to code

### Layer 3: Persuasion Engineering (agent WON'T bypass — 72% compliance)

From superpowers (100K stars, backed by Meincke et al. 2025, N=28,000):

- **Rationalization tables** — enumerate exact thoughts the agent has when skipping, with rebuttals
- **"Violating the letter is violating the spirit"** — kills the #1 escape pattern
- **Red flags lists** — specific phrases that mean STOP
- **Authority + Commitment + Social Proof** — doubles compliance (33% → 72%)
- **CSO (Claude Search Optimization)** — skill descriptions must be triggers, never process summaries

## Key Findings Per Source

### Claude Code Hooks
- Stop hook CAN block (`{"decision": "block"}`) — proven by ralph-loop
- PreToolUse CAN deny AND modify tool calls — proven by context-mode plugin
- Hooks are stateless but can read/write files for state
- Hooks loaded at session start, can't be added mid-session
- **Limitation: hooks block actions but can't compel them**

### Superpowers (100K stars)
- 100% prompt engineering, zero mechanical enforcement
- Single SessionStart hook injects meta-skill in `<EXTREMELY_IMPORTANT>` tags
- **Issue #463: agents STILL skip reviews** — the author knows it's unsolved
- Commenter: "The only reliable fix is making reviews structural, not instructional"
- TDD skill is best-in-class prompt engineering but still fails sometimes
- Persuasion research: authority language doubles compliance but doesn't reach 100%

### Framework Enforcement Patterns
- **CrewAI:** Python for-loop + guardrail functions. Agent produces output, framework validates.
- **LangGraph:** Channel triggers + NamedBarrierValue. Node can't fire until inputs ready.
- **Temporal:** `await` keyword is the enforcement. Language-level blocking.
- **Symphony:** State machine + data dependencies. Each phase produces data the next requires.
- **GitHub Actions:** `needs:` DAG. Scheduler prevents jobs from starting without dependencies.
- **Universal pattern:** framework holds program counter, not agent.

### UX / User Engagement
- **bladnman/ideation_team_skill:** AskUserQuestion for pre-flight interview, depth-aware parameters, cognitive role separation across agents
- **Devin:** PR-as-proof, screen recordings, conversational Slack updates, async delegation
- **Copilot Workspace:** Spec → Plan → Code, each editable. Steerability = trust.
- **Anthropic:** Show planning steps explicitly, programmatic checks at intermediate steps

## What Wazir Must Build

### 1. Pipeline State Machine (hooks + state file)

```
SessionStart → initialize pipeline-state.json
PreToolUse:Write|Edit → deny if phase gate not passed
PreToolUse:Bash → deny git commit/push without tests/review
Stop → deny if any enabled workflow incomplete or proof missing
```

### 2. Subagent-Per-Phase Architecture

The `/wazir` skill becomes a CONTROLLER that:
- Spawns a clarifier subagent → receives clarification artifact
- Spawns a spec subagent → receives spec artifact
- Spawns a design subagent → receives design artifact
- Spawns an executor subagent → receives implementation
- Spawns a reviewer subagent → receives review verdict
- Each subagent sees ONLY its phase, not the full pipeline

### 3. Superpowers-Style Persuasion on Every Skill

For each discipline rule:
- Iron Law statement
- Rationalization table (empirically derived)
- Red flags list
- "Violating the letter is violating the spirit"
- `<EXTREMELY_IMPORTANT>` wrapper on session injection

### 4. User Engagement Templates

- Pre-flight interview via AskUserQuestion (batched, not serial)
- Three-tier progress reporting (status line / key decisions / full record)
- Artifacts as proof (self-describing, contain lineage and reasoning)
- Steerability at phase boundaries (edit upstream, regenerate downstream)
