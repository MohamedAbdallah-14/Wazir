# Orchestration — Research vs Vision Comparison

Research corpus: 11 files in `docs/research/orchestration/` (allowedtools-flag, tmux-worktree, agent-teams, claude-p-mode, context-rot, competitive-analysis, security-gaming, bash-orchestrator, rules-files, codex-architecture, design-plan).

Vision document: `docs/vision/pipeline.md` (locked 2026-03-25).

---

## Strengths

The vision document is unusually well-grounded. Most decisions have direct research backing. Specific strong points:

### 1. Fresh context per agent — correctly incorporates context rot research

The vision's Principle #4 ("every agent is born, does one job, and dies") and the "Design override: no same-session fixes" directly reflect `context-rot.md` findings: sigmoidal degradation starting at ~32K tokens, instruction compliance dropping to 50-65% at 128K, and the finding that fresh sessions are the single most effective mitigation. The vision explicitly cites Laban et al. (39% degradation) and the 64.5% blind spot. Solid.

### 2. File system as communication bus — addresses 79% coordination failure stat

The vision cites Cemri et al. NeurIPS 2025 (79% of multi-agent failures are specification/coordination issues) and correctly chooses files over agent-to-agent messaging. This matches `agent-teams.md` finding that subagents have no inter-agent messaging (individual subagents report back to parent only) and the depth-1 limit on subagent spawning.

### 3. Orchestrator as state machine, not LLM — matches Codex review

`codex-architecture.md` finding #8: "Orchestrator must be the ONLY writer of control state." The vision's Architecture section says exactly this: "A deterministic scheduler that reads the DAG... One process, one state file, no concurrent access." Also reflected in Principle #7 and #8 (composer is a function, not an agent).

### 4. Cross-model review — supported by competitive analysis and security research

`competitive-analysis.md` documents AI21 Maestro's dual verifiers and the finding that cross-family verification has the largest gains (Lu et al., 37 models). The vision's 4-pass final review (2 internal + 2 cross-model) is more thorough than any competitor analyzed. The ~9% accuracy gain and 64.5% blind spot elimination are cited correctly.

### 5. Concurrency ceiling of 4 — matches research

`tmux-worktree.md` says practical ceiling is 2-3 comfortable, ~5-7 per API rate limits. `competitive-analysis.md` notes 3-5 agents practical ceiling (multiple sources). The vision picks 4. Reasonable and justified.

### 6. Constrained decoding for structured output — correctly identified

The vision requires constrained decoding for status.json (100% vs 40-74.5% compliance). `claude-p-mode.md` confirms `--json-schema` provides mathematically guaranteed compliance via constrained decoding. The vision correctly specifies this and lists it as Principle #14.

### 7. Rules budget — correctly conservative

The vision says ".claude/rules/ — 5-10 critical rules, under 1500 tokens" in the enforcement stack (design-plan.md). `rules-files.md` provides the evidence: 5 rules = ~92% per-rule compliance, 50 rules = ~56%, and the ETH Zurich study showing LLM-generated context files are net negative. The vision doesn't over-rely on rules.

### 8. Competitive differentiation is real

`competitive-analysis.md` confirms: "No competitor has enforced N-phase pipelines with compliance scoring. Wazir is unique." The vision's claim of being novel is substantiated. Kilo Code is the closest with per-mode tool restrictions, but lacks compliance scoring, phase reports, and structured state contracts.

---

## Weaknesses

### 1. The Bash escape hatch is acknowledged in research but not addressed in the vision

`security-gaming.md` identifies this as the #1 gaming vector: "`--disallowedTools` is only as strong as Bash restriction. If Bash is allowed, agent can `echo 'code' > src/file.js`." `codex-architecture.md` calls this "a blocker" (HIGH finding #1). The vision's Architecture section and Principles mention no mitigation. The execution pipeline's "Patch strategy" section says "agents write code via tool calls (structured edit tools), not raw diffs" but doesn't enforce this — an agent with Bash access can bypass all tool restrictions.

The `design-plan.md` research file proposes a mitigation (PreToolUse hook Bash allowlist, the existing bootstrap-gate.js pattern), but the vision document never mentions Bash restriction, Bash allowlists, or this attack surface.

