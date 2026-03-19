import fs from 'node:fs';
import path from 'node:path';

import { autoInit, detectHost, detectProjectStack } from './auto-detect.js';

/**
 * wazir init [--auto|--interactive|--force]
 *
 * Default: --auto (zero-config, no prompts, infer everything)
 * --interactive: legacy mode with @inquirer/prompts (may fail in non-TTY)
 * --force: reinitialize even if already initialized
 */
export async function runInitCommand(parsed, context = {}) {
  const cwd = context.cwd ?? process.cwd();
  const wazirDir = path.join(cwd, '.wazir');
  const configPath = path.join(wazirDir, 'state', 'config.json');
  const isForce = parsed.args.includes('--force');
  const isInteractive = parsed.args.includes('--interactive');

  // Already initialized check
  if (fs.existsSync(configPath) && !isForce) {
    return {
      exitCode: 1,
      stderr: 'Pipeline already initialized. Use --force to reinitialize.\n',
    };
  }

  // Interactive mode — legacy prompts (may fail in non-TTY environments like Claude Code)
  if (isInteractive) {
    return runInteractiveInit(parsed, context);
  }

  // Default: auto mode — zero-config
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
      'Power users: `wazir init --interactive` for manual config.',
      'Override:    `wazir config set model_mode multi-tool`',
      '',
    ];

    return { exitCode: 0, stdout: lines.join('\n') };
  } catch (error) {
    return { exitCode: 1, stderr: `Auto-init failed: ${error.message}\n` };
  }
}

/**
 * Legacy interactive init with @inquirer/prompts.
 * Kept for power users who want manual control.
 * Will fail in non-TTY environments (Claude Code Bash tool).
 */
async function runInteractiveInit(parsed, context = {}) {
  const cwd = context.cwd ?? process.cwd();
  const wazirDir = path.join(cwd, '.wazir');
  const configPath = path.join(wazirDir, 'state', 'config.json');

  try {
    const { select } = await import('@inquirer/prompts');

    for (const dir of ['input', 'state', 'runs']) {
      fs.mkdirSync(path.join(wazirDir, dir), { recursive: true });
    }

    const modelMode = await select({
      message: 'How should Wazir run in this project?',
      choices: [
        { name: 'Single model (Recommended)', value: 'claude-only' },
        { name: 'Multi-model (Haiku/Sonnet/Opus routing)', value: 'multi-model' },
        { name: 'Multi-tool (current model + external reviewers)', value: 'multi-tool' },
      ],
      default: 'claude-only',
    });

    let multiToolTools = [];
    if (modelMode === 'multi-tool') {
      const toolChoice = await select({
        message: 'Which external tools for reviews?',
        choices: [
          { name: 'Codex', value: 'codex' },
          { name: 'Gemini', value: 'gemini' },
          { name: 'Both', value: 'both' },
        ],
      });
      multiToolTools = toolChoice === 'both' ? ['codex', 'gemini'] : [toolChoice];
    }

    let codexModel = null;
    if (multiToolTools.includes('codex')) {
      codexModel = await select({
        message: 'Codex model?',
        choices: [
          { name: 'gpt-5.3-codex-spark (Recommended)', value: 'gpt-5.3-codex-spark' },
          { name: 'gpt-5.4', value: 'gpt-5.4' },
        ],
        default: 'gpt-5.3-codex-spark',
      });
    }

    const host = detectHost();
    const stack = detectProjectStack(cwd);

    const config = {
      model_mode: modelMode,
      ...(modelMode === 'multi-tool' && {
        multi_tool: {
          tools: multiToolTools,
          ...(codexModel && { codex: { model: codexModel } }),
        },
      }),
      default_depth: 'standard',
      default_intent: 'feature',
      team_mode: 'sequential',
      parallel_backend: 'none',
      detected_host: host.host,
      detected_stack: stack,
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    return {
      exitCode: 0,
      stdout: `\nInitialized (${modelMode}). Host: ${host.host}. Next: /wazir <request>\n`,
    };
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      return { exitCode: 130, stderr: '\nInit cancelled.\n' };
    }
    return { exitCode: 1, stderr: `${error.message}\n` };
  }
}
