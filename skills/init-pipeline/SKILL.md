---
name: wz:init-pipeline
description: Initialize the Wazir pipeline with interactive setup. Creates project directories, selects mode, and configures the pipeline.
---

# Initialize Pipeline

Set up the Wazir pipeline for this project.

## Step 0: Check Wazir CLI

Run `which wazir` to check if the CLI is installed.

**If installed** — run `wazir init` and let it handle the interactive setup (arrow-key selection). If the pipeline was already initialized, use `wazir init --force` to reinitialize. Once it completes, skip to Step 9 (Confirm).

**If not installed**, present:

> **The Wazir CLI is not installed. It's required for event capture, validation, and indexing.**
>
> **How would you like to install it?**
>
> 1. **npm** (Recommended) — `npm install -g @wazir-dev/cli`
> 2. **Local link** — `npm link` from the Wazir project root
> 3. **Skip** — Continue without the CLI (some features will be unavailable)

If the user picks 1, run `npm install -g @wazir-dev/cli` and verify with `wazir --version`.
If the user picks 2, run `npm link` from the project root and verify.
If the user picks 3, warn that `wazir capture`, `wazir validate`, and `wazir index` commands will not work, then continue to the manual steps below.

After installing, run `wazir init` and let it handle the rest. Skip to Step 9.

---

**The steps below are the manual fallback — only used when the CLI is not installed and the user chose to skip installation.**

## Step 1: Create Project Directories

```bash
mkdir -p .wazir/input .wazir/state .wazir/runs
```

## Step 2: Choose Pipeline Mode

Present this question:

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
> 1. **Codex** — Send reviews to OpenAI Codex
> 2. **Gemini** — Send reviews to Google Gemini
> 3. **Both** — Use Codex and Gemini as secondary reviewers

Wait for the user to answer before continuing.

## Step 3.5: Codex Model (conditional)

Only ask this if Codex was selected in Step 3:

> **Which Codex model should Wazir use?**
>
> 1. **gpt-5.3-codex-spark** (Recommended) — Fast, good for review loops and grounder work
> 2. **gpt-5.4** — Slower, deeper analysis for complex reviews
>
> *You can change this later in `.wazir/state/config.json` under `multi_tool.codex.model`.*

Wait for the user to answer before continuing.

## Step 4: Default Depth

> **What default depth should runs use?**
>
> 1. **Quick** — Minimal research, single-pass review, fast execution. Good for small fixes and config changes.
> 2. **Standard** (Recommended) — Balanced research, multi-pass hardening, full review. Good for most features.
> 3. **Deep** — Extended research, thorough hardening, strict review thresholds. Good for complex or security-critical work.
>
> *This sets the project default. Individual runs can override via inline modifiers (e.g. `/wazir quick ...`).*

Wait for the user to answer before continuing.

## Step 5: Default Intent

> **What kind of work does this project mostly involve?**
>
> 1. **Feature** (Recommended) — New functionality or enhancement
> 2. **Bugfix** — Fix broken behavior
> 3. **Refactor** — Restructure without changing behavior
> 4. **Docs** — Documentation only
> 5. **Spike** — Research and exploration, no production code
>
> *This sets the project default. Individual runs can override via inline modifiers or when intent is obvious from the request.*

Wait for the user to answer before continuing.

## Step 6: Agent Teams (conditional)

Only ask this if ALL of these are true:
- The host is Claude Code (not Codex/Gemini/Cursor)
- Default depth is `standard` or `deep`
- Default intent is `feature` or `refactor` (not bugfix/docs/spike)

> **Would you like to use Agent Teams for parallel execution?**
>
> 1. **No** (Recommended) — Tasks run sequentially. Predictable, lower cost.
> 2. **Yes** — Spawns parallel teammates for independent tasks. Potentially faster and richer output.
>
> *Agent Teams is experimental from Claude's side. Requires Opus model. Higher token consumption.*

If the conditions above are NOT met, silently default to `team_mode: sequential`.

If the user selects **Yes**, enable the Agent Teams experimental feature:

```bash
claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1
```

Then inform the user they need to restart their Claude Code session for it to take effect.

Wait for the user to answer before continuing.

## Step 7: Write Config

Create/update `.wazir/state/config.json`:

- Set `model_mode` to the selected mode (`claude-only`, `multi-model`, or `multi-tool`)
- If `multi-tool`, set `multi_tool.tools` to the selected tools (e.g. `["codex"]`, `["gemini"]`, or `["codex", "gemini"]`)
- Set `default_depth` to the selected depth (`quick`, `standard`, or `deep`)
- Set `default_intent` to the selected intent (`feature`, `bugfix`, `refactor`, `docs`, or `spike`)
- Set `team_mode` to the selected mode (`sequential` or `parallel`)
- If `team_mode` is `parallel`, set `parallel_backend` to `claude_teams`
- If Codex selected, set `multi_tool.codex.model` to the chosen model

Example for claude-only with defaults:
```json
{
  "model_mode": "claude-only",
  "default_depth": "standard",
  "default_intent": "feature",
  "team_mode": "sequential",
  "parallel_backend": "none"
}
```

Example for multi-tool with teams enabled:
```json
{
  "model_mode": "multi-tool",
  "multi_tool": {
    "tools": ["codex"],
    "codex": {
      "model": "gpt-5.3-codex-spark"
    }
  },
  "default_depth": "deep",
  "default_intent": "feature",
  "team_mode": "parallel",
  "parallel_backend": "claude_teams"
}
```

## Step 8: Runtime-Specific Setup

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

## Step 9: Confirm

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
