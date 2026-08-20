/**
 * V4 Sourcing Intelligence — Notification Engine v1
 * Deterministic alerts. No AI in V1.
 */

export function evaluateNotifications(input = {}) {
  const alerts = [];

  if ((input.score || 0) >= 85) {
    alerts.push({
      type: 'high_opportunity',
      message: 'Opportunity reached premium V4 score'
    });
  }

  if ((input.riskScore || 0) >= 70) {
    alerts.push({
      type: 'critical_risk',
      message: 'Opportunity requires risk review'
    });
  }

  if (input.supplierStatus === 'preferred') {
    alerts.push({
      type: 'supplier_ready',
      message: 'Supplier meets preferred criteria'
    });
  }

  if (input.testResult === 'winner_confirmed') {
    alerts.push({
      type: 'winner_confirmed',
      message: 'Product confirmed after real test'
    });
  }

  return {
    count: alerts.length,
    alerts,
    generatedAt: new Date().toISOString()
  };
}
