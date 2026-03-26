# CrewAI — Deep Research

47.2K stars. Role-based multi-agent orchestration. Created by Joao Moura. 2B+ agentic executions.

## Architecture
- Agents (role, goal, backstory, tools) + Tasks (description, expected_output, context dependencies) + Crews
- Sequential or Hierarchical process
- Flows layer: deterministic pipeline wrapping autonomous Crews
- Unified Memory (LanceDB): LLM-analyzed save, composite scoring recall

## Key Design: Dual-Layer (Flows + Crews)
- **Flows** = deterministic structure (fetch, validate, route, error handle)
- **Crews** = autonomous judgment (analyze, write, decide)
- This is the production architecture — choose where autonomy applies

## Failure Modes (Critical)
- **Delegation Ping-Pong**: Hierarchical manager enters infinite loop (documented #1 failure)
- Hierarchical process broken in practice — manager can't selectively delegate
- Performance saturates beyond ~4 agents
- Debugging often exceeds build time
- 3-6 month builds → 50-80% rewrite to migrate to LangGraph

## What's Useful for Wazir
- Flows concept: deterministic pipeline + autonomous agents per phase
- Task guardrails (function/LLM-based validation on output)
- Planning mode (one-shot plan injected into task descriptions)
- The warning: hierarchical/delegation is fragile, sequential is reliable
- Teams report CrewAI reduces dev time 30-40% for workflow apps
