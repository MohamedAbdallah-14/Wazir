# Test-Driven Development with AI Agents

## Research Summary

How AI agents should write tests, the oracle problem, test-first vs test-after, and mutation testing as quality gate.

## Key Findings

### Test Agent MUST Be Separate from Code Agent
AgentCoder (GPT-4): **91.5% pass@1** with separate test designer + programmer + executor.
- Single-agent test accuracy: **61.0%** (HumanEval), **51.8%** (MBPP)
- Separation nearly doubles test accuracy
- Token cost: 56.9K vs MetaGPT 138.2K -- more accurate AND cheaper

### TiCoder: Test-First Works
- pass@1 improved from **48.39% to 85.48%** with up to 5 user interactions
- Average **45.73% absolute improvement** across MBPP and HumanEval
- Generated valid functional test in **1.69 user queries** for **90.4%** of examples

### The Oracle Problem is Real
- LLMs generate oracles based on **actual behavior** (what code does) rather than **expected behavior** (what it should do)
- Zero-shot accuracy: **54.56%** -- barely better than coin flip
- When code is buggy, LLM oracle accuracy **drops further**
- Multi-agent consensus (Nexus): pushes to **93.69%** on HumanEval

### The Cycle of Self-Deception (ACL 2025)
- Self-debugging with self-generated tests struggles on basic problems
- False positives: flawed programs pass all self-generated tests
- False negatives: correct programs fail self-generated tests
- Bias drops from 59.88% to **4.79%** with in-execution debugging

### Mutation Testing is the Quality Gate
- MuTAP: detects **28% more** faulty code than baselines, **93.57% mutation score**
- EvoGPT: hybrid LLM + genetic algorithm, **0.91 mutation score** (vs EvoSuite 0.80)
- Meta ACH: **73% of generated tests accepted**, deployed across Facebook/Instagram/WhatsApp

### AI Test Quality
- MSR 2026: AI-authored 16.4% of all test commits
- Higher assertion density, lower cyclomatic complexity
- Coverage gains comparable to human-authored tests
- BUT: edge cases under-tested without explicit prompting

### BDD/Gherkin Generation
- AutoUAT: **95% acceptance rate** for Gherkin scenarios
- Test Flow (Cypress scripts): 60% initial -> **92% with refinements**

### How Production Tools Use Tests

**Codex**: Trained via RL to iteratively run tests until passing. The test-pass loop IS the training signal.

**Aider**: Auto-lint + auto-test after every edit. Error output sent back to LLM for fix. SWE-bench: 26.3% Lite.

**Devin**: Sets up environment, reproduces bugs, codes/tests fixes autonomously. Coverage 50-60% -> 80-90%.

### Best Practices for AI Test Generation
1. Coverage-guided prompting (feed uncovered lines into prompt)
2. Multi-step chain-of-thought for test design
3. Rich context (signatures, docstrings, usage examples)
4. Iterative feedback loops (feed failures back)
5. Separate test and code generation agents
6. Mutation-guided refinement
7. Specify negative cases explicitly
8. Use specifications, not code, as oracle source

## Sources
- TiCoder: https://arxiv.org/abs/2404.10100
- AgentCoder: https://arxiv.org/abs/2312.13010
- Oracle behavior: https://arxiv.org/html/2410.21136v1
- Self-debugging bias (ACL 2025): https://aclanthology.org/2025.acl-long.881/
- MuTAP: https://arxiv.org/abs/2308.16557
- Nexus: https://arxiv.org/abs/2506.02943
