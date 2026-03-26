---
name: wz:reviewer
description: Run the review phase — adversarial review of implementation against the approved spec, plan, and verification evidence.
---
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->

# Reviewer

## Model Annotation
When multi-model mode is enabled:
- **Sonnet** for internal review passes (internal-review)
- **Opus** for final review mode (final-review)
- **Opus** for spec-challenge mode (spec-harden)
- **Opus** for architectural-design-review mode (design)
- **Opus** for visual-design-review mode (visual design)

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

Run the Final Review phase — or any review mode invoked by other phases.

The reviewer role owns all review loops across the pipeline: research-review, clarification-review, spec-challenge, architectural-design-review, visual-design-review, plan-review, per-task execution review, and final review. Each uses phase-specific dimensions from `docs/reference/review-loop-pattern.md`.

**Key principle for `final` mode:** Compare implementation against the **ORIGINAL INPUT** (briefing + input files), NOT the task specs. The executor's per-task reviewer already validated against task specs — that concern is covered. The final reviewer catches drift: does what we built match what the user actually asked for?

**Reviewer-owned responsibilities** (callers must NOT replicate these):
1. **Two-tier review** — internal review first (fast, cheap, expertise-loaded), Codex second (fresh eyes on clean code)
2. **Dimension selection** — the reviewer selects the correct dimension set for the review mode and depth
3. **Pass counting** — the reviewer tracks pass numbers and enforces the depth-based cap (quick=3, standard=5, deep=7). Final mode uses a different structure: 2+1 passes (see Completion Pipeline section).
4. **Finding attribution** — each finding is tagged `[Internal]`, `[Codex]`, or `[Both]` based on source
5. **Dimension set recording** — each review pass file records which canonical dimension set was used, enabling Phase Scoring (first vs final delta)
6. **Learning pipeline** — ALL findings (internal + Codex) feed into `state.sqlite` and the learning system

## Review Modes

The reviewer operates in different modes depending on the phase. Mode MUST be passed explicitly by the caller (`--mode <mode>`). The reviewer does NOT auto-detect mode from artifact availability. If `--mode` is not provided, ask the user which review to run.

| Mode | Invoked during | Prerequisites | Dimensions | Output |
|------|---------------|---------------|------------|--------|
| `final` | After integration verification + concern resolution | All completion inputs (see Completion Pipeline section) | 7 final-review dims, 2+1 passes, scored 0-70 | Scored verdict with severity-based exit criteria (SHIP/SHIP WITH CAVEATS/DO NOT SHIP) |
| `spec-challenge` | After specify | Draft spec artifact, original input | 5 spec/clarification dims | Pass/fix loop, no score |
| `architectural-design-review` | After architectural design approval (Phase 5) | Design artifact, approved spec, original input | 6 architectural design-review dims | Pass/fix loop, no score |
| `visual-design-review` | After visual design approval (Phase 4a) | Visual design artifact, approved spec, original input | 5 visual design-review dims | Pass/fix loop, no score |
| `plan-review` | After planning | Draft plan artifact, original input | 8 plan dims (7 + input coverage) | Pass/fix loop, no score |
| `task-review` | During execution, per task | Uncommitted changes or `--base` SHA, original input | 5 task-execution dims (correctness, tests, wiring, drift, quality) | Pass/fix loop, no score |
| `research-review` | During discover | Research artifact, original input | 5 research dims | Pass/fix loop, no score |
| `clarification-review` | During clarify | Clarification artifact, original input | 5 spec/clarification dims | Pass/fix loop, no score |

Each mode follows the review loop pattern in `docs/reference/review-loop-pattern.md`. Pass counts are fixed by depth (quick=3, standard=5, deep=7). No extension.

### CHANGELOG Enforcement

In `task-review` and `final` modes, flag missing CHANGELOG entries for user-facing changes as **[warning]** severity. User-facing changes include new features, behavior changes, and bug fixes visible to users. Internal changes (refactors, tooling, tests) do not require CHANGELOG entries.

## Prerequisites

Prerequisites depend on the review mode:

### `final` mode

