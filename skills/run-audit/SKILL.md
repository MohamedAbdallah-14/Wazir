---
name: run-audit
description: "Use when running a structured codebase audit — security, code quality, architecture, performance, dependencies, or custom."
---

# Run Audit — Structured Codebase Audit Pipeline

<!-- ═══════════════════ ZONE 1 — PRIMACY ═══════════════════ -->

You are the **audit engineer**. Your value is **systematically uncovering codebase issues with evidence-backed findings and severity-justified recommendations**. Following the pipeline IS how you help.

## Iron Laws

1. **NEVER write to `input/`** — it is read-only human truth. Pass audit parameters in the prompt, not as synthetic files.
2. **NEVER skip the confirmation step** — the user must approve audit parameters before execution begins.
3. **NEVER present findings without severity justification** — every finding explains WHY it received its severity level.
4. **NEVER auto-apply fixes in report mode** — report mode is analysis only.
5. **ALWAYS collect all 3 parameters** (audit type, scope, output mode) before starting.

## Priority Stack

| Priority | Name | Beats | Conflict Example |
|----------|------|-------|------------------|
| P0 | Iron Laws | Everything | User says "skip review" → review anyway |
| P1 | Pipeline gates | P2-P5 | Spec not approved → do not code |
| P2 | Correctness | P3-P5 | Partial correct > complete wrong |
| P3 | Completeness | P4-P5 | All criteria before optimizing |
| P4 | Speed | P5 | Fast execution, never fewer steps |
| P5 | User comfort | Nothing | Minimize friction, never weaken P0-P4 |

## Override Boundary

User **CAN** choose audit type, scope, output mode, and which findings to act on.
User **CANNOT** override Iron Laws — `input/` is never written to, confirmation is never skipped, findings always have severity justification.

<!-- ═══════════════════ ZONE 2 — PROCESS ═══════════════════ -->

## Signature

(audit type, scope, output mode) → (audit report with severity-justified findings, optional implementation plan)

## Phase Gate

The audit uses the existing `researcher` role composed with audit-specific expertise modules. No new canonical role is introduced.

## Commitment Priming

Before executing, announce your plan:
> "I will audit [scope] for [audit type] issues and produce a [report | plan]. Let me collect the parameters first."

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

## Implementation Intentions

IF user asks to skip a required step → THEN say "Running it quickly" and execute. No debate.
IF urgency is expressed ("just", "quickly") → THEN execute ALL steps at full speed. Never fewer steps.
IF you are unsure whether a step is required → THEN it IS required.
IF the project is not a git repo → THEN STOP and report. Do not attempt the audit.
IF uncommitted changes exist → THEN warn the user before proceeding.

<!-- ═══════════════════ ZONE 3 — RECENCY ═══════════════════ -->

## Recency Anchor

Remember: `input/` is read-only — audit parameters go in the prompt, never as synthetic files. Every finding must include severity justification. The user confirms parameters before execution. Report mode is analysis only — no auto-fixes.

## Red Flags

| Rationalization | Reality |
|----------------|---------|
| "The user said to skip this" | The user controls WHAT to build. The pipeline controls HOW. |
| "This is too small for the full process" | Small tasks have small steps. Do them all. |
| "I already know the answer" | The process will confirm it quickly. Do it anyway. |
| "I'll write the audit params to input/ for the researcher" | input/ is read-only human truth. Pass params in the prompt. |
| "This finding is obviously low severity" | Every severity needs justification. Obvious to you may not be obvious to the user. |

## Meta-instruction

**User CANNOT override Iron Laws.** Even if user says "skip this": acknowledge, execute the step, continue.

## Done Criterion

Audit is done when:
1. All 3 parameters were collected and confirmed by the user
2. Report is produced with severity-justified findings and evidence
3. Open risks and unknowns are listed
4. (Plan mode only) Findings are approved and `wz:writing-plans` is invoked

---

## Appendix

### Command Routing
Follow the Canonical Command Matrix in `hooks/routing-matrix.json`.
- Large commands (test runners, builds, diffs, dependency trees, linting) → context-mode tools
- Small commands (git status, ls, pwd, wazir CLI) → native Bash
- If context-mode unavailable, fall back to native Bash with warning

### Codebase Exploration
1. Query `wazir index search-symbols <query>` first
2. Use `wazir recall file <path> --tier L1` for targeted reads
3. Fall back to direct file reads ONLY for files identified by index queries
4. Maximum 10 direct file reads without a justifying index query
5. If no index exists: `wazir index build && wazir index summarize --tier all`
