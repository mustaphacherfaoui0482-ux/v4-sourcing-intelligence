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

const normalLabel = (value) => clean(value).replace(/[：:|]/g, '').replace(/^[-*+]\s+/, '').trim().toLowerCase();

const TABLE_LABELS = {
  product: ['Product Name', 'Product title', 'Product', 'Title', 'Item Name', 'Nom du produit'],
  price: ['Price', 'Price Range', 'Starting price', 'From', 'Unit Price', 'Prix', 'Prix de départ'],
  moq: ['MOQ', 'Min. Order Quantity', 'Min Order Quantity', 'Minimum order quantity', 'Minimum order', 'Min. Order', 'Min Order', 'Minimum order qty', 'Min order qty', 'Minimum order size', 'Order quantity', 'Quantité minimale'],
  supplier: ['Supplier', 'Supplier Name', 'Verified Supplier', 'Supplier company', 'Company Name', 'Company', 'Seller Name', 'Seller', 'Store Name', 'Manufacturer', 'Factory', 'Brand', 'Fournisseur', 'Fabricant'],
  country: ['Supplier country', 'Supplier location', 'Supplier location country', 'Country of supplier', 'Supplier Country', 'Country of origin', 'Country name', 'Country', 'Location', 'Pays du fournisseur', 'Pays'],
};

const ALL_TABLE_LABELS = Object.values(TABLE_LABELS).flat().map(normalLabel);
const ALL_LABELS_SORTED = Object.values(TABLE_LABELS).flat().sort((a, b) => b.length - a.length);
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  for (let rowIndex = 0; rowIndex < rows.length - 1; rowIndex += 1) {
    const header = rows[rowIndex];
    const knownHeaderCount = header.filter((cell) => ALL_TABLE_LABELS.includes(normalLabel(cell))).length;
    if (knownHeaderCount < 2) continue;
    const requestedIndex = header.findIndex((cell) => wanted.includes(normalLabel(cell)));
    if (requestedIndex < 0) continue;
    for (let valueIndex = rowIndex + 1; valueIndex < rows.length; valueIndex += 1) {
      const values = rows[valueIndex];
      if (values.length < header.length) continue;
      if (values[requestedIndex] != null) return clean(values[requestedIndex]);
    }
  }
  for (const row of rows) {
    if (row.length === 2 && wanted.includes(normalLabel(row[0]))) return clean(row[1]);
  }
  return null;
}

function compactLabelled(source, labels) {
  if (/\r?\n/.test(source)) return null;
  const allLabels = ALL_LABELS_SORTED.map(escapeRegex).join('|');
  for (const label of labels) {
    const re = new RegExp(`(?:^|\\s|\\|)(?:${escapeRegex(label)})\\s*(?::|：|-|\\|)\\s*([\\s\\S]*?)(?=\\s+(?:${allLabels})\\s*(?::|：|-|\\|)|\\s*$)`, 'i');
    const match = source.match(re);
    if (match?.[1]) return clean(match[1]);
  }
  return null;
}

function nextNonEmptyLine(lines, index) {
  for (let i = index + 1; i < lines.length; i += 1) {
    const value = lines[i].trim();
    if (!value) continue;
    if (/^(?:#{1,6}\s+|[-*+]\s*$)/.test(value)) return null;
    return value;
  }
  return null;
}

function splitLineLabelled(source, labels) {
  const wanted = labels.map(normalLabel);
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const cells = raw.split('|').map(clean).filter(Boolean);
    if (cells.length >= 2 && wanted.includes(normalLabel(cells[0]))) return clean(cells.slice(1).join(' '));
    const withoutMarker = raw.replace(/^[-*+]\s+/, '').trim();
    if (!wanted.includes(normalLabel(withoutMarker))) continue;
    const value = nextNonEmptyLine(lines, i);
    if (value) return clean(value.replace(/^[-*+]\s+/, ''));
  }
  return null;
}

function labelled(text, labels) {
  const source = String(text);
  const fromTable = tableValue(source, labels);
  if (fromTable) return fromTable;
  const splitLine = splitLineLabelled(source, labels);
  if (splitLine) return splitLine;
  const compact = compactLabelled(source, labels);
  if (compact) return compact;
  const wanted = labels.map(normalLabel);
  for (const line of source.split(/\r?\n/)) {
    const cells = line.split('|').map(clean).filter(Boolean);
    if (cells.length < 2 || /^[-: ]+$/.test(cells.join(''))) continue;
    for (let i = 0; i < cells.length - 1; i += 1) {
      if (wanted.includes(normalLabel(cells[i]))) return clean(cells[i + 1]);
    }
  }
  for (const label of labels) {
    const re = new RegExp(`(?:^|\\n|\\|)\\s*(?:[-*+]\\s+)?(?:\\*\\*)?(?:${escapeRegex(label)})(?:\\*\\*)?\\s*(?::|：|-|\\|)\\s*(?:\\*\\*)?([^\\n|]{1,180}?)(?:\\*\\*)?\\s*(?=\\n|\\||$)`, 'im');
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

function looseLabelled(source, labels, valuePattern = '[^\\n|]{1,180}') {
  for (const label of labels) {
    const re = new RegExp(`(?:^|\\n)\\s*(?:[-*+]\\s+)?(?:\\*\\*)?${escapeRegex(label)}(?:\\*\\*)?\\s*(?::|：|-)\\s*(${valuePattern})`, 'im');
    const match = source.match(re);
    if (match?.[1]) return clean(match[1]);
  }
  return null;
}

export function parseAlibabaReaderText(text = '') {
  const source = String(text ?? '');
  const product = labelled(source, TABLE_LABELS.product) || headingProduct(source) || looseProduct(source) || null;
  const displayedPrice = number(labelled(source, TABLE_LABELS.price))
    ?? number(source.match(/(?:US\s*\$|USD|\$|€|EUR)\s*([0-9]+(?:[.,][0-9]+)?)/i)?.[1])
    ?? number(source.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:USD|US\s*\$|EUR|€|\$)/i)?.[1]);
  const moq = number(labelled(source, TABLE_LABELS.moq))
    ?? number(looseLabelled(source, ['Minimum order quantity', 'Minimum order qty', 'Min. order quantity', 'Min order qty', 'Min. order', 'Min order', 'MOQ']))
    ?? number(source.match(/(?:MOQ|min\.?\s*order(?:\s*quantity|\s*qty)?|minimum order(?: quantity| qty)?)[^0-9]{0,100}([0-9]+(?:[.,]\d+)?)/i)?.[1]);
  const supplier = labelled(source, TABLE_LABELS.supplier) || looseLabelled(source, ['Supplier', 'Supplier Name', 'Supplier company', 'Company Name', 'Seller Name', 'Manufacturer', 'Factory']);
  const supplierCountry = labelled(source, TABLE_LABELS.country) || looseLabelled(source, ['Supplier country', 'Supplier location', 'Supplier location country', 'Country of supplier', 'Country of origin', 'Country name']);
  return Object.freeze({ product, displayedPrice, moq, supplier, supplierCountry, parserStatus: [product, displayedPrice, moq, supplier, supplierCountry].some(v => v != null && v !== '') ? 'PARTIAL_OR_COMPLETE' : 'NO_STRUCTURED_DATA' });
}
