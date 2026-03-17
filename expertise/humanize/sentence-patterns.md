# Sentence Patterns

freshness_date: 2026-03-16

This module documents 24 structural patterns that signal AI-generated text, organized into 4 categories. Each pattern includes a description, severity rating, and before/after examples.

The problem is overuse and uniformity, not any single occurrence. One em dash in a document is fine. Em dashes in every paragraph is a tell.

## Content Patterns (1-6)

### 1. Inflated symbolism
**Severity:** medium
Phrases that add artificial meaning or gravitas where none exists.

- **Before:** "This function serves as a testament to the team's commitment to clean architecture."
- **After:** "This function separates validation from persistence."

### 2. Balanced-argument boilerplate
**Severity:** medium
Forced "on one hand / on the other hand" structures that avoid taking a position.

- **Before:** "On one hand, TypeScript adds type safety. On the other hand, it increases build complexity."
- **After:** "TypeScript adds type safety at the cost of build complexity. For this project, the safety wins."

### 3. Superficial -ing analyses
**Severity:** low
Dangling participle phrases used for fake analytical depth.

- **Before:** "Leveraging modern frameworks while ensuring backward compatibility, the system achieves optimal performance."
- **After:** "The system uses React 19 and supports browsers back to Chrome 90."

### 4. Promotional language
**Severity:** high
Adjectives and phrases borrowed from marketing copy: "vibrant", "breathtaking", "nestled".

- **Before:** "This groundbreaking approach revolutionizes how teams manage state."
- **After:** "This approach reduces state bugs by centralizing updates in one store."

### 5. Vague attributions
**Severity:** medium
"Experts say", "studies show", "research suggests" without citing what or who.

- **Before:** "Studies show that test-driven development improves code quality."
- **After:** "Nagappan et al. (2008) found TDD teams produced 60-90% fewer defects in an IBM/Microsoft study."

### 6. Introduction boilerplate
**Severity:** high
Formulaic openers that delay the actual content.

- **Before:** "In today's fast-paced world of software development, testing has become more important than ever."
- **After:** "Write the test before the implementation."

## Language and Grammar Patterns (7-12)

### 7. Overused AI vocabulary
**Severity:** high
Words from the vocabulary blacklist appearing in clusters. Cross-reference `vocabulary-blacklist.md`.

- **Before:** "We leverage a robust, comprehensive framework to streamline the development process."
- **After:** "We use Express.js to handle routing and middleware."

### 8. Copula avoidance
**Severity:** medium
Using "serves as", "functions as", "acts as" instead of "is".

- **Before:** "This module serves as the primary entry point for authentication."
- **After:** "This module is the authentication entry point."

### 9. Negative parallelisms
**Severity:** low
"It's not just X, it's Y" structures used for artificial emphasis.

- **Before:** "It's not just a linter -- it's a complete code quality platform."
- **After:** "The tool lints, formats, and reports coverage in one pass."

### 10. Rule of three overuse
**Severity:** low
Forcing ideas into groups of three when the natural count is different.

- **Before:** "This brings clarity, efficiency, and reliability to the deployment process."
- **After:** "This makes deployments faster and more predictable."

### 11. Synonym cycling
**Severity:** medium
Substituting synonyms for the same concept to avoid repetition, creating confusion.

- **Before:** "The component... the widget... the UI element... the interactive control..."
- **After:** "The component" (repeat the clearest term consistently).

### 12. False ranges
**Severity:** low
Claiming a span from one extreme to another for artificial scope.

- **Before:** "From ancient database systems to modern distributed architectures..."
- **After:** "Distributed databases handle partitioning differently from single-node systems."

## Style Patterns (13-18)

### 13. Em dash overuse
**Severity:** medium
Multiple em dashes per paragraph where commas or periods would work.

- **Before:** "The system -- which handles authentication -- processes tokens -- both JWT and opaque -- before routing."
- **After:** "The system handles authentication and processes JWT and opaque tokens before routing."

### 14. Boldface overuse
**Severity:** low
Bolding terms that do not need emphasis, reducing the impact of actual emphasis.

