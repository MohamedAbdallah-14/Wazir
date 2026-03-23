# Domain-Driven Design — Reviewer Digest

> Evaluation-focused extract for reviewer context. For full guidance, see `architecture/foundations/domain-driven-design.md`.

## Bounded Context Check

- Is the module boundary aligned with a domain concept (not a technical layer)?
- Do different modules use the same term to mean different things? If yes, a context boundary is needed.
- Are there translation/mapping layers between modules? If not and they share types, potential coupling risk.
- Is the system applying DDD where it's warranted? (Complex domain logic, multiple teams, long-lived system) Or is it over-engineering CRUD?

## Entity & Value Object Check

- Do domain objects have identity (ID field) that persists across state changes? If yes, they are Entities.
- Are domain objects defined purely by their attributes (money, address, date range)? If yes, they are Value Objects.
- Are entities being compared by value when they should be compared by ID?
- Are value objects being given IDs when they should be immutable and interchangeable?
- Are value objects actually immutable? (No setters, no mutation methods)

## Aggregate Check

- Is there a clear aggregate root that controls access to child entities?
- Are child entities being accessed directly (bypassing the root)? This breaks aggregate invariants.
- Does the aggregate enforce its invariants (validation, state transitions)?
- Are aggregates too large? (>5 entities suggests decomposition needed)
- Are aggregates being loaded in full when only a subset is needed? (Performance smell)
- Do transactions span multiple aggregates? (Design smell — aggregates should be consistency boundaries)

## Domain Event Check

- Are significant state changes published as domain events?
- Do event names use past tense and domain language? (`OrderPlaced`, not `HandleOrder`)
- Are events immutable once published?
- Is there a clear distinction between domain events (within bounded context) and integration events (across contexts)?

## Naming Review

| Signal | Issue | Severity |
|--------|-------|----------|
| Generic names: `Service`, `Manager`, `Handler`, `Processor` | Missing domain language | medium |
| Technical names in domain layer: `UserDTO`, `OrderRepository` | Infrastructure leaking into domain | medium |
| Inconsistent naming: `Customer` in one module, `Client` in another for same concept | Missing ubiquitous language | high |
| Verb-only names: `validate`, `process`, `handle` without domain qualifier | Ambiguous responsibility | medium |
| Pluralization confusion: `Order` entity vs `Orders` service vs `OrderList` collection | No naming convention | low |

## Repository Pattern Check

- Do repositories return domain objects (not database rows/DTOs)?
- Is the repository interface in the domain layer, implementation in infrastructure?
- Are queries filtering by domain concepts (not SQL/table structure)?
- Is there one repository per aggregate root? (Not per entity or per table)

## Strategic DDD Red Flags

| Signal | Issue | Severity |
|--------|-------|----------|
| Universal data model shared across all modules | Missing bounded contexts | high |
| One "User" type used everywhere with 30+ fields | Context-specific models needed | high |
| Tactical patterns (Aggregates, Value Objects) without strategic boundaries | Cargo-culting DDD | medium |
| No ubiquitous language — developers and domain experts use different terms | Core DDD principle violated | high |
