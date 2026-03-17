# Self-Audit Checklist

freshness_date: 2026-03-16

A two-pass verification process for text humanization. Run this checklist after producing any text artifact and before handing off to the next phase.

## When to Run

- After any text artifact is produced (spec, plan, code comments, content, review findings)
- Before handoff to the next pipeline phase
- When the `wz:humanize` skill is invoked on existing text
- During the review phase, as part of writing quality assessment

## Pass 1: Pattern Detection

Scan the text for AI patterns. This pass identifies problems.

### 1.1 Vocabulary scan
- [ ] Cross-reference text against `vocabulary-blacklist.md`
- [ ] Count blacklisted word occurrences per section
- [ ] Flag clusters (3+ blacklisted words in one paragraph)
- [ ] Note domain exceptions (words that are legitimate in this context)

### 1.2 Structural pattern scan
- [ ] Cross-reference text against `sentence-patterns.md`
- [ ] Check for introduction boilerplate (patterns 1, 6)
- [ ] Check for conclusion boilerplate (patterns 19, 24)
- [ ] Check for excessive conjunctive phrases (pattern 21)
- [ ] Check for promotional language (patterns 4, 22)
- [ ] Check for synonym cycling (pattern 11)

### 1.3 Burstiness check
- [ ] Estimate sentence length distribution across prose sections
- [ ] Compare against targets: 20% short, 50% medium, 25% long, 5% very long
- [ ] Check CV is above 0.4 (or note if the text is too short for burstiness to apply)
- [ ] Skip burstiness for code blocks, tables, lists, and short-form artifacts

### 1.4 Banned openers check
- [ ] Scan paragraph-opening words against the banned openers list
- [ ] Flag any paragraph starting with Furthermore, Additionally, Moreover, In conclusion, Firstly, Secondly, Lastly, In summary

### 1.5 Passive voice check
- [ ] Scan for passive constructions
- [ ] Flag sections with more than 30% passive voice (unless domain rules permit, e.g., scientific context)

## Pass 2: Meaning Preservation

Verify that fixes from Pass 1 did not break anything. This pass protects content.

### 2.1 Re-read every rewritten sentence
- [ ] Read each changed sentence in context (not in isolation)
- [ ] Confirm the rewritten version conveys the same information

### 2.2 Check technical precision
- [ ] Verify no specific names, numbers, versions, or commands were lost
- [ ] Verify acceptance criteria remain testable (for specs)
- [ ] Verify task descriptions remain actionable (for plans)
- [ ] Verify code references remain accurate (for review findings)

### 2.3 Check domain-appropriate tone
- [ ] Confirm the tone matches the domain rules file for this artifact type
- [ ] Technical docs: precise and imperative
- [ ] Code artifacts: brief and factual
- [ ] User-facing content: conversational and clear

### 2.4 Check format preservation
- [ ] Verify YAML frontmatter, JSON, and structured formats are untouched
- [ ] Verify conventional commit prefixes are untouched
- [ ] Verify code blocks and inline code are untouched
- [ ] Verify Markdown structure (headings, links, tables) is intact

## Severity Guide

When multiple issues are found, prioritize fixes in this order:

1. **High severity** -- blacklisted vocabulary clusters, introduction/conclusion boilerplate, promotional language, generic superlatives. Fix these first.
2. **Medium severity** -- copula avoidance, em dash overuse, synonym cycling, excessive hedging, banned openers. Fix these second.
3. **Low severity** -- rule of three, negative parallelisms, boldface overuse, title case, curly quotes. Fix these if time permits.
4. **Burstiness** -- adjust sentence lengths last, after vocabulary and structural fixes are in place. Vocabulary and structure changes often improve burstiness as a side effect.

## Exit Criteria

The audit is complete when:
- All high-severity findings are resolved
- Medium-severity findings are resolved or documented as acceptable
- No meaning was lost in rewrites (Pass 2 confirms)
- Structured formats are intact (Pass 2.4 confirms)
