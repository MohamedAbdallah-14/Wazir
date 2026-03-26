# Review Loop Pattern Reference

Canonical reference for the review loop pattern used across all Wazir pipeline phases. Skills and workflows link to this document rather than embedding loop logic inline.

---

## Core Principle: Producer-Reviewer Separation

The producer skill (clarifier, planner, designer, etc.) **emits** an artifact and calls for review. The **reviewer role** owns the review loop. The producer receives findings and resolves them. No role reviews its own output.

```
Producer emits artifact
  -> Reviewer runs review loop (N passes, Codex if available)
  -> Findings returned to producer
  -> Producer fixes and resubmits
  -> Loop until all passes exhausted or cap reached
  -> Escalate to user if cap exceeded
```

When Codex is available, the reviewer role delegates to `codex review` as a secondary input while maintaining its own independent primary verdict.

---

## Per-Task Review vs Final Review

These are two structurally different constructs:

| | Per-Task Review | Final Review |
|---|---|---|
| **When** | During execution, after each task | After all execution + verification complete |
| **Dimensions** | 5 task-execution dims (correctness, tests, wiring, drift, quality) | 7 scored dims (correctness, completeness, wiring, verification, drift, quality, documentation) |
| **Scope** | Single task's uncommitted changes | Entire implementation vs spec/plan |
| **Output** | Pass/fix loop, no score | Scored verdict (0-70), PASS/FAIL |
| **Workflow** | Inline in execution flow | `workflows/review.md` |
| **Skill** | `wz:reviewer` in `task-review` mode | `wz:reviewer` in `final` mode |
| **Log filename** | `<phase>-task-<NNN>-review-pass-<N>.md` | `final-review.md` |

---

## Standalone Mode

When no `.wazir/runs/latest/` directory exists (standalone skill invocation outside a pipeline run):

1. **Review loops still run** -- the review logic is embedded in the skill, not dependent on run state.
2. **Artifact location** -- artifacts live in `docs/plans/`. This is the canonical standalone artifact path.
3. **Review log location** -- review logs go alongside the artifact: `docs/plans/YYYY-MM-DD-<topic>-review-pass-<N>.md`. No temp dir.
4. **Loop cap is SKIPPED entirely** -- no `wazir capture loop-check` call. The loop runs for exactly `pass_counts[depth]` passes (3/5/7) and stops. No cap guard, no fallback constant.
5. **`wazir capture loop-check`** -- not invoked in standalone mode. The standalone detection happens before the cap guard call.

Detection logic:

```
if .wazir/runs/latest/ exists:
  run_mode = "pipeline"
  log_dir = .wazir/runs/latest/reviews/
  cap_guard = wazir capture loop-check (full guard)
else:
  run_mode = "standalone"
  artifact_dir = docs/plans/
  log_dir = docs/plans/  (alongside artifact)
  cap_guard = none (depth pass count is the only limit)
```

---

## Review Loop Pseudocode

