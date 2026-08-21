// V4 Analytics Performance Engine v1
// Deterministic metrics layer for monitoring intelligence performance.

export class V4AnalyticsPerformanceEngine {
  constructor() {
    this.metrics = [];
  }

  recordMetric(name, value, metadata = {}) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new TypeError('Metric name must be a non-empty string');
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      throw new TypeError(`Metric "${name}" must contain a finite numeric value`);
    }

    const metric = {
      name,
      value: numericValue,
      metadata: { ...metadata },
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(metric);
    return metric;
  }

  getMetrics() {
    return [...this.metrics];
  }

  calculateSuccessRate(results = []) {
    if (!Array.isArray(results) || results.length === 0) return 0;

    const success = results.filter((result) => result === 'success').length;
    return Math.round((success / results.length) * 100);
  }

  getPerformanceReport() {
    return {
      totalMetrics: this.metrics.length,
      generatedAt: new Date().toISOString(),
      metrics: [...this.metrics],
    };
  }
}

export default V4AnalyticsPerformanceEngine;
