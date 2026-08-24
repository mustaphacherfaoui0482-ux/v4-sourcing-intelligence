import { buildAlibabaOpportunity } from './alibaba-opportunity.js';

const SOURCE = 'Alibaba.com';
const KEY = 'v4-sourcing.alibaba-import.v1';
const ACTIVE_KEY = 'v4-sourcing.active-opportunity.v1';

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || !/^(www\\.)?alibaba\\.com$/i.test(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}

function parseDecimal(value) {
  const raw = String(value ?? '').trim().replace(/\\s/g, '').replace(',', '.');
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function field(label, key, type = 'text', placeholder = '') {
  const inputType = key === 'price' ? 'text' : type;
  const inputMode = key === 'price' ? 'decimal' : '';
  return `<label style="display:grid;gap:5px"><span class="lab">${label}</span><input data-alibaba-field="${key}" type="${inputType}" ${inputMode ? `inputmode="${inputMode}"` : ''} placeholder="${placeholder}" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:7px;background:#0b0f12;color:var(--text)"></label>`;
}

function setField(form, key, value) {
  if (value == null || value === '') return;
  const input = form.querySelector(`[data-alibaba-field="${key}"]`);
  if (input) input.value = String(value);
}

function displayValue(value) {
  return value == null || value === '' ? '—' : String(value);
}

async function fetchAlibabaData(url) {
  try {
    const response = await fetch('/api/alibaba-import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const payload = await response.json();
    return payload?.ok ? payload : { ok: false, error: payload?.error || 'alibaba_import_failed', fetchStatus: payload?.fetchStatus || 'fetch_failed', extractionStatus: payload?.extractionStatus || 'EMPTY', evidenceStatus: payload?.evidenceStatus || 'UNKNOWN', extracted: payload?.extracted || {} };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'alibaba_import_failed', fetchStatus: 'client_fetch_failed', extractionStatus: 'EMPTY', evidenceStatus: 'UNKNOWN', extracted: {} };
  }
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
      <div class="panelHead"><h2>Alibaba — Import assisté</h2><span class="pbadge">SOURCE : ALIBABA.COM</span></div>
      <div class="diagnostic">Collez une URL Alibaba. V4 tente de lire les données explicitement présentes dans la fiche ; si Alibaba bloque la lecture, vous pouvez compléter manuellement. <b>Aucune donnée économique n'est inventée.</b></div>
      <form data-v4-alibaba-form style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px">
        ${field('URL produit *', 'url', 'url', 'https://www.alibaba.com/...')}
        ${field('Produit', 'product', 'text', 'Nom exact visible sur la fiche')}
        ${field('Prix affiché', 'price', 'text', 'Ex. 4,80 ou 4.80')}
        ${field('MOQ', 'moq', 'number', 'Ex. 100')}
        ${field('Fournisseur', 'supplier', 'text', 'Nom visible')}
        ${field('Pays fournisseur', 'country', 'text', 'Ex. China')}
        <div style="grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn primary" type="submit">＋ Importer la fiche Alibaba</button><span class="sub" data-v4-alibaba-status>Statut : aucune donnée importée</span></div>
      </form>
      <div data-v4-alibaba-evidence style="margin-top:12px"></div>
    </div>`;
  anchor.parentNode.insertBefore(section, anchor);

  const form = section.querySelector('[data-v4-alibaba-form]');
  const status = section.querySelector('[data-v4-alibaba-status]');
  const output = section.querySelector('[data-v4-alibaba-evidence]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const value = (key) => form.querySelector(`[data-alibaba-field="${key}"]`)?.value?.trim() || '';
    const rawUrl = value('url');
    const url = normalizeUrl(rawUrl);
    if (!url) {
      status.textContent = rawUrl ? 'Statut : URL Alibaba.com invalide' : 'Statut : URL produit obligatoire';
      output.innerHTML = '<div class="diagnostic">Utilisez l’URL d’une fiche produit <b>Alibaba.com</b>, pas une URL de recherche.</div>';
      return;
    }

    status.textContent = 'Statut : lecture de la fiche Alibaba…';
    output.innerHTML = '<div class="diagnostic">V4 tente de récupérer uniquement les données visibles disponibles dans la réponse de la fiche.</div>';

    const imported = await fetchAlibabaData(url);
    const extracted = imported.extracted || {};
    setField(form, 'product', extracted.product);
    setField(form, 'price', extracted.displayedPrice);
    setField(form, 'moq', extracted.moq);
    setField(form, 'supplier', extracted.supplier);
    setField(form, 'country', extracted.supplierCountry);

    const parsedPrice = parseDecimal(value('price'));
    const rawMoq = value('moq');
    const parsedMoq = rawMoq ? Number(rawMoq) : null;
    const hasManualData = Boolean(value('product') || value('price') || value('moq') || value('supplier') || value('country'));
    const extractedStatus = imported.extractionStatus || 'EMPTY';
    const isAutomaticExtraction = imported.ok && extractedStatus !== 'EMPTY';
    const evidence = Object.freeze({
      source: SOURCE,
      sourceUrl: imported.sourceUrl || url,
      product: value('product') || null,
      displayedPrice: parsedPrice,
      moq: Number.isFinite(parsedMoq) ? parsedMoq : null,
      supplier: value('supplier') || null,
      supplierCountry: value('country') || null,
      capturedAt: new Date().toISOString(),
      evidenceStatus: isAutomaticExtraction ? imported.evidenceStatus : hasManualData ? 'USER_SUPPLIED' : 'INSUFFICIENT',
      fetchStatus: imported.fetchStatus || 'fetch_failed',
      extractionStatus: extractedStatus,
      importError: imported.ok ? null : imported.error,
      confidence: 'UNKNOWN',
    });

    const opportunity = buildAlibabaOpportunity(evidence);

    try {
      localStorage.setItem(KEY, JSON.stringify(evidence));
      if (opportunity) localStorage.setItem(ACTIVE_KEY, JSON.stringify(opportunity));
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {}

    if (!opportunity) {
      const reason = imported.ok && extractedStatus === 'EMPTY'
        ? 'La page Alibaba a été récupérée, mais aucune donnée produit exploitable n’a été extraite.'
        : imported.ok
          ? 'La page Alibaba a été récupérée avec des données partielles, mais aucune identité produit exploitable n’est disponible.'
          : 'Alibaba n’a pas pu être lu automatiquement. Renseignez les données visibles sur la fiche pour poursuivre.';
      output.innerHTML = `<div class="evidence"><span class="pbadge">PAGE : ${imported.ok ? 'RÉCUPÉRÉE' : 'ÉCHEC'}</span><span class="pbadge">EXTRACTION : ${extractedStatus}</span><span class="pbadge">EVIDENCE : ${evidence.evidenceStatus}</span><span class="pbadge">CONFIDENCE : UNKNOWN</span></div><div class="diagnostic" style="margin-top:10px"><b>${reason}</b><br><span class="sub">Aucune opportunité ni donnée économique n’est créée automatiquement dans cet état.</span></div>`;
      status.textContent = imported.ok ? `Statut : page lue · extraction ${extractedStatus.toLowerCase()} · identité produit requise` : 'Statut : lecture automatique indisponible · saisie manuelle possible';
      document.dispatchEvent(new CustomEvent('v4:alibaba-evidence', { detail: { evidence, opportunity: null } }));
      return;
    }

    const importLabel = isAutomaticExtraction ? 'Données Alibaba extraites' : 'Données saisies manuellement';
    output.innerHTML = `<div class="evidence"><span class="pbadge">PAGE : RÉCUPÉRÉE</span><span class="pbadge">EXTRACTION : ${extractedStatus}</span><span class="pbadge">OPPORTUNITY : P1</span><span class="pbadge">SOURCE : ALIBABA.COM</span><span class="pbadge">CONFIDENCE : UNKNOWN</span></div><div class="diagnostic" style="margin-top:10px"><b>${importLabel}</b><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px"><div><b>Produit</b><br>${displayValue(evidence.product)}</div><div><b>Prix affiché</b><br>${displayValue(evidence.displayedPrice)}</div><div><b>MOQ</b><br>${displayValue(evidence.moq)}</div><div><b>Fournisseur</b><br>${displayValue(evidence.supplier)}</div><div><b>Pays fournisseur</b><br>${displayValue(evidence.supplierCountry)}</div><div><b>Preuve</b><br>${displayValue(evidence.evidenceStatus)}</div></div><br><span class="sub">Opportunité P1 enregistrée. Les valeurs économiques manquantes restent inconnues.</span></div>`;
    status.textContent = isAutomaticExtraction ? `Statut : import Alibaba terminé · extraction ${extractedStatus.toLowerCase()} · opportunité V4 P1` : 'Statut : opportunité V4 P1 créée depuis les données saisies';
    document.dispatchEvent(new CustomEvent('v4:alibaba-evidence', { detail: { evidence, opportunity } }));
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => renderAlibabaImport(), { once: true });
  else renderAlibabaImport();
}
