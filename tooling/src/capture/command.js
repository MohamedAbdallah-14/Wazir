import fs from 'node:fs';
import path from 'node:path';

import { parseCommandOptions, parsePositiveInteger } from '../command-options.js';
import { validateRunCompletion } from '../guards/phase-prerequisite-guard.js';
import { findProjectRoot } from '../project-root.js';
import { resolveProjectContext } from '../project-context.js';
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
  readScopeStack,
  pushScope,
  popScope,
} from './store.js';
import { readRunConfig, getPhaseLoopCap } from './run-config.js';
import { ensureRun } from '../pipeline/ensure.js';
import { createPhaseFiles, createRepoLocalSymlink } from '../pipeline/phase-files.js';
import { validatePhaseTransition, updatePhaseHeaders } from '../pipeline/transition.js';
import { findActivePhase, extractCurrentStep } from '../hooks/phase-injector.js';
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
      'scope',
      'skill',
    ],
  });
  const ctx = resolveProjectContext(context.cwd ?? process.cwd(), { stateRootOverride: options.stateRoot });
  const projectRoot = ctx.projectRoot;
  const stateRoot = ctx.stateRoot;

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
    // Delete pipeline-active marker so bootstrap gate stops firing (KI-016)
    const markerPath = path.join(projectRoot, '.wazir', 'state', 'pipeline-active');
    try { fs.unlinkSync(markerPath); } catch { /* already gone */ }
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
    const wazirRoot = findProjectRoot();
    const manifestPath = wazirRoot ? path.join(wazirRoot, 'wazir.manifest.yaml') : null;
    if (manifestPath) {
      const result = validateRunCompletion(runPaths.runRoot, manifestPath);
      if (!result.complete) {
        const msg = `Run incomplete: ${result.missing.length} workflow(s) not finished: ${result.missing.join(', ')}`;
        if (options.json) {
          return { exitCode: 1, stdout: JSON.stringify({ run_id: options.run, complete: false, missing_workflows: result.missing, error: msg }, null, 2) + '\n' };
        }
        return { exitCode: 1, stderr: msg + '\n' };
      }
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
      case 'skill-phase':
        return handleSkillPhase(parsed, context);
      case 'skill-exit':
        return handleSkillExit(parsed, context);
      default:
        return {
          exitCode: 1,
          stderr: 'Usage: wazir capture <init|event|route|output|summary|usage|loop-check|ensure|skill-phase|skill-exit> ...\n',
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
  // Quick check for --scope skill without full parsing (avoids unknown option errors)
  const scopeIdx = (parsed.args || []).indexOf('--scope');
  if (scopeIdx !== -1 && parsed.args[scopeIdx + 1] === 'skill') {
    const { projectRoot, options } = resolveSkillContext(parsed, context);
    return handleEnsureSkill(projectRoot, options);
  }

  const { projectRoot, stateRoot, options } = resolveCaptureContext(parsed, context);
  const result = ensureRun(projectRoot, stateRoot);
  const msg = result.created ? `Created new run: ${result.runId}` : `Resumed existing run: ${result.runId}`;
  if (options.json) {
    return { exitCode: 0, stdout: JSON.stringify({ ...result, message: msg }, null, 2) + '\n' };
  }
  return { exitCode: 0, stdout: msg + '\n' };
}

function resolveSkillContext(parsed, context = {}) {
  const cwd = context.cwd ?? process.cwd();
  const projectRoot = findProjectRoot(cwd) ?? path.resolve(cwd);
  const { options } = parseCommandOptions(parsed.args, {
    boolean: ['json', 'complete'],
    string: ['run', 'phase', 'scope', 'skill'],
  });
  return { projectRoot, options };
}

function handleEnsureSkill(projectRoot, options) {
  if (!options.skill) {
    return { exitCode: 1, stderr: 'Usage: wazir capture ensure --scope skill --skill <name> [--run <id>]\n' };
  }

  const skillName = options.skill;

  // I-1: Validate skillName to prevent path traversal
  if (!/^[a-z0-9-]+$/.test(skillName)) {
    return { exitCode: 1, stderr: `Invalid skill name: "${skillName}". Must match /^[a-z0-9-]+$/.\n` };
  }

  const runId = options.run || readLatestRunIdFromProject(projectRoot);
  if (!runId) {
    return { exitCode: 1, stderr: 'No active run found. Run `wazir capture ensure` first.\n' };
  }

  // Validate runId to prevent path traversal
  if (!/^[\w-]+$/.test(runId)) {
    return { exitCode: 1, stderr: `Invalid run ID: "${runId}". Must contain only word characters and hyphens.\n` };
  }

  const runDir = path.join(projectRoot, '.wazir', 'runs', runId);
  if (!fs.existsSync(runDir)) {
    return { exitCode: 1, stderr: `Run directory not found: ${runDir}\n` };
  }

  // Check for skill phase templates
  const templatesDir = path.join(projectRoot, 'templates', 'phases', 'skills', skillName);
  if (!fs.existsSync(templatesDir)) {
    return { exitCode: 1, stderr: `No skill phase templates found at: templates/phases/skills/${skillName}/\n` };
  }

  // Generate invocation ID with random suffix for uniqueness
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 6);
  const prefix = skillName.replace(/[^a-z0-9]/g, '').slice(0, 8);
  const invocationId = `${prefix}-${ts}-${rand}`;

  // Create skill invocation directory with phases
  const skillDir = path.join(runDir, 'skills', invocationId);
  const skillPhasesDir = path.join(skillDir, 'phases');
  fs.mkdirSync(skillPhasesDir, { recursive: true });

  // Render skill phase templates
  const templateFiles = fs.readdirSync(templatesDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  for (let i = 0; i < templateFiles.length; i++) {
    let content = fs.readFileSync(path.join(templatesDir, templateFiles[i]), 'utf8');

    // First phase gets ACTIVE header, rest get NOT ACTIVE
    if (i === 0) {
      content = content.replace(/^## Phase: (\w+)/m, '## Phase: $1 — ACTIVE');
    } else {
      content = content.replace(/^## Phase: (\w+)/m, '## Phase: $1 — NOT ACTIVE');
    }

    fs.writeFileSync(path.join(skillPhasesDir, templateFiles[i]), content);
  }

  // Write skill scope metadata
  fs.writeFileSync(path.join(skillDir, 'scope.yaml'), [
    `skill: ${skillName}`,
    `invocation_id: ${invocationId}`,
    `created_at: ${new Date().toISOString()}`,
    `status: active`,
    '',
  ].join('\n'));

  // Push onto scope stack
  pushScope(runDir, {
    type: 'skill',
    skill: skillName,
    invocation_id: invocationId,
    phases_dir: skillPhasesDir,
  });

  const msg = `Entered skill scope: ${skillName} (${invocationId})`;
  if (options.json) {
    return { exitCode: 0, stdout: JSON.stringify({ skill: skillName, invocation_id: invocationId, phases_dir: skillPhasesDir, message: msg }, null, 2) + '\n' };
  }
  return { exitCode: 0, stdout: msg + '\n' };
}

function readLatestRunIdFromProject(projectRoot) {
  const latestPath = path.join(projectRoot, '.wazir', 'runs', 'latest');
  try {
    const stat = fs.lstatSync(latestPath);
    if (stat.isSymbolicLink()) return path.basename(fs.readlinkSync(latestPath));
    if (stat.isFile()) return fs.readFileSync(latestPath, 'utf8').trim() || null;
  } catch { return null; }
  return null;
}

function handleSkillPhase(parsed, context = {}) {
  const { projectRoot, options } = resolveSkillContext(parsed, context);

  requireOption(options, 'phase', 'Usage: wazir capture skill-phase --phase <name> [--run <id>]');

  const runId = options.run || readLatestRunIdFromProject(projectRoot);
  if (!runId) return { exitCode: 1, stderr: 'No active run found.\n' };

  const runDir = path.join(projectRoot, '.wazir', 'runs', runId);
  const stack = readScopeStack(runDir);
  const skillScope = stack.filter(e => e.type === 'skill').pop();

  if (!skillScope) {
    return { exitCode: 1, stderr: 'No active skill scope. Enter one with `wazir capture ensure --scope skill --skill <name>` first.\n' };
  }

  const skillPhasesDir = skillScope.phases_dir;

  // Find current active skill phase
  const active = findActivePhase(skillPhasesDir);
  if (!active) {
    return { exitCode: 1, stderr: 'No active skill phase found.\n' };
  }

  // Validate all items checked before transition
  const step = extractCurrentStep(active.content);
  if (step) {
    return {
      exitCode: 1,
      stderr: `Cannot transition. Skill phase ${active.phase} has ${step.totalSteps - step.stepNum + 1} unchecked items. Current: ${step.current}\n`,
    };
  }

  // Find the target phase file
  const phaseFiles = fs.readdirSync(skillPhasesDir).filter(f => f.endsWith('.md')).sort();
  const targetFile = phaseFiles.find(f => {
    const content = fs.readFileSync(path.join(skillPhasesDir, f), 'utf8');
    const match = content.match(/^## Phase:\s*(\w+)/m);
    return match && match[1] === options.phase;
  });

  if (!targetFile) {
    return { exitCode: 1, stderr: `Target skill phase '${options.phase}' not found in templates.\n` };
  }

  // Update headers: current → COMPLETED, target → ACTIVE
  // Find current active file
  const currentFile = phaseFiles.find(f => {
    const content = fs.readFileSync(path.join(skillPhasesDir, f), 'utf8');
    return content.includes('— ACTIVE');
  });

  if (currentFile) {
    const currentPath = path.join(skillPhasesDir, currentFile);
    let content = fs.readFileSync(currentPath, 'utf8');
    content = content.replace('— ACTIVE', '— COMPLETED');
    fs.writeFileSync(currentPath, content);
  }

  const targetPath = path.join(skillPhasesDir, targetFile);
  let targetContent = fs.readFileSync(targetPath, 'utf8');
  if (!targetContent.includes('— NOT ACTIVE')) {
    return { exitCode: 1, stderr: `Cannot activate phase "${options.phase}": target file does not contain "— NOT ACTIVE" header.\n` };
  }
  targetContent = targetContent.replace('— NOT ACTIVE', '— ACTIVE');
  fs.writeFileSync(targetPath, targetContent);

  const msg = `Skill phase transition: ${active.phase} → ${options.phase}`;
  if (options.json) {
    return { exitCode: 0, stdout: JSON.stringify({ from: active.phase, to: options.phase, message: msg }, null, 2) + '\n' };
  }
  return { exitCode: 0, stdout: msg + '\n' };
}

function handleSkillExit(parsed, context = {}) {
  const { projectRoot, options } = resolveSkillContext(parsed, context);

  const runId = options.run || readLatestRunIdFromProject(projectRoot);
  if (!runId) return { exitCode: 1, stderr: 'No active run found.\n' };

  const runDir = path.join(projectRoot, '.wazir', 'runs', runId);
  const stack = readScopeStack(runDir);
  const skillScope = stack.filter(e => e.type === 'skill').pop();

  if (!skillScope) {
    return { exitCode: 1, stderr: 'No active skill scope to exit.\n' };
  }

  const skillPhasesDir = skillScope.phases_dir;

  // Verify ALL skill phases are complete (no unchecked items in any phase)
  const phaseFiles = fs.readdirSync(skillPhasesDir).filter(f => f.endsWith('.md')).sort();
  for (const f of phaseFiles) {
    const content = fs.readFileSync(path.join(skillPhasesDir, f), 'utf8');
    const step = extractCurrentStep(content);
    if (step) {
      const match = content.match(/^## Phase:\s*(\w+)/m);
      const phaseName = match ? match[1] : f;
      return {
        exitCode: 1,
        stderr: `Cannot exit skill. Phase ${phaseName} has ${step.totalSteps - step.stepNum + 1} unchecked items.\n`,
      };
    }
  }

  // Pop scope stack
  popScope(runDir);

  const msg = `Exited skill scope: ${skillScope.skill} (${skillScope.invocation_id})`;
  if (options.json) {
    return { exitCode: 0, stdout: JSON.stringify({ skill: skillScope.skill, invocation_id: skillScope.invocation_id, message: msg }, null, 2) + '\n' };
  }
  return { exitCode: 0, stdout: msg + '\n' };
}
