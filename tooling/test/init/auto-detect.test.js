import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  detectHost,
  detectProjectStack,
  inferIntent,
  parseDepthModifier,
  autoInit,
} from '../../src/init/auto-detect.js';

describe('detectProjectStack', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-detect-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('detects Node.js from package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
    const result = detectProjectStack(tmpDir);
    assert.equal(result.language, 'javascript');
    assert.ok(result.stack.includes('node'));
  });

  it('detects Next.js framework with correct stack key', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { next: '14.0.0', react: '18.0.0' } }),
    );
    const result = detectProjectStack(tmpDir);
    assert.equal(result.framework, 'nextjs');
    assert.ok(result.stack.includes('next'), 'stack should use "next" key for composition map');
  });

  it('detects TypeScript', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ devDependencies: { typescript: '5.0.0' } }),
    );
    const result = detectProjectStack(tmpDir);
    assert.equal(result.language, 'typescript');
  });

  it('detects Python from pyproject.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '[project]\nname = "test"');
    const result = detectProjectStack(tmpDir);
    assert.equal(result.language, 'python');
  });

  it('detects Go from go.mod', () => {
    fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module example.com/test');
    const result = detectProjectStack(tmpDir);
    assert.equal(result.language, 'go');
  });

  it('detects Rust from Cargo.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'Cargo.toml'), '[package]\nname = "test"');
    const result = detectProjectStack(tmpDir);
    assert.equal(result.language, 'rust');
  });

  it('returns unknown for empty directory', () => {
    const result = detectProjectStack(tmpDir);
    assert.equal(result.language, 'unknown');
    assert.equal(result.framework, null);
  });
});

describe('inferIntent', () => {
  it('detects bugfix from "fix" keyword', () => {
    assert.equal(inferIntent('fix the login redirect'), 'bugfix');
  });

  it('detects bugfix from "bug" keyword', () => {
    assert.equal(inferIntent('there is a bug in auth'), 'bugfix');
  });

  it('detects refactor from "refactor" keyword', () => {
    assert.equal(inferIntent('refactor the database layer'), 'refactor');
  });

  it('detects docs from "document" keyword', () => {
    assert.equal(inferIntent('document the API endpoints'), 'docs');
  });

  it('detects spike from "research" keyword', () => {
    assert.equal(inferIntent('research caching strategies'), 'spike');
  });

  it('defaults to feature', () => {
    assert.equal(inferIntent('build a new dashboard'), 'feature');
  });

  it('defaults to feature for empty input', () => {
    assert.equal(inferIntent(''), 'feature');
    assert.equal(inferIntent(null), 'feature');
  });
});

describe('parseDepthModifier', () => {
  it('detects quick modifier', () => {
    const result = parseDepthModifier('quick fix the login');
    assert.equal(result.depth, 'quick');
    assert.equal(result.cleanedText, 'fix the login');
  });

  it('detects deep modifier', () => {
    const result = parseDepthModifier('deep design a new onboarding flow');
    assert.equal(result.depth, 'deep');
    assert.equal(result.cleanedText, 'design a new onboarding flow');
  });

  it('defaults to standard', () => {
    const result = parseDepthModifier('build a login page');
    assert.equal(result.depth, 'standard');
    assert.equal(result.cleanedText, 'build a login page');
  });

  it('handles empty input', () => {
    const result = parseDepthModifier('');
    assert.equal(result.depth, 'standard');
  });
});

describe('autoInit', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wazir-init-'));
    // Create a package.json so stack detection works
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{}');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates .wazir directories and config', () => {
    const result = autoInit(tmpDir);
    assert.equal(result.alreadyInitialized, false);
    assert.ok(fs.existsSync(path.join(tmpDir, '.wazir', 'state', 'config.json')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.wazir', 'input')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.wazir', 'runs')));
  });

  it('writes sensible defaults', () => {
    autoInit(tmpDir);
    const config = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.wazir', 'state', 'config.json'), 'utf8'),
    );
    assert.equal(config.model_mode, 'claude-only');
    assert.equal(config.default_depth, 'standard');
    assert.equal(config.default_intent, 'feature');
    assert.equal(config.team_mode, 'sequential');
    assert.equal(config.auto_initialized, true);
  });

  it('returns existing config if already initialized', () => {
    autoInit(tmpDir);
    const result = autoInit(tmpDir);
    assert.equal(result.alreadyInitialized, true);
    assert.deepEqual(result.filesCreated, []);
  });

  it('detects project stack', () => {
    const result = autoInit(tmpDir);
    assert.equal(result.stack.language, 'javascript');
  });
});

describe('detectHost', () => {
  it('returns a host object', () => {
    const result = detectHost();
    assert.ok(result.host);
    assert.ok(result.confidence);
    assert.ok(Array.isArray(result.signals));
  });
});
