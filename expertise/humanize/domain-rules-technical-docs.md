# Domain Rules: Technical Documentation

freshness_date: 2026-03-16

Rules for humanizing specs, plans, architecture docs, API documentation, and review reports. These artifacts prioritize precision and clarity -- humanization must never add ambiguity.

For voice and tone baseline, see `expertise/content/foundations/editorial-standards.md`.

## Role Mappings

- **specifier** -- specs, acceptance criteria, non-goals, assumptions
- **planner** -- implementation plans, task lists, verification plans
- **reviewer** -- findings with severity, rationale, verdicts
- **learner** -- learning artifacts, experiment summaries

## Rules

### 1. Active voice preferred

Write "the verifier runs all tests" not "all tests are run by the verifier." Passive voice is acceptable only when the actor is genuinely unknown or irrelevant.

### 2. Imperative mood for instructions

Write "run the test suite" not "the test suite should be run" or "you might want to consider running the test suite."

### 3. Name the specific thing

Write "use `pg_dump --format=custom`" not "use appropriate database backup tooling." Name the function, command, library, or version.

### 4. No metaphors in technical descriptions

Write "the service retries failed requests 3 times with exponential backoff" not "the service navigates through turbulent network conditions." Technical readers need mechanics, not imagery.

### 5. Burstiness applies to prose sections only

Do not measure or enforce burstiness on code blocks, tables, YAML frontmatter, acceptance criteria lists, or task definitions. Burstiness targets (CV > 0.4) apply only to flowing prose paragraphs.

### 6. Preserve technical precision over style

If replacing a blacklisted word would reduce precision, keep the original. "Robust to outliers" in a statistics context is precise. "Strong against outliers" loses the statistical meaning.

### 7. Hedging is acceptable only for genuinely uncertain claims

"This migration may take 2-4 hours depending on dataset size" is honest uncertainty. "It is worth noting that this could potentially have performance implications" is hedging padding -- state the specific concern or cut the sentence.

### 8. Acceptance criteria must stay testable

Never humanize an acceptance criterion into something that cannot be verified. "The system handles edge cases" is untestable. "The system returns HTTP 422 for input exceeding 10MB" is testable. Humanization must not cross this line.

### 9. Findings must cite evidence

Review findings must reference specific files, lines, or artifacts. "The code has issues" is vague. "Line 42 in `auth.ts` dereferences a potentially null token" is evidence-cited. Strip AI padding but keep the citations.

### 10. Do not pad task descriptions

Plan task descriptions must be unambiguous enough for execution without inventing missing steps. "Implement the authentication flow" is too vague. "Add JWT verification middleware to `src/middleware/auth.ts`, reading the secret from `AUTH_SECRET` env var" is actionable.
