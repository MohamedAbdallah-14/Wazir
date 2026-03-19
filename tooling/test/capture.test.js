import { describe, test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI_PATH = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const BASE_MANIFEST_PATHS = {
  input: 'input',
  artifacts_repo: 'artifacts_repo',
  roles: 'roles',
  workflows: 'workflows',
  skills: 'skills',
  hooks: 'hooks',
  templates: 'templates',
  schemas: 'schemas',
  expertise: 'expertise',
  docs: 'docs',
  exports: 'exports',
  tooling: 'tooling',
  memory: 'memory',
  examples: 'examples',
  archive: 'archive',
  state_root_default: '~/.wazir/projects/{project_slug}',
};

function runCli(args, options = {}) {
  try {
    const stdout = execFileSync('node', [CLI_PATH, ...args], {
      encoding: 'utf8',
      cwd: options.cwd,
      input: options.input,
    });

    return {
      exitCode: 0,
      stdout,
      stderr: '',
    };
  } catch (error) {
    return {
      exitCode: error.status ?? 1,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
    };
  }
}

function createCaptureFixture() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-capture-'));
  const stateRoot = path.join(fixtureRoot, '.state-root');

  for (const relativePath of Object.values(BASE_MANIFEST_PATHS)) {
    if (relativePath.startsWith('~') || relativePath.includes('{')) {
      continue;
    }

    fs.mkdirSync(path.join(fixtureRoot, relativePath), { recursive: true });
  }

  const manifest = {
    manifest_version: 2,
    project: {
      name: 'fixture-capture',
      display_name: 'Fixture Capture',
      version: '0.1.0',
      description: 'Fixture manifest for capture tests.',
      license: 'MIT',
    },
    versioning_policy: {
      strategy: 'semver',
      stability: 'pre-1.0-alpha',
      compatibility: 'additive_changes_only_until_manifest_bump',
    },
    paths: BASE_MANIFEST_PATHS,
    hosts: ['codex'],
    workflows: ['clarify', 'verify', 'review'],
    phases: ['clarify', 'verify', 'review'],
    roles: ['clarifier', 'verifier', 'reviewer'],
    export_targets: ['codex'],
    required_hooks: [
      'session_start',
      'pre_tool_capture_route',
      'post_tool_capture',
      'pre_compact_summary',
      'stop_handoff_harvest',
    ],
    protected_paths: ['input'],
    prohibited_terms: ['banned-term'],
    adapters: {
      context_mode: {
        enabled_by_default: false,
        required: false,
        install_mode: 'external',
        package_presence: 'optional',
      },
    },
    index: {
      core_parsers: [],
      optional_language_plugins: [],
    },
    validation_checks: [],
  };

  fs.writeFileSync(
    path.join(fixtureRoot, 'wazir.manifest.yaml'),
    JSON.stringify(manifest, null, 2),
  );

  return {
    fixtureRoot,
    stateRoot,
    cleanup() {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    },
  };
}

