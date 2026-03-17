---
name: wz:init-pipeline
description: Initialize the Wazir pipeline with interactive setup. Creates project directories, selects mode, and configures the pipeline.
---

# Initialize Pipeline

Set up the Wazir pipeline for this project. All questions use numbered interactive options — one question at a time.

## Step 0: Check Wazir CLI

Run `which wazir` to check if the CLI is installed.

**If not installed**, present:

> **The Wazir CLI is not installed. It's required for event capture, validation, and indexing.**
>
> **How would you like to install it?**
>
> 1. **npm** (Recommended) — `npm install -g wazir`
> 2. **Local link** — `npm link` from the Wazir project root
> 3. **Skip** — Continue without the CLI (some features will be unavailable)

If the user picks 1, run `npm install -g wazir` and verify with `wazir --version`.
If the user picks 2, run `npm link` from the project root and verify.
If the user picks 3, warn that `wazir capture`, `wazir validate`, and `wazir index` commands will not work, then continue.

**If installed**, run `wazir doctor --json` to verify repo health and continue.

## Step 1: Create Project Directories

```bash
mkdir -p .wazir/input .wazir/state .wazir/runs
```

## Step 2: Choose Pipeline Mode

Present this question:

> **How should Wazir run in this project?**
>
> 1. **Claude only** (Recommended) — Everything runs in Claude Code. Single model, slash commands only.
> 2. **Multi-model** — Still Claude Code, but routes tasks by complexity (Haiku for micro, Sonnet for standard, Opus for complex).
> 3. **Multi-tool** — Claude Code + external tools for reviews.

Wait for the user to answer before continuing.

## Step 3: If Multi-Tool, Choose Tools

Only ask this if the user selected option 3:

> **Which external tools should Wazir use for reviews?**
>
> 1. **Codex** — Send reviews to OpenAI Codex
> 2. **Gemini** — Send reviews to Google Gemini
> 3. **Both** — Use Codex and Gemini as secondary reviewers

Wait for the user to answer before continuing.

## Step 4: Write Config

Create/update `.wazir/state/config.json`:

- Set `model_mode` to the selected mode (`claude-only`, `multi-model`, or `multi-tool`)
- If `multi-tool`, set `multi_tool.tools` to the selected tools (e.g. `["codex"]`, `["gemini"]`, or `["codex", "gemini"]`)

Example for claude-only:
```json
{
  "model_mode": "claude-only"
}
```

Example for multi-tool with codex:
```json
{
  "model_mode": "multi-tool",
  "multi_tool": {
    "tools": ["codex"]
  }
}
```

## Step 5: Runtime-Specific Setup

Based on `multi_tool.tools`:

- If **codex** is selected: Create `AGENTS.md` in project root:
  ```
  # Wazir Pipeline

  Agent protocols are at `~/.claude/agents/` (global).

  ## Running the Pipeline
  1. Clarifier: read and follow `~/.claude/agents/clarifier.md` — tasks are in `.wazir/input/`
  2. Orchestrator: read and follow `~/.claude/agents/orchestrator.md` — start from task 1
  3. Opus Reviewer: read and follow `~/.claude/agents/opus-reviewer.md` — run all phases

  ## Review Mode
  This project uses Codex as a secondary reviewer. Review artifacts are in `.wazir/reviews/`.
  ```

- If **gemini** is selected: Create `GEMINI.md` in project root with the same content adapted for Gemini.

- If **both**: Create both files.

## Step 6: Confirm

List all files created and show the selected mode. Then present:

> **Pipeline initialized. You can now use:**
>
> - `/wazir <your request>` — Run the full pipeline end-to-end
> - `/clarifier` — Run Phase 0 + Phase 1 only (research, clarify, plan)
> - `/executor` — Run Phase 2 only (autonomous execution)
> - `/reviewer` — Run Phase 3 only (final review and scoring)

## Interaction Rules

- **One question at a time** — never combine questions
- **Numbered options** — always present choices as numbered lists
- **Mark defaults** — always show "(Recommended)" on the suggested option
- **Wait for answer** — never proceed past a question until the user responds
- **No open-ended questions** — every question has concrete options to pick from
