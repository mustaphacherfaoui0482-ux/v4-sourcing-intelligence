/**
 * Best-effort parser for HTML returned by an Alibaba product page.
 * It only extracts values that are explicitly present in the fetched HTML.
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
  const normalized = String(value).replace(/[^0-9.,]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
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

export function parseAlibabaProductHtml(html = '') {
  const source = String(html ?? '');
  const jsonLd = parseJsonLd(source);
  const productLd = jsonLd.find((item) => item?.['@type'] === 'Product') || {};
  const offerLd = Array.isArray(productLd.offers) ? productLd.offers[0] : (productLd.offers || {});

  const product = clean(productLd.name) || firstMatch(source, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i,
    /<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  ]);

  const displayedPrice = parseNumber(offerLd.price) ?? parseNumber(firstMatch(source, [
    /<meta[^>]+(?:property|name)=["']product:price:amount["'][^>]+content=["']([^"']+)/i,
    /(?:US\$|USD|\$)\s*([0-9]+(?:[.,][0-9]+)?)/i,
  ]));

  const supplier = clean(productLd.brand?.name || productLd.manufacturer?.name) || firstMatch(source, [
    /(?:supplier|manufacturer|brand)[^<]{0,80}<[^>]*>([^<]{2,120})</i,
  ]);

  const country = firstMatch(source, [
    /(?:country of origin|supplier country|made in)[^<]{0,80}<[^>]*>([^<]{2,80})</i,
  ]);

  const moq = parseNumber(firstMatch(source, [
    /(?:minimum order|MOQ)[^0-9]{0,80}([0-9]+(?:[.,][0-9]+)?)/i,
  ]));

  return Object.freeze({
    product: product || null,
    displayedPrice,
    moq,
    supplier: supplier || null,
    supplierCountry: country || null,
    parserStatus: product || displayedPrice != null || moq != null || supplier ? 'PARTIAL_OR_COMPLETE' : 'NO_STRUCTURED_DATA',
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
