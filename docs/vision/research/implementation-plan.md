# Implementation Plan: Apply 7 Changes to pipeline.md

> Source: `docs/vision/research/design-plan.md` (reviewed: Pass 1, Pass 2, Codex cross-model — all clean)
> Target: `docs/vision/pipeline.md` (628 lines)
> Reviews: Pass 1 (3C/6H — fixed), Pass 2 (2H/3M — fixed), Codex GPT-5.4 (4H/1M/1L — fixed)

## Application Order (by EDIT number)

Edits are numbered in dependency order. Apply sequentially: **Edit 1 → Edit 2 → Edit 3 → Edit 4 → Edit 5 → Edit 6 → Edit 7**.

- Edit 1 (Codebase Intelligence) is independent
- Edit 2 (Enforcement Invariants) depends on Edit 1 (inserts after it)
- Edit 3 (Subagent Contract) is independent
- Edit 4 (Hybrid Verification) depends on Edit 2 (inserts after it)
- Edit 5 (Security Gates) depends on Edit 4 (extends content it adds)
- Edit 6 (Wall-Clock Timeout) is independent
- Edit 7 (Design Decisions Table) is independent but references content from Edits 2, 4, 5

## What This Plan Does NOT Change

- No existing text deleted or modified unless explicitly marked as "MODIFY"
- No stages added, removed, or reordered — 4-stage pipeline preserved
- No principles removed or weakened
- No interaction model changes

---

## Edit 1: Codebase Intelligence (Design Change 1)

**Target**: Architecture section, after "The Composer" subsection.

**Anchor text**: Insert after the line ending with `"Expertise modules ARE the domain knowledge — Wazir's moat"` (currently the last line of The Composer subsection). New subsection goes between The Composer and User Interaction Model.

**INSERT new subsection**:

```markdown
### Codebase Intelligence

The pipeline's retrieval layer. Deterministic CLI tooling, not LLM-based. Three indexed layers:

- **L1 Structural**: AST-based parsing for every supported language. Produces: dependency graph (import/export edges), symbol table (functions, classes, types with locations), repo map ranked by dependency centrality (~5-10% of context budget, delivered to every agent via the Composer).
- **L2 Text**: Trigram index for exact and fuzzy text search. Fast keyword lookup without LLM involvement.
- **L3 Semantic** (optional): AST-aware chunking with code-specific embeddings. Used when L1+L2 are insufficient for localization (ambiguous names, cross-cutting concerns). Not required for every project.

Incremental refresh via content hashing per file. Cost is O(changes), not O(repo). Agents consume index results via the Composer's context budget directives — READ FULL (with line count), READ SECTION (with ranges), KNOW EXISTS. The repo map is always included. File-level retrieval uses L1 graph traversal for dependency-driven scope, L2 for keyword search within scope.

Research basis: Aider repo map uses 4.3-6.5% of context vs 54-70% for iterative search agents. Hybrid retrieval (structural + text) improves recall 15-30%. AST-based chunking improves Recall@5 by 4.3 points over line-based. Deterministic AST graphs are 70x faster and 20x cheaper than LLM-extracted.
```

**MODIFY Phase 1 DISCOVER agent descriptions**:

Find the line containing `Agent 2: Codebase indexing (or refresh)` and replace with:
> Agent 2: Deterministic index refresh (L1 structural + L2 text + optionally L3 semantic)

Find the line containing `Agent 3: Identify affected scope in codebase` and replace with:
> Agent 3: Graph-based dependency traversal from changed entry points to affected modules

---

## Edit 2: Enforcement Invariants (Design Change 3)

**Target**: Architecture section, after the new "Codebase Intelligence" subsection from Edit 1.

**Anchor text**: Insert after the last line of the Codebase Intelligence subsection (the research basis paragraph ending with "20x cheaper than LLM-extracted").

**INSERT new subsection**:

```markdown
### Enforcement Invariants

The vision describes desired architecture. This section specifies what mechanically forces compliance. Without mechanical enforcement, prompt-only compliance caps at ~40-50% for complex pipelines (5 production sessions confirmed 40%). Compound probability: at 95% per-step compliance, a 10-step pipeline succeeds 59% of the time. At 99% per-step, 90%. Mechanical enforcement targets 99%+.

**Capability Restrictions** (what agents CAN do):
1. The orchestrator MUST NOT have Write/Edit tools — tool allowlist enforcement prevents the orchestrator from doing work inline
2. Bash MUST be restricted via per-phase command allowlists — unrestricted Bash defeats all tool restrictions
3. Agents MUST NOT be able to modify their own constraints — no self-referential tool access

**Process Gates** (what MUST happen before proceeding):
4. Pipeline state MUST be created by a mechanical gate (hook/bootstrap), not by the agent — the gate's existence proves the pipeline is running
5. Every phase gate MUST have a mechanical check: artifact exists + schema valid + state updated. No phase advances on agent self-report alone

Known limitations: hooks fail-open on crash (the orchestrator must handle hook failure as a blocking error, not silently proceed). Semantic evasion via Bash exists (agent encodes commands as strings). Hooks cannot modify tool input, only block tool calls. Documented so implementers design around them.

Research basis: PCAS (ICSE 2026) — deterministic reference monitor raised compliance from 48% to 93%. Bootstrap gate was the breakthrough that enabled first autonomous pipeline following.
```

