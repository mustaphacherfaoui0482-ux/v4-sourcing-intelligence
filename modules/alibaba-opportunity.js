/**
 * Converts explicit Alibaba evidence into a canonical V4 opportunity shell.
 * Missing product identity is not enough to create an opportunity.
 * Missing economics and scoring inputs remain unknown; no score is fabricated.
 */
export function buildAlibabaOpportunity(evidence = {}) {
  const product = String(evidence.product ?? '').trim() || null;

  if (!product) return null;

  const knownNumber = (value) => (
    typeof value === 'number' && Number.isFinite(value) ? value : null
  );

  const displayedPrice = knownNumber(evidence.displayedPrice);
  const itemId = String(evidence.itemId ?? '').trim() || null;
  const variantId = String(evidence.variantId ?? '').trim() || null;
  const stableIdentity = itemId
    ? `alibaba-${itemId}${variantId ? `-${variantId}` : ''}`
    : null;

  return Object.freeze({
    id: stableIdentity || `alibaba-${product}`,
    product,
    source: 'Alibaba.com',
    country: evidence.supplierCountry || '—',
    isDemo: false,
    evidenceLevel: 'P1',
    evidence: Object.freeze({ ...evidence }),
    offer: {
      salePrice: null,
      landedCost: null,
      variableFees: null,
      cac: null,
      targetMargin: 30,
      visitors: null,
      conversionRate: null,
      supplierPrice: displayedPrice,
    },
    demandScore: null,
    sourcingScore: null,
    profitabilityScore: null,
    riskScore: null,
    confidence: null,
    marketingScore: null,
    easeOfTest: null,
    availability: null,
    potential: null,
    landedCostScore: null,
  });
}
