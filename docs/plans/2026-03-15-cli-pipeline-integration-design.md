# CLI Pipeline Integration Design

> **Status:** Draft v4
> **Date:** 2026-03-15
> **Author:** Mohamed Abdallah
> **Scope:** Wire all 7 CLI command families into the agent pipeline so roles, workflows, skills, and hooks leverage indexing, recall, validation, capture, doctor, status, and export drift detection instead of raw file reads.
> **Review rounds:** 3 adversarial reviews completed. All critical, important, and most minor issues addressed.

---

## Problem Statement

Wazir ships 7 CLI command families (validate, capture, index, recall, doctor, status, export) but the agent pipeline only uses 2 of them (validate partially in verifier, capture via hooks). Every role says "local file reads" and "targeted repo reads," burning full file contents into context when L0/L1 summaries exist. The index, recall, doctor, status, and export drift systems are fully implemented but disconnected from the pipeline.

## Goals

1. Every CLI feature is used by the pipeline at the appropriate checkpoint
2. Token consumption drops significantly on exploration-heavy phases via tiered recall
3. Full audit trail via run lifecycle capture across all pipeline phases
4. Broken repo state is caught before work begins (doctor) and after work completes (validate + export drift)
5. Session recovery is possible via status reads across compaction boundaries
6. Symbol-first exploration replaces grep-everything for debugging and review

## Non-Goals

- Requiring index for simple/small tasks — agent decides based on bootstrap guidance
- Breaking existing hook behavior — capture hooks stay as-is
- Adding new recall tiers — L0 and L1 are the only valid `--tier` values
- Concurrent session safety — v1 assumes single session per project (see Risks)

---

## Acknowledged CLI Changes

This design requires **five** minor CLI changes to existing command handlers:

1. **`tooling/src/checks/command-registry.js`** — Add `'wazir capture usage'` to `SUPPORTED_COMMAND_SUBJECTS`
2. **`tooling/src/capture/command.js` → `handleInit`** — Import and call `initUsage(runPaths, runId)` from `usage.js`; write run ID to `<state-root>/runs/latest` (plain text file)
3. **`tooling/src/capture/command.js` → `handleOutput`** — Import and call `recordCaptureSavings(runPaths, rawBytes, 0)` after `writeCaptureOutput` (summaryBytes is 0 because all bytes were routed to file instead of context)
4. **`tooling/src/capture/command.js` → `handleEvent`** — Import and call `recordPhaseUsage(runPaths, phase, data)` when event is `phase_enter` or `phase_exit`
5. **`tooling/src/capture/usage.js` → `recordPhaseUsage`** — Change `events_count` from replace to increment semantics: `existing.events_count += data.events_count ?? 0` (current code overwrites with `=`, which is a bug)

These are small, contained changes to existing handlers — not new commands or new CLI surfaces.

---

## Design Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Session bootstrap strategy | **Hybrid** — hook injects index/doctor guidance; agent decides refresh/build | Fast for small tasks, ensures agent knows index exists |
| 2 | Recall tier defaults per role | **Role-based** — L0/L1/direct-read assigned per role | Matches how humans work: planner reads structure, executor reads code |
| 3 | Capture integration depth | **Full run lifecycle** — init, phase events, usage report | Complete audit trail, enables session recovery and token savings proof |
| 4 | Validation checkpoint placement | **Bookend + export drift** — doctor at start, validate pre+post execution, export check in verifier | Never start work in broken repo, never ship broken state |
| 5 | Symbol search integration | **Symbol-first** for debugging and review | Biggest token burners explore broadly; funnel search→L1→targeted read |

---

## 1. Session Start Hook — Hybrid Bootstrap

### Current Behavior

The session start hook is an **executable Node.js script** at `hooks/session-start` (not a markdown file). Its canonical definition lives at `hooks/definitions/session_start.yaml`. On trigger, it reads `skills/using-skills/SKILL.md`, wraps it in `<EXTREMELY_IMPORTANT>` tags, and writes to stdout for system context injection.

The hook fires on `startup|resume|clear|compact` events (configured in the export compiler at `tooling/src/export/compiler.js`, lines 99-116). The hook **cannot distinguish** which trigger event fired — it receives no trigger-type argument or environment variable.

