import fs from 'node:fs';
import path from 'node:path';

const MANIFEST_FILE = 'wazir.manifest.yaml';

/**
 * Find the Wazir project root by walking up from startDir looking for wazir.manifest.yaml.
 * Returns null if no manifest is found (user project mode).
 */
export function findProjectRoot(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (fs.existsSync(path.join(currentDir, MANIFEST_FILE))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

/**
 * Like findProjectRoot but throws if no manifest is found.
 * Use for commands that only work inside the Wazir repo (export, validate).
 */
export function findProjectRootStrict(startDir = process.cwd()) {
  const root = findProjectRoot(startDir);
  if (root === null) {
    throw new Error(`Could not find ${MANIFEST_FILE} from ${startDir}`);
  }
  return root;
}
