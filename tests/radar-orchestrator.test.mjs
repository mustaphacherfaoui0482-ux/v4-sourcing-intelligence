import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRadarOpportunity } from '../modules/radar-orchestrator.js';

test('radar orchestrator preserves canonical dimensions and consumes existing score', () => {
  const result = buildRadarOpportunity({
    id: 'opp-001',
    product: 'Hoodie DZ Premium',
    source: '1688',
    country: 'CN',
    dimensions: {
      potential: 90,
      demand: 85,
      margin: 80,
      availability: 70,
      landedCost: 25,
      risk: 20,
      easeOfTest: 75,
      dataConfidence: 88,
    },
    risk: { riskScore: 20 },
    economics: { netContributionMargin: 80 },
    radarScore: {
      total: 84,
      status: 'strong_opportunity',
      breakdown: { demand: 85, marketing: 90, sourcing: 80, profitability: 80, confidence: 88 },
    },
    decision: { decision: 'TESTER', reason: 'Opportunité à tester' },
  });

  assert.equal(result.id, 'opp-001');
  assert.equal(result.product, 'Hoodie DZ Premium');
  assert.deepEqual(result.dimensions, {
    potential: 90,
    demand: 85,
    margin: 80,
    availability: 70,
    landedCost: 25,
    risk: 20,
    easeOfTest: 75,
    dataConfidence: 88,
  });
  assert.equal(result.score, 84);
  assert.equal(result.scoreStatus, 'strong_opportunity');
  assert.equal(result.decision, 'TESTER');
});

test('radar orchestrator does not invent a score when the scoring engine has not run', () => {
  const result = buildRadarOpportunity({
    dimensions: { demand: 80, dataConfidence: 90 },
  });

  assert.equal(result.score, null);
  assert.equal(result.decision, null);
});
