---
name: wz:init-pipeline
description: Initialize the Wazir pipeline — interactive-first, asks 3-4 questions to configure model mode, tools, and interaction style.
---
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->

# Initialize Pipeline

Set up the Wazir pipeline for this project. **Interactive-first** — every decision that affects how the pipeline operates is explicitly asked. The model does not assume configuration choices.

Init is project infrastructure setup, not a pipeline run interaction point. The vision's "2 user interaction points" (Clarify and Design) refer to interaction during a pipeline run. Init happens before any run — like `git init` is not a commit.

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

## When Init Runs

Init runs in two cases only:

1. **First time:** When `/wazir` is called and no config exists, the wazir main skill invokes this skill during Phase 1 (after bootstrap). In this case, CLI check and bootstrap already passed — skip to Step 1.
2. **Explicit reinit:** When the user types `/wazir init`. This deletes the config file only (not the entire state directory — run history and other state are preserved) and runs the full init flow starting from Step 0.

Init does NOT prompt on every `/wazir` call. When config exists and the user types `/wazir <request>`, the pipeline shows a one-line config summary and proceeds.

### Reinit Behavior

When invoked via `/wazir init`:

1. Delete `.wazir/state/config.json` only (preserve `.wazir/state/`, `.wazir/runs/`, `.wazir/input/`)
2. Run the full init flow below (Steps 0-7)

---

## Init Flow

### Step 0: CLI Check (standalone invocation only)

When invoked directly via `/wazir init`, verify the Wazir CLI is installed:

```bash
which wazir
```

**If not installed**, present:

> **The Wazir CLI is not installed. Install with:**
>
> 1. **npm** (Recommended) — `npm install -g @wazir-dev/cli`
> 2. **Local link** — `npm link` from the Wazir project root

Wait for the user's selection. **STOP if CLI is not installed.**

**Skip this step** when invoked by the wazir main skill (CLI check already passed pre-bootstrap).

### Step 1: Dependency Health Check (automatic, not a question)

Check remaining dependencies (CLI already verified in Step 0 or by the wazir main skill).

```
1. Context-mode MCP
   - Check for core tools (execute, fetch_and_index, search)
   - Also check for execute_file tool
   - If missing: WARN. "Context-mode MCP is not available. The pipeline will work
     but large outputs will consume more context."
   - If present: show "Context-mode: available (N tools detected)"

2. Wazir doctor
   - Run `wazir doctor --json`
   - If manifest or hooks check fails: STOP. "Fix these issues before proceeding."
   - If state-root or host-exports check fails: WARN and continue.
```

Output after all checks:

```
Dependency check:
  ✓ Wazir CLI v1.x.x (verified pre-bootstrap)
  ✓ Context-mode MCP (4 tools, including execute_file)
  ✓ Wazir doctor: healthy
```

### Step 2: Model Mode (Question 1)

One question, three options. No "(Recommended)" marker — this is a genuine choice that depends on the user's setup. There is no universal best answer.

`model_mode` enum values: `"single"`, `"multi-model"`, `"multi-tool"`.

```
How should Wazir use AI models in this project?

1. Single model — Use only the current host model (e.g., Claude Opus). Simplest setup.
2. Multi-model — Route tasks to the cheapest capable model (Haiku/Sonnet/Opus).
   Requires the host to support model selection.
3. Multi-tool — Current model + external CLI tools for cross-model reviews.
   Requires Codex CLI and/or Gemini CLI installed.
   Note: multi-tool mode sends code snippets to external providers for review.
```

Wait for answer.

**If multi-model selected:** Routing defaults are auto-assigned (mechanical → cheapest, comprehension → mid-tier, judgment → highest). No additional questions. Users can override by editing config directly.

**If multi-tool selected:** Multi-tool is about external reviewers, not internal model routing. The `multi_model` routing block is NOT included in multi-tool configs. These are separate concerns.

### Step 3: Multi-Tool Configuration (Question 2 — conditional)

Only if Step 2 answer was "Multi-tool."

```
Which external tools should Wazir use for reviews?
Note: selected tools will receive code from this project for cross-model review.

1. Codex CLI (Recommended) — OpenAI's Codex for cross-model review
2. Gemini CLI — Google's Gemini for cross-model review
3. Both — Use both for maximum blind-spot coverage
```

Wait for answer.

