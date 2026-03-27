# Anti-Pattern Detection in Code Review — Research Notes

**Date:** 2026-03-25
**Scope:** Common anti-patterns reviewers should catch, process anti-patterns, automated detection tools, design pattern violations, community discussions.
**Sources:** 15 high-quality sources across blogs, academic papers, dev communities, and vendor documentation.

---

## Source 1: Simon Tatham — "Code Review Antipatterns" (https://www.chiark.greenend.org.uk/~sgtatham/quasiblog/code-review-antipatterns/)

Published 2024-08-21. Satirical but deeply insightful catalog of reviewer-side anti-patterns. Written from the perspective of a "dark-side" reviewer to illustrate how code review can be weaponized.

**Eight named anti-patterns:**

- **The Death of a Thousand Round Trips:** Reviewer spots one nitpick, stops reading, waits for fix, then finds another independent nitpick on the next iteration that could have been mentioned the first time. Repeat until the developer loses hope. Especially destructive across time zones where each round trip takes 24 hours.
- **The Ransom Note:** Reviewer refuses to approve a completely reasonable PR until the submitter does a substantial refactor or entire redesign of an area that happened to be touched by one of the commits. The reviewer is holding the small change hostage to extract unrelated work.
- **The Double Team:** Two reviewers give contradictory feedback. Author fixes to satisfy reviewer A, but now reviewer B objects. Author changes back, and reviewer A objects again. The two reviewers never coordinate with each other.
- **The Guessing Game:** Reviewer says the code is wrong but does not say what version they would accept. The author has to guess what the reviewer wants, submit a new version, get told that is also wrong, and iterate blindly.
- **The Priority Inversion:** Reviewer asks for important architectural rewrites mixed with trivial nitpicks in the same review. Author fixes the easy nitpicks first. Reviewer then demands the big rewrite, making the nitpick fixes wasted effort because the rewritten code will be different anyway.
- **The Late-Breaking Design Review:** Reviewer waits until the code is fully implemented and polished before raising fundamental design objections that should have been discussed before coding started.
- **The Catch-22:** Reviewer requires something that is impossible given the project's constraints, or contradicts another requirement. The author cannot satisfy the review no matter what they do.
- **The Flip Flop:** Reviewer suddenly objects to something they have never had a problem with before, or previously approved. The reviewer has changed their mind about a standard but expects the author to have anticipated this shift.

**Key insight:** The article also discusses authority and gatekeeping — code review works best when the reviewer's role is advisory, not when they have veto power that can be wielded as obstruction. Gatekeeping reviews need clear, objective standards to prevent abuse.

---

## Source 2: DEV Community — "Code Review Anti-Patterns" by Adam B (https://dev.to/adam_b/code-review-anti-patterns-2e6a)

Three major reviewer-side anti-patterns from real career experience:

- **Rude, Bullying, or Cruel Tone:** Software is a "pure mental projection" — criticizing someone's code can feel like criticizing their intelligence. The line between "that's stupid" and "you're stupid" is essentially absent. Hostile tone destroys morale and trust. Even technically correct feedback delivered cruelly is counterproductive.
- **Nit-Picking Over Style Preferences:** Reviewers who block PRs over personal stylistic preferences that the organization has not mandated. "Programming is not a beauty contest." Code does not need to be perfect to be functional and maintainable. Style issues should be enforced by linters, not humans.
- **Gatekeeping / Scope Creep:** Reviewer refuses to approve a reasonable PR until the author does additional work beyond the scope of the original change, sometimes demanding redesigns of tangentially-related code.

**Key insight:** All three anti-patterns are on the reviewer/organizational side. A separate article could be written about author-side anti-patterns, but the reviewer wields more power and therefore does more damage.

---

## Source 3: AWS Well-Architected Framework — "Anti-patterns for Code Review" (https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/anti-patterns-for-code-review.html)

AWS DevOps Guidance identifies five organizational/process anti-patterns:

- **Infrequent Code Reviews:** Skipping or only occasionally performing reviews misses early error detection and leads to isolated development. Fix: make reviews mandatory before merge.
- **Excessive Required Reviewers:** Too many reviewers create bottlenecks and unwarranted delays. Fix: define practical reviewer count based on complexity and criticality.
- **Lack of Automated Feedback:** Neglecting automated tools forces human reviewers to focus on trivial issues (formatting, style) instead of complex logic. Fix: use automated tools to complement manual review — but do not rely on them exclusively, as they create a false sense of security.
- **Large Batch Reviews:** Combining multiple unrelated changes into a single PR clutters the review and lengthens the cycle. Fix: submit smaller, focused PRs for faster feedback loops.
- **Unconstructive Reviews:** Harsh or hostile tone, vague feedback, demoralize developers and prevent open dialogue. Fix: maintain a supportive tone; make constructive suggestions about what version of the code would be accepted.

