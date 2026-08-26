import { mapBrightDataCsv } from './alibaba-import.js';
import { buildAlibabaOpportunity } from './alibaba-opportunity.js';

const DB_NAME = 'v4-sourcing-intelligence';
const DB_VERSION = 1;
const STORE = 'alibaba-csv-batch';
const PAGE_SIZE = 25;

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponible dans ce navigateur'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Impossible d’ouvrir le stockage local'));
  });
}

function putBatch(batch) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(batch);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Échec d’écriture du batch')); };
  }));
}

function setFormField(form, key, value) {
  const input = form?.querySelector(`[data-alibaba-field="${key}"]`);
  if (input) input.value = value == null ? '' : String(value);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function renderBatch(output, batch) {
  let page = 0;
  const render = () => {
    const start = page * PAGE_SIZE;
    const rows = batch.items.slice(start, start + PAGE_SIZE);
    output.innerHTML = `
      <div class="evidence">
        <span class="pbadge">CSV : RÉCUPÉRÉ</span>
        <span class="pbadge">LIGNES : ${batch.totalRows}</span>
        <span class="pbadge">IMPORTÉES : ${batch.importedRows}</span>
        <span class="pbadge">REJETÉES : ${batch.rejectedRows}</span>
        <span class="pbadge">STOCKAGE : INDEXEDDB</span>
      </div>
      <div class="diagnostic" style="margin-top:10px">
        <b>${batch.importedRows} produits réellement chargés dans V4</b><br>
        <span class="sub">Le navigateur ne tente plus de mettre les 1 000 produits dans localStorage. Les données sont conservées dans IndexedDB et consultables par pages.</span>
      </div>
      <div style="overflow:auto;margin-top:10px">
        <table class="table"><thead><tr><th>#</th><th>Produit</th><th>Prix</th><th>Fournisseur</th><th>URL</th></tr></thead>
        <tbody>${rows.map((item, index) => `<tr><td>${start + index + 1}</td><td>${escapeHtml(item.evidence.product || '—')}</td><td>${escapeHtml(item.evidence.displayedPrice ?? '—')}</td><td>${escapeHtml(item.evidence.supplier || '—')}</td><td><a href="${escapeHtml(item.evidence.sourceUrl || '#')}" target="_blank" rel="noopener">Voir</a></td></tr>`).join('')}</tbody></table>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
        <button class="btn" type="button" data-batch-prev ${page === 0 ? 'disabled' : ''}>← Précédent</button>
        <span class="sub">Page ${page + 1} / ${Math.max(1, Math.ceil(batch.items.length / PAGE_SIZE))}</span>
        <button class="btn" type="button" data-batch-next ${start + PAGE_SIZE >= batch.items.length ? 'disabled' : ''}>Suivant →</button>
      </div>`;
    output.querySelector('[data-batch-prev]')?.addEventListener('click', () => { if (page > 0) { page -= 1; render(); } });
    output.querySelector('[data-batch-next]')?.addEventListener('click', () => { if (start + PAGE_SIZE < batch.items.length) { page += 1; render(); } });
  };
  render();
}

async function importBatch(file, section) {
  const status = section.querySelector('[data-v4-alibaba-status]');
  const output = section.querySelector('[data-v4-alibaba-evidence]');
  const form = section.querySelector('[data-v4-alibaba-form]');
  status.textContent = 'Statut : lecture du CSV…';
  output.innerHTML = '<div class="diagnostic">Analyse complète du fichier en cours…</div>';

  try {
    const text = await file.text();
    const result = mapBrightDataCsv(text);
    if (!result.importedRows) throw new Error('Aucun produit Alibaba exploitable dans le CSV');
    const items = result.items.map(({ evidence }) => ({ evidence, opportunity: buildAlibabaOpportunity(evidence) })).filter((item) => item.opportunity);
    if (!items.length) throw new Error('Aucune opportunité V4 ne peut être créée depuis ce CSV');

    const batch = {
      id: `csv-${Date.now()}`,
      importedAt: new Date().toISOString(),
      fileName: file.name,
      totalRows: result.totalRows,
      importedRows: result.importedRows,
      rejectedRows: result.rejectedRows,
      items,
    };
    await putBatch(batch);

    const first = items[0].evidence;
    setFormField(form, 'url', first.sourceUrl);
    setFormField(form, 'product', first.product);
    setFormField(form, 'price', first.displayedPrice);
    setFormField(form, 'moq', first.moq);
    setFormField(form, 'supplier', first.supplier);
    setFormField(form, 'country', first.supplierCountry);
    status.textContent = `Statut : CSV importé · ${items.length} produits V4 · affichage paginé`;
    renderBatch(output, batch);
    document.dispatchEvent(new CustomEvent('v4:alibaba-evidence', { detail: { evidence: first, opportunity: items[0].opportunity, batch: items.map((item) => item.opportunity) } }));
  } catch (error) {
    status.textContent = 'Statut : import CSV échoué';
    output.innerHTML = `<div class="diagnostic">${escapeHtml(error?.message || 'CSV invalide')}</div>`;
  }
}

function install() {
  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-alibaba-csv-import]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const section = button.closest('[data-v4-alibaba-import]');
    const input = section?.querySelector('[data-alibaba-csv]');
    const file = input?.files?.[0];
    if (!file) {
      const status = section?.querySelector('[data-v4-alibaba-status]');
      const output = section?.querySelector('[data-v4-alibaba-evidence]');
      if (status) status.textContent = 'Statut : sélectionnez d’abord un fichier CSV';
      if (output) output.innerHTML = '<div class="diagnostic">Choisissez le fichier téléchargé depuis Bright Data.</div>';
      return;
    }
    importBatch(file, section);
  }, true);
}

if (typeof document !== 'undefined') install();
