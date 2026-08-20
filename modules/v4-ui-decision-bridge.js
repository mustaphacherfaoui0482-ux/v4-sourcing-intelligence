// V4 UI Decision Bridge v4 — premium economic visualization
// Deterministic UI: all values come from the live Radar form and decision engine.
import { evaluateOpportunity } from './decision-engine.js';

const n = (id) => Number(document.getElementById(id)?.value) || 0;
const euro = (value) => Number(value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

function renderEconomicChart(salePrice, landedCost, variableFees, cac, contribution, margin, score) {
  const chart = document.querySelector('.chart');
  if (!chart) return;

  const costs = [
    ['Coût rendu', landedCost, 'cost'],
    ['Frais', variableFees, 'fee'],
    ['CAC', cac, 'cac'],
  ];
  const max = Math.max(salePrice, landedCost, variableFees, cac, contribution, 1);
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const safeMargin = Number.isFinite(margin) ? margin : 0;
  const contributionPct = salePrice ? Math.max(0, Math.min(100, contribution / salePrice * 100)) : 0;

  const bar = (label, value, className) => `
    <div class="v4-chart-row">
      <div class="v4-chart-label"><span>${label}</span><b>${euro(value)}</b></div>
      <div class="v4-chart-track"><i class="v4-chart-fill ${className}" style="width:${Math.max(3, Math.min(100, value / max * 100))}%"></i></div>
    </div>`;

  const costChips = costs.map(([label, value, cls]) => `
    <div class="v4-cost-chip ${cls}">
      <span>${label}</span><strong>${euro(value)}</strong>
    </div>`).join('');

  chart.innerHTML = `
    <div class="v4-chart-head">
      <div>
        <div class="v4-chart-kicker">ANALYSE ÉCONOMIQUE</div>
        <div class="v4-chart-title">Répartition économique</div>
        <div class="v4-chart-subtitle">Lecture instantanée du prix, des coûts et de la contribution.</div>
      </div>
      <div class="v4-score-badge"><small>SCORE V4</small><strong>${safeScore}</strong><span>/100</span></div>
    </div>

    <div class="v4-price-card">
      <div><span>Prix de vente</span><strong>${euro(salePrice)}</strong></div>
      <div class="v4-price-line"><i style="width:${Math.max(3, Math.min(100, salePrice / max * 100))}%"></i></div>
    </div>

    <div class="v4-cost-grid">${costChips}</div>

    <div class="v4-contribution-card">
      <div class="v4-contribution-top"><span>Contribution après acquisition</span><strong>${euro(contribution)}</strong></div>
      <div class="v4-contribution-track"><i style="width:${contributionPct}%"></i></div>
      <div class="v4-contribution-meta"><span>${contributionPct.toFixed(1)} % du prix de vente</span><span>Base de décision économique</span></div>
    </div>

    <div class="v4-chart-bars">
      ${bar('Prix de vente', salePrice, 'sale')}
      ${bar('Coût rendu', landedCost, 'cost')}
      ${bar('Frais', variableFees, 'fee')}
      ${bar('CAC', cac, 'cac')}
      ${bar('Contribution', Math.max(0, contribution), 'contribution')}
    </div>

    <div class="v4-chart-footer">
      <div class="v4-metric"><small>MARGE</small><b>${safeMargin.toFixed(1)}%</b><span>Contribution / prix</span></div>
      <div class="v4-metric"><small>SCORE V4</small><b>${safeScore}/100</b><span>Score décisionnel global</span></div>
    </div>
    <div class="v4-chart-note">Le score V4 est un indicateur décisionnel distinct de la marge économique.</div>`;

  if (!document.getElementById('v4-visual-style')) {
    const style = document.createElement('style');
    style.id = 'v4-visual-style';
    style.textContent = `
      .chart{position:relative;overflow:hidden;background:linear-gradient(145deg,#fff 0%,#f8faff 100%);border:1px solid #e4e7ec;border-radius:22px;padding:24px;box-shadow:0 16px 40px rgba(16,24,40,.08)}
      .v4-chart-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:20px}
      .v4-chart-kicker{font-size:10px;letter-spacing:.14em;font-weight:850;color:#667085;margin-bottom:5px}
      .v4-chart-title{font-size:22px;line-height:1.15;font-weight:900;color:#101828}
      .v4-chart-subtitle{font-size:13px;color:#667085;margin-top:5px}
      .v4-score-badge{min-width:76px;text-align:center;background:#101828;color:#fff;border-radius:16px;padding:10px 12px;box-shadow:0 8px 20px rgba(16,24,40,.16)}
      .v4-score-badge small{display:block;font-size:8px;letter-spacing:.12em;opacity:.7;font-weight:800}.v4-score-badge strong{font-size:28px;line-height:1}.v4-score-badge span{font-size:10px;opacity:.65}
      .v4-price-card{background:#101828;color:#fff;border-radius:17px;padding:16px 18px;margin-bottom:14px}.v4-price-card>div:first-child{display:flex;justify-content:space-between;align-items:center;gap:10px}.v4-price-card span{font-size:12px;opacity:.72}.v4-price-card strong{font-size:20px}.v4-price-line{height:7px;background:rgba(255,255,255,.12);border-radius:99px;margin-top:13px;overflow:hidden}.v4-price-line i{display:block;height:100%;background:#fff;border-radius:99px;opacity:.9}
      .v4-cost-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.v4-cost-chip{border:1px solid #e4e7ec;background:#fff;border-radius:14px;padding:12px}.v4-cost-chip span{display:block;font-size:11px;color:#667085;margin-bottom:5px}.v4-cost-chip strong{font-size:15px;color:#101828}.v4-cost-chip.cac{border-color:#f2d3d0}.v4-cost-chip.cac strong{color:#b42318}
      .v4-contribution-card{border:1px solid #d6eadf;background:#f3fbf6;border-radius:17px;padding:15px 17px;margin-bottom:18px}.v4-contribution-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.v4-contribution-top span{font-size:12px;color:#475467;font-weight:700}.v4-contribution-top strong{font-size:19px;color:#067647}.v4-contribution-track{height:11px;background:#dcefe4;border-radius:99px;overflow:hidden;margin-top:11px}.v4-contribution-track i{display:block;height:100%;background:#067647;border-radius:99px;transition:width .25s ease}.v4-contribution-meta{display:flex;justify-content:space-between;gap:10px;margin-top:7px;font-size:10px;color:#667085}
      .v4-chart-bars{padding-top:2px}.v4-chart-row{margin:12px 0}.v4-chart-label{display:flex;justify-content:space-between;gap:16px;font-size:12px;margin-bottom:6px}.v4-chart-label span{color:#475467;font-weight:650}.v4-chart-label b{color:#101828}.v4-chart-track{height:12px;background:#eef2f6;border-radius:999px;overflow:hidden}.v4-chart-fill{display:block;height:100%;border-radius:999px;transition:width .3s ease}.v4-chart-fill.sale{background:#101828}.v4-chart-fill.cost{background:#667085}.v4-chart-fill.fee{background:#98a2b3}.v4-chart-fill.cac{background:#d92d20}.v4-chart-fill.contribution{background:#067647}
      .v4-chart-footer{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid #e4e7ec}.v4-metric{background:#fff;border:1px solid #e4e7ec;border-radius:14px;padding:13px}.v4-metric small{display:block;font-size:9px;letter-spacing:.1em;color:#667085;font-weight:850}.v4-metric b{display:block;font-size:22px;color:#101828;margin:2px 0}.v4-metric span{font-size:10px;color:#667085}.v4-chart-note{margin-top:10px;font-size:10px;line-height:1.4;color:#667085;text-align:center}
      @media(max-width:560px){.chart{padding:18px;border-radius:18px}.v4-chart-head{align-items:center}.v4-chart-title{font-size:19px}.v4-cost-grid{grid-template-columns:1fr}.v4-score-badge{min-width:68px}.v4-contribution-meta{display:block}.v4-contribution-meta span{display:block;margin-top:3px}.v4-chart-footer{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }
}

function runV4DecisionBridge() {
  const salePrice = n('sale');
  const landedCost = ['p', 'c', 'pack', 'ship', 'customs', 'other'].reduce((sum, id) => sum + n(id), 0);
  const variableFees = n('fees');
  const cac = n('cac');
  const targetMargin = n('margin');
  const contribution = salePrice - landedCost - variableFees - cac;
  const margin = salePrice ? (contribution / salePrice) * 100 : 0;

  const offer = { salePrice, landedCost, variableFees, cac, targetMargin, visitors: 1000, conversionRate: 2 };
  const decision = evaluateOpportunity({ demandScore: 50, sourcingScore: 50, profitabilityScore: 0, riskScore: 30, confidence: 50, offer });
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
  panel.innerHTML = `<b>🧠 Decision Engine V4 :</b> ${decision.decision} · économie : ${result?.economics.status ?? '—'} · résilience : ${result?.resilience ?? 0}% · recommandation offre : ${result?.recommendation ?? '—'} · score décision : ${score}/100 · ${decision.reason}`;
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input, textarea, select').forEach((el) => {
    el.addEventListener('input', runV4DecisionBridge);
    el.addEventListener('change', runV4DecisionBridge);
  });
  runV4DecisionBridge();
});