**Key insight:** AWS explicitly warns against both extremes — too much automation ("false sense of security") and too little ("peers waste time on trivial issues"). The balance between automated and manual review is critical.

---

## Source 4: CodeRabbit — "5 Code Review Anti-Patterns You Can Eliminate with AI" (https://www.coderabbit.ai/blog/5-code-review-anti-patterns-you-can-eliminate-with-ai)

Five code-level anti-patterns that AI-assisted review can detect:

- **God Class / The Blob:** A class takes on too many responsibilities, resulting in bloated, hard-to-maintain code where changes in one place cause unintended consequences elsewhere. AI can analyze class responsibility boundaries and suggest decomposition.
- **Spaghetti Code:** Excessive branching, deeply nested loops, reliance on global variables. Structure becomes impossible to follow. AI can measure cyclomatic complexity and flag structural tangles.
- **Lava Flow:** Old, unused code accumulates over time, increasing technical debt and cluttering the codebase. AI can detect dead code paths and unused imports/variables.
- **Primitive Obsession:** Overuse of primitive types (strings, ints) instead of domain-specific types. AI suggests replacing primitives with enums, value objects, or custom types for type safety.
- **Tight Coupling:** Components depend directly on each other's implementations rather than abstractions. AI analyzes dependency graphs, suggests refactoring to decouple systems, and recommends design patterns (e.g., dependency injection).

**Key insight:** AI review tools excel at detecting structural anti-patterns that are tedious for humans to track manually across large PRs — especially dependency analysis and dead code detection.

---

## Source 5: Medium — "7 Consistency Anti-Patterns I See in Every Code Review" by The Latency Gambler (https://medium.com/@kanishks772/7-consistency-anti-patterns-i-see-in-every-code-review-78e255306a1e)

Published August 2025. Seven anti-patterns in the code itself, focused on consistency violations:

1. **Mixed Naming Conventions in the Same Context:** camelCase, snake_case, and PascalCase mixed in the same class. Creates cognitive load — developers waste mental energy remembering which function uses which convention.
2. **Inconsistent Error Handling Patterns:** Each module handles errors differently — some throw, some return null, some use Result types. Security and maintenance nightmare.
3. **Inconsistent Return Types:** Same logical operation returns different shapes depending on the code path (e.g., sometimes an object, sometimes null, sometimes undefined).
4. **Mixed Async Patterns:** Callbacks, promises, and async/await mixed in the same codebase or even the same file.
5. **Inconsistent Null/Undefined Handling:** Some code checks for null, some for undefined, some for both, some for neither.
6. **Mixed Logging Patterns:** Some modules use console.log, others use a logger, others use a custom solution. Makes log aggregation and debugging painful.
7. **Inconsistent Configuration Access:** Environment variables accessed directly in some places, through a config object in others, hardcoded in others.

**Key insight:** These are not "bugs" — they are consistency violations that compound over time. Each one individually is minor, but collectively they slow development and increase bugs. Linters and automated rules can catch many of these.

---

## Source 6: DZone Refcard — "Code Review Patterns and Anti-Patterns" by Jennifer McGrath (https://dzone.com/refcardz/code-review-patterns-and-anti-patterns)

Eight patterns/anti-patterns from the engineering management perspective (GitPrime/Pluralsight Flow data):

