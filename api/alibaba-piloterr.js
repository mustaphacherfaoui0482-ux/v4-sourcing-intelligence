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

function searchItems(payload = {}) {
  const candidates = payload?.results || payload?.items || payload?.data?.results || payload?.data?.items || payload?.products || payload?.result?.items || [];
  return Array.isArray(candidates) ? candidates : [];
}

function normalizePiloterrSearch(payload = {}) {
  const candidates = searchItems(payload).map((item) => ({
    url: firstNonEmpty(item?.listing_url, item?.url, item?.product_url),
    productId: firstNonEmpty(item?.product_id, item?.id),
    title: firstNonEmpty(item?.title, item?.name),
    displayedPrice: firstNonEmpty(item?.price?.min, item?.price?.display, item?.price, item?.price_usd),
    moq: firstNonEmpty(item?.moq, item?.minimum_order_quantity, item?.min_order_quantity, item?.price?.quantity_prices?.[0]?.min_quantity),
    supplier: firstNonEmpty(item?.seller?.company_name, item?.supplier, item?.seller?.name),
    supplierCountry: firstNonEmpty(item?.seller?.country, item?.country, item?.seller?.country_code),
  })).filter((item) => item.url || item.productId || item.title);

  return Object.freeze({
    candidates,
    total: firstNonEmpty(payload?.total, payload?.pagination?.total, payload?.count),
    page: firstNonEmpty(payload?.page, payload?.pagination?.page),
    pages: firstNonEmpty(payload?.pages, payload?.pagination?.pages),
    providerPayload: payload,
  });
}

export async function fetchAlibabaThroughPiloterr(url, { search = false } = {}) {
  const key = getApiKey();
  if (!key) throw new Error('piloterr_not_configured');
  const endpoint = search ? SEARCH_ENDPOINT : PRODUCT_ENDPOINT;
  const response = await fetch(`${endpoint}?query=${encodeURIComponent(url)}`, {
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
    targetUrl: url,
    extracted,
  };
}
