# Code Summarization Research

Date: 2026-03-25
Topic: Automatic code summarization techniques, tools, and research

---

## 1. Source Code Summarization in the Era of Large Language Models (https://arxiv.org/abs/2407.07959)

**Authors:** Weisong Sun, Yun Miao, Yuekang Li, Hongyu Zhang, Chunrong Fang, Yi Liu, Gelei Deng, Yang Liu, Zhenyu Chen (2024)

**Type:** Comprehensive empirical study of LLM-based code summarization

Key findings:
- Systematic study covering the full workflow of LLM-based code summarization: evaluation methods, prompting techniques, model settings, and programming language performance
- GPT-4 evaluation method results are most closely aligned with human evaluation for assessing LLM-generated code summaries
- Five prompting techniques tested: zero-shot, few-shot, chain-of-thought, critique, and expert. **Contrary to expectations, advanced prompting techniques may not outperform simple zero-shot prompting** for code summarization
- Impact of top_p and temperature parameters on summary quality varies by base LLM and programming language, but their impacts are similar to each other
- LLMs perform suboptimally when summarizing code written in logic programming languages compared to other language types
- Summaries from general-purpose LLMs like GPT-3.5 can excel over those from specialized code LLMs like CodeLlama-Instruct in quality
- CodeLlama-Instruct 7B can still outperform advanced models in certain code summarization tasks

---

## 2. Hierarchical Repository-Level Code Summarization for Business Applications Using Local LLMs (https://arxiv.org/abs/2501.07857)

**Authors:** Nilesh Dhulshette, Sapan Shah, Vinay Kulkarni, TCS Research (2025, presented at ICSE LLM4Code 2025)

**Type:** Hierarchical multi-level summarization approach

Key findings:
- Proposes a **two-step hierarchical approach** for repository-level code summarization tailored to business applications
- Step 1: Smaller code units (functions, variables) are identified using **syntax analysis** and summarized with local LLMs
- Step 2: Summaries are **aggregated bottom-up** to generate higher-level file and package summaries
- Custom prompts designed to capture the intended purpose of code artifacts based on the **domain and problem context** of the business application
- Existing methods primarily focus on functions and **struggle with larger code artifacts** like files and packages
- Current summarization models tend to **emphasize low-level implementation details**, often overlooking domain and business context
- Evaluated on a business support system (BSS) for telecommunications domain
- Syntax analysis-based hierarchical summarization **improves coverage**, while business-context grounding **enhances relevance**
- Developers spend over 50% of their time comprehending existing code, making automatic summarization critical

---

## 3. Code Summarization Beyond Function Level (https://arxiv.org/abs/2502.16704)

**Authors:** Vladimir Makharev, Vladimir Ivanov, Innopolis University / AIRI (2025)

**Type:** Multi-granularity benchmark and evaluation study

Key findings:
- Investigates effectiveness of code summarization models **beyond the function level**, exploring class and repository contexts
- Created revised benchmarks for evaluating models at class and repository levels (existing benchmarks fail to assess performance beyond function level)
- Fine-tuned **CodeT5+ base model excelled** in code summarization at function level
- Incorporating **few-shot learning and retrieved code chunks from RAG significantly enhanced** LLM performance
- **Deepseek Coder 1.3B and Starcoder2 15B** showed substantial improvements in BLEURT, METEOR, and BLEU4 at both class and repository levels
- Repository-level summarization shows promising potential but requires **significant computational resources**
- Gains from including **structured context** (class-level and repo-level information) when summarizing functions
- Introducing few-shot examples alongside context led to noticeable improvements
- Published all code, datasets, and results: https://github.com/kilimanj4r0/code-summarization-beyond-function-level

---

## 4. Code-Craft: Hierarchical Graph-Based Code Summarization for Enhanced Context Retrieval (https://arxiv.org/abs/2504.08975)

**Authors:** David Sounthiraraj, Jared Hancock, Yassin Kortam, Ashok Javvaji, Prabhat Singh, Shaila Shankar, Cisco Systems (2025)

**Type:** Graph-based hierarchical summarization system for code retrieval

