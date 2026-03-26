# How AI Coding Tools Apply Patches and Diffs

## Research Summary

How different AI coding tools apply code changes, which diff formats work best, and accuracy rates per format.

## Key Findings

### The Architect/Editor Split is SOTA
- Aider's Architect mode: reasoning model describes solution, editor model converts to structured edits
- o1-preview (Architect) + DeepSeek/o1-mini (Editor) = **85% on editing benchmark**
- "Splitting attention between problem-solving and format compliance degrades both tasks"

### The Harness Problem
- Changing ONLY the edit interface (not the model) improved performance **+8% across 16 models**, up to **10x for weaker ones** (SWE-bench 623 points)
- But independent replication (edit-bench) found the effect is language-dependent and model-dependent
- "The gap between models dwarfs the gap between edit formats"

### Edit Format Comparison

| Format | Accuracy | Best For |
|--------|----------|---------|
| Search/replace blocks | 84-96% | Frontier models, small edits |
| Whole file rewrite | 60-75% | New files, files <400 lines |
| Unified diff | 80-85% | Complex patches, reduces laziness |
| Morph semantic | 98% | All scenarios (dedicated apply model) |

### Tool-Specific Implementations

**Aider** supports 6 edit formats:
- `whole` (full file), `diff` (search/replace), `diff-fenced` (Gemini), `udiff` (unified), `editor-diff`, `editor-whole`
- Laziness benchmark: SEARCH/REPLACE 20% -> unified diff 61% (GPT-4 Turbo)
- Top results: o1 84.2% correct, Claude 3.5 Sonnet 84.2%, 99.2% format compliance

**Cursor** uses a two-stage architecture:
- Stage 1: Frontier model generates "sketch" (code block, rough description, or partial diff)
- Stage 2: Fine-tuned Llama-3-70b "apply model" generates fully rewritten file
- Why full-file rewrites: fewer thinking tokens in diffs, diffs are out-of-distribution, LLMs bad at line numbers
- Speculative edits: ~1,000 tok/s (13x speedup) using original file as speculation draft

**Claude Code** uses exact string matching (`str_replace`):
- `old_string` must match exactly one location (uniqueness constraint)
- No fuzzy matching fallback
- Whitespace sensitivity is a known limitation

**Codex CLI** uses custom `apply_patch` format:
- No line numbers -- uses text anchors (`@@` with function names)
- GPT-4.1 was "extensively trained" on this format
- Fallback: exact -> trimmed line endings -> all whitespace trimmed

### Critical Lessons
1. **Avoid line numbers** -- LLMs are "notoriously bad at counting"
2. **Implement layered fallback matching**: exact -> whitespace-insensitive -> fuzzy
3. **Build format-specific prompts per model** -- different models need different formats
4. **Separate reasoning from editing** -- Architect/Editor produces SOTA results
5. **Order-invariant apply** is essential -- LLMs return edits out of sequence (Cline +25% from this)
6. **Linter feedback loops** prevent cascading syntax errors (SWE-agent)

### JetBrains Diff-XYZ Benchmark (2025)
- Different formats work best for different tasks and model sizes
- Search-replace excels for diff generation with larger models
- Smaller models need modified udiff variants
- `udiff-l` (verbose line markers) performs very poorly -- GPT-4.1-mini scores 0.01 EM

### AST-Level Transforms
- No production AI coding tool currently uses AST for applying edits
- All tools operate at text level
- AST used for: code review, indexing, RAG pipelines, visualization
- Tree-sitter enables language-agnostic structural understanding
- Gap exists because AST requires language-specific parsers

## Sources
- Aider Edit Formats: https://aider.chat/docs/more/edit-formats.html
- Aider Unified Diffs: https://aider.chat/docs/unified-diffs.html
- Cursor Instant Apply: https://cursor.com/blog/instant-apply
- Fireworks/Cursor Fast Apply: https://fireworks.ai/blog/cursor
- Code Surgery blog: https://fabianhertwig.com/blog/coding-assistants-file-edits/
- The Harness Problem: https://blog.can.ac/2026/02/12/the-harness-problem/
- Diff-XYZ: https://arxiv.org/html/2510.12487v1
- Morph Edit Formats: https://www.morphllm.com/edit-formats
