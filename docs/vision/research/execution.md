# Execution — Research vs Vision Comparison

> Analysis of 22 research files in `docs/research/execution/` against `docs/vision/pipeline.md` (locked 2026-03-25).

---

## Strengths

The vision document is unusually strong for this category. Most execution research findings are directly incorporated, with explicit citations and numerical constraints. Specific alignments:

### 1. Fresh context per agent — fully grounded
The vision's "Agents Are Stateless Workers" section (lines 79-89) correctly incorporates the 39% multi-turn degradation (Laban et al.), the 64.5% self-correction blind spot (Tsui 2025), and the "no wake-up prompt can fix it" finding. The design override rejecting same-session fixes is the correct response to `context-rot-mitigation.md` and `execution-anti-patterns.md` (anti-pattern #10: Context Contamination). Research-to-vision alignment: exact.

### 2. File system as communication bus — matches handover research
`handover-protocols.md` documents that structured artifact-based handover is dominant for coding agents (Anthropic two-agent harness, BSWEN HANDOFF.md, MetaGPT typed documents). The vision's "Files are the only channel" (line 93) and "No agent-to-agent messages" directly implements the research recommendation. The ~500-token handover limit (line 531) matches BSWEN's finding that exceeding 500 tokens means including details the next agent can discover from code.

### 3. Constrained decoding for status — exactly right
`structured-output.md` shows 100% structural compliance with constrained decoding vs 40-74.5% without. The vision mandates this (lines 279, 307-318) and includes it as Principle 14. The A2A protocol status enum pattern maps cleanly to the vision's five status values.

### 4. Patch strategy — well-incorporated
The vision's patch strategy (line 275) correctly requires content-based anchoring (not line numbers), linter gating, and layered fallback — all three top findings from `patch-diff-strategies.md` and `patch-application.md`. The 300+ line accuracy cliff is reflected in the planning constraint for narrowly-scoped changes.

### 5. Merge conflict prevention — research-optimal
`merge-conflicts.md` identifies convergence-point files as the primary conflict source and auto-discovery as the solution. The vision's file dependency matrix + auto-discovery refactoring in Task 0 (lines 215-217) + sequential merge (line 331) implements all three prevention strategies. The concurrency ceiling of 4 (line 327) correctly falls within the research-identified 3-5 sweet spot.

### 6. MAKER decomposition — correctly applied
`maker-decomposition.md` proves m=1 is optimal, voting reduces error exponentially (k=3: 0.0001%), and small non-reasoning models suffice for decomposed tasks. The vision's "The plan IS the intelligence. Execution IS mechanical" principle (line 259, Principle 3) directly implements MAKER's core insight.

### 7. DAG scheduling — standard implementation
`dag-execution-engines.md` and the deep dive confirm Kahn's algorithm + level partitioning as universal. The vision uses exactly this (line 325).

### 8. Two-stage review — correctly identified as #1 factor
`code-review-effectiveness.md` identifies HubSpot's two-stage review (generate + judge) as the single most important architectural choice (90-99.76% reduction in time to first feedback). The vision implements this with separate executor and reviewer stages, cross-model passes for blind spot elimination (lines 286-291).

### 9. Anti-pattern coverage — comprehensive
`execution-anti-patterns.md` documents 15 failure modes and 3 meta-patterns. The vision addresses all three meta-patterns:
- Compound unreliability → bounded retry counts, tier escalation (lines 336-351)
- Self-assessment untrustworthiness → Principle 13, external verification (line 321)
- Architecture beats model capability → deterministic orchestrator, not LLM reasoning (lines 96-97)

### 10. Prompt engineering — well-incorporated
`executor-prompts.md` findings on ~150-200 instruction budget, positive instructions over negative, operational identity over expert personas, three agentic pillars, and XML structured tags are all present in the Composer section (lines 109-127).

