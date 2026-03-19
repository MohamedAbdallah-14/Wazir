---
name: wz:brainstorming
description: Use before implementation work to turn operator briefings into an approved design with explicit trade-offs.
---

# Brainstorming

## Command Routing
Follow the Canonical Command Matrix in `hooks/routing-matrix.json`.
- Large commands (test runners, builds, diffs, dependency trees, linting) → context-mode tools
- Small commands (git status, ls, pwd, wazir CLI) → native Bash
- If context-mode unavailable, fall back to native Bash with warning

## Codebase Exploration
1. Query `wazir index search-symbols <query>` first
2. Use `wazir recall file <path> --tier L1` for targeted reads
3. Fall back to direct file reads ONLY for files identified by index queries
4. Maximum 10 direct file reads without a justifying index query
5. If no index exists: `wazir index build && wazir index summarize --tier all`

Read `input/` first, then inspect only the repo surfaces needed to understand the request.

Rules:

1. Do not write implementation code before the design is reviewed with the operator.
2. Ask clarifying questions only when the ambiguity changes scope, architecture, or acceptance criteria.
3. Propose 2-3 approaches with trade-offs and a recommendation.
4. Write the approved design to `.wazir/runs/latest/clarified/design.md` (if inside a pipeline run) or `docs/plans/YYYY-MM-DD-<topic>-design.md` (if standalone).
5. After user approves the design concept, the reviewer role runs the design-review loop with `--mode design-review` using canonical design-review dimensions (spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity). See `workflows/design-review.md` and `docs/reference/review-loop-pattern.md`. The designer resolves any findings. If the design-review loop completes all passes clean, hand off to `wz:writing-plans`. Planning does not start until design-review is complete.

Required outputs:

- design summary
- open questions or resolved assumptions
- explicit recommendation and rejected alternatives

---

## Team Mode: Agent Teams Structured Dialogue

**Condition:** Only activate when `team_mode: parallel` in `.wazir/runs/latest/run-config.yaml`. Otherwise, use the default single-agent brainstorming above.

This mode uses **Agent Teams** (experimental, Claude Code + Opus 4.6) to run a
multi-agent brainstorming session. Your role is the **Arbiter** — you coordinate
the dialogue, evaluate convergence, and signal when to stop. You do NOT generate
design ideas yourself.

### Infrastructure: Claude Code Agent Teams

This skill uses **Agent Teams** — not subagents. The distinction matters:

| | Subagents (Task tool) | Agent Teams |
|---|---|---|
| **Lifecycle** | Spawn, return result, die | Full independent sessions that persist for team lifetime |
| **Communication** | Report back to parent only | Direct peer-to-peer messaging via `SendMessage` |
| **Coordination** | Parent manages everything | Shared task list with self-coordination |

**Critical constraint:** Text output from teammates is NOT visible to the team.
Teammates MUST use `SendMessage` to communicate with each other. Regular text
output is only visible in a teammate's own terminal pane.

### Prerequisites

```bash
# Check if Agent Teams is enabled
echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
```

If not set (empty), tell the user:

> Agent Teams is not enabled. Run this command and restart Claude Code:
> ```bash
> claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1
> ```

Then fall back to single-agent brainstorming (rules 1-5 above).

### Step 1: Create the Team

Derive `<concept-slug>` from the briefing topic (lowercased, hyphens for spaces).

Use `TeamCreate` to initialize the team with the name `wazir-brainstorm-<concept-slug>`.

### Step 2: Spawn Teammates

Spawn three teammates using the `Agent` tool with the `team_name` parameter set
to `wazir-brainstorm-<concept-slug>`. Each agent receives a detailed system
prompt via the `prompt` parameter.

#### Free Thinker

```
Agent(
  team_name: "wazir-brainstorm-<concept-slug>",
  prompt: "You are the Free Thinker in a Wazir brainstorming session.
Your job is to propose creative design directions without self-censoring.
Open new threads, explore possibilities, make connections. Communicate
ONLY via SendMessage — your text output is not visible to the team.
After proposing a direction, wait for the Grounder's response before
opening a new one."
)
```

#### Grounder

```
Agent(
  team_name: "wazir-brainstorm-<concept-slug>",
  prompt: "You are the Grounder in a Wazir brainstorming session. Your
job is to challenge every proposal from the Free Thinker with practical
concerns: feasibility, complexity, risk, alternatives. After 3-5
exchanges on a direction, decide: pursue, park, or redirect.
Communicate ONLY via SendMessage — your text output is not visible to
the team."
)
```

#### Synthesizer

```
Agent(
  team_name: "wazir-brainstorm-<concept-slug>",
  prompt: "You are the Synthesizer in a Wazir brainstorming session.
You NEVER participate in dialogue — only observe. Read all SendMessage
traffic between Free Thinker and Grounder. When the Arbiter signals
convergence, write the final design document to
.wazir/runs/latest/clarified/design.md with: design summary, pursued
directions, rejected alternatives, open questions, recommendation."
)
```

### Step 3: Coordinate the Dialogue (You Are the Arbiter)

1. Use `SendMessage` to tell the Free Thinker to open the first direction
   based on the briefing, research brief, and hardened spec.
2. Monitor exchanges via `SendMessage`. Do NOT generate ideas — only
   coordinate, nudge, and evaluate.
3. After each direction is explored (3-5 exchanges), the Grounder decides:
   **pursue**, **park**, or **redirect**.
4. After depth-appropriate directions are explored:

   | Depth | Directions to explore | Exchanges per direction |
   |-------|-----------------------|------------------------|
   | Standard | 3-5 | 3-5 exchanges |
   | Deep | 5-8 | 5-8 exchanges |

5. **Signal convergence:** Use `SendMessage` to tell the Synthesizer to
   produce the final design document.
6. Wait for the Synthesizer to write the design to
   `.wazir/runs/latest/clarified/design.md` (if inside a pipeline run) or
   `docs/plans/YYYY-MM-DD-<topic>-design.md` (if standalone).

### Step 4: Convergence Criteria

The dialogue has converged when:

1. Enough directions have been explored for the depth level
2. The pursued directions have genuine range (not variations of the same idea)
3. The Grounder signals satisfaction
4. Further dialogue is producing diminishing returns

Early rounds should be more divergent. Later rounds more convergent.

### Step 5: Clean Up

Use `TeamDelete` to tear down the team after the Synthesizer has written the
design document.

### Constraints

- Text output from teammates is NOT visible to the team — they MUST use
  `SendMessage`
- The Arbiter (you) coordinates but does NOT generate ideas
- The Synthesizer NEVER sends messages — only reads and writes files
- Free Thinker and Grounder exchange via broadcast (all agents see every
  message)

### Output

The Synthesizer produces the design document following the same format as
single-agent brainstorming:

- Design summary
- Pursued directions with rationale
- Rejected alternatives with reasons
- Open questions or resolved assumptions
- Explicit recommendation

After the design is written, submit it for the design-review loop
(`--mode design-review`). After design-review is complete, hand off to
`wz:writing-plans`.
