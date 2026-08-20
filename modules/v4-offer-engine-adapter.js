// V4 Offer Engine Adapter v1
// Bridges offer/unit economics calculations into a decision payload.

import calculateOfferEconomics, {
  simulateOfferScenarios,
} from './v4-offer-economics-engine.js';

export function evaluateOfferForDecision(input = {}) {
  const economics = calculateOfferEconomics(input);
  const scenarios = simulateOfferScenarios(input);

  const profitableScenarios = scenarios.filter((scenario) => scenario.profitablePerOrder).length;
  const resilience = Math.round((profitableScenarios / scenarios.length) * 100);

  const recommendation = economics.status === 'loss'
    ? 'avoid'
    : resilience >= 67 && economics.netContributionMargin >= economics.inputs.targetMargin
      ? 'test'
      : 'optimize';

  return {
    economics,
    scenarios,
    resilience,
    recommendation,
  };
}

export default evaluateOfferForDecision;
