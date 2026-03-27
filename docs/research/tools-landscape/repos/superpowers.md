# obra/superpowers — Deep Research Report

## PROJECT IDENTITY

Superpowers is an agentic skills framework and software development methodology by Jesse Vincent (Prime Radiant). It is a plugin that installs into Claude Code, Cursor, Codex, OpenCode, and Gemini CLI. It is NOT a runtime, NOT a library, and NOT an orchestrator. It is a collection of markdown skill documents that reprogram how coding agents behave -- turning them from eager code-generators into disciplined engineers who follow a rigorous process.

The project is at version 5.0.5. It is Shell-primary (with Node.js for the brainstorm server). The skill documents are the product -- they are prompt engineering at the methodology level.

## COMPLETE PHASE/WORKFLOW MODEL

The workflow is a strict, linear pipeline with hard gates between phases. The agent cannot skip or reorder phases.

### Phase 1: Brainstorming (spec creation)
- Trigger: Any creative work request. Mandatory for ALL projects, even "simple" ones.
- HARD GATE: No implementation until design is presented and user approves.
- Process: Explore project context -> Offer visual companion (if visual questions ahead) -> Ask one clarifying question at a time (prefer multiple choice) -> Propose 2-3 approaches with trade-offs -> Present design in sections scaled to complexity -> Get user approval section by section.
- Decomposition gate: If the request describes multiple independent subsystems, it flags this immediately and decomposes into sub-projects before detailed design.
- Output: Design document saved to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
- Review loop: Dispatches a spec-document-reviewer subagent. Fixes issues and re-dispatches, up to 3 iterations. Then surfaces to human.
- User review gate: User explicitly approves the written spec before proceeding.
- Terminal state: Invokes writing-plans. No other skill. Only writing-plans.

### Phase 2: Writing Plans
- Trigger: Approved spec exists.
- Process: Maps out file structure first (where decomposition decisions get locked in). Then breaks work into bite-sized tasks (2-5 minutes each). Each step is ONE action: write test, run test, implement, run test, commit.
- Plan format: Every plan starts with a mandatory header (goal, architecture, tech stack). Each task has exact file paths, complete code snippets (not "add validation"), exact commands with expected output.
- Emphasis: DRY, YAGNI, TDD, frequent commits.
- Review loop: Dispatches plan-document-reviewer subagent. Same fix-and-re-dispatch pattern, max 3 iterations.
- Output: Plan saved to `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`.
- Execution handoff: Offers user a choice between subagent-driven development (recommended) and inline execution.

### Phase 3: Workspace Setup (using-git-worktrees)
- Creates isolated git worktree on a new branch.
- Smart directory selection: checks `.worktrees/` -> `worktrees/` -> CLAUDE.md preference -> asks user.
- Safety: Verifies directory is in .gitignore before creating.
- Auto-detects project type and runs setup (npm install, cargo build, pip install, etc).
- Verifies clean test baseline. Reports failures before proceeding.

### Phase 4a: Subagent-Driven Development (recommended)
- Dispatches a fresh subagent per task. Each subagent gets precisely crafted context (never session history).
- Per task: Dispatch implementer subagent -> Handle questions -> Implementation + tests + commit + self-review -> Dispatch spec reviewer subagent (does implementation match spec?) -> Fix if needed -> Dispatch code quality reviewer subagent -> Fix if needed -> Mark complete.
- Two-stage review is mandatory: spec compliance FIRST, then code quality. Never reverse.
- Implementer reports one of four statuses: DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED. Each handled differently.
- Model selection: Cheapest model for mechanical tasks, standard for integration, most capable for architecture/review.
- After all tasks: Dispatch final code reviewer for entire implementation.

### Phase 4b: Executing Plans (alternative)
- Same-session execution with human checkpoints between batches.
- Load plan, review critically, execute task by task, follow each step exactly.
- Lower quality than subagent-driven because no fresh context per task.

### Phase 5: Finishing a Development Branch
- Verify all tests pass (hard gate -- no proceeding with failures).
- Present exactly 4 options: merge locally, push and create PR, keep as-is, discard.
- Discard requires typed confirmation.
- Cleanup worktree for merge and discard options.

## EVERY SKILL AND WHAT IT DOES

### Core Pipeline Skills (ordered):

1. **brainstorming** -- Mandatory pre-implementation design phase. Socratic questioning, approach exploration, sectioned design presentation, spec writing with automated review loop and user gate.

2. **writing-plans** -- Converts approved spec into bite-sized implementation plan with exact file paths, complete code, and verification steps. Includes automated plan review loop.

3. **using-git-worktrees** -- Creates isolated workspace with smart directory selection, safety verification (.gitignore check), auto-setup, and clean test baseline verification.

