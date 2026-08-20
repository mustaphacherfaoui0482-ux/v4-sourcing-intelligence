// V4 UI Decision Bridge v1
// Connects the live Radar form to the deterministic decision engine.

import { evaluateOpportunity } from './decision-engine.js';
import { evaluateOfferForDecision } from './v4-offer-engine-adapter.js';

const n = (id) => Number(document.getElementById(id)?.value) || 0;

function runV4DecisionBridge() {
  const salePrice = n('sale');
  const landedCost = ['p', 'c', 'pack', 'ship', 'customs', 'other']
    .reduce((sum, id) => sum + n(id), 0);
  const variableFees = n('fees');
  const cac = n('cac');
  const targetMargin = n('margin');

  const offer = evaluateOfferForDecision({
    salePrice,
    landedCost,
    variableFees,
    cac,
    targetMargin,
    visitors: 1000,
    conversionRate: 2,
  });

  const legacyScore = Math.min(100, Math.max(0, n('sale') > 0
    ? ((salePrice - landedCost - variableFees - cac) / salePrice) * 100
    : 0));

  const decision = evaluateOpportunity({
    demandScore: 50,
    sourcingScore: 50,
    profitabilityScore: Math.round(legacyScore),
    riskScore: offer.recommendation === 'avoid' ? 90 : offer.recommendation === 'optimize' ? 55 : 30,
    confidence: 50,
  });

  let panel = document.getElementById('v4-engine-decision');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'v4-engine-decision';
    panel.className = 'status';
    document.querySelector('section.card:nth-of-type(8)')?.appendChild(panel);
  }

  panel.innerHTML = `<b>🧠 Decision Engine V4 :</b> ${decision.decision}
    · économie : ${offer.economics.status}
    · résilience : ${offer.resilience}%
    · recommandation offre : ${offer.recommendation}
    · score décision : ${decision.score}/100`;
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input, textarea, select').forEach((el) => {
    el.addEventListener('input', runV4DecisionBridge);
    el.addEventListener('change', runV4DecisionBridge);
  });
  runV4DecisionBridge();
});
