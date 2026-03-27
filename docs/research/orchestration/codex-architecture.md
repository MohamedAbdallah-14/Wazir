# Codex CLI Architecture Review

**Date:** 2026-03-24
**Score:** 6/10

## What Codex Liked

- Fresh process per phase is the right answer to context rot
- Producer-reviewer separation aligns with Wazir's review loop pattern
- Clarifier loop with human-in-the-loop is correct
- Per-task implement → review → fix → re-review → commit is the right spine
- Platform-enforced restrictions over "please behave" prompts is directionally correct

## HIGH Findings

1. **Bash escape hatch is a blocker.** `--disallowedTools` is not a real control boundary if shell access remains. Write bans become prompt theater with a bash escape hatch.

2. **Parallel tasks need per-task worktrees.** Shared checkout means `codex review --uncommitted` sees cross-task noise. Review semantics break.

3. **Dependency batching needs explicit metadata.** `depends_on`, `reads`, `writes`, and ownership — not prose. "Independent tasks" is not a feeling.

4. **Verification must be per-task before commit.** Not just near the end.

## MEDIUM Findings

5. Two phase models (manifest 3 phases vs runtime 15). Formalize relationship.
6. TodoWrite is UX, not orchestration state. Hidden state machine = hard to audit.
7. Artifact handoff needs typed envelopes (schema, source phase, hashes).
8. Orchestrator must be the ONLY writer of control state.

## What Codex Would Change

- Make orchestrator the only writer of control state
- Treat init and prepare-next as orchestrator actions, not LLM phases
- Merge scan-project and discover unless distinct artifacts
- Give every execution task its own worktree
- Replace prose handoffs with typed artifact envelopes
- Verification mandatory before commit per task
- Add restriction test matrix (canary jobs)
- Keep hard append-only event log

## Verdict

"Directionally strong. Not production-safe yet. Core idea fixes context rot, but boundary model, task isolation, and artifact contracts need hardening. If you harden those three areas, it moves to 8/10 fast."