```
review_loop(artifact_path, original_input_path, phase, dimensions[], depth, config, options={}):

  # options.mode      -- explicit review mode (required)
  # options.task_id   -- task identifier for task-scoped reviews (optional)
  # original_input_path -- .wazir/input/briefing.md + any input/*.md files (ground truth for all reviews)

  # Standalone detection
  run_mode = detect_run_mode()  # "pipeline" or "standalone"

  # Fixed pass counts -- no extension
  pass_counts = { quick: 3, standard: 5, deep: 7 }
  total_passes = pass_counts[depth]

  # Depth-aware dimension subsets (coverage contract)
  depth_dimensions = {
    quick:    dimensions[0:3],     # first 3 dimensions only
    standard: dimensions[0:5],     # first 5
    deep:     dimensions,          # all available
  }
  active_dims = depth_dimensions[depth]

  codex_available = check_codex()  # which codex && codex --version

  for pass_number in 0..total_passes-1:

    # --- Cap guard check (pipeline mode only, before each pass) ---
    if run_mode == "pipeline":
      loop_check_args = "--run <run-id> --phase <phase> --loop-count <pass_number+1>"
      if options.task_id:
        loop_check_args += " --task-id <task_id>"
      wazir capture loop-check $loop_check_args
      # loop-check wraps: event capture + evaluateLoopCapGuard
      # If loop_cap_guard fires (exit 43), stop immediately:
      if last_exit_code == 43:
        log("Loop cap reached for phase: <phase>. Escalating to user.")
        escalate_to_user(evidence_gathered_so_far)
        return { pass_count: pass_number, escalated: true }
    # Standalone mode: no cap guard. Loop runs for total_passes and stops.

    dimension = active_dims[pass_number % len(active_dims)]

    # --- Primary review (reviewer role, not producer) ---
    # Mode is always explicit -- passed by caller via options.mode
    findings = self_review(artifact_path, original_input_path, focus=dimension, mode=options.mode)

    # --- Secondary review (Codex, if available) ---
    if codex_available:
      codex_exit_code, codex_output = run_codex_review(artifact_path, dimension)
      if codex_exit_code != 0:
        # Codex failed -- log error, fall back to self-review for this pass
        log_error("Codex exited " + codex_exit_code + ": " + codex_output.stderr)
        mark_pass_codex_unavailable(pass_number)
        # Do NOT treat Codex failure as clean. Self-review findings stand alone.
      else:
        codex_findings = parse(codex_output.stdout)
        merge(findings, codex_findings, preserve_attribution=true)

    # --- Log the review pass ---
    if run_mode == "pipeline":
      if options.task_id:
        log_path = .wazir/runs/latest/reviews/<phase>-task-<task_id>-review-pass-<N>.md
      else:
        log_path = .wazir/runs/latest/reviews/<phase>-review-pass-<N>.md
      log(pass_number+1, dimension, findings) -> log_path
    else:
      log_path = docs/plans/YYYY-MM-DD-<topic>-review-pass-<N>.md
      log(pass_number+1, dimension, findings) -> log_path

    if findings.has_issues:
      # --- Fix and re-submit (MANDATORY) ---
      # The producer MUST fix findings and the reviewer MUST re-review.
      # "Fix and continue without re-review" is EXPLICITLY PROHIBITED.
      producer_fix(artifact_path, findings)
      # Continue to next pass -- the fix will be re-reviewed

  # --- Post-loop: escalation if issues remain ---
  if remaining.has_issues:
    # Cap reached with unresolved findings. Present to user:
    # 1. Approve with known issues (Recommended if non-blocking)
    # 2. Fix manually and re-run
    # 3. Abort
    escalate_to_user(remaining, options=[
      "approve-with-issues",
      "fix-manually-and-rerun",
      "abort"
    ])
    # User decides. If approved, log "user-approved-with-issues" in final pass file.

  return { pass_count: total_passes, issues_found, issues_fixed, remaining, attributions }
```

Key properties of this pseudocode:

1. **Fixed pass counts** -- Quick is exactly 3, standard exactly 5, deep exactly 7. No `max_passes = min_passes + 3`. No clean-streak early-exit. No extension.
2. **Task-scoped log filenames** -- `<phase>-task-<NNN>-review-pass-<N>.md` for per-task reviews, preventing log clobbering in parallel mode.
3. **Task-scoped loop cap keys** -- `--task-id` flag on `loop-check` so each task gets its own counter in `phase_loop_counts`.
4. **Explicit review mode** -- `options.mode` is always passed by the caller. No auto-detection.
5. **Codex error handling** -- non-zero exit is logged, pass marked `codex-unavailable`, self-review findings used alone. Never treated as clean.
6. **Standalone mode** -- uses `docs/plans/` for artifacts and logs. No temp dir. No cap guard at all.

---

## Codex Error Handling Contract

