// V4 UI Decision Bridge v6 — Control Center Premium
// Deterministic UI: no invented external data. Evidence scores remain user-entered.
import { evaluateOpportunity } from './decision-engine.js';

const n = (id) => Number(document.getElementById(id)?.value) || 0;
const euro = (value) => Number(value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

function ensureEvidenceInputs() {
  if (document.getElementById('v4-evidence-inputs')) return;
  const anchor = document.querySelector('section.card:nth-of-type(3)');
  if (!anchor) return;
  const section = document.createElement('section');
  section.className = 'card';
  section.id = 'v4-evidence-inputs';
  section.innerHTML = `
    <h2>🧾 Évidence & confiance</h2>
    <p class="muted">Ces scores ne sont pas générés artificiellement : saisis uniquement une valeur justifiée par tes recherches. 0 = inconnu, 100 = très solide.</p>
    <div class="grid">
      <div><label>Demande / intérêt (0–100)</label><input id="demandScore" type="number" min="0" max="100" value="0"></div>
      <div><label>Qualité sourcing (0–100)</label><input id="sourcingScore" type="number" min="0" max="100" value="0"></div>
      <div><label>Risque (0–100)</label><input id="riskScore" type="number" min="0" max="100" value="0"></div>
      <div><label>Confiance des données (0–100)</label><input id="confidenceScore" type="number" min="0" max="100" value="0"></div>
    </div>
    <div id="v4-evidence-status" class="status warning"><b>Statut :</b> données externes non renseignées — décision prudente.</div>`;
  anchor.insertAdjacentElement('afterend', section);

  const style = document.createElement('style');
  style.textContent = '#v4-evidence-inputs input{margin-bottom:4px}#v4-evidence-inputs .status{margin-top:8px}';
  document.head.appendChild(style);
}

function renderEconomicChart(salePrice, landedCost, variableFees, cac, contribution, margin, score) {
  const chart = document.querySelector('.chart');
  if (!chart) return;
  const costs = [['Coût rendu', landedCost, 'cost'], ['Frais', variableFees, 'fee'], ['CAC', cac, 'cac']];
  const max = Math.max(salePrice, landedCost, variableFees, cac, contribution, 1);
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const safeMargin = Number.isFinite(margin) ? margin : 0;
  const contributionPct = salePrice ? Math.max(0, Math.min(100, contribution / salePrice * 100)) : 0;
  const bar = (label, value, className) => `<div class="v4-chart-row"><div class="v4-chart-label"><span>${label}</span><b>${euro(value)}</b></div><div class="v4-chart-track"><i class="v4-chart-fill ${className}" style="width:${Math.max(3, Math.min(100, value / max * 100))}%"></i></div></div>`;
  const costChips = costs.map(([label, value, cls]) => `<div class="v4-cost-chip ${cls}"><span>${label}</span><strong>${euro(value)}</strong></div>`).join('');
  chart.innerHTML = `<div class="v4-chart-head"><div><div class="v4-chart-kicker">ANALYSE ÉCONOMIQUE</div><div class="v4-chart-title">Répartition économique</div><div class="v4-chart-subtitle">Lecture instantanée du prix, des coûts et de la contribution.</div></div><div class="v4-score-badge"><small>SCORE V4</small><strong>${safeScore}</strong><span>/100</span></div></div><div class="v4-price-card"><div><span>Prix de vente</span><strong>${euro(salePrice)}</strong></div><div class="v4-price-line"><i style="width:${Math.max(3, Math.min(100, salePrice / max * 100))}%"></i></div></div><div class="v4-cost-grid">${costChips}</div><div class="v4-contribution-card"><div class="v4-contribution-top"><span>Contribution après acquisition</span><strong>${euro(contribution)}</strong></div><div class="v4-contribution-track"><i style="width:${contributionPct}%"></i></div><div class="v4-contribution-meta"><span>${contributionPct.toFixed(1)} % du prix de vente</span><span>Base de décision économique</span></div></div><div class="v4-chart-bars">${bar('Prix de vente', salePrice, 'sale')}${bar('Coût rendu', landedCost, 'cost')}${bar('Frais', variableFees, 'fee')}${bar('CAC', cac, 'cac')}${bar('Contribution', Math.max(0, contribution), 'contribution')}</div><div class="v4-chart-footer"><div class="v4-metric"><small>MARGE</small><b>${safeMargin.toFixed(1)}%</b><span>Contribution / prix</span></div><div class="v4-metric"><small>SCORE V4</small><b>${safeScore}/100</b><span>Score décisionnel global</span></div></div><div class="v4-chart-note">Le score V4 combine économie, demande, sourcing, risque et confiance. Aucun score externe n'est inventé.</div>`;

  if (!document.getElementById('v4-visual-style')) {
    const style = document.createElement('style'); style.id = 'v4-visual-style'; style.textContent = `.chart{position:relative;overflow:hidden;background:linear-gradient(145deg,#fff 0%,#f8faff 100%);border:1px solid #e4e7ec;border-radius:22px;padding:24px;box-shadow:0 16px 40px rgba(16,24,40,.08)}.v4-chart-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:20px}.v4-chart-kicker{font-size:10px;letter-spacing:.14em;font-weight:850;color:#667085;margin-bottom:5px}.v4-chart-title{font-size:22px;line-height:1.15;font-weight:900;color:#101828}.v4-chart-subtitle{font-size:13px;color:#667085;margin-top:5px}.v4-score-badge{min-width:76px;text-align:center;background:#101828;color:#fff;border-radius:16px;padding:10px 12px}.v4-score-badge small{display:block;font-size:8px;letter-spacing:.12em;opacity:.7;font-weight:800}.v4-score-badge strong{font-size:28px;line-height:1}.v4-score-badge span{font-size:10px;opacity:.65}.v4-price-card{background:#101828;color:#fff;border-radius:17px;padding:16px 18px;margin-bottom:14px}.v4-price-card>div:first-child{display:flex;justify-content:space-between;align-items:center}.v4-price-card span{font-size:12px;opacity:.72}.v4-price-card strong{font-size:20px}.v4-price-line{height:7px;background:rgba(255,255,255,.12);border-radius:99px;margin-top:13px;overflow:hidden}.v4-price-line i{display:block;height:100%;background:#fff;border-radius:99px}.v4-cost-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.v4-cost-chip{border:1px solid #e4e7ec;background:#fff;border-radius:14px;padding:12px}.v4-cost-chip span{display:block;font-size:11px;color:#667085;margin-bottom:5px}.v4-cost-chip strong{font-size:15px;color:#101828}.v4-cost-chip.cac{border-color:#f2d3d0}.v4-cost-chip.cac strong{color:#b42318}.v4-contribution-card{border:1px solid #d6eadf;background:#f3fbf6;border-radius:17px;padding:15px 17px;margin-bottom:18px}.v4-contribution-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.v4-contribution-top span{font-size:12px;color:#475467;font-weight:700}.v4-contribution-top strong{font-size:19px;color:#067647}.v4-contribution-track{height:11px;background:#dcefe4;border-radius:99px;overflow:hidden;margin-top:11px}.v4-contribution-track i{display:block;height:100%;background:#067647;border-radius:99px}.v4-contribution-meta{display:flex;justify-content:space-between;gap:10px;margin-top:7px;font-size:10px;color:#667085}.v4-chart-row{margin:12px 0}.v4-chart-label{display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px}.v4-chart-label span{color:#475467;font-weight:650}.v4-chart-label b{color:#101828}.v4-chart-track{height:12px;background:#eef2f6;border-radius:999px;overflow:hidden}.v4-chart-fill{display:block;height:100%;border-radius:999px}.v4-chart-fill.sale{background:#101828}.v4-chart-fill.cost{background:#667085}.v4-chart-fill.fee{background:#98a2b3}.v4-chart-fill.cac{background:#d92d20}.v4-chart-fill.contribution{background:#067647}.v4-chart-footer{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid #e4e7ec}.v4-metric{background:#fff;border:1px solid #e4e7ec;border-radius:14px;padding:13px}.v4-metric small{display:block;font-size:9px;letter-spacing:.1em;color:#667085;font-weight:850}.v4-metric b{display:block;font-size:22px;color:#101828;margin:2px 0}.v4-metric span{font-size:10px;color:#667085}.v4-chart-note{margin-top:10px;font-size:10px;color:#667085;text-align:center}@media(max-width:560px){.v4-cost-grid{grid-template-columns:1fr}.v4-chart-footer{grid-template-columns:1fr 1fr}}`; document.head.appendChild(style);
  }
}

function applyPremiumShell() {
  if (document.getElementById('v4-premium-shell-style')) return;
  const style = document.createElement('style');
  style.id = 'v4-premium-shell-style';
  style.textContent = `
    :root{--v4-bg:#f4f6f8;--v4-surface:#fff;--v4-ink:#101828;--v4-muted:#667085;--v4-line:#e4e7ec;--v4-accent:#1d2939;--v4-focus:#475467;--v4-good:#067647;--v4-warn:#b54708;--v4-bad:#b42318}
    html{background:var(--v4-bg);scroll-behavior:smooth}
    body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--v4-bg);color:var(--v4-ink);letter-spacing:-.01em}
    header{position:sticky;top:0;z-index:20;padding:18px 20px;background:rgba(16,24,40,.96);backdrop-filter:blur(14px);box-shadow:0 8px 30px rgba(16,24,40,.12)}
    header h1{font-size:clamp(22px,3.2vw,32px);letter-spacing:-.035em} header p{font-size:12px;color:#d0d5dd}
    main{max-width:1240px;margin:20px auto;padding:0 16px}
    .card{background:rgba(255,255,255,.96);border:1px solid var(--v4-line);border-radius:16px;padding:20px;margin-bottom:14px;box-shadow:0 8px 26px rgba(16,24,40,.055)}
    .card h2{font-size:16px;letter-spacing:-.02em;margin:0 0 14px}.muted,small{color:var(--v4-muted)}
    .metrics{gap:10px}.metric{border:1px solid var(--v4-line);border-radius:13px;background:#fbfcfd;padding:14px}.metric span{font-size:11px}.metric b{font-size:22px;letter-spacing:-.03em}
    #v4-engine-decision{border:1px solid #d0d5dd;border-left:4px solid var(--v4-good);background:#f7faf8;padding:18px;border-radius:14px;font-size:16px;line-height:1.5}
    #v4-engine-decision b{font-size:12px;letter-spacing:.08em;text-transform:uppercase}
    section.card:has(#v4-engine-decision){border:1px solid #d0d5dd;background:linear-gradient(145deg,#fff 0%,#f7f9fb 100%);box-shadow:0 14px 34px rgba(16,24,40,.09);padding:22px}
    section.card:has(#v4-engine-decision) h2{font-size:20px}
    input,textarea,select{border-color:#d0d5dd;border-radius:9px;background:#fff;transition:border-color .15s,box-shadow .15s}input:focus,textarea:focus,select:focus{outline:0;border-color:#475467;box-shadow:0 0 0 3px rgba(71,84,103,.10)}
    button{border-radius:9px;background:#101828;box-shadow:0 3px 8px rgba(16,24,40,.14);transition:transform .15s,opacity .15s}button:hover{opacity:.94;transform:translateY(-1px)}
    .badge,.check{background:#f2f4f7;color:#344054;border:1px solid #e4e7ec;font-size:11px}
    .source,.pipeline-step,.offer{border-radius:12px;background:#fff;border-color:#e4e7ec}
    .source{min-height:150px}.source h3{font-size:14px}.pipeline-step{font-size:12px;font-weight:750;text-align:center;padding:12px}
    .status{border-radius:11px;background:#f8fafc}.danger{border-left-color:var(--v4-bad)}.positive{border-left-color:var(--v4-good)}.warning{border-left-color:var(--v4-warn)}
    .score{font-size:clamp(42px,7vw,64px);line-height:1;font-weight:900;letter-spacing:-.055em;color:#101828}
    .chart{box-shadow:0 14px 34px rgba(16,24,40,.07)}
    @media(max-width:700px){header{position:relative;padding:16px}main{margin:12px auto;padding:0 10px}.card{padding:15px;border-radius:14px}.metrics{grid-template-columns:repeat(2,1fr)!important}.metric b{font-size:20px}.source{min-height:auto}.pipeline{grid-template-columns:repeat(2,1fr)!important}section.card:has(#v4-engine-decision){padding:17px}#v4-engine-decision{font-size:15px}.v4-chart-head{gap:10px}.v4-chart-title{font-size:19px}.v4-score-badge{min-width:68px}}
    @media(max-width:420px){.metrics,.grid,.radar,.checks,.pipeline{grid-template-columns:1fr!important}.v4-chart-footer{grid-template-columns:1fr!important}.v4-contribution-top{align-items:flex-start;flex-direction:column}.v4-contribution-meta{flex-direction:column;gap:3px}}
  `;
  document.head.appendChild(style);
}

function runV4DecisionBridge() {
  ensureEvidenceInputs();
  applyPremiumShell();
  const salePrice = n('sale');
  const landedCost = ['p','c','pack','ship','customs','other'].reduce((sum,id) => sum + n(id), 0);
  const variableFees = n('fees'); const cac = n('cac'); const targetMargin = n('margin');
  const contribution = salePrice - landedCost - variableFees - cac;
  const margin = salePrice ? (contribution / salePrice) * 100 : 0;
  const demandScore = Math.max(0, Math.min(100, n('demandScore')));
  const sourcingScore = Math.max(0, Math.min(100, n('sourcingScore')));
  const riskScore = Math.max(0, Math.min(100, n('riskScore')));
  const confidence = Math.max(0, Math.min(100, n('confidenceScore')));
  const offer = { salePrice, landedCost, variableFees, cac, targetMargin, visitors: 1000, conversionRate: 2 };
  const decision = evaluateOpportunity({ demandScore, sourcingScore, riskScore, confidence, offer });
  const score = decision.score || 0;
  renderEconomicChart(salePrice, landedCost, variableFees, cac, contribution, margin, score);

  const status = document.getElementById('v4-evidence-status');
  if (status) status.innerHTML = confidence < 40 ? '<b>Statut :</b> confiance insuffisante → le moteur impose ATTENDRE.' : `<b>Statut :</b> données renseignées · confiance ${confidence}/100 · risque ${riskScore}/100.`;
  const panel = document.getElementById('v4-engine-decision');
  if (panel) { panel.className = `status ${decision.decision === 'EVITER' ? 'danger' : decision.decision === 'ATTENDRE' ? 'warning' : 'positive'}`; panel.innerHTML = `<b>🧠 Decision Engine V4 :</b> ${decision.decision} · économie : ${decision.offer?.economics.status ?? '—'} · résilience : ${decision.offer?.resilience ?? 0}% · score : ${score}/100 · ${decision.reason}`; }
  const scoreEl = document.getElementById('score'); if (scoreEl) scoreEl.innerHTML = `<div class="score">${score}/100</div><p>${decision.decision === 'TESTER' ? '🟢 TESTER' : decision.decision === 'ATTENDRE' ? '🟠 ATTENDRE' : decision.decision === 'APPROFONDIR' ? '🟠 APPROFONDIR' : '🔴 ÉVITER'}</p>`;
  const topDecision = document.getElementById('decision'); if (topDecision) topDecision.textContent = decision.decision;
  const scoreBar = document.getElementById('scoreBar'); if (scoreBar) scoreBar.style.width = `${score}%`;
  const marginBar = document.getElementById('marginBar'); if (marginBar) marginBar.style.width = `${Math.min(100, Math.max(0, margin))}%`;
}

window.addEventListener('DOMContentLoaded', () => {
  ensureEvidenceInputs();
  applyPremiumShell();
  document.querySelectorAll('input, textarea, select').forEach((el) => { el.addEventListener('input', runV4DecisionBridge); el.addEventListener('change', runV4DecisionBridge); });
  runV4DecisionBridge();
});
