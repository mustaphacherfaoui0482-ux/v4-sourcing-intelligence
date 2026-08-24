import assert from 'node:assert/strict';
import test from 'node:test';
import { formatLandedCostDisplay } from '../modules/business-kpi-runtime.js';

test('landed cost display preserves UNKNOWN instead of converting it to zero', () => {
  assert.equal(formatLandedCostDisplay(null), '—');
  assert.equal(formatLandedCostDisplay(undefined), '—');
  assert.equal(formatLandedCostDisplay(''), '—');
});

test('landed cost display keeps real economic values', () => {
  assert.equal(formatLandedCostDisplay(7), '7,00 €');
  assert.equal(formatLandedCostDisplay(7.5), '7,50 €');
});
