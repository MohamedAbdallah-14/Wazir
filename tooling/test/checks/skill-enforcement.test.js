import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let validateSkillsAtProjectRoot;

describe('skill enforcement.phased validation', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-skill-enforce-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('setup: import', async () => {
    const mod = await import('../../src/checks/skills.js');
    validateSkillsAtProjectRoot = mod.validateSkillsAtProjectRoot;
    assert.ok(validateSkillsAtProjectRoot);
  });

  test('passes when skill has enforcement.phased and matching templates exist', () => {
    if (!validateSkillsAtProjectRoot) return;
    // Create skill with enforcement frontmatter
    const skillDir = path.join(tmpDir, 'skills', 'self-audit');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), [
      '---',
      'name: wz:self-audit',
      'description: audit loop',
      'enforcement:',
      '  phased: true',
      '---',
      '# Self-Audit',
    ].join('\n'));

    // Create matching templates
    const tplDir = path.join(tmpDir, 'templates', 'phases', 'skills', 'self-audit');
    fs.mkdirSync(tplDir, { recursive: true });
    fs.writeFileSync(path.join(tplDir, '01-validate.md'), '## Phase: validate\n- [ ] step\n');

    const result = validateSkillsAtProjectRoot(tmpDir);
    assert.strictEqual(result.exitCode, 0, `Expected pass, got: ${result.stderr || ''}`);
  });

  test('fails when skill has enforcement.phased but no templates', () => {
    if (!validateSkillsAtProjectRoot) return;
    const skillDir = path.join(tmpDir, 'skills', 'self-audit');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), [
      '---',
      'name: wz:self-audit',
      'description: audit loop',
      'enforcement:',
      '  phased: true',
      '---',
      '# Self-Audit',
    ].join('\n'));

    // No templates directory created

    const result = validateSkillsAtProjectRoot(tmpDir);
    assert.strictEqual(result.exitCode, 1, 'Should fail when phased skill has no templates');
    assert.ok(result.stderr.includes('enforcement.phased') || result.stderr.includes('template'),
      `Error should mention enforcement or templates. Got: ${result.stderr}`);
  });

  test('passes when skill has no enforcement section', () => {
    if (!validateSkillsAtProjectRoot) return;
    const skillDir = path.join(tmpDir, 'skills', 'brainstorming');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), [
      '---',
      'name: wz:brainstorming',
      'description: brainstorm ideas',
      '---',
      '# Brainstorming',
    ].join('\n'));

    const result = validateSkillsAtProjectRoot(tmpDir);
    assert.strictEqual(result.exitCode, 0);
  });
});
