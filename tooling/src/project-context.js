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
    if (!manifest || !manifest.paths) {
      throw new Error(`wazir.manifest.yaml at ${wazirRoot} is empty or malformed`);
    }
    const stateRoot = resolveStateRoot(wazirRoot, manifest, {
      cwd,
      override: opts.stateRootOverride,
    });
    return { projectRoot: wazirRoot, manifest, stateRoot, isUserProject: false };
  }

  const projectRoot = path.resolve(cwd);
  const manifest = buildSyntheticManifest(projectRoot);
  const stateRoot = resolveStateRoot(projectRoot, manifest, {
    cwd,
    override: opts.stateRootOverride,
  });
  return { projectRoot, manifest, stateRoot, isUserProject: true };
}
