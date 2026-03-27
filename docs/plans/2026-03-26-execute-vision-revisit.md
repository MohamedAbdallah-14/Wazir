# Execute Vision Revisit Plan

## Context

Session 2026-03-26 compared the execute phase vision (`docs/vision/pipeline-execute.md`) against research (22 files + 7 syntheses), the current implementation, and Codex GPT-5.4 review.

16 research-grounded fixes/enhancements were committed to the vision. Then we discovered a foundational problem.

## The Problem

The execute vision was written assuming subagents could cheaply provide fresh context per stage (execute → review → verify as separate agents). Research into Claude Code Agent Teams reveals **4-7x token overhead per agent spawn**. For a pipeline spawning 3 agents per subtask × N subtasks, this is cost-prohibitive for daily use.

The vision prescribes mechanisms (separate agents, orchestrator lifecycle states, Composer as agent-config assembler) that assume cheap multi-agent infrastructure. That infrastructure exists (Agent Teams) but the cost makes it impractical as the default execution model.

## What Needs Revisiting

The execute vision (`pipeline-execute.md`) needs to be rewritten with actual platform constraints in mind. Specifically:

### Questions to Answer

1. **Execute → Review → Verify stages**: Keep as conceptual stages but within a single session? Or keep separate-agent as an option for high-stakes runs?
2. **Orchestrator lifecycle states**: Do these make sense without an orchestrator process? Or should lifecycle tracking be file-based (the implementation's current approach)?
3. **DAG parallel execution**: Is this viable given worktree overhead + the .claude/ symlink bug? Or should sequential remain the default with parallel as opt-in?
4. **Status protocol**: The 5 agent-reported values + cause codes are good design regardless of execution model. Keep as-is.
5. **Batch handover**: Still needed for long runs. Keep as-is.
6. **Fresh-session resume**: Still correct — don't reopen old sessions. Keep as-is.

### What Does NOT Change

- **The Composer** — core pillar. Deterministic module resolution, expertise loading, prompt assembly rules. Works regardless of execution model.
- **Research-grounded constraints** — context rot is real (39% degradation), self-assessment is untrustworthy (64.5% blind spot), micro-commits are better than one-commit-per-task, secrets gating is non-negotiable, analysis-findings.json schema, external side effects invariant.
- **Status protocol values** — DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED, FAILED with cause codes. These are good design regardless.
- **Failure handling tiers** — fix loop → cross-model → replan → user. This logic works in single-agent too.
- **Design Decisions table** — all research-grounded, all valid.

### What the Implementation Already Has That Works

The current implementation has battle-tested patterns that the vision should incorporate rather than replace:

- **Codex cross-model review** — actual fresh context + different model family. Gets ~80% of the separate-agent benefit at ~10% of the cost.
- **Review loop depth-scaling** (3/5/7 passes) — more nuanced than the vision's "2-3 passes."
- **Producer-reviewer separation** — "no role reviews its own output" principle.
- **Interaction modes** (auto/guided/interactive) — already in pipeline.md.
- **Verifier validation suite** — 9 specific wazir validate commands.
- **Code review scoping** — review-before-commit with --uncommitted, --base patterns.

## Approach

Rewrite the execute vision to **level 2: research-grounded principles with implementation-scoped mechanisms**:

- State the constraint WITH the research basis
- Leave the specific mechanism to implementation
- Document Agent Teams as the upgrade path for when overhead becomes acceptable
- Incorporate implementation patterns that are proven and better than what the vision prescribed

## Agent Teams as Upgrade Path

Agent Teams maps cleanly to the vision's multi-agent architecture:

| Vision concept | Agent Teams equivalent |
|---|---|
| Orchestrator | Lead session |
| Fresh context per stage | Each teammate = fresh context |
| Composer (agent config) | `.claude/agents/*.md` with YAML frontmatter |
| Parallel execution | `--worktree --tmux` |
| Tool restrictions per role | `tools:` allowlist in agent definition |
| Lifecycle management | TeamCreate/TeamDelete |

When token costs drop or for high-stakes runs where quality justifies 4-7x overhead, the implementation can switch to Agent Teams without changing the vision's constraints.

## Committed Changes (This Session)

All 16 fixes/enhancements from this session are committed (e2b56a0). Some may need adjustment during the revisit (specifically the orchestrator lifecycle table and any multi-agent assumptions). The research-grounded additions (analysis-findings.json schema, delta semantics, external side effects invariant, test-writing tradeoff, etc.) are solid regardless.

## Next Session

1. Read updated vision files
2. Rewrite execute vision: constraints not mechanisms
3. Align implementation to match rewritten vision
4. Verify Composer section consistency
5. Run Codex review on final state
