# Golden Dataset Creation and Evaluation Set Design

> Research compiled 2026-03-25. Covers academic papers, industry blogs, tooling,
> and benchmark methodologies for building gold-standard evaluation datasets.

---

## 1. Core Concept: What Is a Golden Dataset?

## Building a Golden Dataset for AI Evaluation: A Step-by-Step Guide (https://www.getmaxim.ai/articles/building-a-golden-dataset-for-ai-evaluation-a-step-by-step-guide/)

- A golden dataset is a curated collection of high-quality data (often question-answer pairs) that serves as a benchmark for model performance evaluation, meticulously crafted and often labeled by domain experts to ensure accuracy and relevance
- Common collection workflows: leverage in-house Subject Matter Experts (SMEs), outsource to third parties, employ user data and feedback, or gather prompts through User Experience Research (UXR) surveys
- ~100 QA samples is a reasonable starting size to provide enough diversity without overwhelming resources
- Dataset must be large enough to be representative of the data distribution in production
- Standardized annotation protocol is critical; must be rigorously followed for fair comparisons between application versions
- Treat the dataset as living: continuously evolve with new failure modes, fresh content domains, changing user behavior, and updated compliance requirements
- Evaluator types: deterministic (programmatic), statistical (regex/heuristics), and LLM-as-a-judge with clear rubrics and guardrails

## Golden Datasets: Creating Evaluation Standards (https://www.statsig.com/perspectives/golden-datasets-evaluation-standards)

- Golden datasets are not used as source data to train or fine-tune an LLM; they are used to assess the quality of outputs by comparing AI-generated answers with expert answers
- Quality of the evaluation directly hinges on the quality of the golden dataset
- Careful data curation, cleaning, and thorough processing are crucial to ensure the dataset accurately reflects real-world scenarios and is free from biases

## What Are Golden Datasets in AI? (https://innodata.com/what-are-golden-datasets-in-ai/)

- Innodata implements a double-pass blind / inter-annotator agreement (IAA) process where each article is annotated by two domain experts, with differences arbitrated by a third expert
- Ensuring diversity in the golden dataset is essential to cover a wide range of scenarios and user inputs; include data from various demographics, geographies, and contexts
- Linguists, taxonomists, and subject matter experts across 85+ languages create datasets ranging from simple to highly complex for fine-tuning across extensive task categories

## Golden Datasets: Evaluating Fine-Tuned LLMs (https://sigma.ai/golden-datasets/)

- Key annotation methodology steps: (1) data preparation / cleaning, (2) guidelines development, (3) annotator selection with domain expertise, (4) quality control via cross-validation and external experts, (5) inter-annotator agreement measurement
- Sigma AI has 30,000 annotators with specialized backgrounds in 500+ languages and dialects
- Golden datasets provide a reliable standard: by comparing model predictions against human-validated results, data scientists can assess accuracy, identify biases and limitations, and uncover areas for improvement

## Your Golden Dataset Is Worth More Than Your Prompts (https://www.anup.io/your-golden-dataset-is-worth-more-than-your-prompts/)

- Most teams spend weeks perfecting prompts and minutes on evaluation data; "that's backwards"
- The golden dataset captures "your organization's definition of what 'correct' means for your specific use case"
- Rather than exact string matching, evaluation checks whether the actual response captures the same facts -- the critical shift from traditional testing
- Part of the "Evaluation-Driven Development for LLM Systems" philosophy: traditional testing breaks down for non-deterministic outputs where correctness is subjective

---

## 2. Industry Evaluation Frameworks

## Anthropic: Demystifying Evals for AI Agents (https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

- An evaluation ("eval") is a test for an AI system: give an AI an input, then apply grading logic to its output to measure success
- Agents are harder to evaluate: they use tools across many turns, modifying state; mistakes propagate and compound
- Key terminology: task (single test with defined inputs and success criteria), trial (each attempt), transcript/trace (complete record including tool calls, reasoning, intermediate results), outcome (final state)
- **Dataset size: You don't need hundreds of tasks. 20-50 simple tasks drawn from real failures is a strong starting point**
- Grade what the agent produced, not the path it took; build in partial credit
- Clear rubrics, isolated judges for each dimension, and regular calibration against human experts for model-based graders
- Human graders set the gold standard but don't scale; reserve them for calibrating model-based graders and subjective outputs

## OpenAI: Evaluation Best Practices (https://platform.openai.com/docs/guides/evaluation-best-practices)

