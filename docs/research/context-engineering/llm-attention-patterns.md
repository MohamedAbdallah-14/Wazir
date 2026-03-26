# LLM Attention Patterns and Context Utilization Research

**Date:** 2026-03-25
**Scope:** Academic papers, technical reports, and blog analyses on how LLMs actually use long contexts, attention distribution, position bias, and techniques to improve context utilization.

---

## Source 1: Lost in the Middle: How Language Models Use Long Contexts

**URL:** https://arxiv.org/abs/2307.03172
**Authors:** Nelson F. Liu, Kevin Lin, John Hewitt, Ashwin Paranjape, Michele Bevilacqua, Fabio Petroni, Percy Liang (Stanford, University of Washington)
**Published:** July 2023 (TACL 2024)

- The foundational paper establishing the "lost-in-the-middle" phenomenon in LLMs.
- Performance on multi-document QA and key-value retrieval tasks shows a distinctive **U-shaped curve**: models perform best when relevant information is at the **beginning or end** of the context, and significantly worse when it is in the **middle**.
- Performance can degrade by **more than 30%** when relevant information shifts from start/end positions to the middle of the context window.
- This effect persists even in models explicitly trained for long-context processing.
- Evaluated across context lengths of 10, 20, and 30 documents.
- Models demonstrate stronger recall for information in the **first 20%** and **final 10%** of the context window.
- The paper provides new evaluation protocols for future long-context language models, showing that simply extending context windows does not solve utilization.

---

## Source 2: Needle In A Haystack -- Pressure Testing LLMs

**URL:** https://github.com/gkamradt/LLMTest_NeedleInAHaystack
**Author:** Greg Kamradt (original test), extended by Arize AI and others
**Published:** Late 2023, widely adopted 2024-2025

- The original NIAH test embeds a specific out-of-place statement ("The best thing to do in San Francisco is eat a sandwich and sit in Dolores Park on a sunny day") at varying depths (0%-100%) within Paul Graham essays at varying context lengths (1K tokens to model max).
- **GPT-4 (128K):** Performed well at mid-length contexts but struggled with ultra-long documents, particularly in the upper-right region (long context + needle near beginning).
- **Claude 2.1 (200K):** Initial testing showed only **27% retrieval accuracy**, with performance declining as context length increased and improving as the needle was placed closer to the bottom.
- **Claude 3 Opus:** Error rate below **5%** for documents exceeding 50K tokens (major improvement).
- **Gemini 1.5 Pro:** Near-perfect recall (**>99.7%**) up to 1M tokens across all modalities.
- NIAH fundamentally measures **lexical retrieval** only -- a narrow capability. Models typically ace NIAH, creating a false perception that long-context is "solved."
- Extended variants include: Multi-Needle Retrieval Task (M-RT), Multi-Needle Reasoning Task (M-RS), and Ancestral Trace Challenge (ATC) for multi-layer logical challenges.

---

## Source 3: Context Rot: How Increasing Input Tokens Impacts LLM Performance

**URL:** https://research.trychroma.com/context-rot
**Authors:** Kelly Hong, Anton Troynikov, Jeff Huber (Chroma)
**Published:** July 2025

- Evaluated **18 LLMs** including GPT-4.1, Claude 4, Gemini 2.5, and Qwen3 models.
- Core finding: **every major LLM suffers from "context rot"** -- progressive accuracy decay as prompts grow longer, even on trivially simple tasks like "repeat this string."
- Adding full conversation history (~113K tokens) can **drop accuracy by 30%** compared to a focused 300-token version.
- NIAH underestimates real-world difficulty because it only tests lexical retrieval. Real tasks require semantic matching, reasoning over distributed information, and handling distractors.
- **Key factors** that non-uniformly degrade performance as context grows:
  - Needle-question similarity (semantic distance between query and answer)
  - Presence of distractors (even one similar-but-wrong piece of information significantly hurts; four distractors cause performance to tank)
  - Haystack structure (coherent, well-structured documents actually make retrieval *harder* than random text chunks -- models get trapped following narrative arcs)
  - Semantic relationships between haystack content and the needle
- Models do not use their context uniformly; performance grows increasingly unreliable as input length grows.

---

## Source 4: Found in the Middle: Calibrating Positional Attention Bias Improves Long Context Utilization

