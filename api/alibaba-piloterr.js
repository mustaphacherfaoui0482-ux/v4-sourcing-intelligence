const ENDPOINT = 'https://api.piloterr.com/v2/alibaba/product';
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

export async function fetchAlibabaThroughPiloterr(url) {
  const key = getApiKey();
  if (!key) throw new Error('piloterr_not_configured');
  const endpoint = `${ENDPOINT}?query=${encodeURIComponent(url)}`;
  const response = await fetch(endpoint, {
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
  const extracted = normalizePiloterrProduct(payload);
  if (!extracted.product && extracted.displayedPrice == null && extracted.moq == null && !extracted.supplier && !extracted.supplierCountry) {
    throw new Error('piloterr_empty_product');
  }
  return {
    html: JSON.stringify(payload),
    contentType: 'application/json',
    acquisition: 'PILOTERR_BROWSER_API',
    acquisitionUrl: ENDPOINT,
    targetUrl: url,
    extracted,
  };
}
