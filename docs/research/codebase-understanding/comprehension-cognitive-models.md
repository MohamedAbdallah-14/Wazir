# Codebase Comprehension

Research synthesis on how developers understand codebases, the cognitive science behind program comprehension, and actionable strategies for AI agents assisting with code understanding tasks.

---

## Key Findings

### 1. Developers Spend the Majority of Their Time on Comprehension

- Xia et al. (2018) conducted a large-scale field study across 7 real projects with 78 professional developers, totaling 3,148 working hours. They found that **developers spend on average ~58% of their time on program comprehension activities**. Developers frequently use web browsers and document editors (not just IDEs) to perform comprehension tasks.
- Ko et al. found that developers spend **35% of their time on the mechanics alone of foraging between code fragments** — navigating, searching, and switching between files.
- Maalej et al. (2014) confirmed that most of a software engineer's time is spent reading code, not writing it.
- Studies of software engineers in their first year at a new job show that **a significant majority of their time is spent trying to comprehend the architecture** of the system they are building or maintaining (Dagenais et al. 2010).
- Senior developers spend significantly less time on program comprehension than junior developers (Xia et al. 2018).

### 2. Comprehension Is Hard — Developers Avoid It When Possible

- Roehm et al. (2012) found that developers **avoid deep comprehension when they can**, relying on explanations from other developers rather than trying to build precise models of how a program works on their own.
- Developers follow **pragmatic comprehension strategies depending on context** and try to avoid comprehension whenever possible, often putting themselves in the role of users by inspecting graphical interfaces.
- Over 50% of developers' navigation choices produced **less value than they had predicted**, and nearly 40% cost more than they had predicted (Piorkowski et al. 2016).

### 3. Expert vs. Novice Differences Are Profound

- **Experts** detect familiar programming patterns and "beacons" in code far more effectively than novices. Their performance deteriorates when code order is unexpected or conventions are violated.
- **Novices** rely more on bottom-up reading (line-by-line), while experts can deploy top-down strategies when the domain is familiar.
- Expert programmers chunk information into larger meaningful units. Where a novice sees individual lines, an expert sees a "binary search" or "observer pattern." This chunking is the hallmark of expertise (Soloway & Ehrlich 1984).
- Experts' performance advantage comes from **pattern-based long-term memory retrieval**, not superior working memory capacity.

### 4. Working Memory Is the Fundamental Bottleneck

- Miller (1956) established the "7 plus or minus 2" limit on working memory items. More recent research (Cowan 2001) revises this to approximately **4 plus or minus 1 chunks**.
- Any non-trivial software system exceeds what even the most experienced developer can hold in working memory simultaneously.
- Chunking — grouping individual elements into meaningful patterns — is the primary mechanism for overcoming working memory limits. As expertise grows, chunks become larger and more abstract.

---

## Comprehension Models

### Brooks' Top-Down Model (1983)

**"Towards a Theory of the Comprehension of Computer Programs"** — International Journal of Man-Machine Studies, 18, 543-554.

Brooks proposed that program comprehension is a **top-down, hypothesis-driven** process:
1. The programmer begins with a **vague, general hypothesis** about the program's purpose (derived from documentation, task description, or prior knowledge).
2. This hypothesis is progressively **refined and subdivided** into finer sub-hypotheses.
3. Sub-hypotheses are refined until they can be **bound to specific code segments** and validated.
4. The programmer scans code searching for **"beacons"** — key features that serve as typical indicators of a particular structure or operation (e.g., a swap operation suggests sorting, a counter increment suggests iteration).

**When it applies:** When the programmer is familiar with the application domain and/or programming language. Works best for well-structured, conventional code.

**Limitation:** Brooks did not carry out formal empirical evaluation, though subsequent researchers have confirmed the model's applicability in domain-familiar contexts.

### Shneiderman & Mayer's Syntactic/Semantic Model (1979)

**"Syntactic/Semantic Interactions in Programmer Behavior"** — International Journal of Computer and Information Sciences, 8(3), 219-238.

Proposed a cognitive framework with two types of knowledge stored in long-term memory:

