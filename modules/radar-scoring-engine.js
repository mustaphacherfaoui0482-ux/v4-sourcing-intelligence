// V4 Sourcing Intelligence - Radar Scoring Engine v2
// Rule-based scoring only. Confidence is kept separate from potential scoring.

const POTENTIAL_WEIGHTS = Object.freeze({
  demand: 25,
  marketing: 20,
  sourcing: 20,
  profitability: 25,
});

const POTENTIAL_WEIGHT_TOTAL = Object.values(POTENTIAL_WEIGHTS).reduce(
  (total, weight) => total + weight,
  0,
);

export function calculateRadarScore(signals = {}) {
  const potentialRaw =
    normalize(signals.demand) * POTENTIAL_WEIGHTS.demand / 100 +
    normalize(signals.marketing) * POTENTIAL_WEIGHTS.marketing / 100 +
    normalize(signals.sourcing) * POTENTIAL_WEIGHTS.sourcing / 100 +
    normalize(signals.profitability) * POTENTIAL_WEIGHTS.profitability / 100;

  const potential = Math.round((potentialRaw * 100) / POTENTIAL_WEIGHT_TOTAL);
  const confidence = normalize(signals.confidence);

  return {
    total: potential,
    breakdown: {
      demand: normalize(signals.demand),
      marketing: normalize(signals.marketing),
      sourcing: normalize(signals.sourcing),
      profitability: normalize(signals.profitability),
      confidence,
    },
    status: scoreStatus(potential),
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
