# CLI Pipeline Integration -- Implementation Plan

> **Date:** 2026-03-15
> **Source:** Design doc v4, spec-hardener-reviewed task specs (004-016)
> **Total tasks:** 13 (tasks 004-016)
> **Total files modified:** ~34 (3 CLI source + 1 test config + 10 roles + 15 workflows + 2 hooks + 1 guard + test files + N regenerated exports)
> **Batches:** 3
> **Commit strategy:** Batch A = individual commits; Batch B = single atomic commit; Batch C = individual commits

---

## Executive Summary

Wire all 7 Wazir CLI command families into the agent pipeline so that roles, workflows, skills, and hooks leverage indexing, recall, validation, capture, doctor, status, and export drift detection. The implementation spans 13 tasks across 3 batches:

- **Batch A** (tasks 004-007): Fix CLI source gaps -- register missing test file, add missing command to registry, wire capture handlers to usage tracking functions, fix increment bug. Zero export drift risk.
- **Batch B** (tasks 008-014): Pipeline wiring -- add write guard approved flow, extend session-start hook, add context retrieval to 10 roles, add capture events to 15 workflows, extend verifier validation surface, add execute preconditions, rebuild exports. 25 files cause export drift, sealed by a single `export build` + commit.
- **Batch C** (tasks 015-016): Skill updates -- rewrite debugging OBSERVE phase, add index integration to scan-project. Zero export drift risk.

Batch C is independent and can run in parallel with A or B.

---

## Pre-Flight Checklist

Before starting any implementation, verify all of the following:

- [ ] **Working branch created:** `feat/cli-pipeline-integration` (or similar) from `main` (Article III)
- [ ] **Node.js >= 20.0.0** installed
- [ ] **`npm test` passes on the clean branch** with zero failures
- [ ] **`wazir export --check` passes** on the clean branch (no pre-existing drift)
- [ ] **All 13 task spec files reviewed** in `.wazir/tasks/clarified/` (004-016)
- [ ] **`tooling/src/capture/command.js` imports confirmed:** `fs` (line 1) and `path` (line 2) are already imported -- no additional module imports needed for task 006
- [ ] **`tooling/test/capture.test.js` fixture pattern confirmed:** `createCaptureFixture()` provides `fixtureRoot`, `stateRoot`, and `cleanup()` -- new tests must use unique run IDs
- [ ] **`tooling/test/role-contracts.test.js` is in `test:active`** -- confirmed, so workflow and role structural tests can be added there without new test file registration

---

## Dependency Graph

```
Batch A (parallel where possible):
  004 (register usage.test.js) ─┬─> 006 (wire capture handlers)
                                 └─> 007 (fix increment bug)
  005 (add capture usage to registry) -- parallel with 004, no deps

Batch B (sequential after Batch A complete):
  008 (add pipeline_integration flow) ─┬─> 009 (hook updates)
                                        ├─> 010 (role context retrieval)
                                        └─> 011 (workflow capture events)
                                                   │         │
                                             010 + 011 ─> 012 (verifier extension)
                                                              │
                                                          012 ─> 013 (execute preconditions)
                                                              │
                            009 + 010 + 011 + 012 + 013 ─> 014 (export build + commit)

Batch C (independent, can parallel with any batch):
  015 (debugging skill rewrite)
  016 (scan-project index integration)
```

---

## Batch A -- CLI Source Fixes

**Commit strategy:** Individual commits per task (or batch all 4 into one)
**Export drift:** None (CLI source and test files are not hashed)
**Estimated file count:** 5 files (package.json, command-registry.js, command.js, usage.js, usage.test.js) + capture.test.js = 6

### Task 004 -- Register usage.test.js in test:active

**What:** Add `tooling/test/capture/usage.test.js` to the `test:active` script in `package.json`.

**Files to modify:**
- `package.json`

**TDD steps:**
1. Run `npm test` and confirm usage.test.js output is absent (red baseline)
2. Append `tooling/test/capture/usage.test.js` to the `test:active` script (idempotent -- check if already present)
3. Run `npm test` and confirm usage test output now appears (green)

**Verification:**
```bash
npm test
# Confirm usage.test.js appears in output
```

**Commit:**
```
test(capture): register usage.test.js in test:active suite
```

---

### Task 005 -- Add 'capture usage' to command registry

**What:** Add `'wazir capture usage'` to `SUPPORTED_COMMAND_SUBJECTS` Set in `command-registry.js`.

**Files to modify:**
- `tooling/src/checks/command-registry.js`
- `tooling/test/cli.test.js` (add assertion)