Key findings:
- Presents **Hierarchical Code Graph Summarization (HCGS)**: constructs a multi-layered representation of a codebase by generating structured summaries **bottom-up from a code graph**
- Code Graph Generator creates a directed graph where **nodes = code elements** (files, classes, functions, methods) and **edges = relationships** (calls, inheritance, imports)
- Uses **Language Server Protocol (LSP)** for language-agnostic code analysis
- Employs a **parallel level-based algorithm** for efficient summary generation
- Higher-level summaries are informed by summaries of their constituent components, creating a rich multi-layered understanding
- Evaluated on **5 diverse codebases totaling 7,531 functions**
- Achieves up to **82% relative improvement** in top-1 retrieval precision for large codebases (libsignal: 27.15 percentage points improvement)
- Perfect Pass@3 scores for smaller repositories
- Hierarchical approach **consistently outperforms traditional code-only retrieval** across all metrics
- Particularly substantial gains in **larger, more complex codebases** where understanding function relationships is crucial

---

## 5. Precision in Practice: Knowledge Guided Code Summarizing Grounded in Industrial Expectations (https://arxiv.org/abs/2602.03400)

**Authors:** Jintai Li, Songqiang Chen, Shuo Jin, Xiaoyuan Xie, Wuhan University / HKUST (2026)

**Type:** Industrial study on developer expectations for code summaries

Key findings:
- Collaboration with documentation experts from the industrial **HarmonyOS project**
- Questionnaire study showing **over 57.4% of code summaries** generated by state-of-the-art methods were **rejected by developers**
- Developers expect beyond semantic similarity: **appropriate domain terminology**, **explicit function categorization**, and **avoidance of redundant implementation details**
- Proposes **ExpSum**: expectation-aware code summarization with four components:
  1. **Function metadata abstraction** -- extracts core function metadata
  2. **Informative metadata filtering** -- checks and filters relevant metadata
  3. **Context-aware cascaded knowledge retrieval** -- retrieves appropriate domain terms
  4. **Constraint-driven prompting** -- guides LLMs to infer function categories and produce structured summaries
- ExpSum achieves improvements of **26.71% in BLEU-4** and **20.10% in ROUGE-L** on HarmonyOS
- LLM-based evaluation confirms ExpSum-generated summaries **better align with developer expectations** across projects
- Critical insight: **what developers want in summaries is fundamentally different from what models optimize for** (semantic similarity to references)

---

## 6. AST-Transformer: Encoding Abstract Syntax Trees Efficiently for Code Summarization (https://arxiv.org/abs/2112.01184)

**Authors:** Ze Tang, Chuanyi Li, Jidong Ge, Xiaoyu Shen, Zheling Zhu, Bin Luo (ASE 2021)

**Type:** Neural architecture for AST-based code summarization

Key findings:
- ASTs are usually **much longer than source code** -- linearized ASTs contain additional structural information making them significantly longer
- Computational overhead is severe for Transformer models where self-attention grows **quadratically with sequence length**
- Three linearization methods tested: **Pre-order Traversal (POT)**, **Structure-based Traversal (SBT)**, and **Path Decomposition (PD)**
- AST-Transformer efficiently encodes tree-structured ASTs
- **Outperforms state-of-the-art** by a substantial margin while reducing **90-95% of computational complexity** in the encoding process
- Key innovation: rather than feeding the entire linearized AST, uses efficient encoding strategies that preserve structural information

---

## 7. CAST: Enhancing Code Summarization with Hierarchical Splitting and Reconstruction of Abstract Syntax Trees (https://aclanthology.org/2021.emnlp-main.332/)

**Authors:** Ensheng Shi, Yanlin Wang, Lun Du, Hongyu Zhang, Shi Han, Dongmei Zhang, Hongbin Sun (EMNLP 2021)

**Type:** Hierarchical AST processing for code summarization

