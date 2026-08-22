/**
 * V4 Sourcing Intelligence — Canonical Opportunity Model v1
 * Pure normalization layer. No scoring and no external data generation.
 */

const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const normalizeLandedCost = (value) => {
  if (value === null || value === undefined || value === 'UNKNOWN') return null;

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;

  return Math.max(0, Math.min(100, numeric));
};

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
      landedCost: normalizeLandedCost(input.landedCost),
      risk: clamp(input.risk),
      easeOfTest: clamp(input.easeOfTest),
      dataConfidence: clamp(input.dataConfidence),
    },
    supplier: input.supplier ?? null,
    economics: input.economics ?? null,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    createdAt: input.createdAt ?? null,
  };
}

export default createOpportunity;
