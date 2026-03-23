# Code Review Methodology — Reviewer Digest

> Detection-focused extract for reviewer context. For full analysis, see `antipatterns/process/code-review-antipatterns.md`.

## Reviewer Antipatterns to Avoid

| Antipattern | Signal You're Doing It | Correction |
|-------------|----------------------|------------|
| **Rubber Stamping (AP-01)** | All passes clean with no findings | Every diff has something worth noting. Look harder. |
| **Nitpick Focus (AP-02)** | >50% of findings are style/formatting | Rebalance: logic > structure > style |
| **Too-Late Review (AP-03)** | Raising architectural objections after full implementation | Review early artifacts (spec, design, plan) when available |
| **Scope Creep (AP-04)** | Suggesting features/refactors outside the diff | Review what changed. File issues for what should change next. |
| **Severity Inflation (AP-05)** | Everything is "blocking" | Reserve blocking for: security, data loss, crash, wrong behavior. |
| **Severity Deflation (AP-06)** | Nothing is "blocking" despite clear bugs | If it would break in production, it's blocking. Period. |
| **Confirmation Bias (AP-07)** | Checking "did they follow the plan" not "does it work" | Test against the spec, not the approach. |
| **Anchoring (AP-08)** | Prior review pass findings anchoring this pass | Each pass is independent. Re-read the diff fresh. |
| **Inconsistent Standards (AP-09)** | Different quality bar for different authors or modules | Apply the same severity criteria uniformly across the codebase. |
| **Review by Checklist Only (AP-10)** | Mechanically checking boxes without reading logic | Checklists supplement deep reading, they don't replace it. |

## Severity Calibration

| Severity | Criteria | Examples |
|----------|----------|---------|
| **blocking** | Would cause incorrect behavior, data loss, security vulnerability, or crash in production | Missing auth check, SQL injection, unhandled null, wrong business logic |
| **warning** | Degrades quality but does not break correctness | Missing error message, poor naming, missing test for edge case |
| **note** | Improvement opportunity, style preference, or observation | Alternative approach suggestion, documentation gap, minor duplication |

## Dimension Coverage Discipline

- Score EVERY assigned dimension, even if it passes cleanly
- A dimension with no findings gets score 10 with brief justification
- Never skip a dimension because "it looks fine" — that is rubber stamping
- Findings must reference specific file:line locations

## Review Pass Independence

- Each review pass is a fresh evaluation — do not anchor on previous pass findings
- Re-read the diff from scratch on each pass
- If a prior finding was fixed, verify the fix independently (don't assume it's correct)
- Track pass numbers explicitly: pass 1 of N, pass 2 of N

## Finding Quality Checklist

Each finding must have:
1. **Location:** file path and line number(s)
2. **Severity:** blocking / warning / note
3. **Dimension:** which review dimension it belongs to
4. **Description:** what the issue is and why it matters
5. **Source tag:** `[Internal]`, `[Codex]`, or `[Both]`
