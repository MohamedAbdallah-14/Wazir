# Tmux + Worktree Integration Research

**Date:** 2026-03-24

## Key Finding: --tmux REQUIRES --worktree

Cannot use `--tmux` alone. They are always paired.

```
--tmux  Create a tmux session for the worktree (requires --worktree).
        Uses iTerm2 native panes when available; use --tmux=classic for traditional tmux.
```

## Two Modes

- **Default (`--tmux`):** Auto-detects terminal. iTerm2 → native split panes via `tmux -CC`
- **Classic (`--tmux=classic`):** Raw tmux panes. Works everywhere.

## Fresh Context Per Session

Each `--tmux` session spawns a completely new Claude Code process with:
- Its own conversation context (fresh, empty)
- Its own worktree (isolated files and branch)
- Its own `~/.claude/projects/` directory (separate memory — bug #34437)

## User Interaction

Fully interactive. User can:
- `tmux attach -t <session-name>`
- Type directly into the session
- Detach with `Ctrl-B d`
- Send programmatic input: `tmux send-keys -t session-name 'message' Enter`

## Worktree Mechanics

- Created at `.claude/worktrees/<name>/` with branch `worktree-<name>`
- Shared: .git database, remotes, refs, commit history
- Isolated: working directory, branch, index
- Two worktrees CANNOT have same branch checked out

## Critical Bug: .claude/ Not Copied (#28041)

`.claude/` subdirectories (skills/, agents/, rules/, settings.json) are NOT copied to worktrees. Only `settings.local.json` is created.

**Workaround:** `worktree.symlinkDirectories` setting:
```json
{ "worktree": { "symlinkDirectories": [".claude"] } }
```

## Wazir State Sharing

State at `~/.wazir/projects/<slug>/` is OUTSIDE the repo → naturally shared across all worktrees. No workaround needed.

## Completion Detection

No built-in notification. Must:
- Poll `tmux list-sessions`
- Check if pane process exited
- Use Agent Teams task state machine (pending → in_progress → completed)

## Lifecycle

1. Create: `claude --worktree feature-x --tmux`
2. Run: Claude operates in isolated worktree
3. Complete: No changes → auto-cleanup. Changes exist → prompt to keep/remove.
4. Crash: Worktree NOT cleaned up (bug #26725). No garbage collection.

## Concurrent Session Limits

- No hard limit from Claude Code
- Practical: 2-3 comfortable, ~5-7 ceiling per API rate limits
- Each session = full Node.js process + tmux pane

## Why Not cmux

Two community tools named cmux exist (craigsc/cmux shell wrapper, manaflow-ai/cmux macOS app). Both are third-party, not Anthropic-maintained. Claude Code now has native `--worktree --tmux` which handles the core use case.

## Sources

- Boris Cherny threads on worktree support
- Issues #28041, #34437, #26725, #36205, #29599, #24292, #23572
- Claude Code docs: cli-reference, agent-teams, common-workflows
