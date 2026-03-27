# Methodology — Research vs Vision Comparison

## Strengths

The vision document is exceptionally strong on methodology incorporation. This is the category where the pipeline most faithfully translates research into design.

### 1. TDD/Verification-First is Structurally Embedded

The research (`methodology/tdd-bdd-atdd.md`) identifies TiCoder's 45.73% accuracy improvement when tests are defined before code, and the "same author" problem where LLMs generating both code and tests share blind spots. The vision embeds this at three levels:

- **Phase 3 (SPECIFY)**: verification criteria defined per requirement, explicitly citing TiCoder. Direct hit.
- **Stage 1 (Execute)**: executor writes tests via TDD. The subtask.md provides EARS acceptance criteria as test specification — this is exactly the TiCoder pattern (human-validated tests before code).
- **Stage 3 (Verify)**: separate verifier agent catches tautological tests, directly addressing the 93%/58% coverage-vs-mutation gap from the research.

The research says "writing verification criteria before implementation improves output quality across every methodology, and the effect is AMPLIFIED for AI agents." The pipeline doesn't just agree — it enforces this at the structural level.

### 2. Layered Verification Strategy Matches Research Recommendation

The research (`methodology/tdd-bdd-atdd.md`, Synthesis point 4) recommends:
- ATDD acceptance criteria = task success criteria
- BDD Given-When-Then = scenario specs
- TDD unit tests = implementation checks
- PBT invariants = edge case catchers
- Contract-first = interface boundaries

The vision maps these almost 1:1:
- Phase 3 (SPECIFY) uses Given/When/Then and EARS notation — covers ATDD + BDD layers.
- Subtask.md has 5 testable acceptance criteria — covers ATDD layer.
- Executor writes TDD tests — covers TDD layer.
- Contract-first shows up in the file dependency matrix and interface verification in the plan.

### 3. RFC/Design Doc Structure Faithfully Applied

The research (`methodology/rfc-design-doc-processes.md`) identifies 7 universal principles and a minimum viable design doc with 8 sections. The vision's Phase 5 (DESIGN) output is: context, goals, non-goals, proposed solution, alternatives, trade-offs, open questions. That's 7 of 8 sections — only "Status" is missing, which is tracked separately in execution-state.json. This is a clean adaptation.

The research emphasizes "problem before solution" and "explicit scope boundaries (non-goals)." Both are structurally enforced: Phase 1-2 are problem-only, Phase 5 explicitly requires non-goals, Phase 4 reviews for YAGNI.

### 4. Task Decomposition Research Thoroughly Applied

The research (`methodology/task-decomposition.md`) identifies:
- INVEST criteria, vertical slices, WBS 100% rule
- 35-minute degradation cliff
- 5 acceptance criteria per task in EARS format
- Single context window as hard ceiling
- "Flow over batch: one task per context, commit before next"

The vision incorporates ALL of these:
- Phase 7 (PLAN) enforces vertical slices explicitly, calls horizontal slicing an anti-pattern.
- Sizing hard-constrains to single context window (~15-30 min), citing the 35-minute cliff.
- Subtask.md requires 5 testable acceptance criteria in EARS format.
- Phase 8 (REVIEW plan) checklist includes the 100% rule.
- Executor micro-commits after each logical step.

### 5. Consulting Delivery "Pre-Build Phase" Pattern Adopted

The research (`methodology/consulting-delivery.md`) finds that "every serious firm has a structured pre-build phase" and warns against BDUF and NDUF, recommending EDUF. The pipeline's 8-phase pre-execution pipeline IS the EDUF pattern — enough design to specify acceptance criteria and decompose into subtasks, not a 200-page spec.

The research identifies Shape Up's appetite-based scoping (time budget, not estimate) as "strongest fit for AI agents." The vision's single-context-window sizing and max_steps/max_cost hard limits are appetite-based constraints. The subtask doesn't estimate — it's budgeted by context window capacity.

### 6. ADR Principles in Decision Documentation

The research (`methodology/rfc-design-doc-processes.md`) highlights ADRs: immutable once accepted, stored in source control, sequential. The vision's "Design Decisions (Do Not Revisit Without Evidence)" table at the bottom of pipeline.md is a compressed ADR set with override conditions. The "LOCKED" status and amendment protocol match ADR discipline.

### 7. Requirements Engineering Cost Curve Drives Architecture

The research (`methodology/requirements-engineering.md`) documents Boehm's cost curve (1x requirements, 100x post-delivery) and that 40-50% of project effort is avoidable rework from requirements gaps. The vision explicitly front-loads 8 phases before any code is written. The "every phase runs, no shortcuts" principle is a direct response to this finding. The review mechanism checks back against original user input at every phase — directly addressing the telephone-game drift that causes requirements-related failures.

## Weaknesses

### 1. Property-Based Testing (PBT) Has No Structural Home

