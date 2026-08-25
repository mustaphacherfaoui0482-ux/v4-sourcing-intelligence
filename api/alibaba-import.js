import { isAlibabaHostname, normalizeAlibabaUrl, parseAlibabaProductHtml, extractAlibabaProductCandidates, isAlibabaSearchUrl } from '../modules/alibaba-parser.js';
import { acquireAlibabaProduct } from './alibaba-acquisition.js';

const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 8_000;
const EXTRACTION_KEYS = ['product', 'displayedPrice', 'moq', 'supplier', 'supplierCountry'];

function send(res, status, body) {
  res.status(status).setHeader('content-type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

export function extractionStatus(extracted = {}) {
  const present = EXTRACTION_KEYS.filter((key) => extracted[key] !== null && extracted[key] !== undefined && String(extracted[key]).trim() !== '').length;
  return present === 0 ? 'EMPTY' : present === EXTRACTION_KEYS.length ? 'COMPLETE' : 'PARTIAL';
}

export function mergeAlibabaExtraction(primary = {}, secondary = {}) {
  const merged = {};
  for (const key of EXTRACTION_KEYS) {
    const a = primary[key];
    const b = secondary[key];
    const ap = a !== null && a !== undefined && String(a).trim() !== '';
    const bp = b !== null && b !== undefined && String(b).trim() !== '';
    merged[key] = ap ? a : bp ? b : null;
  }
  return Object.freeze({ ...merged, parserStatus: extractionStatus(merged) === 'EMPTY' ? 'NO_STRUCTURED_DATA' : 'PARTIAL_OR_COMPLETE' });
}

function diagnostics(fetched) {
  if (!fetched) return null;
  const text = String(fetched.html || '');
  return {
    acquisition: fetched.acquisition || 'UNKNOWN',
    acquisitionUrl: fetched.acquisitionUrl || fetched.url || null,
    canonicalUrl: fetched.canonicalUrl || null,
    responseBytes: Buffer.byteLength(text, 'utf8'),
    parserStatus: fetched.extracted?.parserStatus || 'UNKNOWN',
    hasAlibabaMarker: /alibaba/i.test(text),
    hasProductMarker: /product|产品|商品/i.test(text),
    hasPriceMarker: /price|prix|US\$|USD|EUR|€|\$/i.test(text),
    hasMoqMarker: /MOQ|minimum order|minimum quantity|最小起订量/i.test(text),
    hasSupplierMarker: /supplier|manufacturer|seller|factory|供应商|制造商/i.test(text),
    acquisitionAttempts: fetched.acquisitionAttempts || [],
  };
}

async function fetchAlibabaSearchPage(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; V4-Sourcing-Intelligence/1.0; +https://vercel.com)',
      accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`alibaba_search_http_${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) throw new Error('alibaba_search_non_html_response');
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_BYTES) throw new Error('alibaba_response_too_large');
  const html = await response.text();
  if (Buffer.byteLength(html, 'utf8') > MAX_BYTES) throw new Error('alibaba_response_too_large');
  return { url, html, contentType, acquisition: 'DIRECT_SEARCH', extracted: parseAlibabaProductHtml(html) };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method_not_allowed' });
  const url = normalizeAlibabaUrl(req.body?.url);
  if (!url) return send(res, 400, { ok: false, error: 'invalid_alibaba_url' });

  const searchUrl = isAlibabaSearchUrl(url);
  const emptyExtraction = { product: null, displayedPrice: null, moq: null, supplier: null, supplierCountry: null };

  if (searchUrl) {
    try {
      const fetched = await fetchAlibabaSearchPage(url);
      const productCandidates = extractAlibabaProductCandidates(fetched.html, fetched.url || url);
      return send(res, 200, {
        ok: true,
        source: 'Alibaba.com',
        sourceUrl: url,
        acquisition: fetched.acquisition,
        acquisitionUrl: url,
        searchUrl: true,
        productCandidates,
        extracted: fetched.extracted,
        fetchStatus: 'page_retrieved',
        extractionStatus: extractionStatus(fetched.extracted),
        acquisitionStatus: productCandidates.length ? 'CANDIDATES_FOUND' : 'BROWSER_REQUIRED',
        evidenceStatus: productCandidates.length ? 'CANDIDATES_ONLY' : 'INSUFFICIENT',
        directError: null,
        providerError: null,
        providerConfigured: false,
        readerDiagnostics: diagnostics(fetched),
      });
    } catch (error) {
      return send(res, 200, {
        ok: false,
        source: 'Alibaba.com',
        sourceUrl: url,
        error: error instanceof Error ? error.message : 'search_page_acquisition_failed',
        acquisitionStatus: 'BROWSER_REQUIRED',
        fetchStatus: 'fetch_failed',
        extractionStatus: 'EMPTY',
        evidenceStatus: 'UNKNOWN',
        productCandidates: [],
        extracted: emptyExtraction,
      });
    }
  }

  const result = await acquireAlibabaProduct(url);
  const fetched = result.fetched;
  if (!fetched) {
    return send(res, 200, {
      ok: false,
      source: 'Alibaba.com',
      sourceUrl: url,
      error: 'acquisition_failed',
      acquisitionAttempts: result.acquisitionAttempts,
      acquisitionStatus: 'UNKNOWN',
      fetchStatus: 'fetch_failed',
      extractionStatus: 'EMPTY',
      evidenceStatus: 'UNKNOWN',
      extracted: emptyExtraction,
    });
  }

  const status = extractionStatus(fetched.extracted || {});
  const acquisitionStatus = status === 'COMPLETE' ? 'COMPLETE' : status === 'PARTIAL' ? 'PARTIAL' : 'UNKNOWN';
  return send(res, 200, {
    ok: true,
    source: 'Alibaba.com',
    sourceUrl: url,
    acquisition: fetched.acquisition || 'UNKNOWN',
    acquisitionUrl: fetched.acquisitionUrl || url,
    searchUrl: false,
    productCandidates: [],
    extracted: fetched.extracted,
    fetchStatus: 'page_retrieved',
    extractionStatus: status,
    acquisitionStatus,
    evidenceStatus: status === 'COMPLETE' ? 'EXTRACTED' : status === 'PARTIAL' ? 'PARTIAL' : 'UNKNOWN',
    acquisitionAttempts: fetched.acquisitionAttempts || result.acquisitionAttempts,
    readerDiagnostics: diagnostics(fetched),
  });
}
