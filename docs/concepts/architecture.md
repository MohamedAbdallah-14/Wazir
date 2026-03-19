# Architecture

Wazir is a host-native engineering OS kit. The host environment (Claude, Codex, Gemini, Cursor) remains the execution container. Wazir supplies the operating model, guardrails, and artifact contracts.

## Core components

| Component | Purpose |
|-----------|---------|
| Roles | Canonical contracts defining what each agent role does and produces |
| Workflows | Phase entrypoints that sequence roles through delivery |
| Skills | Reusable procedures (wz:tdd, wz:debugging, wz:verification, wz:brainstorming) |
| Hooks | Guardrails enforcing protected paths, loop caps, and capture routing |
| Expertise | 268 curated knowledge modules composed into agent prompts |
| Templates | Artifact templates for phase outputs and handoff |
| Schemas | Validation schemas for manifest, hooks, artifacts, and exports |
| Exports | Generated host packages tailored per supported host |
| Tooling | CLI for validation, indexing, recall, capture, and status |

## Design influences

| Source | What Wazir keeps |
|--------|----------------------|
| Wazir skill system | Disciplined workflows, TDD, verification, review rigor, skill ergonomics |
| Spec-Kit | Spec-first development, explicit artifacts, approval gates |
| Oh My Claude | Host-native prompt structure and operator ergonomics |
| autoresearch | Research loops, experiment tracking, self-improvement discipline |

## Context and indexing

Wazir ships a built-in local index and recall surface that reduces context window consumption by 60-80% on exploration-heavy phases.

### Context tiers

| Tier | Token budget | Content | When to use |
|------|-------------|---------|-------------|
| L0 | ~100 tokens | One-line identifier (name, kind, language, line range) | Inventory scans, deciding what to load |
| L1 | ~500-2k tokens | Structural summary (signature, fields, purpose, dependencies) | Understanding shape without full source |
| L2 | Full content | Exact line-bounded source slice | Implementation, debugging, code review |

### Role-specific recall defaults

Roles are assigned default tiers based on their information needs:

- **Exploration roles** (clarifier, researcher, specifier, content-author, designer, planner) default to L1 -- they need to understand structure across many files without reading every line
- **Implementation roles** (executor, verifier) default to direct read (L2) -- they need exact source for code changes and verification
- **Review role** (reviewer) starts at L1 as a triage pass, escalating to direct read only for logic errors, security concerns, or ambiguous summaries
- **Learning role** (learner) defaults to L0 -- it needs only inventory-level context to identify what changed

Every role includes a fallback chain: if the preferred tier fails (no index, no summaries), the role falls back to direct file reads. The system degrades gracefully -- no wasted tokens on failed index operations.

### Capture routing

Large tool output is routed to run-local files via `wazir capture route` and `wazir capture output`, keeping the context window lean. The agent receives a file path reference (~50 tokens) instead of the full output.

### Pipeline integration points

The index and recall surface integrates with the pipeline at five points:

1. **Session start** -- the bootstrap hook runs `index refresh` (or `build` for first run) to ensure the index is current
2. **Scan project** -- the `scan-project` skill runs `index stats` to report index health in the project profile
3. **Debugging** -- the `wz:debugging` OBSERVE phase uses `index search-symbols` and `recall --tier L1` for symbol-first exploration
4. **Execute** -- the executor uses `recall file` and `recall symbol` for targeted source reads
5. **Verify** -- the verifier uses direct reads for full validation

### Measuring savings

`wazir capture usage` generates a per-run token savings report showing capture routing statistics and context window savings. This provides concrete evidence of token reduction per session.

The context-mode integration remains an optional adapter -- off by default, never required for core install, build, or test paths.

See [Indexing and Recall](indexing-and-recall.md) for full command details and extractor documentation.

## Design Phase

The design phase runs after specification and before planning. The `designer` role uses open-pencil MCP tools to produce visual designs from the approved spec. Outputs include a `.fig` design file, exported Tailwind JSX/HTML+CSS scaffolds, design tokens JSON, and screenshot PNGs.

The `design-review` workflow validates designs against the spec before planning begins. The existing `review` workflow also checks design-vs-implementation alignment after execution.

open-pencil is integrated as an optional adapter (`open_pencil`) — it is not required for core Wazir functionality.

## Key references

- [Roles & Workflows](roles-and-workflows.md)
- [Artifact Model](artifact-model.md)
- [Host Exports](../reference/host-exports.md)
- [Hooks](../reference/hooks.md)
- [Expertise & Antipatterns](composition-engine.md)
