import { calculateOfferEconomics } from './v4-offer-economics-engine.js';

const ACTIVE_KEY = 'v4-sourcing.active-opportunity.v1';

const SCORE_FIELDS = ['demandScore', 'marketingScore', 'sourcingScore', 'profitabilityScore', 'riskScore', 'confidence'];
const OFFER_FIELDS = ['salePrice', 'landedCost', 'variableFees', 'cac'];
const OPTIONAL_FIELDS = ['easeOfTest', 'availability', 'landedCostScore', 'potential'];

const clampScore = (value) => {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
};

const numberOrNull = (value) => {
  if (value === '' || value == null) return null;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export function completeManualOpportunity(opportunity, values = {}) {
  if (!opportunity || typeof opportunity !== 'object') return null;
  const next = JSON.parse(JSON.stringify(opportunity));
  next.offer = { ...(next.offer || {}) };

  for (const key of OFFER_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(values, key)) next.offer[key] = numberOrNull(values[key]);
  }
  if (Object.prototype.hasOwnProperty.call(values, 'targetMargin')) {
    const margin = numberOrNull(values.targetMargin);
    next.offer.targetMargin = margin ?? 30;
  }

  if (Object.prototype.hasOwnProperty.call(values, 'supplier')) {
    next.evidence = { ...(next.evidence || {}), supplier: String(values.supplier || '').trim() || null };
  }
  if (Object.prototype.hasOwnProperty.call(values, 'moq')) {
    const moq = numberOrNull(values.moq);
    next.evidence = { ...(next.evidence || {}), moq };
  }
  if (Object.prototype.hasOwnProperty.call(values, 'country')) {
    const country = String(values.country || '').trim();
    next.country = country || '—';
    next.evidence = { ...(next.evidence || {}), supplierCountry: country || null };
  }

  for (const key of SCORE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(values, key)) next[key] = clampScore(values[key]);
  }
  for (const key of OPTIONAL_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(values, key)) next[key] = clampScore(values[key]);
  }

  const economics = calculateOfferEconomics(next.offer);
  if (next.potential == null) {
    const signals = [next.demandScore, next.marketingScore, next.sourcingScore, next.profitabilityScore];
    if (signals.every((v) => Number.isFinite(v))) next.potential = Math.round(signals.reduce((a, b) => a + b, 0) / signals.length);
  }
  next.completionStatus = economics.status === 'insufficient_data' || SCORE_FIELDS.some((key) => next[key] == null) ? 'INCOMPLETE' : 'READY_FOR_DECISION';
  next.isDemo = false;
  return Object.freeze(next);
}

function field(label, key, value, options = {}) {
  const type = options.type || 'number';
  const step = options.step || 'any';
  const min = options.min == null ? '' : ` min="${options.min}"`;
  const max = options.max == null ? '' : ` max="${options.max}"`;
  const placeholder = options.placeholder || '';
  return `<label style="display:grid;gap:4px"><span class="lab">${label}</span><input data-v4-completion="${key}" type="${type}" step="${step}"${min}${max} value="${value == null ? '' : String(value)}" placeholder="${placeholder}" style="width:100%;padding:8px 9px;border:1px solid var(--line);border-radius:7px;background:#0b0f12;color:var(--text)"></label>`;
}

function render(root, opportunity) {
  root.querySelector('[data-v4-completion-panel]')?.remove();
  const section = document.createElement('section');
  section.className = 'section';
  section.dataset.v4CompletionPanel = 'true';
  section.innerHTML = `<div class="card panel"><div class="panelHead"><h2>Complétion V4</h2><span class="pbadge">DONNÉES MANQUANTES UNIQUEMENT</span></div><div class="diagnostic">Complétez uniquement les informations que les sources ne fournissent pas. V4 ne transforme jamais une donnée inconnue en zéro.</div><form data-v4-completion-form style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px">
    ${field('Fournisseur','supplier',opportunity.evidence?.supplier,{type:'text',placeholder:'Nom fournisseur'})}
    ${field('MOQ / quantité minimale','moq',opportunity.evidence?.moq,{placeholder:'Ex. 100',min:0})}
    ${field('Prix de vente envisagé','salePrice',opportunity.offer?.salePrice,{placeholder:'Ex. 29.90',min:0})}
    ${field('Coût rendu','landedCost',opportunity.offer?.landedCost,{placeholder:'Ex. 9.50',min:0})}
    ${field('Frais variables / commande','variableFees',opportunity.offer?.variableFees,{placeholder:'Ex. 1.20',min:0})}
    ${field('CAC','cac',opportunity.offer?.cac,{placeholder:'Ex. 6.00',min:0})}
    ${field('Demande','demandScore',opportunity.demandScore,{min:0,max:100,placeholder:'0–100'})}
    ${field('Marketing','marketingScore',opportunity.marketingScore,{min:0,max:100,placeholder:'0–100'})}
    ${field('Sourcing','sourcingScore',opportunity.sourcingScore,{min:0,max:100,placeholder:'0–100'})}
    ${field('Profitabilité','profitabilityScore',opportunity.profitabilityScore,{min:0,max:100,placeholder:'0–100'})}
    ${field('Risque','riskScore',opportunity.riskScore,{min:0,max:100,placeholder:'0–100'})}
    ${field('Confiance','confidence',opportunity.confidence,{min:0,max:100,placeholder:'0–100'})}
    <div style="grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn primary" type="submit">Analyser avec V4</button><span class="sub" data-v4-completion-status>Complétion requise pour une décision</span></div>
  </form></div>`;
  const anchor = root.querySelector('[data-v4-alibaba-import]') || root.querySelector('.kpis');
  if (anchor) anchor.parentNode.insertBefore(section, anchor.nextSibling);

  const form = section.querySelector('[data-v4-completion-form]');
  const status = section.querySelector('[data-v4-completion-status]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = {};
    form.querySelectorAll('[data-v4-completion]').forEach((input) => { values[input.dataset.v4Completion] = input.value.trim(); });
    const next = completeManualOpportunity(opportunity, values);
    if (!next) return;
    try { localStorage.setItem(ACTIVE_KEY, JSON.stringify(next)); } catch {}
    status.textContent = next.completionStatus === 'READY_FOR_DECISION' ? 'Données complètes — décision V4 calculée' : 'Données encore insuffisantes — V4 reste en ATTENDRE';
    document.dispatchEvent(new CustomEvent('v4:manual-completion', { detail: { opportunity: next } }));
  });
}

export function mountManualCompletion(opportunity) {
  if (typeof document === 'undefined' || !opportunity || opportunity.product === 'Aucune opportunité active') return;
  render(document, opportunity);
}
