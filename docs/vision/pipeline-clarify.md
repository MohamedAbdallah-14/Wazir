# Part I: Pre-Execution Pipeline

> Parent document: `docs/vision/pipeline.md`

Eight phases. Two user interactions. Everything else autonomous.

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

**Output**: clean clarification artifact on disk. NOT the spec — structured understanding for the specify phase.

**Why separate from specify**: context conservation. Clarify is messy and iterative. Specify gets a clean input in a fresh context.

## Phase 3: SPECIFY

Structured specification with measurable acceptance criteria. Given/When/Then for scenarios. EARS notation (WHEN/SHALL/SHALL NOT/IF). Non-goals stated. Assumptions documented. Verification criteria (HOW to verify, not just WHAT) defined per requirement.

**Why verification criteria here**: TiCoder research — 45.73% accuracy improvement when tests are defined before code.

**Output**: `spec.md`

## Phase 4: REVIEW(spec)

Adversarial review. **Checklist**: completeness, consistency, clarity, verifiability, scope, YAGNI.

## Phase 5: DESIGN (User Interaction #2)

2-3 implementation approaches with trade-offs. Non-goals / no-gos. Affected files. Opinionated recommendation: "I recommend B because X. A trades off Y for Z."

**Output**: `design.md` — context, goals, non-goals, proposed solution, alternatives, trade-offs, open questions.

## Phase 6: REVIEW(design)

**Checklist**: feasibility, spec alignment, completeness, trade-off documentation, YAGNI, security/performance.

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

### Implementation Quality Principle

If subtask files are detailed enough, even a weaker model can execute them. MAKER proved: small non-reasoning models achieved best reliability-per-dollar when decomposition was good enough. **The plan IS the intelligence. Execution is mechanical.**
