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

  test('allows all tools when pipeline-active marker is absent', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      const result = evaluateBootstrapGate(tmpDir, { tool: 'Write', command: 'write something' });
      assert.strictEqual(result.decision, 'allow');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('allows all tools when pipeline-active exists AND run exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmpDir, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.wazir', 'state', 'pipeline-active'), 'true');
      fs.mkdirSync(path.join(tmpDir, '.wazir', 'runs', 'test-run', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.wazir', 'runs', 'test-run', 'phases', 'init.md'), '## Phase: init — ACTIVE\n');
      fs.writeFileSync(path.join(tmpDir, '.wazir', 'runs', 'latest'), 'test-run');
      const result = evaluateBootstrapGate(tmpDir, { tool: 'Write', command: 'write code' });
      assert.strictEqual(result.decision, 'allow');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('blocks Write when pipeline-active exists but no run exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmpDir, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.wazir', 'state', 'pipeline-active'), 'true');
      const result = evaluateBootstrapGate(tmpDir, { tool: 'Write', command: 'write code' });
      assert.strictEqual(result.decision, 'deny');
      assert.ok(result.reason.includes('wazir capture ensure'));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('allows wazir commands through the bootstrap gate', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmpDir, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.wazir', 'state', 'pipeline-active'), 'true');
      // No run exists, but the command is on the allowlist
      const allowedCommands = [
        'wazir capture ensure',
        'wazir capture init --run test --phase init --status starting',
        'wazir doctor --json',
        'wazir index refresh',
        'which wazir',
        'git checkout -b feat/test',
        'git branch --show-current',
      ];
      for (const cmd of allowedCommands) {
        const result = evaluateBootstrapGate(tmpDir, { tool: 'Bash', command: cmd });
        assert.strictEqual(result.decision, 'allow', `Should allow: ${cmd}`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('allows Read tool always', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-boot-'));
    try {
      fs.mkdirSync(path.join(tmpDir, '.wazir', 'state'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.wazir', 'state', 'pipeline-active'), 'true');
      const result = evaluateBootstrapGate(tmpDir, { tool: 'Read', command: '' });
      assert.strictEqual(result.decision, 'allow');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
