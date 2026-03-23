---
name: self-audit
description: Run a self-audit loop in an isolated git worktree — validates, audits, fixes, verifies, and merges back only on green. Safe self-improvement that cannot break the main working tree.
---
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->

# Self-Audit — Worktree-Isolated Audit-Fix Loop

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

## Overview

This skill runs a structured self-audit of the Wazir project itself, operating entirely in an isolated git worktree. It validates the project against all canonical checks, performs deeper structural analysis, fixes issues found, verifies the fixes pass, and only merges back on all-green.

**Safety guarantee:** The main worktree is never modified until all checks pass in isolation.

## Severity Levels

Every finding is assigned a severity that determines handling:

| Severity | Action | Description |
|----------|--------|-------------|
| **critical** | Abort loop | Structural integrity threat — cannot safely continue. Discard worktree. |
| **high** | Fix now | Must be resolved in this loop before proceeding to verify. |
| **medium** | Fix if time | Fix within remaining loop budget. Skip if loop cap approaching. |
| **low** | Log and skip | Record in report. No fix attempted. |

Severity assignment rules:
- Protected-path violation → **critical**
- Test failure, broken hook, missing manifest entry → **high**
- Documentation drift, stale export, missing schema → **medium**
- Style issues, minor inconsistency, cosmetic → **low**

## Quality Scoring

Each loop measures a quality score **before** and **after** fixes:

```
quality_score = (checks_passing / total_checks) * 100
```

Track per loop:
- `quality_score_before` — score at start of loop (after Phase 1)
- `quality_score_after` — score at end of loop (after Phase 4 verify)
- `delta` — improvement from this loop's fixes

**Effectiveness threshold:** If 3 consecutive loops show `delta < 2%`, the audit has converged — skip remaining loops.

## Learning Integration

After each audit loop, findings feed the learning pipeline:

1. **Propose learnings:** For each finding category that appeared in this loop:
   - Check `state.sqlite` findings table for the same `finding_hash` in previous runs
   - If `recurrence_count >= 2`: auto-propose a learning to `memory/learnings/proposed/`
   - Learning scope tags: `scope_roles: [executor]`, `scope_concerns: [quality]`
2. **Store findings:** Insert all findings into `state.sqlite` via `insertFinding()` with severity and finding_hash
3. **Store audit record:** Insert `{run_id, finding_count, fix_count, manual_count, quality_score_before, quality_score_after}` into `audit_history`

## Trend Tracking

Before starting Loop 1, query previous audit results:

```javascript
const trend = getAuditTrend(db, 5); // last 5 audits
```

Present trend in the report:
- Are finding counts trending up or down?
- Are the same finding_hashes recurring? If so, the fixes aren't preventing recurrence — escalate.
- Has quality_score improved across runs?

## Escalation Path

Manual-required findings that cannot be auto-fixed are escalated:

1. **Within the audit:** Logged in the report with remediation guidance
2. **Cross-run recurrence:** If the same manual finding recurs across 3+ audits, escalate to:
   - Create a task spec in `.wazir/runs/latest/tasks/` describing the fix
   - Flag in the audit report as **RECURRING — needs dedicated task**
3. **Critical findings:** Immediately logged. If 2+ critical findings in a single loop, abort the entire audit run.

## Trigger

On-demand: operator invokes `/self-audit` or requests a self-audit loop.

### Parameters

| Flag | Default | Max | Description |
|------|---------|-----|-------------|
| `--loops N` | 5 | 10 | Number of audit-fix loops to run. Each loop executes the full Phase 1-5 cycle. If a loop finds 0 new issues, subsequent loops are skipped (convergence detection). |

## Worktree Isolation Model

```
main worktree (untouched)
  └── agent spawns in isolated worktree (git worktree)
        ├── Phase 1: Validate (run all checks)
        ├── Phase 2: Deep audit (structural analysis)
        ├── Phase 3: Fix (remediate findings)
        ├── Phase 4: Verify (re-run all checks)
        └── Phase 5: Report (commit in worktree if green)
```

If any Phase 4 check fails, the worktree is discarded — no changes reach main.

## Phase 1: CLI Validation Sweep

Run every validation check and capture results:

```bash
node tooling/src/cli.js validate manifest
node tooling/src/cli.js validate hooks
node tooling/src/cli.js validate docs
node tooling/src/cli.js validate brand
node tooling/src/cli.js validate runtime
node tooling/src/cli.js validate changelog
node tooling/src/cli.js validate commits
node tooling/src/cli.js doctor --json
node tooling/src/cli.js export --check
```

Collect pass/fail for each. Any failure is a finding. Assign severity per the severity table above.

Calculate `quality_score_before` from the pass/fail results.

## Phase 2: Deep Structural Audit

Beyond CLI checks, inspect for:

1. **Cross-reference consistency**
   - Every role in `wazir.manifest.yaml` has a file in `roles/`
   - Every workflow in manifest has a file in `workflows/`
   - Every skill directory has a `SKILL.md`
   - Every schema referenced in docs exists in `schemas/`
   - Composition map concerns reference existing expertise modules

2. **Documentation drift**
   - `docs/architecture.md` component table matches actual directory structure
   - `docs/roles-and-workflows.md` role/workflow lists match manifest
   - README claims match actual project state

3. **Export freshness**
   - Generated exports match canonical sources (via `export --check`)
   - Host export directories contain expected structure

4. **Schema coverage**
   - Every workflow that produces artifacts has a corresponding schema
   - Schema files are valid JSON

5. **Hook integrity**
   - Hook scripts referenced in `.claude/settings.json` exist and are executable
   - Hook definitions in `hooks/definitions/` cover all manifest-required hooks

6. **Skill structure**
   - Each skill dir under `skills/` has a well-formed `SKILL.md` with frontmatter
   - Skills referenced in documentation actually exist

7. **Code Quality**
   - Run `node tooling/src/cli.js validate` (all subcommands) and capture exit codes
   - If `eslint` is present in `package.json` scripts or devDependencies, run `npx eslint .` and capture results
   - If `tsc` is present in `package.json` scripts or devDependencies, run `npx tsc --noEmit` and capture results
   - Tools not found in `package.json` are skipped with a note in the report

8. **Test Coverage**
   - Run `npm test` and capture pass/fail counts from output
   - Any test failure is a finding

9. **Expertise Coverage**
   - Read `expertise/composition-map.yaml`
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->
   - For every module path referenced, check that the file exists under `expertise/`
   - Missing files are findings

10. **Export Freshness**
    - Run `wazir export --check`
    - Any drift detected is a finding

11. **Input Coverage** (run-scoped — only when a run directory exists)
    - Read the original input file(s) from `.wazir/input/` or `.wazir/runs/<id>/sources/`
    - Read the execution plan from `.wazir/runs/<id>/clarified/execution-plan.md`
    - Read the actual commits on the branch: `git log --oneline main..HEAD`
    - Build a coverage matrix: every distinct item in the input should map to:
      - At least one task in the execution plan
      - At least one commit in the git log
    - **Missing items** (in input but not in plan AND not in commits) → **HIGH** severity finding
    - **Partial items** (in plan but no corresponding commit) → **MEDIUM** severity finding
    - **Fully covered items** (input → plan → commit) → pass
    - Output the coverage matrix in the audit report:
      ```
      | Input Item | Plan Task | Commit | Status |
      |------------|-----------|--------|--------|
      | Item 1     | Task 3    | abc123 | PASS   |
      | Item 2     | Task 5    | —      | PARTIAL|
      | Item 3     | —         | —      | MISSING|
      ```
    - This dimension catches scope reduction AFTER the fact — a safety net for when the clarifier or planner fails

## Protected-Path Safety Rails

Before applying ANY fix in Phase 3, check if the target file is in a protected path. The self-audit loop MUST NOT modify files in:

- `skills/`
- `workflows/`
- `roles/`
- `schemas/`
- `wazir.manifest.yaml`
- `docs/concepts/`
- `docs/reference/`
- `expertise/composition-map.yaml`
- `docs/plans/`
- `program.md`

If a fix would touch a protected path, log it as a **manual-required** finding and skip. If `git diff --name-only` shows any protected path was modified during a loop iteration, **ABORT** the loop and discard the worktree.

## Phase 3: Fix

For each finding from Phases 1-2, ordered by severity (critical first):

1. **Critical findings:** Abort immediately. Discard worktree. Report the critical finding.
2. **High findings:** Must fix now.
3. **Medium findings:** Fix if loop budget allows (remaining loops > 1).
4. **Low findings:** Log only. No fix attempted.

