# Code Review Best Practices -- Research Document

**Date:** 2026-03-25
**Scope:** Best practices for effective code review, drawn from industry leaders (Google, Microsoft, Meta), empirical research (SmartBear/Cisco, academic papers), engineering books, and practitioner blogs.
**Sources surveyed:** 15 primary sources across Google engineering practices, Microsoft Research, SmartBear/Cisco empirical data, Meta engineering blog, practitioner blogs (Stack Overflow, Swarmia, Pragmatic Engineer, Philipp Hauer, Dr. Michaela Greiler), and book references (Software Engineering at Google, Code Complete).

---

## Source 1: Google Engineering Practices -- What to Look for in a Code Review (https://google.github.io/eng-practices/review/reviewer/looking-for.html)

- **Design** is the most important thing to cover. Do the interactions of various pieces make sense? Does this change belong in the codebase or in a library? Does it integrate well with the rest of the system? Is now a good time to add this functionality?
- **Functionality:** Does the CL do what the developer intended? Think about edge cases, concurrency problems, and bugs visible just by reading the code. For user-facing changes, have the developer demo the functionality.
- **Complexity:** Check at every level -- individual lines, functions, classes. "Too complex" means "can't be understood quickly by code readers" or "developers are likely to introduce bugs when they try to call or modify this code." Be especially vigilant about **over-engineering**: encourage solving the problem that needs to be solved now, not speculative future problems.
- **Tests:** Code should have appropriate unit tests that are well-designed. Tests should fail when the code is broken and not produce false positives.
- **Naming:** A good name is long enough to communicate what something does without being so long it is hard to read.
- **Comments:** Should be clear and useful, mostly explaining *why* instead of *what*. If the code cannot be made clear enough on its own, it needs to be simpler.
- **Style:** Code should conform to the team's style guides. Prefix style-only suggestions with "Nit:" to signal they are optional.
- **Documentation:** If a CL changes how users build, test, interact with, or release code, documentation should be updated too.
- **Every line:** Review every line you have been asked to review. Look at the context. Make sure you are improving code health. Compliment developers on good things that they do.

**Google's summary checklist for every review:**
1. The code is well-designed
2. The functionality is good for users of the code
3. Any UI changes are sensible and look good
4. Any parallel programming is done safely
5. The code is not more complex than it needs to be
6. The developer is not implementing things they *might* need in the future but do not know they need now
7. Code has appropriate unit tests
8. Tests are well-designed
9. The developer used clear names for everything
10. Comments are clear and useful, and mostly explain *why* instead of *what*
11. Code is appropriately documented
12. The code conforms to style guides

---

## Source 2: Google Engineering Practices -- The Standard of Code Review (https://google.github.io/eng-practices/review/reviewer/standard.html)

- **Primary purpose:** Make sure the overall code health of the codebase is improving over time. All tools and processes of code review are designed to this end.
- **The senior principle:** Reviewers should favor approving a CL once it is in a state where it definitely improves the overall code health of the system, even if the CL is not perfect.
- **No such thing as "perfect" code -- only better code.** Reviewers should not require the author to polish every tiny piece before granting approval. Seek continuous improvement, not perfection.
- **Balance forward progress with quality.** If a reviewer makes it very difficult for any change to go in, developers become disincentivized to make improvements. Codebases degrade through small decreases in code health over time.
- **Use "Nit:" prefix** for points of polish the author could choose to ignore.
- **Mentoring:** Comments expressing something could be better are always fine, as long as they are not blocking approval unnecessarily.
- **Resolving conflicts:** If author and reviewer cannot agree, escalate to wider team discussion, bring in a tech lead, or request a code design review. Never let a CL sit around because the author and the reviewer cannot reach agreement.
- **Large CLs:** If a CL is so large you cannot review it promptly, ask the developer to split it into several smaller CLs that build on each other. If it cannot be broken up, at least write comments on the overall design and send it back for improvement. Always unblock the developer.

---

## Source 3: Software Engineering at Google -- Chapter 9: Code Review (https://abseil.io/resources/swe-book/html/ch09.html)

