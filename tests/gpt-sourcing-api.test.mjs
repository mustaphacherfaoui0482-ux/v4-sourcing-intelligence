import test from 'node:test';
import assert from 'node:assert/strict';
import { isTerminalDecision, runV4Decision } from '../api/gpt-sourcing.js';

test('V4 terminal decisions are authoritative', () => {
  assert.equal(isTerminalDecision('TESTER'), true);
  assert.equal(isTerminalDecision('EVITER'), true);
  assert.equal(isTerminalDecision('APPROFONDIR'), false);
  assert.equal(isTerminalDecision('ATTENDRE'), false);
});

test('missing economic data does not become zero', () => {
  const result = runV4Decision({
    potentialScore: 80,
    confidence: 80,
    riskScore: 20,
    profitabilityScore: null,
    offer: {
      price: null,
      quantity: null,
    },
  });

  assert.equal(result.decision, 'ATTENDRE');
  assert.notEqual(result.profitability, 0);
});

test('low-confidence opportunity waits instead of being forced to test', () => {
  const result = runV4Decision({
    potentialScore: 90,
    confidence: 20,
    riskScore: 10,
  });

  assert.equal(result.decision, 'ATTENDRE');
});

test('high-risk opportunity is rejected by V4', () => {
  const result = runV4Decision({
    potentialScore: 90,
    confidence: 90,
    riskScore: 90,
  });

  assert.equal(result.decision, 'EVITER');
});
