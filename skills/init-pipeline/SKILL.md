---
name: wz:init-pipeline
description: Initialize the Wazir pipeline — zero-config by default, auto-detects host and project stack. No mandatory questions.
---
<!-- PIPELINE: Check .wazir/runs/latest/phases/ for your current phase. Complete all items before proceeding. -->

# Initialize Pipeline

Set up the Wazir pipeline for this project. **Zero-config by default** — everything is auto-detected and sensibly defaulted. No questions unless the user explicitly asks for interactive mode.

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

## Zero-Config Flow (Default)

### Step 1: Check Wazir CLI

Run `which wazir` to check if the CLI is installed.

**If not installed**, present:

> **The Wazir CLI is not installed. Install with:**
>
> 1. **npm** (Recommended) — `npm install -g @wazir-dev/cli`
> 2. **Local link** — `npm link` from the Wazir project root

### Step 2: Auto-Initialize

Run `wazir init` (default: auto mode). This automatically:

1. **Creates directories:** `.wazir/input/`, `.wazir/state/`, `.wazir/runs/`
2. **Detects host:** Claude Code / Codex / Gemini / Cursor from environment variables and file markers
3. **Detects project stack:** Language, framework, and stack from package files
4. **Detects context-mode MCP:** Checks for core tools (`execute`, `fetch_and_index`, `search`)
5. **Writes config** with sensible defaults:
   - `model_mode: "claude-only"` (override: `wazir config set model_mode multi-model`)
   - `default_depth: "standard"` (override per-run: `/wazir deep ...`)
   - `default_intent: "feature"` (inferred per-run from request text)
6. **Auto-exports** for the detected host

**No questions asked.** The pipeline is ready to use immediately.

### Step 3: Confirm

> **Wazir initialized.**
>
> Host: [detected host] | Stack: [detected language/framework]
>
> Next: `/wazir <what you want to build>`

---

## Interactive Flow (Power Users)

<!-- PIPELINE: Check .wazir/runs/latest/phases/ for your current phase. Complete all items before proceeding. -->
Triggered by `wazir init --interactive`. For users who want manual control.

### Pipeline Mode

> **How should Wazir run in this project?**
>
> 1. **Single model** (Recommended) — slash commands only
> 2. **Multi-model** — routes sub-tasks to cheapest capable model (Haiku/Sonnet/Opus)
> 3. **Multi-tool** — current model + external tools for reviews

**If multi-model selected:** The model router (`tooling/src/adapters/model-router.js`) assigns automatically:
- **Haiku** for mechanical tasks (URL fetching, file ops, compression)
- **Sonnet** for comprehension tasks (implementation, reviews, learning extraction)
- **Opus** for judgment tasks (orchestration, design, spec hardening, final review)

Override via `model_overrides` in config.

### External Tools (if multi-tool)

> **Which external tools for reviews?**
>
> 1. **Codex** (Recommended)
> 2. **Gemini**
> 3. **Both**

If Codex selected:
> **Codex model?**
>
> 1. **gpt-5.3-codex-spark** (Recommended) — Fast review loops
> 2. **gpt-5.4** — Deeper analysis

---

## Install Paths

| Path | Command | Who |
|------|---------|-----|
| Plugin marketplace | `/plugin install wazir` | Claude Code users |
| npx (zero install) | `npx @wazir-dev/cli` | Any Node project |
| Global install | `npm i -g @wazir-dev/cli` | Power users |
| Clone + link | `git clone && npm link` | Contributors |

## Deep When You Need It

- `wazir config set <key> <value>` — override any default
- `wazir doctor` — see what's configured
- `wazir stats` — see what Wazir saved you
- `wazir init --interactive` — full manual setup

**Principle:** Like git — `git init` is one command, `git config` is deep. Instant start, deep when you need it.

## Interaction Rules

- **One question at a time** — never combine questions
- **Numbered options** — always present choices as numbered lists
- **Mark defaults** — always show "(Recommended)" on the suggested option
- **Wait for answer** — never proceed past a question until the user responds
- **No open-ended questions** — every question has concrete options to pick from

<!-- PIPELINE: Check .wazir/runs/latest/phases/ for your current phase. Complete all items before proceeding. -->