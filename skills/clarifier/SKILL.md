---
name: wz:clarifier
description: Run the clarification pipeline — research, clarify scope, brainstorm design, generate task specs and execution plan. Pauses for user approval between phases.
---

# Clarifier

## Command Routing
Follow the Canonical Command Matrix in `hooks/routing-matrix.json`.
- Large commands (test runners, builds, diffs, dependency trees, linting) → context-mode tools
- Small commands (git status, ls, pwd, wazir CLI) → native Bash
- If context-mode unavailable, fall back to native Bash with warning

## Codebase Exploration
1. Query `wazir index search-symbols <query>` first
2. Use `wazir recall file <path> --tier L1` for targeted reads
3. Fall back to direct file reads ONLY for files identified by index queries
4. Maximum 10 direct file reads without a justifying index query
5. If no index exists: `wazir index build && wazir index summarize --tier all`

Run the Clarifier phase — everything from reading input to having an approved execution plan.

**Pacing rule:** This skill has mandatory user checkpoints between sub-workflows. Do NOT skip checkpoints. Do NOT combine sub-workflows. Complete each fully, present output, and wait for explicit user approval before advancing.

Review loops follow the pattern in `docs/reference/review-loop-pattern.md`. All reviewer invocations use explicit `--mode`.

**Standalone mode:** If no `.wazir/runs/latest/` exists, artifacts go to `docs/plans/` and review logs go alongside.

## Prerequisites

1. Check `.wazir/state/config.json` exists. If not, run `wazir init` first.
2. Check `.wazir/input/briefing.md` exists. If not, ask the user what they want to build and save it there.
3. Scan `input/` (project-level) and `.wazir/input/` (state-level) for additional input files. Present what's found.
4. Read config for `default_depth` and `multi_tool` settings.
5. **Load accepted learnings:** Glob `memory/learnings/accepted/*.md`. For each accepted learning, read scope tags. Inject learnings whose scope matches the current run's intent/stack into context. Limit: top 10 by confidence, most recent first. This is how prior run insights improve future runs.
6. Create a run directory if one doesn't exist:
   ```bash
   mkdir -p .wazir/runs/run-YYYYMMDD-HHMMSS/{sources,tasks,artifacts,reviews,clarified}
   ln -sfn run-YYYYMMDD-HHMMSS .wazir/runs/latest
   ```

---

## Context-Mode Usage

Read `context_mode` from `.wazir/state/config.json`:

- **If `context_mode.enabled: true`:** Use `fetch_and_index` for URL fetching, `search` for follow-up queries on indexed content. Use `execute` or `execute_file` for large outputs instead of Bash.
- **If `context_mode.enabled: false`:** Fall back to `WebFetch` for URLs and `Bash` for commands.

---

## Sub-Workflow 1: Research (discover workflow)

Delegate to the discover workflow (`workflows/discover.md`):

1. **Keyword extraction:** Read the briefing and extract concepts/terms that are vague, reference external standards, or use unfamiliar terminology.
   - **When to research:** concept references an external standard by name, uses a tool/library not seen in the codebase, or is ambiguous enough that two agents could interpret it differently.
   - **When NOT to research:** concept is fully defined in the input, or it's a well-known programming concept.
2. **Fetch sources:** For each concept needing research:
   - Use `fetch_and_index` (if context-mode available) or `WebFetch` to fetch the source.
   - Save fetched content to `.wazir/runs/latest/sources/`.
   - Track each fetch in `sources/manifest.json`.
3. **Error handling:** 404/unreachable → log failure, continue. Research is best-effort.
4. The **researcher role** produces the research artifact.
5. The **reviewer role** runs the research-review loop with `--mode research-review`.
6. Loop runs for `pass_counts[depth]` passes.

Save result to `.wazir/runs/latest/clarified/research-brief.md`.

### Checkpoint: Research Review

> **Research complete. Here's what I found:**
>
> [Summary of codebase state, relevant architecture, external context]
>
> 1. **Looks good, continue** (Recommended)
> 2. **Missing context** — let me add more information
> 3. **Wrong direction** — let me clarify the intent

**Wait for user response before continuing.**

---

## Sub-Workflow 2: Clarify (clarify workflow)

### Input Preservation (before producing clarification)

1. Glob `.wazir/input/tasks/*.md`. If files exist:
   - Adopt those specs as the starting point — copy content verbatim into the clarification's item descriptions.
   - Enhance with codebase scan + research findings. **Never remove detail — only add.**
   - Every acceptance criterion from input must appear verbatim.
   - Every API endpoint, color hex code, and UI dimension from input must appear in the relevant item section.
