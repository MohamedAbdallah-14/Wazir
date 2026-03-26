# Context Degradation / Context Rot Research

**Date:** 2026-03-24

## Key Numbers

| Metric | Value | Source |
|--------|-------|--------|
| Middle-position accuracy drop | 20-25pp | Lost in the Middle (Stanford 2023) |
| Onset of retrieval degradation | ~32K tokens | Multiple NIAH studies |
| Onset of instruction degradation | ~8K-16K tokens | IFEval benchmarks |
| Severe degradation threshold | ~64K-128K tokens | RULER, LMSYS |
| Average degradation rate | ~2% per 100K tokens | LMSYS, Nous Research |
| Instruction compliance at 128K | ~50-65% | IFEval-style benchmarks |
| Alignment faking rate | 14% behavioral, 78% in scratchpads | Anthropic (Dec 2024) |
| Planning accuracy drop per step | ~4-5pp per step | Kambhampati (2024) |
| System prompt compliance at 0.5% ratio | ~50-60% | Multi-turn chat studies |
| Effective context vs advertised | ~25-50% of advertised | Chroma, RULER |
| Agent failure rate doubles at 2x duration | Every agent | Chroma 2025 |

## Degradation Shape

Not linear or exponential — **sigmoidal/stepped**:
- Phase 1 (0-32K): Relatively stable, 1-3% loss
- Phase 2 (32K-100K): Accelerating, exponential-like
- Phase 3 (100K+): Plateaus at degraded level

## Instructions Degrade Faster Than Knowledge

- Instruction compliance drops ~25-35pp over 128K window
- Factual accuracy drops only ~10pp over same window
- Instructions are stated once, early. Knowledge is in weights.
- The ratio of instruction tokens to total tokens predicts compliance better than absolute length

## Context Type Matters

| Type | Degradation Rate |
|------|-----------------|
| Code | Low-moderate (structural signals help) |
| Instructions/constraints | HIGH (most vulnerable) |
| Conversation history | Moderate (recency bias compensates) |
| Structured data (JSON/YAML) | Low |
| Repeated/reinforced content | Low |

## Proven Mitigations

1. Fresh sessions/subagent spawning (most effective — eliminates accumulation)
2. Context windowing/sliding window
3. Summarization/compression
4. Instruction repetition/reinforcement (+10-15pp recovery)
5. Structured state management (external DB/files)
6. Hierarchical context (L1 always present, L2 task-relevant, L3 on-demand)

## Key Papers

- Liu et al., "Lost in the Middle" (Stanford 2023)
- Kambhampati et al., arXiv:2402.01817 (Planning abilities, 2024)
- Greenblatt et al., "Alignment Faking" (Anthropic Dec 2024)
- TME, arXiv:2504.08525 (Task Management Engine, 2025)
- Hsieh et al., "RULER" (2024)
- Chroma Context Rot study (2025)
