import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOpportunity, DECISIONS } from '../modules/decision-engine.js';

const base = {
  potential: 90,
  demandScore: 90,
  profitabilityScore: 90,
  riskScore: 15,
  confidence: 90,
};

test('Decision Engine returns ACHETER for a strong validated opportunity', () => {
  const result = evaluateOpportunity(base);
  assert.equal(result.decision, DECISIONS.BUY);
  assert.equal(result.gates.hasConfirmedBlocking, false);
  assert.ok(result.opportunityIndex >= 75);
});

test('A confirmed regulatory block overrides a high opportunity score', () => {
  const result = evaluateOpportunity({
    ...base,
    regulatory: { prohibited: true },
  });
  assert.equal(result.decision, DECISIONS.REJECT);
  assert.equal(result.gates.hasConfirmedBlocking, true);
});

test('An unresolved regulatory requirement produces ATTENDRE', () => {
  const result = evaluateOpportunity({
    ...base,
    regulatory: { required: true, verified: false },
  });
  assert.equal(result.decision, DECISIONS.WAIT);
  assert.equal(result.gates.hasUnresolvedCritical, true);
});

test('A viable but uncertain opportunity produces TESTER', () => {
  const result = evaluateOpportunity({
    potential: 80,
    demandScore: 78,
    profitabilityScore: 72,
    riskScore: 30,
    confidence: 65,
  });
  assert.equal(result.decision, DECISIONS.TEST);
});

test('Negative economics produces EVITER', () => {
  const result = evaluateOpportunity({
    ...base,
    profitabilityScore: 20,
  });
  assert.equal(result.decision, DECISIONS.REJECT);
});
