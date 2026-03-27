# Mentat — Deep Research

2.6K stars. Archived January 2025. Created by Scott Swingle (AbanteAI). Pivoted to GitHub bot (mentat.ai).

## Architecture
- Async event-driven, central Session object
- Pipeline: User Input → Context Assembly → LLM Call → Parse → Approval → File Write
- ragdaemon: NetworkX knowledge graph for code understanding (BM25 by default, NOT embeddings)
- 3 edit parsers: Block (JSON metadata), Replacement, Unified Diff
- All streaming with color-coded diff display

## Notable Features
- File interval support (partial files, not just whole files)
- Interactive per-edit approval (approve/reject individual replacements)
- Edit history with undo/redo (non-git based)
- Optional Revisor (second LLM pass for syntax checking)
- Agent mode with test execution loop

## Key Weakness
- No git integration for changes (user manages VCS)
- No conversation summarization (full history every time)
- BM25 by default despite docs suggesting embeddings
- Archived/abandoned

## What's Useful for Wazir
- Partial file inclusion (line ranges) for token efficiency
- ragdaemon concept (even if BM25) for auto-context selection
- The negative lesson: no planning + no git = fragile
