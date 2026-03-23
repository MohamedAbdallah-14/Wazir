/**
 * Phase file creation and symlink management.
 *
 * Creates markdown phase files from templates during `wazir capture init`.
 * Phase files are the enforcement state — hooks read them, not a JSON state file.
 */

import fs from 'node:fs';
import path from 'node:path';

const PHASES = ['init', 'clarifier', 'executor', 'final_review'];

/**
 * Get run paths under the repo-local .wazir directory.
 * Mirrors the shape of getRunPaths() from capture/store.js but rooted at projectRoot/.wazir/.
 *
 * @param {string} projectRoot
 * @param {string} runId
 * @returns {{ runRoot: string }}
 */
export function getRepoLocalRunPaths(projectRoot, runId) {
  const runRoot = path.join(projectRoot, '.wazir', 'runs', runId);
  return { runRoot };
}

/**
 * Create phase files in the run directory from templates.
 *
 * - init.md gets "— ACTIVE" header
 * - All others get "— NOT ACTIVE" header
 * - Log files created with empty headers
 * - Uses atomic writes (write to .tmp, rename)
 *
 * @param {string} runDir - Path to the run directory (e.g., .wazir/runs/run-YYYYMMDD-HHMMSS)
 * @param {string} projectRoot - Project root for finding templates
 */
export function createPhaseFiles(runDir, projectRoot) {
  const phasesDir = path.join(runDir, 'phases');
  fs.mkdirSync(phasesDir, { recursive: true });

  const templatesDir = path.join(projectRoot, 'templates', 'phases');

  for (const phase of PHASES) {
    // Read template
    const templatePath = path.join(templatesDir, `${phase}.md`);
    let content;
    if (fs.existsSync(templatePath)) {
      content = fs.readFileSync(templatePath, 'utf8');
    } else {
      // Fallback: minimal template if file missing
      content = `## Phase: ${phase}\n- [ ] Complete phase\n- [ ] Transition <!-- transition -->\n`;
    }

    // Strip mustache markers — keep all content, assume all workflows enabled.
    // wazir pipeline init will re-render with run-config later.
    content = content.replace(/\{\{#workflow\.\w+\}\}\n?/g, '');
    content = content.replace(/\{\{\/workflow\.\w+\}\}\n?/g, '');

    // Set header based on active state
    if (phase === 'init') {
      // Replace template header with ACTIVE header
      content = content.replace(
        /^## Phase: \w+/m,
        `## Phase: ${phase} — ACTIVE`,
      );
    } else {
      // Replace template header with NOT ACTIVE header + redirect
      const header = `## Phase: ${phase} — NOT ACTIVE\nThis phase has not started. Current phase: init.`;
      content = content.replace(
        /^## Phase: \w+/m,
        header,
      );
    }

    // Atomic write: write to .tmp, then rename
    const filePath = path.join(phasesDir, `${phase}.md`);
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);

    // Create log file
    const logContent = `## Phase: ${phase} — Log\n`;
    const logPath = path.join(phasesDir, `${phase}.log.md`);
    const logTmpPath = logPath + '.tmp';
    fs.writeFileSync(logTmpPath, logContent, 'utf8');
    fs.renameSync(logTmpPath, logPath);
  }
}

/**
 * Create repo-local symlink: .wazir/runs/latest -> <runId>
 *
 * This is IN ADDITION to the state-root latest pointer.
 * Hooks read from repo-local .wazir/runs/latest/phases/.
 *
 * @param {string} projectRoot - Project root directory
 * @param {string} runId - Run ID (directory name, not full path)
 */
export function createRepoLocalSymlink(projectRoot, runId) {
  const runsDir = path.join(projectRoot, '.wazir', 'runs');
  const latestPath = path.join(runsDir, 'latest');

  // Remove existing symlink/file if present
  try {
    fs.unlinkSync(latestPath);
  } catch {
    // Doesn't exist — fine
  }

  // Create relative symlink
  fs.symlinkSync(runId, latestPath);
}
