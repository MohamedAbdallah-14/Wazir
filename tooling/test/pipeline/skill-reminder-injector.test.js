import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

let injectReminders;
let ALL_VARIANTS;

describe('skill-reminder-injector', () => {
  test('setup: import', async () => {
    const mod = await import('../../src/pipeline/skill-reminder-injector.js');
    injectReminders = mod.injectReminders;
    assert.ok(injectReminders);

    const variants = await import('../../src/pipeline/enforcement-variants.js');
    ALL_VARIANTS = variants.ALL_VARIANTS;
    assert.ok(ALL_VARIANTS.length >= 30, `Expected at least 30 variants, got ${ALL_VARIANTS.length}`);
  });

  test('adds 3 reminders at start, middle, end', async () => {
    if (!injectReminders) return;
    const input = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\n';
    const result = injectReminders(input, 'test-skill.md');
    const matches = ALL_VARIANTS.filter(v => result.includes(v));
    assert.strictEqual(matches.length, 3, `Expected 3 reminders, got ${matches.length}`);
  });

  test('idempotent — running twice produces same result', async () => {
    if (!injectReminders) return;
    const input = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\n';
    const first = injectReminders(input, 'idem-test.md');
    const second = injectReminders(first, 'idem-test.md');
    assert.strictEqual(first, second, 'Running twice should produce identical output');

    const matches = ALL_VARIANTS.filter(v => second.includes(v));
    assert.strictEqual(matches.length, 3, `Still 3 reminders after second run`);
  });

  test('deterministic — same filename always picks same variants', async () => {
    if (!injectReminders) return;
    const input = 'Line 1\nLine 2\nLine 3\nLine 4\n';
    const a = injectReminders(input, 'brainstorming/SKILL.md');
    const b = injectReminders(input, 'brainstorming/SKILL.md');
    assert.strictEqual(a, b, 'Same filename should produce same variants');
  });

  test('different filenames get different variant combinations', async () => {
    if (!injectReminders) return;
    const input = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n') + '\n';
    const files = ['tdd/SKILL.md', 'debugging/SKILL.md', 'brainstorming/SKILL.md', 'executor/SKILL.md', 'clarifier/SKILL.md'];
    const results = files.map(f => injectReminders(input, f));
    const uniqueResults = new Set(results);
    assert.ok(uniqueResults.size >= 3, `Expected at least 3 unique results from 5 files, got ${uniqueResults.size}`);
  });

  test('middle reminder is within 15% of file midpoint', async () => {
    if (!injectReminders) return;
    const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join('\n') + '\n';
    const result = injectReminders(lines, 'midpoint-test.md');
    const resultLines = result.split('\n');
    const midIdx = resultLines.findIndex((l, i) => i > 0 && ALL_VARIANTS.some(v => l.trim() === v));
    const midPercent = midIdx / resultLines.length;
    assert.ok(midPercent > 0.35 && midPercent < 0.65, `Middle reminder at ${(midPercent * 100).toFixed(1)}% — should be 35-65%`);
  });

  test('handles short files gracefully', async () => {
    if (!injectReminders) return;
    const input = 'Short file\n';
    const result = injectReminders(input, 'short.md');
    const matches = ALL_VARIANTS.filter(v => result.includes(v));
    assert.strictEqual(matches.length, 3, 'Even short files get 3 reminders');
  });

  test('strips old HTML comment reminders', async () => {
    if (!injectReminders) return;
    const oldReminder = '<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. -->';
    const input = `${oldReminder}\nLine 1\nLine 2\n${oldReminder}\nLine 3\n${oldReminder}\n`;
    const result = injectReminders(input, 'strip-test.md');
    assert.ok(!result.includes('<!-- PIPELINE:'), 'Old HTML comment reminders should be stripped');
    const matches = ALL_VARIANTS.filter(v => result.includes(v));
    assert.strictEqual(matches.length, 3, 'Should have 3 new-style reminders');
  });

  test('preserves YAML frontmatter', async () => {
    if (!injectReminders) return;
    const input = '---\nname: test-skill\ndescription: A test\n---\n\nContent here\nMore content\n';
    const result = injectReminders(input, 'frontmatter-test.md');
    assert.ok(result.startsWith('---\nname: test-skill\ndescription: A test\n---\n'), 'Frontmatter should be preserved intact');
  });

  test('no variant appears as HTML comment', async () => {
    if (!ALL_VARIANTS) return;
    for (const v of ALL_VARIANTS) {
      assert.ok(!v.includes('<!--'), `Variant should not contain HTML comment: ${v.slice(0, 50)}...`);
    }
  });

  test('every variant ends with a question mark', async () => {
    if (!ALL_VARIANTS) return;
    for (const v of ALL_VARIANTS) {
      assert.ok(v.trim().endsWith('?'), `Variant should end with ?: ${v.slice(-50)}`);
    }
  });
});
