# Directory Purpose

The `humanize` directory provides expertise for detecting and removing AI writing patterns from generated text. It covers vocabulary blacklists, structural pattern detection, burstiness enforcement, domain-specific writing rules, and a two-pass self-audit process. This domain applies to all text-producing roles across 6 phases (specify, plan, execute, author, review, learn).

# Key Concepts

- AI vocabulary detection and replacement (61-item blacklist with domain exceptions)
- Sentence length burstiness (CV > 0.4 target, 4-tier distribution)
- Structural pattern taxonomy (24 patterns across 4 categories)
- Domain-specific rule sets (technical docs, code artifacts, user-facing content)
- Two-pass self-audit (pattern detection then meaning preservation)

# File Map

- `index.md` -- semantic map of the humanize directory
- `vocabulary-blacklist.md` -- 61-item blacklist of AI vocabulary with replacements and domain exceptions
- `sentence-patterns.md` -- 24-pattern taxonomy with burstiness targets and before/after examples
- `domain-rules-technical-docs.md` -- rules for specs, plans, architecture docs, API docs
- `domain-rules-code.md` -- rules for commit messages, code comments, PR descriptions
- `domain-rules-content.md` -- rules for microcopy, glossary, notifications, seed content
- `self-audit-checklist.md` -- two-pass verification checklist (detect then preserve)

# Reading Guide

If scanning text for AI vocabulary -> read `vocabulary-blacklist.md`
If checking sentence structure and burstiness -> read `sentence-patterns.md`
If writing specs, plans, or architecture docs -> read `domain-rules-technical-docs.md`
If writing commit messages, code comments, or PR descriptions -> read `domain-rules-code.md`
If writing microcopy, glossary entries, or notifications -> read `domain-rules-content.md`
If running a post-generation quality check -> read `self-audit-checklist.md`

# Relationship to Other Domains

- **content** -- The `content` domain (`expertise/content/foundations/editorial-standards.md`) covers voice, tone, sentence case, and grammar baseline. This `humanize` domain is an additive layer that targets AI-specific patterns not addressed by editorial standards: vocabulary blacklists, structural pattern detection, burstiness enforcement, and the two-pass self-audit.
- **antipatterns** -- The `antipatterns/process/ai-coding-antipatterns.md` module captures AI-coding failure modes in code. This `humanize` domain extends that concept to all text artifacts, not just code.
