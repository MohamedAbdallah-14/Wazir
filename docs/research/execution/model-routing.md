# Model Routing and Selection Strategies

## Research Summary

How to pick the right LLM for a specific task. Cascade pattern, RouteLLM, cost-quality benchmarks, MAKER routing.

## Key Findings

### The Cascade Pattern Wins for Known Task Types
- Try cheap model first, measure confidence, escalate on low confidence
- 30-70% cost reduction depending on workload
- Amazon Bedrock: **63.6% cost savings** routing 87% to Haiku
- If 70% handled confidently by cheap model, expensive model usage drops 70%

### RouteLLM (LMSYS/UC Berkeley)
- Binary routing: strong vs weak model per query
- Trained on Chatbot Arena preference data (~80K battles)
- **MT-Bench: >85% cost reduction** maintaining 95% of GPT-4 performance
- **MMLU: >45% cost reduction**
- Generalizes to unseen model pairs without retraining

### SWE-bench Verified Cost-Performance

| Model | Score | Output Cost/1M |
|-------|-------|----------------|
| Claude Opus 4.5 | 80.9% | $25.00 |
| Claude Opus 4.6 | 80.8% | $25.00 |
| MiniMax M2.5 | 80.2% | $1.20 |
| Claude Sonnet 4.6 | 79.6% | $15.00 |
| Gemini 3 Flash | 78.0% | $3.00 |
| Claude Haiku 4.5 | 73.3% | $5.00 |

**MiniMax M2.5**: Opus-level accuracy at 1/20th the output cost.

### MAKER's Model Routing
- GPT-4.1-mini: best reliability-per-dollar (not lowest error, not cheapest)
- "State-of-the-art reasoning models are not required; relatively small non-reasoning models suffice"
- Different models have different error rates but small models are comparable to advanced reasoning models on decomposed tasks

### When Cheaper Models Are BETTER
1. MAKER: small models + voting outperform large models solo
2. Gemini 3 Flash outperformed Pro on some coding benchmarks (78% vs 76.2%)
3. Calibration advantage: smaller models better know when they don't know
4. Microsoft Hybrid LLM (ICLR 2024): 40% fewer calls to large model, no quality drop
5. Microsoft BEST-Route: up to 60% cost reduction with <1% performance drop

### Routing Approaches (Ranked by Practicality)
1. **Config-driven** (task type -> model tier): deterministic, auditable, no drift
2. **Cascade** (cheap first, escalate): 30-70% savings, production-proven
3. **Learned classifier** (RouteLLM): 45-85% savings, needs training data
4. **MAKER decomposition**: inverts the problem -- decompose hard tasks, use cheap models with voting

### Confidence-Based Routing
- Self-REF (arXiv 2410.13284): `<CN>` (confident) / `<UN>` (unconfident) tokens
- "Significant improvements" over verbalized confidence and raw logit inspection
- Calibration is the challenge: threshold too high = over-routing to expensive model

### Tier Mapping for Wazir
| Tier | Use Case | Claude | Cost |
|------|----------|--------|------|
| Cheapest | Boilerplate, simple transforms | Haiku 4.5 | $1/$5 |
| Standard | Typical coding with edge cases | Sonnet 4.6 | $3/$15 |
| Advanced | Complex reasoning, architecture | Opus 4.6 | $5/$25 |

## Sources
- RouteLLM: https://lmsys.org/blog/2024-07-01-routellm/
- Anthropic model selection: https://claude.com/resources/tutorials/choosing-the-right-claude-model
- SWE-bench: https://llm-stats.com/benchmarks/swe-bench-verified
- MAKER: https://arxiv.org/html/2511.09030v1
- Hybrid LLM (ICLR 2024): https://openreview.net/forum?id=02f3mUtqnM
- BEST-Route: https://github.com/microsoft/best-route-llm
