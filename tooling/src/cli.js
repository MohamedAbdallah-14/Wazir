#!/usr/bin/env node

// Suppress Node.js ExperimentalWarning for built-in SQLite (node:sqlite).
// Must run before any module that transitively imports node:sqlite loads,
// so command handlers are lazy-imported below instead of using static imports.
const _originalEmit = process.emit;
process.emit = function (event, ...args) {
  if (event === 'warning' && args[0]?.name === 'ExperimentalWarning' &&
      args[0]?.message?.includes('SQLite')) {
    return false;
  }
  return _originalEmit.apply(this, [event, ...args]);
};

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const COMMAND_FAMILIES = [
  'export',
  'validate',
  'doctor',
  'index',
  'init',
  'recall',
  'report',
  'state',
  'status',
  'stats',
  'capture'
];

// Lazy-load command handlers so the warning filter is active before node:sqlite loads
const COMMAND_LOADERS = {
  export:   () => import('./export/command.js').then(m => m.runExportCommand),
  validate: () => import('./commands/validate.js').then(m => m.runValidateCommand),
  doctor:   () => import('./doctor/command.js').then(m => m.runDoctorCommand),
  index:    () => import('./index/command.js').then(m => m.runIndexCommand),
  init:     () => import('./init/command.js').then(m => m.runInitCommand),
  recall:   () => import('./recall/command.js').then(m => m.runRecallCommand),
  report:   () => import('./reports/command.js').then(m => m.runReportCommand),
  state:    () => import('./state/command.js').then(m => m.runStateCommand),
  status:   () => import('./status/command.js').then(m => m.runStatusCommand),
  stats:    () => import('./commands/stats.js').then(m => m.runStatsCommand),
  capture:  () => import('./capture/command.js').then(m => m.runCaptureCommand),
};

export function parseArgs(argv) {
  if (!argv.length || argv.includes('--help') || argv.includes('-h')) {
    return {
      command: null,
      subcommand: null,
      args: [],
      help: true
    };
  }

  const [command, maybeSubcommand, ...rest] = argv;
  const hasSubcommand = maybeSubcommand && !maybeSubcommand.startsWith('-');

  return {
    command,
    subcommand: hasSubcommand ? maybeSubcommand : null,
    args: hasSubcommand ? rest : [maybeSubcommand, ...rest].filter(Boolean),
    help: false
  };
}

export function renderHelp() {
  return [
    'wazir',
    '',
    'Host-native engineering OS kit CLI',
    '',
    'Commands:',
    ...COMMAND_FAMILIES.map((name) => `  - ${name}`)
  ].join('\n');
}

export async function main(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);

  if (parsed.help || !parsed.command) {
    console.log(renderHelp());
    return 0;
  }

  if (!COMMAND_FAMILIES.includes(parsed.command)) {
    console.error(`Unknown command: ${parsed.command}`);
    return 1;
  }

  const loader = COMMAND_LOADERS[parsed.command];

  if (!loader) {
    console.error(`wazir ${parsed.command} is not implemented yet`);
    return 2;
  }

  let result;

  try {
    const handler = await loader();
    result = await handler(parsed);
  } catch (error) {
    console.error(error.message);
    return 1;
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return result.exitCode;
}

function isDirectExecution() {
  if (!process.argv[1]) {
    return false;
  }

  return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
}

if (isDirectExecution()) {
  main().then((code) => {
    process.exitCode = code;
  });
}