### 11. Model routing — correctly implemented
`model-routing.md` recommends config-driven routing as #1 (deterministic, auditable, no drift). The vision uses exactly this: "Maps model tier to host-specific model ID via config table" (line 117). The tier escalation strategy (cheap before expensive, line 355) matches the cascade pattern.

### 12. Context rot mitigations — critical instructions at START and END
`context-rot-mitigation.md` confirms Lost in the Middle is architectural (Chowdhury 2026). The vision places critical instructions at START and END of prompts (line 123), matching the prompt repetition research (47/70 wins, 0 losses).

---

## Weaknesses

### 1. Separate test agent finding underweighted
**Research says**: `tdd-for-ai-agents.md` — AgentCoder achieves 91.5% test accuracy with a separate test agent vs 61% combined. This is a 30-point gap. The research calls this a "nearly doubled" accuracy improvement. The oracle problem is real: LLMs generate oracles based on actual behavior (54.56% accuracy — coin flip).

**Vision says**: "This pipeline has executors writing tests via TDD, compensated by: subtask provides EARS acceptance criteria as test specification, verifier (Stage 3) independently validates test quality" (lines 293-294). The vision acknowledges the tradeoff and defers to learning system data.

**Gap**: The vision treats this as a valid tradeoff when the research data is quite strong. The compensating controls (EARS criteria + verifier) are untested. The 30-point accuracy gap is large enough that the "compensated by" argument needs empirical validation before it can be trusted. The design decisions table (line 622) correctly identifies the override condition but doesn't acknowledge the magnitude of the gap.

### 2. Observation masking not mentioned
**Research says**: `context-rot-mitigation.md` — JetBrains found observation masking (trimming old tool outputs with placeholders, keeping action/reasoning history) beats LLM summarization. Qwen3-Coder: +2.6% solve rate AND 52% cheaper. In 4/5 settings, masking was cheaper and performed better.

**Vision says**: Nothing. The vision discusses context budgeting in the Composer (line 127) and anchored iterative summarization is absent. No mention of how tool outputs are managed within a subagent's session.

**Gap**: Subagents that use tools heavily (executor, reviewer) will accumulate tool outputs within their single session. Even though sessions are short, tool-heavy executors can fill context fast. The vision has no guidance on within-session context management.

### 3. Heartbeat/liveness detection absent
**Research says**: `state-management.md` — heartbeat pattern with interval + timeout for detecting stuck/hung agents. Wait for 3 consecutive misses before declaring failure. Advanced: failure suspicion scoring based on historical patterns.

**Vision says**: Nothing about detecting stuck agents. The status protocol (lines 307-318) handles agents that report status but not agents that go silent. max_steps and max_cost (line 277) bound cost but not time — a hung agent burns wall-clock time without hitting step limits.

**Gap**: An agent stuck in a tool call (e.g., waiting for a network request, a hung subprocess) won't increment steps or cost. The orchestrator has no mechanism to detect this. This is especially important for the executor stage which runs shell commands.

### 4. Idempotency not addressed
**Research says**: `rollback-recovery.md` — every external write must carry an idempotency key (`{workflow_id}:{step_name}`). Without this, retries create duplicates.

**Vision says**: The retry logic (lines 336-351) assumes retries are safe but doesn't specify idempotency. Fresh agents reading from disk and re-executing could create duplicate commits, duplicate file writes, or duplicate side effects.

**Gap**: The micro-commit checkpointing pattern helps (if a commit already exists, the work is done), but there's no general idempotency mechanism for non-git side effects.

### 5. Saga pattern / compensation not addressed
**Research says**: `rollback-recovery.md` — the saga pattern with compensating transactions is the standard for multi-step rollback. OpenStack TaskFlow provides `execute()` + `revert()` for every atom. Systems with dedicated saga participants reduce error rates by 76%.

**Vision says**: Rollback is implicit via git revert per-branch (line 354: "A abandoned → all transitive dependents abandoned"). No explicit compensation logic for partially-completed subtasks.

