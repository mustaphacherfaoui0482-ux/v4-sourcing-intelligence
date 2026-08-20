/**
 * V4 Sourcing Intelligence — Cost Engine v1
 * Deterministic landed cost and margin calculations.
 */

const number = (value) => Number(value) || 0;

export function calculateLandedCost(input = {}) {
  const productCost = number(input.productCost);
  const shipping = number(input.shipping);
  const customs = number(input.customs);
  const taxes = number(input.taxes);
  const packaging = number(input.packaging);
  const fees = number(input.fees);

  const landedCost = productCost + shipping + customs + taxes + packaging + fees;

  const sellingPrice = number(input.sellingPrice);
  const marketingCost = number(input.marketingCost);

  const grossMargin = sellingPrice - landedCost;
  const netMargin = grossMargin - marketingCost;
  const marginRate = sellingPrice > 0 ? Math.round((netMargin / sellingPrice) * 100) : 0;

  return {
    landedCost,
    grossMargin,
    netMargin,
    marginRate,
    status: marginRate >= 40 ? 'strong' : marginRate >= 20 ? 'review' : 'weak'
  };
}
