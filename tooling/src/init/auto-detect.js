import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Detect which AI host CLI is running this process.
 * Checks environment variables, process ancestry, and known file markers.
 *
 * @returns {{ host: string, confidence: string, signals: string[] }}
 */
export function detectHost() {
  const signals = [];

  // Claude Code detection
  if (process.env.CLAUDE_CODE || process.env.CLAUDE_CODE_ENTRYPOINT) {
    signals.push('CLAUDE_CODE env var');
    return { host: 'claude', confidence: 'high', signals };
  }
  if (fs.existsSync(path.join(os.homedir(), '.claude'))) {
    signals.push('~/.claude directory exists');
  }

  // Codex detection
  if (process.env.CODEX_CLI || process.env.OPENAI_API_KEY) {
    signals.push('CODEX_CLI or OPENAI_API_KEY env var');
  }
  if (process.env.CODEX_SANDBOX_MODE) {
    signals.push('CODEX_SANDBOX_MODE env var');
    return { host: 'codex', confidence: 'high', signals };
  }

  // Gemini detection
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) {
    signals.push('Gemini API key env var');
  }
  if (process.env.GEMINI_CLI) {
    signals.push('GEMINI_CLI env var');
    return { host: 'gemini', confidence: 'high', signals };
  }

  // Cursor detection
  if (process.env.CURSOR_SESSION || process.env.CURSOR_TRACE_ID) {
    signals.push('Cursor session env var');
    return { host: 'cursor', confidence: 'high', signals };
  }

  // Fallback: check for marker files
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, '.claude', 'settings.json'))) {
    signals.push('.claude/settings.json exists in project');
    return { host: 'claude', confidence: 'medium', signals };
  }
  if (fs.existsSync(path.join(cwd, 'AGENTS.md'))) {
    signals.push('AGENTS.md exists (Codex marker)');
    return { host: 'codex', confidence: 'medium', signals };
  }
  if (fs.existsSync(path.join(cwd, 'GEMINI.md'))) {
    signals.push('GEMINI.md exists (Gemini marker)');
    return { host: 'gemini', confidence: 'medium', signals };
  }
  if (fs.existsSync(path.join(cwd, '.cursorrules'))) {
    signals.push('.cursorrules exists (Cursor marker)');
    return { host: 'cursor', confidence: 'medium', signals };
  }

  // Default: assume Claude Code (most common)
  if (signals.includes('~/.claude directory exists')) {
    return { host: 'claude', confidence: 'low', signals };
  }

  return { host: 'claude', confidence: 'low', signals: ['no host detected, defaulting to claude'] };
}

/**
 * Auto-detect project stack from package files, config, and structure.
 *
 * @param {string} projectRoot
 * @returns {{ language: string, framework: string|null, stack: string[] }}
 */
export function detectProjectStack(projectRoot) {
  const stack = [];
  let language = 'unknown';
  let framework = null;

  // Node.js / JavaScript
  if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
    language = 'javascript';
    stack.push('node');

    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (allDeps.next) { framework = 'nextjs'; stack.push('next'); }
      else if (allDeps.react) { framework = 'react'; stack.push('react'); }
      else if (allDeps.vue) { framework = 'vue'; stack.push('vue'); }
      else if (allDeps.angular || allDeps['@angular/core']) { framework = 'angular'; stack.push('angular'); }
      else if (allDeps.express || allDeps.fastify || allDeps.koa) { framework = 'node-api'; stack.push('node-api'); }

      if (allDeps.typescript) { language = 'typescript'; stack.push('typescript'); }
    } catch { /* ignore parse errors */ }
  }

  // Python
  if (fs.existsSync(path.join(projectRoot, 'pyproject.toml')) ||
      fs.existsSync(path.join(projectRoot, 'requirements.txt')) ||
      fs.existsSync(path.join(projectRoot, 'setup.py'))) {
    language = 'python';
    stack.push('python');

    if (fs.existsSync(path.join(projectRoot, 'manage.py'))) { framework = 'django'; stack.push('django'); }
  }

  // Go
  if (fs.existsSync(path.join(projectRoot, 'go.mod'))) {
    language = 'go';
    stack.push('go');
  }

  // Rust
  if (fs.existsSync(path.join(projectRoot, 'Cargo.toml'))) {
    language = 'rust';
    stack.push('rust');
  }

  // Flutter / Dart
  if (fs.existsSync(path.join(projectRoot, 'pubspec.yaml'))) {
    language = 'dart';
    framework = 'flutter';
    stack.push('dart', 'flutter');
  }

  // Java
  if (fs.existsSync(path.join(projectRoot, 'pom.xml')) ||
      fs.existsSync(path.join(projectRoot, 'build.gradle'))) {
    language = 'java';
    stack.push('java');
  }

  return { language, framework, stack };
}

