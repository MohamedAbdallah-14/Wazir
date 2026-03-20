# Critical Fixes + New Features — 2026-03-20

ALL items must be implemented. Do NOT tier or defer any item.

---

## 1. Enforce ALL Enabled Workflows Complete Before Run Ends

**What:** Agents keep skipping enabled workflows (learn, prepare-next, verify). Need a universal completion check — every workflow with `enabled: true` must have a `phase_exit` event before the run can complete.

**Deliverables:**
- Add `validateRunCompletion(runPaths, runConfig)` to phase-prerequisite-guard.js
- `wazir capture summary` MUST call this check and REFUSE to mark run complete if any enabled workflow was skipped
- Update `skills/wazir/SKILL.md` — run completion check before presenting results
- Add AP-23: "Selectively skipping enabled workflows within a phase"
- Tests

### Online Research
- How GitHub Actions enforces all required jobs complete before merge
- How Temporal.io validates workflow step completion
- How superpowers enforces TDD — their Iron Law, rationalization tables, anti-skip enforcement

---

## 2. Enforce Git Workflow + Changelog Guidelines

**What:** Website example was built in a single commit with no changelog. Executor must commit per task with conventional format.

**Deliverables:**
- Executor must commit after each task (not batch)
- Each commit conventional format — verify with `wazir validate commits`
- Changelog updated for user-facing changes — verify with `wazir validate changelog`
- Per-task reviewer checks commit format + changelog before approving
- If executor batches into one commit, reviewer REJECTS

### Online Research
- How superpowers enforces commit discipline
- How conventional-changelog validates commit formats
- How keepachangelog.com recommends maintenance

---

## 3. Suppress Node.js ExperimentalWarning for SQLite

**What:** Every `wazir` CLI command prints `ExperimentalWarning: SQLite is an experimental feature`. Pollutes user output and demo GIFs.

**Deliverables:**
- Suppress the warning in CLI entrypoint (`--no-warnings` or `NODE_NO_WARNINGS=1` or filter specific warning)
- Verify: `wazir doctor` output is clean

---

## 4. Overnight Skill Research + Comparison (Research Only, No Auto-Apply)

**What:** Self-audit only finds surface issues. Build an overnight research mode that deeply analyzes N skills against the ecosystem.

**Per skill the overnight run does:**
1. Research — fetch superpowers equivalent + 2-3 other frameworks
2. Compare — side-by-side: Wazir strengths vs. weaknesses vs. competitors
3. Rate — completeness, enforcement strength, token efficiency, anti-rationalization coverage
4. Recommend — specific improvements with reasoning. NOT auto-applied.

**Output:** Branch with `reports/skill-audit-<date>/` containing one report per skill. Human reads and decides.

**Deliverables:**
- Create `skills/skill-research/SKILL.md`
- Structured comparison reports with ratings
- Runs in isolated worktree
- Commits reports only, never skill changes

### Online Research
- How superpowers enforces TDD — full analysis of their skill
- How autoresearch structures overnight improvement loops
- How code review bots produce suggestions without auto-applying

---

## 5. Mandatory Security Gate

**What:** 40+ security expertise modules exist but no enforcement. Executor can ship SQL injection and reviewer might not catch it.

**Deliverables:**
- Security sensitivity detector: scan diff for patterns (auth, password, token, query, SQL, fetch, upload, secret, env, API key, session, cookie, cors, csrf)
- If detected → automatically load security expertise + add security review dimensions (injection, auth bypass, data exposure, CSRF, XSS, secrets)
- MANDATORY when patterns detected — not optional
- Update reviewer + executor skills
- Security findings in phase report with severity

### Online Research
- How GitHub CodeQL detects security patterns
- How Snyk Code does SAST on AI-generated code
- How Semgrep rules detect OWASP top 10
- How autoresearch:security structures STRIDE + OWASP audit

---

## 6. Full-Auto Mode with Codex as Reviewer

