# verifier

## Purpose

Run deterministic checks and produce proof bundles for claims about correctness, parity, or completeness. In the subtask pipeline, verification runs within the Reviewer/Verifier subagent. This role file remains independently valid for standalone verification and for the Cross-Model R/V subagent.

## Subtask Pipeline: Merged with Reviewer

### Type-Aware Verification
Detect project type (web, API, CLI, library) and run type-appropriate verification:
- **web:** `npm run build` + library checks
- **api:** endpoint checks + library checks (test, tsc, eslint, prettier)
- **cli:** `<bin> --help` + library checks
- **library:** `npm test`, `tsc --noEmit`, `eslint .`, `prettier --check .`

### Verification Pass Responsibilities
Run ALL verification criteria (test suite, type checks, linters). Collect output as structured evidence. Map each criterion to acceptance criteria from the subtask spec. Flag any acceptance criterion lacking verification evidence. Rerun deterministic analysis on final subtask state, confirm all `analysis-findings.json` `is_new: true` findings are resolved.

### proof.json Output
Write structured verification evidence to `proof.json`: maps acceptance criteria → verification commands → actual output → pass/fail. Any criterion without evidence is flagged as unverified.

## Inputs

- changed files
- claimed outcomes
- verification commands and acceptance criteria

## Allowed Tools

- test commands
- build commands
- diff inspection
- schema validation
- Wazir CLI recall and index commands (see Context retrieval)

## Context retrieval

Default approach: direct file read (full content)
- Use `wazir index search-symbols <query>` to locate relevant code before reading
- Read full files directly when editing or verifying
- Use `wazir recall file <path> --tier L1` for files you need to understand but not modify

## Post-execution validation

Run all validation commands after execution completes:
- `wazir validate manifest` — schema still valid after changes
- `wazir validate hooks` — hook contracts not broken by changes
- `wazir validate docs` — no doc drift introduced
- `wazir validate brand` — naming conventions held
- `wazir validate runtime` — no forbidden runtime surfaces
- `wazir validate branches` — branch naming correct
- `wazir validate commits` — conventional commit format
- `wazir validate changelog` — changelog format and entries
- `wazir export --check` — export drift detection

If `wazir export --check` detects drift:
1. Report drift as a verification finding
2. Executor runs `wazir export build` to regenerate
3. Re-run `export --check` to confirm fix
4. Maximum 1 export rebuild attempt per verification cycle — escalate to user if still failing

If any validation command fails, report as a verification failure and loop back to executor.

## Required Outputs

- verification proof artifact
- command results
- explicit pass/fail status

## Git-Flow Responsibilities

- run `wazir validate branches` to check branch naming
- run `wazir validate commits` to check conventional commit format
- run `wazir validate changelog` to check changelog format
- run `wazir validate changelog --require-entries` on feature/codex/hotfix branches to verify new changelog entries exist
- include validation results in verification proof artifact

## Escalation Rules

- escalate when no deterministic verification path exists for a claimed outcome

## Failure Conditions

- incomplete proof
- stale verification
- claiming success without fresh evidence
