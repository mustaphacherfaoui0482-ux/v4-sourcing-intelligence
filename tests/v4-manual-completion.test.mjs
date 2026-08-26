import assert from 'node:assert/strict';
import test from 'node:test';
import { completeManualOpportunity } from '../modules/v4-manual-completion.js';

const base = {
  id: 'alibaba-test',
  product: 'Test product',
  source: 'Alibaba.com',
  country: 'CN',
  isDemo: false,
  evidenceLevel: 'P1',
  evidence: { supplier: null, moq: null, supplierCountry: 'CN' },
  offer: { salePrice: null, landedCost: null, variableFees: null, cac: null, targetMargin: 30 },
  demandScore: null,
  sourcingScore: null,
  profitabilityScore: null,
  riskScore: null,
  confidence: null,
  marketingScore: null,
  easeOfTest: null,
  availability: null,
  potential: null,
  landedCostScore: null,
};

test('manual completion preserves UNKNOWN when required inputs are absent', () => {
  const result = completeManualOpportunity(base, { supplier: 'Supplier X', moq: 100 });
  assert.equal(result.evidence.supplier, 'Supplier X');
  assert.equal(result.evidence.moq, 100);
  assert.equal(result.completionStatus, 'INCOMPLETE');
  assert.equal(result.offer.salePrice, null);
  assert.equal(result.demandScore, null);
});

test('manual completion produces a decision-ready opportunity when all required inputs exist', () => {
  const result = completeManualOpportunity(base, {
    supplier: 'Supplier X',
    moq: 100,
    salePrice: 29.9,
    landedCost: 7,
    variableFees: 1.22,
    cac: 6.1,
    demandScore: 90,
    marketingScore: 90,
    sourcingScore: 92,
    profitabilityScore: 90,
    riskScore: 18,
    confidence: 92,
  });

  assert.equal(result.completionStatus, 'READY_FOR_DECISION');
  assert.equal(result.potential, 91);
  assert.equal(result.offer.salePrice, 29.9);
  assert.equal(result.offer.landedCost, 7);
  assert.equal(result.evidence.supplier, 'Supplier X');
  assert.equal(result.evidence.moq, 100);
});

test('invalid score values stay UNKNOWN instead of being coerced', () => {
  const result = completeManualOpportunity(base, { demandScore: 101, riskScore: -1, confidence: 'abc' });
  assert.equal(result.demandScore, null);
  assert.equal(result.riskScore, null);
  assert.equal(result.confidence, null);
});
