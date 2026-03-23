# Benchmark Challenge: Run Pruning

## The Prompts

### Bare-metal prompt

---

Add run pruning to the Wazir CLI. The codebase has an existing CLI at `tooling/src/cli.js` with commands like `capture`, `index`, `export`. Run data lives under a state root resolved per-project (`~/.wazir/projects/<project-slug>/runs/<run-id>/`). Do not look at the `benchmark/` directory. Do not use any skills, plugins, or MCP tools. The user is not around and will not be able to answer any questions. Do your best work autonomously — do not stop or ask for clarification, make reasonable decisions and keep going until you deliver the full working implementation with tests. Commit your work when done.

---

### Wazir prompt

---

/wz:wazir Add run pruning to the Wazir CLI. The codebase has an existing CLI at `tooling/src/cli.js` with commands like `capture`, `index`, `export`. Run data lives under a state root resolved per-project (`~/.wazir/projects/<project-slug>/runs/<run-id>/`). Do not look at the `benchmark/` directory. The user will not be around. If you need any user input, use Codex CLI — it is also your reviewer. Commit your work when done.

---

## How to Run

### Setup (run once per test)

```bash
# For bare-metal test:
git checkout main && git checkout -b benchmark/bare-metal-run-pruning

# For Wazir test:
git checkout main && git checkout -b benchmark/wazir-run-pruning
```

### Bare-metal test

1. Open a new Claude Code session with `claude --disable-slash-commands` (runner already stripped CLAUDE.md, .claude/, hooks/)
2. Paste the prompt above
3. Let it work until done
4. Score: `node benchmark/challenges/run-pruning/evaluator.js --dir . --mode bare-metal`

### Wazir test

1. Open a new Claude Code session WITH Wazir loaded (normal `claude`)
2. Paste the same prompt above
3. Let it follow the full pipeline
4. Score: `node benchmark/challenges/run-pruning/evaluator.js --dir . --mode wazir`

### Compare

```bash
node benchmark/compare.js \
  --bare-metal benchmark/results/bare-metal/score.json \
  --wazir benchmark/results/wazir/score.json
```
