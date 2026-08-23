import { buildAlibabaOpportunity } from './alibaba-opportunity.js';

/**
 * Alibaba assisted import.
 * No scraping, no fabricated values, no automatic scoring.
 * User-provided fields become source evidence only after explicit import.
 */

const SOURCE = 'Alibaba.com';
const KEY = 'v4-sourcing.alibaba-import.v1';
const ACTIVE_KEY = 'v4-sourcing.active-opportunity.v1';

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (!/^(www\.)?alibaba\.com$/i.test(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function field(label, key, type = 'text', placeholder = '') {
  return `<label style="display:grid;gap:5px"><span class="lab">${label}</span><input data-alibaba-field="${key}" type="${type}" placeholder="${placeholder}" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:7px;background:#0b0f12;color:var(--text)"></label>`;
}

export function renderAlibabaImport(root = document) {
  if (!root?.querySelector || root.querySelector('[data-v4-alibaba-import]')) return;
  const anchor = root.querySelector('.kpis');
  if (!anchor) return;

  const section = document.createElement('section');
  section.className = 'section';
  section.dataset.v4AlibabaImport = 'true';
  section.innerHTML = `
    <div class="card panel">
      <div class="panelHead">
        <h2>Alibaba — Import assisté</h2>
        <span class="pbadge">SOURCE : ALIBABA.COM</span>
      </div>
      <div class="diagnostic">Collez une URL Alibaba et renseignez uniquement les données visibles sur la fiche. V4 les conserve comme <b>evidence</b> ; aucune donnée n'est inventée et aucun score n'est calculé à partir de champs non renseignés.</div>
      <form data-v4-alibaba-form style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px">
        ${field('URL produit *', 'url', 'url', 'https://www.alibaba.com/...')}
        ${field('Produit', 'product', 'text', 'Nom exact visible sur la fiche')}
        ${field('Prix affiché', 'price', 'number', 'Ex. 4.80')} 
        ${field('MOQ', 'moq', 'number', 'Ex. 100')}
        ${field('Fournisseur', 'supplier', 'text', 'Nom visible')}
        ${field('Pays fournisseur', 'country', 'text', 'Ex. China')}
        <div style="grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="btn primary" type="submit">＋ Ajouter l'evidence Alibaba</button>
          <span class="sub" data-v4-alibaba-status>Statut : aucune donnée importée</span>
        </div>
      </form>
      <div data-v4-alibaba-evidence style="margin-top:12px"></div>
    </div>`;

  anchor.parentNode.insertBefore(section, anchor);

  const form = section.querySelector('[data-v4-alibaba-form]');
  const status = section.querySelector('[data-v4-alibaba-status]');
  const output = section.querySelector('[data-v4-alibaba-evidence]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = (key) => form.querySelector(`[data-alibaba-field="${key}"]`)?.value?.trim() || '';
    const url = normalizeUrl(value('url'));
    if (!url) {
      status.textContent = 'Statut : URL Alibaba.com invalide';
      return;
    }

    const evidence = Object.freeze({
      source: SOURCE,
      sourceUrl: url,
      product: value('product') || null,
      displayedPrice: value('price') ? Number(value('price')) : null,
      moq: value('moq') ? Number(value('moq')) : null,
      supplier: value('supplier') || null,
      supplierCountry: value('country') || null,
      capturedAt: new Date().toISOString(),
      evidenceStatus: 'USER_SUPPLIED',
      confidence: 'UNKNOWN',
    });

    const opportunity = buildAlibabaOpportunity(evidence);
    try {
      localStorage.setItem(KEY, JSON.stringify(evidence));
      if (opportunity) localStorage.setItem(ACTIVE_KEY, JSON.stringify(opportunity));
    } catch {}

    output.innerHTML = `<div class="evidence"><span class="pbadge">EVIDENCE</span><span class="pbadge">OPPORTUNITY : P1</span><span class="pbadge">SOURCE : ALIBABA.COM</span><span class="pbadge">CONFIDENCE : UNKNOWN</span></div><div class="diagnostic" style="margin-top:10px">${evidence.product || 'Produit non renseigné'} · Prix : ${evidence.displayedPrice ?? '—'} · MOQ : ${evidence.moq ?? '—'} · Fournisseur : ${evidence.supplier || '—'}<br><span class="sub">La fiche est maintenant enregistrée comme opportunité V4 P1. Les valeurs économiques manquantes restent inconnues et aucun score n'est calculé à partir d'elles.</span></div>`;
    status.textContent = 'Statut : evidence Alibaba → opportunité V4 enregistrée';
    document.dispatchEvent(new CustomEvent('v4:alibaba-evidence', { detail: { evidence, opportunity } }));
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => renderAlibabaImport(), { once: true });
  else renderAlibabaImport();
}
