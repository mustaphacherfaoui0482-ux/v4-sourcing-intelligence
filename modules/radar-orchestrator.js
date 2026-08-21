/**
 * V4 Sourcing Intelligence — Radar Orchestrator v2
 * Coordinates existing deterministic engines without duplicating scoring or decision logic.
 */

import { createOpportunity } from './opportunity-model.js';

export function buildRadarOpportunity(input = {}) {
  const product = input.productIntelligence ?? {};
  const supplier = input.supplierIntelligence ?? {};
  const risk = input.risk ?? {};
  const economics = input.economics ?? {};
  const dimensions = input.dimensions ?? {};
  const radarScore = input.radarScore ?? null;
  const decision = input.decision ?? null;

  const productSignals = product.signals ?? product.factors ?? product;
  const supplierFactors = supplier.factors ?? supplier;

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

  return {
    ...opportunity,
    score: Number.isFinite(Number(radarScore?.total)) ? Number(radarScore.total) : null,
    scoreBreakdown: radarScore?.breakdown ?? null,
    scoreStatus: radarScore?.status ?? null,
    decision: decision?.decision ?? null,
    decisionReason: decision?.reason ?? null,
  };
}

export default buildRadarOpportunity;
