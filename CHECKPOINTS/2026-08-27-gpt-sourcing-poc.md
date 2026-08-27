# CHECKPOINT — GPT SOURCING × V4 POC

Date: 2026-08-27
Version: GPT Sourcing Agent 1.2.0

## TARGET
Connect GPT to V4 as a sourcing orchestrator without rebuilding V4 or creating a second business-decision engine.

## IMPLEMENTED
- `modules/gpt-sourcing-agent.js`: provider-agnostic bounded state machine.
- `api/gpt-sourcing.js`: Vercel-compatible HTTP endpoint with OpenAI Responses API integration, deterministic V4 decision evaluation and function-tool orchestration.
- `modules/gpt-sourcing-prompt.js`: tool-aware sourcing prompt v1.2.0.
- `tests/gpt-sourcing-agent.test.mjs`: anti-loop, step-budget, state and output validation tests.
- `tests/gpt-sourcing-tools.test.mjs`: strict Alibaba search and inspection tool contract tests.
- `search_alibaba`: bounded Alibaba candidate search.
- `inspect_alibaba_product`: bounded inspection of a selected Alibaba product URL through the existing V4 acquisition/extraction pipeline.

## GUARANTEES IN POC
- V4 remains authoritative for deterministic opportunity decisions.
- Potential and Confidence remain distinct.
- No second global score is calculated by the agent layer.
- Closed GAPs are not reopened without new evidence.
- Maximum agent-step budget is 8.
- Explicit STOP states exist for loop detection and step exhaustion.
- Missing OpenAI credentials do not fake a GPT result; endpoint returns `NOT_CONFIGURED`.
- Alibaba tool output is treated as observation/evidence input; missing fields remain UNKNOWN/NULL.
- Search is bounded to Alibaba and candidate URLs are limited to at most 10.
- Product inspection accepts only Alibaba HTTPS URLs before acquisition.

## TEST EVIDENCE
- Latest Vercel deployment for the tool/prompt stage is READY.
- Latest Vercel build observed 100 tests passing and 0 failing.
- The previous inspection-tool deployment failure was isolated to a stale test expectation (`2 !== 1`) and was corrected; the next build passed.
- The dashboard production page responds HTTP 200 on the latest deployment.
- The current session has not executed a live GPT POST workflow because an authenticated POST invocation of the protected deployment is not available through the connected Vercel fetch interface.
- Repository-wide GitHub Actions CI execution is still not observed from this session.

## CURRENT GAP
Obtain live end-to-end evidence: GPT → `search_alibaba` → `inspect_alibaba_product` → observed candidate data → V4 decision authority.

## NEXT ACTION
Execute a bounded live workflow when authenticated POST execution and OpenAI credentials are available. Do not treat the POC as end-to-end validated until that observation exists.
