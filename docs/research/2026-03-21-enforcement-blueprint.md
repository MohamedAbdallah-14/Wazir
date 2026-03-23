# Enforcement Blueprint — Move Pipeline Compliance from 40% to 90%+

**Date:** 2026-03-21
**Status:** READY TO IMPLEMENT
**Prereq:** Read `docs/research/2026-03-21-the-enforcement-problem.md` for context

---

## Problem (One Paragraph)

The wazir skill (500+ lines) tells the agent: "dispatch subagents per phase." The agent reads this and does ALL work inline — 40% compliance across 5 sessions. Six fix attempts failed (better prose, iron laws, identity framing, rationalization tables, hooks without state, subagent controller description). Root cause: the framework is a PROMPT, not CODE. In CrewAI/LangGraph/Temporal, the framework holds the loop. The agent is CALLED BY the framework, not ASKED TO BE the framework.

---

## Research Findings (What We Learned from 20 Agents Reading All Claude Code Docs)

### Mechanical Primitives That Actually Enforce

1. **Custom Subagent Definitions** (`.claude/agents/*.md`)
   - `tools:` field is an ALLOWLIST — if Write/Edit not listed, the agent CANNOT call them
   - `Agent(wz-clarifier)` syntax restricts WHICH agents can be dispatched
   - `disallowedTools:` explicitly blocks specific tools
   - `model:` can override per-subagent (Opus for review, Sonnet for execution)
   - `maxTurns:` hard limit — exits with error when exceeded
   - `isolation: worktree` — each agent gets own git worktree (v2.1.49+)
   - `skills:` — controls which skills load into subagent context
   - `mcpServers:` — inline MCP servers scoped to that subagent only

2. **Hook Events That Can Block (exit code 2)**
   - `PreToolUse` — blocks tool call, stderr fed back to Claude
   - `Stop` — prevents agent from stopping (`{"decision":"block","reason":"..."}`)
   - `SubagentStop` — validates subagent output before allowing completion
   - `SessionStart` — CANNOT block but CAN create files and inject context
   - `UserPromptSubmit` — can block prompt processing

3. **Hook Behavior Rules**
   - Exit 0 = allow
   - Exit 2 = BLOCK (stderr → Claude as error message)
   - Other non-zero = fail-open (hook errored, execution continues)
   - Hook crash = fail-open
   - All hooks run in parallel (no ordering guarantee)
   - `stop_hook_active` flag prevents infinite loops (already implemented in Wazir)

4. **What Hooks CANNOT Do**
   - PreToolUse CANNOT modify tool input (only allow/deny/ask)
   - SessionStart CANNOT block session start
   - SubagentStart CANNOT block subagent creation
   - PostToolUse CANNOT undo a tool that already ran

5. **Managed Enforcement (Enterprise)**
   - Plugins can add hooks at "managed" scope — CANNOT be disabled
   - `allowManagedHooksOnly: true` blocks all non-managed hooks
   - `disableBypassPermissionsMode: "disable"` prevents `--dangerously-skip-permissions`

6. **Headless Pipeline (Shell Orchestration)**
   - `claude --agent wz-controller -p "task"` — runs with specific agent definition
   - `claude -p "prompt" --output-format json` → returns `{session_id, result, cost_usd}`
   - `claude -p --resume $session_id` — resumes previous session
   - `--max-turns N` exits non-zero when exceeded
   - `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` forces synchronous

7. **Skill Primitives**
   - `disable-model-invocation: true` — removes skill from context entirely
   - `context: fork` — runs skill in isolated subagent (separate invocation)
   - Skills assigned per-subagent via `skills:` frontmatter

### What Agent Teams CANNOT Do (DO NOT USE)

