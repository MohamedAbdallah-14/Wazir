---
name: wz:tdd
description: Use for implementation work that changes behavior. Follow RED -> GREEN -> REFACTOR with evidence at each step.
---

# Test-Driven Development

## Command Routing
Follow the Canonical Command Matrix in `hooks/routing-matrix.json`.
- Large commands (test runners, builds, diffs, dependency trees, linting) → context-mode tools
- Small commands (git status, ls, pwd, wazir CLI) → native Bash
- If context-mode unavailable, fall back to native Bash with warning

## Codebase Exploration
1. Query `wazir index search-symbols <query>` first
2. Use `wazir recall file <path> --tier L1` for targeted reads
3. Fall back to direct file reads ONLY for files identified by index queries
4. Maximum 10 direct file reads without a justifying index query
5. If no index exists: `wazir index build && wazir index summarize --tier all`

Sequence:

1. RED
Write or update a test that expresses the new behavior or the bug being fixed, then run it and confirm failure.

**Test quality check (single-pass):** Before proceeding to GREEN, verify:
- Are these tests testing the right behavior?
- Are they real assertions, not tautologies?
- Do they fail for the right reason (not a syntax error or import failure)?
If any check fails, fix the test before moving on. This is a single-pass quality check, not a full review loop.

2. GREEN
Write the smallest implementation change that makes the failing test pass.

3. REFACTOR
Improve structure while keeping the full relevant test set green.

Rules:

- do not skip the failing-test step when automated verification is feasible
- do not rewrite tests to fit broken behavior
- rerun verification after each meaningful refactor

## Iron Laws of TDD

These are non-negotiable. No context makes them optional.

1. **The test MUST fail before you write the fix.** A test that has never been red proves nothing. Seeing the failure confirms the test actually exercises the behavior you think it does.
2. **Never rewrite a test to match broken implementation.** The test encodes the contract. If the test and the code disagree, the code is wrong until proven otherwise.
3. **Never claim GREEN without running the test suite.** "It should pass" is not evidence. The test runner's exit code is the only truth.
4. **One behavior change per RED-GREEN cycle.** Batching changes makes failures ambiguous — you cannot tell which change broke which test.

**Violating the letter of TDD is violating the spirit.** Writing a test after the code, then claiming "I did TDD" is the most common and most damaging form of process fraud. The failing test is the specification — it must exist before the implementation, not as a post-hoc rationalization.

## Red Flags — You Are Rationalizing

If you catch yourself thinking any of these, STOP. You are about to violate TDD.

| Thought | Reality |
|---------|---------|
| "This change is too small for TDD" | Small changes have small tests. Write one. |
| "I'll write the tests after" | That is not TDD. That is testing. Different process, worse outcomes. |
| "The test framework doesn't support this" | Then the implementation approach needs to change, not the discipline. |
| "It's just a config change" | Config changes break production. A test that asserts the config value takes 30 seconds. |
| "I already know the implementation works" | Then the test will pass immediately. Write it anyway — it protects against regressions. |
| "Writing the test first would be awkward here" | Awkwardness is a design signal. TDD-hostile code is usually poorly structured. |
| "I need to explore first, then test" | Spike in a scratch file. When you know the shape, start TDD. Never commit spike code. |
| "The test would just be a tautology" | Then you are testing the wrong thing. Test the observable behavior, not the implementation. |
| "Let me just get it working, then add tests" | This is the #1 rationalization that leads to untested production code. No. |
| "Tests slow me down" | Tests slow you down less than debugging production failures. Front-load the cost. |

For the full review loop pattern, see `docs/reference/review-loop-pattern.md`. TDD uses a single-pass quality check, not the full loop.