The research (`methodology/tdd-bdd-atdd.md`) explicitly calls out PBT as the solution to the "same author" problem: "Property-based testing breaks this with thousands of random adversarial inputs." The formal verification research (`methodology/formal-verification.md`) doubles down: "10 properties replace 100 examples" and "Hypothesis found password hashing bug at 512+ bytes — no human would write that example test."

The vision mentions PBT zero times. The layered verification strategy from the research includes "PBT invariants = edge case catchers" but the pipeline has no mechanism to generate, require, or verify property-based tests. The verifier checks for tautological tests but doesn't specifically check for property coverage.

This is a gap, not a contradiction. The pipeline doesn't reject PBT — it just doesn't include it anywhere in the spec, subtask template, or verifier checklist.

### 2. Design by Contract (DbC) Referenced but Not Formalized

The research (`methodology/formal-verification.md`) ranks "Pre/postconditions in spec (DbC in Markdown)" as #1 on the minimum viable verification stack — "near zero effort, massive clarity." It also states: "making assumptions explicit at every boundary is the highest-leverage quality intervention."

The vision's subtask.md includes pre/postconditions and constraints, which is good. But the pipeline never requires DbC-style contracts on the actual code output. The executor writes code with acceptance criteria and tests, but there's no instruction to encode preconditions and postconditions in the implementation itself (assertions, type guards, runtime checks). The research says this is the cheapest intervention with the highest leverage.

### 3. Requirements Smells Detection Not Operationalized

The research (`methodology/requirements-engineering.md`) catalogs specific requirements smells: subjective language, ambiguous adverbs, vague pronouns, loopholes ("if possible"), superlatives, open-ended terms. It also references the Paska tool achieving 89% precision on 2,725 industrial requirements.

The vision's Phase 4 (REVIEW spec) has a checklist of completeness, consistency, clarity, verifiability, scope, YAGNI — but no specific smell detection. "Clarity" is vague. The research provides a concrete, automatable list of anti-patterns that could be loaded into the reviewer's expertise modules. This would make spec reviews significantly more precise.

### 4. "Specify Collaboratively" Principle Partially Missing

The research (`methodology/rfc-design-doc-processes.md`, `methodology/requirements-engineering.md`) stresses collaborative specification: Three Amigos pattern (BDD), JAD workshops, perspective-based reviews catching +35% more defects. Specification by Example's key pattern #2 is "specify collaboratively."

The vision has exactly 2 user interaction points (Clarify and Design). Specification (Phase 3) is fully autonomous — no user involvement. The user never sees the spec. The user sees the design, but by then the spec is already written and reviewed. If the spec misinterprets the clarification output, the user has no chance to catch it until the final review (if at all).

The research says perspective-based reviews catch 35% more defects than ad-hoc. The spec review (Phase 4) is a single-perspective review by an AI agent. There's no "Three Amigos" equivalent — no cross-perspective validation of the spec before it drives all downstream work.

### 5. Formal Specification Options Acknowledged but Not Mapped

The research (`methodology/formal-verification.md`) identifies type-driven development as directly applicable: "`Phase<Planning>` cannot call `.implement()`" — the typestate pattern. It also discusses discriminated unions and branded types as partial specifications.

The vision mentions "strict types with discriminated unions" nowhere in the pipeline phases. The Composer section mentions structured XML and context budgeting, but there's no guidance for executors to use type-level enforcement. This is a missed opportunity — the research explicitly gave a Wazir-specific example.

### 6. "Alternatives Considered" Not in Spec Phase

The research (`methodology/rfc-design-doc-processes.md`) lists "Alternatives documented — not just 'what' but 'what else and why not'" as universal principle #4. The vision correctly includes alternatives in Phase 5 (DESIGN) but not in Phase 3 (SPECIFY). For specification, alternatives matter too: there may be multiple ways to specify the same requirement, with different testability and precision trade-offs. The spec review doesn't check for this.

### 7. No "Do Nothing" Baseline

The research (`methodology/rfc-design-doc-processes.md`, minimum viable design doc) explicitly lists "do nothing" as a required alternative. Amazon's PR-FAQ and Shape Up's betting table both include the option of not building. The vision's Phase 5 (DESIGN) requires 2-3 alternatives but doesn't mandate a "do nothing" analysis. This matters: Wazir should be able to recommend against building if the research reveals the request is low-value. Phase 2 (CLARIFY) can say "not doable" but there's no structural "not worth doing" option.

## Critical to Edit

### 1. Add Property-Based Testing to the Verification Stack

**Research finding**: PBT is the primary defense against the "same author" problem where LLMs share blind spots between code and tests (`methodology/tdd-bdd-atdd.md`, `methodology/formal-verification.md`). TiCoder shows 45.73% improvement. PBT with shrinking finds bugs no human imagines.

