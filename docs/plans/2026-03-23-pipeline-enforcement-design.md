# Pipeline Enforcement Design — Markdown Phase Files + Hook Injection

**Date:** 2026-03-23
**Status:** Draft (review pass 5 — superpowers x3 + wz:code-reviewer x1 + codex CLI x1)
**Goal:** Achieve 80% pipeline compliance (current: 40-58%)

---

## Problem

LLM agents don't follow multi-step pipelines. Across 7 sessions, Wazir compliance ranged from 40-58%. The agent reads instructions and skips them. Research across 30+ papers confirms: prompt-only enforcement tops out at ~50% for multi-step pipelines. No project in the Claude Code ecosystem (GSD 39K stars, ECC 93K stars, SuperPowers) has solved this or published compliance numbers.

## Research Basis

| Paper | Finding | Relevance |
|-------|---------|-----------|
| TME (arXiv:2504.08525) | 100% task completion, 0 hallucinations with current-step-only injection | Core pattern for phase files |
| PCAS (arXiv:2602.16708) | 48% → 93% with reference monitor | Hooks as reference monitor |
| "Context Length Alone Hurts" (Amazon 2025) | 13.9-85% degradation from length alone | Minimize pipeline context |
| Context Rot (Chroma 2025) | All 18 LLMs below 50% at 32K tokens | `/compact` between phases |
| LIFBench (ACL 2025) | Instruction-following degrades as context grows | Shorter injections |
| "LLMs Can't Plan" (arXiv:2402.01817) | Autoregressive LLMs cannot plan or self-verify | External enforcement required |
| ETH Zurich (arXiv:2602.11988) | Adding context files REDUCES task success | Don't load unnecessary files |
| "Lost in the Middle" (Stanford 2023) | 20-30pp drop for mid-context info | Reminders at start/middle/end |
| AgentSpec (arXiv:2503.18666) | >90% with runtime DSL enforcement | Validate before allowing transitions |

## Architecture

### Core Principle

Three enforcement layers targeting different failure modes. Layers 1 and 2 are partially correlated (both inject text the agent may ignore), but Layer 3 (context reduction) addresses a different failure mode (context length degrading compliance).

**Target:** 80% compliance. From our measured 58% best case, that's a 22-point improvement. From our 40% worst case, that's a 40-point improvement. The PCAS study achieved a 45-point improvement (48% → 93%) with a reference monitor alone, so 22-40 points with three layers is realistic.

### Layer 1: Hook Injection

PreToolUse hooks (matching Write|Edit|Bash) read the current phase file and inject the current step into the agent's context automatically. The agent cannot avoid seeing it.

**What gets injected (from the active phase .md file):**
```
CURRENT: Use Skill(wz:tdd) for implementation (execute phase, step 2 of 5)
NEXT: Run npm test
```

~25-30 tokens per injection. At ~200 tool calls per session, this adds ~6,000 tokens of repeated injection. Acceptable — this is reinforcement, not noise.

**Injection mechanism by hook type:**
- **SessionStart:** Raw stdout text wrapped in `<system-reminder>` tags (same as existing session-start hook). Agent sees it as a system message.
- **PreToolUse:** JSON stdout with `systemMessage` field. **IMPORTANT: This mechanism requires a spike before implementation.** The enforcement-experiments branch used `systemMessage` in the pretooluse-dispatcher, but it was not conclusively tested. Implementation step 0 is: write a minimal PreToolUse hook that emits `{"systemMessage": "test"}`, confirm the agent sees the text. If `systemMessage` is not recognized, fall back to stderr output (which appears as hook context in Claude Code).
- **Stop:** JSON stdout with `decision` and `reason` fields. Exit code 2 blocks the stop. **Note:** The enforcement-experiments branch used exit code 1 for blocking. The correct exit code must be determined during the spike.

