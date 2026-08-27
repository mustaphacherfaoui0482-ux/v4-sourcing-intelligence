import { evaluateOpportunity } from '../modules/decision-engine.js';
import {
  buildAgentContext,
  createSourcingState,
  recordAction,
  stopState,
  validateAgentOutput,
} from '../modules/gpt-sourcing-agent.js';
import {
  GPT_SOURCING_PROMPT_VERSION,
  GPT_SOURCING_SYSTEM_PROMPT,
} from '../modules/gpt-sourcing-prompt.js';

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

const TERMINAL_DECISIONS = new Set(['TESTER', 'EVITER']);
const V4_NON_TERMINAL_ALLOWED = {
  APPROFONDIR: new Set(['APPROFONDIR', 'ATTENDRE', 'STOP']),
  ATTENDRE: new Set(['APPROFONDIR', 'ATTENDRE', 'STOP']),
};

function json(res, status, body) {
  res.status(status).json(body);
}

export function runV4Decision(candidate) {
  return evaluateOpportunity(candidate ?? {});
}

export function isTerminalDecision(decision) {
  return TERMINAL_DECISIONS.has(decision);
}

export function isGptDecisionAllowed(v4Decision, gptDecision) {
  if (!v4Decision) return true;
  if (isTerminalDecision(v4Decision.decision)) return false;
  const allowed = V4_NON_TERMINAL_ALLOWED[v4Decision.decision];
  return allowed ? allowed.has(gptDecision) : gptDecision === 'STOP';
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text;
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === 'string' && part.text.trim()) return part.text;
    }
  }
  return null;
}

async function callOpenAI({ target, candidate, state, model }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const selectedModel = model || process.env.OPENAI_MODEL;
  if (!apiKey || !selectedModel) {
    return {
      status: 'NOT_CONFIGURED',
      reason: !apiKey ? 'OPENAI_API_KEY missing' : 'OPENAI_MODEL missing',
      promptVersion: GPT_SOURCING_PROMPT_VERSION,
      state: buildAgentContext(state),
    };
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: selectedModel,
      input: [
        { role: 'system', content: GPT_SOURCING_SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            target,
            candidate,
            v4State: buildAgentContext(state),
          }),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'v4_sourcing_decision',
          strict: true,
          schema: OUTPUT_SCHEMA,
        },
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = payload?.error?.message || `OpenAI HTTP ${response.status}`;
    return { status: 'OPENAI_ERROR', error, httpStatus: response.status };
  }

  const outputText = extractResponseText(payload);
  if (!outputText) return { status: 'OPENAI_EMPTY', responseId: payload?.id };

  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    return { status: 'OPENAI_INVALID_JSON', raw: outputText, responseId: payload?.id };
  }

  let output;
  try {
    output = validateAgentOutput(parsed);
  } catch (error) {
    return { status: 'OPENAI_INVALID_OUTPUT', error: error.message, responseId: payload?.id };
  }

  return {
    status: 'OK',
    output,
    responseId: payload?.id,
    promptVersion: GPT_SOURCING_PROMPT_VERSION,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const body = req.body || {};
  const target = typeof body.target === 'string' ? body.target.trim() : '';
  if (!target) return json(res, 400, { error: 'target is required' });

  const state = createSourcingState({ target, actual: body.candidate ?? null });
  recordAction(state, 'INIT');

  let v4Decision = null;
  if (body.candidate && typeof body.candidate === 'object') {
    v4Decision = runV4Decision(body.candidate);
    state.lastResult = { type: 'V4_DECISION', value: v4Decision };

    if (isTerminalDecision(v4Decision.decision)) {
      stopState(state, 'V4_DECISION_REACHED', v4Decision);
      return json(res, 200, {
        version: state.version,
        target,
        status: state.status,
        state: buildAgentContext(state),
        v4Decision,
        gpt: { status: 'SKIPPED_V4_TERMINAL_DECISION' },
      });
    }
  }

  const gpt = await callOpenAI({
    target,
    candidate: body.candidate ?? null,
    state,
    model: body.model,
  });

  if (gpt.status === 'OK') {
    if (!isGptDecisionAllowed(v4Decision, gpt.output.decision)) {
      stopState(state, 'GPT_DECISION_CONFLICT_WITH_V4', {
        v4Decision: v4Decision?.decision ?? null,
        gptDecision: gpt.output.decision,
      });
      gpt.status = 'REJECTED_V4_AUTHORITY';
    } else if (gpt.output.decision === 'STOP') {
      stopState(state, 'GPT_STOP', gpt.output);
    } else {
      recordAction(state, `GPT:${gpt.output.nextAction}`);
      state.lastResult = { type: 'GPT_DECISION', value: gpt.output };
      state.nextAllowedAction = gpt.output.nextAction;
    }
  }

  return json(res, 200, {
    version: state.version,
    promptVersion: GPT_SOURCING_PROMPT_VERSION,
    target,
    status: state.status,
    state: buildAgentContext(state),
    v4Decision,
    gpt,
  });
}
