# Tools Landscape -- Research vs Vision Comparison

## Strengths

Where the vision correctly incorporates research findings.

### 1. The full-pipeline gap is correctly identified and exploited

The landscape overview (`landscape-overview.md`) documents that "Nobody Does the Full Pipeline" -- no single tool covers research through enforcement. The vision's 8-phase pre-execution pipeline (Discover, Clarify, Specify, Review, Design, Review, Plan, Review) directly fills this gap. The comparison table in `landscape-overview.md` shows every competitor missing at least 2-3 phases. The vision covers all of them. This is Wazir's strongest positioning decision.

### 2. Research/clarification before specification is correctly prioritized

`landscape-overview.md` key finding #2: "The clarification/research gap is universal. Almost no tool asks clarifying questions or does research before specification." The vision's Phase 1 (DISCOVER) and Phase 2 (CLARIFY) directly address this. Only Devika does web research before coding (`landscape-overview.md`, Category 1), and even it skips specification entirely. The vision is the only design that combines online research + codebase analysis + user clarification before any spec work.

### 3. Structured artifacts over free-form chat

`chatdev-metagpt.md` provides the definitive finding: MetaGPT (structured artifacts, publish/subscribe) beat ChatDev (pairwise dialogue) on every metric -- executability 3.75/4 vs 2.95/4, token efficiency 126.5 vs 248.9 tokens/line, human revision cost 0.83 vs 2.25. The vision's architecture (file system as communication bus, structured phase outputs, no agent-to-agent messages) directly implements the MetaGPT model. Principle 6 ("The file system is the communication bus") is the correct architectural response.

### 4. Fresh subagents per task matches Superpowers validation

`repos/superpowers.md` documents that Superpowers' recommended mode is "subagent-driven development" with "fresh subagent per task" because it "prevents context pollution." The vision's Principle 4 ("Every agent is born, does one job, and dies") mirrors this exactly, with stronger research backing (39% multi-turn degradation, 64.5% self-correction blind spot). Both systems arrived at the same conclusion independently.

### 5. Two-stage review is research-validated

`repos/superpowers.md` mandates two-stage review: "spec compliance FIRST, then code quality. Never reverse." The vision implements this as separate Review and Verify stages in the subtask pipeline (Stage 2: Review checks quality, Stage 3: Verify generates proof against acceptance criteria). The research validates the split -- Superpowers explicitly states "Two-stage review prevents two distinct failure modes."

### 6. Status protocol matches the proven pattern

The vision's 5-status protocol (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED, FAILED) extends Superpowers' 4-status protocol (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED) documented in `repos/superpowers.md`. The addition of FAILED is correct -- Superpowers handles failure implicitly through re-dispatch, but an explicit status is better for the orchestrator's state machine.

### 7. Planning-first is the settled industry consensus

`devin-codex.md` concludes: "Explicit planning phases (settled question in the field)" and "Both [Devin and Codex] evolved toward planning-first." `ai-coding-tools-comparison.md` key takeaway: "The scaffolding matters more than the model." The vision's entire architecture is built on this premise (Phase 7: PLAN, Principle 3: "The plan IS the intelligence. Execution IS mechanical."). The research unanimously supports this.

### 8. Filesystem-based state is validated by multiple tools

`repos/openspec.md`: "Filesystem-based state: Artifact completion = file exists on disk. No database." The vision's state management ("Files for everything. No database.") aligns with this pattern. OpenSpec and Superpowers both use filesystem state successfully. The vision's explicit reasoning for this decision (single-threaded orchestrator, no concurrent writers) is sound.

### 9. Git worktree isolation is proven

`repos/superpowers.md` Phase 3 uses git worktrees for workspace isolation. `ai-coding-tools-comparison.md` documents Cursor using "up to 8 parallel agents via Git worktrees." The vision adopts git worktrees for parallel subtask execution with a research-grounded ceiling of 4.

### 10. Verification as executable, not conversational

`chatdev-metagpt.md`: "Both prove: QA must be executable (run code), not just conversational." The vision's Stage 3 (Verify) and the distinction between Review (quality judgment) and Verify (proof generation) correctly implements this finding.

---

## Weaknesses

Where the vision misses or contradicts research findings.

### 1. No constitution concept

`repos/spec-kit.md` documents Spec Kit's "constitution" -- immutable project principles that the agent reads before every task. The research calls it "a powerful enforcement mechanism." Superpowers has a similar concept (project context exploration at brainstorm start). The vision has no equivalent. The closest is expertise modules and the composition-map, but these are general -- there's no per-project immutable principles document that constrains every agent invocation.

**Impact**: Medium-high. Without project-level constraints, agents may make decisions that violate established project conventions even when subtask instructions are correct.

### 2. No downstream regeneration on spec edit

