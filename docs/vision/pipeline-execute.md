# Part II: Execution Pipeline

> Parent document: `docs/vision/pipeline.md`

The plan produces a DAG of subtask files. This phase turns them into working code.

**Session boundary**: the execute phase starts in a fresh session. The clarify phase produces a handover artifact; the execute session consumes it. This prevents context rot accumulated during research, clarification, specification, design, and planning from degrading execution quality.

## The Subtask Pipeline

Each subtask runs through a fixed pipeline of subagent spawns. Every subagent gets fresh context (empty conversation + Composer-built prompt). The orchestrator (parent session) dispatches subagents, reads their outputs, and routes to the next step.

**Baseline SHA capture**: before dispatching the first executor for a subtask, the orchestrator captures `PRE_TASK_SHA=$(git rev-parse HEAD)`. This SHA scopes all review passes to the subtask's changes only (`--base $PRE_TASK_SHA`). Without this, the Reviewer/Verifier cannot distinguish the subtask's diff from prior work.

Three subagent roles, each with a Composer-built prompt:

- **Executor**: implements code via TDD, micro-commits, writes output to disk
- **Reviewer/Verifier**: reviews the diff against task dimensions AND runs deterministic verification (tests, types, lint, proof collection) in a single pass. Produces structured findings + verification evidence.
- **Cross-Model Reviewer/Verifier**: same as Reviewer/Verifier but additionally fires a cross-model review tool (Codex, Gemini, or any configured external model CLI) concurrently with verification. Merges cross-model findings + verification results into one output. Eliminates 64.5% self-correction blind spot.

### The Subtask Loop

```
Step 1: Executor          — TDD, implement, micro-commit
Step 2: Reviewer/Verifier — review dimensions + verification + proof
Step 3: Executor          — fix findings (if any)
Step 4: Reviewer/Verifier — second round (if step 2 had findings)
Step 5: Executor          — fix findings (if any)
Step 6: Cross-Model R/V   — cross-model review + verification (concurrent)
Step 7: Executor          — fix cross-model + verification findings (if any)
```

**Best case: 2 spawns** (executor → reviewer/verifier clean → done).
**Typical: 4-5 spawns.**
**Worst case: 7 spawns.**

After step 7, if issues remain: unresolved findings from step 6's output are written to `residuals-<subtask-id>.md`. No further retries. Residuals are collected and addressed in a cleanup pass after the batch, or escalated if CRITICAL. The final review phase (completion gate) sees all residuals.

Steps are skipped when unnecessary: if the Reviewer/Verifier in step 2 produces zero findings, steps 3-4 are skipped and the pipeline advances to step 6 (Cross-Model R/V). If step 6 produces zero findings, step 7 is skipped. The orchestrator reads each subagent's output and decides the next step.