---

## Edit 3: Structured Summary Schema (Design Change 4)

**Target**: Architecture → "The Subagent Contract" subsection.

**Anchor text**: Find the line containing `**Returns a summary to the orchestrator**` (bold, with list prefix `2.`). Insert the new content as a new paragraph immediately after this line.

**INSERT after anchor**:

```markdown
Subagent summaries require a mandatory schema enforced via constrained decoding, same as status.json. The schema must include: completion status, output artifact locations, key decisions made (max 3), files modified, open questions, blocking issues (required for routing NEEDS_CONTEXT/BLOCKED/FAILED), and downstream impacts. Mandatory fields act as a checklist — the summarizer cannot silently drop file paths or decisions. The specific field-level schema is defined in the subagent contract implementation spec.

Research basis: Factory AI — structured summaries with mandatory sections scored 0.35 points higher on factual retention. "Dedicated sections act as a checklist."
```

---

## Edit 4: Hybrid Verification Architecture (Design Change 2)

**Target**: Architecture section, after the new "Enforcement Invariants" subsection from Edit 2.

**Anchor text**: Insert after the last line of the Enforcement Invariants subsection (the research basis paragraph ending with "first autonomous pipeline following").

**INSERT new subsection**:

```markdown
### Hybrid Verification Architecture

The review architecture is hybrid: deterministic tools + LLM reviewers. Not LLM-only.

- **Deterministic tools** handle known-pattern detection: static analysis rules, data flow patterns, known vulnerability signatures, code complexity metrics. Zero blind spot drift, millisecond execution, cheap. Results are authoritative for patterns they cover.
- **LLM reviewers** handle novel-pattern detection: semantic understanding, context-dependent quality assessment, design coherence, specification alignment. Expensive but catches what rules cannot express.
- **Interaction**: LLM reviewers receive deterministic tool findings as input context. They classify findings (true positive / false positive / needs-investigation) rather than independently discovering known patterns.

Specific tool choices are implementation decisions resolved via the Composer's config tables. The vision specifies the hybrid architecture pattern.

Research basis: hybrid LLM + traditional-tool approach is strictly superior to LLM-only. Semgrep Multimodal: 8x more true positives, 50% less noise. Combined SAST + LLM filtering eliminates 94-98% of false positives. The 64.5% self-correction blind spot is shared across all LLM families — cross-model review diversifies LLM blind spots but cannot close a modality gap.
```

**ALSO: Expand Execute stage (6 precise sub-edits)**:

**Sub-edit 4a**: Find the Patch strategy paragraph in the Execute stage (starts with `**Patch strategy**:`). Insert a NEW paragraph immediately after it:

> Deterministic analysis gating: alongside linter checks, static analysis rules (pattern matching) run on every edit. On subtask completion (before writing status), a full project-scope deterministic analysis scan runs. Results written to `analysis-findings.json` alongside status.json.

**Sub-edit 4b**: Find the sentence `2-3 passes within one session` in the Review stage (Stage 2) description. Insert at the END of that paragraph (after "Writes structured findings."):

> Reviewer also receives `analysis-findings.json` from the deterministic scan — classifies each finding as true positive, false positive, or needs-investigation.

**Sub-edit 4c**: Find the Verify stage (Stage 3) section. Insert after the last sentence of the Verify stage description (ending with the coverage/mutation score reference), before the `### Stage 4: Done` heading:

> Verifier reruns deterministic analysis on the final subtask state, confirms all `analysis-findings.json` findings are resolved, and includes deterministic results in `proof.json` as verification evidence.

**Sub-edit 4d**: In Completion Stage 1 (Integration Verification), find the sentence listing what runs on merged main: `Full verification suite on merged main: test suite, type checking, lint, build.` MODIFY to:

> Full verification suite on merged main: test suite, type checking, lint, build, and full deterministic analysis scan producing merged `analysis-findings.json` (catches cross-subtask issues invisible per-subtask).

**Sub-edit 4e**: In Completion Stages 3-7 (Final Review), find the "Inputs" list that starts with `Merged implementation on main`. Add two new bullets at the end of this list:

> - All per-subtask `analysis-findings.json` files (deterministic analysis evidence from execution)
> - Merged `analysis-findings.json` from Integration Verification (deterministic analysis on combined main)

**Sub-edit 4f**: In the Output Structure tree, add `analysis-findings.json` to the integration output section (under `completion/integration/`) and add a prose note after the tree:

> Per-subtask worktrees also contain `analysis-findings.json` (deterministic analysis results) alongside existing `status.json`, `findings.md`, and `proof.json`. The merged Integration Verification analysis is at `completion/integration/analysis-findings.json`.

---

## Edit 5: Security Gates (Design Change 5)

**Target**: Two locations — Execute stage and Verify stage.

