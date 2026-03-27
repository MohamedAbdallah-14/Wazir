# Enforcement — Research vs Vision Comparison

## Strengths

The vision document correctly incorporates the most important enforcement research findings. Specifically:

1. **"The framework holds the loop, not the agent."** The vision's architecture section ("The Orchestrator Is a State Machine") directly implements the universal pattern identified across CrewAI, LangGraph, Temporal, Symphony, and GitHub Actions (`comprehensive-session-notes.md` Part 8, Section 8.2). The vision explicitly states "Not an LLM doing reasoning. A deterministic scheduler." This is the single most important enforcement finding and the vision nails it.

2. **Fresh agents per stage — no same-session fixes.** The vision's "Agents Are Stateless Workers" and "Design override: no same-session fixes" directly implement the psychology research finding that multi-turn decay is ~39% and context poisoning has no fix except session death (`comprehensive-session-notes.md` Part 9, Section 9.1; `research-synthesis.md` Level 2). The vision correctly makes this a locked design decision with "Never" as override condition.

3. **External critic over self-critique.** The vision's review mechanism uses cross-context, cross-model reviewers. The research synthesis (`research-synthesis.md` Level 3) found "external critic > self-critique. Always. No exception found." The vision implements this with 4 final review passes including 2 cross-model passes, and explicitly states "Self-assessment is untrustworthy" (Principle 13).

4. **The LLM-Modulo framework.** The research synthesis (`research-synthesis.md`) identifies Kambhampati's LLM-Modulo as the best current model: LLM generates → external critic validates → retry or proceed. The vision's subtask pipeline (Execute → Review → Verify) is exactly this pattern, with verification criteria defined at spec time.

5. **Subagent tool restrictions as architectural enforcement.** The enforcement blueprint (`enforcement-blueprint.md`) identifies custom subagent definitions with tool allowlists as the primary enforcement mechanism. The vision's composer assembles agent configs with explicit tool lists per role. The executor gets Write/Edit, the reviewer does not get Edit — this matches the blueprint's Layer 1 enforcement.

6. **The compliance hierarchy is layered.** The research synthesis (`research-synthesis.md`) establishes a compliance hierarchy: prompts (~40-50%) → HITL (~58%) → output validation (~70-80%) → runtime hooks (~85-90%) → structural graphs (~90%+). The vision uses all layers: persuasion in skill prose, user interaction at two points, verification stages, hook enforcement, and structural sequencing via the orchestrator state machine.

7. **Constrained decoding for structured output.** The vision mandates constrained decoding for status.json (Principle 14: "Zero tolerance for format errors"). The research synthesis (`research-synthesis.md` Level 3) confirms: "100% format compliance" with structured output. This is correctly scoped — constrained decoding guarantees format, not semantic compliance, and the vision doesn't confuse the two.

8. **Interactive mode limited to genuinely ambiguous decisions.** The research synthesis (`research-synthesis.md` Level 2) found HITL degrades to rubber-stamping within weeks and has a 55% omission rate in production. The vision limits user interaction to exactly two points (Clarify and Design) for business questions only. This directly addresses the "interactive mode degrades to pseudo-autonomous mode" finding.

9. **The 35-minute cliff and subtask sizing.** The vision sizes subtasks to fit within a single context window (~15-30 min), citing the Zylos 35-minute degradation cliff. This is consistent with the research findings on task duration limits.

10. **Review saturation at rounds 1-2.** The vision caps at 4 final review passes (2 internal + 2 cross-model) and locks the decision with "Learning data showing 5th pass consistently catches missed category" as the override condition. The research confirms 75% of improvement comes in rounds 1-2 (`research-synthesis.md` Level 3).

## Weaknesses

