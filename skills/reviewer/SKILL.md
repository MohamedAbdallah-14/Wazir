---
name: wz:reviewer
description: Run the review phase — adversarial review of implementation against the approved spec, plan, and verification evidence.
---

# Reviewer

Run Phase 3 (Review) for the current project.

The reviewer role owns all review loops across the pipeline: research-review, clarification-review, spec-challenge, design-review, plan-review, per-task execution review, and final review. Each uses phase-specific dimensions from `docs/reference/review-loop-pattern.md`.

## Review Modes

The reviewer operates in different modes depending on the phase. Mode MUST be passed explicitly by the caller (`--mode <mode>`). The reviewer does NOT auto-detect mode from artifact availability. If `--mode` is not provided, ask the user which review to run.

| Mode | Invoked during | Prerequisites | Dimensions | Output |
|------|---------------|---------------|------------|--------|
| `final` | After execution + verification | Completed task artifacts, approved spec/plan/design | 7 final-review dims, scored 0-70 | Scored verdict (PASS/FAIL) |
| `spec-challenge` | After specify | Draft spec artifact | 5 spec/clarification dims | Pass/fix loop, no score |
| `design-review` | After design approval | Design artifact, approved spec | 5 design-review dims (canonical) | Pass/fix loop, no score |
| `plan-review` | After planning | Draft plan artifact | 7 plan dims | Pass/fix loop, no score |
| `task-review` | During execution, per task | Uncommitted changes or `--base` SHA | 5 task-execution dims (correctness, tests, wiring, drift, quality) | Pass/fix loop, no score |
| `research-review` | During discover | Research artifact | 5 research dims | Pass/fix loop, no score |
| `clarification-review` | During clarify | Clarification artifact | 5 spec/clarification dims | Pass/fix loop, no score |

Each mode follows the review loop pattern in `docs/reference/review-loop-pattern.md`. Pass counts are fixed by depth (quick=3, standard=5, deep=7). No extension.

### CHANGELOG Enforcement

In `task-review` and `final` modes, flag missing CHANGELOG entries for user-facing changes as **[warning]** severity. User-facing changes include new features, behavior changes, and bug fixes visible to users. Internal changes (refactors, tooling, tests) do not require CHANGELOG entries.

## Prerequisites

Prerequisites depend on the review mode:

### `final` mode
1. Check `.wazir/runs/latest/artifacts/` has completed task artifacts. If not, tell the user to run `/wazir:executor` first.
2. Read the approved spec, plan, and design from `.wazir/runs/latest/clarified/`.
3. Read `.wazir/state/config.json` for depth and multi_tool settings.

### `task-review` mode
1. Uncommitted changes exist for the current task, or a `--base` SHA is provided for committed changes.
2. Read `.wazir/state/config.json` for depth and multi_tool settings.

### `spec-challenge`, `design-review`, `plan-review`, `research-review`, `clarification-review` modes
1. The appropriate input artifact for the mode exists.
2. Read `.wazir/state/config.json` for depth and multi_tool settings.

## Review Process (`final` mode)

Perform adversarial review across 7 dimensions:

1. **Correctness** — Does the code do what the spec says?
2. **Completeness** — Are all acceptance criteria met?
3. **Wiring** — Are all paths connected end-to-end?
4. **Verification** — Is there evidence (tests, type checks) for each claim?
5. **Drift** — Does the implementation match the approved plan?
6. **Quality** — Code style, naming, error handling, security
7. **Documentation** — Changelog entries, commit messages, comments

## Context Retrieval

- Read the diff first (primary input)
- Use `wazir index search-symbols <name>` to locate related code
- Use `wazir recall symbol <name-or-id> --tier L1` to check structural alignment
- Read files directly for: logic errors, missing edge cases, integration concerns

## Scoring (`final` mode)

Score each dimension 0-10. Total out of 70.

| Verdict | Score | Action |
|---------|-------|--------|
| **PASS** | 56+ | Ready for PR or merge |
| **NEEDS MINOR FIXES** | 42-55 | Auto-fix and re-review |
| **NEEDS REWORK** | 28-41 | Re-run affected tasks |
| **FAIL** | 0-27 | Fundamental issues |

## Secondary Review

Read `.wazir/state/config.json`. If `multi_tool.tools` includes external reviewers, run them **after** your own review and **before** producing the final verdict.

### Codex Review

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

2. Read the Codex findings from `.wazir/runs/latest/reviews/codex-review.md`
3. Incorporate Codex findings into your scoring — if Codex flags something you missed, add it. If you disagree with a Codex finding, note it with your rationale.

**Codex error handling:** If codex exits non-zero (auth/rate-limit/transport failure), log the full stderr, mark the pass as `codex-unavailable` in the review log, and use self-review findings only for that pass. Do NOT treat a Codex failure as a clean review. Do NOT skip the pass. The next pass still attempts Codex (transient failures may recover).

**Code review scoping by mode:**
- Use `--uncommitted` when reviewing uncommitted changes (`task-review` mode).
- Use `--base <sha>` when reviewing committed changes.
- Use `codex exec -c model="$CODEX_MODEL"` with stdin pipe for non-code artifacts (`spec-challenge`, `design-review`, `plan-review`, `research-review`, `clarification-review` modes).
- See `docs/reference/review-loop-pattern.md` for code review scoping rules.

### Gemini Review

If `gemini` is in `multi_tool.tools`, follow the same pattern using the Gemini CLI when available.

### Merging Findings

The final review report must clearly attribute each finding:
- `[Wazir]` — found by primary review
- `[Codex]` — found by Codex secondary review
- `[Both]` — found independently by both

## Task-Review Log Filenames

In `task-review` mode, use task-scoped log filenames and cap tracking:
- Log filenames: `.wazir/runs/latest/reviews/execute-task-<NNN>-review-pass-<N>.md`
- Cap tracking: `wazir capture loop-check --task-id <NNN>` (each task has its own independent cap counter)

## Output

Save review results to `.wazir/runs/latest/reviews/review.md` with:
- Findings with severity (blocking, warning, note)
- Rationale tied to evidence
- Score breakdown
- Verdict

## Done

Present the verdict and offer next steps:

> **Review complete: [VERDICT] ([score]/70)**
>
> [Score breakdown and findings summary]
>
> **What would you like to do?**
> 1. **Create a PR** (if PASS)
> 2. **Auto-fix and re-review** (if MINOR FIXES)
> 3. **Review findings in detail**