**Gap**: If a subtask partially completes (3 of 5 files modified, 2 commits made), the vision has no mechanism to cleanly revert to pre-subtask state beyond "abandon the worktree." This works for git-tracked changes but not for any side effects (database migrations, API calls, etc.).

### 6. Runtime isolation gap not acknowledged
**Research says**: `worktree-patterns.md` — "Worktrees only isolate files, not ports, databases, or services." This is called out as the "Biggest Gap." Solutions include worktree-compose (per-worktree Docker stacks) and Neon branching (per-worktree database branches).

**Vision says**: Worktrees provide isolation (line 327). No mention of runtime isolation.

**Gap**: For web applications, two parallel subtasks might need to run dev servers, access databases, or bind to ports. File isolation alone is insufficient. This may not apply to all projects but is a gap for full-stack work.

### 7. Prompt repetition technique not specified
**Research says**: `context-rot-mitigation.md` — prompt repetition (duplicating the query/instructions) achieves 47/70 benchmark wins with 0 losses. Gemini Flash-Lite: 21.33% → 97.33%. No increase in generated tokens or latency.

**Vision says**: "Critical instructions at START and END" (line 123) captures the spirit but doesn't specify the technique. The README mentions "prompt repetition at boundaries — 47/70 wins, 0 losses" as a design decision, but the vision's Composer section doesn't specify HOW this works.

**Gap**: The Composer prompt assembly rules should explicitly include instruction repetition as a technique, not just positional placement.

### 8. Contract testing absent
**Research says**: `integration-testing.md` — Pact consumer-driven contract testing achieves 30% reduction in production incidents, 20% faster release cycles, defect leakage 9 → 2 per quarter. Type checking as integration verification (TypeScript Project References) catches cross-package breaking changes at compile time.

**Vision says**: Integration verification (Completion Stage 1, line 380) mentions "test suite, type checking, lint, build" but no contract testing between subtask interfaces.

**Gap**: Cross-subtask interface mismatches are explicitly called out as a concern (line 434: "do cross-subtask interfaces match?") but the verification mechanism is only full-suite testing. Contract testing would catch these earlier and more precisely.

### 9. The Architect/Editor split not considered
**Research says**: `patch-diff-strategies.md` — Aider's Architect mode (reasoning model describes solution, editor model converts to structured edits) achieves 85% on editing benchmark. "Splitting attention between problem-solving and format compliance degrades both tasks."

**Vision says**: The executor is a single agent that both reasons and edits (Stage 1, lines 272-282). The Composer assembles one agent per subtask.

**Gap**: The research shows a clear benefit to separating reasoning from editing. The vision's current executor combines both. This could be addressed within the Composer (model routing: reasoning model for planning, edit model for application) without changing the pipeline structure.

### 10. Devin's "1M trick" and context anxiety
**Research says**: `context-rot-mitigation.md` — Devin enables 1M context beta but caps at 200K. The model thinks it has runway, eliminating anxiety-driven shortcuts. "Model consistently underestimates how many tokens it has left."

**Vision says**: Nothing about context window perception management.

**Gap**: This is a cheap, zero-cost technique that could be implemented in the Composer's agent configuration. If agents believe they have more context than they actually need, they're less likely to take shortcuts.

### 11. Production system diversity not reflected in design alternatives
**Research says**: `production-systems.md` documents a scaffolding debate — heavy scaffolding (Augment, Replit, Amazon Q) vs minimal (mini-SWE-agent at 100 lines = 74%, Jules). Both deliver production results. Trend line favors simplification as models improve.

**Vision says**: Heavy scaffolding approach (8 pre-execution phases, multi-stage execution pipeline). No acknowledgment of the counter-evidence that minimal scaffolding can work.

**Gap**: This isn't necessarily wrong — Wazir optimizes for quality over cost, and heavy scaffolding serves that goal. But the vision should acknowledge the tradeoff and state why heavy scaffolding is chosen despite evidence that simpler approaches work for simpler tasks. The learning system could eventually identify tasks where lighter pipelines suffice.