```
run_codex_review(artifact_path, dimension):
  CODEX_MODEL = read_config('.wazir/state/config.json', '.multi_tool.codex.model') or "gpt-5.4"

  if is_code_artifact:
    cmd = codex review -c model="$CODEX_MODEL" --uncommitted --title "..." "Review for [dimension]..."
    # or: codex review -c model="$CODEX_MODEL" --base <sha> for committed changes
  else:
    cmd = cat <artifact_path> | codex exec -c model="$CODEX_MODEL" "Review this [type] for [dimension]..."

  result = execute(cmd, timeout=120s, capture_stderr=true)

  if result.exit_code != 0:
    return (result.exit_code, { stderr: result.stderr, stdout: "" })
    # Caller handles: log error, mark codex-unavailable, use self-review only

  return (0, { stdout: result.stdout, stderr: result.stderr })
```

Rules:

- If Codex exits non-zero, log the full stderr.
- Mark the pass as `codex-unavailable` in the review log metadata.
- Fall back to self-review for that pass only. Do not skip the pass.
- Do not retry Codex on the same pass. If Codex fails on pass 2, pass 3 still tries Codex (transient failures recover).
- Never treat a Codex failure as a clean review pass.

---

## Codex Availability Probe

Before any Codex call, verify availability once at loop start:

```bash
which codex >/dev/null 2>&1 && codex --version >/dev/null 2>&1
```

If the probe fails, set `codex_available = false` for the entire loop. Fall back to self-review only. Never error out.

Per-invocation failures (Codex available but a single call fails) are handled separately by the error contract above.

---

## Codex Artifact-Scoped Review

Never use `codex review` for non-code artifacts (specs, plans, designs). Instead, pipe the artifact content via stdin:

```bash
CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null)
CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}
cat .wazir/runs/latest/clarified/spec-hardened.md | \
  codex exec -c model="$CODEX_MODEL" "Review this specification for: [dimension]. Be specific, cite sections. Say CLEAN if no issues." \
  2>&1 | tee .wazir/runs/latest/reviews/spec-challenge-review-pass-N.md
```

For code artifacts, use `codex review -c model="$CODEX_MODEL" --uncommitted` (or `--base` for committed changes). See the next section for details.

---

## Code Review Scoping

**Rule: review BEFORE commit.**

For each task during execution:

1. Implement the task (changes are uncommitted).
2. Review the uncommitted changes using the **5 task-execution dimensions** (NOT the 7 final-review dimensions):
   ```bash
   CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null)
CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}
   codex review -c model="$CODEX_MODEL" --uncommitted --title "Task NNN: <summary>" \
     "Review against acceptance criteria: <criteria>" \
     2>&1 | tee .wazir/runs/latest/reviews/execute-task-NNN-review-pass-N.md
   ```
3. Fix any findings (still uncommitted).
4. Re-review until all passes exhausted or cap reached.
5. **Only after review passes:** commit with conventional commit format.

**If changes are already committed** (e.g., subagent workflow where the implementer subagent commits before review):

```bash
# Capture the SHA before the task starts
PRE_TASK_SHA=$(git rev-parse HEAD)

# ... subagent implements and commits ...

# Review the committed changes against the pre-task baseline
CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null)
CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}
codex review -c model="$CODEX_MODEL" --base $PRE_TASK_SHA --title "Task NNN: <summary>" \
  "Review against acceptance criteria: <criteria>" \
  2>&1 | tee .wazir/runs/latest/reviews/execute-task-NNN-review-pass-N.md
```

---

## Dimension Sets

### Research Dimensions (5)

1. **Coverage** -- all briefing topics researched
2. **Source quality** -- authoritative, current sources
3. **Relevance** -- research answers the actual questions
4. **Gaps** -- missing info that blocks later phases
5. **Contradictions** -- conflicting sources identified

### Spec/Clarification Dimensions (5)

1. **Completeness** -- all requirements covered
2. **Testability** -- each criterion verifiable
3. **Ambiguity** -- no dual-interpretation statements
4. **Assumptions** -- hidden assumptions explicit
5. **Scope creep** -- nothing beyond briefing

### Architectural Design-Review Dimensions (6)

Used for Phase 5 DESIGN (implementation approach selection). Review mode: `architectural-design-review`.

