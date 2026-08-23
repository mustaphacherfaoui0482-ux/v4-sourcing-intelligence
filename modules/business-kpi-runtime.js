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

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => renderBusinessKPIControlCenter(), { once: true });
  else renderBusinessKPIControlCenter();
}
