# GPT-Engineer — Deep Research

55.2K stars. All-at-once codebase generation from natural language. Created by Anton Osika, 2023. Spawned Lovable (commercial).

## Pipeline
1. System Prompt Assembly (roadmap + generate + philosophy preprompts)
2. Code Generation (single LLM call, all files at once)
3. Entrypoint Generation (separate LLM call for run.sh)
4. Execution + Self-Heal (up to 10 retry loops on runtime errors)
5. Optional: Clarify mode (one Q at a time, shallow)

## Key Characteristics
- **No context management**: Zero summarization, compression, or retrieval
- **Single-shot generation**: All files in one response
- **Brittle parsing**: Regex extraction from markdown code blocks
- **No verification**: Self-heal catches runtime crashes only, no logical/security checks
- **No planning**: LLM does everything in one pass
- **Improve mode**: Unified diffs (fragile — LLMs bad at generating valid diffs)

## What's Useful for Wazir
- Preprompts as personality/behavior shaping (pure prompt engineering)
- Self-heal loop concept (execute → catch error → fix → retry)
- The negative lesson: no planning = no quality at scale

## Verdict
Historically significant (launched the wave) but architecturally primitive. Effectively abandoned ("check out aider" says README). No pipeline, no review, no quality enforcement.