1. **Feasibility** -- can this approach be built with the current stack and constraints?
2. **Spec alignment** -- does the design address every requirement from the spec?
3. **Completeness** -- are all components, interfaces, and data flows accounted for?
4. **Trade-off documentation** -- are trade-offs between approaches explicit and honest?
5. **YAGNI** -- does the design avoid over-engineering beyond what the spec requires?
6. **Security/performance** -- are security and performance implications of the chosen approach identified?

### Visual Design-Review Dimensions (5)

Used for Phase 4a VISUAL DESIGN (collaborative visual design with pencil MCP or equivalent). Review mode: `visual-design-review`. Only runs when visual design sub-phase is active.

Matches canonical `workflows/design-review.md` (visual-design-review dimensions):

1. **Spec coverage** -- does the design address every acceptance criterion with a visual component?
2. **Design-spec consistency** -- does the design introduce anything not in the spec? (scope creep check)
3. **Accessibility** -- color contrast ratios (WCAG 2.1 AA), focus states, touch target sizes (44x44px minimum)
4. **Visual consistency** -- design tokens form a coherent system, dark/light mode alignment
5. **Exported-code fidelity** -- do exported scaffolds match the designs? Mismatches are failures here, not implementation concerns.

### Plan Dimensions (8)

1. **Completeness** -- all design decisions mapped to tasks
2. **Ordering** -- dependencies correct, parallelizable identified
3. **Atomicity** -- each task fits one session
4. **Testability** -- concrete verification per task
5. **Edge cases** -- error paths covered
6. **Security** -- auth, injection, data exposure
7. **Integration** -- tasks connect end-to-end
8. **Input Coverage** -- every distinct item in the original input maps to at least one task. If any input item has no mapped task, HIGH finding listing unmapped items (item-level traceability, not count comparison)

### Task Execution Dimensions (5)

Used for per-task review during execution:

1. **Correctness** -- code matches spec
2. **Tests** -- real tests, not mocked/faked
3. **Wiring** -- all paths connected
4. **Drift** -- matches task spec
5. **Quality** -- naming, error handling

### Final Review Dimensions (7)

Used for `workflows/review.md` scored gate:

1. **Correctness** -- does the code do what the spec says?
2. **Completeness** -- are all acceptance criteria met?
3. **Wiring** -- are all paths connected end-to-end?
4. **Verification** -- is there evidence (tests, type checks) for each claim?
5. **Drift** -- does the implementation match the approved plan?
6. **Quality** -- code style, naming, error handling, security
7. **Documentation** -- changelog entries, commit messages, comments

The final review dimensions are the existing 7 from `skills/reviewer/SKILL.md`. `workflows/review.md` is not modified by this pattern.

---

## Per-Depth Coverage Contract

| Depth | Research | Spec | Arch. Design-Review | Visual Design-Review | Plan | Task Execution | Final Review |
|-------|----------|------|---------------------|---------------------|------|----------------|--------------|
| Quick | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | dims 1-3, 3 passes | always 7 dims, 1 pass |
| Standard | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | dims 1-5, 5 passes | always 7 dims, 1 pass |
| Deep | dims 1-6, 7 passes | dims 1-5, 7 passes | dims 1-6, 7 passes | dims 1-5, 7 passes | dims 1-8, 7 passes | dims 1-5, 7 passes | always 7 dims, 1 pass |

Pass counts are FIXED per depth. Quick = 3 passes, standard = 5 passes, deep = 7 passes. No extension. No early-exit. Final review is always a single scored pass across all 7 dimensions -- it is a gate, not a loop.

---

## Loop Cap Configuration

The `workflow_policy` section of `run-config.yaml` (legacy: `phase_policy`) controls which workflows are enabled and sets an absolute safety ceiling per workflow. Only two fields exist: `enabled` and `loop_cap`. There is no `passes` field -- depth determines pass counts (3/5/7), not workflow policy.

