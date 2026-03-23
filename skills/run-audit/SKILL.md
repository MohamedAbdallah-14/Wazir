---
name: run-audit
description: Run a structured audit on your codebase — security, code quality, architecture, performance, dependencies, or custom. Produces a report or actionable plan.
---
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->

# Run Audit — Structured Codebase Audit Pipeline

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

## Overview

This skill runs a structured audit on your codebase. It collects three parameters interactively (audit type, scope, output mode), then feeds them through the pipeline: Research → Audit → Report or Plan.

The audit uses the existing `researcher` role composed with audit-specific expertise modules. No new canonical role is introduced.

## Pre-Flight Checks

Before starting, verify:

1. **Git repository exists** — the project must be a git repo. If not, STOP and report.
2. **Git repository is clean or changes are committed** — warn the user if there are uncommitted changes that might affect audit accuracy.

## Step 1: Collect Audit Type

Present this prompt and wait for the user's response:

> **What would you like to audit?**
> 1. **Security** — vulnerabilities, secrets, OWASP, dependency risks
> 2. **Code Quality** — complexity, duplication, dead code, naming
> 3. **Architecture** — coupling, layering, design doc adherence
> 4. **Performance** — bottlenecks, memory, inefficient patterns
> 5. **Dependencies** — outdated, vulnerable, unused packages
> 6. **Custom** — describe your own audit focus
>
> Enter 1-6 (or type your own):

Map selection: `1` → `security`, `2` → `code-quality`, `3` → `architecture`, `4` → `performance`, `5` → `dependencies`, `6` → `custom`.

If `custom`: ask the user to describe what they want to audit. Save their description as `custom_description`.

## Step 2: Collect Scope

Present this prompt and wait for the user's response:

> **What scope should the audit cover?**
> 1. **Whole project** — scan the entire codebase
> 2. **Specific branch** — diff against base branch
> 3. **Specific paths/files** — audit only certain directories or files
>
> Enter 1-3:

Map selection: `1` → `whole-project`, `2` → `branch`, `3` → `paths`.

- If `branch`: ask "Which branch? And which base branch to diff against? (default: current main branch)" — save both.
- If `paths`: ask "Which paths? (comma-separated)" and save the path list.

## Step 3: Collect Output Mode

Present this prompt and wait for the user's response:

> **What output do you want?**
> 1. **Report** — structured audit findings (analysis only)
> 2. **Plan** — findings become an implementation plan with fix tasks
>
> Enter 1-2 (default: 1 — report):

Map selection: `1` → `report`, `2` → `plan`. Default to `report`.

## Step 4: Confirm and Start

Summarize the audit parameters and ask for confirmation:

> **Audit Summary:**
> - **Type:** [audit_type]
> - **Scope:** [scope_detail]
> - **Output:** [output_mode]
>
> Proceed? (y/n)

## Step 5: Research + Audit Execution (Autonomous)

Compose a `researcher` agent with the audit-specific expertise modules from `expertise/composition-map.yaml` (see Concern Mapping below).

Provide the researcher with the audit parameters as context in its prompt (do NOT write a synthetic file to `input/` — that directory is read-only human truth).

The composed researcher will:
1. Receive the audit parameters in its prompt context
2. Scan the project (or scoped subset) for patterns relevant to the audit type
3. Systematically inspect all files within scope
4. Categorize findings by severity: **critical**, **high**, **medium**, **low**, **info**
5. For each finding, provide:
   - **Severity** — critical/high/medium/low/info
   - **Justification** — why this severity level was assigned
   - **Category** — specific concern (e.g., "SQL Injection", "Circular Dependency")
   - **Location** — file path and line number
   - **Evidence** — code snippet or pattern detected, with source citation
   - **Remediation** — how to fix it
<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->
6. Produce a summary: total findings, severity breakdown, top recommendations
7. List open risks and unknowns (per researcher contract)

## Step 6: Output

### Artifact Metadata

All audit output must include artifact metadata per `docs/artifact-model.md`:

```yaml
phase: discover
role: researcher
run_id: <generated UUID>
created_at: <ISO 8601>
sources: [<list of files/URLs inspected>]
status: complete
loop_number: 0
```

### Report Mode

Present the audit report directly to the user with this structure:

```markdown
# <Type> Audit Report — <date>

<!-- artifact: phase=discover role=researcher run_id=<uuid> created_at=<iso> status=complete loop_number=0 sources=[...] -->

## Summary
- **Scope:** <scope description>
- **Total findings:** N
- **Critical:** N | **High:** N | **Medium:** N | **Low:** N | **Info:** N

## Sources Inspected
- <list of files/directories/branches analyzed>

## Top Recommendations
1. ...
2. ...
3. ...

## Findings

### Critical

#### [C-001] <title>
- **Category:** <category>
- **Severity justification:** <why critical>
- **Location:** `<file>:<line>`
- **Evidence:** <code snippet with source citation>
- **Remediation:** <how to fix>

### High
...

### Medium
...

### Low
...

### Info
...

## Open Risks and Unknowns
- <anything the researcher could not verify or areas that need deeper investigation>
```

Announce: **"Audit complete. Report presented above."**

If the user wants to save the report, they can copy it or ask to save it to a location of their choice.

### Plan Mode

After the audit report is produced and presented:

1. **Present findings for approval.** Ask the user:
   > **The audit found N findings (X critical, Y high, Z medium...). Review the findings above.**
   > **Approve these findings as the basis for a fix plan? (y/n)**
   >
   > You can also ask to modify scope or exclude specific findings before approval.

2. Once the user approves, save the approved findings to `docs/plans/YYYY-MM-DD-audit-<type>-findings.md`
3. Group related findings into logical fix tasks within the findings doc
4. Invoke the `wz:writing-plans` skill. Since the approved findings doc exists in `docs/plans/`, `wz:writing-plans` will read it as the approved design and produce the implementation plan + offer execution choice (subagent-driven or autonomous execution)

This satisfies the `wz:writing-plans` contract: it requires an approved design from `docs/plans/` before proceeding. The user's explicit approval in step 1 serves as the approval gate.

## Concern Mapping

Audit type maps to `audit-*` concerns in `expertise/composition-map.yaml`, composed onto the `researcher` role:

| Audit Type | Composition Concern |
|-----------|--------------------|
| Security | `audit-security` |
| Code Quality | `audit-code-quality` |
| Architecture | `audit-architecture` |
| Performance | `audit-performance` |
| Dependencies | `audit-dependencies` |
| Custom | All `audit-*` concerns combined — researcher uses the full set and focuses based on the user's description |

Note: Only `audit-*` concerns have `researcher` entries in the composition map. Other existing concerns (e.g., `security-auth`, `architecture-patterns`) are keyed on `executor`/`verifier`/`reviewer` and will not be loaded for the researcher role by the composition engine.

<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->