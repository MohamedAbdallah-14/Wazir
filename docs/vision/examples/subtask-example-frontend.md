---
id: FE-2.1
name: Build Desktop Shell Layout
type: frontend-ui
complexity: M
layer: 1
dependencies: [FE-1.1]
priority: P0
repo: senders-web
batch: batch-2
---

# Build Desktop Shell Layout

## What

Build the persistent desktop shell widget that wraps all authenticated screens: left sidebar with navigation, scrollable main content area, and an optional right panel slot. The sidebar contains the logo, user profile, primary navigation, utility icons, and four section grids. Active route gets a highlight. Sidebar collapses to icon-only at tablet breakpoint, hides at mobile.

## Context

- Spec: `docs/specs/web-app-phase1.md` — US-LAYOUT-001
- Design: `docs/designs/desktop-shell.md` — approved layout structure
- Figma: `screenshots/desktop_03_desktop_academy_home.png` (sidebar visible in all desktop screenshots 03-15)
- Depends on: FE-1.1 (Flutter web setup — router, responsive framework, web target)
- Blocks: FE-3.x through FE-12.x (every authenticated screen renders inside this shell)

## Inputs

- `lib/config/routes.dart` — route definitions for `go_router`
- `lib/config/design_tokens.dart` — colors, spacing, typography, breakpoints
- `lib/services/auth_service.dart` — `currentUser` stream for profile area
- `screenshots/desktop_03_desktop_academy_home.png` — reference for sidebar layout

## Expected Outputs

- New: `lib/shell/desktop_shell.dart`
  - `DesktopShell` widget: `Row` with `LeftSidebar` + `Expanded` content + optional right panel
  - Accepts `child` (screen content) and optional `rightPanel` widget
- New: `lib/shell/left_sidebar.dart`
  - `LeftSidebar` widget: logo, user profile, primary nav, utility row, 4 section grids
  - Reads active route from `go_router` to highlight current nav item
  - Collapses to icon-only at tablet breakpoint with tooltips
- New: `lib/shell/breadcrumb_bar.dart`
  - `BreadcrumbBar` widget: renders navigation path, each segment clickable
- New: `lib/shell/test/desktop_shell_test.dart`
- New: `lib/shell/test/left_sidebar_test.dart`

## Acceptance Criteria

1. WHEN the app renders above the desktop breakpoint (`DesignTokens.breakpointDesktop`), THEN the sidebar SHALL display at full width with icons and labels.
2. WHEN the app renders between the tablet and desktop breakpoints, THEN the sidebar SHALL collapse to icon-only view with tooltips on hover.
3. WHEN the app renders below the tablet breakpoint (`DesignTokens.breakpointTablet`), THEN the sidebar SHALL be hidden entirely.
4. WHEN the user navigates to `/academy/courses`, THEN the Academy nav item SHALL show the active highlight (`DesignTokens.colorPrimary`) and the URL SHALL update.
5. WHEN a screen provides a `rightPanel` widget, THEN it SHALL render to the right of the main content area.
6. WHEN no `rightPanel` is provided, THEN the main content area SHALL take the full remaining width.
7. WHEN the sidebar content exceeds viewport height, THEN the sidebar SHALL scroll independently from main content.
8. WHEN the main content exceeds viewport height, THEN the main content SHALL scroll independently from the sidebar.
9. WHEN the breadcrumb bar renders on a sub-page, THEN each segment SHALL be clickable and navigate to that level.
10. WHEN the user profile loads, THEN the sidebar SHALL display circular avatar, display name, and online indicator (`DesignTokens.colorSuccess`).

## Constraints

- Do NOT inline color values, font sizes, or spacing — use `design_tokens.dart` for all visual constants
- Do NOT implement mobile bottom navigation — that is a separate subtask (FE-2.2)
- Do NOT fetch user profile data — consume the existing `auth_service.currentUser` stream
- Do NOT implement any screen content — this is the shell only; screens are separate subtasks
- Keep widget tree shallow — max 3 levels of nesting in any single widget build method

## Verification

```bash
# Run widget tests
flutter test lib/shell/test/

# Expected: all pass, exit code 0

# Build web target
flutter build web --release
# Expected: no build errors

# Analyze
flutter analyze lib/shell/
# Expected: no issues
```

## File Dependencies

| File | Relation | Conflict Risk |
|------|----------|---------------|
| `lib/shell/desktop_shell.dart` | WRITES | New file — no conflict |
| `lib/shell/left_sidebar.dart` | WRITES | New file — no conflict |
| `lib/shell/breadcrumb_bar.dart` | WRITES | New file — no conflict |
| `lib/shell/test/desktop_shell_test.dart` | WRITES | New file — no conflict |
| `lib/shell/test/left_sidebar_test.dart` | WRITES | New file — no conflict |
| `lib/config/routes.dart` | READS | Stable — no changes |
| `lib/config/design_tokens.dart` | READS | May be extended by FE-1.1 — coordinate |
| `lib/services/auth_service.dart` | READS | Stable — no changes |

## Design Reference

- Figma: `screenshots/desktop_03_desktop_academy_home.png`
- Design tokens: `lib/config/design_tokens.dart`
- Component hierarchy:
  ```
  DesktopShell
    ├── LeftSidebar
    │     ├── LogoSection
    │     ├── UserProfileArea (avatar, name, online dot)
    │     ├── PrimaryNav (Home, Academy, Community)
    │     ├── UtilityRow (Search, Notifications, Settings)
    │     ├── SectionGrid "RANKING" (4 items)
    │     ├── SectionGrid "LEARNING" (2 items)
    │     ├── SectionGrid "COMMUNITY" (4 items)
    │     └── SectionGrid "MORE" (4 items)
    ├── MainContent (Expanded, scrollable, max-width constrained)
    │     └── BreadcrumbBar (conditional, for sub-pages)
    └── RightPanel (optional slot, conditionally rendered)
  ```

### Responsive Behavior

| Breakpoint | Token | Structural Change |
|------------|-------|-------------------|
| Desktop | `DesignTokens.breakpointDesktop` | Full sidebar with icons + labels; three-column layout |
| Tablet | `DesignTokens.breakpointTablet` | Sidebar collapses to icon-only; tooltips on hover |
| Mobile | below tablet | Sidebar hidden; bottom nav handled by FE-2.2 |

## Context Budget

| File | Access Level | Size Est. | Reason |
|------|-------------|-----------|--------|
| `lib/config/design_tokens.dart` | READ FULL | ~80 lines | Need all token values for widget styling |
| `lib/config/routes.dart` | READ FULL | ~50 lines | Need route names for nav items |
| `lib/services/auth_service.dart` | READ SECTION | currentUser stream only | Profile data shape |
| `screenshots/desktop_03_desktop_academy_home.png` | VIEW | — | Visual reference for sidebar layout |

## Approach

Build outside-in: `DesktopShell` scaffold first (row layout with slots), then `LeftSidebar` sections top-to-bottom, then `BreadcrumbBar`, then responsive collapse. Widget tests for each component.