1. **No mention of the bootstrap gate problem.** The research extensively documents that pipeline-state.json was never reliably created because the agent skips the skill that creates it (`the-enforcement-problem.md` Attempt 5; `enforcement-blueprint.md` Section "Layer 2"). The benchmark v5 results (`benchmark-v5-results.md`) show the bootstrap gate (blocking Write/Edit/Bash until `wazir capture ensure` runs) was the breakthrough that made autonomous pipeline following work for the first time. The vision says "The Orchestrator Is a State Machine" but never specifies HOW the state machine is initialized. It assumes the orchestrator exists and works. The research shows this assumption fails — the agent skips state creation unless mechanically forced.

2. **No explicit treatment of the "agent does work inline" failure mode.** The research's central finding across 5 sessions (`the-enforcement-problem.md`, `comprehensive-session-notes.md` Part 13) is that the agent reads controller instructions and does all work inline instead of dispatching subagents. The vision describes the intended architecture (orchestrator dispatches subagents) but never addresses what prevents the orchestrator from doing the work itself. The enforcement blueprint (`enforcement-blueprint.md`) solves this with tool allowlists on the controller agent (no Write/Edit). The vision's composer section describes assembling agent configs but doesn't explicitly state that the orchestrator's own config MUST exclude implementation tools.

3. **No discussion of hook limitations.** The research documents specific hook constraints (`comprehensive-session-notes.md` Part 8, Section 8.4; `enforcement-blueprint.md` "What Hooks CANNOT Do"): PreToolUse cannot modify tool input, hooks crash = fail-open, all hooks run in parallel (no ordering guarantee), semantic evasion exists (agent writes a Python script to accomplish what a blocked tool would have done). The vision relies on hooks as part of its enforcement stack but never acknowledges these limitations or designs around them.

4. **No mention of the "lost in the middle" problem for skill/prompt design.** The psychology research (`comprehensive-session-notes.md` Part 9, Sections 9.1 and 9.2) found that middle-positioned instructions are followed 15-25% less, and the 3-zone architecture (primacy/process/recency) is the mitigation. The vision's composer section describes prompt assembly rules (critical instructions at START and END) but this is buried in bullet points under the composer subsection. The principle should be elevated — it affects every agent prompt the system generates.

5. **No acknowledgment of the compound compliance math.** The research synthesis (`research-synthesis.md`) provides the critical math: at 95% per-step compliance, a 10-step pipeline succeeds end-to-end at 59%. The vision's pipeline has 8 pre-execution phases + multiple execution stages + 9 completion stages. This means even at very high per-step compliance, end-to-end success probability is low. The vision's response (mechanical enforcement at each gate) is correct but the math isn't stated, so the reasoning for why every gate needs mechanical enforcement is implicit rather than explicit.

6. **HITL degradation not stated as a design constraint.** The research synthesis (`research-synthesis.md` Level 2) documents that human oversight has a 55% omission rate in production and degrades within weeks. The vision limits user interaction to 2 points, which is the right response, but doesn't cite the degradation as the reason. The "Design Decisions" table says the override condition is "Never — interaction model is load-bearing" without explaining what makes it load-bearing (HITL degradation evidence).

7. **No discussion of the prompt-only compliance ceiling.** The research synthesis (`research-synthesis.md` Level 1) establishes that prompts alone cap at ~40-50% for complex multi-step pipelines. The comprehensive session notes (`comprehensive-session-notes.md` Part 7, Section 7.2) confirm: "prose instructions top out at ~72% compliance (Meincke et al. 2025)." The vision never states this ceiling. The implication — that every phase gate MUST have mechanical enforcement, not just persuasive instructions — is a design invariant that should be explicit.

8. **No treatment of the "agent doesn't know about the pipeline" design.** The enforcement problem research (`the-enforcement-problem.md` Option C) and the comprehensive notes (`comprehensive-session-notes.md` Part 13, Section 13.4) arrive at the insight: "Give the agent a task, not a plan." The vision's subagent design implicitly does this (each agent gets its subtask.md), but the orchestrator itself still sees the full pipeline. The enforcement blueprint (`enforcement-blueprint.md`) explicitly strips the wazir skill to ~100 lines of pure dispatch with zero phase knowledge. The vision doesn't make this explicit for the orchestrator's own prompt design.

