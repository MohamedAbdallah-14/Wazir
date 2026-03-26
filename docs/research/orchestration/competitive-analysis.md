# Competitive Analysis: AI Coding Tool Orchestration

**Date:** 2026-03-24

## Summary

No competitor has enforced N-phase pipelines with compliance scoring. Wazir is unique.

## Tool-by-Tool Analysis

### Devin (Cognition AI)
- Compound AI: Planner + Coder + Critic models
- Each instance runs in isolated VM
- Managed Devin: parent spawns child Devins
- No formal phase system, no tool restrictions per phase
- No compliance scoring

### Cursor
- Agent-first IDE with subagents in isolated contexts
- Background Agents in cloud Ubuntu VMs
- Custom subagents in `.cursor/agents/`
- No enforcement — tool access is advisory
- `/summarize` for context compaction

### Google Jules
- Perceive-Plan-Execute-Evaluate loop (Gemini 2.5 Pro)
- Each task in its own cloud VM
- Planning Critic: 9.5% reduction in task failure rates
- Phases hardcoded, not configurable

### OpenAI Codex
- Two-phase: Setup (with internet) → Agent (offline)
- OS-level sandboxing (bubblewrap/Seatbelt)
- Exactly 2 hardcoded phases, not configurable
- Subagent spawning with depth limits

### Aider
- Architect + Editor dual-model pattern
- Tree-sitter PageRank repo map for context management
- Fixed two-phase, not configurable pipeline
- No enforcement, no compliance verification

### Kilo Code (closest competitor)
- **Orchestrator Mode**: each subtask in its own context
- **Custom modes with tool restrictions**: can restrict file types per mode
- File type restrictions enforced via `fileRegex` → `FileRestrictionError`
- Missing: compliance scoring, phase reports, structured state contracts

### Windsurf (Cascade)
- 5-source context pipeline (Rules, Memories, Open files, RAG, Recent actions)
- No phases, no tool restrictions, no enforcement

## Industry Patterns

| Pattern | Used By | Wazir Equivalent |
|---------|---------|------------------|
| Fresh context per subagent | Cursor, Kilo, Codex, Claude | Phase isolation |
| Tool restrictions per mode | Kilo, Roo Code | Phase-level tool gating |
| Planning review step | Jules (Planning Critic) | Two-tier review |
| Fixed pipeline | Agentless (SWE-bench) | Phase enforcement |
| Dual verifiers | AI21 Maestro | Two-tier review (Claude + Codex) |

## Key Validation

- Fixed pipelines match or beat autonomous agents (Agentless SWE-bench: 60.4%)
- "All systems exceeding 70% on SWE-bench Verified relied on Claude 4 models"
- Every agent experiences failure rate increase after 35 minutes; doubling duration quadruples failure rate

## Sources

- Devin 2.0 Technical Design, Cognition AI Blog
- Cursor 2.0 docs, subagents, summarization
- Jules changelog, API docs
- OpenAI Codex agent loop, sandboxing docs
- Aider repo map, chat modes
- Kilo Code Orchestrator Mode, custom modes
- Windsurf context awareness docs
- Chroma Context Rot research
- SWE-bench leaderboards
