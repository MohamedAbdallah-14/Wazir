# Codebase Understanding and Program Comprehension Research

**Date:** 2026-03-25
**Scope:** Academic papers, cognitive models, books, tools, blog posts, and empirical research on how developers understand code and codebases.

---

## 1. Storey — Theories, Tools and Research Methods in Program Comprehension: Past, Present and Future (2006)

**Source:** [Springer — Software Quality Journal, 14(3), 187-208](https://link.springer.com/article/10.1007/s11219-006-9216-4)
**Also:** [Slide deck (PDF)](https://www.ptidej.net/courses/inf6306/fall10/slides/course8/Storey06-TheoriesMethodsToolsProgramComprehension.pdf)

- Definitive survey of 30 years of program comprehension research, covering theories, tools, and research methods.
- A **mental model** is a maintainer's mental representation of the program to be understood. A **cognitive model** describes the cognitive processes and information structures used to form that mental model.
- Distinguishes comprehension factors along three axes: **human characteristics** (expertise, working memory), **program characteristics** (structure, naming, documentation), and **task context** (maintenance, debugging, review).
- Identifies the major cognitive models: Shneiderman & Mayer (1979), Brooks (1983), Soloway & Ehrlich (1984), Letovsky (1987), Pennington (1987), and von Mayrhauser & Vans (1995).
- Concludes that no single cognitive model fully explains program comprehension; real-world understanding is **opportunistic**, switching fluidly between top-down, bottom-up, and knowledge-based strategies depending on context.
- Tools should support multiple comprehension strategies rather than forcing a single approach.

---

## 2. Shneiderman & Mayer — Syntactic/Semantic Interactions in Programmer Behavior (1979)

**Source:** [International Journal of Computer and Information Sciences, 8(3)](https://link.springer.com/article/10.1007/BF00977789)
**Also:** [PDF from UMD](https://www.cs.umd.edu/users/ben/papers/Shneiderman1979Syntactica.pdf)

- One of the earliest cognitive models of programming. Proposes a **multi-level model** with two knowledge stores: **syntactic knowledge** (language-specific syntax rules) and **semantic knowledge** (general programming concepts independent of language).
- Syntactic knowledge is acquired by rote and is easily forgotten; semantic knowledge is learned by meaningful association and is more durable.
- Working memory is where problem solutions are constructed by combining syntactic and semantic knowledge.
- Novice programmers struggled more with syntactically complex constructs (e.g., arithmetic IF in FORTRAN), while advanced programmers easily converted syntax into internal semantic representations.
- Implication: **language design and code style should minimize syntactic burden** so developers can operate at the semantic level.

---

## 3. Brooks — Towards a Theory of the Comprehension of Computer Programs (1983)

**Source:** [International Journal of Man-Machine Studies, 18, 543-554](https://www.scirp.org/reference/referencespapers?referenceid=1183295)

- Proposes a strictly **top-down, hypothesis-driven** model of program comprehension.
- The programmer begins by forming a **general hypothesis** about the program's purpose, then progressively refines it into finer sub-hypotheses until they can be validated against specific code segments.
- Introduces the concept of **beacons**: "sets of features that typically indicate the occurrence of certain structures or operations in code" (e.g., recognizable variable names like `sum`, `count`, or idiomatic loop patterns).
- Beacons serve as **anchoring points** that allow experienced programmers to rapidly confirm or reject hypotheses without reading every line.
- Knowledge is organized into distinct **domains** that bridge between the original problem and the final program. Comprehension reconstructs knowledge about these domains and their relationships.
- Limitation: does not explain bottom-up comprehension well; works best when the programmer has relevant domain knowledge.

---

## 4. Soloway & Ehrlich — Programming Plans and Beacons (1984); Letovsky — Delocalized Plans (1986)

**Source (Soloway):** [Empirical Studies of Programmers, Ablex, 1984](https://scholar.google.com/scholar?q=Soloway+Ehrlich+empirical+studies+programmers+1984)
**Source (Letovsky):** [IEEE Software, 3(3), 1986; also Cognitive Processes in Program Comprehension, 1987](https://www.sciencedirect.com/science/article/pii/016412128790032X)

- Soloway and Ehrlich propose that expert programmers understand code by recognizing **programming plans** — generic, stereotypical code fragments that implement common operations (e.g., a running-total accumulator, a sentinel-controlled loop).
- Plans are organized in a hierarchy of **goals**; **rules of discourse** (coding conventions) help decompose goals into sub-goals and map them to plans.
- Letovsky extends this with the concept of **delocalized plans**: plans whose implementation is scattered across non-contiguous code locations. Delocalized plans are a major source of comprehension difficulty because the programmer must mentally reconstruct a coherent plan from dispersed fragments.
- Letovsky also shows that programmers are **opportunistic processors** — they do not strictly follow top-down or bottom-up strategies but dynamically switch based on available information and the task at hand.
- Key insight: **code that keeps related plan elements physically close together is dramatically easier to understand** than code that scatters them.

---

## 5. Pennington — Stimulus Structures and Mental Representations in Expert Comprehension (1987)

**Source:** [Cognitive Psychology, 19(3), 1987; also Empirical Studies of Programmers: Second Workshop, 1987](https://www.semanticscholar.org/paper/Comprehension-strategies-in-programming-Pennington/3f90bfaf43f9d1880a69a530aa5d7a2bf675acab)

- Adapts van Dijk and Kintsch's **text comprehension model** to program comprehension.
- Distinguishes two mental representations: (1) the **program model** (text-based: operations, control flow, data flow — what the code literally does line by line) and (2) the **domain model** (situation-based: entities from the problem domain and their relationships — what the code means).
- Programmers initially build a program model (bottom-up), then construct a domain model through **cross-referencing** between the program model and their domain knowledge.
- For a first encounter with unfamiliar code, **bottom-up comprehension dominates**; top-down strategies require an existing domain model or prior familiarity.
- The program model is formed faster than the domain model, but the domain model is more useful for tasks like modification and debugging.

---

## 6. Von Mayrhauser & Vans — Integrated Comprehension Model (1995)

**Source:** [IEEE Computer, 28, Aug 1995, 44-55](https://www.cs.kent.edu/~jmaletic/cs69995-PC/papers/von_mayrhauser-1995.pdf)
**Also:** [Software Engineering Journal, 10, 171-182](https://digital-library.theiet.org/doi/10.1049/sej.1995.0023)

- The most comprehensive cognitive model, synthesizing prior work into an **Integrated Comprehension Model** with four major components:
  1. **Program Model** (bottom-up: Pennington-derived; line-by-line understanding of control and data flow)
  2. **Situation Model** (domain-level: mapping code to real-world concepts)
  3. **Top-Down Model** (domain model: hypothesis-driven, goal-oriented, Soloway/Brooks-derived)
  4. **Knowledge Base** (long-term memory: programming knowledge, domain knowledge, plans, rules)
- Key contribution: comprehension is not a single linear process but involves **constant switching** between these three active processes (program, situation, top-down), driven by the task, the programmer's expertise, and code characteristics.
- Validated through industrial studies of professional programmers working on large-scale production systems.
- Practical implication: **tools and code organization should support all three comprehension modes simultaneously** — detailed code navigation (program model), high-level overviews and architecture diagrams (top-down model), and domain concept mapping (situation model).

---

## 7. Gao et al. — Understanding Codebase like a Professional! Human-AI Collaboration for Code Comprehension (2025)

**Source:** [arXiv:2504.04553](https://arxiv.org/html/2504.04553v2)

- Interviewed 8 professional **code auditors** — developers who must rapidly understand unfamiliar codebases on a weekly or daily basis.
- Found that auditors understand codebases by flowing from **global to local** levels, sequentially seeking: (1) project overview, (2) codebase structure and business logic, (3) local functions and variables.
- Identified four design opportunities for LLM-based comprehension tools: (a) automated codebase information extraction, (b) decomposition of information at appropriate granularity, (c) representation aligned with cognitive flow, (d) reducing manual effort and conversational distraction.
- Built **CodeMap**, a prototype providing dynamic hierarchical codebase visualizations with interactive drill-down.
- User study (9 experienced + 6 novice developers): CodeMap **reduced reliance on reading LLM text responses by 79%** and **increased map usage time by 90%** vs. static visualization.
- Novice developers particularly benefited: CodeMap enhanced their perceived understanding and **reduced unpurposeful exploration**.
- Key insight: visual, hierarchical, interactive representations aligned with the natural global-to-local cognitive flow are far more effective than flat text-based LLM responses for codebase understanding.

---

## 8. Fakhoury, Ma, Arnaoudova & Adesope — The Effect of Poor Source Code Lexicon and Readability on Developers' Cognitive Load (ICPC 2018)

**Source:** [ACM ICPC 2018, Gothenburg, pp. 286-296](https://dl.acm.org/doi/10.1145/3196321.3196347) (Distinguished Paper Award)
**Also:** [PDF](https://veneraarnaoudova.ca/wp-content/uploads/2018/03/2018-ICPC-Effect-lexicon-cognitive-load.pdf)

- Used **functional Near Infrared Spectroscopy (fNIRS)** combined with **eye tracking** to directly measure developers' brain activity during code comprehension.
- Found that the presence of **linguistic antipatterns** (misleading identifier names, inconsistent naming conventions) in source code **significantly increases developers' cognitive load**.
- One of the main contributors to software comprehension is the **quality of the lexicon** (identifiers and comments); prior research shows a positive correlation between identifier quality and software project quality.
- Empirically validated naming guidelines: identifiers should be composed of **2-4 natural language words** or project-accepted acronyms; should not contain only abstract words; should not contain plural words; should conform to project naming conventions.
- **Camel casing** leads to higher accuracy for all subjects regardless of training; longer identifiers have a negative influence on readability.
- Practical takeaway: **poor naming is not just a style issue — it is a measurable cognitive burden** that slows comprehension and increases error rates.

---

## 9. Zhang et al. — EyeLayer: Integrating Human Attention Patterns into LLM-Based Code Summarization (ICPC 2026)

**Source:** [arXiv:2602.22368; ICPC 2026, Rio de Janeiro](https://arxiv.org/html/2602.22368v1)

- Proposes **EyeLayer**, a module that incorporates human eye-gaze patterns into LLM-based code summarization.
- Models human attention during code reading via a **Multimodal Gaussian Mixture**, redistributing token embeddings based on learned parameters that capture where and how intensively developers focus.
- Key finding: human gaze patterns encode **complementary attention signals** that enhance the semantic focus of LLMs — achieving gains of up to **13.17% on BLEU-4** over strong fine-tuning baselines.
- Demonstrates that **how humans read code** (which tokens they fixate on, how long they dwell) provides information that pure statistical models miss.
- Experts focus more on **method signatures and call sites**; novices fixate more on **comments and comparisons**.
- Implication: understanding where human attention goes during code reading can improve both human-facing tools and AI-based code analysis.

---

## 10. Elbre — Psychology of Code Readability (2018)

**Source:** [Medium](https://medium.com/@egonelbre/psychology-of-code-readability-d23b1ff1258a)

- Deep analysis of code readability through the lens of cognitive psychology, grounded in working memory, chunking, attention, and Gestalt principles.
- **Working memory** is limited to approximately **4 plus/minus 1** items (not the popular 7 plus/minus 2 myth). Code must be structured to respect this limit.
- **Chunking**: the brain automatically groups information into larger units. Good code design creates natural chunks (functions, classes, modules) that match cognitive chunking boundaries.
- **Focus of attention** is singular — we can only focus on one thing at a time. **Locus of attention** describes what we are currently focused on. Shifting attention between distant code locations is expensive.
- **Names** help retrieve the right chunks from memory: too long is noisy, too short is unhelpful, bad names are misleading.
- Related code should be written **close together** (spatial proximity reduces attention shifts). Code should be split into **smaller fathomable units** to reduce working memory burden.
- Using **common vocabulary** (well-known patterns, standard library idioms) lets developers leverage existing memory chunks, making code faster to read.
- **Global variables, singletons, and action-at-a-distance** are problematic because they prevent building a contained mental model.
- **Single Responsibility Principle** works because it creates proper chunks with manageable working memory needs, but splitting too aggressively can introduce so many artifacts that the benefit is lost (cites Carmack's argument for inlined code).

---

## 11. Hermans — The Programmer's Brain (Manning, 2021)

**Source:** [Manning Publications](https://www.manning.com/books/the-programmers-brain)
**Also:** [InfoQ talk](https://www.infoq.com/presentations/reading-code/)

- Book by Dr. Felienne Hermans (Leiden University) applying cognitive science research directly to programming.
- Identifies **three types of confusion** when reading code, each tied to a different memory system:
  1. **Lack of knowledge** (long-term memory) — you don't recognize a syntax or pattern.
  2. **Lack of information** (short-term memory) — the code references something you can't see on screen.
  3. **Lack of processing power** (working memory) — the code is too complex to trace mentally.
- Each confusion type requires a different remedy: study/practice for knowledge, better tooling/navigation for information, refactoring/decomposition for processing.
- Covers **speed reading for code**, learning syntax, reading complex code, and reaching deeper understanding.
- Demonstrates that **productive struggle** (being confused but working through it) is a learning mechanism, not a failure state.
- Practical techniques: **flashcards for syntax**, **state tables for tracing**, **dependency graphs for architecture**, **labeling code with domain concepts**.

---

## 12. How GitHub Engineers Learn New Codebases (GitHub Blog, 2025)

**Source:** [GitHub Blog](https://github.blog/developer-skills/application-development/how-github-engineers-learn-new-codebases/)

- Survey of strategies collected from GitHub engineers during team transitions, organized by approach type.
- **Hands-on code exploration**: Start with "Good First Issues" — smaller, well-defined tasks that provide natural entry points. Use AI assistants (Copilot) to ask questions like "What will this function return if I give it X?" and "Summarize what this method does."
- **Analyze telemetry and metrics**: Study production behavior data to understand how the system actually works in practice, not just in theory.
- **Explore through testing**: Deliberately modify code and observe effects. Write new tests to verify understanding. Intentionally break things in development to see failure modes.
- **Documentation and architecture**: Read existing docs, architecture diagrams, and ADRs (Architecture Decision Records). Map out system boundaries and interfaces.
- **Pair programming**: Work alongside experienced team members who can provide historical context about why certain choices were made.
- **Commit history archaeology**: Use git log and blame to understand the evolution of specific files and the reasoning behind changes.

---

## 13. Jeremy Ong — Grokking Big Unfamiliar Codebases (2023)

**Source:** [Jeremy's Blog](https://www.jeremyong.com/game%20engines/2023/01/25/grokking-big-unfamiliar-codebases/)

- Practitioner guide from a game engine programmer who regularly evaluates large unfamiliar codebases (new jobs, due diligence, framework evaluation).
- Core principle: maintain an **active mindset** rather than a passive one. Form hypotheses, seek to prove or disprove them. Compose guiding questions and probe to answer them.
- In contrast, a passive mindset leads to **meandering** — after hours of passive reading, it's hard to know what was accomplished or where to resume.
- **Treat subsystems as black boxes** until ready to revisit them. Don't try to understand everything at once.
- **Rely on documentation but don't blindly trust it** — documentation can be outdated or misleading.
- **Lean on tools liberally**: debuggers, profilers, custom tools, built-in tools. A frame capture in a graphics debugger or a strategically placed breakpoint can reveal more than hours of code reading.
- **Trust your instincts**: if something feels much harder than expected, that signal is valuable. Also notice where observed behavior differs from expectations — these divergences reveal architectural decisions.
- **Ask for help** with context on what you were trying to understand and what you already tried.

---

## 14. General Guide for Exploring Large Open Source Codebases (MLH Fellowship, 2020)

**Source:** [pncnmnp.github.io](https://pncnmnp.github.io/blogs/oss-guide.html)

- Practical guide for developers new to large open-source codebases (contributions from Parth Parikh, Kishore Ganesh, Chris Ewald, and others).
- **Use the software first** before reading the code — understanding behavior as a user provides essential context.
- **Check out the earliest commits**: initial commits carry the gist of the project's original goals and architecture, before complexity accumulated.
- **Git log trick**: identify the most commonly edited files using `git log --pretty=format: --name-only | sort | uniq -c | sort -rg | head -10`. These hotspot files follow the 80/20 rule — a few files do most of the work.
- **Don't try to understand the whole codebase**: apply the **Paper Cut Principle** — as you work on many small issues across the codebase, understanding accumulates until you grasp how everything works.
- **Structured Theorizing**: when stuck, creatively brainstorm potential causes for a problem, then systematically verify or rule out each one. "Hack it, then get it right" — get a working proof of concept first, then refine.
- **Figure out how your part fits in**: trace from the issue to the relevant subsystem. Understand boundaries before diving into implementation details.

---

## 15. Sparkbox — How to Understand a Large Codebase (2020)

**Source:** [Sparkbox Foundry](https://sparkbox.com/foundry/how_to_understand_a_large_codebase)

- Practical guide for developers joining monolithic codebase projects.
- **Read the documentation** first — even outdated docs reveal project history and evolution.
- **Read the commit messages** for files you're working on. Follow them to PRs with richer context. Contact the original developer if still available.
- **Pair with an experienced developer** who can provide insight about design patterns, testing processes, third-party dependencies, and historical context about why choices were made.
- **Read the tests** — unit, integration, and functional tests reveal functionality, edge cases, and known defects.
- **Start with the smallest part**: find a single line you understand, then expand outward to related code. Trace back through imports, function calls, and build scripts.
- **Document your learning** and add it to shared project documentation to help future onboarding.

---

## 16. Tornhill — Software Design X-Rays: Fix Technical Debt with Behavioral Code Analysis (2018)

**Source:** [Pragmatic Programmers](https://pragprog.com/titles/atevol/software-design-x-rays/)
**Summary:** [Understand Legacy Code](https://understandlegacycode.com/blog/key-points-of-software-design-x-rays/)

- Introduces **Behavioral Code Analysis**: using version control history (not just static analysis) to understand codebases.
- **Hotspot analysis**: combines code complexity (lines of code) with change frequency to identify the most problematic and impactful files. Hotspots are complicated code that you also have to work with often.
- **X-Ray analysis**: hotspot analysis at the function level. Takes a complex hotspot file, parses it into functions, and examines which functions change most frequently. Can reduce a 400kLOC codebase to the few hundred lines of code that matter most for refactoring.
- **Temporal coupling**: files that always change together but aren't co-located reveal hidden dependencies and architectural issues.
- **LOC as complexity metric**: despite being "unsophisticated," LOC correlates so strongly with other complexity metrics (including cyclomatic complexity) that it is a practical and efficient indicator.
- **Knowledge maps**: visualize which developers "own" which parts of the codebase, revealing bus-factor risks and coordination bottlenecks.
- Practical takeaway: **understanding a codebase is not just about reading the current code — the history of how it evolved reveals where the real problems and coupling lie**.

---

## 17. Spinellis — Code Reading: The Open Source Perspective (2003) and Feathers — Working Effectively with Legacy Code (2004)

**Source (Spinellis):** [Addison-Wesley, 2003](https://www.amazon.com/Code-Reading-Open-Source-Perspective/dp/0201799405)
**Source (Feathers):** [Prentice Hall, 2004](https://www.amazon.com/Working-Effectively-Legacy-Michael-Feathers/dp/0131177052)
**Summary (Feathers):** [Understand Legacy Code](https://understandlegacycode.com/blog/key-points-of-working-effectively-with-legacy-code/)

### Code Reading (Spinellis)
- The foundational book on **reading code as a skill**, using 600+ real-world open-source examples.
- Teaches how to identify good and bad code, how to systematically read it, and what patterns to look for.
- Won the Software Development Productivity Award in 2004; translated into six languages.
- Treats code reading as an active, teachable skill rather than a passive byproduct of experience.

### Working Effectively with Legacy Code (Feathers)
- Chapters 11, 12, 16, and 17 specifically address **understanding unfamiliar code**.
- Techniques for increasing understanding: **sketching effects** (drawing how changes propagate), **taking notes about code**, **scratch refactoring** (refactoring code temporarily just to understand it, then reverting), and **telling the story of the system** (narrating what the system does in plain language).
- Central concept: **the Legacy Code Dilemma** — to change code you need tests, but to add tests you need to change code. Understanding the code is the prerequisite for breaking this cycle.
- "Scratch refactoring" (also called "exploratory refactoring") is particularly powerful: refactor the code freely with no intention to keep the changes, purely to build understanding, then revert and do the real work with a mental model in place.

---

## 18. Understand Legacy Code — Getting into a Large Codebase (Nicolas Carlo, ongoing)

**Source:** [understandlegacycode.com](https://understandlegacycode.com/getting-into-large-codebase/)

- Curated collection of approaches for making sense of legacy codebases, aggregating insights from multiple practitioners and researchers.
- Key techniques referenced:
  - **Exploratory refactoring**: spend time refactoring code with no intention to keep changes, purely to build understanding. "Demine your codebase in 30 minutes."
  - **Dependency graphs**: visualize module dependencies to understand structure. Even hand-drawn graphs help.
  - **Dive in from the edges**: start at the system's boundaries (API endpoints, UI entry points, event handlers) and trace inward.
  - **Word counter for long methods**: use a simple word frequency analysis to reveal the structure of intimidating methods.
  - **Empathy and design patterns**: recognize that code was written under constraints; understanding those constraints helps understand the code.
- References Catherine Hicks' white paper "It's Like Coding in the Dark" on the need for **learning cultures** within coding teams — the social and organizational context strongly affects how effectively developers can understand code.

---

## Synthesis

### The Three Cognitive Models

Academic research has converged on three fundamental strategies for program comprehension, and real-world behavior uses all three:

| Strategy | Direction | Key Mechanism | When Used |
|---|---|---|---|
| **Top-Down** (Brooks, Soloway) | General to specific | Hypothesis formation, beacon recognition, plan matching | Familiar domain, well-structured code |
| **Bottom-Up** (Pennington, Shneiderman) | Specific to general | Line-by-line reading, chunking operations into abstractions | Unfamiliar code, first encounter |
| **Opportunistic/Integrated** (Letovsky, von Mayrhauser) | Both, switching dynamically | Context-driven strategy selection | Real-world maintenance (the dominant mode) |

The von Mayrhauser & Vans Integrated Model (1995) is the most complete: programmers maintain three concurrent representations (program model, situation model, top-down model) and switch between them constantly.

### What Makes Code Easier to Understand

The research converges on clear, empirically supported factors:

1. **Good naming** (2-4 words, intention-revealing, consistent conventions) — directly reduces cognitive load as measured by brain imaging (Fakhoury et al., 2018).
2. **Spatial locality** — keeping related code physically close reduces attention-shifting cost (Elbre, 2018; Letovsky's delocalized plans).
3. **Small, well-chunked units** — functions and modules that fit within working memory limits (4 plus/minus 1 items).
4. **Familiar patterns** — using standard idioms and common vocabulary leverages existing memory chunks.
5. **Consistent style** — inconsistency forces the reader to repeatedly re-calibrate their parsing expectations.
6. **Hierarchical organization** — global-to-local information architecture matches the natural cognitive flow (Gao et al., 2025).

### What Makes Code Harder to Understand

1. **Delocalized plans** — implementation scattered across non-contiguous locations (Letovsky, 1986).
2. **Linguistic antipatterns** — misleading names that violate expectations (Arnaoudova et al., 2018).
3. **Action at a distance** — global state, hidden side effects, implicit dependencies.
4. **Missing domain context** — code without documentation, tests, or architectural rationale forces expensive bottom-up comprehension.
5. **Excessive complexity per unit** — functions stretching hundreds of lines overwhelm working memory.

### Effective Onboarding Strategies

Across practitioner sources (GitHub, Sparkbox, Jeremy Ong, MLH guide), a consistent pattern emerges:

1. **Use the software first** before reading any code.
2. **Get a high-level overview** (docs, architecture diagrams, team conversations).
3. **Adopt an active, hypothesis-driven mindset** — form questions, probe for answers, don't passively read.
4. **Start from edges** — entry points, API boundaries, tests, earliest commits.
5. **Use the git log** — hotspot files (most-edited), commit messages, and PR history reveal intent and evolution.
6. **Pair with experienced teammates** who can narrate the "why" behind the code.
7. **Work on small tasks** (Good First Issues, paper-cut fixes) to accumulate understanding incrementally.
8. **Use tools aggressively** — debuggers, profilers, AI assistants, visualization tools, dependency graphs.
9. **Document what you learn** for the next person.

### Tools for Codebase Understanding

| Tool / Approach | What It Does |
|---|---|
| **CodeMap** (Gao et al.) | Hierarchical interactive visualization aligned with cognitive flow |
| **CodeScene / CodeSee** | Hotspot analysis, temporal coupling, dependency visualization |
| **SciTools Understand** | Static analysis, code navigation, metrics, architecture visualization |
| **AppMap** | Runtime trace recording rendered as call maps and sequence diagrams |
| **AI Assistants** (Copilot, Cursor) | Natural language Q&A about code, explain functionality, summarize |
| **Debuggers / Profilers** | Runtime behavior observation, hypothesis testing |
| **Git log analysis** | Identify hotspots, temporal coupling, knowledge distribution |
| **Dependency graphs** | Visualize module relationships and boundaries |

### Implications for AI-Assisted Code Understanding

1. **Align with cognitive flow**: AI tools should present information **global-to-local** (project overview, then module structure, then function details), matching how expert code auditors naturally work (Gao et al., 2025).
2. **Visual over textual**: CodeMap showed that interactive visualizations reduce LLM text response reliance by 79%. Humans need spatial representations, not walls of text.
3. **Leverage human attention patterns**: EyeLayer (Zhang et al., 2026) demonstrates that incorporating where humans actually look during code reading improves AI code summarization by 13%.
4. **Support all three comprehension modes**: Following von Mayrhauser & Vans, tools should simultaneously support bottom-up code navigation, top-down hypothesis testing, and domain-level concept mapping.
5. **Reduce cognitive load, don't add to it**: The worst AI tools generate more text to read. The best ones eliminate unnecessary information and highlight what matters (hotspots, beacons, key call chains).
