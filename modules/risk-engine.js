// V4 Sourcing Intelligence - Risk Engine V1
// Explicit rules only. No AI decision layer.

export function evaluateRisk(opportunity = {}) {
  const risks = [];
  let score = 100;

  if (!opportunity.dataConfidence || opportunity.dataConfidence < 50) {
    risks.push('LOW_DATA_CONFIDENCE');
    score -= 20;
  }

  if (opportunity.competition === 'high') {
    risks.push('HIGH_COMPETITION');
    score -= 15;
  }

  if (opportunity.moq && opportunity.moq > 500) {
    risks.push('HIGH_MOQ');
    score -= 15;
  }

  if (opportunity.margin && opportunity.margin < 30) {
    risks.push('LOW_MARGIN');
    score -= 20;
  }

  if (opportunity.supplierVerified === false) {
    risks.push('UNVERIFIED_SUPPLIER');
    score -= 20;
  }

  return {
    riskScore: Math.max(score, 0),
    risks,
    status: score >= 70 ? 'acceptable' : score >= 40 ? 'review' : 'high_risk'
  };
}