- **Before:** "The **executor** uses **conventional commits** for **all changes** to the **repository**."
- **After:** "The executor uses conventional commits for all changes to the repository."

### 15. Inline-header vertical lists
**Severity:** low
"**Term:** Definition" lists that should be prose or tables.

- **Before:** "**Performance:** Improved by 40%. **Security:** No vulnerabilities found. **Coverage:** 95%."
- **After:** "Performance improved by 40%, no security vulnerabilities were found, and test coverage reached 95%."

### 16. Title case in headings
**Severity:** low
Title Case Every Word instead of sentence case.

- **Before:** "Strategic Negotiations And Partnership Development"
- **After:** "Strategic negotiations and partnership development"

### 17. Emoji abuse
**Severity:** medium
Emojis used as section markers or emphasis in technical content.

- **Before:** "Phase 1: Scan Phase 2: Rewrite Phase 3: Verify"
- **After:** "Phase 1: Scan. Phase 2: Rewrite. Phase 3: Verify."

### 18. Curly/smart quotes
**Severity:** low
Typographic quotes in contexts where straight quotes are standard (code, Markdown).

- **Before:** He said "the project"
- **After:** He said "the project"

## Filler and Hedging (19-24)

### 19. Summary/conclusion boilerplate
**Severity:** high
Formulaic closings that restate the introduction without adding value.

- **Before:** "In conclusion, we have explored the various aspects of testing strategy and identified key areas for improvement."
- **After:** [Cut entirely, or add a single concrete next step.]

### 20. Excited/clickbait headings
**Severity:** medium
Headings with unnecessary superlatives or exclamation marks.

- **Before:** "The Amazing Power of Reactive Programming!"
- **After:** "Reactive programming"

### 21. Excessive conjunctive phrases
**Severity:** medium
"Furthermore", "Additionally", "Moreover" padding between every point.

- **Before:** "The API handles authentication. Furthermore, it manages rate limiting. Additionally, it logs all requests. Moreover, it validates input."
- **After:** "The API handles authentication, rate limiting, request logging, and input validation."

### 22. Generic superlatives
**Severity:** high
"Groundbreaking", "revolutionary", "transformative" without evidence.

- **Before:** "This transformative approach to CI/CD is truly groundbreaking."
- **After:** "This CI/CD setup cuts deploy time from 45 minutes to 8."

### 23. Excessive hedging
**Severity:** medium
Stacking hedge phrases beyond what uncertainty warrants.

- **Before:** "It is worth noting that it might be important to consider that this could potentially impact performance."
- **After:** "This may slow queries on tables over 1M rows."

### 24. Generic positive conclusions
**Severity:** high
Endings that express vague optimism without actionable content.

- **Before:** "With these improvements, the future of our platform looks brighter than ever."
- **After:** "Next: migrate the remaining 12 endpoints to the new auth middleware by March 30."

## Burstiness

Burstiness measures sentence length variation. AI text has low burstiness (uniform sentence lengths). Human text has high burstiness (mixed short and long sentences).

### Target distribution

| Length category | Word count | Target percentage |
|----------------|------------|-------------------|
| Short | 3-8 words | ~20% |
| Medium | 9-20 words | ~50% |
| Long | 21-40 words | ~25% |
| Very long | 40+ words | ~5% |

### Coefficient of variation target

CV (standard deviation / mean of sentence lengths) should exceed **0.4** for humanized text. AI text typically scores 0.15-0.25.

### How to improve burstiness

- After a long technical sentence, follow with a short one. Two words is fine.
- Use sentence fragments where contextually appropriate.
- Do not mechanically alternate short-long-short -- that creates its own detectable pattern.
- Burstiness applies to prose sections only. Skip code blocks, tables, and lists.

## Pattern Frequency vs. Presence

One instance of any pattern is not a problem. The signal comes from clustering and overuse:

- 1 em dash in 500 words: normal
- 5 em dashes in 500 words: AI tell
- 1 "Furthermore" in a document: acceptable
- "Furthermore" opening 3 consecutive paragraphs: AI tell

When reviewing, count pattern instances per section rather than flagging individual occurrences.
