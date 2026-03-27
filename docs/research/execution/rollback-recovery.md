# Rollback and Recovery Patterns for Parallel Agent Execution

## Research Summary

How to undo partial work when parallel AI agent execution fails. Saga pattern, git strategies, checkpoint/resume, blast radius.

## Key Findings

### The Saga Pattern
- Register compensations BEFORE the action (Temporal's lesson)
- Two modes: Choreography (event-driven) vs Orchestration (central coordinator)
- Three transaction types: Compensatable, Pivot (go/no-go), Retriable (guaranteed to succeed)
- Compensations are NOT rollbacks -- they are forward-moving inverse operations
- Must be idempotent (can be retried)
- Systems with dedicated saga participants reduce error rates by 76%

### Git-Based Rollback
- `git revert`: safe for shared branches, creates inverse commit
- `git reset --hard`: unsafe after push, rewrites history
- `git reflog`: safety net, records every HEAD movement, 90-day retention
- For parallel agents: `git revert` is always safe per-branch

### Micro-Commit Checkpointing (Aider Model)
- Every successful step = git commit
- Near-zero cost, granular rollback
- Aider auto-commits with descriptive messages
- `/undo` reverses last AI change instantly
- Before editing dirty files, commit preexisting changes separately

### Checkpoint/Resume Patterns
| Model | Framework | Mechanism |
|-------|-----------|-----------|
| Node-level | LangGraph | Snapshot per graph node |
| Activity-level | Temporal | Event history, cached results |
| Explicit commit points | Custom | Developer-chosen boundaries |

- Claude Code `/rewind`: opens checkpoint list, restores code + conversation
- Limitation: Bash commands (rm, mv) are NOT tracked

### Idempotency Keys
Every external write must carry `{workflow_id}:{step_name}` key:
```
# Bad: retry creates duplicate
create_ticket(title="Deploy failed")

# Good: idempotency key ensures exactly-once
create_ticket(title="Deploy failed", idempotency_key=f"{wf_id}:{step}")
```

### Blast Radius Calculation
- Direct impact: systems immediately affected
- Indirect impact: transitive dependencies
- For parallel agents: if modifications are disjoint, only failed agent reverts
- If agents share files, both must revert
- Dependency graph of file modifications determines blast radius

### Failure Propagation in Multi-Agent Systems
- 41-87% failure rates across 7 SOTA multi-agent systems
- Formal orchestration reduces failure rates by 3.2x
- 79% of problems: specification/coordination, not infrastructure
- OWASP ASI08: feedback loops, trust transitivity, memory persistence, parallelization amplification

### Progressive Merge (Canary Model)
- Merge one agent's work first, validate, then proceed
- Not all-or-nothing
- Blue-green analogy: main = Blue (stable), feature branch = Green (new)

## Sources
- Saga pattern (Garcia-Molina, 1987): https://dl.acm.org/doi/10.1145/38713.38742
- microservices.io Saga: https://microservices.io/patterns/data/saga.html
- Temporal compensating transactions: https://temporal.io/blog/compensating-actions-part-of-a-complete-breakfast-with-sagas
- Aider git integration: https://aider.chat/docs/git.html
- OWASP ASI08: https://adversa.ai/blog/cascading-failures-in-agentic-ai-complete-owasp-asi08-security-guide-2026/
