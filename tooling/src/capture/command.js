import fs from 'node:fs';
import path from 'node:path';

import { parseCommandOptions, parsePositiveInteger } from '../command-options.js';
import { readYamlFile } from '../loaders.js';
import { findProjectRoot } from '../project-root.js';
import { resolveStateRoot } from '../state-root.js';
import {
  appendEvent,
  createCaptureTarget,
  ensureRunDirectories,
  getRunPaths,
  readStatus,
  resolveCapturePath,
  writeCaptureOutput,
  writeStatus,
  writeSummary,
} from './store.js';
import { readUsage, generateReport, initUsage, recordCaptureSavings, recordPhaseUsage } from './usage.js';

function formatResult(payload, options = {}) {
  if (options.json) {
    return {
      exitCode: 0,
      stdout: `${JSON.stringify(payload, null, 2)}\n`,
    };
  }

  if (payload.capture_path) {
    return {
      exitCode: 0,
      stdout: `${payload.capture_path}\n`,
    };
  }

  if (payload.summary_path) {
    return {
      exitCode: 0,
      stdout: `${payload.summary_path}\n`,
    };
  }

  return {
    exitCode: 0,
    stdout: `${payload.run_id} ${payload.event ?? payload.status}\n`,
  };
}

function readInput() {
  return fs.readFileSync(0, 'utf8');
}

function resolveCaptureContext(parsed, context = {}) {
  const projectRoot = findProjectRoot(context.cwd ?? process.cwd());
  const manifest = readYamlFile(path.join(projectRoot, 'wazir.manifest.yaml'));
  const { options } = parseCommandOptions(parsed.args, {
    boolean: ['json'],
    string: [
      'run',
      'phase',
      'status',
      'state-root',
      'event',
      'message',
      'loop-count',
      'name',
      'suffix',
      'capture-path',
      'command',
      'exit-code',
    ],
  });
  const stateRoot = resolveStateRoot(projectRoot, manifest, {
    cwd: context.cwd ?? process.cwd(),
    override: options.stateRoot,
  });

  return {
    projectRoot,
    stateRoot,
    options,
  };
}

function requireOption(options, key, usage) {
  if (!options[key]) {
    throw new Error(usage);
  }
}

function createBaseEvent(eventName, fields = {}) {
  return {
    event: eventName,
    created_at: new Date().toISOString(),
    ...fields,
  };
}

function handleInit(parsed, context = {}) {
  const { projectRoot, stateRoot, options } = resolveCaptureContext(parsed, context);

  requireOption(options, 'run', 'Usage: wazir capture init --run <id> --phase <phase> --status <status> [--state-root <path>] [--json]');
  requireOption(options, 'phase', 'Usage: wazir capture init --run <id> --phase <phase> --status <status> [--state-root <path>] [--json]');
  requireOption(options, 'status', 'Usage: wazir capture init --run <id> --phase <phase> --status <status> [--state-root <path>] [--json]');

  const runPaths = getRunPaths(stateRoot, options.run);
  const createdAt = new Date().toISOString();
  ensureRunDirectories(runPaths);

  const status = {
    run_id: options.run,
    project_root: projectRoot,
    phase: options.phase,
    status: options.status,
    created_at: createdAt,
    updated_at: createdAt,
    phase_loop_counts: {},
    artifacts: {
      events_path: runPaths.eventsPath,
      summary_path: null,
      captures_dir: runPaths.capturesDir,
    },
    last_event: 'session_start',
  };

  writeStatus(runPaths, status);

  appendEvent(runPaths, createBaseEvent('session_start', {
    run_id: options.run,
    project_root: projectRoot,
    phase: options.phase,
    status: options.status,
  }));

  // Initialize usage tracking for this run
  initUsage(runPaths, options.run);

  // Write run ID to latest pointer for session recovery
  const latestPath = path.join(stateRoot, 'runs', 'latest');
  try {
    fs.mkdirSync(path.dirname(latestPath), { recursive: true });
    fs.writeFileSync(latestPath, options.run, 'utf8');
  } catch {
    process.stderr.write('Warning: could not write latest run pointer\n');
  }

  return formatResult({
    run_id: options.run,
    phase: options.phase,
    status: options.status,
    state_root: stateRoot,
    run_root: runPaths.runRoot,
    status_path: runPaths.statusPath,
    events_path: runPaths.eventsPath,
    captures_dir: runPaths.capturesDir,
  }, { json: options.json });
}

