# Code Smells — Reviewer Digest

> Detection-focused extract for reviewer context. For full remediation guidance, see `antipatterns/code/code-smells.md`.

## Method-Level Smells

| Smell | Detection Signal | Severity |
|-------|-----------------|----------|
| **Long Method** | >30 lines or >3 levels of nesting | medium |
| **Parameter List** | >4 parameters | medium |
| **Feature Envy** | Method accesses another object's data more than its own | high |
| **Message Chains** | `a.b().c().d()` — 3+ chained calls | medium |
| **Inappropriate Intimacy** | Class reaches into another's private/internal state | high |
| **Refused Bequest** | Subclass overrides parent methods to do nothing | medium |

## Class-Level Smells

| Smell | Detection Signal | Severity |
|-------|-----------------|----------|
| **Large Class** | >300 lines or >10 public methods | medium |
| **God Class** | Handles >3 unrelated responsibilities | high |
| **Data Class** | Only getters/setters, no behavior | low |
| **Lazy Class** | <3 methods, delegating everything | low |
| **Speculative Generality** | Abstract classes/interfaces with single implementation | medium |
| **Middle Man** | Class delegates >80% of methods to another | medium |

## Structural Smells

| Smell | Detection Signal | Severity |
|-------|-----------------|----------|
| **Shotgun Surgery** | One change requires edits to 5+ files | high |
| **Divergent Change** | One file changes for multiple unrelated reasons | high |
| **Parallel Inheritance** | Adding a subclass in one hierarchy requires adding one in another | medium |
| **Data Clumps** | Same 3+ fields appear together in multiple places | medium |
| **Primitive Obsession** | Using primitives where a domain type would be clearer | low |
| **Switch Statements** | Repeated switch/if-else on the same discriminant | medium |

## Code Duplication

| Smell | Detection Signal | Severity |
|-------|-----------------|----------|
| **Exact Duplication** | Identical blocks >5 lines | high |
| **Structural Duplication** | Same algorithm with different types/names | medium |
| **Semantic Duplication** | Different code doing the same thing | medium |

## Naming Smells

| Smell | Detection Signal | Severity |
|-------|-----------------|----------|
| **Misleading Name** | Name implies different behavior than actual | high |
| **Inconsistent Naming** | Same concept has different names across files | medium |
| **Generic Name** | `data`, `info`, `handler`, `manager`, `utils` without qualifier | medium |
| **Encoded Type** | Hungarian notation or type in name (`strName`, `arrList`) | low |
