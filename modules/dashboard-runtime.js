import { evaluateOpportunity } from './decision-engine.js';
import { calculateOfferEconomics } from './v4-offer-economics-engine.js';
import { buildRadarOpportunity } from './radar-orchestrator.js';
import { toOpportunityViewModel } from './ui-adapter.js';

export const DEMO_OPPORTUNITY = Object.freeze({
  id: 'demo-hoodie-dz-premium', product: 'HOODIE DZ - PREMIUM 450GSM', source: '1688', country: 'CN',
  offer: { salePrice: 29.9, landedCost: 7, variableFees: 1.22, cac: 6.1, targetMargin: 30, visitors: 1000, conversionRate: 2.5,
    costBreakdown: [
      { label: 'Produit (Usine)', value: 3.2 }, { label: 'Personnalisation', value: 0.8 }, { label: 'Transport int.', value: 1.2 },
      { label: 'Douane & Taxes', value: 0.6 }, { label: 'Transport France', value: 0.7 }, { label: 'Autres frais', value: 0.5 },
    ],
  },
  suppliers: [
    { id: 'demo-supplier-01', name: 'Supplier A', country: 'CN', unitPrice: 3.2, moq: 30, gsm: 450, composition: '100% coton', customization: true, leadTimeDays: 18, shippingCost: 0.7, score: 92, verificationStatus: 'to_verify' },
    { id: 'demo-supplier-02', name: 'Supplier B', country: 'CN', unitPrice: 3.6, moq: 50, gsm: 450, composition: '100% coton', customization: true, leadTimeDays: 21, shippingCost: 0.8, score: 88, verificationStatus: 'to_verify' },
    { id: 'demo-supplier-03', name: 'Supplier C', country: 'CN', unitPrice: 3.9, moq: 100, gsm: 420, composition: '100% coton', customization: true, leadTimeDays: 24, shippingCost: 0.9, score: 84, verificationStatus: 'to_verify' },
  ],
  demandScore: 90, sourcingScore: 92, profitabilityScore: 90, riskScore: 18, confidence: 92, marketingScore: 90,
  easeOfTest: 80, availability: 80, potential: 90, landedCostScore: 90,
});

function toEngineInput(opportunity) {
  const economics = calculateOfferEconomics(opportunity.offer);
  return { demand: opportunity.demandScore, marketing: opportunity.marketingScore ?? opportunity.demandScore, sourcing: opportunity.sourcingScore, profitability: opportunity.profitabilityScore, confidence: opportunity.confidence, economics };
}

export function calculateDashboardState(opportunity = DEMO_OPPORTUNITY) {
  const economics = calculateOfferEconomics(opportunity.offer);
  const decision = evaluateOpportunity({ ...opportunity, landedCost: opportunity.offer.landedCost, margin: economics.netContributionMargin });
  const canonical = buildRadarOpportunity({
    id: opportunity.id, product: opportunity.product, source: opportunity.source, country: opportunity.country,
    suppliers: opportunity.suppliers,
    radarSignals: toEngineInput(opportunity),
    dimensions: {
      potential: opportunity.potential, demand: opportunity.demandScore, margin: economics.netContributionMargin,
      availability: opportunity.availability, landedCost: opportunity.offer.landedCost, landedCostScore: opportunity.landedCostScore,
      risk: opportunity.riskScore, easeOfTest: opportunity.easeOfTest, dataConfidence: opportunity.confidence,
    }, economics, decision,
  });
  return Object.freeze({ economics, decision, opportunity: canonical, viewModel: toOpportunityViewModel(canonical) });
}

