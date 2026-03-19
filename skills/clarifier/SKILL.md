---
name: wz:clarifier
description: Run the clarification pipeline — research, clarify scope, brainstorm design, generate task specs and execution plan. Pauses for user approval between phases.
---

# Clarifier

Run Phase 0 (Research) + Phase 1 (Clarify, Brainstorm, Plan) for the current project.

**Pacing rule:** This skill has mandatory user checkpoints between phases. Do NOT skip checkpoints. Do NOT combine phases. Complete each phase fully, present the output, and wait for explicit user approval before advancing.

Review loops follow the pattern in `docs/reference/review-loop-pattern.md`. All reviewer invocations use explicit `--mode`.

**Standalone mode:** If no `.wazir/runs/latest/` exists, artifacts go to `docs/plans/` and review logs go alongside.

## Prerequisites

1. Check `.wazir/state/config.json` exists. If not, run `wazir init` first.
2. Check `.wazir/input/briefing.md` exists. If not, ask the user what they want to build and save it there.
3. Read config for `default_depth`, `default_intent`, `team_mode`, and `multi_tool` settings.
4. Create a run directory if one doesn't exist:
   ```bash
   mkdir -p .wazir/runs/run-YYYYMMDD-HHMMSS/{sources,tasks,artifacts,reviews,clarified}
   ln -sfn run-YYYYMMDD-HHMMSS .wazir/runs/latest
   ```

---

## Context-Mode Usage

Read `context_mode` from `.wazir/state/config.json`:

- **If `context_mode.enabled: true`:** Use `fetch_and_index` for URL fetching, `search` for follow-up queries on indexed content. Use `execute` or `execute_file` for large outputs (test results, git log, etc.) instead of Bash.
- **If `context_mode.enabled: false`:** Fall back to `WebFetch` for URLs and `Bash` for commands. The `search` step is skipped entirely (use full fetched content instead).

This applies to Phase 0 (research) and all subsequent phases.

---

## Phase 0: Research (delegated)

Delegate to the discover workflow (`workflows/discover.md`):

1. The **researcher role** produces the research artifact
   (codebase scan, external sources, source manifest, research brief).
2. The **reviewer role** runs the research-review loop
   using research dimensions with `--mode research-review`
   (see `docs/reference/review-loop-pattern.md`).
3. The researcher resolves findings from each pass.
4. Loop runs for `pass_counts[depth]` passes.
5. Research artifact flows back to the clarifier for Checkpoint 0.

Save result to `.wazir/runs/latest/clarified/research-brief.md`.

### Checkpoint 0: Research Review

Present the research brief to the user:

> **Research complete. Here's what I found:**
>
> [Summary of existing codebase state, relevant architecture, external context]
>
> **Does this match your understanding? Anything to add or correct?**
> 1. **Looks good, continue** (Recommended)
> 2. **Missing context** — let me add more information
> 3. **Wrong direction** — let me clarify the intent

**Wait for user response before continuing.**

---

## Phase 1A: Clarify (autonomous, then review, then checkpoint)

### Input Preservation (before producing clarification)

1. Glob `.wazir/input/tasks/*.md`. If files exist:
   - Count total lines: `wc -l` sum across all files. Record as `input_line_count`.
   - Adopt those specs as the starting point — copy content verbatim into the clarification's item descriptions.
   - Enhance with codebase scan + research findings (add missing file paths, resolve ambiguities, add dependencies). **Never remove detail — only add.**
   - Every acceptance criterion from input must appear verbatim in the corresponding item description (not in a separate appendix).
   - Every API endpoint, color hex code (`#RRGGBB`), and UI dimension (px, %, rem, vh, vw, `sm`/`md`/`lg`/`xl` breakpoints) from input must appear in the relevant item section.
2. If `.wazir/input/tasks/` is empty or missing, synthesize from `briefing.md` alone (no error).
3. Normalize line endings with `tr -d '\r'` before counting (CRLF mitigation).

### Clarification Production

Read the briefing, research brief, and codebase context. Produce:

- **What** we're building — concrete deliverables, not vague descriptions
- **Why** — the motivation and business value
- **Constraints** — technical, timeline, dependencies
- **Assumptions** — what we're taking as given (explicitly stated)
- **Scope boundaries** — what's IN and what's explicitly OUT
- **Unresolved questions** — anything ambiguous that could change architecture or acceptance criteria

Save to `.wazir/runs/latest/clarified/clarification.md`.

Invoke `wz:reviewer --mode clarification-review` on the clarification artifact. The reviewer skill handles Codex integration, dimension selection, pass counting, and finding attribution internally (see `docs/reference/review-loop-pattern.md`). Do NOT call `codex exec` or `codex review` directly from the clarifier — all review goes through `wz:reviewer`. Resolve any findings before presenting to user.

### Checkpoint 1A: Clarification Review

Present the full clarification to the user:

> **Here's the clarified scope:**
>
> [Full clarification with what/why/constraints/assumptions/scope/questions]
>
> **Are there any corrections, missing context, or open questions to resolve?**
> 1. **Approved — continue to spec hardening**
> 2. **Needs changes** — [user provides corrections]
> 3. **Missing important context** — [user adds information]

**Wait for user response. If the user provides corrections, update the clarification and re-present.**

---

## Phase 1A+: Spec Harden (delegated, then checkpoint)

Delegate to the specify workflow (`workflows/specify.md`):

1. The **specifier role** produces a measurable spec from the clarification
   and research artifacts.
