import assert from 'node:assert/strict';
import test from 'node:test';
import calculateOfferEconomics, { simulateOfferScenarios } from '../modules/v4-offer-economics-engine.js';
import { evaluateOfferForDecision } from '../modules/v4-offer-engine-adapter.js';
import { evaluateOpportunity, DECISIONS } from '../modules/decision-engine.js';

const healthy = calculateOfferEconomics({
  salePrice: 29.90,
  landedCost: 6.00,
  variableFees: 1.90,
  cac: 8,
  targetMargin: 40,
});
assert.equal(healthy.status, 'healthy');
assert(healthy.contributionAfterAds > 0);
assert(healthy.maxCacAtTargetMargin >= 0);

const loss = calculateOfferEconomics({ salePrice: 10, landedCost: 8, variableFees: 2, cac: 1, targetMargin: 30 });
assert.equal(loss.status, 'loss');

const scenarios = simulateOfferScenarios({ salePrice: 29.90, landedCost: 6, variableFees: 1.90, cac: 8, targetMargin: 40, visitors: 1000, conversionRate: 2 });
assert.equal(scenarios.length, 3);
assert.deepEqual(scenarios.map((s) => s.name), ['downside', 'base', 'upside']);

const adapter = evaluateOfferForDecision({ salePrice: 29.90, landedCost: 6, variableFees: 1.90, cac: 8, targetMargin: 40, visitors: 1000, conversionRate: 2 });
assert(['test', 'optimize', 'avoid'].includes(adapter.recommendation));
assert.equal(adapter.resilience, 100);

const decision = evaluateOpportunity({
  demandScore: 80,
  sourcingScore: 80,
  riskScore: 20,
  confidence: 80,
  offer: { salePrice: 29.90, landedCost: 6, variableFees: 1.90, cac: 8, targetMargin: 40, visitors: 1000, conversionRate: 2 },
});
assert.notEqual(decision.decision, DECISIONS.REJECT);
assert(decision.offer);

test('missing economics remain unknown instead of zero', () => {
  const unknown = calculateOfferEconomics({
    salePrice: null,
    landedCost: null,
    variableFees: null,
    cac: null,
    targetMargin: 30,
  });

  assert.equal(unknown.status, 'insufficient_data');
  assert.equal(unknown.inputs.salePrice, null);
  assert.equal(unknown.contributionAfterAds, null);
  assert.equal(unknown.breakEvenSalePrice, null);

  const unknownScenarios = simulateOfferScenarios({ salePrice: null, landedCost: null, variableFees: null, cac: null, targetMargin: 30 });
  assert.equal(unknownScenarios[0].orders, null);
  assert.equal(unknownScenarios[0].contribution, null);
  assert.equal(unknownScenarios[0].profitablePerOrder, null);
});

console.log('V4 offer economics tests: PASS');
