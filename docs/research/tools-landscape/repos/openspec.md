# Fission-AI/OpenSpec — Deep Research Report

## What It Is

OpenSpec is a spec-driven development (SDD) framework that inserts a lightweight specification layer between intent and implementation. It structures human-AI collaboration into: agree on what to build (via specs) -> build it -> archive specs as the new source of truth.

Published as npm package (`@fission-ai/openspec`, v1.2.0). CLI + slash commands for 25+ AI tools.

**Philosophy**: Fluid not rigid, iterative not waterfall, easy not complex, brownfield-first.

## Spec Format

Specs are structured Markdown validated by Zod schemas:

- `## Purpose` — high-level domain description
- `## Requirements` — blocks with `### Requirement: <name>`
  - Must contain RFC 2119 keywords (SHALL/MUST)
  - Must have `#### Scenario: <name>` with WHEN/THEN format
- Validated by `SpecSchema` (Zod): name, overview (min 50 chars), requirements (min 1), scenarios

**Delta specs** for changes:
- `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, `## RENAMED Requirements`
- Applied in deterministic order: RENAMED -> REMOVED -> MODIFIED -> ADDED

**Artifact dependency graph** (schema.yaml):
```
proposal -> specs -> design -> tasks -> apply
```
Each artifact has: id, generates, template, instruction, requires. Validated with cycle detection (DFS).

## Complete Pipeline

1. **`openspec init`** — scaffold directory, detect AI tools, generate commands
2. **`/opsx:propose <name>`** — create change with: proposal.md, delta specs, design.md, tasks.md (driven by artifact dependency graph)
3. **`/opsx:apply`** — execute tasks, check off completed items
4. **`/opsx:verify`** — 3-dimensional check: Completeness, Correctness, Coherence (CRITICAL/WARNING/SUGGESTION)
5. **`/opsx:archive`** — merge deltas into main specs, archive change folder

## Quality Mechanisms

1. **Structural validation (Zod)**: Spec format, requirement keywords, scenario presence, section lengths
2. **Delta validation**: Cross-section conflict detection, duplicate detection
3. **Rebuilt spec validation**: After applying deltas, validates result before writing
4. **Verify command**: Three-dimensional implementation check
5. **Project config rules**: Per-artifact custom rules injected into AI prompts

## Key Design Decisions

1. **Delta specs instead of full rewrites**: Enables parallel changes, focused reviews
2. **Markdown over structured data**: Humans can read/edit, AI handles natively
3. **Dependency graph, not phase gates**: Flexible but structured ordering
4. **Tool-agnostic**: Adapter pattern for 25+ AI tools
5. **Filesystem-based state**: Artifact completion = file exists on disk. No database.
6. **No enforcement of spec quality by AI**: Verify is advisory only, doesn't block archive

## What's Novel

1. **Delta-based spec evolution** — specs grow through archiving change deltas (living specification)
2. **Artifact dependency graph** with topological ordering (Kahn's algorithm)
3. **Universal agent integration** through adapter pattern
4. **Schema-as-workflow** — YAML schema defines both artifact structure and workflow ordering
5. **Archive-as-merge pattern** — completing a change automatically evolves source-of-truth specs

## Comparison to Others

- vs spec-kit: Lighter, fluid (no phase gates), tool-agnostic. Less enforcement.
- vs superpowers: No review loops, no TDD enforcement, no anti-rationalization. More flexible, less disciplined.
- vs traditional specs: Living documents via delta evolution, not write-once.
