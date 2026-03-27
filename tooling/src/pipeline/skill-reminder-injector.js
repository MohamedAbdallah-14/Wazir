/**
 * Skill file reminder injector — Layer 2 enforcement.
 *
 * Injects 3 varied pipeline reminders (start, middle, end) into skill files.
 * Covers primacy, middle, and recency attention zones per "Lost in the Middle" research.
 * Each position draws from a pool of human-sounding variants — no two files
 * get the same combination unless the pool is exhausted.
 * Idempotent — re-running does not duplicate reminders.
 */

import { START_VARIANTS, MID_VARIANTS, END_VARIANTS, ALL_VARIANTS } from './enforcement-variants.js';

if (!START_VARIANTS.length || !MID_VARIANTS.length || !END_VARIANTS.length) {
  throw new Error('Enforcement variant pools must not be empty');
}

/**
 * Simple deterministic hash of a string → unsigned 32-bit integer.
 * Used to pick variant indices per-file so the result is stable across runs.
 */
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h >>> 0; // unsigned
}

/**
 * Check whether a line is a known enforcement variant (old or new).
 */
function isReminderLine(line) {
  const trimmed = line.trim();
  if (trimmed.includes('<!-- PIPELINE:')) return true;
  return ALL_VARIANTS.some(v => trimmed === v);
}

/**
 * Inject 3 varied pipeline reminders into a skill file content string.
 *
 * @param {string} content - Skill file content
 * @param {string} [filename=''] - Filename used to deterministically pick variants
 * @returns {string} Content with 3 reminders at start, middle, end
 */
export function injectReminders(content, filename = '') {
  // Remove existing reminders first (idempotent)
  const lines = content.split('\n').filter(l => !isReminderLine(l));

  // Pick variants deterministically from filename
  const h = hash(filename);
  const start = START_VARIANTS[h % START_VARIANTS.length];
  const mid = MID_VARIANTS[(h >>> 4) % MID_VARIANTS.length];
  const end = END_VARIANTS[(h >>> 8) % END_VARIANTS.length];

  if (lines.length === 0) {
    return `${start}\n${mid}\n${end}\n`;
  }

  // Find end of YAML frontmatter (--- ... ---) to avoid breaking it
  let insertStart = 0;
  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        insertStart = i + 1;
        break;
      }
    }
  }

  // Calculate middle position (~50% of content after frontmatter).
  // Nudge away from code blocks, list items, and table rows to avoid breaking structure.
  const contentLength = lines.length - insertStart;
  let midIdx = insertStart + Math.round(contentLength / 2);
  const isStructuralLine = (l) => /^(\s*([-*+]|\d+\.)\s|```|^\||\s{4,}\S)/.test(l);
  // Search up to 10 lines in each direction for a safe insertion point
  for (let offset = 0; offset <= 10; offset++) {
    if (midIdx + offset < lines.length && !isStructuralLine(lines[midIdx + offset])) {
      midIdx = midIdx + offset;
      break;
    }
    if (midIdx - offset >= insertStart && !isStructuralLine(lines[midIdx - offset])) {
      midIdx = midIdx - offset;
      break;
    }
  }

  // Insert reminders: end first (so indices don't shift), then middle, then after frontmatter
  lines.push(end);
  lines.splice(midIdx, 0, mid);
  lines.splice(insertStart, 0, start);

  return lines.join('\n');
}
