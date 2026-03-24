import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let readScopeStack, writeScopeStack, pushScope, popScope;

describe('scope-stack: CRUD operations', () => {
  let tmpDir, runDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-scope-stack-'));
    runDir = path.join(tmpDir, 'runs', 'run-001');
    fs.mkdirSync(runDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('setup: import scope stack functions', async () => {
    const mod = await import('../../src/capture/store.js');
    readScopeStack = mod.readScopeStack;
    writeScopeStack = mod.writeScopeStack;
    pushScope = mod.pushScope;
    popScope = mod.popScope;
    assert.ok(readScopeStack, 'readScopeStack must be exported');
    assert.ok(writeScopeStack, 'writeScopeStack must be exported');
    assert.ok(pushScope, 'pushScope must be exported');
    assert.ok(popScope, 'popScope must be exported');
  });

  test('readScopeStack returns empty array when no file exists', () => {
    if (!readScopeStack) return;
    const result = readScopeStack(runDir);
    assert.deepStrictEqual(result, []);
  });

  test('writeScopeStack writes and readScopeStack reads back', () => {
    if (!writeScopeStack || !readScopeStack) return;
    const stack = [
      { type: 'pipeline', phases_dir: '/tmp/phases' },
    ];
    writeScopeStack(runDir, stack);
    const result = readScopeStack(runDir);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'pipeline');
    assert.strictEqual(result[0].phases_dir, '/tmp/phases');
  });

  test('pushScope appends to stack', () => {
    if (!pushScope || !readScopeStack) return;
    // Start with pipeline entry
    pushScope(runDir, { type: 'pipeline', phases_dir: '/tmp/phases' });
    assert.strictEqual(readScopeStack(runDir).length, 1);

    // Push skill scope
    pushScope(runDir, {
      type: 'skill',
      skill: 'self-audit',
      invocation_id: 'sa-001',
      phases_dir: '/tmp/skills/sa-001/phases',
    });
    const stack = readScopeStack(runDir);
    assert.strictEqual(stack.length, 2);
    assert.strictEqual(stack[1].type, 'skill');
    assert.strictEqual(stack[1].skill, 'self-audit');
    assert.strictEqual(stack[1].invocation_id, 'sa-001');
  });

  test('popScope removes top entry and returns it', () => {
    if (!pushScope || !popScope || !readScopeStack) return;
    pushScope(runDir, { type: 'pipeline', phases_dir: '/tmp/phases' });
    pushScope(runDir, { type: 'skill', skill: 'self-audit', invocation_id: 'sa-001', phases_dir: '/tmp/skill-phases' });

    const popped = popScope(runDir);
    assert.strictEqual(popped.type, 'skill');
    assert.strictEqual(popped.skill, 'self-audit');

    const remaining = readScopeStack(runDir);
    assert.strictEqual(remaining.length, 1);
    assert.strictEqual(remaining[0].type, 'pipeline');
  });

  test('popScope returns null on empty stack', () => {
    if (!popScope) return;
    const result = popScope(runDir);
    assert.strictEqual(result, null);
  });

  test('writeScopeStack creates scope-stack.yaml in run dir', () => {
    if (!writeScopeStack) return;
    writeScopeStack(runDir, [{ type: 'pipeline', phases_dir: '/tmp/p' }]);
    const filePath = path.join(runDir, 'scope-stack.yaml');
    assert.ok(fs.existsSync(filePath), 'scope-stack.yaml must be created');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('pipeline'), 'file must contain pipeline entry');
  });
});
