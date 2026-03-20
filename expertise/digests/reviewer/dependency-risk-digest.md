# Dependency Risk — Reviewer Digest

> Detection-focused extract for reviewer context. For full analysis, see `antipatterns/code/dependency-antipatterns.md`.

## Dependency Antipatterns

| Antipattern | Detection Signal | Severity |
|-------------|-----------------|----------|
| **Trivial Dependency (Left-Pad)** | Package imported for one utility function achievable in <10 lines | medium |
| **Phantom Dependency** | Import resolves at dev time but not in production (missing from package.json `dependencies`) | critical |
| **Version Range Roulette** | `"*"` or `"latest"` or overly broad ranges (`^0.x`) in package.json | high |
| **Dependency Confusion** | Internal package name collides with public registry name; no scoped namespace | critical |
| **Typosquatting Risk** | Package name is one character off from a popular package | high |
| **Circular Dependency** | A imports B imports C imports A | high |
| **Diamond Dependency** | Two deps require incompatible versions of a shared transitive dep | high |
| **Stale Lock File** | package-lock.json / yarn.lock not updated after package.json change | medium |
| **Dev Dependency in Production** | devDependency imported in src/ code | high |
| **Unused Dependency** | Package in package.json but no import found in src/ | low |
| **Deprecated API Usage** | Calling APIs marked @deprecated in the dependency | medium |
| **Tightly Coupled to Dependency** | Dependency's types/interfaces leak through public API | medium |
| **Unmaintained Dependency** | No commits in 12+ months, unresolved security advisories | medium |
| **License Incompatibility** | Dependency license conflicts with project license (e.g., GPL in MIT project) | high |
| **Transitive Bloat** | Adding one dependency pulls in 100+ transitive deps | medium |

## Import Health Checks

- Every `import` or `require` resolves to an installed package or local file
- No circular import chains (check with `madge --circular`)
- Lock file is consistent with package.json
- No `node_modules` path imports (e.g., `require('pkg/node_modules/sub')`)
- No relative imports escaping package boundaries (e.g., `../../other-package/src/`)

## New Dependency Evaluation

When a PR adds a new dependency, check:
1. **Necessity:** Can the functionality be achieved in <20 lines without the dep?
2. **Health:** Last publish date, open issues ratio, known CVEs
3. **Size:** What is the install footprint? (check `bundlephobia` or `packagephobia`)
4. **License:** Compatible with project license?
5. **Alternatives:** Is there a lighter or more maintained alternative?
