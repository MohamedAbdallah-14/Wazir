---
name: wz:verification
description: Use before claiming work is complete. Every completion claim needs fresh command evidence or another deterministic proof path.
---

# Verification

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

## Proof of Implementation

1. Detect project type: `detectRunnableType(projectRoot)` → web | api | cli | library
2. Collect evidence: `collectProof(taskSpec, runConfig)`
3. Save evidence to `.wazir/runs/<id>/artifacts/proof-<task>.json`

**For runnable output (web/api/cli):** Run the application and capture evidence (build output, screenshots, curl responses, CLI output).

**For non-runnable output (library/config/skills):** Run lint, format check, type check, and tests. All must pass.

Evidence collection uses `tooling/src/verify/proof-collector.js`.

## Verification Requirements

Every completion claim must include:

- what was verified
- the exact command or deterministic check
- the actual result

## Proof Collection

Use `proof-collector` (`tooling/src/verify/proof-collector.js`) for automated evidence gathering:

1. **`detectRunnableType(projectRoot)`** — detects whether the project is `web`, `api`, `cli`, or `library` from `package.json`. Detection order: `pkg.bin` (cli), web framework deps (web), API framework deps (api), default (library).

2. **`collectProof(projectRoot, opts?)`** — runs type-appropriate verification commands and returns structured evidence:
   - **web:** `npm run build` + library checks
   - **api:** library checks (test, tsc, eslint, prettier)
   - **cli:** `<bin> --help` + library checks
   - **library:** `npm test`, `tsc --noEmit`, `eslint .`, `prettier --check .`

All commands use `execFileSync` (never shell `exec`) for security. Evidence is returned as `{ type, evidence: [{ check, ok, output }] }`.

## Minimum Rules

- no success claim without fresh evidence from the current change
- always use `proof-collector` for Node.js projects to gather deterministic evidence
- attach the evidence array to the verification proof artifact

When verification fails:

- do not mark the work complete
- report the gap honestly

Ask the user via AskUserQuestion:
- **Question:** "Verification failed for [specific criteria]. How should we proceed?"
- **Options:**
  1. "Fix the issue and re-verify" *(Recommended)*
  2. "Accept partial verification with documented gaps"
  3. "Abort and review what went wrong"

Wait for the user's selection before continuing.