```yaml
workflow_policy:
  # Clarifier phase workflows
  discover:       { enabled: true, loop_cap: 10 }
  clarify:        { enabled: true, loop_cap: 10 }
  specify:        { enabled: true, loop_cap: 10 }
  spec-challenge: { enabled: true, loop_cap: 10 }
  author:         { enabled: false, loop_cap: 10 }
  design:         { enabled: true, loop_cap: 10 }
  design-review:  { enabled: true, loop_cap: 10 }  # covers architectural-design-review + visual-design-review
  plan:           { enabled: true, loop_cap: 10 }
  plan-review:    { enabled: true, loop_cap: 10 }
  # Executor phase workflows
  execute:        { enabled: true, loop_cap: 10 }
  verify:         { enabled: true, loop_cap: 5 }
  review:         { enabled: true, loop_cap: 10 }
  learn:          { enabled: true, loop_cap: 5 }
  prepare_next:   { enabled: true, loop_cap: 5 }
  run_audit:      { enabled: false, loop_cap: 10 }
```

**`loop_cap`** is an absolute safety ceiling that prevents runaway loops regardless of depth. It is checked by `wazir capture loop-check` in pipeline mode. It is NOT the same as pass count (which is determined by depth: 3/5/7). Example: depth=deep gives 7 passes, but if `loop_cap: 5`, the cap guard fires at pass 5 and escalates. This is intentional -- the operator can constrain expensive phases.

**Adaptive workflows** (`author`, `run_audit`) default to `enabled: false`. They are activated by explicit operator config or intent detection.

**Post-run workflows** (`learn`, `prepare_next`) default to `enabled: true`. They run as part of the Final Review phase:

- `learn` extracts durable learnings from review findings -- recurring findings become accepted learnings.
- `prepare_next` prepares context and handoff for the next run.
- `author` runs autonomously with its own review loop — no human approval gate. Activated by content-author detection after spec review.
- `run_audit` is an on-demand standalone audit, not part of the main pipeline flow.

---

## Reviewer Mode Table

The reviewer skill operates in different modes depending on the phase. **Mode is always explicit** -- the caller passes `--mode <mode>`. There is no auto-detection based on artifact availability.

| Mode | Invoked during | Prerequisites | Dimensions | Output |
|------|---------------|---------------|------------|--------|
| `final` | After execution + verification | Completed task artifacts in `.wazir/runs/latest/artifacts/`, original input | 7 final-review dims, scored 0-70 | Verdict: PASS/NEEDS FIXES/NEEDS REWORK/FAIL |
| `spec-challenge` | After specify | Draft spec artifact, original input | 5 spec/clarification dims | Findings with severity, no score |
| `architectural-design-review` | After architectural design approval (Phase 5) | Design artifact, approved spec, original input | 6 architectural design-review dims | Findings with severity (blocking/advisory) |
| `visual-design-review` | After visual design (Phase 4a, conditional) | Visual design artifact, approved spec, accessibility guidelines, original input | 5 visual design-review dims | Findings with severity (blocking/advisory) |
| `plan-review` | After planning | Draft plan, approved spec, design artifact, original input | 8 plan dims | Findings with severity, no score |
| `task-review` | During execution, per task | Uncommitted changes (or committed with known base SHA), original input | 5 task-execution dims | Pass/fail per task, no score |
| `research-review` | During discover | Research artifact, original input | 5 research dims | Findings with severity, no score |
| `clarification-review` | During clarify | Clarification artifact, original input | 5 spec/clarification dims | Findings with severity, no score |

If `--mode` is not provided, the reviewer asks the user which review to run. Auto-detection based on artifact availability is NOT used -- it causes ambiguity in resumed/multi-phase runs where stale artifacts from prior phases exist.

Each caller is responsible for passing the correct mode:

- Clarifier passes `--mode clarification-review` after Phase 1A
- Discover workflow passes `--mode research-review` after research
- Specifier flow passes `--mode spec-challenge` after specify
- Brainstorming passes `--mode architectural-design-review` after user approval
- Visual design workflow passes `--mode visual-design-review` after Phase 4a (if active)
- Writing-plans passes `--mode plan-review` after planning
- Executor passes `--mode task-review` for each task
- `/wazir` runner passes `--mode final` for the final review gate

---

## Codex Prompt Templates

All Codex invocations read the model from config with a fallback:

```bash
CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null)
CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}
```

### Artifact Review (specs, plans, designs via stdin)

