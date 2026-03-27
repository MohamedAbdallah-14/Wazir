# Requirements-to-Tasks Best Practices — Industry + Academic Synthesis

## 7 Cross-Cutting Principles (from 24 findings)

### 1. Phase Isolation is Non-Negotiable
Context rot + architect/editor separation prove mixing concerns degrades quality. Each phase: focused, curated context.

### 2. Specs Must Be Structured, Not Free-Form
Given/When/Then, EARS notation, domain language. Semi-structured specs dramatically outperform prose.

### 3. Verification Criteria Must Precede Implementation
TDD evidence (40-90% defect reduction), INVEST "Testable", Anthropic "ground truth at every step."

### 4. Decompose to Agent's Competence Level
SWE-bench: ~75% on well-scoped, ~23% on complex. Devin sweet spot: 4-8hr junior-engineer tasks.

### 5. Quality Gates Kill the Velocity Trap
CMU study: Cursor velocity gains + persistent complexity increase. METR: developers 19% slower with AI (thought they were 20% faster).

### 6. Human Checkpoints at Phase Boundaries
Only 0-20% of tasks fully delegable (Anthropic 2026). Automate within phases, validate at transitions.

### 7. Front-Load Effort into Specification
Devin, Osmani, Shape Up agree: human's highest-leverage work is spec quality, not code review.

## Key Evidence

### Context Degradation
- Even with perfect retrieval, 13.9-85% degradation as input grows (EMNLP 2025)
- U-shaped curve: middle of context is dead zone (Lost in the Middle)
- Context rot affects reasoning, math, AND coding (Chroma)

### Spec-Driven Development (2025 Paradigm)
- Red Hat: 95%+ accuracy with spec-driven AI coding
- Three levels: spec-first, spec-anchored (minimum viable), spec-as-source
- GitHub Spec Kit: specify → plan → tasks (gated checkpoints)
- ThoughtWorks: BDD Given/When/Then still the gold standard

### AI Agent Reality
- Anthropic context engineering: Write, Select, Compress, Isolate
- Anthropic agents: workflows (predictable) > agents (dynamic). Use workflows.
- 17x error amplification in independent multi-agent (DeepMind). Use centralized orchestration.
- Error propagation saturates past 4 agents.

### Verification
- TDD: 40-90% defect reduction, 15-35% time increase (Microsoft/IBM)
- Given/When/Then serves triple duty: spec, test, documentation
- Each task must have verification criteria BEFORE execution

## Sources
30+ sources including: Chroma Research, EMNLP 2025, Stanford TACL, CMU/MSR, METR, ThoughtWorks, Martin Fowler, GitHub, Kiro, Red Hat, Basecamp, Google, Anthropic (x3), Devin/Cognition, Addy Osmani, SWE-bench, Aider, DeepMind, Microsoft/IBM TDD study.
