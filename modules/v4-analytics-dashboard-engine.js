/**
 * V4 Sourcing Intelligence — Analytics Dashboard Engine v1
 * Provides structured dashboard summaries from explicit metrics.
 * No AI decision layer.
 */

const clamp = (value) => Math.max(0, Number(value) || 0);

const metrics = [];

export function recordMetric(metric = {}) {
  metrics.push({
    name: metric.name || 'unknown',
    value: clamp(metric.value),
    timestamp: Date.now(),
  });

  return metrics[metrics.length - 1];
}

export function getDashboardSummary() {
  return {
    totalMetrics: metrics.length,
    metrics,
    generatedAt: Date.now(),
  };
}

export function getStatus() {
  return {
    module: 'v4-analytics-dashboard-engine',
    version: '1.0',
    status: 'active',
  };
}
