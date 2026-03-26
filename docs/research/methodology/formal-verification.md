# Lightweight Formal Methods and Verification — Deep Research

## Design by Contract (Bertrand Meyer, Eiffel)
- Preconditions (caller guarantees), Postconditions (callee guarantees), Invariants (always true)
- Shifts error detection from late testing to immediate execution
- Contracts serve as executable specs, runtime checks, AND documentation
- For AI pipelines: making assumptions explicit at every boundary is the highest-leverage quality intervention

## Alloy / Lightweight Formal Methods (Daniel Jackson, MIT)
- Check design within bounded scope — most bugs have small counterexamples
- Catches design-level bugs: features interact correctly locally but incorrectly globally
- AWS/DynamoDB: TLA+ found bug with 35-step error trace that passed all testing and QA
- eSpark Learning: 2 days of TLA+ caught bugs worth $200K/year in revenue
- ROI: an hour of modeling catches issues that days of tests miss

## Property-Based Testing as Specification
- Properties ARE specifications (not just tests)
- Round-trip, idempotence, invariant preservation, oracle comparison
- Hypothesis found password hashing bug at 512+ bytes — no human would write that example test
- fast-check integrates with Jest/Vitest for JavaScript/TypeScript

## Type-Driven Development
- Types as partial specifications (Curry-Howard correspondence)
- "Make illegal states unrepresentable" (Yaron Minsky)
- Typestate pattern: `Connection<Disconnected>` cannot call `.send()`
- Directly applicable: `Phase<Planning>` cannot call `.implement()`
- TypeScript strict: discriminated unions, branded types, readonly

## Mutation Testing
- "If I introduced a bug, would my tests catch it?"
- Mutation score = killed mutants / total. 80%+ = strong suite.
- Google: mutants are similar to actual bugs programmers introduce
- Sentry: 25-45 min CI runs, run weekly. Stryker for JS/TS.

## Snapshot/Golden Testing
- Verify consistency, not correctness
- Best for: serialization formats, API response shapes, cross-version invariants
- Worst for: UI rendering, outputs with timestamps/random IDs
- Specification-capture mechanism, not specification-authoring mechanism

## Executable Specifications
- Gauge (ThoughtWorks): Markdown specs that ARE tests
- Concordion: HTML/Markdown with embedded assertions
- FitNesse: Wiki-based specs with test tables
- Key benefit: requirements cannot drift from implementation

## Minimum Viable Verification for AI Agents

### What to Define BEFORE Implementing
1. **Preconditions**: What must be true before task starts
2. **Postconditions**: What must be true after completion
3. **Invariants**: What must remain true throughout
4. **Acceptance criteria**: Observable, testable outcomes (not "works correctly")
5. **Boundary conditions**: Known edge cases and their handling

### Three-Tier Boundaries (Addy Osmani)
- Always do (proceed without asking)
- Ask first (requires human approval)
- Never do (hard stop)

### Verification vs Validation
- **Verification** (did we build it right?): continuous, automated — tests, types, contracts
- **Validation** (did we build the right thing?): checkpoints with human judgment
- AI agents can self-verify but cannot self-validate

### The Three Layers of Continuous Verification
1. **Compile-time** (immediate): Types, lint, static analysis → ~40% of bugs
2. **Test-time** (seconds-minutes): Unit, PBT, contracts → ~40% more
3. **Review-time** (minutes-hours): Mutation testing, golden review, human validation → remaining ~20%

## The Minimum Viable Stack (ranked by effort-to-value)
1. Pre/postconditions in spec (DbC in Markdown) — near zero effort, massive clarity
2. Strict types with discriminated unions — compiler-enforced
3. Property-based tests for core logic — 10 properties replace 100 examples
4. Snapshot tests for contracts — captures cross-component agreements
5. Self-verification instruction in agent specs — agent checks own work
6. Mutation testing on critical paths (weekly) — measures test quality
7. Executable acceptance criteria (Gauge-style Markdown)

## Unifying Insight
**Specification and verification are not separate activities.** The spec IS the verification criteria. The types ARE partial proofs. The properties ARE the tests. The more you invest in expressing what should be true, the less you invest in checking what went wrong.
