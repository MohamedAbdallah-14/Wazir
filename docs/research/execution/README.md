# Execution Pipeline Research Corpus

> 20 parallel research agents, 2026-03-25. Grounding evidence for all execution pipeline design decisions.

## Research Methodology

20 agents searched in parallel across: GitHub repos, blog posts (Medium, Dev.to), research papers (arXiv, ACM, IEEE, NeurIPS, ICLR, EMNLP), white papers, academic books, Reddit, Hacker News, official documentation, and product blogs. Each agent focused on a specific execution topic, producing exhaustive findings with specific numbers and citations.

## Directory Structure

```
2026-03-25-execution-research/
├── README.md                          (this file)
├── patches/
│   ├── patch-diff-strategies.md       (how AI tools apply changes)
│   ├── patch-application.md           (diff algorithms, apply model, accuracy rates)
│   └── merge-conflicts.md             (conflict frequency, prevention, resolution)
├── parallel/
│   ├── dag-execution-engines.md       (Airflow, Temporal, Argo, etc.)
│   ├── worktree-patterns.md           (git worktree for agent isolation)
│   ├── rollback-recovery.md           (saga pattern, checkpoints, blast radius)
│   └── integration-testing.md         (batch sizes, merge queues, contract testing)
├── verification/
│   ├── proof-of-implementation.md     (mutation testing, PBT, formal verification)
│   ├── code-review-effectiveness.md   (two-stage review, cross-model, catch rates)
│   └── tdd-for-ai-agents.md           (test-first, oracle problem, mutation gates)
├── composition/
│   ├── composition-engines.md         (CrewAI, AutoGen, LangGraph, DSPy, etc.)
│   ├── executor-prompts.md            (instruction budget, XML tags, personas)
│   ├── model-routing.md               (cascade, RouteLLM, tier benchmarks)
│   └── maker-decomposition.md         (MAKER, half-life, compound probability)
├── state/
│   ├── state-management.md            (SQLite vs Redis vs files, event sourcing)
│   ├── structured-output.md           (constrained decoding, Pydantic, A2A protocol)
│   └── handover-protocols.md          (Chain of Agents, artifact passing, telephone game)
├── anti-patterns/
│   ├── execution-anti-patterns.md     (15 failure modes, 3 meta-patterns)
│   └── context-rot-mitigation.md      (Lost in the Middle proof, 4K cliff, mitigations)
└── production/
    └── production-systems.md          (20 systems: Devin, Cursor, Codex, Claude Code, etc.)
```

## Hard Design Constraints (From Research)

These numbers constrain every execution pipeline decision:

### Context and Time
| Constraint | Value | Source |
|-----------|-------|--------|
| Task duration degradation cliff | 35 minutes | Zylos 2026 |
| Output instruction adherence cliff | 4,000 tokens | LongGenBench, ICLR 2025 |
| Multi-turn degradation | 39% average drop | Laban et al. Microsoft 2025 |
| Context alone hurts (perfect retrieval) | 13.9-85% | Du et al. EMNLP 2025 |
| Lost in the Middle | Architectural, proven at initialization | Chowdhury 2026 |
| Effective context for reasoning | 10-20% of nominal | BABILong |
| Instruction budget per prompt | ~150-200 items | arXiv 2507.11538 |

### Reliability Math
| Constraint | Value | Source |
|-----------|-------|--------|
| 85% per step, 10 steps | 20% total success | Compound probability |
| 95% per step, 20 steps | 36% total success | Compound probability |
| Claude Sonnet half-life | 59 min (50%), 15 min (80%) | Toby Ord May 2025 |
| Agent failure rate double at 2x duration | Confirmed | Zylos 2026 |
| Enterprise AI failures from context drift | 65% | Zylos 2026 |

### Patching and Merging
| Constraint | Value | Source |
|-----------|-------|--------|
| Diff accuracy on large files (300+) | ~60% | Morph benchmarks |
| Diff accuracy on recently modified code | ~45% | Morph benchmarks |
| Merge attempts resulting in conflicts | 10-20% | Ghiotto et al. |
| Manual conflict resolution bug likelihood | 26x higher | Empirical |
| Practical parallel agent ceiling | 3-5 agents | Multiple sources |
| Optimal CI batch size | 4 changes | Concordia/IEEE TSE |

### Review and Verification
| Constraint | Value | Source |
|-----------|-------|--------|
| Self-correction blind spot rate | 64.5% | Tsui 2025 |
| AI PRs vs human PRs issue ratio | 1.68x more | CodeRabbit 470 PRs |
| AI PRs rejection rate | 67.3% vs 15.6% manual | LinearB |
| Coverage vs mutation score gap | 93% coverage, 58% mutation | FinTech case study |
| Test agent accuracy (separate vs combined) | 91.5% vs 61% | AgentCoder |
| Oracle accuracy (expected vs actual) | 54.56% | arXiv 2410.21136 |

### Cost and Routing
| Constraint | Value | Source |
|-----------|-------|--------|
| Cascade routing savings | 30-70% | Multiple sources |
| MAKER: small model + voting | Best reliability-per-dollar | Cognizant 2025 |
| Haiku 4.5 SWE-bench | 73.3% (matches prev-gen Sonnet) | Leaderboard |
| Constrained decoding compliance | 100% structural | OpenAI, Anthropic |
| Without constrained decoding | 40-74.5% | Multiple |

## Key Research-Grounded Design Decisions

1. **Fresh context per subtask** -- context poisoning has no fix except session death
2. **Test agent separate from code agent** -- 91.5% vs 61% accuracy
3. **Two-stage review** (generate + judge) -- HubSpot's #1 factor
4. **Cross-model review** -- eliminates 64.5% self-correction blind spot
5. **Subtasks cap file size** -- 60% accuracy on 300+ line files
6. **SQLite state, not YAML** -- file-based has proven race conditions
7. **Constrained decoding for status** -- 100% vs 40-74.5% compliance
8. **Sequential merge, not simultaneous** -- 26x bug rate on manual conflict resolution
9. **Auto-discovery for convergence-point files** -- prevents the primary conflict source
10. **Layered fallback matching** for patches -- no single strategy sufficient
11. **Micro-commit checkpointing** -- near-zero cost, granular rollback
12. **Positive instructions over negative** -- "always do X" beats "don't do Y"
13. **Content-based anchoring** -- LLMs can't count line numbers
14. **Prompt repetition at boundaries** -- 47/70 wins, 0 losses
15. **max_steps + cost budgets** -- prevents 150x cost explosion from infinite loops

## Comparison with Pre-Execution Research

The pre-execution research (27 files in `2026-03-25-vision-research/`) focused on:
- AI failure modes and context degradation
- Requirements engineering and specification science
- Task decomposition theory
- Multi-agent architecture patterns
- Tool landscape analysis

This execution research (20 files) focuses on:
- How to actually apply code changes reliably
- Parallel execution and merge conflict prevention
- Verification beyond "tests pass" (mutation, PBT, contracts)
- Agent composition and prompt engineering
- State management for concurrent agents
- Documented failure modes and prevention
- Production system architectures (20 systems analyzed)

Together, the 47 research files across both corpora ground every pipeline design decision in evidence.
