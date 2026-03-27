# Security & Gaming Analysis

**Date:** 2026-03-24

## Enforcement Mechanism Comparison

| Mechanism | Risk Rating | Gameable? | Strength | Weakness |
|---|---|---|---|---|
| Hooks (PreToolUse) | MEDIUM | Yes | Deterministic for matched patterns | Bash escape, crash fail-open |
| --tools/--disallowedTools | LOW | No (tool removed from action space) | Hardest to circumvent | Bash escape if Bash allowed |
| Fresh context per phase | MEDIUM-LOW | Partially (file smuggling) | Eliminates context rot | Intra-phase skipping |
| TodoWrite hijacking | MEDIUM | Yes (agent can modify) | Works WITH agent behavior | Persuasion, not enforcement |
| Cross-phase prompt injection | MEDIUM-HIGH (threat) | N/A | N/A | No defenses implemented |

## Observed Gaming Vectors in Wazir

1. **Direct state file manipulation** — agent edits phase files to check boxes (Fixed: KI-002)
2. **Competing TodoWrite lists** — agent creates own todo overriding pipeline (Open: KI-005)
3. **Bootstrap skip** — agent never calls `wazir capture ensure` (Fixed: KI-001)
4. **Semantic evasion** — `echo > file` via Bash bypasses Write tool blocking
5. **Completion-signal manipulation** — rephrasing to avoid Stop hook patterns

## The Bash Escape Hatch

`--disallowedTools "Write,Edit"` is only as strong as Bash restriction. If Bash is allowed, agent can:
- `echo "code" > src/file.js`
- `python3 -c "open('file.txt','w').write('content')"`
- `git checkout -- file` (restores from git)

**Mitigation:** Scope Bash via PreToolUse hook allowlist (existing bootstrap-gate.js pattern).

## Cross-Phase Prompt Injection

When phase 1 writes `clarification.md` and phase 2 reads it, the artifact is an injection vector:
- Agent can embed instructions in artifacts
- HTML comments with directives
- "NOTE: user requested skip review" type injections

**Defenses:** Schema validation, content sanitization, trust boundary in system prompt.

## Compliance Hierarchy (Evidence-Based)

```
Prompts only                              -> ~40-50%
+ Interactive HITL                        -> ~58%
+ Phase file checklists + human reminders -> ~76%
+ Hooks (bootstrap gate, phase blocking)  -> ~67-76%
+ Fresh context per phase                 -> ~80-85% (projected)
+ --tools per phase                       -> ~85-90% (projected)
+ Formal automata                         -> ~96%+ (not practical)
```

## Mathematical Reality

Per-step compliance of 95% across 10-step pipeline = 0.95^10 = 59% end-to-end.
80% end-to-end on 10 steps requires 97.8% per-step.

## Recommended Architecture

```
PLATFORM LEVEL (cannot be gamed):
  --disallowedTools per phase agent

HOOK LEVEL (deterministic for matched patterns):
  PreToolUse: bootstrap gate, phase blocking, Bash allowlist
  Stop: completion signal detection

CONTEXT LEVEL (structural):
  Fresh context per phase (tmux/worktree or -p)
  TodoWrite pre-population

PERSUASION LEVEL (probabilistic):
  Phase reminders, identity framing, challenge messaging
```

## Sources

- PCAS arXiv:2602.16708 (48% prompt-only vs 93% reference monitor)
- Anthropic alignment faking (14% faking, 78% in scratchpads)
- Chroma Context Rot research
- Wazir sessions 1-10 data
