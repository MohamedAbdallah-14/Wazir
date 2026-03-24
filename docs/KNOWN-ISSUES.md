# Known Issues

Last updated: 2026-03-24

---

## Critical

### KI-001: Bootstrap gate blocks .wazir/ writes

**Status:** Fixed (commit 2b80677)
**First seen:** Session 10 (2026-03-24)
**Symptom:** `PreToolUse:Write says: BOOTSTRAP REQUIRED` when writing to `.wazir/runs/latest/phases/clarifier.md`
**Root cause:** Bootstrap gate checks for run existence via `latest` pointer. If pointer breaks (symlink deleted, not created, or stale), gate falls through to "no run exists" and blocks ALL writes including `.wazir/` paths.
**Impact:** Agent can't update pipeline state. Creates cascade: can't fix the pointer because writes are blocked.
**Fix:** `.wazir/` paths should bypass bootstrap gate entirely. The gate protects source files, not pipeline state.

### KI-002: Agent games phase files by direct edit

**Status:** Fixed (commit c583f2e)
**First seen:** Session 10 (2026-03-24)
**Symptom:** Agent writes `[x]` on all checklist items in phase files without doing the work. Sets header to ACTIVE/COMPLETED directly.
**Root cause:** `.wazir/runs/*/phases/*.md` files are writable in all phases. Agent finds this escape hatch and uses it to skip clarifier/executor phases.
**Impact:** Phase tracking becomes meaningless. Agent claims 100% but actually did 0%.
**Caught by:** Artifact validation on transition (exit 44) — catches the lie when required files don't exist.
**Fix:** Add `phases/*.md` to protected-path-write-guard. Only CLI commands (`wazir capture event`, `wazir pipeline init`) can modify phase files.

### KI-003: Multiple ACTIVE phases cause Stop hook deadlock

**Status:** Fixed (commit 373502b)
**First seen:** Session 10 (2026-03-24)
**Symptom:** `Stop hook: {"decision":"block","reason":"Multiple ACTIVE phases: executor, init"}`
**Root cause:** Agent manually sets multiple phase files to ACTIVE (via KI-002 gaming). Stop hook detects malformed state and blocks. Agent can't stop, can't fix state (if KI-001 also active).
**Impact:** Session deadlocked. Only escape: Ctrl+C.
**Fix:** Stop hook should auto-repair: pick latest ACTIVE phase by file order (init < clarifier < executor < final_review), set earlier ones to COMPLETED.

---

## High

### KI-004: latest symlink breaks between operations

**Status:** Open
**First seen:** Session 9 (2026-03-23), recurring in session 10
**Symptom:** `.wazir/runs/latest` symlink disappears or becomes stale. Hooks can't find active run.
**Root cause:** Multiple code paths create the pointer differently — `ensureRun()` creates a plain file, `createRepoLocalSymlink()` creates a symlink, `capture init` writes to state-root. When these conflict, the pointer gets overwritten or deleted.
**Impact:** All enforcement hooks fail-open (injection returns `{}`, stop gate approves, bootstrap gate may block).
**Fix:** Unify pointer creation. Always use symlink. `readLatestRunId()` already handles both formats — but creation should be consistent.

### KI-005: Agent creates competing TodoWrite list

**Status:** Fixed
**First seen:** Session 10 (2026-03-24)
**Symptom:** Agent creates its own todo list ("implement step 1, write tests, commit") that doesn't match pipeline phases. Agent follows todo list instead of phase checklist.
**Root cause:** TodoWrite is an available tool. Agent naturally creates task lists early in sessions. This list competes with phase files for the agent's attention.
**Impact:** Agent drifts from pipeline to its own plan. Phase compliance drops.
**Fix:** SKILL.md Phase 0 now instructs agent to call TaskList before creating tasks. If tasks already exist matching the checklist, skip. If stale tasks exist, replace with fresh checklist tasks.

### KI-006: Context rot within single session

