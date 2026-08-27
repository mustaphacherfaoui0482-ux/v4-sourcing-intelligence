# CHECKPOINT — GPT SOURCING × V4 POC

Date: 2026-08-27
Version: GPT Sourcing Agent 0.1.0

## TARGET
Connect GPT to V4 as a sourcing orchestrator without rebuilding V4 or creating a second business-decision engine.

## IMPLEMENTED
- `modules/gpt-sourcing-agent.js`: provider-agnostic bounded state machine.
- `api/gpt-sourcing.js`: Vercel-compatible HTTP endpoint with OpenAI Responses API integration and deterministic V4 decision evaluation.
- `tests/gpt-sourcing-agent.test.mjs`: anti-loop, step-budget, state and output validation tests.

## GUARANTEES IN POC
- V4 remains authoritative for deterministic opportunity decisions.
- Potential and Confidence remain distinct.
- No second global score is calculated by the agent layer.
- Closed GAPs are not reopened without new evidence.
- Maximum agent-step budget is 8.
- Explicit STOP states exist for loop detection and step exhaustion.
- Missing OpenAI credentials do not fake a GPT result; endpoint returns `NOT_CONFIGURED`.

## LIMITATIONS
- This is a POC, not yet a complete autonomous sourcing agent.
- External source-search tools are not yet exposed to GPT.
- Persistent workflow storage is not yet implemented.
- OpenAI API execution requires `OPENAI_API_KEY` and an explicit `OPENAI_MODEL` environment variable.
- Repository CI execution has not yet been observed from this session.

## TEST EVIDENCE
The six new state-machine tests were reproduced locally with Node.js and all passed. Repository-wide CI has NOT been claimed as passed.

## NEXT GAP
Expose the first real sourcing/search tool to the GPT orchestrator, then test one complete product workflow end-to-end.