2. If `.wazir/input/tasks/` is empty or missing, synthesize from `briefing.md` alone.

### Clarification Production

Read the briefing, research brief, and codebase context. Produce:

- **What** we're building — concrete deliverables
- **Why** — the motivation and business value
- **Constraints** — technical, timeline, dependencies
- **Assumptions** — what we're taking as given
- **Scope boundaries** — what's IN and what's explicitly OUT
- **Unresolved questions** — anything ambiguous

Save to `.wazir/runs/latest/clarified/clarification.md`.

Invoke `wz:reviewer --mode clarification-review`. Resolve findings before presenting to user.

### Checkpoint: Clarification Review

> **Here's the clarified scope:**
>
> [Full clarification]
>
> 1. **Approved — continue to spec hardening** (Recommended)
> 2. **Needs changes** — [user provides corrections]
> 3. **Missing important context** — [user adds information]

**Wait for user response.** Route feedback: plan corrections → `user-feedback.md`, new requirements → `briefing.md`.

---

## Sub-Workflow 3: Spec Harden (specify + spec-challenge workflows)

Delegate to the specify workflow (`workflows/specify.md`):

1. The **specifier role** produces a measurable spec from clarification + research.
2. Invoke `wz:reviewer --mode spec-challenge`.
3. Loop runs for `pass_counts[depth]` passes.

Save result to `.wazir/runs/latest/clarified/spec-hardened.md`.

### Content-Author Detection

After spec hardening, scan the spec for content needs. Auto-enable the `author` workflow if the spec mentions any of:
- Database seeding, seed data, fixtures, sample records
- Sample content, placeholder text, demo data
- Test fixtures, mock API responses, test data files
- Translations, i18n strings, localization
- Copy (button labels, error messages, onboarding text)
- Documentation content, user guides, API docs
- Email templates, notification text

If detected, set `workflow_policy.author.enabled = true` in the run config and note:
> **Content needs detected.** The content-author workflow will run after design approval to produce: [list detected content types].

### Checkpoint: Hardened Spec Review

> **Spec hardened. Changes made:**
>
> [List of gaps found and how they were tightened]
>
> 1. **Approved — continue to brainstorming** (Recommended)
> 2. **Disagree with a change** — [user specifies]
> 3. **Found more gaps** — [user adds]

**Wait for user response.**

---

## Sub-Workflow 4: Brainstorm (design + design-review workflows)

Invoke the `brainstorming` skill (`wz:brainstorming`):

1. Propose 2-3 viable approaches with explicit trade-offs
2. For each approach: effort estimate, risk assessment, what it enables/prevents
3. Recommend one approach with rationale

### Checkpoint: Design Approval

> **Which approach should we implement?**
>
> 1. **Approach A** — [one-line summary] (Recommended)
> 2. **Approach B** — [one-line summary]
> 3. **Approach C** — [one-line summary]
> 4. **Modify an approach** — [user specifies changes]

**Wait for user response.** This is the most important checkpoint.

Save approved design to `.wazir/runs/latest/clarified/design.md`.

After approval: design-review loop with `--mode design-review` (5 canonical dimensions: spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity).

---

## Sub-Workflow 5: Plan (plan + plan-review workflows)

Delegate to `wz:writing-plans`:

1. Planner produces a SINGLE execution plan at `.wazir/runs/latest/clarified/execution-plan.md` in spec-kit format.
2. **Gap analysis exit gate:** Compare original input against plan. Invoke `wz:reviewer --mode plan-review`.
3. Loop until clean or cap reached.

### Checkpoint: Plan Review

> **Implementation plan: [N] tasks**
>
> | # | Task | Complexity | Dependencies | Description |
> |---|------|-----------|--------------|-------------|
>
> 1. **Approved — ready for execution** (Recommended)
> 2. **Reorder or split tasks**
> 3. **Missing tasks**
> 4. **Too granular / too coarse**

**Wait for user response.**

---

## Done

When the plan is approved:

> **Clarifier phase complete.**
>
> - Spec: `.wazir/runs/latest/clarified/spec-hardened.md`
> - Design: `.wazir/runs/latest/clarified/design.md`
> - Plan: `.wazir/runs/latest/clarified/execution-plan.md`
>
> **Next:** Run `/executor` to implement the plan.
