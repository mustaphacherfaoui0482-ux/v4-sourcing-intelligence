const PRODUCT_ENDPOINT = 'https://api.piloterr.com/v2/alibaba/product';
const SEARCH_ENDPOINT = 'https://api.piloterr.com/v2/alibaba/search';
const TIMEOUT_MS = 30_000;

function firstNonEmpty(...values) {
  return values.find((value) => value !== null && value !== undefined && String(value).trim() !== '') ?? null;
}

function getApiKey() {
  const raw = process.env.PILOTERR_API_KEY || '';
  return raw.trim().split(/\s+/)[0] || null;
}

function isAlibabaShortProductUrl(url) {
  try {
    const parsed = new URL(url);
    return /(^|\.)alibaba\.com$/i.test(parsed.hostname) && /^\/x\/[^/]+$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function extractCanonicalProductUrl(html, baseUrl) {
  const source = String(html || '');
  const patterns = [
    /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["']/i,
    /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i,
    /(https?:\/\/[^"'<>\s]+\.alibaba\.com\/product-detail\/[^"'<>\s]+?\.html(?:\?[^"'<>\s]+)?)/i,
    /(\/product-detail\/[^"'<>\s]+?\.html(?:\?[^"'<>\s]+)?)/i,
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (!match?.[1]) continue;
    try {
      const candidate = new URL(match[1], baseUrl);
      if (/alibaba\.com$/i.test(candidate.hostname) && /\/product-detail\//i.test(candidate.pathname)) return candidate.href;
    } catch {}
  }
  return null;
}

async function resolvePiloterrUrl(url) {
  if (!isAlibabaShortProductUrl(url)) return url;
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(8_000),
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'Mozilla/5.0 (compatible; V4-Sourcing-Intelligence/1.0; +https://vercel.com)',
    },
  });
  if (!response.ok) throw new Error(`alibaba_short_url_http_${response.status}`);
  const canonical = extractCanonicalProductUrl(await response.text(), response.url || url);
  if (!canonical) throw new Error('alibaba_short_url_canonical_not_found');
  return canonical;
}

export function piloterrConfigured() {
  return Boolean(getApiKey());
}

export function normalizePiloterrProduct(payload = {}) {
  const product = payload?.product || payload?.data || payload?.result || payload;
  const price = product?.price || {};
  const tiers = Array.isArray(price.quantity_prices) ? price.quantity_prices : [];
  const firstTier = tiers.find((tier) => tier?.min_quantity != null) || tiers[0] || null;
  const seller = product?.seller || {};
  const displayedPrice = firstNonEmpty(price.min, price.display, firstTier?.price, firstTier?.price_usd);
  const moq = firstNonEmpty(firstTier?.min_quantity);
  const supplier = firstNonEmpty(seller.company_name, seller.name);
  const supplierCountry = firstNonEmpty(seller.country, seller.country_code);
  const productName = firstNonEmpty(product?.title, product?.name);
  return Object.freeze({
    product: productName,
    displayedPrice,
    moq,
    supplier,
    supplierCountry,
    providerProductId: firstNonEmpty(product?.product_id),
    providerCanonicalUrl: firstNonEmpty(product?.url),
    providerPayload: product,
  });
}

function parseEmbeddedJson(value) {
  if (typeof value !== 'string') return value;
  const raw = value.trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function unwrapSearchPayload(payload = {}) {
  let current = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== 'object') break;
    if (Array.isArray(current.results) || Array.isArray(current.items) || Array.isArray(current.products)) return current;
    const next = current.result ?? current.data;
    if (next == null || next === current) break;
    const parsed = parseEmbeddedJson(next);
    if (parsed == null || parsed === current) break;
    current = parsed;
  }
  return current;
}

function searchItems(payload = {}) {
  const root = unwrapSearchPayload(payload);
  const candidates = root?.results || root?.items || root?.data?.results || root?.data?.items || root?.products || root?.result?.items || [];
  return Array.isArray(candidates) ? candidates : [];
}

function normalizePiloterrSearch(payload = {}) {
  const root = unwrapSearchPayload(payload);
  const candidates = searchItems(root).map((item) => ({
    url: firstNonEmpty(item?.listing_url, item?.url, item?.product_url),
    productId: firstNonEmpty(item?.product_id, item?.id),
    title: firstNonEmpty(item?.title, item?.name, item?.puretitle),
    displayedPrice: firstNonEmpty(item?.price_min, item?.price?.min, item?.price?.display, item?.price_text, item?.price, item?.price_usd),
    priceMax: firstNonEmpty(item?.price_max, item?.price?.max),
    moq: firstNonEmpty(item?.min_order, item?.moq, item?.minimum_order_quantity, item?.min_order_quantity, item?.price?.quantity_prices?.[0]?.min_quantity),
    supplier: firstNonEmpty(item?.seller_name, item?.seller?.company_name, item?.supplier, item?.seller?.name),
    supplierCountry: firstNonEmpty(item?.seller_country, item?.country, item?.seller?.country, item?.seller?.country_code),
  })).filter((item) => item.url || item.productId || item.title);

  return Object.freeze({
    candidates,
    total: firstNonEmpty(root?.total_results, root?.total, root?.pagination?.total, root?.count),
    page: firstNonEmpty(root?.page, root?.pagination?.page),
    pages: firstNonEmpty(root?.total_pages, root?.pages, root?.pagination?.pages),
    next: root?.next ?? null,
    providerPayload: payload,
  });
}

function extractSearchQuery(url) {
  try {
    const parsed = new URL(url);
    const query = parsed.searchParams.get('SearchText') || parsed.searchParams.get('searchText') || parsed.searchParams.get('query');
    return query?.trim() || null;
  } catch {
    return null;
  }
}

export async function fetchAlibabaThroughPiloterr(url, { search = false } = {}) {
  const key = getApiKey();
  if (!key) throw new Error('piloterr_not_configured');
  const endpoint = search ? SEARCH_ENDPOINT : PRODUCT_ENDPOINT;
  const targetUrl = search ? url : await resolvePiloterrUrl(url);
  const query = search ? (extractSearchQuery(url) || url) : targetUrl;
  const response = await fetch(`${endpoint}?query=${encodeURIComponent(query)}`, {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      accept: 'application/json',
      'x-api-key': key,
    },
  });
  if (!response.ok) throw new Error(`piloterr_http_${response.status}`);
  const payload = await response.json();

  if (search) {
    const extracted = normalizePiloterrSearch(payload);
    if (!extracted.candidates.length) throw new Error('piloterr_empty_search');
    return {
      html: JSON.stringify(payload),
      contentType: 'application/json',
      acquisition: 'PILOTERR_SEARCH_API',
      acquisitionUrl: endpoint,
      targetUrl: url,
      extracted,
    };
  }

  const extracted = normalizePiloterrProduct(payload);
  if (!extracted.product && extracted.displayedPrice == null && extracted.moq == null && !extracted.supplier && !extracted.supplierCountry) {
    throw new Error('piloterr_empty_product');
  }
  return {
    html: JSON.stringify(payload),
    contentType: 'application/json',
    acquisition: 'PILOTERR_BROWSER_API',
    acquisitionUrl: endpoint,
    targetUrl,
    extracted: { ...extracted, parserStatus: 'PARTIAL_OR_COMPLETE' },
  };
}