**Sub-edit 5a (Execute — secrets gating)**: Find the new "Deterministic analysis gating" paragraph added by Edit 4 (sub-edit 4a). Insert a NEW paragraph immediately after it:

> Secrets gating on every commit: pattern matching + entropy analysis. Detected secrets block the commit and trigger a fresh fix executor. Not LLM-based. Part of the micro-commit checkpoint flow: lint → static analysis → secrets scan → commit. Research basis: 39 million secrets leaked on GitHub in 2024. AI coding assistants show 40% higher secret leakage rate. Average credential breach cost: $4.88M.

**Sub-edit 5b (Verify — supply chain)**: Find the new verifier sentence added by Edit 4 (sub-edit 4c). Insert a NEW paragraph after it:

> Supply chain verification (conditional — only when the subtask modifies dependency manifests): verify all new packages exist in the official registry, check for known CVEs, verify lockfile changes correspond to manifest changes, flag packages younger than 14 days. Results included in `proof.json`. Supply chain validation is independent proof generation — it belongs in Verify, not Execute, because the stage that introduces dependencies should not also validate them. Research basis: AI agents hallucinate package names at 5.2-21.7% rates. Supply chain attacks grew 156% YoY. OWASP 2025 ranks supply chain #3.

---

## Edit 6: Wall-Clock Timeout (Design Change 6)

**Target**: Four locations.

**Sub-edit 6a (Execute hard limits)**: Find the sentence containing `max_steps (prevents infinite loops), max_cost (prevents runaway spending)`. INSERT `max_wall_clock` after `max_cost (prevents runaway spending),` and before `max_output_tokens`. Leave the rest of the sentence unchanged. The inserted text:

> , max_wall_clock (wall-clock timeout per agent — detects blocking I/O, hung subprocesses, and infinite loops that max_steps cannot catch),

**Sub-edit 6b (Status Protocol)**: MODIFY the FAILED row meaning from `Verification failed` to `Attempted and failed (verification failure, timeout, or tool/runtime failure)`. Then add a note after the table:

> TIMEOUT is a cause code within FAILED, not a separate status. When an agent exceeds max_wall_clock, the orchestrator kills the agent and enters the standard fix loop with timeout evidence. The structured status payload includes an error cause field that distinguishes timeout from other failure types. Heartbeat vs polling vs OS-level process timeout is an implementation choice — the vision specifies the timeout constraint, not the detection mechanism.

**Sub-edit 6c (Failure Handling)**: Find the cost controls sentence containing `max_steps, max_cost, max_retries`. MODIFY to:

> max_steps, max_cost, max_wall_clock, max_retries per agent.

**Sub-edit 6d (Principle 23)**: Find Principle 23 containing `max_steps, max_cost, max_retries`. MODIFY to:

> **Cost controls are structural.** max_steps, max_cost, max_wall_clock, max_retries. Cheap before expensive.

---

## Edit 7: Design Decisions Table (Design Change 7)

**Target**: "Design Decisions (Do Not Revisit Without Evidence)" table.

**Anchor text**: Find the last row of the table (currently `Executor writes tests (TDD) not separate agent`). Append 4 new rows:

| Decision | Rationale | Override Condition |
|----------|-----------|-------------------|
| Hybrid deterministic + LLM review | LLMs hallucinate data flow paths; 64.5% blind spot is cross-model; deterministic tools have zero drift for known patterns | Never — modality gap is structural |
| Mechanical enforcement required | Prompt-only caps at 40-50%; compound probability demands 99%+ per-step | Never — the math doesn't change |
| Secrets gating on every commit | LLM-generated code leaks 40% more; $4.88M average breach cost | Never — liability concern |
| Supply chain verification on dependency changes | 5-21% package hallucination rate; +156% YoY supply chain attacks | Never — security boundary |

---

## Verification After All Edits

After applying all 7 edits, verify:

1. **Architecture subsections**: count `###` headings between `## Architecture` and `# Part I: Pre-Execution Pipeline`. Should be original count + 3 (Codebase Intelligence, Enforcement Invariants, Hybrid Verification Architecture).
2. **Status values**: grep for `DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED | FAILED` — still 5 status values, unchanged.
3. **TIMEOUT**: grep for `TIMEOUT` — appears as a cause code description after the FAILED status table row, NOT as a sixth status value.
4. **analysis-findings.json**: grep for `analysis-findings.json` — should appear in 6 locations: Execute stage (4a), Review stage (4b), Verify stage (4c), Integration Verification (4d), Final Review inputs (4e), Output Structure note (4f).
5. **max_wall_clock**: grep for `max_wall_clock` — should appear in 4 locations: Execute hard limits (6a), Status Protocol TIMEOUT note (6b), Failure Handling cost controls (6c), Principle 23 (6d).
6. **Design Decisions table**: count table rows — original 12 + 4 new = 16 total.
7. **Stage numbers**: grep for `Stage 1:`, `Stage 2:`, `Stage 3:`, `Stage 4:` — unchanged. No renumbering.
8. **DISCOVER agents**: grep for `Agent 2:` and `Agent 3:` — should show updated descriptions.
9. **Line count**: total lines should increase by ~60-75 from current 628.
