# State Management in Multi-Agent AI Systems

## Research Summary

How to track pipeline state across parallel agents. File-based vs database, event sourcing, checkpoints, race conditions.

## Key Findings

### File-Based State is Dangerous for Concurrent Agents
- Claude Code `.claude.json` corruption from concurrent writes (issues #29217, #18998, #20992)
- Truncated mid-write, JSON parse errors
- Advisory file locking on Unix is NOT enforced by the OS
- Mitigation: atomic writes (temp file + rename), but TOCTOU window remains

### Recommended Storage by Scale
| Scenario | Recommended |
|----------|------------|
| Single agent, local dev | SQLite |
| <10 agents | SQLite with WAL |
| >10 concurrent | Redis (hot) + Postgres (cold) |
| Audit/compliance | Postgres or event-sourced append-only |
| Zero infrastructure | File-based with atomic writes |

### SQLite in WAL Mode
- Multiple concurrent readers + single writer
- Writes take milliseconds, multiple writers take turns
- Hard limit: one writer at a time (`SQLITE_BUSY` on contention)
- Production: one developer runs 24/7 agent with 44 skills, 23 cron jobs, 400+ pipeline items on single SQLite

### Event Sourcing
- Record every change as immutable event, reconstruct state by replaying
- Benefits: full audit trail, time-travel debugging, event chaining between agents
- Microsoft warns: "complex pattern that permeates through the entire architecture"
- Temporal uses this: 51,200 event / 50MB hard limit per workflow

### GitHub Actions Two-Field Model
- Status (lifecycle): queued, in_progress, completed
- Conclusion (outcome): success, failure, cancelled, skipped
- Clean separation prevents invalid state combinations

### Heartbeat Pattern
- Interval + timeout for detecting stuck/hung agents
- Timeout: 2-3x heartbeat interval, or 10x round-trip time
- Wait for 3 consecutive misses before declaring failure
- Advanced: failure suspicion scoring based on historical patterns

### LangGraph Checkpointing
- Snapshot per super-step (each tick where scheduled nodes execute)
- Thread-based organization via `thread_id`
- If node fails mid-step, pending writes from successful nodes are preserved
- Backends: MemorySaver (dev), PostgresSaver (production), RedisSaver (high-throughput)
- Checkpoint bloat: write amplification problem, 50 steps = 50 persisted states

### Observability Convergence
- OpenTelemetry GenAI Semantic Conventions (v1.37+)
- AG2: built-in tracing (conversation, agent, llm, tool, code_execution spans)
- "Traces are essentially a special form of structured logging"
- Lineage-first: track provenance graph, not just events

### Production Convergence
Layered architecture:
1. Append-only event log (source of truth)
2. Database (SQLite/Postgres) for queryable projections
3. OpenTelemetry traces for observability
4. Heartbeats for liveness detection
5. Checkpoints for crash recovery

## Sources
- Claude Code race conditions: https://github.com/anthropics/claude-code/issues/29217
- SQLite for agents: https://dev.to/nathanhamlett/sqlite-is-the-best-database-for-ai-agents
- Redis vs Postgres: https://www.sitepoint.com/state-management-for-long-running-agents-redis-vs-postgres/
- Temporal events: https://docs.temporal.io/workflow-execution/event
- LangGraph persistence: https://docs.langchain.com/oss/python/langgraph/persistence
- OpenTelemetry AI agents: https://opentelemetry.io/blog/2025/ai-agent-observability/
