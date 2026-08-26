import assert from 'node:assert/strict';
import test from 'node:test';
import { createOpportunity } from '../modules/opportunity-model.js';

test('preserves unknown landed cost instead of converting it to zero', () => {
  assert.equal(createOpportunity({ landedCost: null }).dimensions.landedCost, null);
  assert.equal(createOpportunity({ landedCost: undefined }).dimensions.landedCost, null);
  assert.equal(createOpportunity({ landedCost: 'UNKNOWN' }).dimensions.landedCost, null);
});

test('preserves known zero landed cost as zero', () => {
  assert.equal(createOpportunity({ landedCost: 0 }).dimensions.landedCost, 0);
  assert.equal(createOpportunity({ landedCost: '0' }).dimensions.landedCost, 0);
});

test('normalizes valid landed cost values without changing their numeric meaning', () => {
  assert.equal(createOpportunity({ landedCost: 42 }).dimensions.landedCost, 42);
  assert.equal(createOpportunity({ landedCost: '42' }).dimensions.landedCost, 42);
});

test('does not convert non-numeric landed cost into a safe zero', () => {
  assert.equal(createOpportunity({ landedCost: 'not-a-number' }).dimensions.landedCost, null);
});
