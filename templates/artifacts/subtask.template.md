---
artifact_type: subtask_spec
phase: plan
role: planner
run_id: <run-id>
loop: 1
status: draft
sources:
  - <approved-spec>
  - <approved-plan>
approval_status: required
template_ref: subtask-template
---

<!-- TEMPLATE GUIDANCE
This template defines the structure for individual subtask specs.
Sections are tagged: REQUIRED, IF-TYPE(<types>), or OPTIONAL.
Include a section if its tag matches. Drop it entirely if not — no empty sections.

Type values: backend-api, frontend-ui, infrastructure, data, integration

Key rules:
1. Decisions are ENCODED here, not delegated to the executor.
   BAD:  "Determine which endpoints need the academy role"
   GOOD: "Add academy role to all GET endpoints. Keep POST/PUT/DELETE admin-only."
2. ONE source of truth per fact. Don't repeat info across sections.
3. Acceptance criteria use WHEN/THEN/SHALL — behavioral and testable.
4. Reference shared artifacts (design tokens, API contracts) by path. Never inline.
5. No empty sections. If a section doesn't apply, remove it.
-->

# <Subtask Name>

## Frontmatter

```yaml
id: <TASK-ID>            # e.g., BE-3.1, FE-2.1, INFRA-1
name: <human-readable name>
type: <backend-api|frontend-ui|infrastructure|data|integration>
complexity: <S|M|L|XL>
layer: <int>              # 0 = no deps in graph, higher = deeper
dependencies: []          # task IDs this subtask depends on (must complete before this starts)
priority: <P0|P1|P2>
repo: <repo-name>         # omit if single-repo project
batch: <batch-id>         # parallel execution batch, omit if serial
```

---

<!-- REQUIRED -->
## What

<!-- 2-5 sentences. What this subtask does and why. Encode ALL decisions.
No "determine", "figure out", "decide whether" — those belong in the spec/design phase.
The executor implements; they don't make product decisions. -->

<What this subtask produces and why it matters. All decisions pre-made.>

---

<!-- REQUIRED -->
## Context

<!-- Why this work exists. Link to spec/design. Cite research precedent if any.
Keep it short — the executor needs orientation, not a history lesson. -->

- Spec: `<path-to-approved-spec>` — requirement <REQ-ID>
- Design: `<path-to-approved-design>` — decision <section/option>
- Depends on: `<task-id>` (<what it provides that this task needs>)
- Blocks: `<task-id>` (<what this task provides to downstream>)

---

<!-- REQUIRED -->
## Inputs

<!-- Files, APIs, schemas the executor needs to READ. Exact paths + what to extract.
Don't list files the executor will WRITE — those go in Expected Outputs. -->

- `<path/to/file>` — <what to extract from it>
- `<path/to/another>` — <specific section or export needed>

---

<!-- REQUIRED -->
## Expected Outputs

<!-- What "done" produces. Files created or modified, function signatures, API shapes.
Be precise enough that two executors would produce structurally identical results. -->

- New/modified: `<path/to/file>`
  - Exports: `<functionName(args) → returnType>`
  - <Key structural constraint>
- New/modified: `<path/to/test/file>`

---

<!-- REQUIRED -->
## Acceptance Criteria

<!-- WHEN/THEN/SHALL format ONLY. Behavioral and testable.
BAD:  "Verify academy role is included" (vague, no condition, no expected behavior)
GOOD: "WHEN an academy user calls GET /library THEN the response SHALL be 200 with library data"

Number them. Each criterion maps to at least one test. -->

1. WHEN <condition>, THEN <subject> SHALL <expected behavior>.
2. WHEN <condition>, THEN <subject> SHALL <expected behavior>.
3. WHEN <edge case>, THEN <subject> SHALL <expected behavior>.

---

<!-- REQUIRED -->
## Constraints

<!-- Scope fences — what the executor must NOT do.
These prevent scope creep and protect parallel work. Format as "Do NOT ..." bullets. -->

- Do NOT <action that would break scope>
- Do NOT <action that belongs to another subtask>
- Do NOT <action that violates architecture>
- Do NOT <introduce unnecessary complexity — state the specific limit>

---

<!-- REQUIRED -->
## Verification

<!-- Exact commands to prove the work is correct. Copy-pasteable.
The executor runs these BEFORE claiming done. Reviewers run them to verify. -->

```bash
# Run tests
<test command>
# Expected: all pass, exit code 0

# Lint check
<lint command>

# Smoke check
<quick manual verification command>
# Expected output: <what success looks like>
```

---

<!-- REQUIRED -->
## File Dependencies

