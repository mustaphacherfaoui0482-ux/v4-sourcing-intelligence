const ENDPOINT = 'https://api.piloterr.com/v2/usage';

function send(res, status, body) {
  res.status(status).setHeader('content-type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

function getApiKey() {
  const raw = process.env.PILOTERR_API_KEY || '';
  // Environment editors can accidentally preserve newlines or duplicate the key.
  // An API key itself cannot contain whitespace, so use the first non-empty token.
  return raw.trim().split(/\s+/)[0] || null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'method_not_allowed' });

  const rawKey = process.env.PILOTERR_API_KEY || '';
  const key = getApiKey();
  if (!key) return send(res, 200, {
    ok: false,
    configured: false,
    status: 'NOT_CONFIGURED',
    message: 'PILOTERR_API_KEY is not available in this Vercel runtime environment.'
  });

  try {
    const response = await fetch(ENDPOINT, {
      method: 'GET',
      headers: { accept: 'application/json', 'x-api-key': key },
      signal: AbortSignal.timeout(10_000),
    });
    const text = await response.text();
    let payload = null;
    try { payload = JSON.parse(text); } catch {}

    return send(res, 200, {
      ok: response.ok,
      configured: true,
      status: response.ok ? 'AUTHENTICATED' : 'AUTH_ERROR',
      piloterrStatus: response.status,
      normalizedKey: true,
      malformedEnvironmentValue: /\s/.test(rawKey.trim()) || rawKey.trim().split(/\s+/).length > 1,
      remaining: payload?.remaining ?? null,
      keyActive: payload?.api_key?.active ?? null,
      keyCategory: payload?.api_key?.category ?? null,
      keyAlias: payload?.api_key?.alias ?? null,
      error: response.ok ? null : (payload?.error || payload?.message || `piloterr_http_${response.status}`),
    });
  } catch (error) {
    return send(res, 200, {
      ok: false,
      configured: true,
      status: 'NETWORK_ERROR',
      piloterrStatus: null,
      normalizedKey: true,
      malformedEnvironmentValue: /\s/.test(rawKey.trim()) || rawKey.trim().split(/\s+/).length > 1,
      error: error instanceof Error ? error.message : 'piloterr_request_failed',
    });
  }
}
