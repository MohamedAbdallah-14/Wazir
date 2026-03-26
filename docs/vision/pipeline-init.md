# Pipeline Initialization — Full Specification

> Parent document: `docs/vision/pipeline.md` (Section: Project Initialization)
> Status: LOCKED (same as pipeline.md)
> Scope: How Wazir initializes project configuration before any pipeline run

## Principle

**Never assume configuration.** Every decision that affects how the pipeline operates is explicitly asked. The model does not default to a configuration the user never chose.

Init is project infrastructure setup, not a pipeline run interaction point. The vision's "2 user interaction points" (Clarify and Design) refer to interaction during a pipeline run. Init happens before any run — like `git init` is not a commit. First-run UX includes init questions + the two pipeline interaction points. Subsequent runs skip init entirely.

---

## When Init Runs

Init runs in two cases only:

1. **First time:** When `/wazir` is called and no config exists, the wazir main skill invokes the init-pipeline skill during Phase 1 (after bootstrap).
2. **Explicit reinit:** When the user types `/wazir init`. This deletes the config file only (not the entire state directory — run history and other state are preserved) and runs the full init flow.

Init does NOT prompt on every `/wazir` call. When config exists and the user types `/wazir <request>`, the pipeline shows a one-line config summary and proceeds:

```
Config: multi-tool (Opus + Codex gpt-5.4) | guided | Reconfigure: /wazir init
```

---

## Ordering

The init flow has two layers with different ordering:

**Pre-bootstrap (before `wazir capture ensure`):**
- CLI check only. `which wazir` runs before bootstrap because bootstrap requires the CLI. If the CLI is missing, we show install instructions and stop. We never enter the pipeline. This is a machine prerequisite, like checking if git is installed before running `git init`.

**Post-bootstrap (Phase 1, after `wazir capture ensure`):**
- Everything else: context-mode check, config questions, config write. These run inside the bootstrapped pipeline and do not conflict with enforcement invariants.

The wazir main skill handles this split:
1. Check `which wazir` — if missing, show install options, stop
2. Run `wazir capture ensure` (Phase 0 bootstrap)
3. Check if config exists and is current version — if not, invoke init-pipeline skill (Phase 1)

---

## Init Flow

### Step 1: Dependency Health Check (automatic, not a question)

The CLI check already passed (pre-bootstrap). This step covers the remaining dependencies.

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

Output:

```
Dependency check:
  ✓ Wazir CLI v1.x.x (verified pre-bootstrap)
  ✓ Context-mode MCP (4 tools, including execute_file)
  ✓ Wazir doctor: healthy
```

### Step 2: Model Mode (Question 1)

One question, three options. No "(Recommended)" marker — this is a genuine choice that depends on the user's setup. There is no universal best answer.

`model_mode` enum values: `"single"`, `"multi-model"`, `"multi-tool"`. The legacy value `"claude-only"` is deprecated and treated as `"single"`.

```
How should Wazir use AI models in this project?

1. Single model — Use only the current host model (e.g., Claude Opus). Simplest setup.
2. Multi-model — Route tasks to the cheapest capable model (Haiku/Sonnet/Opus).
   Requires the host to support model selection.
3. Multi-tool — Current model + external CLI tools for cross-model reviews.
   Requires Codex CLI and/or Gemini CLI installed.
   Note: multi-tool mode sends code snippets to external providers for review.
```

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

**Dependency validation:** After selection, verify each tool is installed (`which codex` / `which gemini`). If missing: offer install. If skipped and no tools remain: fall back to `model_mode: "single"`.

Then, for each installed tool, ask the model:

```
Which Codex model?

1. gpt-5.4 (Recommended) — Strong analysis, moderate speed
2. o3-pro — Deepest analysis, slower
3. gpt-5.3-codex-spark — Fast review loops, lighter analysis
```

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

**Constraint:** Auto mode requires multi-tool mode with at least one external reviewer. If selected without external reviewer, block and re-ask.

### Step 5: Auto-Detect and Report (no questions)

```
Auto-detected:
  Host: Claude Code
  Stack: Node.js / TypeScript
  Project: wazir (from manifest)
```

### Step 6: Write Config

Config is written to the project's config path, resolved by the Wazir state root system. Skills reference it as `.wazir/state/config.json`.

**Config schema (version 2):**