### 12. Event sourcing complexity warning not reflected
**Research says**: `state-management.md` — Microsoft warns event sourcing is a "complex pattern that permeates through the entire architecture." Temporal has a hard limit of 51,200 events / 50MB per workflow.

**Vision says**: Uses event sourcing (line 144: "Append-only event log records every state transition"). The state management research note (lines 140-142) addresses SQLite vs files but doesn't address event sourcing complexity.

**Gap**: Minor. The vision's event sourcing is simpler than Temporal's (single-threaded, file-based). But a note on event history size limits would be prudent for long-running projects with many subtasks.

---

## Critical to Edit

### C1: Add wall-clock timeout / heartbeat for agents

**Research finding**: `state-management.md` — heartbeat pattern detects stuck/hung agents. `execution-anti-patterns.md` — infinite loop is anti-pattern #1, causes 150x cost explosion.

**Why critical**: max_steps and max_cost do not protect against an agent stuck in a tool call (network timeout, hung subprocess, infinite blocking I/O). The orchestrator will wait indefinitely. This is a liveness bug in the pipeline.

**Suggested edit**: Add to the "Hard limits" paragraph (line 277):
> `max_wall_clock` (prevents stuck agents — heartbeat timeout from state-management research). If an agent reports no progress for N minutes, the orchestrator kills it and routes to the fix loop.

Also add to the Status Protocol section: a `TIMEOUT` orchestrator-initiated status for agents that exceed wall-clock limits.

### C2: Specify within-session context management for tool-heavy agents

**Research finding**: `context-rot-mitigation.md` — observation masking beats summarization (JetBrains: +2.6% solve rate, 52% cheaper). `composition-engines.md` — Factory.ai identifies tool outputs as the biggest context budget risk.

**Why critical**: The executor agent makes many tool calls (file reads, edits, shell commands). Even within a single short session, tool outputs can fill the context window. The vision has no guidance on this. An executor working on a subtask with 10+ files could exhaust its effective context window (10-20% of nominal per BABILong) before completing.

**Suggested edit**: Add to the Composer section (after line 127), a "Within-session context management" rule:
> Tool output management: observation masking (trim old tool outputs, keep action/reasoning history) as default. The Composer configures max_tool_output_tokens per agent. Tool outputs exceeding this are truncated with a pointer to the full output on disk.

### C3: Add prompt repetition as explicit Composer technique

**Research finding**: `context-rot-mitigation.md` — prompt repetition achieves 47/70 benchmark wins, 0 losses. No cost increase. Gemini Flash-Lite: 21.33% → 97.33%.

**Why critical**: The vision references this finding in the Hard Design Constraints table and the README lists it as design decision #14, but the Composer's prompt assembly rules (lines 121-127) don't include it as a technique. The Composer is where this gets implemented. Without it, the implementation will miss this zero-cost improvement.

**Suggested edit**: Add to prompt assembly rules (after line 123):
> Prompt repetition: critical instructions appear at START, END, and before the task block. Zero-cost technique — 47/70 benchmark wins, 0 losses (Leviathan et al., Dec 2025). The Composer duplicates the constraint block.

---

## Nice to Have

### N1: Architect/Editor split for executors
`patch-diff-strategies.md` shows 85% accuracy with Architect mode vs lower with combined reasoning+editing. The vision could note this as a future Composer optimization: use a reasoning model to plan the edit, then a cheaper/faster model to apply it. Not blocking because the current executor approach works — this is an efficiency gain.

### N2: Contract testing between subtask interfaces
`integration-testing.md` shows 30% reduction in production incidents with Pact contract testing. The vision's integration verification catches interface mismatches at the end; contract tests would catch them earlier. This is a completion pipeline enhancement, not an execution pipeline gap.