`ai-coding-tools-comparison.md` documents Copilot Workspace's key insight: "downstream regeneration -- edit spec, all downstream steps regenerate." The vision's pipeline is linear and forward-only. If the user edits the spec after design review, there's no mechanism to automatically propagate changes through design, plan, and subtask files.

**Impact**: Medium. The review mechanism catches drift, but reactive drift detection is slower and more expensive than proactive downstream regeneration.

### 3. Clarify phase interaction model differs from proven patterns

`repos/superpowers.md` asks "one clarifying question at a time (prefer multiple choice)." `repos/spec-kit.md` limits to "max 3 clarification questions" with recommendations. The vision says "Collect all questions. Ask the user in one shot. Business questions only." The one-shot approach risks overwhelming the user and losing interactive refinement. The research tools all converge on incremental clarification.

**Impact**: Low-medium. The vision explicitly chose this to minimize user interaction points (design decision: "2 user interaction points only"). The tradeoff is intentional but the research unanimously disagrees.

### 4. No edit format research incorporated

`aider.md` documents Aider's extensive edit format research: "6+ formats, model-specific selection. Key finding: plain text beats function calling API." Different models have optimal edit formats (SEARCH/REPLACE for Claude, whole file for o1/o3, unified diff for GPT-4 Turbo). The vision's patch strategy mentions "structured edit tools" and "layered fallback" but doesn't account for model-specific format selection.

**Impact**: Medium. The vision handles this at the tool level, not the strategy level. If Wazir routes to different models, using the wrong edit format per model could significantly degrade code generation quality.

### 5. Architect/editor separation not leveraged

`aider.md` documents the architect mode: "Architect (strong model): reasons about solution freely. Editor (cheap/fast model): formats into actual file edits. Result: o1-preview + DeepSeek = 85% SOTA. 14x cost reduction." The key insight: "splitting attention between solving and formatting is the bottleneck." The vision's executor does both reasoning and formatting in one agent. The composer selects model tiers but doesn't separate the reasoning step from the editing step.

**Impact**: Medium. The vision's model tier routing partially addresses this (cheap models for mechanical tasks), but within a single subtask execution, the agent both reasons about the solution and produces edits. This is the exact bottleneck Aider identified.

### 6. No repo map / codebase indexing strategy specified

`aider.md` calls the repo map (tree-sitter + PageRank) "aider's #1 innovation." `mentat.md` documents ragdaemon (NetworkX knowledge graph). `devin-codex.md` notes Devin "auto-indexes repos every few hours, generates wikis + architecture diagrams." The vision's Phase 1 (DISCOVER) mentions "Codebase indexing (or refresh)" but the pipeline document provides zero detail on HOW codebase understanding works -- no mention of tree-sitter, symbol extraction, dependency graphs, or retrieval strategies.

**Impact**: High. Codebase understanding is foundational to every downstream phase. The research unanimously shows that naive approaches (grep, full file reads) don't scale. This is a gap in the specification, not necessarily the implementation, but a vision document should specify the approach.

### 7. No anti-rationalization framework

`repos/superpowers.md` makes anti-rationalization a first-class concern: "Every discipline skill has an Iron Law, rationalization table, red flags list, and pressure testing methodology." The key design decision: "'Violating the letter is violating the spirit.' Cuts off 'I'm following the spirit' rationalizations." The vision relies on structural enforcement (phases, reviews, constrained decoding) but has no explicit anti-rationalization mechanism in agent prompts.

**Impact**: Medium. Structural enforcement is stronger than prompt-based anti-rationalization, but they're complementary. The research shows agents actively rationalize shortcuts -- structural enforcement prevents some, but prompt-level countermeasures catch the ones that slip through within a phase.

### 8. No explicit handling of delta/incremental changes

`repos/openspec.md` documents OpenSpec's delta-based spec evolution -- "specs grow through archiving change deltas (living specification)." The vision treats each run as independent. There's no mechanism for evolving specifications across runs or handling incremental feature additions to an existing spec. The learning system captures patterns but doesn't evolve the project's specification.

**Impact**: Low-medium. Wazir currently treats each task as a fresh pipeline run. For ongoing projects with evolving requirements, the lack of spec evolution means repeated full-pipeline overhead.

### 9. Missing confidence scoring

`devin-codex.md` documents Devin's confidence scoring: "highly predictive of success -- green = 2x merge rate." The vision has no pre-execution confidence signal. The orchestrator dispatches agents without predicting likelihood of success.

**Impact**: Low. Confidence scoring is a UX improvement and resource optimization, not a quality mechanism. But it's a proven way to set user expectations and allocate resources.

### 10. CrewAI's Flows concept not explicitly credited

`crewai.md` documents the dual-layer pattern: "Flows = deterministic structure (fetch, validate, route, error handle). Crews = autonomous judgment (analyze, write, decide)." The vision implements exactly this pattern (deterministic orchestrator + autonomous subagents) but doesn't acknowledge the proven production architecture. Not a design flaw, just a missed citation that would strengthen the rationale.

