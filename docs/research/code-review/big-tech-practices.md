# Big Tech Code Review Practices Research

**Date:** 2026-03-25
**Purpose:** Understand how large tech companies handle code review at scale, what automation they use, and what lessons apply to Wazir's review pipeline.

---

## Google

### Source 1: Software Engineering at Google, Chapter 9 — Code Review (https://abseil.io/resources/swe-book/html/ch09.html)

- Every change at Google is reviewed before being committed (precommit review). Every engineer is responsible for initiating and reviewing changes.
- Google uses a custom code review tool called **Critique** internally and the open-source **Gerrit** for public-facing projects.
- **Three approval types are required** for any change:
  1. **LGTM** (Looks Good To Me) — a correctness and comprehension check from another engineer (often a teammate).
  2. **Code owner approval** — from an owner of the directory where the change lives. Google's codebase is a tree structure with hierarchical owners. This can be implicit if the author is an owner.
  3. **Readability approval** — from someone with a per-language readability certification, demonstrating they know how readable and maintainable code looks.
- In practice, one reviewer can often satisfy all three roles, keeping the process lightweight.
- **Automation ("presubmits")**: Before a change is sent to a reviewer, automated presubmit checks run static analysis, tests, linters, and formatters. This catches formatting issues and basic errors before human review even begins, letting reviewers focus on design and logic.
- Google's review tooling allows **automatic submission** upon approval for simple changes.
- **Key motivations for review at Google**: education/mentoring, maintaining norms (tests, style consistency), gatekeeping (security, preventing arbitrary commits), accident prevention (bugs, defects), and tracing/tracking design decisions.
- The readability process was started by Craig Silverstein, who personally did line-by-line readability reviews with every new hire in Google's early days.

### Source 2: How Google Takes the Pain Out of Code Reviews, with 97% Dev Satisfaction (https://read.engineerscodex.com/p/how-google-takes-the-pain-out-of)

- **97% of Google software engineers are satisfied with Critique.**
- **Why Googlers love Critique:**
  - Full-featured **static analysis suite** that provides actionable feedback automatically, saving both authors and reviewers time.
  - Focus on only the **latest changed files** (latest "snapshot"), not the full commit history — leading to a cleaner UI.
  - Familiar **side-by-side diffing** with "diff from the last review" as default.
  - **ML-powered code suggestions**: When reviewers leave comments, Critique shows suggested ML-powered edits. The author can click one button to address the comment in its entirety.
  - **Tight integration** with Google's IDE (Cider), bug tracker, and other internal tools. Easy linking of code, comments, and tickets.
  - **"Attention set" tracking**: Tells people whose turn it is to act — removing ambiguity about who is blocking a review.
