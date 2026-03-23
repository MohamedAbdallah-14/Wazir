# Wazir vs Bare-Metal Benchmark Suite

**Date:** 2026-03-24
**Design:** Codex CLI (gpt-5.4)
**Purpose:** Measure quality gap between pipeline-enforced (Wazir) and undisciplined (bare-metal) AI coding

## Protocol

- Both variants run from same clean base branch, same model, same timebox
- Identical task prompt for both
- Full auto mode (-p flag, no human interaction)
- Judge using: git diff, commit history, npm test, terminal transcript, .wazir/runs/ artifacts
- Model: Sonnet 4.6 (both variants)

## Global Metrics

For each test, measure:
1. Final `npm test` result (pass/fail count)
2. Test count added
3. Edge case coverage (specific fixtures hit)
4. Commit count and conventional format compliance
5. Docs/registry/changelog updated
6. Reviewer findings (post-hoc review by Opus)
7. Pipeline compliance % (Wazir runs only)

## Benchmark 1: Implement `wazir validate artifacts`

**Prompt:**
```
Implement `wazir validate artifacts` in this repo. Validate a selected run's pipeline artifacts against existing schemas/templates. Fail clearly for missing artifacts, malformed files, and schema violations. Support --json output. Add focused automated tests and update any docs or command-registry surfaces made stale by the new command. Commit your work when done.
```

**Tests:** artifact validation (valid run, missing artifact, malformed, schema-invalid), --json contract, CLI docs/registry updates

## Benchmark 2: Add explicit `verifier` enforcement phase

**Prompt:**
```
Add an explicit verifier enforcement phase between executor and final_review. The phase must have its own phase file/template. Verification artifacts should belong to this phase, not final_review. final_review must require both the verification-proof artifact and a completed verifier phase exit. Update guards, manifests, templates, docs, and automated tests so the enforcement is consistent end-to-end. Commit your work when done.
```

**Tests:** cross-surface consistency, phase transition enforcement, write-gate behavior, export drift

## Benchmark 3: Extend `wazir state findings` with recurring analysis

**Prompt:**
```
Extend wazir state findings with --recurring --min <n>. Show recurring unresolved finding patterns across runs. Support human-readable output and --json. Include count, distinct run count, first_seen, last_seen, and a representative description. Add tests and docs. Commit your work when done.
```

**Tests:** threshold behavior, resolved exclusion, sort order, empty state, JSON shape

## Benchmark 4: Fix `wazir report phase` metric parsing

**Prompt:**
```
Fix wazir report phase metric parsing. Correctly parse modern Node test runner summary lines and legacy/TAP-style summaries. Correctly classify renamed/copied files from git diff --name-status. Add regression tests and keep backward compatibility. Commit your work when done.
```

**Tests:** parser fixtures for multiple formats, rename/copy classification, backward compat

## Benchmark 5: Extend CLI verification proof with manifest-backed smoke commands

**Prompt:**
```
Extend the verification proof collector for CLI projects. Add a new verification.cli_smoke_commands field to wazir.manifest.yaml. For CLI projects, collectProof should run those smoke commands in addition to --help. Capture each smoke command output in the proof artifact. Fail clearly when a smoke command fails. Preserve current behavior when the field is absent. Add tests and docs. Commit your work when done.
```

**Tests:** smoke command success/failure, multiple commands, absent-field backward compat, manifest/schema consistency
