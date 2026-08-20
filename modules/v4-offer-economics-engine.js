// V4 Sourcing Intelligence — Offer & Unit Economics Engine v1
// Deterministic calculations only. No external data is invented.

const nonNegative = (value) => Math.max(0, Number(value) || 0);
const percent = (value) => Math.max(0, Number(value) || 0);

/**
 * Calculate the economics of an offer from validated or explicitly estimated inputs.
 *
 * landedCost: product + customization + packaging + shipping + import + inspection/other
 * variableFees: payment/platform fees per order
 * cac: acquisition cost per order
 */
export function calculateOfferEconomics(input = {}) {
  const salePrice = nonNegative(input.salePrice);
  const landedCost = nonNegative(input.landedCost);
  const variableFees = nonNegative(input.variableFees);
  const cac = nonNegative(input.cac);
  const targetMargin = percent(input.targetMargin);

  const contributionBeforeAds = salePrice - landedCost - variableFees;
  const contributionAfterAds = contributionBeforeAds - cac;
  const grossMarginBeforeAds = salePrice ? (contributionBeforeAds / salePrice) * 100 : 0;
  const netContributionMargin = salePrice ? (contributionAfterAds / salePrice) * 100 : 0;

  // Maximum CAC that preserves the requested target margin.
  const maxCacAtTargetMargin = Math.max(
    0,
    contributionBeforeAds - (salePrice * targetMargin) / 100
  );

  // Minimum sale price needed to preserve targetMargin after fees and CAC.
  const denominator = 1 - targetMargin / 100;
  const minimumSalePriceAtTargetMargin = denominator > 0
    ? (landedCost + variableFees + cac) / denominator
    : null;

  const breakEvenSalePrice = landedCost + variableFees + cac;
  const status = contributionAfterAds > 0
    ? (netContributionMargin >= targetMargin ? 'healthy' : 'thin_margin')
    : 'loss';

  return {
    inputs: { salePrice, landedCost, variableFees, cac, targetMargin },
    contributionBeforeAds,
    contributionAfterAds,
    grossMarginBeforeAds,
    netContributionMargin,
    maxCacAtTargetMargin,
    minimumSalePriceAtTargetMargin,
    breakEvenSalePrice,
    status,
  };
}

/**
 * Run simple downside/base/upside scenarios by changing CAC and conversion assumptions.
 * conversionRate is expressed as a percentage (e.g. 2.5 = 2.5%).
 */
export function simulateOfferScenarios(input = {}) {
  const visitors = nonNegative(input.visitors);
  const baseConversionRate = percent(input.conversionRate);
  const economics = calculateOfferEconomics(input);

  const scenarios = [
    { name: 'downside', cacMultiplier: 1.30, conversionMultiplier: 0.70 },
    { name: 'base', cacMultiplier: 1.00, conversionMultiplier: 1.00 },
    { name: 'upside', cacMultiplier: 0.80, conversionMultiplier: 1.25 },
  ];

  return scenarios.map((scenario) => {
    const cac = economics.inputs.cac * scenario.cacMultiplier;
    const conversionRate = baseConversionRate * scenario.conversionMultiplier;
    const orders = visitors * (conversionRate / 100);
    const contributionPerOrder = economics.inputs.salePrice
      - economics.inputs.landedCost
      - economics.inputs.variableFees
      - cac;

    return {
      name: scenario.name,
      cac,
      conversionRate,
      orders,
      contribution: orders * contributionPerOrder,
      profitablePerOrder: contributionPerOrder > 0,
    };
  });
}

export default calculateOfferEconomics;
