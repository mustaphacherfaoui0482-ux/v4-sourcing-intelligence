// V4 Sourcing Intelligence - Profitability module
export function calculateProfitability({salePrice=0, landedCost=0, fees=0, cac=0}) {
  const contribution = salePrice - landedCost - fees - cac;
  const margin = salePrice ? (contribution / salePrice) * 100 : 0;
  return { contribution, margin };
}
