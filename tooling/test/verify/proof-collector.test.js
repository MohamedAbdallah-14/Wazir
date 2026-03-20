import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { detectRunnableType, collectProof } from '../../src/verify/proof-collector.js';

describe('detectRunnableType', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-proof-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('detects web project from next dependency', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { next: '14.0.0' } }),
    );
    assert.equal(detectRunnableType(tmpDir), 'web');
  });

  it('detects web project from vite dependency', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ devDependencies: { vite: '5.0.0' } }),
    );
    assert.equal(detectRunnableType(tmpDir), 'web');
  });

  it('detects web project from react-scripts', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { 'react-scripts': '5.0.0' } }),
    );
    assert.equal(detectRunnableType(tmpDir), 'web');
  });

  it('detects API project from express', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { express: '4.18.0' } }),
    );
    assert.equal(detectRunnableType(tmpDir), 'api');
  });

  it('detects API project from fastify', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { fastify: '4.0.0' } }),
    );
    assert.equal(detectRunnableType(tmpDir), 'api');
  });

  it('detects API project from hono', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { hono: '3.0.0' } }),
    );
    assert.equal(detectRunnableType(tmpDir), 'api');
  });

  it('detects CLI project from bin field', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ bin: { mycli: './src/cli.js' } }),
    );
    assert.equal(detectRunnableType(tmpDir), 'cli');
  });

  it('detects CLI project from string bin field', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ bin: './src/cli.js' }),
    );
    assert.equal(detectRunnableType(tmpDir), 'cli');
  });

  it('defaults to library for plain package', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'my-lib', dependencies: { lodash: '4.0.0' } }),
    );
    assert.equal(detectRunnableType(tmpDir), 'library');
  });

  it('defaults to library when no package.json', () => {
    assert.equal(detectRunnableType(tmpDir), 'library');
  });

  it('web takes priority over API when both present', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { next: '14.0.0', express: '4.18.0' } }),
    );
    assert.equal(detectRunnableType(tmpDir), 'web');
  });

  it('API takes priority over CLI when both present', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { express: '4.18.0' }, bin: './cli.js' }),
    );
    assert.equal(detectRunnableType(tmpDir), 'api');
  });
});

describe('collectProof', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-proof-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns structured evidence for library type', async () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'test-lib' }));
    const result = await collectProof(
      { id: 'task-001', title: 'Test task' },
      { projectRoot: tmpDir },
    );
    assert.equal(result.task_id, 'task-001');
    assert.equal(result.type, 'library');
    assert.ok(Array.isArray(result.evidence));
    assert.ok(result.timestamp);
    assert.ok(['pass', 'fail', 'partial'].includes(result.status));
  });

  it('collects npm test evidence when package.json has test script', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test-lib', scripts: { test: 'echo "ok"' } }),
    );
    const result = await collectProof(
      { id: 'task-002', title: 'Test with script' },
      { projectRoot: tmpDir },
    );
    const testEvidence = result.evidence.find((e) => e.tool === 'npm test');
    assert.ok(testEvidence, 'should have npm test evidence');
    assert.equal(testEvidence.exit_code, 0);
    assert.equal(testEvidence.passed, true);
  });

  it('records failure when test script fails', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test-lib', scripts: { test: 'exit 1' } }),
    );
    const result = await collectProof(
      { id: 'task-003', title: 'Failing test' },
      { projectRoot: tmpDir },
    );
    const testEvidence = result.evidence.find((e) => e.tool === 'npm test');
    assert.ok(testEvidence, 'should have npm test evidence');
    assert.equal(testEvidence.passed, false);
    assert.equal(result.status, 'fail');
  });

  it('skips npm test when no test script exists', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test-lib', scripts: {} }),
    );
    const result = await collectProof(
      { id: 'task-004', title: 'No test script' },
      { projectRoot: tmpDir },
    );
    const testEvidence = result.evidence.find((e) => e.tool === 'npm test');
    assert.equal(testEvidence, undefined, 'should not have npm test evidence');
  });
});
