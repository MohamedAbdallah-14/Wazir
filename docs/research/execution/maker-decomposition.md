# MAKER: Maximal Decomposition Execution Pattern

## Research Summary

How MAKER achieved 1M+ steps with zero errors. Decomposition-reliability relationship, voting, red-flagging, half-life analysis.

## Key Findings

### MAKER System (Meyerson et al., November 2025)
**Full name**: Maximal Agentic decomposition, first-to-ahead-by-K Error correction, and Red-flagging.

Three components:
1. **MAD (m=1)**: Each microagent gets exactly one subtask, minimal context. Extreme focus allows small, cheap LLMs.
2. **K=3 voting**: Multiple agents attempt same step. Accept first answer with k more votes than any alternative. Error drops from 1% to 0.0001%.
3. **Red-flagging**: Responses >700 tokens had ~10% error vs ~0.1% under 700 (100x worse). Discard long/malformed outputs before voting.

### The Math
- Per-step success p=0.99, k=3: voting error rate 0.0001%
- Required k increases only **logarithmically** with steps
- Expected cost increases **log-linearly** with steps
- m>1 (more than 1 step per agent): **exponential cost increase** -- m=1 provably optimal

### Model Selection
- GPT-4.1-mini: best reliability-per-dollar
- o3-mini: lowest per-step error rate but highest cost
- "State-of-the-art reasoning models are not required"
- Small non-reasoning models suffice for decomposed tasks

### The Compound Probability Problem
| Per-step success | 5 steps | 10 steps | 50 steps | 100 steps |
|-----------------|---------|----------|----------|-----------|
| 99% | 95.1% | 90.4% | 60.5% | 36.6% |
| 95% | 77.4% | 59.9% | 7.7% | 0.6% |
| 85% | 44.4% | 19.7% | 0.003% | ~0% |

### Toby Ord's Half-Life Analysis (May 2025)
Agent success rates follow **constant hazard rate model** (radioactive decay):
- Claude 3.7 Sonnet: 50% success at **59 minutes**, 80% at **15 minutes**
- Rule: doubling task duration **squares** the success probability
- T90 ~ T50/7; T99 ~ T50/70

### METR Data (March 2025)
- Frontier agent 50% time horizon: 2.5-5 hours
- Doubling time: every ~7 months
- Projections: 8-hour tasks by late 2026

### Agent Economics (Stakenborg, Feb 2026)
- 2-week task with 5-hour half-life: **65,536 attempts** in expectation
- Each attempt: ~$1,900 = **$124 million per success**
- "Cost reductions cannot beat the exponential -- the half-life is the whole game"

### Related Systems
**Six Sigma Agent** (Patel, Jan 2026): 5 agents reduces 5% error to 0.11%; 13 agents achieves 3.4 DPMO. **14,700x reliability improvement**, 80% cost reduction.

**Agentless** (UIUC): 32% SWE-bench Lite at $0.70 without agent loop. Three-phase linear pipeline.

**ACONIC**: Models tasks as constraint satisfaction, 10-40pp improvement on SATBench.

### Beyond Exponential Decay (May 2025)
- LLM errors are NOT uniformly distributed but concentrated at sparse "key tokens" (5-10%)
- Reliability depends on navigating limited decision points, not uniform decay
- Targeted strategies (self-consistency at decision points) can outperform brute-force

## Sources
- MAKER paper: https://arxiv.org/abs/2511.09030
- Cognizant blog: https://www.cognizant.com/us/en/ai-lab/blog/maker
- Toby Ord Half-Life: https://www.tobyord.com/writing/half-life
- METR: https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/
- Agent Economics: https://forum.effectivealtruism.org/posts/2Zn23gCZrgzSLuDCn/agent-economics-a-botec-on-feasibility
- Six Sigma Agent: https://arxiv.org/abs/2601.22290
- Beyond Exponential Decay: https://arxiv.org/abs/2505.24187
