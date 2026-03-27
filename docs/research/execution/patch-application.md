# Patch Application and Code Change Strategies

## Research Summary

How patches are applied in software engineering, diff algorithms, conflict resolution algorithms, the apply model pattern, and accuracy rates.

## Key Findings

### The Apply Model Pattern
The frontier approach separates planning (frontier LLM) from application (specialized smaller model).

**Cursor**: Fine-tuned Llama-3-70b at ~1,000 tok/s. Speculative decoding uses original file as draft for 13x speedup over vanilla inference.

**Morph Fast Apply**: 7B model at 10,500 tok/s, 98% first-pass accuracy. Custom CUDA kernels. 1,000-line file in 1.3 seconds. "A smaller model trained specifically on code merging runs 100x faster than a general-purpose model and achieves higher accuracy."

### Accuracy by File Size (Morph Benchmarks)
| File Size | Accuracy |
|-----------|----------|
| Small (<100 lines) | ~85% |
| Medium (100-300 lines) | ~75% |
| Large (300+ lines) | ~60% |
| Recently modified | ~45% |

### First-Pass Accuracy by Tool
| Tool | Accuracy |
|------|----------|
| Morph Fast Apply | 98% |
| Claude search-replace | 86% |
| Cursor Apply | 85% |
| Aider | 80% |

### git apply vs git am
- `git apply`: reads patch, applies to working directory without commit. All-or-nothing. `--3way` for merge fallback.
- `git am -3`: takes email patches with commit metadata, three-way merge fallback "significantly better"
- Use `git am -3` for patch series; `git apply` for single patches

### Three-Way Merge Algorithm
- Compares BASE (common ancestor), OURS, THEIRS
- Changed in one only: take that change (auto)
- Changed in both identically: take shared change (auto)
- Changed in both differently: CONFLICT
- "The central innovation that allowed the switch from file-locking to merge-based revision control"

### Diff Algorithms
**Myers** (Git default): Shortest edit script, O(ND). Minimal diffs but may place changes at unintuitive positions.

**Patience**: Matches only unique lines as anchors. More readable diffs for code.

**Histogram** (jgit): Low-occurrence common elements as anchors. Empirically "more suitable than Myers for code changes" (Nugroho et al., 2020). Bug-identification impact: 6.0-13.3% of commits differ by algorithm.

### Conflict Resolution Algorithms
**GNU patch**: Fuzz factor (default 2), scans forward/backward for context match, rejects to `.rej`.

**Neil Fraser's fuzzy patch** (diff-match-patch): Levenshtein distance + Bitap algorithm. Pattern limit: register bit width (32 chars). In code, 15-char patterns have far more repetitions than English text.

**Modern AI tools** (layered):
- Aider: exact -> whitespace-insensitive -> indentation-preserving -> fuzzy -> break into sub-hunks
- Codex: exact -> trimmed endings -> all whitespace trimmed
- RooCode: exact -> Levenshtein with threshold (0.8-1.0) and middle-out search

### Code Formatters and Patches
- Auto-formatters can bloat diffs by 40-60%
- Formatting between read and edit causes stale context
- Solutions: pre-commit hooks, `git-format-staged`, `git merge -Xignore-space-change`

### OT vs CRDT for Parallel Agent Edits
**OT**: Requires central server, quadratic transformation complexity. Used by Google Docs. Error-prone without formal verification.

**CRDT (CodeCRDT, 2025)**: 100% convergence, zero merge failures, but 5-10% semantic conflicts. Speedup: up to 21.1%, slowdown: up to 39.4%. Code generation volume inflation 82-189% for complex tasks. 16-32 bytes metadata per character.

Neither mature enough to replace git-based isolation for AI agent work.

### SWE-bench Patch Statistics
- Top score: Claude Opus 4.5 ~80.9% (Verified)
- SWE-bench Pro (harder): best 23.1-23.3%
- Solution leakage affects 32.67% of successes
- Revised success rates: 12.47% -> 3.97% after strict validation
- Language gap: C# ~40% vs Python ~70%

## Sources
- Cursor Instant Apply: https://cursor.com/blog/instant-apply
- Morph Fast Apply: https://www.morphllm.com/fast-apply-model
- Neil Fraser Fuzzy Patch: https://neil.fraser.name/writing/patch/
- Diff Algorithms comparison: https://link.springer.com/article/10.1007/s10664-019-09772-z
- CodeCRDT: https://arxiv.org/abs/2510.18893
- SWE-bench: https://epoch.ai/benchmarks/swe-bench-verified
- SWE-ABS: https://arxiv.org/html/2603.00520
