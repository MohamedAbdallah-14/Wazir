# Part II: Execution Pipeline

> Parent document: `docs/vision/pipeline.md`

The plan produces a DAG of subtask files. This phase turns them into working code.

## The Subtask Pipeline

Each subtask runs through a fixed sequential pipeline. Every stage is a separate agent with fresh context.

### Stage 1: Execute

The executor reads subtask.md, implements changes, micro-commits after each logical step (a test file written, a function implemented, a module wired up — the granularity test: if the next step fails, can I roll back to this commit?), runs verification criteria, writes output and status, dies.

**Patch strategy**: agents write code via tool calls (structured edit tools), not raw diffs. Content-based anchoring (reference surrounding code, not line numbers). Linter gating on every edit (syntax validation before persisting). Layered fallback (edit tool → full-file write). For large files (300+), subtask planning prefers narrowly-scoped changes.

**Deterministic analysis gating**: alongside linter checks, static analysis rules (pattern matching) run on every edit. On subtask completion (before writing status), a full project-scope deterministic analysis scan runs. Results written to `analysis-findings.json` alongside status.json.

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

**Delta semantics**: the scan compares against a baseline snapshot taken before the subtask started. `is_new: true` marks findings introduced by this subtask. `is_new: false` marks pre-existing findings. Reviewers classify only `is_new: true` findings — pre-existing findings are informational context, not subtask failures. Without this distinction, reviewers drown in baseline repo noise.

**Secrets gating on every commit**: pattern matching + entropy analysis. Detected secrets block the commit and trigger a fresh fix executor. Not LLM-based. Part of the micro-commit checkpoint flow: lint → static analysis → secrets scan → commit. Research basis: 39 million secrets leaked on GitHub in 2024. AI coding assistants show 40% higher secret leakage rate. Average credential breach cost: $4.88M.

**Hard limits**: max_steps (prevents infinite loops), max_cost (prevents runaway spending), max_wall_clock (wall-clock timeout per agent — detects blocking I/O, hung subprocesses, and infinite loops that max_steps cannot catch), max_output_tokens (4K instruction cliff — subtasks requiring more output are decomposed further in planning, or the executor writes incrementally via tool calls).

**Constrained decoding required for status.json**: 100% structural compliance vs 40-74.5% without. The host's structured output mechanism enforces the schema at generation time.

**External side effects invariant**: subtasks MUST NOT perform undeclared external side effects (database migrations, API calls, service deployments). All non-git side effects are declared in the subtask spec during planning. The orchestrator uses these declarations for: (1) provisioning compensation/rollback strategies before execution begins, (2) requiring idempotency keys (`{subtask_id}:{step}`) on declared side effects so retries are safe, (3) scoping blast radius on abandonment. Git commits are naturally idempotent and excluded from this requirement. This is consistent with "the plan IS the intelligence" — side effect management is a planning concern, not a runtime discovery.

If verification fails → fresh fix executor with error output. Max 3 fix attempts.

### Stage 2: Review

Reviewer (fresh context) loaded with expertise: `always.reviewer` + `reviewer_modes.task-review` + stack antipatterns + auto modules.

2-3 passes within one session: output vs acceptance criteria, output vs antipatterns, finding verification. Writes structured findings. Reviewer also receives `analysis-findings.json` from the deterministic scan — classifies each finding as true positive, false positive, or needs-investigation.

Cross-model pass if second model family available (~9% accuracy gain, eliminates 64.5% blind spot).

If findings → fresh fix executor. Max 2 review rounds (rounds 1-2 capture 75% of improvement). Persistent CRITICAL after round 2 likely indicates a planning gap — escalate.

**Test-writing tradeoff**: research shows separate test agents get 91.5% vs 61% — a 30-point gap (AgentCoder, GPT-4). The root cause is the oracle problem: LLMs generate test oracles based on actual behavior rather than expected behavior (54.56% accuracy — coin flip). This pipeline has executors writing tests via TDD, compensated by: subtask provides EARS acceptance criteria as test specification (addressing the oracle problem by providing expected behavior as ground truth), verifier (Stage 3) independently validates test quality and catches tautological tests via mutation score analysis. If the learning system shows persistent test quality problems (e.g., mutation scores consistently lagging coverage), escalate to a dedicated test-writing stage. The specific threshold belongs in verifier policy, not here.

### Stage 3: Verify

Verifier (fresh context) loaded with `always.verifier` + `quality/evidence-based-verification.md`.

Not the reviewer. The reviewer checks quality. The verifier generates proof.

Runs ALL verification criteria, collects output as evidence, maps to acceptance criteria, flags any criterion lacking evidence. Catches tautological tests (93% coverage / 58% mutation score gap).

Verifier reruns deterministic analysis on the final subtask state, confirms all `analysis-findings.json` findings are resolved, and includes deterministic results in `proof.json` as verification evidence.

**Supply chain verification** (conditional — only when the subtask modifies dependency manifests): verify all new packages exist in the official registry, check for known CVEs, verify lockfile changes correspond to manifest changes, flag packages younger than 14 days. Results included in `proof.json`. Supply chain validation is independent proof generation — it belongs in Verify, not Execute, because the stage that introduces dependencies should not also validate them. Research basis: AI agents hallucinate package names at 5.2-21.7% rates. Supply chain attacks grew 156% YoY. OWASP 2025 ranks supply chain #3.

### Stage 4: Done

Subtask complete. Worktree ready for merge. Orchestrator unblocks dependents.

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

**Cascade**: subtask A fails, dependent B blocked. A recovers → B unblocks. A abandoned → all transitive dependents move to `upstream_failed`.

A subtask is abandoned when: (1) Tier 2 replan exhausted and user declines further attempts, or (2) user explicitly stops the subtask. There is no automatic abandonment — a human decision is always required because abandonment is irreversible within a run.

**Cost controls**: max_steps, max_cost, max_wall_clock, max_retries per agent. Tier escalation tries cheap before expensive.

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
