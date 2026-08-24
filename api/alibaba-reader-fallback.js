import { isAlibabaHostname, normalizeAlibabaUrl } from '../modules/alibaba-parser.js';

const MAX_BYTES = 4_000_000;
const TIMEOUT_MS = 30_000;
const READER_ENDPOINT = 'https://r.jina.ai/';

export function buildReaderProxyUrl(url) {
  const normalized = normalizeAlibabaUrl(url);
  if (!normalized || !isAlibabaHostname(new URL(normalized).hostname)) return null;
  return `https://r.jina.ai/${normalized}`;
}

export async function fetchAlibabaThroughReader(url) {
  const normalized = normalizeAlibabaUrl(url);
  if (!normalized || !isAlibabaHostname(new URL(normalized).hostname)) throw new Error('invalid_alibaba_url');

  // POST the target URL to Reader instead of embedding it after r.jina.ai/.
  // This preserves Alibaba query parameters such as ?ck=pdp and avoids making
  // them query parameters of the Reader endpoint itself.
  const response = await fetch(READER_ENDPOINT, {
    method: 'POST',
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      accept: 'text/plain,text/markdown;q=0.9,*/*;q=0.8',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'x-engine': 'browser',
      'x-no-cache': 'true',
      'x-respond-with': 'markdown',
      'x-respond-timing': 'network-idle',
      'x-timeout': '30',
      'user-agent': 'V4-Sourcing-Intelligence/1.0',
    },
    body: new URLSearchParams({ url: normalized }).toString(),
  });

  if (!response.ok) throw new Error(`alibaba_reader_http_${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) throw new Error('alibaba_reader_response_too_large');
  if (!text.trim()) throw new Error('alibaba_reader_empty_response');

  return {
    html: text,
    acquisition: 'JINA_READER',
    acquisitionUrl: `${READER_ENDPOINT}POST`,
    targetUrl: normalized,
    contentType: contentType || 'text/plain',
  };
}