1. **Syntactic knowledge** — language-specific, surface-level knowledge about syntax rules. Acquired through memorization, easily forgotten, language-dependent.
2. **Semantic knowledge** — general, meaningful understanding independent of any particular programming language. Hierarchically organized from low-level (loops, conditionals) to high-level (algorithms, design patterns).

Comprehension involves **converting syntactic forms into internal semantic representations** in working memory. Novices struggle more with syntactic complexity; experts can rapidly convert surface syntax into semantic meaning.

### Soloway & Ehrlich's Plans and Rules of Discourse (1984)

**"Empirical Studies of Programming Knowledge"** — IEEE Transactions on Software Engineering.

Expert programmers possess two types of programming knowledge:

1. **Programming plans** — generic program fragments representing stereotypic action sequences (e.g., "running total loop," "sentinel-controlled read loop," "search and exit pattern").
2. **Rules of programming discourse** — conventions governing how plans are composed into programs (e.g., "variable names should reflect function," "don't include code that won't be executed," "place initialization close to usage").

Key insight: Programmers have **strong expectations** that other programmers will follow discourse rules. When rules are violated, the cognitive advantage from pattern recognition is effectively nullified. This explains why unconventional code is disproportionately harder to understand.

### Letovsky's Cognitive Model (1987)

**"Cognitive Processes in Program Comprehension"** — Journal of Systems and Software, 7(4), 325-339.

Letovsky proposed that programmers use both bottom-up and top-down strategies, with three main components:

1. **Knowledge base** — contains programming expertise, problem-domain knowledge, rules of discourse, plans, and goals.
2. **Mental model** — the programmer's current understanding, organized in three layers:
   - **Specification layer** (highest abstraction): program goals and requirements
   - **Implementation layer** (lowest abstraction): data structures and functions
   - **Annotation layer**: relationships and connections between specification and implementation
3. **Assimilation process** — uses the knowledge base to enrich the mental model through formulating **why, how, and what conjectures** to fill gaps:
   - **Why** — "Why is this code here? What purpose does it serve?"
   - **How** — "How is this functionality implemented?"
   - **What** — "What does this code segment do?"

Conjectures are verified or refuted against source code, documentation, and existing knowledge. This inquiry-driven process is central to how understanding accumulates.

### Pennington's Bottom-Up Model (1987)

**"Stimulus Structures and Mental Representations in Expert Comprehension of Computer Programs"** — Cognitive Psychology.

Based on van Dijk and Kintsch's model of text understanding:

1. Programmers first develop a **control-flow abstraction** (the "textbase") — capturing the sequence of operations.
2. Bottom-up construction continues by **recognizing semantic relationships** among chunks already constructed, joining them into larger, higher-level chunks.
3. Two levels of representation:
   - **Textbase** — what is literally in the code and how it is structured
   - **Situation model** — the real-world situation the code represents (domain model)
4. Cross-referencing between textbase and situation model deepens understanding.

**When it applies:** When the programmer is unfamiliar with the domain. Natural first approach for unknown codebases.

### Von Mayrhauser & Vans' Integrated Metacognition Model (1995)

**"Program Comprehension During Software Maintenance and Evolution"** — IEEE Computer, 28(8), 44-55.

The most comprehensive model, synthesizing prior work. Four major components:

1. **Program Model** — understanding at the code level (control flow, data flow, individual statements)
2. **Situation Model** — understanding at the domain level (real-world entities and relationships the code represents)
3. **Top-Down Model** — understanding driven by application domain knowledge (goals, plans, hypotheses)
4. **Knowledge Base** — programmer's accumulated expertise (prerequisite for constructing the other three)

Key contribution: Programmers **dynamically switch between all three comprehension processes** (program, situation, top-down) as needed. The switching is opportunistic, not predetermined. This was validated through "think aloud" protocols with industrial developers during maintenance tasks.

**This is the most empirically validated model** and best explains real-world comprehension behavior, which is messy, interleaved, and context-dependent.

### Storey's Cognitive Design Elements Framework (2006)

**"Theories, Tools and Research Methods in Program Comprehension: Past, Present and Future"** — Software Quality Journal, 14, 187-208.

