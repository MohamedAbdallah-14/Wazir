# Clarify Phase: Implementation Alignment Plan

> Branch: `feat/clarify-vision-edits`
> Previous session: Vision edits completed and committed (d5db887, 5b08a29)
> Status: Vision is updated, implementation does NOT match yet

## What was done (vision edits)

8 edits to `pipeline-clarify.md`, `pipeline.md`, `review-loop-pattern.md`:

1. **V-1**: Three interaction modes (auto/guided/interactive) with per-phase checkpoint table
2. **V-2**: Visual design as optional interactive-only sub-phase (Phase 4a)
3. **V-3**: Split design-review into architectural (6 dims) and visual (5 dims)
4. **P-1**: Content-author detection after spec review, autonomous with review loop
5. **P-2**: Scope coverage hard gate — item-level traceability, not count comparison
6. **P-3**: Two-layer reasoning capture for all pre-execution phases
7. **P-5**: Research-first hard rule — DISCOVER must complete before user questions
8. **P-6**: Input preservation — user-provided detail never removed, only augmented

Codex gpt-5.4 reviewed. 6 findings addressed: scope gate rewritten, content-author made autonomous with explicit ordering, Phase 4a outputs marked reference-only, interactive mode adds compaction between phases, stale references fixed.

## Implementation gaps to fix

### Structural (must fix)

**1. Checkpoint gating per interaction_mode**
- File: `skills/clarifier/SKILL.md`
- Problem: All 5 `AskUserQuestion` checkpoints fire unconditionally
- Fix: Read `interaction_mode` from `run-config.yaml`, wrap each checkpoint:
  - `auto` → skip (or route to gating agent for Clarify/Design)
  - `guided` → only pause at SW2 (Clarify) and SW4 (Design)
  - `interactive` → pause at all 5
- The two boundary gates (pre-exec→exec, exec→complete) are NOT in the clarifier — they're in the `/wazir` main skill

**2. Brainstorming needs architectural-design-review mode**
- Files: `skills/brainstorming/SKILL.md`, `workflows/design-review.md`
- Problem: Brainstorming routes through `--mode design-review` which has UI-focused dimensions
- Fix: Change to `--mode architectural-design-review` (6 dims: feasibility, spec alignment, completeness, trade-off documentation, YAGNI, security/performance)
- `workflows/design.md` keeps `--mode visual-design-review` for pencil MCP visual design

**3. Original input as reference passed to every review**
- Files: `skills/reviewer/SKILL.md`, `roles/reviewer.md`, `docs/reference/review-loop-pattern.md` (pseudocode)
- Problem: Vision Principle 16 says "original user input is the only ground truth." Review mechanism says `review(artifact_path, checklist, original_input)`. But reviewer role inputs don't list original briefing, and the review-loop pseudocode doesn't pass it.
- Fix: Add `briefing.md` as a required input to every reviewer invocation. Update pseudocode.

**4. discover.md workflow has wrong inputs**
- File: `workflows/discover.md`
- Problem: Says inputs are "clarified scope" — but research runs BEFORE clarification
- Fix: Change to "user briefing + research questions"

### Medium priority

**5. Content-author ordering in clarifier skill**
- File: `skills/clarifier/SKILL.md`
- Problem: Content-author detection exists but ordering vs visual design isn't explicit
- Fix: Add explicit ordering: REVIEW(spec) → content-author (if detected) → VISUAL DESIGN (if enabled) → DESIGN
- Author workflow runs autonomously with review loop, no human approval gate

**6. "Not doable" path in clarify**
- Files: `skills/clarifier/SKILL.md`, `roles/clarifier.md`
- Problem: Vision says CLARIFY "can say not doable." No mechanism in implementation.
- Fix: Add a check after research: if research reveals impossibility/contradiction → present to user with evidence, offer to halt or reframe

**7. No business vs technical question routing**
- File: `skills/clarifier/SKILL.md`
- Problem: Vision says "business questions only — technical questions go to another agent"
- Fix: During question batching, classify questions. Business → user/gating agent. Technical → dispatch to a research subagent that answers from codebase context.

**8. Interactive mode compaction**
- File: `skills/clarifier/SKILL.md`
- Problem: Vision says interactive mode should ask user to compact between phases
- Fix: After each sub-workflow checkpoint in interactive mode, suggest compaction

### Forward-critical (blocks executor, not clarifier)

**9. Plan subtask schema**
- File: `skills/writing-plans/SKILL.md`
- Problem: Produces per-task `spec.md` but lacks: expertise declarations, context budget (READ FULL/SECTION/KNOW EXISTS), file dependency matrix, convergence-point analysis, execution batches
- Fix: Update writing-plans to produce subtasks matching the template in `docs/vision/examples/subtask-example.md`
- Note: This is critical when executor/Composer work starts

**10. Gating agent protocol for auto mode**
- Problem: Auto mode needs a defined protocol for the gating agent (which agent, decision contract, inputs, response format, escalation path)
- Fix: Define in the clarifier skill or a separate gating-agent protocol doc

### Already correct (no changes needed)

- Review loop with depth-aware pass counts (3/5/7)
- Scope coverage gate logic (exists, just needs item-level traceability per vision)
- Input preservation rule (exists in skill)
- Specifier role requires non-goals and assumptions
- Writing-plans produces per-task files
- Reasoning output at two layers (exists in skill)
- Content-author detection (exists in skill)
- Standalone mode handling
- Codex as secondary reviewer

## Dependencies

```
#4 (discover inputs) → independent
#1 (checkpoint gating) → independent
#2 (design-review mode) → independent
#3 (original input to reviews) → independent
#5 (content-author ordering) → depends on #1 (mode awareness)
#6 (not doable path) → independent
#7 (question routing) → independent
#8 (compaction) → depends on #1 (mode awareness)
#9 (plan schema) → independent, forward-critical
#10 (gating agent) → independent, forward-critical
```

Batch 1 (parallel): #1, #2, #3, #4, #6, #7
Batch 2 (after #1): #5, #8
Batch 3 (forward, separate session): #9, #10

## Files touched

| File | Changes |
|------|---------|
| `skills/clarifier/SKILL.md` | #1, #5, #6, #7, #8 |
| `skills/brainstorming/SKILL.md` | #2 |
| `skills/reviewer/SKILL.md` | #3 |
| `roles/reviewer.md` | #3 |
| `workflows/discover.md` | #4 |
| `workflows/design.md` | #2 (update --mode) |
| `workflows/design-review.md` | #2 (split or rename) |
| `skills/writing-plans/SKILL.md` | #9 |

## User preferences

- Zero emotions, blunt, pair-programmer tone
- Codex gpt-5.4 for reviews (run in background)
- CodeRabbit + Codex review loops
- Feature branches from main (current: `feat/clarify-vision-edits`)
- Squash-merge, never normal merge
- Never skip pipeline phases
- Use superpowers skills (writing-plans → dispatching-parallel-agents → verification → code-review)
