import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const WEB_FRAMEWORKS = ['next', 'vite', 'react-scripts', '@angular/cli', 'nuxt', 'astro', 'gatsby'];
const API_FRAMEWORKS = ['express', 'fastify', 'hono', 'koa', '@nestjs/core', '@hapi/hapi'];

/**
 * Detect whether a project produces runnable output and what type.
 *
 * @param {string} projectRoot
 * @returns {'web' | 'api' | 'cli' | 'library'}
 */
export function detectRunnableType(projectRoot) {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return 'library';

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    return 'library';
  }

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (WEB_FRAMEWORKS.some((fw) => fw in allDeps)) return 'web';
  if (API_FRAMEWORKS.some((fw) => fw in allDeps)) return 'api';
  if (pkg.bin) return 'cli';

  return 'library';
}

/**
 * Run a command safely using execFileSync (no shell injection).
 *
 * @param {string} cmd - The executable
 * @param {string[]} args - Arguments array
 * @param {string} cwd
 * @returns {{ exit_code: number, stdout: string, stderr: string }}
 */
function runCommand(cmd, args, cwd) {
  try {
    const stdout = execFileSync(cmd, args, {
      cwd,
      encoding: 'utf8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { exit_code: 0, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return {
      exit_code: err.status ?? 1,
      stdout: (err.stdout ?? '').trim(),
      stderr: (err.stderr ?? '').trim(),
    };
  }
}

/**
 * Summarize command output to a short string.
 *
 * @param {string} stdout
 * @param {number} maxLen
 * @returns {string}
 */
function summarize(stdout, maxLen = 200) {
  if (!stdout) return '';
  const lines = stdout.split('\n');
  if (lines.length <= 5) return stdout.slice(0, maxLen);
  return [...lines.slice(0, 3), `... (${lines.length} lines total)`, ...lines.slice(-2)]
    .join('\n')
    .slice(0, maxLen);
}

/**
 * Check if a package.json has a specific script.
 *
 * @param {string} projectRoot
 * @param {string} scriptName
 * @returns {boolean}
 */
function hasScript(projectRoot, scriptName) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    return !!(pkg.scripts && pkg.scripts[scriptName]);
  } catch {
    return false;
  }
}

/**
 * Check if a config file exists for a tool.
 *
 * @param {string} projectRoot
 * @param {string[]} candidates
 * @returns {boolean}
 */
function hasConfigFile(projectRoot, candidates) {
  return candidates.some((f) => fs.existsSync(path.join(projectRoot, f)));
}

/**
 * Collect library-type proof: tests, lint, format, type-check.
 *
 * @param {string} projectRoot
 * @returns {{ tool: string, command: string, exit_code: number, stdout_summary: string, passed: boolean }[]}
 */
function collectLibraryEvidence(projectRoot) {
  const evidence = [];

  // npm test
  if (hasScript(projectRoot, 'test')) {
    const result = runCommand('npm', ['test'], projectRoot);
    evidence.push({
      tool: 'npm test',
      command: 'npm test',
      exit_code: result.exit_code,
      stdout_summary: summarize(result.stdout),
      passed: result.exit_code === 0,
    });
  }

  // TypeScript type check
  if (
    hasConfigFile(projectRoot, ['tsconfig.json']) ||
    hasScript(projectRoot, 'typecheck')
  ) {
    const cmd = hasScript(projectRoot, 'typecheck')
      ? ['npm', ['run', 'typecheck']]
      : ['npx', ['tsc', '--noEmit']];
    const result = runCommand(cmd[0], cmd[1], projectRoot);
    evidence.push({
      tool: 'tsc',
      command: cmd[0] + ' ' + cmd[1].join(' '),
      exit_code: result.exit_code,
      stdout_summary: summarize(result.exit_code === 0 ? 'No type errors' : result.stdout || result.stderr),
      passed: result.exit_code === 0,
    });
  }

  // ESLint
  if (
    hasConfigFile(projectRoot, ['.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', 'eslint.config.js', 'eslint.config.mjs']) ||
    hasScript(projectRoot, 'lint')
  ) {
    const cmd = hasScript(projectRoot, 'lint')
      ? ['npm', ['run', 'lint']]
      : ['npx', ['eslint', '.']];
    const result = runCommand(cmd[0], cmd[1], projectRoot);
    evidence.push({
      tool: 'eslint',
      command: cmd[0] + ' ' + cmd[1].join(' '),
      exit_code: result.exit_code,
      stdout_summary: summarize(result.exit_code === 0 ? 'No lint errors' : result.stdout || result.stderr),
      passed: result.exit_code === 0,
    });
  }

  // Prettier
  if (
    hasConfigFile(projectRoot, ['.prettierrc', '.prettierrc.js', '.prettierrc.json', '.prettierrc.yml', 'prettier.config.js', 'prettier.config.mjs']) ||
    hasScript(projectRoot, 'format:check')
  ) {
    const cmd = hasScript(projectRoot, 'format:check')
      ? ['npm', ['run', 'format:check']]
      : ['npx', ['prettier', '--check', '.']];
    const result = runCommand(cmd[0], cmd[1], projectRoot);
    evidence.push({
      tool: 'prettier',
      command: cmd[0] + ' ' + cmd[1].join(' '),
      exit_code: result.exit_code,
      stdout_summary: summarize(result.exit_code === 0 ? 'All files formatted' : result.stdout || result.stderr),
      passed: result.exit_code === 0,
    });
  }

  return evidence;
}

