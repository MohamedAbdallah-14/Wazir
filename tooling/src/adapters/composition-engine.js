import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { readYamlFile } from '../loaders.js';
import { estimateTokens } from '../capture/usage.js';

const DEFAULT_TOKEN_CEILING = 50_000;
const MODULE_CAP = 15;

/**
 * Resolve modules from the composition map for a given role and layer.
 * Returns an array of { path, layer } objects.
 */
function resolveLayer(map, layer, role, stacks, concerns) {
  const resolved = [];

  if (layer === 'always') {
    const entries = map.always?.[role] ?? [];
    for (const entry of entries) {
      resolved.push({ path: entry, layer: 'always' });
    }
  }

  if (layer === 'auto') {
    const allStacks = map.auto?.['all-stacks'];
    if (allStacks) {
      // all-roles entries apply to every role
      const allRolesEntries = allStacks['all-roles'] ?? [];
      for (const entry of allRolesEntries) {
        resolved.push({ path: entry, layer: 'auto' });
      }
      // role-specific entries under all-stacks
      const roleEntries = allStacks[role] ?? [];
      for (const entry of roleEntries) {
        resolved.push({ path: entry, layer: 'auto' });
      }
    }
  }

  if (layer === 'stacks') {
    for (const stack of stacks) {
      const stackDef = map.stacks?.[stack];
      if (!stackDef) continue;
      // executor/verifier/reviewer/etc entries for the role
      const roleEntries = stackDef[role] ?? [];
      for (const entry of roleEntries) {
        resolved.push({ path: entry, layer: 'stacks' });
      }
      // antipatterns are included for verifier and reviewer roles
      if (role === 'verifier' || role === 'reviewer') {
        const antipatternEntries = stackDef.antipatterns ?? [];
        for (const entry of antipatternEntries) {
          resolved.push({ path: entry, layer: 'stacks' });
        }
      }
    }
  }

  if (layer === 'concerns') {
    for (const concern of concerns) {
      const concernDef = map.concerns?.[concern];
      if (!concernDef) continue;
      const roleEntries = concernDef[role] ?? [];
      for (const entry of roleEntries) {
        resolved.push({ path: entry, layer: 'concerns' });
      }
    }
  }

  return resolved;
}

/**
 * Deduplicate modules, keeping first occurrence (highest priority).
 */
function deduplicateModules(modules) {
  const seen = new Set();
  const result = [];
  for (const mod of modules) {
    if (!seen.has(mod.path)) {
      seen.add(mod.path);
      result.push(mod);
    }
  }
  return result;
}

/**
 * Compose expertise modules for a given role, stack set, and concern set.
 *
 * @param {object} options
 * @param {string} options.role - The role (executor, verifier, reviewer, etc.)
 * @param {string[]} options.stacks - Detected project stacks (e.g. ['node', 'react'])
 * @param {string[]} options.concerns - Declared task concerns (e.g. ['rtl', 'security-auth'])
 * @param {string} options.projectRoot - Absolute path to the project root
 * @param {string} options.runRoot - Absolute path to the run root for artifact output
 * @param {string} [options.task] - Optional task identifier for the proof artifact
 * @param {number} [options.tokenCeiling] - Max token budget (default 50,000)
 * @returns {{ prompt: string, manifest: object }}
 */