**Status:** Known limitation
**First seen:** All sessions
**Symptom:** Compliance drops from 100% (init) to 33% (final_review) within one session. Agent loses focus on pipeline as context accumulates.
**Root cause:** Context window fills with conversation history, tool outputs, file contents. Pipeline instructions get buried. Research: 15-47% performance drop as context grows (Stanford "Lost in the Middle"), all 18 LLMs below 50% at 32K tokens (Chroma 2025).
**Impact:** Later phases have lower compliance than earlier phases.
**Mitigation:** `/compact` between phases (manual, can't be automated). PreToolUse injection re-injects current step. Skill reminders at start/middle/end of files.
**Fix:** No fix decided. Context rot research preserved in v3 findings doc.

### KI-007: No programmatic way to trigger /compact

**Status:** Won't fix (Claude Code limitation)
**First seen:** Session 10 (2026-03-24)
**Symptom:** CLI outputs "Run `/compact` to clear context" but agent doesn't act on it. No hook or CLI command can trigger compaction.
**Root cause:** `/compact` is a user-only command. Not available via Bash, hooks, or agent tools.
**Impact:** Context rot between phases is not mitigated in automated (-p mode) or when user doesn't manually compact.
**Workaround:** Design system to degrade gracefully without compact. PreToolUse injection still fires regardless. Auto-compact triggers near context limit.
**Fix:** No fix decided. Context rot research preserved in v3 findings doc.

---

## Medium

### KI-008: Mustache template markers in phase files

**Status:** Fixed on branch, not yet on main
**First seen:** Session 10 (2026-03-24)
**Symptom:** Phase files contain raw `{{#workflow.discover}}` markers. Agent sees unrendered template syntax and gets confused.
**Root cause:** `createPhaseFiles()` copies raw templates without rendering. `wazir pipeline init` renders them but is called later.
**Fix:** Strip mustache markers in `createPhaseFiles()` — assume all workflows enabled. `pipeline init` re-renders with run-config later. Fix is in PR #15.

### KI-009: Sub-skills have zero pipeline awareness

**Status:** Open
**First seen:** Session 10 (2026-03-24)
**Symptom:** Running `wz:clarifier` or `wz:executor` standalone doesn't create a run, track phases, or enforce compliance. Pipeline enforcement only works via `/wazir`.
**Root cause:** Sub-skills assume the wazir orchestrator already set up the pipeline. They don't call `capture ensure` or create phase files.
**Impact:** Users who invoke skills directly get zero enforcement.
**Fix:** Each structured skill should call `capture ensure` at entry. Design doc at `docs/plans/2026-03-24-skill-level-enforcement-design.md`.

### KI-010: Dual-root state split

**Status:** Open
**First seen:** Design review pass 5 (2026-03-23)
**Symptom:** Run state lives in two places — repo-local `.wazir/runs/` (phase files, artifacts, symlink) and state-root `~/.wazir/projects/<slug>/runs/` (status.json, events.ndjson, usage.json). Guards and CLI commands sometimes read from the wrong location.
**Root cause:** Historical split. Phase enforcement was added repo-locally, capture system was already at state-root.
**Impact:** `wazir capture event` fails with "status.json not found" when status is at state-root but run was created repo-locally (or vice versa).
**Mitigation:** Per-file-type dual-root lookup implemented for artifacts and run-config. status.json/events.ndjson stay state-root-only.
**Fix:** Long-term unification. Short-term: ensure all code paths check both locations.

### KI-011: Hook "error" labels in Claude Code

**Status:** Won't fix (Claude Code platform bug)
**First seen:** Session 1 (2026-03-19)
**Symptom:** Claude Code shows "PreToolUse:Write hook error" for hooks that execute successfully. The word "error" poisons the agent's context.
**Root cause:** Claude Code labels any hook output that isn't a simple allow/deny as "error."
**Impact:** Agent sees "error" repeatedly, may lose confidence in hooks or try to work around them.
**Workaround:** Consolidated dispatcher reduces the number of hook invocations. Can't eliminate the label.

---

## Low

### KI-012: Self-audit skill not enforced

**Status:** Open
**First seen:** Session 10 (2026-03-24)
**Symptom:** Agent ran Phase 1 (CLI validators) and skipped Phases 2-5 of self-audit. 2/10 execution quality.
**Root cause:** Self-audit skill has 5 structured phases but no enforcement hooks. Same failure mode as pre-enforcement `/wazir`.
**Fix:** Scope stack architecture (docs/plans/2026-03-24-skill-level-enforcement-design.md) extends enforcement to all structured skills.

### KI-013: Benchmark runner scripts in repo

**Status:** Managed
**Symptom:** `benchmark/run-benchmark.sh` and `benchmark/benchmark-suite.md` contain engineered test designs.
**Mitigation:** Added to `.gitignore`. Only `benchmark/results/` (comparison reports) are tracked. Harness files stay local-only.

### KI-014: `wazir validate` exit codes inconsistent in worktrees

**Status:** Open
**First seen:** Session 10 (2026-03-24)
**Symptom:** `node tooling/src/cli.js validate manifest` exits 0 in main workspace but sometimes exits 1 in git worktrees. Output says "valid" in both cases.
**Root cause:** `isDirectExecution()` uses `realpathSync` which resolves differently in worktrees vs main workspace.
**Impact:** Self-audit quality scoring unreliable in worktrees.

### KI-015: init-pipeline skill skips interactive questions

**Status:** Open
**First seen:** Session 11 (2026-03-24)
**Symptom:** `/wz:init-pipeline` runs `wazir init` in zero-config mode without asking the user any questions. User gets no say in pipeline mode, model routing, or external tool configuration.
**Root cause:** Skill defaults to zero-config flow. Interactive flow only triggers with `wazir init --interactive`, but the skill never offers that choice.
**Impact:** User has no control over pipeline setup. Must manually reconfigure after the fact.
**Fix:** init-pipeline skill should ask the user whether they want zero-config or interactive mode before running `wazir init`. Interactive should be the presented option, not a hidden flag.

### KI-016: config.json stores per-run values as project config

**Status:** Open
**First seen:** Session 11 (2026-03-24)
**Symptom:** `config.json` contains `default_depth: "standard"` and `default_intent: "feature"`. These are per-run values inferred from request text, not project-level configuration.
**Root cause:** `autoInit()` in `tooling/src/init/auto-detect.js` writes these to the persistent config. They should only exist in the run's `run-config.json`.
**Impact:** Misleading config. Users think they're setting project defaults, but `inferIntent()` and `parseDepthModifier()` override them per-run anyway.
**Fix:** Remove `default_depth` and `default_intent` from `autoInit()` config output. These belong in per-run state only.

### KI-017: context-mode detection uses wrong plugin directory name

**Status:** Open
**First seen:** Session 11 (2026-03-24)
**Symptom:** `context_mode.enabled: false` in config even when context-mode is installed.
**Root cause:** `autoInit()` fallback check (line 235) looks for `~/.claude/plugins/cache/context-mode/` but the actual installed directory is `~/.claude/plugins/cache/claude-context-mode/`.
**Impact:** Context-mode features disabled. Routing matrix falls back to native Bash for large commands.
**Fix:** Check for both `context-mode` and `claude-context-mode` directory names, or glob for `*context-mode*`.

### KI-018: `wazir pipeline init --run` arg parsing fails

**Status:** Open
**First seen:** Session 11 (2026-03-24)
**Symptom:** `wazir pipeline init --run run-YYYYMMDD-HHMMSS` exits 1 with "Usage: wazir pipeline init --run <id>".
**Root cause:** CLI arg parser (`tooling/src/cli.js:parseArgs`) puts `--run` and the run ID into `parsed.args[]` but `runPipelineCommand` reads `parsed.options?.run` which is always undefined.
**Impact:** `wazir pipeline init` cannot be called from the CLI. Must be called programmatically via Node import.
**Fix:** Parse `--run` from `parsed.args` array in `runPipelineCommand`, or add options parsing to the CLI arg parser.

### KI-019: CodeRabbit Bash bypass

**Status:** Known limitation, accepted
**First seen:** PR #11 CodeRabbit review
**Symptom:** Phase-aware blocking only gates Write/Edit tools. Agent can still `echo > src/file.js` via Bash to bypass source write restrictions.
**Root cause:** Detecting source-modifying Bash commands requires AST-level analysis of shell scripts. Too complex for v1.
**Mitigation:** Write/Edit blocking catches ~90% of source writes. Bash bypass is the semantic evasion gap documented in the enforcement design.