**TDD steps:**
1. Add test in `cli.test.js` asserting `capture usage` is a recognized command (red)
2. Add `'wazir capture usage'` after `'wazir capture summary'` in the Set (green)
3. Run `npm test`

**Verification:**
```bash
npm test
```

**Commit:**
```
fix(capture): add capture usage to command registry
```

---

### Task 006 -- Wire capture handlers

**What:** Wire `initUsage`, `recordCaptureSavings`, `recordPhaseUsage` into `handleInit`, `handleOutput`, `handleEvent` respectively. Write `latest` file in `handleInit`.

**Files to modify:**
- `tooling/src/capture/command.js` (update import line 19, add handler calls)
- `tooling/test/capture.test.js` (add tests A-D)

**TDD steps:**
1. Add 4 tests (A: init creates usage.json + latest, B: output records savings, C: event records phase usage, D: non-phase event does NOT record phase usage) -- all should fail (red)
2. Update import on line 19 to add `initUsage, recordCaptureSavings, recordPhaseUsage`
3. Wire `handleInit`: call `initUsage(runPaths, options.run)` + write `latest` file with try/catch
4. Wire `handleOutput`: call `recordCaptureSavings(runPaths, Buffer.byteLength(output), 0)` after `writeStatus`
5. Wire `handleEvent`: call `recordPhaseUsage` only for `phase_enter`/`phase_exit` events
6. Run `npm test` (green)

**Key detail:** `fs` and `path` are already imported at lines 1-2 of `command.js`. No additional module imports needed.

**Verification:**
```bash
npm test
```

**Commit:**
```
feat(capture): wire initUsage, recordCaptureSavings, recordPhaseUsage into handlers
```

---

### Task 007 -- Fix recordPhaseUsage increment bug

**What:** Change line 129 of `usage.js` from `=` (replace) to `+=` (increment) for `events_count`.

**Files to modify:**
- `tooling/src/capture/usage.js` (line 129)
- `tooling/test/capture/usage.test.js` (add multi-call test)

**TDD steps:**
1. Add test: call `recordPhaseUsage` 3 times with `{events_count: 1}`, assert total is 3 (red -- currently returns 1)
2. Change `existing.events_count = data.events_count ?? existing.events_count` to `existing.events_count += data.events_count ?? 0`
3. Do NOT change lines 130-131 (bytes use replace semantics correctly)
4. Run `npm test` (green)

**Verification:**
```bash
node --test tooling/test/capture/usage.test.js
npm test
```

**Commit:**
```
fix(capture): use increment semantics for recordPhaseUsage events_count
```

---

## Batch B -- Pipeline Wiring

**Commit strategy:** Single atomic commit after all tasks complete + export build
**Export drift:** Yes -- 25 of 27 modified files are hashed canonical sources
**Estimated file count:** 27 source files + test file modifications + N regenerated export files

> **CRITICAL:** All Batch B tasks stage but do NOT commit individually. Task 014 performs the single commit after `export build`.

### Task 008 -- Add pipeline_integration approved flow

**What:** Add `'pipeline_integration'` to `APPROVED_FLOWS` in the write guard. This unblocks all subsequent Batch B writes to `roles/` and `workflows/`.

**Files to modify:**
- `tooling/src/guards/protected-path-write-guard.js` (add to Set)
- `tooling/test/guard-hooks.test.js` (add test)

**TDD steps:**
1. Inspect existing `runGuard` helper and guard JSON output format in `guard-hooks.test.js`
2. Add test: `pipeline_integration` flow allows writing to `roles/executor.md` (red)
3. Add `'pipeline_integration'` to `APPROVED_FLOWS` Set (green)
4. Run `npm test`

**Verification:**
```bash
npm test
```

**Stage only (do not commit):**
```bash
git add tooling/src/guards/protected-path-write-guard.js tooling/test/guard-hooks.test.js
```

---

### Task 009 -- Update session-start hook and contract

**What:** Extend `hooks/session-start` to inject CLI bootstrap guidance. Clean up stale `session_start.yaml` contract.

**Files to modify:**
- `hooks/session-start` (add CLI bootstrap block)
- `hooks/definitions/session_start.yaml` (full file replacement)

**TDD steps:**
1. Add test in `guard-hooks.test.js`: hook output matches `/wazir doctor/`, `/wazir index refresh/`, `/wazir index build/`, `/wazir capture init/`, `/runs\/latest/` (red)
2. Add CLI bootstrap block OUTSIDE the skill if/else in the hook script (always outputs)
3. Replace `session_start.yaml` entirely (remove `run_id` from input, update output contract, empty `allowed_side_effects`)
4. Verify hook still exits 0 (Article XIII)
5. Run `npm test` (green)

