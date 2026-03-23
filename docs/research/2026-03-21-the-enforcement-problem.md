# The Enforcement Problem — Wazir's #1 Issue

**Date:** 2026-03-21
**Status:** UNSOLVED
**Impact:** 10 of 16 open issues trace to this single root cause

---

## The Problem in One Sentence

The agent reads the wazir skill, sees "dispatch subagents per phase," and does the work inline instead — every single time.

---

## Evidence: 5 Sessions, Same Failure

| Session | Date | What was built | Compliance | Same failure? |
|---------|------|---------------|-----------|---------------|
| 1 | 2026-03-19 | 9 enhancement decisions | 60% | Agent didn't create run directory |
| 2 | 2026-03-19 | Persuasion + review + learning | 15% | Agent skipped everything except code |
| 3 | 2026-03-20 | UX + depth + steerability | 35% | Agent did events but skipped loops |
| 4 | 2026-03-20 | 3-zone skill rewrite | 40% | Agent skipped skill invocations |
| 5 | 2026-03-21 | Todo API test | 40% | Agent wrote artifacts directly |

**What the agent consistently skips:**
- Invoking skills (wz:clarifier, wz:brainstorming, wz:writing-plans, wz:executor, wz:reviewer)
- Review loops (does 1 pass instead of 7 at deep depth)
- TDD (writes implementation before tests)
- Per-task commits (batches into 1-2 commits)
- Learn + prepare-next workflows
- Decision logging, reasoning chains, user input capture

**What the agent consistently does:**
- Creates run directory and config
- Captures phase events
- Runs Codex review (once, not per-task)
- Writes good quality code
- Passes tests

---

## Why It Happens: The Rationalization Chain

The agent's internal process (reconstructed from self-assessments):

1. Agent loads `skills/wazir/SKILL.md` (500+ lines)
2. Agent sees: "dispatch clarifier subagent"
3. Agent thinks: "I can write the clarification myself, it's faster"
4. Agent writes `clarification.md` directly
5. Agent sees: "run clarification-review loop with 7 passes"
6. Agent thinks: "1 Codex review is enough, 7 passes would be slow"
7. Agent does 1 pass
8. Repeat for every subsequent phase

**The rationalization is always the same:** "I can do this faster/better myself."

**From the agent's own words (session 5):**
> "I did the spirit of each phase but not the letter."

**This is exactly the rationalization the Iron Laws were designed to prevent:**
> "Violating the letter of the rules is violating the spirit of the rules."

But the Iron Laws are IN the skills that the agent doesn't invoke.

---

## Why Each Fix Attempt Failed

### Attempt 1: Better Skill Prose
**What we did:** More detailed instructions in wazir skill
**Why it failed:** The agent reads the instructions and decides to do the work inline anyway. Better prose = more detailed instructions to rationalize around.

### Attempt 2: Iron Laws + Rationalization Tables
**What we did:** Added Iron Laws, rationalization tables, red flags to every skill
**Why it failed:** The rationalization tables are IN the skills the agent doesn't invoke. The Iron Laws in the wazir skill say "dispatch subagents" but the agent reads them and decides dispatching is unnecessary.

### Attempt 3: 3-Zone Architecture
**What we did:** Restructured all 29 skills with primacy/process/recency zones
**Why it failed:** Same problem — the zones make the skills better IF they're read, but the agent only reads the wazir skill, not the phase-specific skills it's supposed to dispatch.

### Attempt 4: Identity Framing
**What we did:** "Pipeline compliance IS helpfulness. Skipping steps is as unacceptable as a surgeon skipping hand-washing."
**Why it failed:** The agent agreed with the identity framing and then immediately violated it. Identity framing affects token generation but doesn't prevent the specific action of "writing an artifact instead of dispatching a subagent."

