# Multi-Agent Architectures for Software Engineering — Deep Research

## The Definitive Finding (Google DeepMind, Dec 2025)
180 configurations, 5 architectures, 3 LLM families, 4 benchmarks:

1. **Independent agents**: 17.2x error amplification (worst)
2. **Centralized orchestrator**: 4.4x error amplification (best cost/benefit)
3. **Hybrid dense**: 515% coordination overhead for ~2% marginal gain over centralized
4. **Performance saturates at ~4 agents**
5. **45% Saturation Rule**: Multi-agent yields negative returns when single-agent baseline >45%
6. **Message density saturates logarithmically** at ~0.39 messages/reasoning-turn

## Review Effectiveness
- **Agyn** (SWE-bench): 72.2% with Manager+Researcher+Engineer+Reviewer = +7.4% over single-agent
- Same-model review has blind spots (64.5% miss rate on own errors)
- **Heterogeneous models** are "universal antidote" — GSM8K: +9pp from model diversity
- **Homogeneous debate fails to beat single-agent CoT** (Zhang et al., 2025)

## What Works
1. Structured artifacts > free-form chat (MetaGPT's core insight)
2. Centralized orchestration > independent or peer-to-peer
3. Cross-model review > same-model review
4. Role specialization works when tasks genuinely benefit from decomposition
5. Small teams (~4 agents max)
6. Heterogeneous models for debate/review

## What Fails
1. More agents ≠ better (saturation + coordination overhead)
2. Homogeneous debate wastes compute
3. Delegation ping-pong in hierarchical systems (CrewAI's #1 failure)
4. Sequential reasoning degrades 39-70% with multi-agent vs single-agent
5. Multi-agent on simple tasks (>45% single-agent accuracy) = net negative

## Implications for Wazir
- Phase pipeline (centralized orchestration) is correct architecture
- Cross-model review (Codex reviewing Claude) is validated
- Keep teams small, don't add agents for tasks base model handles well
- Structured phase files prevent "telephone game" information loss