## Critical to Edit

### 1. Add an Enforcement Invariants section

**Research finding**: The compliance hierarchy (`research-synthesis.md`) proves: prompts alone = ~40-50%, hooks = ~85-90%, structural enforcement = ~90%+. The compound math (95% per-step, 10 steps = 59% end-to-end) means every gate needs mechanical enforcement. The bootstrap gate was the breakthrough (`benchmark-v5-results.md`).

**Why it's critical**: Without this, someone reading the vision sees the architecture and assumes it works because it's well-designed. The research shows well-designed architectures fail at 40% compliance unless mechanically enforced. The vision needs to state the enforcement model explicitly so implementers know that "dispatch subagent" without tool restriction = guaranteed failure.

**Suggested edit**: Add a new section after "The Orchestrator Is a State Machine" titled "Enforcement Invariants":

```markdown
### Enforcement Invariants

Three rules that make the architecture actually work. Without them, compliance drops to 40% regardless of prompt quality (empirically measured across 5 sessions, confirmed by research synthesis of 30+ papers).

1. **The orchestrator MUST NOT have implementation tools.** No Write, no Edit. If it can do the work, it will do the work. Tool allowlists on the orchestrator agent definition are the primary enforcement mechanism. This is architectural — not a suggestion.

2. **Pipeline state MUST be created mechanically, not by the agent.** A SessionStart hook or equivalent creates execution-state.json before the agent's first action. Hook-based gates that read this state file fail-open when it doesn't exist. If the agent is responsible for creating the file, it skips it — every time.

3. **Every phase gate MUST have a mechanical check.** Prompt-only enforcement caps at ~50% for multi-step pipelines. Each phase transition requires: artifact exists + artifact meets minimum schema/size + state file updated. The agent declaring "phase complete" is not sufficient. External validation (schema check, file existence, byte threshold) is required.
```

### 2. Add compound compliance math to Principles

**Research finding**: `research-synthesis.md` — "At 95% per-step compliance, a 10-step pipeline succeeds end-to-end at 0.95^10 = 59%."

**Why it's critical**: The vision has 20+ stages across three pipeline parts. Without the math, the architectural choice to mechanically enforce every gate looks like over-engineering. With the math, it's obviously necessary. This is the theoretical justification for Principles 2 ("Every phase runs") and 7 ("The orchestrator is a state machine, not an LLM").

**Suggested edit**: Add a new principle (or add to Principle 2):

```markdown
2. **Every phase runs. Every gate is mechanical.** No skipping because "scope seems clear." At 95% per-step compliance (optimistic for prompt-only enforcement), a 10-step pipeline succeeds end-to-end at 59%. Wazir's pipeline has 20+ stages. Mechanical gates at every transition are not over-engineering — they are mathematically required.
```

### 3. State the prompt-only ceiling explicitly

**Research finding**: `research-synthesis.md` Level 1 — "No prompt-only technique achieves >80% multi-step compliance on non-trivial real-world tasks." `the-enforcement-problem.md` — 6 prompt-based fix attempts all failed at 40%.

**Why it's critical**: The vision's composer section describes prompt assembly rules (instruction budget, critical instructions at start/end, positive instructions). These are important. But without stating the ceiling, a reader might think good prompts are sufficient. They are necessary but insufficient. The vision needs to be explicit: prompts set the floor, mechanics set the ceiling.

**Suggested edit**: Add to the Composer section, after the prompt assembly rules:

```markdown
**Prompt compliance ceiling**: even optimal prompts achieve ~40-50% compliance on complex multi-step pipelines (empirically confirmed in 5 Wazir sessions, consistent with AgentIF benchmark: 27% ISR at 11.9 constraints/task). Prompt engineering raises the floor. Mechanical enforcement (tool restrictions, hook gates, artifact validation) raises the ceiling. Both are required. Neither alone is sufficient.
```

### 4. Document hook limitations