Use this template with `codex exec` for non-code artifacts piped via stdin:

```bash
(cat <artifact_path>; echo "---ORIGINAL INPUT---"; cat .wazir/input/briefing.md; for f in input/*.md; do [ -f "$f" ] && cat "$f"; done) | codex exec -c model="$CODEX_MODEL" \
  "You are reviewing a [ARTIFACT_TYPE] for the Wazir engineering OS.
Focus on [DIMENSION]: [dimension description].
The content after ---ORIGINAL INPUT--- is the user's original briefing — check for input alignment.
Rules: cite specific sections, be actionable, say CLEAN if no issues.
Do NOT load or invoke any skills. Do NOT read the codebase.
Review ONLY the content provided via stdin."
```

Replace `[ARTIFACT_TYPE]` with: `specification`, `implementation plan`, `design document`, `research brief`, or `clarification`.
Replace `[DIMENSION]` and `[dimension description]` with the current review pass dimension from the relevant dimension set above.

### Code Review (diffs via --uncommitted or --base)

Use this template with `codex review` for code changes:

```bash
codex review -c model="$CODEX_MODEL" --uncommitted --title "Task NNN: <summary>" \
  "Review the code changes for [DIMENSION]: [dimension description].
Check against acceptance criteria: [criteria].
Flag: correctness issues, missing tests, unwired paths, drift from spec.
Do NOT load or invoke any skills."
```

For committed changes, replace `--uncommitted` with `--base <sha>`.
Replace `[DIMENSION]`, `[dimension description]`, and `[criteria]` with the task-specific values from the execution plan and spec.

---

## Codex Output Context Protection

Codex CLI output includes internal traces (file reads, tool calls, reasoning) that are NOT useful for the review — only the final findings matter. To prevent context flooding:

### Tee + Extract Pattern

1. **Always tee** Codex output to a file:
   ```bash
   codex exec ... 2>&1 | tee .wazir/runs/latest/reviews/<phase>-review-pass-<N>.md
   ```

2. **Extract findings** after the last `codex` marker using `execute_file`:
   ```bash
   # If context-mode available (has_execute_file: true):
   mcp__plugin_context-mode_context-mode__execute_file(
     path: ".wazir/runs/latest/reviews/<phase>-review-pass-<N>.md",
     language: "shell",
     code: "tac $FILE | sed '/^codex$/q' | tac | tail -n +2"
   )
   ```

3. **Present extracted findings only** — the raw trace stays in the file for debugging but never enters the main context window.

### Fallback (no context-mode)

If `context_mode.has_execute_file` is false, extract using shell directly:

```bash
tac <file> | sed '/^codex$/q' | tac | tail -n +2
```

This reverses the file, finds the first (= last original) `codex` marker, reverses back, and skips the marker line.

**If no marker found:** fail closed

---

## Phase Scoring: First vs Final Artifact Comparison

At the start of each review loop (pass 1), score the artifact on its phase's canonical dimension set (1-10 per dimension). At the end of the loop (final pass), score again using the **same canonical dimensions**. Present the delta in the end-of-phase report.

### Canonical Dimension Sets Per Phase

These are the fixed rubrics — no ad-hoc dimension selection:

| Phase | Canonical Dimensions |
|-------|---------------------|
| research-review | Coverage, Source quality, Relevance, Gaps identified, Actionability |
| clarification-review / spec-challenge | Completeness, Testability, Ambiguity, Assumptions, Scope creep |
| architectural-design-review | Feasibility, Spec alignment, Completeness, Trade-off documentation, YAGNI, Security/performance |
| visual-design-review | Spec coverage, Design-spec consistency, Accessibility, Visual consistency, Exported-code fidelity |
| plan-review | Completeness, Testability, Task granularity, Dependency correctness, Phase structure, File coverage, Estimation accuracy, Input coverage |
| task-review | Correctness, Tests, Wiring, Drift, Quality |
| final | Correctness, Completeness, Wiring, Verification, Drift, Quality, Documentation |

### Scoring Rules

