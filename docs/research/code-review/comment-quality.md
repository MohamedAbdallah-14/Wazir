# Review Comment Quality Research

> What makes code review feedback useful, actionable, and constructive?
> Surveyed: 2026-03-25 | Sources: 14

---

## Source 1: Bosu, Greiler & Bird — "Characteristics of Useful Code Reviews: An Empirical Study at Microsoft" (MSR 2015)

**URL:** https://www.microsoft.com/en-us/research/publication/characteristics-of-useful-code-reviews-an-empirical-study-at-microsoft/

- Three-stage mixed-methods study across 1.5 million review comments from five Microsoft projects
- Defined "useful" as comments that led the author to make code changes or explicitly acknowledge the reviewer's identified issue
- The proportion of useful comments made by a reviewer increases dramatically in the first year at the organization, then plateaus — experience matters but has diminishing returns
- The more files in a change, the lower the proportion of useful comments — large diffs dilute review quality
- Most important predictive factor: "ChangeTrigger" (whether the comment targets a line that was actually changed), followed by comment status
- Built a Decision Tree Classifier that distinguishes useful vs. not-useful with ~66% accuracy
- Features used for prediction fall into three categories: textual/comment-content features, developer experience features, and review activity features
- Key recommendation: help developers articulate review comments better and assist reviewer program comprehension during review

## Source 2: Google Engineering Practices — "How to Write Code Review Comments"

**URL:** https://google.github.io/eng-practices/review/reviewer/comments.html

- **Summary principles:** Be kind. Explain your reasoning. Balance explicit direction with pointing out problems and letting the developer decide. Encourage simplification over explanation.
- **Courtesy:** Always comment on the code, never on the developer. Bad: "Why did you use threads here when there's obviously no benefit?" Good: "The concurrency model here is adding complexity without any performance benefit that I can see."
- **Explain why:** Include your intent, the best practice you're following, or how your suggestion improves code health — the "why" transforms a demand into a learning opportunity
- **Give guidance, not solutions:** The developer's job is to fix the CL, not the reviewer's. Point out problems and let the developer decide. But sometimes direct suggestions or code snippets are more helpful — balance based on context.
- **Reinforce good work:** "People learn from reinforcement of what they are doing well." Comment on things you like: cleaned-up algorithms, exemplary test coverage, something you learned from the CL. Include why you liked it.
- **Label comment severity explicitly:**
  - `Nit:` — minor thing, technically should be done but won't hugely impact things
  - `Optional (or Consider):` — may be a good idea but not strictly required
  - `FYI:` — not expected in this CL, but interesting for the future
- Without labels, authors interpret all comments as mandatory, creating unnecessary friction

## Source 3: Conventional Comments Standard

**URL:** https://conventionalcomments.org/

- A machine-parseable standard for formatting review feedback using structured labels
- **Format:** `<label> [decorations]: <subject> \n\n [discussion]`
- **Core labels:**
  - `praise` — highlight something positive (a deck is not all negatives)
  - `nitpick` — trivial, preference-based; author free to ignore
  - `suggestion` — propose an improvement; say how, not just what
  - `issue` — highlight a problem that needs addressing
  - `question` — seek clarification without implying wrongness
  - `thought` — share an idea sparked by reading, not a direct request
  - `chore` — necessary but unexciting housekeeping task
  - `note` — informational, no action required
  - `typo` — a specific textual error
- **Decorations:** `(blocking)`, `(non-blocking)`, `(if-minor)` — makes urgency explicit
- Unlabeled comments like "This is not worded correctly" are ambiguous and often feel hostile. Adding `suggestion:` changes the tone entirely and prompts the reviewer to be more actionable ("Can we change this to match the wording of the marketing page?")
- Labels are also parseable by machines, enabling automated triage and metrics

## Source 4: Dr. Michaela Greiler — "How to Give Respectful and Constructive Code Review Feedback"

**URL:** https://www.michaelagreiler.com/respectful-constructive-code-review-feedback/

