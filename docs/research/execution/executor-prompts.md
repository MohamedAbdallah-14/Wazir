# Effective Prompts for AI Code Execution Agents

## Research Summary

How to write effective executor prompts. Instruction budgets, structured tags, persona research, agentic pillars.

## Key Findings

### Instruction Budget: ~150-200
- Frontier thinking LLMs: ~150-200 instructions with reasonable consistency, then linear decay
- Smaller models: exponential decay
- Instructions at peripheries (beginning/end) get more attention
- Quality decreases uniformly across ALL instructions as count increases
- CLAUDE.md: under 300 lines ideally, under 60 best

### Three Agentic Pillars (~20% SWE-bench Improvement, OpenAI)
1. **Persistence**: "Keep going until the user's query is completely resolved"
2. **Tool-calling**: "Do NOT guess or make up an answer -- use tools"
3. **Planning**: "Plan extensively before each function call, reflect on outcomes" (+4% alone)

### Positive Instructions Beat Negative
- InstructGPT performs WORSE with negative prompts as it scales
- "Don't uppercase names" gets ignored. "Always lowercase names" works.
- Token generation leans toward positive selection
- Reserve negatives for specific failure-mode guardrails only

### Expert Personas HURT Coding Accuracy
- Wharton "Playing Pretend" (Dec 2025): no significant impact on performance
- Domain-mismatched experts degraded performance
- For coding/accuracy: "Persona is a double-edged sword" (produces worse results)
- What works: operational identity ("You are an AI coding assistant in Cursor")

### XML/Structured Tags
- Anthropic, OpenAI, Cursor all validate independently
- Cursor: ~1,250 tokens organized with `<communication>`, `<tool_calling>`, etc.
- "For an LLM, this structure is vital for not forgetting instructions"

### Chain-of-Thought
- Structured CoT: up to **13.79%** improvement on HumanEval (ACM TOSEM 2025)
- Wasteful for simple mechanical tasks
- Adaptive thinking (Anthropic): model decides per-request whether to think

### Few-Shot Examples
- 2-5 examples is the sweet spot
- Large gains zero -> two, then sharply diminishing
- Most valuable for output FORMAT and tool-use patterns, not coding logic

### SWE-agent ACI Design
- Linter gating: edit doesn't go through if syntax is wrong
- File viewer limited to 100 lines per turn (more confuses the model)
- Succinct search results (only which files matched, not context)
- "Good ACI design leads to much better results"

### The System Prompt as Constitution
- CLAUDE.md content has "may or may not be relevant" qualifier from Claude Code
- Claude actively ignores content it deems irrelevant
- Progressive disclosure: reference separate files, don't put everything in root
- Never use auto-generated AGENTS.md files

## Sources
- GPT-4.1 Prompting Guide: https://cookbook.openai.com/examples/gpt4-1_prompting_guide
- Anthropic prompting: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/
- HumanLayer CLAUDE.md: https://www.humanlayer.dev/blog/writing-a-good-claude-md
- Wharton Playing Pretend: https://gail.wharton.upenn.edu/research-and-insights/playing-pretend-expert-personas/
- SWE-agent: https://arxiv.org/abs/2405.15793
- SCoT (TOSEM 2025): https://dl.acm.org/doi/10.1145/3690635
- Cursor prompt analysis: https://byteatatime.dev/posts/cursor-prompt-analysis/