1. Initial and final scores MUST use the **same dimension set** — the delta is only meaningful on the same rubric.
2. The reviewer records which dimension set was used in each pass file.
3. Delta format: `Dimension: X/10 → Y/10 (+Z)`.

### Quality Delta Report Section

The end-of-phase report (see "End-of-Phase Report" below) includes a **Quality Delta** section:

```markdown
## Quality Delta

| Dimension | Initial | Final | Delta |
|-----------|---------|-------|-------|
| Completeness | 4/10 | 9/10 | +5 |
| Testability | 3/10 | 8/10 | +5 |
| Ambiguity | 5/10 | 9/10 | +4 |
```

---

## End-of-Phase Report

Every phase exit produces a report saved to `.wazir/runs/latest/reviews/<phase>-report.md` containing:

1. **Summary** — what the phase produced
2. **Key Changes** — first-version vs final-version highlights (not full diff — what improved)
3. **Quality Delta** — per-dimension before/after scores (see Phase Scoring above)
4. **Findings Log** — per-pass finding counts by severity (e.g., "Pass 1: 6 findings (3 blocking, 2 warning, 1 note). Pass 7: 0 findings. All resolved.")
5. **Usage** — token usage from `wazir capture usage` (runs before report generation)
6. **Context Savings** — context-mode stats if available, omit section if not
7. **Time Spent** — wall-clock elapsed time from phase start to end — log "codex marker not found in output, cannot extract findings" and present a warning to the user with 0 findings extracted. The raw file is preserved for manual review. Do NOT fall back to `tail` or any best-effort extraction that could leak traces into context.

---

## Subtask Execution Loop (Pipeline Mode)

The subtask execution loop replaces the N-pass review loop for in-pipeline execution. It is NOT a variant of the N-pass loop — it is a separate pattern with different structure, different roles, and different termination conditions.

**When to use which:**
- **N-pass loop**: non-execution reviews (spec-challenge, plan-review, clarification-review, design-review, research-review) and standalone `task-review` invocations outside a pipeline run.
- **Subtask execution loop**: in-pipeline execution only. The orchestrator (`workflows/execute.md`) dispatches this loop per subtask.

### The Loop

    Step 1: Executor          — TDD, implement, micro-commit, self-review
    Step 2: Reviewer/Verifier — two-stage review (spec → quality) + verification + proof
    Step 3: Executor          — fix findings (if any)
    Step 4: Reviewer/Verifier — second round (if step 2 had findings)
    Step 5: Executor          — fix findings (if any)
    Step 6: Cross-Model R/V   — cross-model review + verification (concurrent)
    Step 7: Executor          — fix cross-model + verification findings (if any)

### Skip Logic

- Step 2 clean (zero findings) → skip steps 3-4 → advance to step 6 (step 5 is implicitly skipped — no step 4 findings to fix)
- Step 4 clean → skip step 5 → advance to step 6
- Step 6 clean → skip step 7 → subtask complete

### Spawn Counts

- Best case: 2 spawns (executor → R/V clean → done)
- Typical: 4-5 spawns
- Worst case: 7 spawns per attempt

### Residuals

After step 7, if issues remain: unresolved findings are written to `residuals-<subtask-id>.md` (see `templates/artifacts/residuals.md`). CRITICAL residuals trigger Level 2 escalation. Non-critical residuals are collected for the completion gate.

### Level 2 Escalation

Triggered when: subtask loop exhausted with CRITICAL residuals, or subagent reports FAILED/NEEDS_CONTEXT/BLOCKED.

- Tier 1: Replan — failure evidence + residuals to fresh planner. Max 1.
- After Tier 1: Escalate to user with evidence.

Total worst case per subtask: 7 loop spawns + 1 replan + 7 replanned loop spawns = 15 invocations.

### Baseline SHA

The orchestrator captures `PRE_TASK_SHA` before dispatching step 1. All Reviewer/Verifier passes scope their diff to `--base $PRE_TASK_SHA`.

### Finding Attribution

All findings carry source tags: `[Internal]`, `[Codex]`, `[Gemini]`, `[Both]`. The Cross-Model R/V in step 6 merges findings from the cross-model tool with its own, preserving attribution.
