---
name: wz:clarifier
description: Run the clarification pipeline — research, clarify scope, brainstorm design, generate task specs and execution plan. Pauses for user approval between phases.
---
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->

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

**Pacing rule:** This skill has checkpoints between sub-workflows. Checkpoint behavior depends on `interaction_mode` (see Interaction Mode Behavior below). In `interactive` mode, all checkpoints pause. In `guided` mode, only Clarify and Design pause. In `auto` mode, no checkpoints pause — the gating agent handles decisions. Do NOT combine sub-workflows regardless of mode. Complete each fully before advancing.

Review loops follow the pattern in `docs/reference/review-loop-pattern.md`. All reviewer invocations use explicit `--mode`.

**Standalone mode:** If no `.wazir/runs/latest/` exists, artifacts go to `docs/plans/` and review logs go alongside.

## Prerequisites

1. Check `.wazir/state/config.json` exists. If not, run `wazir init` first.
2. Check `.wazir/input/briefing.md` exists. If not, ask the user what they want to build and save it there.
3. Scan `input/` (project-level) and `.wazir/input/` (state-level) for additional input files. Present what's found.
4. Read `depth` from `run-config.yaml`. Read `multi_tool` from `.wazir/state/config.json`.
5. Read `interaction_mode` from `run-config.yaml` (values: `auto`, `guided`, `interactive`; default: `guided`).
6. **Load accepted learnings:** Glob `memory/learnings/accepted/*.md`. For each accepted learning, read scope tags. Inject learnings whose scope matches the current run's intent/stack into context. Limit: top 10 by confidence, most recent first. This is how prior run insights improve future runs.
7. Create a run directory if one doesn't exist:
   ```bash
   mkdir -p .wazir/runs/run-YYYYMMDD-HHMMSS/{sources,tasks,artifacts,reviews,clarified}
   ln -sfn run-YYYYMMDD-HHMMSS .wazir/runs/latest
   ```

---

## Interaction Mode Behavior

Checkpoints are conditional on `interaction_mode`:

| Sub-Workflow | Auto | Guided | Interactive |
|--------------|------|--------|-------------|
| SW1: Research | skip | skip | **PAUSE** — present research findings |
| SW2: Clarify | gating agent answers | **PAUSE** | **PAUSE** — pair-program the clarification |
| SW3: Spec Harden | skip | skip | **PAUSE** — walk through spec changes |
| SW3a: Visual Design | skip | skip | **PAUSE** — heavy collaboration (if enabled) |
| SW4: Brainstorm | gating agent picks | **PAUSE** | **PAUSE** — co-design approach |
| SW5: Plan | skip | skip | **PAUSE** — walk through plan |

**Auto**: gating agent (external reviewer) handles Clarify/Design decisions. Escalates to human only on loop cap exceeded or "not doable."
**Guided**: 2 interaction points (Clarify + Design) + boundary gates between pipeline parts.
**Interactive**: pair-programmer — stops between sub-phases, discusses findings, co-designs decisions.

---

## Context-Mode Usage

Read `context_mode` from `.wazir/state/config.json`:

- **If `context_mode.enabled: true`:** Use `fetch_and_index` for URL fetching, `search` for follow-up queries on indexed content. Use `execute` or `execute_file` for large outputs instead of Bash.
- **If `context_mode.enabled: false`:** Fall back to `WebFetch` for URLs and `Bash` for commands.

---

## Sub-Workflow 1: Research (discover workflow)

**Before starting this phase, output to the user:**

> **Research** — About to scan the codebase and fetch external references to understand the existing architecture, tech stack, and any standards referenced in the briefing.
>
> **Why this matters:** Without research, I'd assume the wrong framework version, miss existing patterns in the codebase, and contradict established conventions. Every wrong assumption here cascades into a wrong spec and wrong implementation.
>
> **Looking for:** Existing code patterns, dependency versions, external standard definitions, architectural constraints

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

**After completing this phase, output to the user:**

> **Research complete.**
>
> **Found:** [N] external sources fetched, [N] codebase patterns identified, [N] architectural constraints documented
>
> **Without this phase:** Spec would be built on assumptions instead of evidence — wrong framework APIs, missed existing utilities, contradicted naming conventions
>
> **Changed because of this work:** [List of key discoveries — e.g., "found existing auth middleware at src/middleware/auth.ts", "project uses Vitest not Jest"]

### Checkpoint: Research Review

**Mode gate:** This checkpoint pauses only in `interactive` mode. In `auto` and `guided` modes, research flows directly to the next sub-workflow.

**If `interaction_mode == interactive`:**