**Hook composition:** The new injection hook is added as a SEPARATE entry alongside existing hooks (protected-path-write-guard, context-mode-router). Claude Code runs all matching hooks sequentially. This means 2-3 hooks fire per tool call. If latency becomes an issue, consolidate into a single dispatcher (as the enforcement-experiments branch attempted — though that required 7 fix commits). Start with composition, consolidate if measured latency exceeds 200ms per tool call.

**SessionStart hook (event: startup|resume|compact):**
- Detects if `.wazir/runs/latest` exists
- Reads phase files to determine current phase
- Injects current step into initial context
- On `compact` event: re-injects current step after context reduction

**Stop hook (Claude Code hook type: Stop):**

Claude Code supports `Stop` as a native hook type — verified via the enforcement-experiments branch implementation (`hooks/definitions/stop_pipeline_gate.yaml`, `host_fallback: claude: native_hook`). The Stop hook fires when the agent attempts to end its response.

- Reads all phase files
- Blocks completion (exit code 2) if current phase has unchecked items
- Outputs reason via stdout JSON: `{"decision": "block", "reason": "Cannot stop. Phase [X] has [N] unchecked items: [list]"}`
- On error (missing files, malformed markdown): blocks by default (fail-closed), exit code 2

### Layer 2: File Reminders

Every skill file (all 29) gets 3 identical short reminders at start, middle, and end:

```
<!-- PIPELINE: Check .wazir/runs/latest/phases/ for your current phase. Complete all items before proceeding. -->
```

One line, ~20 tokens per insertion. Covers primacy, middle, and recency attention zones per "Lost in the Middle" research.

**Maintenance:** A build step (`wazir export build`) will inject/update reminders automatically. "Middle" is defined as the line closest to 50% of total file length. Reminders are idempotent — re-running the build step does not duplicate them.

### Layer 3: Minimal Pipeline Context, Full Task Context

Pipeline management (phase ordering, step checklists, process rules) is externalized to phase files on disk. The agent's context window contains only:
- The current step (~30 tokens via hook injection)
- Task context (expertise modules, specs, plans, domain knowledge) — kept in full

The wazir skill stays as the core reference. It will be updated to point agents to phase files rather than describing process inline, but is not being shortened.

## Phase Naming

The manifest (`wazir.manifest.yaml`) defines 4 phases: `init`, `clarifier`, `executor`, `final_review`. These map to 15 workflows (clarify, discover, specify, spec_challenge, author, design, design_review, plan, plan_review, execute, verify, review, learn, prepare_next, run_audit).

This design uses the **manifest phase names** to avoid introducing a fourth naming convention:

| Phase file | Manifest phase | Contains workflows |
|-----------|---------------|-------------------|
| `init.md` | `init` | Setup, branching, file creation |
| `clarifier.md` | `clarifier` | clarify, discover, specify, spec_challenge, author, design, design_review, plan, plan_review |
| `executor.md` | `executor` | execute, verify |
| `final_review.md` | `final_review` | review, learn, prepare_next, run_audit |

## File Structure

```
.wazir/runs/run-YYYYMMDD-HHMMSS/phases/
  init.md              — current step brief (hook reads this)
  init.log.md          — full history with details (debugging)
  clarifier.md
  clarifier.log.md
  executor.md
  executor.log.md
  final_review.md
  final_review.log.md
```

**Path resolution:** Phase files live under the run directory at `.wazir/runs/<id>/phases/`. Two `latest` pointers currently exist in the codebase:
1. **Repo-local symlink:** `.wazir/runs/latest` → `run-YYYYMMDD-HHMMSS` (created by the wazir skill via `ln -sfn`)
2. **State-root plain file:** `~/.wazir/projects/<slug>/runs/latest` (written by `tooling/src/capture/command.js` via `writeFileSync`)

**Canonical location for hooks:** Repo-local `.wazir/runs/latest`. Hooks run relative to the project root, so this is the deterministic path. The implementation must ensure `wazir capture init` creates BOTH pointers. The hook reads repo-local first; if absent, falls back to the state-root pointer.

**State root split:** Capture events and summaries remain at the manifest state root (`~/.wazir/projects/<slug>/`). Phase files are repo-local. Future work may unify these.

