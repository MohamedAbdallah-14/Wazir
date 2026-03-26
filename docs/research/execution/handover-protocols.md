# Agent Handover Protocols

## Research Summary

How one agent's output becomes the next agent's input. Artifact-based, message-based, Chain of Agents, the telephone game problem.

## Key Findings

### Chain of Agents: 1-4% Information Loss (Best Measured)
- Google Research, NeurIPS 2024
- Text split into ~8K chunks, worker agents process sequentially
- Communication units vary by task type (evidence, summary, code summary)
- +10% over baselines, +22% on QuALITY, 57% faster runtime
- Complexity: O(nk) vs O(n^2) for full-context

### Amp (Sourcegraph) Retired Compaction Entirely
- "Compaction encourages long, meandering threads... stacking summary on top of summary"
- Replaced with structured Handoff: specify goal, Amp generates prompt + file list
- Reframes context exhaustion from compression problem to coordination problem

### 65% of Enterprise AI Failures from Context Drift
- Not raw context exhaustion -- signal-to-noise ratio degradation
- JetBrains: summarization causes 13-15% longer agent trajectories due to info loss

### Handover Patterns

**Artifact-Based** (Dominant for coding agents):
- Anthropic Two-Agent Harness: `claude-progress.txt` + git state
- BSWEN HANDOFF.md: ~500 tokens max. "If your handoff exceeds 500 tokens, you're including details the next agent can discover by reading the code"
- MetaGPT: typed documents per SOP (PRD, File Lists, Interface Definitions)
- Codex PLANS.md: "Treat the reader as having only the working tree and the plan file"

**Message-Based**:
- AutoGen: event-driven pub-sub, handoffs transfer conversations
- OpenAI Agents SDK: "every handoff must include all context -- no hidden variables"
- CrewAI: explicit `context` dependencies, output_pydantic for type-safe outputs

**Git-Based**:
- AgentGit (AAAI 2026): State Commit, State Revert, Branching for agent state
- Devin: PRs are the handoff artifact
- "Git commits capture what changed, not why or what not to do" -- supplementary files needed

### Structured > Prose > Free-form Chat
- JSON schema + validation: 30-60% higher accuracy
- "Once one agent returns malformed structure, the rest becomes a hallucination relay"
- Free-text handoffs: "main source of context loss"

### Context Compression for Handover
| Approach | Compression | Accuracy |
|----------|------------|----------|
| Factory Anchored Iterative | -- | 4.04/5 |
| Anthropic Full Reconstruction | -- | 3.74/5 |
| OpenAI Full Reconstruction | -- | 3.43/5 |
| ACON (Kang et al.) | 26-54% reduction | 95%+ preserved |
| Morph Verbatim | 50-70% | 98% |

### Anti-Patterns
- Free-text handoffs: main source of context loss
- Context explosion: passing full history to sub-agents
- Recursive summarization: progressive distortion
- Implicit state transfer: trusting agents to reconstruct from git

### MAST Failure Taxonomy (NeurIPS 2025)
14 failure modes across 1600+ traces, 7 frameworks:
- Specification failures: 41.77%
- Coordination failures: 36.94%
- Verification gaps: 21.30%

## Sources
- Chain of Agents: https://arxiv.org/abs/2406.02818
- Amp handoff: https://ampcode.com/news/handoff
- BSWEN: https://docs.bswen.com/blog/2026-03-21-agent-task-handoff-coordination/
- Factory compression: https://factory.ai/news/evaluating-compression
- MAST: https://arxiv.org/abs/2503.13657
- AgentGit: https://arxiv.org/abs/2511.00628
