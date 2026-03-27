# Prompt Compression and Context Compression for LLMs

Research date: 2026-03-25

---

## 1. LLMLingua: Compressing Prompts for Accelerated Inference of Large Language Models (https://arxiv.org/abs/2310.05736)

**Authors:** Huiqiang Jiang, Qianhui Wu, Chin-Yew Lin, Yuqing Yang, Lili Qiu (Microsoft Research)
**Venue:** EMNLP 2023

- Uses a well-trained small language model (GPT-2-small or LLaMA-7B) to identify and remove unimportant tokens from prompts based on perplexity/self-information
- Three core components: (1) budget controller to maintain semantic integrity under high compression, (2) token-level iterative compression algorithm modeling interdependence between compressed contents, (3) instruction-tuning-based method for distribution alignment between the small compressor LM and the target LLM
- Achieves up to **20x compression** with minimal performance loss
- On GSM8K, Exact Match scores drop by only 1.44 and 1.52 at 14x and 20x compression ratios respectively (less than 2 points)
- Practical acceleration of **1.7x to 5.7x** in end-to-end latency
- Particularly effective on reasoning tasks (GSM8K, BBH); moderately better on conversational and summarization tasks
- Compressed prompts may be difficult for humans to understand but remain highly effective for LLMs
- Integrated into LangChain, LlamaIndex, and Microsoft Prompt Flow
- GitHub: https://github.com/microsoft/LLMLingua

---

## 2. LLMLingua-2: Data Distillation for Efficient and Faithful Task-Agnostic Prompt Compression (https://arxiv.org/abs/2403.12968)

**Authors:** Zhuoshi Pan, Qianhui Wu, Huiqiang Jiang, Menglin Xia, Xufang Luo, Jue Zhang, Qingwei Lin, Victor Ruhle, Yuqing Yang, Chin-Yew Lin, H. Vicky Zhao, Lili Qiu, Dongmei Zhang (Microsoft, Tsinghua)
**Venue:** ACL 2024 Findings

- Identifies that information entropy (used by LLMLingua) is a **suboptimal compression metric** because: (1) it only leverages unidirectional context and may miss essential information, (2) it is not aligned with the compression objective
- Proposes a data distillation procedure: derives compression knowledge from GPT-4 to create an extractive text compression dataset from MeetingBank transcripts
- Reformulates prompt compression as a **token classification problem** (preserve/discard each token), using a BERT-level Transformer encoder for bidirectional context
- A BERT-base-sized model achieves superior performance compared to LLaMA-2-7B-based baselines
- **3x-6x speed improvement** over original LLMLingua
- Achieves **2-5x compression ratios**, reduces latency by 1.6-2.9x, and reduces GPU memory costs by 8x
- Surpasses LLMLingua in handling out-of-domain data (generalizes well beyond MeetingBank training data)
- Evaluated on LongBench, ZeroSCROLLS, GSM8K, and Big Bench Hard

---

## 3. LongLLMLingua: Accelerating and Enhancing LLMs in Long Context Scenarios via Prompt Compression (https://arxiv.org/abs/2310.06839)

**Authors:** Huiqiang Jiang, Qianhui Wu, Xufang Luo, Dongsheng Li, Chin-Yew Lin, Yuqing Yang, Lili Qiu (Microsoft)
**Venue:** ACL 2024

- Addresses the **"lost in the middle"** problem: LLM performance degrades when relevant information is buried in the middle of long contexts
- Introduces **question-aware coarse-to-fine compression** to improve key information density in the prompt
- Adds a **document reordering mechanism** to reduce information loss in the middle
- Achieves up to **21.4% performance improvement** at 4x compression on NaturalQuestions benchmark
- **2.1x acceleration** in end-to-end latency
- **94.0% cost reduction** on the LooGLE benchmark
- Evaluated on five benchmarks: NaturalQuestions, LongBench, ZeroSCROLLS, MuSicQue, and LooGLE
- Most promising method for RAG applications: compresses prompts by 6-7x while retaining key information

---

## 4. Selective Context: Compressing Context to Enhance Inference Efficiency of Large Language Models (https://arxiv.org/abs/2310.06201)

