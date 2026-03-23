import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let findActivePhase, extractCurrentStep, formatInjection;

describe('phase-injector: findActivePhase', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-injector-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('setup: import', async () => {
    const mod = await import('../../src/hooks/phase-injector.js');
    findActivePhase = mod.findActivePhase;
    extractCurrentStep = mod.extractCurrentStep;
    formatInjection = mod.formatInjection;
    assert.ok(findActivePhase);
    assert.ok(extractCurrentStep);
    assert.ok(formatInjection);
  });

  test('finds the ACTIVE phase from a set of phase files', async () => {
    if (!findActivePhase) return;
    fs.writeFileSync(path.join(tmpDir, 'init.md'), '## Phase: init — COMPLETED\n- [x] done\n');
    fs.writeFileSync(path.join(tmpDir, 'clarifier.md'), '## Phase: clarifier — ACTIVE\n- [ ] step 1\n- [ ] step 2\n');
    fs.writeFileSync(path.join(tmpDir, 'executor.md'), '## Phase: executor — NOT ACTIVE\n- [ ] step\n');

    const result = findActivePhase(tmpDir);
    assert.strictEqual(result.phase, 'clarifier');
    assert.ok(result.content.includes('ACTIVE'));
  });

  test('returns null when no ACTIVE phase exists', async () => {
    if (!findActivePhase) return;
    fs.writeFileSync(path.join(tmpDir, 'init.md'), '## Phase: init — COMPLETED\n');
    const result = findActivePhase(tmpDir);
    assert.strictEqual(result, null);
  });
});

describe('phase-injector: extractCurrentStep', () => {
  test('extracts first unchecked item', async () => {
    if (!extractCurrentStep) return;
    const content = '## Phase: clarifier — ACTIVE\n- [x] done\n- [ ] current step\n- [ ] next step\n';
    const result = extractCurrentStep(content);
    assert.strictEqual(result.current, 'current step');
    assert.strictEqual(result.next, 'next step');
    assert.strictEqual(result.stepNum, 2);
    assert.strictEqual(result.totalSteps, 3);
  });

  test('ignores indented sub-items', async () => {
    if (!extractCurrentStep) return;
    const content = '## Phase: executor — ACTIVE\n- [x] task 1\n  - [ ] subtask\n- [ ] task 2\n';
    const result = extractCurrentStep(content);
    assert.strictEqual(result.current, 'task 2');
  });

  test('ignores items inside fenced code blocks', async () => {
    if (!extractCurrentStep) return;
    const content = '## Phase: executor — ACTIVE\n- [x] done\n```\n- [ ] inside code\n```\n- [ ] real step\n';
    const result = extractCurrentStep(content);
    assert.strictEqual(result.current, 'real step');
  });

  test('returns null when all items checked', async () => {
    if (!extractCurrentStep) return;
    const content = '## Phase: init — ACTIVE\n- [x] all\n- [x] done\n';
    const result = extractCurrentStep(content);
    assert.strictEqual(result, null);
  });
});

describe('phase-injector: formatInjection', () => {
  test('produces correct systemMessage JSON', async () => {
    if (!formatInjection) return;
    const result = formatInjection('clarifier', 'Run discover workflow', 'Run clarify workflow', 2, 5);
    const parsed = JSON.parse(result);
    assert.ok(parsed.systemMessage);
    assert.ok(parsed.systemMessage.includes('CURRENT:'));
    assert.ok(parsed.systemMessage.includes('clarifier phase'));
    assert.ok(parsed.systemMessage.includes('step 2 of 5'));
    assert.ok(parsed.systemMessage.includes('NEXT:'));
  });

  test('handles null next step', async () => {
    if (!formatInjection) return;
    const result = formatInjection('final_review', 'Last step', null, 5, 5);
    const parsed = JSON.parse(result);
    assert.ok(parsed.systemMessage.includes('CURRENT:'));
    assert.ok(!parsed.systemMessage.includes('NEXT:') || parsed.systemMessage.includes('NEXT: (last step)'));
  });
});

describe('phase-injector: error handling', () => {
  test('returns empty JSON for missing phases directory', async () => {
    if (!findActivePhase) return;
    const result = findActivePhase('/nonexistent/path');
    assert.strictEqual(result, null);
  });
});