### New Behavior

The hook script (`hooks/session-start`) is extended to also inject CLI bootstrap guidance into the system context. This is **not** running doctor/index directly in the hook — the hook injects instructions that tell the agent what to do after bootstrap.

```
hooks/session-start (executable Node.js script) outputs:
  1. wz:using-skills injection                          → existing behavior
  2. CLI bootstrap block:
     - "Run `wazir doctor --json` to check repo health"
     - "Run `wazir index refresh` to update the index (creates if missing)"
     - "If index refresh reports no database, run `wazir index build && wazir index summarize --tier all`"
     - "Check `<state-root>/runs/latest` for previous run ID"
     - "If previous run is incomplete, resume it; otherwise run `wazir capture init --run <new-id> --phase clarify --status starting`"
```

**Why `index refresh` instead of `index stats` for freshness:** `index stats` has no staleness metric — it returns counts and timestamps but does not compare against files on disk. `index refresh` is already incremental (hash-based delta), skips unchanged files, and is the correct tool for ensuring the index is current. No freshness heuristic needed.

### Run ID Strategy — Agent-Managed via `capture init` + `latest` File

The hook **cannot distinguish** `startup` from `compact`/`resume` triggers, so it cannot know whether to generate a new run ID or reuse an existing one. Therefore:

1. **The hook does NOT generate or manage run IDs.** It only injects guidance text.
2. **`capture init` creates the run and writes the run ID** to `<state-root>/runs/latest` (a plain text file containing just the run ID string).
3. **On compaction/resume:** The hook injects the same bootstrap guidance. The agent reads `<state-root>/runs/latest` to discover the current run ID. If `latest` exists and the run is incomplete, the agent resumes it.
4. **Agent context carries the run ID** between capture calls within a single session segment.

### `latest` File Implementation Detail

The `latest` file is written by `handleInit` in `tooling/src/capture/command.js`. Implementation:

```javascript
// In handleInit, after writeStatus and appendEvent:
const latestPath = path.join(stateRoot, 'runs', 'latest');
try {
  fs.writeFileSync(latestPath, options.run, 'utf8');
} catch {
  // Non-fatal: latest file is a convenience, not required for run operation
  process.stderr.write('Warning: could not write latest run pointer\n');
}
```

This writes to `<state-root>/runs/latest` which is outside the `runPaths` structure (which is scoped to `<state-root>/runs/<runId>/`). The `stateRoot` is already available in `handleInit` via `resolveCaptureContext()`. No new store helper is needed — this is a direct `fs.writeFileSync` call.

**Collision safety:** The file is named `latest` (no timestamp prefix). A run ID could theoretically be "latest" but the format `run-YYYYMMDD-HHMMSS-XXXX` prevents this.

### Contract Update for `session_start.yaml`

The current definition has stale declarations that don't match what the hook actually does:

**Current (stale):**
```yaml
input_contract:
  required:
    - project_root
    - run_id              # ← hook never receives this
output_contract:
  produces:
    - status.json         # ← hook never produces this
allowed_side_effects:
  - create_status_file    # ← hook never does this
  - append_event          # ← hook never does this
```

**Updated (accurate):**
```yaml
input_contract:
  required:
    - project_root
output_contract:
  produces:
    - skill_bootstrap_text
    - cli_bootstrap_guidance
allowed_side_effects: []    # hook only writes to stdout, no side effects
```

Changes:
- Remove `run_id` from `input_contract.required` (hook does not receive or generate run IDs)
- Replace `status.json` with `skill_bootstrap_text` and `cli_bootstrap_guidance` in `output_contract.produces`
- Empty `allowed_side_effects` (hook only writes to stdout — it has no side effects)

### Run ID Discovery Flow

```
Agent starts session:
  1. Hook fires → injects bootstrap guidance (no run ID)
  2. Agent checks: does <state-root>/runs/latest exist?
     ├─ Yes → read run ID from file
     │   ├─ wazir status --run <id> --json → incomplete? → resume
     │   └─ wazir status --run <id> --json → completed? → capture init (new run)
     └─ No → capture init (new run, generates run ID, writes latest)
  3. Agent uses run ID for all subsequent capture commands
```

