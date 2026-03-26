# Design Plan: Incorporating 7 Critical Research Findings into Pipeline Vision

> Source: `docs/vision/research/SYNTHESIS.md`
> Target: `docs/vision/pipeline.md`
> Constraint: All changes are ADDITIVE. No existing architecture decisions reversed. No new stages. No stage renumbering.
> Review: Pass 1 (2 CRITICAL, 4 HIGH, 4 MEDIUM, 3 LOW — all addressed), Pass 2 (clean), Codex cross-model (0 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW — all addressed below)

## Scope

7 logical changes to `pipeline.md`, mapped to specific sections. No deletions, no structural pipeline changes. The 4-stage subtask pipeline (Execute → Review → Verify → Done) is preserved. The "stage = agent with fresh context" invariant is preserved.

---

## Change 1: Add "Codebase Intelligence" Architecture Subsection (TC-1)

**What**: New subsection after "The Composer" in the Architecture section. Expands and defines the already-referenced L1/L2/L3 layers.

**Note**: Pipeline.md line 154 already references "L1/L2/L3" in the DISCOVER phase description. This change adds a subsection that specifies what each layer contains and how agents consume the index. Line 154 remains unchanged.

**Why**: 6/13 research categories independently identified that the retrieval layer is unspecified. The vision calls DISCOVER "Wazir's moat" but treats the indexing/retrieval subsystem as a black box. Localization failures are the principal failure mode in SWE-bench.

**Content**:
- Define the 3 layers already referenced:
  - L1 Structural: AST-based parsing, dependency graph, repo map ranked by dependency centrality
  - L2 Text: trigram search for exact/fuzzy matches
  - L3 Semantic: AST-aware chunking with code-specific embeddings (optional — only when L1+L2 insufficient)
- State: indexing is deterministic CLI tooling, not LLM-based
- Incremental refresh via content hashing (O(changes), not O(repo))
- Repo map (~5-10% of context budget) delivered to every agent via the Composer
- Agents consume index via context budget directives (READ FULL / READ SECTION / KNOW EXISTS)

**Also update**: Phase 1 DISCOVER — expand Agent 2 description from "Codebase indexing (or refresh)" to "Deterministic index refresh (L1 structural + L2 text + optionally L3 semantic)." Expand Agent 3 from "Identify affected scope in codebase" to "Graph-based dependency traversal from changed entry points to affected modules."

**Research basis**: Aider repo map uses 4.3-6.5% of context vs 54-70% for iterative search. Hybrid BM25+vector improves recall 15-30%. AST-based chunking improves Recall@5 by 4.3 points. Deterministic graphs 70x faster and 20x cheaper than LLM-extracted.

---

## Change 2: Add "Hybrid Verification Architecture" Principle + Expand Execute Stage (TC-2)

**What**: Two edits: (a) new Architecture subsection "Hybrid Verification Architecture" stating the principle, (b) expand Execute stage's completion protocol to include deterministic analysis alongside linter gating.

**Structure**: NO new stage. Deterministic analysis is folded into Execute as an extension of the existing "linter gating" pattern. The 4-stage pipeline (Execute → Review → Verify → Done) is unchanged.

**Why**: The pipeline relies entirely on LLM-based review. For data flow analysis, taint tracking, known vulnerability patterns, and code quality metrics, deterministic tools have zero blind spot drift. The 64.5% self-correction blind spot is shared across all LLM families — cross-model review diversifies LLM blind spots but cannot compensate for a modality gap.

**Content for Architecture subsection**:
- The review architecture is hybrid: deterministic tools + LLM reviewers, not LLM-only
- Deterministic tools handle known-pattern detection (zero blind spot drift, milliseconds, cheap)
- LLM reviewers handle novel-pattern detection (semantic understanding, context-dependent, expensive)
- LLM reviewers receive deterministic tool findings as input context — they classify (true positive / false positive / needs-investigation), not discover independently for known patterns
- Specific tool choices are implementation — the vision specifies the hybrid pattern

**Content for Execute stage expansion** (extend the existing "Patch strategy" / linter gating paragraph):
- After linter gating: static analysis rules (pattern matching) on every edit — extends the existing fast-gate pattern
- On subtask completion (before writing status): full project-scope deterministic analysis scan
- Results written to `analysis-findings.json` alongside status.json

