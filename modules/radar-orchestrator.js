/**
 * V4 Sourcing Intelligence — Radar Orchestrator v3
 * Coordinates existing deterministic engines without duplicating scoring or decision logic.
 * Compatibility layer: the existing Radar Scoring Engine remains the single scoring authority.
 */

import { createOpportunity } from './opportunity-model.js';
import { calculateRadarScore } from './radar-scoring-engine.js';

export function buildRadarOpportunity(input = {}) {
  const product = input.productIntelligence ?? {};
  const supplier = input.supplierIntelligence ?? {};
  const risk = input.risk ?? {};
  const economics = input.economics ?? {};
  const dimensions = input.dimensions ?? {};
  const decision = input.decision ?? null;

  const productSignals = product.signals ?? product.factors ?? product;
  const supplierFactors = supplier.factors ?? supplier;

  const radarSignals = input.radarSignals ?? {
    demand: productSignals.demand,
    marketing: productSignals.marketing,
    sourcing: productSignals.sourcing,
    profitability: productSignals.profitability ?? economics.netContributionMargin,
    confidence: productSignals.confidence ?? supplierFactors.dataConfidence,
  };

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
    landedCostScore: dimensions.landedCostScore,
    risk: dimensions.risk ?? risk.riskScore,
    easeOfTest: dimensions.easeOfTest,
    dataConfidence: dimensions.dataConfidence ?? productSignals.confidence ?? supplierFactors.dataConfidence,
    supplier: supplier.result ?? supplier,
    suppliers: input.suppliers,
    costBreakdown: input.costBreakdown,
    economics,
    marketSignals: input.marketSignals,
    evidence: input.evidence,
    createdAt: input.createdAt,
  });

  return {
    ...opportunity,
    score: radarScore.total,
    scoreBreakdown: radarScore.breakdown,
    scoreStatus: radarScore.status,
    decision: decision?.decision ?? null,
    decisionReason: decision?.reason ?? null,
  };
}

export default buildRadarOpportunity;
