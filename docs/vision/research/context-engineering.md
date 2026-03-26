# Context Engineering — Research vs Vision Comparison

> Comparison of 8 research files in `docs/research/context-engineering/` against `docs/vision/pipeline.md`.
> Analysis date: 2026-03-25.

---

## Strengths

The vision document is strong on context engineering. It gets the core architecture right and cites the right research. Specifics:

1. **Fresh context per agent is the load-bearing decision, and it's correct.** The vision (Architecture > "Agents Are Stateless Workers", lines 79-89) mandates that every agent is born, does one job, writes output to disk, and dies. This directly implements the strongest finding across all 8 research files: multi-turn degradation (39% average drop, Laban et al.), context poisoning being unfixable, and fresh context being Anthropic's own production recommendation. The research files `context-management.md` (Section 7, Strategy 4), `context-degradation.md` ("Fresh context per phase with ~2K-10K tokens of structured artifacts is the most robustly supported architecture"), and `minimal-context-max-quality.md` (Source 5, Anthropic) all converge on this. The vision nails it.

2. **File system as communication bus eliminates context passing.** The vision (lines 91-93) uses disk as the only inter-agent channel. This maps directly to `context-management.md` Section 7, Strategy 5 ("Artifacts not context: Pass state via files/commits, not conversation history. CONCAT finding proves info isn't lost.") and `context-engineering-discipline.md` Source 6 (Manus: "Context as an evolving artifact"). The vision avoids the #1 agent failure mode: accumulated context in a shared conversation.

3. **Orchestrator holds minimal context.** The vision (lines 73-77) explicitly states the orchestrator never does heavy cognitive work, only reads ~200-token summaries. This implements the "minimize, don't maximize" principle from `minimal-context-max-quality.md` (Principle 1: "Budget context like memory") and `context-reduction.md` (Meta-Principle: "finding the smallest possible set of high-signal tokens").

4. **Lost in the Middle is correctly treated as architectural.** The vision (Hard Design Constraints table, line 53; Composer section, line 123) places critical instructions at START and END. The research in `lost-in-the-middle.md` (Chowdhury 2026 proof), `llm-attention-patterns.md` (Sources 1, 4, 7, 8), and `minimal-context-max-quality.md` (Principle 3) all validate this. The vision even cites the specific Anthropic finding (27% to 98% with one-line placement change).

5. **~150-200 instruction budget is research-grounded.** The Composer section (line 121) sets this limit. `context-management.md` Section 4 cites LongGenBench (ICLR 2025) showing instruction adherence diminishing after 4K tokens. `minimal-context-max-quality.md` Source 12 reports degradation starting at 2,500-3,000 tokens. The vision is conservative in the right direction.

6. **Cross-context review is correctly mandated.** The vision (Review Mechanism, lines 239-256) dispatches fresh-context reviewers who read artifacts from disk, never from the production session. This directly implements `context-management.md` Section 5's finding that CONCAT recovers 95.1% of lost performance, and the cross-context F1 improvement (28.6% vs 24.6%).

7. **Context budget in subtask files.** The Plan phase (line 227) requires each subtask to declare a context budget with READ FULL, READ SECTION, and KNOW EXISTS classifications. This implements `context-engineering-discipline.md`'s core principle ("Budget context like memory") and `context-reduction.md` Source 9 (Factory's progressive distillation).

8. **Observation masking over summarization.** The Hard Design Constraints table (line 38) cites "observation masking beats summarization." This matches `minimal-context-max-quality.md` Source 8 (JetBrains: simple observation masking matched or beat LLM summarization in 4/5 settings, 52% cheaper) and `context-reduction.md` Source 5 (same finding).

---

## Weaknesses

1. **No explicit token budget per prompt section.** The vision says "~150-200 instruction budget" for the Composer (line 121) but never specifies token budgets for other context components: system prompt, artifact summaries, tool definitions, constraints. The research is emphatic that ALL context components compete for the same attention budget. `minimal-context-max-quality.md` Principle 1 says "Treat tokens as a finite resource with explicit allocation per phase/tool/prompt section." `context-reduction.md` Source 12 says "Priority-based token allocation: Allocate token budget to high-value sections first." The vision's subtask context budget (READ FULL / READ SECTION / KNOW EXISTS) is good but doesn't set numeric limits.

2. **No mention of the 2,500-3,000 token reasoning degradation threshold.** `minimal-context-max-quality.md` Source 12 reports "performance drops after 2,000-3,000 tokens" and Source 13 reports "reasoning performance degrades at around 3,000 tokens." `context-reduction.md` Source 8 confirms "Reasoning degradation measured at around 3,000 tokens." The vision sets a 4K output cliff (line 50) but never mentions the *input* reasoning threshold. This is a different constraint -- it means each reasoning block within a prompt should stay under 3K tokens, not just total output.

