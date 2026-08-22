// V4 Sourcing Intelligence — Risk Engine V2
// Contract semantics: riskScore is a risk score (0 = low risk, 100 = high risk).
// Explicit rules only. No AI decision layer.

const clamp = (value) => Math.max(0, Math.min(100, Number(value)));

export function evaluateRisk(opportunity = {}) {
  const risks = [];
  let score = 0;

  if (!Number.isFinite(Number(opportunity.dataConfidence))) {
    risks.push('UNKNOWN_DATA_CONFIDENCE');
    score += 25;
  } else if (Number(opportunity.dataConfidence) < 50) {
    risks.push('LOW_DATA_CONFIDENCE');
    score += 20;
  }

  if (opportunity.competition === 'high') {
    risks.push('HIGH_COMPETITION');
    score += 15;
  }

  if (Number(opportunity.moq) > 500) {
    risks.push('HIGH_MOQ');
    score += 15;
  }

  if (Number.isFinite(Number(opportunity.margin)) && Number(opportunity.margin) < 30) {
    risks.push('LOW_MARGIN');
    score += 20;
  }

  if (opportunity.supplierVerified !== true) {
    risks.push('UNVERIFIED_SUPPLIER');
    score += 20;
  }

  score = clamp(score);

  return {
    riskScore: score,
    risks,
    status: score <= 30 ? 'low_risk' : score <= 60 ? 'review' : 'high_risk',
  };
}
