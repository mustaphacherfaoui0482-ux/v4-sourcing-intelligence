/**
 * V4 Business KPI Control Center presentation layer.
 * No business values are invented: unavailable operational data stays UNKNOWN.
 */

const KPI_DEFINITIONS = Object.freeze([
  ['Revenue', 'CA'],
  ['Orders', 'Commandes'],
  ['AOV', 'Panier moyen'],
  ['CAC', 'Acquisition'],
  ['ROAS', 'Publicité'],
  ['Contribution', 'Après coûts variables'],
  ['Margin', 'Marge'],
  ['Stock', 'Unités disponibles'],
]);

export function renderBusinessKPIControlCenter(root = document) {
  if (!root?.querySelector || root.querySelector('[data-v4-business-kpis]')) return;
  const anchor = root.querySelector('.kpis');
  if (!anchor) return;

  const section = document.createElement('section');
  section.className = 'section';
  section.dataset.v4BusinessKpis = 'true';
  section.innerHTML = `
    <div class="card panel">
      <div class="panelHead">
        <h2>Business Control Center</h2>
        <span class="pbadge">DONNÉES OPÉRATIONNELLES REQUISES</span>
      </div>
      <div class="v4-business-kpis" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${KPI_DEFINITIONS.map(([name, label]) => `
          <div class="card kpi" data-v4-business-kpi="${name}">
            <div class="lab">${label} · ${name}</div>
            <div class="val">—</div>
            <div class="sub">UNKNOWN · source non connectée</div>
          </div>`).join('')}
      </div>
      <div class="diagnostic" style="margin-top:10px">
        Les KPI business ne sont pas alimentés par des données réelles dans cette version. Aucun chiffre de démonstration n'est présenté comme réel.
      </div>
    </div>`;

  anchor.parentNode.insertBefore(section, anchor);
}

function normalizeAlibabaPriceInput(root = document) {
  const input = root.querySelector('[data-alibaba-field="price"]');
  if (!input || input.dataset.v4PriceGuard === 'true') return;
  input.dataset.v4PriceGuard = 'true';
  const normalize = () => {
    const value = String(input.value ?? '').replace(/\s/g, '').replace(',', '.');
    if (value && /^\d+(?:\.\d*)?$/.test(value)) input.value = value;
  };
  input.addEventListener('input', normalize);
  input.addEventListener('blur', normalize);
}

function guardUnknownDashboardValues(root = document) {
  const state = typeof window !== 'undefined' ? window.V4SourcingRuntime : null;
  if (!state?.opportunity) return;

  normalizeAlibabaPriceInput(root);

  const unknownScore = state.opportunity.score == null || state.opportunity.scoreStatus === 'insufficient_data';
  if (unknownScore) {
    const gauge = root.querySelector('.kpis .kpi .gauge');
    if (gauge) {
      gauge.style.background = 'conic-gradient(#24302d 0 360deg)';
      const value = gauge.querySelector('b');
      if (value) value.textContent = '—';
    }
    const scoreSub = root.querySelector('.kpis .kpi .sub');
    if (scoreSub) scoreSub.textContent = 'Données insuffisantes';
    const scoreCell = root.querySelector('.table tbody tr td:nth-child(3)');
    if (scoreCell) scoreCell.textContent = '—';
  }

  const dimensions = state.opportunity.dimensions ?? {};
  const signalValues = [dimensions.potential, dimensions.demand, dimensions.margin, dimensions.risk];
  root.querySelectorAll('.signals .sig span').forEach((node, index) => {
    if (index < 4 && (signalValues[index] == null || !Number.isFinite(Number(signalValues[index])))) {
      node.textContent = 'UNKNOWN';
    }
  });

  const maxCac = state.economics?.maxCacAtTargetMargin;
  if (maxCac == null || !Number.isFinite(Number(maxCac))) {
    const cards = root.querySelectorAll('.kpis .kpi .val');
    if (cards[3]) cards[3].textContent = '—';
  }
}

function scheduleUnknownGuard() {
  if (typeof document === 'undefined') return;
  window.setTimeout(() => guardUnknownDashboardValues(document), 0);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderBusinessKPIControlCenter();
      scheduleUnknownGuard();
    }, { once: true });
  } else {
    renderBusinessKPIControlCenter();
    scheduleUnknownGuard();
  }
  document.addEventListener('v4:alibaba-evidence', scheduleUnknownGuard);
}