### N3: DSPy-style compiled prompts
`composition-engines.md` — DSPy optimizer finds optimal instructions and few-shot examples, then caches compiled prompts. ReAct agent: 24% → 51% with DSPy optimization. The Composer could eventually compile and cache optimal prompts for frequently-used subtask types. Not blocking because the current declarative approach works.

### N4: NIST combinatorial testing for integration
`integration-testing.md` — all real-world failures triggered by maximum 4-6 way interactions. 20-700x reduction in test set size vs exhaustive. Could be used to generate smarter integration test suites in the completion pipeline.

### N5: Explicit acknowledgment of minimal scaffolding counter-evidence
`production-systems.md` documents that mini-SWE-agent (100 lines) achieves 74% on SWE-bench. The vision should note this in the Design Decisions table with something like: "Minimal scaffolding works for simple tasks; Wazir targets complex multi-file tasks where scaffolding value is highest." This makes the design choice explicit rather than leaving an apparent contradiction with production evidence.

### N6: Context window perception management
`context-rot-mitigation.md` — Devin's "1M trick" (model thinks it has more context than it needs). Zero-cost technique implementable in the Composer's model configuration. Minor but free improvement.

### N7: Saga pattern for non-git side effects
`rollback-recovery.md` — compensation transactions for side effects beyond git. Only relevant for subtasks that interact with external systems (databases, APIs). Could be a future Composer concern module: `concerns.external-side-effects` that adds compensation logic.

### N8: Runtime isolation acknowledgment
`worktree-patterns.md` — worktrees don't isolate ports/databases/services. The vision could add a note in the parallel execution section: "Worktree isolation covers file-level isolation. For subtasks requiring runtime isolation (ports, databases), the subtask planning phase must declare this, and the orchestrator provisions containers." Not blocking because most coding subtasks don't need runtime isolation.

---

## Improvements

### I1: Add wall-clock timeout to Hard limits (CRITICAL)
**Section**: Part II > The Subtask Pipeline > Stage 1: Execute, line 277
**Change**: Add `max_wall_clock` to the hard limits list
**Add**:
> `max_wall_clock` (prevents hung agents; if no status update or tool call for N minutes, orchestrator kills the agent and enters fix loop). Derived from state-management research heartbeat pattern.
**Why**: `state-management.md` heartbeat pattern; `execution-anti-patterns.md` anti-pattern #1 (infinite loop). max_steps doesn't catch blocking I/O.

### I2: Add within-session tool output management to Composer
**Section**: Architecture > The Composer, after line 127
**Add new bullet to prompt assembly rules**:
> Within-session context management: observation masking for tool outputs (trim old outputs to placeholders, keep action/reasoning chain). The Composer sets `max_tool_output_tokens` per agent based on model tier and subtask complexity. Exceeding outputs are truncated with disk pointers. Based on JetBrains research: masking beats summarization in 4/5 settings, +2.6% solve rate AND 52% cheaper.
**Why**: `context-rot-mitigation.md`, `composition-engines.md` (Factory.ai tool output risk). Without this, executor agents on tool-heavy subtasks will hit effective context limits.

### I3: Add prompt repetition as explicit Composer technique
**Section**: Architecture > The Composer > Prompt assembly rules, after line 123
**Add**:
> Prompt repetition: critical constraints and acceptance criteria duplicated at prompt START, END, and immediately before the task specification. Zero-cost technique: 47/70 benchmark wins, 0 losses (Leviathan et al., Google Research, Dec 2025).
**Why**: `context-rot-mitigation.md`. Already in the README as design decision #14, but missing from the actual Composer specification where it gets implemented.

### I4: Add TIMEOUT status to Status Protocol
**Section**: Part II > Status Protocol, line 307
**Add row to status table**:
> | TIMEOUT | Agent exceeded max_wall_clock | → Same as FAILED (fix loop, then tier escalation) |
**Why**: Complements I1. Without a TIMEOUT status, a killed agent has no clean status path. The orchestrator needs to distinguish "agent failed" from "agent was killed for being stuck" for learning system analysis.

