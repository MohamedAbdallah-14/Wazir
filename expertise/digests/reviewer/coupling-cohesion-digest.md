# Coupling & Cohesion — Reviewer Digest

> Evaluation-focused extract for reviewer context. For full guidance, see `architecture/foundations/coupling-and-cohesion.md`.

## Coupling Assessment

| Coupling Type | Detection Signal | Severity |
|---------------|-----------------|----------|
| **Content Coupling** | One module directly modifies another's internal state (private fields, internal data structures) | critical |
| **Common Coupling** | Multiple modules read/write shared global state (global config they all mutate, shared DB table without coordination) | high |
| **Control Coupling** | Function parameter controls another module's execution flow (boolean flag argument that switches behavior) | medium |
| **Stamp Coupling** | Passing a large object when only 1-2 fields are needed (entire User object for a function that needs email) | low |
| **Data Coupling** | Passing only needed data — this is GOOD coupling | none (target) |
| **Message Coupling** | Modules communicate through events/messages with no identity knowledge — this is BEST coupling | none (target) |

## Cohesion Assessment

| Cohesion Type | Detection Signal | Quality |
|---------------|-----------------|---------|
| **Functional** | Module does one thing and does it completely | best |
| **Sequential** | Output of one operation feeds input of the next (ETL pipeline) | good |
| **Communicational** | Operations work on the same data (read, compute, format same record) | acceptable |
| **Temporal** | Operations happen at the same time but serve different purposes (init, cleanup) | poor |
| **Logical** | Operations share control flow but not purpose (util files, catch-all handlers) | poor |
| **Coincidental** | No relationship between operations (random grab-bag module) | worst |

## Quick Check

For each module in the diff, ask:
1. **Cohesion:** Can I describe this module's purpose in one sentence without "and"? If no, low cohesion.
2. **Coupling:** If I change this module's internals, how many other files need to change? If >2, high coupling.
3. **Direction:** Do dependencies flow from unstable (UI, API handlers) toward stable (domain, utilities)? If reversed, structural debt.

## Connascence Quick Reference

Connascence refines coupling into a more granular classification. Ordered from weakest (acceptable) to strongest (most harmful):

| Connascence | Description | Acceptable? |
|-------------|-------------|-------------|
| **Name** | Two components must agree on a name (function name, variable name) | Yes — unavoidable and cheaply refactored |
| **Type** | Two components must agree on a type (parameter type, return type) | Yes — enforced by type systems |
| **Meaning** | Two components must agree on the meaning of a value (true = active, 0 = success) | Caution — use enums/constants instead of magic values |
| **Position** | Two components must agree on parameter order | Caution — use named parameters or option objects |
| **Algorithm** | Two components must use the same algorithm (hashing, encoding) | Risky — extract shared algorithm to single location |
| **Execution** | Two components must execute in a specific order | Risky — make ordering explicit in control flow |
| **Timing** | Two components must execute at the same time or within a window | High risk — source of race conditions |
| **Value** | Two components must have correlated values (e.g., two arrays that must be same length) | High risk — encapsulate into a single data structure |
| **Identity** | Two components must reference the same object instance | High risk — shared mutable state |

## Module Boundary Health

- Modules should have narrow interfaces (few public exports relative to total code)
- Changes should be localized: a bugfix in module A should not require changes in modules B, C, D
- Test for boundary health: can you write a unit test for this module without importing 5+ other modules?
