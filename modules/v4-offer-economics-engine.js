// V4 Sourcing Intelligence — Offer & Unit Economics Engine v2
// Deterministic calculations only. Missing required inputs remain UNKNOWN.

const numberOrUnknown = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};
const nonNegative = (value) => {
  const numeric = numberOrUnknown(value);
  return numeric === null ? null : Math.max(0, numeric);
};
const percent = (value) => {
  const numeric = numberOrUnknown(value);
  return numeric === null ? null : Math.max(0, numeric);
};

export function calculateOfferEconomics(input = {}) {
  const salePrice = nonNegative(input.salePrice);
  const landedCost = nonNegative(input.landedCost);
  const variableFees = nonNegative(input.variableFees);
  const cac = nonNegative(input.cac);
  const targetMargin = percent(input.targetMargin);
  const inputs = { salePrice, landedCost, variableFees, cac, targetMargin };

  if (Object.values(inputs).some((value) => value === null)) {
    return {
      inputs,
      contributionBeforeAds: null,
      contributionAfterAds: null,
      grossMarginBeforeAds: null,
      netContributionMargin: null,
      maxCacAtTargetMargin: null,
      minimumSalePriceAtTargetMargin: null,
      breakEvenSalePrice: null,
      status: 'insufficient_data',
    };
  }

  const contributionBeforeAds = salePrice - landedCost - variableFees;
  const contributionAfterAds = contributionBeforeAds - cac;
  const grossMarginBeforeAds = salePrice ? (contributionBeforeAds / salePrice) * 100 : 0;
  const netContributionMargin = salePrice ? (contributionAfterAds / salePrice) * 100 : 0;

  const maxCacAtTargetMargin = Math.max(
    0,
    contributionBeforeAds - (salePrice * targetMargin) / 100
  );

  const denominator = 1 - targetMargin / 100;
  const minimumSalePriceAtTargetMargin = denominator > 0
    ? (landedCost + variableFees + cac) / denominator
    : null;

  const breakEvenSalePrice = landedCost + variableFees + cac;
  const status = contributionAfterAds > 0
    ? (netContributionMargin >= targetMargin ? 'healthy' : 'thin_margin')
    : 'loss';

  return {
    inputs,
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

export function simulateOfferScenarios(input = {}) {
  const visitors = nonNegative(input.visitors);
  const baseConversionRate = percent(input.conversionRate);
  const economics = calculateOfferEconomics(input);

  const scenarios = [
    { name: 'downside', cacMultiplier: 1.30, conversionMultiplier: 0.70 },
    { name: 'base', cacMultiplier: 1.00, conversionMultiplier: 1.00 },
    { name: 'upside', cacMultiplier: 0.80, conversionMultiplier: 1.25 },
  ];

  if (economics.status === 'insufficient_data' || visitors === null || baseConversionRate === null) {
    return scenarios.map((scenario) => ({
      name: scenario.name,
      cac: economics.inputs.cac,
      conversionRate: baseConversionRate,
      orders: null,
      contribution: null,
      profitablePerOrder: null,
    }));
  }

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
