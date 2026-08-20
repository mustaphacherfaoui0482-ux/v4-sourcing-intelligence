// V4 Sourcing Intelligence - Decision Engine v2
// Moteur de décision contrôlable sans IA.
// L'économie d'offre devient un signal explicite du moteur de décision.

import { evaluateOfferForDecision } from './v4-offer-engine-adapter.js';

export const DECISIONS = {
  TEST: 'TESTER',
  ANALYZE: 'APPROFONDIR',
  WAIT: 'ATTENDRE',
  REJECT: 'EVITER'
};

export function evaluateOpportunity(data = {}) {
  const demand = data.demandScore ?? 0;
  const sourcing = data.sourcingScore ?? 0;
  const risk = data.riskScore ?? 100;
  const confidence = data.confidence ?? 0;

  let profitability = data.profitabilityScore ?? 0;
  let offer = null;

  // If offer inputs are supplied, use the deterministic economics engine
  // instead of relying only on a manually supplied profitability score.
  if (data.offer) {
    offer = evaluateOfferForDecision(data.offer);
    const marginScore = Math.max(0, Math.min(100, offer.economics.netContributionMargin * 2));
    profitability = Math.round((profitability * 0.4) + (marginScore * 0.4) + (offer.resilience * 0.2));

    if (offer.economics.status === 'loss') {
      profitability = Math.min(profitability, 20);
    }
  }

  const score = Math.round(
    demand * 0.25 +
    sourcing * 0.2 +
    profitability * 0.3 +
    confidence * 0.15 +
    (100 - risk) * 0.1
  );

  if (confidence < 40) {
    return { decision: DECISIONS.WAIT, score, profitability, offer, reason: 'Données insuffisantes' };
  }

  if (risk > 70 || score < 40 || offer?.recommendation === 'avoid') {
    return { decision: DECISIONS.REJECT, score, profitability, offer, reason: 'Risque ou économie insuffisante' };
  }

  if (score >= 75 && (!offer || offer.resilience >= 67)) {
    return { decision: DECISIONS.TEST, score, profitability, offer, reason: 'Opportunité à tester' };
  }

  return { decision: DECISIONS.ANALYZE, score, profitability, offer, reason: 'Analyse complémentaire nécessaire' };
}
