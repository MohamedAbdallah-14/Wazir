import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const TEMPLATES_DIR = path.join(process.cwd(), 'templates', 'phases', 'skills', 'self-audit');
const EXPECTED_PHASES = ['validate', 'deep_audit', 'fix', 'verify', 'report'];
const PHASE_HEADER = /^## Phase:\s*\w+$/m;
const WRITE_POLICY = /^source_write_policy:\s*(allow|deny)$/m;

describe('skill phase templates: self-audit', () => {
  test('templates directory exists', () => {
    assert.ok(fs.existsSync(TEMPLATES_DIR), `Missing: ${TEMPLATES_DIR}`);
  });

  test('has exactly 5 phase template files', () => {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md'));
    assert.strictEqual(files.length, 5, `Expected 5, got ${files.length}: ${files.join(', ')}`);
  });

  test('each template has phase header and write policy', () => {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md')).sort();
    for (const file of files) {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf8');
      assert.ok(PHASE_HEADER.test(content), `${file}: missing ## Phase: <name> header`);
      assert.ok(WRITE_POLICY.test(content), `${file}: missing source_write_policy line`);
    }
  });

  test('each template has at least one checklist item', () => {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md')).sort();
    for (const file of files) {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf8');
      const items = content.match(/^- \[ \]/gm);
      assert.ok(items && items.length > 0, `${file}: no checklist items`);
    }
  });

  test('phase names match expected phases in order', () => {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md')).sort();
    const phaseNames = files.map(f => {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8');
      const match = content.match(/^## Phase:\s*(\w+)/m);
      return match ? match[1] : null;
    });
    assert.deepStrictEqual(phaseNames, EXPECTED_PHASES);
  });

  test('only fix phase allows source writes', () => {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md')).sort();
    for (const file of files) {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf8');
      const policyMatch = content.match(WRITE_POLICY);
      const phaseMatch = content.match(/^## Phase:\s*(\w+)/m);
      if (phaseMatch[1] === 'fix') {
        assert.strictEqual(policyMatch[1], 'allow', `${file}: fix phase should allow writes`);
      } else {
        assert.strictEqual(policyMatch[1], 'deny', `${file}: ${phaseMatch[1]} phase should deny writes`);
      }
    }
  });

  test('last item in each phase (except report) contains a transition marker', () => {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md')).sort();
    for (const file of files) {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf8');
      const phaseMatch = content.match(/^## Phase:\s*(\w+)/m);
      const lines = content.split('\n').filter(l => l.startsWith('- [ ]'));
      const lastItem = lines[lines.length - 1];
      if (phaseMatch[1] === 'report') {
        assert.ok(lastItem.includes('skill-exit'), `${file}: report phase should end with skill-exit`);
      } else {
        assert.ok(lastItem.includes('skill-phase'), `${file}: ${phaseMatch[1]} should end with skill-phase transition`);
      }
    }
  });
});