3. **No KV-cache-aware design principles.** `context-engineering-discipline.md` Source 6 (Manus) says: "If I had to choose just one metric, I'd argue that the KV-cache hit rate is the single most important metric for a production-stage AI agent." The rule: never mutate the prefix, append only, mask unavailable actions at the logit level. The vision's Composer section assembles prompts but says nothing about prefix stability or KV-cache optimization. Since Wazir agents are single-turn (born, work, die), this matters less than for loop-based agents, but the Composer's prompt assembly still benefits from stable prefixes across similar agent invocations.

4. **No guidance on tool description management.** `context-reduction.md` Source 11 (RAG-MCP) shows that reducing tool descriptions by 50% more than tripled tool selection accuracy (43% vs 14%). `minimal-context-max-quality.md` Source 13 confirms: "Tool selection is maximally impacted by bloat." The vision mentions that the Composer resolves expertise modules (lines 112-118) but says nothing about filtering tool definitions to only those relevant to the current subtask. If a subtask needs 3 tools but 15 are defined, 12 irrelevant tool descriptions are active distractors.

5. **No prompt compression strategy.** The `prompt-compression.md` research file is the most detailed of all 8, covering 16 sources and demonstrating that compressed prompts can *outperform* uncompressed ones by 17.1% (LongLLMLingua). The vision mentions observation masking (line 38) but never addresses prompt compression as a technique. For artifact handoffs between phases -- where a full research brief or spec might be 5K-10K tokens -- compression before injection into the next agent's context could materially improve quality.

6. **No distractor filtering strategy.** `minimal-context-max-quality.md` Source 4 (GSM-IC, ICML 2023) shows that even one semantically similar but irrelevant piece of information significantly hurts performance. `context-reduction.md` Source 4 (Diffray) calls topically similar irrelevant content "worse than random filler." The vision's Composer loads expertise modules based on stack detection and declared concerns, but there's no mechanism to verify that loaded context is relevant to *this specific subtask* vs. generally relevant to the stack/role. A module loaded via `auto.all-stacks.all-roles` could contain distractors for a given task.

7. **Handover prompt compression is underspecified.** The vision says handover resumes are "~500 tokens" (line 361, 531) but doesn't specify how the handover is generated or what compression strategy is used. `context-engineering-discipline.md` Source 6 (Manus) and `context-reduction.md` Source 9 (Factory) both describe structured rolling summaries with explicit sections. Factory's evaluation shows their structured approach scored 3.70 vs. Anthropic's 3.44 vs. OpenAI's 3.35. The vision should specify the handover structure.

8. **No mention of "recite-before-solve" mitigation.** `context-degradation.md` cites Du et al.'s finding that prompting models to recite retrieved evidence before solving improves performance (35.5% to 66.7% at 26K tokens for Mistral). `llm-attention-patterns.md` Source 6 confirms: "prompting the model to recite retrieved evidence before solving the problem yields up to 4% improvement for GPT-4o." The vision has no mechanism for re-grounding agents in their context before they begin work.

---

## Critical to Edit

### 1. Add numeric token budgets to the Composer's prompt assembly

**Research finding:** `minimal-context-max-quality.md` synthesizes 15 sources to conclude: "Target <3,000 tokens per reasoning block" (Principle 2). `context-reduction.md` Source 8 confirms reasoning degrades at ~3K tokens. `context-engineering-discipline.md` Source 8 (Shaped AI) says "Quadratic attention cost: Doubling your context doesn't double your cost, it quadruples it."

**Why critical:** The Composer assembles prompts from multiple sources (expertise modules, context files, constraints, tool definitions). Without explicit budgets per section, prompt bloat is inevitable as expertise modules grow. The 150-200 instruction limit protects instruction count but not token volume. A 150-instruction prompt at 50 tokens/instruction is 7,500 tokens -- already well past the 3K reasoning threshold.

**Suggested edit to vision, Composer section (after line 121):**

Add a "Context Budget Allocation" subsection:
```
**Context budgets per prompt section:**
- System identity + role: ~200 tokens
- Task instructions (from subtask.md): ~500-1,500 tokens
- Expertise modules (combined): ~1,000-2,000 tokens
- Tool definitions (filtered to relevant): ~300-800 tokens
- Context files (from subtask READ FULL/SECTION): ~2,000-4,000 tokens
- Constraints and acceptance criteria: ~300-500 tokens
- Total target: <8,000 tokens. Hard ceiling: 12,000 tokens.

Each section has an explicit budget. If a subtask requires more context than the ceiling, the planner must decompose it further.
```

