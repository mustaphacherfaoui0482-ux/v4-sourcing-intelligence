/** Parse text/Markdown returned by a reader service. Evidence only. */
const clean = (value) => String(value ?? '')
  .replace(/\*\*/g, '')
  .replace(/`/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const number = (value) => {
  const raw = String(value ?? '').replace(/\u00a0/g, ' ');
  const m = raw.match(/[-+]?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

function labelled(text, labels) {
  const source = String(text);
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|\\n|\\|)\\s*(?:[-*+]\\s+)?(?:\\*\\*)?(?:${escaped})(?:\\*\\*)?\\s*(?::|：|-|\\|)\\s*(?:\\*\\*)?([^\\n|]{1,180}?)(?:\\*\\*)?\\s*(?=\\n|\\||$)`, 'im');
    const m = source.match(re);
    if (m?.[1]) return clean(m[1]);
  }
  return null;
}

export function parseAlibabaReaderText(text = '') {
  const source = String(text ?? '');
  const product = labelled(source, ['Product Name', 'Product title', 'Product', 'Title', 'Nom du produit'])
    || clean(source.match(/^#{1,6}\s+([^\n]+)/m)?.[1] || '')
    || clean(source.match(/^(?:[-*+]\s+)?(?:\*\*)?Product(?: Name| Title)?(?:\*\*)?\s+([^\n|]+)/im)?.[1] || '')
    || null;

  const displayedPrice = number(labelled(source, ['Price', 'Starting price', 'From', 'Prix', 'Prix de départ']))
    ?? number(source.match(/(?:US\s*\$|USD|\$|€|EUR)\s*([0-9]+(?:[.,][0-9]+)?)/i)?.[1])
    ?? number(source.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:USD|US\s*\$|EUR|€|\$)/i)?.[1]);

  const moq = number(labelled(source, ['MOQ', 'Minimum order quantity', 'Minimum order', 'Quantité minimale']))
    ?? number(source.match(/(?:MOQ|minimum order quantity|minimum order)[^0-9]{0,80}([0-9]+(?:[.,][0-9]+)?)/i)?.[1]);

  const supplier = labelled(source, ['Supplier', 'Manufacturer', 'Brand', 'Fournisseur', 'Fabricant']);
  const supplierCountry = labelled(source, ['Supplier country', 'Country of supplier', 'Country of origin', 'Pays du fournisseur', 'Pays']);

  return Object.freeze({
    product,
    displayedPrice,
    moq,
    supplier,
    supplierCountry,
    parserStatus: [product, displayedPrice, moq, supplier, supplierCountry].some(v => v != null && v !== '')
      ? 'PARTIAL_OR_COMPLETE'
      : 'NO_STRUCTURED_DATA',
  });
}