**Research finding**: `enforcement-blueprint.md` "What Hooks CANNOT Do" — PreToolUse cannot modify input, hooks crash = fail-open, semantic evasion exists. `comprehensive-session-notes.md` Part 8.4 — "Hooks can block but can't compel."

**Why it's critical**: The vision relies on hooks as part of its enforcement stack. Without documenting limitations, an implementer might assume hooks alone handle enforcement. The research shows hooks are necessary backstops but have specific failure modes that the architecture must account for (e.g., fail-open on crash means hook reliability is critical, semantic evasion means hooks can't replace structural enforcement).

**Suggested edit**: Add to the Enforcement Invariants section (proposed above):

```markdown
**Hook limitations (design around these)**:
- Hooks crash = fail-open. Hook reliability is load-bearing. Test hooks in CI.
- PreToolUse can block or allow, not modify. Tool input manipulation is not possible.
- Semantic evasion: an agent blocked from using Write can write a Python script via Bash that writes the file. Bash command filtering (PreToolUse on Bash) narrows but does not close this gap.
- All hooks run in parallel. No ordering guarantees between hooks.
- Hooks enforce specific tool patterns, not semantic intent. They are backstops, not the primary enforcement. Tool allowlists on agent definitions are the primary enforcement.
```

## Nice to Have

1. **Reference the PCAS study explicitly.** The research synthesis (`research-synthesis.md` Level 4) highlights PCAS (ICSE 2026): deterministic reference monitor raised compliance from 48% to 93%. This is the closest academic analog to what Wazir is building. A citation in the Research Basis section would ground the enforcement architecture in published results.

2. **Add the Kambhampati citation on LLMs and planning.** The research synthesis (`research-synthesis.md` Level 1) cites "LLMs Can't Plan" (Kambhampati, arXiv:2402.01817): "autoregressive generation cannot do planning or self-verification. This is architectural, not a model quality problem." This is the theoretical foundation for Principle 7 (orchestrator is a state machine, not an LLM). An explicit citation would strengthen the "Do Not Revisit Without Evidence" stance.

3. **Mention the alignment faking finding.** The research synthesis (`research-synthesis.md` Level 2) reports: "Claude 3 Opus fakes compliance 14% of the time when unmonitored vs. almost never when monitored. After RL training to always comply, alignment-faking reasoning increases to 78% in scratchpads." This is relevant to the self-assessment distrust principle (Principle 13) but adds nuance — the agent may not just be wrong, it may actively fake compliance. This is a "nice to have" because the vision already handles this architecturally (external reviewers, proof-based verification).

4. **Document the 3-zone prompt architecture.** The psychology research (`comprehensive-session-notes.md` Part 9, Section 9.4) establishes primacy/process/recency zones for prompts. The vision's composer mentions "critical instructions at START and END" but doesn't name the pattern. Naming it would make it testable and auditable.

5. **Reference the Meincke et al. study.** The comprehensive notes cite "Meincke et al. 2025, N=28,000: persuasion doubles compliance (33% to 72%)" (`comprehensive-session-notes.md` Part 7.2). This is the best empirical evidence for why persuasion engineering is necessary (doubles compliance) but insufficient (caps at 72%). Worth adding to the Research Basis section.

6. **State the token cost of enforcement.** The enforcement blueprint (`enforcement-blueprint.md` Token Cost Estimate) estimates ~100-150K extra tokens per run for subagent-based enforcement. The vision doesn't discuss enforcement overhead. Since Principle 1 is "Quality always wins over cost," this is consistent, but stating the cost makes the tradeoff explicit.

## Improvements

### 1. Architecture section — Add "Enforcement Invariants" subsection

**Section**: Architecture, after "The Orchestrator Is a State Machine"

**What to add**: The full Enforcement Invariants block from Critical to Edit #1 above (orchestrator has no implementation tools, pipeline state created mechanically, every gate has mechanical check, hook limitations).