**Authors:** Yucheng Li, Bo Dong, Chenghua Lin, Frank Guerin (University of Sheffield, University of Aberdeen)
**Venue:** EMNLP 2023

- Uses a base language model to compute **self-information** for each lexical unit (sentences, phrases, or tokens) and prunes low-information content
- Supports three granularity levels: sentence-level, phrase-level, and token-level filtering
- Achieves **50% reduction** in context cost, resulting in **36% reduction in inference memory** and **32% reduction in inference time**
- Only minor quality drops: 0.023 decrease in BERTscore and 0.038 in faithfulness
- Evaluated on three data sources (arXiv papers, BBC news, conversation transcripts) and four NLP tasks (summarization, QA, context reconstruction, conversation)
- Available as pip package: `pip install selective-context`
- GitHub: https://github.com/liyucheng09/Selective_Context

---

## 5. The Perplexity Paradox: Why Code Compresses Better Than Math in LLM Prompts (https://arxiv.org/abs/2602.15843)

**Author:** Warren Johnson
**Date:** January 2026

- Reveals a fundamental **"perplexity paradox"**: code syntax tokens are preserved (high perplexity) while numerical values in math problems are pruned despite being task-critical (low perplexity)
- Code generation tolerates aggressive prompt compression (ratio >= 0.6) while chain-of-thought reasoning degrades gradually
- Validated across **six code benchmarks** (HumanEval, MBPP, HumanEval+, MultiPL-E) and **four reasoning benchmarks** (GSM8K, MATH, ARC-Challenge, MMLU-STEM)
- Proposes **signature injection** to recover function signatures lost during compression: recovers +34 percentage points in pass rate (5.3% to 39.3%; Cohen's h = 0.890)
- Introduces **Task-Aware Adaptive Compression (TAAC)**: achieves 7% better cost-quality tradeoffs than fixed-ratio compression while maintaining 96% quality preservation
- Critical finding for code-context compression: perplexity-based methods systematically mistreat different content types

---

## 6. Prompt Compression for Large Language Models: A Survey (https://arxiv.org/abs/2410.12388)

**Authors:** Zongqian Li, Yinhong Liu, Yixuan Su, Nigel Collier (University of Cambridge)
**Venue:** NAACL 2025 (Selected Oral)

- Comprehensive taxonomy dividing prompt compression into two categories:
  - **Hard prompt methods**: Remove low-information tokens or paraphrase for conciseness; still use natural language tokens; can generalize across LLMs with different embeddings
  - **Soft prompt methods**: Learn continuous representations in embedding space; produce latent vectors (special tokens) not human-readable; require model-specific training
- Analyzes mechanisms through four perspectives: attention optimization, Parameter-Efficient Fine-Tuning (PEFT), modality integration, and new synthetic language
- Applications covered: QA, RAG, In-Context Learning (ICL), role-playing, agent-based systems, interdisciplinary tasks
- Future directions: optimizing compression encoder, combining hard and soft methods, leveraging multimodality insights
- Survey repo with paper list: https://github.com/ZongqianLi/Prompt-Compression-Survey

---

## 7. 500xCompressor: Generalized Prompt Compression for Large Language Models (https://arxiv.org/abs/2408.03094)

**Authors:** Zongqian Li, Yinhong Liu, Yixuan Su, Nigel Collier (University of Cambridge)
**Venue:** ACL 2025 Main

- Compresses up to **500 natural language tokens into 1 special token** -- the most extreme compression ratio in the literature
- Adds only ~0.3% additional parameters to the base model
- Uses **KV values** (not embeddings) for compressed tokens -- encapsulates more information, does not increase inference time, minimal GPU memory impact
- Achieves 27-90% reduction in calculations and 55-83% memory savings when generating 100-400 tokens at 500x compression
- Retains **70-74% F1** and **77-84% Exact Match** of original LLM capabilities vs. uncompressed prompts
- Pre-trained on ArxivCorpus, fine-tuned on ArxivQA, evaluated on strictly unseen cross-domain QA datasets
- Represents the frontier of soft prompt compression -- compression into latent space
- GitHub: https://github.com/ZongqianLi/500xCompressor

---

## 8. Prompt Compression with Context-Aware Sentence Encoding for Fast and Improved LLM Inference (https://arxiv.org/abs/2409.01227)

**Authors:** Barys Liskavets, Maxim Ushakov, Shuvendu Roy, Mark Klibanov, Ali Etemad, Shane Luke (Workday)
**Venue:** AAAI 2025

- Proposes **Context-aware Prompt Compression (CPC)** -- a sentence-level approach using a novel context-aware sentence encoder
- Trains encoder on a new dataset of question/positive/negative sentence triplets for relevance scoring
- **Up to 10.93x faster** at inference compared to best token-level compression methods
- Sentence-level methods show better improvement for shorter length constraints in most benchmarks
- Key insight: sentence-level compression better preserves linguistic coherence, especially at higher compression ratios
- Demonstrates that sentence-level can outperform token-level methods while being an order of magnitude faster
- Code and dataset: https://github.com/Workday/cpc

---

## 9. FINCH: Prompt-guided Key-Value Cache Compression for Large Language Models (https://arxiv.org/abs/2408.00167)

**Authors:** Giulio Corallo, Paolo Papotti (EURECOM)
**Venue:** TACL 2024

- Operates at the **KV cache level** -- iteratively identifies most relevant Key/Value pairs conditioned on the prompt
- Achieves compression ratios from **2.23x to 93.17x** without any fine-tuning
- Comparable generation quality at 2.35x compression; **90% of reference accuracy** at 3.76x compression
- Outperforms LongLLMLingua on most LongBench tasks with both Llama 2 and Mistral
- Outperforms RAG baselines in 10 of 12 QA experiments across Mistral and Llama 2
- Training-free approach -- works with any existing model out of the box
- GitHub: https://github.com/giulio98/context-compression

---

## 10. Gist Tokens: Learning to Compress Prompts with Gist Tokens (https://arxiv.org/abs/2304.08467)

**Authors:** Jesse Mu, Xiang Lisa Li, Noah Goodman (Stanford)
**Venue:** NeurIPS 2023

- Trains an LM to compress prompts into smaller sets of **"gist" tokens** that can be cached and reused
- Can be trained with **no additional cost** over standard instruction fine-tuning by simply modifying Transformer attention masks
- Achieves up to **26x compression** of prompts on decoder and encoder-decoder LMs
- Results in up to **40% FLOPs reductions**, 4.2% wall time speedups, and storage savings
- Soft prompt method: compressed representations are not human-readable
- Fine-tuned decoder approach: requires modifying the target LLM (unlike frozen decoder methods like ICAE/500xCompressor)
- GitHub: https://github.com/jayelm/gisting

---

## 11. PCToolkit: A Unified Plug-and-Play Prompt Compression Toolkit (https://arxiv.org/abs/2403.17411)

**Authors:** Zhi-Bo Li et al.
**Venue:** IJCAI 2025

- Unified evaluation framework incorporating **five compressors**: Selective Context, LLMLingua, LongLLMLingua, SCRL, and Keep It Simple
- **10 diverse datasets** covering reconstruction, summarization, math, QA, few-shot learning, code completion, boolean expressions, and more
- **Four evaluation metrics** for consistent cross-method comparison
- Modular design: easy integration of new datasets, metrics, and compressors via portable interfaces
- Most comprehensive benchmark for comparing prompt compression methods head-to-head
- GitHub: https://github.com/3DAgentWorld/Toolkit-for-Prompt-Compression

---

## 12. Factory AI: Compressing Context & Evaluating Context Compression for AI Agents (https://factory.ai/news/compressing-context)

**Authors:** Factory AI engineering team
**Date:** 2024-2025

- Addresses context compression specifically for **coding agents** running long software engineering sessions
- Key problem with naive compression: redundant re-summarization triggers full re-summarization of the entire conversation prefix each time the threshold is reached, causing linear cost growth
- Factory's solution: maintains **lightweight, persistent conversation state** with rolling summary; only summarizes newly dropped spans and merges into persisted summary
- Structured summaries with explicit sections: session intent, file modifications, decisions made, next steps

### Evaluation Framework (https://factory.ai/news/evaluating-compression)

- Tested **36,000+ production messages** from debugging, code review, and feature implementation sessions
- Compared three approaches: Factory's structured summarization, OpenAI's compact endpoint, Anthropic's built-in compression
- **Factory scored 3.70** overall vs. Anthropic 3.44 and OpenAI 3.35 on probe-based evaluation
- Tests factual retention, file tracking, task planning, and reasoning chains
- Critical finding: OpenAI's compression produced vague responses that lost technical detail (error codes, endpoints, root causes), while structured summaries preserved relationships between error codes, affected endpoints, and underlying causes

---

## 13. AutoCompressor and ICAE (In-Context Autoencoder)

**AutoCompressor:** (https://arxiv.org/abs/2305.14788)
- Handles long context compression up to **30,720 tokens** via recursive architecture
- Divides original prompt into sub-prompts; each iteration compresses into a small set of tokens passed to next iteration
- Produces **summary vectors** that serve as soft prompts
- Limitation: training is time-consuming; compressed tokens cannot be used by the original untuned LLM

**ICAE:** (https://arxiv.org/abs/2307.06945)
- Compresses up to **512 tokens into 32, 64, or 128 special tokens** (4x-16x compression)
- Uses frozen LLM as decoder -- compressed tokens are compatible with unmodified models
- By concatenating multiple groups of compressed tokens, handles up to 5,120 tokens
- Frozen decoder approach preserves original model capabilities

---

## 14. Practical Implementation: OneUptime -- How to Build Context Compression (https://oneuptime.com/blog/post/2026-01-30-context-compression/view)

**Date:** January 30, 2026

- Practical engineering guide for implementing context compression with extractive summarization, sentence filtering, and information density optimization
- Claims **50-80% token reduction** while preserving information needed for accurate responses
- Key implementation guidelines:
  - Establish baseline metrics for token usage and response quality before adding compression
  - Prioritize content directly relevant to the user query; irrelevant content has zero value regardless of information density
  - Monitor semantic similarity and information retention; compression that degrades response quality is counterproductive
  - Use **adaptive thresholds** based on score distributions; fixed thresholds rarely work across query types
  - Cache embeddings for frequently accessed content (embedding computation is expensive)
  - Respect source priorities: system prompts and user queries should rarely be compressed

---

## 15. DataCamp: Prompt Compression Guide with Python Examples (https://www.datacamp.com/tutorial/prompt-compression)

- Hands-on tutorial implementing Selective Context algorithm in Python
- Tests compressed prompts with gpt-3.5-turbo-0125 via OpenAI API
- Covers compression at three granularity levels: sentences, tokens, and phrases
- Discusses additional techniques: Keep It Simple (KIS), SCRL, LLMLingua family
- Emphasizes monitoring effects on model performance, especially in sensitive applications (healthcare, finance, legal)
- Selective Context web app supports English and Simplified Chinese with configurable compression ratio and filtering level

---

## 16. Towards Data Science: How to Cut RAG Costs by 80% Using Prompt Compression (https://towardsdatascience.com/how-to-cut-rag-costs-by-80-using-prompt-compression-877a07c6bedb/)

**Author:** Iulia Brezeanu
**Date:** January 2025

- Compares multiple prompt compression approaches for RAG cost reduction
- **AutoCompressors**: summarize long text into short summary vectors as soft prompts; indexed documents can be pre-processed into summary vectors during retrieval phase
- **LongLLMLingua**: identified as most promising for RAG -- compresses prompts by 6-7x while retaining key information
- Key insight: prompt compression shortens the original prompt while keeping the most important information AND speeds up how quickly the language model can process inputs

---

# Synthesis

## Taxonomy of Approaches

Prompt compression methods divide into two fundamental categories:

1. **Hard prompt methods** (token/sentence pruning): Output remains in natural language. Methods include LLMLingua, LLMLingua-2, Selective Context, LongLLMLingua, CPC. These are model-agnostic and can work with any LLM via API.

2. **Soft prompt methods** (learned embeddings): Output is continuous vectors. Methods include Gist Tokens, AutoCompressor, ICAE, 500xCompressor. These require either fine-tuning the target LLM or using a frozen decoder approach.

## Compression Granularity Trade-offs

| Granularity | Speed | Coherence | Max Compression | Best For |
|------------|-------|-----------|-----------------|----------|
| Sentence-level | Fast (up to 10.93x faster than token-level) | High | Moderate (4-8x) | RAG, QA with semantic preservation |
| Token-level | Moderate | Lower at high ratios | High (up to 20x) | Reasoning tasks, code |
| Soft/embedding | Requires pre-computation | N/A (not human-readable) | Extreme (up to 500x) | Cached/reusable prompts, KV cache |

## Key Metrics Across Methods

| Method | Max Compression | Performance Retention | Speed | Training Required |
|--------|----------------|----------------------|-------|-------------------|
| LLMLingua | 20x | ~98% on GSM8K | 1.7-5.7x faster | No (uses existing small LM) |
| LLMLingua-2 | 5x | Superior to LLMLingua OOD | 3-6x faster than LLMLingua | Yes (BERT fine-tune on distilled data) |
| LongLLMLingua | 4-7x | +21.4% vs. uncompressed (fixes lost-in-middle) | 2.1x faster | No |
| Selective Context | 2x | -0.023 BERTscore | 32% time reduction | No |
| CPC (AAAI 2025) | Varies | Outperforms token-level | 10.93x faster than token-level | Yes (encoder training) |
| FINCH | 93x | 90% accuracy at 3.76x | Faster in most cases | No (training-free) |
| Gist Tokens | 26x | Near-lossless | 40% FLOPs reduction | Yes (attention mask modification) |
| 500xCompressor | 500x | 70-84% EM retention | 27-90% calc reduction | Yes (0.3% added params) |

## Critical Findings for Code Context

1. **Code compresses better than math** (Perplexity Paradox): Perplexity-based methods preserve code syntax tokens (high perplexity) but incorrectly prune numerical values in math (low perplexity despite being task-critical). Code generation tolerates compression ratios >= 0.6.

2. **Function signatures are critical**: Signature injection recovers +34 percentage points in pass rate when signatures are lost during compression.

3. **Task-Aware Adaptive Compression (TAAC)** outperforms fixed-ratio compression by 7% on cost-quality tradeoffs for mixed content.

4. **Structured summaries beat generic compression for coding agents** (Factory AI): Explicit sections for session intent, file modifications, decisions, and next steps preserve technical detail that generic compression loses.

## Information-Theoretic Foundation

- LLMLingua uses **perplexity** (exponentiation of information entropy) as a proxy for token importance
- Tokens with low perplexity are highly predictable given context and contribute less information -- removing them has minimal impact on LLM comprehension
- LLMLingua-2 demonstrated that **unidirectional perplexity is suboptimal** -- bidirectional context (BERT) captures more essential information for compression decisions
- Cross-entropy provides a lower bound on compressibility but does not fully capture task-relevance

## Practical Recommendations

1. **For RAG pipelines**: LongLLMLingua at 4-7x compression provides the best quality-cost balance, with 80%+ cost reduction and potential accuracy improvements via lost-in-middle mitigation.

2. **For code context**: Use task-aware compression (TAAC) or structured summarization (Factory approach). Never blindly apply perplexity-based pruning to mixed code/reasoning content.

3. **For extreme compression needs**: 500xCompressor or FINCH for KV-cache-level compression, but expect 16-30% quality degradation.

4. **For latency-sensitive applications**: CPC (sentence-level) is 10x faster than token-level methods with comparable quality.

5. **For production systems**: PCToolkit provides a unified evaluation framework to benchmark methods on your specific workload before committing.

6. **For long-running agent sessions**: Factory's structured rolling summary approach outperforms generic compression by maintaining explicit sections for different information types.

## Open Research Directions

- Combining hard and soft prompt methods for hybrid compression
- Optimizing compression specifically for agentic workflows (multi-turn, tool-use)
- Multimodal compression (text + code + images in unified context)
- Adaptive compression that varies ratio based on content type within a single prompt
- Better evaluation frameworks that measure downstream task quality rather than just token-level metrics