export function composeExpertise(options) {
  const {
    role,
    stacks = [],
    concerns = [],
    projectRoot,
    runRoot,
    task = 'default',
    tokenCeiling = DEFAULT_TOKEN_CEILING,
  } = options;

  const mapPath = path.join(projectRoot, 'expertise', 'composition-map.yaml');
  const map = readYamlFile(mapPath);
  const expertiseRoot = path.join(projectRoot, 'expertise');

  // Resolve modules in priority order: always > auto > stacks > concerns
  const layers = ['always', 'auto', 'stacks', 'concerns'];
  let allModules = [];
  for (const layer of layers) {
    const layerModules = resolveLayer(map, layer, role, stacks, concerns);
    allModules = allModules.concat(layerModules);
  }

  // Deduplicate
  allModules = deduplicateModules(allModules);

  // Read file contents and compute tokens
  const loaded = [];
  const warnings = [];

  for (const mod of allModules) {
    const fullPath = path.join(expertiseRoot, mod.path);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const tokens = estimateTokens(Buffer.byteLength(content, 'utf8'));
      loaded.push({ ...mod, content, tokens, fullPath });
    } catch (err) {
      warnings.push(`warning: skipping missing module ${mod.path}: ${err.message}`);
    }
  }

  // Enforce budget: 15-module cap + token ceiling
  // Drop in reverse priority: concerns first, then stacks, then auto
  const dropOrder = ['concerns', 'stacks', 'auto', 'always'];
  let included = [...loaded];
  let dropped = [];

  // Enforce module cap
  if (included.length > MODULE_CAP) {
    const toDrop = enforceLimit(included, MODULE_CAP, dropOrder);
    for (const m of toDrop) m.drop_reason = 'module_cap_exceeded';
    dropped = dropped.concat(toDrop);
    included = included.filter((m) => !toDrop.includes(m));
  }

  // Enforce token ceiling
  let totalTokens = included.reduce((sum, m) => sum + m.tokens, 0);
  if (totalTokens > tokenCeiling) {
    const toDrop = enforceTokenBudget(included, tokenCeiling, dropOrder);
    for (const m of toDrop) m.drop_reason = 'token_ceiling_exceeded';
    dropped = dropped.concat(toDrop);
    included = included.filter((m) => !toDrop.includes(m));
    totalTokens = included.reduce((sum, m) => sum + m.tokens, 0);
  }

  // Build the combined prompt
  const promptParts = [];
  for (const mod of included) {
    promptParts.push(`<!-- module: ${mod.path} (${mod.layer}) -->\n${mod.content}`);
  }
  const prompt = promptParts.join('\n\n---\n\n');

  // Compute prompt hash
  const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');

  const manifest = {
    modules_included: included.map((m) => ({ path: m.path, layer: m.layer, tokens: m.tokens })),
    modules_dropped: dropped.map((m) => ({ path: m.path, layer: m.layer, tokens: m.tokens, reason: m.drop_reason })),
    total_tokens: totalTokens,
    prompt_hash: promptHash,
  };

  // Write warnings to stderr
  for (const w of warnings) {
    process.stderr.write(`${w}\n`);
  }

  // Write composition proof artifact
  writeProofArtifact(runRoot, role, task, manifest);

  return { prompt, manifest };
}

/**
 * Enforce a maximum count by dropping modules in reverse priority order.
 */
function enforceLimit(modules, limit, dropOrder) {
  const toDrop = [];
  let current = modules.length;

  for (const layer of dropOrder) {
    if (current <= limit) break;
    // Iterate in reverse to drop last-added first within a layer
    const layerModules = modules.filter((m) => m.layer === layer);
    for (let i = layerModules.length - 1; i >= 0; i--) {
      if (current <= limit) break;
      toDrop.push(layerModules[i]);
      current--;
    }
  }

  return toDrop;
}

/**
 * Enforce a token ceiling by dropping modules in reverse priority order.
 */
function enforceTokenBudget(modules, ceiling, dropOrder) {
  const toDrop = [];
  let totalTokens = modules.reduce((sum, m) => sum + m.tokens, 0);

  for (const layer of dropOrder) {
    if (totalTokens <= ceiling) break;
    const layerModules = modules.filter((m) => m.layer === layer && !toDrop.includes(m));
    for (let i = layerModules.length - 1; i >= 0; i--) {
      if (totalTokens <= ceiling) break;
      toDrop.push(layerModules[i]);
      totalTokens -= layerModules[i].tokens;
    }
  }

  return toDrop;
}

/**
 * Write the composition proof artifact to the run artifacts directory.
 */
function writeProofArtifact(runRoot, role, task, manifest) {
  try {
    const artifactsDir = path.join(runRoot, 'artifacts');
    fs.mkdirSync(artifactsDir, { recursive: true });

    const artifactPath = path.join(artifactsDir, `composition-${role}-${task}.json`);
    const artifact = {
      generated_at: new Date().toISOString(),
      role,
      task,
      ...manifest,
    };

    fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
  } catch (err) {
    process.stderr.write(`warning: failed to write composition proof artifact: ${err.message}\n`);
  }
}
