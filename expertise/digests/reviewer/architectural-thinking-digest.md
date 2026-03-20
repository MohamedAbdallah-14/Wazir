# Architectural Thinking — Reviewer Digest

> Evaluation-focused extract for reviewer context. For full guidance, see `architecture/foundations/architectural-thinking.md`.

## Architecture Review Checklist

### Separation of Concerns
- Does each module/file have a single clear responsibility?
- Are business logic, data access, and presentation in separate layers?
- Can you describe what a module does in one sentence without "and"?

### Dependency Direction
- Do dependencies point inward (toward core domain), not outward?
- Are infrastructure details (DB, HTTP, filesystem) behind abstractions?
- Could you swap the database without changing business logic?

### Interface Design
- Are public APIs minimal (expose only what is needed)?
- Are contracts (types, schemas, interfaces) explicit and documented?
- Do functions have clear input/output contracts without hidden side effects?

### Change Impact
- Can you add a feature without modifying existing code (Open-Closed)?
- Are changes localized (changing one feature doesn't cascade across modules)?
- Is the dependency graph shallow (max 3-4 levels deep)?

### Reversibility Assessment
- Which decisions in this diff are hard to reverse?
- Are irreversible decisions (data models, service boundaries, consistency models) justified with documented reasoning?
- Are reversible decisions (naming, folder structure, library choices) made quickly without over-analysis?

### Trade-off Reasoning
Every architectural decision involves trade-offs. During review, check:
- Is the trade-off acknowledged? ("We chose X because Y, accepting Z")
- Is the trade-off appropriate for the context? (startup vs. enterprise, prototype vs. production)
- Are rejected alternatives documented?

## Architecture Smells (Quick Detection)

| Smell | Signal | Severity |
|-------|--------|----------|
| **Big Ball of Mud** | No discernible module boundaries; any module calls any other | critical |
| **Layering Violation** | UI code calling database directly; domain importing from infrastructure | high |
| **Circular Module Dependency** | Module A depends on Module B depends on Module A | high |
| **God Module** | One module >1000 LOC handling multiple concerns | medium |
| **Leaky Abstraction** | Internal implementation details exposed in public interface | medium |
| **Distributed Monolith** | Multiple services that must be deployed together | high |
| **Accidental Complexity** | Architecture complexity not justified by problem complexity | medium |
| **Architecture Astronaut** | Abstractions solving problems no one has yet | medium |
| **Dead End Architecture** | Design choices that prevent future evolution (no extension points, hardcoded assumptions) | high |

## Quality Attribute Checklist

When reviewing architectural decisions, verify the relevant quality attributes are addressed:

| Attribute | Review Question |
|-----------|----------------|
| **Performance** | Are there obvious bottlenecks? N+1 queries? Unbounded loops? |
| **Scalability** | Can this handle 10x load without structural changes? |
| **Security** | Are trust boundaries enforced? Input validated at boundaries? |
| **Availability** | What happens when a dependency fails? Is there a fallback? |
| **Modifiability** | How many files change to add a typical feature? |
| **Testability** | Can components be tested in isolation without complex setup? |
