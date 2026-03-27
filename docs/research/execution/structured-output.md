# Reliable Structured Output from AI Agents

## Research Summary

How to get agents to report status reliably. Constrained decoding, Pydantic, format comparison, A2A protocol.

## Key Findings

### Constrained Decoding = 100% Structural Compliance
- OpenAI strict=true: **100%** on complex JSON schema eval
- Without enforcement (same model): **93%**
- GPT-4-0613 without enforcement: **<40%**
- Mechanism: only valid tokens sampled at each step, schema violations structurally impossible

### Compliance Without Enforcement
| Model | Compliance |
|-------|-----------|
| GPT-4o (training only) | 93% |
| Claude-3.5-Sonnet (no enforcement) | ~74.5% |
| GPT-4-0613 (prompting) | <40% |
| Post-generation validation | 76% |

### Pydantic is Universal
Every framework converges: Instructor, CrewAI, AutoGen, LangChain, PydanticAI, DSPy.
- Define `BaseModel` subclass, auto-generate JSON Schema
- Validation catches type mismatches, missing fields, constraint violations
- PydanticAI: auto-retry on validation failure

### A2A Protocol Status Enums (Google)
- `submitted`, `working`, `input-required`, `completed`, `failed`, `canceled`, `rejected`
- Terminal states: completed, failed, canceled, rejected
- Stream MUST close on terminal state
- Use constrained decoding with strict enum types -- model CANNOT hallucinate invalid values

### YAML vs JSON vs Markdown
- YAML: best accuracy for many models (up to **54% more correct** than XML under stress)
- JSON: safest for output parsing (YAML has type coercion hazards)
- Markdown: **34-38% fewer tokens** than JSON
- Model sensitivity varies: Llama 3.2 3B shows little format sensitivity

### Retry Pattern
- Default: max 3 retries across most libraries
- With constrained decoding: retries only for semantic validation
- Without: ~10% failure rate (LinkedIn), budget 1-3 retries
- Instructor: validation errors sent back to LLM for self-correction

### Error Reporting Format
Four fields:
1. **error_type**: enum (InputValidationError, APIFailure, Timeout, etc.)
2. **message**: human-readable explanation
3. **context**: dict of relevant input/operation details
4. **suggestions**: list of recovery options

### SLOT Approach (EMNLP 2025)
Fine-tuned lightweight model (even 1B) as post-processing layer for structural correction.
**99.5% schema accuracy** even when primary model fails.

### Production Reliability Under Load (ReliabilityBench)
- Baseline (no faults): **96.9%** pass@1
- With perturbation: **88.1%**
- Combined perturbation + faults: **84.0%**
- Rate limiting is most damaging fault type
- GPT-4o costs **82x more** than Gemini 2.0 Flash with comparable reliability

## Sources
- OpenAI Structured Outputs: https://openai.com/index/introducing-structured-outputs-in-the-api/
- A2A Protocol: https://a2a-protocol.org/latest/specification/
- JSONSchemaBench: https://arxiv.org/abs/2501.10868
- SLOT: https://arxiv.org/abs/2505.04016
- ReliabilityBench: https://arxiv.org/abs/2601.06112
- Instructor: https://python.useinstructor.com/
