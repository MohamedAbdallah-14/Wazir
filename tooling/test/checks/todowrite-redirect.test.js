import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const WAZIR_SKILL = path.join(PROJECT_ROOT, 'skills', 'wazir', 'SKILL.md');

describe('TodoWrite redirect (Fix 1): wz:wazir Phase 0 creates TaskCreate from checklist', () => {
  let content;
  let phase0;

  test('setup: read wz:wazir SKILL.md and extract Phase 0', () => {
    content = fs.readFileSync(WAZIR_SKILL, 'utf8');
    assert.ok(content.length > 0, 'SKILL.md must not be empty');
    const phase0Match = content.match(/# Phase 0[^\n]*\n([\s\S]*?)(?=\n# Phase \d)/);
    assert.ok(phase0Match, 'SKILL.md must have a Phase 0 section');
    phase0 = phase0Match[1];
  });

  test('Phase 0 references reading the active phase checklist', () => {
    assert.ok(phase0, 'phase0 must be extracted');
    assert.ok(
      phase0.includes('.wazir/runs/latest/phases/') || phase0.includes('phase checklist'),
      'Phase 0 must reference reading the active phase checklist file',
    );
  });

  test('Phase 0 instructs creating TaskCreate items from checklist', () => {
    assert.ok(phase0, 'phase0 must be extracted');
    assert.ok(
      phase0.includes('TaskCreate'),
      'Phase 0 must instruct agent to use TaskCreate for checklist items',
    );
  });

  test('Phase 0 instructs parsing unchecked items', () => {
    assert.ok(phase0, 'phase0 must be extracted');
    assert.ok(
      phase0.includes('- [ ]') || phase0.includes('unchecked'),
      'Phase 0 must describe parsing unchecked checklist items',
    );
  });

  test('TaskCreate instructions come AFTER wazir capture ensure', () => {
    assert.ok(phase0, 'phase0 must be extracted');
    const captureEnsureIdx = phase0.indexOf('wazir capture ensure');
    const taskCreateIdx = phase0.indexOf('TaskCreate');
    assert.ok(captureEnsureIdx >= 0, 'Phase 0 must contain wazir capture ensure');
    assert.ok(taskCreateIdx >= 0, 'Phase 0 must contain TaskCreate');
    assert.ok(
      taskCreateIdx > captureEnsureIdx,
      'TaskCreate instructions must come AFTER wazir capture ensure',
    );
  });
});