**URL:** https://arxiv.org/abs/2406.16008
**Authors:** Cheng-Yu Hsieh, Yung-Sung Chuang, Chun-Liang Li, Zifeng Wang, Long T. Le, Abhishek Kumar, James Glass, Alexander Ratner, Chen-Yu Lee, Ranjay Krishna, Tomas Pfister (Google, MIT, Stanford, UW)
**Published:** June 2024 (ACL Findings 2024)

- Establishes a direct connection between lost-in-the-middle and LLMs' **intrinsic U-shaped attention bias**: beginning and end tokens receive higher attention regardless of their relevance.
- Proposes "found-in-the-middle" -- a **calibration mechanism** that allows the model to attend to contexts according to their actual relevance, even in the middle.
- Results: outperforms existing methods by **up to 15 percentage points** on locating relevant information within long contexts.
- Leads to improved RAG performance across various tasks.
- The U-shaped attention bias is a property of the model architecture itself, not a training data artifact.

---

## Source 5: Retrieval Head Mechanistically Explains Long-Context Factuality

**URL:** https://arxiv.org/abs/2404.15574
**Authors:** Wenhao Wu, Yizhong Wang, Guangxuan Xiao, Hao Peng, Yao Fu (Peking University, UW, MIT, UIUC, University of Edinburgh)
**Published:** April 2024

- Systematic investigation across **4 model families, 6 model scales, and 3 types of finetuning**.
- Identifies **retrieval heads** -- a special type of attention head responsible for retrieving relevant information from long contexts. Key properties:
  1. **Universal:** All explored models with long-context capability have retrieval heads.
  2. **Sparse:** Only a small portion (**less than 5%**) of attention heads are retrieval heads.
  3. **Intrinsic:** Retrieval heads already exist in models pretrained with short context. When extending to 32-128K via continual pretraining, the **same set of heads** performs retrieval.
  4. **Dynamically activated:** In Llama-2 7B, **12 retrieval heads** always attend to required information regardless of context changes; remaining retrieval heads activate contextually.
  5. **Causal:** Completely pruning retrieval heads leads to **failure in retrieval and hallucination**. Pruning random non-retrieval heads does not affect retrieval ability.
- **Chain-of-thought reasoning heavily relies on retrieval heads** because the model needs to frequently refer back to the question and previously-generated context.
- Tasks where the model directly generates answers from intrinsic knowledge are less impacted by masking retrieval heads.

---

## Source 6: Context Length Alone Hurts LLM Performance Despite Perfect Retrieval

**URL:** https://arxiv.org/abs/2510.05381
**Authors:** Yufeng Du, Minyang Tian, Srikanth Ronanki, Subendhu Rongali, Sravan Bodapati, Aram Galstyan, Azton Wells, Roy Schwartz, Eliu A Huerta, Hao Peng (UIUC, Amazon, USC ISI, Argonne, Hebrew University, University of Chicago)
**Published:** October 2025 (EMNLP Findings 2025)

- Even when models **perfectly retrieve all relevant information**, performance still degrades **13.9%-85%** as input length increases within claimed context lengths.
- Tested across **5 LLMs** (Llama-3.1-8B-Instruct, Mistral-v0.3-7B-Instruct, GPT-4o, Claude-3.7-Sonnet, Gemini-2.0) on math, QA, and coding tasks.
- The failure occurs even when:
  - Irrelevant tokens are replaced with **minimally distracting whitespace**
  - All tokens are **masked** so models attend only to relevant tokens
  - All relevant evidence is placed **immediately before the question**
- This reveals a previously unrealized limitation: **the sheer length of input alone hurts performance**, independent of retrieval quality and without any distraction.
- Proposed mitigation: prompting the model to **recite retrieved evidence** before solving the problem. On RULER benchmark, this yields up to **4% improvement** for GPT-4o on an already strong baseline.

---

## Source 7: Eliminating Position Bias of Language Models: A Mechanistic Approach (PINE)

**URL:** https://arxiv.org/abs/2407.01100
**Authors:** Ziqi Wang, Hanlin Zhang, Xiner Li, Kuan-Hao Huang, Chi Han, Shuiwang Ji, Sham M. Kakade, Hao Peng, Heng Ji (UIUC, Harvard, Texas A&M)
**Published:** July 2024 (ICLR 2025)

