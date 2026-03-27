# Review Fixes: Stale References + Structural Gaps

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all CodeRabbit + Codex findings from the clarify implementation alignment review.

**Architecture:** 4 tasks. Task 1 is a mechanical rename sweep. Tasks 2-3 are structural fixes. Task 4 is export sync. All Markdown edits.

**Tech Stack:** Markdown, YAML. Git.

---

### Task 1: Complete design-review rename sweep

**Files (13 canonical files):**
- `roles/reviewer.md:5`
- `roles/designer.md:38,40`
- `skills/clarifier/SKILL.md:362,366,402,406`
- `skills/wazir/SKILL.md:279,401,449`
- `skills/design/SKILL.md:69`
- `workflows/design.md:34`
- `docs/reference/review-loop-pattern.md:302,372`
- `docs/reference/roles-reference.md:30,31`
- `docs/concepts/roles-and-workflows.md:25`
- `docs/concepts/architecture.md:77`
- `docs/concepts/why-wazir.md:31`
- `templates/phases/clarifier.md:22-24`
- `expertise/composition-map.yaml:48`

**Rules for each replacement:**
- If the context is about Phase 5 DESIGN (architectural brainstorming, implementation approaches) → `architectural-design-review`
- If the context is about Phase 4a VISUAL DESIGN (pencil MCP, visual artifacts) → `visual-design-review`
- If the context is a generic list of all review modes → list both: `architectural-design-review, visual-design-review`
- If the context is a config key (`workflow_policy`) → keep `design-review` as the key name (it controls both modes), but add a comment noting it covers both
- If the context is the `workflows/design-review.md` filename → keep as-is (the file still exists and covers both modes)

**Specific edits:**

`roles/reviewer.md:5` — generic list → list both:
```
Old: research-review, clarification-review, spec-challenge, design-review, plan-review, task-review, and final review.
New: research-review, clarification-review, spec-challenge, architectural-design-review, visual-design-review, plan-review, task-review, and final review.
```

`roles/designer.md:38` — visual design context:
```
Old: emits design artifact for design-review loop
New: emits design artifact for visual-design-review loop
```

`roles/designer.md:40` — visual design context:
```
Old: survives the design-review loop owned by the reviewer role.
New: survives the visual-design-review loop owned by the reviewer role.
```

`skills/clarifier/SKILL.md:362` — architectural context:
```
Old: ## Sub-Workflow 4: Brainstorm (design + design-review workflows)
New: ## Sub-Workflow 4: Brainstorm (architectural design + architectural-design-review)
```

`skills/clarifier/SKILL.md:366` — architectural context:
```
Old: then run design-review on the approved choice.
New: then run architectural-design-review on the approved choice.
```

`skills/clarifier/SKILL.md:402` — architectural context:
```
Old: [N] design-review findings resolved
New: [N] architectural-design-review findings resolved
```

`skills/clarifier/SKILL.md:406` — architectural context:
```
Old: design-review adjustments made
New: architectural-design-review adjustments made
```

`skills/wazir/SKILL.md:279` — config key, add comment:
```
Old: design-review:  { enabled: true, loop_cap: 10 }
New: design-review:  { enabled: true, loop_cap: 10 }  # covers both architectural-design-review and visual-design-review
```

`skills/wazir/SKILL.md:401` — architectural context (diagram):
```
Old: ├── design ← design-review loop
New: ├── design ← architectural-design-review loop
```

`skills/wazir/SKILL.md:449` — architectural context:
```
Old: 5. **Brainstorm** (design + design-review workflows) — design approaches
New: 5. **Brainstorm** (architectural design + architectural-design-review) — design approaches
```

`skills/design/SKILL.md:69` — visual context:
```
Old: The design-review workflow should also be skipped.
New: The visual-design-review workflow should also be skipped.
```

`workflows/design.md:34` — visual context:
```
Old: explicit human approval required before design-review
New: explicit human approval required before visual-design-review
```

`docs/reference/review-loop-pattern.md:302` — reference to file (keep filename):
```
Old: Matches canonical `workflows/design-review.md`:
New: Matches canonical `workflows/design-review.md` (visual-design-review dimensions):
```

