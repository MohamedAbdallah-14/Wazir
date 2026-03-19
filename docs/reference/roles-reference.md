# Roles Reference

This is the lookup reference for canonical roles, workflows, and their contracts.

## Canonical roles

| Role | Purpose |
|------|---------|
| `clarifier` | Resolves ambiguity before spec production |
| `researcher` | Gathers source-backed findings and prior art |
| `specifier` | Produces measurable specs with acceptance criteria |
| `content-author` | Produces finalized i18n keys, microcopy, glossary, state coverage, and accessibility copy |
| `designer` | Transforms approved spec into visual designs using open-pencil MCP tools. Produces `.fig` files, exported code scaffolds, and design tokens |
| `planner` | Creates implementation plans from approved spec and designs |
| `executor` | Implements the plan (orchestrator "Dev" phase) |
| `verifier` | QA hard gate — always mandatory (orchestrator "QA" phase) |
| `reviewer` | Adversarial quality review (orchestrator "Reviewer" phase) |
| `learner` | Captures scoped learnings for future runs |

## Canonical workflows

| Workflow | Runs after | Description |
|----------|-----------|-------------|
| `clarify` | — | Resolve ambiguity |
| `discover` | `clarify` | Gather research |
| `specify` | `discover` | Produce spec |
| `spec-challenge` | `specify` | Adversarial spec review |
| `author` | `spec-challenge` | Content authoring |
| `design` | `author` | Visual design from approved spec |
| `design-review` | `design` | Validate designs against spec, accessibility, visual consistency |
| `plan` | `design-review` | Create implementation plan |
| `plan-review` | `plan` | Adversarial plan review |
| `execute` | `plan-review` | Implement the plan |
| `verify` | `execute` | QA hard gate |
| `review` | `verify` | Adversarial quality review |
| `learn` | `review` | Capture scoped learnings |
| `prepare-next` | `learn` | Produce clean next-run handoff |
| `run-audit` | (standalone) | Structured codebase audit with source-backed findings |

## Role routing valid values

- `executor` — implements the task (orchestrator "Dev" phase)
- `reviewer` — adversarial quality review (orchestrator "Reviewer" phase)
- `verifier` — QA hard gate, always mandatory (orchestrator "QA" phase)

## Contract source files

- Role contracts: `roles/<role-name>.md`
- Workflow entrypoints: `workflows/<workflow-name>.md`
- Manifest roster: `wazir.manifest.yaml`

For conceptual understanding of how roles and workflows interact, see [Roles and Workflows concepts](../concepts/roles-and-workflows.md).

## Context retrieval defaults

Every role contract includes a `## Context retrieval` section specifying the default recall tier and fallback strategy. Agents should consult the individual role contracts for full details.

| Role | Default tier | Strategy | Fallback |
|------|-------------|----------|----------|
| `learner` | L0 | Inventory scan via `recall --tier L0` | L0 fails -> try L1 -> L1 fails -> direct file read |
| `clarifier` | L1 | Structural summaries via `recall --tier L1` | If recall fails, fall back to direct file reads |
| `researcher` | L1 | Structural summaries via `recall --tier L1` | If recall fails, fall back to direct file reads |
| `specifier` | L1 | Structural summaries via `recall --tier L1` | If recall fails, fall back to direct file reads |
| `content-author` | L1 | Structural summaries via `recall --tier L1` | If recall fails, fall back to direct file reads |
| `designer` | L1 | Structural summaries via `recall --tier L1` | If recall fails, fall back to direct file reads |
| `planner` | L1 | Structural summaries via `recall --tier L1` | If recall fails, fall back to direct file reads |
| `executor` | Direct read | Full source via `Read` tool or `recall file` (L2) | If index search fails, use grep or file-tree exploration |
| `verifier` | Direct read | Full source via `Read` tool or `recall file` (L2) | If index search fails, use grep or file-tree exploration |
| `reviewer` | L1 + escalation | Start with `recall --tier L1`; escalate to direct read for logic errors, security, or ambiguous summaries | If recall fails, fall back to direct file reads |

**Tier token budgets:**
- L0: ~100 tokens (one-line identifier summary)
- L1: ~500-2k tokens (structural summary)
- L2/Direct: full source content

Roles that explore broadly (clarifier, researcher, planner) benefit most from L1 summaries. Roles that need exact source (executor, verifier) use direct reads. The reviewer uses L1 as a triage pass before targeted deep reads.

See [Indexing and Recall](../concepts/indexing-and-recall.md) for full details on tiers and commands.