### Phase File Format (.md — brief, hook-facing)

All four phase files are created at run init with full unchecked checklists. Only the active phase has an "ACTIVE" header. Non-active phases are marked "NOT ACTIVE" with a redirect.

**Active phase example (clarifier.md when clarifier is the current phase):**
```markdown
## Phase: clarifier — ACTIVE
- [ ] Read `.wazir/input/briefing.md`
- [ ] Use `Skill(wz:clarifier)` to run clarification
- [ ] Write spec to `.wazir/runs/<id>/phases/clarifier.log.md`
- [ ] Get user approval to proceed
- [ ] Run `wazir capture event --run <id> --event phase_enter --phase executor --status starting`
```

**Non-active phase example (executor.md when clarifier is current):**
```markdown
## Phase: executor — NOT ACTIVE
This phase has not started. Current phase: clarifier.
Run `wazir capture event --run <id> --event phase_enter --phase executor` after completing clarifier.

- [ ] Read clarifier output from `.wazir/runs/<id>/phases/clarifier.log.md`
- [ ] Use `Skill(wz:tdd)` for implementation
- [ ] Run `npm test` — all tests pass
- [ ] Use `Skill(wz:verification)` to write proof
- [ ] Commit with conventional message
- [ ] Run `wazir capture event --run <id> --event phase_enter --phase final_review --status starting`
```

**Completed phase example (init.md after init is done):**
```markdown
## Phase: init — COMPLETED
- [x] Run `wazir capture init --run <id> --phase init --status starting`
- [x] Write briefing to `.wazir/input/briefing.md`
- [x] Run `git checkout -b feat/<name>` (if on main)
- [x] Phase files created
```

### Log File Format (.log.md — full history, debugging)

Never injected into agent context. Agent appends entries as it completes steps. Read by the user for debugging or by the next phase's agent after `/compact`. No size limit — one log file per phase per run.

```markdown
## Phase: clarifier — Log

### Step 1: Read briefing — COMPLETED 14:32:05
Read .wazir/input/briefing.md (47 lines). Task: add greet CLI command.

### Step 2: Run clarifier — COMPLETED 14:35:22
Invoked Skill(wz:clarifier). Produced spec with 3 acceptance criteria.
```

## Phase Definitions

### 4 Phases: init → clarifier → executor → final_review

**init** — Mechanical setup. Mostly handled by hooks automatically.
- Run directory creation
- Briefing capture
- Feature branch creation
- Phase file creation

**clarifier** — Understand the task. Produce spec/plan.
- Read briefing
- Invoke clarifier skill
- Write outputs
- Get user approval

**executor** — Build the thing. TDD, verification.
- Read clarifier outputs
- TDD (tests first)
- Implementation
- Verification proof
- Commits

**final_review** — Verify the work. Review loops.
- Invoke reviewer skill
- Address findings
- Final test pass
- Mark run complete

### Checklist Templates

Each phase has a pre-defined checklist template with exact commands and skill invocations. Templates are stored in the repo and copied into run directories at init.

**Template location:** `templates/phases/{init,clarifier,executor,final_review}.md`

**Template design is a dedicated follow-up task.** The checklist items determine how the agent behaves — getting them right requires testing and iteration, not brainstorming. The placeholder checklists in this document are illustrative, not final.

**Template rendering:** Templates must be rendered per-run using `run-config.yaml` workflow policy. If a workflow is disabled (e.g., `author: enabled: false`), its checklist items are either omitted or auto-completed at render time. Static templates that ignore workflow policy will deadlock on disabled workflows.

**Workflow-level exit signals:** The existing `validateRunCompletion()` checks `phase_exit` events for every enabled workflow. The 4-phase checklist system does NOT replace this — it adds a layer on top. The agent must still emit per-workflow `phase_exit` events as it works through workflows within a phase. The phase checklist tracks the coarse gate; workflow events track the fine-grained completion. Both must pass for `wazir capture summary --complete` to succeed.

### Known Limitation: Agent Can Lie

