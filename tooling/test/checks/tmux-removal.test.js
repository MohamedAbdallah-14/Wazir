import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');

describe('Tmux orchestration approach removed from project', () => {
  test('v3 findings doc has no Fix 3 section', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'docs/plans/2026-03-24-enforcement-v3-findings.md'), 'utf8',
    );
    assert.ok(!content.includes('Fix 3'), 'v3 findings doc must not contain "Fix 3"');
  });

  test('v3 findings doc says "Two Fixes" not "Three Fixes"', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'docs/plans/2026-03-24-enforcement-v3-findings.md'), 'utf8',
    );
    assert.ok(content.includes('Two Fixes'), 'v3 findings doc must contain "Two Fixes"');
    assert.ok(!content.includes('Three Fixes'), 'v3 findings doc must not contain "Three Fixes"');
  });

  test('v3 findings doc has Context Rot Research section', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'docs/plans/2026-03-24-enforcement-v3-findings.md'), 'utf8',
    );
    assert.ok(
      content.includes('Context Rot Research'),
      'v3 findings doc must have a Context Rot Research section',
    );
  });

  test('KNOWN-ISSUES KI-006 Fix field has no tmux', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'docs/KNOWN-ISSUES.md'), 'utf8',
    );
    const ki006 = content.match(/### KI-006[\s\S]*?(?=### KI-007)/);
    assert.ok(ki006, 'KI-006 section must exist');
    assert.ok(
      !ki006[0].toLowerCase().includes('tmux'),
      'KI-006 Fix field must not reference tmux',
    );
  });

  test('KNOWN-ISSUES KI-007 Fix field has no tmux', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'docs/KNOWN-ISSUES.md'), 'utf8',
    );
    const ki007 = content.match(/### KI-007[\s\S]*?(?=###|\n---)/);
    assert.ok(ki007, 'KI-007 section must exist');
    assert.ok(
      !ki007[0].toLowerCase().includes('tmux'),
      'KI-007 Fix field must not reference tmux',
    );
  });

  test('TODO.md has no V3 findings doc corrections section', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'TODO.md'), 'utf8');
    assert.ok(
      !content.includes('V3 findings doc corrections'),
      'TODO.md must not have V3 findings doc corrections section',
    );
  });
});