**What:** Optional `auto_mode` in run-config. Pipeline runs end-to-end without human checkpoints. Codex reviews. Gating agent decides. On escalate — STOPS and waits.

**NOT the default. NOT recommended.** For overnight runs.

**Deliverables:**
- `auto_mode` field in run-config (default: false)
- When true, skip all "wait for user" checkpoints
- Gating agent replaces human at every checkpoint
- Codex REQUIRED in auto mode — refuse without external reviewer
- On escalate: STOP, write reason, wait
- Inline modifier: `/wazir auto build feature X`
- Wall-clock limit (default 4 hours)
- Never auto-commits to main

### Online Research
- How Karpathy's autoresearch runs overnight with keep/discard
- How OpenAI Symphony runs as autonomous daemon
- How Devin handles overnight runs

---

## 7. Clarifier Must ASK, Not Decide — Batched Questions After Research

**What:** Clarifier makes uninformed scope decisions instead of asking. Example: decided "docs and i18n are out of scope" without asking the user.

**Deliverables:**
- Research runs FIRST, then clarifier asks INFORMED questions
- 1-3 batches of 3-7 questions (not one-at-a-time)
- Every scope exclusion must be explicitly confirmed by user
- If input is clear — zero questions is fine, just confirm understanding
- Rewrite `skills/clarifier/SKILL.md` Phase 1A
- Add AP-24: "Clarifier making scope decisions without asking"

### Online Research
- How superpowers brainstorming handles question batching
- How Devin asks clarifying questions
- How GitHub Copilot Workspace presents scope decisions for approval

---

## 8. Capture ALL User Input to File

**What:** The learning system design specified user input capture but it was never implemented. ALL user messages during a run must be saved — corrections, approvals, rejections, mid-run redirections are the highest-quality learning signal.

**Deliverables:**
- Create user input capture in `tooling/src/capture/user-input.js`
- Save to `.wazir/runs/<id>/user-input-log.ndjson`
- Format: `{"timestamp", "phase", "type" (instruction/approval/correction/rejection), "content", "context"}`
- Wire into pipeline — every user message during a run gets captured
- Retention: keep last 10 runs, archive older
- This feeds the learning system — user corrections are the strongest signal

### Online Research
- How RLHF pipelines structure feedback collection
- How LangMem captures user interactions for prompt optimization
- How CrewAI's memory system stores user preferences

---

## 9. Show Reasoning Chain — Why We Made Each Decision

**What:** The pipeline makes decisions (what to research, what to clarify, what to flag) but never explains WHY. The user sees outputs but not the reasoning. Example: researcher decides to look up Devin — but why? What triggered that? The user should see the thought process, not just the result.

**Two layers:**

**Layer 1: Conversation output (concise — for the user)**
- Before each decision: one sentence explaining the trigger
- "Your request mentions 'overnight autonomous run' — researching how Devin and Karpathy's autoresearch handle this, because unattended runs need different safety constraints than interactive ones."
- "Found 3 auth-related files in your codebase — triggering security review dimensions because auth code is the #1 source of vulnerabilities in AI-generated code."
- Not verbose — one trigger sentence, one reasoning sentence.

**Layer 2: File output (detailed — for learning and reports)**
- Full reasoning chain saved to `.wazir/runs/<id>/reasoning/phase-<name>-reasoning.md`
- Every decision with: trigger (what prompted it), options considered, option chosen, reasoning, confidence level
- This feeds the learning system — if reasoning was wrong (user corrected), the correction + original reasoning = strong learning signal
- Reports reference the reasoning file for audit trail