**Book:** *Software Engineering at Google: Lessons Learned from Programming Over Time* by Titus Winters, Tom Manshreck, Hyrum Wright (O'Reilly, 2020)

### Code Review Flow at Google
- Code reviews take place before a change can be committed (precommit review).
- A change needs "LGTM" (looks good to me) from at least one reviewer.
- Three roles can overlap in one person: (1) another engineer for correctness/comprehension, (2) code owner for appropriateness, (3) readability reviewer for style/best practices.
- Google expects code reviews to be completed within about 24 hours.
- Google processes approximately 35,000+ changes per day.

### Benefits of Code Review
- **Code correctness:** Catching bugs before they enter the codebase. The earlier a defect is discovered, the cheaper it is to fix. References Steve McConnell's *Code Complete* on inspection effectiveness.
- **Code comprehension:** At least two people understand every piece of code -- the author and the reviewer. Optimizing for the *reader*, not the writer.
- **Code consistency:** Ensuring codebase-wide consistency in style, naming, and patterns, which reduces cognitive load for all engineers.
- **Psychological benefits:** Validation that code works, knowledge that someone else will see the code (which improves quality of initial submission), and opportunity for professional feedback.
- **Knowledge sharing:** The single most important benefit according to the book. Reviewers learn the codebase; authors learn new techniques. Include FYIs and links to help people learn.

### Types of Code Reviews
- **Greenfield reviews / new features:** Focus on whether design is appropriate and whether tests cover new behaviors.
- **Behavioral changes, improvements, optimizations:** Is this change necessary? Does it improve the codebase? Deletions of dead code are among the best modifications.
- **Bug fixes and rollbacks:** Focus on whether the fix addresses the root cause and includes a test that would have caught the bug.
- **Refactorings and large-scale changes:** Should not change behavior; verify through existing tests. Large-scale changes often get automated review.

### Best Practices
- **Write small changes.** A code review should be easy to digest and focus on a single issue. Google discourages massive fully-formed-project CLs. Smaller changes make it far easier to determine the source of a bug.
- **Write good change descriptions.** The first line should describe *what* is being done. The body should describe *why* the change is being made and give the reviewer context.
- **Keep reviewers to a minimum.** Most changes at Google require only one LGTM. In practice, two reviewers is often the "sweet spot."
- **Automate where possible.** Use static analysis, linters, formatters, pre-commit hooks. Humans should focus on what machines cannot check.

### TL;DRs from the Book
- Code review has many benefits: correctness, comprehension, and consistency.
- Always check your assumptions through someone else; optimize for the reader.
- Provide the opportunity for critical feedback while remaining professional.
- Code review is important for knowledge sharing throughout an organization.
- Automation is critical for scaling the process.
- The code review itself provides a historical record.

---

## Source 4: Microsoft Research -- Characteristics of Useful Code Reviews (https://www.microsoft.com/en-us/research/publication/characteristics-of-useful-code-reviews-an-empirical-study-at-microsoft/)

**Additional URL:** https://www.microsoft.com/en-us/research/publication/code-reviews-do-not-find-bugs-how-the-current-code-review-best-practice-slows-us-down/

### Key Research Findings
- Microsoft analyzed **1.5 million review comments** from five Microsoft projects to uncover factors that affect usefulness of review feedback.
- The proportion of useful comments made by a reviewer **increases dramatically in the first year** at Microsoft, then tends to plateau.
- The **more files in a change, the lower** the proportion of comments that will be of value to the author.
- Approximately **one-third of code review comments are not useful** to the author.
- Useful comments increase when: the reviewer has codebase familiarity, the changeset is small, and the reviewer has been at the company longer (up to a plateau).
- Usefulness decreases with: larger changesets (more files = lower proportion of useful comments), reviewer cognitive strain.

### "Code Reviews Do Not Find Bugs"
- A Microsoft Research paper found that bug-finding is not the primary value of code reviews.
- Instead, the main benefits are knowledge transfer, increasing team awareness, and finding alternative solutions.
- The gap between expectations and outcomes is important: teams should calibrate what code review is actually good at.

### Expectations, Outcomes, and Challenges (Bacchelli & Bird, ICSE 2013)
- Developers **expect** code review to find defects, but the **actual** main outcomes are: improved code quality, knowledge transfer, increased team awareness, and creation of alternative solutions.
- Social aspects of code review cannot be ignored. Effective code reviews are performed by people with specific skills, and the interpersonal dynamics matter significantly.

---

## Source 5: Microsoft Engineering Fundamentals Playbook -- Reviewer Guidance (https://microsoft.github.io/code-with-engineering-playbook/code-reviews/process-guidance/reviewer-guidance/)

### Review Structure
- **Foster a Positive Code Review Culture:** What matters is a bug caught, not who made it, not who found it, not who fixed it. The only thing that matters is having the best possible product.
- **Be Considerate:** Empathy and respect are foundational.
- **First Design Pass:** Do the interactions of the various pieces of code make sense? Does the code recognize and incorporate architectures and coding patterns?
- **Code Quality Pass:** Check for correctness, readability, maintainability, test coverage, and style compliance.

### Key Principles
- The reviewer is a partner, not a gatekeeper.
- Separate design review from code quality review -- two distinct passes.
- Approve when the code improves the system, even if it is not how you would have written it.
- Provide evidence-based feedback where possible (link to documentation, style guides, or prior decisions).

---

## Source 6: Dr. Michaela Greiler -- 30 Code Review Best Practices from Microsoft (https://www.michaelagreiler.com/code-review-best-practices/)

### For Code Authors (15 practices)
1. **Read through your changes** before requesting review -- self-review catches obvious issues.
2. **Aim for small changes** -- smaller PRs are reviewed more thoroughly and more quickly.
3. **Cluster related changes** -- group logically related changes; do not mix refactoring with feature work.
4. **Provide a description** -- explain what changed and why.
5. **Run tests** before submitting for review.
6. **Automate code reviews** -- use linters and static analysis for mechanical checks.
7. **Skip code reviews** for trivial, low-risk changes (e.g., config changes) when the team agrees.
8. **Fewer reviewers** -- two is often optimal. More than three adds overhead without proportional benefit.
9. **Clarify expectations** -- tell reviewers what kind of feedback you need.
10. **Add experienced reviewers** for finding deeper issues.
11. **Add inexperienced reviewers** for knowledge transfer -- junior devs learn from senior code, and it disseminates codebase familiarity across the team.
12. **Notify the right people** -- stakeholders who should be aware of the change.
13. **Give a heads up** for large or complex changes -- pre-discuss before formal review.
14. **Be open to feedback** -- do not get defensive.
15. **Show gratitude** to reviewers -- feedback culture is a two-way street.

### For Code Reviewers (15 practices)
16. **Give respectful feedback** -- focus on the code, not the person.
17. **Talk in person** when written comments escalate or become confusing.
18. **Document decisions** made during review discussions.
19. **Explain your viewpoint** -- do not just say "change this," explain why.
20. **Make rejections exceptions** -- most changes should be approved with suggestions, not blocked.
21. **Do reviews daily** -- set dedicated time for code reviews (e.g., 11 AM to noon).
22. **No context-switching** -- batch reviews to avoid the 20+ minute recovery cost of interruptions.
23. **Give timely feedback** -- delays compound and block the author.
24. **Consider time zones** in distributed teams.
25. **Make it a team effort** -- distribute review load fairly.
26. **Review often** -- frequency improves quality more than review duration.
27. **Focus on core issues** -- do not nitpick every line.
28. **Start with test code** -- tests reveal intent and expected behavior.
29. **Use checklists** -- structured checklists improve consistency and reduce cognitive load.
30. **Fight bias** -- a Google study showed developers identifying as women get more pushback in code reviews. Race, gender, ethnicity, and age all influence review outcomes. Proactively take actions (such as reviews of reviews) to reduce bias, harassment, and prejudice.

### Empirical Data Points
- Reviewers are **3x more likely** to thoroughly review a 500-line PR compared to skimming a 2,000-line PR.
- Keep PRs below **200 lines changed** whenever possible.
- Keep reviews under **60 minutes** -- defect detection drops after this.
- **75% of defects** found in code reviews affect evolvability/maintainability, not functionality (ResearchGate study).
- At Google, over **70% of diffs** were committed in less than 24 hours after initial review.
- **One abrasive remark** can deter engineers from performing up to potential (ACM study).

---

## Source 7: Stack Overflow Blog -- How to Make Good Code Reviews Better (https://stackoverflow.blog/2019/09/30/how-to-make-good-code-reviews-better/)

**Author:** Gergely Orosz (then at Uber, previously at Microsoft/Skype and Skyscanner)

### Good vs. Better Code Reviews

**Areas covered:**
- *Good* reviews: Check correctness, test coverage, functionality changes, coding guides. Point out hard-to-understand code, unclear names, commented-out code, untested code, unhandled edge cases.
- *Better* reviews: Look at the change in the context of the larger system. Ask about necessity, impact on other parts, abstractions, and how they fit the existing architecture. Note maintainability observations: complex logic to simplify, improving test structure, removing duplications.

**Tone:**
- *Good* reviews: Professional, neutral, ask open-ended questions, offer alternatives without insisting.
- *Better* reviews: Empathetic. Know the author spent significant time and effort. Applaud nice solutions. All-round positive while still being candid. A harsh tone contributes to a hostile environment with microaggressions. Opinionated language turns people defensive.

**Approving vs. requesting changes:**
- *Good* reviews: Approve or request changes based on a clear standard.
- *Better* reviews: Differentiate between "must-fix" issues (blocking), "should-fix" suggestions (non-blocking), and "nits" (take-it-or-leave-it). This reduces back-and-forth.

**From code review to collaboration:**
- *Good* reviews: Quick turnaround, focus on the PR.
- *Better* reviews: Have pre-review discussions for complex changes. Pair program on tricky parts. The review becomes a conversation, not a gate.

**Organizational level:**
- Have a written code review guide the whole team agrees on.
- Calibrate review standards across the team -- inconsistent reviewers erode trust.
- Engineering managers should participate in reviews to stay connected with the codebase.
- A leader's role is to remove obstacles that block developers from doing their best work and to coach team members toward healthy collaborative patterns.

---

## Source 8: SmartBear -- Best Practices for Peer Code Review / Cisco Case Study (https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/)

**Study:** SmartBear/Cisco -- 10-month case study, 2,500 reviews, 3.2 million lines of code, 50 developers. The largest case study ever done on lightweight code review at the time (2006).

### 10 Best Practices (data-driven)
1. **Review fewer than 400 LOC at a time.** Beyond 400 LOC, ability to find defects diminishes. A review of 200-400 LOC over 60-90 minutes should yield **70-90% defect discovery** (7-9 out of 10 defects found).
2. **Take your time. Inspection rate matters.** Reviewers slower than 400 lines/hour were above average in defect detection. Faster than 450 lines/hour, defect density was below average in **87% of cases**.
3. **Do not review for more than 60 minutes at a time.** After 60-90 minutes, reviewers become less effective (similar to proof-reading fatigue).
4. **Set goals and capture metrics.** Measure inspection rate, defect rate, and defect density. Without metrics, you cannot improve the process.
5. **Authors should annotate source code before the review.** Annotations guide the reviewer through the changes and provide context, doubling the defect detection rate.
6. **Use checklists.** Checklists substantially improve results for both authors and reviewers. The most effective checklists are evolved over time from actual defects found.
7. **Establish a process for fixing defects found.** Track found defects to ensure they are actually fixed.
8. **Foster a positive code review culture.** Never use defect metrics from reviews in performance evaluations. This makes developers hostile toward the process. Defects found are opportunities, not failures.
9. **Embrace the subconscious implications of peer review.** The "ego effect" -- knowing someone will review your code makes you write better code in the first place.
10. **Practice lightweight code review.** Lightweight review takes **less than 20% the time** of formal inspections and finds just as many bugs. Formal inspection averages 9 hours per 200 LOC.

---

## Source 9: Atlassian -- What Are Code Reviews and How They Save Time (https://www.atlassian.com/agile/software-development/code-reviews)

### Core Questions for Every Review
- Are there any obvious logic errors in the code?
- Looking at the requirements, are all cases fully implemented?
- Are the new automated tests sufficient? Do existing tests need updates?
- Does the new code conform to existing style guidelines?

### Benefits for Agile Teams
- **Knowledge sharing:** No one person is the sole expert on any part of the codebase.
- **Time off enablement:** With shared knowledge, team members can take vacations without being a critical bottleneck.
- **Better estimates:** Developers who review more code gain broader understanding, leading to more accurate time estimates for related tasks.
- **Resilience:** Decentralized expertise means the team can handle departures and rotations.

### Key Recommendations
- Integrate code reviews into the existing workflow: after code is written and automated tests pass, but before merging upstream. This ensures reviewer time is spent checking for things machines miss.
- Reviewing more than 400 lines of code adversely impacts ability to find bugs; most bugs are found in the first 200 lines.
- Always explain *why* a change should be made, not just *what*.
- Measure effectiveness with inspection rate, defect rate, and defect density metrics.

---

## Source 10: Swarmia -- A Complete Guide to Code Reviews (https://www.swarmia.com/blog/a-complete-guide-to-code-reviews/)

### The Four Whys of Code Reviews
1. **Sharing knowledge** -- general tips, domain-specific information, framework expertise.
2. **Spreading ownership** -- prevents single-person silos, increases team motivation and autonomy. It is easy to end up in a situation where one developer always deals with a certain part of the codebase because they are most familiar with it. Short-term win, long-term loss.
3. **Unifying development practices** -- narrows the gap between individual styles through both high-level architecture discussions and micro-level CI checks (coding style enforcement).
4. **Quality control** -- catching defects, but more importantly surfacing design issues while they are still relatively easy to change.

### Best Practices (17 items)
1. **Decide on a process** -- write down explicit PR lifecycle (DRAFT -> READY FOR REVIEW -> CHANGES REQUESTED -> APPROVED -> MERGED). Make the process explicit so the ball is never dropped.
2. **Write a useful PR description** -- context for the reviewer, link to the issue, note any risks.
3. **Self-review before requesting** -- catch your own obvious issues.
4. **Optimize for the team** -- speed of the team producing together, not speed of the individual. Minimize response lag between author and reviewer. Quote from Google: "We optimize for the speed at which a team of developers can produce a product together."
5. **Do not interrupt focus to review** -- pick up reviews in natural breaks (after lunch, before end of day).
6. **Keep PRs small** -- Google recommends 100 lines as reasonable, 1,000 as too large. Use feature flags for half-ready features. It is almost always possible to split a large change into smaller chunks.
7. **Use conventional comments** -- label feedback as "suggestion:", "question:", "nit:", "issue:" to communicate severity.
8. **Review the tests first** -- tests describe expected behavior, making the implementation easier to follow.
9. **Ask questions instead of making demands** -- "What do you think about...?" rather than "Change this to..."
10. **Offer alternatives** -- when suggesting a change, show how you would do it.
11. **Use explicit review requests** -- set up CODEOWNERS files for automated reviewer assignment. Distributes responsibility fairly.
12. **Timely reviews** -- agree on a maximum response time (e.g., 4 hours or next morning).
13. **Distinguish blocking from non-blocking feedback** -- clearly signal what must change vs. what is optional.
14. **Approve with suggestions** -- approve the PR but leave non-blocking improvement suggestions.
15. **Use draft PRs for early feedback** -- get design-level feedback before the code is "done."
16. **Celebrate good code** -- do not only comment on problems; acknowledge clever solutions and clean implementations.
17. **Measure and improve** -- track review cycle time, time to first review, and review depth.

---

## Source 11: The Pragmatic Engineer (Gergely Orosz) -- Pull Request Best Practices (https://blog.pragmaticengineer.com/pull-request-or-diff-best-practices/)

**Author context:** Author of *The Software Engineer's Guidebook*, previously at Uber, Microsoft/Skype, Skyscanner.

### PR Description Best Practices
- **The "why" of the change** is the most important part of the description. Without it, the reviewer lacks context to evaluate whether the change is appropriate.
- First line: what changed. Body: why it changed, what alternatives were considered, and any risks.
- Link to the relevant issue/ticket.
- Include before/after screenshots for UI changes.

### Good vs. Better Reviews (from the Stack Overflow article by the same author)
- *Good* reviews: Check correctness, test coverage, coding guides, and point out obvious improvements such as hard-to-understand code, unclear names, commented-out code, untested code, unhandled edge cases.
- *Better* reviews: Look at the change in the context of the larger system. Check that changes are easy to maintain. Ask whether the change is necessary and how it impacts other parts of the system. Evaluate abstractions and architecture fit.
- *Great* reviews (per Joel Kemp): A contextual pass following an initial light pass.

### Stacked Diffs / Stacked PRs
- Check out main, make small changes as individual diffs, continue working by creating a second diff, third, etc.
- Enables continuous work without waiting for reviews.
- Each diff is small and focused, making reviews faster and more thorough.

---

## Source 12: Philipp Hauer -- Code Review Guidelines for Humans (https://phauer.com/2018/code-review-guidelines/)

**Author:** Head of Engineering at commercetools.

### For Authors (Reviewees)
- **Be humble.** Everybody makes mistakes. Admitting them shows professionalism. The team manager should model this error culture by admitting mistakes in public.
- **Accept that you are not your code.** Detach ego from the code. Be open to feedback as a learning opportunity.
- **Provide context.** Include a description and annotate complex parts of the change.
- Making mistakes is accepted and admitting them is desired. This mindset creates an atmosphere where criticism during code review can be accepted.

### For Reviewers
- **Use I-messages.** "I find this hard to understand" vs. "This code is confusing." I-messages are subjective, non-confrontational, and harder to argue against.
- **Talk about the code, not the developer.** Wrong: "You are sloppy with tests." Right: "I believe more attention to tests would help here."
- **Refer to behavior, not traits.** Traits feel like personal attacks and trigger defensiveness. Behavior can be changed. Wrong: "You are sloppy when it comes to writing tests." Right: "I believe that you should pay more attention to writing tests."
- **Accept that there are different solutions.** Distinguish between common best practices and personal taste. Your skepticism may reflect preference, not objective quality. Be pragmatic and make compromises.
- **Do not jump in front of every train.** Do not criticize every single line. Focus on the most important flaws and code smells. This prevents annoyance and preserves openness to further feedback.
- **Respect and trust the author.** Nobody writes bad code on purpose. The author wrote the code to the best of their knowledge and belief.

### The OIR Rule for Giving Feedback
Structure feedback into three parts:
1. **Observation** -- "This method has 100 lines." (objective, neutral)
2. **Impact** -- "This makes it hard for me to grasp the essential logic." (I-message)
3. **Request** -- "I suggest extracting low-level details into subroutines with expressive names." (constructive proposal)

### Before Giving Feedback, Ask Yourself
- Is it true? (opinion != truth)
- Is it necessary? (avoid nagging, unnecessary comments, and out-of-scope work)
- Is it kind? (no shaming)

---

## Source 13: Code Complete by Steve McConnell -- Book Reference

**Book:** *Code Complete: A Practical Handbook of Software Construction*, 2nd Edition (Microsoft Press, 2004)

- "The average effectiveness of design and code inspections is 55% and 60%," respectively, at detecting defects -- 10-35% more effective than automated testing alone.
- Code reviews cut errors by **82% at Aetna Insurance**, **99% in IBM's Orbit project**, and **90% in an AT&T project** with more than 200 people.
- NASA's Jet Propulsion Laboratory estimated inspections save **$25,000 per inspection** by finding and fixing defects early.
- Recommended review speed: no more than **500 lines of code per hour**.
- The book covers inspection roles, general procedure, fine-tuning inspections, and ego management in inspections.
- Discovering defects earlier in a process leads to less time required to fix them later, saving time otherwise spent in testing, debugging, and performing regressions.

---

## Source 14: Meta Engineering -- Code Review Time (https://engineering.fb.com/2022/11/16/culture/meta-code-review-time-improving/)

- Meta tracks **"Time In Review"** -- how long a diff waits on reviewer action. P50 (median) was a few hours. P75 (slowest 25%) jumped to a full day.
- Direct correlation found: **the longer P75 Time In Review, the less satisfied engineers were** with the code review process. This became their north star metric.
- Meta built **Nudgebot** (inspired by Microsoft research) to ping likely reviewers for stale diffs with context and quick-action buttons. Result: average Time In Review dropped **7%**, and diffs waiting 3+ days dropped **12%**.
- They also track **"Eyeball Time"** (time reviewers actually spend looking at a diff) as a guardrail against rubber-stamping. Faster reviews without reduced Eyeball Time means genuine improvement, not corner-cutting.
- Every diff must be reviewed, no exceptions.
- At higher engineering levels, engineers are expected to help colleagues through code reviews and constructive feedback.

---

## Source 15: Conventional Comments Standard (https://conventionalcomments.org/)

- A structured labeling system that removes ambiguity from review comments.
- Every comment gets a label and optional decorations:

| Label | Meaning | Example |
|---|---|---|
| `praise` | Recognize good work | `praise: Great optimization here.` |
| `nitpick` | Trivial, preference-based; author can ignore | `nitpick: Prefer camelCase here.` |
| `suggestion` | Possible improvement, not obligatory | `suggestion: Consider extracting this to a helper.` |
| `issue` | Problem that needs fixing | `issue: This will NPE if input is null.` |
| `question` | Seeking clarification | `question: Why was this approach chosen over X?` |
| `thought` | Shared idea, not a request | `thought: This might benefit from caching later.` |
| `chore` | Routine task | `chore: Update the changelog.` |

- Decorations like `(non-blocking)` and `(blocking)` further clarify intent.
- Format is machine-parseable: `<label> [decorations]: <subject>\n\n[discussion]`.

---

## Synthesis: Cross-Source Patterns and Principles

After surveying 15 sources spanning Google, Microsoft, Meta, SmartBear/Cisco empirical studies, engineering books, and practitioner blogs, the following patterns emerge consistently:

### 1. Keep Changes Small (unanimous across all sources)
Every source agrees this is the single highest-leverage practice. Google says "easy to digest, focus on a single issue." SmartBear's Cisco data shows 200-400 LOC is the sweet spot with 70-90% defect discovery. Swarmia says 100 lines is reasonable, 1,000 is too large. Dr. Greiler's data: reviewers are 3x more thorough with 500-line PRs vs. 2,000-line ones. Beyond 400 LOC, the brain cannot effectively process the information, and feedback shifts to surface-level issues.

### 2. Optimize for the Reviewer, Not the Writer
The code review serves the reader. Provide descriptions explaining *why*, self-review before submitting, annotate complex areas, and link to relevant context. Google: "optimize for the reader." Pragmatic Engineer: "the why of the change is the most important part." SmartBear: author annotations double defect detection rates.

### 3. Seek Continuous Improvement, Not Perfection
Google's "senior principle": approve if it definitely improves code health, even if imperfect. SmartBear: lightweight reviews find as many bugs as formal inspections at 20% of the time cost. Every source warns against blocking PRs for nitpicks. There is no such thing as "perfect" code -- only better code.

### 4. Be Respectful and Empathetic
Philipp Hauer: use I-messages, talk about code not the developer, apply the OIR rule (Observation-Impact-Request). Stack Overflow Blog: better reviews are empathetic and applaud nice solutions. SmartBear: never use review defect metrics in performance evaluations. Google: "be sure that you are always making comments about the code and never making comments about the developer." One abrasive remark can deter engineers from performing up to potential (ACM study).

### 5. Use Structured Checklists
Google provides a 12-point checklist. SmartBear found checklists substantially improve results and should evolve over time from actual defects found. Dr. Greiler lists checklists as a top practice. Microsoft's playbook uses a two-pass structure (design pass, then code quality pass). The Conventional Comments standard provides machine-parseable labels.

### 6. Automate the Mechanical Checks
Every source emphasizes this. Linters, formatters, static analysis, and CI should handle style, type errors, and simple bugs. Human review time should be spent on design, logic, maintainability, and knowledge sharing -- things machines cannot evaluate. The Software Engineering at Google book states "automation is critical for scaling the process."

### 7. Timely Reviews Are Critical
Google expects 24-hour turnaround. Swarmia recommends agreeing on a maximum response time. Dr. Greiler: integrate reviews into your daily routine with dedicated time. Meta proved that P75 Time In Review directly correlates with engineer dissatisfaction. The key is minimizing response lag, not review duration. Context switching costs 20+ minutes of recovery per interruption.

### 8. Knowledge Sharing Is the Primary Benefit
The "Software Engineering at Google" book calls this the single most important benefit. Microsoft Research found that knowledge transfer and team awareness -- not bug-finding -- are the main actual outcomes. Atlassian: code reviews enable time off by decentralizing expertise. Swarmia: spreading ownership prevents silos. Dr. Greiler recommends including junior developers specifically for knowledge transfer.

### 9. Distinguish Blocking from Non-Blocking Feedback
Google: prefix "Nit:" for optional polish. Swarmia recommends conventional comment labels ("suggestion:", "nit:", "issue:"). Stack Overflow Blog: differentiate "must-fix," "should-fix," and "nits." This reduces round-trips and unblocks authors faster. Dr. Greiler: make rejections the exception, not the rule.

### 10. Fight Bias and Foster Psychological Safety
Dr. Greiler cites Google research showing bias by gender, race, ethnicity, and age in code reviews. SmartBear: never tie defect metrics to performance reviews. A 2024 study in Empirical Software Engineering found psychological safety directly advances software quality. Microsoft's playbook: what matters is a bug caught, not who made it. Philipp Hauer: the team manager should model an error culture by admitting mistakes in public.

### 11. Review Tests First
Multiple sources (Dr. Greiler, Swarmia, Microsoft Playbook) recommend starting with tests. Tests reveal intent and expected behavior, making the implementation easier to evaluate. Think like an adversary trying to break the code. A proper test review goes beyond checking for the presence of tests -- assess the quality and intent of the tests themselves.

### 12. The "Ego Effect" and Cultural Dividends
SmartBear: knowing someone will review your code makes you write better code in the first place. Code Complete: inspections create a culture of quality that pays compounding dividends over time. Philipp Hauer: "You are not your code" -- detaching ego from code is essential for constructive review culture.

---

## Key Metrics to Track

| Metric | Target | Why It Matters |
|---|---|---|
| **PR size (lines changed)** | < 400 LOC (ideal < 300) | Directly determines review effectiveness |
| **Time to first response** | < 1 business day | Reduces developer frustration and stalling |
| **Review cycle time** | 2-3 days end-to-end | Keeps momentum; prevents context loss |
| **Review cycles (rounds)** | 1-2 rounds typical | More rounds = ambiguous feedback or large scope |
| **Comment density** | 2-5 meaningful comments/review | Too few = rubber stamping; too many = nit-picking |
| **Reviewer engagement** | > 75% of team active as reviewers | Prevents knowledge silos |
| **Post-review defect rate** | < 5% bugs found after merge | Ultimate quality measure |
| **P75 Time In Review** (Meta) | Track and reduce over time | The tail of slow reviews drives dissatisfaction |
| **Eyeball Time** (Meta) | Should not decrease as speed improves | Guardrail against rubber-stamping |

---

## Code Review Antipatterns

| Antipattern | Description | Impact |
|---|---|---|
| **Rubber stamping** | Approving without meaningful review | Defeats the purpose entirely; bugs and design issues pass through |
| **Nit-picking without substance** | Focusing on style trivia while ignoring architecture | Wastes author time, misses real issues |
| **Late-breaking design feedback** | Requesting nit fixes first, then revealing major design objections requiring rewrites | Signals "your time is not valued"; wastes effort |
| **The Catch-22** | Big patch? Too hard to read, split it up. Many small patches? Some make no sense alone, glue them together. | Blocks all progress |
| **Bike-shedding** | Extensive debate on trivial issues while ignoring complex ones | Misallocates review effort |
| **Knowledge silos** | Only one person can review certain code | Creates bottlenecks and bus factor risk |
| **Long-running PRs** | Reviews that drag on for days/weeks | Context is lost, merge conflicts accumulate, morale drops |
| **Self-merging** | Authors merging without any review | No quality gate at all |

---

## All Source URLs

1. https://google.github.io/eng-practices/review/reviewer/looking-for.html
2. https://google.github.io/eng-practices/review/reviewer/standard.html
3. https://abseil.io/resources/swe-book/html/ch09.html
4. https://www.microsoft.com/en-us/research/publication/characteristics-of-useful-code-reviews-an-empirical-study-at-microsoft/
5. https://www.microsoft.com/en-us/research/publication/code-reviews-do-not-find-bugs-how-the-current-code-review-best-practice-slows-us-down/
6. https://microsoft.github.io/code-with-engineering-playbook/code-reviews/process-guidance/reviewer-guidance/
7. https://www.michaelagreiler.com/code-review-best-practices/
8. https://stackoverflow.blog/2019/09/30/how-to-make-good-code-reviews-better/
9. https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/
10. https://www.atlassian.com/agile/software-development/code-reviews
11. https://www.swarmia.com/blog/a-complete-guide-to-code-reviews/
12. https://blog.pragmaticengineer.com/pull-request-or-diff-best-practices/
13. https://phauer.com/2018/code-review-guidelines/
14. https://engineering.fb.com/2022/11/16/culture/meta-code-review-time-improving/
15. https://conventionalcomments.org/

### Book References
- *Software Engineering at Google: Lessons Learned from Programming Over Time* (O'Reilly, 2020) -- Chapter 9: Code Review
- *Code Complete: A Practical Handbook of Software Construction*, 2nd Edition (Microsoft Press, 2004) -- Steve McConnell

### Additional Academic References
- Bacchelli & Bird, "Expectations, Outcomes, and Challenges of Modern Code Review" (ICSE 2013) -- https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/ICSE202013-codereview.pdf
- Bosu et al., "Characteristics of Useful Code Reviews" (MSR 2015) -- https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/bosu2015useful.pdf
