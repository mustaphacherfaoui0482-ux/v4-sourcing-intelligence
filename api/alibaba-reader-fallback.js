import { isAlibabaHostname, normalizeAlibabaUrl } from '../modules/alibaba-parser.js';

const MAX_BYTES = 4_000_000;
const TIMEOUT_MS = 30_000;
const READER_ENDPOINT = 'https://r.jina.ai/';

function readerHeaders({ json = false } = {}) {
  const headers = {
    accept: json ? 'application/json,text/plain;q=0.9,*/*;q=0.8' : 'text/plain,text/markdown;q=0.9,*/*;q=0.8',
    'x-no-cache': 'true',
    'x-timeout': '30',
    'user-agent': 'V4-Sourcing-Intelligence/1.0',
  };
  if (process.env.JINA_API_KEY) {
    headers.authorization = `Bearer ${process.env.JINA_API_KEY}`;
    headers['x-engine'] = 'browser';
    headers['x-respond-timing'] = 'network-idle';
    headers['x-proxy'] = 'auto';
  }
  return headers;
}

export function buildReaderProxyUrl(url) {
  const normalized = normalizeAlibabaUrl(url);
  if (!normalized || !isAlibabaHostname(new URL(normalized).hostname)) return null;
  return `${READER_ENDPOINT}${normalized}`;
}

function readerCandidates(normalized) {
  const candidates = [normalized];
  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    if (host.endsWith('.alibaba.com') && host !== 'www.alibaba.com') {
      const global = new URL(url.href);
      global.hostname = 'www.alibaba.com';
      candidates.push(global.href);
    }
    const http = new URL(normalized);
    http.protocol = 'http:';
    candidates.push(http.href);
    if (host.endsWith('.alibaba.com') && host !== 'www.alibaba.com') {
      const globalHttp = new URL(url.href);
      globalHttp.hostname = 'www.alibaba.com';
      globalHttp.protocol = 'http:';
      candidates.push(globalHttp.href);
    }
  } catch {}
  return [...new Set(candidates)];
}

async function readResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) throw new Error('alibaba_reader_response_too_large');
  if (!text.trim()) throw new Error('alibaba_reader_empty_response');
  return { text, contentType };
}

function readerContent(text, contentType) {
  if (!/json/i.test(contentType)) return text;
  try {
    const payload = JSON.parse(text);
    return payload?.data?.content || payload?.content || payload?.data?.markdown || payload?.markdown || text;
  } catch {
    return text;
  }
}

async function fetchReaderPost(normalized) {
  const response = await fetch(READER_ENDPOINT, {
    method: 'POST',
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { ...readerHeaders({ json: true }), 'content-type': 'application/json' },
    body: JSON.stringify({ url: normalized }),
  });
  if (!response.ok) throw new Error(`alibaba_reader_post_http_${response.status}`);
  const { text, contentType } = await readResponse(response);
  return { html: readerContent(text, contentType), acquisition: 'JINA_READER', acquisitionUrl: `${READER_ENDPOINT}POST`, targetUrl: normalized, contentType: 'text/markdown' };
}

async function fetchReaderGet(normalized) {
  const proxyUrl = buildReaderProxyUrl(normalized);
  const response = await fetch(proxyUrl, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS), headers: readerHeaders() });
  if (!response.ok) throw new Error(`alibaba_reader_get_http_${response.status}`);
  const { text, contentType } = await readResponse(response);
  return { html: readerContent(text, contentType), acquisition: 'JINA_READER', acquisitionUrl: proxyUrl, targetUrl: normalized, contentType: /json/i.test(contentType) ? 'text/markdown' : (contentType || 'text/plain') };
}

export async function fetchAlibabaThroughReader(url) {
  const normalized = normalizeAlibabaUrl(url);
  if (!normalized || !isAlibabaHostname(new URL(normalized).hostname)) throw new Error('invalid_alibaba_url');
  const errors = [];
  const candidates = readerCandidates(normalized);
  const preferPost = Boolean(process.env.JINA_API_KEY);

  for (const candidate of candidates) {
    const methods = preferPost ? [fetchReaderPost, fetchReaderGet] : [fetchReaderGet, fetchReaderPost];
    for (const method of methods) {
      try {
        const result = await method(candidate);
        return { ...result, readerMode: process.env.JINA_API_KEY ? 'AUTHENTICATED_BROWSER_PROXY' : 'ANONYMOUS_READER' };
      } catch (error) {
        errors.push(`${method === fetchReaderPost ? 'post' : 'get'}:${candidate}:${error instanceof Error ? error.message : 'failed'}`);
      }
    }
  }
  throw new Error(`reader_all_candidates_failed:${errors.join(';')}`);
}
