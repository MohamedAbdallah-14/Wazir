# Part I: Pre-Execution Pipeline

> Parent document: `docs/vision/pipeline.md`

Eight phases. Three interaction modes determine checkpoint behavior.

### Interaction Mode Behavior

| Phase | Auto | Guided | Interactive |
|-------|------|--------|-------------|
| 1. DISCOVER | autonomous | autonomous | **PAUSE** — present research findings |
| 2. CLARIFY | gating agent answers | **PAUSE** (interaction #1) | **PAUSE** — pair-program the clarification |
| 3. SPECIFY | autonomous | autonomous | **PAUSE** — walk through spec changes |
| 4. REVIEW(spec) | autonomous | autonomous | **PAUSE** — present hardening results |
| 4a. VISUAL DESIGN (conditional) | skip | skip | **PAUSE** — heavy collaboration (if enabled) |
| 5. DESIGN | gating agent picks | **PAUSE** (interaction #2) | **PAUSE** — co-design approach |
| 6. REVIEW(design) | autonomous | autonomous | autonomous |
| 7. PLAN | autonomous | autonomous | **PAUSE** — walk through plan |
| 8. REVIEW(plan) | autonomous | autonomous | autonomous |

**Auto**: external reviewer (Codex/Gemini) acts as gating agent. Escalates to human only on loop cap exceeded or "not doable."
**Guided**: 2 interaction points + boundary gates between pipeline parts.
**Interactive**: pair-programmer — stops between sub-phases, discusses findings, co-designs decisions. Between phases, the orchestrator asks the user to compact context (the main session accumulates discussion across checkpoints; compaction between phases prevents context rot from degrading later phases).

## Phase 1: DISCOVER

Extract all relevant info from user input. Scan the codebase (indexed, L1/L2/L3). Fetch external prior art. Determine affected scope. Define vague requirements from input.

**Subagents**: all independent work in parallel from the start:
- Agent 1: Extract and structure info from user input
- Agent 2: Deterministic index refresh (L1 structural + L2 text + optionally L3 semantic)
- Agent 3: Graph-based dependency traversal from changed entry points to affected modules
- Agent 4-N: Online research per topic (one agent per question)

All run simultaneously. Each writes full findings to disk, returns summary. Orchestrator assembles research brief from summaries.

**Output**: structured research brief on disk.

**Why this matters**: Wazir's moat. No competing tool does combined online + local research before specification. This directly attacks the "agents don't know best practices" problem.

## Phase 2: CLARIFY (User Interaction #1)

Deep understanding of all available info. Collect all questions. Ask the user in one shot. Business questions only — technical questions go to another agent. Surface uncertainties explicitly: "here's what I'm uncertain about and here's my best guess."

Can say "not doable" if research reveals the request is impossible, contradictory, or the wrong approach.

**Hard rule: research-first questions.** Phase 1 (DISCOVER) MUST complete before any user questions are asked. Questions are informed by evidence, not assumptions. "The project uses Supabase auth — should we extend that or add a separate provider?" beats "What auth system do you want?" Blind questions waste the user's time and produce worse answers.

**Input preservation.** User-provided detail is never removed, only augmented. Every acceptance criterion, API endpoint, color hex code, dimension, and specific value from the original input survives verbatim through clarification and all downstream transformations. Lossy summarization ("appropriate rate limiting" instead of "100 req/min per API key") is a defect.

**Visual design question.** During clarification, determine whether the project needs visual design artifacts:

1. **No visual design** — no UI work (API, CLI, backend, library). Proceed directly.
2. **Collaborative visual design** — co-design with pencil MCP or equivalent tools. Triggers the VISUAL DESIGN sub-phase (interactive mode only, heavy user collaboration). Only offered if design tools are detected.
3. **Design from references** — user provides existing designs (Figma links, screenshots, sketches) as input. Pipeline works from those without a visual design sub-phase.

If the user selects collaborative visual design but is not in interactive mode: "Collaborative visual design requires interactive mode. Switch to interactive, or pick another option."

**Output**: clean clarification artifact on disk. NOT the spec — structured understanding for the specify phase.

**Why separate from specify**: context conservation. Clarify is messy and iterative. Specify gets a clean input in a fresh context.

## Phase 3: SPECIFY

Structured specification with measurable acceptance criteria. Given/When/Then for scenarios. EARS notation (WHEN/SHALL/SHALL NOT/IF). Non-goals stated. Assumptions documented. Verification criteria (HOW to verify, not just WHAT) defined per requirement.

**Why verification criteria here**: TiCoder research — 45.73% accuracy improvement when tests are defined before code.

**Output**: `spec.md`

## Phase 4: REVIEW(spec)

Adversarial review. **Checklist**: completeness, consistency, clarity, verifiability, scope, YAGNI.

### Content-Author Detection (after spec review)

After spec hardening, scan the spec for content needs. Auto-enable the content-author workflow if the spec mentions any of: database seeding / seed data / fixtures, sample content / placeholder text / demo data, test fixtures / mock API responses, translations / i18n strings / localization, copy (button labels, error messages, onboarding text), documentation content / user guides / API docs, email templates / notification text.

If detected, the content-author workflow runs autonomously with a review loop — no human approval gate. Content artifacts are produced before visual design and planning so downstream phases can account for them. Content gaps discovered during execution are 10-100x more expensive to fix.

**Ordering when content-author is detected**: REVIEW(spec) → content-author → VISUAL DESIGN (if enabled) → DESIGN. The designer role expects author artifacts (microcopy, i18n keys, terminology) as input.

## Phase 4a: VISUAL DESIGN (conditional, interactive-only)

Runs only if the user selected "collaborative visual design" during CLARIFY and interaction mode is interactive. This is the most interaction-heavy part of the pipeline — the user and agent collaborate on visual designs using pencil MCP or equivalent tools.

**Produces**: design files (.fig or equivalent), design tokens (colors, spacing, typography), screenshot references of key frames. Optionally exports code scaffolds (Tailwind JSX, HTML+CSS) as reference — these are convenience exports, not architecture decisions. Phase 5 determines the implementation stack; scaffolds that don't match the chosen approach are discarded.

**Why pre-execution**: visual design during execution means the user modifies designs mid-build — too interaction-heavy and disrupts implementation flow. Visual artifacts are locked before planning.

**Review**: visual design artifacts are reviewed with visual-design-review dimensions (spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity). See review dimension sets.

## Phase 5: DESIGN — Architectural (User Interaction #2)

2-3 implementation approaches with trade-offs. Non-goals / no-gos. Affected files. Opinionated recommendation: "I recommend B because X. A trades off Y for Z."

This is architectural design — implementation approaches, not visual design. Visual design (if enabled) runs as Phase 4a before this phase.

**Output**: `design.md` — context, goals, non-goals, proposed solution, alternatives, trade-offs, open questions.

## Phase 6: REVIEW(design)

**Architectural design-review checklist**: feasibility, spec alignment, completeness, trade-off documentation, YAGNI, security/performance.

Note: this is a different dimension set from the visual design-review (Phase 4a), which uses: spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity. The two design phases have different review criteria because they evaluate different artifacts.

## Phase 7: PLAN

Ordered execution plan. Tasks decomposed into subtasks. Each subtask gets its own file.

```
plan/
├── plan.md (overview: task order, dependencies, parallelism, batches)
├── task-1/
│   ├── subtask-1.md
│   └── subtask-2.md
└── task-N/
    └── subtask-N.md
```

**plan.md contains**:
- **File dependency matrix**: which subtasks write/read which files. File written by 2+ subtasks → those subtasks MUST be sequential.
- **Convergence-point analysis**: shared registration files → generate Task 0 to refactor to auto-discovery BEFORE parallel work, or force sequential when explicit registration is intentional.
- **Execution batches**: subtasks grouped into waves by dependency. Natural pause points for handover.
- **Integration verification criteria**: exact commands to run after all subtasks merge.

**Each subtask.md contains**:
- Context, inputs, expected outputs
- Acceptance criteria (5 testable, EARS format)
- Verification criteria (actual commands, pre-defined)
- Pre/postconditions, constraints (what NOT to do)
- Dependencies
- **Expertise declarations**: stack, concerns, review_focus — maps to composition-map.yaml keys
- **Context budget**: READ FULL (with line counts), READ SECTION (with ranges), KNOW EXISTS

**Sizing**: each subtask fits within a single context window (~15-30 min). The 35-minute cliff and doubling failure law make this a hard constraint.

**Vertical slices**: each subtask delivers independently verifiable value through all layers. No horizontal slicing.

**The subtask file IS the agent's brief**: the composer reads it and assembles the right agent.

## Phase 8: REVIEW(plan)

**Checklist**: completeness (100% rule), ordering, testability, scope coverage, granularity, traceability, file matrix present, convergence points addressed, execution batches defined, integration verification defined, expertise declarations complete, context budgets set.

### Scope Coverage Hard Gate (after plan review)

Mechanical gate, separate from the review loop. Before the plan exits pre-execution:

1. List every distinct item/deliverable in the original input
2. For each input item, verify at least one task in the plan maps to it
3. If any input item has no mapped task → **BLOCK**

This is item-level traceability, not a count comparison. A vertical-slice task covering 3 input items is valid. 10 tasks that miss 2 input items is not. The check is: every input item is accounted for, not that task count >= item count.

The pipeline MUST NOT autonomously drop items into "future tiers", "deferred", or "out of scope." Every scope reduction requires explicit user approval. This is not a review finding (advisory) — it is a mechanical gate (blocking). The review loop's "100% rule" checklist item catches coverage issues during review; this gate catches them mechanically at the exit.

## Review Mechanism (Generic)

All reviews use the same mechanism: `review(artifact_path, checklist, original_input)`

1. Dispatch review subagent with fresh context
2. Subagent reads artifact + checklist + original user input (never production session)
3. Reviews on two dimensions: **internal consistency** (well-formed, complete, no contradictions) and **input alignment** (does this still serve what the user asked)
4. Produces structured findings: severity (CRITICAL/HIGH/MEDIUM/LOW), dimension, location, description, fix
5. If CRITICAL/HIGH → fix → re-review (new subagent, fresh context)
6. Track finding counts per round. Not decreasing after 2 rounds → escalate.
7. Max 3 rounds same-model. Cross-model pass if available.

**Why original input as reference**: every phase transforms the input. By plan phase, you're 5 transformations from what the user said. Without checking back, you're playing telephone. 79% of multi-agent failures are specification/coordination issues (Cemri et al. 2025).

**Why cross-context**: same-session review F1 24.6%, cross-context 28.6% (p=0.008). The reviewer can't anchor on the producer's reasoning.

**Why cross-model when available**: cross-family verification has the largest gains (Lu et al., 37 models). Different models have different blind spots.

### Reasoning Capture

Every pre-execution phase produces reasoning at two layers:

**Conversation layer**: before each sub-workflow, explain the trigger and why it matters. After each sub-workflow, state what was found and the counterfactual — what would have gone wrong without this phase.

**File layer**: structured entries written to `reasoning/phase-<name>-reasoning.md` per decision:
- **Trigger** — what prompted the decision
- **Options considered** — alternatives evaluated
- **Chosen** — selected option
- **Reasoning** — why
- **Confidence** — high/medium/low
- **Counterfactual** — what would go wrong without this

Reasoning artifacts serve two purposes: user transparency (they see WHY decisions were made) and the learning system (reasoning entries feed into pattern extraction in the completion pipeline).

### Implementation Quality Principle

If subtask files are detailed enough, even a weaker model can execute them. MAKER proved: small non-reasoning models achieved best reliability-per-dollar when decomposition was good enough. **The plan IS the intelligence. Execution is mechanical.**
