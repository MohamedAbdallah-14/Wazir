import fs from 'node:fs';
import path from 'node:path';

import { parseCommandOptions, parsePositiveInteger } from '../command-options.js';
import { readYamlFile } from '../loaders.js';
import { validateRunCompletion } from '../guards/phase-prerequisite-guard.js';
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
import { readRunConfig, getPhaseLoopCap } from './run-config.js';
import { ensureRun } from '../pipeline/ensure.js';
import { createPhaseFiles, createRepoLocalSymlink } from '../pipeline/phase-files.js';
import { validatePhaseTransition, updatePhaseHeaders } from '../pipeline/transition.js';
import { readUsage, generateReport, initUsage, recordCaptureSavings, recordPhaseUsage } from './usage.js';
import { evaluateLoopCapGuard } from '../guards/loop-cap-guard.js';
import { evaluatePhasePrerequisiteGuard } from '../guards/phase-prerequisite-guard.js';

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
    boolean: ['json', 'complete'],
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
      'task-id',
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

  // Write run ID to latest pointer for session recovery (state-root)
  const latestPath = path.join(stateRoot, 'runs', 'latest');
  try {
    fs.mkdirSync(path.dirname(latestPath), { recursive: true });
    fs.writeFileSync(latestPath, options.run, 'utf8');
  } catch {
    process.stderr.write('Warning: could not write latest run pointer\n');
  }

  // Create phase files from templates (pipeline enforcement)
  const repoLocalRunDir = path.join(projectRoot, '.wazir', 'runs', options.run);
  try {
    fs.mkdirSync(repoLocalRunDir, { recursive: true });
    createPhaseFiles(repoLocalRunDir, projectRoot);
  } catch (err) {
    process.stderr.write(`Warning: could not create phase files: ${err.message}\n`);
  }

  // Create repo-local symlink (.wazir/runs/latest -> run-id)
  try {
    createRepoLocalSymlink(projectRoot, options.run);
  } catch (err) {
    process.stderr.write(`Warning: could not create repo-local symlink: ${err.message}\n`);
  }

  // Auto-check all init phase items — init is completed by capture init itself
  const initPhasePath = path.join(repoLocalRunDir, 'phases', 'init.md');
  try {
    if (fs.existsSync(initPhasePath)) {
      let initContent = fs.readFileSync(initPhasePath, 'utf8');
      initContent = initContent.replace(/^- \[ \]/gm, '- [x]');
      fs.writeFileSync(initPhasePath, initContent, 'utf8');
    }
  } catch { /* best effort */ }

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
  const { projectRoot, stateRoot, options } = resolveCaptureContext(parsed, context);

  requireOption(options, 'run', 'Usage: wazir capture event --run <id> --event <name> [--phase <phase>] [--status <status>] [--loop-count <n>] [--message <text>] [--state-root <path>] [--json]');
  requireOption(options, 'event', 'Usage: wazir capture event --run <id> --event <name> [--phase <phase>] [--status <status>] [--loop-count <n>] [--message <text>] [--state-root <path>] [--json]');

  const runPaths = getRunPaths(stateRoot, options.run);

  // Phase prerequisite gate — block phase_enter if prerequisites not met (exit 44)
  if (options.event === 'phase_enter') {
    if (!fs.existsSync(runPaths.statusPath)) {
      // Standalone mode — allow without guard check (matches handleLoopCheck pattern)
    } else {
      const guardResult = evaluatePhasePrerequisiteGuard({
        run_id: options.run,
        phase: options.phase,
        state_root: stateRoot,
        project_root: projectRoot,
      });
      if (!guardResult.allowed) {
        return {
          exitCode: 44,
          stderr: `Phase prerequisite gate failed (exit 44): ${guardResult.reason}\n`,
          stdout: options.json ? `${JSON.stringify(guardResult, null, 2)}\n` : '',
        };
      }
    }

    // Phase checklist validation — validate all non-transition items are checked
    // Only runs if phase files exist (created by `wazir capture init` with pipeline enforcement)
    const repoLocalPhasesDir = path.join(projectRoot, '.wazir', 'runs', options.run, 'phases');
    if (fs.existsSync(repoLocalPhasesDir)) {
      const currentStatus = fs.existsSync(runPaths.statusPath) ? readStatus(runPaths) : null;
      const currentPhase = currentStatus?.phase ?? 'init';
      const currentPhaseFile = path.join(repoLocalPhasesDir, `${currentPhase}.md`);
      // Only validate if transitioning to a DIFFERENT phase and current phase is ACTIVE
      const phaseContent = fs.existsSync(currentPhaseFile) ? fs.readFileSync(currentPhaseFile, 'utf8') : '';
      const isTransition = currentPhase !== options.phase;
      if (isTransition && phaseContent.includes('— ACTIVE')) {
        const transResult = validatePhaseTransition(repoLocalPhasesDir, currentPhase, options.phase);
        if (!transResult.valid) {
          return {
            exitCode: 1,
            stderr: `Cannot transition. Phase ${currentPhase} has ${transResult.unchecked.length} unchecked items: ${transResult.unchecked.join(', ')}\n`,
            stdout: '',
          };
        }
        // Update phase headers (current → COMPLETED, next → ACTIVE)
        updatePhaseHeaders(repoLocalPhasesDir, currentPhase, options.phase);
        process.stderr.write('Phase transition complete. Run `/compact` to clear context.\n');
      }
    }
  }

  // Terminal state: phase_exit on final_review
  if (options.event === 'phase_exit' && options.phase === 'final_review') {
    const repoLocalPhasesDir = path.join(projectRoot, '.wazir', 'runs', options.run, 'phases');
    if (fs.existsSync(repoLocalPhasesDir)) {
      updatePhaseHeaders(repoLocalPhasesDir, 'final_review', null);
      process.stderr.write('Run complete. All phases passed.\n');
    }
  }

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

  // Enforce workflow completion before allowing summary to finalize
  if (options.complete) {
    const projectRoot = findProjectRoot();
    const manifestPath = path.join(projectRoot, 'wazir.manifest.yaml');
    const result = validateRunCompletion(runPaths.runRoot, manifestPath);
    if (!result.complete) {
      const msg = `Run incomplete: ${result.missing.length} workflow(s) not finished: ${result.missing.join(', ')}`;
      if (options.json) {
        return { exitCode: 1, stdout: JSON.stringify({ run_id: options.run, complete: false, missing_workflows: result.missing, error: msg }, null, 2) + '\n' };
      }
      return { exitCode: 1, stderr: msg + '\n' };
    }
  }

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