4. **subagent-driven-development** -- Dispatches fresh subagent per task with two-stage review (spec compliance then code quality). The controller extracts all tasks upfront and provides full text to each subagent.

5. **executing-plans** -- Alternative to subagent-driven: same-session batch execution with human checkpoints.

6. **requesting-code-review** -- Dispatches code-reviewer subagent with git SHAs and structured template. Issues categorized as Critical/Important/Minor.

7. **receiving-code-review** -- How to handle incoming review feedback. Key rule: verify before implementing, push back with technical reasoning if wrong, no performative agreement ("You're absolutely right!" is explicitly forbidden).

8. **finishing-a-development-branch** -- Test verification, 4-option presentation (merge/PR/keep/discard), worktree cleanup.

### Discipline Skills:

9. **test-driven-development** -- Iron Law: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST. Red-Green-Refactor cycle with mandatory verification at each step. Code written before tests must be deleted.

10. **systematic-debugging** -- 4-phase process: Root Cause Investigation -> Pattern Analysis -> Hypothesis and Testing -> Implementation. Iron Law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.

11. **verification-before-completion** -- Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE. Must run verification command in current message before claiming success.

### Meta Skills:

12. **using-superpowers** -- The bootstrap skill loaded at session start. Establishes skill priority.

13. **writing-skills** -- Meta-skill for creating new skills. Applies TDD to documentation.

14. **dispatching-parallel-agents** -- When facing 2+ independent problems, dispatch one agent per problem domain.

### Agent Definitions:

15. **code-reviewer** (agent) -- Senior code reviewer that compares implementation against plan.

## HOW SPECS ARE CREATED AND REVIEWED

### Creation (brainstorming skill):
1. Agent explores project context (files, docs, commits)
2. Asks clarifying questions one at a time (multiple choice preferred)
3. Proposes 2-3 approaches with trade-offs and recommendation
4. Presents design in sections scaled to complexity
5. Gets user approval after each section
6. Writes spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
7. Commits to git

### Review (spec-document-reviewer subagent):
- Checks: Completeness (no TODOs/TBDs), Consistency (no contradictions), Clarity (no ambiguity), Scope (single plan), YAGNI (no over-engineering).
- Returns: Approved or Issues Found with specific list.
- Loop: Fix issues, re-dispatch, up to 3 iterations. Then surface to human.

## HOW VERIFICATION WORKS

Verification is pervasive, not a single phase:

- **Task level (TDD):** Every function has a failing test before implementation.
- **Implementation review (two-stage):** Spec compliance reviewer FIRST, then code quality reviewer.
- **Plan completion:** Full test suite must pass before presenting branch options.
- **Claim verification:** Must run fresh command before stating anything passes.
- **Agent distrust:** Spec reviewer prompt says: "The implementer finished suspiciously quickly. Their report may be incomplete."

## PHILOSOPHY AND KEY DESIGN DECISIONS

1. **Skills are prompt engineering, not code.** The entire system is markdown documents that reprogram agent behavior. No runtime, no orchestrator, no state machine.

2. **Anti-rationalization as a first-class concern.** Every discipline skill has an Iron Law, rationalization table, red flags list, and pressure testing methodology.

3. **"Violating the letter is violating the spirit."** Cuts off "I'm following the spirit" rationalizations.

4. **Subagent isolation is context hygiene.** Fresh subagent per task prevents context pollution.

5. **Two-stage review prevents two distinct failure modes.** Spec compliance catches "built wrong thing." Code quality catches "built right thing badly."

6. **Plans written for "an enthusiastic junior engineer with poor taste, no judgment, no project context."** Forces exhaustive detail.

7. **CSO (Claude Search Optimization).** Treats skill discoverability as an optimization problem. Descriptions must contain triggering conditions, not workflow summaries.

8. **Implementer status protocol.** Four statuses (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED) give subagents explicit permission to escalate.

## COMPARISON WITH WAZIR

| Dimension | Superpowers | Wazir |
|-----------|-------------|-------|
| Architecture | Markdown skills injected as prompts | YAML manifest + role contracts + workflow phases |
| Runtime | The agent IS the runtime | External orchestration via hooks + state DB |
| State | Stateless (git commits are the state) | SQLite state DB + phase reports |
| Enforcement | Persuasion-based (anti-rationalization) | Hook-based enforcement + compliance scoring |
| Spec creation | Brainstorming skill with automated review | Clarifier role |
| Execution | Subagent-driven development | Phase-based execution |
| Review | Two-stage (spec + quality) per task | Two-tier review model |
| Platform | Claude Code, Cursor, Codex, Gemini, OpenCode | Claude Code primary |
