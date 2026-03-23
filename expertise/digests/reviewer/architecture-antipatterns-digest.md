# Architecture Antipatterns — Reviewer Digest

> Detection-focused extract for reviewer context. For full analysis, see `antipatterns/code/architecture-antipatterns.md`.

## Structural Antipatterns

| Antipattern | Detection Signal | Severity |
|-------------|-----------------|----------|
| **Big Ball of Mud** | No discernible module boundaries; any module calls any other; package diagram is fully connected | critical |
| **God Object / God Service** | Class/module with >10 public methods touching >3 concerns; single service handling unrelated domains | high |
| **Golden Hammer** | Same pattern/library used for every problem regardless of fit (everything is a microservice, everything uses Redux) | medium |
| **Architecture Astronaut** | Layers of abstraction solving problems no one has; meta-frameworks, plugin systems with zero plugins | medium |
| **Dead Code / Lava Flow** | Unreachable code paths, unused exports, commented-out blocks; code preserved "because it might be needed" | medium |
| **Copy-Paste Architecture** | Duplicated modules with minor variations instead of shared abstraction | high |
| **Boat Anchor** | Unused infrastructure "for future use" (empty interfaces, unused config, skeleton services) | medium |
| **Accidental Complexity** | System complexity far exceeds problem complexity; over-engineered for the actual requirements | medium |
| **Stovepipe System** | Modules built in isolation with no integration architecture; each uses different patterns, different data formats | high |
| **Swiss Army Knife** | One component tries to serve every use case; endlessly configurable but hard to use for any single purpose | medium |

## Integration Antipatterns

| Antipattern | Detection Signal | Severity |
|-------------|-----------------|----------|
| **Distributed Monolith** | Multiple services that must be deployed together; shared database; lock-step releases | critical |
| **Chatty Interface** | >5 sequential API calls to complete one logical operation | medium |
| **Shared Database** | Multiple services reading/writing the same database tables directly | critical |
| **Circular Dependency** | Service A calls B calls C calls A (or module-level equivalent) | high |
| **Hardcoded Endpoints** | URLs, hostnames, or ports as string literals in source code | medium |
| **Missing Circuit Breaker** | External service calls without timeout or failure handling | high |
| **Sinkhole Anti-pattern** | Requests pass through multiple layers that add no value (pure pass-through) | medium |

## Layering Antipatterns

| Antipattern | Detection Signal | Severity |
|-------------|-----------------|----------|
| **Upward Dependency** | Core/domain module imports from UI/API layer | critical |
| **Layer Bypass** | UI code calling database/repository directly, skipping service layer | high |
| **Anemic Domain** | Domain objects are pure data holders; all logic in services | medium |
| **Fat Controller** | Controller/handler contains business logic instead of delegating | high |
| **Inner Platform Effect** | Building a general-purpose engine inside the application that reimplements what the platform already provides | high |

## Root Cause Patterns

Most architecture antipatterns share a few root causes:
- **Shipping pressure:** Shortcuts that accumulate into structural debt
- **Missing boundaries:** No enforced module boundaries in build tooling
- **Conway's Law misalignment:** Architecture doesn't match team structure
- **Premature optimization:** Distributed complexity without proven need
- **BDUF backlash:** Avoiding all upfront design, resulting in no design
