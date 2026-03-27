# Academic Papers on Code Review Effectiveness and Practices

Research date: 2026-03-25

---

## 1. Modern Code Review: A Case Study at Google

**URL/DOI:** [https://dl.acm.org/doi/10.1145/3183519.3183525](https://dl.acm.org/doi/10.1145/3183519.3183525)
**Authors:** Caitlin Sadowski, Emma Soderberg, Luke Church, Michal Sipko, Alberto Bacchelli
**Year:** 2018
**Venue:** ICSE-SEIP 2018 (ACM/IEEE 40th International Conference on Software Engineering: Software Engineering in Practice)

### Key Findings

- Analyzed 9 million reviewed changes at Google using 12 developer interviews, a 44-person survey, and review log analysis.
- Google's internal code review tool is called Critique; every change must be reviewed before commit.
- Two key institutional mechanisms: **ownership** (directory owners must approve changes) and **readability** (language-specific certification ensuring consistent style).
- The majority of changes are small: over 35% modify only a single file.
- Over 80% of changes involve at most one review iteration (one round-trip).
- During the week, **70% of changes are committed less than 24 hours** after being mailed for review.
- Overall median latency for the entire review process is **under 4 hours**.
- Typically only **one reviewer** is required to satisfy ownership and readability requirements.
- Although finding bugs is important, the **normative effects** (codebase consistency) and **educational effects** (knowledge sharing) are rated as more important by developers.
- Developer satisfaction with the review process is high despite the mandatory nature.

---

## 2. Expectations, Outcomes, and Challenges of Modern Code Review

**URL/DOI:** [https://dl.acm.org/doi/10.5555/2486788.2486882](https://dl.acm.org/doi/10.5555/2486788.2486882) / [IEEE](https://ieeexplore.ieee.org/document/6606617/)
**Authors:** Alberto Bacchelli, Christian Bird
**Year:** 2013
**Venue:** ICSE 2013 (35th International Conference on Software Engineering)

### Key Findings

- Mixed-methods study at Microsoft: surveyed 165 managers and 873 programmers, interviewed 17 developers across 16 product teams, manually classified 570 CodeFlow review comments.
- **Finding defects is the primary stated motivation** for code review, but the actual outcomes diverge: reviews catch fewer defects than expected.
- Most "defect" comments concern **uncomplicated logical errors** (corner cases, operator precedence, exception handling), not deep architectural bugs.
- The real, often underappreciated benefits are: **knowledge transfer**, **increased team awareness**, **creation of alternative solutions**, and **code improvement**.
- 39% of programmers ranked "code improvement" as their primary motivation; 31% of managers agreed.
- **Code and change understanding is the key activity** during review; developers employ many mechanisms to understand changes, most of which are not well-supported by existing tools.
- There is a mismatch between what managers want (catching severe defects) and what reviews actually deliver (low-level defects plus substantial non-defect benefits).
- This is the most cited modern code review paper and established the foundational framework for studying review motivations vs. outcomes.

---

## 3. Convergent Contemporary Software Peer Review Practices

**URL/DOI:** [https://dl.acm.org/doi/10.1145/2491411.2491444](https://dl.acm.org/doi/10.1145/2491411.2491444)
**Authors:** Peter C. Rigby, Christian Bird
**Year:** 2013
**Venue:** ESEC/FSE 2013 (9th Joint Meeting on Foundations of Software Engineering)

### Key Findings

- Most diverse peer review study to date: examined Google (Android, Chromium OS), Microsoft (Bing, Office, MS SQL), AMD projects, contrasted with Lucent (traditional inspection) and six open-source projects (Apache, Linux, KDE, etc.).
- Despite drastically different settings, cultures, incentive systems, and time pressures, **review parameters converge independently** to similar values across all projects.
- The number of involved reviewers **converges to two** across projects, regardless of whether reviewers are explicitly invited or self-select.
- Review intervals are short and converge to similar durations across projects.
- Introduced a quantitative measure of **knowledge sharing during review**: peer review increases the number of distinct files a developer knows about by **66% to 150%** depending on the project.
- Contemporary peer review is fundamentally different from Fagan-style inspections: smaller changes, fewer reviewers, faster turnaround.
- One of the first studies of contemporary review inside proprietary software firms.

---

## 4. Code Reviewing in the Trenches: Understanding Challenges and Best Practices

**URL/DOI:** [https://ieeexplore.ieee.org/document/7950877/](https://ieeexplore.ieee.org/document/7950877/) (DOI: 10.1109/MS.2017.265100500)
**Authors:** Laura MacLeod, Michaela Greiler, Margaret-Anne Storey, Christian Bird, Jacek Czerwonka
**Year:** 2018
**Venue:** IEEE Software, Vol. 35, No. 4

### Key Findings

- Interviewed 18 developers and surveyed 911 developers at Microsoft; provides the most comprehensive industrial developer survey on code review challenges.
- The **five main challenges** developers face: (1) receiving feedback in a timely manner, (2) review size, (3) managing time constraints, (4) understanding the code's purpose and motivation for the change, (5) obtaining insightful (not superficial) feedback.
- 73% of teams are fully co-located; 86% are co-located with at least half of their review peers.
- 89% use CodeFlow as their primary review tool.
- Becoming effective at code reviews in a new workplace can **take up to a year** due to the need to understand codebase, team norms, and tooling ecosystem.
- Reviewers must navigate between issue trackers, requirements databases, KANBAN boards, team chats, API documentation, and CI reports to gather context -- a major cognitive burden.
- Best practice: review comments must be **constructive and respectful**.
- Lessons learned about code reviewing are widely dispersed and poorly summarized; practitioners struggle to identify which challenges and best practices apply to their context.

---

## 5. Characteristics of Useful Code Reviews: An Empirical Study at Microsoft

**URL/DOI:** [https://ieeexplore.ieee.org/document/7180075/](https://ieeexplore.ieee.org/document/7180075/) (DOI: 10.1109/MSR.2015.21)
**Authors:** Amiangshu Bosu, Michaela Greiler, Christian Bird
**Year:** 2015
**Venue:** MSR 2015 (IEEE/ACM 12th Working Conference on Mining Software Repositories)

### Key Findings

- Three-stage mixed research study: qualitatively investigated what makes reviews useful, built a classifier to distinguish useful from not-useful comments, then applied it to 1.5 million review comments from five Microsoft projects.
- The **proportion of useful comments made by a reviewer increases dramatically in the first year** at the company, then plateaus -- experience in the specific codebase matters more than general experience.
- The **more files in a change, the lower the proportion of useful comments** -- large changes dilute review quality.
- Useful comments are more likely to come from reviewers who have **recently changed the same files**.
- Three key areas for future research: (1) exploring non-technical benefits of reviews, (2) helping developers articulate review comments better, (3) assisting reviewer program comprehension.
- Established empirical evidence that review usefulness is predictable and measurable, enabling tooling to guide reviewers toward higher-quality feedback.

---

## 6. The Impact of Code Review Coverage and Code Review Participation on Software Quality

**URL/DOI:** [https://dl.acm.org/doi/10.1145/2597073.2597076](https://dl.acm.org/doi/10.1145/2597073.2597076) (DOI: 10.1145/2597073.2597076)
**Authors:** Shane McIntosh, Yasutaka Kamei, Bram Adams, Ahmed E. Hassan
**Year:** 2014
**Venue:** MSR 2014 (11th Working Conference on Mining Software Repositories) -- **Distinguished Paper Award**

### Key Findings

- Case study of the Qt, VTK, and ITK open-source projects examining the link between code review practices and post-release defects.
- **Low code review coverage** (proportion of changes that are reviewed) produces components with **up to 2 additional post-release defects**.
- **Low code review participation** (degree of reviewer involvement) produces components with **up to 5 additional post-release defects**.
- Coverage below 29% results in at least one expected bug; for one project, coverage below 60% already yields at least one bug.
- Empirically confirms the intuition that **poorly-reviewed code degrades software quality** in large systems using modern reviewing tools.
- Extended in a 2016 journal version in Empirical Software Engineering (Springer) with additional analysis of reviewer expertise effects.

---

## 7. Four Eyes Are Better Than Two: On the Impact of Code Reviews on Software Quality

**URL/DOI:** [https://ieeexplore.ieee.org/document/7332454/](https://ieeexplore.ieee.org/document/7332454/) (DOI: 10.1109/ICSM.2015.7332454)
**Authors:** Gabriele Bavota, Barbara Russo
**Year:** 2015
**Venue:** ICSME 2015 (IEEE International Conference on Software Maintenance and Evolution), pp. 81-90

### Key Findings

- Empirically investigated the relationship between code review and software quality (bug-inducing changes).
- **Patches with lower review participation have a higher chance of inducing bug fixes**, confirming that thorough code review participation is associated with higher quality code.
- The **number of invited reviewers has a statistically significant impact** on review bugginess.
- Code components with **high review coverage tend to be less involved in post-release fixing activities**.
- Complementary to the McIntosh et al. (2014) study, providing converging evidence from different projects that review participation directly affects defect rates.

---

## 8. Does Code Review Speed Matter for Practitioners?

**URL/DOI:** [https://link.springer.com/article/10.1007/s10664-023-10401-z](https://link.springer.com/article/10.1007/s10664-023-10401-z) / [arXiv:2311.02489](https://arxiv.org/abs/2311.02489)
**Authors:** Gunnar Kudrjavets, Ayushi Rastogi, Nachiappan Nagappan
**Year:** 2024
**Venue:** Empirical Software Engineering (Springer), also presented as journal-first at ICSE 2024

### Key Findings

- Surveyed 75 industry practitioners and 36 open-source developers about their beliefs and experiences regarding code review speed.
- **Quick reaction time is of utmost importance** -- applies to both tooling infrastructure and the behavior of other engineers.
- **Time-to-merge is the essential code review metric** practitioners want to improve.
- Industry and open-source communities hold **similar beliefs** about review speed importance.
- Engineers are **divided about the benefits of increased code velocity for their career growth**.
- The **controlled application of the commit-then-review model** (where code is merged before full review in trusted environments) can increase code velocity.
- Challenges a widespread belief: pull request size and composition do **not reliably relate** to time-to-merge (from their complementary study).

---

## 9. Review Participation in Modern Code Review

**URL/DOI:** [https://link.springer.com/article/10.1007/s10664-016-9452-6](https://link.springer.com/article/10.1007/s10664-016-9452-6) (DOI: 10.1007/s10664-016-9452-6)
**Authors:** Patanamon Thongtanunam, Shane McIntosh, Ahmed E. Hassan, Hajimu Iida
**Year:** 2017
**Venue:** Empirical Software Engineering, Vol. 22, pp. 768-817

### Key Findings

- Case study of **196,712 reviews** across Android, Qt, and OpenStack open-source projects.
- Investigated characteristics of patches that: (1) do not attract reviewers, (2) are not discussed, and (3) receive slow initial feedback.
- **Past review participation is the strongest predictor** of future review engagement on a patch.
- **New feature introductions increase the probability of receiving slow initial feedback** -- novel code is harder to find reviewers for.
- Patch authors can increase review participation by: preparing **small patches**, providing **descriptive subjects**, and writing **clear change log messages**.
- Review participation shares a significant relationship with software quality, linking back to the McIntosh et al. (2014) quality findings.

---

## 10. A Systematic Literature Review and Taxonomy of Modern Code Review

**URL/DOI:** [https://www.sciencedirect.com/science/article/abs/pii/S0164121221000480](https://www.sciencedirect.com/science/article/abs/pii/S0164121221000480) / [arXiv:2103.08777](https://arxiv.org/abs/2103.08777)
**Authors:** Nicole Davila, Ingrid Nunes
**Year:** 2021
**Venue:** Journal of Systems and Software, Vol. 177, 110951

### Key Findings

- Systematic literature review selecting from four digital libraries, analyzing **139 papers** on modern code review (MCR).
- Papers organized into three categories: **foundational studies** (analyzing existing MCR data), **proposals** (techniques and tools to support MCR), and **evaluations** (assessments of approaches).
- **Foundational studies are the most represented category**, mainly aiming to understand motivations, challenges, benefits, and influence factors of MCR.
- Identified key research themes: reviewer recommendation, automated review, review comment analysis, review process optimization.
- Provides a structured taxonomy for navigating the code review research landscape.
- Highlights that the field is mature enough for tool proposals but gaps remain in understanding human and social factors.

---

## 11. Modern Code Reviews -- Survey of Literature and Practice

**URL/DOI:** [https://dl.acm.org/doi/10.1145/3585004](https://dl.acm.org/doi/10.1145/3585004) / [arXiv:2403.00088](https://arxiv.org/abs/2403.00088)
**Authors:** Deepika Badampudi, Michael Unterkalmsteiner, Ricardo Britto
**Year:** 2023
**Venue:** ACM Transactions on Software Engineering and Methodology (TOSEM), Vol. 32, No. 4, Article 107

### Key Findings

- Most comprehensive survey to date: systematic mapping study of **244 primary studies** through 2021, plus practitioner survey with **1,300 data points** using Q-Methodology.
- Five identified research themes: product quality impact, MCR process properties, human factors, support systems, and review artifacts.
- Practitioners are **positive about research on product quality impact and MCR process properties**.
- Practitioners are **negative about human factors and support systems research**, indicating a **misalignment between the state of the art and what practitioners consider important**.
- The most impactful research papers (by citation) focus on defect detection and process characteristics, while the least explored area (relative to practitioner interest) is human factors.
- Proposes future MCR research avenues based on the gap analysis between academic focus and practitioner needs.

---

## 12. Destructive Criticism in Software Code Review Impacts Inclusion

**URL/DOI:** [https://dl.acm.org/doi/abs/10.1145/3555183](https://dl.acm.org/doi/abs/10.1145/3555183) (DOI: 10.1145/3555183)
**Authors:** Sanuri Dananja Gunawardena, Peter Devine, Isabelle Beaumont, Lola Garden, Emerson Murphy-Hill, Kelly Blincoe
**Year:** 2022
**Venue:** Proceedings of the ACM on Human-Computer Interaction, Vol. 6, CSCW2 (ACM CSCW 2022)

### Key Findings

- Surveyed 93 software practitioners using vignettes (hypothetical scenarios) of constructive vs. destructive review criticism.
- **Destructive criticism is common**: more than half of respondents received nonspecific negative feedback, and nearly a quarter received inconsiderate negative feedback in the past year.
- **Women and non-binary participants perceive destructive criticism as less appropriate** than men and are **less motivated to continue working with the criticizer**.
- Results suggest destructive criticism in code review **could contribute to the lack of gender diversity** in the software industry.
- Negative impacts span: team dynamics, individual motivation and confidence, and diversity/inclusion.
- Developers **disagree on comment tone**: some advocate for politeness, others say direct/harsh feedback is easier to parse and act on.
- Highlights the need for code review tools and policies to address tone and interpersonal dynamics, not just technical content.

---

## 13. Design and Code Inspections to Reduce Errors in Program Development

**URL/DOI:** [https://dl.acm.org/doi/10.1147/sj.153.0182](https://dl.acm.org/doi/10.1147/sj.153.0182) (DOI: 10.1147/sj.153.0182)
**Authors:** Michael E. Fagan
**Year:** 1976
**Venue:** IBM Systems Journal, Vol. 15, No. 3, pp. 182-211

### Key Findings

- **The foundational paper** that established formal code inspection as a software engineering practice.
- Formal inspections at IBM detected **up to 93% of defects** in evaluated programs.
- In a COBOL application, design and code inspections found **38 defects per thousand non-commentary source statements** vs. only **8 defects per KNCSS** found by unit testing alone -- total detection efficiency of 82%.
- Defined structured inspection roles: moderator, author, reviewer, scribe.
- Errors found early via inspection avoided rework costs **10x to 100x higher** if discovered in later stages.
- Demonstrated that "substantial net improvements in programming quality and productivity" come from systematic verification with well-defined participant roles.
- All modern code review research traces its lineage to this paper; contemporary "lightweight" review evolved from relaxing Fagan's formal process while preserving its core benefits.

---

## Synthesis

### The Evolution of Code Review (1976-2024)

Code review has undergone a fundamental transformation from Fagan's formal inspections (1976) to today's lightweight, tool-assisted modern code review (MCR). Fagan's inspections were meeting-based, role-heavy, and document-centric. Modern code review, as practiced at Google, Microsoft, and major open-source projects, is asynchronous, tool-mediated, and change-based. Rigby and Bird (2013) showed that despite this evolution, review parameters have independently converged across very different organizations.

### What Reviews Actually Deliver (vs. What We Expect)

The most robust finding across the literature is the **expectation-outcome gap** identified by Bacchelli and Bird (2013): teams adopt code review primarily to find defects, but the defects caught are mostly low-level. The real value comes from:

- **Knowledge transfer and team awareness** -- Rigby and Bird (2013) quantified that review increases file familiarity by 66-150%.
- **Code quality improvement** (style, readability, maintainability) -- up to 75% of review comments address evolvability, not bugs.
- **Normative effects** -- Sadowski et al. (2018) found that at Google, codebase consistency and education are rated more important than bug-finding.

### Review Quality Is Measurable and Predictable

Several studies have established quantitative links between review practices and outcomes:

- **Coverage matters**: McIntosh et al. (2014) showed that low review coverage produces up to 2 extra post-release defects per component; low participation produces up to 5.
- **Participation matters**: Bavota and Russo (2015) confirmed that patches with fewer reviewers have higher bug-induction rates.
- **Usefulness is predictable**: Bosu et al. (2015) demonstrated that reviewer tenure, file familiarity, and change size predict whether comments will be useful.

### Speed vs. Thoroughness: A False Dichotomy

The research does not support a simple speed-quality tradeoff:

- At Google, 70% of changes merge within 24 hours with median latency under 4 hours (Sadowski et al., 2018), yet quality is maintained through ownership and readability mechanisms.
- Kudrjavets et al. (2024) found that quick reaction time matters most to practitioners; time-to-merge is the metric they want to optimize.
- Thongtanunam et al. (2017) showed that small, well-described patches attract faster and better review participation.
- The key insight: **fast reviews are not shallow reviews** -- they result from small changes, clear descriptions, and institutional mechanisms that distribute review knowledge.

### The Human Dimension Is Underserved

Badampudi et al. (2023) identified a critical misalignment: practitioners rate human factors as important, but academic research underinvests in this area. Key human concerns include:

- **Destructive criticism** is common and damages inclusion (Gunawardena et al., 2022).
- **Understanding the change** is the hardest and most time-consuming task (MacLeod et al., 2018; Bacchelli and Bird, 2013).
- **Reviewer onboarding** takes up to a year to become effective in a new codebase (MacLeod et al., 2018).
- **Review fatigue** increases with change size, reducing comment quality (Bosu et al., 2015).

### Implications for Automated and AI-Assisted Review

The literature points to clear opportunities for automation:

1. **Context provision**: The biggest reviewer pain point is understanding the change. Tools that automatically provide relevant context (related issues, test results, historical changes) address the core bottleneck identified by Bacchelli and Bird (2013) and MacLeod et al. (2018).
2. **Small change enforcement**: Multiple studies confirm that smaller changes get better reviews faster. Automated size gates are empirically justified.
3. **Reviewer matching**: Bosu et al. (2015) showed that file familiarity predicts usefulness; Thongtanunam et al. (2017) showed that past participation predicts engagement. Both support automated reviewer recommendation.
4. **Tone and inclusion**: Gunawardena et al. (2022) motivate automated tone checking and respectful-review reminders.
5. **Coverage tracking**: McIntosh et al. (2014) and Bavota and Russo (2015) justify tooling that monitors and alerts on review coverage gaps.

### Key Quantitative Benchmarks from the Literature

| Metric | Value | Source |
|--------|-------|--------|
| Median review latency at Google | < 4 hours | Sadowski et al. 2018 |
| Changes merged < 24h at Google | 70% | Sadowski et al. 2018 |
| Typical number of reviewers (converged) | 2 | Rigby and Bird 2013 |
| Knowledge sharing increase from review | 66-150% | Rigby and Bird 2013 |
| Extra defects from low review coverage | up to 2 per component | McIntosh et al. 2014 |
| Extra defects from low review participation | up to 5 per component | McIntosh et al. 2014 |
| Defect detection rate (Fagan inspections) | up to 93% | Fagan 1976 |
| Reviewer effectiveness ramp-up time | ~1 year | Bosu et al. 2015; MacLeod et al. 2018 |
| Developers receiving destructive criticism | > 50% annually | Gunawardena et al. 2022 |
| Review comments addressing evolvability (not bugs) | up to 75% | Multiple studies |
