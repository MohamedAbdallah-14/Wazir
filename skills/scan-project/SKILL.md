---
name: scan-project
description: Build a project profile from manifests, docs, tests, and `input/` so clarification and planning start from evidence.
---
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->

# Scan Project

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

Inspect the smallest set of repo surfaces needed to answer:

- what kind of project this is
- which languages and toolchains are active
- how verification is expected to work
- where the relevant product and architecture docs live
- what constraints appear in `input/`

## Index build / refresh

<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->
After the initial scan, ensure a Wazir index is available for
symbol-level exploration in later phases:

1. If no index exists, run:
   ```
   wazir index build && wazir index summarize --tier all
   ```
2. If an index already exists, run:
   ```
   wazir index refresh
   ```
3. Include the output of `wazir index stats` in the project profile so
   downstream roles can see index coverage at a glance.

Required output:

- a concise project profile with file references
- index stats (symbol count, file count, staleness)
- open unknowns that require research or clarification

Rules:

- prefer manifests, scripts, CI config, and current docs over assumptions
- treat inactive surfaces as historical context only

<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->