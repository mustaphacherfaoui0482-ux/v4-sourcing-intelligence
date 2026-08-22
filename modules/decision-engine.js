// V4 Sourcing Intelligence — Decision Engine v3
// DECISION FIRST: scores inform; gates protect; decision engine decides.

import { evaluateOfferForDecision } from './v4-offer-engine-adapter.js';
import { calculateConfidence } from './confidence-engine.js';
import { detectContradictions } from './contradiction-engine.js';
import { evaluateGates } from './gate-engine.js';
import { calculateScoring } from './scoring-engine.js';

export const DECISIONS = Object.freeze({
  BUY: 'ACHETER',
  TEST: 'TESTER',
  WAIT: 'ATTENDRE',
  REJECT: 'EVITER',
});

const clamp = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : fallback;
};

function firstReason(gates, contradictions, fallback) {
  const blocking = gates.find((gate) => gate.level === 'BLOQUANT');
  if (blocking) return blocking.message;
  const critical = contradictions.find((item) => item.severity === 'critical');
  if (critical) return critical.message;
  return fallback;
}

export function evaluateOpportunity(data = {}) {
  const offer = data.offer ? evaluateOfferForDecision(data.offer) : null;
  const economics = offer?.economics ?? data.economics ?? null;

  const confidence = calculateConfidence({
    ...data,
    confidence: data.confidence ?? data.dataConfidence,
  });

  const scoring = calculateScoring({
    ...data,
    economicsScore: data.economicsScore,
    offerEconomics: economics,
    profitabilityScore: data.profitabilityScore ?? data.profitability,
    resilience: offer?.resilience,
  });

  const gates = evaluateGates({
    ...data,
    confidence,
    economics,
    offer: data.offer,
  });

  const contradictions = detectContradictions({
    ...data,
    confidence,
    economicsScore: scoring.economics,
    profitabilityScore: scoring.economics,
    riskScore: clamp(data.riskScore, 0),
  });

  // A confirmed blocking gate always wins over the score.
  if (gates.hasConfirmedBlocking) {
    return {
      decision: DECISIONS.REJECT,
      score: scoring.opportunityIndex,
      opportunityIndex: scoring.opportunityIndex,
      ...scoring,
      confidence,
      evidence: data.evidence ?? [],
      offer,
      gates,
      contradictions,
      reason: firstReason(gates.gates, contradictions.contradictions, 'Condition bloquante confirmée.'),
      priority: 'CRITIQUE',
      nextAction: 'Ne pas engager de capital supplémentaire.',
    };
  }

  // An unresolved critical condition is not treated as a rejection.
  if (gates.hasUnresolvedCritical || data.criticalDataMissing === true) {
    return {
      decision: DECISIONS.WAIT,
      score: scoring.opportunityIndex,
      opportunityIndex: scoring.opportunityIndex,
      ...scoring,
      confidence,
      evidence: data.evidence ?? [],
      offer,
      gates,
      contradictions,
      reason: firstReason(gates.gates, contradictions.contradictions, 'Information critique à vérifier.'),
      priority: 'HAUTE',
      nextAction: 'Résoudre la condition critique avant toute commande.',
    };
  }

  if (scoring.economics < 40) {
    return {
      decision: DECISIONS.REJECT,
      score: scoring.opportunityIndex,
      opportunityIndex: scoring.opportunityIndex,
      ...scoring,
      confidence,
      evidence: data.evidence ?? [],
      offer,
      gates,
      contradictions,
      reason: 'Économie structurellement insuffisante.',
      priority: 'CRITIQUE',
      nextAction: 'Ne pas investir avant de rendre l’économie viable.',
    };
  }

  // Buy requires strong economics, low risk exposure, sufficient confidence and no major gate.
  if (
    scoring.potential >= 75 &&
    scoring.economics >= 75 &&
    scoring.riskQuality >= 70 &&
    confidence >= 75 &&
    !gates.hasMajor &&
    !contradictions.hasCritical
  ) {
    return {
      decision: DECISIONS.BUY,
      score: scoring.opportunityIndex,
      opportunityIndex: scoring.opportunityIndex,
      ...scoring,
      confidence,
      evidence: data.evidence ?? [],
      offer,
      gates,
      contradictions,
      reason: 'Opportunité économiquement viable, suffisamment établie et sans blocage critique.',
      priority: 'HAUTE',
      nextAction: 'Finaliser les conditions fournisseur puis préparer la commande.',
    };
  }

  // Test is appropriate when the uncertainty is experimentally reducible.
  if (
    scoring.potential >= 70 &&
    scoring.economics >= 60 &&
    scoring.riskQuality >= 60 &&
    !contradictions.hasCritical
  ) {
    return {
      decision: DECISIONS.TEST,
      score: scoring.opportunityIndex,
      opportunityIndex: scoring.opportunityIndex,
      ...scoring,
      confidence,
      evidence: data.evidence ?? [],
      offer,
      gates,
      contradictions,
      reason: 'Opportunité viable mais nécessitant une validation limitée avant engagement.',
      priority: 'HAUTE',
      nextAction: 'Définir un test plafonné et ses critères de réussite/arrêt.',
    };
  }

  return {
    decision: DECISIONS.WAIT,
    score: scoring.opportunityIndex,
    opportunityIndex: scoring.opportunityIndex,
    ...scoring,
    confidence,
    evidence: data.evidence ?? [],
    offer,
    gates,
    contradictions,
    reason: 'Analyse complémentaire nécessaire avant engagement.',
    priority: 'MOYENNE',
    nextAction: 'Résoudre le principal facteur d’incertitude identifié.',
  };
}
