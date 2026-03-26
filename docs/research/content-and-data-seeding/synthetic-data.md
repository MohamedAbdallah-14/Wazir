# Synthetic Data Generation for Code and Software Engineering

**Research Date:** 2026-03-25
**Scope:** Synthetic code generation for training/evaluation, LLM-generated training data, synthetic bug generation, code model training pipelines, quality/diversity metrics, commercial tools, synthetic vulnerability generation, distillation approaches

---

## Table of Contents

1. [Surveys and Overviews](#surveys-and-overviews)
2. [Core Techniques: Self-Instruct, Evol-Instruct, OSS-Instruct](#core-techniques)
3. [Textbook-Quality Synthetic Data (Phi Series)](#textbook-quality-synthetic-data)
4. [Code Model Training Pipelines (StarCoder, DeepSeek Coder, Code Llama, Seed-Coder)](#code-model-training-pipelines)
5. [Synthetic Bug Generation for Testing and Review](#synthetic-bug-generation)
6. [Synthetic Vulnerability Generation for Security Training](#synthetic-vulnerability-generation)
7. [Quality, Diversity, and Complexity Metrics](#quality-diversity-complexity)
8. [Distillation as Data Seeding](#distillation-as-data-seeding)
9. [Commercial and Open-Source Tools](#commercial-and-open-source-tools)
10. [Open-Source Repos and Datasets](#open-source-repos-and-datasets)
11. [When Synthetic Data Works vs. Fails](#when-synthetic-data-works-vs-fails)
12. [Scaling Laws and Pre-training Insights](#scaling-laws)
13. [Synthesis and Key Takeaways](#synthesis)

---

## Surveys and Overviews

### Synthetic Data Generation Using Large Language Models: Advances in Text and Code (https://arxiv.org/abs/2503.14023)

- **Authors:** Nadas, Diosan, Tomescu (Babes-Bolyai University / KlusAI, 2025)
- **Type:** Comprehensive survey (24 pages, 64 references)
- Key techniques covered: prompt-based generation, retrieval-augmented pipelines, iterative self-refinement
- Code-specific advantages: automated verification of functional correctness via execution, only solutions that pass all tests are kept as synthetic data
- Applications covered: instruction tuning, code translation, bug repair, classification, question answering
- Challenges identified: factual inaccuracies, insufficient stylistic/distributional realism, bias amplification
- Mitigation strategies: filtering and weighting synthetic outputs, reinforcement learning with execution feedback in code domains
- As of Sept 2024, over 1,000 datasets labeled "synthetic" on Hugging Face; leading models (LLaMA, Falcon, Qwen, GPT-4) report using synthetic data in post-training
- Open directions: automated prompt engineering, cross-modal data synthesis, robust evaluation frameworks

### Mastering the Craft of Data Synthesis for CodeLLMs (https://arxiv.org/abs/2411.00005)

- **Authors:** Chen et al. (Oracle Corporation, NAACL 2025)
- Focused survey and taxonomy of data synthesis and filtering techniques for code LLMs
- Categorizes synthesis methods for: code generation, code completion, code translation, code repair, code documentation
- Highlights that data synthesis and filtering are highly effective for improving CodeLLM performance
- Practical guidance for researchers entering the field
- Companion GitHub repo with latest updates

### Surveying the Effects of Quality, Diversity, and Complexity in Synthetic Data from LLMs (https://arxiv.org/abs/2412.02980)

- **Authors:** Havrilla et al. (Georgia Tech, Cornell, Stanford, Eleuther AI, and others, 2024)
- Proposes evaluating synthetic data algorithms via three characteristics: Quality (Q), Diversity (D), Complexity (C)
- Quality is essential for in-distribution generalization
- Diversity is essential for out-of-distribution generalization
- Complexity is beneficial for both
- Identifies Quality-Diversity trade-offs in training data and downstream model performance
- Examines pipeline components (seed datasets, LLMs, prompts, filters) and their effects on QDC composition
- Argues that many models are currently evaluated only for output quality, limiting output diversity and self-improvement potential

### LLM-Synthetic-Data Reading List (https://github.com/pengr/LLM-Synthetic-Data)

- Live-updated, finely categorized collection of papers, tools, datasets, and blogs on LLM data synthesis (updated to July 2025)
- 464 GitHub stars, organized by LLM training stages with ultra-fine subcategories
- Sections: Surveys, Methods (by training stage), Analysis, Tools, Datasets
- Highly recommended resource for staying current

---

## Core Techniques

### WizardCoder: Empowering Code LLMs with Evol-Instruct (https://arxiv.org/abs/2306.08568)

- **Authors:** Luo et al. (ICLR 2024)
- Adapts the Evol-Instruct method from WizardLM to the code domain
- **Code Evol-Instruct process:** Takes Code Alpaca dataset (generated via self-instruct) as seed, iteratively evolves instructions using LLMs
- Evolution strategies specific to code:
  - Add constraints (e.g., "implement without using library X")
  - Increase reasoning depth
  - Concretize abstract instructions
  - Add code debugging tasks (novel)
  - Add time/space complexity constraints (novel)
  - Adversarial sample generation heuristics
  - Evolving stop controls (terminate evolution if instruction becomes unsolvable)
- Fine-tunes StarCoder on evolved data
- Results: WizardCoder-15B surpassed Claude and Bard on HumanEval and HumanEval+
- Benchmarks: HumanEval, HumanEval+, MBPP, DS-1000, MultiPL-E
- Open-source: code, model weights, and data at https://github.com/nlpxucan/WizardLM

### Magicoder: Empowering Code Generation with OSS-Instruct (https://arxiv.org/abs/2312.02120)

- **Authors:** Wei et al. (ICML 2024, University of Illinois)
- **OSS-Instruct:** Uses open-source code snippets as seeds to generate diverse instruction data
- Process: Extract 1-15 consecutive lines from open-source code documents as seed snippets, feed to LLM with prompt template asking it to "gain inspiration" and create a programming problem with [Problem Description] and [Solution]
- Generated 75K high-quality coding examples, each from a single-use snippet for unprecedented diversity
- Key motivation: mitigate inherent bias of purely LLM-generated synthetic data via open-source references
- Orthogonal to Evol-Instruct: combining both yields MagicoderS
- MagicoderS-CL-7B surpasses ChatGPT on HumanEval+ (66.5 vs 65.9 pass@1)
- Opens a new direction: diverse synthetic instruction data using abundant open-source references

### Code Alpaca / Self-Instruct for Code (https://github.com/sahil280114/codealpaca)

- 20K code instruction-following examples generated using Self-Instruct method with ChatGPT
- Modified from Stanford Alpaca: prompts focused on code generation/editing/optimization, seed tasks restricted to code-related tasks
- Cost: less than $200 to generate entire dataset
- Used to fine-tune LLaMA 7B/13B models into code assistants
- Foundation dataset used by WizardCoder as starting point for Evol-Instruct evolution

### Case2Code: Scalable Synthetic Data for Code Generation (https://arxiv.org/abs/2407.12504)

- **Authors:** Shao et al. (COLING 2025)
- Inductive inference task: infer code implementations from input-output examples
- Key innovation: uses a "writer LLM" to assist synthesis, so data quality does not directly depend on teacher LLM performance
- Pipeline: collect diverse programs with rule-based filters, generate input-output transformation cases with LLMs + code interpreters
- Scales without needing powerful reasoning LLMs
- Models trained with Case2Code improve on both in-distribution induction and general coding tasks
- Demonstrates potential of large-scale synthetic data + inductive learning

---

## Textbook-Quality Synthetic Data

### Textbooks Are All You Need (Phi-1) (https://arxiv.org/abs/2306.11644)

- **Authors:** Gunasekar et al. (Microsoft Research, 2023)
- **phi-1:** 1.3B parameter Transformer, trained 4 days on 8 A100s (~$6,500 compute)
- Training data:
  - "CodeTextbook" -- filtered web code data (6B tokens, selected for "textbook quality")
  - "Synthetic Textbooks" -- GPT-3.5-generated Python textbooks (<1B tokens)
  - "Synthetic Exercises" -- Python exercises and solutions (~180M tokens)
- Results: 50.6% pass@1 on HumanEval, 55.5% on MBPP (remarkable for 1.3B model)
- Key insight: **data quality can compensate for data quantity and model size**
- Demonstrates that carefully curated synthetic data focused on reasoning and problem-solving delivers outsized returns
- Led to Phi series (Phi-1.5, Phi-2, Phi-3) all leveraging synthetic textbook-style data

---

## Code Model Training Pipelines

### StarCoder / StarCoder2 and The Stack v2 (https://arxiv.org/abs/2402.19173)

- **StarCoder (v1):** Trained on The Stack, openly licensed GitHub data, 80+ programming languages
- Filtering pipeline: long-line filters (files >100 lines or lines >100 chars), alpha filters (<25% alphabetic chars), encoded data filters (base64, hex, Unicode)
- **StarCoder2 / The Stack v2:** Partnership with Software Heritage
  - Raw dataset: 67.5TB, ~900B training tokens (10x v1)
  - Deduplication: MinHash LSH with 5-grams, Jaccard similarity 0.7
  - Priority: files from repos with higher stars/forks, latest commit date as tiebreaker
  - PII redaction: StarPII model
  - Data sources: SWH repos (619 languages), GitHub PRs, Kaggle notebooks, code documentation
  - Malicious code scanning and removal, decontamination
  - Opt-out mechanism for developers
- **StarCoder2-Instruct:** Fully transparent self-alignment for code generation using synthetic instruction data

### DeepSeek Coder (https://github.com/deepseek-ai/DeepSeek-Coder)

- Trained from scratch on 87% code + 13% natural language (English and Chinese), 2T tokens
- Data from GitHub, same filtering rules as StarCoder Data
- **Repo-level processing:** Parses file dependencies within repositories, rearranges files based on dependency order, concatenates dependent files into single examples
- Repo-level MinHash deduplication
- Available in 1.3B, 6.7B, 33B sizes
- **DeepSeek-Coder-V2:** Breaks barrier of closed-source models in code intelligence

### Code Llama (Meta, https://arxiv.org/abs/2308.12950)

- Family of code LLMs built on Llama 2
- First stage: 500B-1T tokens from code-heavy dataset
- Second stage: fine-tuning with additional 5B tokens for instruction following
- Available in 7B, 13B, 34B, 70B parameters
- Synthetic data pipeline (from Llama 3 technical report):
  1. Generate large collection of programming problems from organic code snippets
  2. Generate solutions in many programming languages using large teacher model
  3. Evaluate solutions through linter + parser, discard failures
  4. Use model to write unit tests, verify executable output
  5. Send failing solutions back for correction with bug notes
  - This iterative generate-test-fix loop is key to code synthetic data quality

### Seed-Coder: Let the Code Model Curate Data for Itself (https://arxiv.org/abs/2506.03524)

- **Authors:** ByteDance Seed (June 2025)
- **Key innovation: model-centric data pipeline** -- LLMs score and filter code data, minimizing human involvement
- LLM filters evaluate code quality across 4 dimensions: **readability, modularity, clarity, reusability**
- Data sources: GitHub code, GitHub commits, code-related web data
- Curated corpus: 6 trillion tokens
- Instruct model: fine-tuned on large-scale synthetic data generated and filtered by LLMs, then DPO
- Reasoning model: Long-Chain-of-Thought (LongCoT) reinforcement learning
- State-of-the-art among 8B open-source models, surpasses some much larger models
- Demonstrates that LLMs can effectively self-curate training data

---

## Synthetic Bug Generation for Testing and Review

### SWE-Synth: Synthesizing Verifiable Bug-Fix Data (https://arxiv.org/abs/2504.14757)

- **Authors:** Pham et al. (FSoft AI4Code, April 2025)
- Framework for synthesizing realistic, verifiable, process-aware bug-fix datasets at repository level
- Uses LLM agents to simulate debugging workflows
- Produces: bug-fix pairs, test cases, and structured repair trajectories
- Models trained on SWE-Synth outperform those trained on real-world datasets by 2.3% on SWE-Bench Lite
- Scales with minimal human effort while preserving contextual richness
- Open source: https://github.com/FSoft-AI4Code/SWE-Synth

### BugPilot: Complex Bug Generation for Efficient Learning of SWE Skills (https://arxiv.org/abs/2510.19898)

- **Authors:** Microsoft Research (October 2025)
- Uses SWE agents to generate naturalistic bugs through realistic development workflows
- **FeatAdd approach:** Agent introduces features to a codebase, unintentionally breaking it -- mimics real-world bug patterns
- Contrasts with SWE-Smith's hand-engineered rules which produce narrow bug types
- Generated bugs more closely reflect human-authored patterns
- More efficient training data: outperforms other bug datasets by 2% with half the training data (1.2k vs 3k bugs)
- FrogBoss achieves 54.6% pass@1 on SWE-bench Verified (state-of-the-art)

### SWE-smith: Scaling Data for Software Engineering Agents (https://arxiv.org/abs/2504.21798)

- NeurIPS 2025 Datasets & Benchmarks Spotlight
- Addresses critical pain point: collecting SWE training data (existing datasets limited to ~1000 instances from <11 repos, requiring hundreds of hours of human labor)
- Pipeline: constructs execution environment for any Python codebase, automatically synthesizes 100s-1000s of task instances that break existing tests
- Dataset: 50k instances from 128 GitHub repos (order of magnitude larger than prior work)
- SWE-agent-LM-32B achieves 40% pass@1 on SWE-bench Verified
- Released: 26k SWE-agent trajectories, 250+ environments (one Docker image per repo)
- Open source: https://github.com/SWE-bench/SWE-smith

### Evaluating Synthetic Bugs (https://arxiv.org/abs/2208.11088)

- Examines quality of synthetically generated bugs for testing bug-finding tools
- Key concerns: syntactic realism (auto-generated variable names atypical of human naming) and semantic realism (control/data flows incongruent with program)
- BUGFARM: achieved 85% syntactic correctness (vs 59.4%/61.82% for alternatives), 85.55% confirmed bug rate
- Bug-guided mutation: leverages insight that residual bugs exist in previously buggy modules

### Challenging Bug Prediction and Repair Models with Synthetic Bugs (https://arxiv.org/abs/2310.02407)

- Mutation-based approach: generated over 1.9M mutants, ~699K syntactically correct, ~434K confirmed as bugs
- Highlights gap between synthetic bug patterns and real-world bugs
- Recommends focusing on realistic samples rather than purely synthetic ones

---

## Synthetic Vulnerability Generation for Security Training

### HexaCoder: Secure Code Generation via Oracle-Guided Synthetic Training Data (https://arxiv.org/abs/2409.06446)

- **Authors:** Hajipour et al. (CISPA Helmholtz Center, 2024)
- Two key components:
  1. **Oracle-guided data synthesis pipeline:** generates pairs of vulnerable + fixed code for specific CWE types
  2. **Two-step secure code generation:** generate security-relevant libraries first, then complete code
- Security oracle (CodeQL) identifies vulnerabilities, LLM repairs by extending/editing
- Each fine-tuning example includes security-related libraries + code
- Fine-tuning via LoRA
- Dataset: 1,776 total pairs (1,414 Python, 362 C/C++) across 11 CWE types
- **Results:** reduces vulnerable code generation by up to 85% vs baseline
- Repair rates with full security reports (CodeQL + hints): ~84% average across CWE types
- Maintains high functional correctness

### Secure-Instruct: Automated Pipeline for Secure Code Generation (https://arxiv.org/abs/2510.07189)

- **Authors:** Li et al. (2025)
- Automatically synthesizes high-quality vulnerable and secure code examples
- Instruction-tunes LLMs to align task description with secure code generation
- Evaluated on CWEBench (93 scenarios, 44 CWEs) and CWEval (31 CWEs, 119 tasks)
- **Results on CWEBench:** 28.5% increase in secure ratio over pre-trained models, outperforms SafeCoder by 12.6%
- **Results on CWEval:** 157.3% improvement for CodeLlama-7B, 46.4% for Mistral-7B in Func-Sec@1
- Uses LoRA for 7B models, full-weight tuning for 1B models
- Addresses limitations of SafeCoder (small, imbalanced datasets)

### SecureCode v2.0: Production-Grade Dataset for Security-Aware Code Generation (https://arxiv.org/abs/2512.18542)

- 2,185 multi-turn security training examples across two domains:
  - **Web security:** 1,435 examples covering OWASP Top 10 2021, 11 languages, 9 frameworks, 100% grounded in documented CVEs
  - **AI/ML security:** 750 examples covering OWASP LLM Top 10 2025, 40+ frameworks (LangChain, OpenAI, HuggingFace)
- 4-turn conversational structure: feature request, vulnerable + secure implementations with attack demos, advanced probing, defense-in-depth guidance
- **Multi-LLM synthesis:** ChatGPT 5.1, Claude Sonnet 4.5, Llama 3.2 with human expert review
- Released: 8 fine-tuned models (3B-20B, QLoRA) + evaluation framework with 4 security-specific metrics
- First public dataset jointly covering OWASP Top 10 2021 web + OWASP LLM Top 10 2025 AI/ML

### Generating Realistic Vulnerabilities via Neural Code Editing (https://chapering.github.io/pubs/fse22yu.pdf)

- FSE 2022 paper on using neural code editing to generate realistic vulnerabilities
- DL-generated samples confirmed as vulnerable and realistic are much more helpful than purely synthetic ones
- Recommends developing automated approaches to generating large-scale realistic vulnerability datasets

---

## Quality, Diversity, and Complexity Metrics

### DCScore: Measuring Diversity in Synthetic Datasets (https://arxiv.org/abs/2502.08512)

- **Authors:** Zhu et al. (ICML 2025)
- Classification-based diversity evaluation for synthetic datasets
- Formulates diversity evaluation as a sample classification task, capturing mutual relationships among samples
- Theoretically verified against diversity-related axioms
- Stronger correlation with multiple diversity pseudo-truths than existing methods
- Substantially reduces computational costs vs existing approaches
- Open source: https://github.com/BlueWhaleLab/DCScore

### Common Metrics for Synthetic Data Quality

- **N-gram diversity:** distinct-n (distinct n-grams), self-BLEU, ROUGE-L
- **Code-specific:** pass@k, HumanEval scores, MBPP scores, compilation rate, test pass rate
- **Fidelity:** measures quality of synthetic samples vs source distribution
- **Diversity:** measures coverage of full variability of real samples
- **Generalization:** quantifies extent of overfitting
- **Complexity metrics:**
  - Tree Instruct: number of nodes in semantic tree of instruction (more nodes = more complex)
  - InsTag: number of semantic tags assigned by prompted LLM
  - Parse tree depth and structure
  - GPT-4 scoring on 1-5 complexity scale
  - EvolComplexity: scores computed by evolving instructions
- **Key finding:** less but more complex data outperforms more but less complex data (not just a function of token count)

### Quality-Diversity Trade-offs

- Quality filters improve in-distribution performance but can reduce diversity
- Diversity is essential for out-of-distribution generalization
- Balancing QDC is essential for efficient RL and self-improvement algorithms
- Many models currently optimized only for output quality, limiting diversity and self-improvement potential

---

## Distillation as Data Seeding

### DeepSeek R1 Distillation (https://github.com/deepseek-ai/DeepSeek-R1)

- Generated 800,000 high-quality reasoning samples using R1, fine-tuned smaller models on these
- Released datasets: AM-DeepSeek-R1-Distilled (1.4M entries), Mixture-of-Thoughts (350k verified traces spanning math, coding, science)
- Pipeline: two RL stages (discovering reasoning patterns + aligning human preferences) + two SFT stages (seeding reasoning + non-reasoning capabilities)
- DeepSeek-R1-Distill-Qwen-32B outperforms OpenAI-o1-mini across benchmarks

### Predibase LLM Distillation Playbook (https://github.com/predibase/llm_distillation_playbook)

- 614 GitHub stars, comprehensive open-source guide
- 12 best practices for distilling LLMs:
  1. Understand limitations of smaller models
  2. Build good logging infrastructure
  3. Define clear evaluation criteria
  4. Maximize quality of teacher model
  5. Maximize quality of training data
  6. **Best datasets are diverse and balanced**
  7. Start simple and small
  8. Assess marginal utility of more data
  9. Consider serving requirements
  10. Experiment broadly, one parameter at a time
  11. [Additional practices]
  12. Deploy and monitor (dark launch, hybrid launch, gradual rollout)
- Bootstrap datasets with real logs OR synthetic data
- Deployment strategies: Live experiment/canary rollout, Dark launch/shadow deployment, Hybrid launch

### How Distillation Works for Code (Breunig, https://www.dbreunig.com/2024/12/18/synthetic-data-the-growing-ai-perception-divide.html)

- Distilling content concentrates knowledge, allows producing smarter smaller models
- Extracting reasoning instructions teaches models to build up evidence for "reasoning" models
- Code has special advantage: generated code can be quantitatively tested at scale (unlike text)
- Llama 3 code synthesis pipeline:
  1. Collect organic code snippets as seeds
  2. Present to teacher model, ask to generate programming problems
  3. Generate solutions in many languages
  4. Evaluate through linter + parser, discard failures
  5. Write unit tests, verify outputs
  6. Send failures back for correction
- **Synthetic data is NOT a silver bullet:** better for quantitative tasks (code, math) but not delivering similar gains for other use cases
- Creates a "perception gap" between users of LLMs for code/math vs other tasks

### Snorkel AI Guide to LLM Distillation (https://snorkel.ai/blog/llm-distillation-demystified-a-complete-guide/)

- Positions large model as "teacher," smaller model as "student"
- Basic flow: start with unlabeled data, teacher LLM labels it, labeled data trains student
- Student mirrors teacher's performance on defined task
- Key for cost reduction in production deployments

### EasyDistill (https://github.com/modelscope/easydistill)

- Open-source toolkit by ModelScope for LLM knowledge distillation
- Supports black-box and white-box methodologies
- Features: data synthesis, supervised fine-tuning, ranking optimization, reinforcement learning
- Versatile platform to streamline the KD process

---

## Commercial and Open-Source Tools

### Gretel AI (https://gretel.ai)

- **Gretel Navigator:** Agent-based compound AI system for generating synthetic data
- Uses agentic workflows, task planning, and multiple tools/models to iteratively review and improve data
- Outperformed GPT-4 by 25.6%, Llama3-70b by 48.1%, human expert-curated data by 73.6%
- Natural language or SQL prompts to create/edit/augment tabular data
- **gretel-synthetics** (https://github.com/gretelai/gretel-synthetics): Open-source library for structured and unstructured text with differentially private learning (676 stars, archived Feb 2026)
  - Supports: Timeseries DGAN, ACTGAN (via SDV), TensorFlow-based text generation
  - Differentially private learning for privacy preservation
- Available on Azure AI Foundry Model Catalog

### Tonic.ai (https://www.tonic.ai)

- **Tonic Fabricate:** AI-powered synthetic data from scratch using AI agent
  - Interprets natural language prompts, uploaded schemas, or sample data
  - Creates relationally-consistent, domain-specific datasets
  - Used for product development, software testing, AI model training
- **Tonic Structural:** Modern test data management
  - Generates high-fidelity test data mirroring production complexity
  - Accelerates release cycles, eliminates production bugs
- **Tonic Textual:** Unstructured data redaction and synthesis
  - Proprietary NER models for sensitive information detection
  - Redact or synthesize for compliance

### MOSTLY AI (https://mostly.ai)

- Enterprise-grade synthetic data platform with privacy-first approach
- SOC 2 and ISO 27001 certified
- **Open-source SDK** (https://github.com/mostly-ai/mostlyai): Python toolkit for high-fidelity, privacy-safe synthetic data
- Handles complex, highly correlated relational databases
- Use cases: AI/ML training data, realistic test data generation
- Proven track record for HIPAA and GDPR audits with Privacy Assurance documents

### Evidently AI (https://www.evidentlyai.com/blog/synthetic-data-generator-python)

- Open-source synthetic data generator for LLM systems (Evidently 0.7.11+)
- Python-native, integrates with existing ML pipelines

### Confident AI / DeepEval (https://www.confident-ai.com/blog/the-definitive-guide-to-synthetic-data-generation-using-llms)

- Open-source LLM evaluation framework with synthetic data generation
- Step-by-step pipeline: document chunking, context generation, query generation, query evolution, expected output generation
- Two methods: **Distillation** (teacher LLM generates data) and **Self-Improvement** (model improves its own outputs)
- **Query evolution techniques:** multi-context, reasoning, comparative, conditional
- Filtering: context filtering (relevance, quality) and input filtering (faithfulness, coherence)
- Styling: persona-based, scenario-based synthetic data
- Data survival-of-the-fittest: iterative quality improvement

---

## Open-Source Repos and Datasets

### Glaive-Code-Assistant (https://huggingface.co/datasets/glaiveai/glaive-code-assistant)

- v1: ~140K code problems and solutions
- v2: ~215K code problems and solutions
- v3: ~1M code problems and solutions
- Generated using Glaive's synthetic data generation platform
- Questions worded similarly to real user code questions

### OpenCodeInterpreter (https://github.com/OpenCodeInterpreter/OpenCodeInterpreter)

- Suite bridging gap between open-source and GPT-4 Code Interpreter
- Integrates execution and iterative refinement
- **Code-Feedback dataset:** 68K multi-turn interactions
- OpenCodeInterpreter-33B: 83.2% average on HumanEval/MBPP (vs GPT-4's 84.2%)
- Open-source models on Hugging Face

### Awesome-Code-LLM (https://github.com/codefuse-ai/Awesome-Code-LLM)

- TMLR-published curated list of language modeling research for code and software engineering
- Includes related datasets, comprehensive reference

### Open-R1 (https://github.com/huggingface/open-r1)

- Hugging Face reproduction of DeepSeek-R1 pipeline
- Scripts for SFT, RL, and synthetic data generation
- Modular design for experimentation and collaboration

---

## When Synthetic Data Works vs. Fails

### Where Synthetic Data Excels

- **Code generation:** Can quantitatively test synthetic code via execution, creating iterative feedback loops
- **Low-resource tasks:** Augments scarce labeled data cost-effectively
- **Instruction tuning:** Self-Instruct, Evol-Instruct, OSS-Instruct all demonstrate massive gains
- **Privacy-preserving:** Generates realistic data without exposing sensitive information
- **Bug-fix data:** SWE-Synth outperforms real-world datasets by 2.3% on SWE-Bench
- **Security training:** HexaCoder reduces vulnerable code by up to 85%
- **Distillation:** Produces smaller, specialized models matching larger ones

### Where Synthetic Data Fails or Has Limitations

- **Fidelity gaps:** Synthetic data can be "too clean," missing weird edge cases that make real-world data unpredictable
- **Model collapse:** Models trained iteratively on synthetic data degrade as errors compound -- early collapse affects minority data, late collapse makes distributions unrecognizable (Nature, 2024: https://www.nature.com/articles/s41586-024-07566-y)
- **Bias amplification:** LLM-generated data inherits and amplifies biases of the generator model
- **Hallucinations in code:** LLMs invent functions/libraries that don't exist, generated code fails to run
- **Distributional realism:** Synthetic code may use atypical naming conventions, data flows incongruent with program context
- **Tabular data:** LLMs capture univariate distributions but fail on joint/conditional distributions across subcategories
- **Computational cost:** High-quality synthetic data generation requires significant GPU resources
- **Evaluation difficulty:** No consensus on how to measure synthetic data quality comprehensively

### Mitigation Strategies

- **Mix synthetic with real data:** Optimal ratio ~30% synthetic for pre-training (Meta study)
- **Execution-based filtering:** Compile, lint, run tests -- only keep passing solutions
- **Accumulate real + synthetic:** Never discard original data when adding synthetic generations
- **External verification:** Human review or better model as verifier prevents collapse
- **Diversity-aware generation:** Use seed snippets from diverse sources (OSS-Instruct approach)
- **Multi-LLM synthesis:** Use multiple generators to reduce single-model bias (SecureCode approach)

### Blog Perspectives

**Challenges and Pitfalls of Using Synthetic Data for LLMs** (https://medium.com/foundation-models-deep-dive/challenges-and-pitfalls-of-using-synthetic-data-for-llms-7337fcda1316)
- Five key challenges: fidelity gaps, model collapse, bias amplification, computational costs, evaluation difficulties

**On Synthetic Data: How It's Improving & Shaping LLMs** (https://www.dbreunig.com/2024/12/18/synthetic-data-the-growing-ai-perception-divide.html)
- Synthetic data making LLMs better especially for smaller models
- Trainers rephrase input data, distill from webpages into structured Q&A or step-by-step reasoning
- Code and math benefit most; other tasks see less improvement
- Growing "perception gap" between code/math users and others

**Synthetic Data for LLM Training** (https://neptune.ai/blog/synthetic-data-for-llm-training)
- Comprehensive guide covering generation strategies, quality assessment, practical considerations

---

## Scaling Laws

### Demystifying Synthetic Data in LLM Pre-training (https://arxiv.org/abs/2510.01631)

- **Authors:** Kang et al. (FAIR at Meta, Virginia Tech, Cerebras Systems, October 2025)
- Massive empirical study: >1000 LLMs, >100K GPU hours
- Compared: natural web data, rephrased text, generated textbooks, and mixtures
- **Key findings:**
  - Pre-training on rephrased synthetic data alone is NOT faster than natural web text
  - **1/3 rephrased synthetic + 2/3 natural web = 5-10x speedup** at larger data budgets
  - Textbook-style synthetic data alone results in notably higher loss on downstream domains at small budgets
  - "Good" ratios depend on model size and data budget, **converging empirically to ~30% for rephrased synthetic**
  - Larger generator models do NOT necessarily yield better data than ~8B-param models
  - **Mixed evidence on model collapse:** rephrased synthetic shows no degradation at foreseeable scales; textbook-style pure-generated shows patterns predicted by model collapse
- **Limitations:** analyzed 3 specific synthetic types, reached 3B parameters and 200B tokens; need validation at frontier scale (>100B params, >10T tokens)

### Model Collapse Research (https://www.nature.com/articles/s41586-024-07566-y)

- Nature 2024 paper: AI models collapse when trained on recursively generated data
- **Mechanism:** errors compound with successive generations; synthetic datasets have less variation than original distributions
- **Early model collapse:** loses information from distribution tails (minority data), hard to notice since overall performance may appear to improve
- **Late model collapse:** data distribution converges so much it looks nothing like original
- **Prevention:** accumulate successive generations alongside original real data; inject external verification
- Model collapse is NOT inevitable if real data is preserved alongside synthetic (https://arxiv.org/abs/2404.01413)

---

## Synthesis and Key Takeaways

### The State of the Art (March 2026)

1. **Synthetic data is now standard practice** for code LLM training. Every major code model (StarCoder2, DeepSeek Coder, Code Llama, Seed-Coder, Phi series) uses some form of synthetic or heavily filtered data.

2. **Three dominant paradigms for code instruction data:**
   - **Self-Instruct / Code Alpaca:** LLM generates instructions from seed prompts. Simple, cheap, but limited diversity.
   - **Evol-Instruct / WizardCoder:** Iteratively evolves instructions for complexity and diversity. Strong results but still bounded by LLM's generation distribution.
   - **OSS-Instruct / Magicoder:** Uses real open-source code as seeds. Best diversity because grounded in real-world code variety. Orthogonal to Evol-Instruct.

3. **Code has a unique advantage** over other domains: generated outputs can be automatically verified through compilation, linting, test execution, and security scanning. This creates a closed-loop feedback system impossible in text-only domains.

4. **Quality > Quantity is confirmed** by multiple studies. Phi-1 (1.3B params, $6.5K) competing with models 10-100x larger. Seed-Coder using LLM-based quality filters across 4 dimensions. The Meta scaling study showing ~30% synthetic is optimal, not 100%.

5. **Synthetic bug generation is maturing rapidly.** SWE-Synth, BugPilot, and SWE-smith demonstrate that synthetic bugs can match or exceed real-world bug datasets for training SWE agents. BugPilot's naturalistic approach (introducing features that accidentally break code) represents the cutting edge.

6. **Security-focused synthetic data is production-ready.** HexaCoder (85% reduction in vulnerable code), Secure-Instruct (28.5% improvement over baselines), and SecureCode v2.0 (production-grade, multi-LLM synthesized) show mature approaches to training secure code generators.

7. **Distillation is the dominant form of data seeding.** DeepSeek R1's 800K reasoning samples, the Predibase Playbook's best practices, and tools like EasyDistill make teacher-to-student knowledge transfer systematic and reproducible.

8. **Quality-Diversity-Complexity (QDC) is the evaluation framework.** Quality for in-distribution, Diversity for out-of-distribution, Complexity beneficial for both. DCScore provides principled diversity measurement. The trade-off between Q and D must be actively managed.

9. **Model collapse is real but manageable.** Mixing ~30% synthetic with ~70% real data avoids degradation. Execution-based filtering, external verification, and accumulating (not replacing) real data are proven mitigations.

10. **Commercial tools (Gretel, Tonic, MOSTLY AI) focus on structured/tabular data** rather than code-specific generation. For code, the academic/open-source ecosystem (WizardCoder, Magicoder, Seed-Coder, SWE-smith) is far ahead.

### Relevance to Wazir's Review System

For a code review system like Wazir, synthetic data generation could be applied to:

- **Training review models:** Generate synthetic code diffs with known issues (bugs, security vulnerabilities, style violations) and corresponding review comments
- **Testing review pipelines:** Use SWE-Synth or BugPilot-style approaches to create realistic bug-fix datasets to benchmark review quality
- **Security review training:** Use HexaCoder/Secure-Instruct patterns to generate vulnerable+fixed code pairs for training security-aware review components
- **Evaluation dataset construction:** Use OSS-Instruct-style seeding from real open-source PRs to generate diverse test cases for review accuracy measurement
- **Distillation for cost:** Use a powerful model (Claude, GPT-4) to generate high-quality review examples, then fine-tune a smaller model for production use

---

## All Sources

### Academic Papers
- [Nadas et al. 2025 - Synthetic Data Generation Using LLMs: Advances in Text and Code](https://arxiv.org/abs/2503.14023)
- [Chen et al. 2025 - Mastering the Craft of Data Synthesis for CodeLLMs](https://arxiv.org/abs/2411.00005)
- [Havrilla et al. 2024 - Surveying QDC Effects in Synthetic Data from LLMs](https://arxiv.org/abs/2412.02980)
- [Luo et al. 2024 - WizardCoder: Evol-Instruct for Code LLMs (ICLR 2024)](https://arxiv.org/abs/2306.08568)
- [Wei et al. 2024 - Magicoder: OSS-Instruct (ICML 2024)](https://arxiv.org/abs/2312.02120)
- [Gunasekar et al. 2023 - Textbooks Are All You Need (Phi-1)](https://arxiv.org/abs/2306.11644)
- [Shao et al. 2025 - Case2Code: Scalable Synthetic Data for Code Generation (COLING 2025)](https://arxiv.org/abs/2407.12504)
- [Kang et al. 2025 - Demystifying Synthetic Data in LLM Pre-training: Scaling Laws](https://arxiv.org/abs/2510.01631)
- [Hajipour et al. 2024 - HexaCoder: Secure Code via Oracle-Guided Synthetic Data](https://arxiv.org/abs/2409.06446)
- [Li et al. 2025 - Secure-Instruct: Automated Pipeline for Secure Code](https://arxiv.org/abs/2510.07189)
- [SecureCode v2.0 - Production-Grade Security Dataset](https://arxiv.org/abs/2512.18542)
- [Pham et al. 2025 - SWE-Synth: Synthesizing Verifiable Bug-Fix Data](https://arxiv.org/abs/2504.14757)
- [BugPilot 2025 - Complex Bug Generation for SWE Skills](https://arxiv.org/abs/2510.19898)
- [SWE-smith 2025 - Scaling Data for SWE Agents (NeurIPS 2025 Spotlight)](https://arxiv.org/abs/2504.21798)
- [Zhu et al. 2025 - DCScore: Measuring Diversity in Synthetic Datasets (ICML)](https://arxiv.org/abs/2502.08512)
- [Shumailov et al. 2024 - Model Collapse in AI (Nature)](https://www.nature.com/articles/s41586-024-07566-y)
- [Guo et al. 2024 - Model Collapse Is Not Inevitable](https://arxiv.org/abs/2404.01413)
- [Bundt 2022 - Evaluating Synthetic Bugs](https://arxiv.org/abs/2208.11088)
- [Yu et al. 2022 - Generating Realistic Vulnerabilities via Neural Code Editing (FSE)](https://chapering.github.io/pubs/fse22yu.pdf)
- [StarCoder2 and The Stack v2](https://arxiv.org/abs/2402.19173)
- [DeepSeek Coder](https://arxiv.org/abs/2401.14196)
- [Seed-Coder: Let the Code Model Curate Data for Itself](https://arxiv.org/abs/2506.03524)
- [OpenCodeInterpreter](https://arxiv.org/abs/2402.14658)

### GitHub Repositories
- [LLM-Synthetic-Data Reading List](https://github.com/pengr/LLM-Synthetic-Data) -- 464 stars, updated July 2025
- [WizardLM / WizardCoder](https://github.com/nlpxucan/WizardLM)
- [Magicoder](https://github.com/ise-uiuc/magicoder)
- [Code Alpaca](https://github.com/sahil280114/codealpaca)
- [DeepSeek-Coder](https://github.com/deepseek-ai/DeepSeek-Coder)
- [DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1)
- [Seed-Coder](https://github.com/ByteDance-Seed/Seed-Coder)
- [StarCoder2](https://github.com/bigcode-project/starcoder2)
- [SWE-smith](https://github.com/SWE-bench/SWE-smith)
- [SWE-Synth](https://github.com/FSoft-AI4Code/SWE-Synth)
- [OpenCodeInterpreter](https://github.com/OpenCodeInterpreter/OpenCodeInterpreter)
- [Open-R1 (HuggingFace)](https://github.com/huggingface/open-r1)
- [Gretel Synthetics](https://github.com/gretelai/gretel-synthetics) -- 676 stars (archived Feb 2026)
- [MOSTLY AI SDK](https://github.com/mostly-ai/mostlyai)
- [EasyDistill](https://github.com/modelscope/easydistill)
- [LLM Distillation Playbook (Predibase)](https://github.com/predibase/llm_distillation_playbook) -- 614 stars
- [DCScore](https://github.com/BlueWhaleLab/DCScore)
- [Awesome-Code-LLM](https://github.com/codefuse-ai/Awesome-Code-LLM)
- [Stanford Alpaca](https://github.com/tatsu-lab/stanford_alpaca)

### Datasets (Hugging Face)
- [Glaive-Code-Assistant v1 (~140K)](https://huggingface.co/datasets/glaiveai/glaive-code-assistant)
- [Glaive-Code-Assistant v2 (~215K)](https://huggingface.co/datasets/glaiveai/glaive-code-assistant-v2)
- [Glaive-Code-Assistant v3 (~1M)](https://huggingface.co/datasets/glaiveai/glaive-code-assistant-v3)

### Blog Posts and Guides
- [Breunig - On Synthetic Data: How It's Improving & Shaping LLMs](https://www.dbreunig.com/2024/12/18/synthetic-data-the-growing-ai-perception-divide.html)
- [Challenges and Pitfalls of Using Synthetic Data for LLMs (Medium)](https://medium.com/foundation-models-deep-dive/challenges-and-pitfalls-of-using-synthetic-data-for-llms-7337fcda1316)
- [Confident AI - Definitive Guide to Synthetic Data Generation Using LLMs](https://www.confident-ai.com/blog/the-definitive-guide-to-synthetic-data-generation-using-llms)
- [Neptune AI - Synthetic Data for LLM Training](https://neptune.ai/blog/synthetic-data-for-llm-training)
- [Snorkel AI - LLM Distillation Demystified](https://snorkel.ai/blog/llm-distillation-demystified-a-complete-guide/)
- [W&B - Knowledge Distillation: Teaching LLMs with Synthetic Data](https://wandb.ai/byyoung3/ML_NEWS3/reports/Knowledge-distillation-Teaching-LLM-s-with-synthetic-data--Vmlldzo5MTMyMzA2)
- [Red Hat - Synthetic Data: Secret Ingredient for Better Language Models](https://www.redhat.com/en/blog/synthetic-data-secret-ingredient-better-language-models)
- [Scale AI - Synthetic Data Generation Strategies for Fine-Tuning LLMs](https://scale.com/blog/synthetic-data-fine-tuning-llms)
- [Gretel AI Blog - How to Create High-Quality Synthetic Data for Fine-Tuning LLMs](https://www.gretel.ai/blog/how-to-create-high-quality-synthetic-data-for-fine-tuning-llms)
- [Microsoft - Distillation: Turning Smaller Models into High-Performance Solutions](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/distillation-turning-smaller-models-into-high-performance-cost-effective-solutio/4355029)

### Commercial Platforms
- [Gretel AI](https://gretel.ai)
- [Tonic.ai](https://www.tonic.ai)
- [MOSTLY AI](https://mostly.ai)
- [Evidently AI](https://www.evidentlyai.com)
