import test from 'node:test';
import assert from 'node:assert/strict';
import { DECISIONS, evaluateOpportunity } from '../modules/decision-engine.js';

test('decision engine waits when confidence is insufficient', () => {
  const result = evaluateOpportunity({
    potentialScore: 95,
    confidence: 20,
    riskScore: 0,
  });
  assert.equal(result.decision, DECISIONS.WAIT);
});

test('decision engine waits when a required signal is UNKNOWN', () => {
  const result = evaluateOpportunity({
    potentialScore: null,
    confidence: 95,
    riskScore: 0,
  });
  assert.equal(result.decision, DECISIONS.WAIT);
  assert.equal(result.potential, null);
});

test('decision engine rejects high risk even with strong potential', () => {
  const result = evaluateOpportunity({
    potentialScore: 95,
    confidence: 95,
    riskScore: 80,
  });
  assert.equal(result.decision, DECISIONS.REJECT);
});

test('decision engine rejects maximum risk even with maximum potential', () => {
  const result = evaluateOpportunity({
    potentialScore: 100,
    confidence: 100,
    riskScore: 100,
  });
  assert.equal(result.decision, DECISIONS.REJECT);
});

test('decision engine can recommend a test for a strong official potential score', () => {
  const result = evaluateOpportunity({
    potentialScore: 90,
    confidence: 92,
    riskScore: 18,
  });
  assert.equal(result.decision, DECISIONS.TEST);
  assert.equal(result.potential, 90);
  assert.equal('score' in result, false);
});

test('decision engine does not recompute a global score from component signals', () => {
  const result = evaluateOpportunity({
    potentialScore: 90,
    demandScore: 0,
    sourcingScore: 0,
    profitabilityScore: 0,
    confidence: 92,
    riskScore: 18,
  });
  assert.equal(result.decision, DECISIONS.TEST);
  assert.equal(result.potential, 90);
  assert.equal('score' in result, false);
});