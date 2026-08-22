import { evaluateOpportunity } from './decision-engine.js';
import { calculateOfferEconomics } from './v4-offer-economics-engine.js';
import { buildRadarOpportunity } from './radar-orchestrator.js';
import { toOpportunityViewModel } from './ui-adapter.js';

export const DEMO_OPPORTUNITY = Object.freeze({
  id: 'demo-hoodie-dz-premium',
  product: 'HOODIE DZ - PREMIUM 450GSM',
  source: '1688',
  country: 'CN',
  offer: { salePrice: 29.9, landedCost: 7, variableFees: 1.22, cac: 6.1, targetMargin: 30, visitors: 1000, conversionRate: 2.5 },
  demandScore: 90,
  sourcingScore: 92,
  profitabilityScore: 90,
  riskScore: 18,
  confidence: 92,
  marketingScore: 90,
  easeOfTest: 80,
  availability: 80,
  potential: 90,
  landedCostScore: 90,
});

function toEngineInput(opportunity) {
  const economics = calculateOfferEconomics(opportunity.offer);
  return {
    demand: opportunity.demandScore,
    marketing: opportunity.marketingScore ?? opportunity.demandScore,
    sourcing: opportunity.sourcingScore,
    profitability: opportunity.profitabilityScore,
    confidence: opportunity.confidence,
    economics,
  };
}

export function calculateDashboardState(opportunity = DEMO_OPPORTUNITY) {
  const economics = calculateOfferEconomics(opportunity.offer);
  const decisionInput = { ...opportunity, landedCost: opportunity.offer.landedCost, margin: economics.netContributionMargin };
  const decision = evaluateOpportunity(decisionInput);
  const canonical = buildRadarOpportunity({
    id: opportunity.id,
    product: opportunity.product,
    source: opportunity.source,
    country: opportunity.country,
    radarSignals: toEngineInput(opportunity),
    dimensions: {
      potential: opportunity.potential,
      demand: opportunity.demandScore,
      margin: economics.netContributionMargin,
      availability: opportunity.availability,
      landedCost: opportunity.landedCostScore,
      risk: opportunity.riskScore,
      easeOfTest: opportunity.easeOfTest,
      dataConfidence: opportunity.confidence,
    },
    economics,
    decision,
  });
  return Object.freeze({ economics, decision, opportunity: canonical, viewModel: toOpportunityViewModel(canonical) });
}

const money = (value) => `${Number(value).toFixed(2).replace('.', ',')} €`;
function setText(node, value) { if (node) node.textContent = value; }

function setGauge(node, score) {
  if (!node) return;
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const degrees = clamped * 3.6;
  node.style.background = `conic-gradient(var(--g, #79df31) 0 ${degrees}deg, #243546 ${degrees}deg)`;
  setText(node.querySelector('b'), String(Math.round(clamped)));
}

function setDecisionStyle(node, decision) {
  if (!node) return;
  node.classList.remove('good');
  node.style.color = decision === 'TESTER' ? 'var(--g, #79df31)' : decision === 'EVITER' ? 'var(--r, #ef5b52)' : 'var(--o, #f0a52b)';
}

function updateKpis(viewModel) {
  const cards = [...document.querySelectorAll('.kpis .kpi')];
  if (cards.length < 5) return;
  setGauge(cards[0].querySelector('.gauge'), Number(viewModel.score));
  setText(cards[0].querySelector('.good'), Number(viewModel.score) >= 75 ? 'Excellent potentiel' : Number(viewModel.score) >= 50 ? 'Potentiel à approfondir' : 'Potentiel faible');
  setText(cards[1].querySelector('.val'), viewModel.dimensions.landedCost);
  setText(cards[2].querySelector('.val'), viewModel.dimensions.margin);
  setText(cards[3].querySelector('.val'), money(viewModel.economics.maxCacAtTargetMargin));
  setText(cards[4].querySelector('.decision'), viewModel.decision);
  setDecisionStyle(cards[4].querySelector('.decision'), viewModel.decision);
  setText(cards[4].querySelector('.sub'), viewModel.decisionReason);
}

function updatePhone(viewModel) {
  const phone = document.querySelector('.phone');
  if (!phone) return;
  setGauge(phone.querySelector('.phoneg'), Number(viewModel.score));
  const cards = [...phone.querySelectorAll('.pc')];
  if (cards.length < 4) return;
  setText(cards[0].querySelector('b'), viewModel.dimensions.landedCost);
  setText(cards[1].querySelector('b'), viewModel.dimensions.margin);
  setText(cards[2].querySelector('b'), money(viewModel.economics.maxCacAtTargetMargin));
  setText(cards[3].querySelector('b'), viewModel.decision);
  setDecisionStyle(cards[3].querySelector('b'), viewModel.decision);
}

