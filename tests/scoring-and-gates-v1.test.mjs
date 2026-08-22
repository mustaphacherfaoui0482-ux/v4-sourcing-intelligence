import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScoring } from '../modules/scoring-engine.js';
import { evaluateGates } from '../modules/gate-engine.js';
import { detectContradictions } from '../modules/contradiction-engine.js';


test('Scoring keeps risk separate from opportunity quality', () => {
  const lowRisk = calculateScoring({ potential: 90, demandScore: 90, profitabilityScore: 90, riskScore: 10 });
  const highRisk = calculateScoring({ potential: 90, demandScore: 90, profitabilityScore: 90, riskScore: 80 });
  assert.ok(lowRisk.opportunityIndex > highRisk.opportunityIndex);
  assert.equal(lowRisk.riskQuality, 90);
  assert.equal(highRisk.riskQuality, 20);
});

test('Gates distinguish confirmed and unresolved critical conditions', () => {
  const confirmed = evaluateGates({ regulatory: { prohibited: true }, confidence: 90 });
  const unresolved = evaluateGates({ regulatory: { required: true, verified: false }, confidence: 90 });
  assert.equal(confirmed.hasConfirmedBlocking, true);
  assert.equal(unresolved.hasConfirmedBlocking, false);
  assert.equal(unresolved.hasUnresolvedCritical, true);
});

test('Contradiction engine flags high potential with weak economics', () => {
  const result = detectContradictions({ potential: 95, profitabilityScore: 30, riskScore: 10, confidence: 90 });
  assert.equal(result.hasCritical, true);
});
