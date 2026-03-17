import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const lightSvg = readFileSync(resolve(ROOT, 'assets/logo.svg'), 'utf-8');
const darkSvg = readFileSync(resolve(ROOT, 'assets/logo-dark.svg'), 'utf-8');

describe('SVG logo structure', () => {
  for (const [name, svg] of [['light', lightSvg], ['dark', darkSvg]]) {
    describe(`${name} mode logo`, () => {
      it('contains exactly one <rect> element', () => {
        const matches = svg.match(/<rect /g);
        assert.equal(matches?.length, 1, `Expected 1 <rect>, found ${matches?.length}`);
      });

      it('contains exactly two <polygon> elements', () => {
        const matches = svg.match(/<polygon /g);
        assert.equal(matches?.length, 2, `Expected 2 <polygon>, found ${matches?.length}`);
      });

      it('contains exactly one <text> element', () => {
        const matches = svg.match(/<text /g);
        assert.equal(matches?.length, 1, `Expected 1 <text>, found ${matches?.length}`);
      });

      it('has viewBox="0 0 360 100"', () => {
        assert.ok(svg.includes('viewBox="0 0 360 100"'), 'Missing viewBox="0 0 360 100"');
      });

      it('has role="img" accessibility attribute', () => {
        assert.ok(svg.includes('role="img"'), 'Missing role="img"');
      });

      it('has aria-label="Wazir"', () => {
        assert.ok(svg.includes('aria-label="Wazir"'), 'Missing aria-label="Wazir"');
      });

      it('has <title>Wazir</title>', () => {
        assert.ok(svg.includes('<title>Wazir</title>'), 'Missing <title>Wazir</title>');
      });
    });
  }
});

describe('Light mode brand colors', () => {
  it('square 1 uses Deep Teal #0D4F4F', () => {
    assert.ok(lightSvg.includes('fill="#0D4F4F"'), 'Missing #0D4F4F fill');
  });

  it('square 2 uses Lighter Warm Teal #8FBCBB', () => {
    assert.ok(lightSvg.includes('fill="#8FBCBB"'), 'Missing #8FBCBB fill');
  });

  it('overlap octagon uses Dark #094040', () => {
    assert.ok(lightSvg.includes('fill="#094040"'), 'Missing #094040 fill');
  });

  it('wordmark uses Deep Teal #0D4F4F', () => {
    // The text element should also use #0D4F4F
    const textMatch = lightSvg.match(/<text[^>]*fill="([^"]+)"/);
    assert.ok(textMatch, 'No fill on text element');
    assert.equal(textMatch[1], '#0D4F4F', `Wordmark fill is ${textMatch[1]}, expected #0D4F4F`);
  });
});

describe('Dark mode color adjustments', () => {
  it('does NOT use light mode square 1 color #0D4F4F', () => {
    // The rect (square 1) should NOT be #0D4F4F in dark mode
    const rectMatch = darkSvg.match(/<rect[^>]*fill="([^"]+)"/);
    assert.ok(rectMatch, 'No fill on rect element');
    assert.notEqual(rectMatch[1], '#0D4F4F', 'Dark mode square 1 should not use #0D4F4F');
  });

  it('wordmark uses light fill #F0F0F5', () => {
    const textMatch = darkSvg.match(/<text[^>]*fill="([^"]+)"/);
    assert.ok(textMatch, 'No fill on text element');
    assert.equal(textMatch[1], '#F0F0F5', `Wordmark fill is ${textMatch[1]}, expected #F0F0F5`);
  });

  it('uses adjusted overlap color (not #094040)', () => {
    // The overlap octagon is the second polygon
    const polygonMatches = [...darkSvg.matchAll(/<polygon[^>]*fill="([^"]+)"/g)];
    assert.ok(polygonMatches.length >= 2, 'Expected at least 2 polygons');
    const overlapFill = polygonMatches[1][1];
    assert.notEqual(overlapFill, '#094040', 'Dark mode overlap should not use #094040');
  });
});
