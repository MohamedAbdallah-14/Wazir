# SWE-bench Deep Dive — Empirical AI Agent Performance

## The Benchmark
2,294 real GitHub issues across 12 Python repos. Average: 1.7 files, 3.0 functions, 32.8 lines changed.

## Versions
- **Full** (2,294): Original, noisy
- **Lite** (300): Simpler subset for rapid iteration
- **Verified** (500): Human-reviewed, quality-filtered. 90%+ solvable in <1hr.
- **Pro** (1,865): 41 repos, min 10 lines, avg 107.4 lines across 4.1 files. Top models: ~23%.

## Current Scores (March 2026)
- Verified: Claude Opus 4.5 80.9%, Gemini 3.1 Pro 80.6%, GPT-5.2 80.0%
- Pro: GPT-5.3-Codex 56.8%, Claude Opus 4.5 45.9%
- **Private Pro subset: Opus 4.1 drops from 80%+ to 17.8%**

## What Predicts Failure
- Lines changed: 11x increase Easy→Hard (strongest predictor)
- Multi-file: 3.09% of Easy, 55.56% of Hard
- Single-file <5 lines: ~48% solve rate. Degrades rapidly beyond.

## Key Tools and Their Approaches

### SWE-agent (Princeton)
- Agent-Computer Interface (ACI): custom tools, windowed file viewer, integrated linting
- Linting rejection: 3.0% absolute improvement. Non-negotiable.
- 3.3x improvement from interface design alone (not model improvement)

### Agentless (UIUC)
- No agent loop. Hierarchical localization → repair → patch validation
- 32% on Lite at $0.70. Later 48% with Qwen3-32B.
- "Do we really need complex autonomous agents?"

### OpenHands
- Event-sourced architecture, CodeAct paradigm
- 72% on Verified with inference-time scaling + critic model

### AutoCodeRover
- AST-based (not raw files). Spectrum-based fault localization.
- 46.2% Verified, <$0.70/instance.

### Moatless / SWE-Search
- FSM architecture + Monte Carlo Tree Search
- 70.8% with Claude 4 Sonnet at $0.63/instance

## Failure Taxonomy
- Incorrect implementation: 52.0%
- Cascading failed edits: 23.4%
- Localization failures: principal mode across all approaches
- Context overflow: #1 for Sonnet 4 (35.6%)

## Benchmark Validity Concerns
- 11.7-31.6% verbatim match with training data
- Models identify correct file paths at 76% without context (memorization)
- 7.8% of "correct" patches fail developer test suites
- Resolution rates inflated ~6.2pp

## 10 Principles for Pipeline Design
1. Localization is the bottleneck, not generation
2. Linting and guardrails are non-negotiable
3. Sample-and-select beats single-shot
4. Agent loops have a cost (overhead sometimes exceeds benefit)
5. Interface design matters as much as model capability
6. Context management is a primary failure mode
7. Test execution is the strongest validation signal
8. Specialization helps (different sub-agents for different concerns)
9. Beware benchmark overfitting (real-world drops dramatically)
10. Hybrid (structured planning + agentic flexibility) is likely optimal