`docs/reference/review-loop-pattern.md:372` — config key, add comment:
```
Old: design-review:  { enabled: true, loop_cap: 10 }
New: design-review:  { enabled: true, loop_cap: 10 }  # covers architectural-design-review + visual-design-review
```

`docs/reference/roles-reference.md:30` — split into two rows:
```
Old: | `design-review` | `design` | Validate designs against spec, accessibility, visual consistency |
New: | `architectural-design-review` | `brainstorm` | Validate architectural design: feasibility, spec alignment, completeness, trade-offs, YAGNI, security/performance |
| `visual-design-review` | `design` | Validate visual designs: spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity |
```

`docs/reference/roles-reference.md:31` — update dependency:
```
Old: | `plan` | `design-review` | Create implementation plan |
New: | `plan` | `architectural-design-review` | Create implementation plan |
```

`docs/concepts/roles-and-workflows.md:25` — split:
```
Old: 7. **design-review** — validate designs against spec, accessibility, and visual consistency
New: 7. **architectural-design-review** — validate implementation approach: feasibility, spec alignment, completeness, trade-offs, YAGNI, security/performance
7a. **visual-design-review** — validate visual designs: spec coverage, design-spec consistency, accessibility, visual consistency, exported-code fidelity
```

`docs/concepts/architecture.md:77` — generic context:
```
Old: The `design-review` workflow validates designs against the spec before planning begins.
New: The design-review workflow (architectural-design-review and visual-design-review modes) validates designs against the spec before planning begins.
```

`docs/concepts/why-wazir.md:31` — generic list:
```
Old: spec-challenge, design-review, plan-review
New: spec-challenge, architectural-design-review, visual-design-review, plan-review
```

`templates/phases/clarifier.md:22-24` — config key (keep for mustache compatibility):
```
Old:
{{#workflow.design-review}}
- [ ] Run design-review loop
{{/workflow.design-review}}

New:
{{#workflow.design-review}}
- [ ] Run architectural-design-review loop
{{/workflow.design-review}}
```

`expertise/composition-map.yaml:48` — config key, add comment:
```
Old: design-review:
New: design-review:  # covers architectural-design-review + visual-design-review
```

**Verify:** `grep -rn "design-review" --include="*.md" --include="*.yaml" | grep -v architectural | grep -v visual | grep -v node_modules | grep -v docs/plans/ | grep -v CHANGELOG | grep -v .git/ | grep -v llms-full | grep -v .wazir/runs/ | grep -v input/ | grep -v README.md | grep -v one-session | grep -v readmes | grep -v decisions`

Expected: Only hits should be config keys (`design-review:`) and the `workflows/design-review.md` filename references — all with disambiguating comments.

**Commit:**
```
git commit -m "fix: complete design-review rename sweep across 13 canonical files

Replace stale design-review references with architectural-design-review
or visual-design-review depending on context. Config keys kept with
disambiguating comments for backward compatibility."
```

---

### Task 2: Structural fixes — clarifier skill

**Files:**
- `skills/clarifier/SKILL.md` (content-author delegation, reasoning dir, references mode)

**Edit 1: Add content-author delegation step**

Between the content-author ordering list (after "4. DESIGN (architectural brainstorming)") and before Sub-Workflow 3a, insert:

```
If `workflow_policy.author.enabled == true`:

> **Content-author workflow starting.** Producing: [list detected content types]. This runs autonomously with its own review loop — no approval needed.

Delegate to the author workflow (`workflows/author.md`). Wait for completion before proceeding to visual design or architectural design.
```

**Edit 2: Add reasoning/ to mkdir**

Find:
```
mkdir -p .wazir/runs/run-YYYYMMDD-HHMMSS/{sources,tasks,artifacts,reviews,clarified}
```

Replace with:
```
mkdir -p .wazir/runs/run-YYYYMMDD-HHMMSS/{sources,tasks,artifacts,reviews,clarified,reasoning}
```

**Edit 3: Add "design from references" downstream handling**

In the Visual Design Triage section, after the `workflow_policy.visual_design` config line, add:

```
**If option 3 (design from references) selected:** Save user-provided design references (Figma links, screenshots, sketches) to `.wazir/runs/latest/clarified/visual-design/references/`. These are passed as inputs to the specify and design phases. No visual design sub-phase runs — the pipeline works from the provided references directly.
```

**Commit:**
```
git commit -m "fix(clarifier): content-author delegation, reasoning dir, references mode

- Add explicit delegation to author workflow between spec review and visual design
- Add reasoning/ to mkdir bootstrap
- Add downstream handling for 'design from references' option"
```

---

### Task 3: Structural fixes — workflows + review-loop

**Files:**
- `workflows/design.md:25,30,48`
- `docs/reference/review-loop-pattern.md:319,392,441`

**Edit 1: Fix design.md flow — "proceed to planning" → "proceed to architectural design"**

Find:
```
- open-pencil MCP server is not available (proceed to planning with text-only design specs)
```

Replace with:
```
- open-pencil MCP server is not available (proceed to architectural design with text-only design specs)
```

**Edit 2: Fix design.md — exports optional, not mandatory**

Find:
```
- design artifact (`.fig` + exported code + tokens + screenshots)
```

Replace with:
```
- design artifact (`.fig` + tokens + screenshots, optionally exported code scaffolds as reference)
```

Find the failure condition about missing exports:
```
- missing exported code scaffolds or tokens
```

Replace with:
```
- missing design tokens
```

**Edit 3: Fix review-loop-pattern.md:319 — stale count comparison**

Find:
```
8. **Input Coverage** -- every distinct item in the original input maps to at least one task. If `tasks < input items`, HIGH finding listing missing items
```

Replace with:
```
8. **Input Coverage** -- every distinct item in the original input maps to at least one task. If any input item has no mapped task, HIGH finding listing unmapped items (item-level traceability, not count comparison)
```

**Edit 4: Fix review-loop-pattern.md:392 — author human approval gate**

Find:
```
- `author` has a human approval gate, not an iterative review loop.
```

Replace with:
```
- `author` runs autonomously with its own review loop — no human approval gate. Activated by content-author detection after spec review.
```

**Edit 5: Add original input to Codex prompt templates**

In `docs/reference/review-loop-pattern.md`, find the artifact review template:
```
cat <artifact_path> | codex exec -c model="$CODEX_MODEL" \
  "You are reviewing a [ARTIFACT_TYPE] for the Wazir engineering OS.
Focus on [DIMENSION]: [dimension description].
Rules: cite specific sections, be actionable, say CLEAN if no issues.
Do NOT load or invoke any skills. Do NOT read the codebase.
Review ONLY the content provided via stdin."
```

Replace with:
```
(cat <artifact_path>; echo "---ORIGINAL INPUT---"; cat .wazir/input/briefing.md) | codex exec -c model="$CODEX_MODEL" \
  "You are reviewing a [ARTIFACT_TYPE] for the Wazir engineering OS.
Focus on [DIMENSION]: [dimension description].
The content after ---ORIGINAL INPUT--- is the user's original briefing — check for input alignment.
Rules: cite specific sections, be actionable, say CLEAN if no issues.
Do NOT load or invoke any skills. Do NOT read the codebase.
Review ONLY the content provided via stdin."
```

**Commit:**
```
git commit -m "fix: design.md flow, scope gate, author gate, Codex templates

- design.md: proceed to architectural design (not planning), exports optional
- review-loop: item-level traceability in plan dims, author autonomous
- Codex templates: include original input for input-alignment checks"
```

---

### Task 4: Export sync

**Files:**
- `exports/hosts/claude/.claude/agents/reviewer.md` — sync from `roles/reviewer.md`
- `exports/hosts/claude/.claude/agents/designer.md` — sync from `roles/designer.md`
- `exports/hosts/claude/.claude/commands/plan-review.md` — sync from `workflows/plan-review.md`
- `exports/hosts/claude/.claude/commands/design.md` — sync from `workflows/design.md`

For each: read the canonical source, write to the export path.

**Commit:**
```
git commit -m "fix: sync exports with canonical sources

Regenerate exported agent/command files from updated canonical
roles/ and workflows/ sources."
```