- **Long-Running PRs:** PRs that stay open for extended periods. Signal of review bottlenecks, unclear ownership, or scope too large.
- **Self-Merging PRs:** Developer merges their own code without external review. Bypasses the entire review safety net.
- **Heroing:** One person does a disproportionate amount of the work (or reviewing). Creates single points of failure and burnout.
- **Over-Helping:** A senior developer rewrites the author's code during review instead of coaching them. The author does not learn, and the "helper" becomes a bottleneck.
- **"Just One More Thing":** Reviewer keeps finding one more issue after each fix, extending the review indefinitely (related to Tatham's "Death of a Thousand Round Trips").
- **Rubber Stamping:** Approving PRs without meaningful review. Often happens when a senior submits code and juniors assume it is correct.
- **Knowledge Silos:** Only one person understands certain parts of the codebase. Reviews become meaningless because the reviewer lacks context.
- **High Bus Factor:** Related to knowledge silos — when key people leave, the team cannot maintain the code. Reviews should spread knowledge, not concentrate it.

**Key insight:** These are observable through engineering analytics (PR cycle time, reviewer distribution, comment density). Data-driven detection of review anti-patterns is possible.

---

## Source 7: SubMain — "Manual Code Review Anti-Patterns" by Erik Dietrich (https://blog.submain.com/manual-code-review-anti-patterns/)

Published 2017. Classic catalog of anti-patterns in face-to-face and manual review processes:

- **The Gauntlet:** The reviewee enters a room with self-important, hyper-critical peers who adopt a derisive tone and administer the third degree. Crushes spirits, leaves low morale and resentment.
- **The Marathon:** Participants sit in a conference room for hours. Energy wanes as time passes, review quality degrades. Eventually reaches a point where "you might as well not bother."
- **The Nit-Pick:** Reviewers focus exclusively on trivial cosmetic issues (spacing, naming minutiae) while ignoring substantive logic and design problems. Creates a false sense of thoroughness.
- **The Rubber Stamp:** Review exists in name only. Everyone approves quickly to get it over with. Provides no quality benefit while consuming time and creating false confidence.
- **The Perfectionist:** Reviewer blocks every PR until the code meets an impossibly high standard. Nothing is ever good enough. Development velocity drops to near zero.

**Key insight:** Dietrich argues that automated code review (static analyzers, linters) should handle the simple things so humans can focus on complex, nuanced topics. The division of labor between machines and humans is the key to effective review.

---

## Source 8: Joseph Scott — "Bikeshedding Code Reviews" (https://blog.josephscott.org/2015/08/13/bikeshedding-code-reviews/)

Short but incisive piece on Parkinson's Law of Triviality applied to code reviews:

- **The Core Observation:** "10 lines of code = 10 issues. 500 lines of code = 'looks fine.'" (attributed to @iamdevloper). Reviewers scrutinize small changes obsessively but wave through large ones.
- **Bikeshedding Dynamics:** Reviewers spend the majority of time on trivial, easy-to-grasp issues while neglecting complex, important but harder-to-critique aspects — exactly like Parkinson's committee spending time on the bike shed instead of the nuclear reactor.
- **Perverse Incentive:** Because small patches get over-scrutinized, submitters are motivated to submit 500-line patches instead of 10-line patches. This defeats the purpose of small, reviewable PRs.

**Key insight:** The challenge is finding methods that incentivize submitting smaller patches that outweigh the natural tendency toward larger ones.

---

## Source 9: Medium — "You Can Stop the Rubber Stamping" by Coral Heart (https://sunislife.medium.com/you-can-stop-the-rubber-stamping-ee8d41ec669a)

Published 2020. Focused analysis of rubber stamping as a specific anti-pattern:

**Why rubber stamping happens:**
- PR review is not a focus in the team; leadership does not recognize review effort.
- The PR submitter is senior and the team trusts their work without verifying.
- Deadline pressure forces quick approvals.

**How to detect rubber stamping:**
- PR opened and closed in an unusually short period.
- No comments on the PR.
- No back-and-forth discussion.

**How to fix it:**
- Recognize and celebrate PR review efforts publicly.
- Coach the team on what good review looks like by sharing examples.
- Make review metrics visible (time-to-review, comment density).
- Leadership must model thorough review behavior.

**Key insight:** Rubber stamping is a cultural problem, not a technical one. It requires leadership intervention, not tooling.

---

## Source 10: The Coding Craftsman — "How to Have Terrible Code Reviews" by Ashley Frieze (https://codingcraftsman.wordpress.com/2023/03/13/how-to-have-terrible-code-reviews/)

Satirical but practical guide listing specific behaviors that make code reviews terrible:

**Process-level anti-patterns:**
- Long build times (>7 minutes) mean even trivial review changes require extended waits.
- Requiring more than one approval creates bottleneck multiplication.
- Complex code-ownership rules that require many reviewers.
- Reviewers being unavailable — not responding to review requests within 30 minutes.

**Reviewer behavior anti-patterns:**
- Nit-picking on personal preference items, where each tweak costs a full build cycle.
- Partial reviews — offering comments, then on the next iteration commenting on things that were there all along.
- Going on a mission — using one feature's review to push a grander agenda.
- Commenting on unchanged lines — complaining about pre-existing code the author did not touch.
- Offering subjective opinions as objective requirements.

**Outcomes of abysmal review processes:**
- Arguments and resentment.
- Larger batch sizes (because the cost of any change is so high, developers bundle more changes to justify the process).
- Vicious cycle: larger batches lead to longer cycles, which lead to even larger batches.
- False belief that linters can solve everything.
- Resignations.

**Key insight:** The vicious cycle between review friction and batch size is a critical system dynamic. High review friction drives developers toward larger PRs, which are harder to review, which increases friction further.

---

## Source 11: Trisha Gee — "Code Review Best Practices" (https://trishagee.github.io/post/code_review_best_practices/)

Originally a guest post for FogBugz. Identifies anti-patterns that emerge from misaligned review purpose:

**The root cause of many anti-patterns:** When everyone on the team has a different idea of WHY they are reviewing code, they look for different things. This leads to:
- Reviews taking forever because every reviewer finds different problems.
- Reviewers become demotivated because every review throws up different types of problems depending on who reviews it.
- Reviews ping-pong between author and reviewer as each iteration exposes a different set of problems.

**Process recommendations that prevent anti-patterns:**
- Agree on a single primary purpose for code review.
- Decide WHAT to look for based on that purpose.
- Automate what can be automated (style, formatting, basic correctness).
- Focus human review on what cannot be automated (design, readability, intent).
- Keep PRs small (under 400 lines ideally).
- Time-box reviews to prevent marathon sessions.

**Key insight:** Anti-patterns in code review are often symptoms of a missing or misaligned review charter. Fix the charter, and many anti-patterns resolve themselves.

---

## Source 12: IEEE SANER 2021 — "Anti-patterns in Modern Code Review: Symptoms and Prevalence" (https://ieeexplore.ieee.org/document/9425884/)

Academic paper by Chouchen, Ouni, Kula, Wang, Thongtanunam, Mkaouer, and Matsumoto. Published at the 28th IEEE International Conference on Software Analysis, Evolution and Reengineering.

**Key findings:**
- Defined the concept of Modern Code Review Anti-patterns (MCRA) and created a catalog of common poor review practices.
- Identified five MCR anti-patterns with symptoms and potential impacts.
- Studied 100 code reviews from OpenStack and found anti-patterns present in **67% of code reviews**.
- Poor reviewing practices contribute to tense reviewing culture, degradation of software quality, slowed integration, and reduced project sustainability.

**Replication package:** Available at https://github.com/moatazchouchen/MCRA

**Key insight:** This is the first systematic academic attempt to catalog and measure the prevalence of code review anti-patterns. The 67% prevalence rate indicates these are not edge cases — they are the norm.

---

## Source 13: ACM — "Effective Teaching through Code Reviews: Patterns and Anti-patterns" (https://doi.org/10.1145/3660764)

Published 2024 in Proceedings of the ACM on Software Engineering. Case study at Google.

**Methodology:**
- Interviewed 14 developers at Google.
- Identified 12 patterns and 15 anti-patterns that impact learning through code review.
- Validated findings with a survey of 324 respondents.

**Patterns that facilitate learning:**
- Explanatory rationale (explaining WHY, not just WHAT to change).
- Sample solutions backed by standards.
- Constructive tone.

**Anti-patterns that hinder learning:**
- Harsh comments.
- Excessive shallow critiques (many trivial comments, no deep feedback).
- Nonpragmatic reviewing (ignoring the author's real-world constraints).
- Not explaining the reasoning behind requested changes.

**Key insight:** Code review is a primary mechanism for knowledge transfer in organizations. Anti-patterns in review do not just degrade code quality — they actively prevent team learning and growth.

---

## Source 14: GeeksforGeeks — "6 Types of Anti Patterns to Avoid in Software Development" (https://www.geeksforgeeks.org/blogs/types-of-anti-patterns-to-avoid-in-software-development/)

Six categories of anti-patterns that code reviewers should catch in submitted code:

1. **The Blob / God Class:** One class does everything. Violates Single Responsibility Principle. Fix: decompose into focused classes.
2. **Spaghetti Code:** No clear structure, excessive branching, deeply nested loops, global variables. Fix: refactor into well-defined modules with clear interfaces.
3. **Golden Hammer:** Using one familiar technology/pattern for every problem regardless of fit. Fix: evaluate tools/patterns per use case.
4. **Copy-Paste Programming:** Duplicating code instead of abstracting shared logic. "Acts like a virus" — changes must be made everywhere. Fix: extract common code into reusable functions/modules.
5. **Boat Anchor:** Keeping code "just in case" even though it is currently unused. Adds complexity and maintenance burden. Fix: delete dead code (version control preserves history).
6. **Lava Flow:** Hardened dead code from early development that no one dares remove. Similar to Boat Anchor but often older and more deeply embedded. Fix: systematic dead code removal with test coverage.

**Key insight:** Code review is cited as the primary defense against all six anti-patterns. "A common solution for most of the anti-patterns in software is code reviewing and code refactoring."

---

## Source 15: HackerNoon — "Code Review Anti-Patterns: How to Stop Nitpicking Syntax and Start Improving Architecture" by Nikita Kothari (https://hackernoon.com/code-review-anti-patterns-how-to-stop-nitpicking-syntax-and-start-improving-architecture)

Published December 2025 by a Senior Member of Technical Staff at Salesforce.

**Core thesis:** Most code reviews waste time on syntax and style issues that should be automated, while missing architectural and design problems that only humans can evaluate.

**Recommended layered review approach:**
- **Layer 1 (Automated):** Linting, formatting, static analysis — handled by CI/CD pipeline tools before human review begins.
- **Layer 2 (Human — Structure):** Does the code follow SOLID principles? Are responsibilities properly separated? Are abstractions at the right level?
- **Layer 3 (Human — Architecture):** Does this change fit the broader system design? Does it introduce coupling? Does it create scaling bottlenecks?
- **Layer 4 (Human — Intent):** Does this solve the right problem? Are there edge cases the tests do not cover? Is the approach the simplest that could work?

**Key insight:** The "nitpicking trap" is not just annoying — it actively crowds out architectural review. Every minute spent on formatting is a minute not spent on design. Automation of Layer 1 is a prerequisite for effective human review at Layers 2-4.

---

## Automated Anti-Pattern Detection Tools

Summary of tools identified across sources:

| Tool | Type | Key Capabilities |
|------|------|-----------------|
| **SonarQube** | Static analysis platform | 6,500+ rules, code smells, bugs, security vulns, complexity analysis. Supports 30+ languages. |
| **DeepSource** | AI + deterministic rules | 5,000+ rules, anti-pattern detection on every PR, auto-fix suggestions. |
| **CodeRabbit** | AI code review | Primitive obsession, coupling analysis, dependency graphs, design pattern recommendations. |
| **PMD** | Rule-based static analysis | Focused on Java. Unused variables, complex code, naming issues. Lightweight, open-source. |
| **ESLint** | JavaScript/TypeScript linter | Code smells, style enforcement, auto-fix. Ecosystem of plugins. |
| **Qodo** | AI review agent | Trained on millions of codebases. Inline PR comments, bug/vuln/anti-pattern detection. |
| **Embold** | AI + static analysis | Architectural-level design anti-pattern detection. Long-term maintainability focus. |
| **Panto AI** | AI code review | Context-aware anti-pattern detection, smart static analysis at scale. |
| **Codacy** | Automated review platform | Security and code quality, multi-language support, CI/CD integration. |
| **CodeAnt.ai** | AI analysis | Code smell detection, automated fixes, pattern recognition. |

**Emerging trend:** LLMs (2025-2026) now match or exceed traditional static analysis tools for 6 of 9 common code smells, especially those with clear metrics (Data Class, Feature Envy, Intensive Coupling). A hybrid approach (LLM + static analysis) outperforms either alone in 5 of 9 smells by F1-Score (IEEE TSE 2025).

---

## Synthesis

### Taxonomy of Anti-Patterns

Anti-patterns in code review fall into three distinct categories:

**1. Reviewer Behavior Anti-Patterns (process)**
These are dysfunctions in how reviewers conduct reviews. They are the most discussed category across all sources:
- **Obstruction patterns:** Death of a Thousand Round Trips, Ransom Note, Just One More Thing, Perfectionist
- **Abdication patterns:** Rubber Stamping, Self-Merging
- **Hostility patterns:** The Gauntlet, Rude/Bullying Tone, harsh comments
- **Misfocus patterns:** Bikeshedding, Nit-Picking, Flip Flop
- **Coordination failures:** Double Team, contradictory feedback, misaligned review purpose
- **Timing failures:** Late-Breaking Design Review, Marathon sessions

**2. Organizational/Process Anti-Patterns (system)**
These are structural problems in how the review process is set up:
- Infrequent reviews, excessive reviewers, complex ownership rules
- Knowledge silos, high bus factor, heroing
- Long build times that make iteration painful
- No agreed review charter or purpose
- Lack of automation for trivial checks

**3. Code-Level Anti-Patterns (detection targets)**
These are what reviewers should be trained to spot in the code itself:
- Structural: God Class, Spaghetti Code, Tight Coupling
- Waste: Lava Flow, Boat Anchor, Dead Code
- Duplication: Copy-Paste Programming
- Abstraction failures: Primitive Obsession, Golden Hammer
- Consistency violations: Mixed naming, inconsistent error handling, mixed async patterns

### Key Themes Across All Sources

1. **Automate the automatable.** Every source agrees: style, formatting, and basic correctness checks must be automated. Human review time is too expensive to waste on what linters can catch.

2. **The bikeshedding trap is real and measurable.** Small PRs get over-scrutinized on trivia; large PRs get waved through. This creates a perverse incentive to submit large PRs, which are harder to review properly.

3. **Review anti-patterns are the norm, not the exception.** The IEEE SANER 2021 study found anti-patterns in 67% of code reviews. Most teams have these problems — most just do not measure them.

4. **Tone matters as much as content.** Multiple sources (DEV Community, ACM Google study, SubMain, AWS) emphasize that hostile or harsh review tone does not just hurt feelings — it actively degrades code quality by shutting down collaboration and learning.

5. **Misaligned purpose is the root cause.** When team members disagree on WHY they review code, anti-patterns proliferate. A clear review charter prevents many problems (Trisha Gee).

6. **Review is a teaching mechanism.** The ACM/Google study shows that reviews where reviewers explain rationale and provide samples facilitate learning. Reviews that are shallow, harsh, or nonpragmatic destroy the learning function.

7. **Data-driven detection is emerging.** Engineering analytics (PR cycle time, comment density, reviewer distribution) can now detect anti-patterns like rubber stamping, heroing, and knowledge silos automatically (DZone/GitPrime).

### Implications for Wazir's Review System

For an automated review system like Wazir, the research suggests:

- **Layer reviews:** Separate automated checks (style, complexity, dead code) from human-judgment checks (design, architecture, intent).
- **Detect reviewer anti-patterns, not just code anti-patterns.** Track metrics like review time, comment depth, and approval patterns to flag rubber stamping, bikeshedding, and obstruction.
- **Enforce small PR size.** The bikeshedding research shows that review quality degrades sharply with PR size. Set limits and enforce them.
- **Require rationale in review comments.** The Google study shows that "change this" without "because..." is an anti-pattern that blocks learning.
- **Define a review charter.** Before any review runs, the system should know what it is looking for and at what level (correctness? design? readability?).
- **Use the anti-pattern catalog as a checklist.** The 8 reviewer behavior anti-patterns from Tatham, 5 process anti-patterns from AWS, and 6 code anti-patterns from GeeksforGeeks form a comprehensive detection framework.

---

## All Source URLs

1. https://www.chiark.greenend.org.uk/~sgtatham/quasiblog/code-review-antipatterns/
2. https://dev.to/adam_b/code-review-anti-patterns-2e6a
3. https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/anti-patterns-for-code-review.html
4. https://www.coderabbit.ai/blog/5-code-review-anti-patterns-you-can-eliminate-with-ai
5. https://medium.com/@kanishks772/7-consistency-anti-patterns-i-see-in-every-code-review-78e255306a1e
6. https://dzone.com/refcardz/code-review-patterns-and-anti-patterns
7. https://blog.submain.com/manual-code-review-anti-patterns/
8. https://blog.josephscott.org/2015/08/13/bikeshedding-code-reviews/
9. https://sunislife.medium.com/you-can-stop-the-rubber-stamping-ee8d41ec669a
10. https://codingcraftsman.wordpress.com/2023/03/13/how-to-have-terrible-code-reviews/
11. https://trishagee.github.io/post/code_review_best_practices/
12. https://ieeexplore.ieee.org/document/9425884/
13. https://doi.org/10.1145/3660764
14. https://www.geeksforgeeks.org/blogs/types-of-anti-patterns-to-avoid-in-software-development/
15. https://hackernoon.com/code-review-anti-patterns-how-to-stop-nitpicking-syntax-and-start-improving-architecture
