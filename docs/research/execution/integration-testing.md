# Integration Testing After Parallel Changes

## Research Summary

How to verify combined independent changes work together. Contract testing, merge queues, optimal batch sizes.

## Key Findings

### Integration Strategies
- **Big Bang**: combine all, test once. Only for small systems.
- **Incremental** (Top-Down / Bottom-Up): build piece by piece. Universally recommended.
- **Sandwich** (Hybrid): both directions simultaneously. Most resource-intensive.

### Optimal Batch Size: 4 Changes
- Concordia University (IEEE TSE 2021): batch size 4 reduces CI executions by 48%
- Dynamic batching + BatchDivide4: 47.49% reduction on average
- Reinertsen's U-curve: 10% error in optimal batch size -> only 2-3% cost increase

### Merge Queue Pattern
- Test combined changes BEFORE merge
- Jane Street's Iron: batch merge, bisect on failure
- GitHub: sequential by default, configurable batch 1-100
- Graphite: stack-aware, 66% CI reduction with batch 3

### Contract Testing
- Pact: consumer-driven, language-agnostic
- 30% reduction in production incidents
- 20% faster release cycles
- One case: defect leakage 9 -> 2 per quarter, MTTD 36h -> 8h

### Type Checking as Integration Verification
- TypeScript Project References + `tsc --build`
- Memory: 1GB vs 3GB (3x reduction)
- Cross-package breaking changes caught at compile time

### Pre-Merge vs Post-Merge Testing
| Pre-merge | Post-merge |
|-----------|-----------|
| Linting, unit tests, fast integration | E2E, performance, manual QA |
| Prevents defects entering mainline | Tests realistic multi-service interactions |
| Must be fast (<10 minutes per Fowler) | Requires fast rollback mechanisms |

### DORA Data
- Elite performers: deploy 182x more frequently
- 127x faster lead times, 8x lower change failure rate
- Speed and stability are NOT tradeoffs -- they correlate positively

### NIST Combinatorial Testing
- All real-world failures triggered by maximum 4-6 way interactions
- 20x-700x reduction in test set size vs exhaustive
- Pairwise (2-way) catches large percentage; 4-6 way catches all observed faults

### Large-Scale Examples
- **Linux kernel**: linux-next integration tree, 0-Day CI (800+ git trees), CKI (100K+ tests/month)
- **Chromium**: Commit Queue (CQ) at 30 commits/hour, trybots target <40 min p50

## Sources
- Concordia batch testing (IEEE TSE): https://ieeexplore.ieee.org/document/9392370/
- DORA 2024: https://dora.dev/research/2024/dora-report/
- Martin Fowler CI: https://martinfowler.com/articles/continuousIntegration.html
- NIST combinatorial testing: https://www.nist.gov/programs-projects/combinatorial-testing
- Graphite merge queue: https://graphite.com/blog/merge-queue-batching