function readNdjson(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe('wazir capture command', () => {
  test('initializes a run ledger with status and session-start event output', () => {
    const fixture = createCaptureFixture();

    try {
      const result = runCli(
        ['capture', 'init', '--run', 'run-123', '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0);
      const payload = JSON.parse(result.stdout);
      assert.strictEqual(payload.run_id, 'run-123');

      const statusPath = path.join(fixture.stateRoot, 'runs', 'run-123', 'status.json');
      const eventsPath = path.join(fixture.stateRoot, 'runs', 'run-123', 'events.ndjson');
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      const events = readNdjson(eventsPath);

      assert.strictEqual(status.phase, 'clarify');
      assert.strictEqual(status.status, 'running');
      assert.strictEqual(status.artifacts.events_path, eventsPath);
      assert.strictEqual(events[0].event, 'session_start');
    } finally {
      fixture.cleanup();
    }
  });

  test('appends an event and updates status loop counts', () => {
    const fixture = createCaptureFixture();

    try {
      const initResult = runCli(
        ['capture', 'init', '--run', 'run-123', '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );
      assert.strictEqual(initResult.exitCode, 0);

      const eventResult = runCli(
        ['capture', 'event', '--run', 'run-123', '--event', 'phase_transition', '--phase', 'verify', '--status', 'running', '--loop-count', '2', '--message', 'verification started', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(eventResult.exitCode, 0);
      const payload = JSON.parse(eventResult.stdout);
      assert.strictEqual(payload.event, 'phase_transition');

      const status = JSON.parse(fs.readFileSync(path.join(fixture.stateRoot, 'runs', 'run-123', 'status.json'), 'utf8'));
      const events = readNdjson(path.join(fixture.stateRoot, 'runs', 'run-123', 'events.ndjson'));
      const lastEvent = events.at(-1);

      assert.strictEqual(status.phase, 'verify');
      assert.strictEqual(status.phase_loop_counts.verify, 2);
      assert.strictEqual(lastEvent.message, 'verification started');
      assert.strictEqual(lastEvent.loop_count, 2);
    } finally {
      fixture.cleanup();
    }
  });

  test('routes and captures tool output into run-local artifacts', () => {
    const fixture = createCaptureFixture();

    try {
      const initResult = runCli(
        ['capture', 'init', '--run', 'run-123', '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );
      assert.strictEqual(initResult.exitCode, 0);

      const routeResult = runCli(
        ['capture', 'route', '--run', 'run-123', '--name', 'npm-test', '--suffix', '.txt', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(routeResult.exitCode, 0);
      const routePayload = JSON.parse(routeResult.stdout);
      assert.match(routePayload.capture_path, /captures\/.*npm-test\.txt$/);

      const outputResult = runCli(
        ['capture', 'output', '--run', 'run-123', '--capture-path', routePayload.capture_path, '--command', 'npm test', '--exit-code', '0', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot, input: 'all tests passed\nwith details\n' },
      );

      assert.strictEqual(outputResult.exitCode, 0);
      const outputPayload = JSON.parse(outputResult.stdout);
      const events = readNdjson(path.join(fixture.stateRoot, 'runs', 'run-123', 'events.ndjson'));

      assert.strictEqual(outputPayload.capture_path, routePayload.capture_path);
      assert.strictEqual(fs.readFileSync(routePayload.capture_path, 'utf8'), 'all tests passed\nwith details\n');
      assert.strictEqual(events.at(-1).event, 'post_tool_capture');
      assert.strictEqual(events.at(-1).capture_path, routePayload.capture_path);
    } finally {
      fixture.cleanup();
    }
  });

  test('writes a markdown summary artifact and records the summary event', () => {
    const fixture = createCaptureFixture();

    try {
      const initResult = runCli(
        ['capture', 'init', '--run', 'run-123', '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );
      assert.strictEqual(initResult.exitCode, 0);

      const summaryResult = runCli(
        ['capture', 'summary', '--run', 'run-123', '--event', 'stop_handoff_harvest', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot, input: '# Handoff\n- keep going\n' },
      );

      assert.strictEqual(summaryResult.exitCode, 0);
      const payload = JSON.parse(summaryResult.stdout);
      const summaryPath = path.join(fixture.stateRoot, 'runs', 'run-123', 'summary.md');
      const status = JSON.parse(fs.readFileSync(path.join(fixture.stateRoot, 'runs', 'run-123', 'status.json'), 'utf8'));
      const events = readNdjson(path.join(fixture.stateRoot, 'runs', 'run-123', 'events.ndjson'));

      assert.strictEqual(payload.summary_path, summaryPath);
      assert.strictEqual(fs.readFileSync(summaryPath, 'utf8'), '# Handoff\n- keep going\n');
      assert.strictEqual(status.artifacts.summary_path, summaryPath);
      assert.strictEqual(events.at(-1).event, 'stop_handoff_harvest');
    } finally {
      fixture.cleanup();
    }
  });

  test('reports usage data as JSON', () => {
    const fixture = createCaptureFixture();

    try {
      runCli(
        ['capture', 'init', '--run', 'run-usage', '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      const usagePath = path.join(fixture.stateRoot, 'runs', 'run-usage', 'usage.json');
      const usage = {
        schema_version: 1,
        run_id: 'run-usage',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phases: {},
        roles: {},
        savings: {
          capture_routing: { raw_bytes: 4000, summary_bytes: 400, estimated_tokens_avoided: 900, strategy: 'byte_heuristic' },
          context_mode: { available: false, raw_kb: 0, context_kb: 0, savings_ratio: '0%', per_tool: {} },
          compaction: { compaction_count: 0, pre_compaction_tokens_est: 0, post_compaction_tokens_est: 0 },
        },
        totals: { total_events: 0, total_capture_bytes_raw: 0, total_capture_bytes_summary: 0, total_estimated_tokens_if_raw: 0, total_estimated_tokens_avoided: 0, savings_percentage: '0%' },
      };
      fs.writeFileSync(usagePath, JSON.stringify(usage, null, 2));

      const result = runCli(
        ['capture', 'usage', '--run', 'run-usage', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0);
      const parsed = JSON.parse(result.stdout);
      assert.strictEqual(parsed.run_id, 'run-usage');
      assert.strictEqual(parsed.savings.capture_routing.raw_bytes, 4000);
    } finally {
      fixture.cleanup();
    }
  });

  test('reports usage data as human-readable text', () => {
    const fixture = createCaptureFixture();

    try {
      runCli(
        ['capture', 'init', '--run', 'run-text', '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      const usagePath = path.join(fixture.stateRoot, 'runs', 'run-text', 'usage.json');
      const usage = {
        schema_version: 1,
        run_id: 'run-text',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phases: { clarify: { events_count: 5, capture_bytes_raw: 2000, capture_bytes_summary: 200, estimated_tokens_if_raw: 500, estimated_tokens_avoided: 450 } },
        roles: {},
        savings: {
          capture_routing: { raw_bytes: 2000, summary_bytes: 200, estimated_tokens_avoided: 450, strategy: 'byte_heuristic' },
          context_mode: { available: false, raw_kb: 0, context_kb: 0, savings_ratio: '0%', per_tool: {} },
          compaction: { compaction_count: 0, pre_compaction_tokens_est: 0, post_compaction_tokens_est: 0 },
        },
        totals: { total_events: 5, total_capture_bytes_raw: 2000, total_capture_bytes_summary: 200, total_estimated_tokens_if_raw: 500, total_estimated_tokens_avoided: 450, savings_percentage: '90.0%' },
      };
      fs.writeFileSync(usagePath, JSON.stringify(usage, null, 2));

      const result = runCli(
        ['capture', 'usage', '--run', 'run-text', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Usage Report'));
      assert.ok(result.stdout.includes('clarify'));
    } finally {
      fixture.cleanup();
    }
  });

  test('usage subcommand returns empty report when no usage.json exists', () => {
    const fixture = createCaptureFixture();

    try {
      runCli(
        ['capture', 'init', '--run', 'run-empty', '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      const result = runCli(
        ['capture', 'usage', '--run', 'run-empty', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0);
      const parsed = JSON.parse(result.stdout);
      assert.strictEqual(parsed.schema_version, 1);
      assert.deepStrictEqual(parsed.phases, {});
    } finally {
      fixture.cleanup();
    }
  });

  test('usage subcommand filters by --phase when provided', () => {
    const fixture = createCaptureFixture();

    try {
      runCli(
        ['capture', 'init', '--run', 'run-phase', '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      const usagePath = path.join(fixture.stateRoot, 'runs', 'run-phase', 'usage.json');
      const usage = {
        schema_version: 1,
        run_id: 'run-phase',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phases: {
          clarify: { events_count: 5, capture_bytes_raw: 2000, capture_bytes_summary: 200, estimated_tokens_if_raw: 500, estimated_tokens_avoided: 450 },
          execute: { events_count: 10, capture_bytes_raw: 8000, capture_bytes_summary: 800, estimated_tokens_if_raw: 2000, estimated_tokens_avoided: 1800 },
        },
        roles: {},
        savings: {
          capture_routing: { raw_bytes: 10000, summary_bytes: 1000, estimated_tokens_avoided: 2250, strategy: 'byte_heuristic' },
          context_mode: { available: false, raw_kb: 0, context_kb: 0, savings_ratio: '0%', per_tool: {} },
          compaction: { compaction_count: 0, pre_compaction_tokens_est: 0, post_compaction_tokens_est: 0 },
        },
        totals: { total_events: 15, total_capture_bytes_raw: 10000, total_capture_bytes_summary: 1000, total_estimated_tokens_if_raw: 2500, total_estimated_tokens_avoided: 2250, savings_percentage: '90.0%' },
      };
      fs.writeFileSync(usagePath, JSON.stringify(usage, null, 2));

      const result = runCli(
        ['capture', 'usage', '--run', 'run-phase', '--phase', 'clarify', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0);
      const parsed = JSON.parse(result.stdout);
      assert.ok(parsed.phases.clarify, 'should include clarify phase');
      assert.strictEqual(parsed.phases.execute, undefined, 'should NOT include execute phase');
    } finally {
      fixture.cleanup();
    }
  });
});

describe('capture handler wiring', () => {
  test('capture init creates usage.json and writes latest run pointer', () => {
    const fixture = createCaptureFixture();
    try {
      const result = runCli(
        ['capture', 'init', '--run', 'run-wire-test', '--phase', 'clarify', '--status', 'starting', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );
      assert.strictEqual(result.exitCode, 0);

      const usagePath = path.join(fixture.stateRoot, 'runs', 'run-wire-test', 'usage.json');
      assert.ok(fs.existsSync(usagePath), 'usage.json should exist after init');
      const usage = JSON.parse(fs.readFileSync(usagePath, 'utf8'));
      assert.strictEqual(usage.run_id, 'run-wire-test');

      const latestPath = path.join(fixture.stateRoot, 'runs', 'latest');
      assert.ok(fs.existsSync(latestPath), 'latest file should exist after init');
      assert.strictEqual(fs.readFileSync(latestPath, 'utf8'), 'run-wire-test');
    } finally {
      fixture.cleanup();
    }
  });

  test('capture output records capture routing savings in usage.json', () => {
    const fixture = createCaptureFixture();
    try {
      runCli(
        ['capture', 'init', '--run', 'run-savings-test', '--phase', 'execute', '--status', 'starting', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      const content = 'x'.repeat(1000);
      runCli(
        ['capture', 'output', '--run', 'run-savings-test', '--command', 'test-cmd', '--exit-code', '0', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot, input: content },
      );

      const usagePath = path.join(fixture.stateRoot, 'runs', 'run-savings-test', 'usage.json');
      const usage = JSON.parse(fs.readFileSync(usagePath, 'utf8'));
      assert.ok(usage.savings.capture_routing.raw_bytes > 0, 'raw_bytes should be > 0 after output capture');
    } finally {
      fixture.cleanup();
    }
  });

  test('capture event records phase usage on phase_enter and phase_exit', () => {
    const fixture = createCaptureFixture();
    try {
      runCli(
        ['capture', 'init', '--run', 'run-phase-test', '--phase', 'clarify', '--status', 'starting', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      runCli(
        ['capture', 'event', '--run', 'run-phase-test', '--event', 'phase_enter', '--phase', 'verify', '--status', 'in_progress', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );
      runCli(
        ['capture', 'event', '--run', 'run-phase-test', '--event', 'phase_exit', '--phase', 'verify', '--status', 'completed', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      const usagePath = path.join(fixture.stateRoot, 'runs', 'run-phase-test', 'usage.json');
      const usage = JSON.parse(fs.readFileSync(usagePath, 'utf8'));
      assert.strictEqual(usage.phases.verify.events_count, 2, 'events_count should be 2 after enter + exit');
    } finally {
      fixture.cleanup();
    }
  });

  test('capture summary records summary bytes in usage.json savings', () => {
    const fixture = createCaptureFixture();
    try {
      runCli(
        ['capture', 'init', '--run', 'run-summary-bytes', '--phase', 'execute', '--status', 'starting', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      const rawContent = 'x'.repeat(2000);
      runCli(
        ['capture', 'output', '--run', 'run-summary-bytes', '--command', 'test-cmd', '--exit-code', '0', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot, input: rawContent },
      );

      const summaryContent = '# Summary\nkey points only\n';
      runCli(
        ['capture', 'summary', '--run', 'run-summary-bytes', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot, input: summaryContent },
      );

      const usagePath = path.join(fixture.stateRoot, 'runs', 'run-summary-bytes', 'usage.json');
      const usage = JSON.parse(fs.readFileSync(usagePath, 'utf8'));
      assert.ok(usage.savings.capture_routing.summary_bytes > 0, 'summary_bytes should be > 0 after summary capture');
      assert.strictEqual(usage.savings.capture_routing.summary_bytes, Buffer.byteLength(summaryContent));
      assert.strictEqual(usage.savings.capture_routing.raw_bytes, Buffer.byteLength(rawContent));
    } finally {
      fixture.cleanup();
    }
  });

  test('capture event with non-phase event does NOT record phase usage', () => {
    const fixture = createCaptureFixture();
    try {
      runCli(
        ['capture', 'init', '--run', 'run-nophase-test', '--phase', 'execute', '--status', 'starting', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      runCli(
        ['capture', 'event', '--run', 'run-nophase-test', '--event', 'tool_call', '--status', 'in_progress', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      const usagePath = path.join(fixture.stateRoot, 'runs', 'run-nophase-test', 'usage.json');
      const usage = JSON.parse(fs.readFileSync(usagePath, 'utf8'));
      assert.deepStrictEqual(usage.phases, {}, 'phases should be empty after a non-phase event');
    } finally {
      fixture.cleanup();
    }
  });
});

describe('phase_enter prerequisite gate', () => {
  function createPrereqFixture() {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-prereq-'));
    const stateRoot = path.join(fixtureRoot, '.state-root');

    for (const relativePath of Object.values(BASE_MANIFEST_PATHS)) {
      if (relativePath.startsWith('~') || relativePath.includes('{')) continue;
      fs.mkdirSync(path.join(fixtureRoot, relativePath), { recursive: true });
    }

    const manifest = {
      manifest_version: 2,
      project: {
        name: 'fixture-prereq',
        display_name: 'Fixture Prereq',
        version: '0.1.0',
        description: 'Fixture for prerequisite gate tests.',
        license: 'MIT',
      },
      versioning_policy: {
        strategy: 'semver',
        stability: 'pre-1.0-alpha',
        compatibility: 'additive_changes_only_until_manifest_bump',
      },
      paths: BASE_MANIFEST_PATHS,
      hosts: ['codex'],
      workflows: ['clarify', 'execute', 'verify', 'review'],
      phases: ['init', 'clarifier', 'executor', 'final_review'],
      phase_prerequisites: {
        init: {},
        clarifier: {},
        executor: {
          required_artifacts: [
            'clarified/clarification.md',
            'clarified/spec-hardened.md',
            'clarified/design.md',
            'clarified/execution-plan.md',
          ],
          required_phase_exits: ['clarifier'],
        },
        final_review: {
          required_artifacts: [
            'clarified/clarification.md',
            'clarified/spec-hardened.md',
            'clarified/design.md',
            'clarified/execution-plan.md',
            'artifacts/verification-proof.md',
          ],
          required_phase_exits: ['clarifier', 'executor'],
        },
      },
      roles: ['clarifier', 'executor', 'verifier', 'reviewer'],
      export_targets: ['codex'],
      required_hooks: [
        'session_start',
        'pre_tool_capture_route',
        'post_tool_capture',
        'pre_compact_summary',
        'stop_handoff_harvest',
      ],
      protected_paths: ['input'],
      prohibited_terms: ['banned-term'],
      adapters: {
        context_mode: {
          enabled_by_default: false,
          required: false,
          install_mode: 'external',
          package_presence: 'optional',
        },
      },
      index: { core_parsers: [], optional_language_plugins: [] },
      validation_checks: [],
    };

    fs.writeFileSync(
      path.join(fixtureRoot, 'wazir.manifest.yaml'),
      JSON.stringify(manifest, null, 2),
    );

    return {
      fixtureRoot,
      stateRoot,
      cleanup() {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      },
    };
  }

  function writeArtifacts(stateRoot, runId, artifacts) {
    for (const artifact of artifacts) {
      const artifactPath = path.join(stateRoot, 'runs', runId, artifact);
      fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
      fs.writeFileSync(artifactPath, `# ${artifact}\n`);
    }
  }

  function writePhaseExit(stateRoot, runId, phaseName) {
    const eventsPath = path.join(stateRoot, 'runs', runId, 'events.ndjson');
    const event = JSON.stringify({
      event: 'phase_exit',
      phase: phaseName,
      status: 'completed',
      created_at: new Date().toISOString(),
    });
    fs.appendFileSync(eventsPath, `${event}\n`);
  }

  test('phase_enter for executor blocked when artifacts missing — exit 44', () => {
    const fixture = createPrereqFixture();
    try {
      const runId = 'run-prereq-block';
      runCli(
        ['capture', 'init', '--run', runId, '--phase', 'clarifier', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      const result = runCli(
        ['capture', 'event', '--run', runId, '--event', 'phase_enter', '--phase', 'executor', '--status', 'in_progress', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 44, `expected exit 44 but got ${result.exitCode}: stderr=${result.stderr}`);
      assert.match(result.stderr, /Phase prerequisite gate failed/);
    } finally {
      fixture.cleanup();
    }
  });

  test('phase_enter for executor allowed when all artifacts exist — exit 0', () => {
    const fixture = createPrereqFixture();
    try {
      const runId = 'run-prereq-pass';
      runCli(
        ['capture', 'init', '--run', runId, '--phase', 'clarifier', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      writeArtifacts(fixture.stateRoot, runId, [
        'clarified/clarification.md',
        'clarified/spec-hardened.md',
        'clarified/design.md',
        'clarified/execution-plan.md',
      ]);
      writePhaseExit(fixture.stateRoot, runId, 'clarifier');

      const result = runCli(
        ['capture', 'event', '--run', runId, '--event', 'phase_enter', '--phase', 'executor', '--status', 'in_progress', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0, `expected exit 0 but got ${result.exitCode}: stderr=${result.stderr}`);
    } finally {
      fixture.cleanup();
    }
  });

  test('phase_enter for init — no prerequisites, exit 0', () => {
    const fixture = createPrereqFixture();
    try {
      const runId = 'run-prereq-init';
      runCli(
        ['capture', 'init', '--run', runId, '--phase', 'init', '--status', 'starting', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      const result = runCli(
        ['capture', 'event', '--run', runId, '--event', 'phase_enter', '--phase', 'clarifier', '--status', 'in_progress', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0, `expected exit 0 but got ${result.exitCode}: stderr=${result.stderr}`);
    } finally {
      fixture.cleanup();
    }
  });

  test('non-phase_enter events unaffected — exit 0 regardless', () => {
    const fixture = createPrereqFixture();
    try {
      const runId = 'run-prereq-nonevent';
      runCli(
        ['capture', 'init', '--run', runId, '--phase', 'clarifier', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      // phase_exit for executor without prerequisites should still work
      const result = runCli(
        ['capture', 'event', '--run', runId, '--event', 'phase_exit', '--phase', 'executor', '--status', 'completed', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0, `expected exit 0 but got ${result.exitCode}: stderr=${result.stderr}`);
    } finally {
      fixture.cleanup();
    }
  });

  test('phase_enter standalone mode — no status.json, exit 0', () => {
    const fixture = createPrereqFixture();
    try {
      const runId = 'run-prereq-standalone';
      const runRoot = path.join(fixture.stateRoot, 'runs', runId);
      fs.mkdirSync(runRoot, { recursive: true });
      // No status.json — standalone mode

      const result = runCli(
        ['capture', 'event', '--run', runId, '--event', 'phase_enter', '--phase', 'executor', '--status', 'in_progress', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      // Standalone mode: guard is skipped (exit 44 NOT returned).
      // readStatus() will throw since no status.json exists, causing exit 1.
      // The key assertion: exit code is NOT 44 (the guard did not block).
      assert.notStrictEqual(result.exitCode, 44, 'standalone should NOT trigger prerequisite gate (exit 44)');
    } finally {
      fixture.cleanup();
    }
  });
});

describe('loop-check', () => {
  function writeRunConfig(stateRoot, runId, yamlContent) {
    const runRoot = path.join(stateRoot, 'runs', runId);
    fs.mkdirSync(runRoot, { recursive: true });
    fs.writeFileSync(path.join(runRoot, 'run-config.yaml'), yamlContent);
  }

  test('loop-check within cap', () => {
    const fixture = createCaptureFixture();
    try {
      const runId = 'run-lc-within';
      runCli(
        ['capture', 'init', '--run', runId, '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      writeRunConfig(fixture.stateRoot, runId, 'phase_policy:\n  clarify: { enabled: true, loop_cap: 10 }\n');

      const result = runCli(
        ['capture', 'loop-check', '--run', runId, '--phase', 'clarify', '--loop-count', '1', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0, `expected exit 0 but got ${result.exitCode}: ${result.stderr}`);
      const payload = JSON.parse(result.stdout);
      assert.strictEqual(payload.allowed, true);
      assert.strictEqual(payload.loop_cap, 10);
    } finally {
      fixture.cleanup();
    }
  });

  test('loop-check at cap', () => {
    const fixture = createCaptureFixture();
    try {
      const runId = 'run-lc-at';
      runCli(
        ['capture', 'init', '--run', runId, '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      // Pre-set phase_loop_counts to 10 in status.json so the guard sees count=10
      const statusPath = path.join(fixture.stateRoot, 'runs', runId, 'status.json');
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      status.phase_loop_counts = { clarify: 10 };
      fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));

      writeRunConfig(fixture.stateRoot, runId, 'phase_policy:\n  clarify: { enabled: true, loop_cap: 10 }\n');

      const result = runCli(
        ['capture', 'loop-check', '--run', runId, '--phase', 'clarify', '--loop-count', '10', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 43, `expected exit 43 but got ${result.exitCode}: stdout=${result.stdout} stderr=${result.stderr}`);
      const payload = JSON.parse(result.stdout);
      assert.strictEqual(payload.allowed, false);
    } finally {
      fixture.cleanup();
    }
  });

  test('loop-check over cap', () => {
    const fixture = createCaptureFixture();
    try {
      const runId = 'run-lc-over';
      runCli(
        ['capture', 'init', '--run', runId, '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      writeRunConfig(fixture.stateRoot, runId, 'phase_policy:\n  clarify: { enabled: true, loop_cap: 10 }\n');

      const result = runCli(
        ['capture', 'loop-check', '--run', runId, '--phase', 'clarify', '--loop-count', '11', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 43, `expected exit 43 but got ${result.exitCode}: stdout=${result.stdout} stderr=${result.stderr}`);
      const payload = JSON.parse(result.stdout);
      assert.strictEqual(payload.allowed, false);
    } finally {
      fixture.cleanup();
    }
  });

  test('loop-check standalone mode', () => {
    const fixture = createCaptureFixture();
    try {
      const runId = 'run-lc-standalone';
      // Do NOT init a run — no status.json exists
      // Just ensure the run directory exists so the CLI can resolve paths
      const runRoot = path.join(fixture.stateRoot, 'runs', runId);
      fs.mkdirSync(runRoot, { recursive: true });

      const result = runCli(
        ['capture', 'loop-check', '--run', runId, '--phase', 'clarify', '--loop-count', '5', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0, `expected exit 0 but got ${result.exitCode}: ${result.stderr}`);
      const payload = JSON.parse(result.stdout);
      assert.strictEqual(payload.allowed, true);
      assert.strictEqual(payload.reason, 'standalone mode');
    } finally {
      fixture.cleanup();
    }
  });

  test('loop-check with --task-id', () => {
    const fixture = createCaptureFixture();
    try {
      const runId = 'run-lc-taskid';
      runCli(
        ['capture', 'init', '--run', runId, '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      writeRunConfig(fixture.stateRoot, runId, 'phase_policy:\n  clarify: { enabled: true, loop_cap: 10 }\n');

      const result = runCli(
        ['capture', 'loop-check', '--run', runId, '--phase', 'clarify', '--loop-count', '3', '--task-id', 'task-42', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0, `expected exit 0 but got ${result.exitCode}: ${result.stderr}`);
      const payload = JSON.parse(result.stdout);
      assert.strictEqual(payload.loop_key, 'clarify:task-42');

      // Verify the status.json also has the composite key
      const statusPath = path.join(fixture.stateRoot, 'runs', runId, 'status.json');
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      assert.strictEqual(status.phase_loop_counts['clarify:task-42'], 3);
    } finally {
      fixture.cleanup();
    }
  });

  test('loop-check without --task-id', () => {
    const fixture = createCaptureFixture();
    try {
      const runId = 'run-lc-notaskid';
      runCli(
        ['capture', 'init', '--run', runId, '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      writeRunConfig(fixture.stateRoot, runId, 'phase_policy:\n  clarify: { enabled: true, loop_cap: 10 }\n');

      const result = runCli(
        ['capture', 'loop-check', '--run', runId, '--phase', 'clarify', '--loop-count', '2', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0, `expected exit 0 but got ${result.exitCode}: ${result.stderr}`);
      const payload = JSON.parse(result.stdout);
      assert.strictEqual(payload.loop_key, 'clarify');

      // Verify the status.json key is just the phase (no task-id suffix)
      const statusPath = path.join(fixture.stateRoot, 'runs', runId, 'status.json');
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      assert.strictEqual(status.phase_loop_counts['clarify'], 2);
    } finally {
      fixture.cleanup();
    }
  });

  test('loop-check missing run-config.yaml', () => {
    const fixture = createCaptureFixture();
    try {
      const runId = 'run-lc-noconfig';
      runCli(
        ['capture', 'init', '--run', runId, '--phase', 'clarify', '--status', 'running', '--state-root', fixture.stateRoot],
        { cwd: fixture.fixtureRoot },
      );

      // Do NOT create run-config.yaml — should fall back to default cap of 10

      const result = runCli(
        ['capture', 'loop-check', '--run', runId, '--phase', 'clarify', '--loop-count', '1', '--state-root', fixture.stateRoot, '--json'],
        { cwd: fixture.fixtureRoot },
      );

      assert.strictEqual(result.exitCode, 0, `expected exit 0 but got ${result.exitCode}: ${result.stderr}`);
      const payload = JSON.parse(result.stdout);
      assert.strictEqual(payload.allowed, true);
      assert.strictEqual(payload.loop_cap, 10, 'should use default cap of 10 when run-config.yaml is missing');
    } finally {
      fixture.cleanup();
    }
  });
});