**Artifact propagation** (deterministic findings flow through the full pipeline, not just Review):
- Stage 2 (Review): receives `analysis-findings.json` as input context for classification
- Stage 3 (Verify): reruns deterministic analysis on final state, confirms all findings resolved, includes deterministic results in `proof.json`
- Completion Stage 1 (Integration Verification): runs full deterministic analysis on merged main alongside test suite, typecheck, and lint
- Completion Stages 3-7 (Final Review): `analysis-findings.json` from all subtasks included in review inputs
- Output structure: `analysis-findings.json` added to per-subtask artifacts

**Research basis**: Semgrep Multimodal: 8x true positives, 50% less noise. Combined SAST + LLM filtering eliminates 94-98% of false positives. LLMs "hallucinate paths that do not exist" in call-graph analysis.

---

## Change 3: Add "Enforcement Invariants" Architecture Subsection (TC-3)

**What**: New subsection in Architecture section. Compound compliance math lives here, NOT in Principle 2.

**Why**: 5 production sessions proved 40% compliance without mechanical enforcement. Compound probability: 95% per-step across 10 steps = 59% end-to-end. Prompt-only ceiling: ~40-50%.

**Content**, organized in two categories:

**Capability Restrictions** (what agents CAN do):
1. Orchestrator MUST NOT have Write/Edit tools (tool allowlist)
2. Bash MUST be restricted via per-phase command allowlists
3. Agents MUST NOT be able to modify their own constraints

**Process Gates** (what MUST happen before proceeding):
4. Pipeline state MUST be created by mechanical gate (hook/bootstrap), not by agent
5. Every phase gate MUST have a mechanical check (artifact exists + schema valid + state updated)

**Known limitations**: hooks fail-open on crash, semantic evasion via Bash exists (agent encodes commands as strings), no input modification possible for hooks. These are documented so implementers design around them, not surprised by them.

**Compound compliance math**: "At 95% per-step compliance, a 10-step pipeline succeeds 59% of the time. At 99% per-step, 90%. Mechanical enforcement targets 99%+ per-step. Prompt-only compliance caps at ~40-50% for complex pipelines."

**Principle 2 remains unchanged** ("Every phase runs. No skipping."). The math and enforcement mechanics live in the Enforcement Invariants subsection where they belong.

**Research basis**: PCAS (ICSE 2026): deterministic reference monitor 48% → 93%. Bootstrap gate was breakthrough for first autonomous pipeline following.

---

## Change 4: Expand Subagent Contract with Structured Summary Schema (TC-4)

**What**: Expand "The Subagent Contract" section.

**Why**: The orchestrator routes on ~200-token summaries. Status.json has constrained decoding. Summaries don't. Inconsistency in the design's own logic.

**Content** (at vision abstraction level — categories, not field names):
- Subagent summaries require a mandatory schema enforced via constrained decoding, same as status.json
- The schema must include: completion status, output artifact locations, key decisions made (max 3), files modified, open questions, blocking issues (required for routing NEEDS_CONTEXT/BLOCKED/FAILED), and downstream impacts
- Mandatory fields act as a checklist — the summarizer cannot silently drop file paths or decisions
- The specific schema definition belongs in the subagent contract implementation spec

**Research basis**: Factory AI: structured summaries with mandatory sections scored 0.35 points higher on factual retention.

---

## Change 5: Add Deterministic Security Gates (TC-5 + TC-6)

**What**: Two security gates in their natural pipeline locations. Both are instances of the hybrid verification principle from Change 2.

**Why**: 100% of Wazir's output is LLM-generated. 40% higher secret leakage rate. AI agents hallucinate package names at 5-21%. Both gates are cheap and the downside of omission is catastrophic ($4.88M per credential breach, supply chain attacks +156% YoY).

**TC-5: Secrets gating — in Execute stage** (extends completion protocol):
- Pattern matching + entropy analysis on every commit
- Detected secrets block the commit and trigger a fresh fix executor
- Part of the micro-commit checkpoint flow: lint → static analysis → secrets scan → commit
- Belongs in Execute because secrets must be caught before code leaves the worktree

