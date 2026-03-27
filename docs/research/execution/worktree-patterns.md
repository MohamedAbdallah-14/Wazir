# Git Worktree Patterns for Parallel AI Agent Execution

## Research Summary

How git worktrees provide isolation for parallel AI agents, practical limits, lifecycle management, and limitations.

## Key Findings

### Worktree Internals
- Shared: object database, refs, remotes, config, hooks
- Isolated: HEAD, index/staging, working directory
- `.git` file in worktree points back to main repo
- Hooks are shared (no per-worktree hooks)

### Practical Limits
- **8-12 worktrees** on ext4 (inode pressure)
- **15-20+** on XFS (dynamic inode allocation)
- **20+** on Btrfs/ZFS (copy-on-write)
- macOS APFS handles well with native CoW
- Node.js worktree: ~250K inodes (200MB source + 2GB node_modules)

### How AI Tools Use Worktrees
- **Claude Code**: `--worktree` flag, `.claude/worktrees/<name>/`, `isolation: worktree` for subagents, Agent Teams (Feb 2026)
- **Cursor 2.0**: Up to 8 parallel agents in worktrees, configurable via `worktree.json`
- **Codex**: Cloud sandboxes + local worktree mode
- **CodeRabbit gtr**: `git gtr new my-feature --ai` creates worktree and launches AI tool

### Worktree Lifecycle
1. Create: `git worktree add <path> [<branch>]`
2. Work: agent operates in isolated directory
3. Merge: commit, push branch, merge via PR or direct merge
4. Clean: `git worktree remove <path>` (auto-cleans if no changes)
5. Prune: `git worktree prune` for stale entries

### Limitations
- **Submodules**: "experimental" and "incomplete" (git docs)
- **Git LFS**: post-checkout hooks can hang, data downloaded twice in submodules
- **Hooks shared**: no per-worktree hook support
- **Branch constraint**: can't checkout same branch in two worktrees
- **Stale worktrees accumulate**: need lifecycle management
- **Lock files**: Claude Code creates stale `.git/index.lock` from background ops

### Biggest Gap: Runtime Isolation
Worktrees only isolate files, not ports, databases, or services. Solutions:
- **worktree-compose**: per-worktree Docker stacks with isolated ports/DBs
- **Neon branching**: per-worktree instant database branches
- **Container Use**: lightweight containers + worktrees

### Disk Usage
- Git objects stored once (shared)
- Working files duplicated per worktree
- node_modules is the real storage problem
- Mitigations: APFS/Btrfs reflinks, pnpm hardlinks, shared build cache

### Production Scale
- incident.io: 4-7 concurrent Claude Code agents daily
- Boris Cherny (Anthropic): 3-5 worktrees simultaneously
- Practical ceiling: 5-7 concurrent before rate limits and review bottleneck

## Sources
- Git worktree docs: https://git-scm.com/docs/git-worktree
- Claude Code worktrees: https://code.claude.com/docs/en/common-workflows
- Nx worktrees blog: https://nx.dev/blog/git-worktrees-ai-agents
- Upsun guide: https://devcenter.upsun.com/posts/git-worktrees-for-parallel-ai-coding-agents/
