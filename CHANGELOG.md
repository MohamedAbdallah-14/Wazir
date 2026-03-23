# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Pipeline enforcement v2 — markdown phase file checklists with hook injection (76% compliance, up from 40-58%)
- Phase file templates (`templates/phases/`) with pre-defined checklists for init, clarifier, executor, final_review
- Template renderer with run-config workflow policy filtering (disabled workflows auto-completed)
- PreToolUse injection hook — injects current pipeline step on every Write/Edit/Bash call
- Stop hook — blocks premature completion when active phase has unchecked items
- Phase transition validation — `wazir capture event` validates checklists before accepting transitions
- `wazir pipeline init` command — renders phase files from templates after run-config exists
- Dual-root artifact lookup — guards check repo-local then fall back to state-root
- Layer 2 skill reminders — 3 pipeline compliance tags in all 29 skill files via `wazir export build`
- Plugin sync script (`scripts/sync-plugin.sh`) for clean state after rollbacks
- Enforcement research synthesis (30+ papers, 7-agent research) at `docs/research/`
- Workflow completion enforcement — `validateRunCompletion()` ensures all enabled workflows complete before run finalizes (`wazir capture summary --complete`)
- Mandatory security gate — pattern-based diff scanner (`tooling/src/checks/security-sensitivity.js`) auto-adds 6 security review dimensions when auth/token/SQL/etc. patterns detected
- Three interaction modes: `auto` (overnight, Codex-required), `guided` (default), `interactive` (co-design) via `/wazir auto|interactive ...`
- User input capture — NDJSON logging of all user messages during a run (`tooling/src/capture/user-input.js`) with retention pruning
- Two-layer reasoning chain output — concise conversation triggers + detailed file output at `reasoning/phase-<name>-reasoning.md`
- Input Coverage dimension in self-audit (compares original input vs plan vs commits)
- Input Coverage dimension in plan-review (8th dimension, catches scope reduction)
- Two-level phase model — `parent_phase` and `workflow` fields in phase report schema, hierarchy display in `wazir status`
- CLI/context-mode enforcement — reviewer flags >5 direct reads without index query and large commands without context-mode
- Per-phase context savings display at phase boundaries via `wazir stats`
- Overnight skill research skill (`skills/skill-research/SKILL.md`) for competitive analysis against superpowers and other frameworks
- Anti-pattern docs: AP-23 (skipping enabled workflows), AP-24 (clarifier deciding scope without asking)

### Changed
- Clarifier Phase 1A rewritten — research runs first, then informed question batches (3-7 per batch), every scope exclusion requires user confirmation
- Executor enforces one commit per task (hard rule, reviewer rejects multi-task batching)
- Per-phase savings display added to clarifier and executor phase boundaries

### Fixed
- SQLite ExperimentalWarning suppressed via lazy dynamic imports in CLI entrypoint
- `--complete` flag properly parsed in `wazir capture summary`
- `validateRunCompletion` filters by `workflow_policy` (enabled workflows only), not full manifest list

### Changed
- Restructured pipeline from 14 micro-phases to 4 main phases: Init, Clarifier, Executor, Final Review
- Removed depth and intent questions from pipeline init — depth defaults to standard (override via inline modifiers), intent inferred from request keywords
- Enabled learn + prepare-next workflows by default (part of Final Review phase)
- Renamed `phase_policy` to `workflow_policy` in run-config (legacy name still supported)
- Input directory (`input/`) now scanned automatically at startup
- Learning extraction with concrete proposal format in reviewer final mode
- Accepted learnings injected into clarifier context (top 10 by confidence, scope-matched)
- Prepare-next skill produces structured handoff document
- All pipeline checkpoints now use AskUserQuestion pattern instead of numbered lists
- Every pipeline phase outputs value-reporting text (before/after) explaining why the phase matters and what it found
- Review dimensions annotated with "catches:" descriptions explaining what class of bugs each dimension prevents

### Removed
- `@inquirer/prompts` dependency and `--interactive` init path (always fails in non-TTY)
- All Agent Teams references (team_mode, parallel_backend, TeamCreate/SendMessage/TeamDelete, Free Thinker/Grounder/Synthesizer)

