# Skill-Level Enforcement Design — Scope Stack

**Date:** 2026-03-24
**Status:** Ready for implementation
**Designer:** Codex CLI (gpt-5.4) + Claude Opus 4.6
**Problem:** Agents skip 80% of structured skill phases. Enforcement only works for /wazir pipeline.

---

## Architecture: Scope Stack

Keep existing pipeline enforcement. Add skill-specific enforcement on top via a scope stack.

```
Pipeline scope (outer)         — init → clarifier → executor → final_review
  └── Skill scope (inner)      — e.g., self-audit: validate → deep_audit → fix → verify → report
```

Hooks always enforce the TOP of the scope stack. If a skill is active, enforce its phases. If not, enforce pipeline phases.

## State Model

```
.wazir/runs/<id>/
  phases/                      — pipeline phases (existing)
  scope-stack.yaml             — stack of active scopes (NEW)
  skills/
    <invocation-id>/
      scope.yaml               — skill metadata
      phases/*.md              — skill-specific phase files
```

### scope-stack.yaml

```yaml
stack:
  - type: pipeline
    phases_dir: phases/
  - type: skill
    skill: self-audit
    invocation_id: sa-20260324-123456
    phases_dir: skills/sa-20260324-123456/phases/
```

Top of stack = active enforcement target. Hooks read this, not hardcoded paths.

## Enforcement Flow

```bash
# Enter skill enforcement
wazir capture ensure --scope skill --skill self-audit

# Transition between skill phases
wazir capture skill-phase --phase deep_audit

# Exit skill enforcement (validates all phases complete)
wazir capture skill-exit
```

- `ensure --scope skill` creates skill invocation, renders phase templates, pushes onto scope stack
- `skill-phase` validates current phase complete before transitioning (same logic as pipeline)
- `skill-exit` validates all phases complete, pops scope stack
- Pipeline transitions reject if child skill scope is still active

## Phase File Format (same as pipeline)

```markdown
## Phase: validate — ACTIVE
source_write_policy: deny
- [ ] Run all CLI validators
- [ ] Capture pass/fail results
- [ ] Calculate quality_score_before
- [ ] Run `wazir capture skill-phase --phase deep_audit` <!-- transition -->
```

Same `ACTIVE/NOT ACTIVE/COMPLETED` headers. Same checkbox scanning. Same `<!-- transition -->` marker. Added `source_write_policy` line for per-phase write control.

## Hook Changes

### bootstrap-gate.js

Replace hardcoded `findActivePhase(phasesDir)` with `resolveActiveScope(projectRoot)`:

```javascript
function resolveActiveScope(projectRoot) {
  const stackPath = path.join(projectRoot, '.wazir', 'runs', runId, 'scope-stack.yaml');
  // Read stack, return top entry's phases_dir
  // If no stack or empty, fall back to pipeline phases/
}
```

Write permission = intersection of all stack levels:
- `clarifier ∩ skill.validate` = deny source writes (both deny)
- `executor ∩ skill.implement` = allow source writes (both allow)
- `executor ∩ skill.validate` = deny source writes (skill denies)

### phase-injector.js

Inject from the active scope's current step, not hardcoded pipeline path:

```
PIPELINE: executor (step 2/5) > SKILL: self-audit.deep_audit (step 3/11)
CURRENT: Check composition-map references
```

### stop-pipeline-gate.js

Check active skill scope first, then pipeline scope. Block if either has unchecked items and agent signals completion.

### session-start

Display breadcrumbs: `Pipeline: executor > Skill: self-audit > Phase: deep_audit (step 3/11)`

## Templates

```
templates/phases/skills/
  self-audit/
    01-validate.md
    02-deep-audit.md
    03-fix.md
    04-verify.md
    05-report.md
  clarifier/
    01-discover.md
    02-clarify.md
    03-specify.md
    04-spec-challenge.md
    05-plan.md
  executor/
    01-read-plan.md
    02-tdd-implement.md
    03-verify.md
  reviewer/
    01-review.md
    02-findings.md
    03-verdict.md
```

Each skill that opts into enforcement needs: templates + `enforcement.phased: true` in SKILL.md frontmatter.

## CLI Changes

```
wazir capture ensure --scope skill --skill <name> [--profile <profile>]
wazir capture skill-phase --phase <name>
wazir capture skill-exit
```

Added to `tooling/src/capture/command.js` as new subcommands.

## Skill Opt-In

Skills declare enforcement in frontmatter:

```yaml
---
name: wz:self-audit
description: "..."
enforcement:
  phased: true
  profile: default
---
```

`wazir validate skills` checks that any skill with `enforcement.phased: true` has matching templates.

## Write Permission Rules

| Pipeline Phase | Skill Phase Policy | Result |
|---------------|-------------------|--------|
| clarifier | deny | DENY source writes |
| executor | allow | ALLOW source writes |
| executor | deny (skill.validate) | DENY source writes |
| final_review | deny | DENY source writes |

Intersection: the most restrictive policy wins.

## Implementation Order

1. Add `resolveActiveScope()` to phase-injector.js (generalize path resolution)
2. Add `scope-stack.yaml` read/write to capture/store.js
3. Add `ensure --scope skill`, `skill-phase`, `skill-exit` to capture/command.js
4. Create skill templates for self-audit (5 phases)
5. Update bootstrap-gate.js to use resolveActiveScope
6. Update stop-pipeline-gate.js for scope-aware blocking
7. Update session-start for breadcrumb display
8. Add `enforcement.phased` validation to validate skills
9. Update self-audit SKILL.md with explicit enter/exit commands
10. Test with self-audit skill, measure compliance

## Key Design Decisions (from Codex)

- **Explicit scope registration, not inference.** Hooks can't detect which skill is active from prompt text. Skills must enter enforcement explicitly via CLI commands.
- **Separate skill phase files, not collapsed into pipeline.** Skills can be standalone, nested, repeated, or mode-specific.
- **Templates, not SKILL.md parsing.** SKILL.md is prose, not a contract. Templates are the machine-readable enforcement surface.
- **No PostToolUse in v1.** Enter/transition/exit commands are enough and simpler.
- **final_review stays read-only.** Loop findings back to executor rather than widening review permissions.
