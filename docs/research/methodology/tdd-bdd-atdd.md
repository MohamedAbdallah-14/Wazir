# Verification-First Development Methodologies — Deep Research Report

## 1. TDD (Test-Driven Development) — Kent Beck

### Canon TDD (5 steps):
1. Write a test list (scenarios, not implementation decisions)
2. Turn exactly one item into a concrete, runnable test (RED)
3. Change code to make it pass + all previous tests (GREEN)
4. Optionally refactor (REFACTOR) — never mix with making tests pass
5. Repeat until list empty

### Why It Works
Core mechanism: **double-checking**. Test expresses intent in one form; code expresses it in another.

### Empirical Evidence
**Nagappan et al. (2008)** — 3 Microsoft teams + 1 IBM team:
- Pre-release defect density decreased **40-90%**
- 15-35% increase in initial development time, offset by reduced maintenance
- Madeyski meta-analysis: TDD produces lower coupling (medium effect size)

**Rafique and Misic (2013)** meta-analysis of 27 studies: Little effect on productivity, but quality benefits consistent.

### Failure Modes
- Copying actual computed values into expected (defeats double-checking)
- Mixing refactoring with making tests pass
- Over-refactoring
- Mixing implementation design into test list creation

## 2. BDD (Behavior-Driven Development) — Dan North

### Origin
Created 2003-2006. Replaced "test" with "behaviour" and "should." Reframing TDD in behavioral language.

### Given-When-Then (formalized 2004 with Chris Matts)
- **Given** some context
- **When** some action
- **Then** observable consequences

Adaptation of Arrange-Act-Assert in business domain language. Creates ubiquitous language (from DDD).

### Bridge: "Three Amigos" pattern (customer, developer, tester) prevents telephone-game problem.

### Tools: Cucumber (.feature files), JBehave, SpecFlow, behave (Python)

## 3. ATDD (Acceptance Test-Driven Development)

### How It Differs from TDD
TDD = unit level. ATDD = feature level. Acceptance tests written BEFORE implementation, agreed by Three Amigos.

### Process
1. Discuss with all three perspectives
2. Write acceptance criteria (often Given-When-Then)
3. Automate acceptance tests
4. Implement until tests pass
5. Tests become regression suite

### Layered Strategy
ATDD for acceptance + BDD for behavior + TDD for unit = catches different defect classes.

## 4. Specification by Example — Gojko Adzic

### Core Insight
Abstract specs are ambiguous. Concrete examples are not. "Handle large orders" is vague. "10,000 line items processed in <3s" is testable.

### 7 Key Patterns (from studying 50+ teams):
1. Derive scope from goals
2. Specify collaboratively
3. Illustrate using examples
4. Refine the specification
5. Automate validation without changing specs
6. Validate frequently
7. Evolve a documentation system

## 5. Contract-First Development

Define interface contract BEFORE implementation. Contract = source of truth.

Benefits:
- Parallel development (frontend/backend/QA work against contract)
- Early integration error detection
- Code generation from contract
- Contract testing reduces integration time by up to 60%

## 6. Property-Based Testing

### QuickCheck (Claessen & Hughes, 2000)
Properties vs examples: "for ALL valid inputs, invariant P should hold."

Property categories:
- Round-trip: `decode(encode(x)) == x`
- Idempotency: `f(f(x)) == f(x)`
- Invariant preservation

**Shrinking**: Automatically finds minimal reproducing case.

Catches what humans miss: developers test cases they thought of, PBT explores the space they didn't imagine.

## 7. KEY FINDING: Verification-First for AI Agents

### TiCoder (Microsoft/Penn/UCSD, IEEE TSE 2024)
- LLM generates tests first, user validates, then LLM generates code
- **45.73% absolute improvement** in pass@1 accuracy
- Earlier version: 48.39% → 85.48% on MBPP
- Significantly less cognitive load for users

### Spec-Driven Development paper (Piskala, 2026)
- Human-refined specs reduce LLM-generated code errors by up to 50%

### Anthropic's Eval-Driven Methodology
- "Define success criteria before building" = TDD for agents
- "Failures become test cases, test cases prevent regressions"

### The "Same Author" Problem
When LLM generates both code AND tests from same prompt, tests share code's blind spots. Property-based testing breaks this with thousands of random adversarial inputs.

## Synthesis

**Writing verification criteria before implementation improves output quality across every methodology, and the effect is AMPLIFIED for AI agents.**

1. Humans: 40-90% defect reduction (Nagappan). AI: up to 50% fewer errors (Piskala), 45.73% accuracy improvement (TiCoder).
2. Explicit specs are the ONLY understanding AI agents have — implicit understanding doesn't exist.
3. Executable specs in CI make spec drift impossible.
4. Layered verification maps to agent pipelines:
   - ATDD acceptance criteria = task success criteria
   - BDD Given-When-Then = scenario specs
   - TDD unit tests = implementation checks
   - PBT invariants = edge case catchers
   - Contract-first = interface boundaries
