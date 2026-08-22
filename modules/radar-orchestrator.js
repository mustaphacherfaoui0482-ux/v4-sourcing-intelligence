/**
 * V4 Sourcing Intelligence — Radar Orchestrator v4
 * Compatibility layer around the canonical opportunity model.
 * The Decision Engine is authoritative for the final decision score when available.
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
    risk: dimensions.risk ?? risk.riskScore,
    easeOfTest: dimensions.easeOfTest,
    dataConfidence: dimensions.dataConfidence ?? productSignals.confidence ?? supplierFactors.dataConfidence,
    supplier: supplier.result ?? supplier,
    economics,
    evidence: input.evidence,
    createdAt: input.createdAt,
  });

  const hasDecisionScore = Number.isFinite(Number(decision?.opportunityIndex));

  return {
    ...opportunity,
    score: hasDecisionScore ? decision.opportunityIndex : radarScore.total,
    scoreBreakdown: hasDecisionScore ? {
      potential: decision.potential,
      demand: decision.demand,
      economics: decision.economics,
      riskQuality: decision.riskQuality,
    } : radarScore.breakdown,
    scoreStatus: hasDecisionScore ? 'decision-index' : radarScore.status,
    decision: decision?.decision ?? null,
    decisionReason: decision?.reason ?? null,
    decisionDetails: decision ?? null,
  };
}

export default buildRadarOpportunity;
