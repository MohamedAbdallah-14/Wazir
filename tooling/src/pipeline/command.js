/**
 * Pipeline command family — dispatch entry point.
 *
 * Subcommands:
 *   pipeline init --run <id>  — render phase checklists from run-config
 */

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
      return runPipelineInit(runId, projectRoot, projectRoot);
    }
    default:
      return {
        exitCode: 1,
        stderr: 'Usage: wazir pipeline <init> ...\n',
      };
  }
}