**Deliverables:**
- Update all phase skills (clarifier, executor, reviewer) — add reasoning output instructions
- Conversation output: concise trigger + reasoning before each major decision
- File output: full reasoning chain per phase
- Reasoning format: `{ trigger, options, chosen, reasoning, confidence, counterfactual }`
- The `counterfactual` field answers: "What would have gone wrong if we didn't have this info?" — this is how the user sees Wazir's value
- Example: `counterfactual: "Without researching your auth setup, I would have built JWT middleware — but your project uses Supabase. That's 2 days of rework avoided."`
- Counterfactuals appear in BOTH conversation output AND reasoning files
- Wire reasoning files into learning system — corrections against reasoning = highest-value learnings

---

## 10. Self-Audit Compares Input vs. Shipped Output

**What:** Self-audit only checks structural issues. It should also verify: did the implementation cover everything the user asked for?

**Deliverables:**
- New self-audit dimension: **Input Coverage**
  - Read the original input file(s) from `.wazir/input/` or `.wazir/runs/<id>/sources/`
  - Read the execution plan
  - Read the actual commits/changes
  - Compare: every item in the input should map to at least one task in the plan AND at least one commit in the output
  - Missing items are HIGH severity findings
- Add to `skills/self-audit/SKILL.md` as a Phase 2 dimension
- This catches the scope-reduction problem AFTER the fact — a safety net for when the clarifier fails to ask

---

## 11. Plan-Review Must Compare Plan vs. Original Input

**What:** The plan-review loop checks internal consistency but NOT whether the plan covers the user's full request. This is how 21 items became 5 — the plan was internally consistent but missed 16 items.

**Deliverables:**
- Add a new review dimension to `--mode plan-review`: **Input Coverage**
  - Reviewer reads the original input/briefing
  - Counts distinct items/requirements in the input
  - Counts tasks in the execution plan
  - If `tasks_in_plan < items_in_input` → HIGH finding: "Plan covers N of M input items. Missing: [list]"
- Update `skills/reviewer/SKILL.md` plan-review dimensions
- Update `workflows/plan-review.md`
- This is the review-level enforcement of the "no scope reduction" rule

### Online Research
- How GitHub Spec-Kit validates spec coverage against requirements
- How traceability matrices work in traditional software engineering (requirement → design → code → test)

---

## 12. Two-Level Phase Model — Phases and Workflows

**What:** The pipeline has 4 top-level phases but the clarifier phase alone has 9 workflows with review loops. The code, docs, and user experience need to clearly distinguish these two levels.

**The model:**
```
Phase 1: Init
  └── (inline — no workflows)

Phase 2: Clarifier
  ├── discover (research) ← review loop
  ├── clarify ← review loop
  ├── specify ← spec-challenge loop
  ├── author (adaptive) ← approval gate
  ├── design ← design-review loop
  └── plan ← plan-review loop

Phase 3: Executor
  ├── execute (per-task) ← task-review loop per task
  └── verify

Phase 4: Final Review
  ├── review (final) ← scored review
  ├── learn
  └── prepare-next
```

**What needs to change:**
- Event capture uses workflow names (discover, clarify, specify...) not phase names
- Reports show BOTH levels: "Phase 2: Clarifier > Workflow: specify > Review loop: spec-challenge pass 3"
- User sees phase-level progress ("Clarifier phase: 4 of 6 workflows complete") AND workflow-level detail when relevant
- `workflow_policy` in run-config controls individual workflows (already exists)
- Phase-level tracking aggregates workflow completions
- Status output: `wazir status` shows both levels

**Deliverables:**
- Update `skills/wazir/SKILL.md` — clearly document both levels
- Update `docs/reference/configuration-reference.md` — already has the table, verify it matches reality
- Update phase report schema — include `parent_phase` field
- Update `wazir status` output to show phase > workflow hierarchy
- Conversation output shows phase-level progress markers between workflows

---

## 9. Show Reasoning Chain — Why We Made Each Decision

### Online Research
- How Chain-of-Thought prompting structures reasoning chains
- How Devin shows its thinking/reasoning to users
- How GitHub Copilot Workspace explains step-by-step reasoning
- How Anthropic recommends showing agent reasoning to users (effective context engineering blog)