**TC-6: Supply chain verification — in Verify stage** (extends Stage 3):
- Conditional — only when subtask modifies dependency manifests
- Verify new packages exist in official registry, check for known CVEs, verify lockfile changes match manifest changes, flag packages younger than 14 days
- Belongs in Verify because supply chain validation is independent proof generation — the Verify stage's purpose. The same stage that writes `proof.json` also writes supply chain verification evidence. Execute should not both introduce dependencies and validate them — that violates the pipeline's execute/verify separation.

**Research basis**: 39M secrets leaked on GitHub in 2024. Slopsquatting: 5.2-21.7% hallucination rate. OWASP 2025 ranks supply chain #3.

---

## Change 6: Add Wall-Clock Timeout to Execute Stage Hard Limits (TC-7)

**What**: Add `max_wall_clock` alongside `max_steps` and `max_cost`. Add TIMEOUT as a cause code within FAILED status (not a separate status value).

**Why**: max_steps only increments on completed tool calls. A blocking call never completes and never increments. The orchestrator waits indefinitely. This is a liveness bug.

**Content**:
- `max_wall_clock`: wall-clock timeout per agent. Detects blocking I/O, hung subprocesses, and infinite loops that max_steps cannot catch.
- TIMEOUT is a cause code within FAILED, not a sixth status value. The error_type enum in status.json gains a `Timeout` entry. Orchestrator treats timeout as FAILED and enters the standard fix loop with timeout evidence.
- Heartbeat vs polling vs OS-level process timeout is an implementation choice — the vision specifies the timeout constraint. Specific retry policies (timeout doubling, escalation thresholds) belong in implementation.

**Also update**: Failure Handling section must list `max_wall_clock` alongside `max_steps` and `max_cost`. Principle 23 ("Cost controls are structural") must add `max_wall_clock` to its list.

**Research basis**: Infinite loop is anti-pattern #1 (150x cost explosion). Every production system (Temporal, Airflow, Prefect) has timeout detection.

---

## Change 7: Add New Design Decisions Table Entries

**What**: Add 4 entries to the "Design Decisions (Do Not Revisit Without Evidence)" table.

**Content**:

| Decision | Rationale | Override Condition |
|----------|-----------|-------------------|
| Hybrid deterministic + LLM review | LLMs hallucinate data flow paths; 64.5% blind spot is cross-model; deterministic tools have zero drift for known patterns | Never — modality gap is structural |
| Mechanical enforcement required | Prompt-only caps at 40-50%; compound probability demands 99%+ per-step | Never — the math doesn't change |
| Secrets gating on every commit | LLM-generated code leaks 40% more; $4.88M average breach cost | Never — liability concern |
| Supply chain verification on dependency changes | 5-21% package hallucination rate; +156% YoY supply chain attacks | Never — security boundary |

---

## Ordering Dependencies

- Changes 1, 3, 4, 7 are independent of each other
- Change 5 depends on Change 2 (secrets/supply-chain are instances of the hybrid verification principle)
- Change 6 must note cascading updates to Failure Handling and Principle 23
- Apply Change 2 before Change 5

Recommended order: 1, 3, 4, 2, 5, 6, 7

---

## What This Plan Does NOT Change

- No existing architecture decisions reversed
- No principles removed or weakened
- No stages added, removed, or reordered — the 4-stage pipeline stays
- No interaction model changes
- No cost architecture changes
- The "stage = agent with fresh context" invariant is preserved

## Estimated Impact on pipeline.md

- ~90-110 lines added across 7 changes
- 3 new Architecture subsections (Codebase Intelligence, Hybrid Verification, Enforcement Invariants)
- 1 expanded Architecture subsection (Subagent Contract)
- Execute stage expanded with: deterministic analysis, secrets gating, wall-clock timeout
- Verify stage expanded with: supply chain verification (conditional on dependency changes)
- Integration Verification expanded with: deterministic analysis on merged main
- Final Review inputs expanded with: per-subtask analysis-findings.json
- Output structure updated with: analysis-findings.json per subtask
- Failure Handling and Principle 23 updated with max_wall_clock
- 4 new Design Decisions table entries
- No stage renumbering
