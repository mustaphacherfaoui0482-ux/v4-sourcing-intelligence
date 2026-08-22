import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRisk } from '../modules/risk-engine.js';

test('risk score is low when explicit risk factors are absent', () => {
  const result = evaluateRisk({
    dataConfidence: 90,
    competition: 'low',
    moq: 100,
    margin: 50,
    supplierVerified: true,
  });
  assert.equal(result.riskScore, 0);
  assert.equal(result.status, 'low_risk');
});

test('risk score increases with explicit risk factors', () => {
  const result = evaluateRisk({
    dataConfidence: 30,
    competition: 'high',
    moq: 1000,
    margin: 20,
    supplierVerified: false,
  });
  assert.equal(result.riskScore, 90);
  assert.equal(result.status, 'high_risk');
  assert.deepEqual(result.risks, [
    'LOW_DATA_CONFIDENCE',
    'HIGH_COMPETITION',
    'HIGH_MOQ',
    'LOW_MARGIN',
    'UNVERIFIED_SUPPLIER',
  ]);
});

test('unknown data confidence is not treated as safe', () => {
  const result = evaluateRisk({ supplierVerified: true });
  assert.equal(result.riskScore, 25);
  assert.equal(result.status, 'review');
  assert.ok(result.risks.includes('UNKNOWN_DATA_CONFIDENCE'));
});
