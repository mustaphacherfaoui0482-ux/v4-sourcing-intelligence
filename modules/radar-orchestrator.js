/**
 * V4 Sourcing Intelligence — Radar Orchestrator v4
 * Coordinates deterministic engines and exposes evidence confidence separately
 * from opportunity potential.
 */

import { createOpportunity } from './opportunity-model.js';
import { calculateRadarScore } from './radar-scoring-engine.js';
import { calculateEvidenceConfidence } from './evidence-confidence-engine.js';

export function buildRadarOpportunity(input = {}) {
  const product = input.productIntelligence ?? {};
  const supplier = input.supplierIntelligence ?? {};
  const risk = input.risk ?? {};
  const economics = input.economics ?? {};
  const dimensions = input.dimensions ?? {};
  const decision = input.decision ?? null;
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];

  const productSignals = product.signals ?? product.factors ?? product;
  const supplierFactors = supplier.factors ?? supplier;
  const declaredConfidence =
    dimensions.dataConfidence ??
    productSignals.confidence ??
    supplierFactors.dataConfidence ??
    input.radarSignals?.confidence ??
    0;

  const evidenceConfidence = calculateEvidenceConfidence(evidence, declaredConfidence);

  const radarSignals = input.radarSignals ?? {
    demand: productSignals.demand,
    marketing: productSignals.marketing,
    sourcing: productSignals.sourcing,
    profitability: productSignals.profitability ?? economics.netContributionMargin,
    confidence: evidenceConfidence.score,
  };

  // When explicit evidence exists, its confidence is the authoritative confidence input.
  if (evidence.length > 0) radarSignals.confidence = evidenceConfidence.score;

  const radarScore = calculateRadarScore(radarSignals);

  const opportunity = createOpportunity({
    id: input.id,
    product: input.product ?? product.product ?? null,
    source: input.source ?? null,
    country: input.country ?? null,
    potential: dimensions.potential,
    demand: dimensions.demand ?? productSignals.demand,
    margin: dimensions.margin ?? economics.netContributionMargin ?? productSignals.profitability,
    availability: dimensions.availability,
    landedCost: dimensions.landedCost,
    risk: dimensions.risk ?? risk.riskScore,
    easeOfTest: dimensions.easeOfTest,
    dataConfidence: evidenceConfidence.score,
    supplier: supplier.result ?? supplier,
    economics,
    evidence,
    createdAt: input.createdAt,
  });

  return {
    ...opportunity,
    score: radarScore.total,
    scoreBreakdown: radarScore.breakdown,
    scoreStatus: radarScore.status,
    confidence: evidenceConfidence,
    decision: decision?.decision ?? null,
    decisionReason: decision?.reason ?? null,
  };
}

export default buildRadarOpportunity;
