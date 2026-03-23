import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { DEPTH_TABLE, DEPTH_LEVELS, getDepthParam } from '../../src/config/depth-table.js';

describe('depth-table', () => {
  const REQUIRED_PARAMS = [
    'review_passes',
    'loop_cap',
    'heartbeat_max_silence_s',
    'research_intensity',
    'challenge_intensity',
    'spec_hardening_passes',
    'design_review_passes',
    'time_estimate_label',
  ];

  describe('DEPTH_LEVELS', () => {
    it('exports exactly quick, standard, deep', () => {
      assert.deepStrictEqual([...DEPTH_LEVELS].sort(), ['deep', 'quick', 'standard']);
    });
  });

  describe('DEPTH_TABLE', () => {
    for (const level of ['quick', 'standard', 'deep']) {
      it(`has entry for ${level}`, () => {
        assert.ok(DEPTH_TABLE[level], `Missing depth level: ${level}`);
      });

      for (const param of REQUIRED_PARAMS) {
        it(`${level} has required param: ${param}`, () => {
          assert.ok(
            DEPTH_TABLE[level][param] !== undefined,
            `${level} missing param: ${param}`,
          );
        });
      }
    }

    it('review_passes increase with depth', () => {
      assert.ok(DEPTH_TABLE.quick.review_passes < DEPTH_TABLE.standard.review_passes);
      assert.ok(DEPTH_TABLE.standard.review_passes < DEPTH_TABLE.deep.review_passes);
    });

    it('loop_cap increases with depth', () => {
      assert.ok(DEPTH_TABLE.quick.loop_cap < DEPTH_TABLE.standard.loop_cap);
      assert.ok(DEPTH_TABLE.standard.loop_cap < DEPTH_TABLE.deep.loop_cap);
    });

    it('heartbeat_max_silence_s decreases with depth', () => {
      assert.ok(DEPTH_TABLE.quick.heartbeat_max_silence_s > DEPTH_TABLE.standard.heartbeat_max_silence_s);
      assert.ok(DEPTH_TABLE.standard.heartbeat_max_silence_s > DEPTH_TABLE.deep.heartbeat_max_silence_s);
    });

    it('review_passes are 3, 5, 7', () => {
      assert.equal(DEPTH_TABLE.quick.review_passes, 3);
      assert.equal(DEPTH_TABLE.standard.review_passes, 5);
      assert.equal(DEPTH_TABLE.deep.review_passes, 7);
    });

    it('heartbeat thresholds are 180, 120, 90', () => {
      assert.equal(DEPTH_TABLE.quick.heartbeat_max_silence_s, 180);
      assert.equal(DEPTH_TABLE.standard.heartbeat_max_silence_s, 120);
      assert.equal(DEPTH_TABLE.deep.heartbeat_max_silence_s, 90);
    });
  });

  describe('getDepthParam()', () => {
    it('returns correct value for valid depth and param', () => {
      assert.equal(getDepthParam('standard', 'review_passes'), 5);
    });

    it('returns correct value for quick depth', () => {
      assert.equal(getDepthParam('quick', 'loop_cap'), 5);
    });

    it('throws for invalid depth level', () => {
      assert.throws(() => getDepthParam('extreme', 'review_passes'), /Unknown depth level/);
    });

    it('throws for invalid param name', () => {
      assert.throws(() => getDepthParam('standard', 'nonexistent'), /Unknown depth parameter/);
    });

    it('defaults to standard when depth is undefined', () => {
      assert.equal(getDepthParam(undefined, 'review_passes'), 5);
    });
  });
});