Key findings:
- Existing approaches fail to fully capture the **rich information in ASTs** because of the large size/depth of ASTs
- CAST **hierarchically splits a large AST into a set of subtrees**
- Uses a **recursive neural network** to encode the subtrees
- **Aggregates embeddings** of subtrees by reconstructing the split ASTs to get the representation of the complete AST
- Final AST representation combined with source code embedding from a vanilla code token encoder for summarization
- Demonstrated power through **extensive experiments including ablation study and human evaluation**
- Code and data available: https://github.com/DeepSoftwareAnalytics/CAST

---

## 8. A Human Study of Comprehension and Code Summarization (https://dl.acm.org/doi/10.1145/3387904.3389258)

**Authors:** Stapleton, Gambhir, LeClair, et al. (ICPC 2020)

**Type:** Human study on code comprehension with summaries

Key findings:
- 45 participants (university students and professional developers) reviewed Java methods and summaries
- Participants answered program comprehension questions and completed coding tasks given summaries as specifications
- **Participants performed significantly better (p = 0.029) using human-written summaries** vs machine-generated summaries
- However, **participants perceived no difference** in quality between human- and machine-generated summaries (perception gap)
- **No correlation found between BLEU/ROUGE scores** and participants' actual task performance
- This is a critical finding: **automated metrics do not predict real-world usefulness** of code summaries
- 18 of 27 participants mentioned the importance of **inputs/parameters** in a good code summary
- Participants focus more intently on **parameters, variable declarations, and method calls** when writing their own summaries
- Implication: evaluation of code summarization should move beyond n-gram metrics toward task-based evaluation

---

## 9. Aider's Repository Map with Tree-Sitter (https://aider.chat/2023/10/22/repomap.html)

**Authors:** Paul Gauthier, Aider project (2023, continuously updated)

**Type:** Practical tool for code summarization via repository mapping

Key findings:
- Aider sends LLMs a **concise map of the entire git repository** including the most important classes and functions with types and call signatures
- Uses **tree-sitter** to parse source files into ASTs and extract symbol definitions
- Process: (1) parse source code into AST, (2) extract definitions and references, (3) rank files by relevance using **PageRank graph analysis**, (4) generate token-budgeted summary
- The map does **not contain every class, method, and function** -- only the most important identifiers, the ones most often referenced by other code
- Uses **binary search algorithm** to optimize context within token budget
- Supports **130+ languages** through tree-sitter parsers
- Key insight: effective code summarization for LLM context requires **ranking by importance** (via reference graph), not just listing everything
- Previously used ctags; tree-sitter provides richer structural information
- Practical demonstration that **graph-based importance ranking** dramatically improves the usefulness of code summaries for LLM-assisted coding

---

## 10. An Extractive-and-Abstractive Framework for Source Code Summarization (https://dl.acm.org/doi/10.1145/3632742)

**Authors:** Published in ACM Transactions on Software Engineering and Methodology (TOSEM), 2024

**Type:** Hybrid extractive-abstractive approach

Key findings:
- Combines **extractive and abstractive** code summarization in a unified framework
- **Extractive module**: predicts important statements containing key factual details from the code snippet
- **Abstractive module**: takes the code snippet and important statements in parallel, generates human-written-like natural language summary
- Addresses limitations of pure extractive (poor naturalness, misses identifier naming) and pure abstractive (misses important factual details)
- Extractive methods extract a subset of important statements and keywords using retrieval techniques, but the subset may miss identifier/entity naming
- Abstractive methods can generate human-written-like summaries but often miss important factual details
- **Hybrid approach** provides the accuracy of extractive with the natural fluency of abstractive
- Extractive models require less computational power (cheaper, faster to deploy)
- Extractive summaries contain fewer factual errors since they copy from source

---

## 11. Large Language Models for Code Summarization (https://arxiv.org/abs/2405.19032)

**Authors:** Balazs Szalontai, Gergo Szalay, Tamas Marton, Anna Sike, Balazs Pinter, Tibor Gregorics, Eotvos Lorand University (2024)

**Type:** Technical report benchmarking open-source LLMs on code summarization

