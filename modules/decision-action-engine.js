/**
 * V4 Sourcing Intelligence — Decision Action Engine v1
 * Converts a deterministic decision into an actionable diagnostic.
 * No UI dependencies and no new business calculations.
 */

export const ACTION_TYPES = Object.freeze({
  INVESTIGATE: 'INVESTIGUER',
  TEST: 'TESTER',
  ANALYZE: 'APPROFONDIR',
  WAIT: 'ATTENDRE',
  REJECT: 'EVITER',
});

function clamp(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

export function buildDecisionAction({
  decision,
  potentialScore = 0,
  confidence = 0,
  riskScore = 0,
  evidence = [],
  economics = {},
} = {}) {
  const potential = clamp(potentialScore);
  const confidenceScore = clamp(confidence);
  const risk = clamp(riskScore);
  const evidenceCount = Array.isArray(evidence) ? evidence.length : 0;

  const gaps = [];
  if (confidenceScore < 60) gaps.push('Renforcer les preuves de marché et de sourcing');
  if (evidenceCount === 0) gaps.push('Ajouter des preuves traçables');
  if (risk >= 50) gaps.push('Vérifier les facteurs de risque');
  if (economics?.status === 'loss') gaps.push('Corriger les unit economics avant tout test');
  if (economics?.status === 'thin_margin') gaps.push('Améliorer la contribution avant acquisition');

  let action = 'Poursuivre l’analyse de l’opportunité.';
  if (decision === ACTION_TYPES.INVESTIGATE) {
    action = 'Compléter les preuves avant d’engager un budget de test.';
  } else if (decision === ACTION_TYPES.TEST) {
    action = 'Lancer un test contrôlé avec un budget et un critère d’arrêt définis.';
  } else if (decision === ACTION_TYPES.REJECT) {
    action = 'Ne pas engager de budget supplémentaire tant que le motif de rejet persiste.';
  } else if (decision === ACTION_TYPES.WAIT) {
    action = 'Attendre une donnée déterminante avant de prendre une décision.';
  }

  return Object.freeze({
    decision,
    potential,
    confidence: confidenceScore,
    risk,
    evidenceCount,
    action,
    gaps,
    status: confidenceScore < 60 && potential >= 75 ? 'POTENTIEL ÉLEVÉ / PREUVES INSUFFISANTES' : null,
  });
}

export default buildDecisionAction;