- 10 actionable tips grounded in her code review workshop experience and research at Microsoft:
  1. **Ask questions instead of demanding changes** — opens dialogue, less confrontational, allows both sides to be wrong. "What do you think about calling this variable 'userId'?" vs. "This variable should be called 'userId'."
  2. **Use I-messages** — signals opinion, not universal truth. "I find this hard to follow" vs. "This is hard to follow."
  3. **Explain the reason behind your feedback** — without "why," comments feel like arbitrary commands
  4. **Offer a way to fix the issue** — don't just point out problems, propose solutions
  5. **No condescending words** — remove "just", "easy", "only", "obvious" from reviews. "Why didn't you just write the CSS in a separate file?" sounds condescending; dropping "just" significantly changes the tone.
  6. **Talk about the code, not the person** — never "you did X wrong," always "this code does X"
  7. **Give positive feedback** — acknowledge good solutions, not just problems
  8. **Don't use sarcasm or emoji-only responses** — text lacks body language cues; people default to negative interpretation
  9. **Accept that there are multiple correct solutions** — preference != correctness
  10. **Remember code review is a dialogue** — not a one-way inspection

- Research shows people interpret written language negatively by default when cues like tone and facial expression are absent — extra care in wording is not optional, it's compensating for the medium

## Source 5: Gergely Orosz — "Good Code Reviews, Better Code Reviews" (The Pragmatic Engineer)

**URL:** https://blog.pragmaticengineer.com/good-code-reviews-better-code-reviews/

- Distinguishes "good" from "better" across multiple dimensions:
- **Areas covered:**
  - Good reviews: change itself, title/description clarity, correctness, test coverage, coding guides, obvious improvements (unclear names, commented-out code, untested code, unhandled edge cases)
  - Better reviews: also look at change in context of the larger system, check maintainability, question necessity, evaluate abstractions and architectural fit. Do a "contextual pass following an initial light pass."
- **Tone:**
  - Good: ask open-ended questions, offer alternatives, assume you might be missing something — ask for clarification before correction
  - Better: also empathetic. Acknowledge effort. Applaud nice solutions. All-round positive.
  - "Reviews with a harsh tone contribute to a feeling of a hostile environment with their micro-aggressions."
- **Review turnaround:**
  - Good: within a few hours on same business day
  - Better: reviewers unblock authors quickly, prioritize reviews
- **Nit-picks:**
  - Good: clearly label nit-picks so the author knows they're optional. Use automated linters for style.
  - Better: rarely have nit-picks because tooling handles style enforcement

## Source 6: Simon Tatham — "Code Review Antipatterns"

**URL:** https://www.chiark.greenend.org.uk/~sgtatham/quasiblog/code-review-antipatterns/

- Satirical but incisive catalog of review anti-patterns (written as "dark side" reviewer manual):
  1. **The Death of a Thousand Round Trips** — mention one nitpick per round; stop reading after the first issue. Force dozens of revision cycles for issues that could all be raised at once.
  2. **The Ransom Note** — make criticisms so vague the developer can't figure out what to fix. "This doesn't feel right" with no specifics.
  3. **The Double Team** — two reviewers give contradictory feedback. Author satisfies one, the other objects. Repeat.
  4. **The Guessing Game** — reviewer knows what they want but won't say it. Force the author to guess through multiple rounds.
  5. **The Priority Inversion** — nitpick minor style issues first, then after many rounds, drop a bombshell that the whole approach is wrong and needs fundamental redesign.
  6. **The Late-Breaking Design Review** — wait until code is written to raise concerns that should have been discussed at design time.
  7. **The Catch-22** — set requirements that are impossible to satisfy simultaneously.
  8. **The Flip Flop** — change your mind between review rounds about what you want.
- Key insight on authority: "light-side" reviewers improve code and skills; "dark-side" reviewers use review as a power tool to obstruct, delay, or discourage. The same mechanics serve both purposes — the difference is intent.
- Gatekeeping review (mandatory approval before merge) amplifies both: it ensures quality when reviewers are constructive, but enables obstruction when they're not.

## Source 7: Sandya Sankarram — "Unlearning Toxic Behaviors in a Code Review Culture"

**URL:** https://medium.com/@sandya.sankarram/unlearning-toxic-behaviors-in-a-code-review-culture-b7c295452a3c

- Based on a talk at AlterConf (2018) — widely cited in the code review culture discussion
- Toxic behaviors identified:
  - **Passing judgments disguised as questions** — "Why would you do it this way?" is not a genuine question
  - **Using "we" or "you" when meaning "I"** — "We don't do it that way here" weaponizes consensus
  - **Giving feedback on the person, not the code** — "You don't understand how this works" vs. "This function isn't handling the edge case"
  - **Nit-picking to assert dominance** — endless minor comments that block PRs without substantive improvement
  - **LGTM rubber-stamping** — the opposite toxic extreme: not reviewing at all, providing false safety
