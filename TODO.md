# Wazir TODO

## Phase A: Restore Stability — DONE
- [x] Preserve research docs (copy out before rollback)
- [x] Rollback main to 9d0f3b0 (PR #4 — last stable state)
- [x] Clean up stale branches (keep enforcement-experiments for reference)
- [x] Verify tests pass (639/639) + exports build
- [x] Sync plugin cache with restored skills
- [x] Create scripts/sync-plugin.sh for future rollbacks

## Phase B: Brainstorm — IN PROGRESS
- [ ] Brainstorm enforcement architecture based on ALL research
- [x] Decide approach: COMBINED — stack 3 independent mechanisms for compound miss-rate reduction
- [ ] Write execution plan
- [ ] Decide on context minimization strategy (current wazir skill = 753 lines = too much)

### Combined Enforcement Strategy (3 layers, each ~50% catch → combined ~87.5%)
1. **Hook injection** — SessionStart/PreToolUse hooks inject current step into agent context automatically. Agent can't avoid seeing it. Catches: agent never reads the pipeline file.
2. **File reminders** — Short (1-2 line) identical pipeline compliance tags at start, middle, end of every skill file. Not prose, not persuasion — mechanical instruction ("Read .pipeline.md. Follow current step."). Catches: agent reads skill but ignores pipeline.
3. **Minimal PIPELINE context, full TASK context** — Externalize phase ordering, step checklists, and process rules to .pipeline.md. Inject ONLY current step via hooks. Keep expertise modules, specs, plans, and domain knowledge in full context — that's task context the agent needs to do good work. TME pattern (100% completion) removed task MANAGEMENT, not task KNOWLEDGE.

## Phase C: Context Minimization (NEW — from memory/context research)
- [ ] Reduce wazir skill to current-step-only injection (TME pattern: 100% completion, 0 hallucinations)
- [ ] Move pipeline state to external file (agent sees ONLY current step + neighbors)
- [ ] Measure context window usage before/after
- [ ] Measure compliance impact of smaller context

## BLOCKER: PreToolUse injection is advisory, not blocking
Codex confirmed: even with phase files created, the PreToolUse injection hook never denies tool calls (always exit 0). The agent can ignore the injected "CURRENT: clarifier step 1" and write code. The Stop hook only fires on stop, not during work. The ONLY hard enforcement is `wazir capture event` transition validation — but if the agent never calls it, nothing stops it.

Options to fix:
- [ ] Make PreToolUse hook DENY Write/Edit during wrong phase (not just inject a message)
- [ ] Add phase-aware write guard: if current phase is clarifier, block Write to src/ files
- [ ] Combine with bootstrap gate pattern: if phase is clarifier, only allow wazir/git/read + .wazir writes

## Phase D: Hook Enforcement
- [ ] SessionStart hook creates pipeline-state.json automatically (research priority #1)
- [ ] Artifact validation on `wazir capture event` phase transitions
- [ ] Measure compliance baseline (PR #4 skills, before changes)
- [ ] Measure compliance after hook enforcement

## Phase E: Prompt Restructuring (DeCRIM-style)
- [ ] Research and apply DeCRIM-style prompt structure (decomposed constraints, not prose)
- [ ] Restructure remaining skills: shorter, explicit numbered constraints, no psychology bloat
- [ ] Measure compliance after prompt changes

## Ideas (not yet prioritized)
- [ ] Build compliance self-audit skill — manual post-session skill for brutal honest self-evaluation, possibly with external reviewer tool
- [ ] UI for pipeline progress (pixel-agents inspiration, claude-replay) — deferred until enforcement works
- [ ] Expand to Codex, Gemini, Cursor after Claude Code works well
- [ ] Study GSD's context rot solution (fresh 200K subagent contexts per task)
- [ ] ContextCov approach: auto-generate executable constraints from SKILL.md files (arXiv:2603.00822)
- [ ] Process Reward Model for step-level compliance checking (needs domain-specific training data)

## Compliance Target
- **80%** pipeline conformance measured by post-session self-audit
- Current baseline: ~40-58% across 7 sessions
- Research ceiling: ~87.5% (3-layer compound enforcement)

## Research References
- docs/research/2026-03-23-enforcement-research-synthesis.md — 7-agent synthesis (hooks, frameworks, prompting, HITL, validation, fine-tuning, academic)
- docs/research/2026-03-21-the-enforcement-problem.md — problem statement + 4 options
- docs/research/2026-03-19-21-comprehensive-session.md — 3-day session record

### Key Papers — Enforcement
- arXiv:2402.16905 — TSL automaton, 96% compliance (gold standard)
- arXiv:2602.16708 — PCAS, 93% with reference monitor
- arXiv:2402.01817 — "LLMs Can't Plan" (theoretical foundation)
- arXiv:2503.18666 — AgentSpec, >90% with runtime DSL enforcement
- arXiv:2410.06458 — DeCRIM (decompose-critique-refine for multi-constraint)
- arXiv:2510.05307 — CHI 2026, optimal checkpoint placement

### Key Papers — Context/Memory (NEW)
- arXiv:2504.08525 — TME: 100% task completion, 0 hallucinations, 19.4% token reduction via external task tree
- "Context Length Alone Hurts" — Amazon/UIUC 2025: 13.9–85% degradation from length alone
- Context Rot — Chroma 2025: all 18 LLMs below 50% at 32K tokens
- LIFBench — ACL 2025: instruction-following degrades as context grows (all 20 LLMs)
- arXiv:2602.11988 — ETH Zurich: adding context files REDUCES task success
- arXiv:2509.19517 — Cognitive Load Limits: "context saturation" threshold documented
- Toby Ord half-life paper 2025 — agent success follows exponential decay with accumulated context
