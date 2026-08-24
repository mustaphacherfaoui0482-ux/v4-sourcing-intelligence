import { isAlibabaHostname, normalizeAlibabaUrl } from '../modules/alibaba-parser.js';

const MAX_BYTES = 4_000_000;
const TIMEOUT_MS = 30_000;
const READER_ENDPOINT = 'https://r.jina.ai/';

export function buildReaderProxyUrl(url) {
  const normalized = normalizeAlibabaUrl(url);
  if (!normalized || !isAlibabaHostname(new URL(normalized).hostname)) return null;
  return `${READER_ENDPOINT}${normalized}`;
}

async function readResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) throw new Error('alibaba_reader_response_too_large');
  if (!text.trim()) throw new Error('alibaba_reader_empty_response');
  return { text, contentType };
}

async function fetchReaderGet(normalized) {
  const proxyUrl = buildReaderProxyUrl(normalized);
  const response = await fetch(proxyUrl, {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      accept: 'text/plain,text/markdown;q=0.9,*/*;q=0.8',
      'x-engine': 'browser',
      'x-no-cache': 'true',
      'x-respond-with': 'markdown',
      'x-respond-timing': 'network-idle',
      'x-timeout': '30',
      'user-agent': 'V4-Sourcing-Intelligence/1.0',
    },
  });
  if (!response.ok) throw new Error(`alibaba_reader_get_http_${response.status}`);
  const { text, contentType } = await readResponse(response);
  return {
    html: text,
    acquisition: 'JINA_READER',
    acquisitionUrl: proxyUrl,
    targetUrl: normalized,
    contentType: contentType || 'text/plain',
  };
}

async function fetchReaderPost(normalized) {
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
  if (!response.ok) throw new Error(`alibaba_reader_post_http_${response.status}`);
  const { text, contentType } = await readResponse(response);
  return {
    html: text,
    acquisition: 'JINA_READER',
    acquisitionUrl: `${READER_ENDPOINT}POST`,
    targetUrl: normalized,
    contentType: contentType || 'text/plain',
  };
}

export async function fetchAlibabaThroughReader(url) {
  const normalized = normalizeAlibabaUrl(url);
  if (!normalized || !isAlibabaHostname(new URL(normalized).hostname)) throw new Error('invalid_alibaba_url');

  let getError = null;
  try {
    return await fetchReaderGet(normalized);
  } catch (error) {
    getError = error instanceof Error ? error.message : 'alibaba_reader_get_failed';
  }

  try {
    return await fetchReaderPost(normalized);
  } catch (error) {
    const postError = error instanceof Error ? error.message : 'alibaba_reader_post_failed';
    throw new Error(`reader_get_failed:${getError};reader_post_failed:${postError}`);
  }
}