**Why critical**: The pipeline already identifies tautological tests as a known risk (93%/58% coverage-mutation gap). The verifier catches these retroactively, but PBT prevents them proactively. Without PBT, the pipeline relies entirely on example-based tests written by the same model family that wrote the code — exactly the failure mode the research warns about.

**Suggested edit**: In the subtask.md template (Phase 7 PLAN section), add a field: `properties: [list of invariants that must hold for all valid inputs]`. In the executor instructions, add: "For core logic, write property-based tests (fast-check/Hypothesis) for listed properties before writing example-based tests." In the verifier (Stage 3), add to the checklist: "Are listed properties covered by PBT? If not, why not?" In the Design Decisions table, add: "PBT for core logic | Same-author problem (TDD-BDD-ATDD research, formal verification research) | Learning data showing PBT false positive rate >30%."

### 2. Add Requirements Smell Detection to Spec Review Expertise

**Research finding**: Requirements smells (subjective language, ambiguous adverbs, vague pronouns, loopholes, superlatives) are detectable with 89% precision (`methodology/requirements-engineering.md`). Reviews catch 60% of defects (Boehm & Basili), and perspective-based reviews catch 35% more than ad-hoc.

**Why critical**: Phase 3 (SPECIFY) is the single most important artifact in the pipeline — every downstream phase depends on it. A vague spec propagates vagueness through design, plan, and execution. The current Phase 4 checklist says "clarity" without defining what clarity means. The research provides an exact, enumerable list.

**Suggested edit**: Create an expertise module `quality/requirements-smells.md` with the full smell catalog from the research (subjective language, ambiguous adverbs, vague pronouns, loopholes, superlatives, negatives, open-ended terms, incomplete references, coordination ambiguity). Load it into the Phase 4 reviewer via composition-map. Update the Phase 4 checklist from "clarity" to "clarity (zero requirements smells per quality/requirements-smells.md)."

### 3. Add DbC-in-Markdown to Subtask Template

**Research finding**: Pre/postconditions in spec ranked #1 on the minimum viable verification stack — "near zero effort, massive clarity" (`methodology/formal-verification.md`). "Making assumptions explicit at every boundary is the highest-leverage quality intervention."

**Why critical**: The subtask.md already has pre/postconditions, but these describe the subtask's contract with the pipeline, not the code's contract with its callers. If the executor doesn't encode these in the implementation (assertions, guards, type checks), they exist only as documentation. The research says the power of DbC is that contracts are executable — they catch violations at runtime, not just at review time.

**Suggested edit**: In the executor instructions (Stage 1 Execute), add: "Encode subtask preconditions as runtime guards (assertions, type checks, input validation) at function entry points. Encode postconditions as assertions or return-type contracts. The verifier will check that pre/postconditions from subtask.md have corresponding runtime enforcement in the implementation."

## Nice to Have

### 1. Executable Specifications (Gauge-Style)

The research (`methodology/formal-verification.md`) highlights Gauge (ThoughtWorks Markdown specs that ARE tests) and Concordion. The vision's spec.md is currently a Markdown document that gets reviewed but is not directly executable. Converting acceptance criteria into Gauge-style executable specs would make spec drift literally impossible — the spec runs as a test. Low priority because the verifier (Stage 3) already maps acceptance criteria to test evidence, achieving similar coverage.

### 2. Mutation Testing on Critical Paths

The research (`methodology/formal-verification.md`) ranks mutation testing #6 on the minimum viable stack. Google confirms mutants are similar to actual bugs. The vision doesn't mention mutation testing anywhere. Adding weekly or per-run mutation testing on critical paths would quantify test quality rather than relying on coverage metrics. Low priority because the verifier's tautological test detection partially covers this, and mutation testing has significant CI cost (25-45 min per Sentry's experience).

### 3. Snapshot/Golden Testing for Cross-Component Contracts

The research (`methodology/formal-verification.md`) identifies snapshot testing as good for "serialization formats, API response shapes, cross-version invariants." The pipeline's integration verification (Completion Stage 1) could use golden tests to catch cross-subtask interface drift. Low priority because the file dependency matrix and convergence-point analysis already address this at the planning level.

### 4. Shape Up's Hill Charts for Progress Visibility

The research (`methodology/consulting-delivery.md`) describes Hill Charts: uphill = resolving unknowns, downhill = execution. The pipeline's status protocol (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED, FAILED) is binary. Hill Charts would give the orchestrator richer progress signals, especially for long-running subtasks. Low priority because the pipeline's single-context-window sizing means subtasks are short enough that progress tracking is less critical.

### 5. IDEO Double Diamond for Problem Framing

