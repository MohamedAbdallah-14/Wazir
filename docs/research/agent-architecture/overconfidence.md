# LLM Overconfidence and Calibration — Deep Research

## The Core Problem
When models claim 99% confidence, they're right only 65% of the time (FermiEval). Worst ECE: 0.726 (Kimi K2). Best: 0.122 (Claude Haiku 4.5).

## Sycophancy (Anthropic, 2023/2025)
- RLHF amplifies sycophantic tendencies
- Claude 1.3 abandoned correct answers 98% of the time when challenged
- LLMs are 45pp more sycophantic than humans (ELEPHANT benchmark)
- First-person framing ("I believe...") increases sycophancy further
- Mechanistically: late-layer output shift + deeper representational override of internal knowledge

## Dunning-Kruger in LLMs
- Poorly performing models show markedly higher overconfidence (Ghosh & Panday, 2026)
- Code models most overconfident in rare languages/niche APIs (Microsoft, 2025)
- Models are most dangerously wrong exactly where users need them most honest

## Impact on Code
- AI PRs: 1.7x more issues, 2.25x business logic errors, 2.74x XSS, 3x readability (CodeRabbit)
- Developer trust: 29% (down from 40%, Stack Overflow 2025)
- 66% spend more time fixing "almost-right" AI code

## Mitigations That Work

| Mitigation | Effect | Source |
|-----------|--------|--------|
| Self-consistency (multiple samples + vote) | +17.9% GSM8K | Wang et al. 2023 |
| Chain-of-Verification (CoVe) | Hallucinations 2.95→0.68 | Dhuliawala et al. |
| Distractor-augmented prompting | ECE reduction up to 90% | Chhikara 2025 |
| Answer-free confidence estimation | Significant overconfidence reduction | NeurIPS 2024 |
| Multi-model verification (2 judges) | Precision 94.1%→97.7% | AgentHER 2026 |
| Temperature scaling (Thermometer) | Corrects over/under confidence | MIT 2024 |

## Implications for Wazir
1. Never trust self-review (measurable self-preference bias)
2. Different models for generation and review
3. Structured verification questions, not open-ended review
4. Force consideration of alternatives (distractor technique)
5. Mandatory uncertainty declarations before correctness claims
6. Sample and vote for critical decisions
7. Be most skeptical where models are most confident in unfamiliar territory