Storey synthesized program comprehension theories into a hierarchy of **cognitive design elements** that should be considered in tool design:

- Theories and tools are related — tools should be designed to support the cognitive processes identified by comprehension theories.
- The framework distinguishes comprehension factors along three dimensions: **human characteristics** (expertise, working memory), **program characteristics** (size, structure, naming), and **task context** (maintenance type, time pressure).
- Tools should support both top-down and bottom-up navigation, provide multiple abstraction levels, and reduce the cognitive overhead of switching between representations.

---

## Practical Strategies

### Strategy 1: Question-Driven Comprehension (Sillito et al. 2006)

Sillito, Murphy, and De Volder catalogued **44 types of questions** programmers ask during software evolution tasks, organized into four progressive categories:

**Category 1 — Finding Initial Focus Points:**
- "Where in the code is the text in this error message or UI element?"
- "Which type represents this domain concept?"
- "Is there an entity named something like this?"

**Category 2 — Building on Initial Points (Expanding Outward):**
- "What are the parts of this type?"
- "Where does this type fit in the type hierarchy?"
- "Where is this method called or type referenced?"
- "When during execution is this method called?"
- "Where are instances of this class created?"

**Category 3 — Building a Model of Connected Information:**
- "What is the sequence of execution through these methods?"
- "What data flows through this part of the system?"
- "How do these types or methods relate?"

**Category 4 — Integrating Across Models:**
- "What are the design patterns or architectural decisions?"
- "How does this subsystem interact with others?"
- "What is the overall control flow and data flow?"

This question taxonomy maps directly to how understanding deepens progressively.

### Strategy 2: Concept Location and Feature Location

Rajlich and Wilde (2002) established **concept location** as a fundamental program comprehension activity:

1. Start with a **change request or feature description** (a concept in the domain).
2. **Locate** where that concept is implemented in source code.
3. Use located code as a **starting point** to understand related code through dependencies.

This is critical because concept location **precedes a large proportion of code changes**. It is also part of bug localization, traceability recovery, and component reuse.

Techniques include: grep/text search for domain terms, dynamic analysis (running the feature and observing execution), static analysis (following call graphs and data flow), and increasingly, LLM-based semantic search.

### Strategy 3: Information Foraging (Ko, Piorkowski, Burnett)

**Information Foraging Theory (IFT)** treats developer navigation during code comprehension as analogous to a predator following scent to find prey:

- Developers follow **"information scent"** — cues in names, structure, and documentation that suggest relevant information lies ahead.
- When scent is strong (good naming, clear structure, visible documentation), navigation is efficient.
- When scent is weak (poor naming, tangled dependencies, missing docs), developers make costly wrong turns.
- **Topology** — the structure of links between code artifacts — determines how easily developers can navigate.

Key implication: Code and tools should be designed to **maximize information scent** — clear naming, visible entry points, well-structured navigation paths.

### Strategy 4: Hierarchical Decomposition (CodeMap / Gao et al. 2025)

Research with professional **code auditors** (who onboard new codebases daily/weekly) identified four design opportunities:

1. **Automated information extraction** — automatically identify entry points, key modules, dependency structures, and architectural patterns.
2. **Decomposition** — break the codebase into cognitively manageable hierarchical layers (project -> modules -> classes -> methods).
3. **Representation** — provide visual/structured representations aligned with human cognitive flow (hierarchical maps, dependency graphs).
4. **Interaction design** — reduce manual effort and conversational distraction; enable interactive zooming between abstraction levels.

Their system, CodeMap, reduced reliance on reading LLM text responses by 79% and increased map usage time by 90% compared to static visualization tools. Novice developers showed the greatest benefit in reduced unpurposeful exploration.

### Strategy 5: Cognitive Load Management

Based on Sweller's Cognitive Load Theory (1988), three types of cognitive load affect comprehension:

1. **Intrinsic load** — the inherent difficulty of the material (code complexity, domain complexity). Cannot be eliminated, only managed through chunking and sequencing.
2. **Extraneous load** — unnecessary cognitive overhead from poor presentation, tooling friction, irrelevant information. Should be minimized aggressively.
3. **Germane load** — productive cognitive effort spent building mental schemas. Should be maximized by directing attention to meaningful patterns.