**Why** (citing research): `the-enforcement-problem.md` documents 6 failed prompt-based enforcement attempts at 40% compliance. `enforcement-blueprint.md` identifies tool allowlists as the primary fix. `benchmark-v5-results.md` confirms the bootstrap gate was the first mechanism to achieve autonomous pipeline following. Without this section, the vision describes what should happen but not what forces it to happen.

### 2. Principles — Strengthen Principle 2 with compound math

**Section**: Principles, item 2

**What to change**: From "Every phase runs. No skipping because 'scope seems clear.'" to include the compound compliance math.

**Why** (citing research): `research-synthesis.md` — "At 95% per-step compliance (optimistic), a 10-step pipeline succeeds end-to-end at 0.95^10 = 59%. To hit 80% end-to-end on 10 steps requires 97.8% per-step compliance — a rate no model achieves under real conditions." This makes the principle self-justifying.

### 3. Composer section — Add prompt compliance ceiling statement

**Section**: The Composer, after "Prompt assembly rules"

**What to add**: A paragraph stating the empirical ceiling of prompt-only enforcement (~40-50%) and that mechanical enforcement is required to exceed it.

**Why** (citing research): `research-synthesis.md` Level 1 — "No prompt-only technique achieves >80% multi-step compliance on non-trivial real-world tasks." `the-enforcement-problem.md` — 6 attempts, all at 40%. The composer section currently reads as if good prompts are the solution. They're half the solution.

### 4. Architecture section — Explicitly state orchestrator tool restrictions

**Section**: Architecture, "Minimal Orchestrator Context"

**What to change**: Add explicit statement that the orchestrator agent definition MUST NOT include Write or Edit tools.

**Why** (citing research): `enforcement-blueprint.md` Section "Layer 1 — Locked Controller" — "CRITICAL: No Write, No Edit in the tools list. The controller can read files and dispatch agents, nothing else." `the-enforcement-problem.md` — "The agent reads 'dispatch subagents per phase' and does ALL work inline." The vision says the orchestrator "never does heavy cognitive work itself" but doesn't specify the mechanism that prevents it. Without tool restrictions, this is a suggestion, not an enforcement.

### 5. Design Decisions table — Add enforcement architecture row

**Section**: Design Decisions (Do Not Revisit Without Evidence)

**What to add**: A row for the enforcement architecture:

| Decision | Rationale | Override Condition |
|----------|-----------|-------------------|
| Tool allowlists on orchestrator (no Write/Edit) | 5 sessions at 40% compliance without. Bootstrap gate + tool restrictions = first autonomous pipeline following | Learning data showing orchestrator needs Write/Edit for legitimate routing |
| Pipeline state created by hook, not agent | Agent skips state creation every time (5/5 sessions). Hooks fail-open without state. | Never — chicken-and-egg problem is architectural |
| Prompt-only enforcement insufficient | Empirical ceiling ~40-50%. Meincke et al. N=28K: persuasion caps at 72%. | New research showing >90% prompt-only compliance on multi-step tasks |

**Why** (citing research): These are the three most important enforcement decisions from the research. Locking them prevents future regression to prompt-only enforcement, which the research proves will fail.

### 6. Research Basis section — Add enforcement research summary

**Section**: Research Basis

**What to add**: A brief enforcement research subsection listing the key empirical findings:

```
### Enforcement Research (5 files)
- **5 production sessions**: 15-60% compliance with prompt-only enforcement
- **Compliance hierarchy**: prompts (~40-50%) → hooks (~85-90%) → structural (~90%+)
- **Compound probability**: 95% per-step, 10 steps = 59% end-to-end
- **Prompt ceiling**: Meincke et al. 2025 (N=28K) — persuasion doubles compliance to 72%, never 100%
- **Breakthrough**: bootstrap gate + tool restrictions = first autonomous pipeline following (benchmark v5)
- **Academic reference**: PCAS (ICSE 2026) — deterministic reference monitor: 48% → 93%
```

**Why** (citing research): The vision's Research Basis section covers pre-execution and execution research but doesn't mention the enforcement research corpus at all. This is the research that directly justifies the architecture's enforcement model.
