import { evaluateOpportunity } from './decision-engine.js';
import { calculateOfferEconomics } from './v4-offer-economics-engine.js';

export const DEMO_OPPORTUNITY = Object.freeze({
  product: 'HOODIE DZ - PREMIUM 450GSM',
  offer: {
    salePrice: 29.9,
    landedCost: 7,
    variableFees: 1.22,
    cac: 6.1,
    targetMargin: 30,
    visitors: 1000,
    conversionRate: 2.5,
  },
  demandScore: 90,
  sourcingScore: 92,
  profitabilityScore: 90,
  riskScore: 18,
  confidence: 92,
});

export function calculateDashboardState(opportunity = DEMO_OPPORTUNITY) {
  const economics = calculateOfferEconomics(opportunity.offer);
  const decision = evaluateOpportunity(opportunity);
  return Object.freeze({ economics, decision });
}

const money = (value) => `${Number(value).toFixed(2).replace('.', ',')} €`;
const percent = (value) => `${Number(value).toFixed(1).replace('.', ',')}%`;

function setText(node, value) {
  if (node) node.textContent = value;
}

function setGauge(node, score) {
  if (!node) return;
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const degrees = clamped * 3.6;
  node.style.background = `conic-gradient(var(--g) 0 ${degrees}deg, #243546 ${degrees}deg)`;
  setText(node.querySelector('b'), String(Math.round(clamped)));
}

function setDecisionStyle(node, decision) {
  if (!node) return;
  node.classList.remove('good');
  node.style.color = decision === 'TESTER' ? 'var(--g)' : decision === 'EVITER' ? 'var(--r)' : 'var(--o)';
}

function updateKpis(result, economics) {
  const cards = [...document.querySelectorAll('.kpis .kpi')];
  if (cards.length < 5) return;

  setGauge(cards[0].querySelector('.gauge'), result.score);
  setText(cards[0].querySelector('.good'), result.score >= 75 ? 'Excellent potentiel' : result.score >= 50 ? 'Potentiel à approfondir' : 'Potentiel faible');
  setText(cards[1].querySelector('.val'), money(economics.inputs.landedCost));
  setText(cards[2].querySelector('.val'), percent(economics.netContributionMargin));
  setText(cards[3].querySelector('.val'), money(economics.maxCacAtTargetMargin));
  setText(cards[4].querySelector('.decision'), result.decision);
  setDecisionStyle(cards[4].querySelector('.decision'), result.decision);
  setText(cards[4].querySelector('.sub'), result.reason);
}

function updatePhone(result, economics) {
  const phone = document.querySelector('.phone');
  if (!phone) return;

  setGauge(phone.querySelector('.phoneg'), result.score);
  const cards = [...phone.querySelectorAll('.pc')];
  if (cards.length < 4) return;

  setText(cards[0].querySelector('b'), money(economics.inputs.landedCost));
  setText(cards[1].querySelector('b'), percent(economics.netContributionMargin));
  setText(cards[2].querySelector('b'), money(economics.maxCacAtTargetMargin));
  setText(cards[3].querySelector('b'), result.decision);
  setDecisionStyle(cards[3].querySelector('b'), result.decision);
}

function updateCostAdvice(economics) {
  const advice = document.querySelector('.advice');
  if (!advice) return;

  const status = economics.status === 'healthy'
    ? 'Économie saine.'
    : economics.status === 'thin_margin'
      ? 'Marge trop fine pour la cible.'
      : 'Économie déficitaire.';

  advice.textContent = '';
  const prefix = document.createTextNode('💡 Diagnostic : ');
  const statusNode = document.createElement('b');
  statusNode.textContent = status;
  const suffix = document.createTextNode(` Contribution après acquisition : ${money(economics.contributionAfterAds)} par commande.`);
  advice.append(prefix, statusNode, suffix);
}

function updateSignals(opportunity) {
  const signals = [...document.querySelectorAll('.signals .sig')];
  if (signals.length < 5) return;
  setText(signals[0].querySelector('span'), `Score demande : ${opportunity.demandScore}/100`);
  setText(signals[1].querySelector('span'), 'À confirmer par analyse marché');
  setText(signals[2].querySelector('span'), 'À confirmer par données');
  setText(signals[3].querySelector('span'), `Risque calculé : ${opportunity.riskScore}/100`);
  setText(signals[4].querySelector('span'), 'Hypothèse fournisseur');
}

function wireActions(state, opportunity) {
  const exportButton = [...document.querySelectorAll('button')].find((button) => button.textContent.includes('Exporter le rapport'));
  if (!exportButton) return;

  exportButton.addEventListener('click', () => {
    const report = {
      product: opportunity.product,
      score: state.decision.score,
      decision: state.decision.decision,
      reason: state.decision.reason,
      economics: state.economics,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'v4-sourcing-intelligence-report.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }, { once: true });
}

export function initDashboardRuntime(opportunity = DEMO_OPPORTUNITY) {
  const state = calculateDashboardState(opportunity);

  updateKpis(state.decision, state.economics);
  updatePhone(state.decision, state.economics);
  updateCostAdvice(state.economics);
  updateSignals(opportunity);
  wireActions(state, opportunity);

  document.documentElement.dataset.v4Runtime = 'ready';
  window.V4SourcingRuntime = Object.freeze({ ...state, opportunity });
  return state;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initDashboardRuntime(), { once: true });
  } else {
    initDashboardRuntime();
  }
}