The agent checks its own boxes. An agent that skips the clarifier skill can also skip checking the clarifier checkbox. The checklist catches "forgot to do it" (compliance failure) but not "pretended to do it" (deception). The Stop hook and transition validation catch unchecked items, not unperformed work.

Mitigation: the existing `phase_prerequisites` in the manifest already defines required artifacts per phase (e.g., executor requires `clarified/clarification.md`). The `evaluatePhasePrerequisiteGuard` function validates these on `phase_enter` events. This is STRONGER than checking log files — it validates that the clarifier skill produced its actual structured outputs, not just that the agent wrote a log entry. The phase file transition adds a second layer (checklist boxes), and the existing prerequisite guard adds a third (artifact existence). Together they catch "forgot to do it" and "did something but not the right thing."

## Phase Transitions

### Mechanism

1. Agent completes all checklist items in current phase EXCEPT the transition command itself
2. Agent calls `wazir capture event --run <id> --event phase_enter --phase <next> --status starting`
3. CLI reads current phase file, validates all items are checked EXCLUDING the transition command item (the last item is always the transition command and is auto-completed by the CLI on success)
4. If validation fails: CLI rejects transition, outputs which items are unchecked
5. If validation passes: CLI updates phase headers (current → COMPLETED, next → ACTIVE)
6. CLI outputs: "Phase transition complete. Run `/compact` to clear context."
7. User runs `/compact` (this is a user action — the agent cannot invoke it)
8. SessionStart hook fires on `compact` event, injects first step of new active phase

### Terminal State

When final_review's last item is checked:
1. Agent calls `wazir capture event --run <id> --event phase_exit --phase final_review --status completed`
2. CLI validates all final_review items are checked
3. CLI marks final_review as COMPLETED
4. CLI outputs: "Run complete. All phases passed."
5. Stop hook allows exit (no ACTIVE phases remain)

### Rollback

If the user needs to re-run a phase:
- `wazir capture event --run <id> --event phase_reset --phase clarifier` — unchecks all items in clarifier.md, sets header to ACTIVE, sets all subsequent phases to NOT ACTIVE
- This is a manual escape hatch, not an automatic mechanism

### Backstop: Stop Hook

