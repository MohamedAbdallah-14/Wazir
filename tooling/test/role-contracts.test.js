import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const ROLE_FILES = [
  'roles/planner.md',
  'roles/executor.md',
  'roles/verifier.md',
  'roles/reviewer.md',
  'roles/learner.md',
  'roles/designer.md',
];

const ALL_ROLE_FILES = [
  'roles/clarifier.md',
  'roles/researcher.md',
  'roles/specifier.md',
  'roles/content-author.md',
  'roles/designer.md',
  'roles/planner.md',
  'roles/executor.md',
  'roles/verifier.md',
  'roles/reviewer.md',
  'roles/learner.md',
];

describe('role contract git-flow sections', () => {
  for (const roleFile of ROLE_FILES) {
    test(`${roleFile} contains a Git-Flow Responsibilities section`, () => {
      const content = fs.readFileSync(path.join(ROOT, roleFile), 'utf8');
      assert.match(content, /^## Git-Flow Responsibilities$/m,
        `${roleFile} is missing "## Git-Flow Responsibilities" section`);
    });
  }
});

describe('role contract git-flow section placement', () => {
  for (const roleFile of ROLE_FILES) {
    test(`${roleFile} has Git-Flow Responsibilities after Required Outputs`, () => {
      const content = fs.readFileSync(path.join(ROOT, roleFile), 'utf8');
      const requiredOutputsIndex = content.indexOf('## Required Outputs');
      const gitFlowIndex = content.indexOf('## Git-Flow Responsibilities');

      assert.ok(requiredOutputsIndex !== -1, `${roleFile} missing Required Outputs section`);
      assert.ok(gitFlowIndex !== -1, `${roleFile} missing Git-Flow Responsibilities section`);
      assert.ok(gitFlowIndex > requiredOutputsIndex,
        `${roleFile}: Git-Flow Responsibilities must appear after Required Outputs`);
    });
  }
});

describe('role contract git-flow content', () => {
  test('planner.md includes target branch and commit_message responsibilities', () => {
    const content = fs.readFileSync(path.join(ROOT, 'roles/planner.md'), 'utf8');
    assert.match(content, /specify target branch/);
    assert.match(content, /commit_message.*field/);
  });

  test('executor.md includes branch creation, conventional commits, changelog, and no-merge responsibilities', () => {
    const content = fs.readFileSync(path.join(ROOT, 'roles/executor.md'), 'utf8');
    assert.match(content, /create feature\/codex branch/);
    assert.match(content, /conventional commit format/);
    assert.match(content, /CHANGELOG\.md/);
    assert.match(content, /do NOT merge/);
  });

  test('verifier.md includes validate branches, commits, changelog responsibilities', () => {
    const content = fs.readFileSync(path.join(ROOT, 'roles/verifier.md'), 'utf8');
    assert.match(content, /wazir validate branches/);
    assert.match(content, /wazir validate commits/);
    assert.match(content, /wazir validate changelog/);
    assert.match(content, /--require-entries/);
  });

  test('reviewer.md includes changelog quality and commit content quality responsibilities', () => {
    const content = fs.readFileSync(path.join(ROOT, 'roles/reviewer.md'), 'utf8');
    assert.match(content, /changelog entries/);
    assert.match(content, /commit messages accurately describe/);
  });

  test('learner.md includes violation recording and pattern tracking responsibilities', () => {
    const content = fs.readFileSync(path.join(ROOT, 'roles/learner.md'), 'utf8');
    assert.match(content, /git-flow violations/);
    assert.match(content, /track patterns of violations/);
  });

  test('designer.md includes conventional commit format and state directory responsibilities', () => {
    const content = fs.readFileSync(path.join(ROOT, 'roles/designer.md'), 'utf8');
    assert.match(content, /feat\(design\)/);
    assert.match(content, /run-local state directory/);
  });
});

describe('designer role contract', () => {
  test('designer role file exists and has required sections', () => {
    const rolePath = path.join(ROOT, 'roles', 'designer.md');
    assert.ok(fs.existsSync(rolePath), 'roles/designer.md missing');
    const content = fs.readFileSync(rolePath, 'utf8');
    assert.ok(content.includes('## Purpose'), 'missing Purpose section');
    assert.ok(content.includes('## Inputs'), 'missing Inputs section');
    assert.ok(content.includes('## Required Outputs'), 'missing Required Outputs section');
    assert.ok(content.includes('## Failure Conditions'), 'missing Failure Conditions section');
  });
});