function handleEvent(parsed, context = {}) {
  const { stateRoot, options } = resolveCaptureContext(parsed, context);

  requireOption(options, 'run', 'Usage: wazir capture event --run <id> --event <name> [--phase <phase>] [--status <status>] [--loop-count <n>] [--message <text>] [--state-root <path>] [--json]');
  requireOption(options, 'event', 'Usage: wazir capture event --run <id> --event <name> [--phase <phase>] [--status <status>] [--loop-count <n>] [--message <text>] [--state-root <path>] [--json]');

  const runPaths = getRunPaths(stateRoot, options.run);
  const status = readStatus(runPaths);
  const event = createBaseEvent(options.event, {
    run_id: options.run,
    phase: options.phase ?? status.phase,
    status: options.status ?? status.status,
  });

  if (options.message) {
    event.message = options.message;
  }

  if (options.loopCount) {
    const loopCount = parsePositiveInteger(options.loopCount, '--loop-count');
    const loopPhase = options.phase ?? status.phase;
    status.phase_loop_counts = {
      ...(status.phase_loop_counts ?? {}),
      [loopPhase]: loopCount,
    };
    event.loop_count = loopCount;
  }

  status.phase = options.phase ?? status.phase;
  status.status = options.status ?? status.status;
  status.updated_at = event.created_at;
  status.last_event = options.event;

  appendEvent(runPaths, event);
  writeStatus(runPaths, status);

  // Record phase usage for phase_enter and phase_exit events
  if (options.event === 'phase_enter' || options.event === 'phase_exit') {
    const phaseForUsage = options.phase ?? status.phase;
    recordPhaseUsage(runPaths, phaseForUsage, { events_count: 1 });
  }

  return formatResult({
    run_id: options.run,
    event: options.event,
    events_path: runPaths.eventsPath,
    status_path: runPaths.statusPath,
  }, { json: options.json });
}

function handleRoute(parsed, context = {}) {
  const { stateRoot, options } = resolveCaptureContext(parsed, context);

  requireOption(options, 'run', 'Usage: wazir capture route --run <id> --name <label> [--suffix <ext>] [--state-root <path>] [--json]');
  requireOption(options, 'name', 'Usage: wazir capture route --run <id> --name <label> [--suffix <ext>] [--state-root <path>] [--json]');

  const runPaths = getRunPaths(stateRoot, options.run);
  const status = readStatus(runPaths);
  const capturePath = createCaptureTarget(runPaths, {
    name: options.name,
    suffix: options.suffix,
  });

  const event = createBaseEvent('pre_tool_capture_route', {
    run_id: options.run,
    phase: status.phase,
    status: status.status,
    capture_path: capturePath,
    capture_name: options.name,
  });

  status.updated_at = event.created_at;
  status.last_event = 'pre_tool_capture_route';
  appendEvent(runPaths, event);
  writeStatus(runPaths, status);

  return formatResult({
    run_id: options.run,
    capture_path: capturePath,
    events_path: runPaths.eventsPath,
  }, { json: options.json });
}

