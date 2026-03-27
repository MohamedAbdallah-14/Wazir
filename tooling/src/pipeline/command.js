/**
 * Pipeline command family — dispatch entry point.
 *
 * Subcommands:
 *   pipeline init --run <id>  — render phase checklists from run-config
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findProjectRoot } from '../project-root.js';
import { runPipelineInit } from './init.js';

// Resolve the package root (where templates live) for user-project mode
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..', '..');

export function runPipelineCommand(parsed) {
  const projectRoot = findProjectRoot() ?? process.cwd();

  switch (parsed.subcommand) {
    case 'init': {
      const runId = parsed.options?.run;
      if (!runId) {
        return {
          exitCode: 1,
          stderr: 'Usage: wazir pipeline init --run <id>\n',
        };
      }
      // In user projects, templates come from the installed package, not from cwd
      const wazirRoot = findProjectRoot();
      const templatesRoot = path.join(wazirRoot ?? packageRoot, 'templates');
      return runPipelineInit(runId, projectRoot, templatesRoot);
    }
    default:
      return {
        exitCode: 1,
        stderr: 'Usage: wazir pipeline <init> ...\n',
      };
  }
}
