# Skill Tier Classification

Audit of Wazir skills against Superpowers v4.3.1 skills.
Each skill is classified into one of three tiers:

- **Delegate** -- use superpowers skill as-is, delete Wazir fork
- **Augment** -- use superpowers skill + inject Wazir context addendum (strictly additive, no overrides). **NOTE:** R2 validation found this tier is not implementable -- see [Augment Mechanism](#augment-mechanism) below.
- **Own** -- Wazir-original or structurally rewritten skill, rename to `wz:` prefix

---

## Classification Table

| Wazir Skill | Superpowers Equivalent | Tier | Rationale | Risk Notes |
|---|---|---|---|---|
| brainstorming | brainstorming | **Own** | Structurally rewritten. Superpowers version is a linear checklist (explore context, ask questions, propose approaches, present design, write doc, invoke writing-plans). Wazir replaces the entire process: adds Command Routing and Codebase Exploration preambles, replaces the design-doc step with a design-review loop (`--mode design-review` with canonical dimensions), and outputs to `.wazir/runs/latest/clarified/design.md` instead of `docs/plans/`. None of the superpowers process steps survive intact. | -- |
| clarifier | _(none)_ | **Own** | Wazir-original. No superpowers counterpart exists. | -- |
| debugging | systematic-debugging | **Own** | Structurally rewritten. Superpowers has a 4-phase process (Root Cause Investigation with 5 substeps, Pattern Analysis, Hypothesis and Testing, Implementation) totaling ~300 lines with detailed examples, rationalization tables, and supporting technique references. Wazir condenses this to a 4-step observe-hypothesize-test-fix loop (~75 lines), replaces all codebase exploration with Wazir CLI symbol-first exploration (`wazir index search-symbols`, `wazir recall symbol` and `wazir recall file`), adds loop cap awareness (pipeline mode with `wazir capture loop-check` vs. standalone mode), and removes all superpowers examples, rationalization tables, and red-flag lists. The methodology is fundamentally different in structure despite sharing the spirit of "root cause first." | Delegating would lose Wazir CLI integration and loop cap awareness. Superpowers version is far more detailed on anti-patterns and may be worth referencing separately. |
| design | _(none)_ | **Own** | Wazir-original. No superpowers counterpart exists. | -- |
| dispatching-parallel-agents | dispatching-parallel-agents | **Own** | Reclassified from Augment to Own (R2). Skill shadowing is full-override, so Augment tier is not implementable via `~/.claude/skills/`. Wazir already carries the full content: superpowers core (When to Use decision tree, The Pattern with 4 steps, Agent Prompt Structure, Common Mistakes section) plus Wazir additions (Command Routing preamble, Codebase Exploration preamble, philosophical paragraph in Overview, Problem/Fix format for Common Mistakes). Drops superpowers-only sections: "When NOT to Use," "Real Example from Session," "Key Benefits," "Verification," "Real-World Impact." | Superpowers informational sections (Real Example, Key Benefits, Verification, Real-World Impact) not carried forward. Low risk -- these are teaching content, not behavioral. |
| executing-plans | executing-plans | **Own** | Structurally rewritten. Superpowers uses batch execution (default first 3 tasks) with report-and-wait checkpoints and explicit batch feedback loops. Wazir replaces batching with per-task execution, adds a per-task review loop (`--mode task-review` with 5 task-execution dimensions, Codex integration, review log filenames, loop cap tracking via `wazir capture loop-check`), adds standalone vs. pipeline mode detection, and adds a note recommending wz:subagent-driven-development when subagents are available. The batch-vs-per-task change is a core behavioral difference. All integration references point to `wz:` skills. | Delegating would lose per-task review loops and pipeline mode integration. |
| executor | _(none)_ | **Own** | Wazir-original. No superpowers counterpart exists. | -- |
| finishing-a-development-branch | finishing-a-development-branch | **Own** | Reclassified from Augment to Own (R2). Skill shadowing is full-override, so Augment tier is not implementable via `~/.claude/skills/`. Wazir already carries the full content: superpowers process (5 steps: verify tests, determine base branch, present 4 options, execute choice, cleanup worktree) preserved with identical structure and identical option semantics. Wazir adds Command Routing and Codebase Exploration preambles. Minor cosmetic changes: `<N>` removed from failure template, `<base-branch>` shortened to `<base>`, emoji checkmarks replaced with Y/-, `<commit-list>` changed to `<count>`, PR body simplified. Red Flags and Integration sections trimmed but no behavioral contradiction. | Low risk. The superpowers version has more detailed Red Flags and Integration sections not carried forward. |
| humanize | _(none)_ | **Own** | Wazir-original. No superpowers counterpart exists. | -- |
| init-pipeline | _(none)_ | **Own** | Wazir-original. No superpowers counterpart exists. | -- |
| prepare-next | _(none)_ | **Own** | Wazir-original. No superpowers counterpart exists. | -- |
| receiving-code-review | receiving-code-review | **Own** | Structurally rewritten. Superpowers has extensive sections: Forbidden Responses, Source-Specific Handling, YAGNI Check, Implementation Order, When To Push Back, Acknowledging Correct Feedback (with detailed anti-patterns for gratitude), Gracefully Correcting Pushback, Common Mistakes table, Real Examples, and GitHub Thread Replies. Wazir preserves the core Response Pattern and Forbidden Responses but: (1) adds Loop Tracking section (pipeline mode with `wazir capture loop-check` and standalone pass counts), (2) restructures Implementation Order to a 4-tier priority (blocking, functional, quality, nice-to-have) instead of 3-tier, (3) adds a Quick Reference decision table, (4) removes the entire "Acknowledging Correct Feedback" anti-gratitude section, the "Gracefully Correcting Pushback" section, the Common Mistakes table, all Real Examples, the "When To Push Back" enumeration, and the GitHub Thread Replies section. The Loop Tracking addition and structural deletions make this a substantive rewrite. | Delegating would lose loop tracking. The removed anti-gratitude and pushback sections from superpowers are valuable behavioral guardrails worth preserving. |
| requesting-code-review | requesting-code-review | **Own** | Structurally rewritten. Both skills share the same When to Request triggers and Example structure. But Wazir: (1) replaces `superpowers:code-reviewer` with `wz:code-reviewer`, (2) adds explicit review loop parameters (`--mode`, depth-aware dimensions, pass number), (3) adds `codex review --uncommitted` and `codex review --base` commands, (4) adds Codex Error Handling section, (5) adds `{REVIEW_MODE}` placeholder, (6) changes Integration section to reference per-task review checkpoints instead of batch review, (7) adds "Dispatch review without explicit `--mode`" to Red Flags. The Codex integration and review loop parameter system are structural additions that change how reviews are dispatched. | Delegating would lose Codex integration and review loop protocol. |
| reviewer | _(none)_ | **Own** | Wazir-original. No superpowers counterpart exists. | -- |
| run-audit | _(none)_ | **Own** | Wazir-original. No superpowers counterpart exists. | -- |
| scan-project | _(none)_ | **Own** | Wazir-original. No superpowers counterpart exists. | -- |
| self-audit | _(none)_ | **Own** | Wazir-original. No superpowers counterpart exists. | -- |
| subagent-driven-development | subagent-driven-development | **Own** | Structurally rewritten. Both share the same high-level process (fresh subagent per task, two-stage review, spec then quality). But Wazir: (1) adds `Capture PRE_TASK_SHA` step to the process flowchart for diff scoping, (2) adds Code Review Scoping section (`codex review --base <pre-task-sha>`), (3) adds Review Loop Alignment section (explicit `--mode task-review`, task-scoped log filenames, loop cap via `wazir capture loop-check`), (4) adds Codex Error Handling section, (5) adds standalone mode fallback, (6) changes all skill references from `superpowers:` to `wz:`, (7) adds "Review the wrong diff" to Red Flags, (8) removes the Example Workflow, Advantages detail, and Cost breakdown from superpowers. The diff-scoping and review-loop integration are structural process changes. | Delegating would lose diff-scoped reviews and Codex integration. The removed Example Workflow from superpowers is a useful teaching tool. |
| tdd | test-driven-development | **Own** | Structurally rewritten. Superpowers has an exhaustive treatment (~370 lines): detailed Red-Green-Refactor with Good/Bad code examples, Iron Law with explicit "delete and start over" rules, a Verification Checklist, extensive Why Order Matters section, Common Rationalizations table, When Stuck guide, Testing Anti-Patterns reference, and Debugging Integration. Wazir condenses to ~45 lines with 3 steps (RED, GREEN, REFACTOR), adds a single-pass test quality check in RED phase ("Are these tests testing the right behavior? Are they real assertions?"), and removes all examples, rationalization tables, and elaboration. Different description and name (`wz:tdd` vs `test-driven-development`). | Delegating would lose the test quality check. The superpowers version's extensive rationalization prevention and examples are valuable for discipline enforcement but costly in tokens. |
| using-git-worktrees | using-git-worktrees | **Own** | Reclassified from Augment to Own (R2). Skill shadowing is full-override, so Augment tier is not implementable via `~/.claude/skills/`. Wazir already carries the full content: superpowers core process (directory selection priority, safety verification with `git check-ignore`, creation steps, project setup auto-detection, clean baseline verification) preserved structurally intact. Wazir adds: Command Routing preamble, Codebase Exploration preamble, global directory changed from `~/.config/superpowers/worktrees/` to `~/.wazir/worktrees/`, Cleanup and Common Issues sections (submodules, lock files, stale worktrees). Drops superpowers-only sections: Example Workflow, Quick Reference table, Common Mistakes, Red Flags, Integration. | Dropped superpowers sections (Quick Reference, Common Mistakes, Red Flags, Integration) reduce operational guardrails. Could be recovered into the Own skill. |
| using-skills | using-superpowers | **Own** | Structurally rewritten. Both enforce the same core rule (invoke skills before any response, even at 1% chance). But Wazir: (1) renames from `using-superpowers` to `using-skills`, (2) changes all internal skill references from `superpowers:` to `wz:` throughout flowchart and examples, (3) removes the Skill Types section detail about "Rigid vs Flexible" elaboration, (4) removes User Instructions elaboration. The name change and systematic `wz:` prefix replacement throughout the flowchart make this a namespace-level rewrite. | Could potentially be Augment if namespace mapping were handled at a routing layer rather than in-skill. |
| verification | verification-before-completion | **Own** | Structurally rewritten. Superpowers has an exhaustive treatment (~140 lines): Iron Law, Gate Function (5-step IDENTIFY/RUN/READ/VERIFY/CLAIM), Common Failures table, Red Flags list, Rationalization Prevention table, Key Patterns (tests, regression, build, requirements, agent delegation), Why This Matters section with 24 failure memories, and When To Apply section. Wazir condenses to ~35 lines with 3 bullet requirements (what was verified, exact command, actual result), a minimum rule, and a brief "when verification fails" section. Different name (`wz:verification` vs `verification-before-completion`). | Delegating would lose the concise Wazir format. The superpowers version's extensive rationalization prevention is valuable for discipline but token-expensive. The Wazir version may be too terse to enforce the discipline effectively. |
| wazir | _(none)_ | **Own** | Wazir-original. No superpowers counterpart exists. | -- |
| writing-plans | writing-plans | **Own** | Structurally rewritten. Superpowers focuses on plan document format (header template, task structure with bite-sized steps, code examples in plan, execution handoff to subagent-driven or parallel session). Wazir: (1) changes inputs to "approved design or approved clarified direction" instead of "spec or requirements", (2) adds pipeline-aware output paths (`.wazir/runs/latest/clarified/execution-plan.md` and `.wazir/runs/latest/tasks/task-NNN/spec.md` vs. standalone `docs/plans/`), (3) removes the plan document format template entirely (no header template, no task structure template, no code examples), (4) adds Plan Review Loop section with `wz:reviewer --mode plan-review`, Codex integration via stdin pipe, Codex error handling, depth-aware pass counts, and standalone fallback. The plan review loop and pipeline path system are structural additions; the removal of the format template is a structural deletion. | Delegating would lose pipeline integration and plan review loop. The removed format template from superpowers is valuable for plan quality and could be worth recovering. |
| writing-skills | writing-skills | **Own** | Structurally rewritten. Both share the TDD-for-skills philosophy and RED-GREEN-REFACTOR mapping. But Wazir: (1) condenses from ~650 lines to ~170 lines, (2) removes the extensive SKILL.md Structure template, CSO (Claude Search Optimization) section, Flowchart Usage guidelines, Code Examples guidelines, Token Efficiency section, File Organization examples, Testing All Skill Types section (discipline/technique/pattern/reference), Common Rationalizations for Skipping Testing table, Bulletproofing Skills Against Rationalization section (with Cialdini psychology reference), Skill Creation Checklist, Discovery Workflow, Anti-Patterns section, and STOP deployment gate, (3) adds "Be Prescriptive, Not Descriptive" guidance, "Use Rationalization Prevention" example, "Include Decision Trees" guidance, and skill reference syntax. The massive content reduction and different teaching approach make this a structural rewrite. | Delegating would lose the concise prescriptive format. The superpowers version's CSO guidelines, testing methodology, and anti-pattern catalog are extremely valuable reference material. |

---

## Superpowers Skills with No Wazir Counterpart

These superpowers skills have no Wazir fork. They could be used as-is via the superpowers plugin.

| Superpowers Skill | Status | Notes |
|---|---|---|
| using-superpowers | Replaced by `wz:using-skills` | See using-skills row above. |

All 14 superpowers skills have a Wazir counterpart (using-superpowers maps to using-skills, systematic-debugging maps to debugging, test-driven-development maps to tdd, verification-before-completion maps to verification).

---

## Summary by Tier

| Tier | Count | Skills |
|---|---|---|
| **Own** | 25 | brainstorming, clarifier, debugging, design, dispatching-parallel-agents, executing-plans, executor, finishing-a-development-branch, humanize, init-pipeline, prepare-next, receiving-code-review, requesting-code-review, reviewer, run-audit, scan-project, self-audit, subagent-driven-development, tdd, using-git-worktrees, using-skills, verification, wazir, writing-plans, writing-skills |
| **Augment** | 0 | _(none -- tier not implementable, see [Augment Mechanism](#augment-mechanism))_ |
| **Delegate** | 0 | _(none)_ |

---

## Common Wazir Additions (Appear in All Forked Skills)

Every Wazir fork of a superpowers skill adds these two preamble sections:

1. **Command Routing** -- routes large commands to context-mode tools and small commands to native Bash, following `hooks/routing-matrix.json`.
2. **Codebase Exploration** -- prescribes symbol-first exploration via `wazir index search-symbols` and `wazir recall`, with fallback to direct file reads.

These preambles alone would justify **Augment** tier for any skill where no other structural changes exist.

---

## Augment Mechanism

**Research date:** 2026-03-19 (R2: Composition Infrastructure Validation)

### Finding: Augment tier is not implementable

The Augment tier assumed that placing a Wazir addendum at `~/.claude/skills/<skill-name>/SKILL.md` would layer Wazir context on top of the superpowers base skill. This assumption is wrong. **Skill shadowing is full-override, not merge/append.**

### Evidence

**1. `skills-core.js` `resolveSkillPath()` (superpowers v4.3.1)**

The function at `lib/skills-core.js:108-140` checks personal skills directory first. If `~/.claude/skills/<name>/SKILL.md` exists, it returns that file immediately and never reads the superpowers version. There is no content merging.

```
// Try personal skills first (unless explicitly superpowers:)
if (!forceSuperpowers && personalDir) {
    const personalSkillFile = path.join(personalDir, actualSkillName, 'SKILL.md');
    if (fs.existsSync(personalSkillFile)) {
        return { skillFile: personalSkillFile, sourceType: 'personal', ... };
        // ^^^ returns here -- superpowers version never consulted
    }
}
```

**2. Superpowers test suite confirms override behavior**

`tests/opencode/test-skills-core.sh` line 336 asserts:
```
[PASS] Personal skills shadow superpowers skills
```

The test creates `personal-skills/shared-skill/SKILL.md` and `superpowers-skills/shared-skill/SKILL.md`, resolves `shared-skill`, and verifies `sourceType` is `"personal"` -- the superpowers version is invisible.

**3. Superpowers RELEASE-NOTES.md v3.3.0**

Line 385 documents the behavior explicitly: "Personal skills override superpowers skills when names match."

**4. The `superpowers:` prefix bypass is not available in Claude Code**

`skills-core.js` supports `superpowers:skill-name` syntax to force resolution to the superpowers version even when a personal skill shadows it. However, `skills-core.js` is only used by the OpenCode plugin (`/.opencode/plugins/superpowers.js`). Claude Code's native `Skill` tool has its own built-in resolution logic that does not expose this prefix bypass.

### Alternatives Considered

| Approach | Viable? | Why |
|---|---|---|
| Place addendum in `~/.claude/skills/<name>/` | No | Full override -- base skill content lost |
| Merge base + addendum in SKILL.md at install time | Partial | Would work but creates a maintenance coupling: every superpowers update requires re-merging. This is functionally identical to Own tier. |
| Inject Wazir context via CLAUDE.md | No | CLAUDE.md is project-scoped; skill behavior should be global across all projects |
| Use `superpowers:` prefix to load base, then append | No | Prefix only works in OpenCode's `skills-core.js`, not in Claude Code's native Skill tool |
| Propose upstream merge/append feature | Future | Would require a superpowers or Claude Code platform change |

### Conclusion

The Augment tier is architecturally impossible with the current skill discovery mechanism. All three former Augment skills (dispatching-parallel-agents, finishing-a-development-branch, using-git-worktrees) are reclassified to **Own** tier. Since the Wazir versions already carry the full superpowers base content plus Wazir additions, no content is lost -- the skills simply cannot delegate to a shared base.

If superpowers or Claude Code introduces a composition/layering mechanism in the future (e.g., `extends: superpowers:dispatching-parallel-agents` in frontmatter), the Augment tier could be revisited.

---

## Observations

1. **No Delegate candidates exist.** Every Wazir fork adds at minimum the Command Routing and Codebase Exploration preambles, which prevents pure delegation.

2. **Augment tier is not implementable.** R2 validation (2026-03-19) found that skill shadowing in both superpowers `skills-core.js` and Claude Code's native Skill tool is full-override: placing a SKILL.md in `~/.claude/skills/<name>/` completely replaces the superpowers skill with the same name. There is no merge or append mechanism. The three former Augment candidates (dispatching-parallel-agents, finishing-a-development-branch, using-git-worktrees) have been reclassified to Own. See [Augment Mechanism](#augment-mechanism) for full analysis.

3. **All 14 forked skills are Own** because either (a) they introduce structural process changes (review loops, pipeline mode, Codex integration, content restructuring) or (b) the Augment composition mechanism does not exist in the platform.

4. **Token cost tradeoff is significant.** Several Wazir Own skills (tdd, verification, debugging, writing-skills) are dramatically shorter than their superpowers counterparts. The superpowers versions contain valuable rationalization prevention tables, detailed examples, and anti-pattern catalogs that enforce discipline. The Wazir versions trade this for token efficiency. This tradeoff should be revisited -- some of the removed discipline content may be worth recovering as separate reference files.

5. **The `wz:` prefix is already applied** in skill names within the Wazir SKILL.md frontmatter for all forked skills, consistent with the Own tier convention.
