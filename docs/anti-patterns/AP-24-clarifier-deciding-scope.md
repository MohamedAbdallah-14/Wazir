# AP-24: Clarifier Making Scope Decisions Without Asking

## Pattern

The clarifier autonomously decides that certain items are "out of scope" without asking the user. This typically happens when the input doesn't explicitly mention something (e.g., documentation, i18n, testing strategy), and the clarifier assumes silence means exclusion.

## Example

User input: "Build a user authentication system with OAuth2."

Clarifier produces: "Out of scope: documentation, i18n, rate limiting, password recovery."

The user never agreed to exclude any of these. The clarifier decided unilaterally.

## Harm

- Items the user wanted are silently dropped
- The user sees the final output and assumes the pipeline covered everything
- 21 input items become 5 tasks because the clarifier excluded 16 without asking
- Trust in the pipeline erodes when users discover missing features after delivery

## Detection

- Clarification document contains "out of scope" items that were never discussed with the user
- Plan has fewer tasks than distinct items in the original input
- Scope coverage guard (`evaluateScopeCoverageGuard`) flags plan < input items

## Fix

1. Research runs FIRST — the clarifier must have context before asking questions
2. After research, ask INFORMED questions in batches of 3-7
3. Every scope exclusion must reference an explicit user confirmation
4. If the input is clear, zero questions is fine — but the clarifier must state "no ambiguities detected" rather than silently proceeding
5. The clarification document must cite user responses for every scope boundary decision
