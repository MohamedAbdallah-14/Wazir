# Phase-Aware Write Blocking Design

**Date:** 2026-03-23
**Status:** Approved
**Problem:** PreToolUse injection is advisory-only (exit 0). Agent ignores injected step and writes source code during clarifier phase.

## Fix

Extend the bootstrap gate hook to be phase-aware. During non-executor phases, deny Write/Edit to source files. Allow writes to pipeline artifacts (.wazir/, docs/, input/, memory/, templates/).

## Phase Permissions

| Phase | Write/Edit source | Write .wazir/docs/etc | Bash | Read |
|-------|------------------|----------------------|------|------|
| No run | DENY | DENY | allowlist only | ALLOW |
| init | DENY | ALLOW | ALLOW | ALLOW |
| clarifier | DENY | ALLOW | ALLOW | ALLOW |
| executor | ALLOW | ALLOW | ALLOW | ALLOW |
| final_review | DENY | ALLOW | ALLOW | ALLOW |

## Source Path Detection

A file is a "source file" if its path does NOT start with any of:
- `.wazir/`
- `docs/`
- `input/`
- `memory/`
- `templates/`
- `benchmark/`

## Implementation

Modify `tooling/src/hooks/bootstrap-gate.js`:
1. After checking marker + run exists, read current phase via `findActivePhase()`
2. If phase is `executor`, allow all
3. If phase is anything else, check if Write/Edit target is a source path
4. If source path during non-executor phase, deny with message: "Source file writes are blocked during [phase] phase. Complete the phase checklist first."

Also apply Codex's three crash fixes:
- `handleEnsure` uses `resolveCaptureContext`
- `ensure.js` uses `createPhaseFiles` + `createRepoLocalSymlink`
- `bootstrap-gate.js` handles symlink + plain file latest pointers