### I5: Strengthen the test-writing tradeoff documentation
**Section**: Part II > Stage 2: Review > "Test-writing tradeoff", line 293
**Change**: Add the magnitude of the gap and the specific risk
**Current**: "research shows separate test agents get 91.5% vs 61%"
**Replace with**:
> Research shows separate test agents get 91.5% vs 61% — a 30-point gap (AgentCoder, GPT-4). The oracle problem compounds this: LLMs generate test oracles based on actual behavior rather than expected behavior (54.56% accuracy — coin flip). This pipeline has executors writing tests via TDD, compensated by: subtask provides EARS acceptance criteria as test specification (addressing the oracle problem by providing expected behavior), verifier (Stage 3) independently validates test quality (catches tautological tests via the 93%/58% coverage/mutation gap). If the learning system shows test quality problems (mutation scores consistently below 70%), escalate to dedicated test-writing stage.
**Why**: `tdd-for-ai-agents.md`. The current text understates the gap and doesn't mention the oracle problem, which is the root cause. Adding a specific mutation score threshold makes the override condition measurable.

### I6: Add event log size limit note
**Section**: Architecture > State Management, after line 144
**Add**:
> Event log sizing: Temporal caps at 51,200 events / 50MB per workflow. For long-running Wazir projects (100+ subtasks), the event log should be segmented per batch with a batch-level summary. This prevents replay performance degradation and keeps the audit trail navigable.
**Why**: `state-management.md`, `dag-execution-engines-deep-dive.md` (Temporal). Minor but prevents a production surprise on large projects.

### I7: Add minimal-scaffolding acknowledgment to Design Decisions
**Section**: Design Decisions table, bottom
**Add row**:
> | Heavy scaffolding over minimal | mini-SWE-agent (100 lines) achieves 74% SWE-bench; minimal scaffolding trends upward as models improve | Learning data showing >90% SWE-bench on Wazir-class tasks without pipeline phases |
**Why**: `production-systems.md`. Makes the design choice explicit. Without this, the vision appears to ignore counter-evidence. The override condition is important — it acknowledges that future model improvements may reduce the need for heavy scaffolding.

### I8: Note Architect/Editor as future Composer optimization
**Section**: Architecture > The Composer, after prompt assembly rules
**Add**:
> Future optimization: Architect/Editor split. Research (patch-diff-strategies.md) shows 85% accuracy when a reasoning model describes the solution and an editor model applies it. "Splitting attention between problem-solving and format compliance degrades both tasks." The Composer could implement this by routing subtask reasoning to a frontier model and edit application to a fine-tuned apply model (Morph: 98% at 10,500 tok/s). Not implemented now because the current single-executor approach is simpler and the pipeline's review/verify stages catch edit failures.
**Why**: `patch-diff-strategies.md`, `patch-application.md`. This is a significant efficiency opportunity that should be documented even if not implemented immediately.

---

## Summary Assessment

The vision document is **strong** for the execution category. Of the 22 research files, approximately 15 are directly and correctly incorporated. The hard design constraints table captures the critical numbers. The architecture decisions (stateless agents, file-based communication, deterministic orchestrator, constrained decoding) are all research-optimal.

The three critical gaps (C1-C3) are all implementation-level omissions rather than architectural mistakes:
- **C1** (wall-clock timeout) is a liveness bug that will manifest in production
- **C2** (within-session tool output management) is a context management gap that will degrade executor quality on complex subtasks
- **C3** (prompt repetition specification) is a documentation gap — the technique is referenced but not specified where it gets implemented

None of these require rethinking the architecture. All are additive edits to existing sections.

The weaknesses are real but not alarming. The biggest design risk is the test-writing tradeoff (W1) — a 30-point accuracy gap is large, and the compensating controls are theoretical rather than empirically validated. The vision correctly identifies this as a design decision with a learning-system override, but the bar for escalation should be made measurable (I5).
