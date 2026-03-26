# Microsoft AutoGen — Deep Research

56.2K stars. Multi-agent conversation framework. Forked as AG2. Being absorbed into Microsoft Agent Framework (GA Q1 2026).

## Architecture (v0.4)
- Core: event-driven actor framework (pub-sub topics)
- AgentChat: high-level teams (RoundRobin, Selector, Swarm, MagenticOne)
- Extensions: model clients, code executors, tools

## Key Patterns
- Two-agent chat, GroupChat (with FSM speaker transitions), Nested chat
- Reflection (coder-reviewer loop), Swarm (handoff-based), Debate (sparse topology)
- MagenticOne: Orchestrator + WebSurfer + FileSurfer + Coder + Terminal

## Human-in-the-Loop
- v0.2: NEVER/TERMINATE/ALWAYS modes on any agent
- v0.4: UserProxyAgent as team participant

## Failure Modes
- **Infinite loops** (#1 issue): missing max_turns, unreachable termination, no "done" signal
- Context overflow: 96% of tokens on re-reading failed attempts
- Cost explosion: multi-agent multiplies LLM calls
- Fork fragmentation: AG2 vs Microsoft vs Agent Framework

## What's Useful for Wazir
- FSM-based speaker transitions for deterministic flow control
- Nested chat for workflow encapsulation
- Reflection pattern for review loops
- The warning: being deprecated → Microsoft Agent Framework
- Debate pattern requires heterogeneous models to work
