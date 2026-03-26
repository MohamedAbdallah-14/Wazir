# Dynamic Agent Composition Engines

## Research Summary

How multi-agent systems compose/configure agents at runtime. Patterns from CrewAI, AutoGen, LangGraph, MetaGPT, DSPy, and others.

## Key Findings

### Cross-System Comparison

| System | Config | Dynamic Composition | Tool Selection | Model Routing |
|--------|--------|-------------------|----------------|---------------|
| CrewAI | YAML + Python | Variable substitution | Static per agent | Per-agent `llm` |
| AutoGen | Python code | AgentTool wrapping | Static per agent | Per-agent `model_client` |
| LangGraph | StateGraph | Conditional edges, Send API | Per-node binding | Per-node model |
| MetaGPT | Python Role | REACT mode (LLM picks) | Actions per Role | Global or per-role |
| DSPy | Signatures | Optimizer discovers best prompt | N/A | Single LM |
| Semantic Kernel | C#/Python plugins | Function calling auto-invoke | LLM selects plugins | Per-kernel |
| AWS Bedrock | Console/API | FM picks action groups | FM-driven | Single FM |
| OpenAI Agents SDK | Python Agent | Dynamic instructions + handoffs | Static + MCP | Per-agent |
| Anthropic tool_use | JSON per request | Fully dynamic, defer_loading | Per-request array | Per-request |

### Key Patterns for a Composer

1. **Declarative task spec -> runtime config**: All systems use some form of declaration that gets translated to agent configuration. The subtask.md file already follows this.

2. **Layered prompt assembly**: Build from structured sections (identity, constraints, task, tools, examples, output format). Budget each section.

3. **Two-tier tool binding**: Core tools always available; extended tools discoverable on demand. Anthropic's `defer_loading: true` pattern scales to thousands of tools without context bloat.

4. **Config-driven model routing**: Map task types to models via benchmark-informed lookup table. Not dynamic classifiers that drift.

5. **Context budgeting as first-class**: Treat context like OS memory. System prompt budget, tool budget, history budget, document budget.

6. **Dynamic instructions**: Support runtime-generated instructions incorporating task context, user context, project state (OpenAI Agents SDK pattern).

7. **Compiled prompts for repetitive tasks**: DSPy-style optimization finds optimal instructions and few-shot examples, then caches compiled prompts.

### DSPy Core Insight
Prompts are compiled artifacts, not hand-written strings. The signature is the interface contract; the optimizer finds the implementation.
- ReAct agent: 24% -> 51% with DSPy optimization
- "In many cases, compiling leads to better prompts than humans write"

### Context Window Budgeting (Factory.ai)
- System prompt: 500-2,000 tokens (fixed)
- User input: variable
- Tool outputs: biggest risk (can be massive)
- Conversation history: grows linearly
- Retrieved documents: budgeted per query
- Key: tool outputs add up faster than anything else

### JetBrains Research
- Observation masking (trim old outputs) beats LLM summarization
- Hybrid: masking first, summarization only when truly unwieldy
- No single strategy is sufficient alone

## Sources
- CrewAI: https://docs.crewai.com/en/concepts/agents
- AutoGen: https://microsoft.github.io/autogen/stable/
- LangGraph: https://docs.langchain.com/oss/python/langgraph/workflows-agents
- DSPy: https://dspy.ai/
- Anthropic Advanced Tool Use: https://www.anthropic.com/engineering/advanced-tool-use
- Factory context: https://factory.ai/news/context-window-problem
