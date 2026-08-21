import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRadarOpportunity } from '../modules/radar-orchestrator.js';
import { calculateRadarScore } from '../modules/radar-scoring-engine.js';

test('radar orchestrator integrates the official scoring engine into the opportunity', () => {
  const radarSignals = {
    demand: 85,
    marketing: 90,
    sourcing: 80,
    profitability: 80,
    confidence: 88,
  };

  const expectedScore = calculateRadarScore(radarSignals);

  const result = buildRadarOpportunity({
    id: 'opp-001',
    product: 'Hoodie DZ Premium',
    source: '1688',
    country: 'CN',
    radarSignals,
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
  assert.equal(result.score, expectedScore.total);
  assert.deepEqual(result.scoreBreakdown, expectedScore.breakdown);
  assert.equal(result.scoreStatus, expectedScore.status);
  assert.equal(result.decision, 'TESTER');
});

test('radar orchestrator does not invent a score when no scoring input exists', () => {
  const result = buildRadarOpportunity({
    dimensions: { demand: 80, dataConfidence: 90 },
  });

  assert.equal(result.score, 0);
  assert.equal(result.scoreStatus, 'insufficient_data');
  assert.equal(result.decision, null);
});
