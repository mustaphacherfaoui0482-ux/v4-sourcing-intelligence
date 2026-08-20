// V4 UI Decision Bridge v3
// Connects the live Radar form to the deterministic decision engine and
// renders the visible economic graph from the same values.

import { evaluateOpportunity } from './decision-engine.js';

const n = (id) => Number(document.getElementById(id)?.value) || 0;
const euro = (value) => Number(value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

function renderEconomicChart(salePrice, landedCost, variableFees, cac, contribution, margin, score) {
  const chart = document.querySelector('.chart');
  if (!chart) return;

  const max = Math.max(salePrice, landedCost, variableFees, cac, contribution, 1);
  const bar = (label, value, className = '') => `
    <div class="v4-chart-row">
      <div class="v4-chart-label"><span>${label}</span><b>${euro(value)}</b></div>
      <div class="v4-chart-track"><i class="v4-chart-fill ${className}" style="width:${Math.max(2, Math.min(100, value / max * 100))}%"></i></div>
    </div>`;

  chart.innerHTML = `
    <div class="v4-chart-title">Répartition économique</div>
    <div class="v4-chart-subtitle">Prix de vente et postes de coût calculés en temps réel</div>
    ${bar('Prix de vente', salePrice)}
    ${bar('Coût rendu', landedCost)}
    ${bar('Frais', variableFees)}
    ${bar('CAC', cac)}
    ${bar('Contribution', Math.max(0, contribution))}
    <div class="v4-chart-footer">
      <span>Marge <b>${margin.toFixed(1)}%</b></span>
      <span>Score <b>${score}/100</b></span>
    </div>`;

  if (!document.getElementById('v4-visual-style')) {
    const style = document.createElement('style');
    style.id = 'v4-visual-style';
    style.textContent = `
      .v4-chart-title{font-size:20px;font-weight:850;margin-bottom:2px}
      .v4-chart-subtitle{font-size:13px;color:var(--muted);margin-bottom:18px}
      .v4-chart-row{margin:13px 0}
      .v4-chart-label{display:flex;justify-content:space-between;gap:16px;font-size:13px;margin-bottom:6px}
      .v4-chart-label span{color:#475467;font-weight:650}.v4-chart-label b{color:var(--ink)}
      .v4-chart-track{height:16px;background:#eef2f6;border-radius:999px;overflow:hidden}
      .v4-chart-fill{display:block;height:100%;border-radius:999px;background:var(--accent);transition:width .25s ease}
      .v4-chart-footer{display:flex;justify-content:space-between;border-top:1px solid var(--line);margin-top:18px;padding-top:14px;color:var(--muted);font-size:13px}
      .v4-chart-footer b{color:var(--ink);font-size:16px}
      @media(max-width:480px){.v4-chart-label{font-size:12px}.v4-chart-track{height:14px}}
    `;
    document.head.appendChild(style);
  }
}

function runV4DecisionBridge() {
  const salePrice = n('sale');
  const landedCost = ['p', 'c', 'pack', 'ship', 'customs', 'other']
    .reduce((sum, id) => sum + n(id), 0);
  const variableFees = n('fees');
  const cac = n('cac');
  const targetMargin = n('margin');
  const contribution = salePrice - landedCost - variableFees - cac;
  const margin = salePrice ? (contribution / salePrice) * 100 : 0;

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
  const score = decision.score || 0;
  renderEconomicChart(salePrice, landedCost, variableFees, cac, contribution, margin, score);

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
    · score décision : ${score}/100
    · ${decision.reason}`;
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input, textarea, select').forEach((el) => {
    el.addEventListener('input', runV4DecisionBridge);
    el.addEventListener('change', runV4DecisionBridge);
  });
  runV4DecisionBridge();
});
