# Ease of Use: User Project Mode Implementation Plan

**Date:** 2026-03-27
**Branch:** feat/user-project-mode
**Goal:** After plugin install, `/wazir "Build X"` just works in any project. No manual CLI install, no manual init, no export commands.

## Problem

The CLI crashes in user projects (no `wazir.manifest.yaml`). The `findProjectRoot` function throws, killing every command. Skills already check for CLI + init, but the CLI itself doesn't support running outside the Wazir repo.

## User Journey (After)

```
/plugin marketplace add MohamedAbdallah-14/Wazir   # one-time
/plugin install wazir                                # one-time
# open any project
/wazir "Build a REST API"                           # auto-bootstraps, then runs
```

## Architecture Decision

Introduce a **project context** abstraction. Every CLI command currently does:

```js
const projectRoot = findProjectRoot(cwd);
const manifest = readYamlFile(join(projectRoot, 'wazir.manifest.yaml'));
const stateRoot = resolveStateRoot(projectRoot, manifest, opts);
```

Replace with:

```js
const ctx = resolveProjectContext(cwd, opts);
// ctx.projectRoot — cwd for user projects, manifest location for Wazir repo
// ctx.manifest — full manifest for Wazir repo, synthetic manifest for user projects (never null)
// ctx.stateRoot — resolved from manifest or default template
// ctx.isUserProject — true when no wazir.manifest.yaml found
```

**Decision: synthetic manifest, never null.** In user-project mode, `ctx.manifest` is a minimal object with just enough for state resolution and slug generation. Downstream code always accesses `ctx.manifest.project.name` and `ctx.manifest.paths.state_root_default` without null checks.

```js
// Synthetic manifest for user projects:
{
  project: { name: slugFromDirName },
  paths: { state_root_default: '~/.wazir/projects/{project_slug}' },
  hosts: [],       // empty — no exports
  roles: [],       // empty — plugin provides these
  workflows: [],   // empty — plugin provides these
}
```

---

## Section 1: Core Infrastructure — `resolveProjectContext`

### Task 1.1: Modify `findProjectRoot` to not throw

**File:** `tooling/src/project-root.js`

Change `findProjectRoot` to return `null` when no manifest is found instead of throwing. Add a new `findProjectRootStrict` for callers that genuinely need the Wazir repo (export, validate).

**Acceptance criteria:**
- `findProjectRoot('/some/user/project')` returns `null` (no throw)
- `findProjectRootStrict('/some/user/project')` throws (existing behavior)
- All existing tests still pass
- New tests: null return for directory without manifest, correct return for directory with manifest

**Verification:** `npm test -- --grep "findProjectRoot"`

### Task 1.2: Create `resolveProjectContext` function

**File:** `tooling/src/project-context.js` (new)

Encapsulates the 3-line pattern (find root → read manifest → resolve state root) into a single function that handles both modes.

```
resolveProjectContext(cwd, { stateRootOverride? }) → {
  projectRoot: string,       // cwd for user projects, manifest dir for Wazir
  manifest: object | null,   // full manifest or null
  stateRoot: string,         // resolved path
  isUserProject: boolean,    // true when no manifest
}
```

When `findProjectRoot` returns null (no manifest found):
- `projectRoot` = cwd
- `manifest` = synthetic minimal manifest (see Architecture Decision above — never null)
- `stateRoot` = `~/.wazir/projects/{slug}/` where slug = directory basename slugified
- `isUserProject` = true

**Acceptance criteria:**
- Returns full context when manifest exists
- Returns user-project context with synthetic manifest (not null) when no manifest file
- `ctx.manifest.project.name` and `ctx.manifest.paths.state_root_default` always accessible
- State root respects override in both modes
- Slug generation matches existing `slugifyProjectName`

**Verification:** New test file `tooling/test/project-context.test.js`

### Task 1.3: Modify `resolveStateRoot` to handle null manifest

**File:** `tooling/src/state-root.js`

When manifest is null, use default template `~/.wazir/projects/{project_slug}` with slug derived from projectRoot basename.

**Acceptance criteria:**
- `resolveStateRoot('/path/to/my-app', null)` returns `~/.wazir/projects/my-app`
- Override still takes precedence over default
- Existing manifest-based resolution unchanged

**Verification:** `npm test -- --grep "resolveStateRoot"`

---

## Section 2: CLI Commands — User Project Mode

### Task 2.1: `wazir init` works without manifest

**File:** `tooling/src/init/command.js`, `tooling/src/init/auto-detect.js`

Currently `runInitCommand` calls `buildHostExports(cwd)` which reads `wazir.manifest.yaml` from cwd. In user project mode, skip the export step entirely (the plugin provides everything).

