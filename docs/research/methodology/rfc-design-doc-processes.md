# RFC and Design Doc Processes Across Top Engineering Organizations

## The Universal 7 Principles (Present in ALL Processes Studied)

1. **Writing forces clarity.** Every process is built on writing before code.
2. **Problem before solution.** Explicit "why" before "what."
3. **Explicit scope boundaries.** Non-goals/No-gos prevent scope creep.
4. **Alternatives documented.** Not just "what" but "what else and why not."
5. **Trade-offs over perfection.** Long-term value in trade-off documentation.
6. **Structured review with clear ownership.** WHO decides and HOW.
7. **Living artifact → historical record.** Immutable once accepted, never deleted.

## The Minimum Viable Design Document

```
# [Title]
## Status (Draft | In Review | Accepted | Superseded)
## Context & Problem
## Goals
## Non-Goals
## Proposed Solution
## Alternatives Considered (including "do nothing")
## Trade-offs & Consequences
## Open Questions
```

8 sections. Everything beyond is domain-specific elaboration.

## Process Maturity Spectrum

```
Lightweight ─────────────────────────────────── Heavyweight
ADR    Shape Up    Google    Stripe    Rust/PEP    Amazon    KEP
(5)    (5 ingr.)  (~10)    (review)   (FCP)      (6-pager) (30+ + PRR)
```

## Organization Details

### Google Design Docs
- 10-20 pages for major, 1-3 for incremental
- Sections: Context, Goals/Non-goals, Design, APIs, Data, Alternatives
- Emphasis on **trade-offs** as the long-term value
- Three review phases: creation → review → living implementation
- Key insight: degree of constraint shapes the entire document

### Amazon PR-FAQ
- Press Release (page 1) + FAQ (pages 2-6)
- 15-20 min silent reading then 40 min discussion
- "Truth-seeking, NOT selling"
- Reviewed on: clear customer, clear problem, behavior change expected, TAM
- Many drafts, escalating from 10 contributors to executive

### Rust RFCs
- Sections: Summary, Motivation, Guide-level explanation, Reference-level, Drawbacks, Rationale & alternatives, Prior art, Unresolved questions, Future possibilities
- PR-based, Final Comment Period (10 calendar days)
- Consensus-building culture

### Python PEPs
- Must have: Motivation (PEPs without it get rejected), Specification (detailed enough for competing implementations), Rationale, Reference Implementation
- Steering Council has final authority
- Standards Track PEPs need implementation before "Final" status

### Kubernetes KEPs
- Heaviest process: 30+ sections + Production Readiness Review questionnaire
- Graduation: provisional → implementable → implemented; alpha → beta → GA
- PRR covers: enablement, rollback, monitoring, dependencies, scalability

### Basecamp Shape Up
- 5 ingredients: Problem, Appetite (time budget ≠ estimate), Solution (fat marker sketches), Rabbit Holes, No-Gos
- Appetite as creative constraint: "starts with a number, ends with a design"
- Betting table, not backlog (unbet pitches discarded)

### ThoughtWorks (Advice Process)
- Anyone can make architectural decisions
- Must consult: (1) everyone affected, (2) experts
- ADRs stored in source control alongside code
- Architecture Advisory Forum as support mechanism

### Stripe
- 20-page internal API design document
- "Gavel blocks" — impacted stakeholders with checkboxes
- At scale, centralized review became friction → pivot to education service

### Spotify
- Golden Paths (opinionated supported paths) + Backstage (developer portal)
- Service creation: 14 days → under 5 minutes
- Distributed decisions across autonomous squads

### Netflix
- Paved Roads (formally supported, so good deviating is obviously worse)
- Full Cycle Developers (design through operate)
- Resilience designed-in (Chaos Monkey, circuit breakers)

## ADR (Architecture Decision Records)

### Nygard's Original (2011)
```
# Title
## Status (proposed, accepted, rejected, deprecated, superseded)
## Context
## Decision
## Consequences
```

### Y-Statement Format
"In the context of [use case], facing [concern], we decided for [option] to achieve [quality], accepting [downside]."

### Key properties
- In source control alongside code
- Immutable once accepted (superseded, never edited)
- Sequential numbering = chronological log
- ThoughtWorks "Adopt" rating (strongest recommendation)

## Sources
25+ sources including: Google (Malte Ubl), Amazon (Working Backwards), Rust RFC repo, PEP 1, KEP template, Shape Up (Basecamp), ThoughtWorks Tech Radar, Stripe (Kenneth Auchenberg), Pragmatic Engineer, Squarespace, Spotify Engineering, Netflix Tech Blog.
