# verify

## Purpose

Produce deterministic proof for the claims made by execution.

## Phase entry

On entering this phase, run:
`wazir capture event --run <run-id> --event phase_enter --phase <phase-name> --status in_progress`

## Inputs

- changed files
- claimed outcomes
- acceptance criteria
- project type (detected via `detectRunnableType(projectRoot)` → web | api | cli | library, from `tooling/src/verify/proof-collector.js`)

## Process

1. **Detect project type:** Run `detectRunnableType(projectRoot)` to determine verification strategy
2. **Collect evidence:** Run `collectProof(taskSpec, runConfig)` with the detected type
3. **For runnable output (web/api/cli):** Run the application and capture runtime evidence (build output, screenshots, curl responses, CLI output)
4. **For non-runnable output (library/config/skills):** Run lint, format check, type check, and tests — all must pass
5. **Save evidence:** Write to `.wazir/runs/<id>/artifacts/proof-<task>.json`
6. **Validate:** Ensure every acceptance criterion has at least one evidence item mapped to it

## Primary Role

- `verifier`

## Outputs

- verification proof artifact (produced by `collectProof` from `tooling/src/verify/proof-collector.js`)

## Proof Collection

Use `detectRunnableType` to classify the project, then `collectProof` to gather evidence. The proof-collector runs type-appropriate commands (build, test, lint, type-check) using `execFileSync` and returns structured `{ type, evidence }`.

## Approval Gate

- no completion claim without fresh proof

## Phase exit

On completing this phase, run:
`wazir capture event --run <run-id> --event phase_exit --phase <phase-name> --status completed`

## Proof of Implementation

The verifier detects whether the project output is runnable and collects appropriate evidence:

| Project Type | Detection | Evidence Collected |
|-------------|-----------|-------------------|
| `web` | next/vite/react-scripts in deps | Build output, Playwright screenshot (if available), curl response |
| `api` | express/fastify/hono in deps | curl endpoint responses with status codes |
| `cli` | `bin` field in package.json | `--help` output, test run with sample args |
| `library` | default (no runnable markers) | npm test, tsc, eslint, prettier — all must pass |

Evidence is saved to `.wazir/runs/<id>/artifacts/proof-<task>.json` using `collectProof()` from `tooling/src/verify/proof-collector.js`.

## Relationship to Review Loops

Verification is invoked per-task during execution, not as a review loop. It produces deterministic proof, not adversarial findings.

## Failure Conditions

- stale or partial verification
- proof-collector reports `status: "fail"` for any evidence item
- runnable type detected but no evidence collected
