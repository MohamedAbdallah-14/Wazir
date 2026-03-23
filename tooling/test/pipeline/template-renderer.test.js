import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const TEMPLATES_DIR = path.join(ROOT, 'templates', 'phases');

// Dynamically import after ensuring file exists
let renderTemplate;

describe('template-renderer', () => {
  test('setup: import renderer', async () => {
    const mod = await import('../../src/pipeline/template-renderer.js');
    renderTemplate = mod.renderTemplate;
    assert.ok(renderTemplate, 'renderTemplate should be exported');
  });

  test('keeps enabled workflow blocks and strips markers', async () => {
    if (!renderTemplate) return;
    const template = `## Phase: clarifier
- [ ] Read briefing
{{#workflow.discover}}
- [ ] Run discover workflow
{{/workflow.discover}}
- [ ] Get approval`;

    const policy = { discover: { enabled: true } };
    const result = renderTemplate(template, policy, 'test-run');
    assert.ok(result.includes('Run discover workflow'), 'enabled workflow content should be kept');
    assert.ok(!result.includes('{{#workflow'), 'markers should be stripped');
    assert.ok(!result.includes('{{/workflow'), 'end markers should be stripped');
  });

  test('removes disabled workflow blocks entirely', async () => {
    if (!renderTemplate) return;
    const template = `## Phase: clarifier
- [ ] Read briefing
{{#workflow.design}}
- [ ] Run design brainstorm
- [ ] Get design approval
{{/workflow.design}}
- [ ] Write plan`;

    const policy = { design: { enabled: false } };
    const result = renderTemplate(template, policy, 'test-run');
    assert.ok(!result.includes('design brainstorm'), 'disabled workflow content should be removed');
    assert.ok(result.includes('Write plan'), 'non-conditional content should remain');
  });

  test('replaces <id> placeholder with run ID', async () => {
    if (!renderTemplate) return;
    const template = '- [ ] Run `wazir capture event --run <id> --event phase_enter`';
    const result = renderTemplate(template, {}, 'run-20260323-161021');
    assert.ok(result.includes('run-20260323-161021'), 'run ID should be substituted');
    assert.ok(!result.includes('<id>'), '<id> placeholder should be replaced');
  });

  test('handles multiple workflow blocks in same template', async () => {
    if (!renderTemplate) return;
    const template = `{{#workflow.discover}}
- [ ] Discover
{{/workflow.discover}}
{{#workflow.clarify}}
- [ ] Clarify
{{/workflow.clarify}}
{{#workflow.design}}
- [ ] Design
{{/workflow.design}}`;

    const policy = {
      discover: { enabled: true },
      clarify: { enabled: true },
      design: { enabled: false },
    };
    const result = renderTemplate(template, policy, 'test');
    assert.ok(result.includes('Discover'));
    assert.ok(result.includes('Clarify'));
    assert.ok(!result.includes('Design'));
  });
});

describe('phase template files', () => {
  const PHASE_NAMES = ['init', 'clarifier', 'executor', 'final_review'];

  for (const phase of PHASE_NAMES) {
    test(`${phase}.md exists with correct header`, () => {
      const filePath = path.join(TEMPLATES_DIR, `${phase}.md`);
      assert.ok(fs.existsSync(filePath), `${phase}.md should exist`);
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(
        content.includes(`## Phase: ${phase}`),
        `${phase}.md should have ## Phase: ${phase} header`,
      );
    });

    test(`${phase}.md has at least 3 checklist items`, () => {
      const filePath = path.join(TEMPLATES_DIR, `${phase}.md`);
      if (!fs.existsSync(filePath)) return;
      const content = fs.readFileSync(filePath, 'utf8');
      const items = content.match(/^- \[ \]/gm) || [];
      assert.ok(items.length >= 3, `${phase}.md should have at least 3 checklist items, got ${items.length}`);
    });

    test(`${phase}.md has exactly one <!-- transition --> marker`, () => {
      const filePath = path.join(TEMPLATES_DIR, `${phase}.md`);
      if (!fs.existsSync(filePath)) return;
      const content = fs.readFileSync(filePath, 'utf8');
      const markers = content.match(/<!-- transition -->/g) || [];
      assert.strictEqual(markers.length, 1, `${phase}.md should have exactly 1 transition marker, got ${markers.length}`);
    });
  }
});
