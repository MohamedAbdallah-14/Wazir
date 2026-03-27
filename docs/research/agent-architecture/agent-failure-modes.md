# Why AI Agents Fail at Complex Software Tasks — Deep Research

## 1. SWE-bench: What Predicts Failure

- Strongest predictor: **lines changed** (11x increase Easy→Hard), not file count (2x)
- Multi-file issues: 3.09% of Easy, 55.56% of Hard
- SWE-Bench Pro (1,865 problems): GPT-5 resolves only 21% of SWE-EVO tasks vs 65% on Verified
- ~41% of Lite entries mis-scored due to inadequate test suites
- Contamination: 8-10%, models 3-6x more accurate on contaminated locations

## 2. Context Degradation

- U-shaped curve: 15-20pp accuracy drop when info is in middle of context
- Context pollution compounds over agent turns
- Compaction alone insufficient — agents one-shot too much or break previous features
- Multi-turn: **39% average performance drop** (all top LLMs)

## 3. Agent Overconfidence

- LLMs "quite poor" at predicting own success on coding tasks
- **64.5% blind spot rate**: can identify errors in user input, fail on own output
- Self-correction without external feedback **degrades** performance
- Developers approve code they don't understand because "tests pass"
- METR: developers estimated 20% speedup, actual result **19% slower**

## 4. Planning vs Execution Gap

- Plan-and-Act: 57.58% success with separate Planner/Executor vs monolithic
- Agents try to one-shot complex tasks → context exhaustion
- Task completion doubling every 7 months, but even recent models: 38% average success
- 0% of agent PRs mergeable as-is (METR manual review)

## 5. Review Effectiveness

- Single-model review: **42-48% accuracy** catching runtime bugs
- Multi-model ensemble (ICE): **7-15pp improvement** over best single model
- Self-review has fundamental blind spot (64.5% miss rate on own errors)
- Cross-model review catches what self-review misses

## 6. Specification Quality Impact

- Context files reduce agent errors by **40%**, 55% faster completion (Anthropic 2026)
- ThoughtWorks: chain-of-thought specs produce significantly higher quality
- Removing specifications from SWE-bench leads to "significantly degraded results"

## 7. Multi-Agent Coordination

- Independent multi-agent: **17.2x error amplification** (DeepMind)
- Centralized orchestrator: 4.4x amplification (still significant)
- Performance saturates beyond 4 agents without structured topology
- Sequential reasoning: multi-agent **39-70% worse** than single-agent
- Centralized coordination: 80.8% improvement on parallelizable tasks
- Optimal strategy predictable for 87% of configurations with early probes

## 8. Common Failure Patterns (Measured)

| Pattern | Evidence |
|---------|----------|
| Task drift | 20-30% of cases (Cloud Security Alliance) |
| Copy-paste over refactor | Refactored code: 24.1% → 9.5% (GitClear, 211M lines) |
| Logic/correctness errors | 75% more in AI PRs (CodeRabbit, 470 repos) |
| Security vulnerabilities | 2.74x more in AI PRs |
| Error handling gaps | 2x more in AI PRs |
| Marking complete without testing | Top reliability issue (Anthropic) |
| DORA macro signal | 90% AI adoption → 9% bug rate increase, 91% more review time |

## 9. Mitigations That Work

### Tier 1: Strong Evidence (Measured/Peer-Reviewed)

| Strategy | Effect | Source |
|----------|--------|--------|
| External verification loops | "Single highest-leverage thing" | Anthropic |
| TDD | Regression: 6.08% → 1.82% | arxiv 2603.17973 |
| Separate planning from execution | 57.58% success vs monolithic | ICML 2025 |
| Structured specifications | 40% fewer errors | Anthropic 2026 |
| Multi-model review | 7-15pp accuracy gain | Zylos Research |
| Bounded, verifiable tasks | Agents excel at clear criteria | Anthropic, METR |
| Centralized orchestration | 80.8% improvement | DeepMind 2025 |

### Tier 2: Moderate Evidence

| Strategy | Source |
|----------|--------|
| Git-based memory (Beads) | Yegge/Gas Town |
| Context compaction + notes | Anthropic |
| Small batches | DORA 2025 |
| Incremental progress per session | Anthropic harness |
| Human as orchestrator | Mason 2026 |

## Sources (18 distinct, 7 peer-reviewed, 5 measured industry, 6 practitioner)