Changes:
- `autoInit` already creates `.wazir/` dirs without needing a manifest — verify this
- Remove the `buildHostExports` call failure path — in user project mode, just skip it cleanly
- Print different success message for user projects vs Wazir repo

**Acceptance criteria:**
- `wazir init` in a directory without `wazir.manifest.yaml` succeeds
- Creates `.wazir/input/`, `.wazir/state/`, `.wazir/runs/`
- Writes `.wazir/state/config.json` with detected host/stack
- Prints "Ready. Type /wazir <task>"
- Does NOT attempt export build
- `wazir init` in Wazir repo still runs export build (existing behavior)

**Verification:** `npm test -- --grep "init"` + manual test in a temp directory

### Task 2.2: `wazir doctor` user project mode

**File:** `tooling/src/doctor/command.js`

Switch from `findProjectRoot` + manifest to `resolveProjectContext`. When `isUserProject`:
- Check: CLI available (always pass — we're running)
- Check: state dirs exist (`.wazir/state/config.json`)
- Check: plugin installed (look for `~/.claude/plugins/cache/wazir-marketplace/`)
- Skip: manifest validation, hooks validation, host exports check

**Acceptance criteria:**
- `wazir doctor` in user project returns structured output
- Reports plugin presence
- Reports state initialization status
- Does NOT crash looking for manifest
- JSON output format consistent with existing

**Verification:** `npm test -- --grep "doctor"` + manual test

### Task 2.3: `wazir index` user project mode

**File:** `tooling/src/index/command.js`

Switch `loadProjectContext` to use `resolveProjectContext`. The index commands (build, refresh, search, stats, summarize) all need `projectRoot` and `stateRoot`. Neither requires the manifest — the index scans source files from `projectRoot`.

**Acceptance criteria:**
- `wazir index build` in user project indexes the project's source files
- `wazir index search-symbols <query>` works in user project
- `wazir index stats` returns correct database path
- Index database stored at `{stateRoot}/index/index.sqlite`

**Verification:** `npm test -- --grep "index"` + manual test

### Task 2.4: `wazir capture` user project mode

**File:** `tooling/src/capture/command.js`

Switch `resolveCaptureContext` to use `resolveProjectContext`. The capture commands need `projectRoot` and `stateRoot` but don't need manifest content for most operations.

The one exception: `capture summary --complete` calls `validateRunCompletion(runRoot, manifestPath)` which needs the manifest. In user project mode, skip manifest validation for run completion (the plugin's reviewer skill handles quality).

**Acceptance criteria:**
- `wazir capture init --run <id> --phase clarify` works in user project
- `wazir capture ensure` works in user project
- `wazir capture event` works in user project
- Run state stored at `{stateRoot}/runs/{run-id}/`
- `latest` symlink works

**Verification:** `npm test -- --grep "capture"`

### Task 2.5: Remaining commands — `status`, `stats`, `report`, `state`, `recall`

**Files:** `tooling/src/status/command.js`, `tooling/src/commands/stats.js`, `tooling/src/reports/command.js`, `tooling/src/state/command.js`, `tooling/src/recall/command.js`

All follow the same `loadProjectContext` pattern. Switch each to `resolveProjectContext`.

**Acceptance criteria:**
- Each command works in user project mode (no crash)
- Each command uses default state root when no manifest
- Commands that genuinely need manifest data (e.g., phase prerequisites) degrade gracefully with a message like "Run from Wazir repo for full validation"

**Verification:** `npm test` (full suite)

### Task 2.6: `wazir export` and `wazir validate` — Wazir-repo only

**Files:** `tooling/src/export/command.js`, `tooling/src/commands/validate.js`

These commands only make sense in the Wazir repo. Use `findProjectRootStrict` and emit a clear error in user projects: "Export/validate commands require the Wazir repository. User projects get everything from the plugin."

**Acceptance criteria:**
- `wazir export build` in user project prints clear error, exits 1
- `wazir validate` in user project prints clear error, exits 1
- Both still work normally in Wazir repo

**Verification:** `npm test -- --grep "export|validate"`

---

## Section 3: Session-Start Hook Improvements

### Task 3.1: CLI missing → explicit install directive

**File:** `hooks/session-start` (in plugin)

Currently line ~46 silently degrades when `which wazir` fails. Change to output an explicit directive:

```
<system-reminder>
WAZIR CLI NOT INSTALLED. Run: npm install -g @wazir-dev/cli
The pipeline needs the CLI for indexing and state management.
</system-reminder>
```

**Acceptance criteria:**
- When CLI not in PATH, session-start outputs install directive
- When CLI is in PATH, behavior unchanged
- Directive is clear enough that the agent auto-runs the install

**Verification:** Manual test (temporarily rename wazir binary)

### Task 3.2: User project bootstrap guidance

**File:** `hooks/session-start` (in plugin)

The current CLI bootstrap guidance references `wazir doctor --json` which will now work in user project mode. But adjust the guidance to not reference manifest-specific commands.

When running in a user project (no `wazir.manifest.yaml` in cwd):
- Skip "Run `wazir doctor --json`" if init hasn't been done (doctor will fail without state dirs)
- Replace with "Run `wazir init` to set up state directories"
- After init, the existing guidance works

**Acceptance criteria:**
- Session-start detects user project vs Wazir repo
- Adjusts bootstrap guidance accordingly
- First-time user project gets "run wazir init" guidance
- Initialized user project gets normal guidance

**Verification:** Manual test in a fresh directory

---

## Section 4: Skill Improvements

### Task 4.1: wz:wazir auto-installs CLI

**File:** `skills/wazir/SKILL.md` (in plugin and repo)

The skill already checks `which wazir` (lines 129-147). Currently it presents options and waits. Change to: tell the agent to run `npm install -g @wazir-dev/cli` directly, then verify with `which wazir`. Only ask the user if npm install fails.

**Acceptance criteria:**
- When CLI missing, skill tells agent to install it
- Agent runs `npm install -g @wazir-dev/cli`
- If install succeeds, skill continues without user interaction
- If install fails, skill stops and asks user for help

**Verification:** Manual test

### Task 4.2: wz:wazir auto-inits

**File:** `skills/wazir/SKILL.md` (in plugin and repo)

The skill already checks `.wazir/state/config.json` (lines 176-181) and invokes init-pipeline. Verify this works in user project mode now that `wazir init` handles it.

**Acceptance criteria:**
- In a fresh user project, `/wazir "Build X"` auto-installs CLI + auto-inits + starts pipeline
- No manual commands needed after plugin install

**Verification:** Manual end-to-end test in a fresh project

---

## Section 5: README Quick Start Update

### Task 5.1: Update README.md

**File:** `README.md`

Replace the current Quick Start section with:

```markdown
## Quick Start

### Install the plugin (one-time)

In Claude Code:
```
/plugin marketplace add MohamedAbdallah-14/Wazir
/plugin install wazir
```

### Use it

```
/wazir "Build a REST API with auth"
```

That's it. The CLI and project state are set up automatically on first use.
```

Keep the "From npm" and "From source" sections as secondary options for power users and contributors.

**Acceptance criteria:**
- Quick Start is 2 install commands + 1 usage command
- "From npm" and "From source" sections retained but deprioritized
- No mention of `wazir init` or `wazir export build` in the primary path

**Verification:** Read the README, verify it matches

---

## Section 6: Tests

### Task 6.1: New test file for `resolveProjectContext`

**File:** `tooling/test/project-context.test.js`

Cover:
- Wazir repo mode (manifest present)
- User project mode (no manifest)
- State root override in both modes
- Slug generation from directory names

### Task 6.2: Update existing tests

Update test files that test CLI commands to include user-project-mode test cases:
- `tooling/test/init.test.js`
- `tooling/test/doctor.test.js` (if exists)
- `tooling/test/index.test.js` (if exists)
- `tooling/test/capture.test.js` (if exists)

**Acceptance criteria:**
- All existing tests pass
- New user-project-mode tests pass
- No test references `findProjectRoot` directly (all use `resolveProjectContext` or `findProjectRootStrict`)

**Verification:** `npm test` — full suite green

---

## Execution Order

```
1.1 → 1.2 → 1.3          (core infrastructure, sequential — each builds on previous)
     ↓
2.1, 2.2, 2.3, 2.4, 2.5, 2.6   (CLI commands, parallelizable after Section 1)
     ↓
3.1, 3.2                  (hooks, parallelizable after Section 2)
     ↓
4.1, 4.2                  (skills, after hooks work)
     ↓
5.1                        (README, last)
     ↓
6.1, 6.2                  (tests throughout, but final pass here)
```

Section 1 is the foundation. Section 2 tasks are independent of each other. Sections 3-5 can proceed once the CLI works.

## Risk

- **`wazir capture summary --complete` needs manifest for `validateRunCompletion`** — skip in user project mode, rely on reviewer skill for quality.
- **Plugin path diverges from repo** — skills/hooks in plugin cache vs repo. Changes need to be made in both places (repo is canonical, plugin rebuilds from repo via marketplace).
- **npm install -g without sudo** — may fail on some systems. The skill should detect this and suggest `sudo` or nvm-based install.

## Out of Scope

- Single-command plugin install (requires Claude Code platform changes)
- Automatic plugin updates
- Non-Claude hosts (Codex/Gemini/Cursor plugin install paths differ)