- Important components: define eval objective, collect a dataset, define eval metrics, run and compare evals, and continuously evaluate
- Dataset sources: synthetic eval data, domain-specific eval data, purchased eval data, human-curated eval data, production data, and historical data
- A small, empowered team with both technical and domain expertise should write down the system's purpose, state the most important outcomes to measure, outline the workflow end-to-end, and for every step define what success looks like and what to avoid
- Rubrics bring concreteness to judging outputs but it is possible to over-emphasize superficial items at the expense of overall goals
- Quantitative evals: exact match, string match, ROUGE/BLEU scoring, function call accuracy
- Human judgment evals: highest quality but slow and expensive; create randomized, blinded tests where humans judge quality

## OpenAI: Testing Agent Skills Systematically with Evals (https://developers.openai.com/blog/eval-skills)

- Systematic skill-based evaluation approach for agents
- Tests specific capabilities rather than end-to-end behavior

## Booking.com: LLM Evaluation Practical Tips (https://booking.ai/llm-evaluation-practical-tips-at-booking-com-1b038a0d6662)

- Uses LLM-as-a-judge to evaluate target LLM outputs based on carefully annotated golden datasets for continuous monitoring of production GenAI applications
- Golden dataset main aim: accurately assess the ability of a judge-LLM to evaluate a production LLM in a particular metric
- Annotation protocol must be standardized: both basic and advanced protocols provided
- Define metrics with business owner in most unambiguous way possible; prefer binary or categorical metrics with few classes since LLMs struggle with continuous scores
- Start with ~50 samples from pilot annotation; for proper evaluation and tuning of judge-LLM need 500-1000 examples
- When agreement between judge LLM and human annotation exceeds threshold, deploy judge LLM for continuous production monitoring

## Microsoft Prompt Flow: Copilot Golden Dataset Creation Guidance (https://github.com/microsoft/promptflow-resource-hub/blob/main/sample_gallery/golden_dataset/copilot-golden-dataset-creation-guidance.md)

- Golden datasets assess quality of copilot answers by sending each question to LLMs and comparing AI-generated answers with expert answers
- Have an additional QA pass by a second domain expert to ensure questions and responses are correct and complete
- Export data to CSV or JSONL using Excel, Microsoft Lists, or CSV directly
- Quality metrics measured via Prompt Flow: GPT similarity, Relevance, Coherence, and Groundedness (all scored 1-5, goal of 3+)

## Datadog: Building an LLM Evaluation Framework (https://www.datadoghq.com/blog/llm-evaluation-framework-best-practices/)

- Effective framework includes metrics to characterize both prompts and responses, including internal inputs/outputs in agentic or chain-based applications
- Faithfulness evaluations: secondary LLM tests whether response can be logically inferred from context; low faithfulness score indicates hallucinations
- Needle-in-the-haystack test: checks how well LLM retrieves discrete information from context window
- Creating ground truth labels is time-consuming, usually requires human-in-the-loop; possible to use LLM to generate responses that humans review and edit
- Test sets: database tables with prompts and ground truth responses; load via pipeline, run evaluations on each row
- Integrates with Ragas and NeMo evaluation frameworks

## Evidently AI: How Companies Evaluate LLM Systems (https://www.evidentlyai.com/blog/llm-evaluation-examples)

- 7 examples from Asana, GitHub, and more showing real-world LLM evaluation approaches
- Asana built an in-house LLM unit testing framework allowing engineers to test LLM responses during development (similar to traditional unit testing)
- Asana uses LLM-as-a-judge to verify unit test assertions; runs tests multiple times to ensure accuracy
- Evidently released a GitHub Action for LLM output quality checks in CI: evaluates generated responses using LLM judges, Python functions, or metrics like classification precision/recall
- Evaluations needed at every stage: comparing prompts/models during experiments, stress-testing before launch, monitoring production, regression tests before rollout

## AWS FMEval: Ground Truth Generation Best Practices (https://aws.amazon.com/blogs/machine-learning/ground-truth-generation-and-review-best-practices-for-evaluating-generative-ai-question-answering-with-fmeval/)

- Start with human curation of a small question-answer dataset: small (based on bandwidth), high in signal, prepared by SMEs
- This exercise forces data alignment early, raising important questions among stakeholders about what to measure
- Generate multiple variations of facts to fit multiple possible expressions
- Ground truth review: query generative AI pipeline with golden dataset questions, evaluate responses against golden answers, then have a judge review quality
- Judge role can be assumed by another LLM for scale but maintaining human-in-the-loop is essential to sample and verify results
- FMEval provides metrics for toxicity, accuracy, and semantic similarity; evaluates across open-ended generation, summarization, QA, and classification

---

## 3. Code Benchmark Creation Methodologies