For high/medium findings:
1. Categorize as **auto-fixable** or **manual-required**
2. Auto-fixable issues: apply the fix directly
   - Missing files → create stubs or fix references
   - Stale exports → run `export build`
   - Documentation drift → update docs to match reality
   - Permission issues → `chmod +x` hook scripts
   - Schema formatting → auto-format
3. Manual-required issues: document in the audit report with remediation guidance. Check escalation path for recurrence.

**Fix constraints:**
- Never modify `input/` (read-only operator surface)
- Prefer updating docs to match code (code is truth) unless the code is clearly wrong
- Keep fixes minimal — one concern per change

## Phase 4: Verify

Re-run the entire Phase 1 validation sweep. All checks must pass.

If any check fails after fixes:
- Revert the failing fix
- Document the revert and the root cause
- Re-verify

## Phase 5: Report, Learn & Commit

### Quality Score

Re-run Phase 1 checks and calculate `quality_score_after`. Compute delta.

### Learning Extraction

1. Hash each finding description → `finding_hash`
2. Store all findings in `state.sqlite` via `insertFinding(db, {run_id, phase: 'self-audit', source: 'self-audit', severity, description, finding_hash})`
3. Query `getRecurringFindingHashes(db, 2)` — findings occurring 2+ times across runs
4. For each recurring finding not already in `memory/learnings/proposed/`:
   - Write a learning proposal: `memory/learnings/proposed/self-audit-<hash-prefix>.md`
   - Content: what the issue is, how often it recurs, recommended prevention
5. Store audit record: `insertAuditRecord(db, {run_id, finding_count, fix_count, manual_count, quality_score_before, quality_score_after})`

### Report

Produce a structured report:

```markdown
# Self-Audit Report — Loop N — <date>

## Quality Score
- Before: X% → After: Y% (delta: +Z%)

## Trend (last 5 audits)
| Run | Date | Findings | Fixes | Quality |
|-----|------|----------|-------|---------|
| ... | ...  | ...      | ...   | ...     |

## Validation Sweep
| Check | Severity | Before | After |
|-------|----------|--------|-------|
| manifest | high | PASS/FAIL | PASS |
| hooks | high | PASS/FAIL | PASS |
| ... | ... | ... | ... |

## Findings by Severity
### Critical (N) — loop aborted if any
### High (N) — fixed
### Medium (N) — fixed if budget allowed
### Low (N) — logged only

## Auto-Fixed (N)
- [F-001] [high] <description> — fixed by <change>
- ...

## Manual Required (N)
- [M-001] [medium] <description> — remediation: <guidance>
- [M-002] [medium] <description> — **RECURRING (3x)** — needs dedicated task
- ...

## Proposed Learnings (N)
- <learning-file>: <summary>
- ...

## Changes Made
- <file>: <what changed>
- ...

## Verification
All checks: PASS/FAIL
```

If all checks pass, commit changes in the worktree with:
```
fix(self-audit): loop N — <summary of fixes>
```

The worktree agent returns its results. If changes were made, the caller can merge them.

## Loop Behavior

Default: **5 loops** (override with `--loops N`, max 10).

When running multiple loops:
- Loop 1 audits the current state, fixes what it finds
- Loop 2 audits the result of Loop 1, catches anything missed or introduced
- Each loop is independent and runs in its own fresh worktree
- **Convergence detection:** if Loop N finds **0 new issues** (no new findings beyond what previous loops already reported), all subsequent loops are skipped and the audit terminates early
- **Effectiveness convergence:** if 3 consecutive loops show `quality_score delta < 2%`, skip remaining loops
- **Critical abort:** if any loop encounters 2+ critical findings, abort the entire audit run
- If a loop modifies a protected path (see Protected-Path Safety Rails above), the loop is aborted and the worktree is discarded

The final branch is **NOT auto-merged** — it requires human review.

## State Database Integration

The self-audit skill requires `state.sqlite` (see `tooling/src/state/db.js`). At audit start:

```javascript
const { openStateDb, getAuditTrend, insertFinding, insertAuditRecord, getRecurringFindingHashes } = require('../../tooling/src/state/db');
const db = openStateDb(stateRoot);
```

All findings are persisted across runs, enabling trend detection and learning extraction.

<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->