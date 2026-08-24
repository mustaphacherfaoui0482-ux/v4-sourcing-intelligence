import { isAlibabaHostname, normalizeAlibabaUrl } from '../modules/alibaba-parser.js';

const MAX_BYTES = 4_000_000;
const TIMEOUT_MS = 18_000;

export function buildReaderProxyUrl(url) {
  const normalized = normalizeAlibabaUrl(url);
  if (!normalized || !isAlibabaHostname(new URL(normalized).hostname)) return null;
  return `https://r.jina.ai/${normalized}`;
}

export async function fetchAlibabaThroughReader(url) {
  const proxyUrl = buildReaderProxyUrl(url);
  if (!proxyUrl) throw new Error('invalid_alibaba_url');

  const response = await fetch(proxyUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      'x-respond-with': 'html',
      'x-timeout': '15',
      'user-agent': 'V4-Sourcing-Intelligence/1.0',
    },
  });

  if (!response.ok) throw new Error(`alibaba_reader_http_${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) throw new Error('alibaba_reader_response_too_large');
  if (!text.trim()) throw new Error('alibaba_reader_empty_response');

  return {
    html: text,
    acquisition: 'JINA_READER',
    acquisitionUrl: proxyUrl,
    contentType,
  };
}
