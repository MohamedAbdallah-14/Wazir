---
name: wz:brainstorming
description: Use before implementation work to turn operator briefings into an approved design with explicit trade-offs.
---

# Brainstorming

Read `input/` first, then inspect only the repo surfaces needed to understand the request.

Rules:

1. Do not write implementation code before the design is reviewed with the operator.
2. Ask clarifying questions only when the ambiguity changes scope, architecture, or acceptance criteria.
3. Propose 2-3 approaches with trade-offs and a recommendation.
4. Write the approved design to `docs/plans/YYYY-MM-DD-<topic>-design.md`.
5. Hand off to `wz:writing-plans` after approval.

Required outputs:

- design summary
- open questions or resolved assumptions
- explicit recommendation and rejected alternatives

---

## Team Mode: Structured Dialogue

**Condition:** Only activate when `team_mode: parallel` in `.wazir/runs/latest/run-config.yaml`. Otherwise, use the default single-agent brainstorming above.

When team mode is active, spawn a 3-agent team using Claude Code Agent Teams:

### Agents

| Agent | Role | Cognitive Mode |
|-------|------|----------------|
| **Free Thinker** | Proposes design directions, creative leaps, "what if..." scenarios. Speaks first, opens new threads. | Divergent generation |
| **Grounder** | Challenges proposals, sorts signal from noise, picks winners, redirects dead ends. Responds to Free Thinker. | Convergent editing |
| **Synthesizer** | Observes silently, maintains a running summary, produces the final design document. Never participates in dialogue. | Synthesis only |

### Communication Protocol

- Free Thinker and Grounder exchange via **broadcast** (all agents see every message)
- Synthesizer **NEVER** participates in dialogue — only observes and writes to files
- After each direction is explored (3-5 exchanges), the Grounder decides: pursue, park, or redirect

### Dialogue Flow

1. **Open a direction** — Free Thinker proposes (broadcast)
2. **Deepen** — 3-5 exchanges between Free Thinker and Grounder
3. **Decide** — Grounder calls it: pursue, park, or redirect
4. **Next direction** — Free Thinker opens a new thread, aware of connections to prior threads

Early rounds: more divergent. Later rounds: more convergent.

### Depth-Bounded Behavior

| Depth | Directions to explore | Exchanges per direction |
|-------|-----------------------|------------------------|
| Standard | 3-5 | 3 exchanges |
| Deep | 5-8 | 5 exchanges |

### Convergence

The dialogue has converged when:
1. Enough directions have been explored for the depth level
2. The pursued directions have genuine range (not variations of the same idea)
3. The Grounder signals satisfaction
4. Further dialogue is producing diminishing returns

### Output

The Synthesizer produces the design document following the same format as single-agent brainstorming:
- Design summary
- Open questions or resolved assumptions
- Explicit recommendation and rejected alternatives

The Synthesizer then writes the design to `docs/plans/YYYY-MM-DD-<topic>-design.md` and hands off to `wz:writing-plans`.
