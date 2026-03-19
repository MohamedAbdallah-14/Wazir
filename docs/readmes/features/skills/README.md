# Skills

> Reusable in-host procedures that enforce disciplined engineering work across every AI agent session.

Skills are the **operational layer** of Wazir. Where roles define who acts and workflows define what phases exist, skills define exactly how work gets done — step by step, with explicit rules and required outputs.

## Skill Roster

| Skill | ID | Type | Purpose |
|---|---|---|---|
| [Using Skills](using-skills.md) | `wz:using-skills` | Rigid | Skill discovery bootstrap — must fire before any response |
| [Brainstorming](brainstorming.md) | `wz:brainstorming` | Rigid | Turn briefings into approved designs before implementation |
| [Writing Plans](writing-plans.md) | `wz:writing-plans` | Rigid | Produce execution-grade implementation plans from approved designs |
| [TDD](tdd.md) | `wz:tdd` | Rigid | Enforce RED → GREEN → REFACTOR with evidence at each step |
| [Debugging](debugging.md) | `wz:debugging` | Rigid | Observe-hypothesize-test-fix loop instead of guesswork |
| [Verification](verification.md) | `wz:verification` | Rigid | Require fresh command evidence before any completion claim |
| [Receiving Code Review](receiving-code-review.md) | `wz:receiving-code-review` | Rigid | Process review feedback with technical rigor, not blind agreement |
| [Requesting Code Review](requesting-code-review.md) | `wz:requesting-code-review` | Rigid | Request review when completing tasks or before merging |
| [Design](design.md) | `wz:design` | Flexible | Guide designer role through open-pencil MCP visual design workflow |
| [Scan Project](scan-project.md) | `scan-project` | Flexible | Build an evidence-based project profile from repo surfaces |
| [Run Audit](run-audit.md) | `run-audit` | Flexible | Interactive structured codebase audit with report or fix-plan output |
| [Self-Audit](self-audit.md) | `self-audit` | Flexible | Worktree-isolated audit-fix loop — safe self-improvement |
| [Prepare Next](prepare-next.md) | `prepare-next` | Flexible | Produce a clean next-run handoff without stale context bleed |
| [Clarifier](clarifier.md) | `wz:clarifier` | Rigid | Run the clarification pipeline — research, scope, design, specs |
| [Executor](executor.md) | `wz:executor` | Rigid | Run the execution phase with TDD, quality gates, and verification |
| [Reviewer](reviewer.md) | `wz:reviewer` | Rigid | Adversarial review against approved spec, plan, and evidence |
| [Wazir](wazir.md) | `wz:wazir` | Rigid | One-command pipeline — init, clarify, execute, review automatically |
| [Init Pipeline](init-pipeline.md) | `wz:init-pipeline` | Flexible | Initialize the Wazir pipeline with zero-config auto-detection |
| [Executing Plans](executing-plans.md) | `wz:executing-plans` | Flexible | Execute implementation plans in separate sessions with review checkpoints |
| [Dispatching Parallel Agents](dispatching-parallel-agents.md) | `wz:dispatching-parallel-agents` | Flexible | Dispatch 2+ independent tasks without shared state |
| [Subagent-Driven Development](subagent-driven-development.md) | `wz:subagent-driven-development` | Flexible | Execute plan tasks via independent subagents in current session |
| [Using Git Worktrees](using-git-worktrees.md) | `wz:using-git-worktrees` | Flexible | Create isolated worktrees for feature work or plan execution |
| [Finishing a Branch](finishing-a-development-branch.md) | `wz:finishing-a-development-branch` | Flexible | Guide completion — merge, PR, or cleanup options |
| [Humanize](humanize.md) | `wz:humanize` | Flexible | Detect and remove AI writing patterns from text artifacts |
| [Writing Skills](writing-skills.md) | `wz:writing-skills` | Flexible | Create, edit, or verify skills before deployment |
| [Claude CLI](claude-cli.md) | `wz:claude-cli` | Flexible | Use Claude Code CLI programmatically for reviews and automation |
| [Codex CLI](codex-cli.md) | `wz:codex-cli` | Flexible | Use Codex CLI programmatically for reviews and sandbox operations |
| [Gemini CLI](gemini-cli.md) | `wz:gemini-cli` | Flexible | Use Gemini CLI for headless reviews and sandbox operations |

## Skill Types

| Type | Meaning |
|---|---|
| **Rigid** | Follow exactly. The discipline is the point — do not adapt away the structure. |
| **Flexible** | Adapt principles to context. The skill guides; judgment fills gaps. |

## How Skills Work

Skills are invoked via the `Skill` tool in Claude Code. When invoked, the skill's content is loaded and presented to the agent, which then follows it directly. Skills are **never** read via the `Read` tool on skill files — that bypasses the invocation contract.

```
User message received
    → Check: might any skill apply? (even 1% chance = yes)
    → Invoke Skill tool
    → Announce: "Using [skill] to [purpose]"
    → Follow skill exactly
    → Respond
```

## Skill Priority

When multiple skills could apply:

1. **Process skills first** — `wz:brainstorming`, `wz:debugging` determine HOW to approach the task.
2. **Implementation skills second** — `wz:tdd`, `wz:design` guide execution.

## Rules

- Skills must reference `input/`, canonical roles/workflows, or external state-root conventions.
- Skills must not instruct running background services outside the canonical workflow surface.
- When a skill contradicts the current operating model, it is removed — not left conflicting.
- Only active skills belong in `skills/`.

## Integration with Workflows

```
clarify → discover (scan-project) → specify → design (wz:design) → plan (wz:brainstorming + wz:writing-plans) → execute (wz:tdd) → verify (wz:verification) → review → learn → prepare-next
```

Skills activate within phases. A phase entrypoint does not replace skill invocation — both operate simultaneously.