### 2. `--allowedTools` semantics are researched but the vision never mentions flag-level tool restriction

`allowedtools-flag.md` documents three distinct flags (`--allowedTools`, `--disallowedTools`, `--tools`) with critically different semantics. The critical bug: `--allowedTools` bypasses PreToolUse hooks (issue #18312). The vision says "platform-enforced restrictions" in the enforcement stack but never specifies which flags to use. The `design-plan.md` corrects earlier assumptions about flag semantics, but the vision document doesn't incorporate these corrections.

### 3. Worktree limitations not addressed in parallel execution design

The vision's parallel execution section says "each in its own git worktree" but doesn't address two critical bugs from `tmux-worktree.md`:
- `.claude/` not copied to worktrees (bug #28041) — skills, agents, rules, settings.json are all missing
- Crash cleanup: worktrees are NOT cleaned up after crashes (bug #26725), no garbage collection

The `tmux-worktree.md` workaround (`worktree.symlinkDirectories`) is documented in research but absent from the vision.

### 4. The hook trust level problem is unaddressed

`design-plan.md` identifies a fundamental platform limitation: hook-injected messages land as `<system-reminder>` blocks (infrastructure noise), while user messages get higher trust. "No known way to inject user-level messages via hooks." The vision relies on hooks for enforcement (Layer 2 in the stack) but doesn't acknowledge this trust differential or its impact on compliance ceiling.

### 5. Session chaining and resumption strategy is underspecified

`claude-p-mode.md` documents `--resume` for session continuity and `--no-session-persistence` for ephemeral jobs. `bash-orchestrator.md` shows the session chaining pattern (capture session_id, resume). The vision mentions "pausable and resumable" in Batch Execution and handover files, but doesn't specify the mechanism. Is it `--resume`? Is it a fresh `-p` call with a handover prompt? This matters because `--resume` inherits context rot from the previous session while fresh `-p` gets clean context.

### 6. The vision doesn't address MCP server limitations in -p mode

`claude-p-mode.md` notes: "HTTP-based MCP servers do NOT load in -p mode (bug #34131)." If the orchestrator dispatches subagents via `-p` and any expertise module or tool relies on HTTP-based MCP servers, those agents will silently lack those capabilities. The vision's Composer section doesn't account for this.

### 7. Agent definition fields not mapped to subtask.md

`agent-teams.md` lists the full agent definition fields: name, description, tools, disallowedTools, model, permissionMode, maxTurns, skills, mcpServers, hooks, memory. The vision's subtask.md contains expertise declarations, model tier, tools needed, and context budget — but the mapping from subtask fields to agent definition fields is never specified. The Composer section says it "returns complete agent config ready for dispatch" but doesn't show the schema.

### 8. The 4-7x token overhead of multi-agent is acknowledged nowhere

`agent-teams.md` states: "Multi-agent workflows use ~4-7x more tokens than single-agent." The vision's cost principles say "quality always wins over cost" but never quantifies the cost multiplier. For a pipeline with 8 pre-execution phases (each spawning 1+ agents), 4-stage subtask pipelines, and 4-pass final review, the token overhead is substantial. Even if the tradeoff is accepted, it should be quantified and documented.

### 9. Depth-1 subagent limit not acknowledged

`agent-teams.md`: "Subagents cannot spawn subagents. Depth limit is exactly 1." The vision's Architecture says subagents "do one job, write output to disk, and die" — which is compatible — but never explicitly acknowledges the depth-1 constraint. If a future design tries to have an agent delegate to a sub-subagent, it will fail silently. This constraint should be stated.

---

## Critical to Edit

### C1: Bash escape hatch mitigation must be specified

**Research finding**: `security-gaming.md` — Bash access defeats all tool restrictions. `codex-architecture.md` — "Bash escape hatch is a blocker." `design-plan.md` — "Scope Bash via PreToolUse hook allowlist."

**Why it's critical**: Without explicit Bash restrictions, every `--disallowedTools` restriction in the execution pipeline is theater. An executor agent told not to use Write can `echo > file`. This undermines the entire enforcement architecture.

**Suggested edit**: In the Architecture section, after "The Orchestrator Is a State Machine", add a subsection:

```
### Bash Restriction

Bash access is the escape hatch that defeats all tool restrictions. An agent with
unrestricted Bash can write files, read files, delete files, and execute arbitrary
code — regardless of --disallowedTools settings.

Mitigation: PreToolUse hook on Bash tool calls with an allowlist of permitted
command prefixes (test runners, linters, build tools, git). All other Bash
invocations are denied. This is not optional — it is load-bearing for the
enforcement model.

The allowlist is phase-specific: executor agents get test/lint/build commands,
review agents get read-only commands, the orchestrator gets state management
commands.
```

Also add to Design Decisions table:
```
| Bash allowlist per phase | Bash defeats --disallowedTools | Never — enforcement model depends on it |
```

### C2: Flag semantics must be specified for tool restriction

**Research finding**: `allowedtools-flag.md` — `--allowedTools` does NOT restrict tools, only auto-approves. `--allowedTools` bypasses PreToolUse hooks (bug #18312). Use `--disallowedTools` or `--tools` for actual restriction.

**Why it's critical**: If anyone implementing the orchestrator uses `--allowedTools` thinking it restricts tools, enforcement is broken AND hooks are bypassed. Two failures stacked.

**Suggested edit**: In the Architecture section or a new "Platform Constraints" section, add:

```
### Tool Restriction Flags

- --tools: restricts which built-in tools are available. "" disables all.
- --disallowedTools: deny list, tools removed from model context entirely.
- --allowedTools: auto-approval only. Does NOT restrict. BYPASSES PreToolUse hooks
  (bug #18312). Never use for enforcement.

The composer uses --disallowedTools (not --allowedTools) when dispatching agents.
```

### C3: Worktree symlink requirement must be documented

**Research finding**: `tmux-worktree.md` — `.claude/` not copied to worktrees (bug #28041). Skills, agents, rules, settings.json all missing. Workaround: `worktree.symlinkDirectories: [".claude"]`.

**Why it's critical**: Every parallel subtask runs in a worktree. If `.claude/` isn't symlinked, those agents have no skills, no rules, no agent definitions. The entire Composer and expertise system breaks in parallel execution.

**Suggested edit**: In the "Parallel Execution" section, after "Each in its own git worktree. No cross-talk.", add:

```
**Worktree configuration required**: `.claude/` is not copied to worktrees (platform
bug #28041). Without it, agents in worktrees have no skills, rules, or agent
definitions. The project must set `worktree.symlinkDirectories: [".claude"]` in
settings. This is a deployment prerequisite, not optional.
```

---

## Nice to Have

### N1: Quantify the multi-agent token overhead

`agent-teams.md` says 4-7x. The vision could add a note in the Principles or a new "Cost Model" section estimating total token usage for a typical run. Not blocking — the "quality over cost" principle covers it — but useful for setting expectations.

### N2: Document the depth-1 subagent constraint

`agent-teams.md` confirms subagents cannot spawn subagents. Adding a one-liner to the "Agents Are Stateless Workers" section ("Platform constraint: subagent depth is exactly 1 — no sub-subagents") prevents future design mistakes.

### N3: Specify session mechanism for batch handover

The vision says "pausable and resumable" but not how. Research shows two options: `--resume SID` (inherits context, risks rot) or fresh `-p` with handover prompt (clean context). Given the vision's stance on context rot, the answer is obviously fresh `-p`, but it should be stated.

### N4: Note the MCP HTTP limitation for -p mode

`claude-p-mode.md` documents that HTTP-based MCP servers don't load in `-p` mode. A one-liner in the Composer section noting this constraint prevents silent capability loss.

### N5: Add the compliance hierarchy numbers

`security-gaming.md` documents the empirical compliance hierarchy from Wazir's own sessions (prompts only ~40-50%, hooks ~67-76%, projected fresh context ~80-85%, projected --tools per phase ~85-90%). These are Wazir's own measurements. Including them in the vision grounds the enforcement design in measured reality.

### N6: Document the challenge messaging strategy

`design-plan.md` has a detailed "Messaging Strategy: Challenge, Don't Remind" section with research backing (trust hierarchy, alignment faking, DeCRIM, instruction shadowing). The vision's enforcement stack mentions behavioral redirect but doesn't specify the strategy. This is a meaningful enforcement lever (+5-10pp projected) worth documenting.

### N7: Acknowledge the `--bare` flag for performance-sensitive dispatches

`claude-p-mode.md` documents `--bare` (skips hooks, LSP, plugins, auto-memory, CLAUDE.md). For certain subagent types (quick validation checks, simple file reads), `--bare` could reduce startup overhead. Not critical — the Composer could decide this — but worth noting as available.

---

## Improvements

### I1: Add "Bash Restriction" subsection to Architecture

**Section**: Architecture, after "The Orchestrator Is a State Machine"
**Add**: New subsection documenting Bash allowlist enforcement per phase (see C1 above)
**Why**: `security-gaming.md` and `codex-architecture.md` both flag this as the top enforcement gap. Without it, the entire tool restriction model has a bypass.

### I2: Add "Platform Constraints" subsection to Architecture

**Section**: Architecture, after "The Subagent Contract"
**Add**: New subsection covering:
- Tool restriction flag semantics (`--tools` vs `--disallowedTools` vs `--allowedTools`) from `allowedtools-flag.md`
- Subagent depth-1 limit from `agent-teams.md`
- `--allowedTools` bypassing hooks (bug #18312) from `allowedtools-flag.md`
- HTTP MCP servers not loading in `-p` mode (bug #34131) from `claude-p-mode.md`
- Worktree `.claude/` symlink requirement (bug #28041) from `tmux-worktree.md`
**Why**: The vision describes the desired architecture but omits platform-level constraints that affect implementation. These are not "nice to know" — they are "will break silently if ignored."

### I3: Add row to Design Decisions table for Bash restriction

**Section**: Design Decisions table
**Add**: `| Bash allowlist per agent role | Bash defeats --disallowedTools (security-gaming.md, codex-architecture.md) | Never — enforcement model depends on it |`
**Why**: This is a load-bearing constraint that should not be revisited without evidence.

### I4: Add row to Design Decisions table for session mechanism

**Section**: Design Decisions table
**Add**: `| Fresh -p per batch, never --resume | --resume inherits context rot (context-rot.md, claude-p-mode.md) | Learning data showing --resume doesn't degrade quality |`
**Why**: Batch handover currently underspecified. Making this explicit prevents someone implementing it with `--resume` and reintroducing context rot.

### I5: Add cost multiplier acknowledgment to Principles or a new note

**Section**: Principles, near #1 ("Quality always wins over cost")
**Add**: A note: "Multi-agent pipelines use ~4-7x more tokens than single-agent (agent-teams research). This is the cost of fresh context, cross-model review, and parallel execution. Accepted as the price of quality."
**Why**: `agent-teams.md` quantifies the overhead. The vision accepts it implicitly but never acknowledges it. Explicit is better.

### I6: Specify worktree symlink in Parallel Execution section

**Section**: Part II, Parallel Execution
**Add**: The worktree symlink requirement (see C3 above)
**Why**: `tmux-worktree.md` documents a platform bug that silently breaks all parallel execution. This is a deployment prerequisite.

### I7: Add compliance hierarchy to Architecture or Principles

**Section**: Architecture, near the enforcement stack discussion, or as a new "Enforcement Evidence" subsection
**Add**: The measured compliance numbers from `security-gaming.md`:
```
Prompts only: ~40-50% | + Hooks: ~67-76% | + Fresh context: ~80-85% (projected)
+ --tools per phase: ~85-90% (projected) | Combined soft + hard: 95-99% (PCAS)
```
**Why**: These are Wazir's own empirical measurements. They justify the layered enforcement design and set realistic expectations. The mathematical reality (95% per step across 10 steps = 59% end-to-end) should be in the vision as a forcing function for the enforcement stack.

---

## Summary Verdict

The vision is strong. The research is well-incorporated for the core architectural decisions (fresh context, file-based communication, deterministic orchestrator, cross-model review, rules budget). The competitive analysis confirms Wazir's uniqueness.

The three critical gaps are all enforcement-related: the Bash escape hatch, flag semantics, and worktree configuration. All three are documented in research but absent from the vision. They share a common theme: the vision describes the desired enforcement model but doesn't specify the platform-level mechanisms that make it work. Without these, the enforcement architecture has known bypasses.

Everything else is documentation quality — making implicit decisions explicit, quantifying known costs, and specifying mechanisms that the research has already resolved.