> **Research complete. Here's what I found:**
>
> [Summary of codebase state, relevant architecture, external context]

Ask the user via AskUserQuestion:
- **Question:** "Does the research look complete and accurate?"
- **Options:**
  1. "Looks good, continue" *(Recommended)*
  2. "Missing context — let me add more information"
  3. "Wrong direction — let me clarify the intent"

Wait for the user's selection before continuing.

**If `interaction_mode == auto` or `guided`:** Log research summary to reasoning file and continue.

**All modes:** If research reveals the request is impossible, contradictory, or fundamentally wrong approach — present evidence and stop before proceeding to questions. This is not a checkpoint; it's a guard. In `auto` mode, escalate to the gating agent. In `guided`/`interactive`, present to the user.

---

## Sub-Workflow 2: Clarify (clarify workflow)

**Before starting this phase, output to the user:**

> **Clarification** — About to transform the briefing and research into a precise scope document with explicit constraints, assumptions, and boundaries.
>
> **Why this matters:** Without explicit clarification, "add user auth" could mean OAuth, magic links, or username/password. Every ambiguity left here becomes a 50/50 coin flip during implementation that could produce the wrong feature.
>
> **Looking for:** Ambiguous requirements, implicit assumptions, missing constraints, scope boundaries, unresolved questions

### Input Preservation (before producing clarification)

1. Glob `.wazir/input/tasks/*.md`. If files exist:
   - Adopt those specs as the starting point — copy content verbatim into the clarification's item descriptions.
   - Enhance with codebase scan + research findings. **Never remove detail — only add.**
   - Every acceptance criterion from input must appear verbatim.
   - Every API endpoint, color hex code, and UI dimension from input must appear in the relevant item section.
2. If `.wazir/input/tasks/` is empty or missing, synthesize from `briefing.md` alone.

### Informed Question Batching (after research, before producing clarification)

Research has completed. You now have codebase context and external findings. Before producing the clarification, ask the user INFORMED questions — informed by the research, not guesses.

**Rules:**
1. **Research runs FIRST, questions come AFTER.** Never ask questions before research completes.
2. **Batch questions:** 1-3 batches of 3-7 questions each. Never one-at-a-time.
3. **Every scope exclusion must be explicitly confirmed by the user.** You MUST NOT decide that something is "out of scope" without asking. If the input doesn't mention docs, ask: "The input doesn't mention documentation — should we include API docs, or is that explicitly out of scope?" Do NOT assume.
4. **If the input is clear and complete:** Zero questions is fine. State: "Input is clear and specific. No ambiguities detected. Proceeding with clarification."
5. **In auto mode (`interaction_mode: auto`):** Questions go to the gating agent, not the user.
6. **In interactive mode (`interaction_mode: interactive`):** More detailed questions, present research findings that informed each question.

**Question format:**
```
Based on research, I have [N] questions before proceeding:

**Scope & Intent**
1. [Question informed by research finding]
2. [Question about ambiguous requirement]

**Technical Decisions**
3. [Question about architecture choice discovered during research]
4. [Question about dependency/framework preference]

**Boundaries**
5. [Explicit scope boundary question — "Should X be included or excluded?"]
```

Ask via AskUserQuestion with the full batch. Wait for answers. If answers introduce new ambiguity, ask a follow-up batch (max 3 batches total).

### Visual Design Triage (after question batching)

During clarification, determine whether the project needs visual design artifacts.

**Design tool detection:** Before asking, check if pencil MCP or equivalent design tools are available. Option 2 (collaborative) is only offered if design tools are detected.

**Mode gate:** In `auto` mode, this question goes to the gating agent. In `guided` and `interactive` modes, ask the user.

**Question:** "Does this project need visual design?"
**Options:**
1. **No visual design** — no UI work (API, CLI, backend, library). Proceed directly to clarification production.
2. **Collaborative visual design** — co-design with pencil MCP or equivalent tools. Triggers the VISUAL DESIGN sub-phase (Phase 4a). Requires interactive mode. *(Only shown if design tools detected.)*
3. **Design from references** — you provide existing designs (Figma links, screenshots, sketches) as input. Pipeline works from those without a visual design sub-phase.

**If the user selects option 2 but `interaction_mode` is not `interactive`:**

> Collaborative visual design requires interactive mode. Switch to interactive, or pick another option.

**In `auto` mode:** Gating agent evaluates — defaults to option 1 (no visual design) unless input explicitly references UI/visual work.

Set `workflow_policy.visual_design.enabled` and `workflow_policy.visual_design.mode` in the run config based on the answer.

### Clarification Production