function handleOutput(parsed, context = {}) {
  const { stateRoot, options } = resolveCaptureContext(parsed, context);

  requireOption(options, 'run', 'Usage: wazir capture output --run <id> --command <command> --exit-code <code> [--capture-path <path> | --name <label>] [--suffix <ext>] [--state-root <path>] [--json]');
  requireOption(options, 'command', 'Usage: wazir capture output --run <id> --command <command> --exit-code <code> [--capture-path <path> | --name <label>] [--suffix <ext>] [--state-root <path>] [--json]');
  requireOption(options, 'exitCode', 'Usage: wazir capture output --run <id> --command <command> --exit-code <code> [--capture-path <path> | --name <label>] [--suffix <ext>] [--state-root <path>] [--json]');

  const runPaths = getRunPaths(stateRoot, options.run);
  const status = readStatus(runPaths);
  const capturePath = resolveCapturePath(runPaths, options.capturePath, {
    name: options.name ?? 'tool-output',
    suffix: options.suffix,
  });
  const output = readInput();
  const exitCode = Number.parseInt(options.exitCode, 10);

  if (!Number.isInteger(exitCode)) {
    throw new Error('--exit-code must be an integer');
  }

  writeCaptureOutput(capturePath, output);

  const event = createBaseEvent('post_tool_capture', {
    run_id: options.run,
    phase: status.phase,
    status: status.status,
    command: options.command,
    exit_code: exitCode,
    capture_path: capturePath,
    byte_length: Buffer.byteLength(output),
  });

  status.updated_at = event.created_at;
  status.last_event = 'post_tool_capture';
  status.artifacts = {
    ...(status.artifacts ?? {}),
    last_capture_path: capturePath,
  };

  appendEvent(runPaths, event);
  writeStatus(runPaths, status);

  // Record capture routing savings
  recordCaptureSavings(runPaths, Buffer.byteLength(output), 0);

  return formatResult({
    run_id: options.run,
    capture_path: capturePath,
    byte_length: Buffer.byteLength(output),
    events_path: runPaths.eventsPath,
    status_path: runPaths.statusPath,
  }, { json: options.json });
}

function handleSummary(parsed, context = {}) {
  const { stateRoot, options } = resolveCaptureContext(parsed, context);

  requireOption(options, 'run', 'Usage: wazir capture summary --run <id> [--event <pre_compact_summary|stop_handoff_harvest>] [--state-root <path>] [--json]');

  const runPaths = getRunPaths(stateRoot, options.run);
  const status = readStatus(runPaths);
  const eventName = options.event ?? 'pre_compact_summary';
  const summaryContent = readInput();
  const summaryPath = writeSummary(runPaths, summaryContent);

  const event = createBaseEvent(eventName, {
    run_id: options.run,
    phase: status.phase,
    status: status.status,
    summary_path: summaryPath,
  });

  status.updated_at = event.created_at;
  status.last_event = eventName;
  status.artifacts = {
    ...(status.artifacts ?? {}),
    summary_path: summaryPath,
  };

  appendEvent(runPaths, event);
  writeStatus(runPaths, status);

  recordCaptureSavings(runPaths, 0, Buffer.byteLength(summaryContent));

  return formatResult({
    run_id: options.run,
    summary_path: summaryPath,
    events_path: runPaths.eventsPath,
    status_path: runPaths.statusPath,
  }, { json: options.json });
}

function handleUsage(parsed, context = {}) {
  const { stateRoot, options } = resolveCaptureContext(parsed, context);

  requireOption(options, 'run', 'Usage: wazir capture usage --run <id> [--phase <phase>] [--state-root <path>] [--json]');

  const runPaths = getRunPaths(stateRoot, options.run);
  const format = options.json ? 'json' : 'text';
  const report = generateReport(runPaths, format, { phase: options.phase });

  return {
    exitCode: 0,
    stdout: `${report}\n`,
  };
}

export function runCaptureCommand(parsed, context = {}) {
  try {
    switch (parsed.subcommand) {
      case 'init':
        return handleInit(parsed, context);
      case 'event':
        return handleEvent(parsed, context);
      case 'route':
        return handleRoute(parsed, context);
      case 'output':
        return handleOutput(parsed, context);
      case 'summary':
        return handleSummary(parsed, context);
      case 'usage':
        return handleUsage(parsed, context);
      default:
        return {
          exitCode: 1,
          stderr: 'Usage: wazir capture <init|event|route|output|summary|usage> ...\n',
        };
    }
  } catch (error) {
    return {
      exitCode: 1,
      stderr: `${error.message}\n`,
    };
  }
}