- Position bias is attributed to **two components**: causal attention and positional embeddings (especially RoPE).
- Causal attention generally favors **distant content** (early tokens), while RoPE prefers **nearby content** (late tokens). The interaction of these two creates the observed U-shaped bias.
- Proposes **PINE (Position-INvariant inferencE)**: a training-free, zero-shot approach that:
  - Changes causal attention to **bidirectional attention** between documents
  - Uses model attention values to decide document ordering instead of input prompt order
- PINE provides **8-10 percentage point gains** on reasoning evaluation tasks, making Llama-3-70B-Instruct outperform GPT-4-0125-preview and GPT-4o on the RewardBench reasoning set.
- Applies to LM-as-a-judge, retrieval-augmented QA, molecule generation, and math reasoning.
- Position bias affects even **vision-language models**: placing an image at different positions on a canvas changes model loss consistently.

---

## Source 8: Found in the Middle: How Language Models Use Long Contexts Better via Plug-and-Play Positional Encoding (Ms-PoE)

**URL:** https://arxiv.org/abs/2403.04797
**Authors:** Zhenyu Zhang, Runjin Chen, Shiwei Liu, Zhewei Yao, Olatunji Ruwase, Beidi Chen, Xiaoxia Wu, Zhangyang Wang (VITA Group, Microsoft)
**Published:** March 2024 (NeurIPS 2024)

- Proposes **Multi-scale Positional Encoding (Ms-PoE)**: a plug-and-play approach requiring no fine-tuning and introducing no additional overhead.
- Addresses the **long-term decay effect** introduced by RoPE that causes models to de-emphasize middle content.
- Assigns **distinct scaling ratios to different attention heads**: scaling factor monotonically increases from "position-aware" heads to "position-unaware" heads.
- Creates a **multi-scale context fusion** from short to long distance, preserving pre-training knowledge while relieving positional decay.
- Achieves average accuracy gains of **up to 3.8 points** on the ZeroSCROLLS benchmark.
- Improves middle-position accuracy by **20-40%** compared to baseline models with no additional computational overhead.
- Tested on Llama-2, StableBeluga, and Vicuna.

---

## Source 9: Attention Heads of Large Language Models: A Survey

**URL:** https://arxiv.org/abs/2409.03752 (published in Cell Patterns, Feb 2025)
**Authors:** IAAR-Shanghai research group
**Published:** September 2024 (arXiv), February 2025 (Cell Patterns journal)

- First comprehensive survey focused on mechanisms of LLM attention heads.
- Introduces a **four-stage framework** inspired by human thought: Knowledge Recalling, In-Context Identification, Latent Reasoning, and Expression Preparation.
- Key attention head types identified:
  - **Induction Heads:** Capture "[A][B]...[A]" patterns and predict next token should be [B]. Foundation of in-context learning.
  - **Retrieval Heads:** Responsible for long-context information retrieval (see Source 5).
  - **Arithmetic Heads:** For addition/subtraction/division, only **6 heads** yield 97% average faithfulness. Multiplication requires **20 heads** to exceed 90%.
  - **Copying Heads:** Exhibit copying behaviors; neglecting external knowledge leads to hallucination in RAG scenarios.
  - **Knowledge FFNs:** From later LLM layers, over-add parametric knowledge to the residual stream, causing hallucination when external context should dominate.
- Attention heads are closely related to five key abilities: knowledge reasoning, logic reasoning, sentiment analysis, long-context retrieval, and text comprehension.

---

## Source 10: Beyond Early-Token Bias: Model-Specific and Language-Specific Position Effects in Multilingual LLMs

**URL:** https://arxiv.org/abs/2505.16134
**Authors:** (multilingual analysis group)
**Published:** May 2025 (revised December 2025)

- Analyzed position bias across **5 typologically diverse languages** (English, Russian, German, Hindi, Vietnamese) and **5 model architectures**.
- **450,000 evaluated question-answer pairs** across all conditions.
- Key finding: position bias is **primarily model-driven** but shows **language-specific nuances**.
- Challenges the assumption of universal early-token preference: **Qwen2.5-7B-Instruct, DeepSeek 7B Chat, and Mistral 7B consistently favor late positions**.
- Explicitly instructing the model that "the most relevant context to the query is marked as 1" **unexpectedly reduces accuracy** across all languages -- questioning standard prompt-engineering practices.
- Nine experimental conditions per language (3 context positions x 3 scoring strategies).

---

