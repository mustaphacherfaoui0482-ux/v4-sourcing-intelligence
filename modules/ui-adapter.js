/**
 * V4 Sourcing Intelligence — UI Adapter v2
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

export function toOpportunityViewModel(opportunity = {}) {
  const dimensions = opportunity.dimensions ?? {};
  const economics = opportunity.economics ?? {};
  const decision = opportunity.decisionDetails ?? {};
  const gates = decision.gates ?? {};

  return {
    id: opportunity.id ?? null,
    product: opportunity.product ?? '—',
    source: opportunity.source ?? '—',
    country: opportunity.country ?? '—',
    score: formatNumber(opportunity.score),
    scoreStatus: opportunity.scoreStatus ?? '—',
    decision: opportunity.decision ?? '—',
    decisionReason: opportunity.decisionReason ?? '—',
    confidence: formatPercent(decision.confidence),
    priority: decision.priority ?? '—',
    nextAction: decision.nextAction ?? '—',
    gates: {
      blocking: gates.counts?.blocking ?? 0,
      confirmedBlocking: gates.counts?.confirmedBlocking ?? 0,
      unresolvedBlocking: gates.counts?.unresolvedBlocking ?? 0,
      major: gates.counts?.major ?? 0,
    },
    contradictions: decision.contradictions?.contradictions?.length ?? 0,
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