The Stop hook fires on EVERY assistant turn end, not just when the agent believes the task is finished. A naive "block if unchecked items" would deadlock normal multi-turn conversations (agent can't ask questions, can't pause for user to run `/compact`, can't send progress updates).

**Narrow condition:** The Stop hook only blocks if the agent's final message contains a completion signal (e.g., "task complete", "all done", offering to commit/PR, or no further action proposed). Normal conversational turns, questions to the user, and phase transition messages are allowed through.

Implementation: the Stop hook reads the agent's stop reason from stdin. If it contains completion-like language AND the active phase has unchecked items, block. Otherwise, allow.

- If blocked: injects reason: "Cannot complete. Phase [X] has [N] unchecked items: [list]"
- If allowed: normal turn end, agent continues conversation
- Agent or user can override via Ctrl+C

### Hook Error Handling

| Hook | Success | Validation failure | Error (crash/missing files) |
|------|---------|-------------------|---------------------------|
| SessionStart | exit 0, inject current step | N/A | exit 0, inject warning "No pipeline state found" |
| PreToolUse (injection) | exit 0, inject current step via systemMessage | N/A | exit 0, no injection (fail-open for injection) |
| Stop | exit 0, allow stop | exit 2, block with reason | exit 2, block (fail-closed) |
| `wazir capture event` | exit 0, transition | exit 1, reject with unchecked list | exit 1, error message |

Injection hooks fail-open (missing files shouldn't block work). Stop hook fails-closed (missing files shouldn't allow premature exit).

## Context Management

### `/compact` Between Phases

At each phase transition, the CLI recommends `/compact`. This is a **user action** — the agent cannot invoke `/compact` programmatically. The checklist item reads "Ask user to run `/compact`" not "Run `/compact`".

`/compact`:
- Compresses conversation history, reducing accumulated context
- Preserves the agent's understanding of the pipeline and task
- Keeps system prompt and skill content intact
- Resets context decay curve per Toby Ord half-life research

Design supports full session isolation (`/clear` or new session) but `/compact` is the recommended default because the agent retains pipeline awareness.

**If the user does not compact:** PreToolUse injection still fires on every tool call (Layer 1 still works). Context decay from the previous phase is not mitigated, but enforcement continues. `/compact` is recommended, not required. The system degrades gracefully without it.

### Why `/compact` Over `/clear`

`/clear` wipes all context including the agent's understanding that it's in a pipeline. The SessionStart hook would need to re-teach everything from scratch. `/compact` preserves the "I must follow the pipeline" understanding while removing conversation noise.

## Current Phase Detection

No separate state file. The phase files ARE the state.

**Algorithm:**
1. Read all four phase .md files in `.wazir/runs/latest/phases/`
2. Find the file with header "ACTIVE"
3. Within that file, find the first unchecked item `- [ ]`
4. That is the current step

**Parser contract:** A checked item is any line matching `/^- \[x\]/i` (case-insensitive X). Sub-items (indented `- [ ]`) are not counted. Lines inside fenced code blocks are not parsed. The ACTIVE header is matched by `/^## Phase:.* — ACTIVE$/` (literal ` — ACTIVE` suffix). This excludes `— NOT ACTIVE` and `— COMPLETED` which both have different suffixes.

**Edge cases:**
- No file has "ACTIVE" header → run not started or all phases complete
- Active file has all items checked → phase complete, agent should transition
- Multiple files have "ACTIVE" → invalid state, error
- File missing or malformed → SessionStart injects warning; Stop hook blocks

**Mid-session death recovery:** On resume, SessionStart reads phase files and injects not just the current step but also completed steps summary: "COMPLETED: steps 1-3. CURRENT: step 4 of 5." This gives the resumed agent context on prior progress.

**Race conditions:** Claude Code executes tools sequentially within a turn. The agent cannot read and write the phase file simultaneously. No race condition exists.

## Wazir Skill Updates

The wazir skill remains the core reference. Updates needed:
- Add instructions to read phase files at run start
- Point to `.wazir/runs/latest/phases/` for current step
- Update phase descriptions to reference template checklists
- Add "use the CLI to transition" instructions
- Add "ask user to run `/compact` between phases"
- Keep all existing content: skill invocations, artifact conventions, expertise references

## Implementation Order

0. **Spike: verify hook injection mechanisms.** Write minimal PreToolUse hook emitting `{"systemMessage": "test"}`, confirm agent sees text. Write minimal Stop hook with exit code 2, confirm it blocks. 30-minute timebox. If either fails, redesign that layer before proceeding.
1. Measure compliance baseline (before any changes)
2. Create phase templates in `templates/phases/`
3. Update SessionStart hook to create phase files from templates (preserve existing session-start logic: skill injection, index refresh, CLI bootstrap)
4. Update PreToolUse hook to inject current step from active phase file
5. Add Stop hook to block premature completion
6. Update `wazir capture event` to validate checklists on transition
7. Add 3 reminders to all 29 skill files (automated via build step)
8. Update wazir skill to reference phase files
9. Deploy and measure compliance (after changes)
10. Iterate on checklist templates based on measurements

## Success Criteria

- Pipeline compliance reaches 80% (from current 40-58%)
- Agent invokes skills listed in checklists (wz:clarifier, wz:tdd, wz:reviewer)
- Phase transitions are validated — agent cannot skip phases
- Stop hook prevents premature completion
- Phase files are human-readable for debugging
- `/compact` between phases reduces context accumulation

## Out of Scope

- Non-technical user mode (future — developer mode first)
- UI for pipeline progress (future — after enforcement works)
- Multi-host support (future — Claude Code first, then Codex/Gemini/Cursor)
- SQLite state (future — only if markdown proves insufficient)
- Prompt engineering / DeCRIM restructuring (Phase E — after hook enforcement is measured)
- Compliance self-audit skill (separate task)
