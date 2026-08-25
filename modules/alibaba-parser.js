/**
 * V4 Alibaba parser — evidence only.
 * Missing values stay null. No economics or scores are invented.
 */

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

function decode(value) {
  return clean(String(value ?? '')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\"/g, '"'));
}

function number(value) {
  if (value == null || value === '') return null;
  const normalized = String(value).replace(/\u00a0/g, ' ').replace(/[^0-9.,-]/g, '')
    .replace(/,(?=\d{3}\b)/g, '').replace(',', '.');
  const result = Number(normalized);
  return Number.isFinite(result) ? result : null;
}

function parseJson(value) {
  const raw = String(value ?? '').trim();
  for (const candidate of [raw, decode(raw)]) {
    try { return JSON.parse(candidate); } catch {}
  }
  return null;
}

function balancedJson(text, start) {
  const source = String(text ?? '');
  const opener = source[start];
  if (opener !== '{' && opener !== '[') return null;
  const closer = opener === '{' ? '}' : ']';
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const c = source[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === opener) depth += 1;
    else if (c === closer && --depth === 0) return source.slice(start, i + 1);
  }
  return null;
}

function parseScripts(html) {
  const values = [];
  for (const match of String(html).matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1] || '';
    const body = match[2]?.trim() || '';
    if (!body || body.length > 2_000_000 || /application\/ld\+json/i.test(attrs)) continue;
    const direct = parseJson(body);
    if (direct != null) { values.push(direct); continue; }
    for (const match2 of body.matchAll(/(?:=|:)\s*([\[{])/g)) {
      const index = (match2.index ?? 0) + match2[0].lastIndexOf(match2[1]);
      const candidate = parseJson(balancedJson(body, index));
      if (candidate != null) { values.push(candidate); break; }
    }
  }
  return values;
}

function parseJsonLd(html) {
  const values = [];
  for (const match of String(html).matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const parsed = parseJson(match[1]);
    if (parsed == null) continue;
    const list = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of list) values.push(...(item?.['@graph'] || [item]));
  }
  return values;
}

function flatten(value, out = [], depth = 0) {
  if (value == null || depth > 10) return out;
  if (Array.isArray(value)) { value.forEach((item) => flatten(item, out, depth + 1)); return out; }
  if (typeof value !== 'object') return out;
  out.push(value);
  Object.values(value).forEach((item) => flatten(item, out, depth + 1));
  return out;
}

function objectValue(objects, keys) {
  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  for (const object of objects) {
    for (const [key, value] of Object.entries(object)) {
      if (!wanted.has(key.toLowerCase()) || value == null || value === '') continue;
      if (typeof value === 'object') {
        if (typeof value.name === 'string') return decode(value.name);
        if (value.value != null) return value.value;
      } else return typeof value === 'string' ? decode(value) : value;
    }
  }
  return null;
}

function rawKeyValue(source, keys) {
  for (const key of keys) {
    const safe = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = String(source).match(new RegExp(`["']${safe}["']\\s*:\\s*(?:"((?:\\\\.|[^"])*)"|([-+]?\\d+(?:[.,]\\d+)?))`, 'i'));
    if (match?.[1] != null) return decode(match[1]);
    if (match?.[2] != null) return match[2];
  }
  return null;
}

function first(html, patterns) {
  for (const pattern of patterns) {
    const match = String(html).match(pattern);
    if (match?.[1]) return decode(match[1]);
  }
  return null;
}

function title(value) {
  const result = clean(value);
  if (!result || /^(alibaba(?:\.com)?|access denied|just a moment|attention required|verify you are human|verify)$/i.test(result)) return null;
  return result;
}

