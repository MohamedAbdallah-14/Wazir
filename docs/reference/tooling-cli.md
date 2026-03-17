# Wazir CLI

The `wazir` CLI is minimal on purpose. It exists to validate and export the host-native OS kit.

## Current command surface

| Command | Status | Behavior |
| --- | --- | --- |
| `wazir validate manifest` | implemented | Validates `wazir.manifest.yaml` against its schema and checks required repo paths exist. |
| `wazir validate hooks` | implemented | Validates canonical hook definitions against `schemas/hook.schema.json` and the manifest hook roster. |
| `wazir validate docs` | implemented | Validates `docs/truth-claims.yaml`, checks documented command claims against the active CLI surface, and rejects broken local doc links. |
| `wazir validate brand` | implemented | Enforces canonical product naming on the Wazir surface. |
| `wazir validate runtime` | implemented | Rejects non-canonical runtime wrappers, repo-local task/state paths, and forbidden runtime-only package surfaces. |
| `wazir validate branches` | implemented | Validates the current (or `--branch`-specified) branch name against the allowed git-flow patterns. |
| `wazir validate commits` | implemented | Validates conventional commit format for commits in the range `--base..--head` (or auto-detected base to HEAD). |
| `wazir validate changelog` | implemented | Validates `CHANGELOG.md` structure; with `--require-entries` and `--base`, enforces new entries since the base. |
| `wazir validate docs-drift` | implemented | Detects when source files (roles, workflows, skills, hooks) change without corresponding documentation updates. Advisory by default; `--strict` exits non-zero on drift. |
| `wazir validate artifacts` | reserved | Exits `2` until artifact-template and example validation expands. |
| `wazir export build` | implemented | Generates host packages under `exports/hosts/*` from canonical sources. |
| `wazir export --check` | implemented | Verifies generated host packages still match current canonical source hashes. |
| `wazir index build` | implemented | Builds a local SQLite-backed index under the configured state root. |
| `wazir index refresh` | implemented | Refreshes indexed files using stored content hashes. |
| `wazir index stats` | implemented | Reports file, symbol, outline, and summary_counts for the current index. |
| `wazir index summarize` | implemented | Generates L0/L1 heuristic summaries for all indexed files and symbols. |
| `wazir index search-symbols` | implemented | Searches indexed symbol names. |
| `wazir index get-symbol` | implemented | Returns a stored symbol record by name or ID. |
| `wazir index get-file-outline` | implemented | Returns indexed outline entries for a file. |
| `wazir recall file` | implemented | Returns an exact line-bounded slice from an indexed file. Supports `--tier L0\|L1` for summary recall. |
| `wazir recall symbol` | implemented | Returns an exact slice for an indexed symbol match. Supports `--tier L0\|L1` for summary recall. |
| `wazir doctor` | implemented | Validates the active repo surface for manifest, hooks, state-root policy, and host export directory presence. |
| `wazir status` | implemented | Reads run status directly from `<state-root>/runs/<run-id>/status.json`. |
| `wazir capture init` | implemented | Creates a run ledger with `status.json`, `events.ndjson`, and a captures directory under the configured state root. |
| `wazir capture event` | implemented | Appends a run event and can update phase, status, and loop counts in `status.json`. |
| `wazir capture route` | implemented | Reserves a run-local capture file path for large tool output. |
| `wazir capture output` | implemented | Writes captured tool output to a run-local file and records a `post_tool_capture` event. |
| `wazir capture summary` | implemented | Writes `summary.md` and records the chosen summary or handoff event. |
| `wazir capture usage` | implemented | Generates a token savings report for a run, showing capture routing statistics and context window savings. |

## Exit codes

- `0`: requested check passed
- `1`: invalid input or validation failure
- `2`: command surface exists but the implementation is intentionally not complete yet

## Root discovery

The CLI resolves the project root by walking upward from the current working directory until it finds `wazir.manifest.yaml`. This keeps checks usable from nested directories inside the repo.

## State-root override

Indexing and recall commands accept `--state-root <path>` so operators can keep index state wherever they want. If omitted, Wazir uses the manifest default outside the repo.

`wazir status` accepts the same override when reading run-local status files.

`wazir capture *` accepts the same override when writing run-local status, events, summaries, and captured output files.

`wazir export build` and `wazir export --check` work from the current project root and write under `exports/hosts/*`.

## Run recovery

`wazir capture init` writes the current run ID to `<state-root>/runs/latest` as a plain text pointer. On session start, an agent can read this file to determine if a prior run exists and resume it rather than starting fresh.

This enables run continuity across context compaction boundaries. When a session is compacted, the new context can read `latest` and call `wazir status --run <id>` to load the prior run's state.

If no `latest` file exists, the agent starts a new run via `capture init`.

## Token savings

Wazir reduces context window consumption through two mechanisms:

**Capture routing.** `wazir capture route` and `wazir capture output` redirect large tool output to run-local files instead of the context window. The agent receives a file path reference (~50 tokens) instead of the full output (potentially thousands of tokens).

**Tiered recall.** `wazir recall file` and `wazir recall symbol` support `--tier L0|L1` for summary-based recall:
- L0 (~100 tokens): one-line identifier summary
- L1 (~500-2k tokens): structural summary with signature, purpose, dependencies
- L2 (default): full source slice

Roles are assigned default tiers based on their needs. Exploration-heavy roles (clarifier, researcher, planner) use L1 by default. Implementation roles (executor, verifier) use direct reads. See [Indexing and Recall](../concepts/indexing-and-recall.md) for details.

`wazir capture usage` generates a per-run token savings report showing how many tokens were saved by capture routing and tiered recall versus direct reads.

## Current scope limits

- The CLI is a validation and export tool with no background processes.
- Validation is the first active capability because it prevents fake green states while the rest of the kit is still being rebuilt.
- Reserved commands are documented here so adopters can tell the difference between real behavior and planned behavior.

## Docs truth source

Executable documentation claims are registered in:

- `docs/truth-claims.yaml`

`wazir validate docs` uses that file plus active markdown link checks to prevent stale command and path claims from silently drifting.
