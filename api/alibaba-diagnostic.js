import alibabaImportHandler from './alibaba-import.js';

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
  await alibabaImportHandler({
    method: 'POST',
    body: { url },
  }, captured.res);

  const payload = captured.read();
  res.status(captured.status()).setHeader('content-type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify({
    diagnostic: true,
    pipeline: 'DIRECT → JINA_READER fallback → parser → merge',
    ...payload,
  }));
}
