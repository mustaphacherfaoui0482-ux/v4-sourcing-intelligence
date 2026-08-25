// V4 Sourcing Intelligence — Decision Engine v4
// Decision rules consume the official potential score; this engine does not calculate a second global score.

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
  const potential = clampScore(data.potentialScore);
  const risk = clampScore(data.riskScore);
  const confidence = clampScore(data.confidence);

  let profitability = clampScore(data.profitabilityScore);
  let offer = null;

  if (data.offer) {
    offer = evaluateOfferForDecision(data.offer);
    if (offer.economics.status === 'insufficient_data') {
      return {
        decision: DECISIONS.WAIT,
        potential,
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
        potential,
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

  if (potential === null || confidence === null || risk === null) {
    return {
      decision: DECISIONS.WAIT,
      potential,
      profitability,
      offer,
      reason: 'Données insuffisantes',
    };
  }

  if (confidence < 40) {
    return {
      decision: DECISIONS.WAIT,
      potential,
      profitability,
      offer,
      reason: 'Données insuffisantes',
    };
  }

  if (
    risk > 70 ||
    potential < 40 ||
    offer?.recommendation === 'avoid'
  ) {
    return {
      decision: DECISIONS.REJECT,
      potential,
      profitability,
      offer,
      reason: 'Risque ou potentiel insuffisant',
    };
  }

  if (
    potential >= 75 &&
    (!offer || offer.resilience >= 67)
  ) {
    return {
      decision: DECISIONS.TEST,
      potential,
      profitability,
      offer,
      reason: 'Opportunité à tester',
    };
  }

  return {
    decision: DECISIONS.ANALYZE,
    potential,
    profitability,
    offer,
    reason: 'Analyse complémentaire nécessaire',
  };
}
