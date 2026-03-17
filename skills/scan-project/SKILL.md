---
name: scan-project
description: Build a project profile from manifests, docs, tests, and `input/` so clarification and planning start from evidence.
---

# Scan Project

Inspect the smallest set of repo surfaces needed to answer:

- what kind of project this is
- which languages and toolchains are active
- how verification is expected to work
- where the relevant product and architecture docs live
- what constraints appear in `input/`

## Index build / refresh

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