## Source 11: Context Discipline and Performance Correlation: Analyzing LLM Performance and Quality Degradation Under Varying Context Lengths

**URL:** https://arxiv.org/abs/2601.11564
**Authors:** Ahilan Ayyachamy Nadar Ponnusamy, Karthic Chandran, M Maruf Hossain
**Published:** December 2025

- Investigates the trade-off between system performance and model quality for **Llama-3.1-70B and Qwen1.5-14B** under large volumes of irrelevant/distracting context.
- Identifies a **non-linear performance degradation** tied to KV cache growth.
- Mixture-of-Experts (MoE) architectures reveal **unique behavioral anomalies at varying context scales** -- architectural benefits may be masked by infrastructure bottlenecks at high token volumes.
- Key distinction: performance degradation is not purely computational latency -- **reasoning accuracy and retrieval capabilities are fundamentally compromised** by long context with noise, even when required information is present.
- Context lengths tested up to 15,000 words with distracting content.

---

## Source 12: Epoch AI -- LLMs Now Accept Longer Inputs, and the Best Models Can Use Them More Effectively

**URL:** https://epoch.ai/data-insights/context-windows
**Authors:** Epoch AI research team
**Published:** 2025

- Since mid-2023, frontier LLM context windows have grown by **~30x per year** (doubling every ~2.4 months).
- On two long-context benchmarks (Fiction.liveBench and MRCR), the input length where top models reach 80% accuracy has risen by **over 250x in 9 months**.
- Models are not just getting larger windows -- they are getting genuinely better at using them.
- However, even models advertising 1M-token input **rarely sustain high-accuracy reasoning across more than half of it**; in real use, "effective context" often caps around **30-60% of the stated window** before recall decay sets in.
- Most open-source models demonstrate effective context length **less than 50%** of their training context length.
- Computational cost increases **quadratically** with context length due to transformer architecture.

---

## Source 13: Cutting Through the Noise: Smarter Context Management for LLM-Powered Agents (JetBrains Research)

**URL:** https://blog.jetbrains.com/research/2025/12/efficient-context-management/
**Authors:** Katie Fraser, Tobias Lindenbauer (JetBrains Research / TUM)
**Published:** December 2025 (NeurIPS 2025 DL4Code Workshop)

- Empirical study comparing context management approaches for SE agents:
  - **Observation Masking:** Targets environment observations only, preserves action/reasoning history. Works because agent turns heavily skew toward observation content.
  - **LLM Summarization:** Compresses long history into compact form, reducing resolution of all three parts (observation, action, reasoning).
- Key finding: both methods **reduce cost by ~50%** without significantly degrading downstream task performance.
- LLM-Summary **cannot consistently outperform** simple Observation Masking.
- **Novel combination** of LLM-Summary + Observation Masking yields 7-11% additional cost reduction.
- Practical implication: for agent systems, simple observation truncation is often as effective as expensive LLM-based summarization.

---

## Source 14: Why LLMs Get Distracted and How to Write Shorter Prompts (PromptLayer)

**URL:** https://blog.promptlayer.com/why-llms-get-distracted-and-how-to-write-shorter-prompts/
**Author:** Jared Zoneraich (PromptLayer)
**Published:** July 2025

- Practical synthesis of the Chroma Context Rot research for developers.
- The less your question **semantically resembles** the relevant information, the faster performance decays. Having the answer in the prompt is not enough -- it needs to be semantically close to the query.
- Coherent, well-structured documents **make retrieval harder** than random text chunks. Models follow narrative arcs instead of finding specific information.
- Even a **single distractor** (similar-but-wrong information) significantly hurts performance.
- Recommended strategies:
  1. **Multi-stage reranking:** Use cross-encoders or lightweight LLM reranking to eliminate near-miss distractors before they enter context.
  2. **Break narrative flow:** Chunk documents into 3-5 sentence windows without preserving long narrative arcs.
  3. **Treat context as scarce:** Retrieve smartly, compress aggressively, validate continuously, measure everything.
- "In the age of million-token context windows, sometimes less really is more."
- Models experience **~23% performance degradation** when context utilization exceeds 85% of maximum capacity.

---

## Source 15: Solving the 'Lost in the Middle' Problem: Advanced RAG Techniques (Maxim AI)

**URL:** https://www.getmaxim.ai/articles/solving-the-lost-in-the-middle-problem-advanced-rag-techniques-for-long-context-llms/
**Published:** 2025

