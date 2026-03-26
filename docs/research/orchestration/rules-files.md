# .claude/rules/ Effectiveness Research

**Date:** 2026-03-24

## How Rules Are Loaded

- Injected as `<system-reminder>` in messages array, NOT system prompt
- System prompt stays frozen for cache sharing (90% discount)
- Claude Code adds: "this context may or may not be relevant... should not respond unless highly relevant"
- **The platform tells Claude it CAN IGNORE rules it deems irrelevant**

## Feature Details

- Introduced: v2.0.64
- Recursive `.md` discovery in subdirectories
- Symlinks supported
- Global equivalent: `~/.claude/rules/`
- Path-scoped rules via `paths:` frontmatter (re-injected per matching tool call)
- `alwaysApply: false` required for path scoping to work

## Critical Limitations

| Issue | Impact |
|---|---|
| Not loaded in subagents (path-scoped) | Subagents ignore project rules |
| Not copied to worktrees (#28041) | Worktree sessions have no rules |
| After compaction, rules overridden by summary (#27993) | Long sessions lose rules |
| 45 rule files = 93K tokens (46% context) (#32057) | Rule bloat kills context budget |
| YAML array format for paths broken (#26868) | Use CSV format workaround |

## Quantitative Evidence

### ETH Zurich Study (arXiv:2602.11988, ICML 2026) — ONLY rigorous benchmark
- Human-written context files: **+4% task success, +19% cost increase**
- LLM-generated context files: **-3% task success** (net negative)
- "Agents respect instructions but unnecessary requirements make tasks harder"

### Instruction Following Rates
| Benchmark | Best Model | Compliance |
|---|---|---|
| IFEval (simple, single-turn) | GPT-4.1 | 87.4% |
| MultiChallenge (multi-turn) | Claude 3.5 Sonnet | 41.4% |
| AgentIF (agentic, complex) | o1-mini | 27% ISR |
| tau-bench pass^8 | GPT-4o | <25% |

### Rule Count vs Compliance (Chen et al.)
- 5 rules: ~92% per-rule compliance
- 20 rules: ~71% per-rule compliance
- 50 rules: ~56% per-rule compliance
- Relationship is multiplicative, not additive

### Instruction Budget
- Claude Code system prompt: ~50 instructions
- Frontier LLM capacity: ~150-200 total
- **Your budget: ~100-150 rules max**
- Beyond ~1500 tokens of rules, per-rule compliance drops measurably

## Prompt-Only Enforcement Ceiling

Research consistently shows ceiling of ~80-85% for prompt-only:
- PCAS: prompt-embedded policies = 48% compliance
- PCAS: reference monitor (hooks) = 93% compliance
- Combined soft + hard = 95-99%

## What Rules Are Effective For

- Coding style, language preferences, format ("use pnpm not npm")
- Project-specific conventions model can't infer from code
- Specific, verifiable patterns with code examples

## What Rules Are NOT Effective For

- Process constraints ("always write tests first") — frequently ignored
- Behavioral constraints ("never modify file X") — degrades over conversation
- Vague guidance ("write clean code") — "zero measurable difference"
- Anything that conflicts with task completion (goal-constraint tension)

## Optimal Rules Architecture

| Factor | Recommendation |
|---|---|
| Rule count | 5-10 high-priority rules |
| Total token budget | Under 1500 tokens |
| Format | Markdown headers + bullets |
| Placement | Beginning of context (primacy advantage) |
| Reinforcement | 2-3 injection points: rules + system-reminder |
| Content | Only non-inferable, specific, verifiable |

## Instruction Placement Science

- Beginning of context: +15-25% vs middle (primacy effect)
- End of context: +10-20% vs middle (recency effect)
- 2-point reinforcement (begin + end): +15-30% vs single point
- 3-point reinforcement: +20-30%, diminishing returns beyond 3
- Paraphrased repetition: +5-8% over verbatim

## Cursor Community Quotes

> "I can confirm, it doesn't use 90+% of them on a consistent basis." — RoadkillRon
> "I saw the requirement and intentionally ignored it." — A_K2
> "What is the point of rules if they are ignored?" — AndyRoid

## Sources

- ETH Zurich arXiv:2602.11988
- PCAS arXiv:2602.16708
- AgentIF arXiv:2505.16944
- DeCRIM arXiv:2410.06458
- Lost in the Middle arXiv:2307.03172
- Anthropic alignment faking arXiv:2412.14093
- Knostic security analysis
- Claude Code issues #28041, #27993, #32057, #26868
- HumanLayer "Writing a good CLAUDE.md" (748 points HN)
- Cursor forums, awesome-cursorrules
