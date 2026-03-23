#!/usr/bin/env node

import fs from 'node:fs';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--bare-metal' && argv[i + 1]) { args.bareMetal = argv[i + 1]; i++; }
    if (argv[i] === '--wazir' && argv[i + 1]) { args.wazir = argv[i + 1]; i++; }
  }
  return args;
}

function loadScore(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Failed to load ${filePath}: ${e.message}`);
    process.exit(1);
  }
}

function bar(score, max, width = 15) {
  const filled = max > 0 ? Math.round((score / max) * width) : 0;
  return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled);
}

function compare(bareData, wazirData) {
  const lines = [];
  lines.push('');
  lines.push('\u2550'.repeat(68));
  lines.push(`  Benchmark: ${bareData.challenge}     bare-metal  vs  wazir`);
  lines.push('\u2550'.repeat(68));

  const allDims = new Set([
    ...Object.keys(bareData.dimensions),
    ...Object.keys(wazirData.dimensions),
  ]);

  for (const key of allDims) {
    const bd = bareData.dimensions[key] || { score: 0, maxScore: 0, label: key };
    const wd = wazirData.dimensions[key] || { score: 0, maxScore: 0, label: key };
    const label = (bd.label || wd.label || key).padEnd(22);
    const bScore = `${bd.score}/${bd.maxScore}`.padStart(6);
    const wScore = `${wd.score}/${wd.maxScore}`.padStart(6);
    const bBar = bar(bd.score, bd.maxScore);
    const wBar = bar(wd.score, wd.maxScore);
    lines.push(`  ${label} ${bScore} [${bBar}]  vs  ${wScore} [${wBar}]`);
  }

  lines.push('  ' + '\u2500'.repeat(66));

  const bTotal = `${bareData.totalScore}/${bareData.totalMax}`;
  const wTotal = `${wazirData.totalScore}/${wazirData.totalMax}`;
  const delta = wazirData.totalScore - bareData.totalScore;
  const deltaSign = delta >= 0 ? '+' : '';

  lines.push(`  ${'TOTAL'.padEnd(22)} ${bTotal.padStart(6)} ${''.padEnd(17)}  vs  ${wTotal.padStart(6)}`);
  lines.push(`  ${'DELTA'.padEnd(22)} ${(deltaSign + delta + ' points').padStart(40)}`);
  lines.push('\u2550'.repeat(68));

  // Verdict
  lines.push('');
  if (delta > 40) {
    lines.push('  Verdict: Wazir dominates. Pipeline discipline pays off.');
  } else if (delta > 20) {
    lines.push('  Verdict: Wazir wins clearly. Structured process beats ad-hoc.');
  } else if (delta > 0) {
    lines.push('  Verdict: Wazir edges ahead. Marginal pipeline benefit.');
  } else if (delta === 0) {
    lines.push('  Verdict: Tie. Pipeline overhead did not differentiate.');
  } else {
    lines.push('  Verdict: Bare-metal wins. Investigate pipeline overhead.');
  }
  lines.push('');

  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));

if (!args.bareMetal || !args.wazir) {
  console.error('Usage: node compare.js --bare-metal <score.json> --wazir <score.json>');
  process.exit(1);
}

const bareData = loadScore(args.bareMetal);
const wazirData = loadScore(args.wazir);
console.log(compare(bareData, wazirData));