---

## Critical to Edit

Findings that MUST be incorporated into the vision because ignoring them creates a design flaw.

### 1. Codebase indexing strategy must be specified

**Research finding**: Aider's repo map (tree-sitter + PageRank) is its "#1 innovation" (`aider.md`). Mentat uses ragdaemon with NetworkX (`mentat.md`). Devin auto-indexes repos every few hours (`devin-codex.md`). Every serious coding agent has a codebase understanding layer.

**Why it's critical**: Phase 1 (DISCOVER) Agent 2 is "Codebase indexing (or refresh)" and Agent 3 is "Identify affected scope in codebase." Without specifying HOW indexing works, the vision leaves the most context-sensitive operation undefined. Every downstream phase depends on codebase understanding quality. Bad indexing means bad scope identification, bad planning, and bad execution.

**Suggested edit**: Add a subsection under Phase 1 (DISCOVER) or under Architecture specifying the codebase indexing approach. Minimum content:
- Symbol extraction via tree-sitter (language-universal AST parsing)
- Dependency graph construction (imports, calls, type references)
- Relevance ranking for context selection (PageRank or similar)
- Incremental refresh strategy (not full re-index on every run)
- Token budget awareness (indexed representation must fit agent context)

### 2. Model-specific edit format selection must be in the Composer

**Research finding**: Aider benchmarked 6+ edit formats and found "each model has optimal format -- benchmarked, not guessed" (`aider.md`). SEARCH/REPLACE for Claude, whole file for o1/o3, unified diff for GPT-4 Turbo. "Plain text beats function calling API."

**Why it's critical**: The vision supports multi-model routing (model tier mapping, cross-model review). If the Composer dispatches an agent with GPT-5 using the same edit format as Claude, code generation quality degrades. The patch strategy section mentions "structured edit tools" generically, but the research proves format selection is model-dependent with measurable quality impact.

**Suggested edit**: Add to the Composer section (under "Prompt assembly rules" or as a new item) that the Composer selects edit format based on model family. Add to the "Patch strategy" section in Stage 1: Execute that edit format is model-dependent, resolved by the Composer from a configuration table (same mechanism as model tier mapping).

### 3. Per-project constitution / immutable principles document

**Research finding**: Spec Kit's constitution is "immutable project principles" that gates every planning decision (`repos/spec-kit.md`). Superpowers explores project context at brainstorm start (`repos/superpowers.md`). Both independently concluded that project-level constraints need to be injected into every agent invocation.

**Why it's critical**: The expertise modules handle general domain knowledge (stack-specific, role-specific). But project-specific invariants (e.g., "this project uses event sourcing," "all APIs must be REST," "no ORM, raw SQL only") have no persistent home. Without this, Agent 1 in Phase 1 might discover these, but the knowledge must survive through 20+ subagent invocations. Files on disk partially solve this, but there's no explicit mechanism ensuring every agent reads project invariants.

**Suggested edit**: Add a "Project Constitution" concept to the Architecture section or the Composer section. A `constitution.md` file (or section in the manifest) containing immutable project principles. The Composer injects it into every agent invocation as a `context.always` item, same as `always.<role>` expertise. The file is created during DISCOVER or CLARIFY and is append-only (can add, cannot remove without explicit user override).

---

## Nice to Have

Findings that would improve the vision but aren't blocking.

### 1. Downstream regeneration on artifact edit

`ai-coding-tools-comparison.md` documents Copilot Workspace's downstream regeneration. If the user edits the spec after approval, downstream artifacts (design, plan, subtasks) could auto-regenerate rather than waiting for review to catch drift. Low priority because the review mechanism handles this reactively, but proactive regeneration would be faster.

### 2. Incremental/delta spec evolution

OpenSpec's delta-based spec evolution (`repos/openspec.md`) would enable Wazir to handle iterative feature development on the same project without full pipeline re-runs. Useful for the "ongoing development" use case but not critical for the current "single task" pipeline focus.

### 3. Confidence scoring before execution

Devin's confidence scoring (`devin-codex.md`) is "highly predictive of success." Adding a pre-execution confidence estimate after planning would help with user expectation setting and resource allocation. Could be derived from subtask complexity, codebase familiarity, and research findings.

### 4. Anti-rationalization prompting in expertise modules

Superpowers' Iron Laws and rationalization tables (`repos/superpowers.md`) are a complementary enforcement layer to structural gates. Adding anti-rationalization patterns to `always.<role>` expertise modules (especially `always.executor` and `always.reviewer`) would tighten enforcement within phases.

### 5. Architect/editor split for executor agents

