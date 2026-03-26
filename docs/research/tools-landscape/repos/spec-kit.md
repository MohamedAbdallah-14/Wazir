# github/spec-kit — Deep Research Report

## What It Is

spec-kit is GitHub's open-source toolkit for Spec-Driven Development (SDD) -- a methodology that inverts the traditional relationship between specifications and code. Instead of specs serving code, code serves specifications. The specification becomes the primary artifact; code becomes its expression.

**Core problem solved**: The gap between intent and implementation. Traditional development treats specs as scaffolding that gets discarded once coding starts.

**Philosophy**:
- Specifications are the lingua franca of development
- Intent-driven development: express intent in natural language, code is the "last mile"
- Maintaining software means evolving specifications, not code
- Debugging means fixing specifications, not patching code
- Templates act as sophisticated prompts that constrain LLM behavior toward higher-quality output

## Spec Structure

The specification follows a strict template with mandatory sections:

- **User Scenarios & Testing**: Prioritized user stories (P1, P2, P3) using Given/When/Then acceptance scenarios. Each story must be independently testable and deliverable as an MVP increment.
- **Requirements**: Functional requirements (FR-001, FR-002...) with `[NEEDS CLARIFICATION]` markers for ambiguities (max 3 allowed).
- **Key Entities**: Data entities, attributes, relationships (no implementation details).
- **Success Criteria**: Measurable, technology-agnostic outcomes (SC-001, SC-002...).
- **Assumptions**: Documented reasonable defaults chosen when unspecified.

Critical constraints:
- Focus on WHAT and WHY, never HOW
- No tech stack, APIs, or code structure
- Written for business stakeholders, not developers
- Success criteria must be verifiable without implementation details

## The 8-Command Pipeline

1. **`/speckit.constitution`** -- Establish immutable project principles (architectural DNA)
2. **`/speckit.specify`** -- Transform natural language into structured spec with quality validation loop (max 3 iterations), max 3 clarification questions
3. **`/speckit.clarify`** -- Structured ambiguity resolution using 11-category taxonomy, max 5 sequential questions with recommendations
4. **`/speckit.plan`** -- Generate technical implementation plan: Phase 0 (Research) -> Phase 1 (Design) -> Constitution Check gates
5. **`/speckit.tasks`** -- Break plan into executable task list by user story. Format: `- [ ] T001 [P] [US1] Description`. Phases: Setup, Foundational, User Stories, Polish.
6. **`/speckit.analyze`** -- Read-only cross-artifact consistency analysis. Detects duplications, ambiguities, constitution violations, coverage gaps. Severity-rated.
7. **`/speckit.checklist`** -- "Unit tests for English" — validates quality of requirements themselves. Tests completeness, clarity, consistency, measurability.
8. **`/speckit.implement`** -- Execute all tasks respecting dependencies and parallel markers.
9. **`/speckit.taskstoissues`** -- Convert tasks.md into GitHub Issues.

## Validation & Quality Checks

Multi-layered:

1. **Spec Quality Validation** (built into specify): Automated checklist, loops up to 3 iterations.
2. **Constitution Check Gates** (built into plan): Simplicity, Anti-Abstraction, Integration-First gates.
3. **Cross-Artifact Analysis** (analyze): Semantic model detecting 6 categories of issues. Coverage percentages, ambiguity counts, constitution alignment.
4. **Requirement Quality Checklists** (checklist): Domain-specific (UX, API, security, performance). Min 80% traceability coverage.
5. **`[NEEDS CLARIFICATION]` markers**: Max 3 per spec, must be resolved before planning.
6. **Checklist gates in implement**: All existing checklists scanned. Incomplete = halt and ask.

## Integration

- **Git integration**: Automated feature branch creation, prefix-based feature directory lookup
- **24+ AI agents supported**: Claude Code, Gemini CLI, Copilot, Cursor, Codex CLI, Windsurf, etc.
- **Extension system**: Self-contained packages with hook system (before/after each phase)
- **Preset system**: Stackable, priority-ordered template overrides

## Best Practices Encoded

1. Separation of concerns: Spec (WHAT/WHY) strictly separated from plan (HOW)
2. Test-First/TDD: Constitution Article III mandates TDD as non-negotiable
3. Library-First: Every feature starts as standalone library
4. Simplicity/YAGNI: Max 3 projects, no future-proofing
5. Incremental delivery: Each user story independently implementable
6. Forced clarification: Ambiguities explicitly marked and limited
7. Constitution governance: Immutable principles with formal amendment
8. Traceability: Task -> Story -> Requirement -> Success Criteria

## Key Insight for Wazir

Templates act as sophisticated prompts that constrain LLM behavior. They prevent premature implementation details, force explicit uncertainty markers, enforce constitutional compliance through gates, and prioritize test-first thinking. The constitution concept — immutable project principles that the agent reads before every task — is a powerful enforcement mechanism.
