/**
 * Skill file reminder injector — Layer 2 enforcement.
 *
 * Injects 3 pipeline reminders (start, middle, end) into skill files.
 * Covers primacy, middle, and recency attention zones per "Lost in the Middle" research.
 * Idempotent — re-running does not duplicate reminders.
 */

const REMINDER = '<!-- PIPELINE: Please try 100% compliance with Wazir pipeline and skill usage. If anything can be done by a wz: skill, use the skill. Follow your current phase checklist at .wazir/runs/latest/phases/ please. -->';

/**
 * Inject 3 pipeline reminders into a skill file content string.
 *
 * @param {string} content - Skill file content
 * @returns {string} Content with 3 reminders at start, middle, end
 */
export function injectReminders(content) {
  // Remove existing reminders first (idempotent)
  const lines = content.split('\n').filter(l => !l.includes('<!-- PIPELINE:'));

  if (lines.length === 0) {
    return `${REMINDER}\n${REMINDER}\n${REMINDER}\n`;
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

  // Calculate middle position (~50% of content after frontmatter)
  const contentLength = lines.length - insertStart;
  const midIdx = insertStart + Math.round(contentLength / 2);

  // Insert reminders: end first (so indices don't shift), then middle, then after frontmatter
  lines.push(REMINDER);
  lines.splice(midIdx, 0, REMINDER);
  lines.splice(insertStart, 0, REMINDER);

  return lines.join('\n');
}
