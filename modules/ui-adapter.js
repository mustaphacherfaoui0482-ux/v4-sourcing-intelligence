/**
 * V4 Sourcing Intelligence — UI Adapter v1
 * Presentation contract only. No scoring, decision, or business-rule calculations.
 */

const formatNumber = (value, decimals = 0) => {
  if (!Number.isFinite(Number(value))) return '—';
  return Number(value).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatPercent = (value) => {
  if (!Number.isFinite(Number(value))) return '—';
  return `${formatNumber(value, 1)} %`;
};

const formatEuro = (value) => {
  if (!Number.isFinite(Number(value))) return '—';
  return `${formatNumber(value, 2)} €`;
};

/**
 * Converts a canonical Opportunity into display-ready values.
 * It deliberately does not calculate or reinterpret business metrics.
 */
export function toOpportunityViewModel(opportunity = {}) {
  const dimensions = opportunity.dimensions ?? {};
  const economics = opportunity.economics ?? {};

  return {
    id: opportunity.id ?? null,
    product: opportunity.product ?? '—',
    source: opportunity.source ?? '—',
    country: opportunity.country ?? '—',
    score: formatNumber(opportunity.score),
    scoreStatus: opportunity.scoreStatus ?? '—',
    decision: opportunity.decision ?? '—',
    decisionReason: opportunity.decisionReason ?? '—',
    dimensions: {
      potential: formatNumber(dimensions.potential),
      demand: formatNumber(dimensions.demand),
      margin: formatPercent(dimensions.margin),
      availability: formatNumber(dimensions.availability),
      landedCost: formatEuro(dimensions.landedCost),
      risk: formatNumber(dimensions.risk),
      easeOfTest: formatNumber(dimensions.easeOfTest),
      dataConfidence: formatPercent(dimensions.dataConfidence),
    },
    economics,
  };
}

export default toOpportunityViewModel;
