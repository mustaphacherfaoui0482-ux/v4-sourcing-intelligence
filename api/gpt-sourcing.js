import { evaluateOpportunity } from '../modules/decision-engine.js';
import { buildAlibabaOpportunity } from '../modules/alibaba-opportunity.js';
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
import { listSourcingSources, resolveSource } from '../modules/sourcing-source-registry.js';
import { fetchAlibabaThroughPiloterr } from './alibaba-piloterr.js';

const OUTPUT_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    decision: { type: 'string', enum: ['TESTER', 'APPROFONDIR', 'ATTENDRE', 'EVITER', 'STOP'] },
    reason: { type: 'string' }, nextAction: { type: 'string' }, evidenceStatus: { type: 'string' }, gap: { type: ['string', 'null'] },
  }, required: ['decision', 'reason', 'nextAction', 'evidenceStatus', 'gap'],
};

export const SOURCING_TOOLS = Object.freeze([
  { type: 'function', name: 'list_sources', description: 'List sourcing source adapters available to V4. A source can be optional or unavailable; never infer data from an unavailable source.', parameters: { type: 'object', properties: {}, required: [], additionalProperties: false }, strict: true },
  { type: 'function', name: 'search_source', description: 'Search one configured sourcing source. Returns only observed candidates and source/acquisition status. Missing fields remain unknown.', parameters: { type: 'object', properties: { source: { type: 'string' }, query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 10 } }, required: ['source', 'query', 'limit'], additionalProperties: false }, strict: true },
  { type: 'function', name: 'inspect_source_product', description: 'Inspect one product URL through its registered source adapter. Return only observed fields and extraction status.', parameters: { type: 'object', properties: { source: { type: 'string' }, url: { type: 'string' } }, required: ['source', 'url'], additionalProperties: false }, strict: true },
]);