```json
{
  "config_version": 2,
  "initialized_at": "2026-03-26T15:00:00Z",
  "model_mode": "single | multi-model | multi-tool",
  "multi_model": {
    "routing": {
      "mechanical": "haiku",
      "comprehension": "sonnet",
      "judgment": "opus"
    }
  },
  "multi_tool": {
    "tools": ["codex"],
    "codex": { "model": "gpt-5.4" }
  },
  "interaction_mode": "auto | guided | interactive",
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
- `config_version: 2` — enables migration detection. Old configs without this field are version 1.
- `context_mode` is an object with `enabled` and `has_execute_file` — downstream skills read both.
- `detected.stack` is an object with `language`, `framework`, `stack` — not flattened.
- `multi_model` block only present when `model_mode` is `"multi-model"`.
- `multi_tool` block only present when `model_mode` is `"multi-tool"`.
- No credentials in config — only tool names and model choices.

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

## Per-Run Override and Wiring

The interaction mode from project config seeds each run's `run-config.yaml`:

```
interaction_mode = inline_modifier ?? project_config.interaction_mode ?? 'guided'
```

Inline modifiers (`/wazir auto ...`, `/wazir interactive ...`) override without changing stored config.

---

## What Init Owns vs What Phase 1 Owns

**Init owns (one-time project setup):**
- Context-mode MCP detection and reporting
- Wazir doctor health check
- Model mode questions
- Multi-tool configuration questions
- Interaction mode question
- Auto-detection (host, stack)
- Config file creation

**Phase 1 owns (every-run checks):**
- CLI check (pre-bootstrap)
- Bootstrap (`wazir capture ensure`)
- Config existence and version check → invoke init if needed
- Branch check (per-run invariant — users switch branches)
- Index refresh (per-run invariant — index goes stale)
- Resume detection
- Run directory creation
- Run config building (reads project config, applies overrides)
- Briefing capture

---

## Config Migration

When config has no `config_version` field (version 1), show migration notice and invoke init. No automatic migration — reinit is the migration path.

**Old → new field mapping:**
- `review_tool` → `multi_tool.tools`
- `codex_model` → `multi_tool.codex.model`
- `model_mode: "claude-only"` → `model_mode: "single"`
- `auto_initialized` → removed (replaced by `initialized_at`)
- `detected_host` → `detected.host`
- `detected_stack` → `detected.stack` (same shape, moved under `detected`)
- `context_mode` → preserved as-is

---

## Failure Paths

| Scenario | Behavior |
|----------|----------|
| CLI not installed (pre-bootstrap) | STOP. Show install options. Never enters pipeline. |
| Context-mode missing | WARN. Proceed degraded. Store `context_mode: { enabled: false, has_execute_file: false }`. |
| Not a git repo (Phase 1) | WARN. Disable worktree/branch features. |
| On protected branch (Phase 1) | WARN. Create feature branch before execution. |
| Doctor critical failure | STOP. User must fix manifest/hooks. |
| Doctor non-critical failure | WARN. Continue. |
| Multi-model on unsupported host | WARN at runtime. Fall back to single model. |
| External tool not installed | Offer install. If skipped + no tools remain → `model_mode: "single"`. |
| Auto mode without external reviewer | Block. Re-ask interaction mode. |
| Old config format | Migration notice. Run full init. |

---

## Interaction Rules

- One question at a time
- Numbered options with "(Recommended)" on suggested option (except model mode — no universal best answer)
- Wait for answer before proceeding
- No open-ended questions — every question has concrete options
- Privacy notice on multi-tool selection (code sent to external providers)

---

## Design Decisions

| Decision | Rationale | Override Condition |
|----------|-----------|-------------------|
| Interactive-first, never assume config | Users have different setups. Zero-config biases toward unchosen defaults. | Learning data showing >90% accept defaults unchanged |
| Init is project setup, not a run interaction point | Vision's 2 interaction points are per-run. Init is infrastructure. | Never — architectural distinction |
| Branch and index checks per-run, not init-only | Users switch branches. Indexes go stale. Runtime invariants. | Never — per-run checks are load-bearing |
| CLI check pre-bootstrap, everything else post | Bootstrap requires CLI. All other init is safe inside the pipeline. | Never — ordering is load-bearing |
| No auto-migration of old config | Reinit ensures user confirms choices. Simpler than silent field mapping. | Scale demands it (>100 projects to migrate) |
| No "(Recommended)" on model mode | Depends on user's tool availability and preferences. No universal answer. | Evidence showing one mode dominates |
