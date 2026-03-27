# Proving AI-Generated Code Is Correct

## Research Summary

What constitutes proof of implementation beyond "tests pass." Mutation testing, property-based testing, Design by Contract, formal verification.

## Key Findings

### The Proof Stack (Layered)
| Layer | What It Proves | Bug Reduction |
|-------|---------------|---------------|
| Type system (TS strict, Rust) | Eliminates entire bug classes at compile time | 15-68% |
| Design by Contract | Runtime invariant enforcement | Immediate violation catch |
| Property-based testing | Properties hold across random input space | Finds bugs humans wouldn't imagine |
| Mutation testing | Tests actually detect faults | Exposes 34-point gap between coverage and detection |
| Static analysis + AI review | Security, logic, performance beyond tests | 46-82% bug catch |
| Formal verification (TLA+, Dafny) | Mathematical proof of specific properties | Highest confidence, highest cost |

### Coverage Lies, Mutations Don't
- FinTech API: **96% line coverage, 93% branch coverage, 58% mutation score**
- 75 of 116 injected mutants survived undetected
- "Two-thirds of injectable bugs would not have been caught by CI"

### Mutation Testing Tools
- **PIT** (Java), **Stryker** (JS/C#), **mutmut** (Python)
- LLM-generated mutations achieve **93.4% fault detection** vs 51-74% for traditional tools
- Meta's ACH: **73% of generated tests accepted** by privacy engineers

### Property-Based Testing
- Anthropic's agentic PBT found **500+ vulnerabilities** in production open-source
- 14 high-severity bugs, 22 CVEs with Mozilla, 3 patches merged (including NumPy)
- fast-check (JS/TS): one property test found and fixed 3 bugs immediately

### Design by Contract (Python)
- `icontract`: `@require`, `@ensure`, `@invariant` decorators
- Produces informative violation messages with variable values at breach time
- Integrates with FastAPI for HTTP API contract enforcement

### Formal Verification
- AWS: TLA+ on 10 large systems since 2011. DynamoDB: 3 bugs found, shortest trace 35 high-level steps
- Claude Sonnet 3.5 + DafnyPro: **86% correct proofs** (16-point improvement over base)
- Engineers from entry to principal level learned TLA+ in **2-3 weeks**

### AI-Specific Verification Challenges
- AI writes tautological tests: `expect(result).toBeTruthy()` instead of `.toEqual(expected)`
- Tests that always pass but verify nothing meaningful
- Coverage jumps 30% -> 90% with AI tools, but production bugs don't decrease
- "Green pipelines, confident releases, production bugs the generated suite never caught"

### Type Systems as Proof
- TypeScript: type-related errors fell from ~33% (JS) to **12.4%** (TS)
- TypeScript strict mode: prevents ~15% of bugs (ICSE 2017, Microsoft Research)
- Rust ownership: Android memory vulnerabilities dropped from **76% to 24%** (2019-2024)

## Sources
- Mutation testing case study: https://dev.to/jghiringhelli/the-ai-reported-931-coverage-it-was-34-290k
- Meta ACH: https://engineering.fb.com/2025/09/30/security/llms-are-the-key-to-mutation-testing-and-better-compliance/
- Anthropic PBT: https://red.anthropic.com/2026/property-based-testing/
- AWS TLA+: https://cacm.acm.org/research/how-amazon-web-services-uses-formal-methods/
- DafnyBench: https://popl25.sigplan.org/details/dafny-2025-papers/15/
- ICSE 2017 TypeScript: https://dl.acm.org/doi/10.1109/ICSE.2017.75
