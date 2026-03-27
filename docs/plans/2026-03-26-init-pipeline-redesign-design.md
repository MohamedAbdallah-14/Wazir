# Init Pipeline Redesign — Design

> Date: 2026-03-26
> Status: Draft — pending operator approval
> Scope: `skills/init-pipeline/SKILL.md` rewrite + `skills/wazir/SKILL.md` Phase 1 update + config schema migration + downstream skill updates
> Reviews: Codex pass 1 (2C/4H/3M — addressed), CodeRabbit (2H/5M/6L — addressed), Codex pass 2 (3H/2M — addressed below)

## Problem

The current init-pipeline is zero-config by default. It auto-detects host, stack, and model mode, then proceeds without questions. This creates four problems:

1. **Assumes model configuration.** Defaults to `claude-only` without asking. Users who want multi-model or multi-tool must know about `--interactive` or manual config commands.
2. **No dependency health check.** Context-mode MCP availability is detected but never surfaced to the user. Missing tools degrade silently.
3. **No reinit path.** Once initialized, users have no clean way to reconfigure without manually editing config files.
4. **Interaction mode is per-run only.** No project-level default — users must remember to type `/wazir auto ...` every time.

## Design Decision

**Interactive-First Init.** The default init flow asks 3-4 explicit questions. The model never assumes configuration choices.

**Scope clarification:** Init is project infrastructure setup, not a pipeline run interaction point. The vision's "2 user interaction points" (Clarify and Design) refer to interaction during a pipeline run. Init happens before any run — like `git init` is not a commit. This distinction is intentional. Note: first-run UX includes init questions + the two pipeline interaction points. Subsequent runs skip init entirely.

## Init Flow

### When Init Runs

Init runs in two cases:

1. **First time:** When `/wazir` is called and no config exists, the wazir main skill invokes the init-pipeline skill during Phase 1 (after bootstrap).
2. **Explicit reinit:** When the user types `/wazir init`. This deletes the config file only (not the entire state directory — run history and other state are preserved) and runs the full init flow.

Init does NOT prompt on every `/wazir` call. When config exists and the user types `/wazir <request>`, the pipeline shows a one-line config summary and proceeds:

```
Config: multi-tool (Opus + Codex gpt-5.4) | guided | Reconfigure: /wazir init
```

### Ordering and the CLI Prerequisite

The init flow has two layers with different ordering:

**Pre-bootstrap (before `wazir capture ensure`):**
- CLI check only. `which wazir` runs before bootstrap because bootstrap requires the CLI. If the CLI is missing, we show install instructions and stop. We never enter the pipeline. This is a machine prerequisite, like checking if git is installed before running `git init`.

**Post-bootstrap (Phase 1, after `wazir capture ensure`):**
- Everything else: context-mode check, config questions, config write. These run inside the bootstrapped pipeline and do not conflict with enforcement invariants.

The wazir main skill handles this split:
1. Check `which wazir` — if missing, show install options, stop
2. Run `wazir capture ensure` (Phase 0 bootstrap)
3. Check if config exists and is current version — if not, invoke init-pipeline skill (Phase 1)

### Step 1: Dependency Health Check (automatic, not a question)

Run checks in sequence and report status. No questions — just inform. The CLI check already passed (pre-bootstrap), so this step covers the remaining dependencies.

```
1. Context-mode MCP
   - Check for core tools (execute, fetch_and_index, search)
   - Also check for execute_file tool
   - If missing: WARN. "Context-mode MCP is not available. The pipeline will work
     but large outputs will consume more context. Install with: [instructions]"
   - If present: show "Context-mode: available (N tools detected)"

2. Wazir doctor
   - Run `wazir doctor --json`
   - Report any failures.
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

One question, three options. No "(Recommended)" marker on this question — this is a genuine choice that depends on the user's setup and there is no universal best answer. `model_mode` enum values: `"single"`, `"multi-model"`, `"multi-tool"`. The legacy value `"claude-only"` is deprecated and treated as `"single"` if encountered in old configs.

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

**If multi-model selected:** Multi-model routing defaults are auto-assigned based on the host's available models. No additional questions — the routing table (mechanical → cheapest, comprehension → mid-tier, judgment → highest) is a sensible default. Users can override individual routing entries post-init by editing the config file directly.

**If multi-tool selected:** Multi-tool implicitly uses the host's best model for local work. The `multi_model` routing block is NOT included in multi-tool configs — multi-tool is about external reviewers, not internal model routing. These are separate concerns.

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
- If missing: "Codex CLI is not installed. Install with: `npm install -g @openai/codex`"
  - Ask: "Install now?" / "Skip this tool"
  - If skip and no other tool remains: fall back to single model mode. Inform user: "No external tools available. Falling back to single model mode." Set `model_mode` to `"single"`.

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

Uses the existing `interaction_mode` enum values (`auto`, `guided`, `interactive`) — no renaming.

```
What interaction mode should Wazir use by default?