- Constructive alternatives:
  - Use "I" statements and own your perspective
  - Assume positive intent from the code author
  - Ask genuine questions when you don't understand
  - Offer actionable suggestions, not just criticism
  - Recognize that tone is part of the message, even in text

## Source 8: Gunawardena, Devine, Beaumont, Garden, Murphy-Hill & Blincoe — "Destructive Criticism in Software Code Review Impacts Inclusion" (CSCW 2022)

**URL:** https://dl.acm.org/doi/10.1145/3555183

- Surveyed 93 software practitioners (43 women, 43 men, 3 non-binary, 4 undisclosed) with hypothetical constructive vs. destructive code review scenarios
- **Destructive criticism** defined as feedback that is both nonspecific AND inconsiderate (vs. constructive: specific + considerate)
- **Prevalence:** 22% of respondents receive inconsiderate negative feedback at least yearly; 55% receive nonspecific negative feedback at least yearly. Most respondents report receiving more destructive criticism than they give — perception gap.
- **Gender differences:** Women and non-binary participants perceive destructive criticism as less appropriate than men do. Women are less motivated to continue working with the reviewer after destructive criticism.
- **Impact extends beyond the review:** Receiving inconsiderate feedback reduces confidence even when working on unrelated code with different people. Causes withdrawal, reduced motivation, decreased enthusiasm.
- **Team-level effects:** Destructive criticism decreases team unity, teamwork, and the ability to build strong systems together. Creates an unsafe environment where people don't ask for help.
- **Disagreement exists:** Some developers advocate for "direct" feedback that may appear harsh, arguing it's easier to parse and act on. The research shows this is a minority view that disproportionately harms underrepresented groups.

## Source 9: Palantir — "Code Review Best Practices"

**URL:** https://blog.palantir.com/code-review-best-practices-19e02780015f

- **Purpose test:** Every review should ask "Does this code accomplish the author's purpose?" — functions and classes should exist for a reason. When the reason isn't clear, the code needs rewriting or better comments.
- **Scope:** Changes should have a narrow, well-defined, self-contained scope. If a CR changes >5 files, took >1-2 days to write, or would take >20 minutes to review, split it.
- **What to look for (prioritized):**
  1. Design — does the change fit the rest of the codebase architecture?
  2. Functionality — does it do what the developer intended?
  3. Complexity — can it be understood quickly by future readers?
  4. Tests — correct, sensible, useful tests?
  5. Naming — clear, descriptive names?
  6. Comments — useful comments that explain "why," not "what"?
  7. Style — follows style guide? (automate this)
- **Review culture:** Only submit complete, self-reviewed, self-tested CRs. Reviewer and author are collaborators, not adversaries. The goal is a better codebase, not proving who's smarter.

## Source 10: Addy Osmani — "Effective Code Reviews"

**URL:** https://addyosmani.com/blog/code-reviews/

- Splits advice into Author and Reviewer roles:
- **Author tips:** Be your own first reviewer. Break work into small, focused chunks. Automate the mundane (linting, formatting). Be open to feedback — view it as growth. Communicate explicitly about changes you made in response to comments.
- **Reviewer tips:**
  - Understand the big picture before diving into line-by-line detail
  - Prioritize readability — code is read more often than written
  - Be specific and actionable — vague comments waste cycles
  - Focus on code, not the author
  - Acknowledge good work — "a well-conducted code review is an opportunity for both the author and reviewer to learn"
  - Balance thoroughness with timeliness — don't let reviews become bottlenecks
- **Key principle:** Code reviews serve as quality control AND knowledge transfer. Both purposes should be served, not just one.

## Source 11: AWS Well-Architected Framework — "Anti-patterns for Code Review"

**URL:** https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/anti-patterns-for-code-review.html

- Enterprise-grade anti-pattern catalog:
  - **Infrequent code reviews** — skipping reviews misses early error detection and knowledge sharing
  - **Excessive required reviewers** — too many reviewers create bottlenecks and delays. Define practical reviewer counts based on change complexity.
  - **Lack of automated feedback** — without linters and CI checks, human reviewers waste time on trivial issues instead of substantive logic
  - **Large batch reviews** — combining multiple unrelated changes into one review clutters the process and extends cycle time
  - **Unconstructive reviews** — "harsh or hostile tones or unhelpful or vague feedback create an environment leading to unconstructive reviews. These demoralize developers, prevent open dialogue, and impede development progress."
  - **Ignoring review feedback** — when author feedback is regularly ignored, trust erodes and review quality declines
