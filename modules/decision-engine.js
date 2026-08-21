// V4 Sourcing Intelligence — Decision Engine v2
// Deterministic decision rules. UI/CSS dependencies are intentionally excluded.

import { evaluateOfferForDecision } from './v4-offer-engine-adapter.js';

export const DECISIONS = {
  TEST: 'TESTER',
  ANALYZE: 'APPROFONDIR',
  WAIT: 'ATTENDRE',
  REJECT: 'EVITER',
};

function clampScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

export function evaluateOpportunity(data = {}) {
  const demand = clampScore(data.demandScore);
  const sourcing = clampScore(data.sourcingScore);
  const risk = clampScore(data.riskScore ?? 100);
  const confidence = clampScore(data.confidence);

  let profitability = clampScore(data.profitabilityScore);
  let offer = null;

  if (data.offer) {
    offer = evaluateOfferForDecision(data.offer);
    const marginScore = clampScore(offer.economics.netContributionMargin * 2);
    profitability = Math.round(
      profitability * 0.4 +
      marginScore * 0.4 +
      offer.resilience * 0.2,
    );

    if (offer.economics.status === 'loss') {
      profitability = Math.min(profitability, 20);
    }
  }

  const score = Math.round(
    demand * 0.25 +
    sourcing * 0.2 +
    profitability * 0.3 +
    confidence * 0.15 +
    (100 - risk) * 0.1,
  );

  if (confidence < 40) {
    return {
      decision: DECISIONS.WAIT,
      score,
      profitability,
      offer,
      reason: 'Données insuffisantes',
    };
  }

  if (
    risk > 70 ||
    score < 40 ||
    offer?.recommendation === 'avoid'
  ) {
    return {
      decision: DECISIONS.REJECT,
      score,
      profitability,
      offer,
      reason: 'Risque ou économie insuffisante',
    };
  }

  if (
    score >= 75 &&
    (!offer || offer.resilience >= 67)
  ) {
    return {
      decision: DECISIONS.TEST,
      score,
      profitability,
      offer,
      reason: 'Opportunité à tester',
    };
  }

  return {
    decision: DECISIONS.ANALYZE,
    score,
    profitability,
    offer,
    reason: 'Analyse complémentaire nécessaire',
  };
}
