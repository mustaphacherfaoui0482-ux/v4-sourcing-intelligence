// V4 Sourcing Intelligence — Decision Engine v3
// Deterministic decision rules. Unknown inputs remain unknown and cannot be converted into a score.

import { evaluateOfferForDecision } from './v4-offer-engine-adapter.js';

export const DECISIONS = {
  TEST: 'TESTER',
  ANALYZE: 'APPROFONDIR',
  WAIT: 'ATTENDRE',
  REJECT: 'EVITER',
};

function clampScore(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, numeric));
}

export function evaluateOpportunity(data = {}) {
  const demand = clampScore(data.demandScore);
  const sourcing = clampScore(data.sourcingScore);
  const risk = clampScore(data.riskScore);
  const confidence = clampScore(data.confidence);

  let profitability = clampScore(data.profitabilityScore);
  let offer = null;

  if (data.offer) {
    offer = evaluateOfferForDecision(data.offer);
    if (offer.economics.status === 'insufficient_data') {
      return {
        decision: DECISIONS.WAIT,
        score: null,
        profitability: null,
        offer,
        reason: 'Données économiques insuffisantes',
      };
    }

    const marginScore = clampScore(offer.economics.netContributionMargin * 2);
    const resilience = clampScore(offer.resilience);
    if (profitability === null || marginScore === null || resilience === null) {
      return {
        decision: DECISIONS.WAIT,
        score: null,
        profitability: null,
        offer,
        reason: 'Données insuffisantes pour calculer la rentabilité',
      };
    }

    profitability = Math.round(
      profitability * 0.4 +
      marginScore * 0.4 +
      resilience * 0.2,
    );

    if (offer.economics.status === 'loss') {
      profitability = Math.min(profitability, 20);
    }
  }

  if (
    demand === null ||
    sourcing === null ||
    profitability === null ||
    confidence === null ||
    risk === null
  ) {
    return {
      decision: DECISIONS.WAIT,
      score: null,
      profitability,
      offer,
      reason: 'Données insuffisantes',
    };
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