### Fallback When Index Build/Summarize Fails

If `wazir index build` or `wazir index summarize` fails:
1. Agent logs the failure via `wazir capture event --run <id> --event index_build_failed --message "<error>"`
2. Agent falls back to direct file reads (the pre-existing behavior)
3. Roles that specify L0/L1 defaults treat them as **preferences**, not hard requirements — if recall fails, the role escalates to direct read
4. No retry — surface the failure to the user if it's a permissions/config issue

Note: `summarize` can throw if zero files are summarizable (all binary/skipped). This is treated the same as a build failure — fall back to direct reads.

### Rules

- Hook stays exit 0 (never blocks session start)
- Doctor/index guidance is injected text, not executed by the hook itself
- The agent decides whether to act on the guidance
- Hook behavior is identical on startup, resume, clear, and compact — it always injects the same guidance text (it cannot distinguish triggers)
- Run ID management is entirely the agent's responsibility (via `capture init` + `latest` file)

### Files Modified

- `hooks/session-start` — extend the executable script to inject CLI bootstrap guidance block
- `hooks/definitions/session_start.yaml` — full contract cleanup: remove `run_id` from input, remove stale `status.json` output and `allowed_side_effects`, add accurate output declarations

---

## 2. Role-Based Recall Tier Defaults

### Tier Definitions

| Tier | CLI Flag | Size | Content |
|------|----------|------|---------|
| **L0** | `--tier L0` | ~100 tokens | One-line summary |
| **L1** | `--tier L1` | ~500-2k tokens | Imports + all symbol signatures |
| **Direct read** | _(no recall, use Read tool)_ | Full content | Raw file — used for editing/verifying |

Note: There is no `--tier L2` flag. "Direct read" means using the host's native file read tool (Read, cat, etc.), not a recall command.

### Role Assignments

| Role | Default Approach | Rationale |
|------|-----------------|-----------|
| Clarifier | Recall L1 | Needs structure, not implementation detail |
| Researcher | Recall L1 | Explores broadly, needs signatures and outlines |
| Specifier | Recall L1 | References existing code structure for spec constraints |
| Content-Author | Recall L1 | Needs to understand what exists, not edit it |
| Designer | Recall L1 | References code structure for design alignment |
| Planner | Recall L1 | Reads structure to plan tasks, not every line |
| Executor | Direct read | Actively editing code — needs full files |
| Verifier | Direct read | Running and inspecting actual code |
| Reviewer | Recall L1 → direct read on demand | Starts with structure, drills into flagged issues |
| Learner | Recall L0 | High-level patterns only — minimal context cost |

### Prerequisite: Summaries Must Exist

