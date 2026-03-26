# AI Agent Orchestration & Spec-to-Code Pipeline Tools — Landscape Overview

## Executive Summary

The landscape splits into four categories: (1) multi-agent SWE simulators, (2) spec-driven development toolkits, (3) autonomous coding agents, (4) generic agent orchestration frameworks. 20+ projects analyzed.

## CRITICAL FINDING: Nobody Does the Full Pipeline

No single tool covers research → clarify → specify → design → plan → implement → review → enforce. This is Wazir's unique position.

| Phase | MetaGPT | Spec Kit | OpenSpec | Kiro | Open SWE | Task Master | Devika | Wazir |
|-------|---------|----------|---------|------|----------|-------------|--------|-------|
| Research | - | - | - | - | - | - | Web search | Yes |
| Clarification | - | - | - | - | - | - | - | Yes |
| Specification | PRD | Specify | Specs (EARS) | EARS | - | PRD (user) | - | Yes |
| Design | Architecture | Plan | Design.md | Architecture | - | - | - | Yes |
| Planning | Task distrib. | Tasks | Tasks.md | Task seq. | Plan | Task break. | Step plan | Yes |
| Implementation | Engineer | Implement | Implement | Agent | Programmer | One-by-one | Coder | Yes |
| Review/QA | QA Engineer | - | Validation | Hooks | Reviewer | TDD autopilot | - | Yes |
| Enforcement | - | Gated phases | - | Agent hooks | - | - | - | Yes |

## Key Findings

1. **Spec-driven development is the biggest trend of 2025-2026.** GitHub Spec Kit (82K stars), OpenSpec (34K), Kiro, Tessl all emerged in 2025.

2. **The clarification/research gap is universal.** Almost no tool asks clarifying questions or does research before specification.

3. **Review enforcement is weak everywhere.** Most tools generate code and stop.

4. **Phase gating is rare.** Only Spec Kit has explicit gated checkpoints.

5. **TDD is emerging but not standard.** Task Master's autopilot (Oct 2025) is the most notable.

6. **"Spec as source of truth" is nascent.** Tessl explores this most aggressively.

## Category 1: Multi-Agent SWE Simulators

### MetaGPT (66K stars)
- Simulates software company: Product Manager → Architect → Project Manager → Engineer → QA
- SOP enforcement: every role produces structured document constraining downstream roles
- ICLR 2024 oral. Strong on spec/design, missing research/clarification/review loops.

### Devika (19.5K stars)
- Open-source Devin alternative with research-before-code pattern
- 9 specialized sub-agents. Web research before coding (unusual and valuable).
- Missing: spec document, design phase, review/QA, test generation.

### ChatDev / MetaGPT comparison covered in separate report.

## Category 2: Spec-Driven Development Tools

### GitHub Spec Kit (82K stars)
- 4 gated phases: Specify → Plan → Tasks → Implement
- Constitution concept (immutable project principles)
- 24+ AI agents supported. Missing: research, clarification, review enforcement.

### OpenSpec (34K stars)
- Delta-based spec evolution, artifact dependency graph
- Fluid not rigid, brownfield-first. 25+ tools.
- Missing: research, clarification, automated review.

### Kiro (Amazon, 3.3K stars)
- EARS notation requirements, architecture analysis, implementation planning
- Agent Hooks for event-driven automation. Free during preview.
- Missing: research, clarification, review.

### Tessl (private beta)
- Most ambitious: "spec as source" where code is generated from specs
- Spec Registry with 10,000+ specs. Code marked "GENERATED FROM SPEC - DO NOT EDIT."

## Category 3: Autonomous Coding Agents

### OpenHands (70K stars)
- Event-sourced architecture, sandboxed Docker. No pipeline phases.

### Aider (42K stars)
- Repo map via tree-sitter, auto lint/test fix loop, 100+ languages
- 88% of aider's own code written by aider. No planning phase.

### SWE-agent (19K stars)
- Agent-Computer Interface constrains LLM-computer interaction
- Mini-swe-agent is ~100 lines, scores >74% SWE-bench verified

### Open SWE (LangChain, 8.4K stars)
- Most pipeline-like coding agent: Manager → Planner → Programmer → Reviewer
- Human-in-the-loop on plan. Missing: spec, design, clarification.

### GPT-Engineer (55K stars)
- Historically significant but effectively abandoned. "Check out aider" says README.

### Claude Task Master (26K stars)
- TDD autopilot mode, 36 MCP tools. Claims 90% fewer errors.
- Covers plan + implement. PRD is user-supplied.

## Category 4: Quality Enforcement Tools

### Qodo (formerly CodiumAI)
- 15+ specialized review agents, multi-repo context awareness

### CodeRabbit
- Sandboxed PR review, context engine, ast-grep pattern matching

## Sources
20+ GitHub repos, Martin Fowler, InfoQ, engineering blogs. Full citations in report.
