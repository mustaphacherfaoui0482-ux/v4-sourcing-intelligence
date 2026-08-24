import alibabaImportHandler from './alibaba-import.js';
import { fetchAlibabaThroughReader } from './alibaba-reader-fallback.js';

function captureResponse() {
  const headers = {};
  let statusCode = 200;
  let body = '';
  return {
    res: {
      status(code) { statusCode = code; return this; },
      setHeader(name, value) { headers[name] = value; return this; },
      end(value = '') { body = String(value); },
    },
    read() {
      try { return JSON.parse(body); } catch { return { ok: false, error: 'diagnostic_invalid_handler_response', raw: body.slice(0, 1000) }; }
    },
    status() { return statusCode; },
  };
}

function boundedReaderDebug(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const matching = (pattern) => lines.filter((line) => pattern.test(line)).slice(0, 20);
  return {
    responseBytes: Buffer.byteLength(String(text || ''), 'utf8'),
    priceLines: matching(/price|prix|US\$|USD|EUR|€|\$/i),
    moqLines: matching(/MOQ|minimum order|minimum quantity|最小起订量/i),
    supplierLines: matching(/supplier|manufacturer|seller|factory|company|fournisseur|fabricant|供应商|制造商/i),
    firstLines: lines.slice(0, 40),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
  }

  const url = String(req.query?.url || '').trim();
  if (!url) {
    res.status(400).setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: false, error: 'missing_url', usage: '/api/alibaba-diagnostic?url=<encoded_alibaba_product_url>' }));
  }

  const captured = captureResponse();
  await alibabaImportHandler({ method: 'POST', body: { url } }, captured.res);
  const payload = captured.read();

  let readerDebug = null;
  try {
    const reader = await fetchAlibabaThroughReader(url);
    readerDebug = boundedReaderDebug(reader.html);
  } catch (error) {
    readerDebug = { error: error instanceof Error ? error.message : 'reader_debug_failed' };
  }

  res.status(captured.status()).setHeader('content-type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify({
    diagnostic: true,
    pipeline: 'DIRECT → JINA_READER fallback → parser → merge',
    ...payload,
    readerDebug,
  }));
}