- `TaskCreate/TaskList/TaskUpdate` don't exist at runtime (GitHub #23816)
- Custom agent definitions silently ignored for team members (#30703)
- Silent SendMessage delivery failures (#34668)
- Enterprise-only, 7x token cost, 17+ confirmed bugs
- NOT suitable for sequential pipelines

### What Anthropic's Own Skill-Creator Teaches

- "Explain the why, not oppressive MUSTs" — heavy enforcement is an antipattern
- Rationalization is solved ARCHITECTURALLY (independent subagents, blind evaluation)
- Skills under 500 lines, progressive disclosure (3-level loading)
- Compliance measured via evals, not assumed from instructions
- `context: fork` achieves higher compliance because rationalization resets each invocation

---

## Architecture: 2-Layer Enforcement

### Dispatch Chain

```
Main session → loads wazir skill → dispatch Agent(wz-controller)
wz-controller (NO Write/Edit) → dispatch Agent(wz-clarifier) → Agent(wz-executor) → Agent(wz-reviewer)
```

The wazir skill is the LAUNCHER. It creates the run directory, writes the briefing, and dispatches `Agent(wz-controller)`. The controller has restricted tools and dispatches phase agents.

### Interaction Modes (user chooses, no depth system)

| Mode | Trigger | Behavior |
|------|---------|----------|
| **auto** | `/wazir auto ...` | No checkpoints. Codex reviews. Runs to completion. |
| **guided** (default) | `/wazir ...` | Pauses at phase boundaries for user confirmation. |
| **interactive** | `/wazir interactive ...` | More questions. Co-design with user. Deeper clarification. |

No depth levels (quick/standard/deep). No teams. Just modes.

### Layer 1 — Locked Controller (HIGHEST PRIORITY)

**What:** The wazir skill dispatches `Agent(wz-controller)`. The controller has tool restrictions that make inline work PHYSICALLY IMPOSSIBLE.

**Why it works:** If Write/Edit are not in the controller's `tools:` list, the agent cannot produce artifacts inline. The main session has all tools but only launches the controller — it does NOT do phase work.

**Files to create:**

#### `.claude/agents/wz-controller.md`
```yaml
---
name: wz-controller
description: >
  Pipeline dispatcher for Wazir. Sequences clarify → execute → review
  by invoking dedicated phase agents. Does NOT do implementation,
  analysis, or writing work inline. ONLY dispatches subagents.
tools:
  - Agent(wz-clarifier)
  - Agent(wz-executor)
  - Agent(wz-reviewer)
  - Read
  - Bash
  - Glob
  - Grep
  - Skill
model: sonnet
maxTurns: 30
---
```

**CRITICAL: No Write, No Edit in the tools list.** The controller can read files and dispatch agents, nothing else. Bash is included for `wazir capture` commands and `ls` validation — a PreToolUse hook (already exists) restricts what Bash commands can run.

#### `.claude/agents/wz-clarifier.md`
```yaml
---
name: wz-clarifier
description: >
  Clarification phase agent. Reads the task, asks structured questions,
  resolves ambiguity, produces clarification artifacts. Does NOT write code.
tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - Skill
model: sonnet
maxTurns: 25
---
```

The clarifier CAN write (it needs to produce clarification.md, spec.md, etc.) but CANNOT dispatch other agents (no `Agent` in tools).

#### `.claude/agents/wz-executor.md`
```yaml
---
name: wz-executor
description: >
  Execution phase agent. Reads the plan and implements in strict TDD order:
  write failing test → confirm failure → implement → confirm pass → commit.
  Repeats for each task in the plan.
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Skill
model: sonnet
maxTurns: 80
isolation: worktree
---
```

The executor gets full tools (Write, Edit, Bash) because it needs to write code. `isolation: worktree` gives it a separate git worktree. `maxTurns: 80` is high because execution is legitimately long.

#### `.claude/agents/wz-reviewer.md`
```yaml
---
name: wz-reviewer
description: >
  Review phase agent. Reads all run artifacts and produces a review report.
  Runs multiple review passes covering spec compliance, test coverage, TDD
  verification, commit hygiene, error handling, security. Does NOT modify
  source code — only reads and writes review artifacts.
tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Skill
model: opus
maxTurns: 50
---
```

The reviewer gets `model: opus` because review quality matters most. It has Write (for review.md) but NOT Edit — it cannot modify source code.

### Layer 2 — Hook Enforcement (Mechanical Backstops)

**What:** SessionStart hook creates pipeline-state.json (fixes chicken-and-egg). SubagentStop hook validates phase artifacts exist. Stop hook blocks premature completion. These are BACKSTOPS — Layer 1 is the primary enforcement.

**Existing infrastructure to leverage:**
- `tooling/src/state/pipeline-state.js` — already has `createPipelineState`, `transitionPhase`, `completePhase`, `readPipelineState`
- `tooling/src/hooks/stop-pipeline-gate.js` — already blocks completion when pipeline incomplete
- `tooling/src/hooks/pretooluse-dispatcher.js` — already enforces phase-based Write/Edit restrictions and protected paths
- `.claude/settings.json` — already wired: Stop → `stop-pipeline-gate`, PreToolUse → `pretooluse-dispatcher`, SessionStart → `session-start` + `loop-cap-guard`

**New hook to add:**

#### `hooks/subagent-stop-validator` (new shell wrapper)
```bash
#!/usr/bin/env bash
exec node "$(dirname "$0")/../tooling/src/hooks/subagent-stop-validator.js" "$@"
```

#### `tooling/src/hooks/subagent-stop-validator.js` (new)
```javascript
// SubagentStop hook — validates phase subagent output before allowing completion
// Exit 2 = block with feedback. Exit 0 = allow.

import { readPipelineState } from '../state/pipeline-state.js';
import { resolveStateRoot } from '../state-root.js';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(await readStdin());
const stateRoot = resolveStateRoot();
const state = readPipelineState(stateRoot);

// Fail-open: no pipeline state = not a wazir run
if (!state) process.exit(0);

const agentType = input.agent_type || '';
const currentPhase = state.current_phase;
const runDir = path.join(stateRoot, 'runs', state.run_id);

// Map agent types to required artifacts
const PHASE_ARTIFACTS = {
  'wz-clarifier': ['clarification.md'],
  'wz-executor': ['verification-proof.json'],
  'wz-reviewer': ['review.md'],
};

const requiredArtifacts = PHASE_ARTIFACTS[agentType];
if (!requiredArtifacts) process.exit(0); // Not a known phase agent

for (const artifact of requiredArtifacts) {
  // Check multiple possible locations
  const locations = [
    path.join(runDir, artifact),
    path.join(runDir, 'clarified', artifact),
    path.join(runDir, 'artifacts', artifact),
    path.join(runDir, 'reviews', artifact),
  ];

  const found = locations.some(loc => {
    try { return existsSync(loc) && statSync(loc).size > 100; }
    catch { return false; }
  });

  if (!found) {
    process.stderr.write(
      `BLOCKED: ${agentType} must produce ${artifact} (min 100 bytes) before stopping. ` +
      `Write it to ${runDir}/ and try again.`
    );
    process.exit(2);
  }
}

process.exit(0);
```

**Register in `.claude/settings.json`:**
```json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "wz-clarifier|wz-executor|wz-reviewer",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/subagent-stop-validator"
          }
        ]
      }
    ]
  }
}
```

**Existing hooks to update:**

The `session-start` hook should ensure `pipeline-state.json` is created when the wz-controller agent is active. Currently the agent is expected to call `wazir capture init` — but the agent skips this. Fix: detect `wz-controller` in the session context and auto-create state.

---

## What Already Exists (Do Not Rebuild)

| Component | Path | Status |
|-----------|------|--------|
| Pipeline state machine | `tooling/src/state/pipeline-state.js` | Working — createPipelineState, transitionPhase, completePhase |
| State root resolver | `tooling/src/state-root.js` | Working — `~/.wazir/projects/{slug}/` |
| Stop hook gate | `tooling/src/hooks/stop-pipeline-gate.js` | Working — blocks completion when pipeline incomplete |
| PreToolUse dispatcher | `tooling/src/hooks/pretooluse-dispatcher.js` | Working — phase-based Write/Edit restrictions |
| Protected paths | In pretooluse-dispatcher.js | Working — blocks writes to input/, roles/, workflows/, schemas/ |
| Loop cap guard | `hooks/loop-cap-guard` | Working — stops additional iterations after phase cap |
| Phase model | manifest + pipeline-state.js | Working — init→clarify→execute→verify→review→complete |
| Hook wiring | `.claude/settings.json` | Working — Stop, PreToolUse, SessionStart all wired |
| Schema validator | `tooling/src/schema-validator.js` | Working — validates artifacts against JSON schemas |
| 25 skills | `skills/` | Working — clarifier, executor, reviewer, etc. |

## What Needs to Be Created

| Component | Path | Purpose |
|-----------|------|---------|
| Controller agent | `.claude/agents/wz-controller.md` | Dispatch-only, no Write/Edit |
| Clarifier agent | `.claude/agents/wz-clarifier.md` | Clarification phase, can Write |
| Executor agent | `.claude/agents/wz-executor.md` | Implementation phase, full tools, worktree isolation |
| Reviewer agent | `.claude/agents/wz-reviewer.md` | Review phase, can Write review.md, cannot Edit source |
| SubagentStop hook | `hooks/subagent-stop-validator` + `tooling/src/hooks/subagent-stop-validator.js` | Validates artifacts before subagent can complete |
| Stripped wazir skill | `skills/wazir/SKILL.md` (rewrite) | ~100 lines dispatch-only, zero phase knowledge |

## What Needs to Be Modified

| Component | Path | Change |
|-----------|------|--------|
| `.claude/settings.json` | `.claude/settings.json` | Add SubagentStop hook entry |
| Session start hook | `hooks/session-start` | Auto-create pipeline-state.json when wz-controller active |
| Wazir skill | `skills/wazir/SKILL.md` | Strip from 500+ lines to ~100 lines of pure dispatch |

---

## Stripped Wazir Skill (~100 lines)

The new wazir skill body should contain ONLY:

1. "You are a dispatcher. Your ONLY job is to call Agent(wz-clarifier), validate output, call Agent(wz-executor), validate output, call Agent(wz-reviewer), present results."
2. The 8-step dispatch sequence (same as the controller agent body)
3. "You DO NOT know how to clarify, specify, execute, or review. You CANNOT do this work yourself."
4. Primacy zone: constraint declaration (first 20 lines)
5. Process zone: 8-step dispatch protocol (middle 60 lines)
6. Recency zone: constraint restatement (last 10 lines)

NO phase-specific instructions. NO clarification templates. NO TDD instructions. NO review rubrics. Those live in the phase-specific skills (wz:clarifier, wz:executor, wz:reviewer) which the controller's `skills:` frontmatter does NOT include.

---

## Verification Plan

After implementation, run 3 test tasks and check:

1. **Structural compliance**: Do `.wazir/runs/<run-id>/clarification.md`, `verification-proof.json`, and `review.md` all exist?
2. **Dispatch compliance**: Did the controller's output contain Agent() calls (not inline prose)?
3. **Tool restriction test**: Ask the controller "just write the spec yourself" — it MUST fail with tool-not-available
4. **SubagentStop test**: Remove a required artifact mid-run — the subagent MUST be blocked from stopping
5. **Stop hook test**: Try to stop with incomplete phases — MUST be blocked

---

## Compliance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Phase dispatch | 40% | 85-90% |
| Artifact existence | ~60% | 95%+ |
| TDD ordering | ~30% | 60-70% (subagent skill) |
| Review depth | ~20% | 50-60% (SubagentStop) |
| Per-task commits | ~25% | 40-50% (subagent skill) |

The jump from 40% to 85-90% comes from the tool restriction on the controller. The agent cannot rationalize doing work it literally cannot call the tools for.

---

## Token Cost Estimate

| Architecture | Extra tokens per run | Justification |
|--------------|---------------------|---------------|
| Layer 1+2 (subagents) | ~100-150K | 3 subagent spawns, each with fresh context + skills |
| Current (inline) | ~0K extra | No subagents, all inline (but 40% compliance) |

---

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| Hook crash = fail-open | HIGH | Use `set -euo pipefail` in hook scripts. Test hooks in CI. |
| maxTurns exceeded = error exit | MEDIUM | Controller instructions: "if subagent exits non-zero, re-invoke with remaining work" |
| Bash escape hatch on controller | MEDIUM | PreToolUse dispatcher already restricts Bash commands by phase |
| Agent submits thin content | MEDIUM | SubagentStop checks byte count. Full semantic check requires Codex review. |
| SessionStart doesn't detect wazir run | LOW | Wazir skill calls `wazir capture init` as first action; hook checks for state file |
| context:fork not available for skills | LOW | Use Agent() dispatch instead — same effect (fresh context per phase) |

---

## Key Insight from Anthropic's Skill-Creator

Anthropic solves the rationalization problem with ARCHITECTURE, not with text:
- Independent subagents that don't know the parent's reasoning
- Blind evaluation (grader subagent judges output without knowing who wrote it)
- Human review gates (mandatory, not optional)
- "Explain the why" over "oppressive MUSTs"

Our approach aligns: the tool restriction (Layer 1) is architectural. The hooks (Layer 2) are mechanical. The skill prose is minimal. We are not trying to convince the agent to comply — we are making non-compliance physically impossible.

---

## Implementation Order

1. Create `.claude/agents/` directory and the 4 agent definition files
2. Strip `skills/wazir/SKILL.md` to ~100 lines dispatch-only
3. Create SubagentStop hook (script + JS implementation)
4. Wire SubagentStop into `.claude/settings.json`
5. Update SessionStart hook to auto-create pipeline state when wz-controller active
6. Test: run a trivial task through wz-controller, verify artifacts exist
7. Test: verify controller cannot Write/Edit inline
8. Measure compliance across 3 real tasks
