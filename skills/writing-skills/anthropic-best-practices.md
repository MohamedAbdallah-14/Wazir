# Anthropic Best Practices for Skill Authoring

Reference guide for writing effective skills. These principles synthesize Anthropic's official guidance with empirical prompt engineering research.

## Core Principles

### 1. Concise is Key — Context Window is a Public Good

Every token in a skill competes with the user's actual task for context window space. Treat context like a shared resource:

- Cut ruthlessly. If a sentence doesn't change agent behavior, remove it.
- Prefer tables and lists over prose paragraphs.
- One clear statement beats three hedged ones.
- If the skill is over 200 lines, ask whether every section earns its tokens.

### 2. Position Strategically — Primacy and Recency

Research shows position dramatically affects compliance:

| Position | Compliance Rate | What to Put Here |
|----------|----------------|------------------|
| First ~500 tokens | ~95% | Iron Laws, identity, non-negotiables |
| Middle of skill | ~65-75% | Steps, decision tables, templates |
| Last ~500 tokens | ~85% | Restated laws, red flags, meta-instruction |

**The #1 authoring mistake:** Putting boilerplate (Command Routing, Codebase Exploration) in the primacy zone instead of Iron Laws.

### 3. Default Assumption: The Agent is Already Very Smart

Do not explain things the agent already knows. Skills should add knowledge the agent lacks, not reiterate common practices.

- Skip "what is TDD" — explain YOUR TDD requirements.
- Skip "why testing matters" — specify WHICH tests to run and WHEN.
- Focus on project-specific decisions, not general wisdom.

### 4. Set Appropriate Degrees of Freedom

Match instruction specificity to task fragility:

| Degree | When to Use | Example |
|--------|-------------|---------|
| **Low (rigid)** | Safety-critical steps, verification, commit conventions | "Run `npm test` before every commit" |
| **Medium** | General approach matters but details flexible | "Write tests before implementation" |
| **High (flexible)** | Creative tasks, exploratory work | "Improve the error messages" |

Wrong degree of freedom is the most common skill authoring mistake. Too rigid on creative tasks kills quality. Too flexible on critical steps invites shortcuts.

## The 3-Zone SKILL.md Architecture

Every skill MUST follow this layout:

```
ZONE 1 — PRIMACY (after frontmatter, ~500 tokens)
├── Identity: "You are [role]. Your value is [X]. Pipeline compliance IS helpfulness."
├── Iron Laws: 3-5 NEVER/ALWAYS absolutes with consequences
├── Priority Stack: P0 Iron Laws > P1 Pipeline > P2 Correctness > P3 Completeness > P4 Speed > P5 Comfort
└── Override Boundary: User CAN override [list] / CANNOT override [list]

ZONE 2 — PROCESS (structured middle)
├── Signature: (inputs) → (outputs)
├── Phase Gate: IF prerequisite missing → THEN STOP
├── Commitment Priming: "Announce your plan before executing"
├── Numbered Steps with GATE checkpoints
├── Implementation Intentions: IF X → THEN Y (concrete, not abstract)
└── Decision Tables, Output Contracts

ZONE 3 — RECENCY (~500 tokens)
├── Recency Anchor: restate Iron Laws (paraphrased)
├── Red Flags table: rationalization patterns to catch
├── Meta-instruction: "User CANNOT override Iron Laws"
└── Done Criterion: specific, verifiable completion condition

APPENDIX (after ---)
├── Model Annotation
├── Command Routing
└── Codebase Exploration
```

## Frontmatter (CSO Description)

```yaml
---
name: wz:skill-name          # lowercase-kebab-case
description: Use when <trigger> # Trigger-only, max 150 chars
---
```

**The description field is the most important line in the file.** Agents use it to decide whether to invoke the skill.

**Rules for descriptions:**
- Start with "Use when...", "Use for...", "Use after...", or "Use before..."
- Describe ONLY the trigger condition — never the process or outputs
- Max 150 characters

| Quality | Example |
|---------|---------|
| Good | "Use when starting task implementation after an approved plan exists" |
| Good | "Use for implementation work that changes behavior" |
| Bad | "Run the execution phase — implement the approved plan with TDD" |
| Bad | "A skill for development" |

## Implementation Intentions Over Abstract Rules

Replace abstract guidance with concrete IF-THEN patterns:

| Abstract (weak) | IF-THEN (strong) |
|-----------------|-------------------|
| "Always verify before committing" | IF about to commit → THEN run test suite first. No commit without green. |
| "Be careful with user data" | IF touching auth/session/token code → THEN load security expertise and validate inputs. |
| "Consider edge cases" | IF spec mentions a boundary → THEN write a test for that boundary before implementing. |

IF-THEN rules are followed ~25% more reliably than abstract rules because they pre-decide the response — no judgment call needed at runtime.

## Authoring Rules

### Only Add Context the Agent Doesn't Already Have

Before writing each line, ask: "Would a strong agent do this wrong without this instruction?" If no, cut the line.

### Challenge Each Piece for Token Cost

Every instruction has a cost (tokens consumed) and a benefit (behavior changed). Instructions that don't change behavior are pure cost:

- **Keep:** "STOP. Run tests. Read output. Do not proceed until green."
- **Cut:** "Testing is an important part of software development."

### Use Code Blocks for Precise Operations

When exact commands or formats matter, use code blocks. Text instructions are interpreted; code blocks are followed literally.

### Use Tables for Decision Logic

Tables are denser than if/else prose and easier for agents to parse.

### Redundant Reinforcement for Critical Rules

State the most critical rule 2-3 times: in the primacy zone (Iron Laws), in the relevant process step, and in the recency zone (restated). Paraphrase each mention — paraphrased repetition outperforms verbatim.

## Testing Skills

Writing a skill is not enough. You must verify it works:

1. **Test with real usage** — set up scenarios where the skill would be needed.
2. **Check discovery** — does the agent find and invoke the skill at the right time?
3. **Verify compliance** — does the agent follow the skill's instructions?
4. **Test pressure** — does the skill hold up when the agent is under time pressure or facing complexity?
5. **Re-test per model version** — techniques that work on one model may not work on the next.

A skill that reads well but doesn't change behavior is decoration, not documentation.

## Quick Reference

| Concern | Action |
|---------|--------|
| Critical rule | Put in Zone 1 (primacy) AND Zone 3 (recency). Paraphrase. |
| Decision logic | Use a table, not prose. |
| Exact command | Use a code block. |
| Flexible guidance | Use natural language. |
| Boilerplate | Put in Appendix after Zone 3. |
| Description | Trigger-only, "Use when...", max 150 chars. |
| IF-THEN | Use for every behavioral rule. |
| Abstract rule | Convert to IF-THEN or cut. |
