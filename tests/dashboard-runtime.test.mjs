import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDashboardState, DEMO_OPPORTUNITY } from '../modules/dashboard-runtime.js';

test('dashboard runtime derives KPI state from canonical V4 engines', () => {
  const state = calculateDashboardState(DEMO_OPPORTUNITY);

  assert.equal(state.economics.inputs.landedCost, 7);
  assert.equal(Math.round(state.economics.netContributionMargin * 10) / 10, 52.1);
  assert.equal(Math.round(state.economics.maxCacAtTargetMargin * 100) / 100, 12.71);
  assert.equal(state.decision.decision, 'TESTER');
  assert.equal(state.decision.score, 90);
});

test('dashboard runtime changes decision when confidence is insufficient', () => {
  const state = calculateDashboardState({
    ...DEMO_OPPORTUNITY,
    confidence: 20,
  });

  assert.equal(state.decision.decision, 'ATTENDRE');
  assert.equal(state.decision.reason, 'Données insuffisantes');
});