Key findings:
- Reviews how open-source LLMs perform on code explanation/summarization and generation
- Models tested include **CodeLlama, WizardCoder**, and other open-source code LLMs
- LLMs are often ranked simply on code generation benchmarks (HumanEval), but code summarization performance can differ
- Both **closed models (GPT-4, Gemini)** and **open models (CodeLlama, WizardCoder)** demonstrate impressive code summarization capabilities
- Encoder-decoder architectures (both recurrent and Transformer-based) were the foundation for code summarization before LLMs
- Code summarization is useful for understanding legacy code and creating documentation
- The field has progressed from seq2seq models through specialized pre-trained models (CodeBERT, CodeT5) to general-purpose LLMs

---

## 12. CodeT5 and CodeT5+: Pre-Trained Encoder-Decoder Models for Code (https://github.com/salesforce/CodeT5)

**Authors:** Wang et al., Salesforce Research (2021-2023)

**Type:** Pre-trained model architecture for code understanding and generation

Key findings:
- **CodeT5**: identifier-aware unified pre-trained encoder-decoder model built on T5 architecture
- Employs three identifier-aware pre-training tasks: **masked span prediction**, **masked identifier prediction**, and **identifier tagging**
- Bimodal dual generation pre-training task learns better **NL-PL alignment** between code and comments
- CodeT5 significantly outperforms PLBART on all generation tasks including code summarization
- **CodeT5+**: improved family with flexible architecture that can operate as encoder-only, decoder-only, or encoder-decoder
- CodeT5+ evaluated on over **20 code-related benchmarks** with state-of-the-art results
- 16B CodeT5+ model outperforms OpenAI's code-cushman-001 on HumanEval
- **CodeBERT** (predecessor): first large NL-PL pretrained model, but requires additional decoder for summarization -- decoder cannot benefit from pre-training
- CodeT5 addresses this by using a unified encoder-decoder architecture where both sides benefit from pre-training
- Available as open-source with multiple size variants (small, base, large)

---

## 13. Reassessing Automatic Evaluation Metrics for Code Summarization Tasks (https://dl.acm.org/doi/10.1145/3468264.3468588)

**Authors:** Published at ESEC/FSE 2021

**Type:** Critical evaluation of metrics used in code summarization research

Key findings:
- Automatic evaluation metrics (BLEU, METEOR, ROUGE) adopted from machine translation as proxies for human evaluation in code summarization
- **BLEU** measures precision -- how closely machine-generated text matches reference translations using n-gram overlap
- **ROUGE** measures recall -- how much information from reference passages is contained in generated text
- **BERTScore** leverages contextual embeddings from BERT to capture semantic similarities missed by n-gram metrics
- The extent to which automatic metrics agree with human evaluation **has not been adequately evaluated** on code summarization tasks
- Despite this, **marginal improvements in metric scores are often used to discriminate** between competing models
- Human evaluation is more reliable but not scalable and cost-prohibitive
- **Semantic similarity metrics** may be more appropriate than lexical overlap metrics for evaluating code summaries
- Critical implication: the field may be optimizing for metrics that do not reflect actual summary usefulness

---

## 14. GitSummarize: AI-Powered Repository Documentation (https://gitsummarize.com/)

**Type:** Commercial/open-source tool for repository-level summarization

Key findings:
- Converts any GitHub repository into an **AI-powered documentation hub** instantly
- Activation: replace 'hub' with 'summarize' in any GitHub URL
- Features: **architecture visualization** (diagrams/flowcharts), **code logic explanation**, **per-directory summaries**
- Analyzes codebase, commit history, and issue tracking to extract key insights
- Generates **structured, searchable documentation** that evolves alongside code
- Source: https://github.com/antarixxx/gitsummarize
- Represents the practical application of repository-level code summarization for developer onboarding

---

## 15. AI Code Summary: Directory-to-Markdown Summarization (https://github.com/DEV3L/ai-code-summary)

**Type:** Open-source tool for LLM-powered code summarization

Key findings:
- Automates collection of code files from a directory into a **markdown file**
- Uses **ChatGPT to summarize each file**, creating concise organized document
- Skips files in .gitignore
- Designed for use with **OpenAI Assistants or RAG models**
- Practical tool demonstrating the file-level summarization-then-aggregation pattern
- Simple but effective approach: parse directory, summarize each file individually, aggregate into single document

