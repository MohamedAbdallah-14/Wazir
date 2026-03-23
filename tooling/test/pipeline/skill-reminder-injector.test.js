import { describe, test } from 'node:test';
import assert from 'node:assert';

let injectReminders;

const REMINDER = '<!-- PIPELINE: Check .wazir/runs/latest/phases/ for your current phase. Complete all items before proceeding. -->';

describe('skill-reminder-injector', () => {
  test('setup: import', async () => {
    const mod = await import('../../src/pipeline/skill-reminder-injector.js');
    injectReminders = mod.injectReminders;
    assert.ok(injectReminders);
  });

  test('adds 3 reminders at start, middle, end', async () => {
    if (!injectReminders) return;
    const input = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\n';
    const result = injectReminders(input);
    const count = (result.match(/<!-- PIPELINE:/g) || []).length;
    assert.strictEqual(count, 3, `Expected 3 reminders, got ${count}`);
  });

  test('idempotent — running twice produces same result', async () => {
    if (!injectReminders) return;
    const input = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\n';
    const first = injectReminders(input);
    const second = injectReminders(first);
    assert.strictEqual(first, second, 'Running twice should produce identical output');

    const count = (second.match(/<!-- PIPELINE:/g) || []).length;
    assert.strictEqual(count, 3, `Still 3 reminders after second run`);
  });

  test('middle reminder is within 10% of file midpoint', async () => {
    if (!injectReminders) return;
    const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join('\n') + '\n';
    const result = injectReminders(lines);
    const resultLines = result.split('\n');
    const midIdx = resultLines.findIndex((l, i) => i > 0 && l.includes('<!-- PIPELINE:'));
    const midPercent = midIdx / resultLines.length;
    assert.ok(midPercent > 0.4 && midPercent < 0.6, `Middle reminder at ${(midPercent * 100).toFixed(1)}% — should be 40-60%`);
  });

  test('handles short files gracefully', async () => {
    if (!injectReminders) return;
    const input = 'Short file\n';
    const result = injectReminders(input);
    const count = (result.match(/<!-- PIPELINE:/g) || []).length;
    assert.strictEqual(count, 3, 'Even short files get 3 reminders');
  });
});
