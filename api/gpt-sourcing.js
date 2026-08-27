import { evaluateOpportunity } from '../modules/decision-engine.js';
import {
  buildAgentContext,
  createSourcingState,
  recordAction,
  stopState,
  validateAgentOutput,
} from '../modules/gpt-sourcing-agent.js';

const SYSTEM_PROMPT = `Tu es GPT SOURCING, agent expert opérant au-dessus de V4 Sourcing Intelligence.
V4 reste l'autorité pour les règles déterministes, calculs, preuves, risques, Risk Gates et décision.
Ne transforme jamais UNKNOWN/NULL en 0. Potential != Confidence. Ne calcule jamais un second score global.
Travaille avec TARGET, ACTUAL, OPEN_GAPS, CLOSED_GAPS, LAST_ACTION, LAST_RESULT et NEXT_ALLOWED_ACTION.
Un GAP fermé ne peut être rouvert sans nouvelle preuve. Une seule action principale par cycle.
Si aucune action utile n'est possible, STOP.
La priorité est la qualité de décision, pas la quantité de produits.
Réponds avec une décision V4 valide et une prochaine action explicite.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    decision: { type: 'string', enum: ['TESTER', 'APPROFONDIR', 'ATTENDRE', 'EVITER', 'STOP'] },
    reason: { type: 'string' },
    nextAction: { type: 'string' },
    evidenceStatus: { type: 'string' },
    gap: { type: ['string', 'null'] },
  },
  required: ['decision', 'reason', 'nextAction', 'evidenceStatus', 'gap'],
};

function json(res, status, body) {
  res.status(status).json(body);
}

function runV4Decision(args) {
  return evaluateOpportunity(args ?? {});
}

async function callOpenAI({ target, candidate, state, model }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { status: 'NOT_CONFIGURED', state: buildAgentContext(state) };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || process.env.OPENAI_MODEL,
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ target, candidate, v4State: buildAgentContext(state) }) },
      ],
      text: { format: { type: 'json_schema', name: 'v4_sourcing_decision', strict: true, schema: OUTPUT_SCHEMA } },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = payload?.error?.message || `OpenAI HTTP ${response.status}`;
    return { status: 'OPENAI_ERROR', error, raw: payload };
  }

  const outputText = payload.output_text;
  if (!outputText) return { status: 'OPENAI_EMPTY', raw: payload };

  let parsed;
  try { parsed = JSON.parse(outputText); } catch {
    return { status: 'OPENAI_INVALID_JSON', raw: outputText };
  }
  return { status: 'OK', output: validateAgentOutput(parsed), responseId: payload.id };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const body = req.body || {};
  const target = typeof body.target === 'string' ? body.target.trim() : '';
  if (!target) return json(res, 400, { error: 'target is required' });

  const state = createSourcingState({ target, actual: body.candidate ?? null });
  recordAction(state, 'INIT');

  // Deterministic V4 evaluation can be exercised without an OpenAI key.
  let v4Decision = null;
  if (body.candidate && typeof body.candidate === 'object') {
    v4Decision = runV4Decision(body.candidate);
    state.lastResult = { type: 'V4_DECISION', value: v4Decision };
    if (v4Decision.decision === 'TESTER' || v4Decision.decision === 'EVITER') {
      stopState(state, 'V4_DECISION_REACHED', v4Decision);
    }
  }

  const gpt = await callOpenAI({
    target,
    candidate: body.candidate ?? null,
    state,
    model: body.model,
  });

  return json(res, 200, {
    version: state.version,
    target,
    status: state.status,
    state: buildAgentContext(state),
    v4Decision,
    gpt,
  });
}
