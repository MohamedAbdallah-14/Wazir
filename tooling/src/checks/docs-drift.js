import { execFileSync } from 'node:child_process';

/**
 * File-pair mapping: source directory prefixes to their documentation files.
 * When a file under a source prefix changes, the corresponding doc file
 * should also change to stay current.
 */
export const DOC_PAIRS = [
  { source: 'roles/', doc: 'docs/reference/roles-reference.md' },
  { source: 'workflows/', doc: 'docs/concepts/roles-and-workflows.md' },
  { source: 'skills/', doc: 'docs/reference/skills.md' },
  { source: 'hooks/definitions/', doc: 'docs/reference/hooks.md' },
  { source: 'tooling/src/capture/', doc: 'docs/reference/tooling-cli.md' },
  { source: 'tooling/src/checks/', doc: 'docs/reference/tooling-cli.md' },
  { source: 'tooling/src/index/', doc: 'docs/concepts/indexing-and-recall.md' },
  { source: 'tooling/src/recall/', doc: 'docs/concepts/indexing-and-recall.md' },
];

/**
 * Pure logic: given a list of changed file paths, determine which doc files
 * are potentially stale (source changed but doc did not).
 *
 * @param {string[]} changedFiles - List of changed file paths (repo-relative)
 * @returns {{ drifted: Array<{ source: string, doc: string }> }}
 */
export function checkDocsDrift(changedFiles) {
  const changedSet = new Set(changedFiles);

  // Collect unique doc targets that have at least one source change
  // but where the doc itself did not change.
  const driftedDocs = new Map(); // doc -> [source prefixes that triggered]

  for (const file of changedFiles) {
    for (const pair of DOC_PAIRS) {
      if (file.startsWith(pair.source)) {
        if (!changedSet.has(pair.doc)) {
          if (!driftedDocs.has(pair.doc)) {
            driftedDocs.set(pair.doc, new Set());
          }
          driftedDocs.get(pair.doc).add(pair.source);
        }
      }
    }
  }

  const drifted = [];
  for (const [doc, sources] of driftedDocs) {
    for (const source of sources) {
      drifted.push({ source, doc });
    }
  }

  return { drifted };
}

/**
 * Run docs-drift detection using git diff.
 *
 * @param {object} options
 * @param {string} [options.base='main'] - Base ref for git diff
 * @param {string} [options.head='HEAD'] - Head ref for git diff
 * @param {boolean} [options.strict=false] - Exit 1 on drift instead of 0
 * @param {string} [options.cwd] - Working directory
 * @returns {{ exitCode: number, stdout?: string, stderr?: string }}
 */
export function runDocsDriftCheck({ base = 'main', head = 'HEAD', strict = false, cwd } = {}) {
  let changedFiles;
  try {
    const output = execFileSync(
      'git',
      ['diff', '--name-only', `${base}..${head}`],
      { encoding: 'utf8', cwd, stdio: ['pipe', 'pipe', 'pipe'] },
    );
    changedFiles = output.trim().split('\n').filter(Boolean);
  } catch (error) {
    // If the git range is empty or invalid, treat as no changes
    if (error.stderr && error.stderr.includes('unknown revision')) {
      return { exitCode: 0, stdout: 'No git range found; skipping docs-drift check.\n' };
    }
    return { exitCode: 1, stderr: `Failed to run git diff: ${error.message}\n` };
  }

  if (changedFiles.length === 0) {
    return { exitCode: 0, stdout: 'No files changed in range; no drift detected.\n' };
  }

  const { drifted } = checkDocsDrift(changedFiles);

  if (drifted.length === 0) {
    return { exitCode: 0, stdout: 'No documentation drift detected.\n' };
  }

  const warnings = drifted.map(
    ({ source, doc }) => `  - ${source}* changed but ${doc} did not`,
  );
  const message = `Documentation drift detected:\n${warnings.join('\n')}\n`;

  if (strict) {
    return { exitCode: 1, stderr: message };
  }

  return { exitCode: 0, stdout: `[advisory] ${message}` };
}
