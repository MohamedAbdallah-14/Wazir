---
artifact_type: execution_plan
phase: plan
role: planner
run_id: <run-id>
loop: 1
status: draft
sources:
  - <approved-spec>
  - <approved-design>
approval_status: required
template_ref: tasks-template
---

# Execution Plan: <Project Title>

## Constitution Check
- Approved spec: `<path-to-spec>`
- Approved design: `<path-to-design>`
- Branch: `<branch-name>`
- Depth: <quick|standard|deep>

## MVP Strategy
1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete first User Story phase → test independently → deploy/demo (MVP!)
3. Add stories incrementally — each adds value without breaking previous

## Dependency Graph
```
<task-id> → <task-id> (describe dependency)
```

---

## Phase 1: Setup

**Goal:** Project scaffolding — directories, configs, stubs.

- [ ] T001 Setup task description with `path/to/file`
- [ ] T002 [P] Parallel setup task with `another/path`

---

## Phase 2: Foundational

**Goal:** Core infrastructure that BLOCKS all user stories. Must complete before any story phase.

- [ ] T003 Foundational task with `path/to/file`
- [ ] T004 [P] Parallel foundational task with `another/file`

**Independent test:** Describe how to verify this phase independently.

---

## Phase 3: User Story 1 — [US1] <Story Title>

**Goal:** <What this story delivers to the user>

**Independent test criteria:**
- <How to verify this story works end-to-end without other stories>

**Implementation tasks:**
- [ ] T005 [US1] Task description with `path/to/file`
- [ ] T006 [P] [US1] Parallel task with `another/file`
- [ ] T007 [US1] Task description with `path/to/file`

---

## Phase 4: User Story 2 — [US2] <Story Title>

**Goal:** <What this story delivers>

**Independent test criteria:**
- <Verification approach>

**Implementation tasks:**
- [ ] T008 [US2] Task with `path/to/file`
- [ ] T009 [P] [US2] Parallel task with `path/to/file`

---

## Phase N: Polish & Cross-Cutting

**Goal:** Final integration, documentation, cleanup.

- [ ] T0XX Polish task with `path/to/file`

---

## Cross-cutting Constraints

| ID | Constraint | When verified |
|----|-----------|--------------|
| CC1 | <constraint> | <timing> |

## Task Summary

| Phase | Tasks | Stories | Size | Execution |
|-------|-------|---------|------|-----------|
| 1: Setup | T001-T002 | — | S | Serial |
| 2: Foundational | T003-T004 | — | M | T003∥T004 |
| 3: [US1] | T005-T007 | US1 | M | Serial |
| 4: [US2] | T008-T009 | US2 | M | T008→T009 |
| N: Polish | T0XX | — | S | Serial |

## Format Reference

**Task line format:**
```
- [ ] [TaskID] [P?] [Story?] Description with `file/path`
```

- `- [ ]` — checkbox (always present)
- `TaskID` — sequential: T001, T002, T003...
- `[P]` — parallel marker: ONLY if task can run simultaneously with adjacent tasks (different files, no dependencies)
- `[US1]` — user story label: maps to story phases from the spec
- Description — clear action with exact file path in backticks

**Phase rules:**
- Phase 1 (Setup): project init, scaffolding
- Phase 2 (Foundational): BLOCKS all user stories — must complete first
- Phase 3+: one phase per user story, in priority order from spec
- Final phase: polish, cross-cutting, documentation

**Task ordering within phases:**
- Models before services, services before endpoints
- Each user story phase has: goal, independent test criteria, implementation tasks
- Tasks organized by user story, NOT by layer

**Parallel markers:**
- `[P]` means this task can run simultaneously with the next `[P]` task
- Only use when tasks edit different files with no shared dependencies
- Adjacent `[P]` tasks form a parallel group
