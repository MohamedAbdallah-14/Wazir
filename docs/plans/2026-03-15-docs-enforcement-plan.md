# Implementation Plan: Documentation & Enforcement (Batches D-G)

**Date:** 2026-03-15
**Scope:** 14 tasks (017-030) across 4 batches
**Branch:** `feat/docs-enforcement`

---

## Overview

This plan covers four batches of work that bring documentation up to date with the CLI pipeline integration (Batches A-C) and close enforcement gaps. The work is organized around three key documentation themes:

1. **Code quality for huge tasks** -- 14-phase pipeline, 9 approval gates, adversarial review, TDD, verification-before-completion
2. **Token savings** -- tiered recall (L0/L1/L2), 60-80% reduction, capture routing, usage reporting
3. **Ease of use** -- install once, session-start bootstrap, run recovery, audit trail

---

## Pre-flight Checklist

Before starting any task, confirm the following:

- [ ] `npm test` passes on clean `main`
- [ ] `wazir validate` passes on clean `main` (docs, changelog, brand, branches, commits)
- [ ] Working branch created: `git checkout -b feat/docs-enforcement`
- [ ] No uncommitted changes from prior work
- [ ] Verify current expertise module count: `find expertise -name '*.md' | wc -l` (needed by tasks 022, 023)
- [ ] Confirm `command-registry.js` already has `wazir capture usage` registered (task 017 context)
- [ ] Confirm no `prepare` script exists in `package.json` (task 026 pre-condition)

---

## Batch D: Validation-Critical (truth claims + changelog)

**Must go first.** These tasks fix validation gaps that affect subsequent tasks' verify steps.

| Task | Title | Priority | Deps | Est. Files |
|------|-------|----------|------|------------|
| 017 | Add truth claim for `capture usage` command | P0 | none | 2 |
| 018 | Add CHANGELOG.md [Unreleased] entries (Batches A-C) | P0 | none | 1 |

**Parallelizable:** Yes -- 017 and 018 touch different files (`truth-claims.yaml` + `tooling-cli.md` vs `CHANGELOG.md`).

**Execution order:**

```
017 ──┐
      ├── both in parallel
018 ──┘
```

**Suggested commits:**

```
docs(capture): add truth claim for capture usage command
docs(changelog): add [Unreleased] entries for CLI pipeline integration
```

**Estimated files changed:** 3 (truth-claims.yaml, tooling-cli.md, CHANGELOG.md)

---

## Batch E: Documentation (stale docs)

**Goes second.** Updates all reference and concept docs to reflect current system state.

| Task | Title | Priority | Deps | Est. Files |
|------|-------|----------|------|------------|
| 019 | Update tooling-cli.md (run recovery, token savings) | P1 | 017 | 1 |
| 020 | Update roles-reference.md (context retrieval defaults) | P1 | none | 1 |
| 021 | Update hooks.md (CLI bootstrap guidance) | P1 | none | 1 |
| 022 | Update architecture.md (token savings section) | P1 | none | 1 |
| 023 | Update README.md (token savings, code quality, ease of use) | P1 | none | 1 |
| 024 | Update skills.md (debugging OBSERVE, scan-project) | P1 | none | 1 |
| 025 | Update indexing-and-recall.md (pipeline integration) | P1 | 020 | 1 |

**Parallelizable:** Mostly yes. Each task modifies a different file. Two constraints:

1. Task 019 depends on 017 (capture usage row must exist for `validate docs`)
2. Task 025 depends on 020 (cross-file anchor link `#context-retrieval-defaults`)

**Execution order:**

```
            ┌── 020 ──── 025
            │
017 ── 019  ├── 021
            │
            ├── 022
            │
            ├── 023
            │
            └── 024

Tasks 020, 021, 022, 023, 024 can all run in parallel.
Task 019 starts after 017 completes.
Task 025 starts after 020 completes.
```

**Theme coverage across Batch E:**

| Theme | Tasks |
|-------|-------|
| Code quality | 023 (new dedicated README section: "How Wazir Handles Complex Tasks") |
| Token savings | 019 (tooling-cli), 022 (architecture), 023 (README bullet), 025 (indexing pipeline) |
| Ease of use | 021 (hooks bootstrap), 023 (README bullet), 019 (run recovery) |