1. Guided (Recommended) — Pauses at phase boundaries for your approval. You see
   progress, approve each phase before the next starts. Best for: most work.
2. Auto — No human checkpoints. External reviewer decides continue/loop/escalate.
   Best for: overnight runs, clear specs, well-understood domains.
   Requires: multi-tool mode with at least one external reviewer.
3. Interactive — More discussion, co-designs with you, checks approach before coding.
   Best for: ambiguous requirements, new domains, learning a codebase.
```

Wait for answer.

**Constraint:** If user picks "Auto" but model mode is "Single model" (no external reviewer), block:

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

The skill writes config directly to the project's config path. The canonical location is resolved by the Wazir state root system — skills reference it as `.wazir/state/config.json`, which the state root may resolve to `~/.wazir/projects/<slug>/state/config.json` on disk. This design does not change the state root architecture; it writes to whatever path the existing system resolves.

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

**Example config for `model_mode: "multi-model"`:**

```json
{
  "config_version": 2,
  "initialized_at": "2026-03-26T15:00:00Z",
  "model_mode": "multi-model",
  "multi_model": {
    "routing": {
      "mechanical": "haiku",
      "comprehension": "sonnet",
      "judgment": "opus"
    }
  },
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

**Example config for `model_mode: "multi-tool"`:**

```json
{
  "config_version": 2,
  "initialized_at": "2026-03-26T15:00:00Z",
  "model_mode": "multi-tool",
  "multi_tool": {
    "tools": ["codex"],
    "codex": {
      "model": "gpt-5.4"
    }
  },
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

**Key schema decisions:**
- `config_version: 2` — enables future migration detection. Old configs without this field are version 1.
- `context_mode` preserved as object with `enabled` and `has_execute_file` — clarifier reads both fields.
- `detected.stack` preserved as object with `language`, `framework`, `stack` fields — not flattened.
- `multi_model` block only present when `model_mode` is `"multi-model"`.
- `multi_tool` block only present when `model_mode` is `"multi-tool"`.
- `auto_initialized` removed — replaced by `initialized_at`.
- `default_depth` and `default_intent` removed — these are per-run, live in run-config.yaml only.

**No credentials in config.** Only tool names and model choices. Authentication for Codex/Gemini is handled by their own CLI configs (`~/.codex/`, `~/.config/gemini/`).

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

## Per-Run Override and Wiring

The interaction mode set at init is the **project default**. Each run can override via inline modifiers:
- `/wazir auto fix the auth bug` → overrides to auto for this run
- `/wazir interactive design the onboarding` → overrides to interactive for this run

The override does NOT change the stored config. This matches the existing inline modifier system in `skills/wazir/SKILL.md`.

**Wiring into run-config:** Phase 1 of the wazir main skill (Step 4: Build Run Config) must read `interaction_mode` from the project config and use it as the default value when building `run-config.yaml`. Inline modifiers override this default. The current hardcoded `interaction_mode: guided` in the run-config template must be replaced with a read from project config:

```
# In Phase 1, Step 4 (Build Run Config):
interaction_mode = inline_modifier ?? project_config.interaction_mode ?? 'guided'
```

This ensures the stored project default actually takes effect. Without this wiring, storing the default is pointless.

## Config Migration

When a skill reads the config and finds no `config_version` field (or `config_version: 1`), the config is old-format. Behavior:

1. **On `/wazir` call:** Show migration notice: "Config format has changed. Running `/wazir init` to reconfigure." Invoke init-pipeline skill.
2. **Old field mapping** (for reference during migration):
   - `review_tool` (flat string) → `multi_tool.tools` (array)
   - `codex_model` (flat) → `multi_tool.codex.model` (nested)
   - `model_mode: "claude-only"` → `model_mode: "single"`
   - `auto_initialized` → removed (replaced by `initialized_at`)
   - `detected_host` (flat) → `detected.host`
   - `detected_stack` (object) → `detected.stack` (same shape, moved under `detected`)
   - `context_mode` → preserved as-is (object with `enabled` and `has_execute_file`)

No automatic migration — reinit is the migration path. This is simpler and ensures the user confirms their choices.

## What Init Owns vs What Phase 1 Owns

This is the critical split. Getting this wrong causes either duplication or regressions.

**Init owns (one-time project setup):**
- Context-mode MCP detection and reporting
- Wazir doctor health check
- Model mode questions
- Multi-tool configuration questions
- Interaction mode question
- Auto-detection (host, stack)
- Config file creation

**Phase 1 owns (every-run checks):**
- CLI check (pre-bootstrap — runs before `wazir capture ensure`)
- Bootstrap (`wazir capture ensure`)
- Config existence check → invoke init if missing
- Config version check → invoke init if old format
- Branch check (are you on main/develop? create feature branch)
- Index refresh (`wazir index refresh` or build if missing)
- Resume detection (previous incomplete run)
- Run directory creation
- Run config building (reads project config defaults, applies inline overrides)
- Briefing capture

Branch and index checks are **per-run invariants**, not one-time setup. They stay in Phase 1. A user can switch branches between runs. The index can go stale between runs. These must be checked every time.

## Changes Required

### 1. `skills/init-pipeline/SKILL.md` — Full Rewrite

Replace the current zero-config-first flow with the interactive-first flow described above. The skill:
- Runs dependency checks (context-mode, doctor — NOT CLI, NOT branch, NOT index)
- Asks 3-4 questions (model mode, tool config, interaction mode)
- Writes config file directly (config_version: 2 schema)
- Reports summary

### 2. `skills/wazir/SKILL.md` — Phase 1 Update

Update Phase 1 to:
- Pre-bootstrap: check `which wazir` — if missing, show install options, stop
- Run `wazir capture ensure` (Phase 0 bootstrap)
- Check if config exists and has `config_version: 2` — if missing or old, invoke init-pipeline skill
- If config exists and current: show one-line config summary, proceed
- Keep branch check in Phase 1 (per-run invariant)
- Keep index refresh in Phase 1 (per-run invariant)
- Keep resume detection in Phase 1 (per-run)
- Update run-config builder to read `interaction_mode` from project config as default
- Update auto-mode constraint from "requires Codex" to "requires multi-tool mode with Codex or Gemini"

When user explicitly types `/wazir init`: invoke init-pipeline skill (which deletes config and re-asks everything).

### 3. `skills/clarifier/SKILL.md` — Read depth from run-config

Update clarifier to read `depth` from `run-config.yaml` instead of `default_depth` from `config.json`. The `default_depth` field is being removed from project config (it's per-run).

### 4. `skills/executor/SKILL.md` — Read depth from run-config

Same as clarifier — read `depth` from `run-config.yaml`, not project config.

### 5. `skills/reviewer/SKILL.md` — Read depth from run-config

Same as clarifier and executor. Also update auto-mode constraint wording to "Codex or Gemini."

### 6. `tooling/src/init/auto-detect.js` — Update to config_version 2

Update `auto-detect.js` to write the new config schema (config_version: 2, nested structure). The skill drives the interactive layer; `auto-detect.js` handles directory creation and detection only. The CLI `wazir init` command calls `auto-detect.js` for the mechanical parts.

### 7. `tooling/src/init/command.js` — Update CLI command

Update the `wazir init` CLI command to:
- Remove printing of `default_depth` and other removed fields
- Support the new config schema when creating initial state

### 8. Config Schema Update

- Add `config_version: 2`
- Add `initialized_at` field
- Keep `interaction_mode` (existing name, not renamed)
- Keep `context_mode` as object (`{ enabled, has_execute_file }`)
- Keep `detected.stack` as object (`{ language, framework, stack }`)
- Deprecate `model_mode: "claude-only"` → `"single"`
- Remove `default_depth` and `default_intent` from project config
- Remove `team_mode` and `parallel_backend` if unused
- Remove `auto_initialized` (replaced by `initialized_at`)

## Failure Paths

| Scenario | Behavior |
|----------|----------|
| Wazir CLI not installed (pre-bootstrap) | STOP. Offer install options. Cannot proceed. Never enters pipeline. |
| Context-mode missing | WARN. Proceed with degraded context savings. Store `context_mode: { enabled: false, has_execute_file: false }`. |
| Not a git repo (Phase 1 check) | WARN. Disable worktree/branch features. Store `detected.git: false`. |
| On protected branch (Phase 1 check) | WARN. Pipeline creates feature branch before execution. |
| Doctor critical failure | STOP. User must fix manifest/hooks. |
| Doctor non-critical failure | WARN. Continue. |
| Multi-model on host without model selection | WARN at runtime. "Host may not support model routing. Falling back to single model if routing fails." |
| Selected external tool not installed | Offer install. If skipped and no tools remain, fall back to `model_mode: "single"`. |
| Auto mode without external reviewer | Block. Re-ask interaction mode. |
| Old config format detected | Show migration notice. Run full init flow. |

## What This Does NOT Change

- Run-config structure (per-run settings stay in run-config.yaml)
- Pipeline phases (init/clarifier/executor/final-review)
- Bootstrap gate (`wazir capture ensure`) — init runs AFTER bootstrap
- Phase checklists
- Any pipeline behavior after init completes
- `interaction_mode` enum values (auto/guided/interactive) — no renaming
- `context_mode` object shape — preserved for clarifier compatibility
- State root architecture — config path resolution unchanged

## Interaction Rules (Carried Forward)

- One question at a time
- Numbered options with "(Recommended)" on suggested option (except Step 2: model mode, where there is no universal best answer)
- Wait for answer before proceeding
- No open-ended questions — every question has concrete options
- Privacy notice on multi-tool selection (code sent to external providers)
