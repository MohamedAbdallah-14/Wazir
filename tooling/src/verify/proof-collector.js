import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Framework lists used for project-type detection.
 */
const WEB_FRAMEWORKS = ['next', 'vite', 'react-scripts', 'nuxt', 'gatsby', 'astro', 'svelte', 'remix'];
const API_FRAMEWORKS = ['express', 'fastify', 'hono', 'koa', 'nest', 'hapi'];

/**
 * Detect the runnable type of a project from its package.json.
 *
 * Detection order:
 *   1. If pkg.bin exists → 'cli'
 *   2. If any WEB_FRAMEWORKS dep found → 'web'
 *   3. If any API_FRAMEWORKS dep found → 'api'
 *   4. Default → 'library'
 *
 * @param {string} projectRoot - absolute path to the project root
 * @returns {'web'|'api'|'cli'|'library'}
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

  // CLI detection — pkg.bin present
  if (pkg.bin && (typeof pkg.bin === 'string' || Object.keys(pkg.bin).length > 0)) {
    return 'cli';
  }

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Web framework detection
  if (WEB_FRAMEWORKS.some((fw) => allDeps[fw])) {
    return 'web';
  }

  // API framework detection
  if (API_FRAMEWORKS.some((fw) => allDeps[fw])) {
    return 'api';
  }

  return 'library';
}

/**
 * Run a command safely using execFileSync and return { ok, stdout, stderr }.
 * Never uses exec (shell injection risk).
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {object} [opts]
 * @returns {{ ok: boolean, stdout: string, stderr: string }}
 */
function safeRun(cmd, args, opts = {}) {
  try {
    const stdout = execFileSync(cmd, args, {
      encoding: 'utf8',
      timeout: 60_000,
      maxBuffer: 10 * 1024 * 1024,
      cwd: opts.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return {
      ok: false,
      stdout: (err.stdout || '').toString().trim(),
      stderr: (err.stderr || '').toString().trim(),
    };
  }
}

/**
 * Collect deterministic proof of implementation for a project.
 *
 * Evidence varies by detected type:
 * - **web:**    npm run build
 * - **api:**    library checks (test, tsc, eslint, prettier)
 * - **cli:**    <bin> --help + library checks
 * - **library:** npm test, npx tsc --noEmit, npx eslint ., npx prettier --check .
 *
 * All commands use execFileSync (never shell exec) for security.
 *
 * @param {string} projectRoot
 * @param {object} [opts]
 * @param {string} [opts.type] - override auto-detected type
 * @returns {Promise<{ type: string, evidence: Array<{check: string, ok: boolean, output: string}> }>}
 */
export async function collectProof(projectRoot, opts = {}) {
  const type = opts.type || detectRunnableType(projectRoot);
  const evidence = [];

  const runOpts = { cwd: projectRoot };

  // Library checks — shared by all types
  function libraryChecks() {
    // Tests
    const test = safeRun('npm', ['test', '--if-present'], runOpts);
    evidence.push({ check: 'npm test', ok: test.ok, output: test.stdout || test.stderr });

    // TypeScript type check (if tsconfig exists)
    if (fs.existsSync(path.join(projectRoot, 'tsconfig.json'))) {
      const tsc = safeRun('npx', ['tsc', '--noEmit'], runOpts);
      evidence.push({ check: 'tsc --noEmit', ok: tsc.ok, output: tsc.stdout || tsc.stderr });
    }

    // ESLint (if config exists)
    const eslintConfigs = ['.eslintrc', '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', 'eslint.config.js', 'eslint.config.mjs'];
    if (eslintConfigs.some((c) => fs.existsSync(path.join(projectRoot, c)))) {
      const lint = safeRun('npx', ['eslint', '.'], runOpts);
      evidence.push({ check: 'eslint .', ok: lint.ok, output: lint.stdout || lint.stderr });
    }

    // Prettier (if config exists)
    const prettierConfigs = ['.prettierrc', '.prettierrc.js', '.prettierrc.json', 'prettier.config.js', 'prettier.config.mjs'];
    if (prettierConfigs.some((c) => fs.existsSync(path.join(projectRoot, c)))) {
      const fmt = safeRun('npx', ['prettier', '--check', '.'], runOpts);
      evidence.push({ check: 'prettier --check .', ok: fmt.ok, output: fmt.stdout || fmt.stderr });
    }
  }

  switch (type) {
    case 'web': {
      // Build check
      const build = safeRun('npm', ['run', 'build'], runOpts);
      evidence.push({ check: 'npm run build', ok: build.ok, output: build.stdout || build.stderr });
      libraryChecks();
      break;
    }

    case 'api': {
      libraryChecks();
      break;
    }

    case 'cli': {
      // Discover the bin name from package.json
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
        const binName = typeof pkg.bin === 'string' ? pkg.name : Object.keys(pkg.bin)[0];
        if (binName) {
          const help = safeRun('npx', [binName, '--help'], runOpts);
          evidence.push({ check: `${binName} --help`, ok: help.ok, output: help.stdout || help.stderr });
        }
      } catch { /* skip if bin detection fails */ }
      libraryChecks();
      break;
    }

    case 'library':
    default: {
      libraryChecks();
      break;
    }
  }

  return { type, evidence };
}
