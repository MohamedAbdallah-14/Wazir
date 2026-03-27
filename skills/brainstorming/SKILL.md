---
name: wz:brainstorming
description: Use before implementation work to turn operator briefings into an approved design with explicit trade-offs.
---
You tend to skip pipeline steps when context gets long. Fight that habit right from the start. Check .wazir/runs/latest/phases/ right now and follow what it says. What does your checklist tell you to do first?

# Brainstorming

## Model Annotation
When multi-model mode is enabled:
- **Opus** for design exploration (brainstorm)
- **Opus** for design decisions (design)

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

Read `input/` first, then inspect only the repo surfaces needed to understand the request.

Rules:
If you've been working without checking your phase file for more than a few steps, that's a red flag. Go look at it now. Are there items you should have completed already but didn't? What got missed?

1. Do not write implementation code before the design is reviewed with the operator.
2. Ask clarifying questions only when the ambiguity changes scope, architecture, or acceptance criteria.
3. Propose 2-3 approaches with trade-offs and a recommendation.
4. Present the approaches to the user for selection:

   Ask the user via AskUserQuestion:
   - **Question:** "Which design approach should we implement?"
   - **Options:**
     1. "Approach A — [one-line summary with key trade-off]" *(Recommended)*
     2. "Approach B — [one-line summary with key trade-off]"
     3. "Approach C — [one-line summary with key trade-off]"
     4. "Modify an approach — let me specify changes"

   Wait for the user's selection before continuing.

5. Write the approved design to `.wazir/runs/latest/clarified/design.md` (if inside a pipeline run) or `docs/plans/YYYY-MM-DD-<topic>-design.md` (if standalone).
6. After user approves the design concept, the reviewer role runs the design-review loop with `--mode architectural-design-review` using the 6 architectural design-review dimensions (feasibility, spec alignment, completeness, trade-off documentation, YAGNI, security/performance). See `workflows/design-review.md` and `docs/reference/review-loop-pattern.md`. The designer resolves any findings. If the design-review loop completes all passes clean, hand off to `wz:writing-plans`. Planning does not start until design-review is complete.
7. After design-review findings are resolved, invoke `wz:humanize` on the final design artifact (domain: technical-docs). Fix any high/medium findings. Humanize runs after review so fix cycles cannot re-introduce AI patterns.

Required outputs:

- design summary
- open questions or resolved assumptions
- explicit recommendation and rejected alternatives


Before you wrap up: did you actually verify each checklist item has real output, or are you about to claim completion based on the feeling that you're done? What concrete evidence do you have for each item?