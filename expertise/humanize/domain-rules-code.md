# Domain Rules: Code Artifacts

freshness_date: 2026-03-16

Rules for humanizing commit messages, code comments, PR descriptions, and CHANGELOG entries. Code artifacts demand brevity and precision. Format preservation is critical.

For AI-specific code writing failures, see `expertise/antipatterns/process/ai-coding-antipatterns.md`.

## Role Mappings

- **executor** -- commit messages, code comments, PR descriptions, CHANGELOG entries, execution notes

## Rules

### 1. Conventional commit format is sacred

The `<type>(<scope>): ` prefix is a machine-readable contract. Never humanize it. Humanize only the description field after the colon.

```
# Wrong: humanizing the prefix
good(auth): add JWT verification middleware

# Right: humanize only the description
feat(auth): add JWT verification to /api/protected routes
```

### 2. Code comments must be technically precise

No idioms, no hedging, no metaphors in code comments. State what the code does, why it exists, or what constraint it satisfies.

```
// Wrong: metaphor in code
// This function navigates the complex landscape of user permissions

// Right: precise description
// Returns true if the user has any of the required roles
```

### 3. PR descriptions follow what-changed / why structure

A PR description answers two questions: what changed and why. No boilerplate intros, no "In this PR we...", no summary conclusions.

```
# Wrong
In this PR, we've made several improvements to the authentication system,
making it more robust and comprehensive.

# Right
Add rate limiting to /api/login. Without this, the endpoint accepted
unlimited attempts. Now returns 429 after 5 failures per minute per IP.
```

### 4. CHANGELOG entries are user-facing

CHANGELOG entries should be clear to someone who did not write the code. Avoid internal jargon. State what changed from the user's perspective.

```
# Wrong
- Refactored auth module for better separation of concerns

# Right
- Login now returns a specific error message when the account is locked
```

### 5. Do not break structured formats

Never modify YAML frontmatter, JSON, conventional commit syntax, or any machine-readable format during humanization. These formats have exact syntax requirements that override style rules.

### 6. Brevity over style

Code artifacts have implicit length constraints. A commit message description should be under 72 characters. A code comment should be 1-2 lines. Do not expand terse-but-clear text to meet burstiness targets.

### 7. No vocabulary blacklist in function names or identifiers

`handleNavigate()`, `leverageCache()`, or `robustParser` are code identifiers, not prose. Never flag or rename code symbols during humanization. The blacklist applies to prose text only.

### 8. Skip burstiness for short-form artifacts

Commit messages, inline comments, and CHANGELOG entries are too short for burstiness analysis. The burstiness target (CV > 0.4) applies only to prose longer than ~10 sentences.
