// V4 Sourcing Intelligence — Scoring Engine v1
// Scores describe opportunity quality. They never override gates.

const clamp = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : fallback;
};

const weighted = (items) => {
  const known = items.filter(({ value }) => Number.isFinite(Number(value)));
  if (known.length === 0) return 0;
  const weight = known.reduce((sum, item) => sum + item.weight, 0);
  return Math.round(known.reduce((sum, item) => sum + clamp(item.value) * item.weight, 0) / weight);
};

export function calculatePotentialScore(input = {}) {
  if (Number.isFinite(Number(input.potential))) return clamp(input.potential);
  return weighted([
    { value: input.differentiation, weight: 0.20 },
    { value: input.perceivedValue, weight: 0.20 },
    { value: input.marketAttractiveness, weight: 0.25 },
    { value: input.easeOfTest, weight: 0.20 },
    { value: input.scalability, weight: 0.15 },
  ]);
}

export function calculateDemandScore(input = {}) {
  return weighted([
    { value: input.demandScore ?? input.demand, weight: 0.30 },
    { value: input.marketActivity, weight: 0.20 },
    { value: input.salesSignals, weight: 0.25 },
    { value: input.competitiveSignals, weight: 0.10 },
    { value: input.trendStability, weight: 0.15 },
  ]);
}

export function calculateEconomicsScore(input = {}) {
  if (Number.isFinite(Number(input.economicsScore))) return clamp(input.economicsScore);

  const offer = input.offerEconomics ?? input.economics;
  if (offer?.status === 'loss') return 0;

  return weighted([
    { value: input.profitabilityScore, weight: 0.40 },
    { value: input.contributionScore, weight: 0.25 },
    { value: input.cacHeadroomScore, weight: 0.15 },
    { value: input.landedCostEfficiency, weight: 0.10 },
    { value: input.resilience, weight: 0.10 },
  ]);
}

export function calculateRiskQuality(input = {}) {
  const riskExposure = clamp(input.riskScore ?? input.riskExposure, 0);
  return Math.round(100 - riskExposure);
}

export function calculateOpportunityIndex(input = {}) {
  const potential = calculatePotentialScore(input);
  const demand = calculateDemandScore(input);
  const economics = calculateEconomicsScore(input);
  const riskQuality = calculateRiskQuality(input);

  return Math.round(
    potential * 0.30 +
    demand * 0.20 +
    economics * 0.35 +
    riskQuality * 0.15,
  );
}

export function calculateScoring(input = {}) {
  const potential = calculatePotentialScore(input);
  const demand = calculateDemandScore(input);
  const economics = calculateEconomicsScore(input);
  const riskQuality = calculateRiskQuality(input);
  const opportunityIndex = calculateOpportunityIndex(input);

  return {
    potential,
    demand,
    economics,
    riskQuality,
    opportunityIndex,
  };
}

export default calculateScoring;
