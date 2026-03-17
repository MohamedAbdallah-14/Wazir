# Hooks Reference

Wazir defines canonical hook contracts in `hooks/definitions/*.yaml`.

These hook definitions are product contracts first. Host-specific native hooks or wrapper commands must preserve the same behavior.

## Canonical hook roster

| Hook ID | Purpose | Failure mode |
| --- | --- | --- |
| `session_start` | Initialize run-local status capture and bootstrap summaries | capture |
| `pre_tool_capture_route` | Route large tool output away from model context | warn |
| `post_tool_capture` | Append tool execution events and captured output metadata | capture |
| `pre_compact_summary` | Summarize captured state before compaction or handoff | warn |
| `stop_handoff_harvest` | Persist final handoff and stop-time observability data | capture |
| `protected_path_write_guard` | Block writes to protected canonical paths outside approved flows | block |
| `loop_cap_guard` | Block extra iterations after the configured loop cap | block |

## Source of truth

- hook contracts: `hooks/definitions/*.yaml`
- schema: `schemas/hook.schema.json`
- required hook roster: `wazir.manifest.yaml`
- validation command: `wazir validate hooks`

## Host fallback policy

Every canonical hook definition includes `host_fallback` guidance for:

- Claude
- Codex
- Gemini
- Cursor

Fallbacks may be native hooks or wrapper commands, but they must preserve:

- the same trigger intent
- the same protected-path policy
- the same loop-cap policy
- the same observable outputs or an explicitly documented equivalent

## Current implementation status

Implemented now:

- canonical hook definitions and schema validation
- manifest-level required hook roster
- CLI validation through `wazir validate hooks`
- capture/status file writers through:
  - `wazir capture init`
  - `wazir capture event`
  - `wazir capture route`
  - `wazir capture output`
  - `wazir capture summary`
- wrapper guard scripts:
  - `hooks/protected-path-write-guard`
  - `hooks/loop-cap-guard`
- session-start CLI bootstrap script (`hooks/session-start`) emitting `<cli-bootstrap-guidance>` for doctor, index, and run recovery

Planned next:

- wrapper/native execution helpers

## CLI bootstrap

The `session_start` hook emits a `<cli-bootstrap-guidance>` block alongside the skill bootstrap text. This block guides agents through a 3-step CLI bootstrap sequence at the start of every session:

1. **Doctor check** -- run `wazir doctor` to validate the repo surface (manifest, hooks, state-root, exports)
2. **Index refresh** -- run `wazir index refresh` (or `index build` if no index exists) to ensure the local index is current
3. **Run recovery** -- check `<state-root>/runs/latest` for a prior run ID; resume it or start a new run via `capture init`

The `session_start.yaml` output contract produces `cli_bootstrap_guidance` alongside `skill_bootstrap_text`. Both are injected into the agent's initial context.

The bootstrap sequence is advisory -- it guides the agent but does not enforce execution order. The session-start hook always exits 0 to avoid blocking session startup.

## Guardrail note

Hook definitions are the authoritative product contracts. The canonical definitions above take precedence over any other hook documentation.

## Current guard exit codes

- `hooks/protected-path-write-guard`
  - `0` allow
  - `42` block
- `hooks/loop-cap-guard`
  - `0` allow
  - `43` block
