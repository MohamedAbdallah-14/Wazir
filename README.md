<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/logo.svg">
    <img alt="Wazir" src="assets/logo.svg" width="360">
  </picture>
</p>

<h3 align="center">What senior teams ship. Now you can too.</h3>

<p align="center">Your AI is fast. Wazir makes it disciplined.</p>

<p align="center">
  <a href="https://github.com/MohamedAbdallah-14/Wazir/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/MohamedAbdallah-14/Wazir/ci.yml?branch=main&label=CI" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@wazir-dev/cli"><img src="https://img.shields.io/npm/v/@wazir-dev/cli" alt="npm"></a>
  <a href="https://github.com/MohamedAbdallah-14/Wazir/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen?logo=node.js" alt="Node.js"></a>
  <a href="https://codecov.io/gh/MohamedAbdallah-14/Wazir"><img src="https://codecov.io/gh/MohamedAbdallah-14/Wazir/graph/badge.svg" alt="codecov"></a>
  <a href="https://github.com/MohamedAbdallah-14/Wazir/blob/main/CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <img src="https://img.shields.io/badge/status-Pre--1.0%20alpha-orange" alt="Pre-1.0 alpha">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude-supported-5436DA?logo=anthropic" alt="Claude">
  <img src="https://img.shields.io/badge/Codex-supported-00A36C" alt="Codex">
  <img src="https://img.shields.io/badge/Gemini-supported-4285F4?logo=google" alt="Gemini">
  <img src="https://img.shields.io/badge/Cursor-supported-FF6B35" alt="Cursor">
</p>

<p align="center"><b>14 phases · 3 approval gates · 324 expertise modules · 10 roles · 37 skills</b></p>

AI agents degrade on long tasks — context rots, reviews get rubber-stamped, verification is an honor system. Wazir is the operating model that's missing.

```console
$ /wazir Build a REST API with authentication

[clarify]     3 questions asked, answers collected
[specify]     47 acceptance criteria written
[spec-gate]   APPROVED
[plan]        6 implementation tasks
[plan-gate]   APPROVED
[execute]     6/6 tasks complete, 43 tests passing
[verify]      0 lint errors, proof artifact generated
[review]      2 findings, both resolved
[learn]       3 learnings captured

Pipeline complete. 3/3 gates passed.
```

---

## Quick Start

> Requires [Claude Code](https://claude.ai/claude-code) and [Node.js](https://nodejs.org/) 20+.

```bash
npm install -g @wazir-dev/cli
```

Then in Claude Code:

```
/plugin marketplace add MohamedAbdallah-14/Wazir
/plugin install wazir
```

Run a task:

```
/wazir Build a REST API for task management with authentication
```

Control the depth: `/wazir quick ...` for fast fixes, `/wazir deep ...` for full pipeline, `/wazir audit ...` for dedicated audits.

---

## What Makes This Different

`clarify → specify → [gate] → design → [gate] → plan → [gate] → execute → verify → review → learn`

- **Mandatory research phase.** Before any code is written, a researcher fetches live API docs, changelogs, and prior art. Not optional — a pipeline phase.

- **Adversarial review.** The reviewer is never the author. Three gates reject work back until quality passes.

- **AI writing detection and removal.** Strips AI patterns from specs, comments, and commit messages. Output reads like a human wrote it.

- **Published compliance data.** Every run scores itself across five dimensions. Numbers in SQLite, not marketing.

- **324 expertise modules, deterministic composition.** Modules compose based on project context across 13 domains. Same input, same composition, every time.

- **Export compiler: one source, four host-native packages.** Write the process once, compile to Claude, Codex, Gemini, and Cursor.

- **Fresh agent per step.** Each pipeline phase gets a clean context window. No carryover. No contamination between research, implementation, and review.

---

## Wazir vs. Alternatives

| Dimension | Wazir | Claude Code (bare) | Superpowers | Spec-Kit | Raw Prompting |
|---|:---:|:---:|:---:|:---:|:---:|
| Enforced delivery pipeline | 14 phases, 3 gates | — | — | Spec-first | — |
| Mandatory pre-coding research | ✓ | — | — | — | — |
| Adversarial review (reviewer ≠ author) | ✓ | — | — | — | — |
| Expertise composition per task | 324 modules | — | ~15 skills | Extensions | — |
| Published compliance measurement | ✓ | — | — | — | — |
| AI writing detection + removal | ✓ | — | — | — | — |
| Export compiler (one source → host-native) | 4 hosts | — | 5 hosts (per-host install) | 3 hosts | — |

Wazir is not competing with these tools — it learned from all of them. See [Acknowledgments](#acknowledgments).

---

## Documentation

| Section | What You'll Find |
|---|---|
| [Architecture](docs/concepts/architecture.md) | System design, component interactions, context tiers |
| [Roles & Workflows](docs/concepts/roles-and-workflows.md) | 10 roles, 14 phases, gate mechanics |
| [Composition Engine](docs/concepts/composition-engine.md) | How 324 modules are assembled per task |
| [Pipeline Vision](docs/vision/pipeline.md) | Every design decision with research citations |
| [Research Index](docs/research/INDEX.md) | 122 research files across 14 categories |

---

**Wazir** (وزير): Arabic for *advisor*.

Active development. The pipeline works. Rough edges remain.

<a id="acknowledgments"></a>

| Project | What Wazir Learned |
|---|---|
| [**superpowers**](https://github.com/obra/superpowers) | Skill system architecture, bootstrap injection pattern |
| [**spec-kit**](https://github.com/github/spec-kit) | Specification-driven development patterns |

[Full acknowledgments](docs/concepts/architecture.md#acknowledgments) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [MIT License](LICENSE)