function updateCostAdvice(economics) {
  const advice = document.querySelector('.advice');
  if (!advice) return;
  const status = economics.status === 'healthy' ? 'Économie saine.' : economics.status === 'thin_margin' ? 'Marge trop fine pour la cible.' : 'Économie déficitaire.';
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
  setText(signals[0].querySelector('span'), `Score demande : ${opportunity.dimensions.demand}/100`);
  setText(signals[1].querySelector('span'), 'À confirmer par analyse marché');
  setText(signals[2].querySelector('span'), 'À confirmer par données');
  setText(signals[3].querySelector('span'), `Risque calculé : ${opportunity.dimensions.risk}/100`);
  setText(signals[4].querySelector('span'), `Niveau de preuve : ${opportunity.evidenceLevel}`);
}

function findPanelByText(text) {
  const needle = text.toLocaleLowerCase('fr-FR');
  return [...document.querySelectorAll('.panel,.kpi,.hero')].find((node) => node.textContent.toLocaleLowerCase('fr-FR').includes(needle));
}

function showNavigationFeedback(label) {
  const existing = document.querySelector('[data-v4-nav-feedback]');
  existing?.remove();
  const feedback = document.createElement('div');
  feedback.dataset.v4NavFeedback = 'true';
  feedback.textContent = `${label} · vue intégrée au Control Center`;
  Object.assign(feedback.style, {
    position: 'fixed', right: '18px', bottom: '18px', zIndex: '9999', padding: '10px 13px',
    border: '1px solid #5b4a27', borderRadius: '8px', background: '#11100d', color: '#d7b45a',
    font: '600 11px Inter,system-ui,sans-serif', boxShadow: '0 10px 30px #0008'
  });
  document.body.appendChild(feedback);
  window.setTimeout(() => feedback.remove(), 1800);
}

function wireActions(state) {
  const root = document.documentElement;
  if (root.dataset.v4ActionsWired === 'true') return;
  root.dataset.v4ActionsWired = 'true';

  const buttons = [...document.querySelectorAll('button')];
  const exportButton = buttons.find((button) => button.textContent.includes('Exporter le rapport'));
  if (exportButton) exportButton.addEventListener('click', () => {
    const report = { product: state.opportunity.product, score: state.opportunity.score, decision: state.opportunity.decision, reason: state.opportunity.decisionReason, economics: state.economics, generatedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'v4-sourcing-intelligence-report.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 250);
  });

  const newSourcing = buttons.find((button) => button.textContent.includes('Nouveau sourcing'));
  if (newSourcing) newSourcing.addEventListener('click', () => {
    const product = window.prompt('Produit à analyser');
    if (!product || !product.trim()) return;
    const next = { ...DEMO_OPPORTUNITY, id: `manual-${Date.now()}`, product: product.trim() };
    initDashboardRuntime(next);
    showNavigationFeedback(`Nouveau sourcing : ${product.trim()}`);
  });

  const selects = [...document.querySelectorAll('.bar select')];
  selects.forEach((select) => select.addEventListener('change', () => {
    const productSelect = selects[1];
    if (productSelect && select === productSelect && productSelect.value) {
      initDashboardRuntime({ ...DEMO_OPPORTUNITY, product: productSelect.value });
      showNavigationFeedback(`Produit sélectionné : ${productSelect.value}`);
    }
  }));

  const targets = {
    'Dashboard': '.hero',
    'Radar Sourcing': '.radar',
    'Opportunités': '.twocol',
    'Fournisseurs': '.twocol',
    'Coût rendu': '.grid2 .panel:nth-child(2)',
    'Échantillon & QC': '.qcs',
    'Décisions': '.kpis .kpi:nth-child(5)',
    'Rentabilité': '.grid2',
    'Veille & Alertes': '.phoneAlert',
  };

  const navLinks = [...document.querySelectorAll('.nav a')];
  navLinks.forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    navLinks.forEach((item) => item.classList.remove('on'));
    link.classList.add('on');
    const label = link.querySelector('span')?.textContent?.trim() || 'Vue';
    const selector = targets[label];
    const target = selector ? document.querySelector(selector) : findPanelByText(label);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showNavigationFeedback(label);
    }
  }));
}

export function initDashboardRuntime(opportunity = DEMO_OPPORTUNITY) {
  const state = calculateDashboardState(opportunity);
  const { viewModel } = state;
  updateKpis(viewModel);
  updatePhone(viewModel);
  updateCostAdvice(state.economics);
  updateSignals(state.opportunity);
  wireActions(state);
  document.documentElement.dataset.v4Runtime = 'ready';
  window.V4SourcingRuntime = Object.freeze(state);
  return state;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initDashboardRuntime(), { once: true });
  else initDashboardRuntime();
}