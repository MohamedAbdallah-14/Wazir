# Task Decomposition Science — Deep Research

## INVEST Criteria (Bill Wake)
- **Independent**: Order-independent, any sequence
- **Negotiable**: Invitation to conversation, not contract
- **Valuable**: Discernible increment of value
- **Estimable**: Team can estimate effort
- **Small**: 6-10 stories per sprint, max 50% of sprint per story
- **Testable**: Clear acceptance criteria

## Story Splitting (Richard Lawrence / Humanizing Work)
### Meta-Pattern: Find Complexity → Identify Variations → Reduce to One
Patterns: Workflow Steps, Business Rules, Data Variations, Interface Variations, CRUD, Investigation vs Implementation.

**Two rules**: Choose split that lets you deprioritize/throw away. Choose split producing equally-sized stories.

## Vertical vs Horizontal
- **Vertical**: Each story cuts through all layers, delivers independently verifiable value
- **Horizontal**: Build layer by layer — anti-pattern (no independent value per slice)
- For AI agents: "Give the coding agent the full picture" (Lapsley)

## WBS (Work Breakdown Structure)
- **100% Rule**: Sum of children = 100% of parent, recursively
- **8/80 guideline**: Work packages between 8-80 hours
- Provides scope completeness guarantee backlogs alone lack

## AI Agent Task Granularity
- **35-minute degradation cliff** (Zylos Research 2026): Performance degrades after ~35 min equivalent
- **Doubling-quadrupling law**: Double task duration → 4x failure rate
- **Context folding**: 10x smaller active context matching baselines (2025)
- **Observation masking > LLM summarization** (JetBrains): simpler, cheaper, equally effective
- **Sweet spot**: Single context window session (~15-30 min equivalent), clear entry/exit criteria

## Task Spec Requirements
1. Context (why this task exists)
2. Inputs (what's available)
3. Expected outputs (what to produce)
4. Acceptance criteria (5 testable criteria in EARS format — cuts rework in half)
5. Constraints (what NOT to do — more important than positive instructions for AI)
6. Dependencies (what must exist first)

## Anti-Patterns
1. Tasks masquerading as stories (implementation not behavior)
2. Horizontal slicing
3. Stories containing "and" (multiple stories)
4. Hidden dependencies
5. Missing acceptance criteria
6. Over-decomposition (50 tasks for 8)
7. Premature solutioning

## Synthesis for Wazir
1. Behavior over implementation in task specs
2. Vertical slice is the universal unit
3. 35-min / single-context-window is the hard ceiling for AI
4. 5 acceptance criteria per task in EARS format = highest leverage artifact
5. Traceability (task → requirement → user need) = contract enforcement
6. Flow over batch: one task per context, commit before next, validate before moving on
