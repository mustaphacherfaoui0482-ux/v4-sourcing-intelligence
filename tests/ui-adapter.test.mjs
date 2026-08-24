import assert from 'node:assert/strict';
import test from 'node:test';
import { toOpportunityViewModel } from '../modules/ui-adapter.js';

test('UI adapter preserves UNKNOWN/null economic values instead of coercing them to zero', () => {
  const view = toOpportunityViewModel({
    id: 'test-unknown-economics',
    product: 'Produit test',
    dimensions: {
      potential: null,
      demand: null,
      margin: null,
      availability: null,
      landedCost: null,
      risk: null,
      easeOfTest: null,
      dataConfidence: null,
    },
  });

  assert.equal(view.dimensions.potential, '—');
  assert.equal(view.dimensions.margin, '—');
  assert.equal(view.dimensions.landedCost, '—');
  assert.equal(view.dimensions.dataConfidence, '—');
});

test('UI adapter keeps real landed cost values', () => {
  const view = toOpportunityViewModel({
    dimensions: { landedCost: 7.5 },
  });

  assert.equal(view.dimensions.landedCost, '7,50 €');
});