## SWE-bench: Can Language Models Resolve Real-World GitHub Issues? (https://github.com/SWE-bench/SWE-bench)

- Built by collecting 2,294 Issue-Pull Request pairs from 12 popular Python repositories (ML, data processing, web frameworks)
- Each instance: a GitHub issue + the pull request that resolved it; PR must include a unit test that fails before and passes after the code change ("fail to pass" test)
- Evaluation performed by unit test verification using post-PR behavior as reference solution
- Each task executed within an isolated Docker container

## SWE-bench Verified: Human-Validated Subset (https://openai.com/index/introducing-swe-bench-verified/)

- Released by OpenAI in August 2024; 500 high-quality test cases curated from original benchmark
- 93 software developers screened the subset; each problem reviewed by 3 experts independently
- Filtered out: overly specific or unrelated unit tests, underspecified issue descriptions, difficult environment setups
- 38.3% of samples flagged for underspecified problem statements; 61.1% flagged for unit tests that may unfairly mark valid solutions as incorrect
- Overall 68.3% of original SWE-bench samples filtered out due to quality issues
- 'Easy' subset: 196 tasks (<15 min fix); 'Hard' subset: 45 tasks (>1 hour)
- OpenAI later retired SWE-bench Verified evaluation (https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/) because top models saturated the benchmark

## SWE-Bench++: Scalable Generation Framework (https://arxiv.org/abs/2512.17419)

- Framework for scalable generation of software engineering benchmarks from open-source repositories
- Addresses need for automated, reproducible benchmark creation pipelines

## HumanEval: Evaluating LLMs Trained on Code (https://github.com/openai/human-eval)

- 164 hand-crafted programming challenges comparable to simple software interview questions
- Each problem includes function signature, docstring, body, and several unit tests (average 7.7 tests per problem)
- Designed to prevent data leakage: problems were not included in training sets of code generation models
- Evaluation metric: pass@k -- probability that at least one of top k generated samples passes all unit tests
- Pass@1 is the most commonly used metric (percentage of problems solved on first attempt)
- Focuses on functional correctness: code evaluated on ability to pass tests, not syntactic similarity to reference solution

## BigCodeBench: Next-Generation Code Benchmark (https://huggingface.co/blog/leaderboard-bigcodebench)

- 1,140 fine-grained programming tasks invoking multiple function calls from 139 libraries and 7 domains
- Quality guaranteed through "Human-LLM collaboration process": seed dataset from ODEX (Stack Overflow one-liners), GPT-4 expands into comprehensive tasks
- 20 human experts (5+ years Python experience) guide GPT-4 in execution-based sandbox to refine synthesized tasks and add test cases
- Addresses limitations of HumanEval/MBPP (too simple, algorithm-focused)

## MultiPL-E: Polyglot Code Benchmark (https://github.com/nuprl/MultiPL-E)

- Translates unit test-driven benchmarks (HumanEval, MBPP) to 18+ programming languages
- Translation methodology: separate methods for prompt translation, unit test translation, and value-to-value translation
- Part of the BigCode Code Generation LM Harness

## CodeReviewer: Pre-Training for Automating Code Review (https://arxiv.org/abs/2203.09095)

- Large-scale dataset of real-world code changes and reviews from open-source projects in 9 popular programming languages
- Collection via ETCR tool: retrieves git commit hash, changed file names, then queries GitHub API for code changes (original file, new file, code diff) corresponding to review comments
- Training set: 150,406 entries; one of the largest publicly available code review datasets
- Three benchmark tasks: code change quality estimation, review comment generation, code refinement
- Pre-training: denoising code diff (DCD) and denoising review comment (DRC) objectives

---

## 4. Automated Evaluation of Code Review Quality

## CRScore: Grounding Automated Evaluation of Code Review Comments (https://arxiv.org/abs/2409.19801)

