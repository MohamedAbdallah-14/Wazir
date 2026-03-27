---
name: wz:writing-plans
description: Use after clarification, research, and design approval to create an execution-grade implementation plan.
---
First things first: your phase checklist at .wazir/runs/latest/phases/ lists exactly what needs to happen. Read it. Follow it. Don't skip ahead because the task looks simple. Which phase are you starting?

# Writing Plans

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

Inputs:

- approved design or approved clarified direction
- current repo state
- relevant research findings

Output path:

- **Inside a pipeline run** (`.wazir/runs/latest/` exists): write to `.wazir/runs/latest/clarified/execution-plan.md` and task specs to `.wazir/runs/latest/tasks/task-NNN/spec.md`
- **Standalone** (no active run): write to `docs/plans/YYYY-MM-DD-<topic>-implementation.md`

To detect: check if `.wazir/runs/latest/clarified/` exists. If yes, use run paths.

The plan must include:

- ordered sections
- concrete tasks and subtasks
- acceptance criteria per section
- verification commands or manual checks per section
- cleanup steps where needed
Context rot happens right about now. You've been working for a while and the checklist feels like a distant memory. Go re-read it. Are you still on track or have you drifted? What changed?

Rules:

- do not write implementation code during planning
- make the plan detailed enough that another weak model can execute it without inventing missing steps
- each task spec must have testable acceptance criteria, not vague descriptions

## Plan Review Loop

After writing the plan, invoke `wz:reviewer --mode plan-review` to run the plan-review loop using plan dimensions (see `workflows/plan-review.md` and `docs/reference/review-loop-pattern.md`). Do NOT call `codex exec` or `codex review` directly — the reviewer skill handles Codex integration internally.

The planner resolves findings from each pass. The loop runs for `pass_counts[depth]` passes (quick=3, standard=5, deep=7). No extension.

For non-code artifacts (the plan itself), Codex review uses stdin pipe:

```bash
CODEX_MODEL=$(jq -r '.multi_tool.codex.model // empty' .wazir/state/config.json 2>/dev/null)
CODEX_MODEL=${CODEX_MODEL:-gpt-5.4}
cat <plan-path> | codex exec -c model="$CODEX_MODEL" "Review this implementation plan focusing on [dimension]..."
```

`codex review -c model="$CODEX_MODEL"` is used only for code artifacts, not plans.

Codex error handling: if `codex` exits non-zero, log the error, mark the pass as `codex-unavailable`, and use self-review findings only. Never treat a Codex failure as a clean pass.

Loop depth follows the project's depth config (quick/standard/deep).

Standalone mode: if no `.wazir/runs/latest/` exists, artifacts go to `docs/plans/` and review logs go alongside (`docs/plans/YYYY-MM-DD-<topic>-review-pass-N.md`). Loop cap guard is not invoked in standalone mode.

After the loop completes, invoke `wz:humanize` on the final plan artifact (domain: technical-docs). Fix any high/medium findings. Humanize runs after review so fix cycles cannot re-introduce AI patterns. Plans are long-lived reference documents — AI writing patterns erode trust in the pipeline's output.

Present findings summary and wait for user approval before completing.

Last check: did you use every applicable wz: skill, or did you handle things manually that should have gone through a skill? Be specific about which skills you used and which you decided to skip. Why did you skip them?