### 2. Add tool definition filtering to the Composer

**Research finding:** `context-reduction.md` Source 11 (RAG-MCP): "Cutting prompt tokens by over 50% more than tripled tool selection accuracy (43.13% vs 13.62% baseline)." `minimal-context-max-quality.md` Source 13: "Addressing prompt bloat cut prompt tokens by over 50% and more than tripled tool selection accuracy."

**Why critical:** Tool selection accuracy directly determines whether agents can use their tools correctly. If Wazir exposes all available tools to every agent, tool selection accuracy drops by 3x. This is not a cost optimization -- it's a correctness requirement.

**Suggested edit to vision, Composer section (after line 118, step 4):**

Add step 3.5:
```
3.5. Filters tool definitions to only those declared in subtask.md's tool requirements. Tools not listed are excluded from the prompt entirely. If a subtask doesn't declare tools, only the minimum default set (file read, file write, shell) is included.
```

### 3. Add structured handover format

**Research finding:** `prompt-compression.md` Source 12 (Factory AI): "Structured summaries with explicit sections: session intent, file modifications, decisions made, next steps" outperformed generic compression (Factory 3.70 vs Anthropic 3.44 vs OpenAI 3.35 on factual retention). `context-engineering-discipline.md` Source 6 (Manus): KV-cache-aware, append-only, rolling summary.

**Why critical:** The handover is the *only* context a new session receives. If it loses technical detail (which generic compression does -- Factory's evaluation showed OpenAI's compression "produced vague responses that lost technical detail: error codes, endpoints, root causes"), the new session starts degraded. The vision specifies ~500 tokens but not the structure.

**Suggested edit to vision, Batch Execution section (after line 361) and Mode 2 section (after line 531):**

Add handover structure:
```
**Handover structure (mandatory sections):**
1. Session intent (what the run is building, 1-2 sentences)
2. Completed subtasks (IDs + one-line status)
3. In-progress subtasks (ID + current stage + blocking issue if any)
4. Remaining subtasks (IDs, grouped by batch)
5. Accumulated concerns (severity + one-line summary each)
6. Key decisions made (that affect remaining work)
7. Environment state (active branches, worktrees, test status)
8. Resume instruction (what the next session should do first)

Each section is labeled. No narrative prose. The structure ensures no category of information is silently dropped during compression.
```

---

## Nice to Have

1. **Recite-before-solve pattern for complex agents.** `context-degradation.md` and `llm-attention-patterns.md` both cite Du et al.'s recite mitigation (35.5% to 66.7% improvement). For agents that receive large context files (research brief, spec, design doc), adding an instruction like "Before beginning, restate the 3 most relevant acceptance criteria and the key constraint from the spec" could re-ground the agent. Low implementation cost, moderate quality benefit. Not critical because Wazir's fresh-context architecture already keeps context short.

2. **KV-cache prefix stability guidance.** `context-engineering-discipline.md` Source 6 (Manus) and Source 15 (SwirlAI) both identify KV-cache hit rate as the #1 production metric. For Wazir, this means the Composer should produce prompts where the system identity, role definition, and expertise modules form a stable prefix across similar agent invocations (e.g., all reviewer agents share the same prefix). The vision's single-turn agents reduce the importance of this, but across a run with 20+ agent spawns, cache hits on shared prefixes save real cost.

3. **Distractor auditing for expertise modules.** `minimal-context-max-quality.md` Source 4 (GSM-IC) and `context-reduction.md` Source 4 (Diffray) show that topically related but irrelevant content is *worse* than unrelated filler. The learning system (Stage 8 in Completion Pipeline) could track which expertise modules were loaded but never referenced in the agent's output, flagging potential distractors. Low priority because the Composer's module resolution already narrows by stack and role.

4. **Prompt compression for artifact handoffs.** `prompt-compression.md` demonstrates LongLLMLingua achieving 21.4% accuracy improvement at 4x compression. For artifacts that exceed 4K tokens (research briefs, specs), compressing before injection into the next agent could improve quality. However, Wazir's current architecture already uses summaries (~200 tokens to orchestrator, full artifacts read from disk by downstream agents), which achieves similar effect without requiring a compression library dependency.

5. **Chunking strategy for the codebase index.** `minimal-context-max-quality.md` Source 15 (Weaviate/PremAI) finds that recursive character splitting at 512 tokens with 50-100 overlap scored 69% accuracy and outperformed every more expensive alternative. The vision mentions codebase indexing (Phase 1, line 158) but doesn't specify chunk size. This is an implementation detail, not a vision-level concern, but worth noting for when indexing is built.

