# Does AI Reviewing AI Actually Work? — Deep Research

## Executive Summary
AI review works, but ONLY under specific conditions. The #1 factor: **context separation** (different model, different session, different family).

## Self-Review: Mostly Worthless
- 64.5% blind spot rate (Self-Correction Bench)
- Same-session review F1: 24.6%. Reviewing twice: 21.7% (WORSE, not better)
- Self-correction without external feedback **degrades** performance (ICLR 2024)
- But: "Wait" prompt reduces blind spots by 89.3% (dormant capability)

## Cross-Context Review: The Winner
- Fresh session with only artifact + review prompt: F1 28.6% (p=0.008 over same-session)
- The benefit comes entirely from context separation, not review skill
- Explanation: anchoring — same-session model rationalizes instead of scrutinizing

## Cross-Model Review: Strongest Evidence
- Cross-family verification has largest gains (Lu et al., 37 models, 9 benchmarks)
- Post-training reduces self-improvement but strengthens cross-family improvement
- **Warning: model mistakes are becoming more correlated** as frontier models converge

## Smaller Model Reviewing Larger
- GPT-2 can supervise GPT-4 to GPT-3.5 level (OpenAI weak-to-strong)
- The variable is **complementary knowledge** — different mistakes matter more than raw capability
- Sonnet finding 8 issues in Opus's plan is consistent with research

## AI Debate
- Non-expert models: 76% accuracy via debate (vs 48% naive)
- Non-expert humans: 88% via debate (vs 60% naive)
- Debate > consultancy (single advisor) on all tasks
- BUT: works best for information asymmetry tasks

## Code Review Specifically
- Best tool: 82% catch rate (Greptile). Median: 54%.
- Catches: syntax (76% reduction), logic bugs (60%+)
- Misses: security design, architecture, business logic
- AI PRs: 10.83 issues vs 6.45 human PRs

## Diminishing Returns
- Rounds 1-2: 75% of total improvement
- Rounds 3-5: worthwhile for critical content
- Beyond 5: track finding counts. If constant/increasing → oscillation, need human.
- If aggressive model "fixes" correct content → net negative (low CL failure mode)

## When Review WORKS
1. Context separated (different session)
2. Different model families
3. Explicit checklists/criteria
4. Verifiable structure (math, code with tests)
5. Adversarial setup (debate)

## When Review FAILS
1. Same session, same context (anchoring)
2. Models too similar (correlated errors — getting worse)
3. No structured criteria ("review this" catches little)
4. Too many rounds without tracking
5. Task requires domain expertise model lacks

## For Wazir
- Codex reviewing Claude = well-supported (cross-family + context separation)
- 2-3 review rounds optimal
- Explicit checklists beat open-ended review
- Consider periodically using different provider as third opinion
- AI review is augmentation, not replacement
