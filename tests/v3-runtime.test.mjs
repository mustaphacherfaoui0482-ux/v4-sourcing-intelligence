import test from 'node:test';
import assert from 'node:assert/strict';
import { buildManualOpportunity, calculateDashboardState } from '../modules/dashboard-runtime.js';
import { toOpportunityViewModel } from '../modules/ui-adapter.js';

test('manual opportunity is P0 and contains no invented sourcing data', () => {
  const opportunity = buildManualOpportunity('Produit test');
  assert.equal(opportunity.product, 'Produit test');
  assert.equal(opportunity.source, 'À renseigner');
  assert.equal(opportunity.country, '—');
  assert.equal(opportunity.isDemo, false);
  assert.equal(opportunity.potential, 0);
  assert.equal(opportunity.confidence, 0);
});

test('empty opportunity does not create a positive decision from zero data', () => {
  const opportunity = buildManualOpportunity('Produit test');
  const state = calculateDashboardState(opportunity);
  assert.equal(state.opportunity.evidenceLevel, 'P0');
  assert.notEqual(state.decision.decision, 'ACHETER');
});

test('margin is formatted with one percent sign', () => {
  const vm = toOpportunityViewModel({
    dimensions: { margin: 52.4 },
    economics: {},
  });
  assert.equal(vm.dimensions.margin, '52,4 %');
});
