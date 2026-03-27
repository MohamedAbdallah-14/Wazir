---
name: wz:skill-research
description: Deep competitive analysis of Wazir skills against the ecosystem. Research only — never auto-applies changes.
---
You tend to skip pipeline steps when context gets long. Fight that habit right from the start. Check .wazir/runs/latest/phases/ right now and follow what it says. What does your checklist tell you to do first?

# Skill Research — Overnight Competitive Analysis

Deeply analyze Wazir skills against equivalent skills in other frameworks. Produces comparison reports with ratings and recommendations. **Research only — never modifies skill files.**

## Invocation

```
/wazir audit skills --all                    # Analyze all skills
/wazir audit skills --skill tdd,debugging    # Analyze specific skills
/wazir audit skills --skill executor --deep  # Deep analysis of one skill
```

## Command Routing
Follow the Canonical Command Matrix in `hooks/routing-matrix.json`.
- Large commands (test runners, builds, diffs, dependency trees, linting) → context-mode tools
- Small commands (git status, ls, pwd, wazir CLI) → native Bash
- If context-mode unavailable, fall back to native Bash with warning

## Isolation

This skill MUST run in an isolated git worktree:

1. Create worktree: `git worktree add .worktrees/skill-research-<date> -b skill-research-<date>`
2. All report files are written inside the worktree
3. Commits contain ONLY report files — never skill changes
4. On completion, present the branch for user review

## Per-Skill Research Process

For each skill being analyzed:

### Step 1: Read the Wazir Skill

Read the full `SKILL.md` for the skill being analyzed. Extract:
- Purpose and trigger conditions
- Enforcement mechanisms (hard gates, checks, rules)
- Anti-rationalization coverage (how does it prevent agents from skipping steps?)
- Token cost estimate (how many tokens does this skill add to context?)

### Step 2: Research Competitors

Fetch and analyze equivalent skills from:

1. **superpowers** — the primary competitor. Fetch the equivalent skill from GitHub.
2. **2-3 other frameworks** — depending on the skill type:
   - For TDD: cursor-rules TDD patterns, aider commit conventions
   - For debugging: rubber-duck debugging frameworks, systematic debugging methodologies
   - For planning: software architecture patterns, agile story mapping tools
   - For review: CodeRabbit, GitHub Copilot review, PR review best practices

Use `WebFetch` or context-mode `fetch_and_index` to retrieve competitor content.

### Step 3: Side-by-Side Comparison

Produce a comparison table:

```markdown
| Dimension | Wazir | superpowers | Competitor B | Competitor C |
|-----------|-------|-------------|-------------|-------------|
| Completeness | ... | ... | ... | ... |
| Enforcement | ... | ... | ... | ... |
| Token efficiency | ... | ... | ... | ... |
| Anti-rationalization | ... | ... | ... | ... |
```

For each dimension, note:
- **Wazir strengths** — what Wazir does better
- **Wazir weaknesses** — what competitors do better
- **Gaps** — things competitors have that Wazir lacks entirely

### Step 4: Rate

Rate each skill on 4 dimensions (1-5 scale):

1. **Completeness** (1-5) — Does the skill cover all necessary cases? Are there gaps in the workflow?
2. **Enforcement strength** (1-5) — How well does the skill prevent agents from skipping steps? Are there hard gates or just suggestions?
3. **Token efficiency** (1-5) — How concise is the skill? Could it achieve the same enforcement with fewer tokens?
4. **Anti-rationalization coverage** (1-5) — Does the skill include explicit anti-rationalization measures (red flag tables, iron laws, etc.)?

Each rating must include a 1-2 sentence justification.

### Step 5: Recommend

For each skill, produce specific, actionable recommendations:

- What to add (with reasoning from competitor analysis)
- What to remove (token bloat without enforcement value)
- What to restructure (better organization for the same content)
- Priority: high / medium / low

**Recommendations are NEVER auto-applied.** They go in the report for human review.

Be honest — have you been following the pipeline, or did you start freelancing halfway through? Go back to .wazir/runs/latest/phases/ and verify your progress. What step are you actually on?
## Output Format

Reports saved to `reports/skill-audit-<YYYY-MM-DD>/`:

```
reports/skill-audit-2026-03-20/
├── README.md              # Summary with aggregate ratings
├── skill-tdd.md           # Per-skill report
├── skill-debugging.md
├── skill-executor.md
└── ...
```

### Per-Skill Report Template

```markdown
# Skill Research: [skill name]

**Date:** YYYY-MM-DD
**Wazir version:** [commit hash]
**Competitors analyzed:** [list]

## Current State
[Summary of what the Wazir skill does, its enforcement mechanisms, and token cost]

## Competitor Analysis
[Side-by-side comparison table]

## Ratings

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Completeness | X/5 | ... |
| Enforcement | X/5 | ... |
| Token efficiency | X/5 | ... |
| Anti-rationalization | X/5 | ... |
| **Overall** | **X/20** | |

## Strengths
[What Wazir does well]

## Weaknesses
[What competitors do better]

## Recommendations
| # | Priority | Recommendation | Reasoning |
|---|----------|---------------|-----------|
| 1 | high | ... | Based on [competitor] analysis |
| 2 | medium | ... | ... |

## Sources
[URLs and references for all competitor content analyzed]
```

### Summary README Template

```markdown
# Skill Audit — YYYY-MM-DD

**Skills analyzed:** N
**Average score:** X/20

| Skill | Completeness | Enforcement | Efficiency | Anti-rational | Total |
|-------|-------------|-------------|------------|--------------|-------|
| tdd | 4 | 5 | 3 | 4 | 16/20 |
| debugging | 3 | 3 | 4 | 2 | 12/20 |
| ... | | | | | |

## Top Recommendations (cross-skill)
1. ...
2. ...
3. ...
```

## Completion

After all skills are analyzed:

1. Commit reports in the worktree: `feat(reports): skill audit YYYY-MM-DD`
2. Present the branch name and summary to the user
3. Do NOT merge — user reviews and decides what to implement
4. Do NOT modify any skill files — reports only

> **Skill research complete.**
>
> - Skills analyzed: [N]
> - Reports: `reports/skill-audit-<date>/` on branch `skill-research-<date>`
> - Average score: [X]/20
> - Top recommendations: [list top 3]
>
> **Next:** Review reports and decide which recommendations to implement.

You're about to say you're done. Are you really? Go back to .wazir/runs/latest/phases/ and check every item one more time. If something was skipped or half-done, now is the time to finish it. What was left incomplete?