The research (`methodology/consulting-delivery.md`) describes Double Diamond: diverge-converge twice (find right problem, build right solution). The pipeline's Phase 1 (DISCOVER) and Phase 2 (CLARIFY) map to Diamond 1. Phase 5 (DESIGN) maps to Diamond 2. But the diverge-converge pattern isn't explicit — Phase 1 diverges (parallel research agents) but there's no explicit convergence step before Phase 2. The orchestrator assembles a research brief from summaries, which is implicit convergence. Making it explicit would be cleaner but isn't blocking.

### 6. "Do Nothing" as a Required Alternative

The research mandates including "do nothing" as an alternative in design documents. Adding it to Phase 5's requirements would strengthen the pipeline's ability to recommend against low-value work. Low priority because Phase 2 (CLARIFY) already has "not doable" authority, and the broader issue (should we build this at all?) is fundamentally a user decision.

## Improvements

### Improvement 1: Add PBT Field to Subtask Template

**Section**: Phase 7 PLAN — subtask.md template
**Change**: Add `properties:` field listing invariants for property-based testing. Example: `properties: ["round-trip: parse(serialize(x)) == x for all valid configs", "idempotency: applying migration twice has same result as once"]`
**Why**: The "same author" problem is a known, researched failure mode for AI code generation. PBT is the researched countermeasure. The pipeline currently has no mechanism to invoke it. (`methodology/tdd-bdd-atdd.md` Section 7, `methodology/formal-verification.md` PBT section)

### Improvement 2: Create Requirements Smell Expertise Module

**Section**: Phase 4 REVIEW(spec) — reviewer expertise loading
**Change**: Create `expertise/quality/requirements-smells.md` containing the enumerated smell catalog. Update composition-map.yaml to load it for `reviewer_modes.spec-review`. Update Phase 4 checklist to reference it.
**Why**: "Clarity" is itself a requirement smell (vague term). The research provides a concrete, testable checklist that turns subjective review into objective detection. (`methodology/requirements-engineering.md` Requirements Smells section)

### Improvement 3: Add DbC Encoding Instruction to Executor

**Section**: Part II Stage 1 (Execute)
**Change**: After "runs verification criteria, writes output and status, dies" add: "Encodes subtask preconditions as runtime guards at public function boundaries and postconditions as return-type contracts or assertions. The verifier (Stage 3) checks that pre/postconditions from subtask.md have corresponding runtime enforcement."
**Why**: Ranked #1 on the minimum viable verification stack. Near-zero effort, converts documentation into executable safety checks. (`methodology/formal-verification.md` Design by Contract section, Minimum Viable Stack)

### Improvement 4: Add PBT Check to Verifier Checklist

**Section**: Part II Stage 3 (Verify)
**Change**: Add to verifier responsibilities: "Checks that subtask properties (if declared) are covered by property-based tests using fast-check, Hypothesis, or equivalent. Flags any declared property without PBT coverage."
**Why**: Completes the PBT loop. Properties declared in planning, implemented in execution, verified in verification. (`methodology/formal-verification.md` "10 properties replace 100 examples")

### Improvement 5: Expand Phase 4 Spec Review Checklist

**Section**: Phase 4 REVIEW(spec)
**Change**: Replace "completeness, consistency, clarity, verifiability, scope, YAGNI" with "completeness, consistency, clarity (zero requirements smells — see expertise module), verifiability (every requirement has a testable criterion), scope (non-goals present and justified), YAGNI, traceability (every requirement traces to user input)"
**Why**: "Clarity" and "verifiability" are too vague for an AI reviewer. Expanding them into concrete checks prevents the reviewer from rubber-stamping. Traceability is from requirements engineering research — it's how you catch drift early. (`methodology/requirements-engineering.md` IEEE 830 properties, validation section)

### Improvement 6: Add Typestate Pattern Guidance to Composer

**Section**: Architecture — The Composer
**Change**: In expertise module resolution, add a note: "For TypeScript/Rust stacks, auto-load `quality/typestate-patterns.md` — discriminated unions for state machines, branded types for domain identifiers, readonly for immutability. Make illegal states unrepresentable."
**Why**: The research gave a Wazir-specific example (`Phase<Planning>` cannot call `.implement()`). Type-level enforcement catches bugs at compile time — 40% of bugs per the formal verification research. This is stack-specific and belongs in the composition map. (`methodology/formal-verification.md` Type-Driven Development section)

### Improvement 7: Add "Alternatives Including Do-Nothing" to Phase 5 Template

**Section**: Phase 5 DESIGN output template
**Change**: Change "2-3 implementation approaches with trade-offs" to "2-3 implementation approaches with trade-offs, always including 'do nothing / minimal change' as a baseline for comparison"
**Why**: Universal principle #4 from RFC research. Every organization studied includes "do nothing" as an alternative. It forces honest cost-benefit analysis. Without it, every design review implicitly assumes building is worth it. (`methodology/rfc-design-doc-processes.md` Universal Principles, Minimum Viable Design Doc)