**Suggested commits:**

```
docs(cli): add run recovery and token savings sections to tooling-cli reference
docs(roles): add context retrieval tier defaults to roles reference
docs(hooks): add CLI bootstrap guidance section to hooks reference
docs(architecture): expand context and indexing section with token savings detail
docs(readme): add token savings, code quality, and ease of use sections
docs(skills): update debugging OBSERVE and scan-project descriptions
docs(indexing): add pipeline integration section to indexing and recall conceptual doc
```

**Estimated files changed:** 7 (one per task, all different docs)

---

## Batch F: Enforcement Gaps

**Goes third.** Adds enforcement tooling that protects the documentation and code quality.

| Task | Title | Priority | Deps | Est. Files |
|------|-------|----------|------|------------|
| 026 | Add Husky pre-push hook | P2 | none | 2 |
| 027 | Extend changelog enforcement to fix/ branches | P2 | none | 1 |
| 028 | Add doc-drift detection command | P2 | 026 | 7 |
| 030 | Add CHANGELOG entries for Batches F-G | P2 | 026, 027, 028, 029 | 1 |

**Critical sequencing for package.json:** Tasks 026, 028, and 029 all modify `package.json`. They must run sequentially to avoid merge conflicts: 026 -> 028 -> 029.

Task 027 is independent (modifies only `ci.yml`) and can run in parallel with 026.

Task 030 runs last after all other Batch F-G tasks complete.

**Execution order:**

```
026 ────── 028 ────── (029 in Batch G)
                              │
027 ──────────────────────────┤
                              │
                         030 ─┘  (after all F-G tasks)
```

**Suggested commits:**

```
feat(hooks): add Husky pre-push hook for branch, commit, and test validation
fix(ci): require changelog entries for fix/ branches
feat(validate): add docs-drift detection for source-to-doc staleness
docs(changelog): add [Unreleased] entries for Batches F-G features
```

**Estimated files changed:** 11 (package.json, .husky/pre-push, ci.yml, docs-drift.js, docs-drift.test.js, validate.js, command-registry.js, truth-claims.yaml, tooling-cli.md, CHANGELOG.md, and removal of .husky/pre-commit)

---

## Batch G: Coverage

**Goes last.** Adds coverage enforcement on top of all prior work.

| Task | Title | Priority | Deps | Est. Files |
|------|-------|----------|------|------------|
| 029 | Add c8 coverage reporting with thresholds | P3 | 028 | 3 |

**Suggested commit:**

```
feat(coverage): add c8 coverage reporting with threshold enforcement
```

**Estimated files changed:** 3 (package.json, .c8rc.json, ci.yml)

---

## Full Dependency DAG

```
017 ─────────── 019

018

020 ─────────── 025

021

022

023

024

026 ─────────── 028 ────── 029
                               \
027 ────────────────────────── 030
```

**Total tasks:** 14
**Total estimated file changes:** ~24 (some files modified by multiple tasks)
**Critical path:** 026 -> 028 -> 029 -> 030 (4 sequential tasks)

---

## Execution Summary

| Phase | Batch | Tasks | Parallel? | Constraint |
|-------|-------|-------|-----------|------------|
| 1 | D | 017, 018 | Yes | Must go first (validation-critical) |
| 2 | E | 020, 021, 022, 023, 024 | Yes | All independent, start immediately after Batch D |
| 2b | E | 019 | No | Waits for 017 |
| 2c | E | 025 | No | Waits for 020 |
| 3 | F | 026, 027 | Yes | 026 and 027 are independent |
| 3b | F | 028 | No | Waits for 026 (package.json) |
| 4 | G | 029 | No | Waits for 028 (package.json) |
| 5 | F | 030 | No | Waits for 026, 027, 028, 029 (describes their features) |

**Estimated total commits:** 14 (one per task, all conventional commit format)

---

## Verification Gate

After all 14 tasks complete, run the full validation suite:

```bash
npm test
wazir validate
wazir validate docs-drift --base main --head HEAD
npm run test:coverage
```

All four commands must exit 0 before the branch is ready for PR.