2. Invoke `wz:reviewer --mode spec-challenge` to run the spec-challenge loop
   (`workflows/spec-challenge.md`).
3. The specifier resolves findings from each pass.
4. Loop runs for `pass_counts[depth]` passes.

Save result to `.wazir/runs/latest/clarified/spec-hardened.md`.

### Checkpoint 1A+: Hardened Spec Review

Present the changes made during hardening:

> **Spec hardened. Changes made:**
>
> [List of each gap found and how it was tightened]
>
> **Review the hardened spec. Approve or adjust?**
> 1. **Approved — continue to brainstorming** (Recommended)
> 2. **Disagree with a change** — [user specifies]
> 3. **Found more gaps** — [user adds]

**Wait for user response before continuing.**

---

## Phase 1B: Brainstorm (interactive — always pauses)

Invoke the `brainstorming` skill (`wz:brainstorming`) and follow it.

This phase explores design approaches:
1. Propose 2-3 viable approaches with explicit trade-offs
2. For each approach: effort estimate, risk assessment, what it enables/prevents
3. Recommend one approach with rationale

If `team_mode: parallel` in config, the brainstorming skill activates its
**Agent Teams Structured Dialogue** mode:

1. Checks that `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is enabled (falls back
   to single-agent brainstorming if not)
2. Creates a team via `TeamCreate` (`wazir-brainstorm-<concept-slug>`)
3. Spawns three teammates via `Agent` with `team_name`:
   - **Free Thinker** — proposes creative directions via `SendMessage`
   - **Grounder** — challenges each direction with practical concerns via `SendMessage`
   - **Synthesizer** — observes silently, writes the design document on convergence
4. You (the Arbiter) coordinate the dialogue, signal convergence, and clean up
   with `TeamDelete`

See `skills/brainstorming/SKILL.md` "Team Mode: Agent Teams Structured Dialogue"
for full spawn prompts, convergence criteria, and constraints.

### Checkpoint 1B: Design Approval

> **Proposed design approaches:**
>
> [Approaches with trade-offs, recommendation]
>
> **Which approach should we implement?**
> 1. **Approach A** — [one-line summary]
> 2. **Approach B** — [one-line summary]
> 3. **Approach C** — [one-line summary]
> 4. **Modify an approach** — [user specifies changes]

**This is the most important checkpoint. Do NOT proceed without explicit design approval.**

Save approved design to `.wazir/runs/latest/clarified/design.md`.

### Design Review

After the user approves the design concept, invoke the design-review loop with `--mode design-review`. The **reviewer role** validates the design against the approved spec using the canonical design-review dimensions:

- Spec coverage
- Design-spec consistency
- Accessibility
- Visual consistency
- Exported-code fidelity

See `workflows/design-review.md` and `docs/reference/review-loop-pattern.md`. The designer resolves findings. Proceed to planning only after all design-review passes complete.

---

## Phase 1C: Plan (delegated, then checkpoint)

Delegate to `wz:writing-plans`:

1. `wz:writing-plans` (using **planner role**) produces a SINGLE execution plan
   at `.wazir/runs/latest/clarified/execution-plan.md` in spec-kit format
   (see `templates/artifacts/tasks-template.md`). The plan must contain:
   - `- [ ] T0XX` checklist items with sequential task IDs
   - `[P]` parallel markers for independent tasks on different files
   - `[US]` user story labels linking tasks to spec stories
   - Phase headings: Setup, Foundational, User Story phases, Polish
   - Each user story phase has: goal, independent test criteria, implementation tasks
   - File paths in every task description
   No `tasks/task-NNN/spec.md` files — all task detail lives inside the
   single execution plan. The executor reads this file directly.
2. **Gap analysis exit gate:** After the plan is produced:
   a. Read ALL files in `.wazir/input/` (briefing.md, tasks/*.md) AND `.wazir/runs/latest/clarified/user-feedback.md` (if exists).
   b. Read the produced execution plan.
   c. Invoke `wz:reviewer --mode plan-review` with prompt: "Compare the original input against this plan. List every requirement from the input that is missing, weakened, or has less detail in the plan."
   d. If reviewer finds gaps → planner fixes the plan → re-invoke reviewer → loop.
   e. Exit when EITHER: (a) reviewer returns CLEAN, OR (b) pass cap reached and user approves with known issues via interactive checkpoint.
3. The planner resolves findings from each pass.
4. Loop runs for `pass_counts[depth]` passes.

### Checkpoint 1C: Plan Review

> **Implementation plan: [N] tasks**
>
> | # | Task | Complexity | Dependencies | Description |
> |---|------|-----------|--------------|-------------|
> | 1 | ... | S | none | ... |
> | 2 | ... | M | task-1 | ... |
>
> **Review the plan. Approve or adjust?**
> 1. **Approved — ready for execution** (Recommended)
> 2. **Reorder or split tasks** — [user specifies]
> 3. **Missing tasks** — [user adds]
> 4. **Too granular / too coarse** — [user adjusts scope]

**Wait for user response before completing.**

---

## Done

When the plan is approved, present:

> **Clarification complete.**
>
> - Spec: `.wazir/runs/latest/clarified/spec-hardened.md`
> - Design: `.wazir/runs/latest/clarified/design.md`
> - Tasks: [count] tasks in `.wazir/runs/latest/tasks/`
> - Plan: `.wazir/runs/latest/clarified/execution-plan.md`
>
> **Next:** Run `/wazir:executor` to execute the plan.
