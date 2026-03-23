/**
 * Pipeline command family — dispatch entry point.
 *
 * Subcommands:
 *   pipeline init --run <id>  — render phase checklists from run-config
 */

import path from 'node:path';
import { findProjectRoot } from '../project-root.js';
import { runPipelineInit } from './init.js';

export function runPipelineCommand(parsed) {
  const projectRoot = findProjectRoot();

  switch (parsed.subcommand) {
    case 'init': {
      const runId = parsed.options?.run;
      if (!runId) {
        return {
          exitCode: 1,
          stderr: 'Usage: wazir pipeline init --run <id>\n',
        };
      }
      const templatesRoot = path.join(projectRoot, 'templates');
      return runPipelineInit(runId, projectRoot, templatesRoot);
    }
    default:
      return {
        exitCode: 1,
        stderr: 'Usage: wazir pipeline <init> ...\n',
      };
  }
}