- Reference-free metric measuring review quality dimensions: conciseness, comprehensiveness, relevance
- Problem: code review is a one-to-many problem with many "valid reviews" for a diff; reference-based metrics fail here
- Two-step process: (1) generate pseudo-references (claims, issues, implications of code change) using LLMs and static analyzers, (2) use semantic textual similarity to align review parts to pseudo-references
- Greatest alignment with human judgment among open-source metrics: 0.54 Spearman correlation
- Published at NAACL 2025; annotations for 9 review generation systems across Python, Java, JavaScript
- CRScore++ follow-up (https://arxiv.org/html/2506.00296) adds reinforcement learning with verifiable tool and AI feedback

## Too Noisy To Learn: Enhancing Data Quality for Code Review Comment Generation (https://arxiv.org/html/2502.02757)

- Addresses noise in code review datasets that degrades model training quality
- Proposes data quality enhancement techniques for code review comment generation

---

## 5. Evaluation Rubric Design

## Rubric Is All You Need: LLM-Based Code Evaluation with Question-Specific Rubrics (https://arxiv.org/abs/2503.23989)

- Question-specific rubrics outperform question-agnostic rubrics for logical assessment of code
- Pointwise Rubric Evaluation (PRE): assesses code based on single rubric point at a time
- Ensembling Method Evaluation (EME): leverages GPT-4o and Claude with sampling, voting, and rounded mean method
- Hybrid evaluation: LLMs for logical evaluation + deterministic compiler-equipped agent for syntax (penalty-based scoring)
- Both rubric approaches outperform no-rubric techniques by providing the LLM grader an anchor for evaluation
- Published at ACM ICER 2025

## LLM-Rubric: Multidimensional, Calibrated Automated Evaluation (https://aclanthology.org/2024.acl-long.745/)

- Microsoft Research paper accepted at ACL 2024
- Manually constructed rubric describes how to assess multiple evaluation dimensions
- LLM prompted with each rubric question produces distribution over potential responses
- Multiple LLM distributions combined via small feed-forward neural network (judge-specific + judge-independent parameters) to predict each human judge's annotations
- With 9 rubric questions (naturalness, conciseness, citation quality, etc.) predicts human assessment of overall user satisfaction (scale 1-4) with RMS error < 0.5 (2x improvement over uncalibrated baseline)
- Code, data, models available on GitHub (https://github.com/microsoft/LLM-Rubric)

## AdaRubric: Task-Adaptive Rubrics for LLM Agent Evaluation (https://arxiv.org/html/2603.21362)

- Generates task-specific evaluation rubrics on the fly from task descriptions
- Scores trajectories step-by-step with confidence-weighted per-dimension feedback

## Ragas: Rubric-Based Evaluation (https://docs.ragas.io/en/latest/concepts/metrics/available_metrics/rubrics_based/)

- Framework for rubric-based evaluation of RAG pipelines
- Provides structured scoring approach with configurable rubric dimensions

## Promptfoo: LLM Rubric (https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric/)

- Practical tool for applying LLM-based rubric scoring to prompt outputs
- Integrates rubric evaluation into CI/CD pipelines

---

## 6. Inter-Annotator Agreement and Annotation Quality

## Inter-Annotator Agreement Metrics (https://keymakr.com/blog/measuring-inter-annotator-agreement-building-trustworthy-datasets/)

- **Cohen's Kappa**: measures agreement between two annotators corrected for chance; ranges -1 to 1
- **Krippendorff's Alpha**: handles more than two annotators, accounts for sample size, category diversity, and chance agreement; ranges 0 to 1
- **Fleiss' Kappa**: extension of Cohen's Kappa for multiple annotators
- Threshold guidelines:
  - < 0.40: low agreement, immediate intervention needed
  - 0.40-0.60: moderate agreement, review guidelines and add clarifying examples
  - 0.60-0.75: substantial agreement, acceptable for many use cases
  - 0.75-0.90: good agreement, suitable for most production use cases
  - > 0.90: excellent agreement; often required in medical/clinical AI settings
- Research standard: acceptable alpha typically exceeds 0.7

## Annotator Agreement Metrics at Scale (https://cleverx.com/blog/annotator-agreement-metrics-measuring-and-maintaining-annotation-quality-at-scale)

- Low inter-rater consistency creates problems across entire AI pipeline: training, evaluation, benchmarks
- When human annotators disagree, the quality of the dataset suffers, affecting ground truth, model, and benchmark
- Recommended strategies: dual-step "scratch + review" annotation with human-only initial labeling followed by independent review

## IAA Best Practices (https://www.innovatiana.com/en/post/inter-annotator-agreement)

- Clear annotation guidelines: ambiguity in task instructions often leads to disagreement
- Good examples and edge cases reduce confusion and improve agreement
- Regular training sessions and robust feedback mechanisms boost agreement
- Standardize processes and criteria across all annotators

## Prodigy: Annotation Metrics (https://prodi.gy/docs/metrics)

- Built-in IAA calculation for annotation quality assessment
- Integrates agreement metrics into annotation workflow

---

## 7. Annotation Tools Comparison

## Label Studio (https://labelstud.io/)

- Open-source, general-purpose data labeling platform
- Supports text, image, audio, video, and HTML annotation
- Model evaluation workflows: compare predictions against ground truth labels
- Supports pre-annotation/autolabeling with ML/AI models for human review
- Enterprise version adds collaboration, project management, and model monitoring features
- Building evolving benchmarks: progress from off-the-shelf to custom benchmarks tailored to use cases
- Three evaluation strategies: human annotators (domain expertise), LLM-as-a-judge (speed), code-based scoring (consistency)
- Blog: "How to Build AI Benchmarks That Evolve" (https://labelstud.io/blog/how-to-build-ai-benchmarks-that-evolve-with-your-models/)

## Prodigy (https://prodi.gy/)

- Scriptable annotation tool by Explosion (spaCy makers)
- Active learning: model in the loop, learns as you annotate; intelligently selects most informative examples, reducing annotation volume by up to 60%
- Core abstraction: "recipes" -- Python functions describing annotation workflows
- Supports NER, text classification, POS tagging, dependency parsing, image classification
- Runs entirely on own machines, never phones home; can run air-gapped
- Designed for small teams and individual data scientists
- Integrates with spaCy, TensorFlow, PyTorch
- Built-in IAA calculation (https://prodi.gy/docs/metrics)

## Argilla (https://github.com/argilla-io/argilla/)

- Collaboration tool for AI engineers and domain experts to build high-quality datasets
- Purpose-built for LLM fine-tuning and RLHF: demonstration data collection, comparison data for reward models, prompt collection
- CustomField enables tailored annotation interfaces for complex data (code, 3D models, videos, text) using HTML/CSS/JS
- Scales to hundreds of labelers within organization
- Push datasets to HuggingFace Hub for reproducibility
- Direct integration with TRL for reward model training
- LLM monitoring and evaluation with LangChain integration for continuous feedback

## Tool Selection Summary

| Tool | Best For | Deployment | Scale |
|------|----------|------------|-------|
| Label Studio | General-purpose, enterprise annotation | Self-hosted / Cloud | Large teams |
| Prodigy | Active learning, rapid iteration, NLP | Self-hosted (air-gapped OK) | Small teams |
| Argilla | LLM/RLHF data, comparison annotation | Self-hosted / HuggingFace | Medium-large teams |

---

## 8. Data Contamination and Benchmark Integrity

## When Benchmarks Lie: Why Contamination Breaks LLM Evaluation (https://thegrigorian.medium.com/when-benchmarks-lie-why-contamination-breaks-llm-evaluation-1fa335706f32)

- Data contamination occurs when evaluation data overlaps with training data, undermining evaluation credibility
- Models perform significantly better on leaked samples (e.g., StarCoder-7b achieved Pass@1 score 4.9x higher on leaked samples)

## LessLeak-Bench: Data Leakage Across 83 SE Benchmarks (https://arxiv.org/html/2502.06215v1)

- First large-scale investigation of data leakage in LLMs across 83 software engineering benchmarks
- Demonstrates widespread contamination across commonly used SE evaluation datasets

## Benchmark Data Contamination Survey (https://arxiv.org/html/2406.04244v1)

- Comprehensive survey of contamination issues from static to dynamic evaluation approaches
- Documents methods for detecting and mitigating contamination

## Leakage Prevention Strategies

### Code Refactoring (https://dl.acm.org/doi/10.1145/3755881.3755901)
- CodeCleaner: code restructuring + variable renaming to mitigate contamination

### LiveBench: Dynamic Evaluation (https://livebench.ai/livebench.pdf)
- Contamination-limited benchmark with verifiable ground truth answers
- Questions based on recently released math competitions, arXiv papers, news articles, datasets
- Scored automatically without LLM judge; six categories (math, coding, reasoning, data analysis, instruction following, language)
- Questions added/updated monthly; top models achieve below 70% accuracy
- Harder, contamination-limited versions of tasks from Big-Bench Hard, AMPS, IFEval

### LiveCodeBench: Contamination-Free Code Evaluation (https://livecodebench.github.io/)
- Holistic and contamination-free evaluation of LLMs for code
- Uses recently released coding competition problems

### AntiLeakBench (https://aclanthology.org/2025.acl-long.901/)
- Automatically constructs benchmarks with updated real-world knowledge
- Generates queries about newly emerged knowledge unknown before model's cutoff date

### Private Benchmarking
- Test datasets remain private using confidential computing and cryptography
- Prevents contamination entirely at the cost of transparency

### Inference-Time Decontamination (https://arxiv.org/html/2601.19334v1)
- TED calibrates outputs via repeated sampling
- ITD rewrites prompts using auxiliary LLMs
- API-only methods that intervene at inference time

---

## 9. Anti-Patterns in Evaluation Dataset Design

## Avoiding Common Pitfalls in LLM Evaluation (https://www.honeyhive.ai/post/avoiding-common-pitfalls-in-llm-evaluation)

- **Static datasets**: treating evaluation as a one-time task; datasets quickly become outdated as products evolve
- **Distribution shift**: input data, usage patterns, user expectations, and failure modes all change over time
- **Overfitting to eval set**: real risk when building an eval practice; high rankings may reflect overfitting rather than genuine improvement
- **Solution**: continuously update dataset AND evaluation criteria; process of grading helps iterate and improve criteria
- HoneyHive: capture underperforming test cases from production and add corrections to curate golden datasets for continuous testing

## LLM Structured Output Benchmarks Are Riddled with Mistakes (https://cleanlab.ai/blog/structured-output-benchmark/)

- Every public structured output benchmark examined was full of erroneous and inconsistent ground-truth outputs
- Many "errors" in LLM outputs were actually mistakes in the benchmark's "ground-truth"
- Error rates so high that little faith should be placed in derived model accuracy estimates
- **Solution**: Cleanlab released 4 new benchmarks with verified high-quality ground truth; conducted extensive error analysis with frontier models
- Lesson: always validate ground truth quality before using benchmark results

## Disadvantages of Standard LLM Benchmarks (https://www.dataforce.ai/blog/disadvantages-standard-llm-benchmarks)

- **Benchmark saturation**: when top models reach near-perfect scores, benchmark loses differentiation power
- **Domain-specificity gap**: standard benchmarks focus on multiple-choice/factual recall, not real-world open-ended generation and long-context reasoning
- **Oversimplified metrics**: overly simple metrics don't capture the full picture of LLM capabilities

## Prompt Evaluation: Random Sampling vs. Golden Datasets (https://www.helicone.ai/blog/prompt-evaluation-for-llms)

- Golden datasets tend to be simplified/idealized examples that may not reflect true complexity of real-world data; can lead to overfitting and poor generalization
- Random sampling ensures evaluation data reflects actual user interaction complexity and diversity
- **Best practice: "Random sampling catches emergent failures quickly; golden datasets provide deterministic baselines. Most teams run both."**

## QA Wolf: AI Prompt Evaluations Beyond Golden Datasets (https://www.qawolf.com/blog/read-ai-prompt-evaluations-beyond-golden-datasets)

- In fast-moving AI companies, prompts are constantly updated; by the time a golden dataset is created, prompts may have already changed
- Uses random sampling from production with minimal cleaning via Helicone's tools
- Complementary approach: golden datasets for deterministic baselines + random sampling for emergent failures

---

## 10. Evaluation Frameworks and Benchmark Assessment

## BetterBench: Stanford Assessment Framework (https://betterbench.stanford.edu/)

- 46 criteria across 5 benchmark lifecycle stages based on expert interviews and domain literature
- **Design** (14 criteria): clear capability definitions, domain expert involvement, informed metric choices, transparent purpose
- **Implementation** (11 criteria): evaluation code/data accessibility, replication scripts, data contamination indicators
- **Documentation** (19 criteria): comprehensive descriptions, quick-start guides, code comments, licensing
- **Maintenance** (3 criteria): feedback channels, update processes
- **Retirement**: suggested best practices for decommissioning
- Key findings: implementation is weakest area; average score of 3.75 for result replication scripts; 5.62 for statistical significance reporting
- Large quality differences between benchmarks; commonly used benchmarks suffer from significant issues
- Living repository at betterbench.stanford.edu for public benchmark assessments
- Paper: https://arxiv.org/abs/2411.12990

## Stanford HAI: What Makes a Good AI Benchmark? (https://hai.stanford.edu/policy/what-makes-a-good-ai-benchmark)

- High-quality benchmark: interpretable, clear about intended purpose and scope, usable
- Prioritize score interpretability: present results as inputs for decision-making, not absolutes
- Guarantee accessibility: provide data and scripts for reproducibility
- Assessed 24 benchmarks against framework, revealing large quality differences
- Minimum quality assurance checklist proposed for benchmark developers

## Relari: How Important Is a Golden Dataset? (https://www.relari.ai/blog/how-important-is-a-golden-dataset-for-llm-evaluation)

- Three evaluation approaches ranked by reliability:
  1. **Reference-free**: easiest to start (5 min), partial and often inconsistent insights
  2. **Synthetic-dataset-based**: consistent and complete metrics, but dataset can be biased/unrepresentative initially
  3. **Golden-dataset-based**: takes time to curate but offers most reliable and comprehensive insights
- Recommended: start with reference-free and synthetic metrics for fast directional insights, then curate golden dataset over time

## DeepEval: Evaluation Datasets Framework (https://deepeval.com/docs/evaluation-datasets)

- "Goldens" = precursors to test cases: contain input data and expected results but missing dynamic elements (actual_output, retrieval_context) generated at evaluation time
- Datasets can be single-turn or multi-turn depending on golden type
- Supports CSV, JSON, and HuggingFace datasets
- 50+ LLM-evaluated metrics with research backing, all multi-modal
- Best practice: include diverse real-world inputs, varying complexity levels, and edge cases

## Arize Phoenix: Custom LLM Evaluator with Benchmark Dataset (https://arize.com/docs/phoenix/cookbook/evaluation/creating-a-custom-llm-evaluator-with-a-benchmark-dataset)

- Golden dataset should be representative of expected data and contain ground truth labels
- Test evaluator on golden dataset to ensure it performs correctly in nuanced scenarios
- Score traces and spans with LLM-based evaluators, code-based checks, or human labels
- Pre-built evaluators for common use cases + custom eval templates
- Integrates with Ragas, DeepEval, Cleanlab

---

## 11. Synthesis and Key Takeaways

### What Makes a High-Quality Golden Dataset

1. **Representative coverage**: must reflect production data distribution, not just "happy path" examples. Include edge cases, adversarial inputs, and varying difficulty levels.

2. **Expert-validated ground truth**: human domain experts must create and validate annotations. Double-pass blind annotation with arbitration by a third expert is the gold standard (Innodata, Sigma AI).

3. **Clear annotation protocol**: unambiguous guidelines, examples for edge cases, and standardized processes across annotators. Inter-annotator agreement (Krippendorff's Alpha > 0.7) validates protocol quality.

4. **Living, evolving dataset**: static datasets rapidly become obsolete. Continuously add new failure modes from production, fresh content domains, and updated compliance requirements (HoneyHive, Anthropic).

5. **Contamination-free**: ensure no overlap with model training data. Use dynamic generation (LiveBench), code refactoring (CodeCleaner), or private benchmarking.

### Recommended Dataset Sizes

| Stage | Size | Source |
|-------|------|--------|
| Initial pilot | ~50 samples | Booking.com |
| Minimum viable golden dataset | ~100 samples | Maxim AI |
| Agent evaluation | 20-50 tasks from real failures | Anthropic |
| Production judge calibration | 500-1,000 examples | Booking.com |
| Full benchmark | 164 (HumanEval) to 2,294 (SWE-bench) | Academic benchmarks |

### Evaluation Architecture Pattern

```
Production Data --> Random Sampling --> Emergent Failure Detection
                                    \
                                     --> Golden Dataset Update
                                    /
Expert Annotation --> Golden Dataset --> Deterministic Baseline
                                     --> Judge LLM Calibration
                                     --> Regression Testing
                                     --> CI/CD Integration
```

### For Code Review Evaluation Specifically

1. **CRScore** provides the best reference-free approach: generate pseudo-references via LLMs + static analyzers, then score via semantic similarity (0.54 Spearman correlation with human judgment)
2. **CodeReviewer dataset** (150K entries, 9 languages) is the largest public code review dataset for training/evaluation
3. Code review is a **one-to-many problem**: there are many valid reviews for any diff, so reference-based metrics underperform reference-free approaches
4. Use **rubric-based evaluation** with question-specific rubrics (ACM ICER 2025) rather than holistic scoring
5. **Hybrid approach**: LLMs for logical evaluation + deterministic tools for syntax/style checking

### Anti-Pattern Checklist

- [ ] Do NOT rely on static, one-time datasets
- [ ] Do NOT use ground truth without validating it (Cleanlab found widespread errors in published benchmarks)
- [ ] Do NOT use only exact-match metrics for open-ended tasks
- [ ] Do NOT ignore data contamination (4.9x inflated scores observed)
- [ ] Do NOT skip inter-annotator agreement measurement
- [ ] Do NOT over-engineer rubrics at the expense of core evaluation goals
- [ ] Do NOT use continuous scores when categorical/binary metrics suffice (LLMs struggle with fine-grained scoring)
- [ ] Do NOT optimize solely for benchmark performance ("gaming")
- [ ] Do NOT assume golden datasets alone are sufficient; combine with random production sampling

### Tool Recommendations for Building Evaluation Datasets

| Need | Tool | Why |
|------|------|-----|
| General annotation at scale | Label Studio | Open-source, extensible, enterprise-ready |
| Rapid NLP annotation with active learning | Prodigy | 60% annotation reduction, air-gapped |
| LLM/RLHF comparison data | Argilla | Purpose-built for preference data, HuggingFace integration |
| Evaluation framework | DeepEval | 50+ metrics, golden/test case abstraction |
| Production monitoring | Arize Phoenix | Trace-level evaluation, multi-framework |
| CI/CD integration | Evidently AI | GitHub Action, regression testing |
| Rubric-based LLM judging | Promptfoo / LLM-Rubric | Structured scoring, calibrated |

---

## Sources (All URLs)

1. https://www.getmaxim.ai/articles/building-a-golden-dataset-for-ai-evaluation-a-step-by-step-guide/
2. https://www.statsig.com/perspectives/golden-datasets-evaluation-standards
3. https://innodata.com/what-are-golden-datasets-in-ai/
4. https://sigma.ai/golden-datasets/
5. https://www.anup.io/your-golden-dataset-is-worth-more-than-your-prompts/
6. https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
7. https://platform.openai.com/docs/guides/evaluation-best-practices
8. https://developers.openai.com/blog/eval-skills
9. https://booking.ai/llm-evaluation-practical-tips-at-booking-com-1b038a0d6662
10. https://github.com/microsoft/promptflow-resource-hub/blob/main/sample_gallery/golden_dataset/copilot-golden-dataset-creation-guidance.md
11. https://www.datadoghq.com/blog/llm-evaluation-framework-best-practices/
12. https://www.evidentlyai.com/blog/llm-evaluation-examples
13. https://aws.amazon.com/blogs/machine-learning/ground-truth-generation-and-review-best-practices-for-evaluating-generative-ai-question-answering-with-fmeval/
14. https://github.com/SWE-bench/SWE-bench
15. https://openai.com/index/introducing-swe-bench-verified/
16. https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/
17. https://arxiv.org/abs/2512.17419
18. https://github.com/openai/human-eval
19. https://huggingface.co/blog/leaderboard-bigcodebench
20. https://github.com/nuprl/MultiPL-E
21. https://arxiv.org/abs/2203.09095
22. https://arxiv.org/abs/2409.19801
23. https://arxiv.org/html/2506.00296
24. https://arxiv.org/html/2502.02757
25. https://arxiv.org/abs/2503.23989
26. https://aclanthology.org/2024.acl-long.745/
27. https://github.com/microsoft/LLM-Rubric
28. https://arxiv.org/html/2603.21362
29. https://docs.ragas.io/en/latest/concepts/metrics/available_metrics/rubrics_based/
30. https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric/
31. https://keymakr.com/blog/measuring-inter-annotator-agreement-building-trustworthy-datasets/
32. https://cleverx.com/blog/annotator-agreement-metrics-measuring-and-maintaining-annotation-quality-at-scale
33. https://www.innovatiana.com/en/post/inter-annotator-agreement
34. https://prodi.gy/docs/metrics
35. https://labelstud.io/
36. https://labelstud.io/blog/how-to-build-ai-benchmarks-that-evolve-with-your-models/
37. https://prodi.gy/
38. https://github.com/argilla-io/argilla/
39. https://betterbench.stanford.edu/
40. https://arxiv.org/abs/2411.12990
41. https://hai.stanford.edu/policy/what-makes-a-good-ai-benchmark
42. https://www.relari.ai/blog/how-important-is-a-golden-dataset-for-llm-evaluation
43. https://deepeval.com/docs/evaluation-datasets
44. https://www.confident-ai.com/docs/llm-evaluation/core-concepts/test-cases-goldens-datasets
45. https://arize.com/docs/phoenix/cookbook/evaluation/creating-a-custom-llm-evaluator-with-a-benchmark-dataset
46. https://thegrigorian.medium.com/when-benchmarks-lie-why-contamination-breaks-llm-evaluation-1fa335706f32
47. https://arxiv.org/html/2502.06215v1
48. https://arxiv.org/html/2406.04244v1
49. https://dl.acm.org/doi/10.1145/3755881.3755901
50. https://livebench.ai/livebench.pdf
51. https://livecodebench.github.io/
52. https://aclanthology.org/2025.acl-long.901/
53. https://arxiv.org/html/2601.19334v1
54. https://www.honeyhive.ai/post/avoiding-common-pitfalls-in-llm-evaluation
55. https://cleanlab.ai/blog/structured-output-benchmark/
56. https://www.dataforce.ai/blog/disadvantages-standard-llm-benchmarks
57. https://www.helicone.ai/blog/prompt-evaluation-for-llms
58. https://www.qawolf.com/blog/read-ai-prompt-evaluations-beyond-golden-datasets
59. https://medium.com/relari/how-important-is-a-golden-dataset-for-llm-pipeline-evaluation-4ef6deb14dc5
60. https://explosion.ai/blog/prodigy-annotation-tool-active-learning
