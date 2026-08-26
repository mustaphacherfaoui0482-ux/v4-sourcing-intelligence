import { parseBrightDataAlibabaCsv } from '../modules/brightdata-alibaba-csv.js';

const MAX_BYTES = 10_000_000;

function send(res, status, body) {
  res.status(status).setHeader('content-type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

function getCsvBody(req) {
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body.csv === 'string') return req.body.csv;
  if (req.body && typeof req.body.content === 'string') return req.body.content;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method_not_allowed' });

  const csv = getCsvBody(req);
  if (csv === null) return send(res, 400, { ok: false, error: 'csv_body_required' });
  if (Buffer.byteLength(csv, 'utf8') > MAX_BYTES) return send(res, 413, { ok: false, error: 'csv_too_large' });

  const result = parseBrightDataAlibabaCsv(csv);
  if (!result.ok) return send(res, 400, { ...result, source: 'Bright Data / Alibaba' });

  return send(res, 200, {
    ok: true,
    source: 'Bright Data / Alibaba',
    rowCount: result.rowCount,
    validOpportunityCount: result.validOpportunityCount,
    opportunities: result.opportunities,
  });
}
