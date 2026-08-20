/**
 * V4 Sourcing Intelligence — Feedback Loop Engine v1.1
 * Learns from real product tests using explicit metrics.
 * No AI decision making.
 */

const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const feedbackHistory = [];

export function evaluateTestResult(input = {}) {
  const metrics = {
    sales: clamp(input.sales),
    margin: clamp(input.margin),
    customerResponse: clamp(input.customerResponse),
    returnRate: clamp(100 - (input.returnRate || 0)),
    supplierPerformance: clamp(input.supplierPerformance),
  };

  const performanceScore = Math.round(
    metrics.sales * 0.30 +
    metrics.margin * 0.25 +
    metrics.customerResponse * 0.20 +
    metrics.returnRate * 0.10 +
    metrics.supplierPerformance * 0.15
  );

  const status = performanceScore >= 75
    ? 'winner_confirmed'
    : performanceScore >= 55
      ? 'optimize'
      : 'reject';

  const result = {
    performanceScore,
    status,
    metrics,
    learnings: {
      updateProductHistory: true,
      updateSupplierScore: true,
      updateDecisionHistory: true,
    },
  };

  feedbackHistory.push({
    createdAt: new Date().toISOString(),
    result,
  });

  return result;
}

export function getFeedbackHistory() {
  return feedbackHistory;
}
