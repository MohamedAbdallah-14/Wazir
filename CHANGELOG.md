# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

### Changed
- All Codex CLI calls now read model from `config.multi_tool.codex.model` with fallback to `gpt-5.4`
- Producer-reviewer separation enforced: no role reviews its own output
- Reviewer skill is phase-aware with 7 explicit modes (final, spec-challenge, design-review, plan-review, task-review, research-review, clarification-review)
- Brainstorming design-review gate replaces direct handoff to writing-plans
- Clarifier delegates research to discover workflow, spec to specify workflow, planning to writing-plans
- `/wazir` runner pipeline rewritten with all manifest phases and review loops
- Wazir CLI is now required (removed "Skip" option)
- Fixed pass counts: quick=3, standard=5, deep=7 (no extension)
