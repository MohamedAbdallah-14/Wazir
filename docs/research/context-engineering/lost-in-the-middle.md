# Lost in the Middle — Deep Research

## The U-Shaped Curve (Liu et al., TACL 2023)
- GPT-3.5 worst middle: 52.9% vs closed-book 56.1% — **worse WITH the answer present than without**
- 15-20pp degradation from edges to middle across all models tested
- Persists even for models trained on long contexts

## 2026 Update: Mathematically Proven Unfixable
Chowdhury (2026) proved the U-shape exists **at initialization before any training**:
- Causal masking → logarithmic primacy divergence
- Residual connections → O(1) recency anchor
- Middle = factorial dead zone of O(1/(H-1)!)
- Standard pre-training does NOT overcome this topological valley

## Has It Been Fixed? No.
- Chroma (2025): All 18 frontier models exhibit context rot
- Du et al. (2025): 13.9-85% degradation from length alone, even with perfect retrieval
- Effective context often 50-70% of advertised (128K model → effective 64K)

## Task Differences
- QA: 20-30% drop in middle
- Summarization: U-shaped faithfulness (middle content neglected)
- Code: Degrades even with perfect retrieval
- Math: GPT-4o drops from 87.8% to 80.8% at 30K tokens

## Mitigations
1. **Strategic placement**: Critical info at start AND end (Anthropic: 27% → 98% with one line)
2. **Compression**: LongLLMLingua: 21.4% improvement at 4x compression
3. **Ms-PoE**: 20-40% middle accuracy gain, plug-and-play
4. **IN2 Training**: FILM-7B flattens the U-curve
5. **Recite-then-answer**: Convert long-context to short-context task

## For Wazir Pipeline
- Current-phase instructions at START (primacy)
- Constraints/criteria reminders at END (recency)
- Summarize prior phase outputs (don't include verbatim)
- Keep total context as short as possible
- Design for effective length, not advertised
- Each phase = fresh, focused prompt