const money = (value) => `${Number(value).toFixed(2).replace('.', ',')} €`;
const percent = (value) => `${Number(value).toFixed(1).replace('.', ',')}%`;
function setText(node, value) { if (node) node.textContent = value; }
function setGauge(node, score) { if (!node) return; const clamped = Math.max(0, Math.min(100, Number(score) || 0)); const degrees = clamped * 3.6; node.style.background = `conic-gradient(var(--g) 0 ${degrees}deg, #243546 ${degrees}deg)`; setText(node.querySelector('b'), String(Math.round(clamped))); }
function setDecisionStyle(node, decision) { if (!node) return; node.classList.remove('good'); node.style.color = decision === 'TESTER' ? 'var(--g)' : decision === 'EVITER' ? 'var(--r)' : 'var(--o)'; }
function updateKpis(viewModel) { const cards = [...document.querySelectorAll('.kpis .kpi')]; if (cards.length < 5) return; setGauge(cards[0].querySelector('.gauge'), Number(viewModel.score)); setText(cards[0].querySelector('.good'), Number(viewModel.score) >= 75 ? 'Excellent potentiel' : Number(viewModel.score) >= 50 ? 'Potentiel à approfondir' : 'Potentiel faible'); setText(cards[1].querySelector('.val'), viewModel.dimensions.landedCost); setText(cards[2].querySelector('.val'), viewModel.dimensions.margin); setText(cards[3].querySelector('.val'), money(viewModel.economics.maxCacAtTargetMargin)); setText(cards[4].querySelector('.decision'), viewModel.decision); setDecisionStyle(cards[4].querySelector('.decision'), viewModel.decision); setText(cards[4].querySelector('.sub'), viewModel.decisionReason); }
function updatePhone(viewModel) { const phone = document.querySelector('.phone'); if (!phone) return; setGauge(phone.querySelector('.phoneg'), Number(viewModel.score)); const cards = [...phone.querySelectorAll('.pc')]; if (cards.length < 4) return; setText(cards[0].querySelector('b'), viewModel.dimensions.landedCost); setText(cards[1].querySelector('b'), viewModel.dimensions.margin); setText(cards[2].querySelector('b'), money(viewModel.economics.maxCacAtTargetMargin)); setText(cards[3].querySelector('b'), viewModel.decision); setDecisionStyle(cards[3].querySelector('b'), viewModel.decision); }
function updateCostAdvice(economics) { const advice = document.querySelector('.advice'); if (!advice) return; const status = economics.status === 'healthy' ? 'Économie saine.' : economics.status === 'thin_margin' ? 'Marge trop fine pour la cible.' : 'Économie déficitaire.'; advice.textContent = ''; const prefix = document.createTextNode('💡 Diagnostic : '); const statusNode = document.createElement('b'); statusNode.textContent = status; const suffix = document.createTextNode(` Contribution après acquisition : ${money(economics.contributionAfterAds)} par commande.`); advice.append(prefix, statusNode, suffix); }
function updateCostBreakdown(costBreakdown, landedCost) { const donut = document.querySelector('.donut'); const rows = [...document.querySelectorAll('.cost div')]; if (!donut || !rows.length || !Array.isArray(costBreakdown) || !costBreakdown.length) return; const total = Number(landedCost) || costBreakdown.reduce((sum, item) => sum + (Number(item.value) || 0), 0); const normalized = costBreakdown.map((item) => ({ label: item.label, value: Math.max(0, Number(item.value) || 0) })); const sum = normalized.reduce((acc, item) => acc + item.value, 0); if (!sum) return; const stops = []; let cursor = 0; const palette = ['#3b82f6', '#3bc7c5', '#55c79b', '#f59e0b', '#f97316', '#8b5cf6']; normalized.forEach((item, index) => { const share = (item.value / sum) * 100; stops.push(`${palette[index % palette.length]} ${cursor}% ${cursor + share}%`); cursor += share; }); donut.style.background = `conic-gradient(${stops.join(',')})`; setText(donut.querySelector('b'), money(total)); normalized.forEach((item, index) => { const row = rows[index]; if (!row) return; setText(row.querySelector('span'), item.label); setText(row.querySelector('b'), `${money(item.value)}  ${percent((item.value / sum) * 100)}`); }); rows.slice(normalized.length).forEach((row) => row.remove()); }
function updateRadar(opportunity) { const radar = document.querySelector('.radar svg'); if (!radar || !opportunity?.dimensions) return; const d = opportunity.dimensions; const values = [Number(d.landedCostScore) || 0, Number(d.dataConfidence) || 0, Number(d.easeOfTest) || 0, Number(opportunity.scoreBreakdown?.sourcing ?? d.availability) || 0, 100 - (Number(d.risk) || 0)].map((value) => Math.max(0, Math.min(100, value))); const center = { x: 110, y: 94 }; const outer = [{ x: 110, y: 15 }, { x: 181, y: 68 }, { x: 154, y: 151 }, { x: 66, y: 151 }, { x: 39, y: 68 }]; const polygon = values.map((value, index) => { const ratio = value / 100; return `${(center.x + (outer[index].x - center.x) * ratio).toFixed(1)},${(center.y + (outer[index].y - center.y) * ratio).toFixed(1)}`; }).join(' '); const shape = radar.querySelector('g[fill="#79df31"] polygon'); if (shape) shape.setAttribute('points', polygon); }
function updateSignals(opportunity) { const signals = [...document.querySelectorAll('.signals .sig')]; if (signals.length < 5) return; const d = opportunity.dimensions ?? {}; setText(signals[0].querySelector('span'), `Demande : ${Number(d.demand) || 0}/100`); setText(signals[1].querySelector('span'), `Marge : ${percent(d.margin)}`); setText(signals[2].querySelector('span'), `Confiance données : ${Number(d.dataConfidence) || 0}/100`); setText(signals[3].querySelector('span'), `Risque : ${Number(d.risk) || 0}/100`); setText(signals[4].querySelector('span'), `Sourcing : ${Number(opportunity.scoreBreakdown?.sourcing ?? d.availability) || 0}/100`); }
function updateSuppliers(suppliers) {
  const table = [...document.querySelectorAll('.table')].find((node) => /Comparaison des fournisseurs/i.test(node.closest('.panel')?.textContent ?? ''));
  if (!table || !Array.isArray(suppliers)) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  tbody.textContent = '';
  suppliers.forEach((supplier, index) => {
    const row = document.createElement('tr');
    const landed = (Number(supplier.unitPrice) || 0) + (Number(supplier.shippingCost) || 0);
    const quality = Number(supplier.score) >= 90 ? '★★★★★' : Number(supplier.score) >= 80 ? '★★★★☆' : '★★★☆☆';
    const cells = [String(index + 1), supplier.name ?? '—', supplier.country === 'CN' ? '🇨🇳' : (supplier.country ?? '—'), money(landed), `${Number(supplier.moq) || 0} pcs`, `${Number(supplier.leadTimeDays) || 0} j`, quality, Math.round(Number(supplier.score) || 0)];
    cells.forEach((value, cellIndex) => { const cell = document.createElement('td'); if (cellIndex === 1) { const name = document.createElement('b'); name.textContent = value; cell.appendChild(name); } else if (cellIndex === 6) { cell.className = 'stars'; cell.textContent = value; } else if (cellIndex === 7) { const score = document.createElement('span'); score.className = 'score'; score.textContent = value; cell.appendChild(score); } else cell.textContent = value; row.appendChild(cell); });
    row.title = `${supplier.composition ?? ''} · ${supplier.customization ? 'Personnalisation' : 'Sans personnalisation'} · ${supplier.verificationStatus === 'verified' ? 'Vérifié' : supplier.verificationStatus === 'rejected' ? 'Rejeté' : 'À vérifier'}`;
    tbody.appendChild(row);
  });
}
function wireActions(state) { const exportButton = [...document.querySelectorAll('button')].find((button) => button.textContent.includes('Exporter le rapport')); if (!exportButton) return; exportButton.addEventListener('click', () => { const report = { product: state.opportunity.product, score: state.opportunity.score, decision: state.opportunity.decision, reason: state.opportunity.decisionReason, economics: state.economics, generatedAt: new Date().toISOString() }; const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'v4-sourcing-intelligence-report.json'; anchor.click(); URL.revokeObjectURL(url); }, { once: true }); }
export function initDashboardRuntime(opportunity = DEMO_OPPORTUNITY) { const state = calculateDashboardState(opportunity); const { viewModel } = state; updateKpis(viewModel); updatePhone(viewModel); updateCostAdvice(state.economics); updateCostBreakdown(opportunity.offer?.costBreakdown, opportunity.offer?.landedCost); updateRadar(state.opportunity); updateSignals(state.opportunity); updateSuppliers(state.opportunity.suppliers); wireActions(state); document.documentElement.dataset.v4Runtime = 'ready'; window.V4SourcingRuntime = Object.freeze(state); return state; }
if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initDashboardRuntime(), { once: true }); else initDashboardRuntime(); }
