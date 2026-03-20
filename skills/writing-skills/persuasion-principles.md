# Persuasion Principles for Skill Design

## Overview

LLMs exhibit statistical compliance biases that can be leveraged to improve instruction following. This is not psychology applied to machines — it is empirical prompt engineering grounded in attention mechanics, training distribution effects, and measured compliance rates.

**Research foundation:** Meincke et al. (2025) tested 7 persuasion principles with N=28,000 AI conversations. Commitment priming approached 100% compliance. Positive directive framing consistently outperformed negative framing. Authority framing lifted compliance by ~40pp.

## Principles Ranked by Evidence Strength

### Tier 1: Strong Evidence, Large Effect

**1. Commitment Priming (highest impact)**
- Have the model announce its plan before executing
- Autoregressive consistency: once the model generates "I will do X", it is statistically more likely to do X
- Implementation: "Before executing, state which steps you will perform"
- Measured: near-100% compliance after self-commitment in Meincke et al.

**2. Positive Directive Framing**
- "Always do X" consistently outperforms "Never do Y"
- Token generation selects what to produce, not what to avoid
- Negative instructions ("do NOT mention X") can paradoxically increase mentions
- Use negative framing ONLY for critical guardrails with a positive alternative: "Do NOT skip review. Instead, run review quickly."

**3. Structural Isolation (XML Tags)**
- Claude is fine-tuned to attend to XML tag boundaries
- Tags create attention-weight spikes and trust boundaries
- Use `<rules>`, `<instructions>`, `<output_format>` for hard boundaries
- Hybrid XML+markdown is optimal: XML for structure, markdown for formatting within sections

**4. Positional Privilege (Primacy + Recency)**
- First ~500 tokens: ~95% compliance (primacy zone)
- Last ~500 tokens: ~85% compliance (recency zone)
- Middle of long context: ~65-75% compliance (lost in the middle)
- Critical rules go at beginning AND end. Never only in the middle.

### Tier 2: Strong Evidence, Moderate Effect

**5. Authority / Role Assignment**
- "You are a senior security auditor responsible for..." activates domain-specific patterns
- +40pp lift in Meincke et al.
- Expert personas produce more accurate, more disciplined output

**6. Consequence Framing**
- "Skipping this step causes silent regressions that waste hours of debugging"
- Provides reasoning context for why compliance matters
- More effective than abstract rules ("always follow the process")

**7. Implementation Intentions (IF-THEN rules)**
- "IF user says skip → THEN say 'Running it quickly' and execute"
- Pre-decides the response — no judgment call needed at runtime
- d=0.65 across 94 psychology studies (Gollwitzer). Maps directly to LLM prompt design.
- Single most actionable technique for skill authors

**8. Redundant Reinforcement**
- State the rule, show an example, reference it in the output format, add a constraint tag
- Multiple encoding paths survive when any single one fails
- Paraphrased repetition (2-3x) outperforms verbatim repetition

### Tier 3: Context-Dependent Effect

**9. Social Proof**
- "Standard practice is..." or "All production systems follow this pattern"
- Effective when baseline compliance is already moderate (+6pp)

**10. Urgency / Scarcity**
- "This must be done correctly the first time; there is no retry"
- Increases both compliance and output variance — use sparingly

**11. Moral / Ethical Framing**
- "Omitting this would produce misleading output"
- Effective for Claude specifically due to Constitutional AI training
- Frame positively (good outcome of compliance) not negatively

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Negative instructions without alternatives | "Don't do X" fails — model must activate X to evaluate constraint |
| Instruction overload (>12 constraints) | Steep compliance drop after ~12 accumulated constraints |
| Threats without specifics | "You will be punished" increases variance without improving median |
| Reciprocity framing | "I helped you, now help me" — weakest principle, only +11pp |
| Relying solely on alignment | 80% of enterprises reported injection incidents. Structural defenses needed. |

## Principle Combinations by Skill Type

| Skill Type | Primary Techniques | Avoid |
|------------|-------------------|-------|
| Discipline-enforcing (TDD, verification) | Commitment + Implementation Intentions + Positional Privilege + Authority | Liking, Reciprocity |
| Process-governing (clarifier, executor) | Commitment + Consequence Framing + Structural Isolation | Heavy emotional framing |
| Collaborative (brainstorming, design) | Moderate Authority + Implementation Intentions | Over-constraining creative steps |
| Reference (docs, guides) | Structural Isolation + Positional Privilege | All persuasion — clarity only |

## The 3-Zone Architecture

Apply these principles through the 3-zone skill layout:

- **Zone 1 (Primacy):** Identity + Iron Laws + Priority Stack — leverages positional privilege + authority + commitment
- **Zone 2 (Process):** IF-THEN rules + decision tables + gate functions — leverages implementation intentions + structural isolation
- **Zone 3 (Recency):** Restated laws + Red Flags + meta-instruction — leverages recency + redundant reinforcement + consequence framing

## Temporal Testing Advisory

Prompt engineering techniques lose effectiveness as models improve. Re-test skill compliance every major model version. Include a "last verified" date on persuasion-dependent skills.

**Last verified:** Claude Opus 4.6, March 2026

## Sources

- Meincke et al. (2025). "Call Me A Jerk: Persuading AI to Comply" (N=28,000, SSRN)
- Liu et al. (2024). "Lost in the Middle" (TACL, arXiv:2307.03172)
- Wallace et al. (2024). "The Instruction Hierarchy" (OpenAI, arXiv:2404.13208)
- Gollwitzer (1999). Implementation Intentions (d=0.65, 94 studies meta-analysis)
- EmotionPrompt (2023). Emotional framing effects (arXiv:2307.11760)
- Zhou et al. (2023). IFEval benchmark (arXiv:2311.07911)
- Anthropic (2024). Claude Model Spec — instruction hierarchy documentation