<!-- Table: every file this subtask reads or writes.
READS = imports from, needs to exist.
WRITES = creates or modifies.
Conflict column flags overlap with other subtasks for merge planning. -->

| File | Relation | Conflict Risk |
|------|----------|---------------|
| `<path>` | READS | None — stable API |
| `<path>` | WRITES | None — new file |
| `<path>` | WRITES | Shared with <task-id> — coordinate merge |

---

<!-- IF-TYPE(backend-api) -->
## API Contract

<!-- Endpoint definitions this subtask implements or modifies.
If a shared API contract doc exists, reference it: `See <path> section <X>`.
Only inline the contract if no shared doc exists. -->

| Method | Endpoint | Auth | Roles | Request | Response | Status |
|--------|----------|------|-------|---------|----------|--------|
| GET | `/v1/<resource>` | JWT | admin, user | — | `{ data: [...] }` | 200 |
| POST | `/v1/<resource>` | JWT | admin | `{ name, ... }` | `{ id, ... }` | 201 |

---

<!-- IF-TYPE(backend-api, data) — MUST include when type matches, even if the
subtask makes no schema changes. In that case, write "No schema changes." -->
## Schema Changes

<!-- Fields added, modified, or removed. Index changes. Migration notes.
Reference the schema file path so the executor knows where to make changes.
If the subtask genuinely has no schema changes, state that explicitly. -->

- `<path/to/schema>`:
  - ADD `<field>`: `<type>`, default `<value>`, <index info>
  - MODIFY `<field>`: <what changes>
- Migration: <strategy — e.g., backward-compatible, requires data backfill>

---

<!-- IF-TYPE(backend-api, integration) -->
## Error Handling

<!-- Table: what can fail, what happens, what the caller sees.
Only list failure modes specific to THIS subtask, not general framework errors. -->

| Failure Point | Behavior | Caller Response |
|--------------|----------|-----------------|
| <resource> not found | Throw NotFoundException | 404 |
| Duplicate <resource> | Throw ConflictException | 409 |
| <external service> timeout | Retry once, then throw | 503 |

---

<!-- IF-TYPE(frontend-ui) -->
## Design Reference

<!-- Link to design files and shared tokens. NEVER inline pixel values, colors, or fonts.
Those belong in a shared design-tokens file referenced here.

BAD:  "Background: #FFFFFF, font: Inter 14px, padding: 32px"
GOOD: "See design-tokens.yaml for colors, typography, and spacing" -->

- Figma: `<figma-link-or-screenshot-path>`
- Design tokens: `<path/to/design-tokens.yaml>`
- Component hierarchy:
  ```
  <ParentWidget>
    ├── <ChildA> (purpose)
    ├── <ChildB> (purpose)
    └── <ChildC> (purpose, conditional)
  ```

### Responsive Behavior

<!-- Only breakpoints and structural changes. Reference breakpoint token names
from the design tokens file. Pixel values shown here are for human readability
only — implementation MUST use the token, not the raw value. -->

| Breakpoint | Token | Range | Structural Change |
|------------|-------|-------|-------------------|
| Desktop | `breakpoint.desktop` | > 1200px | <layout description> |
| Tablet | `breakpoint.tablet` | 768–1200px | <what collapses/changes> |
| Mobile | `breakpoint.mobile` | < 768px | <what hides/transforms> |

---

<!-- OPTIONAL — include when an AI agent executes this subtask -->
## Context Budget

<!-- What the executor should read, at what depth, and why.
Controls context window usage for AI executors. -->

| File | Access Level | Size Est. | Reason |
|------|-------------|-----------|--------|
| `<path>` | READ FULL | ~N lines | <why full read needed> |
| `<path>` | READ SECTION | lines X-Y | <what specific part> |
| `<path>` | KNOW EXISTS | — | <referenced but not read> |

---

<!-- OPTIONAL — include when an AI agent executes this subtask -->
## Expertise Declarations

<!-- Maps to expertise/composition-map.yaml for agent routing. -->

- **Model tier**: <standard|cheap|expensive> — <why>
- **Tools needed**: <file write, bash, browser, etc.>
- **Stack**: `<node|python|flutter|etc.>`
- **Concerns**: `<error-handling|testing|security|performance|etc.>`
- **Review focus**: `<api-design|data-model|ui-consistency|etc.>`

---

<!-- OPTIONAL — include when the approach is non-obvious -->
## Approach

<!-- TDD, specific algorithm, migration strategy.
Only include if the "how" matters and isn't obvious from the acceptance criteria. -->

<Brief approach description — e.g., "TDD — write failing tests first, then implement until green.">
