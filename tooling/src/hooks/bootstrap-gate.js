/**
 * Bootstrap gate + phase-aware write guard.
 *
 * 1. No pipeline-active marker → allow everything (not a Wazir session)
 * 2. Marker exists, no run → deny Write/Edit/Bash except allowlist
 * 3. Marker exists, run exists → check phase:
 *    - executor: allow all
 *    - init/clarifier/final_review: deny Write/Edit to source paths
 */

import fs from 'node:fs';
import path from 'node:path';

import { findActivePhase, resolveActiveScope } from './phase-injector.js';

const BOOTSTRAP_ALLOWLIST = [
  'wazir', 'git checkout', 'git branch', 'git status', 'git log', 'git diff',
  'git add', 'git commit', 'git stash', 'git push',
  'which ', 'ls ', 'pwd', 'echo ', 'cat ', 'head ', 'npm test', 'npm run', 'node ',
  'rm .wazir/',
];

const NON_SOURCE_PREFIXES = [
  '.wazir/', '.wazir\\',
  'docs/', 'docs\\',
  'input/', 'input\\',
  'memory/', 'memory\\',
  'templates/', 'templates\\',
  'benchmark/', 'benchmark\\',
];

function readLatestRunId(projectRoot) {
  const latestPath = path.join(projectRoot, '.wazir', 'runs', 'latest');

  try {
    const stat = fs.lstatSync(latestPath);
    if (stat.isSymbolicLink()) {
      return path.basename(fs.readlinkSync(latestPath));
    }
    if (stat.isFile()) {
      return fs.readFileSync(latestPath, 'utf8').trim() || null;
    }
  } catch {
    return null;
  }

  return null;
}

function isSourcePath(filePath, projectRoot) {
  if (!filePath) return false;
  // Resolve to repo-relative path
  let normalized = filePath.replace(/\\/g, '/');
  if (path.isAbsolute(normalized)) {
    const rel = path.relative(projectRoot, normalized).replace(/\\/g, '/');
    if (rel.startsWith('..')) return false; // outside project
    normalized = rel;
  }
  if (normalized.startsWith('./')) normalized = normalized.slice(2);
  return !NON_SOURCE_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

/**
 * Read the source_write_policy from the active skill phase file.
 * @param {string} skillPhasesDir - Path to the skill's phases directory
 * @returns {'allow'|'deny'} Write policy (defaults to 'deny')
 */
function getSkillWritePolicy(skillPhasesDir) {
  const active = findActivePhase(skillPhasesDir);
  if (!active) return 'deny';
  const match = active.content.match(/^source_write_policy:\s*(allow|deny)/m);
  return match ? match[1] : 'deny';
}

export function evaluateBootstrapGate(projectRoot, payload) {
  const markerPath = path.join(projectRoot, '.wazir', 'state', 'pipeline-active');

  // 1. No marker → not a pipeline session
  if (!fs.existsSync(markerPath)) {
    return { decision: 'allow' };
  }

  // 2. Check if run exists
  const runId = readLatestRunId(projectRoot);
  let phasesDir = null;
  let hasRun = false;

  if (runId) {
    try {
      phasesDir = path.join(projectRoot, '.wazir', 'runs', runId, 'phases');
      const files = fs.readdirSync(phasesDir).filter(f => f.endsWith('.md') && !f.includes('.log.'));
      hasRun = files.length > 0;
    } catch { /* no run */ }
  }

  const tool = payload.tool || '';
  const command = payload.command || '';
  const filePath = payload.filePath || '';

  // Read is always allowed
  if (tool === 'Read' || tool === 'Glob' || tool === 'Grep') {
    return { decision: 'allow' };
  }

  // No run exists → bootstrap gate
  if (!hasRun) {
    // .wazir/ paths always bypass — gate protects source files, not pipeline state (KI-001)
    if ((tool === 'Write' || tool === 'Edit') && filePath && !isSourcePath(filePath, projectRoot)) {
      return { decision: 'allow' };
    }

    if (tool === 'Bash') {
      const cmdLower = command.toLowerCase().trim();
      if (BOOTSTRAP_ALLOWLIST.some(prefix => cmdLower.startsWith(prefix))) {
        return { decision: 'allow' };
      }
    }

    return {
      decision: 'deny',
      reason: 'Pipeline is active but no run exists. Run `wazir capture ensure` first.',
      systemMessage: 'BOOTSTRAP REQUIRED: Run `wazir capture ensure` before writing any code. Please try 100% compliance with Wazir pipeline.',
    };
  }

  // 3. Run exists — check phase for Write/Edit
  if (tool === 'Write' || tool === 'Edit') {
    const active = findActivePhase(phasesDir);
    const phase = active?.phase || 'init';

    // Non-executor pipeline phases: block source file writes
    if (phase !== 'executor') {
      if (isSourcePath(filePath, projectRoot)) {
        const runPath = runId ? `.wazir/runs/${runId}/phases/${phase}.md` : `the current phase checklist`;
        return {
          decision: 'deny',
          reason: `Source file writes are blocked during ${phase} phase. Complete the ${phase} phase checklist before writing source code.`,
          systemMessage: `PHASE GATE: You are in the ${phase} phase. Source file writes are only allowed during the executor phase. Please follow your checklist at ${runPath}. Use wz: skills as instructed.`,
        };
      }
      return { decision: 'allow' };
    }

    // executor phase — check scope stack for skill-level write policy
    const runDir = path.join(projectRoot, '.wazir', 'runs', runId);
    const scope = resolveActiveScope(runDir);
    if (scope.type === 'skill' && isSourcePath(filePath, projectRoot)) {
      const skillWritePolicy = getSkillWritePolicy(scope.phasesDir);
      if (skillWritePolicy === 'deny') {
        const skillPhase = findActivePhase(scope.phasesDir);
        const skillPhaseName = skillPhase?.phase || 'unknown';
        return {
          decision: 'deny',
          reason: `Source writes blocked by skill scope: ${scope.skill} (phase: ${skillPhaseName}, policy: deny).`,
          systemMessage: `SKILL PHASE GATE: Skill ${scope.skill} phase ${skillPhaseName} denies source writes. Complete the skill phase or transition to a phase that allows writes.`,
        };
      }
    }
  }

  return { decision: 'allow' };
}
