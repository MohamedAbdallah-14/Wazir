# 46 -- Few-Shot Example Curation and Selection Strategies for LLMs

**Date:** 2026-03-25
**Status:** Research complete
**Scope:** Academic papers, practitioner blogs, tooling, and frameworks for selecting, curating, ordering, and managing few-shot examples in LLM prompts.

---

## Table of Contents

1. [Foundational Research](#1-foundational-research)
2. [Example Selection Strategies](#2-example-selection-strategies)
3. [Optimal Number of Examples](#3-optimal-number-of-examples)
4. [Example Ordering Effects](#4-example-ordering-effects)
5. [Negative Examples](#5-negative-examples)
6. [Few-Shot for Code Tasks](#6-few-shot-for-code-tasks)
7. [Tooling and Frameworks](#7-tooling-and-frameworks)
8. [Building Example Libraries for Production](#8-building-example-libraries-for-production)
9. [Synthesis and Recommendations](#9-synthesis-and-recommendations)

---

## 1. Foundational Research

### Brown et al. 2020 -- "Language Models are Few-Shot Learners" (GPT-3 paper)
**URL:** https://arxiv.org/abs/2005.14165

- Formalized few-shot prompting: providing 2-5 input-output demonstrations in the prompt enables models to learn new tasks at inference without weight updates.
- Demonstrated sharp accuracy gains from 0 to 1-2 examples, with diminishing returns beyond 4-5.
- Established that scaling model parameters unlocks the ability to learn from just a handful of in-context examples.
- Few-shot performance approaches fine-tuned models on many NLP benchmarks.

### Zhao et al. 2021 -- "Calibrate Before Use: Improving Few-Shot Performance of Language Models"
**URL:** https://arxiv.org/abs/2102.09690

- Identified three biases in GPT-3 few-shot classification that cause high variance:
  1. **Majority label bias** -- unbalanced label distribution among examples skews predictions.
  2. **Recency bias** -- model tends to repeat the label of the last example.
  3. **Common token bias** -- model favors producing common tokens over rare ones.
- Reordering the same set of examples could swing GPT-3 accuracy from near state-of-the-art to near random chance.
- Proposed contextual calibration: a method to adjust label probabilities to counteract these biases.
- Increasing model size or adding more examples does NOT reduce variance among different permutations.

### Agarwal et al. 2024 -- "Many-Shot In-Context Learning" (Google DeepMind)
**URL:** https://arxiv.org/abs/2404.11018

- Investigated ICL with hundreds or thousands of examples (the "many-shot" regime), enabled by expanded context windows.
- Going from few-shot to many-shot yields significant performance gains across generative and discriminative tasks.
- Many-shot ICL set new SOTA on low-resource translation (Kurdish, Tamil) and matched fine-tuned summarization models.
- Proposed **Reinforced ICL** (model-generated chain-of-thought rationales replacing human ones) and **Unsupervised ICL** (no rationales, just domain inputs) to mitigate the human-example bottleneck.
- Unlike few-shot, many-shot is effective at overriding pretraining biases and can learn high-dimensional numerical functions.
- Performance continues improving with scale; optimal shot counts are task-dependent (shown in paper Figure 1 for each task).

---

## 2. Example Selection Strategies

### Liu et al. 2021 -- KATE: "What Makes Good In-Context Examples for GPT-3?"
**URL:** https://arxiv.org/abs/2101.06804

- Proposed **KATE (kNN-Augmented in-conText Example selection)**: select the k training samples closest to the test input in embedding space.
- Significant improvements over random sampling baseline on GPT-3 for NLU and NLG tasks.
- Model pays more attention to detailed information (numbers, specifics) when using KATE-selected examples.
- **Limitation:** exhaustive similarity search over the full training set has prohibitive inference-time complexity for large datasets.

### Rubin et al. 2022 -- "Learning To Retrieve Prompts for In-Context Learning" (EPR)
**URL:** https://arxiv.org/abs/2112.08633 | https://aclanthology.org/2022.naacl-main.191/

- Proposed **Efficient Prompt Retriever (EPR)**: trains a dense retriever via contrastive learning to find training examples that serve as good prompts.
- Method: (1) unsupervised retriever gets candidate examples, (2) scoring LM labels top-k as positive and bottom-k as negative, (3) trains dense retriever with contrastive loss using two BERT-base encoders.
- Outperforms random and similarity-only baselines because it learns task-specific retrieval rather than relying on generic embeddings.

### Su et al. 2022 -- Graph-Based Diverse and Representative Selection
**URL:** https://arxiv.org/abs/2209.01975 (referenced in Lilian Weng survey)

- Proposed a graph-based approach for selecting both diverse and representative examples:
  1. Construct a directed graph G=(V,E) based on embedding cosine similarity, where each node points to its k nearest neighbors.
  2. Start with selected set L={} and remaining set U. Score each sample u in U by how much new coverage it adds, penalizing overlap with already-selected samples.
  3. The scoring formula encourages picking diverse samples: score(u) = sum of s(v) for v in neighbors, where s(v) decreases exponentially as more of v's neighbors are already selected.
- Balances relevance (similarity to test) with diversity (coverage of different patterns).

### Diao et al. 2023 -- Active-Prompt: Uncertainty-Based Example Selection
**URL:** https://arxiv.org/abs/2302.12246

- Borrows from uncertainty-based active learning to select the most informative examples for annotation.
- Method: run model multiple times, identify examples with high disagreement/entropy among sampling trials, annotate those for few-shot use.
- Achieves SOTA on 8 complex reasoning tasks; e.g., 7.2% improvement over self-consistency on arithmetic reasoning, 83.4% on GSM8K vs 63.1% with standard CoT.
- Key insight: the most uncertain examples are the most informative for few-shot demonstrations.

### Pecher et al. 2024 -- ACSESS: Automatic Combination of Sample Selection Strategies
**URL:** https://arxiv.org/abs/2402.03038

- Investigated 20 sample selection strategies across 5 few-shot learning approaches on 14 datasets (8 image, 6 text).
- Proposed **ACSESS**: automatically combines multiple selection strategies by weighting and normalizing their scores.
- Three weighting schemes: uniform, weighted (Datamodels-based), and weighted with random element.
- **Key finding:** ACSESS consistently outperforms individual strategies and recently proposed ICL selection methods.
- **Critical insight:** sample selection strategies matter most at low shot counts but regress toward random selection effectiveness at higher shot counts.
- Strong modality, dataset, and approach dependence -- no single strategy is universally best.

### Cegin et al. 2024 -- "Use Random Selection for Now"
**URL:** https://arxiv.org/html/2410.10756v1

- EMNLP 2025 Findings paper comparing selection strategies for LLM-based text augmentation.
- Compared similarity-based, dissimilarity-based, and other informed strategies against random selection.
- **Surprising result:** while some informed strategies offer marginal improvements (especially for out-of-distribution data), random selection remains a strong default for augmentation tasks.
- Similarity and dissimilarity selection (cosine similarity on feature representations) are the most popular informed strategies.
- Introduced synthetic-sample dissimilarity: use LLM to generate synthetic samples, then apply dissimilarity selection.

### Lilian Weng 2023 -- "Prompt Engineering" Survey
**URL:** https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/

- Comprehensive synthesis of example selection and ordering research:
  - **Selection:** choose semantically similar examples via kNN in embedding space (Liu et al. 2021); use graph-based diversity (Su et al. 2022); train task-specific retrievers (Rubin et al. 2022).
  - **Ordering:** keep examples diverse, relevant, and in random order to avoid majority label bias and recency bias.
  - Same order may work well for one model but badly for another.
  - Increasing model size or adding more examples does not reduce variance among permutations.
  - When validation set is limited, choose order that avoids extremely unbalanced or overconfident predictions.

---

## 3. Optimal Number of Examples

### Tang et al. 2025 -- "The Few-Shot Dilemma: Over-prompting Large Language Models"
**URL:** https://arxiv.org/html/2509.13196v1

- Introduces the **over-prompting** phenomenon: excessive examples paradoxically degrade LLM performance.
- Tested three selection methods (random, semantic embedding, TF-IDF) across GPT-4o, GPT-3.5-turbo, DeepSeek-V3, Gemma-3, LLaMA-3.1, LLaMA-3.2, and Mistral.
- After optimal performance at ~5-20 examples, performance of GPT-4o, GPT-3.5-turbo, LLaMA-3.1-8B, and Gemma-3-4B gradually declines.
- Combined TF-IDF selection with stratified sampling to identify optimal quantity per LLM, surpassing SOTA by 1% on software requirement classification.
- **Practical takeaway:** optimal number is model-dependent; always benchmark to find the sweet spot.

### Libretto Blog -- "How Many Few-Shot Examples Should You Use?"
**URL:** https://www.libretto.ai/blog/how-many-few-shot-examples-should-you-use

- Empirical study using the Emoji Movie benchmark (BIG-bench) with GPT-3.5-turbo.
- Tested 0 to 9 incrementally added examples across 100 questions, each run 6 times.
- Found performance plateau around example 3-4; adding more examples beyond that gives diminishing or no returns.
- Cross-model transferability is limited: the best set of examples for one model often performs differently on another.
- Recommends 3-5 examples as a practical starting point.

### Mem0 Guide 2026 -- "Few-Shot Prompting: Everything You Need to Know"
**URL:** https://mem0.ai/blog/few-shot-prompting-guide

- Synthesizes research: large gains from 0 to 2 examples, diminishing returns beyond 4-5 (Brown et al. 2020).
- Token costs scale linearly; accuracy gains flatten. A prompt with 10 examples costs ~5x more than 2 examples but is NOT 5x more accurate.
- **Exception:** highly specialized tasks (style, edge cases) can benefit from many more. Evan Armstrong documented 20,000+ token prompts with handwritten examples for production pipelines where every example covered a different edge case.
- **Practical framework:** start with 2-3 examples, evaluate, add only to address specific failure modes. If past 8, consider fine-tuning or dynamic selection.

### Summary Table: Optimal Example Counts

| Task Complexity | Recommended Range | Notes |
|---|---|---|
| Simple classification | 2-3 | Diminishing returns after 3 |
| Standard NLP tasks | 3-5 | Best cost/accuracy tradeoff |
| Complex reasoning / code | 5-7 | More examples help with edge cases |
| Specialized / style tasks | 5-20+ | Every example must cover unique edge case |
| Many-shot regime | 100-1000+ | Requires large context window; performance keeps improving |

---

## 4. Example Ordering Effects

### Lu et al. 2022 -- "Fantastically Ordered Prompts and Where to Find Them"
**URL:** https://arxiv.org/abs/2104.08786

- Demonstrated that permutation of in-context examples can cause performance swings from random-chance to near-SOTA.
- Same order may work well for one model but badly for another.
- Increasing model size does NOT reduce variance among permutations.

### Serial Position Effects (2024)
**URL:** https://arxiv.org/html/2406.15981v1

- LLMs exhibit serial position effects analogous to human primacy and recency biases.
- Carefully designed prompts can partially mitigate these biases, but effectiveness is inconsistent.

### The Order Effect (2025)
**URL:** https://arxiv.org/html/2502.04134v2

- Input order significantly affects performance across tasks.
- Few-shot prompting offers partial mitigation but fails to fully resolve the ordering problem.
- Shuffled inputs lead to measurable declines in accuracy.

### Practical Ordering Recommendations (synthesized from Prompting Weekly, Mem0, Lilian Weng):

1. **Common cases first, edge cases last.** Models pay more attention to tokens near the end of the prompt (recency effect). Place difficult or boundary-defining examples last.
2. **Most representative/important example last.** The final example has outsized influence on output.
3. **Best-quality example last.** In generation tasks, put your strongest example at the end.
4. **Balance labels.** Avoid having all examples share the same label to prevent majority-label bias.
5. **Test ordering.** Reordering is a worthwhile debugging step; newer/larger models (GPT-4, Claude, Llama 3) are less sensitive but the effect has not disappeared.

---

## 5. Negative Examples

### Prompting Weekly (Evan Armstrong) -- "Few-Shot Examples Done Properly"
**URL:** https://promptingweekly.substack.com/p/few-shot-examples-done-properly

- **Use both positive and negative examples.** The LLM learns significantly from seeing what a "bad" output looks like.
- Negative examples help establish decision boundaries -- when to refuse, escalate, or flag an error.
- Place negative examples last (near the end) because models struggle more with missing negatives than false positives.
- For validation prompts (detecting catastrophic failures), recommended ordering:
  1. System prompt
  2. Positive example (most common case)
  3. Negative example 1
  4. Negative example 2 (converted from a common failure mode)
- Use negative examples **sparingly** -- a couple of realistic "don't do this, do this instead" examples suffices.
- One strong example beats three similar ones. Trim everything that doesn't materially change behavior.

### PromptHub Guide
**URL:** https://www.prompthub.us/blog/the-few-shot-prompting-guide

- Including both positive and negative examples is one of five major design principles for few-shot prompting.
- Negative examples clarify boundaries and prevent common failure modes.
- But they should be used judiciously -- overloading with negative examples can confuse the model.

### Mem0 Guide -- Common Pitfalls
**URL:** https://mem0.ai/blog/few-shot-prompting-guide

- Surface-level pattern matching: models may latch onto formatting cues (length, punctuation, casing) rather than task logic.
- Examples with intentionally varied surface features but consistent underlying patterns tend to work better.
- This applies to both positive and negative examples -- vary the surface form to teach the underlying rule.

---

## 6. Few-Shot for Code Tasks

### Xu et al. 2024 -- "Does Few-Shot Learning Help LLM Performance in Code Synthesis?"
**URL:** https://arxiv.org/abs/2412.02906

- Systematic study from UCLA/UIUC/Nvidia on few-shot examples in code generation prompts.
- Two selection approaches:
  1. **CodeExemplar-Free (model-free):** selects examples the LLM finds difficult to generate independently. Principle: difficult examples force better learning.
  2. **CodeExemplar-Based (model-based):** trains a neural network to predict example effectiveness from historical performance data.
- Both methods significantly improve CodeLlama's HumanEval+ coding benchmark performance.
- **Key finding:** more complex input examples tend to be more informative than simpler ones.
- Unlike standard in-context learning, few-shot examples in code synthesis are not in the same input-output space, so existing ICL selection techniques do not directly transfer.
- Selection quality matters more than quantity for code tasks.

### Nashid et al. 2023 -- CEDAR: "Retrieval-Based Prompt Selection for Code-Related Few-Shot Learning" (ICSE 2023)
**URL:** https://people.ece.ubc.ca/amesbah/resources/papers/cedar-icse23.pdf | https://ieeexplore.ieee.org/document/10172590/

- Presented at ICSE 2023 (45th IEEE/ACM International Conference on Software Engineering).
- CEDAR automatically retrieves code demonstrations similar to the developer task using embedding or frequency-based analysis.
- Results on test assertion generation: **76% accuracy** (exact match), outperforming task-specific models by 333% and fine-tuned models by 11%.
- Results on program repair: **52% accuracy**, 189% better than task-specific models, competitive with fine-tuned.
- Applicable to multilingual and multitask settings without language-specific training.
- Demonstrates that retrieval-based dynamic selection dramatically outperforms fixed examples for code tasks.

### How Coding Tools Select Context (Copilot, Cursor)

- **GitHub Copilot:** examines code around the cursor, other open files, and repository metadata to identify relevant context. Users can attach files, symbols, selections, commits, and test failures as additional context.
- **Cursor:** context-aware chat understands full codebases for multi-file edits. Drag-and-drop folders provide additional context.
- These tools use **retrieval-augmented** approaches: they dynamically select the most relevant code snippets (effectively few-shot examples) based on the current editing context rather than using static templates.

### WirelessCar (2025) -- LLM-Assisted Code Review with RAG
**URL:** https://arxiv.org/html/2505.16339v1

- Field study combining an LLM-assisted code review tool with a semantic search pipeline based on RAG.
- Uses retrieval to assemble relevant contextual examples for the review, effectively creating dynamic few-shot prompts from project history.

---

## 7. Tooling and Frameworks

### DSPy -- Automatic Few-Shot Optimization
**URL:** https://dspy.ai/learn/optimization/optimizers/

DSPy provides a suite of optimizers that automatically select, generate, and tune few-shot examples:

| Optimizer | How It Works | When to Use |
|---|---|---|
| **LabeledFewShot** | Random selection of k examples from training set | Simplest; good baseline when you have labeled data |
| **BootstrapFewShot** | Teacher module generates demonstrations; metric validates them; only passing demos included | When you need quality-filtered examples |
| **BootstrapFewShotWithRandomSearch** | Runs BootstrapFewShot multiple times with random search; selects best program | When you want to explore the example space |
| **KNNFewShot** | kNN at inference time; dynamically selects demos most similar to current input | When inputs are diverse and fixed demos underperform |
| **MIPROv2** | Generates instructions + few-shot examples jointly; data-aware, demo-aware; Bayesian optimization over the space | Most powerful; for complex multi-module programs |
| **SIMBA** | Stochastic mini-batch sampling to find challenging examples; LLM self-reflects on failures | For identifying and addressing failure modes |
| **GEPA** | Reflects on program trajectory to identify gaps; incorporates domain-specific feedback | When you have domain expertise to incorporate |

- DSPy requires only three things: your program, a metric function, and a few training inputs (as few as 5-10, even unlabeled).
- Key insight: DSPy separates the **what** (your program logic) from the **how** (prompt optimization), making few-shot selection a tunable parameter rather than a manual craft.

### LangChain -- Dynamic Few-Shot Selection
**URL:** https://blog.langchain.com/few-shot-prompting-to-improve-tool-calling-performance/ | https://docs.langchain.com/langsmith/index-datasets-for-dynamic-few-shot-example-selection

- **SemanticSimilarityExampleSelector:** embeds examples in a vector store; retrieves k nearest neighbors for each query at inference time.
- **FewShotPromptTemplate:** constructs prompts dynamically from selected examples with consistent formatting.
- **LangChain experiments on tool-calling:**
  - Tested zero-shot, static 3-shot, dynamic 3-shot (semantic similarity), string-format 13-shot, and message-format 13-shot.
  - **Key result:** Claude 3 Sonnet went from **16% (zero-shot) to 52% with just 3 semantically similar examples.**
  - Dynamic 3-shot usually matched or beat static 13-shot (all examples). Fewer, more relevant examples outperform more, less relevant ones.
  - Claude models improved more with few-shotting than GPT models.
  - Message-format examples usually outperform string-format examples.

### LangSmith -- Dataset Management for Few-Shot
**URL:** https://docs.langchain.com/langsmith/manage-datasets

- Supports versioned datasets, splits, and filtered views for managing example pools.
- Enables indexing datasets for dynamic few-shot selection at inference time.
- Export to CSV, JSONL, or OpenAI fine-tuning format.

---

## 8. Building Example Libraries for Production

### Practical Architecture (synthesized from Mem0, PromptHub, Prompting Weekly, DataCamp)

**Example Pool Design:**
1. **Curate, don't collect.** Every example should be handpicked or validated. One strong example beats three mediocre ones.
2. **Cover edge cases explicitly.** The value of additional examples comes from covering new failure modes, not reinforcing common cases.
3. **Vary surface features.** Keep the underlying task pattern consistent but vary formatting, length, and phrasing to prevent surface-level pattern matching.
4. **Balance labels/categories.** Unbalanced example distributions create majority-label bias.
5. **Include negative examples.** 1-2 "don't do this" examples per prompt establish decision boundaries.
6. **Compress examples.** Remove unnecessary context, filler words, and details that don't contribute to the pattern. Higher signal-to-noise ratio is more effective and cheaper.

**Dynamic Selection Pipeline:**
1. Store all examples in a vector store (embedding-indexed database).
2. When a user query arrives, compute semantic similarity between the query and the example pool.
3. Retrieve top-k most relevant examples.
4. Format them using a consistent template.
5. Insert into prompt in the recommended order (common cases first, edge cases last, best example last).

**Governance and Quality:**
- Version example pools with semantic versioning.
- A/B test example sets: compare few-shot vs zero-shot, static vs dynamic, different example subsets.
- Measure accuracy, consistency, response time, and cost per example configuration.
- Log which examples were selected and correlate with output quality for continuous improvement.
- Store prompts in dedicated files/templates; modular design for testability.

**When to Transition Away from Few-Shot:**
- If you need more than ~8 static examples to get acceptable quality, consider dynamic selection or fine-tuning.
- If examples consume too much of your context window (competing with instructions, history, tool outputs, retrieved docs), trim aggressively or move to RAG-style dynamic selection.
- Fine-tuning becomes more cost-effective than per-request few-shot at very high volumes.

### Prompting Weekly -- Key Production Insights
**URL:** https://promptingweekly.substack.com/p/few-shot-examples-done-properly

- **ChatGPT's resistance:** ChatGPT (OpenAI's production system) is deliberately aligned to be consistent rather than compliant with few-shot examples. OpenAI optimizes for mass-market use cases, making it resistant to style changes via examples. This is less true for API models and open-source models.
- **Open-source models are more responsive** to few-shot examples because they have less aggressive alignment/RLHF. This is where few-shot examples provide the most dramatic improvements.
- **Context budget management:** examples share the context window with instructions, history, tool outputs, and retrieved docs. Trim niceties, boilerplate, and redundant explanations. Favor one strong example over three similar ones.
- **Production scale:** Evan Armstrong achieved consistent quality with "weak" open-source models for synthetic data generation using carefully crafted few-shot examples -- models others dismissed as trash.

---

## 9. Synthesis and Recommendations

### Core Findings

1. **Selection quality > quantity.** Which examples you choose matters far more than how many. Random selection is surprisingly competitive for many tasks, but semantic-similarity-based dynamic selection reliably outperforms it for diverse inputs (LangChain: 16% -> 52% with just 3 relevant examples vs zero-shot).

2. **2-5 examples is the sweet spot** for most tasks. Diminishing returns set in after 3-4 examples. Beyond ~8 examples, consider dynamic selection or fine-tuning. However, for specialized/style tasks, 10-20+ carefully crafted examples can be valuable (Evan Armstrong's 20K-token prompts).

3. **Over-prompting is real.** Excessive examples degrade performance in certain models (Tang et al. 2025). GPT-4o, LLaMA, and Gemma all show declining performance after their model-specific optimal count. Always benchmark.

4. **Dynamic > Static.** Retrieving semantically similar examples per-query outperforms fixed example sets, often matching or beating prompts with 3-4x more static examples. Use vector stores + kNN at inference time.

5. **Ordering matters.** Place common cases first, edge cases and negative examples last. Put your strongest example at the very end (recency effect). Balance label distribution. Larger/newer models are less sensitive but not immune.

6. **Negative examples are underused and powerful.** 1-2 well-placed negative examples ("don't do this, do this instead") dramatically improve boundary detection, especially for validation/classification tasks.

7. **Example format matters.** Message-format examples outperform string-format in tool-calling tasks (LangChain). Consistent formatting across all examples is critical -- inconsistent formatting confuses pattern recognition.

8. **Code tasks are different.** Few-shot examples in code generation are not in the same input-output space as standard ICL. Difficulty-based selection (pick examples the model struggles with) outperforms random. Retrieval-based selection (CEDAR) yields 333% improvement over task-specific baselines.

9. **No single strategy is universally best.** Selection effectiveness depends on model, modality, dataset, and task (ACSESS study). Combining strategies via weighted ensembles outperforms individual strategies. At higher shot counts, informed selection regresses toward random.

10. **Automate with DSPy.** DSPy's optimizers (especially MIPROv2, KNNFewShot, BootstrapFewShot) can automatically find optimal examples, instructions, and their combinations. Requires minimal training data (5-10 examples). Separates program logic from prompt tuning.

### Decision Framework

```
Is the task simple classification/extraction?
  -> Start with 2-3 static examples, test ordering
  -> If accuracy is sufficient: done

Is the input space diverse (many different query types)?
  -> Use dynamic selection (vector store + kNN, LangChain selectors, DSPy KNNFewShot)
  -> 3 dynamically selected > 13 static (LangChain finding)

Is the task complex (reasoning, code generation, specialized domain)?
  -> Start with 5 examples, add incrementally based on failure analysis
  -> Use difficulty-based selection for code (CodeExemplar-Free)
  -> Consider chain-of-thought + few-shot combination

Are you seeing inconsistent results?
  -> Test different orderings before adding more examples
  -> Check for majority-label bias
  -> Add 1-2 negative examples

At production scale?
  -> Dynamic selection pipeline (embed examples, retrieve per-query)
  -> Version and A/B test example pools
  -> Monitor which examples correlate with output quality
  -> If past 8+ static examples needed: fine-tune or use DSPy optimization
```

### Key Papers Cited

| Paper | Year | Key Contribution |
|---|---|---|
| Brown et al. -- GPT-3 | 2020 | Formalized few-shot prompting |
| Liu et al. -- KATE | 2021 | kNN-based example selection |
| Zhao et al. -- Calibrate Before Use | 2021 | Identified three biases in few-shot |
| Lu et al. -- Ordered Prompts | 2022 | Permutation sensitivity |
| Rubin et al. -- EPR | 2022 | Contrastive learning for retrieval |
| Su et al. -- Graph-based selection | 2022 | Diversity + representativeness |
| Nashid et al. -- CEDAR | 2023 | Retrieval-based code few-shot |
| Diao et al. -- Active-Prompt | 2023 | Uncertainty-based selection |
| Pecher et al. -- ACSESS | 2024 | Combining 20 selection strategies |
| Xu et al. -- CodeExemplar | 2024 | Difficulty-based code example selection |
| Cegin et al. -- Random Selection | 2024 | Random as strong default for augmentation |
| Tang et al. -- Over-prompting | 2025 | Performance degradation from excess examples |
| Agarwal et al. -- Many-Shot ICL | 2024 | Hundreds/thousands of examples regime |

### All Source URLs

- https://arxiv.org/abs/2005.14165
- https://arxiv.org/abs/2102.09690
- https://arxiv.org/abs/2101.06804
- https://arxiv.org/abs/2112.08633
- https://aclanthology.org/2022.naacl-main.191/
- https://arxiv.org/abs/2209.01975
- https://arxiv.org/abs/2104.08786
- https://arxiv.org/abs/2302.12246
- https://arxiv.org/abs/2402.03038
- https://arxiv.org/html/2410.10756v1
- https://arxiv.org/abs/2412.02906
- https://arxiv.org/html/2509.13196v1
- https://arxiv.org/abs/2404.11018
- https://arxiv.org/html/2406.15981v1
- https://arxiv.org/html/2502.04134v2
- https://people.ece.ubc.ca/amesbah/resources/papers/cedar-icse23.pdf
- https://ieeexplore.ieee.org/document/10172590/
- https://arxiv.org/html/2505.16339v1
- https://dspy.ai/learn/optimization/optimizers/
- https://blog.langchain.com/few-shot-prompting-to-improve-tool-calling-performance/
- https://docs.langchain.com/langsmith/index-datasets-for-dynamic-few-shot-example-selection
- https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/
- https://www.prompthub.us/blog/the-few-shot-prompting-guide
- https://promptingweekly.substack.com/p/few-shot-examples-done-properly
- https://mem0.ai/blog/few-shot-prompting-guide
- https://www.libretto.ai/blog/how-many-few-shot-examples-should-you-use
- https://www.datacamp.com/tutorial/few-shot-prompting
- https://www.promptingguide.ai/techniques/fewshot
- https://www.promptingguide.ai/techniques/activeprompt
