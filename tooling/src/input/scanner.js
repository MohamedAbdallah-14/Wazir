import { readdirSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

/**
 * Scan input directories for briefing materials.
 * Globs input/*.md and .wazir/input/*.md (flat, not recursive).
 * Excludes README.md.
 *
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Array<{path: string, auto: boolean}>} Found files with auto flag
 */
export function scanInputDirectories(projectRoot) {
  const root = resolve(projectRoot);
  const dirs = [
    join(root, 'input'),
    join(root, '.wazir', 'input'),
  ];

  const results = [];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;

    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.md')) continue;
      if (basename(entry.name).toLowerCase() === 'readme.md') continue;

      results.push({ path: join(dir, entry.name), auto: false });
    }
  }

  // Single file auto-use
  if (results.length === 1) {
    results[0].auto = true;
  }

  return results;
}
