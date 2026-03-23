# Error Handling — Reviewer Digest

> Detection-focused extract for reviewer context. For full analysis, see `antipatterns/code/error-handling-antipatterns.md`.

## Error Handling Antipatterns

| Antipattern | Detection Signal | Severity |
|-------------|-----------------|----------|
| **Pokemon Exception (AP-01)** | `catch(Exception e)` / `catch(e) {}` catching everything without discrimination | critical |
| **Swallowed Exception (AP-02)** | Empty catch block, or catch that only logs without re-throwing or recovering | high |
| **Exception as Flow Control (AP-03)** | Using try/catch for expected conditions (not found, validation failure, empty input) | medium |
| **Incomplete Error Handling (AP-04)** | Handling some error cases but not others from the same operation | high |
| **Missing Async Error Handling (AP-05)** | `await` without try/catch or `.catch()`; unhandled promise rejections | high |
| **Re-throw Without Context (AP-06)** | `catch(e) { throw e }` losing stack/context information; no wrapping | medium |
| **Error String Matching (AP-07)** | `if (error.message.includes('not found'))` instead of typed error classes | medium |
| **Silent Failure (AP-08)** | Function returns null/undefined on error with no indication to caller | high |
| **Inconsistent Error Types (AP-09)** | Same module throws Error, string, object, and number | medium |
| **Missing Error Boundary (AP-10)** | UI component tree can crash entirely from one child component error | high |
| **Retry Without Backoff (AP-11)** | Retrying failed operations in a tight loop without exponential backoff | high |
| **Logging Without Acting (AP-12)** | `catch(e) { logger.error(e) }` — logged but no recovery, no re-throw, no alert | high |
| **Overly Broad Recovery (AP-13)** | Catch block returns a default value for ALL errors, masking different failure modes | high |
| **Missing Cleanup (AP-14)** | Resources (file handles, DB connections, locks) not released in error paths | high |
| **User-Facing Stack Traces (AP-15)** | Error responses include internal stack traces, file paths, or SQL queries | high (security) |
| **Missing Correlation ID (AP-16)** | Errors logged without request/trace ID, making debugging across services impossible | medium |

## Async Error Patterns

- Every `await` should be in a try/catch or the promise should have `.catch()`
- `Promise.all` should handle partial failures (use `Promise.allSettled` if appropriate)
- Event handlers and callbacks should have error handling
- Stream/iterator error events should be subscribed to
- Async generators should handle `throw()` method calls

## Error Propagation Check

- Do errors propagate upward with context added at each layer?
- Is there a top-level error handler (global catch, error middleware, process.on('unhandledRejection'))?
- Are user-facing error messages sanitized (no stack traces, no internal details)?
- Are errors logged with correlation IDs for tracing?
- Do error responses use consistent format (error code + message + optional details)?

## Transaction & State Consistency

- Are multi-step mutations wrapped in transactions?
- If a step fails mid-operation, is partial state rolled back or compensated?
- Are idempotency keys used for operations that might be retried?
- Do constructors/initializers validate invariants, or can objects be created in invalid state?

## Resource Cleanup Checklist

- File handles: opened in try, closed in finally
- Database connections: returned to pool in finally
- Locks/mutexes: released in finally
- Temporary files: deleted in finally
- Event listeners: removed in cleanup/dispose
