/**
 * V4 Sourcing Intelligence — Canonical Opportunity Model v1
 * Pure normalization layer. No scoring and no external data generation.
 */

const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export function createOpportunity(input = {}) {
  return {
    id: input.id ?? null,
    product: input.product ?? null,
    source: input.source ?? null,
    country: input.country ?? null,
    dimensions: {
      potential: clamp(input.potential),
      demand: clamp(input.demand),
      margin: clamp(input.margin),
      availability: clamp(input.availability),
      landedCost: clamp(input.landedCost),
      risk: clamp(input.risk),
      easeOfTest: clamp(input.easeOfTest),
      dataConfidence: clamp(input.dataConfidence),
    },
    supplier: input.supplier ?? null,
    suppliers: Array.isArray(input.suppliers) ? input.suppliers : [],
    economics: input.economics ?? null,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    createdAt: input.createdAt ?? null,
  };
}

export default createOpportunity;