- **Review statistics (from Google's 2018 study):**
  - Median: **3 changes authored per week** per developer; 80% of authors make fewer than 7 changes weekly.
  - Median: **4 changes reviewed per week** per developer; 80% of reviewers handle fewer than 10.
  - Average time spent reviewing: **3.2 hours/week** (median 2.6 hours).
  - Initial feedback on small changes: **median under 1 hour**.
  - Initial feedback on very large changes: **about 5 hours**.
  - **Overall median latency for entire review process: under 4 hours.** This is dramatically faster than AMD (17.5h), Chrome OS (15.7h), and Microsoft projects (14.7-24h).
- **Prereview tools in Critique**: Shows diffs, build/test results, style checks, and static analyzer results with syntax highlighting, cross-references, intraline diffing, whitespace ignoring, and move detection.
- Reviewers can click **"Please fix"** on analysis comments; authors or reviewers can click **"Not useful"** to flag unhelpful analysis results — creating a feedback loop for analysis writers.

### Source 3: Code Reviews at Google Are Lightweight and Fast (https://www.michaelagreiler.com/code-reviews-at-google/)

- **25,000 engineers** at Google conduct reviews that are explicitly designed to be lightweight and fast.
- **90% of code reviews have fewer than 10 files changed**; most changes have only around **24 lines of code changed**.
- **75%+ of code reviews have just one reviewer** — a conscious tradeoff of review rigor for speed.
- **Readability certification** must be obtained per programming language. Developers submit code to a team of readability experts for inspection — not a normal code review but a deep evaluation of readability practices.
- Requirements for reviewers are **not based on seniority or hierarchy** — they are based on ownership and readability certification. This avoids the bottleneck problem of requiring senior engineers to approve everything.
- Google trades some review rigor for speed and makes this tradeoff explicit and company-wide.

### Source 4: How Google Does Code Review — Graphite (https://graphite.com/blog/how-google-does-code-review)

- Google has two tools: **Critique** (used by the majority) and **Gerrit** (open-source, used for public projects like Chromium and Android).
- **Dashboards**: Engineers see all in-flight CLs (change lists) at a glance, including change size and detailed status. Critique allows multiple sections (authored CLs, CLs needing review). A "Switch user" button lets you view another user's dashboard.
- **CL view features**: Test coverage metrics next to file list, commit message as a first-class reviewable entity, visual differentiation for moved code, shortcuts for common responses ("Done", "Ack"), and easy "resolve all comments" functionality.
- **Attention sets and turns**: A first-class concept. Gray arrows or bolded names signify whose turn it is to act. Hover for reasoning ("your review was requested", "author responded to your comment"). Reviewers can mark "not my turn" to remove themselves from the attention set. Culturally, LGTM reviewer goes first, then code owner and readability expert.
- Part of the review speed is attributed to the dashboard and explicit turns that highlight exactly what you need to look at.

---

## Microsoft

### Source 5: How Code Reviews Work at Microsoft (https://www.michaelagreiler.com/code-reviews-at-microsoft-how-to-code-review-at-a-large-software-company/)

- Microsoft has approximately **60,000+ engineers**. Code review is a highly adopted engineering practice, though the company does **not have a single mandated approach** — teams choose their own tools and processes.
- **CodeFlow** was the de facto standard internal tool for many years (used by 89% of developers in 2016). It is a UI-heavy tool (like Word/PowerPoint) that supports preparation, notification, commenting, and discussion.
- **CodeFlow features**: Automatic reviewer notification, rich commenting and discussion functionality, ability to span regions and attach comments to multiple lines, comment threading with batch resolution, and change tracking through iterations.
- **Review frequency**: 36% of developers review code multiple times daily, 39% at least once daily, 12% multiple times weekly, and only 13% did not review in the past week.
- **Primary benefits (from research)**: Improve code quality, find defects, and — most importantly — **knowledge transfer**. Learning, mentoring, and self-improvement are key perceived benefits.
- **Key research finding**: Only a very small percentage of code review comments are actually about bugs. The real value comes from **improved long-term code maintainability** and the comments that added value — identifying functional issues, pointing out missing validation checks, or offering suggestions on API usage and best practices.
- Microsoft does **not base reviewer authority on seniority or hierarchy** at the company level, though individual teams may.
- **Reviewer recommender system**: Microsoft built a system that identifies engineers familiar with the changed files, reducing the time required to get changes reviewed.

### Source 6: CodeFlow — Improving the Code Review Process at Microsoft (https://queue.acm.org/detail.cfm?id=3292420)

- Published in ACM Queue, this article documents the evolution of CodeFlow and code review culture at Microsoft.
- CodeFlow is used by **more than 50,000 Microsoft developers**.
- One key innovation was the **reviewer recommender** — automatically identifying engineers with familiarity of the changed files.
- Research found that the **most useful comments** were those identifying functional issues, missing validation, or API usage improvements — not bug reports.

### Source 7: Enhancing Code Quality at Scale with AI-Powered Code Reviews (https://devblogs.microsoft.com/engineering-at-microsoft/enhancing-code-quality-at-scale-with-ai-powered-code-reviews/)

- Microsoft's **AI-powered code review assistant (PRAssistant)** started as an internal experiment and now covers **over 90% of PRs across the company**, impacting **more than 600,000 pull requests per month**.
- It helps engineers catch issues faster, complete PRs sooner, and enforce consistent best practices within the standard workflow.
- **Problem addressed**: Reviewers spending time on low-value feedback (syntax, naming) while meaningful concerns (architecture, security) are overlooked. PRs sometimes waited days or weeks before getting merged.
- The internal experience directly informed **GitHub Copilot for Pull Request Reviews** (GA April 2025).
- Future focus: deepening contextual awareness — bringing in repo-specific guidance, referencing past PRs, learning from human review patterns to align with team norms and expectations.

### Source 8: Characteristics of Useful Code Reviews — Microsoft Research (https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/bosu2015useful.pdf)

- Empirical study at Microsoft on what makes code review comments useful.
- The most useful comments identified functional issues, pointed out missing validation checks, or offered suggestions related to API usage or best practices.
- While the popular notion is that code reviews find bugs, only a very small fraction of comments were about bugs. The real win is improved long-term maintainability.

---

## Meta (Facebook)

### Source 9: Meta Developer Tools — Working at Scale (https://engineering.fb.com/2023/06/27/developer-tools/meta-developer-tools-open-source/)

- Thousands of developers at Meta work in repositories with millions of files daily.
- **Sapling**: Meta's version control system (open-source) built to handle extreme scale. Includes a server (Rust-implemented), a client (supports git servers too), and **EdenFS** (virtual file system that checks out everything in seconds, downloading files on-demand).
- **Buck2**: Build system supporting remote caching and execution, multiple languages, designed to work with Sapling and EdenFS.
- **Phabricator ("Phab")**: Meta's CI and reviewing tool for reviewing and submitting **stacks of diffs**.
- **Static analysis at massive scale**: **Infer** (interprocedural, multi-language static analyzer for Java and C++), **Zoncolan** (security-focused), and **RacerD** (Java concurrency bug detector). These tools perform complex reasoning spanning many procedures or files, integrated into engineering workflows to bring value while minimizing friction.
- **Jest**: JavaScript testing framework (transferred to OpenJS Foundation in 2022).
- **Sapienz**: Automated test generation tool using search-based software engineering.

### Source 10: Stacked Diffs vs Pull Requests — Jackson Gabbard, Ex-Facebook (https://jg.gg/2018/09/29/stacked-diffs-versus-pull-requests/)

- Author has created hundreds of PRs and landed thousands of diffs across CVS, SVN, Git, Mercurial, GitLabs, GitHub, Gerrit, and Phabricator.
- **Stacked diffs workflow**: Work directly on top of master, committing as you go. For each commit, use Phabricator's CLI to create a "Diff" (equivalent to a PR). Unlike PRs, **diffs are based on exactly one commit**, and updates replace the commit in-place rather than adding additional commits.
- **Key advantage**: The state of your local repository is **not dictated by the review process**. You can have many commits stacked locally, each as a separate diff being reviewed independently, without one blocking the other.
- Facebook replaced its branch-oriented workflow with stacked diffs because it made engineers **more productive in concrete, measurable terms**.
- Stacked diffs encourage good engineering practices: small, atomic, reviewable changes — the opposite of large feature branches.
- The workflow is "a clearly higher-throughput workflow that gives significantly more power to engineers to develop code as they see fit."

### Source 11: Stacked Diffs and Tooling at Meta — Pragmatic Engineer (https://newsletter.pragmaticengineer.com/p/stacked-diffs-and-tooling-at-meta)

- Meta was the first company to popularize stacked diffs outside the company by open-sourcing Phabricator.
- Meta later built **Sapling** as its in-house source control solution with stacked branch development built in.
- **Graphite** (founded by ex-Meta engineers) brings this stacking workflow to companies using GitHub — now the market leader for stacked PR workflows on GitHub.
- Modern tools supporting stacked workflows: Graphite, ghstack, git-town, spr, and Sapling.

### Source 12: Scaling Static Analyses at Facebook — ACM Communications (https://research.fb.com/publications/scaling-static-analyses-at-facebook/)

- Facebook makes heavy use of static analysis tools integrated into the code review pipeline.
- **Infer** and **Zoncolan** use techniques similar to program verification but applied at Facebook's massive scale.
- The tools are integrated into engineering workflows to catch issues related to crashes and service security, performing complex interprocedural reasoning.

---

## Netflix

### Source 13: How We Build Code at Netflix (https://netflixtechblog.com/how-we-build-code-at-netflix-c5d9bd727f15)

- Netflix's approach to code building is shaped by their culture of **freedom and responsibility**.
- Engineers are empowered to craft solutions using whatever tools they feel are best suited to the task.
- For a tool to be widely accepted, it **must be compelling, add tremendous value, and reduce cognitive load**. Teams have freedom to implement alternative solutions but take on additional responsibility for maintaining them.
- Changes are reviewed through a **pull request process**, ensuring all code changes are reviewed and tested before merging to main.

### Source 14: Improving Pull Request Confidence for the Netflix TV App (https://netflixtechblog.medium.com/improving-pull-request-confidence-for-the-netflix-tv-app-b85edb05eb65)

- The Netflix TV app runs on millions of smart TVs, streaming players, gaming consoles, and set-top boxes.
- ~50 engineers contribute regularly; **~250 changes merged per month**.
- **Nearly 1,000 functional tests** run across a variety of devices and versions, resulting in several thousand test runs — **all run every time a PR is created, updated, or merged**.
- **Confidence scoring**: Side-by-side comparison of test results for the destination branch vs. the PR branch, providing developers with data on whether a change is safe to merge.
- Heavy focus on **test flakiness detection**: Using confidence data to identify unstable tests, analyze root causes, and improve test stability directly.

### Source 15: Netflix's Engineering Culture — Pragmatic Engineer Podcast (https://newsletter.pragmaticengineer.com/p/netflix)

- CTO Elizabeth Stone discusses Netflix's engineering culture.
- **No formal performance reviews** — continuous, candid feedback supplemented by annual 360-degree process for development (not evaluation).
- Engineers **make decisions without layers of approval**; managers practice "context, not control."
- Failures treated as learning opportunities with improvement efforts initiated organically by teams.
- **Minimal formal processes** — global guidelines exist for mission-critical systems, but engineering judgment is emphasized over exhaustive checklists or approval chains.
- Netflix hired only senior engineers for 25 years until 2023 when engineering levels were introduced.
- The high talent bar means less formal review process overhead is needed because engineers are "unusually responsible."

---

## Uber

### Source 16: uReview — Scalable, Trustworthy GenAI for Code Review at Uber (https://www.uber.com/blog/ureview/)

- Uber uses **Phabricator** (not GitHub) as its primary code review platform.
- Code reviews are a core component ensuring reliability, consistency, and safety across **tens of thousands of changes each week (~65,000 weekly code diffs across six monorepos)**.
- **uReview**: AI-powered code review platform that analyzes **over 90% of Uber's code diffs**.
- **Architecture**: Modular, multi-stage GenAI system called **Commenter** using prompt chaining to break code review into four sub-tasks:
  1. **Comment generation** (multiple specialized assistants: Standard, Best Practices, AppSec)
  2. **Filtering** (removes low-value comments)
  3. **Validation** (checks against false positives)
  4. **Deduplication** (removes redundant comments)
- **Key metrics**:
  - **75% of uReview's comments are marked as useful** by engineers.
  - **65% of posted comments are actually addressed** — outperforming human reviewers (51% address rate).
  - Saves approximately **1,500 developer hours weekly**.
- **False positive mitigation**: Explicitly combats the primary failure mode of AI review — two distinct sources identified: LLM hallucinations and technically-valid-but-contextually-inappropriate suggestions.
- **Why they built custom**: Off-the-shelf AI review tools were tightly coupled to GitHub and showed three critical issues on Uber's code: many false positives, low-value true positives, and inability to interact with internal systems.
- Filters out low-signal targets (config files, generated code, experimental directories) before analysis.

### Source 17: Uber AI-Augmented Code Review System — ZenML Database (https://www.zenml.io/llmops-database/ai-augmented-code-review-system-for-large-scale-software-development)

- Uber's system explicitly addresses reviewers being overloaded with increasing AI-generated code volume.
- The feedback loop is critical: engineers can flag comments as useful/not useful, which feeds back into the system.
- Measures "time a pull request spent waiting for review without any action" as a key health metric for distributed teams.

---

## Stripe

### Source 18: Inside Stripe's Engineering Culture, Part 2 — Pragmatic Engineer (https://newsletter.pragmaticengineer.com/p/stripe-part-2)

- Stripe processed **$817B of payments in 2022** (~$1.5M/minute), employs thousands of software engineers.
- **Operational excellence** is non-negotiable: API reliability consistently exceeds **99.999%**, reaching six nines (99.9999%) during Black Friday/Cyber Monday peak.
- **Massive testing infrastructure**: 50+ million lines of code. Each change verified within 15 minutes by running tests that would take **50 days on a single CPU**. In 2022, deployed core payments APIs **5,978 times (16.4/day)**. 1,100 deploys failed acceptance criteria and were **automatically rolled back**.
- **API review process**: Every change modifying Stripe's API must pass a strict review that goes far beyond normal code review. A **review board** staffed with cross-organizational engineers establishes guidelines, reviews designs and proposals for public-facing changes.
- **20-page design documents** are common during API review. Stakeholders are listed with checkboxes indicating review status. Debates continue asynchronously (threaded in documents) or in virtual meetings.
- Stripe encodes **unblocking fellow engineers** directly in code review expectations — collaboration is a core value.
- **Innersource**: Any Stripe developer can get involved in any project and share ideas/solutions, removing friction.
- **Slack usage policy**: Slack is not canonical long-term storage. Engineers are encouraged to create longer-term artifacts (Google Docs, internal pages). API review guidelines emphasize archiving important design decisions.
- Engineers wear a **"product hat"** — they participate in all parts of product development, not just coding.

### Source 19: Stripe's Monorepo Developer Environment — Made of Bugs (https://blog.nelhage.com/post/stripe-dev-environment/)

- Written by Nelson Elhage who worked at Stripe 2012-2019.
- Most of Stripe's codebase was Ruby in a **single large monorepo** with extensive code sharing across services.
- **Devbox architecture**: Every developer gets a centrally-provisioned, ephemeral EC2 instance. Devboxes spin up in **10 seconds** with code and services pre-loaded, isolated from production.
- **Sorbet LSP integration**: Stripe's Ruby typechecker runs on the devbox, providing IDE features (find definition, autocomplete) via VS Code over SSH.
- **`pay` command**: Central CLI tool for interacting with the monorepo (running tests, starting services, etc.). Integrates with the sync process to avoid testing against stale code.
- **Service management**: Each HTTP service assigned a local port. A frontend service terminates SSL and routes traffic. A proxy demand-starts services on first request. Autoloader tracks loaded files and auto-restarts on changes.
- **Developer productivity team** was staffed with excellent engineers and given significant investment to build and maintain this infrastructure.

### Source 20: Sorbet — Stripe's Type Checker for Ruby (https://stripe.dev/blog/sorbet-stripes-type-checker-for-ruby)

- Sorbet runs over Stripe's entire Ruby codebase: **15+ million lines of code across 150,000+ Ruby files**.
- Typechecks at approximately **100,000 lines per second per core** — one of the fastest production typecheckers known.
- Acts as automated code quality enforcement that catches type errors, missing validations, and API misuse before human review.

### Source 21: Minions — Stripe's AI Coding Agents (https://www.engineering.fyi/article/minions-stripe-s-one-shot-end-to-end-coding-agents)

- Over **1,000 PRs per week** at Stripe are fully agent-produced with no human-written code.
- Engineers can parallelize work by spinning up multiple AI agents simultaneously.
- AI agents handle routine changes; human review still applies.

---

## Cross-Company and Comparative Sources

### Source 22: Company-Specific Code Review Practices — Awesome Code Reviews (https://www.awesomecodereviews.com/companies/company-specific-code-review-practices/)

- **Google**: Lightning-fast reviews with 4-hour median turnaround. Official code review guidelines published.
- **Microsoft**: No single approach. Teams choose their own processes. Key best practices for fast, effective reviews.
- **Facebook**: Heavy use of static analysis (Infer, Zoncolan) integrated into the review pipeline.
- **Netlify**: "Feedback ladder" encoding severity as metaphors (sand = minor issue, rock = blocking problem).
- **Auth0**: Focuses on automation — clear quality criteria a PR must pass before manual review.

### Source 23: Good Code Reviews, Better Code Reviews — Pragmatic Engineer (https://blog.pragmaticengineer.com/good-code-reviews-better-code-reviews/)

- Author (Gergely Orosz, ex-Uber, ex-Microsoft) shares code review practices from over a decade of experience across big tech.
- Benefits: spot-checking for errors, learning from solutions, improving organizational tooling and automation.
- Emphasis on the distinction between "good" and "better" reviews — the latter involves deeper engagement with design decisions, not just surface-level checks.

### Source 24: Google's Engineering Practices Documentation (https://google.github.io/eng-practices/review/)

- Google's publicly published code review guidelines.
- **The Standard of Code Review**: "The primary purpose of code review is to make sure that the overall code health of Google's code base is improving over time."
- Reviewers should focus on: design, functionality, complexity, tests, naming, comments, style, and documentation.
- A reviewer should approve a change if it "definitely improves the overall code health of the system being worked on, even if it isn't perfect."

### Source 25: Human-AI Synergy in Agentic Code Review — IEEE (https://arxiv.org/search, found via Microsoft research references)

- Large-scale empirical analysis of **278,790 code review conversations** across 300 open-source GitHub projects.
- Compares feedback differences between human reviewers and AI agents.
- Investigates human-AI collaboration patterns in review conversations and how interaction shapes review outcomes.
- Demonstrates that AI and human reviewers have complementary strengths — AI excels at consistency and breadth, humans at context and judgment.

---

## Synthesis: Patterns Across Big Tech Code Review

### 1. Every Company Reviews Every Change

All six companies require code review before merging. This is universal across big tech, though the **rigor varies** — Google mandates three approval types (LGTM + owner + readability), while Netflix relies more on engineering judgment with minimal formal gates.

### 2. Small Changes Are the Common Denominator of Speed

- Google: 90% of reviews have <10 files, median ~24 lines changed.
- Meta: Stacked diffs enforce small, atomic changes by design.
- Stripe: Massive test infrastructure supports frequent small deploys (16.4/day).
- **Lesson**: Companies that achieve fast review cycles engineer their workflows to produce small changes, not just ask for them.

### 3. One Reviewer Is Usually Enough

- Google: 75%+ of reviews have a single reviewer.
- This is a conscious, company-wide tradeoff of rigor for speed.
- **Lesson**: Multiple reviewers add latency without proportional quality improvement. One qualified reviewer is better than two slow ones.

### 4. Automation Before Human Review

Every company front-loads automated checks before human eyes see the code:
- **Google**: Presubmit checks (tests, linters, formatters, static analysis) run before the reviewer is notified.
- **Meta**: Infer, Zoncolan, RacerD run interprocedural static analysis automatically.
- **Stripe**: Battery of tests that would take 50 days on one CPU completes in 15 minutes.
- **Microsoft**: PRAssistant (AI) covers 90% of PRs, catching low-value issues automatically.
- **Uber**: uReview AI analyzes 90% of diffs with specialized assistants.
- **Lesson**: The biggest productivity gain comes from ensuring humans never have to comment on things a machine could have caught.

### 5. AI Is Now a Standard Part of the Pipeline

- **Microsoft**: PRAssistant on 600K+ PRs/month.
- **Uber**: uReview on 65K+ diffs/week, 75% comments rated useful, 65% addressed.
- **Stripe**: 1,000+ PRs/week fully AI-agent-produced.
- **Google**: ML-powered suggestions integrated into Critique.
- **Lesson**: AI review is past the experimental stage. The key challenges are false positive control (Uber's explicit focus) and contextual appropriateness.

### 6. Tooling Is a First-Class Investment

Every company built or deeply customized their review tools:
- **Google**: Critique (97% satisfaction)
- **Microsoft**: CodeFlow, then PRAssistant
- **Meta**: Phabricator + Sapling + Infer + Zoncolan
- **Stripe**: Sorbet + devbox infrastructure + custom CLI
- **Uber**: Phabricator + uReview
- **Netflix**: Standard tools (GitHub PRs) but with custom confidence scoring and test infrastructure
- **Lesson**: Off-the-shelf tools are starting points. Competitive advantage comes from deep integration with internal workflows.

### 7. Review Is About Learning, Not Just Bug-Finding

- Microsoft research: only a tiny fraction of review comments are about bugs.
- Google: Education and knowledge dissemination are listed as primary motivations.
- Both companies: Knowledge transfer, mentoring, and maintaining norms are the real value.
- **Lesson**: A review pipeline that only checks for correctness misses most of the value. The best review processes also enforce style, teach patterns, and spread knowledge.

### 8. Stacked/Small Diff Workflows Beat Feature Branches

- Meta pioneered stacked diffs with Phabricator and later Sapling.
- Google's small CL culture achieves the same effect differently.
- Jackson Gabbard (ex-Facebook): stacked diffs are "a clearly higher-throughput workflow."
- **Lesson**: The review unit should be a small, atomic, independently reviewable change — not a large feature branch. The tooling should make this easy.

### 9. Explicit Turn-Taking Reduces Review Latency

- Google's "attention set" concept: at any moment, it is clear whose turn it is to act on a CL.
- This removes the ambiguity that causes reviews to stall — the single biggest source of delay.
- **Lesson**: Make review state machine transitions explicit. "Whose turn is it?" should never be ambiguous.

### 10. Culture Is the Multiplier

- Netflix: Minimal formal process, but hires "unusually responsible" people and relies on engineering judgment.
- Google: Published guidelines set expectations company-wide.
- Stripe: Encodes unblocking colleagues directly in review expectations.
- Microsoft: Emphasizes inclusive review culture and learning.
- **Lesson**: Tools and process are necessary but insufficient. The culture around review — speed expectations, learning orientation, unblocking ethos — determines whether the system actually works.

---

## Implications for Wazir's Review Pipeline

1. **Front-load automation**: Run all automated checks (lint, type, test, static analysis) before any human or AI reviewer sees the change. Wazir's review phase should guarantee this sequencing.
2. **AI review as first pass**: Following Microsoft and Uber's pattern, an AI reviewer should handle the first pass, catching low-value issues and generating structured feedback. Human review then focuses on design, architecture, and context.
3. **Small change enforcement**: The pipeline should encourage or enforce small, atomic changes. Stacked diff workflows are the gold standard.
4. **Explicit review state**: Adopt attention-set semantics. The review phase should always make clear who needs to act next.
5. **One reviewer default**: Unless the change touches a sensitive area (security, API surface), one qualified reviewer should be sufficient.
6. **Knowledge transfer as a goal**: Review feedback should include educational context, not just pass/fail signals. Wazir's review output should capture and surface patterns for team learning.
7. **Feedback loops on review quality**: Both Google (Not useful button) and Uber (usefulness ratings) measure review comment quality. The pipeline should track which review comments are actually addressed vs. dismissed.
8. **Context-aware review**: Microsoft and Uber both emphasize that generic AI review without repo-specific context produces false positives. Wazir's review pipeline should incorporate project-specific guidelines and past review patterns.
