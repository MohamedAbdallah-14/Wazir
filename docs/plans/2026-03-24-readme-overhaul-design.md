# README Overhaul Design

**Date:** 2026-03-24
**Status:** Draft — awaiting approval
**Branch:** feat/readme-overhaul (to be created from main)

---

## Problem

The current README has strong technical content but buries it. The hero section communicates nothing to a first-time visitor in the first 8 seconds. The tagline uses an untranslated Arabic word. There is no visual showing the product. The personal narrative blocks the value proposition. Three medium-severity AI writing patterns are detectable.

## Decision: Approach B — Full Rewrite

Full restructure with Excalidraw hero image, simulated console output, humanize pass, and new "How is this different" section.

---

## Section-by-Section Design

### 1. Hero Section

**Order:** Logo → tagline → blockquote → badges → Excalidraw image

**Tagline (replaces "Engineering with itqan."):**
```
An engineering department inside Claude, Codex, Gemini, and Cursor.
```

**Blockquote (moved up from below HR):**
```
AI agents don't have a quality problem. They have a management problem.
```

**Badge row 1 — social proof + status:**
- GitHub stars (NEW)
- CI status (keep)
- npm version (keep)
- npm downloads (NEW)
- License MIT (keep)
- PRs Welcome (keep)

**Badge row 2 — platforms (keep, add "Works with:" label):**
- Claude, Codex, Gemini, Cursor