Applied to codebase comprehension:
- **Reduce extraneous load:** Remove irrelevant details, provide focused context windows, filter noise.
- **Manage intrinsic load:** Present information in layers of increasing detail. Start with high-level architecture before diving into implementation.
- **Maximize germane load:** Highlight patterns, draw connections between components, emphasize "why" not just "what."

### Strategy 6: Code Review Comprehension (Goncalves et al. 2025)

Extending Letovsky's model to code review, researchers found:

1. **Context-building phase** — reviewers first build context by reading the PR description, commit messages, related issues, and skimming the overall change.
2. **Code inspection phase** — involves code reading, testing, and discussion management.
3. **Mental model construction** — reviewers construct a mental model of the change **as an extension** of their understanding of the overall software system.
4. **Contrast strategy** — reviewers contrast mental representations of **expected/ideal solutions** against the **actual implementation** to identify issues.
5. **Opportunistic strategy** — review strategies are opportunistic, switching between top-down and bottom-up as needed, not following a fixed sequence.

### Strategy 7: Hands-On Exploration (GitHub Engineering Blog 2025)

Practical strategies from GitHub engineers for onboarding to new codebases:

1. **Start with "Good First Issues"** — smaller, well-defined tasks that provide natural entry points without overwhelming. Deliver immediate value while learning.
2. **Explore through testing** — make deliberate modifications and observe effects. Write new tests to verify understanding. Intentionally break things (in development) to see how the system fails.
3. **Analyze telemetry and metrics** — study how the system behaves in production, what patterns emerge during peak usage, which components get the most attention.
4. **Pair programming** — actively participate (not just observe) with experienced team members. Note which files they frequently access, learn their debugging strategies, absorb workflow context.
5. **Deep domain understanding** — gather information from product owners, customer insights, and industry best practices. Understanding the "why" behind the code is key.
6. **Document as you learn** — writing documentation forces you to organize what you've learned and reveals gaps in understanding.

### Strategy 8: Eye-Tracking Insights on Code Reading

Empirical eye-tracking studies reveal:

- Code navigation and editing occupy only a **small fraction** of developers' time; the vast majority is spent **reading and understanding** source code.
- Developers exhibit **non-linear reading patterns** — they jump between function definitions, call sites, and data declarations rather than reading sequentially.
- Effective comprehension involves frequent **cross-referencing** between different parts of the codebase.
- Tools like iTrace (eye-tracking plugin for IDEs) have shown that developers' actual reading behavior is far more dynamic and scattered than previously assumed.

---

## Sources (with URLs)

### Foundational Cognitive Models

1. Brooks, R. (1983). "Towards a Theory of the Comprehension of Computer Programs." *International Journal of Man-Machine Studies*, 18, 543-554. [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0020737383800315)

