/**
 * Phase injector — shared core logic for pipeline enforcement hooks.
 *
 * Used by:
 *   - hooks/pipeline-phase-injector (PreToolUse)
 *   - hooks/session-start (SessionStart)
 *   - hooks/stop-pipeline-gate (Stop)
 *   - tooling/src/capture/command.js (transition validation)
 */

import fs from 'node:fs';
import path from 'node:path';

const ACTIVE_HEADER = /^## Phase:\s*(\w+)\s*—\s*ACTIVE$/m;
const CHECKED_ITEM = /^- \[x\]/i;

/** Strip inline HTML comments without regex (avoids CodeQL js/bad-tag-filter). */
function stripComment(str) {
  const start = str.indexOf('<!--');
  if (start === -1) return str.trim();
  return str.slice(0, start).trim();
}
const UNCHECKED_ITEM = /^- \[ \]/;

/**
 * Find the active phase from phase files in a directory.
 *
 * @param {string} phasesDir - Path to the phases/ directory
 * @returns {{ phase: string, content: string } | null}
 */
export function findActivePhase(phasesDir) {
  let files;
  try {
    files = fs.readdirSync(phasesDir).filter(f => f.endsWith('.md') && !f.includes('.log.'));
  } catch {
    return null; // Directory doesn't exist
  }

  for (const file of files) {
    const content = fs.readFileSync(path.join(phasesDir, file), 'utf8');
    const match = content.match(ACTIVE_HEADER);
    if (match) {
      return { phase: match[1], content };
    }
  }

  return null;
}

/**
 * Extract the current unchecked step from phase file content.
 * Respects parser contract: ignores sub-items (indented), fenced code blocks.
 *
 * @param {string} content - Phase file content
 * @returns {{ current: string, next: string|null, stepNum: number, totalSteps: number } | null}
 */
export function extractCurrentStep(content) {
  const lines = content.split('\n');
  let inCodeBlock = false;
  const items = [];
  let firstUncheckedIdx = -1;

  for (const line of lines) {
    // Track fenced code blocks
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Skip indented sub-items (lines starting with spaces before the dash)
    if (/^\s+- \[/.test(line)) continue;

    if (CHECKED_ITEM.test(line)) {
      items.push({ text: stripComment(line.replace(/^- \[x\]\s*/i, '')), checked: true });
    } else if (UNCHECKED_ITEM.test(line)) {
      const text = stripComment(line.replace(/^- \[ \]\s*/, ''));
      items.push({ text, checked: false });
      if (firstUncheckedIdx === -1) {
        firstUncheckedIdx = items.length - 1;
      }
    }
  }

  if (firstUncheckedIdx === -1) return null; // All checked

  const current = items[firstUncheckedIdx].text;
  const nextIdx = items.findIndex((item, i) => i > firstUncheckedIdx && !item.checked);
  const next = nextIdx !== -1 ? items[nextIdx].text : null;

  return {
    current,
    next,
    stepNum: firstUncheckedIdx + 1,
    totalSteps: items.length,
  };
}

/**
 * Format the injection JSON for PreToolUse systemMessage.
 *
 * @param {string} phase - Phase name
 * @param {string} currentStep - Current step text
 * @param {string|null} nextStep - Next step text (or null if last)
 * @param {number} stepNum - Current step number
 * @param {number} totalSteps - Total steps in phase
 * @returns {string} JSON string
 */
export function formatInjection(phase, currentStep, nextStep, stepNum, totalSteps) {
  let msg = `CURRENT: ${currentStep} (${phase} phase, step ${stepNum} of ${totalSteps})`;
  if (nextStep) {
    msg += `\nNEXT: ${nextStep}`;
  } else {
    msg += '\nNEXT: (last step)';
  }
  return JSON.stringify({ systemMessage: msg });
}