/**
 * Infer intent from request text using keyword matching.
 *
 * @param {string} requestText
 * @returns {string} One of: bugfix, refactor, docs, spike, feature
 */
export function inferIntent(requestText) {
  if (!requestText) return 'feature';
  const lower = requestText.toLowerCase();

  const patterns = [
    { keywords: ['fix', 'bug', 'broken', 'crash', 'error', 'issue', 'wrong'], intent: 'bugfix' },
    { keywords: ['refactor', 'clean', 'restructure', 'reorganize', 'rename', 'simplify'], intent: 'refactor' },
    { keywords: ['doc', 'document', 'readme', 'guide', 'explain'], intent: 'docs' },
    { keywords: ['research', 'spike', 'explore', 'investigate', 'prototype'], intent: 'spike' },
  ];

  for (const { keywords, intent } of patterns) {
    if (keywords.some((kw) => lower.includes(kw))) return intent;
  }

  return 'feature';
}

/**
 * Parse inline depth modifiers from request text.
 *
 * @param {string} requestText
 * @returns {{ depth: string, cleanedText: string }}
 */
export function parseDepthModifier(requestText) {
  if (!requestText) return { depth: 'standard', cleanedText: '' };

  const match = requestText.match(/^\s*(quick|deep)\s+/i);
  if (match) {
    return {
      depth: match[1].toLowerCase(),
      cleanedText: requestText.slice(match[0].length),
    };
  }

  return { depth: 'standard', cleanedText: requestText };
}

/**
 * Run zero-config auto-initialization.
 * Creates .wazir directories, detects host, scans project, writes config.
 * No interactive prompts — everything is inferred.
 *
 * @param {string} projectRoot
 * @param {object} [opts]
 * @param {object} [opts.context] - Runtime context (availableTools, etc.)
 * @param {boolean} [opts.force] - Force reinitialize even if config exists
 * @returns {{ config: object, host: object, stack: object, filesCreated: string[] }}
 */
export function autoInit(projectRoot, opts = {}) {
  const wazirDir = path.join(projectRoot, '.wazir');
  const configPath = path.join(wazirDir, 'state', 'config.json');

  // If already initialized and not forced, return existing config
  if (fs.existsSync(configPath) && !opts.force) {
    const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return {
      config: existing,
      host: detectHost(),
      stack: detectProjectStack(projectRoot),
      filesCreated: [],
      alreadyInitialized: true,
    };
  }

  // Create directories
  for (const dir of ['input', 'state', 'runs']) {
    fs.mkdirSync(path.join(wazirDir, dir), { recursive: true });
  }

  const host = detectHost();
  const stack = detectProjectStack(projectRoot);

  // Detect context-mode MCP
  const contextMode = { enabled: false, has_execute_file: false };
  if (opts.context?.availableTools) {
    const prefix = 'mcp__plugin_context-mode_context-mode__';
    const hasExecute = opts.context.availableTools.includes(`${prefix}execute`);
    const hasFetchAndIndex = opts.context.availableTools.includes(`${prefix}fetch_and_index`);
    const hasSearch = opts.context.availableTools.includes(`${prefix}search`);
    const hasExecuteFile = opts.context.availableTools.includes(`${prefix}execute_file`);
    if (hasExecute && hasFetchAndIndex && hasSearch) {
      contextMode.enabled = true;
      contextMode.has_execute_file = hasExecuteFile;
    }
  } else {
    const pluginDir = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'context-mode');
    if (fs.existsSync(pluginDir)) {
      contextMode.enabled = true;
      contextMode.has_execute_file = true;
    }
  }

  // Sensible defaults — no questions
  const config = {
    model_mode: 'claude-only',
    default_depth: 'standard',
    default_intent: 'feature',
    context_mode: contextMode,
    detected_host: host.host,
    detected_stack: stack,
    auto_initialized: true,
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  const filesCreated = ['.wazir/input/', '.wazir/state/', '.wazir/runs/', '.wazir/state/config.json'];

  return { config, host, stack, filesCreated, alreadyInitialized: false };
}
