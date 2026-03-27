# LLM Context Window Management, Degradation, and Strategies — Deep Research

## 1. "Lost in the Middle" (Liu et al., 2023, TACL)

- **U-shaped performance curve**: Best at beginning/end, worst in middle
- With 20 docs (~4K tokens): accuracy drops from 70-75% (edges) to 55-60% (middle) — 15-20pp degradation
- Persists even for models trained on long contexts
- Mirrors human serial position effects (primacy/recency)

## 2. Claimed vs. Effective Context Length

- Effective capacity: typically **60-70% of advertised maximum**; open-source models deliver <50%
- RULER benchmark (NVIDIA, COLM 2024): Despite near-perfect NIAH, almost all models show large drops as context grows. Only half maintain performance at 32K.
- Degradation is **not gradual** — sharp drop at threshold. 200K model unreliable around 130K.
- Gemini 1.5 Pro is an outlier: only 2.3 points loss from 4K to 128K.
- **1M-token window ≠ 1M useful tokens.** For complex reasoning, effective = 10-20% of nominal.

## 3. Needle in a Haystack: Beyond Simple Retrieval

- Vanilla NIAH essentially solved for frontier models (>99.7% at 1M tokens)
- **Semantic NIAH** degrades 30%+ (Chroma study)
- **BABILong** (NeurIPS 2024): LLMs effectively utilize only 10-20% of context for reasoning
- Smaller needles amplify positional sensitivity

## 4. Instruction Following Degradation

- **LongGenBench (ICLR 2025)**: Instruction adherence significantly diminishes after 4K tokens of output, substantial ineffectiveness by 16K
- **Context length alone hurts even with perfect retrieval** (Du et al., EMNLP 2025): 13.9% to 85% degradation as input length increases, even with irrelevant tokens replaced with whitespace
- Rules at token 1,000 are demonstrably more effective than at token 100,000

## 5. Multi-Turn Conversation Degradation

- **All top LLMs: 39% average performance drop** in multi-turn vs single-turn (Laban et al., Microsoft, 2025)
- Not information loss — CONCAT recovers 95.1%. Issue is context distribution across turns.
- LLMs make **premature assumptions** and **over-rely on prior outputs** even when wrong
- **Unreliability degrades first** (before factual accuracy or formatting)

## 6. Context Compression Techniques

| Technique | Retention | Compression | Best For |
|-----------|-----------|-------------|----------|
| Token Pruning | 70-90% | 40-70% | Removing irrelevant tokens |
| Abstractive | 50-80% | 60-90% | Summarizing key points |
| Distillation | 30-60% raw | 80-95% | Capturing principles |
| Observation Masking | Variable | 50-80% | Agent tool outputs |

- **ACON**: Reduces memory 26-54% while preserving task success
- **Context-Folding**: 10x smaller active context
- **AgentFold**: 98-99% survival probability of key details

## 7. Strategies That Work

1. **Primacy/recency placement**: Critical info at beginning AND end (empirically justified by U-curve)
2. **Structured context with XML/headers**: How info is presented matters more than presence
3. **Progressive context loading**: Don't load everything upfront. Just-in-time.
4. **Fresh context between phases**: Anthropic's production recommendation for long-running agents
5. **Artifacts not context**: Pass state via files/commits, not conversation history. CONCAT finding proves info isn't lost.
6. **Re-inject instructions at phase boundaries**: Rules at 100K tokens are weaker than at 1K

## 8. Implications for Wazir Pipeline

| Strategy | Evidence | When to Use |
|----------|----------|-------------|
| Fresh context + artifacts | Anthropic harness, multi-turn research | Default for multi-phase pipelines |
| Compaction within phase | Claude SDK, JetBrains research | Long single-phase tasks |
| Sub-agent isolation | CoThinker, Anthropic | Separable sub-goals |
| Rolling summary | Factory.ai, LangGraph | Conversational histories |
| Recite-before-solve | Du et al. EMNLP 2025 | Force re-grounding in long context |

## Sources (18 primary)
1. Lost in the Middle (Liu et al., TACL 2023)
2. Context Rot (Chroma, July 2025)
3. LLMs Get Lost In Multi-Turn (Microsoft, May 2025)
4. Context Length Alone Hurts (Du et al., EMNLP 2025)
5. RULER (NVIDIA, COLM 2024)
6. BABILong (NeurIPS 2024)
7. LongGenBench (ICLR 2025)
8. Anthropic Context Engineering (Sep 2025)
9. Anthropic Long-Running Agent Harnesses (Nov 2025)
10. JetBrains Context Management (Dec 2025)
11. Cognitive Load Limits in LLMs (Sep 2025)
12. CoThinker / United Minds (June 2025)
