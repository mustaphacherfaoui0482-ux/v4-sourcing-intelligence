/**
 * Webstractor provider for the V4 Source Adapter.
 * Acquisition only: no economics, scoring, risk, or decision logic.
 */

export const WEBSTRACTOR_SOURCE = 'Webstractor';
export const WEBSTRACTOR_API = 'https://api.webstractor.com/v1';

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? null;
}

function attributesOf(raw) {
  return raw && typeof raw.attributes === 'object' && raw.attributes ? raw.attributes : {};
}

async function request(path, params, apiKey = null) {
  const url = new URL(`${WEBSTRACTOR_API}/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const headers = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(url, { headers });
  const body = await response.text();
  if (!response.ok) throw new Error(`Webstractor ${response.status}: ${body.slice(0, 500)}`);

  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Webstractor returned non-JSON data');
  }
}

function normalizeSearchItem(item) {
  return {
    product: pick(item?.title),
    reference: pick(item?.url),
    url: pick(item?.url),
    source: WEBSTRACTOR_SOURCE,
  };
}

function normalizeProduct(raw) {
  const attributes = attributesOf(raw);
  const price = pick(attributes.price, attributes.priceMin, attributes.priceDisplay);
  const moq = pick(
    attributes.moq,
    attributes.minimumOrderQuantity,
    attributes.minimum_order_quantity,
  );

  return {
    product: pick(raw?.title),
    url: pick(raw?.url),
    supplier: pick(attributes.supplier, attributes.seller, attributes.vendor),
    country: pick(attributes.country, attributes.countryCode),
    price,
    currency: pick(attributes.currency),
    moq,
    customization: pick(attributes.customization, attributes.customizable),
    sample: pick(attributes.sample, attributes.sampleAvailable),
    leadTime: pick(attributes.leadTime, attributes.lead_time),
    certifications: pick(attributes.certifications),
  };
}

export function createWebstractorProvider({ apiKey = process.env.WEBSTRACTOR_API_KEY ?? null } = {}) {
  return Object.freeze({
    async search(query) {
      const result = await request('search', { q: query, limit: 1, format: 'json' }, apiKey);
      return Array.isArray(result?.items) ? result.items.map(normalizeSearchItem) : [];
    },

    async inspectProduct(reference) {
      const result = await request('extract', { url: reference, format: 'json' }, apiKey);
      return normalizeProduct(result);
    },
  });
}