Aider's architect mode (`aider.md`) achieves 14x cost reduction by separating reasoning from formatting. Could be implemented as a two-step executor: first a reasoning agent produces a solution plan, then a cheap formatting agent produces the actual edits. Only worth it if learning data shows formatting errors are a significant failure mode.

### 6. Cross-artifact analysis command

Spec Kit's `/speckit.analyze` (`repos/spec-kit.md`) performs read-only cross-artifact consistency analysis detecting "duplications, ambiguities, constitution violations, coverage gaps." The vision's review phases do this per-artifact, but a holistic cross-artifact analysis (spec + design + plan checked together for consistency) would catch inter-phase drift earlier. Could be added as an optional analysis step before the final review.

### 7. Explicit "spec as source of truth" for ongoing maintenance

Tessl's approach (`landscape-overview.md`) where "code is generated from specs" and marked "GENERATED FROM SPEC - DO NOT EDIT" is the most aggressive spec-driven vision. Not practical today, but the vision should acknowledge that spec evolution (not just code evolution) is the long-term direction for maintained projects.

---

## Improvements

Concrete changes to the vision document.

### 1. Add codebase indexing specification to Phase 1 or Architecture

**Section**: Phase 1: DISCOVER (line 156, after "Agent 2: Codebase indexing (or refresh)")

**Add**: A paragraph or subsection specifying the indexing approach: tree-sitter AST parsing for symbol extraction, dependency graph construction, relevance-based context selection within token budgets, and incremental refresh. Cite `aider.md` (repo map as #1 innovation), `mentat.md` (ragdaemon), `devin-codex.md` (auto-indexing).

**Why**: The DISCOVER phase depends entirely on codebase understanding quality, and the vision specifies zero technical approach for its most critical input operation.

### 2. Add model-specific edit format to Composer and Patch Strategy

**Section**: The Composer (line 109, under prompt assembly rules) AND Stage 1: Execute, Patch strategy (line 275)

**Add to Composer**: "6. Resolves edit format from model-family config table (SEARCH/REPLACE, whole-file, unified-diff). Edit format is model-dependent with measurable quality impact."

**Add to Patch strategy**: Replace "agents write code via tool calls (structured edit tools)" with "agents write code via model-optimal edit format (resolved by the Composer -- SEARCH/REPLACE for Claude-family, whole-file for reasoning models, unified-diff for GPT-4 family). Content-based anchoring..."

**Why**: `aider.md` proves edit format selection has measurable quality impact. The vision's multi-model support makes this a real concern, not theoretical.

### 3. Add Project Constitution concept

**Section**: Architecture (after "The Composer" section, line 127)

**Add**: A new subsection "Project Constitution" defining: a `constitution.md` file per project containing immutable project principles (architectural constraints, technology choices, non-negotiable patterns). Created during DISCOVER/CLARIFY. Injected by the Composer into every agent as `context.always.project-constitution`. Append-only; removal requires explicit user override.

**Why**: Both Spec Kit (`repos/spec-kit.md`) and Superpowers (`repos/superpowers.md`) independently converge on this pattern. The vision's expertise modules handle domain knowledge but not project-specific invariants. Without this, project conventions must be rediscovered or risk being violated by downstream agents.

### 4. Add landscape positioning statement to Research Basis

**Section**: Research Basis (line 16, after "This pipeline is grounded in 47 research files")

**Add**: A brief positioning statement: "Competitive analysis of 20+ tools confirms no existing tool covers the full pipeline. The closest competitors cover 4-5 of 8 pre-execution phases: Spec Kit (specify, plan, tasks, implement), MetaGPT (PRD, design, tasks, code, QA), Kiro (requirements, design, tasks, execute). None combine research + clarification + specification + review enforcement."

**Why**: The vision cites research extensively but never explicitly states WHY the full pipeline is differentiated. `landscape-overview.md` provides this data. One sentence of positioning makes the research basis stronger.

### 5. Add Aider architect/editor insight to Design Decisions table

**Section**: Design Decisions table (line 607)

**Add row**: "Executor does reasoning + formatting in one agent | Subtask decomposition compensates; architect/editor split adds orchestrator complexity | Learning data showing >20% of failures are formatting errors"

**Why**: `aider.md` proves the architect/editor split works (14x cost reduction, 85% SOTA). The vision chose not to split, which is defensible, but the decision and its override condition should be documented since the research directly challenges it.

### 6. Acknowledge CrewAI Flows validation in Architecture

**Section**: Architecture, "The Orchestrator Is a State Machine" (line 96)

**Add**: After "A deterministic scheduler that reads the DAG..." add: "This dual-layer pattern (deterministic orchestrator + autonomous agents) is validated by CrewAI's production architecture (2B+ executions): Flows for deterministic structure, Crews for autonomous judgment."

**Why**: `crewai.md` documents that the exact pattern Wazir uses has been proven at scale. Citing it strengthens the architectural rationale with production evidence rather than only research papers.