- Mitigation: maintain constructive tone, provide actionable suggestions, use automated tools for consistency, keep PRs small and focused

## Source 12: Swarmia — "A Complete Guide to Code Reviews"

**URL:** https://www.swarmia.com/blog/a-complete-guide-to-code-reviews/

- **Four purposes of code review:** knowledge sharing, spreading ownership, unifying development practices, quality control
- On social dynamics: "We can't ignore social relationships when talking about peers giving feedback about each other's work. There are no silver bullets. It's hard work that requires each individual to be mindful."
- Code review as a feedback loop: works best when turnaround is fast (hours, not days), PRs are small (<15 min review time), and the team has shared agreements on what "good" means
- On nits vs. substance: when consistent style is important, use automatic linters. Reviewers should focus on what machines can't catch — design, logic, edge cases, maintainability.
- Reviews that sit for days without feedback are themselves a form of hostile behavior — the development process halts and contributor motivation drops

## Source 13: Graphite — "Code Review Comment Types"

**URL:** https://graphite.com/guides/code-review-comment-types

- Taxonomy of comment types:
  - **Blocking** — must be fixed before merge (bugs, security, missing requirements)
  - **Non-blocking / Nit** — style, formatting, minor improvements; can be merged without addressing
  - **FYI / Educational** — informational context for the author's learning; no action required
  - **Question** — seek understanding; may or may not require code changes
  - **Praise** — acknowledge good work to maintain morale and encourage patterns
- **Actionability checklist:** Does the comment explain what's wrong? Does it say why? Does it suggest a fix? If the answer to all three is yes, the comment is actionable.
- Emphasizes: "Code reviews should encourage a positive development culture. Always use a respectful tone and frame comments objectively, focusing on the code rather than the person writing it."

## Source 14: Stack Overflow Blog / Gergely Orosz — "How to Make Good Code Reviews Better"

**URL:** https://stackoverflow.blog/2019/09/30/how-to-make-good-code-reviews-better/

- Code reviews benefit projects in three ways: spot-checking for errors, cross-pollinating knowledge, and improving organizational tooling/automation
- Good reviews cover: correctness, test coverage, functionality, coding guides, obvious improvements (unclear names, commented-out code, untested code, unhandled edge cases). They note when too many changes are crammed into one review.
- Better reviews: also check maintainability, question necessity, evaluate abstractions and architectural fit. They do a contextual pass following an initial light pass. They adjust approach based on who's requesting and the situation.
- On tone: "Opinionated language can turn people defensive, sparking heated discussions. Professional and positive tone contributes to a more inclusive environment."
- Better reviews are empathetic: they know the author spent significant time and effort. They applaud nice solutions and are all-round positive.

---

## Synthesis

### What Makes a Review Comment Useful?

Based on the research, a useful review comment has these properties:

1. **Targets an actual change** — Comments on lines the author modified are far more likely to be useful than comments on unchanged code (Bosu et al., 2015). The reviewer engaged with what the author did, not what they didn't do.

2. **Is specific** — Vague comments ("this doesn't feel right," "needs work") are the most common form of destructive feedback. 55% of developers report receiving nonspecific negative feedback yearly (CSCW 2022). Specificity is the single most important differentiator.

3. **Explains why** — The "why" behind a comment transforms it from an arbitrary demand into a learning opportunity. Google, Greiler, Orosz, and Palantir all independently emphasize this as a top principle.

4. **Is labeled for severity** — Without explicit labels (blocking/nit/optional/FYI), authors interpret all comments as mandatory, creating unnecessary friction and wasted cycles. Conventional Comments and Google's eng-practices both formalize this.

5. **Suggests a fix** — Pointing out problems is minimum viable feedback. Suggesting solutions (even tentatively) makes comments actionable. The best reviewers balance "here's a problem" with "here's one way to fix it."

6. **Focuses on code, not the person** — Every source agrees: comment on the code, never on the developer. Use I-messages. This is not soft-skills decoration — it directly affects whether the feedback is processed or triggers defensiveness.

### Comment Type Priority (for automated review systems)

Based on the research, review findings should be prioritized in this order:

| Priority | Type | Description | Action Required |
|----------|------|-------------|-----------------|
| P0 | **Blocker** | Bugs, security flaws, data loss risks, missing requirements | Must fix before merge |
| P1 | **Issue** | Logic errors, unhandled edge cases, performance problems | Should fix before merge |
| P2 | **Suggestion** | Better abstractions, clearer names, improved test coverage | Discuss; author decides |
| P3 | **Question** | Seek understanding of intent, approach, or tradeoffs | Author responds; may trigger fix |
| P4 | **Nit / Nitpick** | Style, formatting, minor preferences | Optional; automate where possible |
| P5 | **Praise / Note** | Acknowledge good work, share FYI context | No fix needed; builds culture |

### Anti-patterns to Detect and Avoid

| Anti-pattern | Description | Source |
|-------------|-------------|--------|
| Vague criticism | "This needs work" with no specifics | Tatham (Ransom Note), CSCW 2022 |
| Priority inversion | Nitpick style first, drop architectural bombs last | Tatham |
| Death by round-trips | One issue per round, forcing dozens of revision cycles | Tatham |
| Condescending language | "Just," "easy," "only," "obvious" | Greiler |
| Person-directed comments | "You don't understand" instead of "This code doesn't handle..." | Greiler, Google, Sankarram |
| Rubber-stamp LGTM | Approve without reading — false safety | Sankarram, Orosz |
| Contradictory reviewers | Multiple reviewers give incompatible demands | Tatham (Double Team) |
| Delayed reviews | PRs sitting for days without feedback — silent hostility | Swarmia |
| Sarcasm / emoji-only | Text lacks tone cues; readers default to negative interpretation | Greiler, CSCW 2022 |
| Style-only reviews | All comments are formatting nits; no substance | Sankarram |

### The Constructive Feedback Formula

Synthesizing across all 14 sources, high-quality review comments follow this pattern:

```
[label] (severity): [specific observation about the code]

[Why this matters — the reasoning, best practice, or risk]

[Suggested fix or question to explore alternatives]
```

**Example — bad:**
> This is wrong.

**Example — good:**
> issue (blocking): `processPayment()` doesn't handle the case where `amount` is negative.
>
> Negative amounts could create refund-like transactions unintentionally. This has caused production incidents in similar payment code.
>
> Consider adding a guard: `if (amount <= 0) throw new InvalidAmountError(amount);`

### Social Dynamics: What the Research Shows

- **Psychological safety is prerequisite** — Teams with psychological safety produce higher-quality software (Springer, 2024). Code review is a primary mechanism that either builds or erodes this safety.
- **Destructive criticism has outsized impact** — It reduces confidence even on unrelated future work, decreases team unity, and disproportionately harms women and non-binary developers (CSCW 2022).
- **There is genuine disagreement** — Some developers prefer "direct" feedback that may feel harsh, arguing it's faster to parse. The research shows this preference is a minority view and that its costs (exclusion, attrition) outweigh its benefits.
- **Tone is substance, not decoration** — In written-only communication, tone IS the message. Extra care in phrasing is compensating for the medium's lack of body language and vocal cues. Research shows people default to negative interpretation of ambiguous written text.
- **Review is a dialogue, not an inspection** — The best reviews are collaborative: reviewer and author work together toward the best code. The worst reviews are hierarchical: reviewer judges, author defends.

### Implications for Automated Review Systems

For systems that generate review comments (like Wazir's review pipeline), the research implies:

1. **Always label severity** — Every comment must carry a label (blocker/issue/suggestion/nit/praise). Unlabeled comments are ambiguous and feel hostile.
2. **Always explain why** — The reasoning must accompany every finding. "What" without "why" is not actionable.
3. **Always suggest a fix** — Where possible, propose a concrete resolution, not just a problem statement.
4. **Prioritize substance over style** — Lead with blockers and issues. Nits should be last and clearly marked optional. Never bury critical findings under a pile of style comments.
5. **Include praise** — Automated systems that only report problems create a negative feedback loop. Acknowledging good patterns reinforces them.
6. **Be specific to the code** — Reference exact lines, functions, and variables. Generic advice ("improve error handling") is not actionable.
7. **Avoid condescending language** — Filter out "just," "simply," "obviously," "easy" from generated comments.
8. **Respect the author's time** — Batch all findings in one pass. Never drip-feed issues across multiple rounds.
