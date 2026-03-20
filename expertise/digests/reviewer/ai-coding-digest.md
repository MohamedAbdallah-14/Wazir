# AI Coding Antipatterns — Reviewer Digest

> Detection-focused extract for reviewer context. For full analysis, see `antipatterns/process/ai-coding-antipatterns.md`.

## Specification Drift (AP-01)
- **Signal:** Implementation differs from stated requirements without documented reason
- **Check:** Compare task spec acceptance criteria against actual code behavior
- **Severity:** high

## Hallucinated APIs (AP-02)
- **Signal:** Import or call to function/class/module that doesn't exist in the dependency tree
- **Check:** Verify every imported symbol resolves to an actual export
- **Severity:** critical

## Outdated Patterns (AP-03)
- **Signal:** Using deprecated APIs, class components in React 2025, callback-based async when promises are standard
- **Check:** Compare patterns against current library version best practices
- **Severity:** high

## Premature Abstraction (AP-04)
- **Signal:** Generic utility/helper that is used exactly once
- **Check:** Count call sites for each abstraction introduced
- **Severity:** medium

## Context Window Stuffing (AP-05)
- **Signal:** Agent reads 10+ files without index queries; loads entire modules instead of targeted slices
- **Check:** Review tool call patterns — excessive Read calls without preceding search
- **Severity:** low (efficiency, not correctness)

## Fake Testing (AP-06)
- **Signal:** Tests that assert implementation details, use mocks that mirror the implementation, or test tautologies
- **Check:** Would the test fail if the implementation had a real bug? If not, it's fake.
- **Severity:** high

## Scope Creep (AP-07)
- **Signal:** Files modified or features added that were not in the task spec
- **Check:** Diff includes changes outside the task's specified file scope
- **Severity:** medium

## Optimistic Error Handling (AP-08)
- **Signal:** Missing try/catch around I/O operations, network calls, file operations, JSON parsing
- **Check:** Every async operation and external call has error handling
- **Severity:** high

## Stale Dependency (AP-09)
- **Signal:** Importing deprecated APIs, using outdated package versions with known CVEs
- **Check:** Package versions against known vulnerability databases
- **Severity:** medium-high

## Cargo-Cult Patterns (AP-10)
- **Signal:** Design patterns applied without the problem they solve (Factory for single type, Observer for single listener)
- **Check:** Does the pattern's complexity serve a real need?
- **Severity:** medium

## Gold Plating (AP-11)
- **Signal:** Extra configuration, extensibility points, or features not in the spec
- **Check:** Is every public API/config option traceable to a requirement?
- **Severity:** medium

## Sycophantic Compliance (AP-12)
- **Signal:** Agent implements exactly what was asked even when the request contains contradictions or obvious errors
- **Check:** Look for requirements that conflict with each other or with the codebase's existing contracts
- **Severity:** high

## Phantom Error Handling (AP-13)
- **Signal:** Error handling code that looks comprehensive but handles errors incorrectly (swallows, retries without backoff, logs without propagating)
- **Check:** Trace each error path — does it actually reach a handler that does the right thing?
- **Severity:** high

## Inconsistent State After Failure (AP-14)
- **Signal:** Multi-step operations where a failure in step N leaves steps 1..N-1 committed
- **Check:** Are multi-step mutations wrapped in transactions or compensating actions?
- **Severity:** high

## Over-Confident Comments (AP-15)
- **Signal:** Comments claiming "this handles all edge cases" or "this is thread-safe" without evidence
- **Check:** Does the code actually handle what the comment claims?
- **Severity:** medium

## Training Data Leakage (AP-16)
- **Signal:** Code that closely mirrors common training examples but doesn't fit the actual use case
- **Check:** Does the implementation structure match the problem, or does it match a textbook example?
- **Severity:** medium