**Dependency validation:** After tool selection, verify each selected tool is actually installed:
- `which codex` / `which gemini`
- If missing: "[Tool] is not installed. Install with: [command]"
  - Ask: "Install now?" / "Skip this tool"
  - If skip and no other tool remains: fall back to `model_mode: "single"`. Inform user: "No external tools available. Falling back to single model mode."

Then, for each installed tool, ask the model:

```
Which Codex model?

1. gpt-5.4 (Recommended) — Strong analysis, moderate speed
2. o3-pro — Deepest analysis, slower
3. gpt-5.3-codex-spark — Fast review loops, lighter analysis
```

For Gemini (if selected):

```
Which Gemini model?

1. gemini-2.5-pro (Recommended) — Strong analysis
2. gemini-2.5-flash — Faster, lighter analysis
```

### Step 4: Interaction Mode (Question 3)

Uses the existing `interaction_mode` enum values: `auto`, `guided`, `interactive`. No renaming.

```
What interaction mode should Wazir use by default?

1. Guided (Recommended) — Pauses at phase boundaries for your approval.
   Best for: most work.
2. Auto — No human checkpoints. External reviewer decides continue/loop/escalate.
   Best for: overnight runs, clear specs. Requires multi-tool mode.
3. Interactive — More discussion, co-designs with you, checks approach before coding.
   Best for: ambiguous requirements, new domains.
```

Wait for answer.

**Constraint:** Auto mode requires multi-tool mode with at least one external reviewer (Codex or Gemini). If selected without external reviewer, block:

> "Auto mode requires an external reviewer (multi-tool mode with Codex or Gemini).
> Either switch to multi-tool mode or pick Guided/Interactive."

Re-ask interaction mode.

### Step 5: Auto-Detect and Report (no questions)

After the explicit questions, auto-detect what can be detected and report it:

```
Auto-detected:
  Host: Claude Code
  Stack: Node.js / TypeScript
  Project: wazir (from manifest)
```

### Step 6: Write Config

Write config directly to `.wazir/state/config.json` using `config_version: 2` schema.

**Example config for `model_mode: "single"`:**

```json
{
  "config_version": 2,
  "initialized_at": "2026-03-26T15:00:00Z",
  "model_mode": "single",
  "interaction_mode": "guided",
  "context_mode": {
    "enabled": true,
    "has_execute_file": true
  },
  "detected": {
    "host": "claude-code",
    "stack": {
      "language": "javascript",
      "framework": null,
      "stack": ["node"]
    },
    "git": true
  }
}
```

**Schema rules:**
- `config_version: 2` — enables migration detection
- `context_mode` is an object with `enabled` and `has_execute_file`
- `detected.stack` is an object with `language`, `framework`, `stack`
- `multi_model` block only present when `model_mode` is `"multi-model"`
- `multi_tool` block only present when `model_mode` is `"multi-tool"`
- No credentials in config — only tool names and model choices

### Step 7: Confirm

```
Wazir initialized.

  Model mode:       multi-tool (Claude Opus + Codex gpt-5.4)
  Interaction mode:  guided
  Host:             Claude Code
  Stack:            Node.js / TypeScript

  Next: /wazir <what you want to build>
  Reconfigure: /wazir init
```

---

## Failure Paths

| Scenario | Behavior |
|----------|----------|
| CLI not installed (pre-bootstrap) | STOP. Show install options. Never enters pipeline. |
| Context-mode missing | WARN. Proceed degraded. Store `context_mode: { enabled: false, has_execute_file: false }`. |
| Doctor critical failure | STOP. User must fix manifest/hooks. |
| Doctor non-critical failure | WARN. Continue. |
| External tool not installed | Offer install. If skipped + no tools remain → `model_mode: "single"`. |
| Auto mode without external reviewer | Block. Re-ask interaction mode. |
| Old config format | Migration notice. Run full init flow. |

---

## Install Paths

| Path | Command | Who |
|------|---------|-----|
| Plugin marketplace | `/plugin install wazir` | Claude Code users |
| npx (zero install) | `npx @wazir-dev/cli` | Any Node project |
| Global install | `npm i -g @wazir-dev/cli` | Power users |
| Clone + link | `git clone && npm link` | Contributors |

## Interaction Rules

- **One question at a time** — never combine questions
- **Numbered options** — always present choices as numbered lists
- **Mark defaults** — show "(Recommended)" on the suggested option, except for model mode (no universal best answer)
- **Wait for answer** — never proceed past a question until the user responds
- **No open-ended questions** — every question has concrete options to pick from
- **Privacy notice** — multi-tool selection includes notice that code is sent to external providers

<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->
