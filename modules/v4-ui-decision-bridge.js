// V4 UI Decision Bridge v2
// Connects the live Radar form to the deterministic decision engine.

import { evaluateOpportunity } from './decision-engine.js';

const n = (id) => Number(document.getElementById(id)?.value) || 0;

function runV4DecisionBridge() {
  const salePrice = n('sale');
  const landedCost = ['p', 'c', 'pack', 'ship', 'customs', 'other']
    .reduce((sum, id) => sum + n(id), 0);
  const variableFees = n('fees');
  const cac = n('cac');
  const targetMargin = n('margin');

  // Pass raw offer inputs into Decision Engine v2.
  // The decision engine owns the economic calculation so the UI and engine
  // cannot silently diverge.
  const offer = {
    salePrice,
    landedCost,
    variableFees,
    cac,
    targetMargin,
    visitors: 1000,
    conversionRate: 2,
  };

  const decision = evaluateOpportunity({
    demandScore: 50,
    sourcingScore: 50,
    profitabilityScore: 0,
    riskScore: 30,
    confidence: 50,
    offer,
  });

  const result = decision.offer;
  let panel = document.getElementById('v4-engine-decision');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'v4-engine-decision';
    panel.className = 'status';
    document.querySelector('section.card:nth-of-type(8)')?.appendChild(panel);
  }

  panel.className = `status ${decision.decision === 'EVITER' ? 'danger' : 'positive'}`;
  panel.innerHTML = `<b>🧠 Decision Engine V4 :</b> ${decision.decision}
    · économie : ${result?.economics.status ?? '—'}
    · résilience : ${result?.resilience ?? 0}%
    · recommandation offre : ${result?.recommendation ?? '—'}
    · score décision : ${decision.score}/100
    · ${decision.reason}`;
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input, textarea, select').forEach((el) => {
    el.addEventListener('input', runV4DecisionBridge);
    el.addEventListener('change', runV4DecisionBridge);
  });
  runV4DecisionBridge();
});
