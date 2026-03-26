---
id: BE-3.1
name: Add Academy Role to Read Endpoints
type: backend-api
complexity: M
layer: 0
dependencies: []
priority: P0
repo: senders-backend
batch: batch-3
---

# Add Academy Role to Read Endpoints

## What

Add `RoleEnum.academy` to `@Roles()` decorators on all GET (read-only) endpoints across the backend so Academy users (role_id=3) can access content. Admin-only endpoints (POST/PUT/DELETE for content management) stay restricted to `admin`. Coach-specific endpoints (trick approval, mission confirmation) stay restricted to `admin, coach`. This is a permission expansion, not a refactor — no business logic changes.

## Context

- Spec: `docs/specs/academy-role-expansion.md` — REQ-ROLE-001
- Design: `docs/designs/academy-access-matrix.md` — Option A (role-per-endpoint, not wildcard)
- The Academy role was added to the auth system in BE-1.2 but no controllers reference it yet. Users with role_id=3 get 403 on every endpoint.
- Blocks: FE-4.1 (Academy dashboard — needs API access to render)

## Inputs

- `src/common/enums/role.enum.ts` — `RoleEnum` values (admin, user, coach, academy)
- `src/common/guards/roles.guard.ts` — how `@Roles()` decorator is evaluated
- `docs/designs/academy-access-matrix.md` — the approved endpoint-to-role mapping

## Expected Outputs

- Modified: every `*.controller.ts` file that has `@Roles()` decorators
  - GET endpoints: add `RoleEnum.academy` to existing roles
  - POST/PUT/DELETE endpoints: unchanged
  - Coach endpoints (trick approve, mission confirm): unchanged (`admin, coach`)
- New: `src/auth/__tests__/academy-role-access.integration.spec.ts`
  - Integration test: Academy user can call core GET endpoints
  - Integration test: Academy user gets 403 on admin-only endpoints

## Acceptance Criteria

1. WHEN an Academy user (role_id=3) calls `GET /v1/library`, THEN the response SHALL be 200 with library data.
2. WHEN an Academy user calls `GET /v1/missions`, THEN the response SHALL be 200 with missions list.
3. WHEN an Academy user calls `GET /v1/sotm/current`, THEN the response SHALL be 200 with current SOTM.
4. WHEN an Academy user calls `GET /v1/notifications/me`, THEN the response SHALL be 200 with user notifications.
5. WHEN an Academy user calls `GET /v1/groups`, THEN the response SHALL be 200 with groups list.
6. WHEN an Academy user calls `POST /v1/library` (create content), THEN the response SHALL be 403 Forbidden.
7. WHEN an Academy user calls `PUT /v1/missions/:id` (edit mission), THEN the response SHALL be 403 Forbidden.
8. WHEN an Academy user calls `POST /v1/trickbook/:id/approve`, THEN the response SHALL be 403 Forbidden (coach-only).
9. WHEN no `@Roles()` decorator exists on an endpoint (unguarded), THEN it SHALL remain unguarded — do not add decorators where none exist.

## Constraints

- Do NOT add `RoleEnum.academy` to POST, PUT, PATCH, or DELETE endpoints
- Do NOT modify `roles.guard.ts` or `role.enum.ts` — those are stable
- Do NOT touch business logic in any service file — this is decorator-only
- Do NOT add `academy` to coach-specific endpoints (`/approve`, `/confirm`)
- Do NOT add `@Roles()` to endpoints that currently have no role guard

## Verification

```bash
# Find all @Roles decorators and verify academy is on GET endpoints
grep -rn "@Roles" src/ --include="*.controller.ts"

# Run the integration tests
npm test -- src/auth/__tests__/academy-role-access.integration.spec.ts
# Expected: all pass, exit code 0

# Run full test suite to verify no regressions
npm test
# Expected: no new failures

# Lint
npm run lint -- src/**/*.controller.ts
```

## File Dependencies

| File | Relation | Conflict Risk |
|------|----------|---------------|
| `src/library/library.controller.ts` | WRITES | None — decorator-only change |
| `src/missions/missions.controller.ts` | WRITES | None — decorator-only change |
| `src/sotm/sotm.controller.ts` | WRITES | None — decorator-only change |
| `src/notifications/notifications.controller.ts` | WRITES | None — decorator-only change |
| `src/groups/groups.controller.ts` | WRITES | None — decorator-only change |
| `src/trickbook/trickbook.controller.ts` | WRITES | Shared with BE-2.2 — merge decorator changes |
| `src/points/points.controller.ts` | WRITES | None |
| `src/levels/levels.controller.ts` | WRITES | None |
| `src/streak/streak.controller.ts` | WRITES | None |
| `src/challenges/challenges.controller.ts` | WRITES | None |
| `src/leaderboard/leaderboard.controller.ts` | WRITES | None |
| `src/blog-post/blog-post.controller.ts` | WRITES | None |
| `src/users/users.controller.ts` | WRITES | None |
| `src/chat/chat.controller.ts` | WRITES | None |
| `src/common/enums/role.enum.ts` | READS | Stable — no changes |
| `src/common/guards/roles.guard.ts` | READS | Stable — no changes |
| `src/auth/__tests__/academy-role-access.integration.spec.ts` | WRITES | New file — no conflict |

## API Contract

No new endpoints. This subtask modifies authorization on existing endpoints only.

See `docs/designs/academy-access-matrix.md` for the full endpoint-to-role mapping (authoritative source).

## Schema Changes

No schema changes. This subtask modifies controller decorators only — no database fields, indexes, or migrations.

## Error Handling

| Failure Point | Behavior | Caller Response |
|--------------|----------|-----------------|
| Academy user calls admin-only endpoint | RolesGuard rejects | 403 Forbidden |
| Academy user calls coach-only endpoint | RolesGuard rejects | 403 Forbidden |

## Context Budget

| File | Access Level | Size Est. | Reason |
|------|-------------|-----------|--------|
| `docs/designs/academy-access-matrix.md` | READ FULL | ~60 lines | Authoritative role mapping |
| `src/common/enums/role.enum.ts` | READ FULL | ~15 lines | Need exact enum values |
| `src/**/*.controller.ts` (14 files) | READ FULL | ~50 lines each | Must see every @Roles decorator |
| `src/common/guards/roles.guard.ts` | KNOW EXISTS | — | Understanding how guard works, don't modify |

## Approach

Mechanical: `grep -rn "@Roles" src/` to find all decorators, then add `RoleEnum.academy` to each GET endpoint. Write integration tests first (TDD) to confirm 403 before changes, then 200 after.
