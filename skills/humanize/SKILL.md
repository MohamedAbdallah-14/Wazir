---
name: wz:humanize
description: Use when reviewing or editing any text artifact (specs, plans, code comments, commit messages, content, documentation) to detect and remove AI writing patterns. Runs a 4-phase pipeline -- Scan for AI vocabulary and structural patterns, Identify severity and domain, Rewrite problematic sections, Verify meaning preservation. Invoke on existing text that needs corrective humanization. For preventive humanization, the composition engine loads domain-specific rules automatically.
---
<!-- PIPELINE: Check .wazir/runs/latest/phases/ for your current phase. Complete all items before proceeding. -->

# Humanize

Remove AI writing patterns from text artifacts using a 4-phase corrective pipeline. This skill operates on text that has already been generated. For rules that prevent AI patterns during generation, the composition engine loads expertise modules from `expertise/humanize/` into role context automatically.

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

## Phase 1: Scan

Detect the domain and scan for AI patterns.

### Domain detection

Determine which domain rules apply:

1. **Code domain** -- if the text is a commit message, code comment, PR description, or CHANGELOG entry, load `expertise/humanize/domain-rules-code.md`
2. **Content domain** -- if the text is microcopy, glossary, notification template, i18n value, or seed content, load `expertise/humanize/domain-rules-content.md`
3. **Technical-docs domain** -- if the text is a spec, plan, architecture doc, API doc, review finding, or learning artifact, load `expertise/humanize/domain-rules-technical-docs.md`
4. **Default** -- if the domain is unclear, use technical-docs rules

### Pattern scan

1. Scan all prose text against `expertise/humanize/vocabulary-blacklist.md`. Record each match with its location and category.
2. Scan for structural patterns from `expertise/humanize/sentence-patterns.md`. Record pattern type and count per section.
3. Estimate sentence length distribution for prose sections. Calculate approximate CV (standard deviation / mean of sentence word counts).
4. Check paragraph openers against the banned openers list.

### What to skip

Do not scan or modify:
- Code blocks (fenced or indented)
- URLs and file paths
- Proper nouns, product names, and code identifiers
- YAML frontmatter, JSON, and other machine-readable formats
- Inline code (backtick-wrapped text)
- Quoted text (blockquotes reproducing someone else's words)

## Phase 2: Identify

Classify each finding by severity and group for rewriting.

### Severity classification

- **High** -- blacklisted vocabulary in a non-exception context, introduction/conclusion boilerplate, promotional language, generic superlatives. These are the strongest AI signals.
- **Medium** -- copula avoidance, em dash overuse, synonym cycling, excessive hedging, banned paragraph openers, vague attributions. These signal AI when clustered.
- **Low** -- rule of three, negative parallelisms, boldface overuse, title case, curly quotes, false ranges. These are minor tells.
- **Burstiness** -- CV below 0.4 in prose sections longer than 10 sentences. Address after vocabulary and structural fixes.

### Grouping

Group findings by section so rewrites can be done in context rather than word-by-word.

### When to stop early

If the scan finds fewer than 3 findings total and all are low severity, report "no changes needed" and skip Phases 3-4. Do not force rewrites on already-clean text.

<!-- PIPELINE: Check .wazir/runs/latest/phases/ for your current phase. Complete all items before proceeding. -->
## Phase 3: Rewrite

Apply fixes, starting with high-severity findings.

### Vocabulary replacement

Replace blacklisted words with suggested alternatives from `expertise/humanize/vocabulary-blacklist.md`. Check the domain exceptions column first -- if the word is legitimate in this context, keep it and note the exception.

### Structural fixes

- Remove or compress introduction and conclusion boilerplate
- Replace conjunctive phrase padding with direct transitions
- Convert copula avoidance ("serves as") to direct verbs ("is")
- Replace vague attributions with specific citations or cut them
- Break synonym cycling by picking the clearest term and repeating it

### Burstiness adjustment

After vocabulary and structural fixes:
- Check if prose sections now meet the CV > 0.4 target
- If not, split long uniform sentences or combine short choppy ones
- Place short sentences after complex ones for natural rhythm
- Do not mechanically alternate short-long -- vary the pattern

### Domain-specific voice

Apply the voice rules from the detected domain's rules file:
- Technical docs: imperative mood, name specifics, no metaphors
- Code: brevity, no idioms, format preservation
- Content: conversational tone, translatable phrasing, editorial standards baseline

### Fallback rules

- **Legitimate domain use of a blacklisted word:** Keep it. Note the exception in your output. "Robust" in a statistical context is precise, not an AI tell.
- **Precision vs. style conflict:** Preserve precision. If replacing a word would reduce technical accuracy, keep the original word.
- **Already-clean text:** Do not force rewrites. If a section passes the scan with no high or medium findings, leave it unchanged.
- **Format preservation:** Never modify conventional commit prefixes, YAML frontmatter, JSON structures, code blocks, or inline code. These formats have exact syntax requirements.

## Phase 4: Verify

Run the two-pass self-audit from `expertise/humanize/self-audit-checklist.md`.

### Pass 1: Pattern re-scan

Re-scan the rewritten text to confirm:
- All high-severity findings are resolved
- Medium-severity findings are resolved or documented as acceptable
- No new AI patterns were introduced during rewriting

### Pass 2: Meaning preservation

Re-read every changed sentence and confirm:
- The rewritten version conveys the same information
- No specific names, numbers, versions, or commands were lost
- Acceptance criteria remain testable (specs)
- Task descriptions remain actionable (plans)
- Structured formats are intact

### Output

Report:
- Number of findings before and after rewriting
- Summary of changes made, grouped by severity
- Any domain exceptions that were preserved
- Confirmation that meaning was preserved (Pass 2 result)

<!-- PIPELINE: Check .wazir/runs/latest/phases/ for your current phase. Complete all items before proceeding. -->