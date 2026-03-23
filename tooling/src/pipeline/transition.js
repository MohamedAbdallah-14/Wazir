/**
 * Phase transition validation and header updates.
 *
 * Validates checklist items before allowing phase transitions.
 * Uses semantic <!-- transition --> marker to identify the transition item.
 */

import fs from 'node:fs';
import path from 'node:path';

const TRANSITION_MARKER = '<!-- transition -->';
const CHECKED_ITEM = /^- \[x\]/i;
const UNCHECKED_ITEM = /^- \[ \]/;

/**
 * Validate that all non-transition items are checked before allowing transition.
 * Auto-completes the transition item on success.
 *
 * @param {string} phasesDir - Path to phases/ directory
 * @param {string} currentPhase - Current phase name
 * @param {string} nextPhase - Next phase name
 * @returns {{ valid: boolean, unchecked?: string[] }}
 */
export function validatePhaseTransition(phasesDir, currentPhase, nextPhase) {
  const filePath = path.join(phasesDir, `${currentPhase}.md`);
  if (!fs.existsSync(filePath)) {
    return { valid: false, unchecked: [`Phase file ${currentPhase}.md not found`] };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let inCodeBlock = false;
  const unchecked = [];

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    if (/^\s+- \[/.test(line)) continue; // skip sub-items

    if (UNCHECKED_ITEM.test(line)) {
      // Skip if this is the transition item
      if (line.includes(TRANSITION_MARKER)) continue;
      const text = line.replace(/^- \[ \]\s*/, '').replace(/\s*<!--.*-->/, '').trim();
      unchecked.push(text);
    }
  }

  if (unchecked.length > 0) {
    return { valid: false, unchecked };
  }

  // Auto-complete the transition item
  content = content.replace(
    /^(- \[ \].*<!-- transition -->)/m,
    (_match) => _match.replace('- [ ]', '- [x]'),
  );

  // Atomic write
  const tmpPath = filePath + '.tmp';
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, filePath);

  return { valid: true };
}

/**
 * Update phase headers after a valid transition.
 *
 * @param {string} phasesDir - Path to phases/ directory
 * @param {string} currentPhase - Phase being completed (→ COMPLETED)
 * @param {string|null} nextPhase - Phase being activated (→ ACTIVE), null for terminal
 */
export function updatePhaseHeaders(phasesDir, currentPhase, nextPhase) {
  // Mark current phase as COMPLETED
  const currentPath = path.join(phasesDir, `${currentPhase}.md`);
  if (fs.existsSync(currentPath)) {
    let content = fs.readFileSync(currentPath, 'utf8');
    content = content.replace(/— ACTIVE/, '— COMPLETED');
    const tmpPath = currentPath + '.tmp';
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, currentPath);
  }

  // Mark next phase as ACTIVE (if not terminal)
  if (nextPhase) {
    const nextPath = path.join(phasesDir, `${nextPhase}.md`);
    if (fs.existsSync(nextPath)) {
      let content = fs.readFileSync(nextPath, 'utf8');
      content = content.replace(/— NOT ACTIVE/, '— ACTIVE');
      // Remove redirect line if present
      content = content.replace(/\nThis phase has not started\..*\n?/, '\n');
      const tmpPath = nextPath + '.tmp';
      fs.writeFileSync(tmpPath, content, 'utf8');
      fs.renameSync(tmpPath, nextPath);
    }
  }
}
