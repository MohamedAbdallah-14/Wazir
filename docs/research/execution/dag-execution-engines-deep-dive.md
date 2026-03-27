# DAG Execution Engines Research

**Date**: 2026-03-25
**Purpose**: Deep research for designing a pipeline that executes AI agent tasks with dependencies

---

## Table of Contents

1. [Apache Airflow](#1-apache-airflow)
2. [Temporal.io](#2-temporalio)
3. [Prefect](#3-prefect)
4. [GitHub Actions](#4-github-actions)
5. [Argo Workflows](#5-argo-workflows)
6. [Dagster](#6-dagster)
7. [Dagger](#7-dagger)
8. [Luigi](#8-luigi)
9. [Make / Bazel](#9-make--bazel)
10. [Kestra](#10-kestra)
11. [OpenStack TaskFlow](#11-openstack-taskflow)
12. [Saga Pattern](#12-saga-pattern)
13. [DAG Scheduling Algorithms](#13-dag-scheduling-algorithms)
14. [Retry / Backoff / Jitter Patterns](#14-retry--backoff--jitter-patterns)
15. [AI Agent Orchestration Frameworks](#15-ai-agent-orchestration-frameworks)
16. [Cross-System Patterns and Synthesis](#16-cross-system-patterns-and-synthesis)

---

## 1. Apache Airflow

### State Machine Model

Airflow has 12 task instance states:

| State | Meaning |
|---|---|
| `none` | Not yet queued (dependencies not met) |
| `scheduled` | Scheduler determined dependencies are met |
| `queued` | Assigned to an Executor, awaiting worker |
| `running` | Executing on a worker |
| `success` | Finished without errors |
| `failed` | Error during execution |
| `up_for_retry` | Failed but has retry attempts remaining |
| `up_for_reschedule` | Sensor in reschedule mode |
| `upstream_failed` | An upstream task failed and trigger rule required it |
| `skipped` | Skipped due to branching/LatestOnly |
| `restarting` | Externally requested restart |
| `deferred` | Deferred to a trigger |

Normal flow: `none` -> `scheduled` -> `queued` -> `running` -> `success`

DAG Run has two terminal states:
- **success**: all leaf node states are `success` or `skipped`
- **failed**: any leaf node state is `failed` or `upstream_failed`

### Failure Handling

- **Retries**: `retries` (count), `retry_delay` (default 5 min), `retry_exponential_backoff` (bool), `max_retry_delay`
- When a task fails and has retries remaining, it enters `up_for_retry` state
- After exhausting retries, it enters `failed` state
- Downstream tasks enter `upstream_failed` (unless trigger rules override)

### Trigger Rules (Failure Propagation Control)

| Rule | Behavior |
|---|---|
| `all_success` | (default) Run only if ALL upstream succeeded |
| `all_failed` | Run only if ALL upstream failed |
| `all_done` | Run when all upstream complete, regardless of state |
| `all_skipped` | Run only if ALL upstream skipped |
| `one_success` | Run if at least one upstream succeeded |
| `one_failed` | Run if at least one upstream failed |
| `one_done` | Run if at least one upstream completed (any state) |
| `none_failed` | Run if no upstream failed (success or skipped ok) |
| `none_skipped` | Run if no upstream was skipped |
| `none_failed_min_one_success` | No failures AND at least one success |
| `always` | Run regardless of upstream states |

### Parallelism Strategy

Three levels of concurrency control:
1. **Global parallelism**: `parallelism` setting in airflow.cfg -- max task instances across all DAGs
2. **DAG-level**: `max_active_runs` -- max concurrent DAG runs for a single DAG
3. **Task-level**: `max_active_tis_per_dag` -- max concurrent instances of a single task

Executor types determine actual parallelism: LocalExecutor (single machine), CeleryExecutor (distributed), KubernetesExecutor (pod per task).

### Artifact Passing (XCom)

- **XCom** (cross-communication): key-value store for task communication
- Tasks push via `xcom_push()` or implicit return value; pull via `xcom_pull()`
- Stored in metadata database -- designed for small data only
- Size limits: SQLite 2GB, PostgreSQL 1GB, MySQL 64KB
- Not designed for cross-DAG communication (use Datasets for that)
- Can use custom XCom backends (S3, GCS) for larger payloads

### Resume/Recovery

- Can clear failed task instances to re-run them
- "Clear" operation resets tasks to `none` state, allowing re-execution
- Can clear downstream tasks as well to re-run from a failure point
- Backfill mechanism for re-running historical runs

---

## 2. Temporal.io

### Execution Model (Durable Execution)

Temporal fundamentally differs from traditional DAG engines. Instead of a state machine, it uses **durable execution**: workflow code is written as plain sequential code, and the Temporal Server durably records every step as Events in an Event History.

Key principle: **Workflows look like normal code** but are automatically resilient. The platform handles state persistence, retries, and recovery transparently.

### How It Works Internally

1. Workflow code runs on Workers (client-side)
2. Every side effect (Activity call, timer, signal) produces a **Command** sent to the Temporal Server
3. The Server records Commands as **Events** in an append-only Event History
4. On worker crash/restart, the Worker **replays** the Event History, re-executing the Workflow code deterministically
5. During replay, Commands are compared against existing Events -- matching Events are skipped, new Commands are executed

**Deterministic constraint**: Workflow code must be deterministic (same input -> same Commands). Non-deterministic operations (I/O, API calls, random) must be Activities, which are executed by Workers and recorded as Events.

### State Model

Rather than discrete task states, Temporal tracks:
- **Workflow Execution states**: Running, Completed, Failed, Cancelled, Terminated, ContinuedAsNew, TimedOut
- **Activity Task states**: Scheduled, Started, Completed, Failed, TimedOut, Cancelled
- Events: WorkflowExecutionStarted, ActivityTaskScheduled, ActivityTaskStarted, ActivityTaskCompleted, ActivityTaskFailed, TimerStarted, TimerFired, etc.

### Failure Handling

Core principle: **An Activity Failure never directly causes a Workflow Failure.** Activities retry by default until timeout thresholds are reached.

**Activity Timeouts**:
| Timeout | Purpose |
|---|---|
| `start_to_close_timeout` | Max time for a single Activity Task execution |
| `schedule_to_close_timeout` | Max time for the overall Activity Execution |
| `schedule_to_start_timeout` | Max time from scheduling to worker pickup |
| `heartbeat_timeout` | Max time between heartbeats from an Activity |

**Retry Policy**:
```
RetryPolicy(
    initial_interval=timedelta(seconds=1),
    backoff_coefficient=2.0,
    maximum_interval=timedelta(seconds=100),
    maximum_attempts=500,
    non_retryable_error_types=["ValueError"],
)
```

- Activities use at-least-once execution model
- Can override retry interval per-attempt with `next_retry_delay` in ApplicationError
- `non_retryable` flag on ApplicationError to immediately fail without retry
- Workflow-level timeouts: `execution_timeout`, `run_timeout`, `task_timeout`

### Parallelism Strategy

- Workflows can launch multiple Activities concurrently (language-native async)
- Temporal Server handles distribution across Worker pool
- Horizontal scaling by adding Workers
- Task Queues route work to appropriate Workers
- No global parallelism limit at the SDK level (Server-level rate limiting available)

### Artifact Passing

- Activity return values are automatically serialized into Event History
- Workflow code receives Activity results as normal function return values
- Data converter handles serialization (JSON by default, custom converters supported)
- Payload size limit configurable per namespace (default 2MB per payload)

### Resume/Recovery

- **Automatic**: Worker crash -> replay from Event History -> continue exactly where left off
- No explicit "resume" needed -- it happens automatically on every Worker assignment
- Continue-As-New pattern for long-running workflows to manage Event History size
- Workflow can sleep for months/years and resume automatically

---

## 3. Prefect

### State Machine Model

Prefect v3 task/flow states:

| State | Type | Meaning |
|---|---|---|
| `Scheduled` | Transient | Waiting for scheduled time |
| `Pending` | Transient | Waiting to start |
| `Running` | Transient | Currently executing |
| `Completed` | Terminal | Finished successfully |
| `Failed` | Terminal | Finished with error |
| `Cancelled` | Terminal | Execution cancelled |
| `Cancelling` | Transient | Cancel requested, waiting for completion |
| `Paused` | Transient | Paused, waiting for resume |
| `Retrying` | Transient | Retrying after failure |

State handlers: Functions attached to flows/tasks that are called on every state transition. Receive (object, old_state, new_state) and can optionally modify the new state.

Terminal state handler: Special handler on flows that determines the final state based on all task results.

### Failure Handling

- Retries configured at task level: `@task(retries=3, retry_delay_seconds=10)`
- Retry delay can be a list for variable delays: `retry_delay_seconds=[1, 10, 100]`
- Retry condition functions: custom logic to decide whether to retry
- Flow failure determined by task states: if any task fails, flow can fail
- `return_state=True` parameter to get state object instead of raising on failure

### Parallelism Strategy

Four task runners:
1. **ThreadPoolTaskRunner** (default): Concurrent in threads, `max_workers` parameter
2. **ProcessPoolTaskRunner**: True parallelism in separate processes
3. **DaskTaskRunner**: Distributed across Dask cluster
4. **RayTaskRunner**: Distributed across Ray cluster

Tasks submitted via `.submit()` or `.map()` methods. Results accessed via `future.result()` (blocking).

Concurrency vs parallelism: Threads give concurrency (I/O-bound), processes give parallelism (CPU-bound), Dask/Ray give distributed execution.

Global concurrency limits: Configurable limits on concurrent task runs by tag or work pool.

### Artifact Passing

- Task return values automatically become results for downstream tasks
- Results persisted to configured storage (local, S3, GCS)
- Caching: tasks with same inputs can return cached results
- Artifacts API for richer metadata (tables, markdown, links)

### Resume/Recovery

- Failed flows can be retried from the UI
- Caching allows skipping already-completed tasks on re-run
- No built-in partial DAG re-execution (re-runs from the beginning, but caching mitigates)

---

## 4. GitHub Actions

### DAG Model

GitHub Actions uses `needs` keyword to create a job dependency graph:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps: [...]
  test:
    needs: build      # depends on build
    runs-on: ubuntu-latest
  deploy:
    needs: [build, test]  # depends on both
```

Jobs without `needs` run in parallel by default.

### State Machine

Job states: `queued`, `in_progress`, `completed` (with conclusion: `success`, `failure`, `cancelled`, `skipped`)

Step states: `pending`, `in_progress`, `completed` (with conclusion: `success`, `failure`, `skipped`)

### Failure Handling

- **fail-fast** (default `true`): If any matrix job fails, cancel all other in-progress matrix jobs
- **continue-on-error**: Job failure does not fail the workflow; downstream `needs` still runs
- **if: always()**: Run step/job regardless of previous failure
- **if: failure()**: Run only if a previous step/job failed
- No built-in retry at the job level (third-party actions exist)
- Matrix re-run: "Retry failed jobs" button re-runs only failed matrix entries

### Parallelism Strategy

- **Matrix strategy**: Generate multiple parallel jobs from variable combinations
- **max-parallel**: Limit concurrent matrix jobs
- Jobs without dependencies run concurrently (limited by runner availability)
- Self-hosted runners can control concurrency pool

### Artifact Passing

- `actions/upload-artifact` and `actions/download-artifact` for file-based sharing
- Job outputs: `jobs.<id>.outputs.<name>` for small values
- Environment variables via `$GITHUB_OUTPUT`
- Artifacts expire (default 90 days), configurable

### Resume/Recovery

- "Re-run failed jobs" button (re-runs only failed jobs, not the whole workflow)
- "Re-run all jobs" for full re-execution
- No automatic retry at workflow level

---

## 5. Argo Workflows

### DAG Model

Argo Workflows runs on Kubernetes and supports two execution patterns:
1. **Steps**: Sequential or parallel step lists
2. **DAG**: Directed acyclic graph with explicit `dependencies`

DAG template example:
```yaml
dag:
  tasks:
  - name: A
    template: echo
  - name: B
    dependencies: [A]
    template: echo
  - name: C
    dependencies: [A]
    template: echo
  - name: D
    dependencies: [B, C]
    template: echo
```

Tasks without dependencies run in parallel. Multiple root nodes supported.

### Enhanced Depends Logic

Beyond simple `dependencies`, the `depends` field supports boolean expressions with task result conditions:

| Operand | Meaning |
|---|---|
| `task.Succeeded` | Task completed successfully |
| `task.Failed` | Task failed |
| `task.Errored` | Argo controller error |
| `task.Skipped` | Task was skipped |
| `task.Omitted` | Task was omitted |
| `task.Daemoned` | Task is a daemon |
| `task.AnySucceeded` | (withItems) At least one iteration succeeded |
| `task.AllFailed` | (withItems) All iterations failed |

Example: `depends: "A.Succeeded && (B.Succeeded || B.Failed)"`

Default (bare `dependencies`): equivalent to `(task.Succeeded || task.Skipped || task.Daemoned)`

### Failure Handling & Retry Strategy

Retry policies:
- `Always`: Retry all failures
- `OnFailure`: Retry only Kubernetes-level failures (default)
- `OnError`: Retry Argo controller errors
- `OnTransientError`: Retry only transient errors (matching pattern)

Configuration:
```yaml
retryStrategy:
  limit: 10
  retryPolicy: "Always"
  backoff:
    duration: "1"      # seconds
    factor: 2
    maxDuration: "1m"
  expression: "asInt(lastRetry.exitCode) > 1"  # conditional retry
```

Exit handlers: Run cleanup regardless of workflow success/failure.

### Artifact Passing

- Artifacts stored in configured repository (S3, GCS, Artifactory, HDFS)
- Referenced between tasks: `{{tasks.generate.outputs.artifacts.my-artifact}}`
- Parameters for small values: `{{tasks.generate.outputs.parameters.my-param}}`
- Automatic upload/download between steps

### Resume/Recovery

- Retry workflow from failed node
- Resubmit workflow entirely
- Node-level retry (retry just the failed step, not the whole workflow)
- Memoization: cache step results by template + inputs hash

---

## 6. Dagster

### Execution Model (Software-Defined Assets)

Dagster inverts the traditional approach: instead of defining tasks that produce outputs, you define **assets** (data artifacts) and the code that materializes them. The dependency graph is the asset lineage graph.

Decorators: `@asset`, `@multi_asset`, `@graph_asset`, `@graph_multi_asset`

```python
@dg.asset
def daily_sales() -> None: ...

@dg.asset(deps=[daily_sales])
def weekly_sales() -> None: ...

@dg.asset(deps=[weekly_sales])
def weekly_sales_report(): ...
```

Dagster auto-resolves the materialization order from the dependency graph.

### Failure Handling & Retry

**RetryPolicy** (declarative):
```python
@dg.op(
    retry_policy=dg.RetryPolicy(
        max_retries=3,
        delay=0.2,        # 200ms base delay
        backoff=dg.Backoff.EXPONENTIAL,
        jitter=dg.Jitter.PLUS_MINUS,
    )
)
```

- `Backoff` options: `EXPONENTIAL` (2^n * delay)
- `Jitter` options: `PLUS_MINUS` (random +/- around delay), `FULL` (random 0 to delay)
- **RetryRequested** exception: manual retry control with custom delay/logic
- **Failure** event: `allow_retries=False` to bypass retry policy
- Run-level retries: re-execute from failure (skip completed ops) or re-execute all steps

Downstream behavior: if upstream asset fails, downstream assets are not materialized.

### Parallelism Strategy

- **multiprocess_executor** (default): Each op runs in its own process
- `max_concurrent` parameter controls parallelism (defaults to CPU count)
- `tag_concurrency_limits`: Fine-grained limits by tag (e.g., max 3 ops hitting same API)
- Concurrency slots: Database-coordinated slot system for cross-run limits

### Artifact Passing

- **IO Managers**: Handle reading/writing asset values to storage
- Assets automatically receive upstream asset values as function parameters
- Configurable storage: filesystem, S3, database, etc.
- Asset versioning and caching: skip re-materialization if inputs unchanged

---

## 7. Dagger

### Execution Model

Dagger pipelines execute as a DAG of containerized operations powered by BuildKit (Docker's build engine).

Key characteristics:
- **Lazy evaluation**: Operations are deferred until outputs are actually needed
- **Content-addressable caching**: Every operation keyed by its inputs; change one file and only affected operations re-run
- **Container isolation**: Each step runs in its own container
- **Programmatic API**: Pipelines defined in code (Go, Python, TypeScript), not YAML

### How It Works

1. User code defines operations via Dagger SDK
2. SDK translates operations to GraphQL queries
3. Engine translates to BuildKit's LLB (Low-Level Build) format
4. BuildKit executes the LLB DAG, parallelizing independent branches
5. Results cached by content hash

### Failure Handling

- BuildKit-level retry on transient errors
- Interactive debugging: attach terminal to failed step's container
- OpenTelemetry traces for full execution visibility
- No declarative retry policy at the Dagger level (relies on BuildKit)

### Parallelism

- BuildKit automatically parallelizes independent branches of the DAG
- Concurrency limited by available container resources
- No explicit parallelism configuration at Dagger level

### Artifact Passing

- Container filesystem: outputs of one step become inputs of the next
- Directory and file references pass between operations
- Cache volumes: persistent storage across pipeline runs
- No external artifact store needed -- BuildKit manages transfer

---

## 8. Luigi

### Execution Model (Target-Based)

Luigi uses a **backward dependency resolution** model (like GNU Make):
1. Start from the target task
2. Recursively check if each dependency's output exists (via `complete()` method)
3. Only execute tasks whose outputs don't exist
4. Walk the tree bottom-up, executing leaf tasks first

Core components:
- **Task**: Unit of work with `requires()` (dependencies), `output()` (targets), `run()` (execution)
- **Target**: Output artifact with `exists()` method
- **Worker**: Executes tasks
- **Scheduler**: Central coordinator, decides what to run next

### State Machine

| State | Meaning |
|---|---|
| `PENDING` | Task queued but not yet running |
| `RUNNING` | Currently executing |
| `DONE` | Output exists (complete) |
| `FAILED` | Execution errored |
| `DISABLED` | Too many failures, temporarily disabled |
| `UNKNOWN` | State undetermined |

### Failure Handling

- Retry count configurable per-task or globally
- `disable_hard_timeout`: Time window for counting failures before disabling
- `retry_external_tasks`: Whether to retry tasks with external dependencies
- Disabled tasks re-enabled after configurable timeout (default 3600s)
- Dynamic dependencies: `yield` additional dependencies during execution

### Parallelism

- `--workers N` flag: Number of parallel worker threads
- Central scheduler coordinates across workers
- No distributed execution built-in (single machine)
- Worker checks dependency completion before starting a task

### Artifact Passing

- Target-based: downstream tasks read upstream targets directly
- Targets can be files, HDFS paths, database tables, S3 objects
- No in-memory data passing -- all communication via targets (storage)

### Resume/Recovery

- Inherent: tasks with existing outputs are skipped automatically
- Failed task outputs are typically incomplete, so re-run picks up from failure point
- No explicit checkpoint/resume mechanism

---

## 9. Make / Bazel

### GNU Make

**Dependency model**: File timestamp-based DAG
- Targets depend on prerequisites
- Target is rebuilt if any prerequisite is newer
- Topological sort determines build order

**Parallel execution**: `make -j N` runs up to N jobs in parallel
- Independent targets executed simultaneously
- Dependency edges enforce ordering

**Algorithm**:
1. Parse Makefile into DAG
2. Topological sort (Kahn's algorithm / DFS)
3. Walk DAG, executing targets with satisfied dependencies
4. Check timestamps to determine if rebuild needed

**Failure**: By default, if any command fails, Make stops. `-k` flag continues building other independent targets.

### Bazel

**Dependency model**: Explicitly declared in BUILD files -> DAG of targets
- More granular than Make (action-level, not just file-level)
- Hermetic: all dependencies must be declared (no implicit deps)

**Execution model**:
1. Loading phase: Parse BUILD files
2. Analysis phase: Construct Action Graph (finer than target graph)
3. Execution phase: Execute actions respecting dependencies

**Parallelism**: `--jobs N` or `--local_cpu_resources` controls parallelism
- Independent actions execute in parallel
- Remote execution: distribute across build farm
- Measured speedups: 2x at -j2, 3.8x at -j4, 7.4x at -j8, 12.8x at -j16

**Incremental builds**:
- Content-based (hash), not timestamp-based like Make
- Action Graph reconstruction identifies minimum rebuild set
- Only 44% of projects surveyed actually leveraged Bazel's caching

**Failure**: Fails on first action failure (configurable to continue)

---

## 10. Kestra

### State Machine

Execution states:
| State | Type | Meaning |
|---|---|---|
| `CREATED` | Transient | Created but not yet started |
| `QUEUED` | Transient | Waiting for concurrency slot |
| `RUNNING` | Transient | In progress |
| `SUCCESS` | Terminal | All tasks completed successfully |
| `WARNING` | Terminal | Completed with warnings |
| `FAILED` | Terminal | One or more tasks failed (no more retries) |
| `RETRYING` | Transient | Retrying failed task runs |
| `CANCELLED` | Terminal | Cancelled by concurrency limit |
| `KILLED` | Terminal | Manually killed |
| `PAUSED` | Transient | Paused, waiting for resume |

Task Run states mirror execution states plus: `RETRIED` (original task marked after retry creates new attempt).

### Failure Handling

- Task-level retries with configurable max attempts and max duration
- Flow-level retry policy: `RETRY_FAILED_TASK` behavior retries only failed tasks
- `CREATE_NEW_EXECUTION` behavior creates entirely new execution on failure
- Errors branch: define error-handling tasks that run on failure before terminal state

### Concurrency

- Flow-level `concurrency.limit`: Max concurrent executions of a flow
- Concurrency behavior options: `QUEUE` (wait), `CANCEL` (reject), `FAIL` (error)
- Task-level concurrency via worker groups

---

## 11. OpenStack TaskFlow

### State Machine (Most Comprehensive)

TaskFlow has the most detailed state machine of any system researched. Three levels:

**Engine states**: `RESUMING` -> `SCHEDULING` -> `WAITING` -> `ANALYZING` -> (loop) -> `SUCCESS`/`FAILURE`/`REVERTED`/`SUSPENDED`

**Flow states**: `PENDING` -> `RUNNING` -> `SUCCESS`/`FAILURE`/`REVERTED`
- `SUSPENDING` -> `SUSPENDED` (pause/resume support)
- `RESUMING` -> `RUNNING` (resume from suspended)

**Task/Atom states**:
| State | Meaning |
|---|---|
| `PENDING` | Ready for execution, waiting for dependencies |
| `RUNNING` | Execute method running |
| `SUCCESS` | Execute finished without error |
| `FAILURE` | Execute raised exception |
| `REVERTING` | Revert method running |
| `REVERTED` | Revert completed successfully |
| `REVERT_FAILURE` | Revert itself failed |
| `IGNORE` | Conditionally skipped |

**Retry atom** (same states as Task plus special behavior):
- On failure in flow, Retry's `on_failure()` consulted
- Retry can decide: retry (revert completed tasks, re-run), revert (give up), or ignore
- `RETRYING` state while retry decision is pending

### Revert (Compensation) Model

TaskFlow implements compensation natively:
- Every Task has `execute()` and `revert()` methods
- On failure, engine walks back the completed tasks and calls `revert()` on each
- If revert fails -> `REVERT_FAILURE` state, flow -> `FAILURE`
- Parallel engine handles concurrent reverts

### Parallelism

- Parallel engine: executes independent atoms concurrently
- Thread-based parallelism
- Engine loop: SCHEDULING (find ready atoms) -> WAITING (wait for completion) -> ANALYZING (process results) -> loop

---

## 12. Saga Pattern

### Core Concept

A saga is a sequence of local transactions where each step either completes or triggers compensating transactions for all previous steps.

### Transaction Types

| Type | Behavior |
|---|---|
| **Compensable** | Can be undone by a compensating transaction |
| **Pivot** | Point of no return -- after this succeeds, saga must complete |
| **Retryable** | Idempotent transactions after the pivot that must eventually succeed |

### Two Coordination Strategies

**Choreography** (decentralized):
- Each service publishes domain events
- Other services listen and react
- No central coordinator
- Pros: Simple, loosely coupled
- Cons: Hard to track, cyclic dependencies risk, complex debugging

**Orchestration** (centralized):
- Orchestrator tells participants what to do
- Orchestrator tracks saga state and handles compensation
- Pros: Clear flow, easier debugging, centralized error handling
- Cons: Orchestrator is a single point, coupling risk

### Temporal's Saga Implementation

Temporal makes sagas trivial because durable execution automatically tracks progress:

```python
compensations = []
try:
    compensations.append(cancel_hotel)
    await workflow.execute_activity(book_hotel, ...)

    compensations.append(cancel_flight)
    await workflow.execute_activity(book_flight, ...)

    compensations.append(cancel_excursion)
    await workflow.execute_activity(book_excursion, ...)
except Exception:
    # Run compensations in reverse order
    for compensation in reversed(compensations):
        await workflow.execute_activity(compensation, ...)
    raise
```

### Key Design Considerations

1. Compensating transactions might fail too -- need retry on compensations
2. Some operations are not reversible (send email, charge credit card after settlement)
3. Pivot transaction defines the boundary between compensable and retryable
4. Compensations should be idempotent (safe to retry)
5. Consider semantic locks to prevent dirty reads during saga execution

---

## 13. DAG Scheduling Algorithms

### Problem Classification

DAG task scheduling is **NP-hard** in general. Most practical solutions use heuristics.

### Algorithm Categories

1. **List Scheduling**: Assign priority to each task, schedule highest-priority ready task first
2. **Duplication-Based**: Duplicate tasks on multiple processors to reduce communication cost
3. **Cluster Scheduling**: Group related tasks into clusters, map clusters to processors
4. **Metaheuristic**: Genetic algorithms, simulated annealing, particle swarm optimization
5. **Learning-Based**: Reinforcement learning agents that learn scheduling policies

### Key Algorithms

**Topological Sort** (foundation for all DAG scheduling):
- **Kahn's Algorithm** (BFS): Repeatedly remove nodes with in-degree 0, process level by level
  - Natural for parallel execution: all nodes in the same "level" can run concurrently
  - Level-by-level partitioning gives maximum parallelism
- **DFS-based**: Post-order traversal with stack
  - Does not naturally give parallelism levels

**HEFT (Heterogeneous Earliest Finish Time)**:
Two-phase algorithm for heterogeneous systems:
1. **Prioritize**: Compute upward rank for each task recursively:
   `rank_u(n_i) = w_i_avg + max_over_successors(c_ij_avg + rank_u(n_j))`
   (average computation time + max of communication + successor ranks)
2. **Schedule**: Process tasks in descending rank order. For each task, assign to the worker that gives the earliest finish time (considering communication costs and worker availability)

HEFT uses "insertion-based" scheduling: checks gaps between already-scheduled tasks for possible placement.

**CPOP (Critical-Path-on-a-Processor)**: Variant that identifies the critical path and schedules all critical-path tasks on the fastest processor.

### Parallel Execution from DAG

The **Coffman-Graham algorithm** partitions DAG into layers:
- Layer 0: all nodes with no dependencies (in-degree 0)
- Layer 1: all nodes whose dependencies are all in Layer 0
- Layer N: all nodes whose dependencies are in layers 0..N-1
- Tasks within the same layer can execute in parallel
- This gives O(depth) time with unlimited parallelism

---

## 14. Retry / Backoff / Jitter Patterns

### Exponential Backoff

`delay = min(base * 2^attempt, max_delay)`

Without cap, delay grows unboundedly. Capping at ~30 seconds is a common rule of thumb.

### Jitter Strategies (AWS Research)

| Strategy | Formula | Behavior |
|---|---|---|
| **Full Jitter** | `sleep = random(0, min(cap, base * 2^attempt))` | Wide spread, aggressive |
| **Equal Jitter** | `temp = min(cap, base * 2^attempt); sleep = temp/2 + random(0, temp/2)` | Keeps half the backoff, jitters the rest |
| **Decorrelated Jitter** | `sleep = min(cap, random(base, sleep_prev * 3))` | Recommended by AWS/Netflix; smoothest traffic pattern |

**Decorrelated jitter** is the recommended strategy (AWS Builders' Library, Netflix). It reduces traffic spikes best while keeping retry latency reasonable.

### Thundering Herd Problem

Without jitter, many clients that fail at the same time will retry at the same time (thundering herd). Even small random offset (100-300ms) dramatically reduces collision.

### Circuit Breaker Pattern

Complementary to retry: after N consecutive failures, "open" the circuit breaker and fail fast without attempting the call, for a cooldown period. After cooldown, allow one test request through (half-open). If it succeeds, close the breaker and resume normal operation.

### Best Practices for AI Agent Pipelines

1. Classify errors: transient (retry) vs permanent (fail immediately)
2. Use decorrelated jitter for multi-agent systems
3. Set per-operation-type limits (cheap reads retry more aggressively than expensive writes)
4. Implement idempotency for retried operations
5. Budget total retry time, not just attempt count
6. Consider adaptive backoff based on system load signals

---

## 15. AI Agent Orchestration Frameworks

### LangGraph

- Built on directed acyclic graphs to model agent workflows
- Nodes = agents, functions, or decision points
- Supports conditional branching based on results
- State passed between nodes as structured data
- Best for complex decision-making pipelines with branching

### CrewAI

- Role-based: define agents with roles, goals, and tools
- Sequential or hierarchical task execution
- "Flows" for event-driven, production-ready pipelines
- Replay mechanism for debugging from specific task
- Best for clear role-based task delegation

### AutoGen

- Conversation-based: agents exchange messages asynchronously
- Each agent can be LLM-based or tool executor
- Asynchronous approach reduces blocking
- Best for longer tasks with external event dependencies

### Common Pattern

All three frameworks face the same DAG execution challenges:
- Task dependency resolution
- Failure handling and retry
- Passing context/artifacts between agents
- Parallelism for independent tasks
- Resource management (API rate limits, token budgets)

---

## 16. Cross-System Patterns and Synthesis

### Universal State Machine

Every DAG engine converges on a similar state machine:

```
PENDING -> QUEUED -> RUNNING -> SUCCESS
                            \-> FAILED -> RETRYING -> RUNNING (retry)
                                      \-> UPSTREAM_FAILED (propagation)
                            \-> SKIPPED (conditional)
```

Terminal states: SUCCESS, FAILED (after retries exhausted), SKIPPED
Transient states: PENDING, QUEUED, RUNNING, RETRYING

### Common Parallelism Pattern

1. Build dependency graph
2. Topological sort (Kahn's algorithm)
3. Identify tasks with all dependencies satisfied
4. Execute ready tasks in parallel (up to concurrency limit)
5. On completion, check if new tasks are unblocked
6. Repeat until all tasks complete or fail

### Failure Handling Taxonomy

| Strategy | Systems | Use Case |
|---|---|---|
| **Stop on first failure** | Make, Bazel (default) | Build systems |
| **Skip downstream** | Airflow (upstream_failed), Dagster | Data pipelines |
| **Conditional execution** | Argo (enhanced depends), Airflow (trigger rules), GitHub Actions (if) | Flexible workflows |
| **Retry with backoff** | All systems | Transient failures |
| **Compensation/Revert** | Temporal (saga), TaskFlow (revert), Saga pattern | Distributed transactions |
| **Continue independent branches** | Make (-k), Bazel, Airflow | Maximize useful work |

### Artifact Passing Taxonomy

| Pattern | Systems | Best For |
|---|---|---|
| **In-memory / return values** | Temporal, Prefect, Dagster | Small data, same process |
| **Key-value store** | Airflow (XCom) | Small metadata |
| **File/object storage** | Argo, Luigi, GitHub Actions | Large files |
| **Content-addressable cache** | Dagger, Bazel | Incremental builds |
| **Target existence check** | Luigi, Make | Idempotent re-runs |

### Resume/Recovery Taxonomy

| Strategy | Systems | Mechanism |
|---|---|---|
| **Automatic replay** | Temporal | Event history replay |
| **Target-based skip** | Luigi, Make, Bazel | Check if output exists |
| **Explicit re-run from failure** | Airflow, Argo, GitHub Actions | Clear failed tasks, re-execute |
| **Cache-based skip** | Prefect, Dagster, Dagger | Hash inputs, skip if cached |
| **Checkpoint/persist** | OpenStack TaskFlow | Persist state to storage, resume engine |

### Key Design Decisions for an AI Agent Pipeline

1. **State persistence**: Use a durable store (SQLite/filesystem) to survive crashes
2. **Dependency resolution**: Kahn's algorithm with level-based parallelism
3. **Failure propagation**: Airflow-style trigger rules (default: skip downstream on failure, configurable per-task)
4. **Retry policy**: Declarative per-task with exponential backoff + decorrelated jitter
5. **Artifact passing**: Hybrid -- small data via return values, large context via file references
6. **Compensation**: Register compensating actions for tasks that create side effects
7. **Concurrency limits**: Global limit + per-task-type limits (respect API rate limits)
8. **Resume**: Persist task states + outputs; on restart, skip completed tasks, retry failed ones
9. **Observability**: Event log (like Temporal's Event History) for debugging
10. **Error classification**: Distinguish transient (retry) vs permanent (fail) vs user-actionable (pause and ask)

---

## Sources

### Official Documentation
- [Apache Airflow Tasks](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/tasks.html)
- [Apache Airflow DAG Runs](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dag-run.html)
- [Temporal Failure Detection (Python SDK)](https://docs.temporal.io/develop/python/failure-detection)
- [Temporal Workflow Execution](https://docs.temporal.io/workflow-execution)
- [Temporal Events and Event History](https://docs.temporal.io/workflow-execution/event)
- [Prefect Flows](https://docs.prefect.io/v3/concepts/flows)
- [Prefect Task Runners](https://docs.prefect.io/v3/develop/task-runners)
- [Argo Workflows DAG](https://argo-workflows.readthedocs.io/en/latest/walk-through/dag/)
- [Argo Workflows Retries](https://argo-workflows.readthedocs.io/en/latest/retries/)
- [Argo Enhanced Depends Logic](https://argo-workflows.readthedocs.io/en/latest/enhanced-depends-logic/)
- [Dagster Software-Defined Assets](https://docs.dagster.io/concepts/assets/software-defined-assets)
- [Dagster Op Retries](https://docs.dagster.io/guides/build/ops/op-retries)
- [Dagster Managing Concurrency](https://docs.dagster.io/guides/operate/managing-concurrency)
- [Dagger Overview](https://docs.dagger.io/)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Kestra Execution States](https://kestra.io/docs/workflow-components/states)
- [OpenStack TaskFlow States](https://docs.openstack.org/taskflow/latest/user/states.html)
- [Luigi GitHub Repository](https://github.com/spotify/luigi)

### Architecture and Patterns
- [Temporal: Saga Pattern Made Easy](https://temporal.io/blog/saga-pattern-made-easy)
- [Temporal: Beyond State Machines](https://temporal.io/blog/temporal-replaces-state-machines-for-distributed-applications)
- [Temporal: Error Handling in Distributed Systems](https://temporal.io/blog/error-handling-in-distributed-systems)
- [Microsoft: Saga Design Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga)
- [Chris Richardson: Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [AWS: Timeouts, Retries, and Backoff with Jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- [AWS: Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Bazel Dependencies](https://bazel.build/concepts/dependencies)

### Research Papers and Algorithms
- [HEFT Algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Heterogeneous_earliest_finish_time)
- [Topological Sorting (Wikipedia)](https://en.wikipedia.org/wiki/Topological_sorting)
- [Learning to Schedule DAG Tasks (arXiv:2103.03412)](https://arxiv.org/abs/2103.03412)
- [Learning to Optimize DAG Scheduling (arXiv:2103.06980)](https://arxiv.org/pdf/2103.06980)
- [DAG Scheduling Using HEFT Lookahead Variant (IEEE)](https://ieeexplore.ieee.org/document/5452513/)
- [Does Using Bazel Help Speed Up CI Builds? (arXiv)](https://arxiv.org/html/2405.00796v1)

### AI Agent Frameworks
- [CrewAI vs LangGraph vs AutoGen (DataCamp)](https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen)
- [AI Agent Framework Comparison (Langfuse)](https://langfuse.com/blog/2025-03-19-ai-agent-comparison)
- [Airflow Trigger Rules (Astronomer)](https://www.astronomer.io/docs/learn/airflow-trigger-rules)