export function parseAlibabaProductHtml(html = '') {
  const source = String(html ?? '');
  const jsonLd = parseJsonLd(source);
  const embedded = parseScripts(source);
  const objects = flatten([...jsonLd, ...embedded]);
  const productLd = jsonLd.find((item) => item?.['@type'] === 'Product') || {};
  const offers = Array.isArray(productLd.offers) ? productLd.offers[0] : (productLd.offers || {});

  const product = title(productLd.name)
    || title(objectValue(objects, ['productName', 'productTitle', 'subject', 'name', 'title']))
    || title(rawKeyValue(source, ['productName', 'productTitle', 'subject', 'name', 'title']))
    || title(first(source, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
      /<title[^>]*>([\s\S]*?)<\/title>/i,
    ]));

  const displayedPrice = number(offers.price)
    ?? number(objectValue(objects, ['price', 'minPrice', 'salePrice', 'productPrice', 'priceValue']))
    ?? number(rawKeyValue(source, ['price', 'minPrice', 'salePrice', 'productPrice', 'priceValue']))
    ?? number(first(source, [
      /<meta[^>]+(?:property|name)=["']product:price:amount["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']product:price:amount["']/i,
      /(?:US\$|USD|\$)\s*([0-9]+(?:[.,][0-9]+)?)/i,
    ]));

  const supplier = clean(productLd.brand?.name || productLd.manufacturer?.name)
    || clean(objectValue(objects, [
      'supplierName', 'supplier', 'supplierCompanyName', 'companyName', 'company',
      'sellerName', 'seller', 'storeName', 'manufacturer', 'brandName', 'brand',
    ]))
    || clean(rawKeyValue(source, [
      'supplierName', 'supplier', 'supplierCompanyName', 'companyName', 'company',
      'sellerName', 'seller', 'storeName', 'manufacturer', 'brandName', 'brand',
    ]));

  const country = clean(objectValue(objects, [
    'supplierCountry', 'supplierCountryName', 'countryOfSupplier', 'countryOfOrigin',
    'countryName', 'country',
  ]))
    || clean(rawKeyValue(source, [
      'supplierCountry', 'supplierCountryName', 'countryOfSupplier', 'countryOfOrigin',
      'countryName', 'country',
    ]));

  const moq = number(objectValue(objects, [
    'minOrderQuantity', 'minimumOrderQuantity', 'minimumOrderQty', 'minOrderQty',
    'moq', 'minimumOrder', 'minOrder',
  ]))
    ?? number(rawKeyValue(source, [
      'minOrderQuantity', 'minimumOrderQuantity', 'minimumOrderQty', 'minOrderQty',
      'moq', 'minimumOrder', 'minOrder',
    ]))
    ?? number(first(source, [/(?:minimum order quantity|minimum order|MOQ|min\.?\s*order)[^0-9]{0,80}([0-9]+(?:[.,]\d+)?)/i]));

  const hasAny = Boolean(product || supplier || country || displayedPrice != null || moq != null);
  return Object.freeze({ product: product || null, displayedPrice, moq, supplier: supplier || null, supplierCountry: country || null, parserStatus: hasAny ? 'PARTIAL_OR_COMPLETE' : 'NO_STRUCTURED_DATA' });
}

export function extractAlibabaProductCandidates(html = '', baseUrl = '') {
  const source = String(html ?? '');
  const found = new Map();
  const patterns = [
    /https?:\/\/[^"'<>\s]+\.alibaba\.com\/product-detail\/[^"'<>\s]+/gi,
    /(?:href|url|link|productUrl|product_url|productLink)\s*[=:]\s*["']([^"']*\/product-detail\/[^"']+)["']/gi,
    /["'](\/product-detail\/[^"']+)["']/gi,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const raw = decode(match[1] || match[0]).replace(/[),.;]+$/g, '');
      try {
        const absolute = new URL(raw, baseUrl || undefined).href;
        const normalized = normalizeAlibabaUrl(absolute);
        if (normalized && /\/product-detail\//i.test(new URL(normalized).pathname)) {
          const position = match.index ?? Number.MAX_SAFE_INTEGER;
          if (!found.has(normalized) || position < found.get(normalized).position) found.set(normalized, { url: normalized, position });
        }
      } catch {}
    }
  }
  return [...found.values()].sort((a, b) => a.position - b.position).map((item) => item.url).slice(0, 50);
}

export function isAlibabaSearchUrl(value) {
  try {
    const normalized = normalizeAlibabaUrl(value);
    if (!normalized) return false;
    const url = new URL(normalized);
    return /^\/trade\/search(?:\/|$)/i.test(url.pathname) || /^\/search(?:\/|$)/i.test(url.pathname);
  } catch { return false; }
}

export function isAlibabaHostname(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'alibaba.com' || host.endsWith('.alibaba.com');
}

export function normalizeAlibabaUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' && isAlibabaHostname(url.hostname) ? url.href : null;
  } catch { return null; }
}