### Fixed
- Router logs now write to manifest-derived state root instead of `_default` (Codex P1)
- Routing log replay scoped to current run via timestamp filtering (Codex P2)
- Index-query savings now computed from avoided bytes, not raw bytes (Codex P2)
- Index-query savings included in savings-ratio denominator (Codex P2)
- Cursor export now includes context-mode-router hook (Codex P2)
- SessionStart hook uses correct `database_path` key for index freshness check
- TabManager stop hook error documented as Claude Code internal (cannot fix from Wazir side)

### Added
- Core review loop pattern across all pipeline phases with Codex CLI integration
- `wazir capture loop-check` CLI subcommand with task-scoped cap tracking and run-config loader
- `wazir init` zero-config auto-init (no prompts, infer everything)
- `docs/reference/review-loop-pattern.md` canonical reference for the review loop pattern
- Standalone skills: `/wazir:clarifier`, `/wazir:executor`, `/wazir:reviewer`
- Codex prompt templates (artifact + code) with "Do NOT load skills" instruction
- `tooling/src/verify/proof-collector.js` — detects project type (web/api/cli/library) and collects mechanical proof of implementation
- Phase reports wired into pipeline — `wazir report phase` called after each phase exit and displayed to user
- Proof-of-implementation in verify workflow — runnable vs non-runnable detection with evidence collection
- Git branch enforcement in `/wazir` runner (validates branch, offers to create feature branch)
- CLI wiring across pipeline phases (doctor gate, index build/refresh, capture events, validate gates)
- CHANGELOG enforcement in executor and reviewer skills
- 10 new tests: 7 for handleLoopCheck, 4 for init command (406 total)
- Spec-kit task template (`templates/artifacts/tasks-template.md`) with checklist format, phase structure, parallel markers, MVP strategy
- AC verification scaffold (`tooling/src/checks/ac-matrix.js`) — 111 automated acceptance criteria checks
- Context-mode detection in `wazir init` (3 core tools + optional execute_file under MCP prefix)
- Input preservation logic in clarifier (adopt input specs verbatim, never remove detail)
- Gap analysis exit gate in clarifier (invoke wz:reviewer --mode plan-review, fix-and-loop)
- Online research in clarifier Phase 0 (keyword extraction, fetch_and_index/WebFetch, error handling)
- Codex output context protection (tee + extract via execute_file, fail-closed fallback)
- Resume detection with staleness check and interactive checkpoint in /wazir runner
- Usage capture at every phase_exit event
- Run-scoped user feedback routing (plan corrections vs scope changes)
- Phase scoring with canonical dimension sets and quality delta reporting
- Full end-of-phase reports (7 sections: Summary, Key Changes, Quality Delta, Findings Log, Usage, Context Savings, Time Spent)

### Changed
- All Codex CLI calls now read model from `config.multi_tool.codex.model` with fallback to `gpt-5.4`
- Producer-reviewer separation enforced: no role reviews its own output
- Reviewer skill is phase-aware with 7 explicit modes (final, spec-challenge, design-review, plan-review, task-review, research-review, clarification-review)
- Brainstorming design-review gate replaces direct handoff to writing-plans
- Clarifier delegates research to discover workflow, spec to specify workflow, planning to writing-plans
- `/wazir` runner pipeline rewritten with all manifest phases and review loops
- Wazir CLI is now required (removed "Skip" option)
- Fixed pass counts: quick=3, standard=5, deep=7 (no extension)
- Clarifier now invokes `wz:reviewer --mode` explicitly instead of ad-hoc codex calls
- Fix-and-loop pattern: re-submission after fixes is mandatory, "fix and continue" prohibited
- Review loop escalation at cap: 3 user options (approve-with-issues, fix-manually, abort)
- CHANGELOG/gitflow hard gates before PR (validate changelog + validate commits)
- All checkpoints use numbered interactive options with (Recommended) markers
- Reviewer documents 5 owned responsibilities (Codex integration, dimensions, pass counting, attribution, dimension set recording)
