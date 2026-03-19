# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- Restructured pipeline from 14 micro-phases to 4 main phases: Init, Clarifier, Executor, Final Review
- Removed depth and intent questions from pipeline init — depth defaults to standard (override via inline modifiers), intent inferred from request keywords
- Enabled learn + prepare-next workflows by default (part of Final Review phase)
- Renamed `phase_policy` to `workflow_policy` in run-config (legacy name still supported)
- Pipeline init no longer asks about Agent Teams — always sequential
- Input directory (`input/`) now scanned automatically at startup
- Learning extraction with concrete proposal format in reviewer final mode
- Accepted learnings injected into clarifier context (top 10 by confidence, scope-matched)
- Prepare-next skill produces structured handoff document

### Fixed
- Router logs now write to manifest-derived state root instead of `_default` (Codex P1)
- Routing log replay scoped to current run via timestamp filtering (Codex P2)
- Index-query savings now computed from avoided bytes, not raw bytes (Codex P2)
- Index-query savings included in savings-ratio denominator (Codex P2)
- Cursor export now includes context-mode-router hook (Codex P2)

### Added
- Core review loop pattern across all pipeline phases with Codex CLI integration
- `wazir capture loop-check` CLI subcommand with task-scoped cap tracking and run-config loader
- `wazir init` interactive CLI command with arrow-key selection (depth, intent, teams, codex model)
- `docs/reference/review-loop-pattern.md` canonical reference for the review loop pattern
- Standalone skills: `/wazir:clarifier`, `/wazir:executor`, `/wazir:reviewer`
- Agent Teams real implementation in brainstorming (TeamCreate, SendMessage, TeamDelete)
- Codex prompt templates (artifact + code) with "Do NOT load skills" instruction
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
