---
name: wz:init-pipeline
description: Initialize the Wazir pipeline with interactive setup. Creates project directories, selects mode, and configures the pipeline.
---

# Initialize Pipeline

Set up the Wazir pipeline for this project.

## Command Routing
Follow the Canonical Command Matrix in `hooks/routing-matrix.json`.
- Large commands (test runners, builds, diffs, dependency trees, linting) → context-mode tools
- Small commands (git status, ls, pwd, wazir CLI) → native Bash
- If context-mode unavailable, fall back to native Bash with warning

## Codebase Exploration
1. Query `wazir index search-symbols <query>` first
2. Use `wazir recall file <path> --tier L1` for targeted reads
3. Fall back to direct file reads ONLY for files identified by index queries
4. Maximum 10 direct file reads without a justifying index query
5. If no index exists: `wazir index build && wazir index summarize --tier all`

## Step 0: Check Wazir CLI

Run `which wazir` to check if the CLI is installed.

**If installed** — run `wazir init` and let it handle the interactive setup. If the pipeline was already initialized, use `wazir init --force` to reinitialize. Once it completes, skip to Step 5 (Confirm).

**If not installed**, present:

> **The Wazir CLI is not installed. It's required for event capture, validation, and indexing.**
>
> **How would you like to install it?**
>
> 1. **npm** (Recommended) — `npm install -g @wazir-dev/cli`
> 2. **Local link** — `npm link` from the Wazir project root
> 3. **Skip** — Continue without the CLI (some features will be unavailable)

Wait for the user to answer before continuing.

After installing, run `wazir init` and let it handle the rest. Skip to Step 5.

## Step 0.5: Detect context-mode MCP

After CLI check, detect if the context-mode MCP plugin is installed by checking if ALL THREE core tools are available under the `mcp__plugin_context-mode_context-mode__` prefix:
- `mcp__plugin_context-mode_context-mode__execute`
- `mcp__plugin_context-mode_context-mode__fetch_and_index`
- `mcp__plugin_context-mode_context-mode__search`

Additionally, check if `mcp__plugin_context-mode_context-mode__execute_file` is available (optional).

Store in config as an object:
```json
"context_mode": {
  "enabled": true,
  "has_execute_file": true
}
```

This detection runs silently — no user prompt needed.

---

**The steps below are the manual fallback — only used when the CLI is not installed and the user chose to skip installation.**

## Step 1: Create Project Directories

```bash
mkdir -p .wazir/input .wazir/state .wazir/runs
```

## Step 2: Choose Pipeline Mode

> **How should Wazir run in this project?**
>
> 1. **Single model** (Recommended) — Everything runs in the current model. Single model, slash commands only.
> 2. **Multi-model** — Still the current model, but routes tasks by complexity (Haiku for micro, Sonnet for standard, Opus for complex).
> 3. **Multi-tool** — Current model + external tools for reviews.

Wait for the user to answer before continuing.

## Step 3: If Multi-Tool, Choose Tools

Only ask this if the user selected option 3:

> **Which external tools should Wazir use for reviews?**
>
> 1. **Codex** (Recommended) — Send reviews to OpenAI Codex
> 2. **Gemini** — Send reviews to Google Gemini
> 3. **Both** — Use Codex and Gemini as secondary reviewers

### Step 3.5: Codex Model (conditional)

Only ask this if Codex was selected:

> **Which Codex model should Wazir use?**
>
> 1. **gpt-5.3-codex-spark** (Recommended) — Fast, good for review loops
> 2. **gpt-5.4** — Slower, deeper analysis

## Step 4: Write Config

Create/update `.wazir/state/config.json`:

- Set `model_mode` to the selected mode (`claude-only`, `multi-model`, or `multi-tool`)
- If `multi-tool`, set `multi_tool.tools` to the selected tools
- Set `default_depth` to `standard` (override per-run via inline modifiers)
- Set `default_intent` to `feature` (inferred per-run from request text)
- Set `team_mode` to `sequential`
- Set `parallel_backend` to `none`
- If Codex selected, set `multi_tool.codex.model` to the chosen model
- Set `context_mode` to the detected value from Step 0.5

Example for claude-only:
```json
{
  "model_mode": "claude-only",
  "default_depth": "standard",
  "default_intent": "feature",
  "team_mode": "sequential",
  "parallel_backend": "none"
}
```

Example for multi-tool:
```json
{
  "model_mode": "multi-tool",
  "multi_tool": {
    "tools": ["codex"],
    "codex": {
      "model": "gpt-5.3-codex-spark"
    }
  },
  "default_depth": "standard",
  "default_intent": "feature",
  "team_mode": "sequential",
  "parallel_backend": "none"
}
```

## Step 4.5: Runtime-Specific Setup

Based on `multi_tool.tools`:

- If **codex** selected: Create `AGENTS.md` in project root
- If **gemini** selected: Create `GEMINI.md` in project root
- If **both**: Create both files

## Step 5: Confirm

List all files created and show the selected mode:

> **Pipeline initialized. You can now use:**
>
> - `/wazir <your request>` — Run the full pipeline (Init → Clarifier → Executor → Final Review)
> - `/clarifier` — Run clarification only (research, clarify, brainstorm, plan)
> - `/executor` — Run execution only (implement approved plan)
> - `/reviewer` — Run final review only (review + learn + prepare next)

## Interaction Rules

- **One question at a time** — never combine questions
- **Numbered options** — always present choices as numbered lists
- **Mark defaults** — always show "(Recommended)" on the suggested option
- **Wait for answer** — never proceed past a question until the user responds
- **No open-ended questions** — every question has concrete options to pick from
