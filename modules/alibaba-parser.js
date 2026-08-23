/**
 * Best-effort parser for HTML returned by an Alibaba product page.
 * It extracts only values explicitly present in the fetched response.
 * Missing values remain null; the parser never invents economics.
 */

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').replace(/&nbsp;/gi, ' ').trim();
}

function decodeHtml(value) {
  return clean(String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>'));
}

function firstMatch(html, regexes) {
  for (const regex of regexes) {
    const match = html.match(regex);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return null;
}

function parseNumber(value) {
  if (value == null) return null;
  const normalized = String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[^0-9.,]/g, '')
    .replace(/,(?=\d{3}\b)/g, '')
    .replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseJsonScripts(html) {
  const values = [];
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    const attrs = match[1] || '';
    const body = match[2]?.trim() || '';
    if (!body || /type=["']application\/ld\+json["']/i.test(attrs) || body.length > 2_000_000) continue;
    for (const candidate of [body, body.replace(/\\u0022/g, '"').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>')]) {
      try {
        const parsed = JSON.parse(candidate);
        values.push(parsed);
        break;
      } catch {}
    }
  }
  return values;
}

function parseJsonLd(html) {
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const values = [];
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const list = Array.isArray(parsed) ? parsed : [parsed];
      values.push(...list.flatMap((item) => item?.['@graph'] || item));
    } catch {}
  }
  return values;
}

function flattenObjects(value, output = [], depth = 0) {
  if (depth > 8 || value == null) return output;
  if (Array.isArray(value)) {
    for (const item of value) flattenObjects(item, output, depth + 1);
    return output;
  }
  if (typeof value !== 'object') return output;
  output.push(value);
  for (const child of Object.values(value)) flattenObjects(child, output, depth + 1);
  return output;
}

function firstObjectValue(objects, keys) {
  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  for (const object of objects) {
    for (const [key, value] of Object.entries(object)) {
      if (!wanted.has(String(key).toLowerCase())) continue;
      if (value == null || value === '') continue;
      if (typeof value === 'object') {
        if (typeof value.name === 'string') return decodeHtml(value.name);
        if (typeof value.value === 'string' || typeof value.value === 'number') return value.value;
      } else if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
    }
  }
  return null;
}

function usableTitle(value) {
  const title = clean(value);
  if (!title) return null;
  const generic = /^(alibaba(?:\.com)?|alibaba\.com\s*[-|:–—]|access denied|just a moment|attention required|verify you are human|verify)$/i;
  return generic.test(title) ? null : title;
}

export function parseAlibabaProductHtml(html = '') {
  const source = String(html ?? '');
  const jsonLd = parseJsonLd(source);
  const embeddedJson = parseJsonScripts(source);
  const objects = flattenObjects([...jsonLd, ...embeddedJson]);
  const productLd = jsonLd.find((item) => item?.['@type'] === 'Product') || {};
  const offerLd = Array.isArray(productLd.offers) ? productLd.offers[0] : (productLd.offers || {});

  const product = usableTitle(productLd.name)
    || usableTitle(firstObjectValue(objects, ['productName', 'productTitle', 'subject', 'name', 'title']))
    || usableTitle(firstMatch(source, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']title["']/i,
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
      /<title[^>]*>([\s\S]*?)<\/title>/i,
    ]));

  const displayedPrice = parseNumber(offerLd.price)
    ?? parseNumber(firstObjectValue(objects, ['price', 'minPrice', 'salePrice', 'productPrice', 'priceValue']))
    ?? parseNumber(firstMatch(source, [
      /<meta[^>]+(?:property|name)=["']product:price:amount["'][^>]+content=["']([^"']+)/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']product:price:amount["']/i,
      /(?:US\$|USD|\$)\s*([0-9]+(?:[.,][0-9]+)?)/i,
    ]));

  const supplier = clean(productLd.brand?.name || productLd.manufacturer?.name)
    || clean(firstObjectValue(objects, ['supplierName', 'supplier', 'manufacturer', 'brandName', 'brand']))
    || firstMatch(source, [
      /(?:supplier|manufacturer|brand)[^<]{0,80}<[^>]*>([^<]{2,120})</i,
    ]);

  const country = clean(firstObjectValue(objects, ['supplierCountry', 'supplierCountryName', 'countryOfOrigin', 'country']))
    || firstMatch(source, [
      /(?:country of origin|supplier country|made in)[^<]{0,80}<[^>]*>([^<]{2,80})</i,
    ]);

  const moq = parseNumber(firstObjectValue(objects, ['minOrderQuantity', 'minimumOrderQuantity', 'moq', 'minimumOrder']))
    ?? parseNumber(firstMatch(source, [
      /(?:minimum order quantity|minimum order|MOQ)[^0-9]{0,80}([0-9]+(?:[.,][0-9]+)?)/i,
    ]));

  const hasAny = product || displayedPrice != null || moq != null || supplier || country;
  return Object.freeze({
    product: product || null,
    displayedPrice,
    moq,
    supplier: supplier || null,
    supplierCountry: country || null,
    parserStatus: hasAny ? 'PARTIAL_OR_COMPLETE' : 'NO_STRUCTURED_DATA',
  });
}

export function isAlibabaHostname(hostname) {
  const host = String(hostname || '').toLowerCase();
  return host === 'alibaba.com' || host.endsWith('.alibaba.com');
}

export function normalizeAlibabaUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || !isAlibabaHostname(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}
