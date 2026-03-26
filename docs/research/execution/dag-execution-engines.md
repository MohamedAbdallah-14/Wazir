# DAG Execution Engines

## Research Summary

How production DAG execution systems (Airflow, Temporal, Prefect, GitHub Actions, Argo, etc.) handle task state, parallelism, failure, and recovery.

## Key Findings

### Universal State Machine
Every system converges on: PENDING -> RUNNING -> {SUCCESS, FAILED, SKIPPED}

### Systems Analyzed

**Apache Airflow**: 12 task states, trigger rules for conditional execution, XCom for data passing, 3-level concurrency control.

**Temporal.io**: Durable execution via event history replay. Saga pattern as plain try/catch. 4 activity timeout types. Automatic resume on crash. 51,200 event / 50MB hard limit per workflow.

**Prefect**: Flow/task state model, 4 task runners (Thread/Process/Dask/Ray), state handlers for transitions.

**GitHub Actions**: `needs` for job DAG, matrix strategy, fail-fast/continue-on-error. Two-field model (status + conclusion).

**Argo Workflows**: DAG templates with enhanced `depends` logic (boolean expressions on task results). Retry: Always/OnFailure/OnError/OnTransientError.

**Dagster**: Software-defined assets (inverted model). RetryPolicy with Backoff.EXPONENTIAL + Jitter.

**OpenStack TaskFlow**: Most comprehensive -- every "atom" has both `execute()` and `revert()`. Full compensation support.

### Parallelism Approach
**Kahn's algorithm + level partitioning** is standard. Dispatch all tasks with zero in-degree, then process next level.

### 6 Failure Handling Strategies
1. Stop entire pipeline (strict)
2. Skip dependent tasks only
3. Conditional execution (Argo: `depends: "task-a.Succeeded || task-a.Failed"`)
4. Retry with backoff (exponential + jitter)
5. Compensate/revert (OpenStack TaskFlow)
6. Continue independent tasks

### Artifact Passing Patterns
1. In-memory (XCom, function return values)
2. KV store (Redis, database)
3. File storage (S3, local disk)
4. Content-addressed cache (Bazel, Turborepo)
5. Target existence check (Luigi, Make)

### Resume/Recovery Patterns
1. Automatic replay (Temporal -- deterministic workflow replay)
2. Target-based skip (Luigi, Make -- if output exists, skip)
3. Explicit re-run (Airflow -- clear failed tasks, re-execute)
4. Cache-based skip (Prefect -- `persist_result=True`)
5. Checkpoint (LangGraph -- snapshot per super-step)

## Sources
- Full research written to: docs/research/2026-03-25-dag-execution-engines-research.md
- Airflow: https://airflow.apache.org/docs/
- Temporal: https://docs.temporal.io/
- Argo: https://argoproj.github.io/workflows/