/**
 * Collect web-type proof: build + library checks.
 *
 * @param {string} projectRoot
 * @returns {{ tool: string, command: string, exit_code: number, stdout_summary: string, passed: boolean }[]}
 */
function collectWebEvidence(projectRoot) {
  const evidence = [];

  // Build
  if (hasScript(projectRoot, 'build')) {
    const result = runCommand('npm', ['run', 'build'], projectRoot);
    evidence.push({
      tool: 'build',
      command: 'npm run build',
      exit_code: result.exit_code,
      stdout_summary: summarize(result.stdout),
      passed: result.exit_code === 0,
    });
  }

  // Also run library checks (tests, lint, etc.)
  evidence.push(...collectLibraryEvidence(projectRoot));

  return evidence;
}

/**
 * Collect API-type proof: library checks (server start/stop is complex, defer to manual).
 *
 * @param {string} projectRoot
 * @returns {{ tool: string, command: string, exit_code: number, stdout_summary: string, passed: boolean }[]}
 */
function collectApiEvidence(projectRoot) {
  return collectLibraryEvidence(projectRoot);
}

/**
 * Collect CLI-type proof: --help output + library checks.
 *
 * @param {string} projectRoot
 * @returns {{ tool: string, command: string, exit_code: number, stdout_summary: string, passed: boolean }[]}
 */
function collectCliEvidence(projectRoot) {
  const evidence = [];

  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const binEntry = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin || {})[0];
    if (binEntry) {
      const binPath = path.join(projectRoot, binEntry);
      if (fs.existsSync(binPath)) {
        const result = runCommand('node', [binPath, '--help'], projectRoot);
        evidence.push({
          tool: 'cli --help',
          command: `node ${binEntry} --help`,
          exit_code: result.exit_code,
          stdout_summary: summarize(result.stdout),
          passed: result.exit_code === 0,
        });
      }
    }
  } catch { /* ignore */ }

  evidence.push(...collectLibraryEvidence(projectRoot));

  return evidence;
}

/**
 * Collect proof of implementation for a task.
 *
 * @param {{ id: string, title: string }} taskSpec
 * @param {{ projectRoot: string, runId?: string, stateRoot?: string }} runConfig
 * @returns {Promise<{ task_id: string, type: string, timestamp: string, evidence: object[], status: string, all_passed: boolean }>}
 */
export async function collectProof(taskSpec, runConfig) {
  const { projectRoot } = runConfig;
  const type = detectRunnableType(projectRoot);

  let evidence;
  switch (type) {
    case 'web':
      evidence = collectWebEvidence(projectRoot);
      break;
    case 'api':
      evidence = collectApiEvidence(projectRoot);
      break;
    case 'cli':
      evidence = collectCliEvidence(projectRoot);
      break;
    default:
      evidence = collectLibraryEvidence(projectRoot);
  }

  const allPassed = evidence.length === 0 || evidence.every((e) => e.passed);

  const result = {
    task_id: taskSpec.id,
    type,
    timestamp: new Date().toISOString(),
    evidence,
    status: allPassed ? 'pass' : 'fail',
    all_passed: allPassed,
  };

  // Save to artifacts if runId provided
  if (runConfig.runId && runConfig.stateRoot) {
    const artifactDir = path.join(runConfig.stateRoot, 'runs', runConfig.runId, 'artifacts');
    if (fs.existsSync(artifactDir)) {
      fs.writeFileSync(
        path.join(artifactDir, `proof-${taskSpec.id}.json`),
        JSON.stringify(result, null, 2) + '\n',
      );
    }
  }

  return result;
}
