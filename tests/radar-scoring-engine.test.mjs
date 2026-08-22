import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRadarScore } from '../modules/radar-scoring-engine.js';

test('confidence does not change the radar potential score', () => {
  const base = calculateRadarScore({
    demand: 80,
    marketing: 70,
    sourcing: 60,
    profitability: 90,
    confidence: 0,
  });

  const highConfidence = calculateRadarScore({
    demand: 80,
    marketing: 70,
    sourcing: 60,
    profitability: 90,
    confidence: 100,
  });

  assert.equal(base.total, highConfidence.total);
  assert.equal(base.breakdown.confidence, 0);
  assert.equal(highConfidence.breakdown.confidence, 100);
});

test('radar potential remains normalized to 0-100', () => {
  const score = calculateRadarScore({
    demand: 100,
    marketing: 100,
    sourcing: 100,
    profitability: 100,
    confidence: 0,
  });

  assert.equal(score.total, 100);
  assert.equal(score.status, 'strong_opportunity');
});
