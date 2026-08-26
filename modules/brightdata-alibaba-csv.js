import { buildAlibabaOpportunity } from './alibaba-opportunity.js';

const REQUIRED_HEADERS = ['url', 'item_id', 'title', 'price', 'store_name'];

function cleanText(value) {
  return String(value ?? '').replace(/^\uFEFF/, '').trim();
}

function unwrapMarkdownLink(value) {
  const text = cleanText(value);
  const match = text.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
  return match ? match[2] : text;
}

function normalizeBrightDataValue(value) {
  if (typeof value === 'string') return unwrapMarkdownLink(value);
  if (Array.isArray(value)) return value.map(normalizeBrightDataValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeBrightDataValue(item)]));
  }
  return value;
}

function parseNumber(value) {
  const text = cleanText(value);
  if (!text) return null;
  const normalized = text.replace(/[^0-9,.-]/g, '').replace(/,(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseJson(value, fallback = null) {
  const text = cleanText(value);
  if (!text) return fallback;
  try { return normalizeBrightDataValue(JSON.parse(text)); } catch { return fallback; }
}

function parseCsvRows(csv) {
  const text = String(csv ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (quoted && next === '"') { field += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field); field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((cell) => cleanText(cell) !== '')) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cleanText(cell) !== '')) rows.push(row);
  }
  return rows;
}

export function parseBrightDataAlibabaCsv(csv) {
  const rows = parseCsvRows(csv);
  if (!rows.length) return { ok: false, error: 'empty_csv', headers: [], rows: [], opportunities: [] };

  const headers = rows[0].map(cleanText);
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length) return { ok: false, error: 'missing_required_headers', missingHeaders, headers, rows: [], opportunities: [] };

  const dataRows = rows.slice(1).map((cells, index) => {
    const record = Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? '']));
    const evidence = {
      sourceProvider: 'Bright Data',
      sourceDataset: 'Alibaba',
      sourceUrl: unwrapMarkdownLink(record.url),
      itemId: cleanText(record.item_id) || null,
      variantId: cleanText(record.variant_id) || null,
      product: cleanText(record.title) || null,
      description: cleanText(record.description) || null,
      category: cleanText(record.product_category) || null,
      categoryTree: parseJson(record.category_tree, null),
      brand: cleanText(record.brand) || null,
      imageUrl: unwrapMarkdownLink(record.image_url) || null,
      displayedPrice: parseNumber(record.price),
      salePrice: parseNumber(record.sale_price),
      availability: cleanText(record.availability) || null,
      availabilityDate: cleanText(record.availability_date) || null,
      groupId: cleanText(record.group_id) || null,
      listingHasVariations: cleanText(record.listing_has_variations) === '' ? null : cleanText(record.listing_has_variations) === 'true',
      variantAttributes: parseJson(record.variant_attributes, null),
      variants: parseJson(record.variants, null),
      supplier: cleanText(record.store_name) || null,
      supplierUrl: unwrapMarkdownLink(record.seller_url) || null,
      supplierCountry: cleanText(record.store_country) || null,
      returnPolicy: unwrapMarkdownLink(record.return_policy) || null,
      returnWindow: parseNumber(record.return_window),
      targetCountries: parseJson(record.target_countries, null),
      starRating: parseNumber(record.star_rating),
      reviewCount: parseNumber(record.review_count),
      reviews: parseJson(record.reviews, null),
      additionalImageUrls: parseJson(record.additional_image_urls, null),
      rowNumber: index + 2,
    };

    return { record, evidence, opportunity: buildAlibabaOpportunity(evidence) };
  });

  return {
    ok: true,
    headers,
    rowCount: dataRows.length,
    validOpportunityCount: dataRows.filter((row) => row.opportunity !== null).length,
    rows: dataRows,
    opportunities: dataRows.flatMap((row) => row.opportunity ? [row.opportunity] : []),
  };
}

export function parseBrightDataAlibabaCsvRow(row) {
  const csv = `${Object.keys(row).join(',')}\n${Object.values(row).map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')}`;
  const result = parseBrightDataAlibabaCsv(csv);
  return result.opportunities[0] ?? null;
}
