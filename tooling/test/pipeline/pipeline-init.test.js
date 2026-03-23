import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

let runPipelineInit;

describe('wazir pipeline init', () => {
  let tmpDir;
  const RUN_ID = 'run-pipeline-init-test';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-pipeinit-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('setup: import', async () => {
    const mod = await import('../../src/pipeline/init.js');
    runPipelineInit = mod.runPipelineInit;
    assert.ok(runPipelineInit, 'runPipelineInit should be exported');
  });

  test('renders phase files from templates using workflow_policy', async () => {
    if (!runPipelineInit) {
      const mod = await import('../../src/pipeline/init.js');
      runPipelineInit = mod.runPipelineInit;
    }

    // Create run directory with run-config
    const runDir = path.join(tmpDir, '.wazir', 'runs', RUN_ID);
    const phasesDir = path.join(runDir, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });

    // Write run-config with design disabled
    fs.writeFileSync(path.join(runDir, 'run-config.yaml'), `
run_id: ${RUN_ID}
workflow_policy:
  discover: { enabled: true }
  clarify: { enabled: true }
  specify: { enabled: true }
  spec-challenge: { enabled: true }
  author: { enabled: false }
  design: { enabled: false }
  design-review: { enabled: false }
  plan: { enabled: true }
  plan-review: { enabled: true }
`, 'utf8');

    // Create minimal existing phase files (as capture init would)
    for (const phase of ['init', 'clarifier', 'executor', 'final_review']) {
      fs.writeFileSync(path.join(phasesDir, `${phase}.md`), `## Phase: ${phase} — NOT ACTIVE\n- [ ] placeholder\n`, 'utf8');
    }

    const result = runPipelineInit(RUN_ID, tmpDir, ROOT);
    assert.strictEqual(result.exitCode, 0, `Expected exit 0, got ${result.exitCode}: ${result.stderr}`);

    // Clarifier should NOT have design items (disabled)
    const clarifier = fs.readFileSync(path.join(phasesDir, 'clarifier.md'), 'utf8');
    assert.ok(!clarifier.includes('brainstorming'), 'design items should be removed when disabled');
    assert.ok(clarifier.includes('clarify'), 'clarify items should remain (enabled)');
  });

  test('exits 1 when run-config.yaml is missing', async () => {
    if (!runPipelineInit) {
      const mod = await import('../../src/pipeline/init.js');
      runPipelineInit = mod.runPipelineInit;
    }

    const runDir = path.join(tmpDir, '.wazir', 'runs', RUN_ID);
    fs.mkdirSync(path.join(runDir, 'phases'), { recursive: true });
    // No run-config.yaml

    const result = runPipelineInit(RUN_ID, tmpDir, ROOT);
    assert.strictEqual(result.exitCode, 1);
    assert.ok(result.stderr.includes('run-config'), 'Error should mention run-config');
  });

  test('preserves init.md ACTIVE header', async () => {
    if (!runPipelineInit) {
      const mod = await import('../../src/pipeline/init.js');
      runPipelineInit = mod.runPipelineInit;
    }

    const runDir = path.join(tmpDir, '.wazir', 'runs', RUN_ID);
    const phasesDir = path.join(runDir, 'phases');
    fs.mkdirSync(phasesDir, { recursive: true });

    fs.writeFileSync(path.join(runDir, 'run-config.yaml'), `run_id: ${RUN_ID}\nworkflow_policy: {}\n`, 'utf8');
    fs.writeFileSync(path.join(phasesDir, 'init.md'), '## Phase: init — ACTIVE\n- [x] done\n', 'utf8');

    for (const phase of ['clarifier', 'executor', 'final_review']) {
      fs.writeFileSync(path.join(phasesDir, `${phase}.md`), `## Phase: ${phase} — NOT ACTIVE\n`, 'utf8');
    }

    const result = runPipelineInit(RUN_ID, tmpDir, ROOT);
    assert.strictEqual(result.exitCode, 0);

    // init.md should keep its ACTIVE header
    const initContent = fs.readFileSync(path.join(phasesDir, 'init.md'), 'utf8');
    assert.ok(initContent.includes('— ACTIVE'), 'init.md should preserve ACTIVE header');
  });
});