- Comprehensive production-oriented guide to mitigating lost-in-the-middle in RAG systems.
- Root cause: **RoPE (Rotary Position Embedding)** introduces a long-term decay effect causing models to prioritize beginning/end tokens.
- **Two-stage retrieval strategy:**
  - Stage 1: Efficient vector similarity search retrieves 20-100 candidate documents (maximize recall).
  - Stage 2: Cross-encoder reranking evaluates relevance with greater precision, keeping only the **top 3-5 documents**.
- **Strategic document ordering:** Place most relevant documents at the beginning and end of context; least relevant in the middle.
- **Hybrid search:** Combine semantic vector search with keyword-based methods (BM25/TF-IDF). Semantic search handles paraphrasing; keyword search captures exact matches and domain terminology.
- **Contextual retrieval:** Prepend short summaries to each chunk before embedding, providing the retriever with richer context.
- Emerging architectural solutions: Ms-PoE, attention calibration, IN2 training.
- All techniques should be measured with retrieval, reranking, generation, and end-to-end metrics.

---

## Synthesis

### The Core Problem

LLMs do not use their context uniformly. Despite context windows growing at ~30x/year and now reaching millions of tokens, models exhibit systematic biases in how they attend to and utilize information based on its position. The effective context window is typically only 30-60% of the stated maximum.

### Position Bias: A U-Shaped Curve

The most robust finding across all research is the **U-shaped attention curve**: models strongly favor information at the beginning and end of their input, while systematically underweighting the middle. This is an architectural property arising from the interaction of **causal attention** (which favors early/distant tokens) and **positional embeddings like RoPE** (which favor nearby/late tokens). The combined effect creates a "dead zone" in the middle of the context.

### Context Length Hurts Independent of Content

A critical finding from Du et al. (2025) is that **length itself degrades performance**, even when retrieval is perfect, distractors are removed, and irrelevant tokens are replaced with whitespace. This suggests a fundamental computational limitation in how transformers process long sequences, not merely an information retrieval problem.

### The Retrieval Head Mechanism

Only ~5% of attention heads are responsible for information retrieval. These "retrieval heads" are universal across model families, intrinsic to pre-training, and causally necessary -- removing them causes hallucination. Chain-of-thought reasoning depends heavily on these heads, explaining why CoT is particularly sensitive to context quality.

### Practical Implications for Prompt and Context Engineering

1. **Position matters:** Place the most critical information at the **beginning and end** of prompts. Avoid burying important content in the middle.
2. **Less is more:** Shorter, more focused prompts consistently outperform longer ones with more context. Performance degrades ~23% when context exceeds 85% of capacity.
3. **Semantic proximity matters:** The closer the query semantically resembles the relevant context, the better retrieval performance. Rephrase or restructure to maximize this similarity.
4. **Distractors are poison:** Even one semantically similar but incorrect piece of information significantly degrades performance. Aggressively filter before including context.
5. **Break narrative coherence:** Counter-intuitively, chunked/fragmented context works better than coherent narratives for retrieval tasks.
6. **Rerank, don't just retrieve:** Two-stage retrieval (broad recall + precision reranking) is essential for production systems.
7. **Recite before solving:** Having models explicitly restate relevant evidence before answering can partially mitigate length-based degradation.

### Architectural Mitigations

| Technique | Approach | Improvement | Training Required |
|-----------|----------|-------------|-------------------|
| Found-in-the-Middle (calibration) | Attention bias calibration | Up to 15pp | No |
| Ms-PoE | Multi-scale positional encoding | 20-40% on middle accuracy | No |
| PINE | Bidirectional attention + attention-based ordering | 8-10pp on reasoning | No |
| Recite-then-solve | Prompt model to restate evidence | Up to 4% | No |
| IN2 training | Instruction-aware training | Varies | Yes |

### Open Questions

- Why does length alone degrade performance even with perfect retrieval and no distractors? The masked-attention experiments from Du et al. suggest this is a deeper computational limitation.
- Position bias is model-specific (some models favor late positions), complicating universal prompt engineering rules.
- Explicit position-marking instructions ("the most relevant context is marked as 1") can paradoxically **reduce** accuracy.
- As models improve at 30x context growth/year, will architectural fixes eventually make position bias negligible, or is it fundamental to the transformer architecture?