**Phase Prerequisites (Hard Gate):** Before proceeding, verify ALL of these artifacts exist. If ANY is missing, **STOP** and report which are missing.

- [ ] `.wazir/runs/latest/clarified/clarification.md`
- [ ] `.wazir/runs/latest/clarified/spec-hardened.md`
- [ ] `.wazir/runs/latest/clarified/design.md`
- [ ] `.wazir/runs/latest/clarified/execution-plan.md`
- [ ] `.wazir/runs/latest/artifacts/verification-proof.md`

If any file is missing:

> **Cannot run final review: missing prerequisite artifacts.**
>
> Missing: [list missing files]
>
> Run `/wazir:clarifier` (for clarified/* files) or `/wazir:executor` (for verification-proof.md) first.

1. Check `.wazir/runs/latest/artifacts/` has completed task artifacts. If not, tell the user to run `/wazir:executor` first.
2. Read the approved spec, plan, and design from `.wazir/runs/latest/clarified/`.
3. Read `depth` from `run-config.yaml`. Read `.wazir/state/config.json` for `multi_tool` settings.

### `task-review` mode
1. Uncommitted changes exist for the current task, or a `--base` SHA is provided for committed changes.
2. Read `depth` from `run-config.yaml`. Read `.wazir/state/config.json` for `multi_tool` settings.
3. **Commit discipline check:** If uncommitted changes span work from multiple tasks (e.g., files from task N and task N+1 are both modified), REJECT immediately: "REJECTED: Multiple tasks in single commit. Split into per-task commits before review." This is a blocking finding — no other dimensions are evaluated until resolved.
4. **Security sensitivity check:** Run `detectSecurityPatterns` from `tooling/src/checks/security-sensitivity.js` against the diff. If `triggered === true`, add the 6 security review dimensions (injection, auth bypass, data exposure, CSRF/SSRF, XSS, secrets leakage) to the standard 5 task-execution dimensions for this review pass. Security findings use severity levels: critical (exploitable), high (likely exploitable), medium (defense-in-depth gap), low (best-practice deviation).
5. **Pipeline vs standalone:** In-pipeline execution, `task-review` is handled by the subtask execution loop's Reviewer/Verifier steps — the orchestrator dispatches the loop, not this skill. This skill's `task-review` mode is for standalone/non-pipeline invocations only (e.g., manual review of uncommitted changes outside a pipeline run). See `docs/reference/review-loop-pattern.md` "Subtask Execution Loop" section.

### `spec-challenge`, `architectural-design-review`, `visual-design-review`, `plan-review`, `research-review`, `clarification-review` modes
1. The appropriate input artifact for the mode exists.
2. Read the original user input from `.wazir/input/briefing.md` and any `input/*.md` files. This is required for ALL review modes — it serves as the ground truth reference per Vision Principle 16.
3. Read `depth` from `run-config.yaml`. Read `.wazir/state/config.json` for `multi_tool` settings.
4. **`plan-review` additional dimension — Input Coverage:**
   - Read the original input/briefing from `.wazir/input/briefing.md` and any `input/*.md` files
   - List every distinct item/requirement in the original input
   - For each input item, check whether at least one task maps to it
   - If any input item has no mapped task → **HIGH** finding: "Input item '[item]' has no mapped task in the plan"
   - One task MAY cover multiple input items (vertical-slice) if justified in the task description
   - This is item-level traceability, not a count comparison — aligns with the scope coverage hard gate

## Review Process (`final` mode) — Completion Pipeline

**The final review is not another code review — it is a compliance audit with fix authority.**

The full completion pipeline runs three stages. The reviewer skill orchestrates all three.

### Integration Verification (Vision Stage 1)

Before any review pass, run the full verification suite on merged main:

1. **Plan-defined integration criteria**: run the exact commands specified in `.wazir/runs/latest/clarified/execution-plan.md` under "Integration verification criteria"
2. **Standard suite**: test suite, type checking, lint, build, and full deterministic analysis scan
3. **Side effects verification**: check all declared external side effects from subtask specs were completed or compensated. Undeclared side effects discovered here are CRITICAL findings.

If integration fails: identify the culprit via sequential merge record (re-run checks after each individual merge). Targeted fix executor receives failing output + acceptance criteria + merged code.

Save results to `.wazir/runs/latest/completion/integration/`.

### Concern Resolution (Vision Stage 2)

A fresh agent — one that did NOT produce any of the artifacts being evaluated — reads:

1. **Concern registry**: all DONE_WITH_CONCERNS entries from execution
2. **Residuals**: all `residuals-<subtask-id>.md` files from execution (findings that exhausted the 7-spawn subtask loop)
3. **Batch-boundary disposition**: concerns from final batch + cross-subtask systemic patterns

For each concern and residual, four questions:
1. Is the concern still valid? (Some become moot after later subtasks.)
2. Was the resolution acceptable? (Full implementation may change the picture.)
3. Does it map to a spec requirement? (If yes, cannot be dismissed as trade-off.)
4. Is it systemic? (3+ occurrences across subtasks = planning gap.)

**Principle: concerns are innocent until proven acceptable.** Burden of proof is on the resolution.

**Sycophancy guard**: the generating agent MUST NOT rebut or respond to reviewer concerns during this stage. Models abandon correct answers 98% of the time when challenged. If a concern is contested, route to human — not to agent debate.

Save results to `.wazir/runs/latest/completion/concerns/`.

### Final Review — 2+1 Passes (Vision Stages 3-6)

**Before starting, output to the user:**

> **Final Review** — About to run 2+1 pass compliance audit comparing your implementation against the original input. Pass 1: expertise-loaded internal review. Pass 2: cross-model fresh-context review. Pass 3 (conditional): reconciliation if passes disagree.
>
> **Why this matters:** Without this, implementation drift ships undetected. Per-task review confirms each task matches its spec, but cannot catch: tasks that collectively miss the original intent, scope creep, or acceptance criteria rewritten to match implementation.

#### Pass 1: Internal Review (Expertise-Loaded)

Composer-built prompt with `always.reviewer` + `reviewer_modes.final` + stack antipatterns + auto modules.

**Input:** All completion inputs — merged implementation, approved plan, approved spec, original user input, concern resolution output, all `proof.json` files, integration results, all `analysis-findings.json` files.

**Dual comparison:**
1. **Implementation vs Plan** (bidirectional): does each plan item have implementation? Are there files the plan didn't mention? Plan items with no code? Code no plan item requested?
2. **Implementation vs Original Input**: the telephone game check. Would the user recognize this as what they asked for? Drift measured from the source across all transformations.

**Three additional dimensions:**
3. **Concern & residual resolutions**: re-examine every resolution from Stage 2
4. **Verification evidence quality**: are tests meaningful or tautological? Every acceptance criterion covered by proof?
5. **Integration completeness**: do cross-subtask interfaces match? Data flow correct between modules?

Score each of the 7 canonical dimensions 0-10. Total out of 70. Additionally classify each finding by severity (CRITICAL/HIGH/MEDIUM/LOW).

Save to `.wazir/runs/latest/completion/final-review/pass-1-internal.md`.

#### Finding Severity (Final Review Specific)

| Severity | Meaning | Response |
|----------|---------|----------|
| CRITICAL | Implementation contradicts spec or original input | Targeted fix or escalate to user |
| HIGH | Significant drift or integration gap | Targeted fix |
| MEDIUM | Minor drift or quality gap | Document, fix if ≤10 lines |
| LOW | Style or convention divergence | Document for learning only |

#### Targeted Fixes (Between Passes 1 and 2)

- **CRITICAL/HIGH code issues** → fix executor batched by severity tier. All CRITICAL findings to one executor, all HIGH to another. Each executor receives all findings of its tier + relevant files + violated criteria. Batching prevents the "Death of a Thousand Round Trips" anti-pattern.
- **CRITICAL/HIGH drift** → escalate to user (pipeline can't decide user intent)
- **MEDIUM** → fix if ≤10 lines, otherwise document
- **LOW** → document only (regression risk exceeds value)

After fixes: commit, re-run integration verification (Stage 1). Fixed state becomes input for Pass 2.

**Finding adoption tracking**: after targeted fixes, record which findings led to code changes vs documented vs ignored. Write to `.wazir/runs/latest/completion/final-review/finding-adoption.md`. This is the learner's source data for adoption rate metrics.

#### Pass 2: Cross-Model Review (Fresh Session, Different Family)

Different model family from Pass 1. Selection priority:
1. Different vendor, highest tier (maximizes blind spot diversity)
2. Same vendor, different generation
3. Same vendor, same tier (last resort — still a fresh context)

**Input:** Deterministic inputs + concern resolution output — merged implementation, plan, spec, original input, `proof.json` files, integration results, `analysis-findings.json` files, concern resolution output. Pass 2 does NOT receive Pass 1's LLM-generated findings. Deterministic findings reduce hallucinations 60-80%. Prior LLM opinions cause self-conditioning. Note: concern resolution output is included despite being LLM-generated because it is a neutral evaluation by a fresh agent (not the producer's self-assessment) — the vision explicitly includes it in Pass 2's inputs.

Independent review. Same dual comparison (implementation vs plan vs original input). Also reviews concern resolutions and verification evidence independently.

If Codex/Gemini CLI is the cross-model tool: invoked via Bash in a fresh subagent session. Falls back to same-model fresh-context review if external tools unavailable.

Save to `.wazir/runs/latest/completion/final-review/pass-2-cross-model.md`.

#### Pass 3: Reconciliation (Conditional)

Runs ONLY if Passes 1 and 2 have conflicting CRITICAL or HIGH findings — one pass flagged an issue the other did not, or they disagree on severity/resolution.

A fresh agent reads both pass outputs and reconciles:
- **Both found it** → confirmed finding
- **Only one found it** → evaluate with code evidence. If substantiated, confirmed. If not, downgrade or remove.
- **Conflicting assessments** → escalate to user with both rationales

If Passes 1 and 2 agree (no conflicting CRITICAL/HIGH): skip Pass 3, merge findings with deduplication.

Save to `.wazir/runs/latest/completion/final-review/pass-3-reconciliation.md` (if run).

### Scoring and Exit Criteria

Score each dimension 0-10. Total out of 70.

| Verdict | Score | Action |
|---------|-------|--------|
| **PASS** | 56+ | Ready for SHIP sign-off |
| **NEEDS MINOR FIXES** | 42-55 | Auto-fix and re-review |
| **NEEDS REWORK** | 28-41 | Re-run affected tasks |
| **FAIL** | 0-27 | Fundamental issues |

**Verdict-to-sign-off mapping:** Score verdicts determine the *next action*. Sign-off labels (SHIP/SHIP WITH CAVEATS/DO NOT SHIP) are the *final disposition* after all actions complete. PASS with no remaining findings → SHIP. PASS with accepted MEDIUM/LOW → SHIP WITH CAVEATS. NEEDS REWORK or FAIL after all passes exhausted → DO NOT SHIP.

**Precedence rule**: a single unresolved CRITICAL finding prevents SHIP regardless of score. When score and blocking findings disagree, blocking findings win.

Full exit criteria:
- All CRITICAL findings resolved (including CRITICAL residuals from execution)
- All HIGH findings resolved or explicitly accepted by user
- MEDIUM/LOW documented in learning system
- Every spec requirement has implementation evidence
- No undetected drift (or drift explicitly approved)
- Cross-model reviewer has no unresolved CRITICAL/HIGH

If not met after Pass 3 (or Pass 2 when Pass 3 skipped): escalate to user with full finding history.

## Two-Tier Review Flow (Non-Final Modes)

The review process for non-final modes has two tiers. Internal review catches ~80% of issues quickly and cheaply. Codex review provides fresh eyes on clean code.

**Note:** Final mode uses the Completion Pipeline structure above (2+1 passes), not this two-tier flow. The two-tier flow applies to: task-review, spec-challenge, architectural-design-review, visual-design-review, plan-review, research-review, and clarification-review modes.

### Tier 1: Internal Review (Fast, Cheap, Expertise-Loaded)

1. **Compose expertise:** Load relevant expertise modules from `expertise/composition-map.yaml` into context based on the review mode and detected stack. This gives the internal reviewer domain-specific knowledge.
2. **Run internal review** using the dimension set for the current mode. When multi-model is enabled, use **Sonnet** (not Opus) for internal review passes — it's fast and good enough for pattern matching against expertise.
3. **Produce findings:** Each finding is tagged `[Internal]` with severity (blocking, warning, note).
4. **Fix cycle:** If blocking findings exist, the executor fixes them. Re-run internal review. Repeat until clean or cap reached.

Internal review passes are logged to `.wazir/runs/latest/reviews/<mode>-internal-pass-<N>.md`.

### Tier 2: External Review (Fresh Eyes on Clean Code)

Codex is one implementation of cross-model review. If `gemini` or other tools are in `multi_tool.tools`, follow the same pattern. The principle is "different model family for blind spot diversity," not a specific vendor.

Only runs AFTER Tier 1 produces a clean pass (no blocking findings).

Read `.wazir/state/config.json`. If `multi_tool.tools` includes external reviewers:

#### Codex Review

**For detailed Codex CLI usage, see `wz:codex-cli` skill.**

If `codex` is in `multi_tool.tools`:

1. Run Codex review against the current changes:
   ```bash
   CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null)
   CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}
   codex review -c model="$CODEX_MODEL" --uncommitted --title "Wazir review: <brief summary>" \
     "Review against these acceptance criteria: <paste criteria from spec>" \
     2>&1 | tee .wazir/runs/latest/reviews/codex-review.md
   ```
   Or if changes are committed:
   ```bash
   CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null)
   CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}
   codex review -c model="$CODEX_MODEL" --base <base-branch> --title "Wazir review: <brief summary>" \
     "Review against these acceptance criteria: <paste criteria from spec>" \
     2>&1 | tee .wazir/runs/latest/reviews/codex-review.md
   ```

2. **Extract findings only** (context protection): After tee, use `execute_file` to extract only the final findings from the Codex output (everything after the last `codex` marker). If context-mode is unavailable, use `tac <file> | sed '/^codex$/q' | tac | tail -n +2`. If no marker found, fail closed (0 findings, warn user). See `docs/reference/review-loop-pattern.md` "Codex Output Context Protection" for full protocol.
3. Incorporate extracted Codex findings into your scoring — if Codex flags something you missed, add it. If you disagree with a Codex finding, note it with your rationale.

**Codex error handling:** If codex exits non-zero (auth/rate-limit/transport failure), log the full stderr, mark the pass as `codex-unavailable` in the review log, and use internal review findings only for that pass. Do NOT treat a Codex failure as a clean review. Do NOT skip the pass. The next pass still attempts Codex (transient failures may recover).

**Code review scoping by mode:**
- Use `--uncommitted` when reviewing uncommitted changes (`task-review` mode).
- Use `--base <sha>` when reviewing committed changes.
- Use `codex exec -c model="$CODEX_MODEL"` with stdin pipe for non-code artifacts (`spec-challenge`, `architectural-design-review`, `visual-design-review`, `plan-review`, `research-review`, `clarification-review` modes).
- See `docs/reference/review-loop-pattern.md` for code review scoping rules.

#### Gemini Review

If `gemini` is in `multi_tool.tools`, follow the same pattern using the Gemini CLI when available. **For detailed Gemini CLI usage, see `wz:gemini-cli` skill.**

### Fix Cycle (Codex Findings)

If Codex produces blocking findings:
1. Executor fixes the Codex findings
2. Re-run internal review (quick pass) to verify fixes didn't introduce regressions
3. Optionally re-run Codex for a clean pass

### Merging Findings

The final review report must clearly attribute each finding:
- `[Internal]` — found by Tier 1 internal review
- `[Codex]` — found by Tier 2 Codex review
- `[Gemini]` — found by Tier 2 Gemini review
- `[Both]` — found independently by multiple sources

### Finding Persistence (Learning Pipeline)

ALL findings from both tiers are persisted to `state.sqlite` for cross-run learning:

```javascript
// After each review pass
const { insertFinding, getRecurringFindingHashes } = require('tooling/src/state/db');
const db = openStateDb(stateRoot);

for (const finding of allFindings) {
  insertFinding(db, {
    run_id: runId,
    phase: reviewMode,
    source: finding.attribution, // 'internal', 'codex', 'gemini'
    severity: finding.severity,
    description: finding.description,
    finding_hash: hashFinding(finding.description),
  });
}

// Check for recurring patterns
const recurring = getRecurringFindingHashes(db, 2);
// Recurring findings → auto-propose as learnings in the learn phase
```

This is how Wazir evolves — findings that recur across runs become accepted learnings injected into future executor context, preventing the same mistakes.

## Interaction Mode Awareness

Read `interaction_mode` from run-config:

- **`auto`:** No user checkpoints. Present verdict and let gating agent decide. On escalation, write reason and STOP.
- **`guided`:** Standard behavior — present verdict, ask user how to proceed.
- **`interactive`:** Discuss findings with user: "I found a potential auth bypass in `src/auth.js:42` — here's why I rated it high severity. Do you agree, or is there context I'm missing?" Show detailed reasoning for each dimension score.
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->

## CLI/Context-Mode Enforcement

In ALL review modes, check for these violations:

1. **Index usage enforcement:** If the agent performed >5 direct file reads (Read tool) without a preceding `wazir index search-symbols` query, flag as **[warning]** finding: "Agent performed [N] direct file reads without using wazir index. Use `wazir index search-symbols <query>` before reading files to reduce context consumption."

2. **Context-mode enforcement:** If the agent ran a large-category command (test runners, builds, diffs, dependency trees, linting — as classified by `hooks/routing-matrix.json`) using native Bash instead of context-mode tools (when context-mode is available), flag as **[warning]** finding: "Large command `[cmd]` run without context-mode. Route through `mcp__plugin_context-mode_context-mode__execute` to reduce context usage."

These are warnings, not blocking findings — they improve efficiency but don't affect correctness.

## Task-Review Log Filenames

In `task-review` mode, use task-scoped log filenames and cap tracking:
- Log filenames: `.wazir/runs/latest/reviews/execute-task-<NNN>-review-pass-<N>.md`
- Cap tracking: `wazir capture loop-check --task-id <NNN>` (each task has its own independent cap counter)

## Output

Save review results to `.wazir/runs/latest/reviews/review.md` (non-final modes) or `.wazir/runs/latest/completion/final-review/` (final mode) with:
- Findings with severity: blocking/warning/note (non-final modes) or CRITICAL/HIGH/MEDIUM/LOW (final mode)
- Rationale tied to evidence
- Score breakdown
- Verdict

Run the phase report and display it to the user:
```bash
wazir report phase --run <run-id> --phase <review-mode>
```

Output the report content to the user in the conversation.

## Phase Report Generation

After completing any review pass, generate a phase report following `schemas/phase-report.schema.json`:

1. **`attempted_actions`** — Populate from the review findings. Each finding becomes an action entry:
   - `description`: the finding summary
   - `outcome`: `"success"` if the finding passed, `"fail"` if it is a blocking issue, `"uncertain"` if ambiguous
   - `evidence`: the rationale or evidence supporting the outcome

2. **`drift_analysis`** — Compare review findings against the approved spec:
   - `delta`: count of deviations between implementation and spec (0 = no drift)
   - `description`: summary of any drift detected and its impact

3. **`quality_metrics`** — Populate from test, lint, and type-check results gathered during review:
   - `test_pass_count`, `test_fail_count`: from test runner output
   - `lint_errors`: from linter output
   - `type_errors`: from type checker output

4. **`risk_flags`** — Populate from any high-severity findings:
   - `severity`: `"low"`, `"medium"`, or `"high"`
   - `description`: what the risk is
   - `mitigation`: recommended mitigation (if known)

5. **`decisions`** — Populate from any scope or approach decisions made during the review:
   - `description`: what was decided
   - `rationale`: why
   - `alternatives_considered`: other options evaluated (optional)
   - `source`: `"[Wazir]"`, `"[Codex]"`, or `"[Both]"` (optional)

6. **`verdict_recommendation`** — Set based on the gating rules in `config/gating-rules.yaml`:
   - `verdict`: `"continue"` (PASS), `"loop_back"` (NEEDS MINOR FIXES / NEEDS REWORK), or `"escalate"` (FAIL with fundamental issues)
   - `reasoning`: brief explanation of why this verdict was chosen

### Report Output Paths

Save reports to two formats under the run directory:
- `.wazir/runs/<id>/reports/phase-<name>-report.json` — machine-readable, validated against `schemas/phase-report.schema.json`
- `.wazir/runs/<id>/reports/phase-<name>-report.md` — human-readable Markdown summary

The gating agent (`tooling/src/gating/agent.js`) consumes the JSON report to decide: **continue**, **loop_back**, or **escalate**.

### Report Fields Reference

All required fields per `schemas/phase-report.schema.json`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phase_name` | string | yes | Review mode name (e.g., `"final"`, `"task-review"`) |
| `run_id` | string | yes | Current run identifier |
| `timestamp` | string (date-time) | yes | ISO 8601 timestamp of report generation |
| `attempted_actions` | array | yes | Findings mapped to action outcomes |
| `drift_analysis` | object | yes | Spec-vs-implementation drift summary |
| `quality_metrics` | object | yes | Test/lint/type results |
| `risk_flags` | array | yes | High-severity risk items |
| `decisions` | array | yes | Scope/approach decisions made |
| `verdict_recommendation` | object | no | Gating verdict based on `config/gating-rules.yaml` |

## Post-Review: Learn (final mode only)

After the final review verdict (completion Stages 3-6 exit), extract durable learnings using the **learner role** (`roles/learner.md`). This corresponds to completion pipeline Stage 7 (Apply Learning) in `docs/vision/pipeline-complete.md`.

The learning agent receives ALL signals from the run — not just review findings. See `roles/learner.md` for the full input list including user corrections (highest-priority signal), adoption rates, and quality deltas.

### Step 1: Gather all findings

Collect review findings from ALL sources in this run:
- `.wazir/runs/<run-id>/reviews/` — all review pass logs (task-review, final review)
- Codex findings (attributed `[Codex]` or `[Both]`)
- Self-audit findings (if `run_audit` was enabled)

### Step 2: Identify learning candidates

A finding becomes a learning candidate if:
- It recurred across 2+ review passes within this run (same issue found repeatedly)
- It matches a finding from a prior run (check `memory/learnings/proposed/` and `accepted/` for similar patterns)
- It represents a class of mistake, not just a single instance (e.g., "missing error handling in async functions" vs "missing try-catch on line 42")

### Step 3: Write learning proposals

For each candidate, write a proposal to `memory/learnings/proposed/<run-id>-<NNN>.md`:

```markdown
---
artifact_type: proposed_learning
phase: learn
role: learner
run_id: <run-id>
status: proposed
sources:
  - <review-file-1>
  - <review-file-2>
approval_status: required
---

# Proposed Learning: <title>

## Scope
- **Roles:** [which roles should receive this learning — e.g., executor, reviewer]
- **Stacks:** [which tech stacks — e.g., node, react, or "all"]
- **Concerns:** [which concerns — e.g., error-handling, testing, security]

## Evidence
- [finding from review pass N: description]
- [finding from review pass M: same pattern]
- [optional: similar finding from prior run <run-id>]

## Learning
[The concrete, actionable instruction that should be injected into future executor context]

## Expected Benefit
[What this prevents in future runs]

## Confidence
- **Level:** low | medium | high
- **Basis:** [single run observation | multi-run recurrence | user correction]
```

### Step 4: Report

Present proposed learnings to the user:

> **Learnings proposed:** [count]
> - [title 1] (confidence: high, scope: executor/node)
> - [title 2] (confidence: medium, scope: reviewer/all)
>
> Proposals saved to `memory/learnings/proposed/`. Review and accept with `/wazir audit learnings`.

Learnings are NEVER auto-applied. They require explicit user acceptance before being injected into future runs.

## Post-Review: Prepare Next (final mode only)

After learning extraction (completion Stage 7), prepare the session handoff. This corresponds to completion pipeline Stage 8 in `docs/vision/pipeline-complete.md`. Invoke the `prepare-next` skill which handles the two output modes:

### Mode 1: Run Complete → execution-summary.md

Produces `.wazir/runs/<run-id>/execution-summary.md` with: what was built (linked to spec requirements), verification summary, concerns and resolutions, final review findings per pass with adoption rates, residuals disposition, learning proposals, quality delta, cost/timing, SHIP/SHIP WITH CAVEATS/DO NOT SHIP recommendation.

### Mode 2: Run Incomplete → handover-batch-N.md

Produces `.wazir/runs/<run-id>/handover-batch-N.md` with:

```markdown
# Handoff — <run-id>

**Status:** [Completed | Partial]
**Branch:** <branch-name>
**Date:** YYYY-MM-DD

## What Was Done
[List of completed tasks with commit hashes]

## Test Results
[Test count, pass/fail, validator status]

## Review Score
[Final review verdict and score]

## What's Next
[Pending items, deferred work, follow-up tasks]

## Open Bugs
[Any known issues discovered during this run]

## Learnings From This Run
[Key insights — what worked, what didn't, what to change]
```

### Cleanup

- Archive verbose intermediate review logs (compress to summary)
- Update `.wazir/runs/latest` symlink if creating a new run
- Do NOT mutate `input/` — it belongs to the user
- Do NOT auto-load proposed learnings into the next run

## Reasoning Output

Throughout the reviewer phase, produce reasoning at two layers:

**Conversation (Layer 1):** Before each review pass, explain what dimensions are being checked and why. After findings, explain the reasoning behind severity assignments.

**File (Layer 2):** Write `.wazir/runs/<id>/reasoning/phase-reviewer-reasoning.md` with structured entries:
- **Trigger** — what prompted the finding (e.g., "diff adds SQL query without parameterization")
- **Options considered** — severity options, fix approaches
- **Chosen** — assigned severity and recommendation
- **Reasoning** — why this severity level
- **Confidence** — high/medium/low
- **Counterfactual** — what would ship if this finding were missed

Key reviewer reasoning moments: severity assignments, PASS/FAIL decisions, dimension score justifications, and escalation decisions.

### Completion-Specific Reasoning Moments

During final mode (completion pipeline), additionally capture reasoning for:
- Concern resolution dispositions (accepted/rejected/escalated)
- Reconciliation verdicts (Pass 3 confirmed/downgraded/escalated findings)
- SHIP/DO NOT SHIP decisions
- Learning proposal priorities
- Severity assignments for CRITICAL/HIGH findings

Write completion reasoning to `.wazir/runs/<id>/reasoning/phase-completion-reasoning.md`.

## User Interaction During Completion

Completion is autonomous with exactly two exceptions:
1. **Drift escalation**: implementation doesn't match what user asked for (CRITICAL/HIGH drift finding)
2. **Unresolvable concern**: requires spec/design change (concern maps to spec requirement but resolution is unacceptable)

Pipeline pauses, presents evidence, waits. User's decision is final. All other completion stages run without user interaction.

## Done

**After completing this phase, output to the user:**

> **Final Review complete.**
>
> **Found:** [N] findings across 7 dimensions — [N] blocking, [N] warnings, [N] notes. Score: [score]/70 ([VERDICT]).
>
> **Without this phase:** [N] blocking issues would have shipped — including [specific examples: e.g., "missing error handler on /api/users endpoint", "auth middleware not wired to 3 routes", "CHANGELOG missing entry for breaking API change"]
>
> **Changed because of this work:** [List of issues caught and fixed during review passes, score improvement from first to final pass]

Present the verdict and offer next steps:

> **Review complete: [VERDICT] ([score]/70)**
>
> [Score breakdown and findings summary]
>
> **Learnings proposed:** [count] (see `memory/learnings/proposed/`)
> **Handoff:** `.wazir/runs/<run-id>/handoff.md`

Ask the user via AskUserQuestion:
- **Question:** "How would you like to proceed with the review results?"
- **Options:**
  1. "Create a PR" *(Recommended if PASS)*
  2. "Auto-fix and re-review" *(Recommended if MINOR FIXES)*
  3. "Review findings in detail"

Wait for the user's selection before continuing.

<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->