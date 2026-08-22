import test from 'node:test';
import assert from 'node:assert/strict';
import { DECISIONS, evaluateOpportunity } from '../modules/decision-engine.js';

test('decision engine waits when confidence is insufficient', () => {
  const result = evaluateOpportunity({
    demandScore: 95,
    sourcingScore: 95,
    profitabilityScore: 95,
    confidence: 20,
    riskScore: 0,
  });
  assert.equal(result.decision, DECISIONS.WAIT);
});

test('decision engine rejects high risk even with strong potential', () => {
  const result = evaluateOpportunity({
    demandScore: 95,
    sourcingScore: 95,
    profitabilityScore: 95,
    confidence: 95,
    riskScore: 80,
  });
  assert.equal(result.decision, DECISIONS.REJECT);
});

test('decision engine can recommend a test for a strong opportunity', () => {
  const result = evaluateOpportunity({
    demandScore: 90,
    sourcingScore: 92,
    profitabilityScore: 90,
    confidence: 92,
    riskScore: 18,
  });
  assert.equal(result.decision, DECISIONS.TEST);
  assert.ok(result.score >= 75);
});