describe('role context retrieval sections', () => {
  for (const roleFile of ALL_ROLE_FILES) {
    test(`${roleFile} contains a Context retrieval section`, () => {
      const content = fs.readFileSync(path.join(ROOT, roleFile), 'utf8');
      assert.match(content, /^## Context retrieval$/m,
        `${roleFile} is missing "## Context retrieval" section`);
    });
  }

  for (const roleFile of ALL_ROLE_FILES) {
    test(`${roleFile} has Context retrieval after Allowed Tools`, () => {
      const content = fs.readFileSync(path.join(ROOT, roleFile), 'utf8');
      const allowedToolsIndex = content.indexOf('## Allowed Tools');
      const contextRetrievalIndex = content.indexOf('## Context retrieval');

      assert.ok(allowedToolsIndex !== -1, `${roleFile} missing Allowed Tools section`);
      assert.ok(contextRetrievalIndex !== -1, `${roleFile} missing Context retrieval section`);
      assert.ok(contextRetrievalIndex > allowedToolsIndex,
        `${roleFile}: Context retrieval must appear after Allowed Tools`);
    });
  }

  for (const roleFile of ALL_ROLE_FILES) {
    test(`${roleFile} mentions CLI recall/index in Allowed Tools`, () => {
      const content = fs.readFileSync(path.join(ROOT, roleFile), 'utf8');
      const allowedToolsIdx = content.indexOf('## Allowed Tools');
      const nextSectionIdx = content.indexOf('\n## ', allowedToolsIdx + 1);
      const allowedToolsSection = content.slice(allowedToolsIdx, nextSectionIdx);
      assert.match(allowedToolsSection, /Wazir CLI recall and index commands/,
        `${roleFile} Allowed Tools section should mention Wazir CLI recall and index commands`);
    });
  }
});

const ALL_WORKFLOW_FILES = [
  'workflows/author.md',
  'workflows/clarify.md',
  'workflows/design-review.md',
  'workflows/design.md',
  'workflows/discover.md',
  'workflows/execute.md',
  'workflows/learn.md',
  'workflows/plan-review.md',
  'workflows/plan.md',
  'workflows/prepare-next.md',
  'workflows/review.md',
  'workflows/run-audit.md',
  'workflows/spec-challenge.md',
  'workflows/specify.md',
  'workflows/verify.md',
];

const GATE_WORKFLOW_FILES = [
  'workflows/spec-challenge.md',
  'workflows/design-review.md',
  'workflows/plan-review.md',
];

describe('workflow capture event sections', () => {
  for (const wfFile of ALL_WORKFLOW_FILES) {
    test(`${wfFile} contains a Phase entry section`, () => {
      const content = fs.readFileSync(path.join(ROOT, wfFile), 'utf8');
      assert.match(content, /^## Phase entry$/m,
        `${wfFile} is missing "## Phase entry" section`);
    });

    test(`${wfFile} contains a Phase exit section`, () => {
      const content = fs.readFileSync(path.join(ROOT, wfFile), 'utf8');
      assert.match(content, /^## Phase exit$/m,
        `${wfFile} is missing "## Phase exit" section`);
    });

    test(`${wfFile} has Phase entry after Purpose`, () => {
      const content = fs.readFileSync(path.join(ROOT, wfFile), 'utf8');
      const purposeIdx = content.indexOf('## Purpose');
      const phaseEntryIdx = content.indexOf('## Phase entry');
      assert.ok(purposeIdx !== -1, `${wfFile} missing Purpose`);
      assert.ok(phaseEntryIdx !== -1, `${wfFile} missing Phase entry`);
      assert.ok(phaseEntryIdx > purposeIdx,
        `${wfFile}: Phase entry must appear after Purpose`);
    });

    test(`${wfFile} has Phase exit before Failure Conditions`, () => {
      const content = fs.readFileSync(path.join(ROOT, wfFile), 'utf8');
      const phaseExitIdx = content.indexOf('## Phase exit');
      const failureIdx = content.indexOf('## Failure Conditions');
      assert.ok(phaseExitIdx !== -1, `${wfFile} missing Phase exit`);
      assert.ok(failureIdx !== -1, `${wfFile} missing Failure Conditions`);
      assert.ok(phaseExitIdx < failureIdx,
        `${wfFile}: Phase exit must appear before Failure Conditions`);
    });
  }

  for (const wfFile of GATE_WORKFLOW_FILES) {
    test(`${wfFile} contains a Gate decision section`, () => {
      const content = fs.readFileSync(path.join(ROOT, wfFile), 'utf8');
      assert.match(content, /^## Gate decision$/m,
        `${wfFile} is missing "## Gate decision" section`);
    });
  }
});

