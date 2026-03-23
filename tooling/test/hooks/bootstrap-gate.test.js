import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let evaluateBootstrapGate;

describe('bootstrap-gate', () => {
  test('setup: import', async () => {
    const mod = await import('../../src/hooks/bootstrap-gate.js');
    evaluateBootstrapGate = mod.evaluateBootstrapGate;
    assert.ok(typeof evaluateBootstrapGate === 'function');
  });

  test('allows when no pipeline-active marker', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Write' }).decision, 'allow');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('allows when marker + run exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      fs.mkdirSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'test-run', 'phases', 'init.md'), '## Phase: init — ACTIVE\n');
      fs.writeFileSync(path.join(tmp, '.wazir', 'runs', 'latest'), 'test-run');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Write' }).decision, 'allow');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('blocks Write when marker but no run', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      const r = evaluateBootstrapGate(tmp, { tool: 'Write' });
      assert.strictEqual(r.decision, 'deny');
      assert.ok(r.reason.includes('wazir capture ensure'));
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  test('allows wazir commands through gate', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmp, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.wazir', 'state', 'pipeline-active'), 'true');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Bash', command: 'wazir capture ensure' }).decision, 'allow');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Bash', command: 'git branch' }).decision, 'allow');
      assert.strictEqual(evaluateBootstrapGate(tmp, { tool: 'Read' }).decision, 'allow');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });
});
