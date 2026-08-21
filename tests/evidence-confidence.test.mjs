import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateEvidenceConfidence } from '../modules/evidence-confidence-engine.js';
import { buildRadarOpportunity } from '../modules/radar-orchestrator.js';

test('evidence confidence is calculated separately from opportunity potential', () => {
  const result = calculateEvidenceConfidence([
    { source: 'Alibaba', type: 'supplier_price', strength: 90, verified: true },
    { source: 'Trend signal', type: 'demand', strength: 70, verified: false },
  ]);

  assert.equal(result.score, 71);
  assert.equal(result.level, 'medium');
  assert.equal(result.evidenceCount, 2);
  assert.equal(result.verifiedCount, 1);
  assert.equal(result.source, 'evidence');
});

test('declared confidence is only a fallback when evidence is missing', () => {
  const result = calculateEvidenceConfidence([], 68);

  assert.equal(result.score, 68);
  assert.equal(result.level, 'medium');
  assert.equal(result.source, 'declared');
});

test('explicit evidence overrides an optimistic declared confidence', () => {
  const result = buildRadarOpportunity({
    product: 'Test Product',
    radarSignals: {
      demand: 90,
      marketing: 90,
      sourcing: 90,
      profitability: 90,
      confidence: 95,
    },
    dimensions: { dataConfidence: 95 },
    evidence: [
      { source: 'Supplier quote', type: 'price', strength: 40, verified: false },
    ],
  });

  assert.equal(result.confidence.score, 24);
  assert.equal(result.confidence.level, 'very_low');
  assert.equal(result.dimensions.dataConfidence, 24);
  assert.equal(result.scoreBreakdown.confidence, 24);
});
