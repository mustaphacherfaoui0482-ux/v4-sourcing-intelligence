// V4 Sourcing Intelligence — Decision Engine v3
// Deterministic decision rules. UI/CSS dependencies are intentionally excluded.

import { evaluateOfferForDecision } from './v4-offer-engine-adapter.js';

export const DECISIONS = {
  TEST: 'TESTER',
  INVESTIGATE: 'INVESTIGUER',
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
      profitability * 0.4 + marginScore * 0.4 + offer.resilience * 0.2,
    );

    if (offer.economics.status === 'loss') {
      profitability = Math.min(profitability, 20);
    }
  }

  // Potential is deliberately separate from evidence confidence.
  const potentialScore = clampScore(
    data.potentialScore ?? data.opportunityScore ?? (
      demand * 0.25 + sourcing * 0.2 + profitability * 0.3 + (100 - risk) * 0.1
    ),
  );

  const score = Math.round(potentialScore * 0.85 + confidence * 0.15);

  if (risk > 70 || offer?.recommendation === 'avoid') {
    return { decision: DECISIONS.REJECT, score, potentialScore, profitability, offer, reason: 'Risque ou économie insuffisante' };
  }

  // High potential + weak evidence = investigate before spending test budget.
  if (potentialScore >= 75 && confidence < 60) {
    return { decision: DECISIONS.INVESTIGATE, score, potentialScore, profitability, offer, reason: 'Potentiel élevé, preuves insuffisantes' };
  }

  if (score < 40) {
    return { decision: DECISIONS.REJECT, score, potentialScore, profitability, offer, reason: 'Potentiel insuffisant' };
  }

  if (score >= 75 && confidence >= 60 && (!offer || offer.resilience >= 67)) {
    return { decision: DECISIONS.TEST, score, potentialScore, profitability, offer, reason: 'Opportunité suffisamment étayée pour être testée' };
  }

  return { decision: DECISIONS.ANALYZE, score, potentialScore, profitability, offer, reason: 'Analyse complémentaire nécessaire' };
}
