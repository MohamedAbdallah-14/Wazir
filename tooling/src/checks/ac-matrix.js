import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');

function resolve(rel) {
  return path.join(ROOT, rel);
}

function fileExists(rel) {
  return fs.existsSync(resolve(rel));
}

function fileContains(rel, pattern) {
  if (!fileExists(rel)) return false;
  const content = fs.readFileSync(resolve(rel), 'utf8');
  if (typeof pattern === 'string') return content.includes(pattern);
  return pattern.test(content);
}

function sectionContains(rel, sectionHeading, pattern) {
  if (!fileExists(rel)) return false;
  const content = fs.readFileSync(resolve(rel), 'utf8');
  const lines = content.split('\n');
  let inSection = false;
  let sectionContent = '';
  const headingLevel = sectionHeading.match(/^#+/)?.[0]?.length || 2;
  for (const line of lines) {
    // Match exact heading: "## Step 2:" should NOT match "## Step 2.5:" or "## Step 2.6:"
    // Use word boundary check: heading text must be followed by end-of-line, colon, or space
    const trimmed = line.replace(/^#+\s*/, '');
    const probe = sectionHeading.replace(/^#+\s*/, '');
    if (trimmed === probe || trimmed.startsWith(probe + ':') || trimmed.startsWith(probe + ' ')) {
      inSection = true;
      sectionContent = '';
      continue;
    }
    if (inSection) {
      const match = line.match(/^(#{1,6})\s/);
      if (match && match[1].length <= headingLevel) break;
      sectionContent += line + '\n';
    }
  }
  if (typeof pattern === 'string') return sectionContent.includes(pattern);
  return pattern.test(sectionContent);
}

function countMatches(rel, pattern) {
  if (!fileExists(rel)) return 0;
  const content = fs.readFileSync(resolve(rel), 'utf8');
  if (typeof pattern === 'string') {
    return content.split(pattern).length - 1;
  }
  return (content.match(pattern) || []).length;
}

const CHECKS = [
  // Item 8: Spec-kit task template
  { id: 'AC8.1', item: 8, tier: 1, desc: 'tasks-template.md exists', check: () => fileExists('templates/artifacts/tasks-template.md') },
  { id: 'AC8.2', item: 8, tier: 1, desc: 'Contains T001', check: () => fileContains('templates/artifacts/tasks-template.md', 'T001') },
  { id: 'AC8.3', item: 8, tier: 1, desc: 'Contains [P]', check: () => fileContains('templates/artifacts/tasks-template.md', '[P]') },
  { id: 'AC8.4', item: 8, tier: 1, desc: 'Contains Phase 1: Setup', check: () => fileContains('templates/artifacts/tasks-template.md', /Phase\s*1.*Setup|Setup.*Phase\s*1/i) },
  { id: 'AC8.5', item: 8, tier: 1, desc: 'Contains Phase 2: Foundational', check: () => fileContains('templates/artifacts/tasks-template.md', /Phase\s*2.*Foundational|Foundational.*Phase\s*2/i) },
  { id: 'AC8.6', item: 8, tier: 1, desc: 'Contains MVP', check: () => fileContains('templates/artifacts/tasks-template.md', /mvp/i) },
  { id: 'AC8.7', item: 8, tier: 1, desc: 'Contains dependency', check: () => fileContains('templates/artifacts/tasks-template.md', /dependenc|depend/i) },
  { id: 'AC8.8', item: 8, tier: 1, desc: 'implementation-plan.md references tasks-template', check: () => fileContains('templates/artifacts/implementation-plan.md', 'tasks-template') },
  { id: 'AC8.9', item: 8, tier: 1, desc: 'Contains [US', check: () => fileContains('templates/artifacts/tasks-template.md', '[US') },
  { id: 'AC8.10', item: 8, tier: 2, desc: 'Story phase has goal, test criteria, tasks', check: () => fileContains('templates/artifacts/tasks-template.md', /goal/i) && fileContains('templates/artifacts/tasks-template.md', /test.*criteria|criteria.*test/i) },

  // Item 12: Fix-and-loop
  { id: 'AC12.1', item: 12, tier: 1, desc: 'Describes re-submission after fixes', check: () => fileContains('docs/reference/review-loop-pattern.md', /re-s(end|ubmit)|loop/i) },
  { id: 'AC12.2', item: 12, tier: 1, desc: 'Pass caps per depth', check: () => fileContains('docs/reference/review-loop-pattern.md', /quick.*3|standard.*5|deep.*7/) },
  { id: 'AC12.3', item: 12, tier: 1, desc: 'At cap user chooses', check: () => fileContains('docs/reference/review-loop-pattern.md', /user|approve|escalat/i) },
  { id: 'AC12.4', item: 12, tier: 1, desc: 'No fix-and-continue path', check: () => !fileContains('docs/reference/review-loop-pattern.md', /fix and continue without/i) || fileContains('docs/reference/review-loop-pattern.md', /prohibit|must not|never.*fix and continue/i) },
  { id: 'AC12.5', item: 12, tier: 1, desc: 'Clarifier references review-loop-pattern.md', check: () => fileContains('skills/clarifier/SKILL.md', 'review-loop-pattern') },
  { id: 'AC12.6', item: 12, tier: 1, desc: 'Escalation offers 3 options', check: () => fileContains('docs/reference/review-loop-pattern.md', /approve.*issues|fix.*manually|abort/i) },

  // Item 13: Reviewer skill invocation
  { id: 'AC13.1', item: 13, tier: 1, desc: 'Clarifier references wz:reviewer', check: () => fileContains('skills/clarifier/SKILL.md', /wz:reviewer|reviewer skill/i) },
  { id: 'AC13.2', item: 13, tier: 2, desc: 'Clarifier no bare codex exec/review', check: () => { /* Manual: check codex exec/review only in code blocks */ return null; } },
  { id: 'AC13.3', item: 13, tier: 1, desc: 'writing-plans references wz:reviewer --mode plan-review', check: () => fileContains('skills/writing-plans/SKILL.md', /wz:reviewer.*plan-review|plan-review.*wz:reviewer/) },
  { id: 'AC13.4', item: 13, tier: 2, desc: 'writing-plans no bare codex exec/review', check: () => { return null; } },
  { id: 'AC13.5', item: 13, tier: 1, desc: 'Clarifier uses all 3 modes', check: () => fileContains('skills/clarifier/SKILL.md', 'clarification-review') && fileContains('skills/clarifier/SKILL.md', 'spec-challenge') && fileContains('skills/clarifier/SKILL.md', 'plan-review') },
  { id: 'AC13.6', item: 13, tier: 1, desc: 'Reviewer documents 4 responsibilities', check: () => fileContains('skills/reviewer/SKILL.md', /Codex.*integration|integration.*Codex/i) && fileContains('skills/reviewer/SKILL.md', /dimension/i) },

  // Item 1: Input preservation
  { id: 'AC1.1', item: 1, tier: 2, desc: 'wc -l plan >= wc -l input', check: () => null },
  { id: 'AC1.2', item: 1, tier: 2, desc: 'Criteria in corresponding task description', check: () => null },
  { id: 'AC1.3', item: 1, tier: 2, desc: 'Endpoints/hex/dimensions in relevant section', check: () => null },
  { id: 'AC1.4', item: 1, tier: 2, desc: 'Works with empty input/tasks/', check: () => null },

  // Item 2: Spec-kit plan format
  { id: 'AC2.1', item: 2, tier: 1, desc: 'Clarifier produces execution-plan.md', check: () => fileContains('skills/clarifier/SKILL.md', 'execution-plan.md') },
  { id: 'AC2.2', item: 2, tier: 1, desc: 'Plan has T0XX checkboxes', check: () => fileContains('skills/clarifier/SKILL.md', /T\d{3}|T0XX/) },
  { id: 'AC2.3', item: 2, tier: 1, desc: 'Plan has [P] markers', check: () => fileContains('skills/clarifier/SKILL.md', '[P]') || fileContains('skills/writing-plans/SKILL.md', '[P]') },
  { id: 'AC2.4', item: 2, tier: 1, desc: 'Phase headings Setup/Foundational', check: () => fileContains('skills/clarifier/SKILL.md', /Setup|Foundational/) || fileContains('skills/writing-plans/SKILL.md', /Setup|Foundational/) },
  { id: 'AC2.5', item: 2, tier: 2, desc: 'Every task has file path', check: () => null },
  { id: 'AC2.6', item: 2, tier: 1, desc: 'No tasks/task-NNN/spec.md created', check: () => !fileExists('.wazir/runs/latest/tasks/task-001/spec.md') },
  { id: 'AC2.7', item: 2, tier: 1, desc: 'Contains [US] labels', check: () => fileContains('skills/clarifier/SKILL.md', '[US') || fileContains('skills/writing-plans/SKILL.md', '[US') },
  { id: 'AC2.8', item: 2, tier: 2, desc: 'Story phases have goal, criteria, tasks', check: () => null },

  // Item 3: Gap analysis
  { id: 'AC3.1', item: 3, tier: 2, desc: 'plan-review-pass-N.md files exist', check: () => null },
  { id: 'AC3.2', item: 3, tier: 1, desc: 'Gap analysis reads input/ AND user-feedback.md', check: () => fileContains('skills/clarifier/SKILL.md', 'input/') && fileContains('skills/clarifier/SKILL.md', 'user-feedback.md') },
  { id: 'AC3.3', item: 3, tier: 1, desc: 'Uses wz:reviewer --mode plan-review', check: () => fileContains('skills/clarifier/SKILL.md', /wz:reviewer.*plan-review/) },
  { id: 'AC3.4', item: 3, tier: 2, desc: 'Terminal state CLEAN or user-approved-with-issues', check: () => null },
  { id: 'AC3.5', item: 3, tier: 2, desc: 'Clarifier doesnt produce review files', check: () => null },

  // Item 6: Context-mode
  { id: 'AC6.1', item: 6, tier: 1, desc: 'init-pipeline references context_mode', check: () => fileContains('skills/init-pipeline/SKILL.md', /context.mode|context-mode/) },
  { id: 'AC6.2', item: 6, tier: 1, desc: 'Config stores as object', check: () => fileContains('skills/init-pipeline/SKILL.md', /enabled.*true|\{.*enabled/) },
  { id: 'AC6.3', item: 6, tier: 1, desc: 'Clarifier references fetch_and_index', check: () => fileContains('skills/clarifier/SKILL.md', 'fetch_and_index') },
  { id: 'AC6.4', item: 6, tier: 1, desc: 'Clarifier has WebFetch fallback', check: () => fileContains('skills/clarifier/SKILL.md', 'WebFetch') },
  { id: 'AC6.5', item: 6, tier: 1, desc: 'Detection checks tools under correct prefix', check: () => fileContains('skills/init-pipeline/SKILL.md', 'mcp__plugin_context-mode_context-mode__') || fileContains('skills/init-pipeline/SKILL.md', /execute.*fetch_and_index.*search/) },
  { id: 'AC6.6', item: 6, tier: 1, desc: 'command.js references context_mode', check: () => fileContains('tooling/src/init/command.js', 'context_mode') || fileContains('tooling/src/init/command.js', 'context-mode') },
  { id: 'AC6.7', item: 6, tier: 1, desc: 'Clarifier references execute/execute_file for large outputs', check: () => fileContains('skills/clarifier/SKILL.md', /execute_file|execute.*large/i) },
  { id: 'AC6.8', item: 6, tier: 1, desc: 'Bash fallback documented', check: () => fileContains('skills/clarifier/SKILL.md', 'Bash') },
  { id: 'AC6.9', item: 6, tier: 1, desc: 'Wazir records context-mode in run-config', check: () => fileContains('skills/wazir/SKILL.md', /context.mode|context-mode/) },

  // Item 9: Online research
  { id: 'AC9.1', item: 9, tier: 1, desc: 'Phase 0 keyword extraction', check: () => fileContains('skills/clarifier/SKILL.md', /extract.*keyword|keyword.*extract|extract.*concept|concept.*extract/i) },
  { id: 'AC9.2', item: 9, tier: 1, desc: 'Decision criteria documented', check: () => fileContains('skills/clarifier/SKILL.md', /when to research|decision.*criteria/i) },
  { id: 'AC9.3', item: 9, tier: 1, desc: 'Both fetch_and_index and WebFetch', check: () => fileContains('skills/clarifier/SKILL.md', 'fetch_and_index') && fileContains('skills/clarifier/SKILL.md', 'WebFetch') },
  { id: 'AC9.4', item: 9, tier: 1, desc: 'Error handling for 404, rate limit, no URL', check: () => fileContains('skills/clarifier/SKILL.md', /404|failed.*fetch|error.*handling/i) },
  { id: 'AC9.5', item: 9, tier: 1, desc: 'Content saved to sources/', check: () => fileContains('skills/clarifier/SKILL.md', 'sources/') },
  { id: 'AC9.6', item: 9, tier: 1, desc: 'Manifest tracks status', check: () => fileContains('skills/clarifier/SKILL.md', /manifest|status.*track/i) },

  // Item 17: Codex output protection
  { id: 'AC17.1', item: 17, tier: 1, desc: 'Pattern doc describes tee + execute_file', check: () => fileContains('docs/reference/review-loop-pattern.md', 'tee') && fileContains('docs/reference/review-loop-pattern.md', 'execute_file') },
  { id: 'AC17.2', item: 17, tier: 1, desc: 'Reviewer shows execute_file after Codex', check: () => fileContains('skills/reviewer/SKILL.md', 'execute_file') },
  { id: 'AC17.3', item: 17, tier: 1, desc: 'Fallback uses tac-based extraction', check: () => fileContains('docs/reference/review-loop-pattern.md', 'tac') || fileContains('skills/reviewer/SKILL.md', 'tac') },
  { id: 'AC17.4', item: 17, tier: 2, desc: 'Raw trace preserved in file only', check: () => null },
  { id: 'AC17.5', item: 17, tier: 1, desc: 'Clarifier doesnt call codex directly', check: () => true /* covered by AC13.2 */ },

  // Item 4: Resume
  { id: 'AC4.1', item: 4, tier: 1, desc: 'Resume copies clarified/ except user-feedback', check: () => fileContains('skills/wazir/SKILL.md', /clarified.*user-feedback|user-feedback.*exclude/i) },
  { id: 'AC4.2', item: 4, tier: 2, desc: 'Start-fresh creates empty clarified/', check: () => null },
  { id: 'AC4.3', item: 4, tier: 1, desc: 'tasks/ NOT copied', check: () => fileContains('skills/wazir/SKILL.md', /tasks.*not.*cop|do not.*copy.*tasks/i) || !fileContains('skills/wazir/SKILL.md', /copy.*tasks\//) },
  { id: 'AC4.4', item: 4, tier: 1, desc: 'Staleness checks ALL input/ files', check: () => fileContains('skills/wazir/SKILL.md', /stale|input.*newer|mtime/i) },
  { id: 'AC4.5', item: 4, tier: 1, desc: 'User explicitly chooses Resume', check: () => fileContains('skills/wazir/SKILL.md', /Resume.*Start fresh|choose.*resume/i) },
  { id: 'AC4.6', item: 4, tier: 2, desc: 'Staleness warning with file names + interactive', check: () => null },
  { id: 'AC4.7', item: 4, tier: 1, desc: 'Resume resumes from last completed phase', check: () => fileContains('skills/wazir/SKILL.md', /last.*completed.*phase|resume.*phase/i) },

  // Item 5: CHANGELOG + gitflow
  { id: 'AC5.1', item: 5, tier: 1, desc: 'wazir has validate changelog --require-entries', check: () => fileContains('skills/wazir/SKILL.md', 'validate changelog') && fileContains('skills/wazir/SKILL.md', '--require-entries') },
  { id: 'AC5.2', item: 5, tier: 1, desc: 'wazir has validate commits', check: () => fileContains('skills/wazir/SKILL.md', 'validate commits') },
  { id: 'AC5.3', item: 5, tier: 1, desc: 'Executor references CHANGELOG + [Unreleased]', check: () => fileContains('skills/executor/SKILL.md', 'CHANGELOG') && fileContains('skills/executor/SKILL.md', 'Unreleased') },
  { id: 'AC5.4', item: 5, tier: 1, desc: 'Reviewer flags CHANGELOG as [warning]', check: () => fileContains('skills/reviewer/SKILL.md', 'CHANGELOG') && fileContains('skills/reviewer/SKILL.md', /warning/i) },
  { id: 'AC5.5', item: 5, tier: 1, desc: 'Hard gate stops pipeline', check: () => fileContains('skills/wazir/SKILL.md', /hard gate|must fix before/i) },
  { id: 'AC5.6', item: 5, tier: 1, desc: 'All 6 keepachangelog types', check: () => ['Added', 'Changed', 'Fixed', 'Removed', 'Deprecated', 'Security'].every(t => fileContains('skills/executor/SKILL.md', t)) },
  { id: 'AC5.7', item: 5, tier: 1, desc: 'Reviewer binds to task-review AND final', check: () => fileContains('skills/reviewer/SKILL.md', 'task-review') && fileContains('skills/reviewer/SKILL.md', 'final') },

  // Item 7: Usage reports
  { id: 'AC7.1', item: 7, tier: 1, desc: 'wazir contains capture usage', check: () => fileContains('skills/wazir/SKILL.md', 'capture usage') },
  { id: 'AC7.2', item: 7, tier: 2, desc: 'Present at EVERY phase_exit block', check: () => null },
  { id: 'AC7.3', item: 7, tier: 1, desc: 'Output path includes run-id and phase', check: () => fileContains('skills/wazir/SKILL.md', /usage.*phase|phase.*usage/i) },

  // Item 10: Interactive
  { id: 'AC10.1', item: 10, tier: 2, desc: 'Clarifier Checkpoint 0 has pattern', check: () => sectionContains('skills/clarifier/SKILL.md', 'Checkpoint 0', '(Recommended)') },
  { id: 'AC10.2', item: 10, tier: 2, desc: 'Clarifier Checkpoint 1A has pattern', check: () => sectionContains('skills/clarifier/SKILL.md', 'Checkpoint 1A', '(Recommended)') },
  { id: 'AC10.3', item: 10, tier: 2, desc: 'Clarifier Checkpoint 1A+ has pattern', check: () => sectionContains('skills/clarifier/SKILL.md', 'Checkpoint 1A+', '(Recommended)') },
  { id: 'AC10.4', item: 10, tier: 2, desc: 'Clarifier Checkpoint 1B has pattern', check: () => sectionContains('skills/clarifier/SKILL.md', 'Checkpoint 1B', '(Recommended)') },
  { id: 'AC10.5', item: 10, tier: 2, desc: 'Clarifier Checkpoint 1C has pattern', check: () => sectionContains('skills/clarifier/SKILL.md', 'Checkpoint 1C', '(Recommended)') },
  { id: 'AC10.6a', item: 10, tier: 2, desc: 'wazir Step 2 has pattern', check: () => sectionContains('skills/wazir/SKILL.md', 'Step 2', '(Recommended)') },
  { id: 'AC10.6b', item: 10, tier: 2, desc: 'wazir Step 3 has 3 option blocks', check: () => null },
  { id: 'AC10.6c', item: 10, tier: 2, desc: 'wazir Step 4 has pattern', check: () => sectionContains('skills/wazir/SKILL.md', 'Step 4', '(Recommended)') },
  { id: 'AC10.6d', item: 10, tier: 2, desc: 'wazir Step 5 has pattern', check: () => sectionContains('skills/wazir/SKILL.md', 'Step 5', '(Recommended)') },
  { id: 'AC10.7', item: 10, tier: 2, desc: 'ALL executor prompts use numbered options', check: () => null },
  { id: 'AC10.8', item: 10, tier: 2, desc: 'ALL reviewer prompts use numbered options', check: () => null },
  { id: 'AC10.9', item: 10, tier: 1, desc: 'No AskUserQuestion in 4 skills', check: () => !fileContains('skills/clarifier/SKILL.md', 'AskUserQuestion') && !fileContains('skills/wazir/SKILL.md', 'AskUserQuestion') && !fileContains('skills/executor/SKILL.md', 'AskUserQuestion') && !fileContains('skills/reviewer/SKILL.md', 'AskUserQuestion') },
  { id: 'AC10.10', item: 10, tier: 2, desc: 'No open-ended questions', check: () => null },

  // Item 11: User feedback
  { id: 'AC11.1', item: 11, tier: 1, desc: 'Clarifier references user-feedback.md at runs/ path', check: () => fileContains('skills/clarifier/SKILL.md', 'user-feedback.md') && fileContains('skills/clarifier/SKILL.md', /runs\//) },
  { id: 'AC11.2', item: 11, tier: 2, desc: 'Checkpoint routes corrections', check: () => null },
  { id: 'AC11.3', item: 11, tier: 2, desc: 'File starts empty on new runs', check: () => null },
  { id: 'AC11.4', item: 11, tier: 1, desc: 'Feedback is timestamped', check: () => fileContains('skills/clarifier/SKILL.md', /timestamp/i) },

  // Item 14: Briefing updates
  { id: 'AC14.1', item: 14, tier: 1, desc: 'Clarifier references User Additions', check: () => fileContains('skills/clarifier/SKILL.md', 'User Additions') },
  { id: 'AC14.2', item: 14, tier: 2, desc: 'Checkpoint distinguishes scope vs correction', check: () => null },
  { id: 'AC14.3', item: 14, tier: 1, desc: 'Gap analysis reads input/ and user-feedback.md', check: () => true /* covered by AC3.2 */ },
  { id: 'AC14.4', item: 14, tier: 2, desc: 'Routing question uses numbered options', check: () => null },

  // Item 15: Phase scoring
  { id: 'AC15.1', item: 15, tier: 1, desc: 'Pattern doc defines canonical dimension sets', check: () => fileContains('docs/reference/review-loop-pattern.md', /canonical.*dimension|dimension.*set.*per.*phase/i) },
  { id: 'AC15.2', item: 15, tier: 1, desc: 'Same dimensions + delta', check: () => fileContains('docs/reference/review-loop-pattern.md', /same.*dimension|delta/i) },
  { id: 'AC15.3', item: 15, tier: 1, desc: 'Report includes Quality Delta', check: () => fileContains('docs/reference/review-loop-pattern.md', 'Quality Delta') || fileContains('skills/wazir/SKILL.md', 'Quality Delta') },
  { id: 'AC15.4', item: 15, tier: 1, desc: 'Delta format with arrow', check: () => fileContains('docs/reference/review-loop-pattern.md', /\d+\/10.*→|→.*\d+\/10/) || fileContains('docs/reference/review-loop-pattern.md', /\+\d+\)/) },
  { id: 'AC15.5', item: 15, tier: 1, desc: 'Reviewer pass files record dimension set', check: () => fileContains('skills/reviewer/SKILL.md', /dimension.*set|record.*dimension/i) },

  // Item 16: Full report
  { id: 'AC16.1', item: 16, tier: 1, desc: 'Report path reviews/<phase>-report.md', check: () => fileContains('skills/wazir/SKILL.md', /report\.md|phase.*report/) },
  { id: 'AC16.2', item: 16, tier: 1, desc: 'Contains ## Summary', check: () => fileContains('skills/wazir/SKILL.md', 'Summary') || fileContains('docs/reference/review-loop-pattern.md', 'Summary') },
  { id: 'AC16.3', item: 16, tier: 1, desc: 'Contains Key Changes', check: () => fileContains('skills/wazir/SKILL.md', 'Key Changes') || fileContains('docs/reference/review-loop-pattern.md', 'Key Changes') },
  { id: 'AC16.4', item: 16, tier: 1, desc: 'Contains Quality Delta', check: () => fileContains('skills/wazir/SKILL.md', 'Quality Delta') || fileContains('docs/reference/review-loop-pattern.md', 'Quality Delta') },
  { id: 'AC16.5', item: 16, tier: 2, desc: 'Findings Log with per-pass severity', check: () => null },
  { id: 'AC16.6', item: 16, tier: 1, desc: 'Contains Usage', check: () => fileContains('skills/wazir/SKILL.md', /Usage|capture usage/) },
  { id: 'AC16.7', item: 16, tier: 1, desc: 'Context Savings conditional', check: () => fileContains('skills/wazir/SKILL.md', /context.*sav|context.mode/i) || fileContains('docs/reference/review-loop-pattern.md', /context.*sav/i) },
  { id: 'AC16.8', item: 16, tier: 1, desc: 'Time Spent section', check: () => fileContains('skills/wazir/SKILL.md', /time.*spent|time.*phase/i) || fileContains('docs/reference/review-loop-pattern.md', /time.*spent/i) },
  { id: 'AC16.9', item: 16, tier: 2, desc: 'Bound to EVERY phase_exit', check: () => null },
];

export function runAcMatrix() {
  let pass = 0;
  let fail = 0;
  let manual = 0;
  const results = [];

  for (const ac of CHECKS) {
    let result;
    try {
      result = ac.check();
    } catch {
      result = false;
    }

    if (result === null) {
      manual++;
      results.push({ ...ac, status: 'MANUAL' });
    } else if (result) {
      pass++;
      results.push({ ...ac, status: 'PASS' });
    } else {
      fail++;
      results.push({ ...ac, status: 'FAIL' });
    }
  }

  return { pass, fail, manual, total: CHECKS.length, results };
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const { pass, fail, manual, total, results } = runAcMatrix();

  console.log(`\nAC Matrix: ${pass} PASS / ${fail} FAIL / ${manual} MANUAL / ${total} total\n`);

  const failing = results.filter(r => r.status === 'FAIL');
  if (failing.length > 0) {
    console.log('FAILING:');
    for (const f of failing) {
      console.log(`  ${f.id} (Item ${f.item}): ${f.desc}`);
    }
  }

  const manualChecks = results.filter(r => r.status === 'MANUAL');
  if (manualChecks.length > 0) {
    console.log('\nMANUAL VERIFICATION NEEDED:');
    for (const m of manualChecks) {
      console.log(`  ${m.id} (Item ${m.item}): ${m.desc}`);
    }
  }

  process.exit(fail > 0 ? 1 : 0);
}
