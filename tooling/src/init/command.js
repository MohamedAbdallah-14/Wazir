import fs from 'node:fs';
import path from 'node:path';

import { autoInit, isConfigCurrent } from './auto-detect.js';

/**
 * wazir init [--force]
 *
 * Default: creates config with sensible defaults (skill layer adds interactive questions)
 * --force: reinitialize even if already initialized
 */
export async function runInitCommand(parsed, context = {}) {
  const cwd = context.cwd ?? process.cwd();
  const wazirDir = path.join(cwd, '.wazir');
  const configPath = path.join(wazirDir, 'state', 'config.json');
  const isForce = parsed.args.includes('--force');

  // Already initialized check — with config version awareness
  if (fs.existsSync(configPath) && !isForce) {
    try {
      const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!isConfigCurrent(existing)) {
        return {
          exitCode: 1,
          stderr: 'Config format has changed. Run `wazir init --force` to reconfigure.\n',
        };
      }
    } catch {
      return {
        exitCode: 1,
        stderr: 'Config file is corrupt or unreadable. Run `wazir init --force` to reconfigure.\n',
      };
    }
    return {
      exitCode: 1,
      stderr: 'Pipeline already initialized. Use --force to reinitialize.\n',
    };
  }

  try {
    const result = autoInit(cwd, { context, force: isForce });

    // Auto-export for detected host
    let exportNote = '';
    try {
      const { buildHostExports } = await import('../export/compiler.js');
      buildHostExports(cwd);
      exportNote = `  Exports:     generated for ${result.host.host}\n`;
    } catch {
      exportNote = '  Exports:     skipped (run `wazir export build` manually)\n';
    }

    const lines = [
      '',
      'Wazir initialized.',
      '',
      `  Host:        ${result.host.host} (${result.host.confidence} confidence)`,
      `  Stack:       ${result.stack.language}${result.stack.framework ? ` / ${result.stack.framework}` : ''}`,
      `  Mode:        ${result.config.model_mode}`,
      `  Interaction: ${result.config.interaction_mode}`,
      exportNote,
      'Files created:',
      ...result.filesCreated.map((f) => `  - ${f}`),
      '',
      'Next: /wazir <what you want to build>',
      '',
      'Reconfigure: wazir init --force',
      '',
    ];

    return { exitCode: 0, stdout: lines.join('\n') };
  } catch (error) {
    return { exitCode: 1, stderr: `Init failed: ${error.message}\n` };
  }
}
