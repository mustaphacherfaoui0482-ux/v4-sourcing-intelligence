// V4 Sourcing Intelligence - Radar Scoring Engine v3
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
  const rawSignals = {
    demand: numericOrUnknown(signals.demand),
    marketing: numericOrUnknown(signals.marketing),
    sourcing: numericOrUnknown(signals.sourcing),
    profitability: numericOrUnknown(signals.profitability),
  };

  const complete = Object.values(rawSignals).every((value) => value !== null);
  const confidence = numericOrUnknown(signals.confidence);

  if (!complete) {
    return {
      total: null,
      breakdown: {
        demand: rawSignals.demand,
        marketing: rawSignals.marketing,
        sourcing: rawSignals.sourcing,
        profitability: rawSignals.profitability,
        confidence,
      },
      status: 'insufficient_data',
    };
  }

  const potentialRaw =
    rawSignals.demand * POTENTIAL_WEIGHTS.demand / 100 +
    rawSignals.marketing * POTENTIAL_WEIGHTS.marketing / 100 +
    rawSignals.sourcing * POTENTIAL_WEIGHTS.sourcing / 100 +
    rawSignals.profitability * POTENTIAL_WEIGHTS.profitability / 100;

  const potential = Math.round((potentialRaw * 100) / POTENTIAL_WEIGHT_TOTAL);

  return {
    total: potential,
    breakdown: {
      ...rawSignals,
      confidence,
    },
    status: scoreStatus(potential),
  };
}

function numericOrUnknown(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
}

function scoreStatus(score) {
  if (score >= 80) return 'strong_opportunity';
  if (score >= 60) return 'review';
  if (score >= 40) return 'weak_signal';
  return 'insufficient_data';
}
