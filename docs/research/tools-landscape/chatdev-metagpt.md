# ChatDev vs MetaGPT — Deep Research

## ChatDev (ACL 2024)
9 roles (CEO, CPO, CTO, CHRO, CCO, Counselor, Programmer, Reviewer, Tester). Waterfall chat chain: DemandAnalysis → LanguageChoose → Coding → CodeComplete → CodeReview (3 cycles) → Test (3 cycles) → Docs.

**Communication**: CAMEL inception prompting. Pairwise multi-turn dialogues.
**Innovation**: Experience Co-Learning (ECL) — learns from past trajectories across runs.
**Weakness**: 33% correctness on ProgramDev. Superficial review. Conversational drift.

## MetaGPT (ICLR 2024)
5 roles (PM, Architect, Project Manager, Engineer, QA). SOP-driven: PRD → System Design → Task List → Code → Tests.

**Communication**: Shared message pool with publish/subscribe. Structured documents, NOT chat.
**Innovation**: "Code = SOP(Team)" — structured intermediate artifacts prevent cascading hallucination.
**Results**: HumanEval 85.9%, MBPP 87.7%, Executability 3.75/4 (vs ChatDev 2.95/4).

## Head-to-Head Verdict
**MetaGPT wins** on executability, correctness, token efficiency (126.5 vs 248.9 tokens/line), and human revision cost (0.83 vs 2.25).

**Key Insight**: Structured artifacts >> free-form chat for multi-agent coordination.

## What's Useful for Wazir
- MetaGPT's structured artifacts model = Wazir's phase files
- Publish/subscribe >> pairwise dialogue for info sharing
- Dependency-aware task ordering dramatically improves coherence
- ECL (experience learning across sessions) is underexplored but valuable
- Both prove: QA must be executable (run code), not just conversational
