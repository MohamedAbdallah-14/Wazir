import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { select } from '@inquirer/prompts';

export async function runInitCommand(parsed, context = {}) {
  const cwd = context.cwd ?? process.cwd();
  const wazirDir = path.join(cwd, '.wazir');
  const configPath = path.join(wazirDir, 'state', 'config.json');

  if (fs.existsSync(configPath) && !parsed.args.includes('--force')) {
    return {
      exitCode: 1,
      stderr: 'Pipeline already initialized. Use --force to reinitialize.\n',
    };
  }

  try {
    // Create directories
    for (const dir of ['input', 'state', 'runs']) {
      fs.mkdirSync(path.join(wazirDir, dir), { recursive: true });
    }

    // Pipeline mode
    const modelMode = await select({
      message: 'How should Wazir run in this project?',
      choices: [
        { name: 'Single model (Recommended) — slash commands only', value: 'claude-only' },
        { name: 'Multi-model — routes by complexity (Haiku/Sonnet/Opus)', value: 'multi-model' },
        { name: 'Multi-tool — current model + external tools for reviews', value: 'multi-tool' },
      ],
      default: 'claude-only',
    });

    // Multi-tool tools (conditional)
    let multiToolTools = [];
    if (modelMode === 'multi-tool') {
      const toolChoice = await select({
        message: 'Which external tools should Wazir use for reviews?',
        choices: [
          { name: 'Codex — Send reviews to OpenAI Codex', value: 'codex' },
          { name: 'Gemini — Send reviews to Google Gemini', value: 'gemini' },
          { name: 'Both — Use Codex and Gemini', value: 'both' },
        ],
      });
      multiToolTools = toolChoice === 'both' ? ['codex', 'gemini'] : [toolChoice];
    }

    // Codex model (conditional)
    let codexModel = null;
    if (multiToolTools.includes('codex')) {
      codexModel = await select({
        message: 'Which Codex model should Wazir use?',
        choices: [
          { name: 'gpt-5.3-codex-spark (Recommended) — fast, good for review loops', value: 'gpt-5.3-codex-spark' },
          { name: 'gpt-5.4 — slower, deeper analysis for complex reviews', value: 'gpt-5.4' },
        ],
        default: 'gpt-5.3-codex-spark',
      });
    }

    // Default depth
    const defaultDepth = await select({
      message: 'What default depth should runs use?',
      choices: [
        { name: 'Quick — minimal research, single-pass review', value: 'quick' },
        { name: 'Standard (Recommended) — balanced research, multi-pass hardening', value: 'standard' },
        { name: 'Deep — extended research, strict review thresholds', value: 'deep' },
      ],
      default: 'standard',
    });

    // Default intent
    const defaultIntent = await select({
      message: 'What kind of work does this project mostly involve?',
      choices: [
        { name: 'Feature (Recommended) — new functionality or enhancement', value: 'feature' },
        { name: 'Bugfix — fix broken behavior', value: 'bugfix' },
        { name: 'Refactor — restructure without changing behavior', value: 'refactor' },
        { name: 'Docs — documentation only', value: 'docs' },
        { name: 'Spike — research and exploration', value: 'spike' },
      ],
      default: 'feature',
    });

    // Team mode is always sequential (Agent Teams removed — too much overhead)
    const teamMode = 'sequential';
    const parallelBackend = 'none';

    // Detect context-mode MCP (silent — no user prompt)
    // Two detection paths:
    // 1. When called from a host (Claude Code), context.availableTools is populated
    // 2. When called from CLI, probe for the plugin cache directory
    const contextMode = { enabled: false, has_execute_file: false };
    if (context.availableTools) {
      const prefix = 'mcp__plugin_context-mode_context-mode__';
      const hasExecute = context.availableTools.includes(`${prefix}execute`);
      const hasFetchAndIndex = context.availableTools.includes(`${prefix}fetch_and_index`);
      const hasSearch = context.availableTools.includes(`${prefix}search`);
      const hasExecuteFile = context.availableTools.includes(`${prefix}execute_file`);
      if (hasExecute && hasFetchAndIndex && hasSearch) {
        contextMode.enabled = true;
        contextMode.has_execute_file = hasExecuteFile;
      }
    } else {
      // CLI fallback: check if context-mode plugin is installed
      const pluginDir = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'context-mode');
      if (fs.existsSync(pluginDir)) {
        contextMode.enabled = true;
        contextMode.has_execute_file = true;
      }
    }

    // Write config
    const config = {
      model_mode: modelMode,
      ...(modelMode === 'multi-tool' && {
        multi_tool: {
          tools: multiToolTools,
          ...(codexModel && { codex: { model: codexModel } }),
        },
      }),
      default_depth: defaultDepth,
      default_intent: defaultIntent,
      team_mode: teamMode,
      parallel_backend: parallelBackend,
      context_mode: contextMode,
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    // Runtime-specific setup
    const filesCreated = ['.wazir/input/', '.wazir/state/', '.wazir/runs/', '.wazir/state/config.json'];

    if (multiToolTools.includes('codex')) {
      const content = [
        '# Wazir Pipeline',
        '',
        'Agent protocols are at `~/.claude/agents/` (global).',
        '',
        '## Running the Pipeline',
        '1. Clarifier: read and follow `~/.claude/agents/clarifier.md` — tasks are in `.wazir/input/`',
        '2. Orchestrator: read and follow `~/.claude/agents/orchestrator.md` — start from task 1',
        '3. Opus Reviewer: read and follow `~/.claude/agents/opus-reviewer.md` — run all phases',
        '',
        '## Review Mode',
        'This project uses Codex as a secondary reviewer. Review artifacts are in `.wazir/reviews/`.',
        '',
      ].join('\n');
      fs.writeFileSync(path.join(cwd, 'AGENTS.md'), content);
      filesCreated.push('AGENTS.md');
    }

    if (multiToolTools.includes('gemini')) {
      const content = [
        '# Wazir Pipeline',
        '',
        'Agent protocols are at `~/.claude/agents/` (global).',
        '',
        '## Running the Pipeline',
        '1. Clarifier: read and follow `~/.claude/agents/clarifier.md` — tasks are in `.wazir/input/`',
        '2. Orchestrator: read and follow `~/.claude/agents/orchestrator.md` — start from task 1',
        '3. Opus Reviewer: read and follow `~/.claude/agents/opus-reviewer.md` — run all phases',
        '',
        '## Review Mode',
        'This project uses Gemini as a secondary reviewer. Review artifacts are in `.wazir/reviews/`.',
        '',
      ].join('\n');
      fs.writeFileSync(path.join(cwd, 'GEMINI.md'), content);
      filesCreated.push('GEMINI.md');
    }

    const lines = [
      '',
      '\u2705 Pipeline initialized!',
      '',
      `  Mode:    ${modelMode}`,
      `  Depth:   ${defaultDepth}`,
      `  Intent:  ${defaultIntent}`,
      `  Teams:   ${teamMode}`,
      '',
      'Files created:',
      ...filesCreated.map((f) => `  - ${f}`),
      '',
      'You can now use:',
      '  /wazir <your request>  \u2014 Run the full pipeline',
      '  /clarifier             \u2014 Research, clarify, plan',
      '  /executor              \u2014 Autonomous execution',
      '  /reviewer              \u2014 Final review and scoring',
      '',
    ];

    return {
      exitCode: 0,
      stdout: lines.join('\n'),
    };
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      return { exitCode: 130, stderr: '\nInit cancelled.\n' };
    }
    return { exitCode: 1, stderr: `${error.message}\n` };
  }
}