Research basis for the loop structure:
- Rounds 1-2 capture 75% of review improvement (Yang et al. EMNLP 2025) — two Reviewer/Verifier rounds
- Cross-model review eliminates 64.5% blind spot (Tsui 2025) — cross-model pass
- Fresh context per subagent prevents context rot (39% multi-turn degradation, Laban et al.)
- Bounded retries prevent cost explosion (anti-pattern #1: infinite loop, 150x cost)

### Executor Subagent

The executor reads its Composer-built prompt (subtask spec + expertise modules + constraints), implements changes via TDD, micro-commits after each logical step (the granularity test: if the next step fails, can I roll back to this commit?), writes output and `subtask-status.json` to disk, and returns a summary to the orchestrator.

**Patch strategy**: agents write code via tool calls (structured edit tools), not raw diffs. Content-based anchoring (reference surrounding code, not line numbers). Linter gating on every edit (syntax validation before persisting). Layered fallback (edit tool → full-file write). For large files (300+), subtask planning prefers narrowly-scoped changes.

**Code organization awareness**: executors reason best about code they can hold in context. The Composer instructs executors to: follow the file structure defined in the subtask spec, keep each file to one clear responsibility, report DONE_WITH_CONCERNS if a file grows beyond the spec's intent rather than splitting on their own, and follow established patterns in existing codebases rather than restructuring code outside the subtask scope.

**Self-review before reporting**: before writing `subtask-status.json`, the executor performs a structured self-review: completeness (all acceptance criteria implemented?), quality (tests passing, code clean?), and honesty (any concerns or shortcuts hidden?). Self-assessment is untrustworthy as a gate — the Reviewer/Verifier is the real gate — but self-review catches low-hanging issues (missing tests, unfinished code) that would waste a full review cycle. The Composer embeds the self-review checklist in every executor prompt.

**Escalation permission**: the Composer explicitly tells executors that stopping is always acceptable. Specific STOP conditions: the task requires architectural decisions with multiple valid approaches, the executor can't find clarity after reading available context, the approach feels uncertain, the task involves restructuring the plan didn't anticipate, or the executor has been reading files without making progress. On escalation, the executor reports status BLOCKED or NEEDS_CONTEXT with: what it's stuck on, what it tried, and what kind of help it needs. Bad work is worse than no work.

**Deterministic analysis gating**: alongside linter checks, static analysis rules (pattern matching) run on every edit. On subtask completion (before writing status), a full project-scope deterministic analysis scan runs. Results written to `analysis-findings.json` alongside `subtask-status.json`.

**`analysis-findings.json` schema** (constrained decoding required):

```
{
  "findings": [{
    "id": "<subtask-id>-<seq>",
    "category": "lint | type_error | security | complexity | dead_code | style",
    "severity": "critical | high | medium | low",
    "file": "<path>",
    "line": <number>,
    "rule": "<rule-id>",
    "message": "<description>",
    "is_new": true | false
  }],
  "baseline_count": <number>,
  "new_count": <number>
}
```

**Delta semantics**: the scan compares against a baseline snapshot taken before the subtask started. `is_new: true` marks findings introduced by this subtask. `is_new: false` marks pre-existing findings. Reviewers classify only `is_new: true` findings — pre-existing findings are informational context, not subtask failures.

**Secrets gating on every commit**: pattern matching + entropy analysis. Detected secrets block the commit and trigger a fresh fix executor. Not LLM-based. Part of the micro-commit checkpoint flow: lint → static analysis → secrets scan → commit. Research basis: 39 million secrets leaked on GitHub in 2024. AI coding assistants show 40% higher secret leakage rate. Average credential breach cost: $4.88M.

**Hard limits**: max_steps (prevents infinite loops), max_cost (prevents runaway spending), max_wall_clock (wall-clock timeout per agent — detects blocking I/O, hung subprocesses, and infinite loops that max_steps cannot catch), max_output_tokens (4K instruction cliff — subtasks requiring more output are decomposed further in planning, or the executor writes incrementally via tool calls).

**External side effects invariant**: subtasks MUST NOT perform undeclared external side effects (database migrations, API calls, service deployments). All non-git side effects are declared in the subtask spec during planning. The orchestrator uses these declarations for: (1) provisioning compensation/rollback strategies before execution begins, (2) requiring idempotency keys (`{subtask_id}:{step}`) on declared side effects so retries are safe, (3) scoping blast radius on abandonment. Git commits are naturally idempotent and excluded from this requirement.

**Test-writing tradeoff**: research shows separate test agents get 91.5% vs 61% — a 30-point gap (AgentCoder, GPT-4). The root cause is the oracle problem: LLMs generate test oracles based on actual behavior rather than expected behavior (54.56% accuracy — coin flip). This pipeline has executors writing tests via TDD, compensated by: subtask provides EARS acceptance criteria as test specification (addressing the oracle problem by providing expected behavior as ground truth), Reviewer/Verifier independently validates test quality and catches tautological tests via mutation score analysis. If the learning system shows persistent test quality problems, escalate to a dedicated test-writing stage. The specific threshold belongs in verifier policy, not here.

### Reviewer/Verifier Subagent

A single subagent that performs both review and verification. Loaded with expertise: `always.reviewer` + `always.verifier` + `reviewer_modes.task-review` + stack antipatterns + auto modules + `quality/evidence-based-verification.md`.

**Two-stage review**: the review pass runs in two stages within the same subagent. Stage 1 (spec compliance): does the implementation match the subtask's acceptance criteria? This catches "built the wrong thing cleanly" before wasting time on code quality. Stage 2 (code quality): evaluates the diff against task-execution dimensions (correctness, tests, wiring, drift, quality). Stage 2 only runs after stage 1 passes — if the code implements the wrong spec, code quality review is premature. This separation prevents a class of waste where clean, well-tested code that implements the wrong requirement passes review.

**Dynamic security dimension injection**: the Reviewer/Verifier scans the diff for security-sensitive patterns (auth, token, password, session, SQL, fetch, upload, secret, API key, cookie, CORS, CSRF, JWT, OAuth, encrypt, decrypt, hash, salt). If patterns are detected, 6 security review dimensions (injection, auth bypass, data exposure, CSRF/SSRF, XSS, secrets leakage) are added to the standard 5 task-execution dimensions for that review. If no security patterns are detected, security dimensions are not loaded — this is targeted, not always-on.

**Commit discipline check**: before reviewing code quality, the Reviewer/Verifier checks that the diff scopes to a single subtask's changes. If uncommitted changes span multiple subtasks, the review is rejected immediately: "Split into per-task commits before review." This enforces the one-subtask-one-commit principle at review time, not just as a guideline.

Receives `analysis-findings.json` from the executor's deterministic scan — classifies each `is_new: true` finding as true positive, false positive, or needs-investigation.

**Finding attribution**: every finding is tagged by source — `[Internal]` for the Reviewer/Verifier's own findings, `[Codex]` for cross-model findings, `[Both]` for independently found by multiple sources. Attribution feeds the learning system (which model catches what) and helps the orchestrator weight findings.

**Verification pass**: type-aware verification. The Reviewer/Verifier detects the project type (web, API, CLI, library) and runs type-appropriate verification commands: web projects get build verification, API projects get endpoint checks, CLI projects get `--help` smoke tests, libraries get test/lint/type-check. All types run the full test suite, type checks, and linters. Evidence is collected as structured output, mapped to acceptance criteria, with any criterion lacking evidence flagged. Catches tautological tests (93% coverage / 58% mutation score gap). Reruns deterministic analysis on the final subtask state, confirms all `analysis-findings.json` findings are resolved.

**Agent behavior checks**: the Reviewer/Verifier checks the executor's behavior efficiency — if the executor performed excessive direct file reads without using the codebase index, or ran large commands (test runners, builds, linters) through native shell instead of context-mode tools when available, these are flagged as warning-level findings. Not blocking, but tracked for the learning system to improve future executor prompts.

**Supply chain verification** (conditional — only when the subtask modifies dependency manifests): verify all new packages exist in the official registry, check for known CVEs, verify lockfile changes correspond to manifest changes, flag packages younger than 14 days. Results included in `proof.json`. Research basis: AI agents hallucinate package names at 5.2-21.7% rates. Supply chain attacks grew 156% YoY. OWASP 2025 ranks supply chain #3.

Writes structured findings + `proof.json` to disk. Returns summary to orchestrator.

### Cross-Model Reviewer/Verifier Subagent

Same as Reviewer/Verifier but additionally invokes a cross-model review tool via Bash. The specific tool is determined by the `multi_tool.tools` configuration — Codex (`codex review`), Gemini, or any configured external model CLI. The principle is "different model family for blind spot diversity," not a specific vendor. Runs the cross-model tool and verification concurrently — both take time, running them in parallel within the subagent wastes no wall-clock.

Merges cross-model findings + own review findings + verification results into one structured output. All findings carry source attribution (`[Internal]`, `[Codex]`, `[Gemini]`, `[Both]`). Cross-model diversity (~9% accuracy gain, Lu et al.) catches errors that same-model review misses. This is the pipeline's primary defense against the 64.5% self-correction blind spot.

If the cross-model tool is unavailable (CLI not installed, API error), the subagent falls back to standard Reviewer/Verifier behavior. Unavailability is logged but does not block the pipeline.

### Subtask Complete

Subtask complete when the last Reviewer/Verifier or Cross-Model R/V subagent returns with zero findings and verification passed. Worktree ready for merge. Orchestrator unblocks dependents.

**Constrained decoding required for `subtask-status.json`**: 100% structural compliance vs 40-74.5% without. The host's structured output mechanism enforces the schema at generation time.

## Status Protocol (Constrained Decoding Required)

### Agent-Reported Status

Five status values reported by agents via constrained decoding. Each has a defined orchestrator response:

| Status | Meaning | Cause Codes | Response |
|--------|---------|-------------|----------|
| DONE | All AC met, verification passed | — | → Review stage |
| DONE_WITH_CONCERNS | Passed but flagging something | — | → Review stage (concerns become focus) |
| NEEDS_CONTEXT | Missing info subtask didn't provide | — | → Replan immediately |
| BLOCKED | External dependency / tooling issue | — | → Check dependency, wait or escalate |
| FAILED | Attempted and failed | `verification_failure`, `tool_failure`, `timeout`, `cost_limit`, `step_limit` | → Fix loop, then tier escalation |

TIMEOUT is a cause code within FAILED, not a separate status. When an agent exceeds max_wall_clock, the orchestrator kills the agent and enters the standard fix loop with timeout evidence. Heartbeat vs polling vs OS-level process timeout is an implementation choice — the vision specifies the timeout constraint, not the detection mechanism. The structured status payload includes an `error_cause` field (constrained to the cause codes above) that the orchestrator uses for routing and the learning system uses for pattern analysis.

DONE_WITH_CONCERNS is not a failure. Dependents proceed. Concerns accumulate and are checked at **two** points: at each batch boundary (prevents batch 1 concerns from poisoning batch 3) and before the completion gate.

Self-assessment is untrustworthy. Agents report verification command output as evidence. The orchestrator and reviewers determine truth.

### Orchestrator-Managed Lifecycle

The orchestrator tracks subtask lifecycle separately from agent-reported status. These states are set by the orchestrator, not by agents:

| Lifecycle State | Meaning | Trigger |
|----------------|---------|---------|
| `pending` | Subtask not yet started | Initial DAG state |
| `running` | Agent dispatched, awaiting status | Orchestrator dispatches agent |
| `completed` | Subtask pipeline finished successfully | Stage 4 (Done) reached |
| `abandoned` | Subtask will not be completed | Tier 2 replan exhausted + user declines, or user explicitly stops |
| `upstream_failed` | Blocked because a dependency was abandoned | Transitive dependency entered `abandoned` |
| `waiting_on_user` | Escalated, awaiting human input | BLOCKED or post-Tier-2 escalation |

## Parallel Execution

The DAG determines parallelism. Kahn's algorithm: all subtasks with zero unmet dependencies are eligible.

**Concurrency ceiling: 4.** Each in its own git worktree. No cross-talk.

**Merge conflicts are a planning failure.** File dependency matrix in the plan prevents same-file edits across parallel subtasks. Convergence-point files get auto-discovery refactoring in Task 0. Auto-discovery prevents file conflicts + worktree prevents folder conflicts = zero merge conflicts.

**Runtime isolation**: worktrees isolate files, not ports, databases, or services. For subtasks requiring runtime resources (dev servers, database connections, bound ports), the subtask spec must declare these requirements during planning. The orchestrator provisions isolation (e.g., per-worktree containers, database branches) based on declarations. Most coding subtasks need only file isolation; runtime isolation is the exception, not the default.

**Sequential merge**: one at a time, fast integration check after each. Full integration suite after every ~4 merges.

## Failure Handling

### Two Levels of Recovery

**Level 1: Subtask loop (bounded at 7 subagent spawns)**

The subtask loop (steps 1-7) handles all within-subtask recovery. Each executor spawn gets fresh context with the previous findings. The loop is bounded — after step 7, unresolved findings go to residuals. No infinite retries.

Cross-model review (step 6) is built into the loop, not a separate escalation tier. The 64.5% blind spot is addressed in every subtask, not only on failure.

**Level 2: Subtask-level escalation (orchestrator handles)**

When a subtask loop completes with unresolved CRITICAL residuals, or when a subagent reports FAILED/NEEDS_CONTEXT/BLOCKED:

- **Tier 1: Replan** — failure evidence + residuals to fresh planner, revised subtask. Max 1.
- **After Tier 1: Escalate to user** with evidence.

For NEEDS_CONTEXT: replan immediately. Retrying an underspecified brief won't help.

Total worst-case per subtask: 7 loop spawns + 1 replan + 7 replanned loop spawns = 15 invocations. Bounded and justified. Cross-model review is already embedded in the loop (step 6), so there is no separate cross-model escalation tier — that would be redundant.

**Residuals**: unresolved findings after step 7 are written to `residuals-<subtask-id>.md` with full context (finding, severity, file, line, what was attempted). Residuals with severity < CRITICAL do not block the subtask — they are collected and presented at the completion gate (final review phase). CRITICAL residuals trigger Level 2 escalation.

**Cascade**: subtask A fails, dependent B blocked. A recovers → B unblocks. A abandoned → all transitive dependents move to `upstream_failed`.

A subtask is abandoned when: (1) Tier 1 replan exhausted and user declines further attempts, or (2) user explicitly stops the subtask. There is no automatic abandonment — a human decision is always required because abandonment is irreversible within a run.

**Cost controls**: max_steps, max_cost, max_wall_clock per subagent. The 7-spawn loop cap prevents cost explosion at the subtask level. The orchestrator tracks total cost across all subtasks and can pause if budget thresholds are exceeded.

## Batch Execution and Session Handover

Execution may exceed a single session. The pipeline is pausable and resumable.

A batch is a set of subtasks completed within one session. Boundaries align with DAG wave boundaries. At each boundary, the orchestrator produces a handover: what's completed, what's remaining, accumulated concerns, learnings, and a resume prompt (~500 tokens) that a new session consumes to continue.

**Handover required fields**:
- Completed subtask IDs with final status
- Remaining DAG state (pending subtasks with dependency status)
- Accumulated concerns from DONE_WITH_CONCERNS subtasks
- Blocked subtasks with reasons and current lifecycle state
- Active learnings discovered during this batch
- Environment state (active branches, worktrees, any provisioned runtime isolation)
- Resume instruction (~500 tokens — if it exceeds this, the handover contains details the next agent can discover from code)

**Fresh-session resume**: batch resume MUST use a fresh session consuming the handover artifact. Host session restore (reopening a previous conversation) reintroduces context rot and violates the "agents are stateless workers" principle. The handover artifact IS the context — nothing else carries over.

**Event log growth**: for long-running projects (100+ subtasks), the event log should be segmented per batch with a batch-level summary. This prevents replay performance degradation and keeps the audit trail navigable. Full event history is preserved on disk; the orchestrator reads only the current batch segment plus batch summaries from prior batches.
