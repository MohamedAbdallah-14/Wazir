# Requirements Engineering — 40+ Years of Academic Research

## IEEE 830 / ISO 29148: 8 Properties Every Requirement Must Have
Complete, Consistent, Unambiguous, Verifiable, Traceable, Modifiable, Ranked, Correct.

29148 shifted from "produce a document" to "execute a process" — RE is iterative, not one-shot.

## Elicitation: What Works
- **No single technique dominates.** Combining multiple outperforms any single approach.
- Paper prototyping: highest total requirements elicited, best for functional reqs
- JAD workshops: best for non-functional reqs, least redundancy, most time
- Unstructured interviews: fastest to report, most redundancy

## Analysis Techniques
- **Gap analysis**: importance (2x weight) - satisfaction = opportunity score
- **MoSCoW**: rapid stakeholder consensus
- **Kano**: Basic (must-have), Performance (more-is-better), Delighter (unexpected joy)
- **RICE**: quantitative scoring when data exists

## Specification Formats
- **Use Cases (Cockburn)**: Rich context, scales from brief to formal. Sea-level is preferred.
- **User Stories (Cohn)**: INVEST criteria. 90% of agile uses them. Lucassen found widespread quality defects (QUS framework, 13 criteria, 1023 stories).
- **Job Stories (JTBD)**: "When [situation], I want [motivation], so I can [outcome]." Removes persona, focuses on motivation.
- **Formal**: Z, TLA+, Alloy. Only for safety-critical or high-concurrency.

## Validation (Before Implementation)
1. Reviews/inspections: catch 60% of defects (Boehm & Basili)
2. Perspective-based reviews: +35% more defects than ad-hoc
3. Prototyping: surfaces implicit assumptions
4. Test case generation: if you can't write a test, it's not verifiable
5. Model checking / formal verification
6. Automated smell detection: Paska tool, 89% precision on 2,725 industrial reqs

## Requirements Smells
Subjective language, ambiguous adverbs, vague pronouns, loopholes ("if possible"), superlatives, negatives, open-ended terms, incomplete references, coordination ambiguity.

## The Cost Curve (Boehm)
- Requirements: 1x
- Design: ~5x
- Coding: ~10x
- Testing: ~20x
- Post-delivery: ~100x (architecture breakers)
- **40-50% of project effort = avoidable rework**

## CHAOS Reports
- 16.2% success, 52.7% challenged, 31.1% cancelled
- Requirements-related problems = ~37% of all cited failure factors (#1 category)
- Top success factors: user involvement, executive support, clear requirements

## What Agile Got Right
Iterative refinement, continuous stakeholder involvement, just-in-time elaboration

## What Agile Got Wrong
- "Working software over docs" became "no docs" → 47% extra maintenance effort
- User stories alone insufficient for complex systems
- Dropping traceability removes impact analysis capability

## AI-Assisted RE (2025 frontier)
- 74 studies published, 136% YoY growth
- GPT-4 requirements: +1.12 alignment, 10.2% more complete, 720x faster, 0.06% cost
- BUT: hallucination, domain gaps, 75% lab-only evaluation
- RAG-based approaches most promising and most under-explored