function handleLoopCheck(parsed, context = {}) {
  const { stateRoot, options } = resolveCaptureContext(parsed, context);

  requireOption(options, 'run', 'Usage: wazir capture loop-check --run <id> --phase <phase> --loop-count <n> [--task-id <id>] [--state-root <path>] [--json]');
  requireOption(options, 'phase', 'Usage: wazir capture loop-check --run <id> --phase <phase> --loop-count <n> [--task-id <id>] [--state-root <path>] [--json]');
  requireOption(options, 'loopCount', 'Usage: wazir capture loop-check --run <id> --phase <phase> --loop-count <n> [--task-id <id>] [--state-root <path>] [--json]');

  const runPaths = getRunPaths(stateRoot, options.run);

  // Standalone mode: if status.json doesn't exist, allow (exit 0)
  if (!fs.existsSync(runPaths.statusPath)) {
    const notice = 'loop-check: standalone mode (no status.json), allowing.\n';
    return {
      exitCode: 0,
      stdout: options.json ? `${JSON.stringify({ allowed: true, reason: 'standalone mode' }, null, 2)}\n` : '',
      stderr: options.json ? '' : notice,
    };
  }

  // Record the event and update loop count in status.json
  const status = readStatus(runPaths);
  const loopCount = parsePositiveInteger(options.loopCount, '--loop-count');
  const loopPhase = options.phase;
  const loopKey = options.taskId ? `${loopPhase}:${options.taskId}` : loopPhase;

  status.phase_loop_counts = {
    ...(status.phase_loop_counts ?? {}),
    [loopKey]: loopCount,
  };

  const event = createBaseEvent('loop_iteration', {
    run_id: options.run,
    phase: loopPhase,
    status: status.status,
    loop_count: loopCount,
    loop_key: loopKey,
  });

  if (options.taskId) {
    event.task_id = options.taskId;
  }

  status.updated_at = event.created_at;
  status.last_event = 'loop_iteration';

  appendEvent(runPaths, event);
  writeStatus(runPaths, status);

  // Read run-config for loop_cap
  const runConfig = readRunConfig(runPaths);
  const loopCap = getPhaseLoopCap(runConfig, loopPhase);

  // Evaluate the guard using loopKey (task-scoped or phase-scoped).
  // Cap is per-phase but counts are per-task — each task gets its own
  // budget up to the phase cap. This is intentional: task-scoped tracking
  // prevents parallel tasks from sharing a single counter.
  const guardResult = evaluateLoopCapGuard({
    run_id: options.run,
    phase: loopKey,
    state_root: stateRoot,
    loop_cap: loopCap,
  });

  if (!guardResult.allowed) {
    return {
      exitCode: 43,
      stderr: `${guardResult.reason}\n`,
      stdout: options.json ? `${JSON.stringify(guardResult, null, 2)}\n` : '',
    };
  }

  return formatResult({
    run_id: options.run,
    phase: loopPhase,
    loop_key: loopKey,
    loop_count: loopCount,
    loop_cap: loopCap,
    allowed: true,
  }, { json: options.json });
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
      case 'loop-check':
        return handleLoopCheck(parsed, context);
      case 'ensure':
        return handleEnsure(parsed, context);
      default:
        return {
          exitCode: 1,
          stderr: 'Usage: wazir capture <init|event|route|output|summary|usage|loop-check|ensure> ...\n',
        };
    }
  } catch (error) {
    return {
      exitCode: 1,
      stderr: `${error.message}\n`,
    };
  }
}

function handleEnsure(parsed, context = {}) {
  const { projectRoot, stateRoot, options } = resolveCaptureContext(parsed, context);
  const result = ensureRun(projectRoot, stateRoot);
  const msg = result.created ? `Created new run: ${result.runId}` : `Resumed existing run: ${result.runId}`;
  if (options.json) {
    return { exitCode: 0, stdout: JSON.stringify({ ...result, message: msg }, null, 2) + '\n' };
  }
  return { exitCode: 0, stdout: msg + '\n' };
}