6. **Attention sink awareness.** `context-reduction.md` Source 4 (Diffray, citing MIT/Meta ICLR 2024) identifies "attention sinks" -- initial tokens receive disproportionately high attention even when semantically unimportant because softmax forces the model to dump attention somewhere. This means the very first tokens of a prompt carry outsized influence. The Composer should ensure the first ~50 tokens are the most critical identity/task framing, not boilerplate. Minor refinement to existing primacy placement guidance.

---

## Improvements

### 1. Composer section: Add context budget table

**Section:** "The Composer" (lines 109-127)
**What to add:** After "~150-200 instruction budget" (line 121), add a token budget allocation table with per-section limits and a hard ceiling. See Critical to Edit #1 for the exact content.
**Why (citing research):** `minimal-context-max-quality.md` Principle 1 ("Budget context like memory: Treat tokens as a finite resource with explicit allocation per phase/tool/prompt section."), `context-reduction.md` Source 12 ("Priority-based token allocation: Allocate token budget to high-value sections first."), `context-reduction.md` synthesis ("Target 0-8K tokens for optimal quality").

### 2. Composer section: Add tool filtering step

**Section:** "The Composer" (lines 109-127)
**What to change:** Insert a tool filtering step between steps 3 and 4 in the Composer's pipeline. See Critical to Edit #2 for the exact content.
**Why (citing research):** `context-reduction.md` Source 11 (RAG-MCP: 3x accuracy improvement from 50% fewer tool tokens), `minimal-context-max-quality.md` Source 13 (MLOps Community: tool selection maximally impacted by bloat).

### 3. Hard Design Constraints table: Add reasoning degradation threshold

**Section:** Hard Design Constraints table (lines 46-67)
**What to add:** New row:
```
| Input reasoning degradation threshold | ~3,000 tokens | MLOps Community 2025, Vahu.org 2025 |
```
**Why (citing research):** `minimal-context-max-quality.md` Sources 12 and 13 both independently report reasoning degradation at 2,500-3,000 tokens. This is distinct from the 4K *output* cliff already in the table. Input and output thresholds are different constraints.

### 4. Batch Execution section: Specify handover structure

**Section:** "Batch Execution and Session Handover" (lines 358-361) and "Mode 2: Run Incomplete" (lines 525-531)
**What to add:** Mandatory handover section structure. See Critical to Edit #3 for the exact content.
**Why (citing research):** `prompt-compression.md` Source 12 (Factory AI: structured summaries scored 3.70 vs Anthropic 3.44 vs OpenAI 3.35), `context-engineering-discipline.md` Source 6 (Manus: structured, append-only rolling summaries).

### 5. Subtask pipeline, Execute stage: Add re-grounding instruction

**Section:** "Stage 1: Execute" (lines 272-281)
**What to add:** After the executor reads subtask.md, add: "The executor's first action is to restate the acceptance criteria and key constraints from the subtask brief before beginning implementation. This re-grounding mitigates context length degradation."
**Why (citing research):** `context-degradation.md` (Du et al.: recite-then-solve improves from 35.5% to 66.7% at 26K context), `llm-attention-patterns.md` Source 6 (Du et al.: up to 4% improvement on GPT-4o).

### 6. Principles section: Add context budget principle

**Section:** Principles (lines 579-603)
**What to add:** New principle: "**25. Context is budgeted, not accumulated.** Every prompt section has an explicit token allocation. The total prompt stays under 12K tokens. Subtasks requiring more context are decomposed further."
**Why (citing research):** `context-engineering-discipline.md` Source 3 (Anthropic: "Good context engineering means finding the smallest possible set of high-signal tokens"), `context-reduction.md` synthesis ("The goal is not to fill the context window -- it is to deliver the minimum viable context with maximum signal-to-noise ratio"), `minimal-context-max-quality.md` Source 10 (Factory: "Treat context the way operating systems treat memory and CPU cycles: as finite resources to be budgeted").

### 7. Design Decisions table: Add tool filtering rationale

**Section:** "Design Decisions (Do Not Revisit Without Evidence)" (lines 607-622)
**What to add:** New row:
```
| Tool definitions filtered per subtask | 3x accuracy gain from 50% fewer tool tokens (RAG-MCP 2025) | Learning data showing filtered tools cause missing-tool errors >5% |
```
**Why (citing research):** `context-reduction.md` Source 11 (RAG-MCP), `minimal-context-max-quality.md` Source 13. This is a strong enough finding to lock as a design decision.
