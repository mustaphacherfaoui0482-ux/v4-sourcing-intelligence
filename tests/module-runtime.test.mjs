import assert from 'node:assert/strict';
import test from 'node:test';
import V4AlertIntelligenceEngine from '../modules/v4-alert-intelligence-engine.js';
import V4AIAssistantLayer from '../modules/v4-ai-assistant-layer.js';
import V4ApiGatewayEngine from '../modules/v4-api-gateway-engine.js';
import V4AnalyticsPerformanceEngine from '../modules/v4-analytics-performance-engine.js';

test('alert engine loads and creates an alert', () => {
  const engine = new V4AlertIntelligenceEngine();
  const alert = engine.createAlert({ level: 'attention', message: 'Check supplier lead time' });

  assert.equal(alert.level, 'attention');
  assert.equal(engine.getAlerts().length, 1);
});

test('AI assistant remains explanation-only', () => {
  const assistant = new V4AIAssistantLayer();
  assert.equal(assistant.getStatus().mode, 'explanation_only');
  assert.equal(assistant.explainScore({ score: 92 }).score, 92);
});

test('API gateway registers and executes routes', async () => {
  const gateway = new V4ApiGatewayEngine();
  gateway.registerRoute('health', async () => ({ ok: true }));

  assert.deepEqual(await gateway.execute('health'), { ok: true });
  assert.deepEqual(await gateway.execute('missing'), { error: 'Route not found' });
});

test('analytics performance engine validates metrics', () => {
  const engine = new V4AnalyticsPerformanceEngine();
  engine.recordMetric('decision_accuracy', 92, { source: 'test' });

  assert.equal(engine.getMetrics().length, 1);
  assert.equal(engine.calculateSuccessRate(['success', 'failure', 'success']), 67);
  assert.throws(() => engine.recordMetric('broken', 'not-a-number'), TypeError);
});