describe('verifier post-execution validation', () => {
  test('verifier.md contains a Post-execution validation section', () => {
    const content = fs.readFileSync(path.join(ROOT, 'roles/verifier.md'), 'utf8');
    assert.match(content, /^## Post-execution validation$/m,
      'verifier.md is missing "## Post-execution validation" section');
  });

  test('verifier.md has Post-execution validation between Context retrieval and Required Outputs', () => {
    const content = fs.readFileSync(path.join(ROOT, 'roles/verifier.md'), 'utf8');
    const contextRetrievalIdx = content.indexOf('## Context retrieval');
    const postExecIdx = content.indexOf('## Post-execution validation');
    const requiredOutputsIdx = content.indexOf('## Required Outputs');

    assert.ok(contextRetrievalIdx !== -1, 'missing Context retrieval');
    assert.ok(postExecIdx !== -1, 'missing Post-execution validation');
    assert.ok(requiredOutputsIdx !== -1, 'missing Required Outputs');
    assert.ok(postExecIdx > contextRetrievalIdx,
      'Post-execution validation must appear after Context retrieval');
    assert.ok(postExecIdx < requiredOutputsIdx,
      'Post-execution validation must appear before Required Outputs');
  });

  test('verifier.md mentions export --check', () => {
    const content = fs.readFileSync(path.join(ROOT, 'roles/verifier.md'), 'utf8');
    assert.match(content, /wazir export --check/,
      'verifier.md should mention wazir export --check');
  });
});

// --- Humanizer integration tests ---

const HUMANIZE_EXPERTISE_FILES = [
  'expertise/humanize/index.md',
  'expertise/humanize/vocabulary-blacklist.md',
  'expertise/humanize/sentence-patterns.md',
  'expertise/humanize/domain-rules-technical-docs.md',
  'expertise/humanize/domain-rules-code.md',
  'expertise/humanize/domain-rules-content.md',
  'expertise/humanize/self-audit-checklist.md',
];

