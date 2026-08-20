// V4 Sourcing Intelligence - Decision Engine v1
// Moteur de décision contrôlable sans IA.

export const DECISIONS = {
  TEST: 'TESTER',
  ANALYZE: 'APPROFONDIR',
  WAIT: 'ATTENDRE',
  REJECT: 'EVITER'
};

export function evaluateOpportunity(data = {}) {
  const demand = data.demandScore ?? 0;
  const sourcing = data.sourcingScore ?? 0;
  const profitability = data.profitabilityScore ?? 0;
  const risk = data.riskScore ?? 100;
  const confidence = data.confidence ?? 0;

  const score = Math.round(
    demand * 0.25 +
    sourcing * 0.2 +
    profitability * 0.3 +
    confidence * 0.15 +
    (100 - risk) * 0.1
  );

  if (confidence < 40) {
    return { decision: DECISIONS.WAIT, score, reason: 'Données insuffisantes' };
  }

  if (risk > 70 || score < 40) {
    return { decision: DECISIONS.REJECT, score, reason: 'Risque trop élevé' };
  }

  if (score >= 75) {
    return { decision: DECISIONS.TEST, score, reason: 'Opportunité à tester' };
  }

  return { decision: DECISIONS.ANALYZE, score, reason: 'Analyse complémentaire nécessaire' };
}
