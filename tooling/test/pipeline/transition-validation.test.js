import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let validatePhaseTransition, updatePhaseHeaders;

describe('transition validation', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-transition-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('setup: import', async () => {
    const mod = await import('../../src/pipeline/transition.js');
    validatePhaseTransition = mod.validatePhaseTransition;
    updatePhaseHeaders = mod.updatePhaseHeaders;
    assert.ok(validatePhaseTransition);
    assert.ok(updatePhaseHeaders);
  });

  test('rejects transition when non-transition items are unchecked', async () => {
    if (!validatePhaseTransition) return;
    const phasesDir = path.join(tmpDir, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });
    fs.writeFileSync(path.join(phasesDir, 'clarifier.md'),
      '## Phase: clarifier — ACTIVE\n- [x] Read briefing\n- [ ] Run clarifier\n- [ ] Transition <!-- transition -->\n');

    const result = validatePhaseTransition(phasesDir, 'clarifier', 'executor');
    assert.strictEqual(result.valid, false);
    assert.ok(result.unchecked.length > 0);
    assert.ok(result.unchecked[0].includes('Run clarifier'));
  });

  test('approves transition when only transition item is unchecked', async () => {
    if (!validatePhaseTransition) return;
    const phasesDir = path.join(tmpDir, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });
    fs.writeFileSync(path.join(phasesDir, 'clarifier.md'),
      '## Phase: clarifier — ACTIVE\n- [x] Read briefing\n- [x] Run clarifier\n- [ ] Transition command <!-- transition -->\n');

    const result = validatePhaseTransition(phasesDir, 'clarifier', 'executor');
    assert.strictEqual(result.valid, true);
  });

  test('auto-completes transition item on success', async () => {
    if (!validatePhaseTransition) return;
    const phasesDir = path.join(tmpDir, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });
    fs.writeFileSync(path.join(phasesDir, 'clarifier.md'),
      '## Phase: clarifier — ACTIVE\n- [x] Read briefing\n- [ ] Transition <!-- transition -->\n');

    const result = validatePhaseTransition(phasesDir, 'clarifier', 'executor');
    assert.strictEqual(result.valid, true);

    const content = fs.readFileSync(path.join(phasesDir, 'clarifier.md'), 'utf8');
    assert.ok(content.includes('- [x] Transition'), 'Transition item should be auto-checked');
  });

  test('updates phase headers: ACTIVE→COMPLETED, NOT ACTIVE→ACTIVE', async () => {
    if (!updatePhaseHeaders) return;
    const phasesDir = path.join(tmpDir, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });
    fs.writeFileSync(path.join(phasesDir, 'clarifier.md'), '## Phase: clarifier — ACTIVE\n- [x] done\n');
    fs.writeFileSync(path.join(phasesDir, 'executor.md'), '## Phase: executor — NOT ACTIVE\n- [ ] step\n');

    updatePhaseHeaders(phasesDir, 'clarifier', 'executor');

    const clarifier = fs.readFileSync(path.join(phasesDir, 'clarifier.md'), 'utf8');
    const executor = fs.readFileSync(path.join(phasesDir, 'executor.md'), 'utf8');
    assert.ok(clarifier.includes('— COMPLETED'), 'Current phase should be COMPLETED');
    assert.ok(executor.includes('— ACTIVE'), 'Next phase should be ACTIVE');
    assert.ok(!executor.includes('NOT ACTIVE'), 'Next phase should not be NOT ACTIVE');
  });

  test('terminal state: final_review exit marks COMPLETED with no next phase', async () => {
    if (!updatePhaseHeaders) return;
    const phasesDir = path.join(tmpDir, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });
    fs.writeFileSync(path.join(phasesDir, 'final_review.md'), '## Phase: final_review — ACTIVE\n- [x] done\n');

    updatePhaseHeaders(phasesDir, 'final_review', null);

    const content = fs.readFileSync(path.join(phasesDir, 'final_review.md'), 'utf8');
    assert.ok(content.includes('— COMPLETED'), 'final_review should be COMPLETED');
  });
});