**Verification:**
```bash
npm test
```

**Stage only.**

---

### Task 010 -- Add context retrieval to all 10 roles

**What:** Add `## Context retrieval` section to all 10 role files with tier-appropriate defaults. Update `## Allowed Tools` to mention CLI commands.

**Files to modify:**
- 10 `roles/*.md` files
- `tooling/test/role-contracts.test.js` (structural tests)

**TDD steps:**
1. Add structural tests: (a) all roles have `## Context retrieval`, (b) section ordering (between Allowed Tools and Required Outputs), (c) Allowed Tools section mentions recall/index (red)
2. For each role: add `- Wazir CLI recall and index commands (see Context retrieval)` to `## Allowed Tools`
3. For each role: add `## Context retrieval` section between `## Allowed Tools` and `## Required Outputs` with tier-appropriate content:
   - L1: clarifier, researcher, specifier, content-author, designer, planner
   - Direct read: executor, verifier
   - L1-to-direct-read: reviewer
   - L0: learner
4. Run `npm test` (green)

**Role-tier mapping:**

| Role | Default Tier | Fallback |
|------|-------------|----------|
| clarifier | L1 | L1 fails -> direct read |
| researcher | L1 | L1 fails -> direct read |
| specifier | L1 | L1 fails -> direct read |
| content-author | L1 | L1 fails -> direct read |
| designer | L1 | L1 fails -> direct read |
| planner | L1 | L1 fails -> direct read |
| executor | direct read | index search fails -> grep/file-tree |
| verifier | direct read | index search fails -> grep/file-tree |
| reviewer | L1, escalate to direct | recall fails -> direct read |
| learner | L0 | L0 fails -> L1 -> direct read |

**Verification:**
```bash
npm test
```

**Stage only.**

---

### Task 011 -- Add capture events to all 15 workflows

**What:** Add `## Phase entry` and `## Phase exit` sections to all 15 workflow files. Add `## Gate decision` to 3 gate workflows.

**Files to modify:**
- 15 `workflows/*.md` files (excluding README.md)
- `tooling/test/role-contracts.test.js` (workflow structural tests)

**TDD steps:**
1. Add structural tests in `role-contracts.test.js` (already in `test:active` -- no new registration needed):
   - All 15 workflows have Phase entry and Phase exit
   - Phase entry is between Purpose and Inputs (ordering test)
   - Phase exit is immediately before Failure Conditions (no H2 between)
   - Gate workflows have Gate decision after Approval Gate
2. Add `## Phase entry` immediately after `## Purpose` in all 15 files
3. Add `## Phase exit` immediately before `## Failure Conditions` in all 15 files
4. Add `## Gate decision` after `## Approval Gate` in spec-challenge.md, design-review.md, plan-review.md
5. Run `npm test` (green)

**Placeholder note:** `<run-id>` and `<phase-name>` are runtime placeholders -- paste them literally. The agent substitutes actual values at runtime.

**Verification:**
```bash
npm test
```

**Stage only.**

---

### Task 012 -- Extend verifier validation surface

**What:** Add `## Post-execution validation` section to `roles/verifier.md` with all 9 validators and the export drift fix loop.

**Files to modify:**
- `roles/verifier.md`
- `tooling/test/role-contracts.test.js` (structural test)

**TDD steps:**
1. Add structural test: verifier.md has `## Post-execution validation`, section is between Allowed Tools and Required Outputs, mentions `export --check` and drift fix loop (red)
2. Add `## Post-execution validation` section between `## Context retrieval` (from task 010) and `## Required Outputs`, including:
   - 9 validator commands
   - Failure behavior per check category (structural, git-flow, export drift)
   - Export drift fix loop with max 1 rebuild attempt
3. Run `npm test` (green)

**Section order in verifier.md after tasks 010+012:**
`## Purpose` > `## Inputs` > `## Allowed Tools` > `## Context retrieval` > `## Post-execution validation` > `## Required Outputs` > `## Git-Flow Responsibilities` > `## Escalation Rules` > `## Failure Conditions`

**Verification:**
```bash
npm test
```

**Stage only.**

---

### Task 013 -- Add pre-execution validation to execute workflow

**What:** Add `## Pre-execution validation` section to `workflows/execute.md` with `validate manifest` and `validate hooks` instructions.

**Files to modify:**
- `workflows/execute.md`
- `tooling/test/role-contracts.test.js` (structural test)

**TDD steps:**
1. Add structural test: execute.md contains `## Pre-execution validation`, mentions `validate manifest` and `validate hooks` (red)
2. Add section after `## Phase entry` (from task 011) -- phase entry fires first to log execution attempt, then validation runs before implementation
3. Run `npm test` (green)