2. Shneiderman, B. & Mayer, R. (1979). "Syntactic/Semantic Interactions in Programmer Behavior: A Model and Experimental Results." *International Journal of Computer and Information Sciences*, 8(3), 219-238. [Springer](https://link.springer.com/article/10.1007/BF00977789) | [PDF at UMD](https://www.cs.umd.edu/users/ben/papers/Shneiderman1979Syntactica.pdf)

3. Soloway, E. & Ehrlich, K. (1984). "Empirical Studies of Programming Knowledge." *IEEE Transactions on Software Engineering*. [IEEE Xplore](https://ieeexplore.ieee.org/document/5010283/) | [ResearchGate](https://www.researchgate.net/publication/224483549_Empirical_Studies_of_Programming_Knowledge)

4. Letovsky, S. (1987). "Cognitive Processes in Program Comprehension." *Journal of Systems and Software*, 7(4), 325-339. [ScienceDirect](https://www.sciencedirect.com/science/article/pii/016412128790032X) | [Academia.edu](https://www.academia.edu/27587163/Cognitive_processes_in_program_comprehension)

5. Pennington, N. (1987). "Stimulus Structures and Mental Representations in Expert Comprehension of Computer Programs." *Cognitive Psychology*. [Semantic Scholar](https://www.semanticscholar.org/paper/Stimulus-structures-and-mental-representations-in-Pennington/3036e10df2e4855c56bf174fc1e00f6dd4100f55)

6. Von Mayrhauser, A. & Vans, A.M. (1995). "Program Comprehension During Software Maintenance and Evolution." *IEEE Computer*, 28(8). [Semantic Scholar](https://www.semanticscholar.org/paper/Program-Comprehension-During-Software-Maintenance-Von-Vans/8a9903a2241c51ad8a8de7727d5e006c83519074) | [PDF at Kent State](https://www.cs.kent.edu/~jmaletic/cs69995-PC/papers/von_mayrhauser-1995.pdf)

7. Storey, M.-A. (2006). "Theories, Tools and Research Methods in Program Comprehension: Past, Present and Future." *Software Quality Journal*, 14, 187-208. [Springer](https://link.springer.com/article/10.1007/s11219-006-9216-4) | [PDF](https://www.ptidej.net/courses/inf6306/fall10/slides/course8/Storey06-TheoriesMethodsToolsProgramComprehension.pdf)

### Empirical Studies

8. Sillito, J., Murphy, G.C., & De Volder, K. (2006). "Questions Programmers Ask During Software Evolution Tasks." *Proceedings of the 14th ACM SIGSOFT International Symposium on Foundations of Software Engineering*, 23-34. [ACM DL](https://dl.acm.org/doi/10.1145/1181775.1181779) | [PDF at UBC](https://www.cs.ubc.ca/~murphy/papers/other/asking-answering-fse06.pdf)

9. Xia, X., Bao, L., Lo, D., Xing, Z., Hassan, A.E., & Li, S. (2018). "Measuring Program Comprehension: A Large-Scale Field Study with Professionals." *IEEE Transactions on Software Engineering*. [IEEE Xplore](https://ieeexplore.ieee.org/document/7997917/) | [PDF](https://baolingfeng.github.io/papers/tsecomprehension.pdf)

10. Roehm, T. et al. (2012). Developers avoid comprehension when possible, relying on explanations from colleagues. Referenced in Ko's program comprehension chapter.

11. Dagenais, B. et al. (2010). New software engineers' first year dominated by architecture comprehension. Referenced in Ko's program comprehension chapter.

### Information Foraging and Navigation

12. Ko, A.J. et al. — Quantified the high cost developers incur when foraging for information. [Referenced in Piorkowski et al.]

13. Piorkowski, D., Henley, A.Z., et al. (2016). "Foraging and Navigations, Fundamentally: Developers' Predictions of Value and Cost of Their Navigation Decisions." [Digital Commons](https://digitalcommons.memphis.edu/facpubs/2831/) | [PDF at Oregon State](https://web.engr.oregonstate.edu/~burnett/Reprints/fse16-valueAndCosts.pdf)

14. Fleming, S., Scaffidi, C., et al. "An Information Foraging Theory Perspective on Tools for Debugging, Refactoring, and Reuse Tasks." *ACM Transactions on Software Engineering and Methodology*. [ACM DL](https://dl.acm.org/doi/10.1145/2430545.2430551)

### Concept Location

15. Rajlich, V. & Wilde, N. (2002). "The Role of Concepts in Program Comprehension." [PDF at Kent State](https://www.cs.kent.edu/~jmaletic/cs69995-PC/papers/Rajlich'02.pdf) | [Semantic Scholar](https://www.semanticscholar.org/paper/The-role-of-concepts-in-program-comprehension-Rajlich-Wilde/62c538cb80feb223aa27315eb5ed1c69d68111c5)

### Cognitive Load Theory

16. Sweller, J. (1988). Cognitive Load Theory. [Wikipedia overview](https://en.wikipedia.org/wiki/Cognitive_load)

17. Miller, G.A. (1956). "The Magical Number Seven, Plus or Minus Two." *Psychological Review*, 63(2), 81-97. [PDF at UT Austin](https://labs.la.utexas.edu/gilden/files/2016/04/MagicNumberSeven-Miller1956.pdf)

18. Cowan, N. (2001). "The Magical Mystery Four: How is Working Memory Capacity Limited, and Why?" *Current Directions in Psychological Science*. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC2864034/)

### Recent Research (2024-2025)

19. Gao, J., Xue, Y., Xie, X., et al. (2025). "Understanding Codebase like a Professional! Human-AI Collaboration for Code Comprehension." [arXiv:2504.04553](https://arxiv.org/html/2504.04553v2)

20. Agrawal, E., Alam, O., Goenka, C., et al. (2024). "Code Compass: A Study on the Challenges of Navigating Unfamiliar Codebases." [arXiv:2405.06271](https://arxiv.org/html/2405.06271v1)

21. Goncalves, P.W., Rani, P., Storey, M.-A., Spinellis, D., & Bacchelli, A. (2025). "Code Review Comprehension: Reviewing Strategies Seen Through Code Comprehension Theories." [arXiv:2503.21455](https://arxiv.org/html/2503.21455v1)

22. Heinonen, K. et al. (2023). "Synthesizing Research on Programmers' Mental Models of Programs, Tasks and Concepts — A Systematic Literature Review." *Information and Software Technology*. [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0950584923001544) | [arXiv:2212.07763](https://arxiv.org/abs/2212.07763)

### Practitioner Sources

23. Ellich, B. (2025). "How GitHub Engineers Learn New Codebases." *The GitHub Blog*. [GitHub Blog](https://github.blog/developer-skills/application-development/how-github-engineers-learn-new-codebases/)

24. Ko, A.J. "Program Comprehension" (chapter). *Cooperative Software Development*. [Online textbook](https://andrewbegel.com/info461/readings/comprehension.html)

25. "The Cognitive Load Theory in Software Development." *The Valuable Dev*. [Article](https://thevaluable.dev/cognitive-load-theory-software-developer/)

26. Tiemens, S.T. (1989). "Cognitive Models of Program Comprehension." *Software Engineering Research Center, Georgia Tech*. [PDF](https://sites.cc.gatech.edu/reverse/repository/cogmodels.pdf)

### Eye Tracking and Code Navigation

27. "Eyes on Code: A Study on Developers' Code Navigation Strategies." [ResearchGate](https://www.researchgate.net/publication/346358689_Eyes_on_Code_A_Study_on_Developers_Code_Navigation_Strategies)

28. "On Eye Tracking in Software Engineering." *SN Computer Science*, Springer 2024. [Springer](https://link.springer.com/article/10.1007/s42979-024-03045-3)

29. CodeGRITS: A Research Toolkit for Developer Behavior and Eye Tracking in IDE. [PDF](https://codegrits.github.io/CodeGRITS/static/paper.pdf)

---

## Actionable Insights for AI Agents

These insights translate directly into how an AI agent (like a Wazir-style orchestrator) should approach codebase comprehension tasks — whether onboarding to a new project, reviewing code, or assisting a developer.

### Insight 1: Replicate the Integrated Comprehension Model

An AI agent should **dynamically switch between top-down and bottom-up strategies**, mirroring von Mayrhauser & Vans' integrated model:

- **Start top-down** when domain context is available (README, manifest, architecture docs, issue descriptions). Form hypotheses about structure and purpose.
- **Switch to bottom-up** when entering unfamiliar territory. Read code, trace control flow, identify patterns.
- **Build the situation model** continuously — map code constructs to real-world domain concepts.
- **Never commit to a single strategy.** Real comprehension is opportunistic and context-switching.

### Insight 2: Use the Sillito Question Taxonomy as a Comprehension Protocol

Structure codebase exploration as a progressive series of questions:

1. **Phase 1 (Focus):** Where are the entry points? What are the main modules? What does the directory structure tell us?
2. **Phase 2 (Expansion):** What are the key types and their relationships? Where are important methods called? What are the dependency chains?
3. **Phase 3 (Connection):** What is the execution flow for a typical operation? How does data flow through the system? What patterns connect the modules?
4. **Phase 4 (Integration):** What are the architectural decisions? How do subsystems interact? What are the invariants and constraints?

This progressive deepening mirrors how human experts actually build understanding.

### Insight 3: Maximize Information Scent in Outputs

When presenting codebase information to users or building internal representations:

- **Lead with names and purposes**, not implementation details.
- **Provide clear navigation paths** — "to understand X, look at Y which calls Z."
- **Highlight beacons** — the characteristic code patterns that signal the purpose of a section (e.g., "this is a retry loop with exponential backoff").
- **Surface the 'why' before the 'what'** — domain rationale before implementation detail.

### Insight 4: Manage Cognitive Load Explicitly

- **Layer information delivery.** Start with a 3-sentence project summary, then architecture overview, then module details, then implementation specifics. Never dump everything at once.
- **Minimize extraneous load.** Filter out generated code, boilerplate, vendored dependencies, and unrelated modules when presenting context.
- **Maximize germane load.** When explaining code, connect it to domain concepts, highlight patterns, and draw parallels to familiar constructs.
- **Respect the 4-chunk limit.** When presenting complex systems, group information into 3-4 high-level categories before expanding any single category.

### Insight 5: Build a Hierarchical Mental Map

Following the CodeMap research (Gao et al. 2025):

1. **Extract** — automatically identify entry points, key modules, dependency structures, and architectural patterns.
2. **Decompose** — break the codebase into hierarchical layers (project -> packages -> modules -> files -> functions).
3. **Represent** — maintain a structured representation (index, manifest, architecture doc) that can be navigated at different zoom levels.
4. **Enable interactive exploration** — allow zooming in and out between abstraction levels without losing the overall context.

This is directly applicable to how an AI agent should index and present codebase knowledge.

### Insight 6: Use Letovsky's Why/How/What Conjecture Framework

For any piece of code the agent encounters:

- **Why** is this code here? What requirement or design decision does it serve?
- **How** does it accomplish its purpose? What is the algorithm/pattern?
- **What** does it actually do at a concrete level? What are the inputs/outputs?

Answering all three questions for each significant component builds a complete mental model. An AI agent should structure its analysis to address all three levels, and flag when any level remains unanswered.

### Insight 7: Prioritize Concept Location

When assisting with a specific task:

1. **Start from the domain concept** (the feature, bug, or requirement being addressed).
2. **Locate its implementation** in code (search for domain terms, trace entry points, follow call graphs).
3. **Expand outward** from the located code to understand its context, dependencies, and interactions.
4. **Stop expanding** when sufficient understanding is achieved for the task at hand.

Do not attempt to understand the entire codebase when only a slice is needed. Scope-focused comprehension is how experts work.

### Insight 8: Exploit Beacons and Discourse Rules

An AI agent should recognize and leverage:

- **Naming conventions** — well-named functions, classes, and variables are the strongest beacons.
- **Structural patterns** — test files, configuration files, entry points, middleware chains, route definitions.
- **Discourse conventions** — README placement, directory naming (src/, lib/, test/), conventional commits, standard project layouts.
- **Architecture documentation** — manifests, architecture decision records, design documents.

When these conventions are followed, comprehension is dramatically accelerated. When they are violated, the agent should flag this as a comprehension hazard.

### Insight 9: Simulate Pair Programming Dynamics

The GitHub engineering research (Ellich 2025) and Roehm et al. (2012) both emphasize that developers prefer **getting explanations from colleagues** over reading code directly. An AI agent should:

- **Explain like a knowledgeable teammate** — provide contextual, adaptive explanations rather than raw code dumps.
- **Answer the implicit question** — when a developer is looking at code, they usually have a specific question in mind. Anticipate it.
- **Guide exploration** — suggest what to look at next based on the current focus, like a mentor would.
- **Document discoveries** — capture and organize understanding as it builds, creating artifacts that reduce future comprehension costs.

### Insight 10: Account for the Expert-Novice Spectrum

Different users need different comprehension support:

- **Novice users (new to codebase/domain):** Need more bottom-up support, explicit explanations, guided exploration paths, and visible structure. Benefit most from hierarchical visualizations and step-by-step walkthroughs.
- **Expert users (familiar with domain/codebase):** Need efficient concept location, quick pattern confirmation, and targeted answers to specific questions. Prefer concise, focused information over tutorials.
- **The agent should detect which mode is appropriate** based on the questions being asked and the depth of context already available, and adapt its comprehension strategy accordingly.
