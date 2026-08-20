/**
 * V4 Sourcing Intelligence — Supplier Intelligence Engine v1
 * Deterministic supplier evaluation. No AI in V1.
 */

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

export function evaluateSupplier(input = {}) {
  const factors = {
    reliability: clamp(input.reliability),
    quality: clamp(input.quality),
    leadTime: clamp(input.leadTime),
    logistics: clamp(input.logistics),
    pricing: clamp(input.pricing),
    moq: clamp(input.moq),
    dataConfidence: clamp(input.dataConfidence),
  };

  const score = Math.round(
    factors.reliability * 0.20 +
    factors.quality * 0.20 +
    factors.leadTime * 0.15 +
    factors.logistics * 0.15 +
    factors.pricing * 0.10 +
    factors.moq * 0.10 +
    factors.dataConfidence * 0.10
  );

  const risks = [];
  if (factors.reliability < 50) risks.push('supplier_reliability');
  if (factors.quality < 50) risks.push('quality_uncertainty');
  if (factors.leadTime < 50) risks.push('long_or_uncertain_lead_time');
  if (factors.logistics < 50) risks.push('logistics_risk');
  if (factors.moq < 50) risks.push('high_moq');
  if (factors.dataConfidence < 50) risks.push('insufficient_supplier_data');

  const status = score >= 75 ? 'preferred' : score >= 55 ? 'review' : 'high_risk';

  return {
    score,
    status,
    risks,
    factors,
    requiresSample: score < 80 || factors.quality < 70,
    requiresVerification: factors.dataConfidence < 70,
  };
}