**Verification:**
```bash
npm test
```

**Stage only.**

---

### Task 014 -- Export build, verification, and commit

**What:** Run `wazir export build`, verify zero drift, commit all Batch B changes as a single atomic commit.

**Files to modify:**
- 0 source files directly; N export files regenerated under `exports/`

**Steps:**
1. Run `git status` to verify all Batch B files are staged
2. Run `wazir export build`
3. Run `wazir export --check` -- must report zero drift
4. Run `npm test` -- all tests must pass
5. Stage only known files (explicit list -- NO `git add -A`):
   - `tooling/src/guards/protected-path-write-guard.js`, `tooling/test/guard-hooks.test.js`
   - `hooks/session-start`, `hooks/definitions/session_start.yaml`
   - `roles/*.md`, `tooling/test/role-contracts.test.js`
   - `workflows/*.md`
   - `exports/`
6. Commit with conventional commit message

**Rollback plan:**
- If `export build` fails: identify offending canonical source, fix it, re-run. Max 2 fix attempts before escalating.
- If `export --check` still fails after successful build: re-run `export build`. Max 1 rebuild retry.
- If unrecoverable: `git reset HEAD` (preserves working tree), investigate root cause, report as blocker.

**Verification:**
```bash
wazir export --check
npm test
```

**Commit:**
```
feat(pipeline): wire CLI commands into agent pipeline
```

---

## Batch C -- Skill Updates

**Commit strategy:** Individual commits
**Export drift:** None (skills are not hashed)
**Estimated file count:** 2 skill files

> Batch C is independent and can run in parallel with Batch A or B.

### Task 015 -- Rewrite debugging skill OBSERVE phase

**What:** Replace OBSERVE implementation in `skills/debugging/SKILL.md` with symbol-first protocol while preserving the 4-step loop structure.

**Files to modify:**
- `skills/debugging/SKILL.md`

**TDD steps:**
1. Read current OBSERVE phase
2. Replace OBSERVE internals with: search-symbols -> recall L1 -> hypothesis -> targeted read -> fallback to generic methodology
3. Verify 4-step loop (Observe -> Hypothesize -> Test -> Fix) is intact
4. Run `npm test`

**Verification:**
```bash
npm test
```

**Commit:**
```
refactor(skills): rewrite debugging OBSERVE phase with symbol-first protocol
```

---

### Task 016 -- Add index integration to scan-project skill

**What:** Add index build/refresh step to `skills/scan-project/SKILL.md`.

**Files to modify:**
- `skills/scan-project/SKILL.md`

**TDD steps:**
1. Read current skill to determine last step number
2. Add new step after existing steps: check `index stats`, build or refresh accordingly, include stats in profile output
3. Distinguish between command failure (exit code non-zero) and successful report of 0 files
4. Run `npm test`

**Verification:**
```bash
npm test
```

**Commit:**
```
feat(skills): add index build/refresh step to scan-project skill
```

---

## Risk Mitigation

### Protected Path Write Guard (HIGH)

**Risk:** 25 of 27 Batch B files are in protected directories. Without mitigation, every write is blocked.

**Mitigation:** Task 008 adds `'pipeline_integration'` to `APPROVED_FLOWS` as the first Batch B step. This is:
- A one-line addition to the Set
- Fully reversible (can remove after implementation, but recommend keeping for future pipeline updates)
- Tested with a new guard-hooks test
- Consistent with existing `host_export_regeneration` pattern

**Fallback:** If the approved flow approach is rejected, the executor can work through interactive guard acceptance (user approves each blocked write). Viable but tedious for 27 files.

### Export Drift (MEDIUM)

**Risk:** 25 canonical source files change in Batch B, causing export drift between tasks.

**Mitigation:**
- All Batch B tasks stage but do NOT commit individually
- Single `export build` at the end (task 014) regenerates all exports
- `export --check` verifies zero drift before committing
- If drift persists after rebuild: max 1 retry, then escalate

### Increment Bug Visibility (MEDIUM)

**Risk:** The `recordPhaseUsage` increment bug is only observable with multi-call tests, and `usage.test.js` is not in CI.

**Mitigation:**
- Task 004 registers `usage.test.js` in `test:active` FIRST (before any CLI fixes)
- Task 007 adds a multi-call test that specifically catches the bug
- These are ordered: 004 before 007

### Batch B Intermediate Test Failures (LOW)

**Risk:** TDD requires writing failing tests first, which means intermediate `npm test` failures during Batch B.

**Mitigation:** This is expected TDD behavior (red phase). Each task's "npm test passes" AC means "passes after all steps of THIS task are done." The intermediate red-phase failure between writing the test and making the change is correct.

