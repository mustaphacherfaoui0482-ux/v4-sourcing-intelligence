import { isAlibabaHostname, normalizeAlibabaUrl, parseAlibabaProductHtml } from '../modules/alibaba-parser.js';

const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 8_000;

function send(res, status, body) {
  res.status(status).setHeader('content-type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

function extractionStatus(extracted = {}) {
  const keys = ['product', 'displayedPrice', 'moq', 'supplier', 'supplierCountry'];
  const present = keys.filter((key) => extracted[key] !== null && extracted[key] !== undefined && String(extracted[key]).trim() !== '').length;
  if (present === 0) return 'EMPTY';
  if (present === keys.length) return 'COMPLETE';
  return 'PARTIAL';
}

async function fetchAlibabaPage(url) {
  let current = url;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; V4-Sourcing-Intelligence/1.0; +https://vercel.com)',
        accept: 'text/html,application/xhtml+xml',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      const next = normalizeAlibabaUrl(location ? new URL(location, current).href : '');
      if (!next || !isAlibabaHostname(new URL(next).hostname)) throw new Error('alibaba_redirect_blocked');
      current = next;
      continue;
    }

    if (!response.ok) throw new Error(`alibaba_http_${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) throw new Error('alibaba_non_html_response');

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_BYTES) throw new Error('alibaba_response_too_large');

    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) throw new Error('alibaba_response_too_large');
    return { url: current, html: text };
  }
  throw new Error('alibaba_too_many_redirects');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method_not_allowed' });

  try {
    const rawUrl = req.body?.url;
    const url = normalizeAlibabaUrl(rawUrl);
    if (!url) return send(res, 400, { ok: false, error: 'invalid_alibaba_url' });

    const fetched = await fetchAlibabaPage(url);
    const extracted = parseAlibabaProductHtml(fetched.html);
    const status = extractionStatus(extracted);

    return send(res, 200, {
      ok: true,
      source: 'Alibaba.com',
      sourceUrl: fetched.url,
      extracted,
      fetchStatus: 'page_retrieved',
      extractionStatus: status,
      evidenceStatus: status === 'EMPTY' ? 'INSUFFICIENT' : status === 'COMPLETE' ? 'EXTRACTED' : 'PARTIAL',
    });
  } catch (error) {
    return send(res, 200, {
      ok: false,
      source: 'Alibaba.com',
      error: error instanceof Error ? error.message : 'alibaba_fetch_failed',
      extracted: { product: null, displayedPrice: null, moq: null, supplier: null, supplierCountry: null },
      fetchStatus: 'fetch_failed',
      extractionStatus: 'EMPTY',
      evidenceStatus: 'UNKNOWN',
    });
  }
}
