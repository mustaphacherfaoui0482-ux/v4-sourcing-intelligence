/**
 * V4 Sourcing Intelligence — Radar Orchestrator v1
 * Coordinates existing deterministic engines without duplicating their logic.
 */

import { createOpportunity } from './opportunity-model.js';

const average = (values) => {
  const valid = values.filter((value) => Number.isFinite(Number(value)));
  return valid.length ? valid.reduce((sum, value) => sum + Number(value), 0) / valid.length : 0;
};

export function buildRadarOpportunity(input = {}) {
  const product = input.productIntelligence ?? {};
  const supplier = input.supplierIntelligence ?? {};
  const risk = input.risk ?? {};
  const economics = input.economics ?? {};

  const productFactors = product.factors ?? product;
  const supplierFactors = supplier.factors ?? supplier;

  const opportunity = createOpportunity({
    id: input.id,
    product: input.product ?? null,
    source: input.source ?? null,
    country: input.country ?? null,
    potential: productFactors.potential ?? productFactors.marketing ?? 0,
    demand: productFactors.demand ?? 0,
    margin: economics.netContributionMargin ?? productFactors.profitability ?? 0,
    availability: supplierFactors.availability ?? supplierFactors.reliability ?? 0,
    landedCost: economics.landedCostScore ?? productFactors.sourcing ?? 0,
    risk: risk.score ?? 0,
    easeOfTest: productFactors.easeOfTest ?? 0,
    dataConfidence: productFactors.confidence ?? supplierFactors.dataConfidence ?? risk.dataConfidence ?? 0,
    supplier: supplier.result ?? supplier,
    economics,
    evidence: input.evidence,
    createdAt: input.createdAt,
  });

  const dimensions = opportunity.dimensions;
  const score = Math.round(average([
    dimensions.potential,
    dimensions.demand,
    dimensions.margin,
    dimensions.availability,
    100 - dimensions.landedCost,
    100 - dimensions.risk,
    dimensions.easeOfTest,
    dimensions.dataConfidence,
  ]));

  return { ...opportunity, score };
}

export default buildRadarOpportunity;
