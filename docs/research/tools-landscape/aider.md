# Aider — Deep Research

42.4K stars. AI pair programming in terminal. Created by Paul Gauthier. 88% of aider's own code written by aider.

## Core Innovations

### 1. Repository Map (tree-sitter + PageRank)
- Parses entire codebase with tree-sitter → symbol definitions + references
- Builds directed dependency graph between files
- Runs PageRank (personalized to current chat) to rank relevance
- Renders within token budget — LLM sees architecture without full implementations
- **This is aider's #1 innovation.**

### 2. Edit Format Research
6+ formats, model-specific selection. Key finding: **plain text beats function calling API**.
- SEARCH/REPLACE (Claude, GPT-4o): token-efficient, layered fuzzy matching
- Whole file (o1/o3): simple but expensive
- Unified diff (GPT-4 Turbo): reduces "lazy coding" 3x
- Each model has optimal format — benchmarked, not guessed

### 3. Architect Mode (Two-Stage)
- Architect (strong model): reasons about solution freely
- Editor (cheap/fast model): formats into actual file edits
- Result: o1-preview + DeepSeek = 85% SOTA. 14x cost reduction with R1+Sonnet.
- Key insight: "splitting attention between solving and formatting" is the bottleneck

### 3-Tier Model System
- Main model (coding), Weak model (commits/summaries), Editor model (formatting)

### Verification
- Tree-sitter linters after every edit (auto_lint)
- Custom linter support, test execution
- Reflection loop: lint/test fail → errors to LLM → fix → repeat (max 3)

### Git Integration
- Auto-commit every edit, dirty file protection, instant undo

## Key Limitation
- **No task decomposition**: one request at a time, user must break down work
- **Context limit is #1 problem**: Paul Gauthier says models degrade past ~25-30K tokens
- **No autonomous agent loop**: waits for human direction on every step

## What's Useful for Wazir
- Repo map concept for codebase understanding
- Architect/editor separation validates planning/execution split
- Edit format research: format matters enormously, model-specific
- Linter-in-the-loop for automated quality checking
