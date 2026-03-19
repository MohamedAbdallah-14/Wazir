# Wazir Enhancement Decisions — 2026-03-19

Decisions agreed upon during brainstorming session. Each item is implementation-ready.

## Research Summary

| # | Decision | Online Research Needed? | What to Research |
|---|----------|------------------------|------------------|
| 1 | Smart context-mode routing | No | Internal implementation — all info is local |
| 2 | Enforce wazir index | No | Internal tooling, no external deps |
| 3 | Enforce context-mode for large output | No | Internal, paired with #1 |
| 4 | Track context savings metrics | No | Metrics design, internal |
| 5 | Three-tier skill strategy | **Yes** | Blocked on R1 + R2 |
| 6 | Rich phase reports + gating agent | **Yes** | How other autonomous agent systems handle phase gating, agent self-evaluation patterns, prior art on LLM confidence calibration |
| 7 | Continuous learning + user input capture | **Yes** | Continuous learning in agent systems, feedback loop patterns, drift prevention, how reinforcement from human feedback is stored and applied |
| 8 | Autoresearch self-improvement | No | Already researched — decision made |
| 9 | Composer task-specific agents | **Yes** | Prompt composition patterns, multi-module prompt assembly, token budget strategies for large context injection |
| R1 | Superpowers skill audit | **Yes** | Latest superpowers GitHub, changelog, roadmap, community health, skill extensibility |
| R2 | Skill composition infrastructure | **Yes** | Claude Code plugin ecosystem patterns for skill chaining/extension, existing RFCs or discussions |

---

## Agreed

### 1. Smart context-mode routing for Bash commands

**Decision:** Not full enforcement — smart routing via a PreToolUse:Bash hook.

- Small-output commands (git status, ls, short queries) pass through native Bash — no latency tax
- Known-large-output patterns (test runners, builds, logs, diffs, dependency trees) auto-route through `batch_execute`
- Threshold: commands whose output routinely exceeds ~30-50 lines
- Index + context-mode is the preferred research path: index for *where*, context-mode for *what*
- Skills should still be able to explicitly opt in/out when they know better than the heuristic

### 2. Enforce wazir index for codebase exploration

**Decision:** All codebase exploration MUST use `wazir index` as the first step.

- Never spawn heavyweight exploration agents that brute-force read dozens of files
- Flow: `wazir index search-symbols` / `wazir recall` → locate targets → then read only what's needed
- Subagents and skills must query the index before falling back to direct file reads
- If no index exists, build one first (`wazir index build && wazir index summarize --tier all`)

### 3. Enforce context-mode for large-output commands

**Decision:** Context-mode is mandatory for commands with routinely large output.

**Must use context-mode (`batch_execute` / `execute_file`):**
- Test runners (npm test, vitest, jest, pytest, etc.)
- Build commands (npm run build, tsc, etc.)
- Dependency trees (npm ls, pip list, etc.)
- Large git diffs (`git diff` with many files)
- Log tailing / large file reads (>50 lines)
- Linting / static analysis output
- CI/CD output parsing

**Pass through native Bash:**
- git status, git log (short), git branch
- ls, pwd, mkdir, cp, mv
- wazir CLI commands with short output (doctor, index build, capture)
- Any command known to produce <30 lines

### 4. Track context savings metrics

**Decision:** Every index query and context-mode invocation must update a running usage counter.

- Track per-session: queries made, estimated tokens saved, bytes avoided in context
- Track per-tool breakdown: index lookups vs. `execute_file` vs. `batch_execute` vs. `fetch_and_index`
- Store in run state (e.g., `.wazir/runs/<id>/usage.json` or equivalent)
- Surface via `wazir status` or a dedicated `wazir stats` subcommand
- If no tracking mechanism exists yet, build one — we can't optimize what we don't measure

### 5. Three-tier skill strategy — delegate, augment, own

**Decision:** Stop forking superpowers skills wholesale. Categorize each into one of three tiers:

| Tier | Strategy | Naming |
|------|----------|--------|
| **Delegate** | Use superpowers skill as-is. Delete Wazir fork. | `superpowers:<name>` only |
| **Augment** | Invoke superpowers skill + inject a Wazir `CONTEXT.md` addendum (additive only, no overrides) | `superpowers:<name>` invoked with Wazir context |
| **Own** | Wazir-original or structurally rewritten skill. Rename to avoid conflict with superpowers. | `wz:<unique-name>` only |

**Rules:**
- Augment addenda must be strictly additive — no "replace step N" or "ignore this part"
- Owned skills must have a distinct name from any superpowers skill to prevent dual-registration confusion
- Delegated skills: delete the Wazir `skills/<name>/` directory entirely

**Status:** Blocked on Research Phase (see below).

---

## Research Required

### R1. Superpowers skill audit and tier classification

