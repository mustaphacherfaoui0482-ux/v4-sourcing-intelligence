import { buildAlibabaOpportunity } from './alibaba-opportunity.js';

const SOURCE = 'Alibaba.com';
const KEY = 'v4-sourcing.alibaba-import.v1';
const ACTIVE_KEY = 'v4-sourcing.active-opportunity.v1';
const BATCH_KEY = 'v4-sourcing.alibaba-csv-batch.v1';

function unwrapUrl(value) {
  const raw = String(value || '').trim();
  const markdown = raw.match(/^\[.*?\]\((https?:\/\/[^)]+)\)$/s);
  return markdown ? markdown[1] : raw;
}

function normalizeUrl(value) {
  try {
    const cleaned = unwrapUrl(value).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    const url = new URL(cleaned);
    const hostname = url.hostname.toLowerCase();
    const validHost = hostname === 'alibaba.com' || hostname.endsWith('.alibaba.com');
    if (url.protocol !== 'https:' || !validHost) return null;
    return url.href;
  } catch { return null; }
}

function parseDecimal(value) {
  const raw = String(value ?? '').trim().replace(/\s/g, '').replace(/[$€£]/g, '').replace(',', '.');
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function csvRows(text) {
  const input = String(text ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (quoted) throw new Error('CSV invalide : guillemet non fermé');
  if (cell !== '' || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows.filter((r) => r.some((v) => String(v).trim() !== ''));
}

export function parseBrightDataCsv(text) {
  const rows = csvRows(text);
  if (rows.length < 2) throw new Error('CSV vide ou sans ligne produit');
  const headers = rows[0].map((h) => String(h).trim());
  const required = ['url', 'item_id', 'title', 'price', 'store_name'];
  const missing = required.filter((key) => !headers.includes(key));
  if (missing.length) throw new Error(`Colonnes Bright Data manquantes : ${missing.join(', ')}`);
  return rows.slice(1).map((values, index) => {
    const row = Object.fromEntries(headers.map((key, i) => [key, values[i] ?? '']));
    row._row = index + 2;
    return row;
  });
}

function csvRowToEvidence(row) {
  const sourceUrl = normalizeUrl(row.url);
  if (!sourceUrl) return null;
  const price = parseDecimal(row.price);
  const variantAttributes = row.variant_attributes || null;
  return Object.freeze({
    source: SOURCE,
    sourceUrl,
    product: String(row.title || '').trim() || null,
    displayedPrice: price,
    moq: parseDecimal(row.moq),
    supplier: String(row.store_name || '').trim() || null,
    supplierCountry: String(row.store_country || '').trim() || null,
    itemId: String(row.item_id || '').trim() || null,
    variantId: String(row.variant_id || '').trim() || null,
    brand: String(row.brand || '').trim() || null,
    availability: String(row.availability || '').trim() || null,
    category: String(row.product_category || '').trim() || null,
    variantAttributes,
    capturedAt: new Date().toISOString(),
    evidenceStatus: 'BRIGHT_DATA_CSV',
    fetchStatus: 'CSV_IMPORT',
    extractionStatus: 'CSV',
    importError: null,
    confidence: 'UNKNOWN',
  });
}

export function mapBrightDataCsv(text) {
  const rows = parseBrightDataCsv(text);
  const imported = rows.map((row) => ({ row, evidence: csvRowToEvidence(row) })).filter((item) => item.evidence);
  return {
    totalRows: rows.length,
    importedRows: imported.length,
    rejectedRows: rows.length - imported.length,
    items: imported,
  };
}

function field(label, key, type = 'text', placeholder = '') {
  const inputType = key === 'price' ? 'text' : type;
  const inputMode = key === 'price' ? 'decimal' : '';
  return `<label style="display:grid;gap:5px"><span class="lab">${label}</span><input data-alibaba-field="${key}" type="${inputType}" ${inputMode ? `inputmode="${inputMode}"` : ''} placeholder="${placeholder}" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:7px;background:#0b0f12;color:var(--text)"></label>`;
}

function setField(form, key, value) {
  const input = form.querySelector(`[data-alibaba-field="${key}"]`);
  if (!input) return;
  input.value = value == null || value === '' ? '' : String(value);
}

function displayValue(value) {
  return value == null || value === '' ? '—' : String(value);
}

function renderExtractedData(evidence, imported, output, opportunity) {
  const extractedStatus = imported.extractionStatus || 'EMPTY';
  const automatic = imported.ok && extractedStatus !== 'EMPTY';
  const label = automatic ? 'Données récupérées depuis Alibaba' : opportunity ? 'Données saisies manuellement' : 'Résultat de récupération';
  const diag = imported.readerDiagnostics;
  const diagText = diag?.error
    ? `Reader : ${displayValue(diag.error)}`
    : diag
      ? `Reader : ${displayValue(diag.acquisition || 'utilisé')} · ${displayValue(diag.parserStatus || 'UNKNOWN')} · contenu ${displayValue(diag.responseBytes)} octets`
      : 'Reader : non utilisé';
  output.innerHTML = `<div class="evidence"><span class="pbadge">PAGE : ${imported.ok ? 'RÉCUPÉRÉE' : 'ÉCHEC'}</span><span class="pbadge">EXTRACTION : ${extractedStatus}</span>${opportunity ? '<span class="pbadge">OPPORTUNITY : P1</span>' : ''}<span class="pbadge">SOURCE : ALIBABA.COM</span><span class="pbadge">CONFIDENCE : UNKNOWN</span></div><div class="diagnostic" style="margin-top:10px"><b>${label}</b><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px"><div><b>Produit</b><br>${displayValue(evidence.product)}</div><div><b>Prix affiché</b><br>${displayValue(evidence.displayedPrice)}</div><div><b>MOQ</b><br>${displayValue(evidence.moq)}</div><div><b>Fournisseur</b><br>${displayValue(evidence.supplier)}</div><div><b>Pays fournisseur</b><br>${displayValue(evidence.supplierCountry)}</div><div><b>Preuve</b><br>${displayValue(evidence.evidenceStatus)}</div></div><br><span class="sub">${opportunity ? 'Opportunité P1 enregistrée. Les valeurs économiques manquantes restent inconnues.' : imported.ok ? 'La page a été récupérée. Les champs absents restent inconnus et ne sont pas inventés.' : 'La récupération automatique a échoué. Les champs peuvent être complétés manuellement.'}</span><br><span class="sub" style="opacity:.75">${diagText}</span></div>`;
}

async function fetchAlibabaData(url) {
  try {
    const response = await fetch('/api/alibaba-import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const payload = await response.json();
    return payload?.ok ? payload : { ok: false, error: payload?.error || 'alibaba_import_failed', fetchStatus: payload?.fetchStatus || 'fetch_failed', extractionStatus: payload?.extractionStatus || 'EMPTY', evidenceStatus: payload?.evidenceStatus || 'UNKNOWN', extracted: payload?.extracted || {}, readerDiagnostics: payload?.readerDiagnostics || null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'alibaba_import_failed', fetchStatus: 'client_fetch_failed', extractionStatus: 'EMPTY', evidenceStatus: 'UNKNOWN', extracted: {}, readerDiagnostics: null };
  }
}

function renderCsvSummary(output, result) {
  output.innerHTML = `<div class="evidence"><span class="pbadge">CSV : RÉCUPÉRÉ</span><span class="pbadge">LIGNES : ${result.totalRows}</span><span class="pbadge">IMPORTÉES : ${result.importedRows}</span><span class="pbadge">REJETÉES : ${result.rejectedRows}</span><span class="pbadge">PREUVE : BRIGHT_DATA_CSV</span><span class="pbadge">CONFIDENCE : UNKNOWN</span></div><div class="diagnostic" style="margin-top:10px"><b>Import Bright Data terminé</b><br><span class="sub">${result.importedRows} produit(s) converti(s) en données V4. Les champs absents restent inconnus.</span></div>`;
}

function importCsvBatch(file, form, status, output) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const result = mapBrightDataCsv(reader.result);
      if (!result.importedRows) throw new Error('Aucun produit Alibaba exploitable dans le CSV');
      const opportunities = result.items.map(({ evidence }) => buildAlibabaOpportunity(evidence)).filter(Boolean);
      if (!opportunities.length) throw new Error('Aucune opportunité V4 ne peut être créée depuis ce CSV');
      localStorage.setItem(BATCH_KEY, JSON.stringify({ importedAt: new Date().toISOString(), fileName: file.name, totalRows: result.totalRows, importedRows: result.importedRows, opportunities }));
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(opportunities[0]));
      localStorage.setItem(KEY, JSON.stringify(result.items[0].evidence));
      renderCsvSummary(output, result);
      status.textContent = `Statut : CSV importé · ${opportunities.length} opportunité(s) V4 P1 · première opportunité affichée`;
      const first = result.items[0].evidence;
      setField(form, 'url', first.sourceUrl);
      setField(form, 'product', first.product);
      setField(form, 'price', first.displayedPrice);
      setField(form, 'moq', first.moq);
      setField(form, 'supplier', first.supplier);
      setField(form, 'country', first.supplierCountry);
      document.dispatchEvent(new CustomEvent('v4:alibaba-evidence', { detail: { evidence: first, opportunity: opportunities[0], batch: opportunities } }));
    } catch (error) {
      status.textContent = 'Statut : import CSV échoué';
      output.innerHTML = `<div class="diagnostic">${displayValue(error?.message || 'CSV invalide')}</div>`;
    }
  };
  reader.onerror = () => {
    status.textContent = 'Statut : lecture du fichier impossible';
    output.innerHTML = '<div class="diagnostic">Le fichier CSV n’a pas pu être lu par le navigateur.</div>';
  };
  reader.readAsText(file, 'utf-8');
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
      <div class="diagnostic">Importez directement un export <b>CSV Bright Data Alibaba</b> ou collez une URL Alibaba. V4 conserve les données disponibles sans inventer les champs absents.</div>
      <div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end;margin-top:12px">
        <label style="display:grid;gap:5px"><span class="lab">CSV Bright Data</span><input data-alibaba-csv type="file" accept=".csv,text/csv" style="width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:7px;background:#0b0f12;color:var(--text)"></label>
        <button class="btn primary" data-alibaba-csv-import type="button">＋ Importer le CSV</button>
      </div>
      <form data-v4-alibaba-form style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px">
        ${field('URL produit *', 'url', 'url', 'https://www.alibaba.com/...')}
        ${field('Produit', 'product', 'text', 'Nom exact visible sur la fiche')}
        ${field('Prix affiché', 'price', 'text', 'Ex. 4,80 ou 4.80')}
        ${field('MOQ', 'moq', 'number', 'Ex. 100')}
        ${field('Fournisseur', 'supplier', 'text', 'Nom visible')}
        ${field('Pays fournisseur', 'country', 'text', 'Ex. China')}
        <div style="grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn" type="submit">＋ Importer la fiche Alibaba</button><span class="sub" data-v4-alibaba-status>Statut : aucune donnée importée</span></div>
      </form>
      <div data-v4-alibaba-evidence style="margin-top:12px"></div>
    </div>`;
  anchor.parentNode.insertBefore(section, anchor);

  const form = section.querySelector('[data-v4-alibaba-form]');
  const status = section.querySelector('[data-v4-alibaba-status]');
  const output = section.querySelector('[data-v4-alibaba-evidence]');
  const csvInput = section.querySelector('[data-alibaba-csv]');
  const csvButton = section.querySelector('[data-alibaba-csv-import]');

  csvButton.addEventListener('click', () => {
    const file = csvInput?.files?.[0];
    if (!file) {
      status.textContent = 'Statut : sélectionnez d’abord un fichier CSV';
      output.innerHTML = '<div class="diagnostic">Choisissez le fichier téléchargé depuis Bright Data.</div>';
      return;
    }
    if (!/\.csv$/i.test(file.name) && file.type && file.type !== 'text/csv') {
      status.textContent = 'Statut : fichier CSV attendu';
      return;
    }
    status.textContent = 'Statut : lecture du CSV Bright Data…';
    output.innerHTML = '<div class="diagnostic">V4 analyse les colonnes, les lignes et les produits sans convertir les valeurs absentes en zéro.</div>';
    importCsvBatch(file, form, status, output);
  });

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

    renderExtractedData(evidence, imported, output, opportunity);

    if (!opportunity) {
      status.textContent = imported.ok
        ? `Statut : page lue · extraction ${extractedStatus.toLowerCase()} · données affichées · identité produit requise`
        : 'Statut : lecture automatique indisponible · saisie manuelle possible';
      document.dispatchEvent(new CustomEvent('v4:alibaba-evidence', { detail: { evidence, opportunity: null } }));
      return;
    }

    status.textContent = isAutomaticExtraction ? `Statut : import Alibaba terminé · extraction ${extractedStatus.toLowerCase()} · opportunité V4 P1` : 'Statut : opportunité V4 P1 créée depuis les données saisies';
    document.dispatchEvent(new CustomEvent('v4:alibaba-evidence', { detail: { evidence, opportunity } }));
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => renderAlibabaImport(), { once: true });
  else renderAlibabaImport();
}
