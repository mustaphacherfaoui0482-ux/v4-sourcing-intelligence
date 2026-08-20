// V4 Sourcing Intelligence - Radar Scoring Engine v1
// Rule-based scoring only. No AI decision layer.

export function calculateRadarScore(signals = {}) {
  const weights = {
    demand: 25,
    marketing: 20,
    sourcing: 20,
    profitability: 25,
    confidence: 10,
  };

  const score =
    normalize(signals.demand) * weights.demand / 100 +
    normalize(signals.marketing) * weights.marketing / 100 +
    normalize(signals.sourcing) * weights.sourcing / 100 +
    normalize(signals.profitability) * weights.profitability / 100 +
    normalize(signals.confidence) * weights.confidence / 100;

  return {
    total: Math.round(score),
    breakdown: {
      demand: normalize(signals.demand),
      marketing: normalize(signals.marketing),
      sourcing: normalize(signals.sourcing),
      profitability: normalize(signals.profitability),
      confidence: normalize(signals.confidence),
    },
    status: scoreStatus(score),
  };
}

function normalize(value) {
  if (typeof value !== 'number') return 0;
  return Math.max(0, Math.min(100, value));
}

function scoreStatus(score) {
  if (score >= 80) return 'strong_opportunity';
  if (score >= 60) return 'review';
  if (score >= 40) return 'weak_signal';
  return 'insufficient_data';
}