**Why this matters:**
We're choosing between maintaining our own forks (current approach — high maintenance, falls behind upstream) and delegating to a well-maintained plugin (lower maintenance, auto-updates, but less control). Getting this wrong means either: (a) we fork everything and slowly diverge from improvements the superpowers community ships, or (b) we delegate too much and lose Wazir-specific behavior that matters. This is an architectural decision that affects every future skill interaction, so it must be evidence-based.

**What the research must cover:**

1. **Full superpowers skill inventory (online)**
   - Fetch the latest superpowers plugin source (GitHub/marketplace) — don't rely on our cached v4.3.1, it may be outdated
   - Document every skill: name, purpose, structure, key behaviors
   - Check the superpowers changelog/releases for skill evolution pace — are these skills actively improved or stable?

2. **Skill-by-skill diff analysis**
   - For each superpowers skill that has a Wazir counterpart: what exactly did Wazir change?
   - Classify each change as:
     - **Additive** — Wazir adds context/tooling but doesn't contradict superpowers behavior (→ Augment tier candidate)
     - **Structural** — Wazir rewrites core logic, steps, or output format (→ Own tier candidate)
     - **Cosmetic** — just naming/formatting, no behavioral difference (→ Delegate tier candidate)

3. **Superpowers skills with NO Wazir counterpart**
   - Are there superpowers skills we're not using but should be?
   - Are there skills we could delegate to that we're currently handling ad-hoc?

4. **Community and maintenance posture**
   - How frequently does superpowers publish updates?
   - Is there a public roadmap or skill deprecation policy?
   - Are there breaking changes between versions that would affect our augment addenda?
   - What's the plugin's approach to skill extensibility — do they support context injection natively or is that something we'd need to build?

5. **Skill composition patterns in the ecosystem**
   - How do other projects handle "use plugin X's skill but with my context"?
   - Is there an established pattern for skill chaining/augmentation in Claude Code plugins?
   - What are the failure modes — prompt priority conflicts, version drift, context bloat?

6. **Risk analysis**
   - What happens if superpowers changes a skill we depend on in Augment tier?
   - What's our rollback path if delegation breaks a workflow?
   - How do we test that augmented skills still work after an upstream update?

**How to execute:**
- Online research: superpowers GitHub repo, marketplace listing, changelogs, issues, discussions
- Local analysis: diff every Wazir skill against its superpowers counterpart (cached + latest)
- Output: a classification table with tier assignment, rationale, and risk notes per skill

**Principle:** Do the right thing, not the easy thing. If the research shows we should own more skills than expected, we own them. If it shows we should delegate almost everything, we delegate. Follow the evidence.

---

### R2. Skill composition infrastructure design

**Why this matters:**
The Augment tier needs a mechanism to invoke an external skill with Wazir-specific context injected. A thin wrapper per skill is the easy path — but it recreates the maintenance problem we're trying to solve (one more file per skill that can drift). The right solution is a composition system that's declarative, testable, and resilient to upstream changes.

**What the research must cover:**

1. **Composition model design**
   - How should a composed skill be declared? Options:
     - A manifest entry: `{ base: "superpowers:tdd", augment: "wazir-context/tdd.md" }`
     - A skill resolver that chains skills at invocation time
     - A hook-based approach: PostSkillLoad injects context automatically
   - Which model keeps the augmentation visible and auditable (no hidden magic)?
   - How does the composed skill appear in the skill list — as one entry or two?

2. **Context injection semantics**
   - Where does the Wazir context go relative to the base skill? Before? After? Interleaved?
   - Prompt priority: if the base skill says "write output to X" and the context says "write output to Y", which wins? We need a clear rule, not ambiguity.
   - How do we prevent addenda from accidentally overriding base behavior? (Lint rule? Structural constraint?)

3. **Version pinning and drift detection**
   - Should we pin the superpowers version we augment against?
   - How do we detect when an upstream skill change breaks our addendum? (CI check? Hash comparison?)
   - What's the upgrade path when superpowers ships a new version?

4. **Testing surface**
   - How do we test that a composed skill (base + addendum) produces the right behavior?
   - Can we diff the resolved prompt to verify no conflicts?
   - Should there be integration tests that run composed skills against known scenarios?

5. **Ecosystem research (online)**
   - How do other Claude Code plugins handle skill extension/composition?
   - Are there existing RFCs, discussions, or patterns in the Claude Code plugin ecosystem for this?
   - Does superpowers itself have any extension mechanism planned?

**Implementation: blocked on R1.** The number of skills landing in Augment tier determines whether this infrastructure is justified. If R1 shows ≤2 augmented skills, a simple approach may suffice. If ≥5, build it properly.

**Principle:** Design now, build after evidence. Don't over-engineer, don't under-engineer — right-size to R1 results.

---

## Under Discussion

### 6. Rich phase reports + three-way gating agent

**Decision:** Two parts — rich reports and a gating agent with three possible outputs.

