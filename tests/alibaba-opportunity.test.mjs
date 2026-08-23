import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAlibabaOpportunity } from '../modules/alibaba-opportunity.js';

test('Alibaba evidence becomes a P1 opportunity without fabricated economics', () => {
  const opportunity = buildAlibabaOpportunity({
    source: 'Alibaba.com',
    sourceUrl: 'https://www.alibaba.com/product-detail/example.html',
    product: 'Example Product',
    displayedPrice: 4.8,
    moq: 100,
    supplier: 'Example Supplier',
    supplierCountry: 'China',
    evidenceStatus: 'USER_SUPPLIED',
    confidence: 'UNKNOWN',
  });

  assert.equal(opportunity.source, 'Alibaba.com');
  assert.equal(opportunity.evidenceLevel, 'P1');
  assert.equal(opportunity.evidence.displayedPrice, 4.8);
  assert.equal(opportunity.offer.landedCost, 0);
  assert.equal(opportunity.offer.salePrice, 0);
  assert.equal(opportunity.confidence, 0);
  assert.equal(opportunity.isDemo, false);
});

test('Alibaba opportunity rejects missing product identity', () => {
  assert.equal(buildAlibabaOpportunity({ sourceUrl: 'https://www.alibaba.com/x' }), null);
});