---

## Export Drift Management Strategy

### Which files cause export drift?

The export compiler hashes:
- `wazir.manifest.yaml` (not modified)
- 10 declared role files: `roles/*.md` (modified by task 010, 012)
- 14 declared workflow files: `workflows/*.md` except `run-audit.md` (modified by task 011, 013)
- Hook definition YAMLs: `hooks/definitions/*.yaml` (modified by task 009)

**Total:** 25 files that cause export drift

### What does NOT cause drift?

- `workflows/run-audit.md` (undeclared in manifest)
- Skill files (`skills/`)
- Hook executables (`hooks/session-start`)
- CLI source files (`tooling/src/`)
- Test files (`tooling/test/`)
- Guard source (`tooling/src/guards/`)
- `package.json`

### Strategy

1. **Batch A:** No drift concern -- only CLI source and tests
2. **Batch B:** All 25 drifting files modified, then sealed with single `export build` + `export --check` + single commit
3. **Batch C:** No drift concern -- only skills (not hashed)

### Drift detection during development

If you need to verify intermediate state during Batch B:
- `wazir export --check` will report drift (expected until task 014)
- Do NOT run `export build` until all Batch B source changes are complete
- Running `export build` mid-batch would create a partial export that becomes stale when subsequent tasks modify more canonical sources

---

## Success Verification Checklist

All 16 criteria from the design doc must pass after implementation:

| # | Criterion | Verified By | Task |
|---|-----------|-------------|------|
| 1 | `wazir doctor` guidance in session start bootstrap | Hook output test | 009 |
| 2 | Index exists and queryable before exploration phase | Bootstrap guidance instructs agent | 009, 016 |
| 3 | All 15 workflow files have capture event instructions | Structural test (15 files x 2 sections) | 011 |
| 4 | `capture usage` produces savings report at session end | Handler wiring tests | 005, 006 |
| 5 | Roles use assigned default tier with fallback chain | Structural test (10 roles x context retrieval) | 010 |
| 6 | `validate` + `export --check` run in verifier phase | Verifier role content test | 012 |
| 7 | `wz:debugging` OBSERVE uses symbol search with fallback | Manual review of SKILL.md | 015 |
| 8 | Reviewer uses L1 recall before reading full files | Reviewer context retrieval section | 010 |
| 9 | Run ID persists across compaction via `latest` file | Integration test (capture init writes latest) | 006 |
| 10 | No regression in existing hook behavior | Existing tests + new tests pass | 008, 009 |
| 11 | `export --check` passes after all changes | Export build + check in task 014 | 014 |
| 12 | `capture usage` registered in command registry | Registry test | 005 |
| 13 | `capture init` creates `usage.json` and writes `latest` | Integration test A | 006 |
| 14 | `session_start.yaml` contract fully cleaned up | YAML replacement + hook test | 009 |
| 15 | `recordPhaseUsage` uses increment semantics | Multi-call unit test | 007 |
| 16 | Role `## Allowed Tools` mentions CLI recall/index | Structural test (Allowed Tools section content) | 010 |

### Final verification commands (run after all 3 batches):

```bash
# Full test suite
npm test

# Export drift check
wazir export --check

# Full validation suite
wazir validate manifest
wazir validate hooks
wazir validate docs
wazir validate brand
wazir validate runtime
wazir validate branches
wazir validate commits
```

---

## Estimated File Count Per Batch

| Batch | Source Files | Test Files | Config Files | Generated Files | Total |
|-------|-------------|------------|-------------|-----------------|-------|
| A | 3 (command-registry.js, command.js, usage.js) | 2 (capture.test.js, usage.test.js) | 1 (package.json) | 0 | 6 |
| B | 27 (1 guard + 2 hooks + 10 roles + 15 workflows) | 2 (guard-hooks.test.js, role-contracts.test.js) | 0 | N (exports/) | 29 + exports |
| C | 2 (debugging/SKILL.md, scan-project/SKILL.md) | 0 | 0 | 0 | 2 |
| **Total** | **32** | **4** | **1** | **N** | **37 + exports** |

---

## Execution Order Summary

```
Phase 1 (can run in parallel):
  ├── Batch A: 004 → 005 (parallel) → 006, 007 → commit(s)
  └── Batch C: 015, 016 → commit(s)

Phase 2 (after Batch A):
  └── Batch B: 008 → 009, 010, 011 (parallel after 008) → 012 → 013 → 014 (export build + commit)
```

Total commits: 4-6 (Batch A) + 1 (Batch B) + 2 (Batch C) = 7-9 commits