---

# Synthesis

## The Landscape of Code Summarization

Code summarization research has evolved through three distinct eras: (1) information retrieval and template-based methods, (2) neural sequence-to-sequence models with AST awareness, and (3) LLM-based approaches. Each era has built upon the previous, but fundamental challenges remain.

## Granularity is the Central Challenge

The field is well-established at the **function level** but struggles significantly at higher granularities:

| Level | Maturity | Key Challenge |
|-------|----------|---------------|
| Function | Mature | Evaluation metrics do not correlate with human comprehension |
| Class | Emerging | Requires understanding inter-method relationships |
| File | Active research | Must capture both implementation and architectural intent |
| Package/Module | Early | Needs domain context and business understanding |
| Repository | Nascent | Computational cost, context window limits, structural complexity |

The most promising approaches use **hierarchical bottom-up summarization**: summarize functions first, aggregate into file summaries, then into package/module summaries, and finally into repository-level descriptions (Sources 2, 4).

## What Makes a Good Code Summary

Research consistently shows a gap between what models optimize for and what developers need:

1. **Parameters and inputs/outputs** -- developers consistently prioritize these (Source 8)
2. **Function category/type** -- what kind of operation is this (getter, validator, transformer, handler) (Source 5)
3. **Domain terminology** -- use the project's vocabulary, not generic descriptions (Source 5)
4. **Architectural role** -- how this code fits into the larger system (Sources 2, 3)
5. **Avoidance of implementation details** -- developers want "what" and "why", not "how" (Source 5)

Over 57% of state-of-the-art summaries are rejected by industrial developers (Source 5), and traditional metrics like BLEU/ROUGE do not correlate with actual comprehension outcomes (Source 8, 13).

## Structural Approaches Still Matter

Despite LLM dominance, structural code analysis remains critical:

- **AST-based approaches** (Sources 6, 7) capture syntactic structure that pure text models miss, but ASTs are much longer than source code, creating computational challenges
- **Graph-based approaches** (Source 4) model relationships between code elements (calls, inheritance, imports) to create richer representations
- **Tree-sitter + PageRank** (Source 9) demonstrates that ranking code elements by reference frequency produces dramatically better context for LLMs
- **Language Server Protocol** (Source 4) enables language-agnostic structural analysis

## LLM-Specific Findings

- Simple **zero-shot prompting often matches or beats** advanced prompting techniques for code summarization (Source 1)
- **RAG and few-shot learning** significantly improve performance when combined with class/repo context (Source 3)
- General-purpose LLMs (GPT-3.5/4) can outperform specialized code LLMs on summarization (Source 1)
- **Pre-trained code models** (CodeT5, CodeT5+) remain competitive as fine-tuned specialists, especially at function level (Sources 3, 12)
- Business-context grounding in prompts improves relevance of generated summaries (Source 2)

## Hybrid Extractive-Abstractive Approach

The most robust summaries combine:
- **Extractive**: identifying the most important statements and identifiers (factual accuracy)
- **Abstractive**: generating natural language descriptions (readability and fluency)

Pure extractive misses naturalness; pure abstractive misses factual details. The hybrid framework (Source 10) addresses both.

## Practical Implications for Tool Building

For building a code summarization system:

1. **Use tree-sitter or LSP** for language-agnostic structural parsing
2. **Build a code graph** (definitions, references, call relationships) and rank by importance
3. **Summarize bottom-up**: functions first, then files, then modules, then repository
4. **Include context**: class-level and file-level context improves function summaries
5. **Ground in domain**: use project-specific terminology and function categorization
6. **Budget tokens carefully**: use importance ranking to fit within context windows
7. **Evaluate with humans**: automated metrics are unreliable proxies for usefulness
8. **Zero-shot LLM prompting is surprisingly effective** -- don't over-engineer prompts
9. **Focus summaries on what/why, not how**: parameters, purpose, architectural role
10. **Hybrid extractive-abstractive** produces the most complete summaries