describe('humanizer expertise module files', () => {
  for (const file of HUMANIZE_EXPERTISE_FILES) {
    test(`${file} exists`, () => {
      assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} missing`);
    });
  }

  test('vocabulary-blacklist.md contains at least 61 blacklisted items', () => {
    const content = fs.readFileSync(path.join(ROOT, 'expertise/humanize/vocabulary-blacklist.md'), 'utf8');
    // Count table rows (lines starting with | that are not headers or separators)
    const tableRows = content.split('\n').filter(line =>
      line.startsWith('| ') && !line.startsWith('| Word') && !line.startsWith('| Phrase') && !line.startsWith('| Opener') && !line.startsWith('|---') && !line.startsWith('| -')
    );
    assert.ok(tableRows.length >= 61,
      `Expected at least 61 blacklisted items, found ${tableRows.length}`);
  });

  test('sentence-patterns.md contains 24 numbered patterns', () => {
    const content = fs.readFileSync(path.join(ROOT, 'expertise/humanize/sentence-patterns.md'), 'utf8');
    const patternHeadings = content.match(/^### \d+\./gm);
    assert.ok(patternHeadings && patternHeadings.length >= 24,
      `Expected at least 24 pattern headings, found ${patternHeadings ? patternHeadings.length : 0}`);
  });

  test('sentence-patterns.md contains burstiness targets', () => {
    const content = fs.readFileSync(path.join(ROOT, 'expertise/humanize/sentence-patterns.md'), 'utf8');
    assert.match(content, /## Burstiness/);
    assert.match(content, /0\.4/);
    assert.match(content, /~20%/);
    assert.match(content, /~50%/);
    assert.match(content, /~25%/);
    assert.match(content, /~5%/);
  });

  test('self-audit-checklist.md has Pass 1 and Pass 2', () => {
    const content = fs.readFileSync(path.join(ROOT, 'expertise/humanize/self-audit-checklist.md'), 'utf8');
    assert.match(content, /## Pass 1/);
    assert.match(content, /## Pass 2/);
    assert.match(content, /vocabulary-blacklist\.md/);
    assert.match(content, /sentence-patterns\.md/);
  });
});

describe('wz:humanize skill format', () => {
  test('skills/humanize/SKILL.md exists with correct frontmatter', () => {
    const skillPath = path.join(ROOT, 'skills/humanize/SKILL.md');
    assert.ok(fs.existsSync(skillPath), 'skills/humanize/SKILL.md missing');
    const content = fs.readFileSync(skillPath, 'utf8');

    // Check frontmatter has name and description only
    assert.match(content, /^---\nname: wz:humanize\n/);
    assert.match(content, /\ndescription: /);

    // No version or allowed-tools
    assert.ok(!content.match(/\nversion:/), 'Frontmatter should not contain version');
    assert.ok(!content.match(/\nallowed-tools:/), 'Frontmatter should not contain allowed-tools');
  });

  test('skill has 4 pipeline phases', () => {
    const content = fs.readFileSync(path.join(ROOT, 'skills/humanize/SKILL.md'), 'utf8');
    assert.match(content, /## Phase 1: Scan/);
    assert.match(content, /## Phase 2: Identify/);
    assert.match(content, /## Phase 3: Rewrite/);
    assert.match(content, /## Phase 4: Verify/);
  });

  test('skill references expertise modules', () => {
    const content = fs.readFileSync(path.join(ROOT, 'skills/humanize/SKILL.md'), 'utf8');
    assert.match(content, /expertise\/humanize\/vocabulary-blacklist\.md/);
    assert.match(content, /expertise\/humanize\/sentence-patterns\.md/);
    assert.match(content, /expertise\/humanize\/self-audit-checklist\.md/);
  });
});

describe('humanize composition map integration', () => {
  test('composition-map.yaml has humanize concern with 6 roles', () => {
    const content = fs.readFileSync(path.join(ROOT, 'expertise/composition-map.yaml'), 'utf8');
    assert.match(content, /humanize:/);
    assert.match(content, /executor:.*humanize\//);
    assert.match(content, /content-author:.*humanize\//);
    assert.match(content, /specifier:.*humanize\//);
    assert.match(content, /planner:.*humanize\//);
    assert.match(content, /reviewer:.*humanize\//);
    assert.match(content, /learner:.*humanize\//);
  });

  test('all composition map humanize paths resolve to existing files', () => {
    const humanizePaths = [
      'humanize/vocabulary-blacklist.md',
      'humanize/domain-rules-code.md',
      'humanize/domain-rules-content.md',
      'humanize/domain-rules-technical-docs.md',
      'humanize/self-audit-checklist.md',
    ];
    for (const p of humanizePaths) {
      const fullPath = path.join(ROOT, 'expertise', p);
      assert.ok(fs.existsSync(fullPath), `${p} referenced in composition map but missing at ${fullPath}`);
    }
  });
});

describe('humanize index.yaml registration', () => {
  test('expertise/index.yaml has humanize entry', () => {
    const content = fs.readFileSync(path.join(ROOT, 'expertise/index.yaml'), 'utf8');
    assert.match(content, /id: humanize/);
    assert.match(content, /domain: writing-quality/);
    assert.match(content, /specify/);
    assert.match(content, /plan/);
    assert.match(content, /execute/);
    assert.match(content, /author/);
    assert.match(content, /review/);
    assert.match(content, /learn/);
  });
});

describe('role contracts writing quality sections', () => {
  const WRITING_QUALITY_ROLES = [
    { file: 'roles/executor.md', domainRef: 'domain-rules-code.md' },
    { file: 'roles/content-author.md', domainRef: 'domain-rules-content.md' },
    { file: 'roles/specifier.md', domainRef: 'domain-rules-technical-docs.md' },
    { file: 'roles/planner.md', domainRef: 'domain-rules-technical-docs.md' },
    { file: 'roles/reviewer.md', domainRef: 'domain-rules-technical-docs.md' },
    { file: 'roles/learner.md', domainRef: 'domain-rules-technical-docs.md' },
  ];

  for (const { file, domainRef } of WRITING_QUALITY_ROLES) {
    test(`${file} has Writing Quality section referencing ${domainRef}`, () => {
      const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
      assert.match(content, /^## Writing Quality$/m,
        `${file} is missing "## Writing Quality" section`);
      assert.ok(content.includes(domainRef),
        `${file} should reference ${domainRef}`);
    });
  }

  test('learner.md mentions hedging exception', () => {
    const content = fs.readFileSync(path.join(ROOT, 'roles/learner.md'), 'utf8');
    assert.match(content, /hedging/i,
      'learner.md should mention hedging exception in Writing Quality section');
  });
});

describe('execute workflow pre-execution validation', () => {
  test('execute.md contains a Pre-execution validation section', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows/execute.md'), 'utf8');
    assert.match(content, /^## Pre-execution validation$/m,
      'execute.md is missing "## Pre-execution validation" section');
  });

  test('execute.md has Pre-execution validation after Phase entry', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows/execute.md'), 'utf8');
    const phaseEntryIdx = content.indexOf('## Phase entry');
    const preExecIdx = content.indexOf('## Pre-execution validation');

    assert.ok(phaseEntryIdx !== -1, 'missing Phase entry');
    assert.ok(preExecIdx !== -1, 'missing Pre-execution validation');
    assert.ok(preExecIdx > phaseEntryIdx,
      'Pre-execution validation must appear after Phase entry');
  });

  test('execute.md mentions validate manifest and validate hooks', () => {
    const content = fs.readFileSync(path.join(ROOT, 'workflows/execute.md'), 'utf8');
    assert.match(content, /wazir validate manifest/,
      'execute.md should mention wazir validate manifest');
    assert.match(content, /wazir validate hooks/,
      'execute.md should mention wazir validate hooks');
  });
});
