# Subtask: Add Run Pruning Core Logic

## Metadata
- **Task**: 2 of 5 (Implement run pruning feature)
- **Subtask**: 1 of 2
- **Traces to**: REQ-003 (Users can limit stored runs to conserve disk space)
- **Depends on**: Task 1 / Subtask 1 (state root path resolution — must be complete)
- **Blocks**: Task 2 / Subtask 2 (CLI wiring for prune command)

## Context

Wazir stores run directories under `~/.wazir/projects/<slug>/runs/`. Over time these accumulate. Users need to prune old runs while protecting the `latest` symlink target. The research phase found that GNU Stow and Homebrew both use a "keep N newest, delete rest" pattern with symlink protection — we follow that precedent.

## Inputs

- `src/state/paths.js` — exports `getRunsDir()` and `getLatestSymlink()`
- `src/state/run.js` — exports `Run` class with `createdAt` timestamp
- Spec requirement: `latest` symlink must never point to a deleted run
- Design decision: standalone `prune/` module (Option B from design phase)

## Expected Outputs

- New file: `src/prune/core.js`
  - Exports `pruneRuns(runsDir, keep)` → `{ deleted: string[], preserved: string[], latestProtected: boolean }`
  - Pure function. No side effects beyond file deletion. No CLI coupling.
- New file: `src/prune/core.test.js`

## Acceptance Criteria

1. WHEN `pruneRuns` is called with `keep=3` and 10 run directories exist, THEN exactly 7 oldest directories SHALL be deleted and 3 newest SHALL be preserved.
2. WHEN the `latest` symlink points to a run that would be deleted by age, THEN that run SHALL be preserved and the next-oldest SHALL be deleted instead.
3. WHEN `keep` is greater than or equal to the total run count, THEN no runs SHALL be deleted and the function SHALL return `{ deleted: [], preserved: [...all], latestProtected: false }`.
4. WHEN `keep` is 0 or negative, THEN the function SHALL throw `InvalidKeepValueError` without deleting anything.
5. WHEN a run directory cannot be deleted (permission error), THEN the function SHALL collect the error, continue with remaining deletions, and include failed paths in the return value.

## Verification Criteria

```bash
# Run the tests
npm test -- src/prune/core.test.js

# Expected: all tests pass, exit code 0

# Verify no lint errors
npm run lint -- src/prune/core.js src/prune/core.test.js

# Verify the function is importable
node -e "const { pruneRuns } = require('./src/prune/core'); console.log(typeof pruneRuns)"
# Expected output: function
```

## Pre-conditions

- `src/state/paths.js` exists and `getRunsDir()` returns a valid path
- `src/state/run.js` exists and runs have `createdAt` timestamps
- Node.js fs/promises available

## Post-conditions

- `src/prune/core.js` exists and exports `pruneRuns`
- `src/prune/core.test.js` exists with tests covering all 5 acceptance criteria
- All tests pass
- No lint errors
- No changes to any file outside `src/prune/`

## Constraints

- Do NOT add CLI wiring — that is subtask 2
- Do NOT import from `src/cli/` — prune core must be CLI-independent
- Do NOT use `fs.rmSync` — use `fs.promises.rm` with `{ recursive: true }`
- Do NOT delete the `latest` symlink itself under any circumstances
- Keep it simple — no configuration objects, no builder pattern, just a function

## File Dependencies

| File | Relation | Notes |
|------|----------|-------|
| `src/prune/core.js` | WRITES | New file — no conflict risk |
| `src/prune/core.test.js` | WRITES | New file — no conflict risk |
| `src/state/paths.js` | READS | Imports `getRunsDir()`, `getLatestSymlink()` |
| `src/state/run.js` | READS | Imports `Run` class |

No file is written by another subtask → safe for parallel execution with task-1/subtask-1, task-3/subtask-1, task-3/subtask-2.

## Batch Assignment

**Batch 2** — runs in parallel after Task 0 (convergence-point refactor) and Task 1/Subtask 1 (state root path resolution). Natural handover point: after Batch 2 completes, run integration check before Batch 3 (CLI wiring subtasks that depend on core modules).

## Expertise Declarations

Keys map to `expertise/composition-map.yaml`:

- **Model tier**: Standard (not cheapest — conditional logic, edge cases, error handling)
- **Tools needed**: file write, file read, bash (for running tests)
- **Stack**: `node`
- **Concerns**: `error-handling`, `testing`
- **Review focus**: `api-design` (public function signature matters for downstream subtask)

The composer resolves: `always.executor` + `stacks.node.executor` + `auto.all-stacks.all-roles` + `concerns.error-handling` + `concerns.testing`.

## Context Budget

| File | Access Level | Size | Reason |
|------|-------------|------|--------|
| `src/state/paths.js` | READ FULL | ~40 lines | Need full API surface for `getRunsDir()`, `getLatestSymlink()` |
| `src/state/run.js` | READ SECTION | lines 1-25 | Only need `Run` class constructor and `createdAt` field |
| `spec.md` | READ SECTION | REQ-003 only (~15 lines) | Only the pruning requirement |
| `src/cli/commands.js` | KNOW EXISTS | — | Will be imported by subtask 2, not read here |
| `src/prune/` | KNOW EXISTS | — | Directory doesn't exist yet, executor creates it |

Total context loaded: ~80 lines. Leaves maximum reasoning capacity for TDD implementation.

## Approach

TDD — write failing tests first, then implement until green.
