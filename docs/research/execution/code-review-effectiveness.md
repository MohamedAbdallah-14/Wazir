# AI Code Review Effectiveness

## Research Summary

What AI code review catches, what it misses, cross-model review, optimal rounds, and the two-stage pattern.

## Key Findings

### Two-Stage Review is the #1 Architectural Choice
HubSpot's "Sidekick" (6-month evolution):
- Stage 1: Review Agent generates comments
- Stage 2: Judge Agent evaluates each for succinctness, accuracy, actionability
- Reduced time to first feedback by **90%**, peaking at **99.76%**
- "This two-stage process is arguably the single most important factor"
- Developers went from dismissing feedback to expecting it to catch genuine bugs

### AI Code Quality (CodeRabbit, 470 PRs)
| Metric | AI PRs | Human PRs | Ratio |
|--------|--------|-----------|-------|
| Issues per PR | 10.83 | 6.45 | 1.68x |
| Logic errors | -- | -- | 1.75x |
| Security | -- | -- | 1.57x |
| Performance (I/O) | -- | -- | ~8x |
| XSS vulnerabilities | -- | -- | 2.74x |

### Self-Correction Blind Spot: 64.5%
- Models fail to correct their own errors while catching identical errors from external sources
- Systematic, not random -- consistent across models and complexity
- "Wait" prompt trick reduces blind spots by 89.3%
- Root cause: training data rarely includes error-correction sequences

### Cross-Model Review Works
- Different model families have genuinely different error distributions
- Heterogeneous ensembles: ~9% higher accuracy than same-model groups
- k-review tool: 6 models, 6 shuffled diff variants, majority voting

### What AI Review Catches
- Syntax/style (highest detection)
- Logic bugs: off-by-one, null pointers, boundary conditions
- Security patterns: SQL injection, auth bypass
- Error handling gaps
- Performance: N+1 queries, excessive I/O

### What AI Review Misses
- Security design flaws (authorization logic, workflow sequencing)
- Architecture (cross-service boundaries, scaling patterns)
- Business logic (domain rules, compliance)
- Runtime behavior (only visible when running under real conditions)
- Cross-file interactions

### Bug Catch Rates by Tool
| Tool | Catch Rate | Trade-off |
|------|-----------|-----------|
| Greptile | 82% | 11 false positives |
| Cursor Bugbot | 70% resolution | Evolved from 8-pass to agentic |
| Copilot | 71% actionable | 29% silent (correct) |
| CodeRabbit | 46% on runtime bugs | Multi-layered (AST + SAST + AI) |

### Optimal Review Rounds
- 2 passes (AI + human) capture bulk of value
- AI pre-review reduces total cycle by 60-80%
- Third pass: diminishing returns unless different modality (runtime testing)
- Cursor Bugbot evolved from 8 parallel shallow passes to 1 deep agentic pass

### SAST + AI Review Layering
- Neo (code + runtime): 89% of exploitable vulns
- Claude Code (code-only): 55% -- hypothesis engine, can't confirm exploitability
- No single tool catches everything
- Optimal: SAST in CI + AI review on PR + DAST in staging

## Sources
- HubSpot evolution: https://product.hubspot.com/blog/automated-code-review-the-6-month-evolution
- CodeRabbit report: https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report
- Self-Correction Bench: https://arxiv.org/abs/2507.02778
- ProjectDiscovery benchmark: https://projectdiscovery.io/blog/ai-code-review-vs-neo
- Cursor Bugbot: https://cursor.com/blog/building-bugbot
