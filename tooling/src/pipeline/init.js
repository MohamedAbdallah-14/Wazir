/**
 * Pipeline init command — renders phase file checklists from run-config workflow_policy.
 *
 * Called after `wazir capture init` creates minimal phase files.
 * Reads run-config.yaml, applies template renderer to non-init phase files.
 */

import fs from 'node:fs';
import path from 'node:path';

import { renderTemplate } from './template-renderer.js';
import { readYamlFile } from '../loaders.js';

const NON_INIT_PHASES = ['clarifier', 'executor', 'final_review'];

/**
 * Render phase file checklists from templates using workflow_policy.
 *
 * @param {string} runId - Run ID
 * @param {string} projectRoot - Project root directory
 * @param {string} templatesRoot - Root for finding templates (usually same as projectRoot)
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 */
export function runPipelineInit(runId, projectRoot, templatesRoot) {
  const runDir = path.join(projectRoot, '.wazir', 'runs', runId);
  const phasesDir = path.join(runDir, 'phases');
  const configPath = path.join(runDir, 'run-config.yaml');

  if (!fs.existsSync(configPath)) {
    return {
      exitCode: 1,
      stdout: '',
      stderr: `run-config.yaml not found at ${configPath}. Run \`wazir capture init\` first.\n`,
    };
  }

  const runConfig = readYamlFile(configPath);
  const workflowPolicy = runConfig.workflow_policy ?? {};
  const templatesDir = path.join(templatesRoot, 'templates', 'phases');

  for (const phase of NON_INIT_PHASES) {
    const templatePath = path.join(templatesDir, `${phase}.md`);
    if (!fs.existsSync(templatePath)) {
      continue;
    }

    const template = fs.readFileSync(templatePath, 'utf8');
    let rendered = renderTemplate(template, workflowPolicy, runId);

    // Preserve NOT ACTIVE header from the existing phase file
    const existingPath = path.join(phasesDir, `${phase}.md`);
    if (fs.existsSync(existingPath)) {
      const existing = fs.readFileSync(existingPath, 'utf8');
      const headerMatch = existing.match(/^## Phase: \w+ — (ACTIVE|NOT ACTIVE|COMPLETED)/m);
      if (headerMatch) {
        rendered = rendered.replace(
          /^## Phase: \w+/m,
          `## Phase: ${phase} — ${headerMatch[1]}`,
        );

        // If NOT ACTIVE, add redirect line
        if (headerMatch[1] === 'NOT ACTIVE') {
          rendered = rendered.replace(
            `## Phase: ${phase} — NOT ACTIVE`,
            `## Phase: ${phase} — NOT ACTIVE\nThis phase has not started.`,
          );
        }
      }
    }

    // Atomic write
    const tmpPath = existingPath + '.tmp';
    fs.writeFileSync(tmpPath, rendered, 'utf8');
    fs.renameSync(tmpPath, existingPath);
  }

  return {
    exitCode: 0,
    stdout: `Phase checklists rendered for run ${runId}.\n`,
    stderr: '',
  };
}
