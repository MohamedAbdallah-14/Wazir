import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveProjectContext } from '../project-context.js';
import {
  validateHooksAtProjectRoot,
  validateManifestAtProjectRoot,
} from '../commands/validate.js';

function success(payload, options = {}) {
  if (options.json) {
    return {
      exitCode: payload.healthy ? 0 : 1,
      stdout: `${JSON.stringify(payload, null, 2)}\n`,
    };
  }

  const lines = payload.checks.map((check) => `${check.status.toUpperCase()} ${check.name}: ${check.detail}`);
  return {
    exitCode: payload.healthy ? 0 : 1,
    stdout: `${lines.join('\n')}\n`,
  };
}

export function runDoctorCommand(parsed, context = {}) {
  try {
    if (parsed.subcommand) {
      return {
        exitCode: 1,
        stderr: 'Usage: wazir doctor [--json]\n',
      };
    }

    const wantsJson = parsed.args.includes('--json');
    const ctx = resolveProjectContext(context.cwd ?? process.cwd());
    const checks = [];

    if (ctx.isUserProject) {
      checks.push({
        name: 'cli',
        status: 'pass',
        detail: 'CLI is available.',
      });

      const configPath = path.join(ctx.projectRoot, '.wazir', 'state', 'config.json');
      const stateDirsExist = fs.existsSync(configPath);
      checks.push({
        name: 'state-dirs',
        status: stateDirsExist ? 'pass' : 'fail',
        detail: stateDirsExist
          ? 'State directories exist.'
          : `Missing state config at ${configPath}`,
      });

      const pluginDir = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'wazir-marketplace');
      const pluginInstalled = fs.existsSync(pluginDir);
      checks.push({
        name: 'plugin',
        status: pluginInstalled ? 'pass' : 'fail',
        detail: pluginInstalled
          ? 'Wazir marketplace plugin is installed.'
          : `Missing plugin directory at ${pluginDir}`,
      });
    } else {
      const manifestResult = validateManifestAtProjectRoot(ctx.projectRoot);
      checks.push({
        name: 'manifest',
        status: manifestResult.exitCode === 0 ? 'pass' : 'fail',
        detail: manifestResult.exitCode === 0 ? 'Manifest is valid.' : manifestResult.stderr.trim(),
      });

      const hooksResult = validateHooksAtProjectRoot(ctx.projectRoot);
      checks.push({
        name: 'hooks',
        status: hooksResult.exitCode === 0 ? 'pass' : 'fail',
        detail: hooksResult.exitCode === 0 ? 'Hook definitions are valid.' : hooksResult.stderr.trim(),
      });

      const defaultStateInsideRepo = !path.relative(ctx.projectRoot, ctx.stateRoot).startsWith('..');
      checks.push({
        name: 'state-root',
        status: defaultStateInsideRepo ? 'fail' : 'pass',
        detail: defaultStateInsideRepo
          ? `${ctx.stateRoot} resolves inside the project root`
          : `${ctx.stateRoot} stays outside the project root`,
      });

      const missingHostExports = ctx.manifest.hosts.filter((host) => {
        const exportPath = path.join(ctx.projectRoot, 'exports', 'hosts', host);
        return !fs.existsSync(exportPath);
      });
      checks.push({
        name: 'host-exports',
        status: missingHostExports.length === 0 ? 'pass' : 'fail',
        detail: missingHostExports.length === 0
          ? 'All required host export directories exist.'
          : `Missing export directories for: ${missingHostExports.join(', ')}`,
      });
    }

    return success({
      healthy: checks.every((check) => check.status === 'pass'),
      project_root: ctx.projectRoot,
      state_root_default: ctx.stateRoot,
      checks,
    }, { json: wantsJson });
  } catch (error) {
    return {
      exitCode: 1,
      stderr: `${error.message}\n`,
    };
  }
}
