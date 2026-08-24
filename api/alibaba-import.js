import { isAlibabaHostname, normalizeAlibabaUrl, parseAlibabaProductHtml } from '../modules/alibaba-parser.js';
import { parseAlibabaReaderText } from '../modules/alibaba-reader-parser.js';
import { fetchAlibabaThroughReader } from './alibaba-reader-fallback.js';

const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 8_000;
const EXTRACTION_KEYS = ['product', 'displayedPrice', 'moq', 'supplier', 'supplierCountry'];
function send(res, status, body) { res.status(status).setHeader('content-type', 'application/json; charset=utf-8'); return res.end(JSON.stringify(body)); }
export function extractionStatus(extracted = {}) { const present = EXTRACTION_KEYS.filter((key) => extracted[key] !== null && extracted[key] !== undefined && String(extracted[key]).trim() !== '').length; return present === 0 ? 'EMPTY' : present === EXTRACTION_KEYS.length ? 'COMPLETE' : 'PARTIAL'; }
export function mergeAlibabaExtraction(primary = {}, secondary = {}) { const merged = {}; for (const key of EXTRACTION_KEYS) { const a = primary[key]; const b = secondary[key]; const ap = a !== null && a !== undefined && String(a).trim() !== ''; const bp = b !== null && b !== undefined && String(b).trim() !== ''; merged[key] = ap ? a : bp ? b : null; } return Object.freeze({ ...merged, parserStatus: extractionStatus(merged) === 'EMPTY' ? 'NO_STRUCTURED_DATA' : 'PARTIAL_OR_COMPLETE' }); }
function diagnostics(fetched) { if (!fetched) return null; const text = String(fetched.html || ''); return { acquisition: fetched.acquisition || 'DIRECT', acquisitionUrl: fetched.acquisitionUrl || fetched.url || null, canonicalUrl: fetched.canonicalUrl || null, responseBytes: Buffer.byteLength(text, 'utf8'), parserStatus: fetched.extracted?.parserStatus || 'UNKNOWN', hasAlibabaMarker: /alibaba/i.test(text), hasProductMarker: /product|产品|商品/i.test(text), hasPriceMarker: /price|prix|US\$|USD|EUR|€|\$/i.test(text), hasMoqMarker: /MOQ|minimum order|minimum quantity|最小起订量/i.test(text), hasSupplierMarker: /supplier|manufacturer|seller|factory|供应商|制造商/i.test(text) }; }
function extractCanonicalAlibabaUrl(html, baseUrl) { const source = String(html || ''); const patterns = [/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["']/i, /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i, /(https?:\/\/[^"'<>\s]+\.alibaba\.com\/product-detail\/[^"'<>\s]+?\.html(?:\?[^"'<>\s]+)?)/i, /(https?:\/\/[^"'<>\s]+\.alibaba\.com\/product-detail\/[^"'<>\s]+)/i, /(\/product-detail\/[^"'<>\s]+?\.html(?:\?[^"'<>\s]+)?)/i]; for (const pattern of patterns) { const match = source.match(pattern); if (!match?.[1]) continue; try { const normalized = normalizeAlibabaUrl(new URL(match[1], baseUrl).href); if (normalized && isAlibabaHostname(new URL(normalized).hostname)) return normalized; } catch {} } return null; }
async function fetchAlibabaPage(url) { let current = url; for (let attempt = 0; attempt < 3; attempt += 1) { const response = await fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'Mozilla/5.0 (compatible; V4-Sourcing-Intelligence/1.0; +https://vercel.com)', accept: 'text/html,application/xhtml+xml' } }); if (response.status >= 300 && response.status < 400) { const location = response.headers.get('location'); const next = normalizeAlibabaUrl(location ? new URL(location, current).href : ''); if (!next || !isAlibabaHostname(new URL(next).hostname)) throw new Error('alibaba_redirect_blocked'); current = next; continue; } if (!response.ok) throw new Error(`alibaba_http_${response.status}`); const contentType = response.headers.get('content-type') || ''; if (!contentType.includes('text/html')) throw new Error('alibaba_non_html_response'); const contentLength = Number(response.headers.get('content-length') || 0); if (contentLength > MAX_BYTES) throw new Error('alibaba_response_too_large'); const text = await response.text(); if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) throw new Error('alibaba_response_too_large'); return { url: current, html: text, acquisition: 'DIRECT', contentType, canonicalUrl: extractCanonicalAlibabaUrl(text, current) }; } throw new Error('alibaba_too_many_redirects'); }
function parseFetchedPage(fetched) { const isReader = fetched.acquisition === 'JINA_READER' || !/html/i.test(fetched.contentType || ''); return { ...fetched, extracted: isReader ? parseAlibabaReaderText(fetched.html) : parseAlibabaProductHtml(fetched.html) }; }

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method_not_allowed' });
  const url = normalizeAlibabaUrl(req.body?.url); if (!url) return send(res, 400, { ok: false, error: 'invalid_alibaba_url' });
  let fetched = null; let directError = null; let readerDiagnostics = null; let readerUsed = false;
  try { fetched = parseFetchedPage(await fetchAlibabaPage(url)); } catch (error) { directError = error instanceof Error ? error.message : 'alibaba_fetch_failed'; }

  if (fetched && extractionStatus(fetched.extracted) === 'EMPTY' && fetched.canonicalUrl && fetched.canonicalUrl !== fetched.url) {
    try {
      const canonicalFetched = parseFetchedPage(await fetchAlibabaPage(fetched.canonicalUrl));
      const merged = mergeAlibabaExtraction(fetched.extracted, canonicalFetched.extracted);
      fetched = { ...canonicalFetched, acquisition: extractionStatus(merged) === 'EMPTY' ? 'DIRECT' : 'DIRECT+CANONICAL', extracted: merged, canonicalUrl: fetched.canonicalUrl };
    } catch (error) { directError = `${directError ? `${directError};` : ''}canonical_fetch_failed:${error instanceof Error ? error.message : 'failed'}`; }
  }

  if (!fetched || extractionStatus(fetched.extracted) !== 'COMPLETE') {
    try {
      const readerUrl = fetched?.canonicalUrl || fetched?.url || url;
      const readerFetched = await fetchAlibabaThroughReader(readerUrl);
      const parsedReader = parseFetchedPage(readerFetched);
      readerDiagnostics = diagnostics(parsedReader);
      const before = extractionStatus(fetched?.extracted || {}); const merged = mergeAlibabaExtraction(fetched?.extracted || {}, parsedReader.extracted || {}); const after = extractionStatus(merged);
      if (!fetched) { fetched = { ...parsedReader, url: parsedReader.url || url, acquisition: 'JINA_READER', extracted: merged }; readerUsed = true; }
      else { fetched = { ...fetched, acquisition: after !== before ? `${fetched.acquisition}+JINA_READER` : fetched.acquisition, acquisitionUrl: readerFetched.acquisitionUrl || fetched.acquisitionUrl, extracted: merged }; readerUsed = after !== before; }
    } catch (error) {
      readerDiagnostics = { error: error instanceof Error ? error.message : 'alibaba_reader_failed', canonicalUrl: fetched?.canonicalUrl || null };
      if (!fetched) return send(res, 200, { ok: false, source: 'Alibaba.com', sourceUrl: url, error: directError || readerDiagnostics.error, directError, readerDiagnostics, extracted: { product: null, displayedPrice: null, moq: null, supplier: null, supplierCountry: null }, fetchStatus: 'fetch_failed', extractionStatus: 'EMPTY', evidenceStatus: 'UNKNOWN' });
    }
  }
  const status = extractionStatus(fetched.extracted);
  return send(res, 200, { ok: true, source: 'Alibaba.com', sourceUrl: url, acquisition: fetched.acquisition || (readerUsed ? 'DIRECT+JINA_READER' : 'DIRECT'), acquisitionUrl: fetched.acquisitionUrl || url, extracted: fetched.extracted, fetchStatus: 'page_retrieved', extractionStatus: status, evidenceStatus: status === 'EMPTY' ? 'INSUFFICIENT' : status === 'COMPLETE' ? 'EXTRACTED' : 'PARTIAL', directError, readerDiagnostics: readerDiagnostics || diagnostics(fetched) });
}
