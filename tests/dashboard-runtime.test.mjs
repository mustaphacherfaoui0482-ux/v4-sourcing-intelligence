import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDashboardState, DEMO_OPPORTUNITY, EMPTY_OPPORTUNITY, buildManualOpportunity } from '../modules/dashboard-runtime.js';

const ENGINE_FIXTURE = Object.freeze({
  id: 'test-opportunity', product: 'Test opportunity', source: '1688', country: 'CN',
  offer: { salePrice: 29.9, landedCost: 7, variableFees: 1.22, cac: 6.1, targetMargin: 30, visitors: 1000, conversionRate: 2.5 },
  demandScore: 90, sourcingScore: 92, profitabilityScore: 90, riskScore: 18, confidence: 92,
  marketingScore: 90, easeOfTest: 80, availability: 80, potential: 90, landedCostScore: 90,
});

test('dashboard runtime derives KPI state from canonical V4 engines', () => {
  const state = calculateDashboardState(ENGINE_FIXTURE);
  assert.equal(state.economics.inputs.landedCost, 7);
  assert.equal(Math.round(state.economics.netContributionMargin * 10) / 10, 52.1);
  assert.equal(Math.round(state.economics.maxCacAtTargetMargin * 100) / 100, 12.71);
  assert.equal(state.decision.decision, 'TESTER');
  assert.equal(state.decision.score, 92);
});

test('empty opportunity remains empty and does not invent an opportunity', () => {
  const state = calculateDashboardState(EMPTY_OPPORTUNITY);
  assert.equal(state.opportunity.product, 'Aucune opportunité active');
  assert.equal(state.economics.inputs.landedCost, null);
  assert.equal(state.opportunity.evidenceLevel, 'P0');
  assert.equal(state.isDemo, false);
});

test('dashboard demo fixture remains explicit preview data', () => {
  const state = calculateDashboardState(DEMO_OPPORTUNITY);
  assert.equal(state.opportunity.product, 'HOODIE DZ - PREMIUM 450GSM');
  assert.equal(state.economics.inputs.landedCost, 7);
  assert.equal(state.isDemo, true);
});

test('manual sourcing creates a P0 record without inventing scores or evidence', () => {
  const opportunity = buildManualOpportunity('Lampe rechargeable');
  assert.equal(opportunity.product, 'Lampe rechargeable');
  assert.equal(opportunity.source, 'À renseigner');
  assert.equal(opportunity.isDemo, false);
  const state = calculateDashboardState(opportunity);
  assert.equal(state.opportunity.product, 'Lampe rechargeable');
  assert.equal(state.opportunity.evidenceLevel, 'P0');
  assert.equal(state.opportunity.score, null);
  assert.equal(state.decision.decision, 'ATTENDRE');
});

test('manual sourcing rejects blank product names', () => {
  assert.equal(buildManualOpportunity('   '), null);
});

test('dashboard runtime changes decision when confidence is insufficient', () => {
  const state = calculateDashboardState({ ...ENGINE_FIXTURE, confidence: 20 });
  assert.equal(state.decision.decision, 'ATTENDRE');
  assert.equal(state.decision.reason, 'Données insuffisantes');
});
