# Planning vs Execution Gap in LLMs — Deep Research

## The Core Finding
Planning is where LLMs add the most value per token. Execution is where they lose the most value per step. The gap is structural, not marginal.

## Key Evidence

### Planning Benchmarks
- GPT-4: only 34.6% on Blocksworld (PlanBench, NeurIPS 2023)
- o1: "quantum improvement" but still doesn't saturate PlanBench
- WebArena: top LLMs ~54.8%, drop to 37.8% on WebChoreArena

### Agentless (2024): Planning Beats Agent Loops
- 32% SWE-bench Lite WITHOUT agent loop, at $0.70 cost
- Hierarchical localization + direct repair = competitive results
- "Do we really need complex autonomous agents?"

### Plan-and-Solve Prompting (ACL 2023)
- Zero-shot planning prompt matches 8-shot CoT
- Reduces missing-step errors (the key planning gap)

### Execution Fails Even With Correct Plans
- With **human-authored plans**, executor achieves only **38.5% completion** (Aghzal et al., 2026)
- 79% of multi-agent failures are specification/coordination, not capability (Cemri et al., 2025)
- Self-conditioning: models make more errors when context contains their prior errors

### The Reliability Math
| Per-step | 5 steps | 10 steps | 20 steps | 50 steps |
|----------|---------|----------|----------|----------|
| 95% | 77.4% | 59.9% | 35.8% | 7.7% |
| 97% | 85.9% | 73.7% | 54.4% | 21.8% |
| 99% | 95.1% | 90.4% | 81.8% | 60.5% |

### MAKER: 1M+ Steps with Zero Errors
- Maximal decomposition + multi-agent voting + red-flagging
- **Smaller, non-reasoning models provide best reliability-per-dollar**
- Architecture solves compound reliability, not model improvement

### Architect/Editor Separation (Aider)
- o1-preview + DeepSeek = 85% SOTA
- R1 + Sonnet = 64% at 14x less cost
- "Splitting attention between solving and formatting" is the bottleneck

## The Optimal Architecture
1. Powerful planner (large model, high reasoning) generates structured plans
2. Focused executor (can be smaller/cheaper) implements atomic steps
3. Verifier (can be external/symbolic) validates outputs
4. Replanner handles failures
5. Fresh contexts per step to avoid self-conditioning

## For Wazir
- Invest heavily in planning tokens upfront (highest value per token)
- Decompose execution into smallest possible atomic steps
- Use cheaper models for execution, expensive for planning
- Verify at each step
- Keep execution contexts fresh (phase boundaries = context boundaries)