const TERMINAL_DECISIONS = new Set(['TESTER', 'EVITER']);
const V4_NON_TERMINAL_ALLOWED = { APPROFONDIR: new Set(['APPROFONDIR', 'ATTENDRE', 'STOP']), ATTENDRE: new Set(['APPROFONDIR', 'ATTENDRE', 'STOP']) };
function json(res, status, body) { res.status(status).json(body); }
export function runV4Decision(candidate) { return evaluateOpportunity(candidate ?? {}); }
export function isTerminalDecision(decision) { return TERMINAL_DECISIONS.has(decision); }
export function isGptDecisionAllowed(v4Decision, gptDecision) { if (!v4Decision) return true; if (isTerminalDecision(v4Decision.decision)) return false; const allowed = V4_NON_TERMINAL_ALLOWED[v4Decision.decision]; return allowed ? allowed.has(gptDecision) : gptDecision === 'STOP'; }
function extractResponseText(payload) { if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text; for (const item of Array.isArray(payload?.output) ? payload.output : []) for (const part of Array.isArray(item?.content) ? item.content : []) if (typeof part?.text === 'string' && part.text.trim()) return part.text; return null; }
async function callSourceEndpoint(req, sourceId, url) {
  const source = resolveSource(sourceId);
  if (source.status !== 'AVAILABLE') return { ok: false, status: source.status, sourceId };
  if (source.adapter !== 'alibaba-import') return { ok: false, status: 'UNSUPPORTED_ADAPTER', sourceId };
  try {
    const payload = await fetchAlibabaThroughPiloterr(url, { search: false });
    return {
      ok: true,
      status: payload.extracted?.parserStatus || 'EXTRACTED',
      sourceUrl: payload.targetUrl || url,
      acquisition: payload.acquisition || 'PILOTERR_BROWSER_API',
      acquisitionUrl: payload.acquisitionUrl || 'https://api.piloterr.com/v2/alibaba/product',
      extractionStatus: payload.extracted?.parserStatus || 'PARTIAL_OR_COMPLETE',
      evidenceStatus: 'EXTRACTED',
      extracted: payload.extracted || null,
      providerConfigured: true,
      error: null,
      providerError: null,
      directError: null,
      readerDiagnostics: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'piloterr_failed';
    return { ok: false, status: 'TOOL_ERROR', sourceUrl: url, error: message, providerError: message, directError: null, providerConfigured: true };
  }
}
export async function executeSourcingTool(name, args, req) {
  if (name === 'list_sources') return { ok: true, sources: listSourcingSources() };
  if (name === 'search_source') {
    const source = String(args?.source || '').trim().toLowerCase(); const query = typeof args?.query === 'string' ? args.query.trim() : ''; const limit = Number.isInteger(args?.limit) ? Math.min(Math.max(args.limit, 1), 10) : 5;
    if (!source) return { ok: false, status: 'INVALID_ARGUMENT', error: 'source_required' }; if (!query) return { ok: false, status: 'INVALID_ARGUMENT', error: 'query_required' }; const sourceState = resolveSource(source); if (sourceState.status !== 'AVAILABLE') return sourceState; if (source !== 'alibaba') return { ok: false, status: 'UNSUPPORTED_ADAPTER', sourceId: source };
    const searchUrl = `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(query)}`;
    try {
      const payload = await fetchAlibabaThroughPiloterr(searchUrl, { search: true });
      const candidates = Array.isArray(payload.extracted?.candidates) ? payload.extracted.candidates.slice(0, limit) : [];
      return { ok: candidates.length > 0, source, status: candidates.length ? 'CANDIDATES_FOUND' : 'EMPTY', sourceUrl: searchUrl, evidenceStatus: candidates.length ? 'CANDIDATES_ONLY' : 'INSUFFICIENT', productCandidates: candidates, acquisition: payload.acquisition || 'PILOTERR_SEARCH_API', providerConfigured: true, error: null, directError: null, providerError: null };
    } catch (error) {
      return { ok: false, source, status: 'TOOL_ERROR', sourceUrl: searchUrl, evidenceStatus: 'INSUFFICIENT', productCandidates: [], acquisition: 'PILOTERR_SEARCH_API', providerConfigured: true, error: error instanceof Error ? error.message : 'piloterr_failed', providerError: error instanceof Error ? error.message : 'piloterr_failed', directError: null };
    }
  }
  if (name === 'inspect_source_product') {
    const source = String(args?.source || '').trim().toLowerCase(); const url = typeof args?.url === 'string' ? args.url.trim() : ''; if (!source) return { ok: false, status: 'INVALID_ARGUMENT', error: 'source_required' }; if (!url) return { ok: false, status: 'INVALID_ARGUMENT', error: 'url_required' }; const sourceState = resolveSource(source); if (sourceState.status !== 'AVAILABLE') return sourceState; if (source !== 'alibaba' || !/^https:\/\/(?:[^/]+\.)?alibaba\.com\//i.test(url)) return { ok: false, status: 'INVALID_ARGUMENT', error: 'unsupported_source_url' }; const payload = await callSourceEndpoint(req, source, url); const extracted = payload.extracted || null; const opportunity = payload.ok ? buildAlibabaOpportunity(extracted || {}) : null; const v4Decision = opportunity ? runV4Decision(opportunity) : null; return { ok: Boolean(payload.ok), source, status: payload.extractionStatus || payload.status || 'UNKNOWN', sourceUrl: payload.sourceUrl || url, acquisition: payload.acquisition || null, acquisitionUrl: payload.acquisitionUrl || url, extractionStatus: payload.extractionStatus || 'UNKNOWN', evidenceStatus: payload.evidenceStatus || 'UNKNOWN', extracted: extracted || { product: null, displayedPrice: null, moq: null, supplier: null, supplierCountry: null }, opportunity, v4Decision, error: payload.error || null, directError: payload.directError || null, providerError: payload.providerError || null, providerConfigured: payload.providerConfigured ?? null, readerDiagnostics: payload.readerDiagnostics || null };
  }
  throw new Error(`Unknown sourcing tool: ${name}`);
}
async function callOpenAI({ target, candidate, state, model, req }) { const apiKey = process.env.OPENAI_API_KEY; const selectedModel = model || process.env.OPENAI_MODEL; if (!apiKey || !selectedModel) return { status: 'NOT_CONFIGURED', reason: !apiKey ? 'OPENAI_API_KEY missing' : 'OPENAI_MODEL missing', promptVersion: GPT_SOURCING_PROMPT_VERSION, state: buildAgentContext(state) }; const input = [{ role: 'user', content: JSON.stringify({ target, candidate, v4State: buildAgentContext(state) }) }]; let lastResponse = null; const toolTrace = []; for (let iteration = 0; iteration < 8; iteration += 1) { const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: selectedModel, instructions: GPT_SOURCING_SYSTEM_PROMPT, input, tools: SOURCING_TOOLS, text: { format: { type: 'json_schema', name: 'v4_sourcing_decision', strict: true, schema: OUTPUT_SCHEMA } } }) }); const payload = await response.json(); if (!response.ok) return { status: 'OPENAI_ERROR', error: payload?.error?.message || `OpenAI HTTP ${response.status}`, httpStatus: response.status, toolTrace }; lastResponse = payload; const output = Array.isArray(payload?.output) ? payload.output : []; input.push(...output); const functionCalls = output.filter((item) => item?.type === 'function_call'); if (!functionCalls.length) { const outputText = extractResponseText(payload); if (!outputText) return { status: 'OPENAI_EMPTY', responseId: payload?.id, toolTrace }; let parsed; try { parsed = JSON.parse(outputText); } catch { return { status: 'OPENAI_INVALID_JSON', raw: outputText, responseId: payload?.id, toolTrace }; } try { const outputDecision = validateAgentOutput(parsed); return { status: 'OK', output: outputDecision, responseId: payload?.id, promptVersion: GPT_SOURCING_PROMPT_VERSION, toolTrace }; } catch (error) { return { status: 'OPENAI_INVALID_OUTPUT', error: error.message, responseId: payload?.id, toolTrace }; } } for (const toolCall of functionCalls) { if (state.status !== 'RUNNING') break; let args; try { args = JSON.parse(toolCall.arguments || '{}'); } catch { stopState(state, 'INVALID_TOOL_ARGUMENTS', { tool: toolCall.name }); return { status: 'OPENAI_INVALID_TOOL_ARGUMENTS', responseId: payload?.id, toolTrace }; } recordAction(state, `TOOL:${toolCall.name}`); if (state.status !== 'RUNNING') break; let result; try { result = await executeSourcingTool(toolCall.name, args, req); } catch (error) { result = { ok: false, status: 'TOOL_ERROR', error: error instanceof Error ? error.message : 'tool_failed' }; } toolTrace.push({ name: toolCall.name, arguments: args, result }); input.push({ type: 'function_call_output', call_id: toolCall.call_id, output: JSON.stringify(result) }); if (result?.v4Decision) { state.lastResult = { type: 'V4_DECISION', value: result.v4Decision }; if (isTerminalDecision(result.v4Decision.decision)) { stopState(state, 'V4_DECISION_REACHED', result.v4Decision); } else if (result.v4Decision.decision === 'ATTENDRE') { stopState(state, 'V4_DECISION_WAITING_FOR_EVIDENCE', result.v4Decision); } } } if (state.status !== 'RUNNING') return { status: 'AGENT_STOPPED', reason: state.lastResult?.value?.reason || state.lastResult?.reason || 'V4_DECISION_REACHED', responseId: lastResponse?.id, toolTrace }; } stopState(state, 'MAX_TOOL_ITERATIONS', { max: 8 }); return { status: 'AGENT_STOPPED', reason: 'MAX_TOOL_ITERATIONS', responseId: lastResponse?.id, toolTrace }; }
export default async function handler(req, res) { if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' }); const body = req.body || {}; const target = typeof body.target === 'string' ? body.target.trim() : ''; if (!target) return json(res, 400, { error: 'target is required' }); const state = createSourcingState({ target, actual: body.candidate ?? null }); recordAction(state, 'INIT'); let v4Decision = null; if (body.candidate && typeof body.candidate === 'object') { v4Decision = runV4Decision(body.candidate); state.lastResult = { type: 'V4_DECISION', value: v4Decision }; if (isTerminalDecision(v4Decision.decision)) { stopState(state, 'V4_DECISION_REACHED', v4Decision); return json(res, 200, { version: state.version, target, status: state.status, state: buildAgentContext(state), v4Decision, gpt: { status: 'SKIPPED_V4_TERMINAL_DECISION' } }); } if (v4Decision.decision === 'ATTENDRE') { stopState(state, 'V4_DECISION_WAITING_FOR_EVIDENCE', v4Decision); return json(res, 200, { version: state.version, target, status: state.status, state: buildAgentContext(state), v4Decision, gpt: { status: 'SKIPPED_V4_WAITING_FOR_EVIDENCE' } }); } } const gpt = await callOpenAI({ target, candidate: body.candidate ?? null, state, model: body.model, req }); if (gpt.status === 'OK') { if (!isGptDecisionAllowed(v4Decision, gpt.output.decision)) { stopState(state, 'GPT_DECISION_CONFLICT_WITH_V4', { v4Decision: v4Decision?.decision ?? null, gptDecision: gpt.output.decision }); gpt.status = 'REJECTED_V4_AUTHORITY'; } else if (gpt.output.decision === 'STOP') stopState(state, 'GPT_STOP', gpt.output); else { recordAction(state, `GPT:${gpt.output.nextAction}`); state.lastResult = { type: 'GPT_DECISION', value: gpt.output }; state.nextAllowedAction = gpt.output.nextAction; } } else if (gpt.status !== 'AGENT_STOPPED') { stopState(state, gpt.reason || gpt.error || gpt.status, gpt); } return json(res, 200, { version: state.version, promptVersion: GPT_SOURCING_PROMPT_VERSION, target, status: state.status, state: buildAgentContext(state), v4Decision, gpt }); }