# Part II: Execution Pipeline

> Parent document: `docs/vision/pipeline.md`

The plan produces a DAG of subtask files. This phase turns them into working code.

## The Subtask Pipeline

Each subtask runs through a fixed sequential pipeline. Every stage is a separate agent with fresh context.

### Stage 1: Execute

The executor reads subtask.md, implements changes, micro-commits after each logical step (a test file written, a function implemented, a module wired up — the granularity test: if the next step fails, can I roll back to this commit?), runs verification criteria, writes output and status, dies.

**Patch strategy**: agents write code via tool calls (structured edit tools), not raw diffs. Content-based anchoring (reference surrounding code, not line numbers). Linter gating on every edit (syntax validation before persisting). Layered fallback (edit tool → full-file write). For large files (300+), subtask planning prefers narrowly-scoped changes.

**Deterministic analysis gating**: alongside linter checks, static analysis rules (pattern matching) run on every edit. On subtask completion (before writing status), a full project-scope deterministic analysis scan runs. Results written to `analysis-findings.json` alongside status.json.

**Secrets gating on every commit**: pattern matching + entropy analysis. Detected secrets block the commit and trigger a fresh fix executor. Not LLM-based. Part of the micro-commit checkpoint flow: lint → static analysis → secrets scan → commit. Research basis: 39 million secrets leaked on GitHub in 2024. AI coding assistants show 40% higher secret leakage rate. Average credential breach cost: $4.88M.

**Hard limits**: max_steps (prevents infinite loops), max_cost (prevents runaway spending), max_wall_clock (wall-clock timeout per agent — detects blocking I/O, hung subprocesses, and infinite loops that max_steps cannot catch), max_output_tokens (4K instruction cliff — subtasks requiring more output are decomposed further in planning, or the executor writes incrementally via tool calls).

**Constrained decoding required for status.json**: 100% structural compliance vs 40-74.5% without. The host's structured output mechanism enforces the schema at generation time.

If verification fails → fresh fix executor with error output. Max 3 fix attempts.

### Stage 2: Review

Reviewer (fresh context) loaded with expertise: `always.reviewer` + `reviewer_modes.task-review` + stack antipatterns + auto modules.

2-3 passes within one session: output vs acceptance criteria, output vs antipatterns, finding verification. Writes structured findings. Reviewer also receives `analysis-findings.json` from the deterministic scan — classifies each finding as true positive, false positive, or needs-investigation.

Cross-model pass if second model family available (~9% accuracy gain, eliminates 64.5% blind spot).

If findings → fresh fix executor. Max 2 review rounds (rounds 1-2 capture 75% of improvement). Persistent CRITICAL after round 2 likely indicates a planning gap — escalate.

**Test-writing tradeoff**: research shows separate test agents get 91.5% vs 61%. This pipeline has executors writing tests via TDD, compensated by: subtask provides EARS acceptance criteria as test specification, verifier (Stage 3) independently validates test quality. If learning system shows test quality problems, a dedicated test-writing stage is the natural escalation.

### Stage 3: Verify

Verifier (fresh context) loaded with `always.verifier` + `quality/evidence-based-verification.md`.

Not the reviewer. The reviewer checks quality. The verifier generates proof.

Runs ALL verification criteria, collects output as evidence, maps to acceptance criteria, flags any criterion lacking evidence. Catches tautological tests (93% coverage / 58% mutation score gap).

Verifier reruns deterministic analysis on the final subtask state, confirms all `analysis-findings.json` findings are resolved, and includes deterministic results in `proof.json` as verification evidence.

**Supply chain verification** (conditional — only when the subtask modifies dependency manifests): verify all new packages exist in the official registry, check for known CVEs, verify lockfile changes correspond to manifest changes, flag packages younger than 14 days. Results included in `proof.json`. Supply chain validation is independent proof generation — it belongs in Verify, not Execute, because the stage that introduces dependencies should not also validate them. Research basis: AI agents hallucinate package names at 5.2-21.7% rates. Supply chain attacks grew 156% YoY. OWASP 2025 ranks supply chain #3.

### Stage 4: Done

Subtask complete. Worktree ready for merge. Orchestrator unblocks dependents.

## Status Protocol (Constrained Decoding Required)

Five status values, each with a defined orchestrator response:

| Status | Meaning | Response |
|--------|---------|----------|
| DONE | All AC met, verification passed | → Review stage |
| DONE_WITH_CONCERNS | Passed but flagging something | → Review stage (concerns become focus) |
| NEEDS_CONTEXT | Missing info subtask didn't provide | → Replan immediately |
| BLOCKED | External dependency / tooling issue | → Check dependency, wait or escalate |
| FAILED | Attempted and failed (verification failure, timeout, or tool/runtime failure) | → Fix loop, then tier escalation |

TIMEOUT is a cause code within FAILED, not a separate status. When an agent exceeds max_wall_clock, the orchestrator kills the agent and enters the standard fix loop with timeout evidence. The structured status payload includes an error cause field that distinguishes timeout from other failure types. Heartbeat vs polling vs OS-level process timeout is an implementation choice — the vision specifies the timeout constraint, not the detection mechanism.

DONE_WITH_CONCERNS is not a failure. Dependents proceed. Concerns accumulate and are checked at **two** points: at each batch boundary (prevents batch 1 concerns from poisoning batch 3) and before the completion gate.

Self-assessment is untrustworthy. Agents report verification command output as evidence. The orchestrator and reviewers determine truth.

## Parallel Execution

The DAG determines parallelism. Kahn's algorithm: all subtasks with zero unmet dependencies are eligible.

**Concurrency ceiling: 4.** Each in its own git worktree. No cross-talk.

**Merge conflicts are a planning failure.** File dependency matrix in the plan prevents same-file edits across parallel subtasks. Convergence-point files get auto-discovery refactoring in Task 0. Auto-discovery prevents file conflicts + worktree prevents folder conflicts = zero merge conflicts.

**Sequential merge**: one at a time, fast integration check after each. Full integration suite after every ~4 merges.

## Failure Handling

### Two Levels of Recovery

**Level 1: Stage-level fix loops (within a subtask pipeline)**
- Executor stage: verification fails → fresh fix executor, max 3 attempts
- Review stage: findings exist → fresh fix executor, max 2 review rounds

**Level 2: Subtask-level escalation (orchestrator handles)**

When the subtask pipeline exhausts stage-level loops and reports FAILED:

- **Tier 1: Different model** — cross-model, entire subtask pipeline reruns. Max 1.
- **Tier 2: Replan** — failure evidence to fresh planner, revised subtask. Max 1.
- **After Tier 2: Escalate to user** with evidence.

For NEEDS_CONTEXT: skip to Tier 2 (replanning). Retrying an underspecified brief won't help.

Total worst-case: 1 original + 3 executor fixes + 2 review rounds + 1 cross-model + 1 replan = 8 invocations. Bounded and justified.

**Cascade**: subtask A fails, dependent B blocked. A recovers → B unblocks. A abandoned → all transitive dependents abandoned.

**Cost controls**: max_steps, max_cost, max_wall_clock, max_retries per agent. Tier escalation tries cheap before expensive.

## Batch Execution and Session Handover

Execution may exceed a single session. The pipeline is pausable and resumable.

A batch is a set of subtasks completed within one session. Boundaries align with DAG wave boundaries. At each boundary, the orchestrator produces a handover: what's completed, what's remaining, accumulated concerns, learnings, and a resume prompt (~500 tokens) that a new session consumes to continue.
