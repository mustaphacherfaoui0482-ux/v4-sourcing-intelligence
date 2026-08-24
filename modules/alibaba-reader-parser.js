/** Parse text/Markdown returned by a reader service. Evidence only. */
const clean = (value) => String(value ?? '')
  .replace(/\*\*/g, '')
  .replace(/`/g, '')
  .replace(/\[[^\]]+\]\([^)]*\)/g, (match) => match.replace(/\]\([^)]*\)/, '').replace(/^\[/, ''))
  .replace(/\s+/g, ' ')
  .trim();

const number = (value) => {
  const raw = String(value ?? '').replace(/\u00a0/g, ' ');
  const m = raw.match(/[-+]?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const normalLabel = (value) => clean(value).replace(/[：:|]/g, '').trim().toLowerCase();

const TABLE_LABELS = {
  product: ['Product Name', 'Product title', 'Product', 'Title', 'Item Name', 'Nom du produit'],
  price: ['Price', 'Price Range', 'Starting price', 'From', 'Unit Price', 'Prix', 'Prix de départ'],
  moq: ['MOQ', 'Min. Order Quantity', 'Min Order Quantity', 'Minimum order quantity', 'Minimum order', 'Min. Order', 'Min Order', 'Quantité minimale'],
  supplier: ['Supplier', 'Supplier Name', 'Verified Supplier', 'Company Name', 'Seller', 'Store Name', 'Manufacturer', 'Brand', 'Fournisseur', 'Fabricant'],
  country: ['Supplier country', 'Country of supplier', 'Country of origin', 'Supplier Country', 'Pays du fournisseur', 'Pays'],
};

function markdownRows(source) {
  return source.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes('|'))
    .map((line) => line.split('|').map(clean).filter((cell) => cell !== ''))
    .filter((cells) => cells.length >= 2 && !cells.every((cell) => /^[-: ]+$/.test(cell)));
}

function tableValue(source, labels) {
  const wanted = labels.map(normalLabel);
  const rows = markdownRows(source);

  // Horizontal table: require at least two recognized headers so a vertical
  // key/value row cannot be mistaken for a horizontal table header.
  for (let rowIndex = 0; rowIndex < rows.length - 1; rowIndex += 1) {
    const header = rows[rowIndex];
    const headerIndexes = wanted.map((label) => header.findIndex((cell) => normalLabel(cell) === label));
    const matched = headerIndexes.filter((index) => index >= 0);
    if (matched.length < 2) continue;
    for (let valueIndex = rowIndex + 1; valueIndex < rows.length; valueIndex += 1) {
      const values = rows[valueIndex];
      if (values.length < header.length) continue;
      const index = matched[0];
      if (values[index] != null) return clean(values[index]);
    }
  }

  // Vertical key/value table: | Product | value |
  for (const row of rows) {
    if (row.length !== 2) continue;
    if (wanted.includes(normalLabel(row[0]))) return clean(row[1]);
  }

  return null;
}

function labelled(text, labels) {
  const source = String(text);
  const fromTable = tableValue(source, labels);
  if (fromTable) return fromTable;
  const wanted = labels.map(normalLabel);

  for (const line of source.split(/\r?\n/)) {
    const cells = line.split('|').map(clean).filter(Boolean);
    if (cells.length < 2 || /^[-: ]+$/.test(cells.join(''))) continue;
    for (let i = 0; i < cells.length - 1; i += 1) {
      if (wanted.includes(normalLabel(cells[i]))) return clean(cells[i + 1]);
    }
  }

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|\\n|\\|)\\s*(?:[-*+]\\s+)?(?:\\*\\*)?(?:${escaped})(?:\\*\\*)?\\s*(?::|：|-|\\|)\\s*(?:\\*\\*)?([^\\n|]{1,180}?)(?:\\*\\*)?\\s*(?=\\n|\\||$)`, 'im');
    const m = source.match(re);
    if (m?.[1]) return clean(m[1]);
  }
  return null;
}

function headingProduct(source) {
  for (const match of source.matchAll(/^#{1,6}\s+([^\n]+)/gm)) {
    const value = clean(match[1]);
    if (!value) continue;
    if (/^(?:alibaba(?:\.com)?|product details?|product information|specifications?|overview|description|reviews?|about this product|related products?)$/i.test(value)) continue;
    if (/^(?:access denied|just a moment|attention required|verify(?: you are human?)?|sign in|log in)$/i.test(value)) continue;
    return value;
  }
  return null;
}

function looseProduct(source) {
  const match = source.match(/(?:^|\n)\s*(?:Product(?: Name| Title)?|Item(?: Name)?|Nom du produit)\s*[:：-]\s*([^\n|]{4,220})/im);
  return match?.[1] ? clean(match[1]) : null;
}

export function parseAlibabaReaderText(text = '') {
  const source = String(text ?? '');
  const product = labelled(source, TABLE_LABELS.product)
    || headingProduct(source)
    || looseProduct(source)
    || null;

  const displayedPrice = number(labelled(source, TABLE_LABELS.price))
    ?? number(source.match(/(?:US\s*\$|USD|\$|€|EUR)\s*([0-9]+(?:[.,][0-9]+)?)/i)?.[1])
    ?? number(source.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:USD|US\s*\$|EUR|€|\$)/i)?.[1]);

  const moq = number(labelled(source, TABLE_LABELS.moq))
    ?? number(source.match(/(?:MOQ|min\.?\s*order(?:\s*quantity)?|minimum order(?: quantity)?)[^0-9]{0,80}([0-9]+(?:[.,][0-9]+)?)/i)?.[1]);

  const supplier = labelled(source, TABLE_LABELS.supplier);
  const supplierCountry = labelled(source, TABLE_LABELS.country);

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