**Remove:** codecov badge from hero (81% is fine but belongs in CONTRIBUTING.md, not the hero — it's a contributor signal, not a visitor signal). Node.js badge removed (implementation detail).

**Excalidraw before/after image:** See §Excalidraw Prompt below.

### 2. Description (2 paragraphs)

Move the current good copy up, directly after the hero image. Condense to 2 short paragraphs:

```
Wazir runs a 15-workflow pipeline with 10 role contracts, 3 adversarial review gates,
and 315 expertise modules loaded per-task from 12 domains. The author never reviews
their own work. Ambiguity surfaces before implementation starts. Completion requires
passing verification, not declaring it.

No wrapper, no server, no API key. Structure loaded directly into your agent's session.
```

**Humanize note:** The original has 4 instances of "X, not Y" parallelism. This rewrite keeps 1 ("not declaring it") and replaces the other 3 with direct statements. The em dash in "No wrapper, no server, no API key" becomes commas.

### 3. Quick Start

**Structure:** Platform prerequisite note → install (plugin + npm/brew) → first command → simulated console output → depth variants

**Simulated console output (new):**
```console
$ /wazir Build a REST API for task management with authentication

[clarify] What authentication method? (JWT, session, OAuth)
[clarify] Should tasks support assignees or just a single owner?
[clarify] Do you need soft deletes?

> Operator answers...

[specify]    Writing spec... done (47 acceptance criteria)
[spec-gate]  APPROVAL REQUIRED — review spec before continuing
> approved

[plan]       Breaking into 6 implementation tasks...
[plan-gate]  APPROVAL REQUIRED — review plan before continuing
> approved

[execute]    Task 1/6: auth middleware... tests passing (8/8)
[execute]    Task 2/6: user model + migration... tests passing (12/12)
...
[verify]     All 43 tests passing. 0 lint errors.
[review]     Adversarial review: 2 findings, both resolved.
[learn]      3 learnings captured for next session.

Pipeline complete. 3/3 gates passed.
```

**Depth variants:**
```
/wazir quick fix the login redirect bug       — skip spec, straight to implementation
/wazir deep design a new onboarding flow      — full pipeline, extended design phase
/wazir audit security                          — dedicated audit workflow
```

### 4. How Is Wazir Different From...

Three subsections, prose format (not table). Based on research showing prose differentiation works better than comparison tables when the category isn't obvious.

**...just using Claude/Codex/Gemini directly?**
Without Wazir, the agent decides when it's done and reviews its own code. Wazir enforces separation: a different role reviews every artifact, ambiguity must surface before implementation starts, and completion requires verification evidence. The discipline is structural — hooks and schemas enforce it, not instructions the agent can reason around.

**...CrewAI / AutoGen / LangGraph?**
Those build new agent applications from scratch. Wazir loads into the agent you already use. No infrastructure, no API key, no server. It shapes behavior inside Claude Code, Codex CLI, Gemini CLI, or Cursor — the tools you already run.

**...writing a thorough CLAUDE.md?**
Instructions can be ignored, reinterpreted, or forgotten mid-session. Role contracts, artifact handoffs, and approval gates are mechanical. The clarifier cannot skip to implementation. The executor cannot mark a task complete without passing tests. The reviewer cannot approve their own code. These constraints are enforced by hooks (exit 42 on violation), not by asking nicely.

**Humanize note:** Varies sentence length deliberately. Uses specific examples ("exit 42") instead of abstract claims. No "not only... but also" constructions.

### 5. The Pipeline (keep Mermaid diagram)

Keep the existing Mermaid diagram — it renders well on GitHub and communicates the workflow clearly. Add a one-line caption above it:

```
Every task flows through 15 workflows. Three are adversarial review gates (red) that block
progress until the reviewer explicitly approves.
```

Remove the `> **GATE** = ...` note below (redundant with the caption).

### 6. Token Savings — 96.8% Reduction Per Session (promoted)

**Section heading includes the stat.** Keep the tier table and usage report block. Add a one-line intro:

```
Wazir's tiered recall loads only what each role needs. Run `wazir capture usage`
after any session to see your numbers.
```

### 7. What's Included (condensed)

Current section has 9 bold paragraphs. Condense to a scannable bullet list:

- 10 role contracts with enforced inputs, outputs, and escalation rules
- 15-workflow pipeline with 3 adversarial review gates (9 hard approval points)
- 315 expertise modules across 12 domains, max 15 per dispatch
- 3-tier recall (L0/L1/direct) — 60-80% token reduction on exploration phases
- 8 hook contracts for protected paths, loop caps, and session observability
- 28 skills (`/wazir`, `/wazir audit`, TDD, verification, debugging, and more)
- Built-in text humanization with 61-item vocabulary blacklist and domain-specific rules
- Host exports for Claude, Codex, Gemini, and Cursor with SHA-256 drift detection
- Structured learning with scope-tagged promotion and per-task injection

Remove the prose explanations. Each bullet is self-contained. Link to reference docs at the bottom of the list.

### 8. Compared to Other Tools (keep, minor fix)

Keep the current comparison table. The competitors (Superpowers, Spec-Kit, Micro-Agent, Distill, Claude-Mem, OMC) are the correct category — tools that shape AI coding agent behavior. Do NOT swap in LangChain/CrewAI (wrong category).

**One change:** The "How is Wazir different from..." section (§4) handles the CrewAI/AutoGen question already. Add a brief intro line to this table section:

```
For a detailed comparison against the tools most visitors think of first, see
"How is Wazir different" above. The table below compares Wazir against tools
in the same category — AI coding workflow systems.
```

### 9. Project Status (table format)

Replace prose with table:

| Component | Status |
|---|---|
| 15-workflow pipeline | Stable |
| 10 role contracts | Stable |
| 315 expertise modules | Stable |
| Host exports (4 platforms) | Stable |
| Composition engine + tiered recall | Stable |
| CLI command surface | May change before 1.0 |
| Schema field names | May change before 1.0 |
| Hook contract signatures | May change before 1.0 |
| State directory structure | May change before 1.0 |

### 10. Why "Wazir"? (merged with personal narrative)

Move the etymology section as-is. Merge in the personal narrative:

```
I'm Mohamed Abdallah. I kept watching AI agents write confident code that broke
in production, skip tests, and forget what we agreed on yesterday. So I stopped
asking them to be better and built them an engineering department instead.

Wazir (وزير) — the vizier. The operational mastermind who ran empires while the
sultan held authority. In Arabic chess, the wazir became the queen: the most
powerful piece on the board.

The Arabic word itqan (إتقان) means mastery — doing something so well that
nothing remains to improve.
```

This makes the "Why" section the emotional payoff for readers who scrolled through the whole README.

### 11. Acknowledgments, Contributing, License

Keep as-is. No changes needed.

---

## Sections Removed

- **"How It Works" (3 concepts)** — the content is excellent but too detailed for a README. Move to `docs/concepts/architecture.md` (most of it already lives there). The key ideas (role isolation, artifact handoffs, composition engine) are covered in §2 Description and §7 What's Included.
- **Duplicate Install section** — consolidated into Quick Start.
- **Documentation tables** — move the "For users" / "For contributors" tables into a single line linking to `docs/README.md`.

---

## Humanize Pass Summary

| Finding | Location | Fix |
|---|---|---|
| 4x negative parallelism ("X, not Y") | Opening, principles, description | Keep 1, rewrite other 3 as direct statements |
| ~10 em dashes | Throughout | Replace 4-5 with commas or periods; keep dashes where they add genuine pause |
| Mechanical numbered-bold structure | "How It Works" | Section removed from README (moved to docs) |
| Borderline burstiness (CV 0.43) | Principles section | Section restructured; new prose sections target CV > 0.5 |

---

## Excalidraw Before/After Prompt

**For Claude Cowork / Excalidraw:**

```
Create a wide before/after comparison diagram for a GitHub README hero image.

LAYOUT:
- Split the image horizontally into two halves with a vertical divider
- Left side header: "Without Wazir" (red/warm tones)
- Right side header: "With Wazir" (teal/green tones matching the Wazir brand color #2DD4BF)
- White/light background version (for light GitHub theme)

LEFT SIDE (chaotic, no structure):
- Show an AI agent icon at the top
- 5 rows, each with a red X icon and text:
  1. "Reviews its own code" — with a circular arrow icon (self-review)
  2. "Skips clarification" — with a fast-forward icon
  3. "Declares 'done' without proof" — with a megaphone icon
  4. "Forgets context between sessions" — with a broken chain icon
  5. "No structure, no gates" — with scattered puzzle pieces
- Visual feel: slightly messy, hand-drawn style, red/orange accent colors

RIGHT SIDE (structured, disciplined):
- Show the Wazir logo or a shield icon at the top
- 5 rows, each with a green checkmark and text:
  1. "Separate reviewer catches blind spots" — with two distinct agent icons
  2. "Clarifier forces questions first" — with a question mark bubble
  3. "Verified by tests + adversarial review" — with a test tube + magnifying glass
  4. "Artifacts persist across sessions" — with a document chain icon
  5. "15 workflows, 3 approval gates" — with a pipeline/gate icon
- Visual feel: clean, organized, hand-drawn style, teal/green accent colors

STYLE:
- Excalidraw hand-drawn aesthetic (not corporate/polished)
- Large enough text to be readable at 700px width on GitHub
- Aspect ratio approximately 16:9
- Include subtle icons/illustrations next to each point
- The teal color (#2DD4BF) should be the dominant accent on the right side
- Use the Excalidraw default font (hand-written style)

Also create a DARK VERSION with:
- Dark background (#0D1117 — GitHub dark theme)
- White/light text
- Same layout and icons, adjusted for dark background contrast
```

---

## Implementation Order

1. Create feature branch from main
2. Generate Excalidraw images (user does this via Claude Cowork, provides the files)
3. Rewrite README.md following this design exactly
4. Run humanize Phase 3 (rewrite) during implementation
5. Run humanize Phase 4 (verify) after completion
6. Commit and prepare for review

---

## Rejected Alternatives

- **Option A tagline** ("Engineering discipline for AI coding agents") — too generic, could describe any linting plugin
- **Option E tagline** ("Engineering with itqan — mastery so complete...") — still leads with the untranslated word
- **Pipeline flow Excalidraw** — less emotional impact than before/after; Mermaid already covers the pipeline well
- **Swapping comparison table competitors to LangChain/CrewAI** — wrong category, would confuse visitors about what Wazir is
- **FAQ page** — premature for pre-1.0 with few users
- **TOC** — unnecessary at 314 lines with clear H2 sections