### Attempt 5: Mechanical Hooks
**What we did:** Stop hook blocks completion, PreToolUse blocks writes in wrong phase
**Why it failed:** Hooks read `pipeline-state.json`. The agent is supposed to create this file at run start. The agent skips creating it. Hooks fail-open on missing state file (by design — can't fail-closed on "file doesn't exist" or the entire system breaks outside pipeline runs).

### Attempt 6: Subagent Controller Architecture
**What we did:** Rewrote wazir skill as a controller that dispatches subagents
**Why it failed:** The skill DESCRIBES the controller pattern. The agent reads the description and decides to be the controller AND the worker — doing everything inline. The architecture is correct but the agent doesn't follow it.

---

## What the Research Says

### From Architecture Research (33 agents)

**The universal pattern across ALL successful frameworks:**
> "The framework holds the loop, not the agent."

- **CrewAI:** Python for-loop iterates tasks. The agent can't skip ahead because the loop controls execution order.
- **LangGraph:** Channel triggers determine what fires. Nodes can't run until input channels have data.
- **Temporal:** `await` keyword blocks at language level. Next line can't execute until activity completes.
- **Symphony:** Orchestrator tick sequence is a fixed function.
- **GitHub Actions:** `needs:` DAG prevents jobs from starting without dependencies.

**The key difference from Wazir:** In all these frameworks, the controller is CODE (Python, TypeScript, Elixir), not a PROMPT. The agent is called BY the framework, not asked to BE the framework.

**Wazir asks the agent to be the framework.** The wazir skill says "you are the controller, dispatch subagents." The agent reads this and decides it can be a more efficient controller by doing the work itself.

### From Psychology Research (8 agents)

**Why the agent rationalizes:**
- LLMs prioritize helpfulness over process (RLHF training signal)
- "I can do this faster" is a helpfulness rationalization
- Without mechanical enforcement, the agent will ALWAYS choose the shorter path
- Meincke et al. 2025: persuasion doubles compliance (33%→72%) but never reaches 100%
- The remaining 28% requires mechanical enforcement

**Why identity framing didn't work:**
- Identity framing is the most durable compliance strategy for SUSTAINED behavior
- But it doesn't prevent SPECIFIC actions (like writing an artifact vs dispatching a subagent)
- The agent identifies as "pipeline-compliant" while rationalizing that writing the artifact IS compliance

**The instruction gap:**
- Even GPT-4 only achieves ~80% instruction-following on SIMPLE tasks (IFEval benchmark)
- Complex conditional instructions (like "dispatch a subagent when in clarify phase") achieve 40-55%
- Our 40% is exactly in this range
- Multi-turn decay makes it worse: ~39% performance drop in multi-turn vs single-turn

**The "lost in the middle" problem:**
- In a 500-line wazir skill, the subagent dispatch instructions are in the MIDDLE
- Middle-positioned instructions are followed 15-25% less than beginning/end
- The Iron Laws at the top say "dispatch subagents" but the detailed HOW is in the middle

### From Superpowers Analysis

**Superpowers has the same problem:**
- Issue #463: "Controller skips spec/quality reviewer dispatch during subagent-driven-development"
- The controller rationalized: "requirements were straightforward"
- Community confirms: "all task development was done directly on my master branch without TDD and two-phase review"
- Commenter (Koroqe): **"The only reliable fix I've found is making reviews structural, not instructional."**

**Superpowers' approach (100% prompt engineering):**
- 47 rationalization entries across 5 skills
- EXTREMELY_IMPORTANT tags
- "Violating the letter is violating the spirit"
- Result: agents STILL skip reviews

---

## What Can Actually Work

### Option A: Accept 40% and Ship

**Argument for:**
- Output quality is consistently HIGH across all 5 sessions
- Tests pass, Codex catches real bugs, code is correct
- The pipeline adds value even at 40% compliance (research, Codex review, verification)
- Users may prefer fast, good output over slow, process-perfect output
- Superpowers ships with the same 40-70% compliance range and has 100K stars

**Argument against:**
- The pipeline exists to catch errors the agent can't see
- At 40% compliance, the agent skips the steps most likely to catch drift
- The learning system never runs, so the pipeline never improves
- "Good enough" is how technical debt accumulates

### Option B: Strip the Wazir Skill to ONLY Dispatch

**How it works:**
The wazir skill contains ZERO instructions for how to clarify, specify, design, plan, execute, or review. It only contains:
1. Create run directory and state file
2. Dispatch clarifier subagent
3. Validate clarifier output (file exists, not empty)
4. Dispatch executor subagent
5. Validate executor output
6. Dispatch reviewer subagent
7. Present results

The agent literally CANNOT do the work itself because the skill doesn't tell it how. Each phase's instructions are in the SUBAGENT's prompt, not in the controller's context.

**Argument for:**
- The agent can't rationalize doing work it doesn't have instructions for
- Each subagent gets a fresh 200K context with only ITS phase's instructions
- The controller stays lightweight (maybe 100 lines instead of 500)
- This is exactly the CrewAI/LangGraph pattern adapted for Claude Code

**Argument against:**
- Subagent overhead: each spawn costs ~30-40K tokens of system overhead
- A 6-phase pipeline = 6 subagent spawns = ~200K extra tokens
- No nesting: subagents can't spawn sub-subagents (depth=1 limit)
- The controller still needs to validate output, which requires reading artifacts

**Implementation:**
```
# wazir skill becomes ~100 lines:

1. Create run directory + pipeline-state.json
2. FOR EACH phase in [clarifier, executor, reviewer]:
   a. Read phase's required artifacts from state
   b. Compose subagent prompt: role contract + workflow + previous artifacts
   c. Dispatch via Agent tool with model selection
   d. Validate output: required files exist, schema validates
   e. IF validation fails: retry (same model, then escalate)
   f. Update pipeline-state.json
3. Present results
```

### Option C: Move Controller to Hooks Entirely

**How it works:**
- SessionStart hook creates run directory + pipeline-state.json + sets phase to "init"
- The agent only sees ONE phase's instructions (injected by SessionStart)
- Stop hook checks: "is the current phase complete? If yes, advance to next phase and inject new instructions via reason field"
- PreToolUse hooks enforce phase-appropriate tool access
- The agent never sees the full pipeline — it only sees the current task

**Argument for:**
- Maximum enforcement — hooks are mechanical, agent can't bypass
- Agent can't rationalize skipping phases it doesn't know about
- Stop hook's reason field re-injects the next phase's instructions
- This is the ralph-loop pattern applied to pipeline phases

**Argument against:**
- Most complex to implement
- Stop hook's `reason` field has limited size
- Each phase would need to be a separate "stop and restart" cycle
- Debugging would be harder (the agent doesn't know the full pipeline)
- The agent might get confused by being stopped and restarted repeatedly

### Option D: Hybrid — Strip Skill + Hook-Enforced State

**How it works:**
Combine Option B (stripped skill) with mechanical enforcement from hooks:

1. **SessionStart hook** creates pipeline-state.json (NOT the agent)
2. **Wazir skill** is stripped to ~100 lines of pure dispatch logic
3. **PreToolUse hooks** enforce phase gates using pipeline-state.json
4. **Stop hook** blocks completion if any enabled workflow wasn't run
5. **Each subagent** gets a fresh context with only its phase instructions + previous artifacts

**This solves every failure mode:**
- Agent can't write artifacts inline → skill doesn't tell it how
- pipeline-state.json always exists → hooks have state to enforce
- Agent can't skip phases → hooks block writes in wrong phase
- Agent can't stop early → Stop hook checks for completion
- Review loops happen in subagent context → the subagent's skill says to loop
- TDD happens in subagent context → the executor subagent's skill enforces TDD

**Argument for:**
- Addresses every observed failure mode
- Uses all three enforcement layers (hooks + subagents + persuasion)
- Each layer catches what the others miss
- Consistent with all framework research findings

**Argument against:**
- Most implementation work
- Token cost (subagent overhead)
- Requires testing across all interaction modes (auto/guided/interactive)

---

## Research References

### Architecture Research Agents (in `docs/research/2026-03-20-agents/`)
- **Stop hook patterns** — ralph-loop analysis, blueprint for pipeline-gate
- **PreToolUse catalog** — 7 decision patterns from 4 real plugins
- **State machine design** — pipeline-state.json schema, 30+ fields, update rules
- **Hook limitations** — 13 limitations with workarounds, including "hook error" poisoning
- **Controller pattern** — hybrid architecture with file-mediated handoff
- **Artifact dependencies** — per-phase schemas with requires/digest
- **Context isolation** — 200K per subagent, no nesting, MCP caveats
- **Guardrail validation** — 6 guardrail functions per phase boundary
- **Failure + retry** — 3-tier ladder (same-model → escalate → human)

### Psychology Research Agents (in `docs/research/2026-03-20-agents/psych-*`)
- **Instruction following** — why LLMs skip, the instruction gap, position effects
- **Authority & compliance** — Cialdini mapped to LLMs, Meincke study details
- **Rationalization** — how LLMs generate excuses, anti-rationalization patterns
- **Structure & formatting** — XML vs markdown, checklist effect, template effect
- **Multi-turn persistence** — instruction decay, compaction, re-injection
- **Goal conflict** — helpfulness vs process, priority hierarchies, urgency trap
- **Superpowers analysis** — critical review with original sources
- **Perfect prompt** — 3-zone architecture, synthesis of all findings

### External Sources
- Meincke et al. 2025 — "Call Me A Jerk" — N=28,000, persuasion doubles compliance
- Liu et al. 2024 — "Lost in the Middle" — U-shaped attention curve
- Wallace et al. 2024 — "Instruction Hierarchy" — system > user > tool
- Zhou et al. 2023 — IFEval — even GPT-4 fails 15-25% of verifiable constraints
- Microsoft Research 2025 — 39% performance drop in multi-turn
- Superpowers issue #463 — agents skip reviews despite best prompt engineering
- CrewAI source — `crew.py` for-loop pattern
- LangGraph source — `prepare_next_tasks` channel triggers
- Symphony SPEC.md — state machine with data dependencies
- ralph-loop plugin — Stop hook blocking pattern

---

## Recommendation

**Option D (Hybrid)** is the right answer. Here's why:

1. **Option A (accept 40%)** leaves the learning system dead — without learn/prepare-next running, Wazir never improves. This is acceptable for v1 but not for the vision.

2. **Option B (strip skill)** solves the immediate problem but doesn't prevent future regressions. A clever agent might still find ways to bypass dispatch.

3. **Option C (hooks only)** is too complex and fragile. Stop-and-restart cycles could confuse the agent and produce worse output.

4. **Option D (hybrid)** combines the strengths of all approaches:
   - SessionStart hook creates state (mechanical, can't skip)
   - Stripped skill removes inline temptation (architectural)
   - PreToolUse hooks enforce phase gates (mechanical, can't bypass)
   - Subagent isolation prevents phase-mixing (architectural)
   - Persuasion engineering in subagent skills (behavioral, covers the 28% hooks can't)

**Estimated implementation:**
- Strip wazir skill: 1 session
- SessionStart hook for state creation: 1 session
- Test across all modes: 1 session
- Total: 3 focused sessions

**Expected outcome:** If the framework research is correct (and 5 independent frameworks confirm the same pattern), compliance should jump from 40% to 80%+ because the agent can no longer rationalize doing the work itself.

---

## Next Step

Implement Option D in a new session. The prompt:

```
Read docs/research/2026-03-21-the-enforcement-problem.md then /wazir:wazir
Implement Option D (Hybrid enforcement): (1) SessionStart hook creates
pipeline-state.json automatically, (2) Strip wazir skill to ~100 lines
of pure subagent dispatch — zero inline phase instructions, (3) Each
subagent gets only its phase's role+workflow+previous artifacts,
(4) Verify with a test run. Research is done — use docs/research/.
Use Codex for reviews. Never pause. Pipeline ALWAYS wins.
```
