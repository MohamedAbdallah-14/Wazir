# Context Degradation in LLMs — Deep Research

## The Core Finding
Context length alone hurts performance, even with perfect retrieval, even with irrelevant tokens masked. This is architectural, not a retrieval problem.

## Quantitative Degradation by Context Length

| Length | What Happens |
|--------|-------------|
| <4K | Near theoretical best. All models 85-97% on RULER. |
| 4K-10K | Mild degradation on complex tasks |
| 10K-32K | Significant. Only half of 32K+ models maintain performance at 32K. GPT-4o: 99.3% → 69.7% on NoLiMa. |
| 32K-64K | Sharp drops. GPT-4: 96.6% → 87.0% |
| 64K-128K | Severe for most. GPT-4: → 81.2%. Exception: Gemini 1.5 Pro holds at 94.4%. |
| 128K-200K | Claude's "native reliability boundary" |
| 200K-1M | Claude Opus 4.6: 76% multi-needle at 1M |

## Key Papers

### "Context Length Alone Hurts" (Du et al., EMNLP 2025)
- Even with perfect retrieval: 13.9-85% degradation as input grows
- Mistral-7B GSM8K: 70.6% → 35.5% at 26K padding tokens
- Persists with whitespace padding (no distractors at all)
- Persists even when irrelevant tokens are MASKED

### Contextual Distraction (Huang et al., 2025)
- Semantically coherent but irrelevant context: ~45% average degradation
- An ability-level challenge, not knowledge-level

### Context Rot (Chroma, 2025)
- All 18 frontier models degrade at every length increment
- Focused prompts (~300 tokens) substantially outperform full prompts across all models
- No single model ranked first across all experiments

## Mitigations with Evidence

| Strategy | Effect | Source |
|----------|--------|--------|
| Prompt repetition (duplicate prompt) | 21.33% → 97.33% (Gemini Flash Lite) | Leviathan et al. 2025 |
| Recite-then-solve | 35.5% → 66.7% at 26K (Mistral) | Du et al. 2025 |
| Chain of Agents (8K chunks) | +10% over 200K full-context | Zhang et al. 2024 |
| RAG vs long context | LC wins on Wikipedia QA, RAG wins on dialogue | Li et al. 2025 |
| Context compression (LongLLMLingua) | +21.4% accuracy at 4x compression | ACL 2024 |
| Anthropic compaction | Preserves architecture decisions, discards tool outputs | Anthropic 2025 |

## Anthropic's Own Guidance
- "Context windows of all sizes will be subject to context pollution"
- Three strategies: compaction, structured note-taking, multi-agent architectures
- Natural compaction points after each phase
- Build context incrementally, don't dump everything upfront

## Implications for Wazir
**Fresh context per phase with ~2K-10K tokens of structured artifacts is the most robustly supported architecture.** Every paper points the same direction: shorter, focused context outperforms longer, noisier context on every metric.

- BABILong: models use only 10-20% of context effectively
- Pipeline resetting to relevant artifacts = 100% of context is relevant
- CDV/GSM-IC: irrelevant context actively degrades performance (fresh context eliminates this)
- Risk: information loss during artifact compression (needs careful handoff engineering)
