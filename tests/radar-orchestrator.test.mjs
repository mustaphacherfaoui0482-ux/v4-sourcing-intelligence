import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRadarOpportunity } from '../modules/radar-orchestrator.js';


test('radar orchestrator does not invent a score when no scoring input exists', () => {
  const result = buildRadarOpportunity({
    dimensions: { demand: 80, dataConfidence: 90 },
  });

  assert.equal(result.score, null);
  assert.equal(result.scoreStatus, 'insufficient_data');
  assert.equal(result.decision, null);
});
