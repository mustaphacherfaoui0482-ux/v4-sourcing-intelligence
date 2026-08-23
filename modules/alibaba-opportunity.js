/**
 * Converts explicit Alibaba evidence into a canonical V4 opportunity shell.
 * Missing economics remain unknown; no score or decision is fabricated.
 */
export function buildAlibabaOpportunity(evidence = {}) {
  const product = String(evidence.product ?? '').trim() || null;

  return Object.freeze({
    id: `alibaba-${Date.now()}`,
    product,
    source: 'Alibaba.com',
    country: evidence.supplierCountry || '—',
    isDemo: false,
    evidenceLevel: 'P1',
    evidence: Object.freeze({ ...evidence }),
    offer: {
      salePrice: 0,
      landedCost: 0,
      variableFees: 0,
      cac: 0,
      targetMargin: 30,
      visitors: 0,
      conversionRate: 0,
    },
    demandScore: 0,
    sourcingScore: 0,
    profitabilityScore: 0,
    riskScore: 0,
    confidence: 0,
    marketingScore: 0,
    easeOfTest: 0,
    availability: 0,
    potential: 0,
    landedCostScore: 0,
  });
}
