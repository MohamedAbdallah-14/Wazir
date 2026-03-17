# Vocabulary Blacklist

freshness_date: 2026-03-16

This module lists 61 words and phrases that statistically signal AI-generated text. Each entry includes the flagged item, why it signals AI, a suggested replacement, and domain exceptions where the word is legitimate.

The problem is overuse and clustering, not any single occurrence. One "robust" in a 2,000-word document is fine. Three in the same paragraph is a tell.

## Verbs (15)

| Word | Why it signals AI | Replacement | Domain exceptions |
|------|-------------------|-------------|-------------------|
| delve | Overrepresented in LLM output by 10-50x vs. human text | dig into, examine, explore | None |
| embark | Artificially formal for most contexts | start, begin | Historical or travel writing |
| leverage | Corporate jargon amplified by training data | use, apply, build on | Finance (leveraged buyout) |
| harness | Metaphor used as filler | use, apply, capture | Energy (harness solar power) |
| bolster | Vague intensifier | strengthen, support, back | None |
| foster | Overused in policy-adjacent text | encourage, build, grow | Childcare (foster care) |
| facilitate | Bureaucratic padding | help, enable, run | Meeting facilitation (process term) |
| navigate | Metaphor masking lack of specifics | handle, work through, manage | Actual navigation (maps, UI) |
| underscore | Artificially emphatic | highlight, stress, show | None |
| showcase | Promotional register | show, demonstrate, display | Trade show / portfolio context |
| streamline | Vague process claim | simplify, speed up, cut steps from | None |
| utilize | Longer synonym of "use" with no added meaning | use | None |
| commence | Artificially formal | start, begin | Legal proceedings |
| endeavor | Archaic formality | try, attempt, work toward | None |
| operationalize | Jargon padding | implement, put into practice, run | None |

## Adjectives (16)

| Word | Why it signals AI | Replacement | Domain exceptions |
|------|-------------------|-------------|-------------------|
| robust | Most overrepresented adjective in LLM output | strong, reliable, thorough | Statistics (robust estimator), engineering (robust to failure) |
| comprehensive | Padding that avoids specifics | complete, full, covering X and Y | None -- name what it covers instead |
| multifaceted | Vague complexity claim | complex, with several parts | None |
| nuanced | Used to avoid stating the actual nuance | specific, subtle, [state the nuance] | None |
| holistic | Buzzword without content | whole-system, end-to-end, covering all of | Medical (holistic medicine -- field term) |
| actionable | Business jargon amplified by LLMs | practical, something you can act on | None |
| groundbreaking | Superlative without evidence | new, first, original | None -- show evidence instead |
| revolutionary | Superlative without evidence | new, different, a departure from | Historical (French Revolutionary) |
| transformative | Superlative without evidence | significant, changed how X works | None -- describe the change instead |
| game-changing | Superlative without evidence | significant, shifts the approach | Sports commentary (literal use) |
| crucial | Overused intensifier | important, required, necessary for X | None |
| vital | Overused intensifier | important, necessary, required | Medical (vital signs -- field term) |
| seamless | Masks real integration complexity | smooth, without interruption, invisible to users | None |
| cutting-edge | Cliche superlative | latest, newest, current | None |
| state-of-the-art | Cliche superlative | current best, latest, leading | Academic papers (field convention) |
| innovative | Superlative without evidence | new, novel, different from X because Y | Patent filings (legal term) |

## Nouns (8)

| Word | Why it signals AI | Replacement | Domain exceptions |
|------|-------------------|-------------|-------------------|
| tapestry | Metaphor used for false depth | mix, combination, collection | Textile / art context |
| testament | Artificially weighty | evidence, proof, sign | Legal (last will and testament) |
| landscape | Metaphor masking lack of analysis | field, space, area, market | Geography, actual landscapes |
| paradigm | Academic jargon used as filler | model, approach, pattern | Philosophy of science (Kuhn) |
| synergy | Corporate jargon with no content | combined effect, working together | None |
| ecosystem | Metaphor used loosely | system, community, set of tools | Biology (actual ecosystems), established tech usage (e.g., "npm ecosystem") |
| framework | Vague when not naming a specific one | structure, approach, system | Software (React framework -- naming a specific one) |
| journey | Metaphorical padding | process, experience, path | Travel, customer journey mapping (UX term) |

## Phrases (14)

| Phrase | Why it signals AI | Replacement |
|--------|-------------------|-------------|
| in today's world | Boilerplate opener | [delete -- start with the topic] |
| in the realm of | Unnecessarily ornate | in, within, for |
| at the end of the day | Filler cliche | ultimately, in practice |
| it is worth noting | Hedging padding | [state the thing directly] |
| it is important to note | Hedging padding | [state the thing directly] |
| not only... but also | Parallel structure overused by LLMs | [state both points directly] |
| on one hand... on the other hand | Balanced-argument boilerplate | [state your position, then the counterpoint] |
| in conclusion | Summary boilerplate | [cut or compress] |
| to summarize | Summary boilerplate | [cut or compress] |
| in summary | Summary boilerplate | [cut or compress] |
| a testament to | Artificially weighty | shows, proves, demonstrates |
| in the fast-paced world of | Boilerplate opener | [delete -- start with the topic] |
| it goes without saying | If it goes without saying, do not say it | [delete] |
| needless to say | If it is needless, do not say it | [delete] |

## Banned Sentence Openers (8)

These words should not open a paragraph. They are acceptable mid-sentence or mid-paragraph.

| Opener | Why it signals AI | Replacement |
|--------|-------------------|-------------|
| Furthermore | Mechanical transition padding | [start with the next point directly] |
| Additionally | Mechanical transition padding | Also, [or just state the point] |
| Moreover | Mechanical transition padding | [start with the next point directly] |
| In conclusion | Summary boilerplate | [cut or compress] |
| Firstly | Artificially formal enumeration | First, [or restructure] |
| Secondly | Artificially formal enumeration | Second, [or restructure] |
| Lastly | Artificially formal enumeration | Finally, [or restructure] |
| In summary | Summary boilerplate | [cut or compress] |

## Decay and Review

AI vocabulary shifts with training data. Words that signal AI generation in 2025-2026 may become less distinctive as models improve, and new patterns will emerge.

- Review this blacklist annually
- Track which items are producing false positives in domain-specific contexts
- Add new items when patterns emerge in model outputs
- Remove items that no longer distinguish AI from human text
- The `freshness_date` header tracks when this list was last validated
