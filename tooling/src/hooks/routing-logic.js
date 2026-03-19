import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function firstToken(cmd) {
  return cmd.split(/\s+/)[0] || '';
}

function hasPipe(cmd) {
  return /(?<![\\])\|/.test(cmd);
}

function hasRedirect(cmd) {
  return /(?<![\\])[>]/.test(cmd);
}

export function loadRoutingMatrix(projectRoot) {
  const matrixPath = join(projectRoot, 'hooks', 'routing-matrix.json');
  return JSON.parse(readFileSync(matrixPath, 'utf8'));
}

export function classifyCommand(cmd, matrix) {
  const command = (cmd || '').trim();

  if (!matrix) {
    return { route: 'small', reason: 'matrix missing — safe fallback' };
  }

  // 1. Explicit context-mode marker always wins
  if (command.includes('# wazir:context-mode')) {
    return { route: 'large', reason: 'explicit context-mode marker' };
  }

  // 2. Check large patterns FIRST — large commands are never downgraded
  for (const pattern of matrix.large) {
    if (command === pattern || command.startsWith(pattern + ' ') || command.startsWith(pattern + '\t')) {
      return { route: 'large', reason: `matched large pattern: ${pattern}` };
    }
  }

  // 3. Passthrough marker — only honoured when command is NOT large
  if (command.includes('# wazir:passthrough')) {
    return { route: 'small', reason: 'explicit passthrough marker' };
  }

  // 4. Check small patterns
  for (const pattern of matrix.small) {
    if (command === pattern || command.startsWith(pattern + ' ') || command.startsWith(pattern + '\t')) {
      return { route: 'small', reason: `matched small pattern: ${pattern}` };
    }
  }

  // 5. Ambiguous heuristics
  const heuristic = matrix.ambiguous_heuristic || {};

  if (heuristic.pipe_detected && hasPipe(command)) {
    return { route: 'ambiguous', reason: 'pipe detected' };
  }
  if (heuristic.redirect_detected && hasRedirect(command)) {
    return { route: 'ambiguous', reason: 'redirect detected' };
  }

  const bin = firstToken(command);
  if (Array.isArray(heuristic.verbose_binaries) && heuristic.verbose_binaries.includes(bin)) {
    return { route: 'ambiguous', reason: `verbose binary: ${bin}` };
  }

  // Default: unknown commands pass through
  return { route: 'small', reason: 'no pattern matched — default passthrough' };
}
