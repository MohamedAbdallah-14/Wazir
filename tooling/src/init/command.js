import fs from 'node:fs';
import path from 'node:path';

import { autoInit, detectHost, detectProjectStack } from './auto-detect.js';

/**
 * wazir init [--auto|--force]
 *
 * Default: --auto (zero-config, no prompts, infer everything)
 * --force: reinitialize even if already initialized
 */
export async function runInitCommand(parsed, context = {}) {
  const cwd = context.cwd ?? process.cwd();
  const wazirDir = path.join(cwd, '.wazir');
  const configPath = path.join(wazirDir, 'state', 'config.json');
  const isForce = parsed.args.includes('--force');

  // Already initialized check
  if (fs.existsSync(configPath) && !isForce) {
    return {
      exitCode: 1,
      stderr: 'Pipeline already initialized. Use --force to reinitialize.\n',
    };
  }

  // Auto mode — zero-config
  try {
    const result = autoInit(cwd, { context, force: isForce });

    if (result.alreadyInitialized && !isForce) {
      return {
        exitCode: 0,
        stdout: `Already initialized. Host: ${result.host.host}, Stack: ${result.stack.language}\n`,
      };
    }

    // Auto-export for detected host
    let exportNote = '';
    try {
      const { buildHostExports } = await import('../export/compiler.js');
      buildHostExports(cwd);
      exportNote = `  Exports: generated for ${result.host.host}\n`;
    } catch {
      exportNote = '  Exports: skipped (run `wazir export build` manually)\n';
    }

    const lines = [
      '',
      'Wazir initialized (zero-config).',
      '',
      `  Host:    ${result.host.host} (${result.host.confidence} confidence)`,
      `  Stack:   ${result.stack.language}${result.stack.framework ? ` / ${result.stack.framework}` : ''}`,
      `  Mode:    ${result.config.model_mode}`,
      `  Depth:   ${result.config.default_depth}`,
      exportNote,
      'Files created:',
      ...result.filesCreated.map((f) => `  - ${f}`),
      '',
      'Next: /wazir <what you want to build>',
      '',
      'Override: `wazir config set model_mode multi-tool`',
      '',
    ];

    return { exitCode: 0, stdout: lines.join('\n') };
  } catch (error) {
    return { exitCode: 1, stderr: `Auto-init failed: ${error.message}\n` };
  }
}