Roles that default to L0 or L1 require summaries to exist. The session start bootstrap (Section 1) ensures this by instructing the agent to run `wazir index build && wazir index summarize --tier all` when no index exists. If the agent skips indexing (small task, agent's decision), roles fall back to direct reads — the tier default is a preference, not a hard gate.

**Graceful degradation chain:** L0 fails → try L1 → L1 fails → direct file read. Every role contract documents this chain explicitly.

### Escalation Rule

Any role CAN escalate to a higher tier when justified. The default is a starting point, not a cage. The role must start at its default before going deeper.

### Contract Addition — L1 Roles (clarifier, researcher, specifier, content-author, designer, planner)

Added as a new section after `## Allowed Tools`:

```markdown
## Context retrieval

Default approach: recall L1 (structural summaries)
- Use `wazir index search-symbols <query>` to locate relevant code
- Use `wazir recall file <path> --tier L1` for structural understanding
- Use `wazir recall symbol <name-or-id> --tier L1` for symbol-level detail
- Escalate to direct file read only when the summary is insufficient for the task
- If recall fails (no index, no summaries), fall back to direct file reads
```

Also add to `## Allowed Tools`: `- Wazir CLI recall and index commands (see Context retrieval)`

### Contract Addition — Direct Read Roles (executor, verifier)

```markdown
## Context retrieval

Default approach: direct file read (full content)
- Use `wazir index search-symbols <query>` to locate relevant code before reading
- Read full files directly when editing or verifying
- Use `wazir recall file <path> --tier L1` for files you need to understand but not modify
```

### Contract Addition — Reviewer (L1 → direct read)

```markdown
## Context retrieval

Default approach: recall L1, escalate to direct read for flagged issues
- Read the diff first (primary input)
- Use `wazir index search-symbols <name>` to locate related code
- Use `wazir recall symbol <name-or-id> --tier L1` to check structural alignment
- Escalate to direct file read only for: logic errors, missing edge cases, integration concerns
- If recall fails, fall back to direct file reads
```

### Contract Addition — Learner (L0)

```markdown
## Context retrieval

Default approach: recall L0 (one-line summaries)
- Use `wazir recall file <path> --tier L0` for high-level understanding
- Use `wazir index search-symbols <query>` to discover relevant patterns
- Escalate: L0 fails → try L1 → L1 fails → direct file read
- If recall fails, fall back to direct file reads
```

### Files Modified

- `roles/clarifier.md` — add context retrieval section (L1) + update Allowed Tools
- `roles/researcher.md` — add context retrieval section (L1) + update Allowed Tools
- `roles/specifier.md` — add context retrieval section (L1) + update Allowed Tools
- `roles/content-author.md` — add context retrieval section (L1) + update Allowed Tools
- `roles/designer.md` — add context retrieval section (L1) + update Allowed Tools
- `roles/planner.md` — add context retrieval section (L1) + update Allowed Tools
- `roles/executor.md` — add context retrieval section (direct read) + update Allowed Tools
- `roles/verifier.md` — add context retrieval section (direct read) + update Allowed Tools
- `roles/reviewer.md` — add context retrieval section (L1→direct read) + update Allowed Tools
- `roles/learner.md` — add context retrieval section (L0) + update Allowed Tools

---

## 3. Full Run Lifecycle Capture

### Current Behavior

Hooks fire `capture route/output/event` for tool-level observability. No phase-level tracking. No run initialization from the pipeline. No usage report at session end.

### New Behavior

```
Session start (agent executes after reading bootstrap guidance):
  wazir capture init --run <generated-id> --phase clarify --status starting
  (capture init now also: calls initUsage(), writes <state-root>/runs/latest)

Phase transition (agent executes at each phase boundary):
  wazir capture event --run <id> --event phase_enter --phase <name> --status in_progress
  ... phase work ...
  wazir capture event --run <id> --event phase_exit --phase <name> --status completed

Gate decision (agent executes at approval gates):
  wazir capture event --run <id> --event gate_approved --phase <name>
  OR
  wazir capture event --run <id> --event gate_rejected --phase <name> --message "reason"

Loop iteration (agent executes when phase loops back):
  wazir capture event --run <id> --event phase_loop --phase <name> --loop-count N

Session end (agent executes before final summary):
  wazir capture usage --run <id>     → token savings report
  wazir capture summary --run <id>   → final summary
```

### Who Calls What

- **`capture init` creates:** run directory, `status.json`, `events.ndjson`, `usage.json` (new: via `initUsage()`), `<state-root>/runs/latest` file (new)
- **`capture output` records:** capture routing savings via `recordCaptureSavings(runPaths, rawBytes, 0)` (new) — `summaryBytes` is 0 because all output bytes are routed to file instead of injected into agent context
- **`capture event` records:** phase usage via `recordPhaseUsage(runPaths, phase, data)` when event is `phase_enter` or `phase_exit` (new)
- **Agent calls:** all `capture` commands via workflow instructions
- **Hooks call:** tool-level capture (route/output) — existing behavior, unchanged

### Usage Data Population

**Problem identified in review:** `usage.json` is never created by `capture init`, and `recordCaptureSavings`/`recordPhaseUsage` are never called by any handler. These are dead code.

**Fix (five CLI changes listed in Acknowledged CLI Changes section):**

1. `handleInit` → call `initUsage(runPaths, runId)` to create `usage.json` at run start
2. `handleOutput` → call `recordCaptureSavings(runPaths, rawBytes, 0)` after writing capture file
   - `rawBytes` = `Buffer.byteLength(output)` (already computed)
   - `summaryBytes` = `0` (the output was routed to file, so zero bytes went to context)
3. `handleEvent` → call `recordPhaseUsage(runPaths, phase, {events_count: 1})` for `phase_enter`/`phase_exit` events

**Bug fix needed:** `recordPhaseUsage` in `usage.js` line 129 uses replace semantics (`existing.events_count = data.events_count ?? existing.events_count`). This must change to increment semantics (`existing.events_count += data.events_count ?? 0`) or the phase event count will always show 1.

**What the usage report tracks:** Capture routing savings — how many bytes were routed to files instead of context. It does NOT track recall tier savings (tokens saved by using L1 instead of direct read). That would require recall-level instrumentation, which is out of scope.

### Session Recovery

When a session starts and the bootstrap guidance is injected:

1. Agent checks: does `<state-root>/runs/latest` exist?
2. If yes, reads the run ID and runs `wazir status --run <id> --json`
3. If status is not "completed": agent resumes from the last completed phase
4. If status is "completed" or file doesn't exist: agent runs `capture init` to start fresh

### Workflow File Changes

Each workflow markdown file gets two new sections. **Placement:** `## Phase entry` goes immediately after `## Purpose` (first thing the agent sees when entering the phase). `## Phase exit` goes immediately before `## Failure Conditions`.

```markdown
## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`
```

For gate workflows (spec-challenge, design-review, plan-review), add `## Gate decision` immediately after the existing `## Approval Gate`:

```markdown
## Gate decision

On approval: `wazir capture event --run <run-id> --event gate_approved --phase <phase-name>`
On rejection: `wazir capture event --run <run-id> --event gate_rejected --phase <phase-name> --message "<reason>"`
```

### Workflow Count and Export Drift

There are **16 files** in `workflows/`: 14 declared in manifest, `run-audit.md` (undeclared), and `README.md`.

- **14 declared workflows** get capture events AND cause export drift (they are hashed by the export compiler)
- **`run-audit.md`** gets capture events but does NOT cause export drift (undeclared in manifest, not hashed)
- **`README.md`** is excluded — it is not a workflow

Total: 15 workflow files modified (14 + run-audit). Only 14 trigger export drift.

**Note on `run-audit.md`:** This workflow is not exported to host packages, so agents only see its instructions if they read the file directly from the repo. Adding capture events to it is still useful for projects that use it directly. Whether to add it to the manifest is a separate concern.

### Boilerplate Maintenance

Adding capture instructions to all 15 workflows creates ~120 lines of near-identical boilerplate. For v1 we inline the instructions to keep workflows self-contained. If maintenance becomes a burden (e.g., capture command interface changes), extract to a shared reference doc (`docs/reference/capture-protocol.md`) with workflows referencing it.

### Files Modified

- 15 `workflows/*.md` files (excluding README.md) — add phase entry/exit capture instructions
- `tooling/src/checks/command-registry.js` — add `capture usage` entry
- `tooling/src/capture/command.js` — `handleInit`: call `initUsage()`, write `latest` file; `handleOutput`: call `recordCaptureSavings()`; `handleEvent`: call `recordPhaseUsage()`
- `tooling/src/capture/usage.js` — fix `recordPhaseUsage` to use increment instead of replace

---

## 4. Bookend Validation + Export Drift

### Checkpoint Map

```
Session start (agent, guided by hook bootstrap):
  └─ wazir doctor                  → repo health check

Pre-execution (execute workflow precondition — agent checks before implementing):
  ├─ wazir validate manifest       → schema still valid
  └─ wazir validate hooks          → hook contracts intact

Post-execution (verifier role — extends existing validation surface):
  ├─ wazir validate manifest       → still valid after changes
  ├─ wazir validate hooks          → hooks not broken by changes
  ├─ wazir validate docs           → no doc drift introduced
  ├─ wazir validate brand          → naming conventions held
  ├─ wazir validate runtime        → no forbidden runtime surfaces
  ├─ wazir validate branches       → (existing)
  ├─ wazir validate commits        → (existing)
  ├─ wazir validate changelog      → (existing)
  └─ wazir export --check          → export drift detection
       └─ if drift → executor runs `wazir export build` → re-verify
```

### Pre-Execution Validation Is a Precondition, Not a Gate

The pre-execution checks are instructions in the execute workflow that the agent runs before implementing. If validation fails:
1. Agent surfaces the failure to the user
2. Agent does NOT proceed with implementation
3. User resolves the issue (or instructs agent to fix it)
4. This is NOT an approval gate — it does not require explicit "approve" action, just passing checks

### Export Drift Fix Loop

If `wazir export --check` detects drift in verifier:
1. Verifier reports drift as a verification finding
2. Executor runs `wazir export build` to regenerate
3. Verifier re-runs `export --check` to confirm
4. If `export build` itself fails — verifier reports as a blocking failure, escalates to user
5. Maximum 1 export rebuild attempt per verification cycle (enforced by instruction, not loop-cap-guard)
6. If rebuilt exports cause other validation failures (docs, brand) — verifier reports all failures together, executor addresses them, then re-verify

### Failure Behavior

- Doctor failure at session start: agent surfaces to user, proceeds with caution (not blocked)
- Pre-execution validation failure: agent surfaces to user, blocks execution until resolved
- Post-execution validation failure: verifier reports as verification failure, loops back to executor
- Export drift: single rebuild attempt, then escalate if still failing

### Files Modified

- `workflows/execute.md` — add pre-execution validation preconditions
- `roles/verifier.md` — extend validation surface with `export --check`

---

## 5. Symbol-First Exploration for Debugging & Review

### wz:debugging — OBSERVE Phase Rewrite

Current: grep/read files broadly, form hypothesis from full content.

New:

```
OBSERVE:
1. wazir index search-symbols <suspected-area>
   → find relevant symbols by name
2. wazir recall symbol <name-or-id> --tier L1
   → understand structure (signature, JSDoc, imports)
3. Form hypothesis based on L1 summaries
4. wazir recall file <path> --start-line N --end-line M
   → read ONLY the suspect code slice
5. Escalate to full file read only if the bug cannot be localized from slices
6. If recall fails (no index/summaries), fall back to direct file reads — the generic
   OBSERVE methodology (read files, inspect state, gather evidence) still applies
```

### Character Change Acknowledgment

This rewrite shifts `wz:debugging` from a generic, host-neutral debugging methodology to a Wazir-CLI-aware procedure. The generic 4-step loop (Observe → Hypothesize → Test → Fix) is preserved — only the OBSERVE implementation details change. Step 6 ensures the skill degrades gracefully to its original generic behavior when the index is unavailable.

### Reviewer — Exploration Rewrite

Current: read full files referenced in diff.

New:

```
1. Read the diff (unchanged — this is the primary input)
2. For flagged areas:
   wazir index search-symbols <name>
   → locate related code and callers
3. wazir recall symbol <name-or-id> --tier L1
   → check if change aligns with existing structure
4. Escalate to direct file read ONLY for:
   - Logic errors that need full function context
   - Missing edge cases that need surrounding code
   - Integration concerns that need call-site context
5. If recall fails, fall back to direct file reads
```

### Files Modified

- `skills/debugging/SKILL.md` — rewrite OBSERVE phase with symbol-first protocol + fallback
- `roles/reviewer.md` — add symbol-first exploration protocol (combined with Section 2 context retrieval)

---

## 6. scan-project Skill Integration

### Current Behavior

`skills/scan-project/SKILL.md` defines what to inspect (manifests, docs, tests, `input/`) and what to produce (a project profile). It does not prescribe specific tools.

### New Behavior

After the initial scan, `scan-project` instructs the agent to:
- Run `wazir index build && wazir index summarize --tier all` if no index exists
- Run `wazir index refresh` if an index already exists
- Include index stats (file count, symbol count, outline count) in the project profile output

### Files Modified

- `skills/scan-project/SKILL.md` — add index build/refresh step after scan

---

## Implementation Order

| Order | Change | Risk | Dependency | Export Drift? |
|-------|--------|------|------------|---------------|
| 1 | `tooling/src/checks/command-registry.js` (add `capture usage`) | Low | None | No |
| 2 | `tooling/src/capture/command.js` (initUsage + latest + recordCaptureSavings + recordPhaseUsage) | Low | None | No |
| 3 | `tooling/src/capture/usage.js` (fix increment bug) | Low | None | No |
| 4 | `hooks/session-start` + `hooks/definitions/session_start.yaml` (bootstrap guidance + contract cleanup) | Low | None | **Yes — hook defs are hashed** |
| 5 | Role context retrieval sections (all 10 roles) + Allowed Tools updates | Low | Step 4 ensures bootstrap guidance exists | **Yes** |
| 6 | Workflow capture events (14 declared + run-audit.md) | Low | Step 2 ensures `capture init` works | **Yes (14 declared only)** |
| 7 | `roles/verifier.md` validation extension + export drift | Medium | Steps 5-6 complete | **Yes** |
| 8 | `workflows/execute.md` preconditions | Medium | Step 7 (verifier handles failures) | **Yes** |
| 9 | `skills/debugging/SKILL.md` OBSERVE rewrite | Medium | Index CLI exists (pre-existing) | No (skills not hashed) |
| 10 | `skills/scan-project/SKILL.md` index integration | Low | Index CLI exists (pre-existing) | No (skills not hashed) |

**Export drift note:** Steps 4-8 modify files hashed in export manifests. `wazir export build` must run after each step or be batched.

**Recommended batching:**
- **Batch A (CLI fixes):** Steps 1-3 in one commit — no export drift
- **Batch B (pipeline wiring):** Steps 4-8 in one commit with `wazir export build` at the end
- **Batch C (skills):** Steps 9-10 in one commit — no export drift

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Index build is slow on large repos | Session start delay | Hybrid: agent decides based on bootstrap guidance; `index refresh` is incremental |
| Stale L1 summaries mislead agent | Wrong assumptions | Recall returns `fresh: false` flag; agent re-summarizes or reads directly |
| No index/summaries available | Recall commands fail | Every role and skill has explicit fallback chain: L0 → L1 → direct read |
| `summarize` throws on zero files | Index build appears to succeed but summaries fail | Treated same as build failure: fall back to direct reads |
| Capture events add context noise | Token overhead | Events are fire-and-forget CLI calls; agent discards stdout |
| Export drift during multi-step implementation | CI failures between steps | Batch steps 4-8 into single commit with `export build` |
| Export drift fix loop in verifier | Potential infinite loop | Max 1 rebuild attempt per verification cycle, then escalate |
| `run-audit.md` undeclared in manifest | Not exported to hosts | Add capture events anyway; agents reading it directly still benefit |
| Hook cannot distinguish startup vs compact | Could regenerate run ID | Agent reads `latest` file to discover existing run; hook is stateless |
| `usage.json` never populated | Empty usage report | Fixed by CLI changes 2-5 (initUsage + recording calls + increment fix) |
| Concurrent sessions on same project | `latest` file race, event interleaving | v1 assumes single session per project; future: PID-based lock or session discriminator in run ID |

---

## Success Criteria

1. `wazir doctor` guidance appears in session start bootstrap
2. Index exists and is queryable before any exploration phase (when agent follows bootstrap)
3. All 15 workflow files have capture event instructions (14 declared + run-audit)
4. `wazir capture usage` produces a capture routing savings report at session end (tracks file-vs-context routing, not recall tier savings)
5. Roles use their assigned default tier before escalating, with explicit fallback chain
6. `wazir validate` + `export --check` run in verifier phase
7. `wz:debugging` OBSERVE phase uses symbol search before file reads (with fallback to generic methodology)
8. Reviewer uses L1 recall before reading full files (with fallback)
9. Run ID persists across compaction via `<state-root>/runs/latest` file
10. No regression in existing hook behavior (capture, protected paths, loop caps)
11. `wazir export --check` passes after all changes are implemented
12. `capture usage` is registered in command registry
13. `capture init` creates `usage.json` and writes `latest` file
14. `session_start.yaml` contract is fully cleaned up (stale outputs and side effects removed)
15. `recordPhaseUsage` uses increment semantics for `events_count`
16. Role `## Allowed Tools` sections mention CLI recall/index commands