**Part 1: Rich phase reports**
- Current reports are too thin to be actionable. Rebuild them to include:
  - What was attempted and what the outcome was
  - What succeeded, what failed, what's uncertain
  - Drift from original intent / spec
  - Quality metrics (test results, coverage, lint, type-checking)
  - Risk flags and open questions
  - Decisions made and their rationale
- Reports saved to file for Wazir self-improvement and auditability

**Part 2: Gating agent (three-way output)**
- Agent receives: user's original input, the phase report, and accumulated decisions
- Agent outputs ONE of three verdicts:
  - **Continue** — proceed to next phase
  - **Loop back** — return to current phase with specific fixes
  - **Escalate to human** — agent cannot decide, needs human judgment

**Explicit criteria (not vibes):**

| Verdict | Criteria |
|---------|----------|
| Continue | All quality gates pass, no drift from spec, no open risks, no ambiguous trade-offs |
| Loop back | Specific failures identified, actionable fix path exists, no human judgment needed |
| Escalate | Ambiguous trade-off, scope change detected, conflicting signals, confidence below threshold, or any situation where two reasonable people could disagree |

**Critical design constraint:** The escalation criteria must be explicit and err toward escalating. If not codified, the agent will almost never escalate — LLMs are bad at recognizing their own uncertainty. Default posture: **when in doubt, escalate.**

---

### 7. Restore continuous learning loop + capture all user input

**Decision (parked — will circle back):**

**Part 1: Continuous learning**
- The old Wazir implementation had a final step that applied learnings from each run to future runs
- This must be restored — every completed run should extract what worked, what failed, and what was learned, and feed it forward
- Learning is cumulative across runs, not just within a single run

**Part 2: User input as learning signal**
- ALL user input during a run must be saved (not just the final output)
- User corrections, approvals, rejections, feedback, and mid-run redirections are the highest-quality training signal
- This feeds both the continuous learning loop and the phase reports (decision #6)

**Status:** Parked. Will design after current discussion topics are resolved.

---

### 8. Autoresearch pattern for Wazir self-improvement

**Decision:** Use autoresearch loop on Wazir itself, but with strict identity boundaries.

**Core risk:** A self-modifying system running overnight can drift Wazir into a completely different project. Each change passes the metric, but after 100 iterations the project's identity is gone. Skills define what Wazir *is* — an agent must not rewrite them unsupervised.

**The line: if changing it changes what Wazir *does*, a human decides. If it makes Wazir do the same thing better, loop it.**

**CAN loop overnight (mechanical, identity-safe):**
- Test coverage — add tests, never rewrite behavior
- Bug fixes for known, specific, scoped issues
- Lint / type errors / code quality
- Performance — make existing behavior faster
- Export validation fixes
- Documentation gaps

**CANNOT loop overnight (identity-defining, human-gated):**
- Skill files
- Workflow definitions
- Architecture
- Role contracts
- Manifest schema
- Design docs / program.md

**Patterns to adopt from autoresearch:**
- Keep/discard via git revert → use in executor
- Mechanical metric requirement (measurable before/after) → enforce in phase reports
- STRIDE + OWASP structured audit loop → inform `wz:run-audit` design
- Scoped overnight runs with morning human review gate

**Implementation: Enhanced self-audit with bounded loop (5 iterations).**

- Enhance self-audit quality first (richer audit dimensions, better findings, smarter fixes)
- Then run it in a 5-loop cycle: each loop finds new issues exposed by the previous loop's fixes
- Bounded — no drift risk, human reviews the final branch
- Simpler than autoresearch integration, uses existing worktree isolation
- Priority: make each individual audit *good* — 5 loops of a strong audit beats 100 loops of a shallow one

**Open:** What specifically needs enhancing in self-audit before the loop is worthwhile?

---

### 9. Composer generates task-specific agents with full expertise in context

**Decision:** The composition engine must compose full expertise content into each dispatched agent's context — not just filenames or summaries.

**How it works:**
1. Detect task stack + concerns (from project scan / user input)
2. Resolve which expertise modules apply per role (composition-map.yaml — 4 layers: always → auto → stacks → concerns)
3. **Compose the full content** of every resolved module into the agent's prompt
4. Dispatch executor, reviewer, verifier — each with the complete relevant expertise internalized

**Key principle:** Loading expertise is additive, not restrictive. An agent with Flutter expertise loaded doesn't forget React — it additionally knows Flutter patterns and antipatterns. This is strictly better than a generic agent.

**What this means for the reviewer:** The reviewer gets the full antipattern catalog + domain-specific review dimensions composed into its context. It reviews against *everything it knows*, with task-specific expertise making it sharper, not narrower.

**Why this matters:** Expertise files are meaningless if they're not in the prompt. A filename reference or summary doesn't give the agent the actual knowledge. The full content must be in context for the agent to act on it.

**Open:** How does this interact with context window limits? The composition engine already enforces max 15 modules per dispatch with token budget — this constraint stays. The composer must be smart about what fits.

---

## Rejected

*(nothing yet)*