Read the briefing, research brief, user answers to questions, and codebase context. Produce:

- **What** we're building — concrete deliverables
- **Why** — the motivation and business value
- **Constraints** — technical, timeline, dependencies
- **Assumptions** — what we're taking as given (each explicitly confirmed by user or clearly stated in input)
- **Scope boundaries** — what's IN and what's explicitly OUT (every exclusion must reference the user's confirmation: "Out of scope per user confirmation in question batch 1, Q5")
- **Unresolved questions** — anything still ambiguous after question batches

Save to `.wazir/runs/latest/clarified/clarification.md`.

Invoke `wz:reviewer --mode clarification-review`. Resolve findings before presenting to user.

**After completing this phase, output to the user:**

> **Clarification complete.**
>
> **Found:** [N] ambiguities resolved, [N] assumptions documented, [N] scope boundaries defined, [N] items explicitly marked out-of-scope
>
> **Without this phase:** Implementation would proceed with hidden assumptions, scope would creep mid-build, and acceptance criteria would be vague enough to pass any implementation
>
> **Changed because of this work:** [List of resolved ambiguities — e.g., "clarified auth means OAuth2 with Google provider only", "out-of-scope: mobile responsive for v1"]

### Checkpoint: Clarification Review

**Mode gate:** This checkpoint pauses in `guided` and `interactive` modes. In `auto` mode, the gating agent evaluates the clarification.

**If `interaction_mode == interactive` or `guided`:**

> **Here's the clarified scope:**
>
> [Full clarification]

Ask the user via AskUserQuestion:
- **Question:** "Does the clarified scope accurately capture what you want to build?"
- **Options:**
  1. "Approved — continue to spec hardening" *(Recommended)*
  2. "Needs changes — let me provide corrections"
  3. "Missing important context — let me add information"

Wait for the user's selection before continuing. Route feedback: plan corrections → `user-feedback.md`, new requirements → `briefing.md`.

**If `interaction_mode == auto`:** Submit clarification artifact to gating agent. If gating agent approves, continue. If gating agent requests changes, loop. If gating agent escalates, present to user.

---

## Sub-Workflow 3: Spec Harden (specify + spec-challenge workflows)

**Before starting this phase, output to the user:**

> **Spec Hardening** — About to convert the clarified scope into a measurable, testable specification and then run adversarial spec-challenge review to find gaps.
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->
>
> **Why this matters:** Without hardening, acceptance criteria stay vague ("it should work well") instead of measurable ("response time under 200ms for 95th percentile"). Vague specs pass any implementation, making review meaningless.
>
> **Looking for:** Untestable criteria, missing error handling specs, undefined edge cases, performance requirements, security constraints

Delegate to the specify workflow (`workflows/specify.md`):

1. The **specifier role** produces a measurable spec from clarification + research.
2. Invoke `wz:reviewer --mode spec-challenge`.
3. Loop runs for `pass_counts[depth]` passes.

Save result to `.wazir/runs/latest/clarified/spec-hardened.md`.

**After completing this phase, output to the user:**

> **Spec Hardening complete.**
>
> **Found:** [N] acceptance criteria tightened, [N] edge cases added, [N] error handling requirements specified, [N] spec-challenge findings resolved
>
> **Without this phase:** Acceptance criteria would be subjective, review would have no concrete standard to measure against, and "done" would mean whatever the implementer decided
>
> **Changed because of this work:** [List of hardening changes — e.g., "added 404 handling spec for missing resources", "specified max payload size of 5MB", "added rate limit requirement of 100 req/min"]

### Content-Author Detection

After spec hardening, scan the spec for content needs. Auto-enable the `author` workflow if the spec mentions any of:
- Database seeding, seed data, fixtures, sample records
- Sample content, placeholder text, demo data
- Test fixtures, mock API responses, test data files
- Translations, i18n strings, localization
- Copy (button labels, error messages, onboarding text)
- Documentation content, user guides, API docs
- Email templates, notification text

If detected, set `workflow_policy.author.enabled = true` in the run config.

**Content-author runs autonomously** with its own review loop — no human approval gate. It produces content artifacts (microcopy, i18n keys, terminology, seed data) that downstream phases need.

**Ordering when content-author is detected:**
1. REVIEW(spec) completes
2. Content-author workflow runs (autonomous, review loop)
3. VISUAL DESIGN runs (if enabled and `interaction_mode == interactive`)
4. DESIGN (architectural brainstorming)

The designer role expects content-author artifacts as input. Content gaps discovered during execution are 10-100x more expensive to fix.

> **Content needs detected.** The content-author workflow will now run autonomously to produce: [list detected content types]. No approval needed — review loop ensures quality.

### Checkpoint: Hardened Spec Review

**Mode gate:** This checkpoint pauses only in `interactive` mode. In `auto` and `guided` modes, the hardened spec flows directly to the next sub-workflow.

**If `interaction_mode == interactive`:**

> **Spec hardened. Changes made:**
>
> [List of gaps found and how they were tightened]

Ask the user via AskUserQuestion:
- **Question:** "Are the spec hardening changes acceptable?"
- **Options:**
  1. "Approved — continue to brainstorming" *(Recommended)*
  2. "Disagree with a change — let me specify"
  3. "Found more gaps — let me add"

Wait for the user's selection before continuing.

**If `interaction_mode == auto` or `guided`:** Log spec hardening summary to reasoning file and continue.

---

## Sub-Workflow 3a: Visual Design (conditional, interactive-only)

**Condition:** Only runs if `workflow_policy.visual_design.enabled == true` AND `workflow_policy.visual_design.mode == "collaborative"` AND `interaction_mode == interactive`.

If conditions are met, delegate to the design workflow (`workflows/design.md`):

1. The **designer role** produces visual design artifacts using pencil MCP or equivalent tools.
2. This is the most interaction-heavy part of the pipeline — heavy user collaboration.
3. After user approves the visual designs, invoke `wz:reviewer --mode visual-design-review`.
4. Loop runs for `pass_counts[depth]` passes.

**Produces:** design files, design tokens (colors, spacing, typography), screenshot references. Optionally exports code scaffolds as reference — these are convenience exports, not architecture decisions. Phase 5 determines the implementation stack.

Save result to `.wazir/runs/latest/clarified/visual-design/`.

### Checkpoint: Visual Design Review

**Mode gate:** This sub-workflow only runs in `interactive` mode, so this checkpoint always pauses.

Present visual designs to the user for approval before proceeding to architectural design.

**If conditions are NOT met:** Skip directly to Sub-Workflow 4 (Brainstorm).

---

## Sub-Workflow 4: Brainstorm (design + design-review workflows)

**Before starting this phase, output to the user:**

> **Brainstorming** — About to propose 2-3 design approaches with explicit trade-offs, then run design-review on the approved choice.
>
> **Why this matters:** Without exploring alternatives, the first approach that comes to mind gets built — even if a simpler, more maintainable, or more performant option exists. This is where architectural mistakes get caught cheaply instead of discovered during implementation.
>
> **Looking for:** Architectural trade-offs, scalability implications, complexity vs. simplicity, alignment with existing codebase patterns

Invoke the `brainstorming` skill (`wz:brainstorming`):

1. Propose 2-3 viable approaches with explicit trade-offs
2. For each approach: effort estimate, risk assessment, what it enables/prevents
3. Recommend one approach with rationale

### Checkpoint: Design Approval

**Mode gate:** This checkpoint pauses in `guided` and `interactive` modes. In `auto` mode, the gating agent selects the approach.

**If `interaction_mode == interactive` or `guided`:**

Ask the user via AskUserQuestion:
- **Question:** "Which design approach should we implement?"
- **Options:**
  1. "Approach A — [one-line summary]" *(Recommended)*
  2. "Approach B — [one-line summary]"
  3. "Approach C — [one-line summary]"
  4. "Modify an approach — let me specify changes"

Wait for the user's selection before continuing. This is the most important checkpoint.

**If `interaction_mode == auto`:** Submit all approaches with trade-offs to gating agent. Gating agent selects one or escalates to user.

Save approved design to `.wazir/runs/latest/clarified/design.md`.

**After completing this phase, output to the user:**

> **Brainstorming complete.**
>
> **Found:** [N] approaches evaluated, [N] trade-offs documented, [N] design-review findings resolved
>
> **Without this phase:** The first viable approach would be built without considering alternatives — potentially choosing a complex solution when a simple one exists, or an approach that conflicts with existing patterns
>
> **Changed because of this work:** [Selected approach and why, rejected alternatives and why, design-review adjustments made]

After approval: design-review loop with `--mode architectural-design-review` (6 architectural dimensions: feasibility, spec alignment, completeness, trade-off documentation, YAGNI, security/performance). See `docs/reference/review-loop-pattern.md` for the full dimension set.

---

## Sub-Workflow 5: Plan (plan + plan-review workflows)

**Before starting this phase, output to the user:**

> **Planning** — About to break the approved design into ordered, dependency-aware implementation tasks with a gap analysis against the original input.
>
> **Why this matters:** Without explicit planning, tasks get implemented in the wrong order (breaking dependencies), items from the input get silently dropped, and task granularity is either too coarse (monolithic changes that are hard to review) or too fine (overhead without value).
>
> **Looking for:** Correct dependency ordering, complete input coverage, appropriate task granularity, clear acceptance criteria per task

Delegate to `wz:writing-plans`:

1. Planner produces a SINGLE execution plan at `.wazir/runs/latest/clarified/execution-plan.md` in spec-kit format.
2. **Gap analysis exit gate:** Compare original input against plan. Invoke `wz:reviewer --mode plan-review`.
3. Loop until clean or cap reached.

**After completing this phase, output to the user:**

> **Planning complete.**
>
> **Found:** [N] tasks created, [N] dependencies mapped, [N] plan-review findings resolved, [N] gap analysis items addressed
>
> **Without this phase:** Tasks would be implemented in ad-hoc order breaking dependencies, input items would be silently dropped, and task sizes would vary wildly making review inconsistent
>
> **Changed because of this work:** [Task count, dependency chain summary, any items reordered or split during plan-review]

### Checkpoint: Plan Review

**Mode gate:** This checkpoint pauses only in `interactive` mode. In `auto` and `guided` modes, the plan flows to the scope coverage gate and then to execution.

**If `interaction_mode == interactive`:**

> **Implementation plan: [N] tasks**
>
> | # | Task | Complexity | Dependencies | Description |
> |---|------|-----------|--------------|-------------|

Ask the user via AskUserQuestion:
- **Question:** "Does the implementation plan look correct and complete?"
- **Options:**
  1. "Approved — ready for execution" *(Recommended)*
  2. "Reorder or split tasks"
  3. "Missing tasks"
  4. "Too granular / too coarse"

Wait for the user's selection before continuing.

**If `interaction_mode == auto` or `guided`:** Log plan summary to reasoning file. Proceed to scope coverage gate.

---

### Scope Coverage Gate (Hard Gate)

Mechanical gate, separate from the review loop. Before the plan exits pre-execution:

1. List every distinct item/deliverable in the original input (`.wazir/input/briefing.md` + any `input/*.md` files)
2. For each input item, verify at least one task in the plan maps to it
3. **If any input item has no mapped task → BLOCK:**

> **Scope coverage failure.** The following input items have no mapped task in the plan:
>
> | Input Item | Status |
> |-----------|--------|
> | [item description] | **UNMAPPED** |
> | ... | ... |

Ask the user via AskUserQuestion:
- **Question:** "[N] input items are not covered by any task. How should we proceed?"
- **Options:**
  1. "Add missing items to the plan" *(Recommended)*
  2. "Approve reduced scope — I confirm these items can be dropped"

This is **item-level traceability**, not a count comparison. A vertical-slice task covering 3 input items is valid. 10 tasks that miss 2 input items is not. The check is: every input item is accounted for, not that task count >= item count.

**The clarifier MUST NOT autonomously drop items into "future tiers", "deferred", or "out of scope" without explicit user approval. This is a hard rule.** The review loop's "100% rule" checklist item catches coverage issues during review; this gate catches them mechanically at the exit.

---

## Reasoning Output

Throughout the clarifier phase, produce reasoning at two layers:

**Conversation (Layer 1):** Before each sub-workflow, explain the trigger and why it matters. After each sub-workflow, state what was found and the counterfactual — what would have gone wrong without it.

**File (Layer 2):** Write `.wazir/runs/<id>/reasoning/phase-clarifier-reasoning.md` with structured entries per decision:
- **Trigger** — what prompted the decision
- **Options considered** — alternatives evaluated
- **Chosen** — selected option
- **Reasoning** — why
- **Confidence** — high/medium/low
- **Counterfactual** — what would go wrong without this info

Examples of clarifier reasoning entries:
- "Trigger: input says 'auth' without specifying provider. Options: ask user, assume OAuth2, assume magic links. Chosen: ask user. Counterfactual: assuming OAuth2 when user wanted Supabase auth = wrong middleware, 2 days rework."
- "Trigger: 13 items in input. Options: plan all 13, tier into must/should/could. Chosen: plan all 13 (user explicitly said 'do not tier'). Counterfactual: tiering would silently drop 5 items."

## Done

When the plan is approved:

> **Clarifier phase complete.**
>
> - Spec: `.wazir/runs/latest/clarified/spec-hardened.md`
> - Design: `.wazir/runs/latest/clarified/design.md`
> - Plan: `.wazir/runs/latest/clarified/execution-plan.md`
>
> **Next:** Run `/executor` to implement the plan.

<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->