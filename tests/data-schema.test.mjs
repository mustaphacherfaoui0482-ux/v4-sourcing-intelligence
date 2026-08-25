import assert from 'node:assert/strict';
import test from 'node:test';
import { opportunitySchema } from '../data/opportunity-schema.js';
import { ProductSchema } from '../data/schema.js';

test('opportunity schema keeps missing numeric values unknown', () => {
  assert.equal(opportunitySchema.economics.purchaseCost, null);
  assert.equal(opportunitySchema.economics.shippingCost, null);
  assert.equal(opportunitySchema.economics.customsCost, null);
  assert.equal(opportunitySchema.economics.landedCost, null);
  assert.equal(opportunitySchema.economics.sellingPrice, null);
  assert.equal(opportunitySchema.economics.margin, null);
  assert.equal(opportunitySchema.economics.cac, null);
  assert.equal(opportunitySchema.analysis.scoreV4, null);
  assert.equal(opportunitySchema.analysis.confidence, null);
});

test('product schema keeps missing economics unknown', () => {
  assert.equal(ProductSchema.landedCost, null);
  assert.equal(ProductSchema.salePrice, null);
  assert.equal(ProductSchema.moq, null);
});
