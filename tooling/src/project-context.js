import fs from 'node:fs';
import path from 'node:path';

import { readYamlFile } from './loaders.js';
import { findProjectRoot } from './project-root.js';
import { resolveStateRoot } from './state-root.js';

const DEFAULT_STATE_ROOT_TEMPLATE = '~/.wazir/projects/{project_slug}';

function slugifyDirName(dirPath) {
  const name = path.basename(dirPath);
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'wazir-project';
}

function buildSyntheticManifest(projectRoot) {
  return {
    project: { name: slugifyDirName(projectRoot) },
    paths: { state_root_default: DEFAULT_STATE_ROOT_TEMPLATE },
    hosts: [],
    roles: [],
    workflows: [],
    phases: [],
    protected_paths: [],
  };
}

/**
 * Resolve full project context for any CLI command.
 *
 * - In the Wazir repo: reads manifest, resolves state root from it.
 * - In a user project (no manifest): returns synthetic manifest with defaults.
 *
 * ctx.manifest is never null — always an object.
 *
 * @param {string} [cwd]
 * @param {{ stateRootOverride?: string }} [opts]
 * @returns {{ projectRoot: string, manifest: object, stateRoot: string, isUserProject: boolean }}
 */
export function resolveProjectContext(cwd = process.cwd(), opts = {}) {
  const wazirRoot = findProjectRoot(cwd);

  if (wazirRoot) {
    const manifest = readYamlFile(path.join(wazirRoot, 'wazir.manifest.yaml'));
    if (!manifest || typeof manifest !== 'object') {
      if (opts.stateRootOverride) {
        // Manifest is corrupt but caller provided explicit state root — fall back to synthetic
        const synthetic = buildSyntheticManifest(wazirRoot);
        const stateRoot = resolveStateRoot(wazirRoot, synthetic, { cwd, override: opts.stateRootOverride });
        return { projectRoot: wazirRoot, manifest: synthetic, stateRoot, isUserProject: false };
      }
      throw new Error(`wazir.manifest.yaml at ${wazirRoot} is empty or malformed`);
    }
    const stateRoot = resolveStateRoot(wazirRoot, manifest, {
      cwd,
      override: opts.stateRootOverride,
    });
    return { projectRoot: wazirRoot, manifest, stateRoot, isUserProject: false };
  }

  // No manifest — user project mode.
  // Walk up looking for .wazir/state/config.json to find the initialized project root.
  // This handles commands run from nested subdirectories (e.g., myproject/src/).
  const projectRoot = findInitializedProjectRoot(cwd) ?? path.resolve(cwd);
  const manifest = buildSyntheticManifest(projectRoot);
  const stateRoot = resolveStateRoot(projectRoot, manifest, {
    cwd,
    override: opts.stateRootOverride,
  });
  return { projectRoot, manifest, stateRoot, isUserProject: true };
}

/**
 * Walk up from startDir looking for .wazir/state/config.json.
 * Returns the directory containing .wazir/ or null if not found.
 */
function findInitializedProjectRoot(startDir) {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (fs.existsSync(path.join(currentDir, '.wazir', 'state', 'config.json'))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}
